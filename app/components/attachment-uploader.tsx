"use client";

import React from "react";

type Props = {
  action: string; // endpoint to POST
  method?: 'multipart';
  fieldName?: string; // default 'files'
  extraFields?: Record<string, string>;
  buttonLabel?: string;
  multiple?: boolean;
  onUploaded?: (result: any) => void;
  onError?: (message: string) => void;
  accept?: string; // input accept attribute
  maxCount?: number; // maximum files per selection
  maxTotalBytes?: number; // maximum total size per selection
};

export default function AttachmentUploader({ action, method = 'multipart', fieldName = 'files', extraFields = {}, buttonLabel = 'Attach files', multiple = true, onUploaded, onError, accept = 'image/*,application/pdf', maxCount, maxTotalBytes }: Props) {
  const [busy, setBusy] = React.useState(false);
  const [selected, setSelected] = React.useState<File[]>([]);
  const inputRef = React.useRef<HTMLInputElement | null>(null);

  async function doUpload() {
    if (method !== 'multipart') return;
    if (selected.length === 0) return;
    setBusy(true);
    try {
      const form = new FormData();
      for (const [k, v] of Object.entries(extraFields)) form.append(k, v);
      for (const f of selected) form.append(fieldName, f);
      const res = await fetch(action, { method: 'POST', body: form });
      const j = await res.json().catch(()=>({ ok:false }));
      if (onUploaded) onUploaded(j);
      setSelected([]);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div style={{ display:'flex', alignItems:'center', gap:8, flexWrap:'wrap' }}>
      <input
        ref={inputRef}
        type="file"
        multiple={multiple}
        accept={accept}
        style={{ display:'none' }}
        onChange={(e)=>{
          let fs = e.target.files ? Array.from(e.target.files) : [];
          // Enforce limits if provided
          if (maxCount && fs.length > maxCount) {
            if (onError) onError(`You can select up to ${maxCount} file(s) at a time.`);
            fs = fs.slice(0, maxCount);
          }
          if (maxTotalBytes) {
            const total = fs.reduce((s, f) => s + f.size, 0);
            if (total > maxTotalBytes) {
              if (onError) onError(`Total selected size exceeds limit (${Math.round(maxTotalBytes/1024/1024)} MB).`);
              // keep adding until limit reached
              const kept: File[] = [];
              let acc = 0;
              for (const f of fs) { if (acc + f.size <= maxTotalBytes) { kept.push(f); acc += f.size; } }
              fs = kept;
            }
          }
          setSelected(fs);
          e.currentTarget.value = '';
        }}
      />
      <button onClick={()=> inputRef.current?.click()} disabled={busy} style={{ padding:'6px 10px', background:'#111827', color:'#fff', border:'none', borderRadius:6, fontWeight:700 }}>{buttonLabel}</button>
      {selected.length>0 && (
        <>
          <span style={{ fontSize:12, color:'#475569' }}>{selected.length} file(s) selected</span>
          <button onClick={doUpload} disabled={busy} style={{ padding:'6px 10px', background:'#2563eb', color:'#fff', border:'none', borderRadius:6, fontWeight:700 }}>{busy? 'Uploading...' : 'Upload'}</button>
          <button onClick={()=> setSelected([])} disabled={busy} style={{ padding:'6px 10px', background:'#e5e7eb', border:'1px solid #cbd5e1', borderRadius:6 }}>Clear</button>
        </>
      )}
    </div>
  );
}
