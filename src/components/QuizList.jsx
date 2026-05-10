import { useEffect, useState } from 'react'
import { supabase } from '../supabase'

const T = {
  outerBg: '#343716',
  boardBg: '#F7EBCF',
  frameDark: '#7A4A12',
  frameLight: '#B87925',
  textDark: '#263415',
  textLight: '#FFF7E8',
  goldLine: '#B78B3D',
  cardBorder: '#D6AF62',
}

const COL_STYLES = [
  { gradient: 'linear-gradient(145deg, #4F5F16, #6A7822)', text: '#FFF7E8' },
  { gradient: 'linear-gradient(145deg, #6F8C5D, #8EAA78)', text: '#FFF7E8' },
  { gradient: 'linear-gradient(145deg, #C8BD55, #DDD477)', text: '#FFF7E8' },
  { gradient: 'linear-gradient(145deg, #E4B85A, #F3D28B)', text: '#FFF7E8' },
  { gradient: 'linear-gradient(145deg, #9DA11C, #B4B83A)', text: '#FFF7E8' },
  { gradient: 'linear-gradient(145deg, #EAA000, #F5B400)', text: '#FFF7E8' },
]

const CELL_SHADOW = '0 3px 4px rgba(70, 45, 10, 0.25), inset 0 1px 0 rgba(255, 255, 255, 0.25), inset 0 -2px 4px rgba(0, 0, 0, 0.12)'
const FONT = "'Poppins', system-ui, sans-serif"

