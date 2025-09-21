@echo off
echo Starting main app on port 8001...
start cmd /k "python -m uvicorn main:app --host 0.0.0.0 --port 8001 --reload"

echo Starting socket app on port 4000...
start cmd /k "cd room && python -m uvicorn main:socket_app --host 0.0.0.0 --port 4000 --reload"

echo Starting transcription service on port 8000...
start cmd /k "cd room && python -m uvicorn transcription_service:app --host 0.0.0.0 --port 8000 --reload"

echo All servers started!
pause
