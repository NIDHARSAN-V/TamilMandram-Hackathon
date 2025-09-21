# transcription_service.py
import os
import uuid
from pathlib import Path
from fastapi import FastAPI, UploadFile, File, Form, HTTPException
from fastapi.responses import FileResponse, JSONResponse
from fastapi.middleware.cors import CORSMiddleware
from typing import Optional
import whisper
from transcribe_utils import ensure_dir, normalize_to_wav, reduce_noise
from docx_utils import build_docx_from_segments

UPLOAD_DIR = "/tmp/tamil_transcribe"
ensure_dir(UPLOAD_DIR)

app = FastAPI(title="Tamil Audio→Docx Transcriber")
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"]
)

# Load Whisper model
MODEL_NAME = os.getenv("WHISPER_MODEL", "medium")
model = whisper.load_model(MODEL_NAME)

@app.post("/api/transcribe_text")
async def transcribe_text(
    audio: UploadFile = File(...),
    do_denoise: Optional[bool] = Form(True),
    do_diarize: Optional[bool] = Form(False)
):
    uid = str(uuid.uuid4())
    raw_ext = Path(audio.filename).suffix or ".webm"
    raw_path = f"{UPLOAD_DIR}/{uid}_raw{raw_ext}"
    with open(raw_path, "wb") as f:
        f.write(await audio.read())

    wav_path = f"{UPLOAD_DIR}/{uid}.wav"
    normalize_to_wav(raw_path, wav_path, target_sr=16000)

    processed = wav_path
    if do_denoise:
        denoised = f"{UPLOAD_DIR}/{uid}_denoised.wav"
        try:
            reduce_noise(wav_path, denoised)
            processed = denoised
        except Exception:
            processed = wav_path

    result = model.transcribe(processed, language="ta")
    segments = result.get("segments", [])

    # simple speaker merge
    merged = []
    for idx, seg in enumerate(segments):
        merged.append({
            "speaker": f"பேச்சாளர் {idx+1}",
            "start": seg.get("start",0),
            "end": seg.get("end",0),
            "text": seg.get("text","")
        })
    return JSONResponse({"segments": merged})

@app.post("/api/make_docx")
async def make_docx(segments: dict = None):
    if not segments or "segments" not in segments:
        raise HTTPException(status_code=400, detail="Missing 'segments'")
    uid = str(uuid.uuid4())
    doc_path = f"{UPLOAD_DIR}/{uid}.docx"
    build_docx_from_segments(segments["segments"], doc_path, include_timestamps=True)
    return FileResponse(doc_path, media_type="application/vnd.openxmlformats-officedocument.wordprocessingml.document", filename="tamil_transcription.docx")
