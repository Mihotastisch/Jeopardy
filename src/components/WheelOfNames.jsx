import { useState, useRef, useEffect } from 'react'

const FONT_DISPLAY = "'Lilita One', cursive"
const FONT_BODY = "'Poppins', system-ui, sans-serif"

const WOOD_BG = [
  'radial-gradient(ellipse at 50% 50%, transparent 18%, rgba(0,0,0,0.72) 100%)',
  'repeating-linear-gradient(180deg, transparent 0px, transparent 92px, rgba(0,0,0,0.3) 92px, rgba(0,0,0,0.3) 96px)',
  'repeating-linear-gradient(180deg, rgba(255,160,60,0.03) 0px, rgba(255,160,60,0.03) 1px, transparent 1px, transparent 16px)',
  'linear-gradient(174deg, rgba(70,28,6,0.55) 0%, rgba(40,14,3,0.2) 45%, rgba(58,20,5,0.55) 100%)',
  '#3A1906',
].join(', ')

// Segment colors matching the app's warm wood/green palette
const SEGMENT_COLORS = [
  '#3C5210', '#527030', '#78581A', '#584220',
  '#5C6810', '#7A3C10', '#2A5A2C', '#624820',
  '#386018', '#745816', '#484E0C', '#7C3810',
]

const CANVAS_SIZE = 440

function parseNames(text) {
  return [...new Set(
    text.split(/[\n,]+/).map(n => n.trim()).filter(n => n.length > 0)
  )]
}

function drawWheel(canvas, names) {
  if (!canvas) return
  const ctx = canvas.getContext('2d')
  const size = canvas.width
  const cx = size / 2
  const cy = size / 2
  const outerR = size / 2 - 5

  ctx.clearRect(0, 0, size, size)

  if (names.length === 0) {
    ctx.beginPath()
    ctx.arc(cx, cy, outerR, 0, 2 * Math.PI)
    ctx.fillStyle = 'rgba(42, 18, 4, 0.55)'
    ctx.fill()
    ctx.strokeStyle = '#8A5818'
    ctx.lineWidth = 5
    ctx.stroke()
  } else {
    const segAngle = (2 * Math.PI) / names.length

    for (let i = 0; i < names.length; i++) {
      const startA = -Math.PI / 2 + i * segAngle
      const endA = startA + segAngle
      const col = SEGMENT_COLORS[i % SEGMENT_COLORS.length]

      ctx.beginPath()
      ctx.moveTo(cx, cy)
      ctx.arc(cx, cy, outerR, startA, endA)
      ctx.closePath()
      ctx.fillStyle = col
      ctx.fill()
      ctx.strokeStyle = 'rgba(200, 160, 50, 0.4)'
      ctx.lineWidth = 1.5
      ctx.stroke()

      // Name text, rotated along the segment's midpoint
      const midA = startA + segAngle / 2
      ctx.save()
      ctx.translate(cx, cy)
      ctx.rotate(midA)
      ctx.textAlign = 'right'
      ctx.textBaseline = 'middle'

      const fontSize = Math.max(9, Math.min(16, Math.round(outerR * 0.105)))
      ctx.font = `700 ${fontSize}px Poppins, system-ui, sans-serif`
      ctx.fillStyle = '#FFF7E8'
      ctx.shadowColor = 'rgba(0,0,0,0.85)'
      ctx.shadowBlur = 5
      ctx.shadowOffsetX = 1
      ctx.shadowOffsetY = 1

      const maxW = outerR * 0.68
      let label = names[i].length > 24 ? names[i].slice(0, 22) + '…' : names[i]
      while (ctx.measureText(label).width > maxW && label.length > 2) {
        label = label.slice(0, -2) + '…'
      }
      ctx.fillText(label, outerR - 18, 0)
      ctx.restore()
    }

    // Outer decorative ring
    ctx.beginPath()
    ctx.arc(cx, cy, outerR, 0, 2 * Math.PI)
    ctx.strokeStyle = '#B87925'
    ctx.lineWidth = 5
    ctx.shadowColor = 'transparent'
    ctx.shadowBlur = 0
    ctx.stroke()
  }

  // Hub gradient
  const hubG = ctx.createRadialGradient(cx - 6, cy - 6, 2, cx, cy, 30)
  hubG.addColorStop(0, '#F0D050')
  hubG.addColorStop(0.6, '#B08020')
  hubG.addColorStop(1, '#6A3C10')
  ctx.shadowColor = 'transparent'
  ctx.shadowBlur = 0
  ctx.shadowOffsetX = 0
  ctx.shadowOffsetY = 0
  ctx.beginPath()
  ctx.arc(cx, cy, 30, 0, 2 * Math.PI)
  ctx.fillStyle = hubG
  ctx.fill()
  ctx.strokeStyle = '#C8A030'
  ctx.lineWidth = 2.5
  ctx.stroke()

  // Center pin
  ctx.beginPath()
  ctx.arc(cx, cy, 9, 0, 2 * Math.PI)
  ctx.fillStyle = '#1E0C02'
  ctx.fill()
  ctx.strokeStyle = '#6A4820'
  ctx.lineWidth = 1.5
  ctx.stroke()
}

