import { useState, useEffect } from 'react'
import { supabase } from '../supabase'

const FONT_DISPLAY = "'Lilita One', cursive"
const FONT_BODY = "'Poppins', system-ui, sans-serif"

const WOOD_BG = [
  'radial-gradient(ellipse at 50% 50%, transparent 18%, rgba(0,0,0,0.72) 100%)',
  'repeating-linear-gradient(180deg, transparent 0px, transparent 92px, rgba(0,0,0,0.3) 92px, rgba(0,0,0,0.3) 96px)',
  'repeating-linear-gradient(180deg, rgba(255,160,60,0.03) 0px, rgba(255,160,60,0.03) 1px, transparent 1px, transparent 16px)',
  'linear-gradient(174deg, rgba(70,28,6,0.55) 0%, rgba(40,14,3,0.2) 45%, rgba(58,20,5,0.55) 100%)',
  '#3A1906',
].join(', ')

// Uniform board colors — matching reference image
const CAT_HEADER_BG = 'linear-gradient(175deg, #344C0C 0%, #476018 100%)'
const CELL_BG_ACTIVE = 'linear-gradient(175deg, #6A7A1C 0%, #849A28 100%)'
const CELL_BG_PLAYED = 'linear-gradient(175deg, #5A5E40 0%, #6E7252 100%)'

const BOARD_BG = '#EAE0B0'
const FRAME_DARK = '#6A3006'
const FRAME_LIGHT = '#A06820'
const TEXT_DARK = '#1E3006'
const TEXT_CREAM = '#F8F0D0'
const GOLD = '#B88830'
const GOLD_BORDER = '#C8A040'

const CELL_SHADOW = '0 3px 5px rgba(30,20,4,0.3), inset 0 1px 0 rgba(255,255,180,0.2), inset 0 -2px 0 rgba(0,0,0,0.18)'
const CELL_SHADOW_HOVER = '0 7px 16px rgba(30,20,4,0.45), inset 0 1px 0 rgba(255,255,180,0.25), inset 0 -2px 0 rgba(0,0,0,0.2)'
const CELL_SHADOW_PLAYED = '0 1px 3px rgba(30,20,4,0.15)'