export default function QuizList({ onPlay, onCreate, onEdit }) {
  const [quizzes, setQuizzes] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => { fetchQuizzes() }, [])

  async function fetchQuizzes() {
    setLoading(true)
    const { data, error } = await supabase
      .from('quizzes').select('*').order('created_at', { ascending: false })
    if (error) setError(error.message)
    else setQuizzes(data)
    setLoading(false)
  }

  async function deleteQuiz(id) {
    if (!confirm('Quiz wirklich löschen?')) return
    await supabase.from('quizzes').delete().eq('id', id)
    setQuizzes(quizzes.filter(q => q.id !== id))
  }

  return (
    <div style={{
      minHeight: '100vh',
      background: T.outerBg,
      padding: '28px 24px',
    }}>
      <div style={{ maxWidth: '1100px', margin: '0 auto' }}>

        {/* Header panel */}
        <div style={{
          textAlign: 'center',
          marginBottom: '28px',
          padding: '28px 24px 22px',
          background: T.boardBg,
          border: `10px solid ${T.frameDark}`,
          boxShadow: `inset 0 0 0 3px ${T.frameLight}, 0 8px 30px rgba(0,0,0,0.45)`,
          borderRadius: '18px',
        }}>
          <h1 style={{
            fontFamily: FONT,
            fontWeight: 900,
            fontSize: 'clamp(1.6rem, 4vw, 2.8rem)',
            textTransform: 'uppercase',
            letterSpacing: '0.1em',
            color: T.textDark,
            textShadow: '0 1px 4px rgba(70,45,10,0.18)',
            margin: 0,
          }}>
            Quiz-Übersicht
          </h1>
          <p style={{
            fontFamily: FONT,
            fontWeight: 700,
            letterSpacing: '0.08em',
            color: T.goldLine,
            marginTop: '6px',
            fontSize: '0.85rem',
            textTransform: 'uppercase',
          }}>
            Wähle ein Quiz oder erstelle ein neues
          </p>
        </div>

        {/* New quiz button */}
        <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '20px' }}>
          <button
            onClick={onCreate}
            style={{
              background: 'radial-gradient(circle at 30% 25%, #7C8B2E, #34460F)',
              color: T.textLight,
              border: `1px solid ${T.cardBorder}`,
              borderRadius: '10px',
              padding: '10px 22px',
              fontFamily: FONT,
              fontWeight: 800,
              fontSize: '0.8rem',
              letterSpacing: '0.1em',
              textTransform: 'uppercase',
              cursor: 'pointer',
              boxShadow: CELL_SHADOW,
              transition: 'opacity 0.1s ease',
            }}
            onMouseEnter={e => e.currentTarget.style.opacity = '0.85'}
            onMouseLeave={e => e.currentTarget.style.opacity = '1'}
          >
            + Neues Quiz
          </button>
        </div>

        {loading && (
          <div style={{
            textAlign: 'center',
            padding: '60px 0',
            color: T.goldLine,
            fontFamily: FONT,
            fontWeight: 700,
            letterSpacing: '0.1em',
            textTransform: 'uppercase',
            fontSize: '0.9rem',
          }}>
            Lade Quizzes…
          </div>
        )}

        {error && (
          <div style={{
            background: 'rgba(180,40,20,0.15)',
            border: '1px solid rgba(180,40,20,0.4)',
            color: '#8b1010',
            padding: '14px 18px',
            borderRadius: '10px',
            marginBottom: '20px',
            fontSize: '0.85rem',
            fontFamily: FONT,
          }}>
            Fehler: {error}
          </div>
        )}

        {!loading && quizzes.length === 0 && (
          <div style={{ textAlign: 'center', padding: '60px 0' }}>
            <p style={{
              color: T.goldLine,
              fontFamily: FONT,
              fontWeight: 700,
              marginBottom: '16px',
              letterSpacing: '0.06em',
            }}>
              Noch keine Quizzes vorhanden.
            </p>
            <button
              onClick={onCreate}
              style={{
                background: 'radial-gradient(circle at 30% 25%, #7C8B2E, #34460F)',
                color: T.textLight,
                border: `1px solid ${T.cardBorder}`,
                borderRadius: '10px',
                padding: '12px 24px',
                fontFamily: FONT,
                fontWeight: 800,
                fontSize: '0.85rem',
                letterSpacing: '0.1em',
                textTransform: 'uppercase',
                cursor: 'pointer',
                boxShadow: CELL_SHADOW,
              }}
            >
              Erstes Quiz erstellen
            </button>
          </div>
        )}

        {/* Quiz cards grid */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
          gap: '18px',
        }}>
          {quizzes.map((quiz, idx) => {
            const col = COL_STYLES[idx % COL_STYLES.length]
            return (
              <div
                key={quiz.id}
                style={{
                  background: col.gradient,
                  borderRadius: '12px',
                  boxShadow: CELL_SHADOW,
                  transition: 'transform 0.14s ease, box-shadow 0.14s ease',
                  overflow: 'hidden',
                  border: `1px solid rgba(255,255,255,0.12)`,
                }}
                onMouseEnter={e => {
                  e.currentTarget.style.transform = 'translateY(-4px) scale(1.01)'
                  e.currentTarget.style.boxShadow = '0 8px 20px rgba(70,45,10,0.38), inset 0 1px 0 rgba(255,255,255,0.3), inset 0 -2px 4px rgba(0,0,0,0.15)'
                }}
                onMouseLeave={e => {
                  e.currentTarget.style.transform = 'none'
                  e.currentTarget.style.boxShadow = CELL_SHADOW
                }}
              >
                {/* Title strip */}
                <div style={{
                  padding: '16px 18px 12px',
                  borderBottom: '1px solid rgba(255,255,255,0.15)',
                  background: 'rgba(0,0,0,0.1)',
                }}>
                  <h2 style={{
                    fontFamily: FONT,
                    fontWeight: 900,
                    fontSize: 'clamp(0.9rem, 2vw, 1.1rem)',
                    textTransform: 'uppercase',
                    letterSpacing: '0.08em',
                    color: col.text,
                    textShadow: '0 1px 3px rgba(0,0,0,0.35)',
                    margin: 0,
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap',
                    textAlign: 'center',
                  }}>
                    {quiz.title}
                  </h2>
                </div>

                <div style={{ padding: '14px 18px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  {quiz.description && (
                    <p style={{
                      fontSize: '0.82rem',
                      color: col.text,
                      fontFamily: FONT,
                      fontWeight: 700,
                      opacity: 0.85,
                      lineHeight: 1.4,
                    }}>
                      {quiz.description}
                    </p>
                  )}
                  <div style={{
                    fontSize: '0.72rem',
                    color: col.text,
                    fontFamily: FONT,
                    fontWeight: 700,
                    opacity: 0.75,
                    letterSpacing: '0.04em',
                  }}>
                    <span>von <strong>{quiz.creator_name}</strong></span>
                    <span style={{ margin: '0 8px' }}>·</span>
                    <span>{new Date(quiz.created_at).toLocaleDateString('de-DE')}</span>
                  </div>

                  <div style={{ display: 'flex', gap: '8px', paddingTop: '2px' }}>
                    <button
                      onClick={() => onPlay(quiz)}
                      style={{
                        flex: 1,
                        padding: '9px 0',
                        borderRadius: '8px',
                        background: 'rgba(0,0,0,0.2)',
                        color: col.text,
                        border: '1px solid rgba(255,255,255,0.15)',
                        fontFamily: FONT,
                        fontWeight: 800,
                        fontSize: '0.75rem',
                        letterSpacing: '0.06em',
                        textTransform: 'uppercase',
                        cursor: 'pointer',
                        transition: 'background 0.1s ease',
                      }}
                      onMouseEnter={e => e.currentTarget.style.background = 'rgba(0,0,0,0.3)'}
                      onMouseLeave={e => e.currentTarget.style.background = 'rgba(0,0,0,0.2)'}
                    >
                      ▶ Spielen
                    </button>
                    <button
                      onClick={() => onEdit(quiz)}
                      style={{
                        flex: 1,
                        padding: '9px 0',
                        borderRadius: '8px',
                        background: 'rgba(255,255,255,0.22)',
                        color: col.text,
                        border: '1px solid rgba(255,255,255,0.2)',
                        fontFamily: FONT,
                        fontWeight: 800,
                        fontSize: '0.75rem',
                        letterSpacing: '0.06em',
                        textTransform: 'uppercase',
                        cursor: 'pointer',
                        transition: 'background 0.1s ease',
                      }}
                      onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.38)'}
                      onMouseLeave={e => e.currentTarget.style.background = 'rgba(255,255,255,0.22)'}
                    >
                      ✏ Bearbeiten
                    </button>
                    <button
                      onClick={() => deleteQuiz(quiz.id)}
                      style={{
                        padding: '9px 12px',
                        borderRadius: '8px',
                        background: 'rgba(255,255,255,0.18)',
                        color: col.text,
                        border: '1px solid rgba(255,255,255,0.15)',
                        cursor: 'pointer',
                        fontSize: '0.85rem',
                        transition: 'background 0.1s ease',
                      }}
                      onMouseEnter={e => e.currentTarget.style.background = 'rgba(180,40,20,0.3)'}
                      onMouseLeave={e => e.currentTarget.style.background = 'rgba(255,255,255,0.18)'}
                    >
                      🗑
                    </button>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}