function Screw({ top, right, bottom, left }) {
  return (
    <div style={{
      position: 'absolute',
      width: '15px', height: '15px',
      borderRadius: '50%',
      background: 'radial-gradient(circle at 38% 32%, #DEC050, #7A5010)',
      border: '1.5px solid #4E2C08',
      boxShadow: '0 2px 5px rgba(0,0,0,0.55), inset 0 1px 1px rgba(255,230,120,0.45)',
      top, right, bottom, left,
      zIndex: 2, flexShrink: 0,
    }}>
      <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%,-50%)', width: '7px', height: '1.5px', background: 'rgba(35,15,0,0.55)', borderRadius: '1px' }} />
      <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%,-50%) rotate(90deg)', width: '7px', height: '1.5px', background: 'rgba(35,15,0,0.55)', borderRadius: '1px' }} />
    </div>
  )
}

function NameWheel({ names, totalRotation, isSpinning }) {
  const canvasRef = useRef(null)

  useEffect(() => {
    drawWheel(canvasRef.current, names)
  }, [names])

  return (
    <div style={{ position: 'relative', width: '100%', maxWidth: CANVAS_SIZE, margin: '0 auto' }}>
      {/* Fixed pointer above wheel center */}
      <div style={{
        position: 'absolute',
        top: 22,
        left: '50%',
        transform: 'translateX(-50%)',
        zIndex: 10,
        pointerEvents: 'none',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
      }}>
        {/* Shadow */}
        <div style={{
          position: 'absolute',
          top: 4,
          width: 0, height: 0,
          borderLeft: '18px solid transparent',
          borderRight: '18px solid transparent',
          borderTop: '36px solid rgba(0,0,0,0.45)',
          filter: 'blur(5px)',
        }} />
        {/* Pointer body */}
        <div style={{
          position: 'relative',
          width: 0, height: 0,
          borderLeft: '15px solid transparent',
          borderRight: '15px solid transparent',
          borderTop: '32px solid #C8A030',
        }} />
        {/* Pointer border */}
        <div style={{
          position: 'absolute',
          top: 0,
          width: 0, height: 0,
          borderLeft: '17px solid transparent',
          borderRight: '17px solid transparent',
          borderTop: '34px solid #7A5010',
          zIndex: -1,
        }} />
      </div>

      {/* Square container that scales the canvas responsively */}
      <div style={{ paddingTop: '100%', position: 'relative', marginTop: 28 }}>
        <canvas
          ref={canvasRef}
          width={CANVAS_SIZE}
          height={CANVAS_SIZE}
          style={{
            position: 'absolute',
            inset: 0,
            width: '100%',
            height: '100%',
            borderRadius: '50%',
            // Spin animation via CSS transform; winner is pre-calculated from totalRotation
            transform: `rotate(${totalRotation}deg)`,
            transition: isSpinning
              ? 'transform 4.5s cubic-bezier(0.23, 1, 0.32, 1)'
              : 'none',
            boxShadow: [
              '0 12px 44px rgba(0,0,0,0.7)',
              '0 3px 10px rgba(0,0,0,0.45)',
              'inset 0 0 0 3px rgba(184,121,37,0.3)',
            ].join(', '),
          }}
        />
      </div>
    </div>
  )
}

