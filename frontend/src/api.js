import axios from "axios";

const API_BASE = "http://localhost:8001";

export async function postTranscribeForm(formData, onUploadProgress) {
  return axios.post(`${API_BASE}/api/transcribe_text`, formData, {
    headers: { "Content-Type": "multipart/form-data" },
    onUploadProgress,
  });
}

export async function postMakeDocx(segments) {
  return axios.post(`${API_BASE}/api/make_docx`, segments, {
    responseType: "blob",
    headers: { "Content-Type": "application/json" },
  });
}
