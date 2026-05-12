import { useState } from 'react'
import QuizList from './components/QuizList'
import QuizEditor from './components/QuizEditor'
import GameBoard from './components/GameBoard'
import WheelOfNamesView from './components/WheelOfNames'

export default function App() {
  const [view, setView] = useState('list')
  const [selectedQuiz, setSelectedQuiz] = useState(null)

  function goBack() {
    setView('list')
    setSelectedQuiz(null)
  }

  if (view === 'editor') {
    return <QuizEditor quiz={selectedQuiz} onBack={goBack} />
  }

  if (view === 'game') {
    return <GameBoard quiz={selectedQuiz} onBack={goBack} />
  }

  if (view === 'wheel') {
    return <WheelOfNamesView onBack={goBack} />
  }

  return (
    <QuizList
      onPlay={quiz => { setSelectedQuiz(quiz); setView('game') }}
      onEdit={quiz => { setSelectedQuiz(quiz); setView('editor') }}
      onCreate={() => { setSelectedQuiz(null); setView('editor') }}
      onWheel={() => setView('wheel')}
    />
  )
}
