import { useEffect, useState } from 'react'
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

const CARD_CONFIGS = [
  {
    gradient: 'linear-gradient(172deg, #3C4C10 0%, #536820 48%, #3E4E12 100%)',
    border: '#222C06',
    shadowBase: 'rgba(18,28,4,0.65)',
    shadowHover: 'rgba(18,28,4,0.8)',
  },
  {
    gradient: 'linear-gradient(172deg, #4C6040 0%, #627A52 48%, #4E6242 100%)',
    border: '#2A3E20',
    shadowBase: 'rgba(18,32,12,0.65)',
    shadowHover: 'rgba(18,32,12,0.8)',
  },
  {
    gradient: 'linear-gradient(172deg, #846418 0%, #A88028 48%, #88681A 100%)',
    border: '#4E3C0C',
    shadowBase: 'rgba(38,28,6,0.65)',
    shadowHover: 'rgba(38,28,6,0.8)',
  },
  {
    gradient: 'linear-gradient(172deg, #5E4A1C 0%, #7A6028 48%, #604C1E 100%)',
    border: '#362A0E',
    shadowBase: 'rgba(30,20,6,0.65)',
    shadowHover: 'rgba(30,20,6,0.8)',
  },
  {
    gradient: 'linear-gradient(172deg, #687010 0%, #848E1C 48%, #6A7212 100%)',
    border: '#3C4208',
    shadowBase: 'rgba(24,28,4,0.65)',
    shadowHover: 'rgba(24,28,4,0.8)',
  },
  {
    gradient: 'linear-gradient(172deg, #884A12 0%, #AC6020 48%, #8A4C14 100%)',
    border: '#502C08',
    shadowBase: 'rgba(36,18,4,0.65)',
    shadowHover: 'rgba(36,18,4,0.8)',
  },
]

const CARD_SHADOW = (cfg) =>
  `0 6px 22px ${cfg.shadowBase}, 0 2px 6px rgba(0,0,0,0.4), inset 0 1px 0 rgba(255,240,160,0.18), inset 0 -2px 0 rgba(0,0,0,0.22)`

const CARD_SHADOW_HOVER = (cfg) =>
  `0 14px 36px ${cfg.shadowHover}, 0 4px 10px rgba(0,0,0,0.45), inset 0 1px 0 rgba(255,240,160,0.2), inset 0 -2px 0 rgba(0,0,0,0.22)`

function Screw({ top, right, bottom, left }) {
  return (
    <div style={{
      position: 'absolute',
      width: '15px',
      height: '15px',
      borderRadius: '50%',
      background: 'radial-gradient(circle at 38% 32%, #DEC050, #7A5010)',
      border: '1.5px solid #4E2C08',
      boxShadow: '0 2px 5px rgba(0,0,0,0.55), inset 0 1px 1px rgba(255,230,120,0.45)',
      top, right, bottom, left,
      zIndex: 2,
      flexShrink: 0,
    }}>
      <div style={{
        position: 'absolute',
        top: '50%', left: '50%',
        transform: 'translate(-50%, -50%)',
        width: '7px', height: '1.5px',
        background: 'rgba(35,15,0,0.55)',
        borderRadius: '1px',
      }} />
      <div style={{
        position: 'absolute',
        top: '50%', left: '50%',
        transform: 'translate(-50%, -50%) rotate(90deg)',
        width: '7px', height: '1.5px',
        background: 'rgba(35,15,0,0.55)',
        borderRadius: '1px',
      }} />
    </div>
  )
}

