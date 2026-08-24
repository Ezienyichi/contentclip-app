export type PlanData = {
  name:        string;
  tagline:     string;
  monthly:     number;
  annual:      number;  // per-month equivalent when billed annually
  annualTotal: number;  // exact yearly charge
  min:         number;
  badge:       string | null;
  popular:     boolean;
  cta:         string;
  includes:    string;
  features:    string[];
  comparison:  Record<string, string>;
};

export const COMPARISON_KEYS = [
  'Minutes/month',
  'Platforms',
  'Posts/month',
  'Export',
  'Video Upload',
  'Captions',
  'Hook Detection',
  'Priority Support',
] as const;

export const PLAN_DATA: PlanData[] = [
  {
    name:        'Free',
    tagline:     "Try it. About one sermon's worth.",
    monthly:     0,
    annual:      0,
    annualTotal: 0,
    min:         30,
    badge:       null,
    popular:     false,
    cta:         'Start free',
    includes:    "30 minutes / month · What's included",
    features: [
      '30 minutes of processing / month',
      'Facebook only',
      '1 post / month',
      '720p export',
      'Auto-captions',
    ],
    comparison: {
      'Minutes/month':   '30',
      'Platforms':       'Facebook',
      'Posts/month':     '1',
      'Export':          '720p MP4',
      'Video Upload':    '—',
      'Captions':        'Basic',
      'Hook Detection':  '✓',
      'Priority Support':'—',
    },
  },
  {
    name:        'Starter',
    tagline:     'Grow your reach across 3 platforms.',
    monthly:     29,
    annual:      24,
    annualTotal: 290,
    min:         180,
    badge:       'Most Popular',
    popular:     true,
    cta:         'Choose Starter',
    includes:    '180 minutes / month · Everything in Free, plus',
    features: [
      '180 minutes of processing / month',
      'Instagram + YouTube + Facebook',
      'Unlimited posts',
      '1080p export, no watermark',
      'Custom captions',
    ],
    comparison: {
      'Minutes/month':   '180',
      'Platforms':       'IG · YT · FB',
      'Posts/month':     'Unlimited',
      'Export':          '1080p MP4',
      'Video Upload':    '—',
      'Captions':        'Custom',
      'Hook Detection':  '✓',
      'Priority Support':'—',
    },
  },
  {
    name:        'Pro',
    tagline:     'Go viral on every major platform.',
    monthly:     59,
    annual:      49,
    annualTotal: 590,
    min:         400,
    badge:       'Best Value',
    popular:     false,
    cta:         'Choose Pro',
    includes:    '400 minutes / month · Everything in Starter, plus',
    features: [
      '400 minutes of processing / month',
      '+ TikTok + X (Twitter)',
      'Video file upload',
      '4K export',
      'Animated captions',
      'Priority processing',
    ],
    comparison: {
      'Minutes/month':   '400',
      'Platforms':       'IG · YT · FB · TikTok · X',
      'Posts/month':     'Unlimited',
      'Export':          '4K',
      'Video Upload':    '✓',
      'Captions':        'Animated',
      'Hook Detection':  '✓',
      'Priority Support':'✓',
    },
  },
  {
    name:        'Agency',
    tagline:     'Teams & agencies. Every platform.',
    monthly:     119,
    annual:      99,
    annualTotal: 1190,
    min:         900,
    badge:       null,
    popular:     false,
    cta:         'Choose Agency',
    includes:    '900 minutes / month · Everything in Pro, plus',
    features: [
      '900 minutes of processing / month',
      'All platforms + Threads, Pinterest, LinkedIn',
      '4K + ProRes export',
      'All caption styles',
      'Priority support',
    ],
    comparison: {
      'Minutes/month':   '900',
      'Platforms':       'All + Threads · Pinterest · LinkedIn',
      'Posts/month':     'Unlimited',
      'Export':          '4K + ProRes',
      'Video Upload':    '✓',
      'Captions':        'All styles',
      'Hook Detection':  '✓',
      'Priority Support':'✓',
    },
  },
];