function NameInputBox({ names, inputValue, onInputChange, onRemoveName, isSpinning }) {
  return (
    <div style={{
      background: 'linear-gradient(172deg, #3C4C10 0%, #536820 48%, #3E4E12 100%)',
      border: '2px solid #222C06',
      borderRadius: '10px',
      padding: '20px',
      boxShadow: [
        '0 6px 22px rgba(18,28,4,0.65)',
        '0 2px 6px rgba(0,0,0,0.4)',
        'inset 0 1px 0 rgba(255,240,160,0.12)',
      ].join(', '),
      display: 'flex',
      flexDirection: 'column',
      gap: '12px',
    }}>
      <h3 style={{
        fontFamily: FONT_DISPLAY,
        fontWeight: 400,
        fontSize: '1.05rem',
        color: '#FFF8DC',
        textTransform: 'uppercase',
        letterSpacing: '0.07em',
        textShadow: '0 1px 4px rgba(0,0,0,0.5)',
        margin: 0,
      }}>
        Spieler
      </h3>

      <textarea
        value={inputValue}
        onChange={e => onInputChange(e.target.value)}
        disabled={isSpinning}
        placeholder={'Namen eingeben\n(je einer pro Zeile oder per Komma)'}
        rows={5}
        style={{
          width: '100%',
          boxSizing: 'border-box',
          background: 'rgba(0,0,0,0.22)',
          border: '1.5px solid rgba(184,133,37,0.3)',
          borderRadius: '7px',
          color: '#FFF7E8',
          fontFamily: FONT_BODY,
          fontSize: '0.85rem',
          fontWeight: 500,
          padding: '10px 12px',
          resize: 'vertical',
          outline: 'none',
          lineHeight: 1.55,
          opacity: isSpinning ? 0.55 : 1,
          cursor: isSpinning ? 'not-allowed' : 'text',
          transition: 'opacity 0.2s, border-color 0.15s',
        }}
        onFocus={e => { if (!isSpinning) e.target.style.borderColor = 'rgba(184,133,37,0.65)' }}
        onBlur={e => { e.target.style.borderColor = 'rgba(184,133,37,0.3)' }}
      />

      {names.length > 0 ? (
        <div style={{
          display: 'flex',
          flexDirection: 'column',
          gap: '5px',
          maxHeight: '260px',
          overflowY: 'auto',
        }}>
          {names.map((name, i) => (
            <div key={name} style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              background: 'rgba(0,0,0,0.18)',
              border: '1px solid rgba(184,133,37,0.18)',
              borderRadius: '6px',
              padding: '5px 8px 5px 10px',
            }}>
              <div style={{
                width: '9px', height: '9px',
                borderRadius: '50%',
                background: SEGMENT_COLORS[i % SEGMENT_COLORS.length],
                flexShrink: 0,
                border: '1px solid rgba(255,220,120,0.35)',
              }} />
              <span style={{
                flex: 1,
                fontFamily: FONT_BODY,
                fontSize: '0.82rem',
                fontWeight: 600,
                color: '#FFF7E8',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap',
                textShadow: '0 1px 2px rgba(0,0,0,0.4)',
              }}>
                {name}
              </span>
              <button
                onClick={() => { if (!isSpinning) onRemoveName(name) }}
                style={{
                  background: 'none',
                  border: 'none',
                  color: 'rgba(255,160,130,0.65)',
                  cursor: isSpinning ? 'default' : 'pointer',
                  fontSize: '0.85rem',
                  padding: '2px 5px',
                  lineHeight: 1,
                  borderRadius: '4px',
                  transition: 'color 0.1s, background 0.1s',
                  flexShrink: 0,
                }}
                onMouseEnter={e => {
                  if (!isSpinning) {
                    e.currentTarget.style.color = 'rgba(255,110,80,0.95)'
                    e.currentTarget.style.background = 'rgba(150,30,10,0.28)'
                  }
                }}
                onMouseLeave={e => {
                  e.currentTarget.style.color = 'rgba(255,160,130,0.65)'
                  e.currentTarget.style.background = 'none'
                }}
              >
                ✕
              </button>
            </div>
          ))}
        </div>
      ) : (
        <p style={{
          fontFamily: FONT_BODY,
          fontSize: '0.78rem',
          color: 'rgba(255,240,180,0.5)',
          fontStyle: 'italic',
          margin: 0,
          textAlign: 'center',
          padding: '8px 0',
        }}>
          Noch keine Spieler hinzugefügt
        </p>
      )}
    </div>
  )
}

