# app/app.py
import subprocess
import sys
import os
import signal

# Paths to your app modules
APPS = [
    ("main:app", 8001),  # main.py -> app
    ("room.main:socket_app", 4000),  # room/main.py -> socket_app
    ("room.transcription_service:app", 8000),  # room/transcription_service.py -> app
]

processes = []

try:
    for module, port in APPS:
        print(f"Starting {module} on port {port}...")
        # Run uvicorn in a subprocess
        proc = subprocess.Popen(
            [sys.executable, "-m", "uvicorn", module, "--host", "0.0.0.0", "--port", str(port), "--reload"],
            stdout=subprocess.PIPE,
            stderr=subprocess.PIPE
        )
        processes.append(proc)

    # Wait for all processes
    for proc in processes:
        proc.wait()

except KeyboardInterrupt:
    print("Shutting down all servers...")
    for proc in processes:
        proc.send_signal(signal.SIGINT)
