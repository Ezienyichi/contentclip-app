export type PlanData = {
  name: string;
  tagline: string;
  monthly: number;
  annual: number;
  min: number;
  badge: string | null;
  popular: boolean;
  cta: string;
  includes: string;
  features: string[];
  comparison: Record<string, string>;
};

export const COMPARISON_KEYS = [
  'Minutes/month',
  'Export',
  'Projects',
  'Captions',
  'Hook Detection',
  '9:16 Reframe',
  'Priority Support',
  'Scheduler',
] as const;

export const PLAN_DATA: PlanData[] = [
  {
    name:    'Free',
    tagline: "Try it. About one sermon's worth.",
    monthly: 0,
    annual:  0,
    min:     30,
    badge:   null,
    popular: false,
    cta:     'Start free',
    includes: "30 minutes / month · What's included",
    features: [
      '30 minutes of processing / month',
      '720p export',
      'YouTube URL clipping',
      'All 4 aspect ratios (9:16, 16:9, 1:1, 4:5)',
      'Auto-captions',
    ],
    comparison: {
      'Minutes/month':    '30',
      'Export':           '720p MP4',
      'Projects':         '1',
      'Captions':         'Basic',
      'Hook Detection':   '✓',
      '9:16 Reframe':     '✓',
      'Priority Support': '—',
      'Scheduler':        '—',
    },
  },
  {
    name:    'Starter',
    tagline: '',
    monthly: 24,
    annual:  19,
    min:     150,
    badge:   'Most Popular',
    popular: true,
    cta:     'Choose Starter',
    includes: '150 minutes / month · Everything in Free, plus',
    features: [
      '150 minutes of processing / month',
      '1080p export, no watermark',
      'Custom captions',
      'Up to 5 projects',
    ],
    comparison: {
      'Minutes/month':    '150',
      'Export':           '1080p MP4',
      'Projects':         '5',
      'Captions':         'Custom',
      'Hook Detection':   '✓',
      '9:16 Reframe':     '✓',
      'Priority Support': '—',
      'Scheduler':        'Coming soon',
    },
  },
  {
    name:    'Pro',
    tagline: '',
    monthly: 49,
    annual:  39,
    min:     400,
    badge:   'Best Value',
    popular: false,
    cta:     'Choose Pro',
    includes: '400 minutes / month · Everything in Starter, plus',
    features: [
      '400 minutes of processing / month',
      '4K export',
      'Animated captions',
      'Priority processing',
      'Unlimited projects',
    ],
    comparison: {
      'Minutes/month':    '400',
      'Export':           '4K',
      'Projects':         'Unlimited',
      'Captions':         'Animated',
      'Hook Detection':   '✓',
      '9:16 Reframe':     '✓',
      'Priority Support': '✓',
      'Scheduler':        'Coming soon',
    },
  },
  {
    name:    'Agency',
    tagline: 'Teams & agencies',
    monthly: 124,
    annual:  99,
    min:     1200,
    badge:   null,
    popular: false,
    cta:     'Choose Agency',
    includes: '1,200 minutes / month · Everything in Pro, plus',
    features: [
      '1,200 minutes of processing / month',
      '4K + ProRes export',
      'All caption styles',
      'Priority support',
      'Unlimited projects',
    ],
    comparison: {
      'Minutes/month':    '1,200',
      'Export':           '4K + ProRes',
      'Projects':         'Unlimited',
      'Captions':         'All styles',
      'Hook Detection':   '✓',
      '9:16 Reframe':     '✓',
      'Priority Support': '✓',
      'Scheduler':        'Coming soon',
    },
  },
];