function WinnerDialog({ winner, onSpinAgain, onRemoveWinner }) {
  // Shared button base styles
  const btnBase = {
    borderRadius: '7px',
    fontFamily: FONT_BODY,
    fontWeight: 800,
    fontSize: '0.75rem',
    letterSpacing: '0.07em',
    textTransform: 'uppercase',
    cursor: 'pointer',
    textShadow: '0 1px 3px rgba(0,0,0,0.45)',
    padding: '11px 22px',
    transition: 'transform 0.08s ease',
  }

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 1000,
        background: 'rgba(8,4,1,0.8)',
        backdropFilter: 'blur(6px)',
        padding: '20px',
      }}
      onClick={e => { if (e.target === e.currentTarget) onSpinAgain() }}
    >
      <div style={{
        position: 'relative',
        maxWidth: '440px',
        width: '100%',
        background: [
          'repeating-linear-gradient(88deg, transparent 0px, transparent 120px, rgba(0,0,0,0.025) 120px, rgba(0,0,0,0.025) 121px)',
          'repeating-linear-gradient(178deg, rgba(255,220,100,0.06) 0px, rgba(255,220,100,0.06) 1px, transparent 1px, transparent 22px)',
          'linear-gradient(168deg, #E0B848 0%, #C08A28 35%, #D4A838 65%, #B88020 100%)',
        ].join(', '),
        border: '10px solid #522408',
        boxShadow: [
          'inset 0 0 0 2px #8A5818',
          'inset 0 2px 8px rgba(255,200,80,0.15)',
          '0 20px 60px rgba(0,0,0,0.85)',
          '0 6px 18px rgba(0,0,0,0.55)',
        ].join(', '),
        borderRadius: '14px',
        padding: '38px 44px 34px',
        textAlign: 'center',
      }}>
        <Screw top="12px" left="14px" />
        <Screw top="12px" right="14px" />
        <Screw bottom="12px" left="14px" />
        <Screw bottom="12px" right="14px" />

        <p style={{
          fontFamily: FONT_BODY,
          fontWeight: 700,
          fontSize: '0.72rem',
          letterSpacing: '0.16em',
          textTransform: 'uppercase',
          color: '#7A4A0A',
          marginBottom: '10px',
          textShadow: '0 1px 2px rgba(255,200,80,0.2)',
        }}>
          Gewinner
        </p>

        <h2 style={{
          fontFamily: FONT_DISPLAY,
          fontWeight: 400,
          fontSize: 'clamp(1.7rem, 6vw, 2.8rem)',
          color: '#1C3808',
          textShadow: [
            '0 2px 0 rgba(255,240,150,0.22)',
            '0 -1px 0 rgba(0,0,0,0.12)',
            '2px 4px 12px rgba(0,0,0,0.35)',
          ].join(', '),
          margin: '0 0 30px',
          letterSpacing: '0.04em',
          wordBreak: 'break-word',
          lineHeight: 1.15,
        }}>
          {winner}
        </h2>

        <div style={{ display: 'flex', gap: '12px', justifyContent: 'center', flexWrap: 'wrap' }}>
          <button
            onClick={onSpinAgain}
            style={{
              ...btnBase,
              background: 'linear-gradient(175deg, #4A5E14 0%, #384A0E 100%)',
              border: '1px solid #22300A',
              borderBottom: '3px solid #1A2606',
              color: '#E8F0B0',
              boxShadow: '0 4px 10px rgba(0,0,0,0.4), inset 0 1px 0 rgba(255,255,160,0.18)',
            }}
            onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-2px)' }}
            onMouseLeave={e => { e.currentTarget.style.transform = 'none'; e.currentTarget.style.borderBottomWidth = '3px'; e.currentTarget.style.paddingTop = '11px' }}
            onMouseDown={e => { e.currentTarget.style.transform = 'translateY(2px)'; e.currentTarget.style.borderBottomWidth = '1px'; e.currentTarget.style.paddingTop = '13px' }}
            onMouseUp={e => { e.currentTarget.style.transform = 'none'; e.currentTarget.style.borderBottomWidth = '3px'; e.currentTarget.style.paddingTop = '11px' }}
          >
            ↺ Erneut drehen
          </button>

          <button
            onClick={onRemoveWinner}
            style={{
              ...btnBase,
              background: 'linear-gradient(175deg, rgba(150,35,15,0.55), rgba(110,18,8,0.7))',
              border: '1px solid rgba(110,28,10,0.55)',
              borderBottom: '3px solid rgba(70,10,4,0.65)',
              color: 'rgba(255,205,185,0.95)',
              boxShadow: 'inset 0 1px 0 rgba(255,180,160,0.12), 0 4px 10px rgba(0,0,0,0.4)',
            }}
            onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.background = 'linear-gradient(175deg, rgba(180,45,20,0.72), rgba(130,22,10,0.84))' }}
            onMouseLeave={e => { e.currentTarget.style.transform = 'none'; e.currentTarget.style.background = 'linear-gradient(175deg, rgba(150,35,15,0.55), rgba(110,18,8,0.7))'; e.currentTarget.style.borderBottomWidth = '3px'; e.currentTarget.style.paddingTop = '11px' }}
            onMouseDown={e => { e.currentTarget.style.transform = 'translateY(2px)'; e.currentTarget.style.borderBottomWidth = '1px'; e.currentTarget.style.paddingTop = '13px' }}
            onMouseUp={e => { e.currentTarget.style.transform = 'none'; e.currentTarget.style.borderBottomWidth = '3px'; e.currentTarget.style.paddingTop = '11px' }}
          >
            ✕ Spieler entfernen
          </button>
        </div>
      </div>
    </div>
  )
}

