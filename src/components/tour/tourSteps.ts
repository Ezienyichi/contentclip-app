export interface TourStep {
  target: string; // matches data-tour="..." attribute on the target element
  title: string;
  body: string;
}

export const HOME_STEPS: TourStep[] = [
  {
    target: 'hero-headline',
    title: 'Welcome to VangelClip',
    body: 'AI finds your best moments from any YouTube video and turns them into ready-to-post short clips. No editing required.',
  },
  {
    target: 'hero-cta-btn',
    title: 'Start Clipping Free',
    body: 'Paste a YouTube link above and click this button to generate your first clips. Processing takes about 2–4 minutes.',
  },
];

export const DASHBOARD_STEPS: TourStep[] = [
  {
    target: 'stats-grid',
    title: 'Your account at a glance',
    body: 'Clips generated, minutes used, total projects, and your current plan, all updated in real time.',
  },
  {
    target: 'new-project-btn',
    title: 'New Project',
    body: 'Click "New Project" to import a YouTube video and generate your next batch of clips.',
  },
  {
    target: 'recent-projects',
    title: 'Recent projects',
    body: 'Your last 5 jobs appear here. Click a completed one to view and download its clips.',
  },
];

export const IMPORT_STEPS: TourStep[] = [
  {
    target: 'url-input',
    title: 'Paste your YouTube link',
    body: 'Drop any public YouTube URL here. Switch to "Upload Video" to process a file from your device instead.',
  },
  {
    target: 'content-category',
    title: 'Choose your content type',
    body: 'Pick the category that fits your video: Sermons & Faith, Podcasts, Music, or Film & Media Marketing. This tells the AI what kind of moments to look for.',
  },
  {
    target: 'content-mode',
    title: 'Auto or manual clip selection',
    body: 'Auto mode picks the best clip types for your category. Switch to Manual to hand-pick which moment types the AI prioritises. (Sermons & Faith only.)',
  },
  {
    target: 'clip-settings',
    title: 'Clip settings',
    body: 'Set how many clips to generate, aspect ratio (9:16 for Reels/Shorts), clip length, and whether to burn in subtitles.',
  },
  {
    target: 'minutes-indicator',
    title: 'Your minute balance',
    body: 'Usage is based on your video\'s length and comes from your monthly plan. For file uploads you\'ll see an estimate before submitting.',
  },
  {
    target: 'generate-btn',
    title: 'Generate your clips',
    body: 'Click Generate when you\'re ready. The AI usually finishes in 2–4 minutes, then your clips appear below the form.',
  },
];

export const SETTINGS_STEPS: TourStep[] = [
  {
    target: 'settings-tab-profile',
    title: 'Profile',
    body: 'Update your name, avatar, and change your password here.',
  },
  {
    target: 'settings-tab-billing',
    title: 'Plan & Usage',
    body: 'See your current plan, how many minutes you\'ve used, and upgrade if you need more.',
  },
  {
    target: 'settings-tab-notifications',
    title: 'Notifications',
    body: 'Choose when to receive email updates: clip completions, weekly reports, and more.',
  },
  {
    target: 'settings-tab-integrations',
    title: 'Integrations (coming soon)',
    body: 'Preview the platforms you\'ll be able to connect: YouTube, TikTok, Instagram, and LinkedIn. Direct publishing is in development.',
  },
];
