'use client';
import React, { useState } from 'react';

interface Answers {
  acquisition_source: string;
  content_category:   string;
  main_goal:          string;
}

interface Props {
  onComplete: (answers: Answers) => void;
  onSkip:     () => void;
}

const STEPS = [
  {
    key:      'acquisition_source' as keyof Answers,
    question: 'How did you hear about us?',
    emoji:    '👋',
    options:  [
      'Search engine', 'Instagram/social', 'Word of mouth',
      'In-person event', 'Church/ministry', 'YouTube',
      'Blog/article', 'Other',
    ],
  },
  {
    key:      'content_category' as keyof Answers,
    question: 'What do you create?',
    emoji:    '🎬',
    options:  ['Sermons & Faith', 'Music', 'Podcasts', 'Education', 'Marketing/Business', 'Other'],
  },
  {
    key:      'main_goal' as keyof Answers,
    question: "What's your main goal?",
    emoji:    '🎯',
    options:  ['Grow my audience', 'Save editing time', 'Reach new platforms', 'Repurpose content'],
  },
];

export default function OnboardingQA({ onComplete, onSkip }: Props) {
  const [step, setStep]       = useState(0);
  const [answers, setAnswers] = useState<Partial<Answers>>({});

  const current = STEPS[step];

  const handleSelect = (option: string) => {
    const updated = { ...answers, [current.key]: option };
    setAnswers(updated);
    if (step < STEPS.length - 1) {
      setStep(s => s + 1);
    } else {
      onComplete(updated as Answers);
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      {/* Progress dots */}
      <div style={{ display: 'flex', gap: 6, justifyContent: 'center' }}>
        {STEPS.map((_, i) => (
          <div
            key={i}
            style={{
              width:        i === step ? 20 : 7,
              height:       7,
              borderRadius: 4,
              background:   i <= step ? '#9B5DE5' : 'rgba(0,0,0,0.12)',
              transition:   'all 0.25s',
            }}
          />
        ))}
      </div>

      {/* Question */}
      <div style={{ textAlign: 'center' }}>
        <div style={{ fontSize: 28, marginBottom: 8 }}>{current.emoji}</div>
        <p style={{ margin: 0, fontSize: 15, fontWeight: 700, color: '#1A1714', lineHeight: 1.4 }}>
          {current.question}
        </p>
        <p style={{ margin: '4px 0 0', fontSize: 12, color: '#6B6560' }}>
          Tap to answer · {STEPS.length - step - 1} question{STEPS.length - step - 1 !== 1 ? 's' : ''} left
        </p>
      </div>

      {/* Options */}
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, justifyContent: 'center' }}>
        {current.options.map(opt => (
          <button
            key={opt}
            onClick={() => handleSelect(opt)}
            style={{
              padding:      '9px 16px',
              borderRadius: 100,
              border:       '1.5px solid rgba(0,0,0,0.12)',
              background:   '#EFECEA',
              color:        '#1A1714',
              fontSize:     13,
              fontWeight:   600,
              cursor:       'pointer',
              fontFamily:   'inherit',
              transition:   'all 0.15s',
            }}
            onMouseEnter={e => {
              (e.currentTarget as HTMLButtonElement).style.background    = '#9B5DE5';
              (e.currentTarget as HTMLButtonElement).style.color         = '#fff';
              (e.currentTarget as HTMLButtonElement).style.borderColor   = '#9B5DE5';
            }}
            onMouseLeave={e => {
              (e.currentTarget as HTMLButtonElement).style.background    = '#EFECEA';
              (e.currentTarget as HTMLButtonElement).style.color         = '#1A1714';
              (e.currentTarget as HTMLButtonElement).style.borderColor   = 'rgba(0,0,0,0.12)';
            }}
          >
            {opt}
          </button>
        ))}
      </div>

      {/* Skip */}
      <button
        onClick={onSkip}
        style={{
          alignSelf:  'center',
          background: 'none',
          border:     'none',
          color:      '#6B6560',
          fontSize:   12,
          cursor:     'pointer',
          fontFamily: 'inherit',
          padding:    '4px 8px',
        }}
      >
        Skip all questions
      </button>
    </div>
  );
}
