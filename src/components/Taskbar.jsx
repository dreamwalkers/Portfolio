import React, {useState, useEffect} from 'react'
import { useTheme } from '../ThemeProvider'

function StartButton({onClick}){
  return (
    <button className="start-button" onClick={onClick} aria-label="Start menu">
      <span className="start-flag" aria-hidden dangerouslySetInnerHTML={{__html: `
        <svg width="18" height="14" viewBox="0 0 18 14" xmlns="http://www.w3.org/2000/svg">
          <g fill="none" fill-rule="evenodd">
            <rect fill="#FF0000" x="0" y="0" width="8" height="6" rx="0"/>
            <rect fill="#00A200" x="0" y="6" width="8" height="8" rx="0"/>
            <rect fill="#00A2FF" x="8" y="0" width="10" height="6" rx="0"/>
            <rect fill="#FFD200" x="8" y="6" width="10" height="8" rx="0"/>
          </g>
        </svg>
      `}} />
      <span className="start-text">start</span>
    </button>
  )
}

function Tray(){
  const [time,setTime] = useState(new Date())
  useEffect(()=>{
    const t = setInterval(()=>setTime(new Date()),1000)
    return ()=> clearInterval(t)
  },[])
  return (
    <div className="tray-box" role="status" aria-live="polite">
      <div className="tray-icon" title="Volume">🔊</div>
      <div className="tray-icon" title="Network">🌐</div>
      <div className="clock">{time.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</div>
    </div>
  )
}

export default function Taskbar({windows,onOpen,onRestore,onFocus}){
  const [showStart,setShowStart] = useState(false)
  const { isMobile } = useTheme()

  if (isMobile) {
    // on mobile we render a dock inside Desktop; hide the XP taskbar
    return null
  }

  return (
    <div className="taskbar">
      <div className="left">
        <StartButton onClick={()=>setShowStart(s=>!s)} />
        {showStart && (
          <div className="start-menu">
            <div onClick={()=>{onOpen('About Me'); setShowStart(false)}}>About Me</div>
            <div onClick={()=>{onOpen('Experience'); setShowStart(false)}}>Experience</div>
            <div onClick={()=>{onOpen('Skills'); setShowStart(false)}}>Skills</div>
            <div onClick={()=>{onOpen('Projects'); setShowStart(false)}}>Projects</div>
            <div onClick={()=>{onOpen('Contact'); setShowStart(false)}}>Contact</div>
          </div>
        )}
      </div>
      <div className="center">
        {windows.map(w=> (
          <button key={w.id} className={`task-button ${w.minimized? 'min': ''}`} onClick={()=> w.minimized? onRestore(w.id) : onFocus(w.id)}>{w.title}</button>
        ))}
      </div>
      <div className="right"><Tray /></div>
    </div>
  )
}