export default function WheelOfNamesView({ onBack }) {
  const [names, setNames] = useState([])
  const [inputValue, setInputValue] = useState('')
  const [isSpinning, setIsSpinning] = useState(false)
  const [selectedWinner, setSelectedWinner] = useState(null)
  // Accumulates total rotation degrees so CSS transition always animates forward
  const [totalRotation, setTotalRotation] = useState(0)
  const spinTimerRef = useRef(null)

  useEffect(() => {
    return () => { if (spinTimerRef.current) clearTimeout(spinTimerRef.current) }
  }, [])

  function handleInputChange(text) {
    setInputValue(text)
    setNames(parseNames(text))
  }

  function handleRemoveName(name) {
    const updated = names.filter(n => n !== name)
    setNames(updated)
    setInputValue(updated.join('\n'))
  }

  function spin() {
    if (isSpinning || names.length === 0) return

    setSelectedWinner(null)

    const segAngle = 360 / names.length
    const winnerIdx = Math.floor(Math.random() * names.length)

    // After CSS rotate(R deg), a canvas point at angle α (clockwise from 12 o'clock)
    // ends up at screen angle α + R. The pointer is at screen 0° (top), so:
    //   α + R ≡ 0 (mod 360)  →  R ≡ 360 - α (mod 360)
    // Use a random offset within the segment (not always dead center) for realism.
    const segOffset = 0.15 + Math.random() * 0.7
    const targetAngle = (winnerIdx + segOffset) * segAngle
    const targetMod = ((360 - targetAngle) % 360 + 360) % 360

    const currentMod = ((totalRotation % 360) + 360) % 360
    let extra = targetMod - currentMod
    if (extra <= 0) extra += 360

    // Randomise number of full spins so repeated spins look different
    const numSpins = 5 + Math.floor(Math.random() * 5)
    const newTotal = totalRotation + numSpins * 360 + extra

    setIsSpinning(true)
    setTotalRotation(newTotal)

    if (spinTimerRef.current) clearTimeout(spinTimerRef.current)
    // 4600ms = transition duration (4500ms) + small buffer
    spinTimerRef.current = setTimeout(() => {
      setIsSpinning(false)
      setSelectedWinner(names[winnerIdx])
    }, 4600)
  }

  function handleSpinAgain() {
    setSelectedWinner(null)
  }

  function handleRemoveWinner() {
    if (!selectedWinner) return
    const updated = names.filter(n => n !== selectedWinner)
    setNames(updated)
    setInputValue(updated.join('\n'))
    setSelectedWinner(null)
  }

  const spinBtnDisabled = isSpinning || names.length === 0
  const spinBtnStyle = {
    background: spinBtnDisabled
      ? 'linear-gradient(175deg, #2E3A0A 0%, #222C06 100%)'
      : 'linear-gradient(175deg, #B88C28 0%, #8A6818 100%)',
    border: '1px solid #5C400E',
    borderBottom: spinBtnDisabled ? '1px solid #402C08' : '3px solid #402C08',
    color: spinBtnDisabled ? 'rgba(200,210,140,0.45)' : '#FFF0C0',
    boxShadow: '0 4px 14px rgba(0,0,0,0.45), inset 0 1px 0 rgba(255,240,140,0.18)',
    borderRadius: '8px',
    fontFamily: FONT_BODY,
    fontWeight: 800,
    fontSize: '0.88rem',
    letterSpacing: '0.07em',
    textTransform: 'uppercase',
    cursor: spinBtnDisabled ? 'not-allowed' : 'pointer',
    textShadow: '0 1px 3px rgba(0,0,0,0.45)',
    padding: '13px 36px',
    transition: 'transform 0.08s ease',
    opacity: spinBtnDisabled ? 0.65 : 1,
  }

  return (
    <div style={{ minHeight: '100vh', background: WOOD_BG, padding: '40px 24px 56px' }}>
      <div style={{ maxWidth: '1050px', margin: '0 auto' }}>

        {/* Header — same wooden sign style as QuizList */}
        <div style={{
          position: 'relative',
          maxWidth: '720px',
          margin: '0 auto 28px',
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
          padding: '28px 56px 24px',
        }}>
          <Screw top="12px" left="14px" />
          <Screw top="12px" right="14px" />
          <Screw bottom="12px" left="14px" />
          <Screw bottom="12px" right="14px" />
          <h1 style={{
            fontFamily: FONT_DISPLAY,
            fontWeight: 400,
            fontSize: 'clamp(1.9rem, 5vw, 3rem)',
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
            Namensrad
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
            Dreh das Rad und finde den Gewinner
          </p>
        </div>

        {/* Back button row */}
        <div style={{ marginBottom: '22px' }}>
          <button
            onClick={onBack}
            style={{
              background: 'linear-gradient(175deg, #B88C28 0%, #8A6818 100%)',
              border: '1px solid #5C400E',
              borderBottom: '3px solid #402C08',
              color: '#FFF0C0',
              boxShadow: '0 4px 10px rgba(0,0,0,0.38), inset 0 1px 0 rgba(255,240,140,0.2)',
              borderRadius: '7px',
              fontFamily: FONT_BODY,
              fontWeight: 800,
              fontSize: '0.72rem',
              letterSpacing: '0.07em',
              textTransform: 'uppercase',
              cursor: 'pointer',
              textShadow: '0 1px 3px rgba(0,0,0,0.45)',
              padding: '9px 20px',
              transition: 'transform 0.08s ease',
            }}
            onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-2px)' }}
            onMouseLeave={e => { e.currentTarget.style.transform = 'none'; e.currentTarget.style.borderBottomWidth = '3px'; e.currentTarget.style.paddingTop = '9px' }}
            onMouseDown={e => { e.currentTarget.style.transform = 'translateY(2px)'; e.currentTarget.style.borderBottomWidth = '1px'; e.currentTarget.style.paddingTop = '11px' }}
            onMouseUp={e => { e.currentTarget.style.transform = 'none'; e.currentTarget.style.borderBottomWidth = '3px'; e.currentTarget.style.paddingTop = '9px' }}
          >
            ← Zurück
          </button>
        </div>

        {/* Main content: wheel (left) + name input (right) */}
        <div style={{
          display: 'flex',
          gap: '28px',
          alignItems: 'flex-start',
          flexWrap: 'wrap',
        }}>

          {/* Left column: wheel + spin button */}
          <div style={{
            flex: '1 1 300px',
            minWidth: 0,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: '22px',
          }}>
            <NameWheel
              names={names}
              totalRotation={totalRotation}
              isSpinning={isSpinning}
            />

            {names.length === 0 && !isSpinning && (
              <p style={{
                fontFamily: FONT_BODY,
                fontSize: '0.82rem',
                color: 'rgba(200,160,64,0.75)',
                fontStyle: 'italic',
                textAlign: 'center',
                textShadow: '0 1px 3px rgba(0,0,0,0.5)',
                margin: 0,
              }}>
                Füge Spieler hinzu, um das Rad zu drehen.
              </p>
            )}

            <button
              onClick={spin}
              disabled={spinBtnDisabled}
              style={spinBtnStyle}
              onMouseEnter={e => { if (!spinBtnDisabled) e.currentTarget.style.transform = 'translateY(-2px)' }}
              onMouseLeave={e => { if (!spinBtnDisabled) { e.currentTarget.style.transform = 'none'; e.currentTarget.style.borderBottomWidth = '3px'; e.currentTarget.style.paddingTop = '13px' } }}
              onMouseDown={e => { if (!spinBtnDisabled) { e.currentTarget.style.transform = 'translateY(2px)'; e.currentTarget.style.borderBottomWidth = '1px'; e.currentTarget.style.paddingTop = '15px' } }}
              onMouseUp={e => { if (!spinBtnDisabled) { e.currentTarget.style.transform = 'none'; e.currentTarget.style.borderBottomWidth = '3px'; e.currentTarget.style.paddingTop = '13px' } }}
            >
              {isSpinning ? '⟳ Dreht…' : '🎡 Rad drehen'}
            </button>
          </div>

          {/* Right column: name input */}
          <div style={{ flex: '1 1 280px', minWidth: 0 }}>
            <NameInputBox
              names={names}
              inputValue={inputValue}
              onInputChange={handleInputChange}
              onRemoveName={handleRemoveName}
              isSpinning={isSpinning}
            />
          </div>
        </div>
      </div>

      {/* Winner overlay */}
      {selectedWinner && (
        <WinnerDialog
          winner={selectedWinner}
          onSpinAgain={handleSpinAgain}
          onRemoveWinner={handleRemoveWinner}
        />
      )}
    </div>
  )
}