function getYouTubeEmbedUrl(url) {
  if (!url) return null
  const match = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([^&\n?#]+)/)
  return match ? `https://www.youtube.com/embed/${match[1]}?autoplay=1` : null
}

function MediaDisplay({ type, url, onImageClick }) {
  if (!type || type === 'none' || !url) return null
  if (type === 'image') {
    let imageUrls = [url]
    if (url.startsWith('[')) {
      try { imageUrls = JSON.parse(url).filter(Boolean) } catch {}
    }
    imageUrls = imageUrls.filter(Boolean)
    if (imageUrls.length === 0) return null
    if (imageUrls.length === 1) {
      return (
        <img
          src={imageUrls[0]}
          alt=""
          onClick={() => onImageClick && onImageClick(imageUrls[0])}
          style={{
            display: 'block',
            maxHeight: '220px',
            maxWidth: '100%',
            objectFit: 'contain',
            borderRadius: '10px',
            margin: '14px auto 0',
            cursor: onImageClick ? 'zoom-in' : 'default',
          }}
          onError={e => { e.target.style.display = 'none' }}
        />
      )
    }
    return (
      <div style={{
        display: 'grid',
        gridTemplateColumns: '1fr 1fr',
        gap: '8px',
        marginTop: '14px',
      }}>
        {imageUrls.map((imgUrl, i) => (
          <img
            key={i}
            src={imgUrl}
            alt=""
            onClick={() => onImageClick && onImageClick(imgUrl)}
            style={{
              display: 'block',
              width: '100%',
              maxHeight: '160px',
              objectFit: 'contain',
              borderRadius: '8px',
              cursor: onImageClick ? 'zoom-in' : 'default',
            }}
            onError={e => { e.target.style.display = 'none' }}
          />
        ))}
      </div>
    )
  }
  const embedUrl = getYouTubeEmbedUrl(url)
  if (embedUrl) {
    return (
      <div style={{ marginTop: '14px', width: '100%', aspectRatio: '16/9', maxWidth: '480px', margin: '14px auto 0' }}>
        <iframe src={embedUrl} title="Video" allow="autoplay; encrypted-media"
          allowFullScreen style={{ width: '100%', height: '100%', borderRadius: '10px', border: 'none' }} />
      </div>
    )
  }
  return (
    <video src={url} controls autoPlay
      style={{ display: 'block', maxHeight: '220px', maxWidth: '100%', borderRadius: '10px', margin: '14px auto 0' }} />
  )
}

function QuizCell({ q, isPlayed, onClick }) {
  const bg = isPlayed ? CELL_BG_PLAYED : CELL_BG_ACTIVE
  const shadow = isPlayed ? CELL_SHADOW_PLAYED : CELL_SHADOW

  return (
    <button
      onClick={onClick}
      style={{
        background: bg,
        color: isPlayed ? 'rgba(240,235,200,0.35)' : TEXT_CREAM,
        border: 'none',
        borderRadius: '6px',
        boxShadow: shadow,
        fontFamily: FONT_DISPLAY,
        fontWeight: 400,
        fontSize: 'clamp(0.9rem, 2vw, 1.6rem)',
        cursor: isPlayed ? 'default' : 'pointer',
        transition: 'transform 0.1s ease, box-shadow 0.1s ease',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        width: '100%',
        height: '100%',
        textShadow: isPlayed ? 'none' : '0 1px 4px rgba(0,0,0,0.4)',
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
  const [lightboxUrl, setLightboxUrl] = useState(null)

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
        background: WOOD_BG,
        color: GOLD,
        fontFamily: FONT_BODY,
        fontSize: '1rem',
        letterSpacing: '0.14em',
        textTransform: 'uppercase',
        textShadow: '0 1px 4px rgba(0,0,0,0.6)',
      }}>
        Lade Spielfeld…
      </div>
    )
  }

  return (
    <div style={{
      background: WOOD_BG,
      height: '100vh',
      display: 'flex',
      flexDirection: 'column',
      padding: '10px 14px 14px',
      gap: '8px',
      overflow: 'hidden',
    }}>

      {/* Top nav */}
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
            color: GOLD,
            background: 'transparent',
            border: 'none',
            fontFamily: FONT_BODY,
            fontWeight: 700,
            fontSize: '0.75rem',
            letterSpacing: '0.1em',
            cursor: 'pointer',
            textTransform: 'uppercase',
            textShadow: '0 1px 3px rgba(0,0,0,0.5)',
          }}
        >
          ← Zurück
        </button>

        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <span style={{
            color: GOLD,
            fontFamily: FONT_BODY,
            fontSize: '0.7rem',
            letterSpacing: '0.1em',
            textTransform: 'uppercase',
            textShadow: '0 1px 3px rgba(0,0,0,0.5)',
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
                  ? 'linear-gradient(175deg, #4E6418, #344C0C)'
                  : 'rgba(255,255,255,0.07)',
                color: teamCount === n ? TEXT_CREAM : GOLD,
                border: `1px solid ${teamCount === n ? GOLD_BORDER : 'rgba(184,136,48,0.35)'}`,
                borderBottom: teamCount === n ? `3px solid #1E3006` : '1px solid rgba(184,136,48,0.35)',
                fontFamily: FONT_BODY,
                fontWeight: 800,
                fontSize: '0.78rem',
                cursor: 'pointer',
                transition: 'all 0.1s ease',
                boxShadow: teamCount === n ? '0 2px 6px rgba(0,0,0,0.35), inset 0 1px 0 rgba(255,255,160,0.15)' : 'none',
                textShadow: teamCount === n ? '0 1px 2px rgba(0,0,0,0.4)' : 'none',
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
        background: BOARD_BG,
        border: `12px solid ${FRAME_DARK}`,
        boxShadow: `inset 0 0 0 3px ${FRAME_LIGHT}, 0 14px 50px rgba(0,0,0,0.65), 0 4px 12px rgba(0,0,0,0.35)`,
        borderRadius: '20px',
        display: 'flex',
        flexDirection: 'column',
        padding: '16px 20px 14px',
        overflow: 'hidden',
      }}>

        {colCount === 0 ? (
          <div style={{
            flex: 1,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: GOLD,
            fontFamily: FONT_BODY,
            fontSize: '0.95rem',
            letterSpacing: '0.06em',
          }}>
            Keine Kategorien in diesem Quiz.
          </div>
        ) : (
          <>
            {/* Quiz title */}
            <div style={{ flexShrink: 0, textAlign: 'center', padding: '2px 0 12px' }}>
              <h1 style={{
                fontFamily: FONT_DISPLAY,
                fontWeight: 400,
                fontSize: 'clamp(1.2rem, 3.5vw, 2.6rem)',
                textTransform: 'uppercase',
                letterSpacing: '0.08em',
                color: TEXT_DARK,
                textShadow: '0 1px 0 rgba(255,240,160,0.3), 0 2px 6px rgba(0,0,0,0.2)',
                margin: 0,
                lineHeight: 1.1,
              }}>
                {quiz.title}
              </h1>
            </div>

            {/* Grid */}
            <div style={{
              flex: 1,
              minHeight: 0,
              display: 'grid',
              gridTemplateColumns: `repeat(${colCount}, minmax(0, 1fr))`,
              gridTemplateRows: `auto repeat(${rowCount}, 1fr)`,
              gap: '5px',
            }}>
              {/* Category headers */}
              {categories.map(cat => (
                <div
                  key={cat.id}
                  style={{
                    background: CAT_HEADER_BG,
                    color: TEXT_CREAM,
                    borderRadius: '6px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    padding: '10px 6px',
                    textAlign: 'center',
                    fontFamily: FONT_BODY,
                    fontWeight: 800,
                    fontSize: 'clamp(0.48rem, 1.05vw, 0.78rem)',
                    letterSpacing: '0.08em',
                    textTransform: 'uppercase',
                    textShadow: '0 1px 3px rgba(0,0,0,0.45)',
                    boxShadow: CELL_SHADOW,
                    lineHeight: 1.2,
                    minHeight: '58px',
                  }}
                >
                  {cat.name}
                </div>
              ))}

              {/* Question cells */}
              {Array.from({ length: rowCount }, (_, rowIdx) =>
                categories.map(cat => {
                  const q = questions.find(q => q.category_id === cat.id && q.position === rowIdx)
                  if (!q) {
                    return (
                      <div
                        key={`${cat.id}-${rowIdx}`}
                        style={{
                          background: 'rgba(30,48,6,0.08)',
                          borderRadius: '6px',
                        }}
                      />
                    )
                  }
                  return (
                    <QuizCell
                      key={`${cat.id}-${rowIdx}`}
                      q={q}
                      isPlayed={played.has(q.id)}
                      onClick={() => openQuestion(q)}
                    />
                  )
                })
              )}
            </div>

            {/* Team score cards */}
            <div style={{
              flexShrink: 0,
              marginTop: '12px',
              display: 'grid',
              gridTemplateColumns: `repeat(${teamCount}, minmax(0, 1fr))`,
              gap: '10px',
            }}>
              {Array.from({ length: teamCount }).map((_, i) => (
                <div
                  key={i}
                  style={{
                    background: [
                      'linear-gradient(172deg, rgba(255,240,170,0.6) 0%, rgba(230,210,130,0.55) 100%)',
                      BOARD_BG,
                    ].join(', '),
                    border: `1.5px solid ${GOLD_BORDER}`,
                    borderRadius: '12px',
                    boxShadow: '0 3px 10px rgba(30,20,4,0.22), inset 0 1px 0 rgba(255,255,200,0.4)',
                    padding: '10px 12px',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    gap: '6px',
                  }}
                >
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
                        borderBottom: `1.5px solid ${GOLD}`,
                        outline: 'none',
                        color: TEXT_DARK,
                        fontFamily: FONT_BODY,
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
                        color: TEXT_DARK,
                        fontFamily: FONT_BODY,
                        fontWeight: 800,
                        fontSize: '0.68rem',
                        textTransform: 'uppercase',
                        letterSpacing: '0.1em',
                        cursor: 'pointer',
                        borderBottom: `1.5px solid ${GOLD}`,
                        paddingBottom: '3px',
                        width: '100%',
                        textAlign: 'center',
                        display: 'block',
                      }}
                    >
                      {teamNames[i]}
                    </span>
                  )}

                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '2px 0' }}>
                    <button
                      onClick={() => adjustScore(i, -(activeQuestion?.points ?? 100))}
                      style={{
                        width: '36px',
                        height: '36px',
                        borderRadius: '50%',
                        background: 'linear-gradient(175deg, #E8D490, #C8A840)',
                        border: `1.5px solid ${GOLD_BORDER}`,
                        borderBottom: '3px solid #8A6418',
                        color: TEXT_DARK,
                        fontSize: '1.2rem',
                        fontWeight: 700,
                        cursor: 'pointer',
                        boxShadow: '0 2px 6px rgba(30,20,4,0.28), inset 0 1px 0 rgba(255,255,200,0.5)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        lineHeight: 1,
                        flexShrink: 0,
                        fontFamily: FONT_BODY,
                        textShadow: '0 1px 1px rgba(255,255,200,0.4)',
                        transition: 'transform 0.08s',
                      }}
                      onMouseDown={e => { e.currentTarget.style.transform = 'translateY(2px)'; e.currentTarget.style.borderBottomWidth = '1px' }}
                      onMouseUp={e => { e.currentTarget.style.transform = 'none'; e.currentTarget.style.borderBottomWidth = '3px' }}
                      onMouseLeave={e => { e.currentTarget.style.transform = 'none'; e.currentTarget.style.borderBottomWidth = '3px' }}
                    >
                      −
                    </button>

                    <span style={{
                      color: TEXT_DARK,
                      fontFamily: FONT_DISPLAY,
                      fontWeight: 400,
                      fontSize: 'clamp(1.3rem, 2.4vw, 2rem)',
                      minWidth: '2.8rem',
                      textAlign: 'center',
                      lineHeight: 1,
                      textShadow: '0 1px 2px rgba(255,240,160,0.3)',
                    }}>
                      {scores[i]}
                    </span>

                    <button
                      onClick={() => adjustScore(i, activeQuestion?.points ?? 100)}
                      style={{
                        width: '36px',
                        height: '36px',
                        borderRadius: '50%',
                        background: 'linear-gradient(175deg, #5A7020, #384C0E)',
                        border: `1.5px solid ${GOLD_BORDER}`,
                        borderBottom: '3px solid #1E3006',
                        color: TEXT_CREAM,
                        fontSize: '1.2rem',
                        fontWeight: 700,
                        cursor: 'pointer',
                        boxShadow: '0 2px 6px rgba(30,20,4,0.35), inset 0 1px 0 rgba(255,255,160,0.2)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        lineHeight: 1,
                        flexShrink: 0,
                        fontFamily: FONT_BODY,
                        textShadow: '0 1px 2px rgba(0,0,0,0.4)',
                        transition: 'transform 0.08s',
                      }}
                      onMouseDown={e => { e.currentTarget.style.transform = 'translateY(2px)'; e.currentTarget.style.borderBottomWidth = '1px' }}
                      onMouseUp={e => { e.currentTarget.style.transform = 'none'; e.currentTarget.style.borderBottomWidth = '3px' }}
                      onMouseLeave={e => { e.currentTarget.style.transform = 'none'; e.currentTarget.style.borderBottomWidth = '3px' }}
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

      {/* Lightbox */}
      {lightboxUrl && (
        <div
          onClick={() => setLightboxUrl(null)}
          style={{
            position: 'fixed',
            inset: 0,
            zIndex: 100,
            background: 'rgba(0,0,0,0.88)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '24px',
            cursor: 'zoom-out',
          }}
        >
          <img
            src={lightboxUrl}
            alt=""
            style={{
              maxWidth: '100%',
              maxHeight: '100%',
              objectFit: 'contain',
              borderRadius: '12px',
              boxShadow: '0 20px 60px rgba(0,0,0,0.8)',
            }}
          />
        </div>
      )}

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
            background: 'rgba(0,0,0,0.72)',
          }}
          onClick={e => e.target === e.currentTarget && closeQuestion()}
        >
          <div style={{
            background: BOARD_BG,
            border: `8px solid ${FRAME_DARK}`,
            boxShadow: `inset 0 0 0 2px ${FRAME_LIGHT}, 0 28px 70px rgba(0,0,0,0.75)`,
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
              padding: '14px 22px',
              borderBottom: `2px solid ${GOLD}`,
              background: 'rgba(30,48,6,0.06)',
              borderRadius: '8px 8px 0 0',
            }}>
              <span style={{
                fontFamily: FONT_DISPLAY,
                fontWeight: 400,
                color: TEXT_DARK,
                fontSize: '1.6rem',
                letterSpacing: '0.04em',
                textShadow: '0 1px 3px rgba(0,0,0,0.15)',
              }}>
                {activeQuestion.points} Punkte
              </span>
              <button
                onClick={closeQuestion}
                style={{
                  color: 'rgba(30,48,6,0.45)',
                  background: 'none',
                  border: 'none',
                  fontSize: '1.3rem',
                  cursor: 'pointer',
                  lineHeight: 1,
                  fontFamily: FONT_BODY,
                }}
              >
                ✕
              </button>
            </div>

            <div style={{ padding: '28px 24px 22px' }}>
              <div style={{
                textAlign: 'center',
                minHeight: '80px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: 'clamp(1rem, 2.4vw, 1.35rem)',
                fontWeight: 700,
                color: TEXT_DARK,
                fontFamily: FONT_BODY,
                lineHeight: 1.5,
              }}>
                {activeQuestion.question_text}
              </div>

              {!showAnswer && (
                <MediaDisplay
                  type={activeQuestion.media_type}
                  url={activeQuestion.media_url}
                  onImageClick={setLightboxUrl}
                />
              )}

              {!showAnswer ? (
                <button
                  onClick={() => setShowAnswer(true)}
                  style={{
                    marginTop: '22px',
                    width: '100%',
                    padding: '14px',
                    borderRadius: '10px',
                    background: 'linear-gradient(175deg, #4E6418, #344C0C)',
                    color: TEXT_CREAM,
                    border: `1px solid ${FRAME_DARK}`,
                    borderBottom: '4px solid #1E3006',
                    fontFamily: FONT_BODY,
                    fontWeight: 800,
                    fontSize: '0.88rem',
                    letterSpacing: '0.1em',
                    textTransform: 'uppercase',
                    cursor: 'pointer',
                    boxShadow: CELL_SHADOW,
                    textShadow: '0 1px 3px rgba(0,0,0,0.4)',
                    transition: 'transform 0.08s, border-bottom-width 0.08s',
                  }}
                  onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-2px)' }}
                  onMouseLeave={e => {
                    e.currentTarget.style.transform = 'none'
                    e.currentTarget.style.borderBottomWidth = '4px'
                    e.currentTarget.style.paddingTop = '14px'
                  }}
                  onMouseDown={e => {
                    e.currentTarget.style.transform = 'translateY(2px)'
                    e.currentTarget.style.borderBottomWidth = '1px'
                    e.currentTarget.style.paddingTop = '17px'
                  }}
                  onMouseUp={e => {
                    e.currentTarget.style.transform = 'none'
                    e.currentTarget.style.borderBottomWidth = '4px'
                    e.currentTarget.style.paddingTop = '14px'
                  }}
                >
                  Antwort anzeigen
                </button>
              ) : (
                <>
                  <div style={{
                    marginTop: '16px',
                    padding: '16px 20px',
                    borderRadius: '10px',
                    textAlign: 'center',
                    fontSize: 'clamp(0.95rem, 2vw, 1.2rem)',
                    fontWeight: 700,
                    color: TEXT_DARK,
                    background: `rgba(184,136,48,0.14)`,
                    border: `1.5px solid ${GOLD_BORDER}`,
                    fontFamily: FONT_BODY,
                    lineHeight: 1.5,
                  }}>
                    {activeQuestion.answer_text}
                  </div>

                  <MediaDisplay
                    type={activeQuestion.answer_media_type}
                    url={activeQuestion.answer_media_url}
                    onImageClick={setLightboxUrl}
                  />

                  <div style={{
                    marginTop: '16px',
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
                            background: 'linear-gradient(175deg, #E0CC80, #C4A840)',
                            color: TEXT_DARK,
                            border: `1px solid ${GOLD_BORDER}`,
                            borderBottom: '3px solid #8A6820',
                            fontFamily: FONT_BODY,
                            fontWeight: 700,
                            fontSize: '0.72rem',
                            cursor: 'pointer',
                            letterSpacing: '0.04em',
                            boxShadow: '0 2px 5px rgba(30,20,4,0.25)',
                            textShadow: '0 1px 1px rgba(255,255,160,0.3)',
                            transition: 'transform 0.08s',
                          }}
                          onMouseDown={e => { e.currentTarget.style.transform = 'translateY(2px)'; e.currentTarget.style.borderBottomWidth = '1px' }}
                          onMouseUp={e => { e.currentTarget.style.transform = 'none'; e.currentTarget.style.borderBottomWidth = '3px' }}
                          onMouseLeave={e => { e.currentTarget.style.transform = 'none'; e.currentTarget.style.borderBottomWidth = '3px' }}
                        >
                          {teamNames[i]} −
                        </button>
                        <button
                          onClick={() => adjustScore(i, activeQuestion.points)}
                          style={{
                            padding: '8px 14px',
                            borderRadius: '8px',
                            background: 'linear-gradient(175deg, #5A7020, #384C0E)',
                            color: TEXT_CREAM,
                            border: `1px solid ${GOLD_BORDER}`,
                            borderBottom: '3px solid #1E3006',
                            fontFamily: FONT_BODY,
                            fontWeight: 700,
                            fontSize: '0.72rem',
                            cursor: 'pointer',
                            letterSpacing: '0.04em',
                            boxShadow: '0 2px 5px rgba(30,20,4,0.35)',
                            textShadow: '0 1px 2px rgba(0,0,0,0.4)',
                            transition: 'transform 0.08s',
                          }}
                          onMouseDown={e => { e.currentTarget.style.transform = 'translateY(2px)'; e.currentTarget.style.borderBottomWidth = '1px' }}
                          onMouseUp={e => { e.currentTarget.style.transform = 'none'; e.currentTarget.style.borderBottomWidth = '3px' }}
                          onMouseLeave={e => { e.currentTarget.style.transform = 'none'; e.currentTarget.style.borderBottomWidth = '3px' }}
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
                      border: `1.5px solid ${GOLD}`,
                      color: TEXT_DARK,
                      fontFamily: FONT_BODY,
                      fontWeight: 700,
                      fontSize: '0.86rem',
                      letterSpacing: '0.08em',
                      textTransform: 'uppercase',
                      cursor: 'pointer',
                      transition: 'background 0.1s ease',
                    }}
                    onMouseEnter={e => e.currentTarget.style.background = `rgba(184,136,48,0.12)`}
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
