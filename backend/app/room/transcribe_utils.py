import os
from pathlib import Path
from pydub import AudioSegment
import soundfile as sf
import numpy as np
import noisereduce as nr

def ensure_dir(path):
    Path(path).mkdir(parents=True, exist_ok=True)

def normalize_to_wav(in_path: str, out_path: str, target_sr: int = 16000):
    """
    Convert audio file to mono WAV at target_sr using pydub.
    """
    audio = AudioSegment.from_file(in_path)
    audio = audio.set_frame_rate(target_sr).set_channels(1)
    audio.export(out_path, format="wav")
    return out_path

def reduce_noise(wav_path: str, out_path: str):
    """
    Basic noise reduction using noisereduce.
    """
    data, rate = sf.read(wav_path)
    if len(data.shape) > 1:
        data = np.mean(data, axis=1)
    # use first 0.5s as noise profile (if long enough)
    sample_len = int(0.5 * rate)
    noise = data[:sample_len] if len(data) > sample_len else data[:int(0.1*rate)]
    reduced = nr.reduce_noise(y=data, sr=rate, y_noise=noise, verbose=False)
    sf.write(out_path, reduced, rate)
    return out_path
