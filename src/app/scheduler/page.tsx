'use client';
import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase-browser';
import Link from 'next/link';

interface ScheduledPost {
  id: string;
  clip_title: string;
  video_url: string;
  platform: string;
  scheduled_at: string;
  status: string;
  caption: string;
}

const DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const PLATFORMS: Record<string, { icon: string; color: string }> = {
  tiktok: { icon: '🎵', color: '#000000' },
  instagram: { icon: '📸', color: '#E1306C' },
  youtube: { icon: '▶', color: '#FF0000' },
  facebook: { icon: '📘', color: '#1877F2' },
  twitter: { icon: '𝕏', color: '#000000' },
};

export default function SchedulerPage() {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [posts, setPosts] = useState<ScheduledPost[]>([]);
  const [selectedDay, setSelectedDay] = useState<number | null>(null);
  const supabase = createClient();

  useEffect(() => {
    supabase
      .from('scheduled_posts')
      .select('*')
      .order('scheduled_at', { ascending: true })
      .then(({ data }) => {
        setPosts(data || []);
      });
  }, []);

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();
  const firstDay = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const monthName = currentDate.toLocaleDateString('en', {
    month: 'long',
    year: 'numeric',
  });

  const getPostsForDay = (day: number) => {
    return posts.filter((p) => {
      const d = new Date(p.scheduled_at);
      return (
        d.getFullYear() === year &&
        d.getMonth() === month &&
        d.getDate() === day
      );
    });
  };

  const calendarDays = [];
  for (let i = 0; i < firstDay; i++) {
    calendarDays.push(null);
  }
  for (let i = 1; i <= daysInMonth; i++) {
    calendarDays.push(i);
  }

  return (
    <div>
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: '20px',
      }}>
        <h1 style={{
          fontSize: '22px',
          fontWeight: 700,
          color: '#ffffff',
          margin: 0,
        }}>
          Content calendar
        </h1>
        <Link
          href="/settings/social"
          style={{
            padding: '8px 16px',
            background: 'rgba(124,58,237,0.2)',
            border: '1px solid rgba(124,58,237,0.4)',
            borderRadius: '8px',
            color: '#a78bfa',
            fontSize: '12px',
            fontWeight: 600,
            textDecoration: 'none',
          }}
        >
          📱 Manage accounts
        </Link>
      </div>

      {/* Month navigation */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: '16px',
      }}>
        <button
          onClick={() =>
            setCurrentDate(new Date(year, month - 1, 1))
          }
          style={{
            padding: '6px 12px',
            background: 'rgba(255,255,255,0.06)',
            border: '1px solid rgba(255,255,255,0.1)',
            borderRadius: '6px',
            color: 'rgba(255,255,255,0.6)',
            fontSize: '13px',
            cursor: 'pointer',
          }}
        >
          ← Prev
        </button>
        <span style={{
          fontSize: '16px',
          fontWeight: 600,
          color: '#ffffff',
        }}>
          {monthName}
        </span>
        <button
          onClick={() =>
            setCurrentDate(new Date(year, month + 1, 1))
          }
          style={{
            padding: '6px 12px',
            background: 'rgba(255,255,255,0.06)',
            border: '1px solid rgba(255,255,255,0.1)',
            borderRadius: '6px',
            color: 'rgba(255,255,255,0.6)',
            fontSize: '13px',
            cursor: 'pointer',
          }}
        >
          Next →
        </button>
      </div>

      {/* Calendar grid */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(7, 1fr)',
        gap: '2px',
        background: 'rgba(255,255,255,0.06)',
        borderRadius: '12px',
        overflow: 'hidden',
        border: '1px solid rgba(255,255,255,0.08)',
      }}>
        {/* Day headers */}
        {DAYS.map((day) => (
          <div
            key={day}
            style={{
              padding: '10px',
              textAlign: 'center',
              fontSize: '11px',
              fontWeight: 600,
              color: 'rgba(255,255,255,0.4)',
              background: 'rgba(255,255,255,0.04)',
            }}
          >
            {day}
          </div>
        ))}

        {/* Calendar days */}
        {calendarDays.map((day, i) => {
          const dayPosts = day ? getPostsForDay(day) : [];
          const isToday =
            day === new Date().getDate() &&
            month === new Date().getMonth() &&
            year === new Date().getFullYear();

          return (
            <div
              key={i}
              onClick={() => day && setSelectedDay(day)}
              style={{
                padding: '8px',
                minHeight: '70px',
                background: day
                  ? selectedDay === day
                    ? 'rgba(124,58,237,0.12)'
                    : 'rgba(5,0,16,0.8)'
                  : 'rgba(5,0,16,0.4)',
                cursor: day ? 'pointer' : 'default',
                borderLeft: isToday
                  ? '2px solid #7c3aed'
                  : '2px solid transparent',
              }}
            >
              {day && (
                <>
                  <div style={{
                    fontSize: '12px',
                    fontWeight: isToday ? 700 : 400,
                    color: isToday
                      ? '#a78bfa'
                      : 'rgba(255,255,255,0.6)',
                    marginBottom: '4px',
                  }}>
                    {day}
                  </div>
                  {dayPosts.slice(0, 2).map((post, j) => (
                    <div
                      key={j}
                      style={{
                        fontSize: '9px',
                        padding: '2px 4px',
                        borderRadius: '3px',
                        background:
                          PLATFORMS[post.platform]?.color ||
                          '#7c3aed',
                        color: '#ffffff',
                        marginBottom: '2px',
                        whiteSpace: 'nowrap',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                      }}
                    >
                      {PLATFORMS[post.platform]?.icon}{' '}
                      {post.clip_title?.slice(0, 12)}
                    </div>
                  ))}
                  {dayPosts.length > 2 && (
                    <div style={{
                      fontSize: '9px',
                      color: 'rgba(255,255,255,0.4)',
                    }}>
                      +{dayPosts.length - 2} more
                    </div>
                  )}
                </>
              )}
            </div>
          );
        })}
      </div>

      {/* Selected day detail */}
      {selectedDay && (
        <div style={{
          marginTop: '16px',
          padding: '16px',
          background: 'rgba(255,255,255,0.04)',
          border: '1px solid rgba(255,255,255,0.08)',
          borderRadius: '12px',
        }}>
          <div style={{
            fontSize: '14px',
            fontWeight: 600,
            color: '#ffffff',
            marginBottom: '12px',
          }}>
            {new Date(year, month, selectedDay).toLocaleDateString(
              'en',
              { weekday: 'long', month: 'long', day: 'numeric' }
            )}
          </div>
          {getPostsForDay(selectedDay).length > 0 ? (
            getPostsForDay(selectedDay).map((post, i) => (
              <div
                key={i}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '10px',
                  padding: '10px',
                  background: 'rgba(255,255,255,0.04)',
                  borderRadius: '8px',
                  marginBottom: '6px',
                }}
              >
                <span style={{ fontSize: '16px' }}>
                  {PLATFORMS[post.platform]?.icon || '📱'}
                </span>
                <div style={{ flex: 1 }}>
                  <div style={{
                    fontSize: '13px',
                    fontWeight: 600,
                    color: '#ffffff',
                  }}>
                    {post.clip_title}
                  </div>
                  <div style={{
                    fontSize: '11px',
                    color: 'rgba(255,255,255,0.4)',
                  }}>
                    {new Date(post.scheduled_at).toLocaleTimeString(
                      'en',
                      { hour: '2-digit', minute: '2-digit' }
                    )}{' '}
                    · {post.platform}
                  </div>
                </div>
                <span style={{
                  padding: '3px 8px',
                  borderRadius: '100px',
                  fontSize: '10px',
                  fontWeight: 600,
                  background:
                    post.status === 'posted'
                      ? 'rgba(16,185,129,0.15)'
                      : post.status === 'failed'
                      ? 'rgba(239,68,68,0.15)'
                      : 'rgba(245,158,11,0.15)',
                  color:
                    post.status === 'posted'
                      ? '#6ee7b7'
                      : post.status === 'failed'
                      ? '#fca5a5'
                      : '#fcd34d',
                }}>
                  {post.status}
                </span>
              </div>
            ))
          ) : (
            <div style={{
              textAlign: 'center',
              padding: '20px',
              color: 'rgba(255,255,255,0.3)',
              fontSize: '13px',
            }}>
              No posts scheduled for this day
            </div>
          )}
        </div>
      )}

      {/* Empty state */}
      {posts.length === 0 && (
        <div style={{
          textAlign: 'center',
          padding: '40px 20px',
          marginTop: '16px',
        }}>
          <div style={{
            fontSize: '32px',
            marginBottom: '12px',
          }}>
            📅
          </div>
          <div style={{
            fontSize: '15px',
            fontWeight: 600,
            color: '#ffffff',
            marginBottom: '6px',
          }}>
            No scheduled posts yet
          </div>
          <div style={{
            fontSize: '13px',
            color: 'rgba(255,255,255,0.45)',
            marginBottom: '16px',
          }}>
            Generate clips and schedule them to
            publish automatically to your social accounts
          </div>
          <Link
            href="/import"
            style={{
              display: 'inline-flex',
              padding: '10px 20px',
              background: 'linear-gradient(135deg, #7c3aed, #5b21b6)',
              borderRadius: '8px',
              color: '#ffffff',
              fontSize: '13px',
              fontWeight: 600,
              textDecoration: 'none',
            }}
          >
            Generate Clips →
          </Link>
        </div>
      )}
    </div>
  );
}
