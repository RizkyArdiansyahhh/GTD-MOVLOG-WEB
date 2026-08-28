import React, { useRef } from 'react';
import { FileText, Upload, X } from 'lucide-react';
import type { PdfFile } from '../types/SubmitBerkas';

interface PdfUploadCardProps {
  file: PdfFile | null;
  onFileSelect: (file: PdfFile) => void;
  onRemove: () => void;
  error?: string;
}

function formatBytes(bytes: number) {
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export function PdfUploadCard({ file, onFileSelect, onRemove, error }: PdfUploadCardProps) {
  const inputRef = useRef<HTMLInputElement>(null);

  const handleFiles = (fileList: FileList | null) => {
    const selected = fileList?.[0];
    if (!selected) return;
    if (selected.type !== 'application/pdf') return;
    onFileSelect({
      name: selected.name,
      sizeLabel: formatBytes(selected.size),
      url: URL.createObjectURL(selected),
    });
  };

  return (
    <FormSectionShell>
      {!file ? (
        <div
          onDragOver={(e) => e.preventDefault()}
          onDrop={(e) => {
            e.preventDefault();
            handleFiles(e.dataTransfer.files);
          }}
          style={{
            border: '1.5px dashed #E2E8F0',
            borderRadius: 10,
            padding: '32px 16px',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: 10,
            background: '#FAFBFC',
          }}
        >
          <Upload size={26} color="#B7791F" />
          <p style={{ fontSize: 13, fontWeight: 600, color: '#06283A', margin: 0 }}>Upload PDF</p>
          <p style={{ fontSize: 12, color: '#94A3B8', margin: 0 }}>Drag & drop atau pilih file</p>
          <button
            type="button"
            onClick={() => inputRef.current?.click()}
            style={{
              marginTop: 6,
              padding: '8px 18px',
              borderRadius: 8,
              border: '1px solid #E2E8F0',
              background: '#fff',
              color: '#06283A',
              fontSize: 12,
              fontWeight: 600,
              cursor: 'pointer',
            }}
          >
            Pilih File
          </button>
          <p style={{ fontSize: 11, color: '#CBD5E0', margin: 0 }}>Format: PDF</p>
          <input
            ref={inputRef}
            type="file"
            accept="application/pdf"
            onChange={(e) => handleFiles(e.target.files)}
            style={{ display: 'none' }}
          />
        </div>
      ) : (
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            border: '1px solid #E2E8F0',
            borderRadius: 10,
            padding: '12px 16px',
            background: '#F8FAFB',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <span
              style={{
                width: 36,
                height: 36,
                borderRadius: 8,
                background: '#DCFCE7',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <FileText size={17} color="#15803D" />
            </span>
            <div>
              <p style={{ fontSize: 13, fontWeight: 600, color: '#06283A', margin: 0 }}>{file.name}</p>
              <p style={{ fontSize: 11, color: '#94A3B8', margin: 0 }}>{file.sizeLabel}</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onRemove}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 4,
              padding: '6px 12px',
              borderRadius: 7,
              border: '1px solid #FCA5A5',
              background: '#fff',
              color: '#DC2626',
              fontSize: 12,
              fontWeight: 500,
              cursor: 'pointer',
            }}
          >
            <X size={13} />
            Hapus
          </button>
        </div>
      )}
      {error && <p style={{ fontSize: 11, color: '#DC2626', marginTop: 8 }}>{error}</p>}
    </FormSectionShell>
  );
}

function FormSectionShell({ children }: { children: React.ReactNode }) {
  return (
    <div style={{ background: '#fff', borderRadius: 12, border: '1px solid #E5E7EB', padding: 20 }}>
      <p style={{ fontFamily: 'Poppins, sans-serif', fontWeight: 600, fontSize: 15, color: '#06283A', margin: 0, marginBottom: 16 }}>
        Upload Dokumen
      </p>
      {children}
    </div>
  );
}