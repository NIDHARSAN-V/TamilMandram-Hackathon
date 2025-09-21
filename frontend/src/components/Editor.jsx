// frontend/src/components/Editor.jsx

import React, { useState } from 'react';
import ReactQuill from 'react-quill-new'; // Use the new fork
import 'react-quill-new/dist/quill.snow.css'; // Import the Snow theme
import { postMakeDocx } from '../api';

export default function Editor({ segments, onBack }) {
  const [edited, setEdited] = useState(segments.map((s) => ({ ...s })));
  const [loading, setLoading] = useState(false);

  // Update text for a segment
  const updateText = (idx, value) => {
    const copy = [...edited];
    copy[idx].text = value;
    setEdited(copy);
  };

  // Export the edited segments as DOCX
  const exportDocx = async () => {
    setLoading(true);
    try {
      const payload = { segments: edited };
      const res = await postMakeDocx(payload);

      const blob = new Blob([res.data], {
        type:
          res.headers['content-type'] ||
          'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'tamil_transcription.docx';
      a.click();
      window.URL.revokeObjectURL(url);
    } catch (err) {
      console.error(err);
      alert('Failed to create DOCX. Check console for details.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ padding: 20 }}>
      <button onClick={onBack} style={{ marginBottom: 20 }}>
        ← Back
      </button>

      <h3>Edit Transcription</h3>

      <div>
        {edited.map((seg, idx) => (
          <div
            key={idx}
            style={{
              marginBottom: 18,
              padding: 12,
              border: '1px solid #ddd',
              borderRadius: 6,
            }}
          >
            <div style={{ fontWeight: 'bold' }}>
              {seg.speaker} [{seg.start.toFixed(2)}s - {seg.end.toFixed(2)}s]
            </div>

            <div style={{ marginTop: 8 }}>
              <ReactQuill
                theme="snow"
                value={seg.text}
                onChange={(val) => updateText(idx, val)}
              />
            </div>
          </div>
        ))}
      </div>

      <div style={{ marginTop: 10 }}>
        <button onClick={exportDocx} disabled={loading}>
          {loading ? 'Generating...' : 'Download .docx'}
        </button>
      </div>
    </div>
  );
}
