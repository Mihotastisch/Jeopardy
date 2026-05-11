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

const FONT = "'Poppins', system-ui, sans-serif"

function makeNewQuestion(categoryId, quizId, position, defaultPoints) {
  return {
    id: `new-${Date.now()}-${Math.random()}`,
    category_id: categoryId,
    quiz_id: quizId,
    question_text: '',
    answer_text: '',
    points: defaultPoints,
    position,
    media_type: 'none',
    media_url: '',
    answer_media_type: 'none',
    answer_media_url: '',
    isNew: true,
  }
}

function MediaTypeRow({ label, mediaType, mediaUrl, onTypeChange, onUrlChange }) {
  const labelStyle = {
    fontFamily: FONT,
    fontWeight: 700,
    fontSize: '0.7rem',
    letterSpacing: '0.12em',
    textTransform: 'uppercase',
    color: '#263415',
    opacity: 0.7,
    display: 'block',
    marginBottom: '6px',
  }
  return (
    <div style={{ display: 'flex', gap: '12px', alignItems: 'flex-end' }}>
      <div>
        <label style={labelStyle}>{label} – Medientyp</label>
        <select
          value={mediaType}
          onChange={e => onTypeChange(e.target.value)}
          style={{
            background: 'rgba(70,45,10,0.06)',
            color: '#263415',
            fontFamily: FONT,
            fontSize: '0.85rem',
            borderRadius: '8px',
            padding: '8px 10px',
            outline: 'none',
            border: `1.5px solid #D6AF62`,
          }}
        >
          <option value="none">Kein Medium</option>
          <option value="image">Bild</option>
          <option value="video">Video</option>
        </select>
      </div>
      {mediaType !== 'none' && (
        <div style={{ flex: 1 }}>
          <label style={labelStyle}>
            {mediaType === 'image' ? 'Bild-URL' : 'Video-URL'}
          </label>
          <input
            type="text"
            value={mediaUrl}
            onChange={e => onUrlChange(e.target.value)}
            placeholder="https://…"
            style={{
              width: '100%',
              background: 'rgba(70,45,10,0.06)',
              color: '#263415',
              fontFamily: FONT,
              fontSize: '0.85rem',
              borderRadius: '8px',
              padding: '8px 10px',
              outline: 'none',
              border: `1.5px solid #D6AF62`,
              boxSizing: 'border-box',
            }}
          />
        </div>
      )}
    </div>
  )
}

function makeNewCategory(quizId, pos) {
  return {
    id: `new-cat-${Date.now()}-${Math.random()}`,
    quiz_id: quizId,
    name: 'Kategorie',
    position: pos,
    isNew: true,
  }
}

