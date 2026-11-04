'use client';
import React, { createContext, useContext, useCallback, useEffect, useRef, useState } from 'react';

// ── Types ─────────────────────────────────────────────────────────────────────

export type UploadPhase = 'idle' | 'uploading' | 'clipping' | 'done' | 'error';

export interface UploadStartOptions {
  category: string;
  prompt: string;
  numClips: number;
  duration_seconds?: number;
  source_name?: string;
}

export interface UploadContextValue {
  phase: UploadPhase;
  fileName: string;
  uploadProgress: number;  // 0-100
  jobId: string | null;
  clips: any[];
  error: string | null;
  startUpload: (file: File, options: UploadStartOptions) => Promise<void>;
  resumePolling: (jobId: string) => void;
  dismiss: () => void;
}

// ── Constants ─────────────────────────────────────────────────────────────────

const PART_SIZE         = 20 * 1024 * 1024;   // 20 MB per part
const MULTIPART_MIN     = 100 * 1024 * 1024;  // use multipart above 100 MB
const POLL_MS           = 5_000;
const POLL_TIMEOUT_MS   = 10 * 60 * 1000;

// ── Context ───────────────────────────────────────────────────────────────────

const UploadContext = createContext<UploadContextValue | null>(null);

const NO_OP_CONTEXT: UploadContextValue = {
  phase: 'idle', fileName: '', uploadProgress: 0, jobId: null, clips: [], error: null,
  startUpload: async () => {},
  resumePolling: () => {},
  dismiss: () => {},
};

export function useUploadContext(): UploadContextValue {
  const ctx = useContext(UploadContext);
  return ctx ?? NO_OP_CONTEXT;
}

// ── Provider ──────────────────────────────────────────────────────────────────

