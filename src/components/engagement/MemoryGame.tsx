'use client';
import React, { useState, useEffect, useCallback } from 'react';

const EMOJIS = ['🎵', '📱', '✂️', '🎬', '🎙️', '📲', '🌟', '🏆'];

interface Card {
  id:      number;
  emoji:   string;
  flipped: boolean;
  matched: boolean;
}

function buildDeck(): Card[] {
  const pairs = [...EMOJIS, ...EMOJIS];
  // Fisher-Yates shuffle
  for (let i = pairs.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [pairs[i], pairs[j]] = [pairs[j], pairs[i]];
  }
  return pairs.map((emoji, id) => ({ id, emoji, flipped: false, matched: false }));
}

interface Props {
  onDismiss: () => void;
}

export default function MemoryGame({ onDismiss }: Props) {
  const [cards,    setCards]    = useState<Card[]>(buildDeck);
  const [selected, setSelected] = useState<number[]>([]);
  const [locked,   setLocked]   = useState(false);
  const [moves,    setMoves]    = useState(0);
  const [won,      setWon]      = useState(false);

  const reset = () => {
    setCards(buildDeck());
    setSelected([]);
    setLocked(false);
    setMoves(0);
    setWon(false);
  };

  const flip = useCallback((id: number) => {
    if (locked) return;
    const card = cards.find(c => c.id === id);
    if (!card || card.flipped || card.matched) return;
    if (selected.includes(id)) return;

    const next = [...selected, id];
    setCards(cs => cs.map(c => c.id === id ? { ...c, flipped: true } : c));

    if (next.length < 2) {
      setSelected(next);
      return;
    }

    // Two cards flipped — check match
    setSelected([]);
    setMoves(m => m + 1);
    setLocked(true);

    const [a, b] = next;
    const cardA = cards.find(c => c.id === a)!;
    const cardB = cards.find(c => c.id === b)!;

    if (cardA.emoji === cardB.emoji) {
      setCards(cs => cs.map(c =>
        c.id === a || c.id === b ? { ...c, flipped: true, matched: true } : c
      ));
      setLocked(false);
    } else {
      setTimeout(() => {
        setCards(cs => cs.map(c =>
          c.id === a || c.id === b ? { ...c, flipped: false } : c
        ));
        setLocked(false);
      }, 800);
    }
  }, [cards, selected, locked]);

  // Check win
  useEffect(() => {
    if (cards.length > 0 && cards.every(c => c.matched)) {
      setWon(true);
    }
  }, [cards]);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div>
          <p style={{ margin: 0, fontSize: 11, fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', color: '#9B5DE5' }}>
            Mini game
          </p>
          <p style={{ margin: '2px 0 0', fontSize: 13, fontWeight: 700, color: '#1A1714' }}>
            Memory Match: find all 8 pairs
          </p>
        </div>
        <span style={{ fontSize: 12, color: '#6B6560', background: '#EFECEA', padding: '3px 10px', borderRadius: 100, border: '1px solid rgba(0,0,0,0.08)' }}>
          {moves} move{moves !== 1 ? 's' : ''}
        </span>
      </div>

      {won ? (
        /* Win screen */
        <div style={{ textAlign: 'center', padding: '24px 0', display: 'flex', flexDirection: 'column', gap: 12, alignItems: 'center' }}>
          <div style={{ fontSize: 44 }}>🎉</div>
          <p style={{ margin: 0, fontSize: 16, fontWeight: 800, color: '#1A1714' }}>You matched them all!</p>
          <p style={{ margin: 0, fontSize: 13, color: '#6B6560' }}>Finished in {moves} moves</p>
          <button
            onClick={reset}
            style={{
              marginTop: 4, padding: '9px 22px', borderRadius: 100,
              border: '1.5px solid rgba(155,93,229,0.35)',
              background: 'rgba(155,93,229,0.08)', color: '#7C3AED',
              fontSize: 13, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit',
            }}
          >
            Play again
          </button>
        </div>
      ) : (
        /* 4×4 grid */
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 8 }}>
          {cards.map(card => (
            <button
              key={card.id}
              onClick={() => flip(card.id)}
              style={{
                aspectRatio:   '1',
                borderRadius:  10,
                border:        card.matched
                  ? '2px solid rgba(5,150,105,0.4)'
                  : card.flipped
                  ? '2px solid rgba(155,93,229,0.4)'
                  : '2px solid rgba(0,0,0,0.10)',
                background:    card.matched
                  ? 'rgba(5,150,105,0.08)'
                  : card.flipped
                  ? '#EFECEA'
                  : '#F5F3EF',
                fontSize:      card.flipped || card.matched ? 22 : 18,
                cursor:        card.matched || locked ? 'default' : 'pointer',
                display:       'flex',
                alignItems:    'center',
                justifyContent:'center',
                transition:    'all 0.18s',
                transform:     card.flipped && !card.matched ? 'scale(1.05)' : 'scale(1)',
                padding:       0,
                fontFamily:    'inherit',
              }}
            >
              {card.flipped || card.matched ? card.emoji : '?'}
            </button>
          ))}
        </div>
      )}

      {/* Dismiss */}
      <button
        onClick={onDismiss}
        style={{
          alignSelf: 'center', background: 'none', border: 'none',
          color: '#6B6560', fontSize: 12, cursor: 'pointer',
          fontFamily: 'inherit', padding: '4px 8px',
        }}
      >
        Dismiss
      </button>
    </div>
  );
}
