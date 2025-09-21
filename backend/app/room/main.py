# server/main.py
import os
import uuid
import aiohttp
import socketio
from fastapi import FastAPI
from fastapi.responses import JSONResponse, FileResponse
from pathlib import Path
from typing import Dict, Any
from datetime import datetime

UPLOAD_DIR = Path(__file__).parent / "tmp"
UPLOAD_DIR.mkdir(parents=True, exist_ok=True)

FASTAPI_BASE = os.getenv("FASTAPI_BASE", "http://localhost:8000")  # transcription server

app = FastAPI()
sio = socketio.AsyncServer(async_mode="asgi", cors_allowed_origins="*")
socket_app = socketio.ASGIApp(sio, other_asgi_app=app)

# in-memory storage
rooms: Dict[str, Dict[str, Any]] = {}

# ------------------- SOCKET.IO ------------------- #
@sio.event
async def connect(sid, environ):
    print("socket connected", sid)

@sio.event
async def disconnect(sid):
    print("socket disconnected", sid)

@sio.on("join")
async def handle_join(sid, data):
    roomId, userId, userName = data["roomId"], data["userId"], data["userName"]
    await sio.enter_room(sid, roomId)

    if roomId not in rooms:
        rooms[roomId] = {"segments": [], "speakersMap": {}, "participants": {}}

    rooms[roomId]["participants"][userId] = {
        "userId": userId,
        "userName": userName,
        "joinedAt": datetime.utcnow().isoformat(),
    }

    if userId not in rooms[roomId]["speakersMap"]:
        idx = len(rooms[roomId]["speakersMap"]) + 1
        rooms[roomId]["speakersMap"][userId] = f"Speaker {idx}"

    await sio.emit("participants", rooms[roomId]["participants"], room=roomId)
    await sio.emit(
        "participant_joined",
        {"userId": userId, "userName": userName},
        room=roomId,
    )
    print(f"{userName} joined {roomId}")

@sio.on("leave")
async def handle_leave(sid, data):
    roomId, userId = data["roomId"], data["userId"]
    await sio.leave_room(sid, roomId)

    if roomId in rooms and userId in rooms[roomId]["participants"]:
        del rooms[roomId]["participants"][userId]
        await sio.emit("participants", rooms[roomId]["participants"], room=roomId)
        await sio.emit("participant_left", {"userId": userId}, room=roomId)

@sio.on("audio_blob")
async def handle_audio_blob(sid, metadata, arrayBuffer):
    try:
        roomId, userId, userName = (
            metadata["roomId"],
            metadata["userId"],
            metadata["userName"],
        )
        filename = metadata["filename"]
        doDenoise = metadata.get("doDenoise", False)

        # save tmp file
        if roomId not in rooms:
            rooms[roomId] = {"segments": [], "speakersMap": {}, "participants": {}}
        if userId not in rooms[roomId]["speakersMap"]:
            idx = len(rooms[roomId]["speakersMap"]) + 1
            rooms[roomId]["speakersMap"][userId] = f"Speaker {idx}"

        speakerLabel = rooms[roomId]["speakersMap"][userId]

        uid = str(uuid.uuid4())
        tmp_path = UPLOAD_DIR / f"{uid}_{filename}"
        with open(tmp_path, "wb") as f:
            f.write(arrayBuffer)

        # send to transcription service
        async with aiohttp.ClientSession() as session:
            with open(tmp_path, "rb") as f:
                form = aiohttp.FormData()
                form.add_field("audio", f, filename=filename)
                form.add_field("do_denoise", str(doDenoise).lower())
                form.add_field("do_diarize", "false")

                async with session.post(
                    f"{FASTAPI_BASE}/api/transcribe_text", data=form, timeout=120
                ) as resp:
                    if resp.status != 200:
                        print("Transcribe error:", await resp.text())
                        return
                    data = await resp.json(content_type=None)

        returnedSegments = data.get("segments", [])
        for seg in returnedSegments:
            s = {
                "speaker": speakerLabel,
                "userId": userId,
                "userName": userName,
                "start": seg.get("start", 0),
                "end": seg.get("end", 0),
                "text": seg.get("text", seg.get("whisper_text", "")),
                "timestamp": datetime.utcnow().isoformat(),
            }
            rooms[roomId]["segments"].append(s)
            await sio.emit(
                "new_transcript",
                {
                    "userId": userId,
                    "userName": userName,
                    "speakerLabel": speakerLabel,
                    "text": s["text"],
                    "start": s["start"],
                    "end": s["end"],
                    "timestamp": s["timestamp"],
                },
                room=roomId,
            )

        tmp_path.unlink(missing_ok=True)

    except Exception as e:
        print("Error handling audio_blob:", e)

# ------------------- HTTP ------------------- #
@app.get("/rooms/{roomId}/download")
async def download_docx(roomId: str):
    if roomId not in rooms or not rooms[roomId]["segments"]:
        return JSONResponse(status_code=404, content={"error": "No segments for this room"})

    try:
        async with aiohttp.ClientSession() as session:
            async with session.post(
                f"{FASTAPI_BASE}/api/make_docx",
                json={"segments": rooms[roomId]["segments"]},
                timeout=120,
            ) as resp:
                if resp.status != 200:
                    print("make_docx error:", await resp.text())
                    return JSONResponse(status_code=500, content={"error": "Failed to build DOCX"})
                file_bytes = await resp.read()

        tmp_file = UPLOAD_DIR / f"{roomId}_conversation.docx"
        with open(tmp_file, "wb") as f:
            f.write(file_bytes)

        return FileResponse(
            tmp_file,
            media_type="application/vnd.openxmlformats-officedocument.wordprocessingml.document",
            filename="room_conversation.docx",
        )
    except Exception as e:
        print("make_docx failed:", e)
        return JSONResponse(status_code=500, content={"error": "Failed to build DOCX"})