export function UploadProvider({ children }: { children: React.ReactNode }) {
  const [phase, setPhase]                   = useState<UploadPhase>('idle');
  const [fileName, setFileName]             = useState('');
  const [uploadProgress, setUploadProgress] = useState(0);
  const [jobId, setJobId]                   = useState<string | null>(null);
  const [clips, setClips]                   = useState<any[]>([]);
  const [error, setError]                   = useState<string | null>(null);

  const pollTimerRef    = useRef<ReturnType<typeof setInterval> | null>(null);
  const pollDeadlineRef = useRef(0);

  // Warn before tab close while work is in flight
  useEffect(() => {
    if (phase === 'idle' || phase === 'done' || phase === 'error') return;
    const handler = (e: BeforeUnloadEvent) => { e.preventDefault(); return ''; };
    window.addEventListener('beforeunload', handler);
    return () => window.removeEventListener('beforeunload', handler);
  }, [phase]);

  const stopPolling = useCallback(() => {
    if (pollTimerRef.current) { clearInterval(pollTimerRef.current); pollTimerRef.current = null; }
  }, []);

  // ── Polling ───────────────────────────────────────────────────────────────

  const startPolling = useCallback((jId: string) => {
    stopPolling();
    setJobId(jId);
    setPhase('clipping');
    pollDeadlineRef.current = Date.now() + POLL_TIMEOUT_MS;

    pollTimerRef.current = setInterval(async () => {
      if (Date.now() > pollDeadlineRef.current) {
        stopPolling();
        setPhase('error');
        setError('Processing timed out. Your clips may still appear in /clips shortly.');
        return;
      }
      try {
        const res  = await fetch(`/api/process-upload-r2/${jId}`, { credentials: 'include' });
        const data = await res.json();
        if (data.status === 'completed') {
          stopPolling();
          const rawClips: any[] = Array.isArray(data.clips) ? data.clips : [];
          const normalized = rawClips.map((c: any) => ({
            video_url:     c.video_url     || '',
            download_url:  c.download_url  || '',
            title:         c.title         || 'Clip',
            caption:       c.desc          || c.caption || '',
            ai_score:      c.score         ?? c.ai_score,
            thumbnail_url: c.thumbnail     || c.thumbnail_url || '',
            hashtags:      Array.isArray(c.tags) ? c.tags : (Array.isArray(c.hashtags) ? c.hashtags : []),
            start_time:    c.start_time    ?? 0,
            end_time:      c.end_time      ?? 60,
            duration:      c.duration,
          }));
          setClips(normalized);
          setPhase('done');
          // Restore client-side save: triggers R2 rehost via after() and is a
          // fallback if saveClipsAdmin failed silently in the GET route above.
          if (normalized.length > 0) {
            fetch('/api/clips/save', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              credentials: 'include',
              body: JSON.stringify({ clips: normalized, source_video_name: jId }),
            }).catch(() => {});
          }
        } else if (data.status === 'failed' || data.status === 'not_found') {
          stopPolling();
          setPhase('error');
          setError(data.error || 'Processing failed. Please try again.');
        }
      } catch { /* network hiccup — keep polling until timeout */ }
    }, POLL_MS);
  }, [stopPolling]);

  // ── Public API ────────────────────────────────────────────────────────────

  const resumePolling = useCallback((jId: string) => {
    startPolling(jId);
  }, [startPolling]);

  const dismiss = useCallback(() => {
    stopPolling();
    setPhase('idle');
    setFileName('');
    setUploadProgress(0);
    setJobId(null);
    setClips([]);
    setError(null);
  }, [stopPolling]);

  const startUpload = useCallback(async (file: File, options: UploadStartOptions) => {
    stopPolling();
    setPhase('uploading');
    setFileName(file.name);
    setUploadProgress(0);
    setJobId(null);
    setClips([]);
    setError(null);

    try {
      // ── Lazy auth check ───────────────────────────────────────────────────
      const { createClient } = await import('@/lib/supabase-browser');
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Please sign in to continue.');

      let r2Url: string;

      if (file.size > MULTIPART_MIN) {
        // ── MULTIPART UPLOAD (>100 MB) ─────────────────────────────────────
        const startRes = await fetch('/api/upload/multipart-start', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ file_name: file.name, mime_type: file.type || 'video/mp4' }),
        });
        const startData = await startRes.json();
        if (!startRes.ok) throw new Error(startData.error || 'Failed to start upload.');
        const { uploadId, key } = startData as { uploadId: string; key: string };

        const totalParts = Math.ceil(file.size / PART_SIZE);
        const parts: { PartNumber: number; ETag: string }[] = [];

        for (let i = 0; i < totalParts; i++) {
          const partNumber  = i + 1;
          const chunkStart  = i * PART_SIZE;
          const chunk       = file.slice(chunkStart, Math.min(chunkStart + PART_SIZE, file.size));

          const partRes = await fetch('/api/upload/multipart-part', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ key, uploadId, partNumber }),
          });
          const partData = await partRes.json();
          if (!partRes.ok) throw new Error(partData.error || `Failed to get URL for part ${partNumber}.`);

          const putRes = await fetch(partData.url, {
            method: 'PUT',
            body: chunk,
            headers: { 'Content-Type': file.type || 'application/octet-stream' },
          });
          if (!putRes.ok) throw new Error(`Part ${partNumber} upload failed (${putRes.status}).`);

          // R2 returns ETag in the response header
          const etag = (putRes.headers.get('ETag') ?? '').replace(/"/g, '');
          parts.push({ PartNumber: partNumber, ETag: etag });
          setUploadProgress(Math.round(((i + 1) / totalParts) * 100));
        }

        const nameNoExt  = file.name.replace(/\.[^.]+$/, '');
        const doneRes    = await fetch('/api/upload/multipart-complete', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ key, uploadId, parts, file_name: file.name, file_size: file.size, title: nameNoExt }),
        });
        const doneData = await doneRes.json();
        if (!doneRes.ok) throw new Error(doneData.error || 'Failed to complete upload.');
        r2Url = doneData.video_url as string;

      } else {
        // ── SINGLE PUT UPLOAD (≤100 MB) ────────────────────────────────────
        const presignRes = await fetch('/api/upload/presign', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ file_name: file.name, file_size: file.size, mime_type: file.type }),
        });
        const presignData = await presignRes.json();
        if (!presignRes.ok) throw new Error(presignData.error || 'Failed to get upload URL.');

        await new Promise<void>((resolve, reject) => {
          const xhr = new XMLHttpRequest();
          xhr.open('PUT', presignData.upload_url);
          xhr.upload.onprogress = (e) => {
            if (e.lengthComputable) setUploadProgress(Math.round((e.loaded / e.total) * 100));
          };
          xhr.onload  = () => xhr.status >= 200 && xhr.status < 300 ? resolve() : reject(new Error(`Upload failed (${xhr.status}).`));
          xhr.onerror = () => reject(new Error('Upload failed. Check your connection and try again.'));
          xhr.setRequestHeader('Content-Type', file.type || 'application/octet-stream');
          xhr.send(file);
        });

        // Refresh session after long XHR
        await supabase.auth.getSession();

        const nameNoExt   = file.name.replace(/\.[^.]+$/, '');
        const completeRes = await fetch('/api/upload/complete', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ key: presignData.key, file_name: file.name, file_size: file.size, title: nameNoExt }),
        });
        const completeData = await completeRes.json();
        if (!completeRes.ok) throw new Error(completeData.error || 'Failed to register upload.');
        r2Url = completeData.video_url as string;
      }

      // ── Check for in-progress duplicate job ───────────────────────────────
      const threeHoursAgo = new Date(Date.now() - 3 * 60 * 60 * 1000).toISOString();
      const { data: existingJob } = await supabase
        .from('clip_jobs')
        .select('task_id')
        .eq('user_id', user.id)
        .eq('source_name', options.source_name ?? file.name)
        .eq('status', 'processing')
        .gte('created_at', threeHoursAgo)
        .maybeSingle();

      if (existingJob) {
        startPolling(existingJob.task_id);
        return;
      }

      // ── Submit to backend ─────────────────────────────────────────────────
      const processRes = await fetch('/api/process-upload-r2', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          r2_url:           r2Url,
          category:         options.category,
          prompt:           options.prompt,
          numClips:         options.numClips,
          source_name:      options.source_name ?? file.name,
          duration_seconds: options.duration_seconds,
        }),
      });
      const processData = await processRes.json();
      if (!processRes.ok) throw new Error(processData.error || 'Failed to start processing.');

      startPolling(processData.job_id as string);

    } catch (err) {
      setPhase('error');
      setError(err instanceof Error ? err.message : 'Upload failed.');
    }
  }, [stopPolling, startPolling]);

  return (
    <UploadContext.Provider value={{ phase, fileName, uploadProgress, jobId, clips, error, startUpload, resumePolling, dismiss }}>
      {children}
    </UploadContext.Provider>
  );
}
