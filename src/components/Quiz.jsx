import React, { useState, useEffect } from 'react'
import QUESTIONS from '../quiz-questions'

export default function Quiz(){
  const [index, setIndex] = useState(0)
  const [selected, setSelected] = useState(null)
  const [score, setScore] = useState(0)
  const [finished, setFinished] = useState(false)
  const [shuffled, setShuffled] = useState([])

  useEffect(()=>{
    // Shuffle questions for a fresh run
    const q = QUESTIONS.slice()
    for(let i=q.length-1;i>0;i--){ const j = Math.floor(Math.random()*(i+1)); [q[i],q[j]]=[q[j],q[i]] }
    setShuffled(q)
  },[])

  useEffect(()=>{ setSelected(null) },[index])

  function handleNext(){
    if (selected == null) return
    const correct = shuffled[index].answer === selected
    if (correct) setScore(s=>s+1)
    const next = index + 1
    if (next >= shuffled.length){
      setFinished(true)
    } else {
      setIndex(next)
    }
  }

  function handleRestart(){
    setIndex(0); setScore(0); setFinished(false); setSelected(null)
    const q = QUESTIONS.slice()
    for(let i=q.length-1;i>0;i--){ const j = Math.floor(Math.random()*(i+1)); [q[i],q[j]]=[q[j],q[i]] }
    setShuffled(q)
  }

  if (!shuffled.length) return <div>Loading...</div>

  if (finished){
    return (
      <div className="quiz-end" style={{textAlign:'center'}}>
        <h3>Quiz Complete</h3>
        <div style={{fontSize:18,fontWeight:700}}>{score} / {shuffled.length}</div>
        <div style={{marginTop:12}}>
          <button className="xp-btn primary" onClick={handleRestart}>Restart</button>
        </div>
      </div>
    )
  }

  const q = shuffled[index]

  return (
    <div className="quiz-root">
      <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:8}}>
        <div style={{fontWeight:700}}>{q.category}</div>
        <div style={{fontSize:13}}>Question {index+1} / {shuffled.length}</div>
      </div>
      <div className="quiz-question" style={{marginBottom:12}}>{q.question}</div>
      <div className="quiz-choices" role="list">
        {q.options.map((opt,i)=> (
          <div key={i} className={`quiz-choice ${selected===i? 'selected':''}`} onClick={()=>setSelected(i)} role="listitem">
            <div className="choice-letter">{String.fromCharCode(65 + i)}</div>
            <div className="choice-text">{opt}</div>
          </div>
        ))}
      </div>
      <div style={{marginTop:12,display:'flex',gap:8,justifyContent:'flex-end'}}>
        <button className="xp-btn" onClick={()=>{ setSelected(null); if (index>0) setIndex(index-1) }} disabled={index===0}>Back</button>
        <button className="xp-btn" onClick={()=>{ setFinished(true) }} style={{marginRight: 'auto'}}>Quit</button>
        <button className="xp-btn primary" onClick={handleNext} disabled={selected==null}>Next</button>
      </div>
    </div>
  )
}
