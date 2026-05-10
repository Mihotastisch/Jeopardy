import { useState, useEffect } from 'react'
import { supabase } from '../supabase'

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
    isNew: true,
  }
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
  // rowDefaults[i] = default point value for row i (editable label, not a constraint)
  const [rowDefaults, setRowDefaults] = useState([100, 200, 300, 400, 500])
  const [saving, setSaving] = useState(false)
  const [saveError, setSaveError] = useState(null)
  const [loaded, setLoaded] = useState(false)
  const [editingQuestion, setEditingQuestion] = useState(null)
  const [editingCatId, setEditingCatId] = useState(null)

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

    // Build row defaults from existing questions' points per position
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
  }

  function removeRow(rowIdx) {
    if (questions.some(q => q.position === rowIdx)) return
    setRowDefaults(prev => prev.filter((_, i) => i !== rowIdx))
    // Shift down positions of questions below this row
    setQuestions(prev => prev.map(q => q.position > rowIdx ? { ...q, position: q.position - 1 } : q))
  }

  function updateRowDefault(rowIdx, value) {
    setRowDefaults(prev => prev.map((v, i) => i === rowIdx ? value : v))
  }

  function addCategory() {
    setCategories(prev => [...prev, makeNewCategory(quizId, prev.length)])
  }

  function removeCategory(catId) {
    if (!confirm('Kategorie und alle Fragen darin löschen?')) return
    setCategories(prev => prev.filter(c => c.id !== catId))
    setQuestions(prev => prev.filter(q => q.category_id !== catId))
  }

  function updateCategoryName(catId, name) {
    setCategories(prev => prev.map(c => c.id === catId ? { ...c, name } : c))
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
    setEditingQuestion(null)
  }

  function deleteEditingQuestion() {
    setQuestions(prev => prev.filter(q => q.id !== editingQuestion.id))
    setEditingQuestion(null)
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

      // Upsert categories
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

      // Delete removed categories
      if (!isNew) {
        const allKeptDbIds = Object.values(catIdMap)
        const { data: dbCats } = await supabase.from('categories').select('id').eq('quiz_id', currentQuizId)
        const toDelete = (dbCats || []).filter(c => !allKeptDbIds.includes(c.id))
        for (const c of toDelete) await supabase.from('categories').delete().eq('id', c.id)
      }

      // Upsert questions (flat, position is already set per question)
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

      // Delete removed questions
      if (!isNew) {
        const { data: dbQs } = await supabase.from('questions').select('id').eq('quiz_id', currentQuizId)
        const toDelete = (dbQs || []).filter(q => !keptQIds.includes(q.id))
        for (const q of toDelete) await supabase.from('questions').delete().eq('id', q.id)
      }

      onBack()
    } catch (err) {
      setSaveError(err.message)
    } finally {
      setSaving(false)
    }
  }

  if (!loaded) {
    return (
      <div className="min-h-screen bg-[#f0e6d0] flex items-center justify-center text-[#5a4a30] text-xl">
        Lade…
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#f0e6d0] flex flex-col">

      {/* Top bar */}
      <div className="bg-[#e8ddc8] border-b border-[#c4b48e] px-6 py-3 flex items-center gap-4">
        <button onClick={onBack} className="text-[#5a4a30] hover:text-[#1a1508] text-sm font-medium shrink-0">
          ← Zurück
        </button>
        <input
          type="text"
          value={title}
          onChange={e => setTitle(e.target.value)}
          placeholder="Quiz-Titel…"
          className="flex-1 bg-transparent text-[#1a1508] font-black text-xl outline-none border-b-2 border-transparent focus:border-[#4a5c30] transition-colors uppercase tracking-wide"
          style={{ fontFamily: "'Playfair Display', Georgia, serif", letterSpacing: '0.08em', fontWeight: 900 }}
        />
        <button
          onClick={save}
          disabled={saving}
          className="bg-[#4a5c30] hover:bg-[#3a4c20] disabled:opacity-50 text-white font-bold px-6 py-2 rounded-lg text-sm transition-all shrink-0 uppercase tracking-wide"
        >
          {saving ? 'Speichert…' : '💾 Speichern'}
        </button>
      </div>

      {saveError && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-6 py-3 text-sm">
          Fehler: {saveError}
        </div>
      )}

      {/* Meta row */}
      <div className="bg-[#ece0c8] border-b border-[#c4b48e] px-6 py-3 flex gap-4">
        <input
          type="text"
          value={creatorName}
          onChange={e => setCreatorName(e.target.value)}
          placeholder="Ersteller *"
          className="bg-transparent text-[#3a2e1a] text-sm outline-none border-b border-transparent focus:border-[#4a5c30] transition-colors w-40"
        />
        <input
          type="text"
          value={description}
          onChange={e => setDescription(e.target.value)}
          placeholder="Beschreibung (optional)"
          className="bg-transparent text-[#3a2e1a] text-sm outline-none border-b border-transparent focus:border-[#4a5c30] transition-colors flex-1"
        />
      </div>

      {/* Board area */}
      <div className="flex-1 min-h-0 p-4 overflow-auto">
        <div className="h-full flex flex-col">

          <div className="flex gap-3 mb-3 shrink-0">
            <button
              onClick={addCategory}
              className="bg-[#4a5c30] hover:bg-[#3a4c20] text-white font-bold px-4 py-2 rounded-lg text-sm transition-all"
            >
              + Kategorie
            </button>
            <button
              onClick={addRow}
              className="bg-[#faf5e8] hover:bg-[#ede3c8] text-[#4a5c30] font-bold px-4 py-2 rounded-lg text-sm transition-all border border-[#c4b48e]"
            >
              + Reihe
            </button>
          </div>

          {categories.length === 0 ? (
            <div className="flex-1 flex items-center justify-center text-[#8a7860]">
              Füge eine Kategorie hinzu, um zu beginnen.
            </div>
          ) : (
            <div
              className="flex-1 min-h-0 rounded-2xl overflow-hidden border-2 border-[#c4b48e] shadow-xl"
              style={{
                display: 'grid',
                gridTemplateColumns: `80px repeat(${categories.length}, minmax(0, 1fr))`,
                gridTemplateRows: `auto repeat(${rowCount}, 1fr)`,
              }}
            >
              {/* Corner */}
              <div className="bg-[#3a4c20] border-r border-b border-[#2a3c10]" />

              {/* Category headers */}
              {categories.map((cat, ci) => (
                <div
                  key={cat.id}
                  className={`bg-[#4a5c30] flex items-center gap-1 px-2 py-3 ${ci < categories.length - 1 ? 'border-r border-[#3a4c20]' : ''}`}
                >
                  {editingCatId === cat.id ? (
                    <input
                      autoFocus
                      value={cat.name}
                      onChange={e => updateCategoryName(cat.id, e.target.value)}
                      onBlur={() => setEditingCatId(null)}
                      onKeyDown={e => e.key === 'Enter' && setEditingCatId(null)}
                      className="flex-1 bg-[#3a4c20] text-white font-black text-sm uppercase tracking-wide text-center outline-none rounded px-1"
                      style={{ fontFamily: 'Georgia, serif' }}
                    />
                  ) : (
                    <span
                      className="flex-1 text-white font-black text-xs uppercase tracking-widest text-center cursor-pointer hover:text-yellow-200 transition-colors truncate"
                      style={{ fontFamily: "'Oswald', 'Arial Narrow', sans-serif", letterSpacing: '0.08em' }}
                      onClick={() => setEditingCatId(cat.id)}
                      title="Klicken zum Umbenennen"
                    >
                      {cat.name}
                    </span>
                  )}
                  <button
                    onClick={() => removeCategory(cat.id)}
                    className="text-white/40 hover:text-red-300 text-xs shrink-0 transition-colors"
                    title="Kategorie löschen"
                  >✕</button>
                </div>
              ))}

              {/* Rows */}
              {Array.from({ length: rowCount }, (_, rowIdx) => {
                const isLast = rowIdx === rowCount - 1
                const hasQuestions = questions.some(q => q.position === rowIdx)
                return [
                  // Row label (editable default points)
                  <div
                    key={`label-${rowIdx}`}
                    className={`bg-[#4a5c30] flex flex-col items-center justify-center gap-1 border-r border-[#3a4c20] ${!isLast ? 'border-b border-[#3a4c20]' : ''}`}
                  >
                    <input
                      type="number"
                      value={rowDefaults[rowIdx] ?? ''}
                      onChange={e => updateRowDefault(rowIdx, parseInt(e.target.value) || 0)}
                      className="w-14 bg-transparent text-white font-black text-base text-center outline-none border-b border-white/30 focus:border-white transition-colors"
                      style={{ fontFamily: 'Georgia, serif' }}
                      title="Standardpunkte für diese Reihe"
                    />
                    {!hasQuestions && rowCount > 1 && (
                      <button
                        onClick={() => removeRow(rowIdx)}
                        className="text-white/30 hover:text-red-300 text-xs transition-colors"
                        title="Reihe entfernen"
                      >✕</button>
                    )}
                  </div>,

                  // Question cells
                  ...categories.map((cat, ci) => {
                    const q = getQuestion(cat.id, rowIdx)
                    const isFilled = q && (q.question_text || q.answer_text)
                    return (
                      <button
                        key={`${cat.id}-${rowIdx}`}
                        onClick={() => handleCellClick(cat, rowIdx)}
                        className={`
                          w-full h-full text-sm transition-all font-medium flex flex-col items-center justify-center gap-1
                          ${ci < categories.length - 1 ? 'border-r' : ''} ${!isLast ? 'border-b' : ''}
                          border-[#d4c8a8]
                          ${isFilled
                            ? 'bg-[#faf5e8] hover:bg-[#f0e6cc] text-[#2a1f0e]'
                            : 'bg-[#f5f0e4] hover:bg-[#ede3c8] text-[#8a7860]'}
                        `}
                      >
                        {isFilled ? (
                          <>
                            <span
                              className="font-black text-lg text-[#4a5c30]"
                              style={{ fontFamily: 'Georgia, serif' }}
                            >
                              {q.points}
                            </span>
                            <span className="px-2 text-xs text-center line-clamp-2 text-[#5a4a30]">
                              {q.question_text}
                            </span>
                          </>
                        ) : (
                          <span className="text-2xl text-[#c4b48e] hover:text-[#4a5c30] transition-colors">+</span>
                        )}
                      </button>
                    )
                  }),
                ]
              })}
            </div>
          )}
        </div>
      </div>

      {/* Edit Question Modal */}
      {editingQuestion && (
        <div
          className="fixed inset-0 bg-black/30 flex items-center justify-center z-50 p-4"
          onClick={e => e.target === e.currentTarget && setEditingQuestion(null)}
        >
          <div className="bg-[#faf5e8] border-2 border-[#c4b48e] rounded-2xl w-full max-w-lg shadow-2xl">
            <div className="bg-[#4a5c30] rounded-t-2xl px-6 py-4 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <span className="text-white/70 text-sm font-medium">Punkte:</span>
                <input
                  type="number"
                  value={editingQuestion.points}
                  onChange={e => setEditingQuestion(prev => ({ ...prev, points: parseInt(e.target.value) || 0 }))}
                  className="w-20 bg-[#3a4c20] text-white font-black text-lg text-center rounded-lg px-2 py-1 outline-none border border-[#2a3c10] focus:border-yellow-300"
                  style={{ fontFamily: 'Georgia, serif' }}
                />
              </div>
              <button onClick={() => setEditingQuestion(null)} className="text-white/60 hover:text-white text-xl">✕</button>
            </div>

            <div className="p-6 flex flex-col gap-4">
              <div>
                <label className="text-[#5a4a30] text-xs font-bold uppercase tracking-wide block mb-1">Frage</label>
                <textarea
                  value={editingQuestion.question_text}
                  onChange={e => setEditingQuestion(prev => ({ ...prev, question_text: e.target.value }))}
                  rows={3}
                  placeholder="Fragetext…"
                  className="w-full bg-[#f0e8d0] text-[#1a1508] rounded-lg p-3 text-sm border border-[#c4b48e] focus:border-[#4a5c30] outline-none resize-none"
                />
              </div>
              <div>
                <label className="text-[#5a4a30] text-xs font-bold uppercase tracking-wide block mb-1">Antwort</label>
                <textarea
                  value={editingQuestion.answer_text}
                  onChange={e => setEditingQuestion(prev => ({ ...prev, answer_text: e.target.value }))}
                  rows={2}
                  placeholder="Antworttext…"
                  className="w-full bg-[#eef4e0] text-[#1a1508] rounded-lg p-3 text-sm border border-[#b8c8a0] focus:border-[#4a5c30] outline-none resize-none"
                />
              </div>
              <div className="flex gap-3 items-end">
                <div>
                  <label className="text-[#5a4a30] text-xs font-bold uppercase tracking-wide block mb-1">Medientyp</label>
                  <select
                    value={editingQuestion.media_type}
                    onChange={e => setEditingQuestion(prev => ({ ...prev, media_type: e.target.value }))}
                    className="bg-[#f0e8d0] text-[#1a1508] rounded-lg p-2 text-sm border border-[#c4b48e] focus:border-[#4a5c30] outline-none"
                  >
                    <option value="none">Kein Medium</option>
                    <option value="image">Bild</option>
                    <option value="video">Video</option>
                  </select>
                </div>
                {editingQuestion.media_type !== 'none' && (
                  <div className="flex-1">
                    <label className="text-[#5a4a30] text-xs font-bold uppercase tracking-wide block mb-1">
                      {editingQuestion.media_type === 'image' ? 'Bild-URL' : 'Video-URL'}
                    </label>
                    <input
                      type="text"
                      value={editingQuestion.media_url}
                      onChange={e => setEditingQuestion(prev => ({ ...prev, media_url: e.target.value }))}
                      placeholder="https://…"
                      className="w-full bg-[#f0e8d0] text-[#1a1508] rounded-lg p-2 text-sm border border-[#c4b48e] focus:border-[#4a5c30] outline-none"
                    />
                  </div>
                )}
              </div>

              <div className="flex gap-3 pt-2">
                {!editingQuestion.isNew && (
                  <button
                    onClick={deleteEditingQuestion}
                    className="bg-red-50 hover:bg-red-100 text-red-600 border border-red-200 font-bold px-4 py-2 rounded-lg text-sm transition-all"
                  >
                    🗑 Löschen
                  </button>
                )}
                <button
                  onClick={() => setEditingQuestion(null)}
                  className="flex-1 bg-[#e8ddc8] hover:bg-[#ddd0b4] text-[#1a1508] font-bold py-2 rounded-lg text-sm transition-all border border-[#c4b48e]"
                >
                  Abbrechen
                </button>
                <button
                  onClick={saveEditingQuestion}
                  className="flex-1 bg-[#4a5c30] hover:bg-[#3a4c20] text-white font-bold py-2 rounded-lg text-sm transition-all"
                >
                  ✓ Übernehmen
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