function WoodButton({ onClick, dark = false, children, style = {} }) {
  const base = dark
    ? {
        background: 'linear-gradient(175deg, #4A5E14 0%, #384A0E 100%)',
        border: '1px solid #22300A',
        borderBottom: '3px solid #1A2606',
        color: '#E8F0B0',
        boxShadow: '0 4px 10px rgba(0,0,0,0.4), inset 0 1px 0 rgba(255,255,160,0.18)',
      }
    : {
        background: 'linear-gradient(175deg, #B88C28 0%, #8A6818 100%)',
        border: '1px solid #5C400E',
        borderBottom: '3px solid #402C08',
        color: '#FFF0C0',
        boxShadow: '0 4px 10px rgba(0,0,0,0.38), inset 0 1px 0 rgba(255,240,140,0.2)',
      }

  return (
    <button
      onClick={onClick}
      style={{
        ...base,
        borderRadius: '7px',
        fontFamily: FONT_BODY,
        fontWeight: 800,
        fontSize: '0.72rem',
        letterSpacing: '0.07em',
        textTransform: 'uppercase',
        cursor: 'pointer',
        textShadow: '0 1px 3px rgba(0,0,0,0.45)',
        transition: 'transform 0.08s ease, box-shadow 0.08s ease',
        ...style,
      }}
      onMouseEnter={e => {
        e.currentTarget.style.transform = 'translateY(-2px)'
        e.currentTarget.style.boxShadow = base.boxShadow.replace('10px', '14px').replace('0.4', '0.5')
      }}
      onMouseLeave={e => {
        e.currentTarget.style.transform = 'none'
        e.currentTarget.style.boxShadow = base.boxShadow
        e.currentTarget.style.borderBottomWidth = '3px'
        e.currentTarget.style.paddingTop = style.paddingTop || '9px'
      }}
      onMouseDown={e => {
        e.currentTarget.style.transform = 'translateY(2px)'
        e.currentTarget.style.borderBottomWidth = '1px'
        e.currentTarget.style.paddingTop = String(parseInt(style.paddingTop || '9') + 2) + 'px'
      }}
      onMouseUp={e => {
        e.currentTarget.style.transform = 'none'
        e.currentTarget.style.borderBottomWidth = '3px'
        e.currentTarget.style.paddingTop = style.paddingTop || '9px'
      }}
    >
      {children}
    </button>
  )
}

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
      background: WOOD_BG,
      padding: '40px 24px 56px',
    }}>
      <div style={{ maxWidth: '1050px', margin: '0 auto' }}>

        {/* Header wooden sign */}
        <div style={{
          position: 'relative',
          maxWidth: '720px',
          margin: '0 auto 34px',
          textAlign: 'center',
          background: [
            'repeating-linear-gradient(88deg, transparent 0px, transparent 120px, rgba(0,0,0,0.025) 120px, rgba(0,0,0,0.025) 121px)',
            'repeating-linear-gradient(178deg, rgba(255,220,100,0.06) 0px, rgba(255,220,100,0.06) 1px, transparent 1px, transparent 22px)',
            'linear-gradient(168deg, #E0B848 0%, #C08A28 35%, #D4A838 65%, #B88020 100%)',
          ].join(', '),
          border: '10px solid #522408',
          boxShadow: [
            'inset 0 0 0 2px #8A5818',
            'inset 0 2px 8px rgba(255,200,80,0.15)',
            '0 14px 50px rgba(0,0,0,0.7)',
            '0 4px 14px rgba(0,0,0,0.45)',
          ].join(', '),
          borderRadius: '14px',
          padding: '30px 56px 26px',
        }}>
          <Screw top="12px" left="14px" />
          <Screw top="12px" right="14px" />
          <Screw bottom="12px" left="14px" />
          <Screw bottom="12px" right="14px" />

          <h1 style={{
            fontFamily: FONT_DISPLAY,
            fontWeight: 400,
            fontSize: 'clamp(2rem, 5vw, 3.2rem)',
            textTransform: 'uppercase',
            letterSpacing: '0.07em',
            color: '#1C3808',
            textShadow: [
              '0 2px 0 rgba(255,240,150,0.22)',
              '0 -1px 0 rgba(0,0,0,0.15)',
              '2px 4px 10px rgba(0,0,0,0.4)',
            ].join(', '),
            margin: 0,
            lineHeight: 1.05,
          }}>
            Quiz-Übersicht
          </h1>
          <p style={{
            fontFamily: FONT_BODY,
            fontWeight: 700,
            letterSpacing: '0.1em',
            color: '#6A3C08',
            marginTop: '9px',
            fontSize: '0.78rem',
            textTransform: 'uppercase',
            textShadow: '0 1px 2px rgba(255,200,80,0.2)',
          }}>
            Wähle ein Quiz oder erstelle ein neues
          </p>
        </div>

        {/* New quiz button */}
        <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '18px' }}>
          <WoodButton onClick={onCreate} dark style={{ padding: '9px 20px' }}>
            + Neues Quiz
          </WoodButton>
        </div>

        {loading && (
          <div style={{
            textAlign: 'center',
            padding: '64px 0',
            color: '#C8A040',
            fontFamily: FONT_BODY,
            fontWeight: 700,
            letterSpacing: '0.12em',
            textTransform: 'uppercase',
            fontSize: '0.9rem',
            textShadow: '0 1px 4px rgba(0,0,0,0.6)',
          }}>
            Lade Quizzes…
          </div>
        )}

        {error && (
          <div style={{
            background: 'rgba(100,15,8,0.55)',
            border: '2px solid rgba(160,35,18,0.5)',
            color: '#FFBBAA',
            padding: '14px 18px',
            borderRadius: '10px',
            marginBottom: '20px',
            fontSize: '0.85rem',
            fontFamily: FONT_BODY,
            textShadow: '0 1px 2px rgba(0,0,0,0.5)',
          }}>
            Fehler: {error}
          </div>
        )}

        {!loading && quizzes.length === 0 && (
          <div style={{ textAlign: 'center', padding: '64px 0' }}>
            <p style={{
              color: '#C8A040',
              fontFamily: FONT_BODY,
              fontWeight: 700,
              marginBottom: '22px',
              letterSpacing: '0.06em',
              textShadow: '0 1px 4px rgba(0,0,0,0.6)',
            }}>
              Noch keine Quizzes vorhanden.
            </p>
            <WoodButton onClick={onCreate} dark style={{ padding: '12px 28px' }}>
              Erstes Quiz erstellen
            </WoodButton>
          </div>
        )}

        {/* Quiz cards */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))',
          gap: '16px',
        }}>
          {quizzes.map((quiz, idx) => {
            const cfg = CARD_CONFIGS[idx % CARD_CONFIGS.length]
            return (
              <div
                key={quiz.id}
                style={{
                  background: cfg.gradient,
                  borderRadius: '10px',
                  border: `2px solid ${cfg.border}`,
                  boxShadow: CARD_SHADOW(cfg),
                  transition: 'transform 0.15s ease, box-shadow 0.15s ease',
                  overflow: 'hidden',
                }}
                onMouseEnter={e => {
                  e.currentTarget.style.transform = 'translateY(-5px)'
                  e.currentTarget.style.boxShadow = CARD_SHADOW_HOVER(cfg)
                }}
                onMouseLeave={e => {
                  e.currentTarget.style.transform = 'none'
                  e.currentTarget.style.boxShadow = CARD_SHADOW(cfg)
                }}
              >
                {/* Title strip */}
                <div style={{
                  padding: '18px 16px 14px',
                  background: 'rgba(0,0,0,0.18)',
                  borderBottom: `1px solid ${cfg.border}`,
                  textAlign: 'center',
                }}>
                  <h2 style={{
                    fontFamily: FONT_DISPLAY,
                    fontWeight: 400,
                    fontSize: 'clamp(1.1rem, 2.2vw, 1.45rem)',
                    textTransform: 'uppercase',
                    letterSpacing: '0.07em',
                    color: '#FFF8DC',
                    textShadow: '0 1px 0 rgba(255,240,160,0.18), 0 2px 7px rgba(0,0,0,0.55)',
                    margin: 0,
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap',
                  }}>
                    {quiz.title}
                  </h2>
                </div>

                {/* Card body */}
                <div style={{ padding: '12px 14px 14px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  {quiz.description && (
                    <p style={{
                      fontSize: '0.78rem',
                      color: 'rgba(255,245,200,0.82)',
                      fontFamily: FONT_BODY,
                      fontWeight: 600,
                      lineHeight: 1.4,
                      textShadow: '0 1px 2px rgba(0,0,0,0.35)',
                      margin: 0,
                    }}>
                      {quiz.description}
                    </p>
                  )}
                  <div style={{
                    fontSize: '0.7rem',
                    color: 'rgba(255,240,180,0.72)',
                    fontFamily: FONT_BODY,
                    fontWeight: 600,
                    letterSpacing: '0.04em',
                    textShadow: '0 1px 2px rgba(0,0,0,0.35)',
                  }}>
                    <span>von <strong style={{ color: 'rgba(255,245,200,0.9)', fontWeight: 700 }}>{quiz.creator_name}</strong></span>
                    <span style={{ margin: '0 7px', opacity: 0.6 }}>·</span>
                    <span>{new Date(quiz.created_at).toLocaleDateString('de-DE')}</span>
                  </div>

                  {/* Action buttons */}
                  <div style={{ display: 'flex', gap: '7px', paddingTop: '4px' }}>
                    <button
                      onClick={() => onPlay(quiz)}
                      style={{
                        flex: 1,
                        padding: '9px 0',
                        borderRadius: '7px',
                        background: 'linear-gradient(175deg, rgba(0,0,0,0.38), rgba(0,0,0,0.52))',
                        color: '#EFF5C8',
                        border: '1px solid rgba(0,0,0,0.35)',
                        borderBottom: '3px solid rgba(0,0,0,0.48)',
                        fontFamily: FONT_BODY,
                        fontWeight: 800,
                        fontSize: '0.7rem',
                        letterSpacing: '0.07em',
                        textTransform: 'uppercase',
                        cursor: 'pointer',
                        boxShadow: 'inset 0 1px 0 rgba(255,255,160,0.1)',
                        textShadow: '0 1px 3px rgba(0,0,0,0.55)',
                        transition: 'transform 0.08s, border-bottom-width 0.08s',
                      }}
                      onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-1px)' }}
                      onMouseLeave={e => {
                        e.currentTarget.style.transform = 'none'
                        e.currentTarget.style.borderBottomWidth = '3px'
                        e.currentTarget.style.paddingTop = '9px'
                      }}
                      onMouseDown={e => {
                        e.currentTarget.style.transform = 'translateY(2px)'
                        e.currentTarget.style.borderBottomWidth = '1px'
                        e.currentTarget.style.paddingTop = '11px'
                      }}
                      onMouseUp={e => {
                        e.currentTarget.style.transform = 'none'
                        e.currentTarget.style.borderBottomWidth = '3px'
                        e.currentTarget.style.paddingTop = '9px'
                      }}
                    >
                      ▶ Spielen
                    </button>

                    <button
                      onClick={() => onEdit(quiz)}
                      style={{
                        flex: 1,
                        padding: '9px 0',
                        borderRadius: '7px',
                        background: 'linear-gradient(175deg, rgba(190,145,35,0.55), rgba(140,100,18,0.65))',
                        color: '#FFF4C8',
                        border: '1px solid rgba(120,80,12,0.55)',
                        borderBottom: '3px solid rgba(80,50,8,0.6)',
                        fontFamily: FONT_BODY,
                        fontWeight: 800,
                        fontSize: '0.7rem',
                        letterSpacing: '0.07em',
                        textTransform: 'uppercase',
                        cursor: 'pointer',
                        boxShadow: 'inset 0 1px 0 rgba(255,240,140,0.15)',
                        textShadow: '0 1px 3px rgba(0,0,0,0.45)',
                        transition: 'transform 0.08s, border-bottom-width 0.08s',
                      }}
                      onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-1px)' }}
                      onMouseLeave={e => {
                        e.currentTarget.style.transform = 'none'
                        e.currentTarget.style.borderBottomWidth = '3px'
                        e.currentTarget.style.paddingTop = '9px'
                      }}
                      onMouseDown={e => {
                        e.currentTarget.style.transform = 'translateY(2px)'
                        e.currentTarget.style.borderBottomWidth = '1px'
                        e.currentTarget.style.paddingTop = '11px'
                      }}
                      onMouseUp={e => {
                        e.currentTarget.style.transform = 'none'
                        e.currentTarget.style.borderBottomWidth = '3px'
                        e.currentTarget.style.paddingTop = '9px'
                      }}
                    >
                      ✏ Bearbeiten
                    </button>

                    <button
                      onClick={() => deleteQuiz(quiz.id)}
                      style={{
                        padding: '9px 11px',
                        borderRadius: '7px',
                        background: 'linear-gradient(175deg, rgba(150,35,15,0.45), rgba(110,18,8,0.55))',
                        color: 'rgba(255,190,170,0.9)',
                        border: '1px solid rgba(110,28,10,0.45)',
                        borderBottom: '3px solid rgba(70,10,4,0.55)',
                        cursor: 'pointer',
                        fontSize: '0.82rem',
                        boxShadow: 'inset 0 1px 0 rgba(255,180,160,0.1)',
                        transition: 'transform 0.08s, border-bottom-width 0.08s',
                      }}
                      onMouseEnter={e => {
                        e.currentTarget.style.transform = 'translateY(-1px)'
                        e.currentTarget.style.background = 'linear-gradient(175deg, rgba(180,45,20,0.6), rgba(130,22,10,0.7))'
                      }}
                      onMouseLeave={e => {
                        e.currentTarget.style.transform = 'none'
                        e.currentTarget.style.background = 'linear-gradient(175deg, rgba(150,35,15,0.45), rgba(110,18,8,0.55))'
                        e.currentTarget.style.borderBottomWidth = '3px'
                        e.currentTarget.style.paddingTop = '9px'
                      }}
                      onMouseDown={e => {
                        e.currentTarget.style.transform = 'translateY(2px)'
                        e.currentTarget.style.borderBottomWidth = '1px'
                        e.currentTarget.style.paddingTop = '11px'
                      }}
                      onMouseUp={e => {
                        e.currentTarget.style.transform = 'none'
                        e.currentTarget.style.borderBottomWidth = '3px'
                        e.currentTarget.style.paddingTop = '9px'
                      }}
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