export default function QuizEditor({ quiz: initialQuiz, onBack }) {
  const isNew = !initialQuiz
  const [title, setTitle] = useState(initialQuiz?.title ?? '')
  const [description, setDescription] = useState(initialQuiz?.description ?? '')
  const [creatorName, setCreatorName] = useState(initialQuiz?.creator_name ?? '')
  const [categories, setCategories] = useState([])
  const [questions, setQuestions] = useState([])
  const [quizId, setQuizId] = useState(initialQuiz?.id ?? null)
  const [rowDefaults, setRowDefaults] = useState([100, 200, 300, 400, 500])
  const [saving, setSaving] = useState(false)
  const [saveError, setSaveError] = useState(null)
  const [loaded, setLoaded] = useState(false)
  const [editingQuestion, setEditingQuestion] = useState(null)
  const [editingCatId, setEditingCatId] = useState(null)
  const [draggingCell, setDraggingCell] = useState(null)
  const [dragOverCell, setDragOverCell] = useState(null)
  const [isDirty, setIsDirty] = useState(false)
  const [showBackConfirm, setShowBackConfirm] = useState(false)

  useEffect(() => {
    if (!isNew && initialQuiz?.id) loadData(initialQuiz.id)
    else setLoaded(true)
  }, [])

  async function loadData(id) {
    const [catRes, qRes] = await Promise.all([
      supabase.from('categories').select('*').eq('quiz_id', id).order('position'),
      supabase.from('questions').select('*').eq('quiz_id', id).order('position'),
    ])
    const cats = catRes.data || []
    const qs = qRes.data || []
    setCategories(cats)
    setQuestions(qs)

    const maxPos = qs.length > 0 ? Math.max(...qs.map(q => q.position)) : 4
    const rows = Array.from({ length: Math.max(maxPos + 1, 5) }, (_, i) => {
      const q = qs.find(q => q.position === i)
      return q ? q.points : (i + 1) * 100
    })
    setRowDefaults(rows)
    setLoaded(true)
  }

  const rowCount = rowDefaults.length

  function getQuestion(catId, rowIdx) {
    return questions.find(q => q.category_id === catId && q.position === rowIdx)
  }

  function addRow() {
    const last = rowDefaults[rowDefaults.length - 1] ?? 0
    setRowDefaults(prev => [...prev, last + 100])
    setIsDirty(true)
  }

  function removeRow(rowIdx) {
    if (questions.some(q => q.position === rowIdx)) return
    setRowDefaults(prev => prev.filter((_, i) => i !== rowIdx))
    setQuestions(prev => prev.map(q => q.position > rowIdx ? { ...q, position: q.position - 1 } : q))
    setIsDirty(true)
  }

  function updateRowDefault(rowIdx, value) {
    setRowDefaults(prev => prev.map((v, i) => i === rowIdx ? value : v))
    setIsDirty(true)
  }

  function addCategory() {
    setCategories(prev => [...prev, makeNewCategory(quizId, prev.length)])
    setIsDirty(true)
  }

  function removeCategory(catId) {
    if (!confirm('Kategorie und alle Fragen darin löschen?')) return
    setCategories(prev => prev.filter(c => c.id !== catId))
    setQuestions(prev => prev.filter(q => q.category_id !== catId))
    setIsDirty(true)
  }

  function updateCategoryName(catId, name) {
    setCategories(prev => prev.map(c => c.id === catId ? { ...c, name } : c))
    setIsDirty(true)
  }

  function handleCellClick(cat, rowIdx) {
    const existing = getQuestion(cat.id, rowIdx)
    setEditingQuestion(existing
      ? { ...existing }
      : makeNewQuestion(cat.id, quizId, rowIdx, rowDefaults[rowIdx] ?? (rowIdx + 1) * 100)
    )
  }

  function saveEditingQuestion() {
    setQuestions(prev => {
      const filtered = prev.filter(q => q.id !== editingQuestion.id)
      return [...filtered, editingQuestion]
    })
    setIsDirty(true)
    setEditingQuestion(null)
  }

  function deleteEditingQuestion() {
    setQuestions(prev => prev.filter(q => q.id !== editingQuestion.id))
    setIsDirty(true)
    setEditingQuestion(null)
  }

  function handleDragStart(e, catId, rowIdx) {
    e.dataTransfer.effectAllowed = 'move'
    setDraggingCell({ catId, rowIdx })
  }

  function handleDragOver(e, catId, rowIdx) {
    e.preventDefault()
    e.dataTransfer.dropEffect = 'move'
    if (dragOverCell?.catId !== catId || dragOverCell?.rowIdx !== rowIdx) {
      setDragOverCell({ catId, rowIdx })
    }
  }

  function handleDrop(e, targetCatId, targetRowIdx) {
    e.preventDefault()
    if (!draggingCell) return
    const { catId: srcCatId, rowIdx: srcRowIdx } = draggingCell
    if (srcCatId === targetCatId && srcRowIdx === targetRowIdx) {
      setDraggingCell(null)
      setDragOverCell(null)
      return
    }
    const srcQ = getQuestion(srcCatId, srcRowIdx)
    const tgtQ = getQuestion(targetCatId, targetRowIdx)
    setQuestions(prev => {
      const others = prev.filter(q => q.id !== srcQ?.id && q.id !== tgtQ?.id)
      if (srcQ) {
        const usesDefault = srcQ.points === rowDefaults[srcRowIdx]
        others.push({ ...srcQ, category_id: targetCatId, position: targetRowIdx, points: usesDefault ? (rowDefaults[targetRowIdx] ?? srcQ.points) : srcQ.points })
      }
      if (tgtQ) {
        const usesDefault = tgtQ.points === rowDefaults[targetRowIdx]
        others.push({ ...tgtQ, category_id: srcCatId, position: srcRowIdx, points: usesDefault ? (rowDefaults[srcRowIdx] ?? tgtQ.points) : tgtQ.points })
      }
      return others
    })
    setDraggingCell(null)
    setDragOverCell(null)
    setIsDirty(true)
  }

  function handleDragEnd() {
    setDraggingCell(null)
    setDragOverCell(null)
  }

  async function save() {
    if (!title.trim()) return alert('Bitte Titel eingeben')
    if (!creatorName.trim()) return alert('Bitte Ersteller-Name eingeben')
    setSaving(true)
    setSaveError(null)

    try {
      let currentQuizId = quizId

      if (isNew || !currentQuizId) {
        const { data, error } = await supabase
          .from('quizzes')
          .insert({ title: title.trim(), description: description.trim(), creator_name: creatorName.trim() })
          .select().single()
        if (error) throw error
        currentQuizId = data.id
        setQuizId(currentQuizId)
      } else {
        const { error } = await supabase
          .from('quizzes')
          .update({ title: title.trim(), description: description.trim(), creator_name: creatorName.trim() })
          .eq('id', currentQuizId)
        if (error) throw error
      }

      const catIdMap = {}
      for (let i = 0; i < categories.length; i++) {
        const cat = { ...categories[i], quiz_id: currentQuizId, position: i }
        if (cat.isNew) {
          const { id: _, isNew: __, ...toInsert } = cat
          const { data, error } = await supabase.from('categories').insert(toInsert).select().single()
          if (error) throw error
          catIdMap[cat.id] = data.id
        } else {
          const { error } = await supabase.from('categories').update({ name: cat.name, position: i }).eq('id', cat.id)
          if (error) throw error
          catIdMap[cat.id] = cat.id
        }
      }

      if (!isNew) {
        const allKeptDbIds = Object.values(catIdMap)
        const { data: dbCats } = await supabase.from('categories').select('id').eq('quiz_id', currentQuizId)
        const toDelete = (dbCats || []).filter(c => !allKeptDbIds.includes(c.id))
        for (const c of toDelete) await supabase.from('categories').delete().eq('id', c.id)
      }

      const keptQIds = []
      for (const q of questions) {
        const resolvedCatId = catIdMap[q.category_id] || q.category_id
        const toSave = { ...q, category_id: resolvedCatId, quiz_id: currentQuizId }
        if (q.isNew) {
          const { id: _, isNew: __, ...toInsert } = toSave
          const { data, error } = await supabase.from('questions').insert(toInsert).select('id').single()
          if (error) throw error
          keptQIds.push(data.id)
        } else {
          const { isNew: _, id: qid, ...toUpdate } = toSave
          const { error } = await supabase.from('questions').update(toUpdate).eq('id', qid)
          if (error) throw error
          keptQIds.push(qid)
        }
      }

      if (!isNew) {
        const { data: dbQs } = await supabase.from('questions').select('id').eq('quiz_id', currentQuizId)
        const toDelete = (dbQs || []).filter(q => !keptQIds.includes(q.id))
        for (const q of toDelete) await supabase.from('questions').delete().eq('id', q.id)
      }

      setIsDirty(false)
      onBack()
    } catch (err) {
      setSaveError(err.message)
    } finally {
      setSaving(false)
    }
  }

  if (!loaded) {
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
        Lade…
      </div>
    )
  }

  return (
    <div style={{
      background: T.outerBg,
      minHeight: '100vh',
      display: 'flex',
      flexDirection: 'column',
      padding: '10px 14px 14px',
      gap: '8px',
    }}>

      {/* Top nav */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '0 4px', flexShrink: 0 }}>
        <button
          onClick={() => isDirty ? setShowBackConfirm(true) : onBack()}
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
            flexShrink: 0,
          }}
        >
          ← Zurück
        </button>
        <input
          type="text"
          value={title}
          onChange={e => { setTitle(e.target.value); setIsDirty(true) }}
          placeholder="Quiz-Titel…"
          style={{
            flex: 1,
            background: 'transparent',
            color: T.textLight,
            fontFamily: FONT,
            fontWeight: 900,
            fontSize: 'clamp(1rem, 2.5vw, 1.6rem)',
            outline: 'none',
            border: 'none',
            borderBottom: `2px solid ${T.goldLine}`,
            letterSpacing: '0.08em',
            textTransform: 'uppercase',
            paddingBottom: '3px',
          }}
        />
        <button
          onClick={save}
          disabled={saving}
          style={{
            background: saving ? 'rgba(124,139,46,0.4)' : 'radial-gradient(circle at 30% 25%, #7C8B2E, #34460F)',
            color: T.textLight,
            border: `1px solid ${T.cardBorder}`,
            fontFamily: FONT,
            fontWeight: 800,
            fontSize: '0.75rem',
            letterSpacing: '0.1em',
            textTransform: 'uppercase',
            padding: '8px 18px',
            borderRadius: '8px',
            cursor: saving ? 'not-allowed' : 'pointer',
            flexShrink: 0,
            boxShadow: CELL_SHADOW,
          }}
        >
          {saving ? 'Speichert…' : 'Speichern'}
        </button>
      </div>

      {/* Meta strip */}
      <div style={{ display: 'flex', gap: '16px', padding: '0 4px', flexShrink: 0 }}>
        <input
          type="text"
          value={creatorName}
          onChange={e => { setCreatorName(e.target.value); setIsDirty(true) }}
          placeholder="Ersteller *"
          style={{
            background: 'transparent',
            color: T.goldLine,
            fontFamily: FONT,
            fontSize: '0.75rem',
            outline: 'none',
            border: 'none',
            borderBottom: `1px solid rgba(183,139,61,0.4)`,
            width: '140px',
            paddingBottom: '2px',
          }}
        />
        <input
          type="text"
          value={description}
          onChange={e => { setDescription(e.target.value); setIsDirty(true) }}
          placeholder="Beschreibung (optional)"
          style={{
            background: 'transparent',
            color: T.goldLine,
            fontFamily: FONT,
            fontSize: '0.75rem',
            outline: 'none',
            border: 'none',
            borderBottom: `1px solid rgba(183,139,61,0.4)`,
            flex: 1,
            paddingBottom: '2px',
          }}
        />
      </div>

      {saveError && (
        <div style={{
          background: 'rgba(200,50,50,0.15)',
          border: '1px solid rgba(200,50,50,0.4)',
          color: '#ff9999',
          fontFamily: FONT,
          fontSize: '0.8rem',
          padding: '8px 12px',
          borderRadius: '8px',
          flexShrink: 0,
        }}>
          Fehler: {saveError}
        </div>
      )}

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
        padding: '14px 18px 16px',
        overflow: 'hidden',
      }}>

        {/* Control buttons */}
        <div style={{ display: 'flex', gap: '8px', marginBottom: '12px', flexShrink: 0 }}>
          <button
            onClick={addCategory}
            style={{
              background: 'radial-gradient(circle at 30% 25%, #7C8B2E, #34460F)',
              color: T.textLight,
              border: `1px solid ${T.cardBorder}`,
              fontFamily: FONT,
              fontWeight: 700,
              fontSize: '0.72rem',
              letterSpacing: '0.08em',
              textTransform: 'uppercase',
              padding: '6px 14px',
              borderRadius: '8px',
              cursor: 'pointer',
              boxShadow: CELL_SHADOW,
            }}
          >
            + Kategorie
          </button>
          <button
            onClick={addRow}
            style={{
              background: 'linear-gradient(145deg, #F8EBCB, #E7CA82)',
              color: T.textDark,
              border: `1px solid ${T.cardBorder}`,
              fontFamily: FONT,
              fontWeight: 700,
              fontSize: '0.72rem',
              letterSpacing: '0.08em',
              textTransform: 'uppercase',
              padding: '6px 14px',
              borderRadius: '8px',
              cursor: 'pointer',
              boxShadow: CELL_SHADOW,
            }}
          >
            + Reihe
          </button>
        </div>

        {categories.length === 0 ? (
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
            Füge eine Kategorie hinzu, um zu beginnen.
          </div>
        ) : (
          <div
            style={{
              flex: 1,
              minHeight: 0,
              display: 'grid',
              gridTemplateColumns: `64px repeat(${categories.length}, minmax(0, 1fr))`,
              gridTemplateRows: `auto repeat(${rowCount}, 1fr)`,
              gap: '6px',
              overflow: 'auto',
            }}
          >
            {/* Corner */}
            <div style={{ background: 'rgba(38,52,21,0.15)', borderRadius: '8px' }} />

            {/* Category headers */}
            {categories.map((cat, ci) => {
              const col = COL_STYLES[ci % COL_STYLES.length]
              return (
                <div
                  key={cat.id}
                  style={{
                    background: col.gradient,
                    borderRadius: '8px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '4px',
                    padding: '8px 6px',
                    boxShadow: CELL_SHADOW,
                    minHeight: '56px',
                  }}
                >
                  {editingCatId === cat.id ? (
                    <input
                      autoFocus
                      value={cat.name}
                      onChange={e => updateCategoryName(cat.id, e.target.value)}
                      onBlur={() => setEditingCatId(null)}
                      onKeyDown={e => e.key === 'Enter' && setEditingCatId(null)}
                      style={{
                        flex: 1,
                        background: 'rgba(0,0,0,0.2)',
                        color: col.text,
                        fontFamily: FONT,
                        fontWeight: 800,
                        fontSize: '0.7rem',
                        textTransform: 'uppercase',
                        letterSpacing: '0.06em',
                        textAlign: 'center',
                        outline: 'none',
                        border: 'none',
                        borderRadius: '4px',
                        padding: '2px 4px',
                      }}
                    />
                  ) : (
                    <span
                      onClick={() => setEditingCatId(cat.id)}
                      title="Klicken zum Umbenennen"
                      style={{
                        flex: 1,
                        color: col.text,
                        fontFamily: FONT,
                        fontWeight: 800,
                        fontSize: 'clamp(0.45rem, 1vw, 0.72rem)',
                        textTransform: 'uppercase',
                        letterSpacing: '0.08em',
                        textAlign: 'center',
                        cursor: 'pointer',
                        textShadow: '0 1px 3px rgba(0,0,0,0.4)',
                        lineHeight: 1.2,
                      }}
                    >
                      {cat.name}
                    </span>
                  )}
                  <button
                    onClick={() => removeCategory(cat.id)}
                    title="Kategorie löschen"
                    style={{
                      color: 'rgba(255,255,255,0.4)',
                      background: 'none',
                      border: 'none',
                      fontSize: '0.65rem',
                      cursor: 'pointer',
                      flexShrink: 0,
                      lineHeight: 1,
                      padding: '2px',
                      fontFamily: FONT,
                    }}
                  >✕</button>
                </div>
              )
            })}

            {/* Rows */}
            {Array.from({ length: rowCount }, (_, rowIdx) => {
              const hasQuestions = questions.some(q => q.position === rowIdx)
              return [
                // Row label
                <div
                  key={`label-${rowIdx}`}
                  style={{
                    background: 'radial-gradient(circle at 30% 25%, #4F5F16, #2A3C10)',
                    borderRadius: '8px',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '4px',
                    boxShadow: CELL_SHADOW,
                    padding: '4px',
                  }}
                >
                  <input
                    type="number"
                    value={rowDefaults[rowIdx] ?? ''}
                    onChange={e => updateRowDefault(rowIdx, parseInt(e.target.value) || 0)}
                    title="Standardpunkte für diese Reihe"
                    style={{
                      width: '52px',
                      background: 'transparent',
                      color: T.textLight,
                      fontFamily: FONT,
                      fontWeight: 800,
                      fontSize: '0.9rem',
                      textAlign: 'center',
                      outline: 'none',
                      border: 'none',
                      borderBottom: '1px solid rgba(255,255,255,0.3)',
                    }}
                  />
                  {!hasQuestions && rowCount > 1 && (
                    <button
                      onClick={() => removeRow(rowIdx)}
                      title="Reihe entfernen"
                      style={{
                        color: 'rgba(255,255,255,0.3)',
                        background: 'none',
                        border: 'none',
                        fontSize: '0.65rem',
                        cursor: 'pointer',
                        fontFamily: FONT,
                        lineHeight: 1,
                      }}
                    >✕</button>
                  )}
                </div>,

                // Question cells
                ...categories.map((cat, ci) => {
                  const q = getQuestion(cat.id, rowIdx)
                  const isFilled = q && (q.question_text || q.answer_text)
                  const col = COL_STYLES[ci % COL_STYLES.length]
                  const isDraggingThis = draggingCell?.catId === cat.id && draggingCell?.rowIdx === rowIdx
                  const isDragOver = dragOverCell?.catId === cat.id && dragOverCell?.rowIdx === rowIdx
                  return (
                    <button
                      key={`${cat.id}-${rowIdx}`}
                      draggable={!!isFilled}
                      onClick={() => !draggingCell && handleCellClick(cat, rowIdx)}
                      onDragStart={e => handleDragStart(e, cat.id, rowIdx)}
                      onDragOver={e => handleDragOver(e, cat.id, rowIdx)}
                      onDrop={e => handleDrop(e, cat.id, rowIdx)}
                      onDragEnd={handleDragEnd}
                      style={{
                        background: isFilled ? col.gradient : 'rgba(38,52,21,0.08)',
                        border: isDragOver
                          ? `2px solid ${T.frameLight}`
                          : isFilled ? 'none' : `1px dashed rgba(183,139,61,0.35)`,
                        borderRadius: '8px',
                        boxShadow: isDragOver
                          ? `0 0 0 3px ${T.goldLine}, ${CELL_SHADOW}`
                          : isFilled ? CELL_SHADOW : 'none',
                        cursor: isFilled ? 'grab' : 'pointer',
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '4px',
                        padding: '4px',
                        width: '100%',
                        height: '100%',
                        opacity: isDraggingThis ? 0.35 : 1,
                        transition: 'transform 0.12s ease, box-shadow 0.12s ease, opacity 0.12s ease',
                      }}
                      onMouseEnter={e => {
                        if (isDraggingThis) return
                        if (isFilled) {
                          e.currentTarget.style.transform = 'translateY(-2px) scale(1.01)'
                          e.currentTarget.style.boxShadow = CELL_SHADOW_HOVER
                        } else {
                          e.currentTarget.style.background = 'rgba(38,52,21,0.15)'
                        }
                      }}
                      onMouseLeave={e => {
                        e.currentTarget.style.transform = 'none'
                        e.currentTarget.style.boxShadow = isDragOver ? `0 0 0 3px ${T.goldLine}, ${CELL_SHADOW}` : isFilled ? CELL_SHADOW : 'none'
                        e.currentTarget.style.background = isFilled ? col.gradient : 'rgba(38,52,21,0.08)'
                      }}
                    >
                      {isFilled ? (
                        <>
                          <span style={{
                            color: T.textLight,
                            fontFamily: FONT,
                            fontWeight: 800,
                            fontSize: 'clamp(0.7rem, 1.5vw, 1.1rem)',
                            textShadow: '0 1px 3px rgba(0,0,0,0.35)',
                            letterSpacing: '0.02em',
                          }}>
                            {q.points}
                          </span>
                          <span style={{
                            color: 'rgba(255,255,255,0.75)',
                            fontFamily: FONT,
                            fontSize: 'clamp(0.4rem, 0.75vw, 0.6rem)',
                            textAlign: 'center',
                            lineHeight: 1.3,
                            padding: '0 4px',
                            overflow: 'hidden',
                            display: '-webkit-box',
                            WebkitLineClamp: 2,
                            WebkitBoxOrient: 'vertical',
                          }}>
                            {q.question_text}
                          </span>
                        </>
                      ) : (
                        <span style={{
                          color: 'rgba(183,139,61,0.5)',
                          fontSize: '1.4rem',
                          fontFamily: FONT,
                          fontWeight: 300,
                          lineHeight: 1,
                        }}>+</span>
                      )}
                    </button>
                  )
                }),
              ]
            })}
          </div>
        )}
      </div>

      {/* Unsaved changes confirmation */}
      {showBackConfirm && (
        <div style={{
          position: 'fixed',
          inset: 0,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 60,
          padding: '24px',
          background: 'rgba(0,0,0,0.7)',
        }}>
          <div style={{
            background: T.boardBg,
            border: `6px solid ${T.frameDark}`,
            boxShadow: `inset 0 0 0 2px ${T.frameLight}, 0 24px 60px rgba(0,0,0,0.7)`,
            borderRadius: '18px',
            width: '100%',
            maxWidth: '420px',
            padding: '28px 28px 22px',
            display: 'flex',
            flexDirection: 'column',
            gap: '18px',
          }}>
            <div style={{
              fontFamily: FONT,
              fontWeight: 900,
              fontSize: '1rem',
              color: T.textDark,
              letterSpacing: '0.04em',
              textTransform: 'uppercase',
            }}>
              Ungespeicherte Änderungen
            </div>
            <div style={{
              fontFamily: FONT,
              fontSize: '0.88rem',
              color: T.textDark,
              opacity: 0.75,
              lineHeight: 1.55,
            }}>
              Du hast Änderungen vorgenommen, die noch nicht gespeichert wurden. Wenn du jetzt zurückgehst, gehen sie verloren.
            </div>
            <div style={{ display: 'flex', gap: '10px' }}>
              <button
                onClick={() => setShowBackConfirm(false)}
                style={{
                  flex: 1,
                  background: 'transparent',
                  color: T.textDark,
                  border: `1.5px solid ${T.goldLine}`,
                  fontFamily: FONT,
                  fontWeight: 700,
                  fontSize: '0.78rem',
                  letterSpacing: '0.08em',
                  textTransform: 'uppercase',
                  padding: '10px',
                  borderRadius: '8px',
                  cursor: 'pointer',
                }}
              >
                Weiter bearbeiten
              </button>
              <button
                onClick={async () => {
                  setShowBackConfirm(false)
                  await save()
                }}
                disabled={saving}
                style={{
                  flex: 1,
                  background: saving ? 'rgba(124,139,46,0.4)' : 'radial-gradient(circle at 30% 25%, #7C8B2E, #34460F)',
                  color: T.textLight,
                  border: `1px solid ${T.cardBorder}`,
                  fontFamily: FONT,
                  fontWeight: 800,
                  fontSize: '0.78rem',
                  letterSpacing: '0.08em',
                  textTransform: 'uppercase',
                  padding: '10px',
                  borderRadius: '8px',
                  cursor: saving ? 'not-allowed' : 'pointer',
                  boxShadow: CELL_SHADOW,
                }}
              >
                {saving ? 'Speichert…' : 'Speichern & zurück'}
              </button>
              <button
                onClick={() => { setShowBackConfirm(false); onBack() }}
                style={{
                  flex: 1,
                  background: 'rgba(180,40,40,0.1)',
                  color: '#c0392b',
                  border: '1px solid rgba(180,40,40,0.3)',
                  fontFamily: FONT,
                  fontWeight: 700,
                  fontSize: '0.78rem',
                  letterSpacing: '0.08em',
                  textTransform: 'uppercase',
                  padding: '10px',
                  borderRadius: '8px',
                  cursor: 'pointer',
                }}
              >
                Verlassen
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Question Modal */}
      {editingQuestion && (
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
          onClick={e => e.target === e.currentTarget && setEditingQuestion(null)}
        >
          <div style={{
            background: T.boardBg,
            border: `6px solid ${T.frameDark}`,
            boxShadow: `inset 0 0 0 2px ${T.frameLight}, 0 24px 60px rgba(0,0,0,0.7)`,
            borderRadius: '18px',
            width: '100%',
            maxWidth: '580px',
            maxHeight: '88vh',
            overflowY: 'auto',
          }}>
            {/* Modal header */}
            <div style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              padding: '14px 22px',
              borderBottom: `2px solid ${T.goldLine}`,
              background: 'rgba(70,45,10,0.06)',
              borderRadius: '10px 10px 0 0',
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <span style={{
                  fontFamily: FONT,
                  fontWeight: 700,
                  color: T.textDark,
                  fontSize: '0.85rem',
                  letterSpacing: '0.06em',
                  opacity: 0.7,
                }}>
                  Punkte:
                </span>
                <input
                  type="number"
                  value={editingQuestion.points}
                  onChange={e => setEditingQuestion(prev => ({ ...prev, points: parseInt(e.target.value) || 0 }))}
                  style={{
                    width: '72px',
                    background: 'radial-gradient(circle at 30% 25%, #4F5F16, #2A3C10)',
                    color: T.textLight,
                    fontFamily: FONT,
                    fontWeight: 800,
                    fontSize: '1.1rem',
                    textAlign: 'center',
                    borderRadius: '8px',
                    padding: '6px 8px',
                    outline: 'none',
                    border: `1px solid ${T.cardBorder}`,
                  }}
                />
              </div>
              <button
                onClick={() => setEditingQuestion(null)}
                style={{
                  color: 'rgba(38,52,21,0.45)',
                  background: 'none',
                  border: 'none',
                  fontSize: '1.3rem',
                  cursor: 'pointer',
                  lineHeight: 1,
                  fontFamily: FONT,
                }}
              >✕</button>
            </div>

            <div style={{ padding: '22px', display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div>
                <label style={{
                  fontFamily: FONT,
                  fontWeight: 700,
                  fontSize: '0.7rem',
                  letterSpacing: '0.12em',
                  textTransform: 'uppercase',
                  color: T.textDark,
                  opacity: 0.7,
                  display: 'block',
                  marginBottom: '6px',
                }}>Frage</label>
                <textarea
                  value={editingQuestion.question_text}
                  onChange={e => setEditingQuestion(prev => ({ ...prev, question_text: e.target.value }))}
                  rows={3}
                  placeholder="Fragetext…"
                  style={{
                    width: '100%',
                    background: 'rgba(70,45,10,0.06)',
                    color: T.textDark,
                    fontFamily: FONT,
                    fontSize: '0.9rem',
                    borderRadius: '10px',
                    padding: '12px 14px',
                    outline: 'none',
                    border: `1.5px solid ${T.cardBorder}`,
                    resize: 'none',
                    boxSizing: 'border-box',
                    lineHeight: 1.5,
                  }}
                />
              </div>

              <MediaTypeRow
                label="Frage"
                mediaType={editingQuestion.media_type ?? 'none'}
                mediaUrl={editingQuestion.media_url ?? ''}
                onTypeChange={v => setEditingQuestion(prev => ({ ...prev, media_type: v }))}
                onUrlChange={v => setEditingQuestion(prev => ({ ...prev, media_url: v }))}
              />

              <div>
                <label style={{
                  fontFamily: FONT,
                  fontWeight: 700,
                  fontSize: '0.7rem',
                  letterSpacing: '0.12em',
                  textTransform: 'uppercase',
                  color: T.textDark,
                  opacity: 0.7,
                  display: 'block',
                  marginBottom: '6px',
                }}>Antwort</label>
                <textarea
                  value={editingQuestion.answer_text}
                  onChange={e => setEditingQuestion(prev => ({ ...prev, answer_text: e.target.value }))}
                  rows={2}
                  placeholder="Antworttext…"
                  style={{
                    width: '100%',
                    background: 'rgba(183,139,61,0.1)',
                    color: T.textDark,
                    fontFamily: FONT,
                    fontSize: '0.9rem',
                    borderRadius: '10px',
                    padding: '12px 14px',
                    outline: 'none',
                    border: `1.5px solid ${T.cardBorder}`,
                    resize: 'none',
                    boxSizing: 'border-box',
                    lineHeight: 1.5,
                  }}
                />
              </div>

              <MediaTypeRow
                label="Antwort"
                mediaType={editingQuestion.answer_media_type ?? 'none'}
                mediaUrl={editingQuestion.answer_media_url ?? ''}
                onTypeChange={v => setEditingQuestion(prev => ({ ...prev, answer_media_type: v }))}
                onUrlChange={v => setEditingQuestion(prev => ({ ...prev, answer_media_url: v }))}
              />

              <div style={{ display: 'flex', gap: '10px', paddingTop: '4px' }}>
                {!editingQuestion.isNew && (
                  <button
                    onClick={deleteEditingQuestion}
                    style={{
                      background: 'rgba(180,40,40,0.1)',
                      color: '#c0392b',
                      border: '1px solid rgba(180,40,40,0.3)',
                      fontFamily: FONT,
                      fontWeight: 700,
                      fontSize: '0.8rem',
                      padding: '10px 16px',
                      borderRadius: '8px',
                      cursor: 'pointer',
                    }}
                  >
                    Löschen
                  </button>
                )}
                <button
                  onClick={() => setEditingQuestion(null)}
                  style={{
                    flex: 1,
                    background: 'transparent',
                    color: T.textDark,
                    border: `1.5px solid ${T.goldLine}`,
                    fontFamily: FONT,
                    fontWeight: 700,
                    fontSize: '0.82rem',
                    letterSpacing: '0.08em',
                    textTransform: 'uppercase',
                    padding: '10px',
                    borderRadius: '8px',
                    cursor: 'pointer',
                  }}
                >
                  Abbrechen
                </button>
                <button
                  onClick={saveEditingQuestion}
                  style={{
                    flex: 1,
                    background: 'radial-gradient(circle at 30% 25%, #7C8B2E, #34460F)',
                    color: T.textLight,
                    border: `1px solid ${T.cardBorder}`,
                    fontFamily: FONT,
                    fontWeight: 700,
                    fontSize: '0.82rem',
                    letterSpacing: '0.08em',
                    textTransform: 'uppercase',
                    padding: '10px',
                    borderRadius: '8px',
                    cursor: 'pointer',
                    boxShadow: CELL_SHADOW,
                  }}
                >
                  Übernehmen
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
