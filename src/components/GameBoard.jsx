import { useState, useEffect } from 'react'
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
  softShadow: 'rgba(70, 45, 10, 0.25)',
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
const CELL_SHADOW_HOVER = '0 7px 14px rgba(70, 45, 10, 0.4), inset 0 1px 0 rgba(255, 255, 255, 0.3), inset 0 -2px 4px rgba(0, 0, 0, 0.15)'
const PLAYED_SHADOW = '0 1px 2px rgba(70, 45, 10, 0.1)'

const FONT = "'Poppins', system-ui, sans-serif"

function getYouTubeEmbedUrl(url) {
  if (!url) return null
  const match = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([^&\n?#]+)/)
  return match ? `https://www.youtube.com/embed/${match[1]}?autoplay=1` : null
}

function MediaDisplay({ question }) {
  if (question.media_type === 'none' || !question.media_url) return null
  if (question.media_type === 'image') {
    return (
      <img
        src={question.media_url}
        alt=""
        className="max-h-56 max-w-full object-contain rounded-lg mx-auto mt-4"
        onError={e => { e.target.style.display = 'none' }}
      />
    )
  }
  const embedUrl = getYouTubeEmbedUrl(question.media_url)
  if (embedUrl) {
    return (
      <div className="mt-4 w-full aspect-video max-w-lg mx-auto">
        <iframe src={embedUrl} title="Video" allow="autoplay; encrypted-media"
          allowFullScreen className="w-full h-full rounded-lg" />
      </div>
    )
  }
  return <video src={question.media_url} controls autoPlay className="max-h-56 max-w-full rounded-lg mx-auto mt-4" />
}

function QuizCell({ q, isPlayed, colIdx, onClick }) {
  const col = COL_STYLES[colIdx % COL_STYLES.length]
  const gradient = isPlayed ? 'linear-gradient(145deg, #8A8A72, #9E9E88)' : col.gradient
  const textColor = isPlayed ? 'rgba(255,255,255,0.4)' : col.text
  const shadow = isPlayed ? PLAYED_SHADOW : CELL_SHADOW

  return (
    <button
      onClick={onClick}
      style={{
        background: gradient,
        color: textColor,
        border: 'none',
        borderRadius: '8px',
        boxShadow: shadow,
        fontFamily: FONT,
        fontWeight: 800,
        fontSize: 'clamp(0.8rem, 1.8vw, 1.5rem)',
        cursor: isPlayed ? 'default' : 'pointer',
        transition: 'transform 0.12s ease, box-shadow 0.12s ease',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        width: '100%',
        height: '100%',
        textShadow: isPlayed ? 'none' : '0 1px 3px rgba(0,0,0,0.35)',
        letterSpacing: '0.02em',
        padding: 0,
      }}
      onMouseEnter={e => {
        if (!isPlayed) {
          e.currentTarget.style.transform = 'translateY(-3px) scale(1.02)'
          e.currentTarget.style.boxShadow = CELL_SHADOW_HOVER
        }
      }}
      onMouseLeave={e => {
        e.currentTarget.style.transform = 'none'
        e.currentTarget.style.boxShadow = shadow
      }}
    >
      {q.points}
    </button>
  )
}

export default function GameBoard({ quiz, onBack }) {
  const [categories, setCategories] = useState([])
  const [questions, setQuestions] = useState([])
  const [loading, setLoading] = useState(true)
  const [played, setPlayed] = useState(new Set())
  const [activeQuestion, setActiveQuestion] = useState(null)
  const [showAnswer, setShowAnswer] = useState(false)
  const [teamCount, setTeamCount] = useState(2)
  const [teamNames, setTeamNames] = useState(['Team 1', 'Team 2', 'Team 3', 'Team 4'])
  const [scores, setScores] = useState([0, 0, 0, 0])
  const [editingTeam, setEditingTeam] = useState(null)

  useEffect(() => { loadData() }, [])

  async function loadData() {
    const [catRes, qRes] = await Promise.all([
      supabase.from('categories').select('*').eq('quiz_id', quiz.id).order('position'),
      supabase.from('questions').select('*').eq('quiz_id', quiz.id).order('position'),
    ])
    setCategories(catRes.data || [])
    setQuestions(qRes.data || [])
    setLoading(false)
  }

  function openQuestion(q) { setActiveQuestion(q); setShowAnswer(false) }

  function closeQuestion() {
    if (activeQuestion) setPlayed(prev => new Set([...prev, activeQuestion.id]))
    setActiveQuestion(null)
    setShowAnswer(false)
  }

  function adjustScore(i, delta) {
    setScores(prev => { const n = [...prev]; n[i] += delta; return n })
  }

  const rowCount = questions.length > 0 ? Math.max(...questions.map(q => q.position)) + 1 : 0
  const colCount = categories.length

  if (loading) {
    return (
      <div style={{
        height: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: T.outerBg,
        color: T.frameLight,
        fontFamily: FONT,
        fontSize: '1rem',
        letterSpacing: '0.14em',
        textTransform: 'uppercase',
      }}>
        Lade Spielfeld…
      </div>
    )
  }

  return (
    <div style={{
      background: T.outerBg,
      height: '100vh',
      display: 'flex',
      flexDirection: 'column',
      padding: '10px 14px 14px',
      gap: '8px',
      overflow: 'hidden',
    }}>

      {/* Compact nav */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '0 4px',
        flexShrink: 0,
      }}>
        <button
          onClick={onBack}
          style={{
            color: T.frameLight,
            background: 'transparent',
            border: 'none',
            fontFamily: FONT,
            fontWeight: 700,
            fontSize: '0.75rem',
            letterSpacing: '0.1em',
            cursor: 'pointer',
            textTransform: 'uppercase',
          }}
        >
          ← Zurück
        </button>
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <span style={{
            color: T.goldLine,
            fontFamily: FONT,
            fontSize: '0.7rem',
            letterSpacing: '0.1em',
            textTransform: 'uppercase',
          }}>
            Teams:
          </span>
          {[2, 3, 4].map(n => (
            <button
              key={n}
              onClick={() => setTeamCount(n)}
              style={{
                width: '26px',
                height: '26px',
                borderRadius: '6px',
                background: teamCount === n
                  ? 'radial-gradient(circle at 30% 25%, #7C8B2E, #34460F)'
                  : 'rgba(255,255,255,0.07)',
                color: teamCount === n ? T.textLight : T.goldLine,
                border: `1px solid ${teamCount === n ? T.cardBorder : 'rgba(183,139,61,0.35)'}`,
                fontFamily: FONT,
                fontWeight: 800,
                fontSize: '0.78rem',
                cursor: 'pointer',
                transition: 'all 0.1s ease',
              }}
            >
              {n}
            </button>
          ))}
        </div>
      </div>

      {/* Board frame */}
      <div style={{
        flex: 1,
        minHeight: 0,
        background: T.boardBg,
        border: `12px solid ${T.frameDark}`,
        boxShadow: `inset 0 0 0 3px ${T.frameLight}, 0 12px 40px rgba(0,0,0,0.55), 0 3px 10px rgba(0,0,0,0.3)`,
        borderRadius: '20px',
        display: 'flex',
        flexDirection: 'column',
        padding: '18px 22px 16px',
        overflow: 'hidden',
      }}>
        {colCount === 0 ? (
          <div style={{
            flex: 1,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: T.goldLine,
            fontFamily: FONT,
            fontSize: '0.95rem',
            letterSpacing: '0.06em',
          }}>
            Keine Kategorien in diesem Quiz.
          </div>
        ) : (
          <>
            {/* Title */}
            <div style={{ flexShrink: 0, textAlign: 'center', padding: '4px 0 14px' }}>
              <h1 style={{
                fontFamily: FONT,
                fontWeight: 900,
                fontSize: 'clamp(1.1rem, 3vw, 2.4rem)',
                textTransform: 'uppercase',
                letterSpacing: '0.1em',
                color: T.textDark,
                textShadow: '0 1px 4px rgba(70,45,10,0.18)',
                margin: 0,
                lineHeight: 1.1,
              }}>
                {quiz.title}
              </h1>
            </div>

            {/* Category + question grid */}
            <div style={{
              flex: 1,
              minHeight: 0,
              display: 'grid',
              gridTemplateColumns: `repeat(${colCount}, minmax(0, 1fr))`,
              gridTemplateRows: `auto repeat(${rowCount}, 1fr)`,
              gap: '6px',
            }}>
              {/* Category headers */}
              {categories.map((cat, ci) => {
                const col = COL_STYLES[ci % COL_STYLES.length]
                return (
                  <div
                    key={cat.id}
                    style={{
                      background: col.gradient,
                      color: col.text,
                      borderRadius: '8px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      padding: '10px 6px',
                      textAlign: 'center',
                      fontFamily: FONT,
                      fontWeight: 800,
                      fontSize: 'clamp(0.48rem, 1.05vw, 0.8rem)',
                      letterSpacing: '0.08em',
                      textTransform: 'uppercase',
                      textShadow: '0 1px 3px rgba(0,0,0,0.4)',
                      boxShadow: CELL_SHADOW,
                      lineHeight: 1.2,
                      minHeight: '60px',
                    }}
                  >
                    {cat.name}
                  </div>
                )
              })}

              {/* Question cells */}
              {Array.from({ length: rowCount }, (_, rowIdx) =>
                categories.map((cat, ci) => {
                  const q = questions.find(q => q.category_id === cat.id && q.position === rowIdx)
                  if (!q) {
                    return (
                      <div
                        key={`${cat.id}-${rowIdx}`}
                        style={{ background: 'rgba(38,52,21,0.05)', borderRadius: '8px' }}
                      />
                    )
                  }
                  return (
                    <QuizCell
                      key={`${cat.id}-${rowIdx}`}
                      q={q}
                      isPlayed={played.has(q.id)}
                      colIdx={ci}
                      onClick={() => openQuestion(q)}
                    />
                  )
                })
              )}
            </div>

            {/* Team score cards */}
            <div style={{
              flexShrink: 0,
              marginTop: '14px',
              display: 'grid',
              gridTemplateColumns: `repeat(${teamCount}, minmax(0, 1fr))`,
              gap: '10px',
            }}>
              {Array.from({ length: teamCount }).map((_, i) => (
                <div
                  key={i}
                  style={{
                    background: 'rgba(247, 235, 207, 0.72)',
                    border: `1px solid ${T.cardBorder}`,
                    borderRadius: '14px',
                    boxShadow: '0 2px 8px rgba(70,45,10,0.18)',
                    padding: '10px 12px',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    gap: '6px',
                  }}
                >
                  {/* Team name */}
                  {editingTeam === i ? (
                    <input
                      autoFocus
                      value={teamNames[i]}
                      onChange={e => setTeamNames(prev => { const n = [...prev]; n[i] = e.target.value; return n })}
                      onBlur={() => setEditingTeam(null)}
                      onKeyDown={e => e.key === 'Enter' && setEditingTeam(null)}
                      style={{
                        background: 'transparent',
                        border: 'none',
                        borderBottom: `1px solid ${T.goldLine}`,
                        outline: 'none',
                        color: T.textDark,
                        fontFamily: FONT,
                        fontWeight: 800,
                        fontSize: '0.68rem',
                        textTransform: 'uppercase',
                        letterSpacing: '0.1em',
                        textAlign: 'center',
                        width: '100%',
                        paddingBottom: '2px',
                      }}
                    />
                  ) : (
                    <span
                      onClick={() => setEditingTeam(i)}
                      style={{
                        color: T.textDark,
                        fontFamily: FONT,
                        fontWeight: 800,
                        fontSize: '0.68rem',
                        textTransform: 'uppercase',
                        letterSpacing: '0.1em',
                        cursor: 'pointer',
                        borderBottom: `1px solid ${T.goldLine}`,
                        paddingBottom: '3px',
                        width: '100%',
                        textAlign: 'center',
                        display: 'block',
                      }}
                    >
                      {teamNames[i]}
                    </span>
                  )}

                  {/* Score row */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '2px 0' }}>
                    <button
                      onClick={() => adjustScore(i, -(activeQuestion?.points ?? 100))}
                      style={{
                        width: '38px',
                        height: '38px',
                        borderRadius: '50%',
                        background: 'linear-gradient(145deg, #F8EBCB, #E7CA82)',
                        border: `1px solid ${T.cardBorder}`,
                        color: T.textDark,
                        fontSize: '1.25rem',
                        fontWeight: 700,
                        cursor: 'pointer',
                        boxShadow: '0 2px 4px rgba(70,45,10,0.2), inset 0 1px 0 rgba(255,255,255,0.6)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        lineHeight: 1,
                        flexShrink: 0,
                        fontFamily: FONT,
                      }}
                    >
                      −
                    </button>

                    <span style={{
                      color: T.textDark,
                      fontFamily: FONT,
                      fontWeight: 900,
                      fontSize: 'clamp(1.2rem, 2.2vw, 1.9rem)',
                      minWidth: '2.8rem',
                      textAlign: 'center',
                      lineHeight: 1,
                    }}>
                      {scores[i]}
                    </span>

                    <button
                      onClick={() => adjustScore(i, activeQuestion?.points ?? 100)}
                      style={{
                        width: '38px',
                        height: '38px',
                        borderRadius: '50%',
                        background: 'radial-gradient(circle at 30% 25%, #7C8B2E, #34460F)',
                        border: `1px solid ${T.cardBorder}`,
                        color: T.textLight,
                        fontSize: '1.25rem',
                        fontWeight: 700,
                        cursor: 'pointer',
                        boxShadow: '0 2px 5px rgba(70,45,10,0.3), inset 0 1px 0 rgba(255,255,255,0.2)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        lineHeight: 1,
                        flexShrink: 0,
                        fontFamily: FONT,
                      }}
                    >
                      +
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </>
        )}
      </div>

      {/* Question modal */}
      {activeQuestion && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 50,
            padding: '24px',
            background: 'rgba(0,0,0,0.65)',
          }}
          onClick={e => e.target === e.currentTarget && closeQuestion()}
        >
          <div style={{
            background: T.boardBg,
            border: `6px solid ${T.frameDark}`,
            boxShadow: `inset 0 0 0 2px ${T.frameLight}, 0 24px 60px rgba(0,0,0,0.7)`,
            borderRadius: '18px',
            width: '100%',
            maxWidth: '640px',
            maxHeight: '88vh',
            overflowY: 'auto',
          }}>
            {/* Modal header */}
            <div style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              padding: '16px 24px',
              borderBottom: `2px solid ${T.goldLine}`,
              background: 'rgba(70,45,10,0.06)',
              borderRadius: '10px 10px 0 0',
            }}>
              <span style={{
                fontFamily: FONT,
                fontWeight: 800,
                color: T.textDark,
                fontSize: '1.5rem',
                letterSpacing: '0.04em',
              }}>
                {activeQuestion.points} Punkte
              </span>
              <button
                onClick={closeQuestion}
                style={{
                  color: 'rgba(38,52,21,0.45)',
                  background: 'none',
                  border: 'none',
                  fontSize: '1.3rem',
                  cursor: 'pointer',
                  lineHeight: 1,
                  fontFamily: FONT,
                }}
              >
                ✕
              </button>
            </div>

            <div style={{ padding: '28px 24px 24px' }}>
              <div style={{
                textAlign: 'center',
                minHeight: '80px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: 'clamp(1rem, 2.4vw, 1.35rem)',
                fontWeight: 700,
                color: T.textDark,
                fontFamily: FONT,
                lineHeight: 1.5,
              }}>
                {activeQuestion.question_text}
              </div>

              {!showAnswer && <MediaDisplay question={activeQuestion} />}

              {!showAnswer ? (
                <button
                  onClick={() => setShowAnswer(true)}
                  style={{
                    marginTop: '24px',
                    width: '100%',
                    padding: '14px',
                    borderRadius: '10px',
                    background: 'linear-gradient(145deg, #4F5F16, #6A7822)',
                    color: T.textLight,
                    border: 'none',
                    fontFamily: FONT,
                    fontWeight: 800,
                    fontSize: '0.9rem',
                    letterSpacing: '0.1em',
                    textTransform: 'uppercase',
                    cursor: 'pointer',
                    boxShadow: CELL_SHADOW,
                    transition: 'opacity 0.1s ease',
                  }}
                  onMouseEnter={e => e.currentTarget.style.opacity = '0.85'}
                  onMouseLeave={e => e.currentTarget.style.opacity = '1'}
                >
                  Antwort anzeigen
                </button>
              ) : (
                <>
                  <div style={{
                    marginTop: '18px',
                    padding: '16px 20px',
                    borderRadius: '10px',
                    textAlign: 'center',
                    fontSize: 'clamp(0.95rem, 2vw, 1.2rem)',
                    fontWeight: 700,
                    color: T.textDark,
                    background: 'rgba(183,139,61,0.14)',
                    border: `1.5px solid ${T.cardBorder}`,
                    fontFamily: FONT,
                    lineHeight: 1.5,
                  }}>
                    {activeQuestion.answer_text}
                  </div>

                  <MediaDisplay question={activeQuestion} />

                  <div style={{
                    marginTop: '18px',
                    display: 'flex',
                    gap: '8px',
                    flexWrap: 'wrap',
                    justifyContent: 'center',
                  }}>
                    {Array.from({ length: teamCount }).map((_, i) => (
                      <div key={i} style={{ display: 'flex', gap: '6px' }}>
                        <button
                          onClick={() => adjustScore(i, -activeQuestion.points)}
                          style={{
                            padding: '8px 14px',
                            borderRadius: '8px',
                            background: 'linear-gradient(145deg, #F8EBCB, #E7CA82)',
                            color: T.textDark,
                            border: `1px solid ${T.cardBorder}`,
                            fontFamily: FONT,
                            fontWeight: 700,
                            fontSize: '0.75rem',
                            cursor: 'pointer',
                            letterSpacing: '0.04em',
                          }}
                        >
                          {teamNames[i]} −
                        </button>
                        <button
                          onClick={() => adjustScore(i, activeQuestion.points)}
                          style={{
                            padding: '8px 14px',
                            borderRadius: '8px',
                            background: 'radial-gradient(circle at 30% 25%, #7C8B2E, #34460F)',
                            color: T.textLight,
                            border: `1px solid ${T.cardBorder}`,
                            fontFamily: FONT,
                            fontWeight: 700,
                            fontSize: '0.75rem',
                            cursor: 'pointer',
                            letterSpacing: '0.04em',
                          }}
                        >
                          {teamNames[i]} +
                        </button>
                      </div>
                    ))}
                  </div>

                  <button
                    onClick={closeQuestion}
                    style={{
                      marginTop: '14px',
                      width: '100%',
                      padding: '12px',
                      borderRadius: '10px',
                      background: 'transparent',
                      border: `1.5px solid ${T.goldLine}`,
                      color: T.textDark,
                      fontFamily: FONT,
                      fontWeight: 700,
                      fontSize: '0.88rem',
                      letterSpacing: '0.08em',
                      textTransform: 'uppercase',
                      cursor: 'pointer',
                      transition: 'background 0.1s ease',
                    }}
                    onMouseEnter={e => e.currentTarget.style.background = 'rgba(183,139,61,0.12)'}
                    onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                  >
                    Frage abschließen
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
