export interface User {
  id: string; email: string; full_name?: string; avatar_url?: string;
  plan: 'free' | 'solo' | 'professional' | 'agency';
  credits_remaining: number; downloads_used: number; created_at: string;
}
export interface Project {
  id: string; user_id: string; title: string; source_url: string;
  source_platform: 'youtube' | 'vimeo' | 'tiktok' | 'other';
  status: 'importing' | 'transcribing' | 'analyzing' | 'generating' | 'complete' | 'error';
  progress: number; created_at: string;
}
export interface Clip {
  id: string; project_id: string; title: string; hook_text: string;
  start_time: number; end_time: number; duration: number;
  virality_score: number; status: 'pending' | 'processing' | 'ready' | 'error';
  video_url?: string; thumbnail_url?: string;
  platform_format: '9:16' | '1:1' | '16:9' | '4:5';
  captions_enabled: boolean; created_at: string;
}
export interface ScheduledPost {
  id: string; clip_id: string; platform: 'youtube' | 'tiktok' | 'instagram';
  scheduled_at: string; caption: string; hashtags: string[];
  status: 'scheduled' | 'published' | 'failed';
}
