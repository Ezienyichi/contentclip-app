export function clearClipStorage() {
  if (typeof window === 'undefined') return;
  ['editor_clip', 'hookclip_clips', 'hookclip_scheduled',
    'hookclip_template_prompt', 'hookclip_template_name']
    .forEach(k => sessionStorage.removeItem(k));
  localStorage.removeItem('vangelclip_cached_clips');
}
