import React, {useState, useEffect, useCallback} from 'react'
import Icon from './Icon'
import WindowCmp from './Window'
import StartMenu from './StartMenu'

export default function Desktop({content, windows, onOpen, onFocus, onUpdate, onClose, onMinimize}){
  // define icons with actions
    const iconsList = [
    {id:'resume', label:'My Resume', icon:(
      <svg width="56" height="56" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
        <rect x="2" y="2" width="20" height="20" rx="3" fill="#E33" />
        <text x="50%" y="55%" textAnchor="middle" fontSize="10" fontFamily="Segoe UI, Arial" fill="#fff">PDF</text>
      </svg>
    ), action:()=>onOpen('Resume')},
    {id:'projects', label:'Projects', icon:'📁', action:()=>onOpen('Projects')},
    {id:'linkedin', label:'LinkedIn', icon:(
      <svg width="56" height="56" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
        <rect x="2" y="2" width="20" height="20" rx="4" fill="#0077B5" />
        <text x="50%" y="62%" textAnchor="middle" fontSize="10" fontFamily="Segoe UI, Arial" fontWeight="700" fill="#fff">in</text>
      </svg>
    ), action:()=>onOpen('LinkedIn')},
    {id:'blog', label:'Blog', icon:'📝', action:()=>window.open(content.contact.blog,'_blank')},
    {id:'profile', label:content.profile.name, icon:(<img src={content.profile.photo} alt="profile"/>), action:()=>onOpen('About Me')}
  ]

  const [positions, setPositions] = useState({})

  // load positions from localStorage or compute default grid
  useEffect(()=>{
    const raw = localStorage.getItem('desktopPositions')
    if (raw){
      try{ setPositions(JSON.parse(raw)) }catch(e){ }
    } else {
      const p = {}
      const startX = 28, startY = 20, colGap = 110, rowGap = 110
      iconsList.forEach((it,i)=>{
        const col = i % 6
        const row = Math.floor(i/6)
        p[it.id] = {x: startX + col*colGap, y: startY + row*rowGap}
      })
      setPositions(p)
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  },[])

  const persist = useCallback((newPositions)=>{
    setPositions(newPositions)
    try{ localStorage.setItem('desktopPositions', JSON.stringify(newPositions)) }catch(e){}
  },[])

  function handleMoveEnd(id,pos){
    const next = {...positions, [id]: {x: Math.max(8, Math.min(pos.x, window.innerWidth-80)), y: Math.max(8, Math.min(pos.y, window.innerHeight-120)) }}
    persist(next)
  }

  return (
    <div className="desktop" style={{backgroundImage:'url(/assets/wallpaper.jpeg)'}}>
      <div className="icons" role="list">
        {iconsList.map(it=> (
          <Icon key={it.id} id={it.id} label={it.label} icon={it.icon} pos={positions[it.id] || {x:0,y:0}} onDoubleClick={it.action} onMoveEnd={handleMoveEnd} />
        ))}
      </div>

      {windows.map(w=> (
        <WindowCmp key={w.id} win={w} content={content} onFocus={()=>onFocus(w.id)} onClose={()=>onClose(w.id)} onMinimize={()=>onMinimize(w.id)} onUpdate={(patch)=>onUpdate(w.id,patch)} />
      ))}

      <StartMenu />
    </div>
  )
}
