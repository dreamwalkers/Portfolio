import React, {useState, useEffect, useCallback, useRef} from 'react'
import Icon from './Icon'
import WindowCmp from './Window'
import StartMenu from './StartMenu'
import { useTheme } from '../ThemeProvider'
 

export default function Desktop({content, windows, onOpen, onFocus, onUpdate, onClose, onMinimize}){
  const { isMobile } = useTheme()
  console.log('[Desktop] isMobile=', isMobile)
  // define icons with actions
    const iconsList = [
      {id:'xp-pong', label:'XP Pong', icon:(
        <svg width="56" height="56" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
          <rect x="2" y="2" width="20" height="20" rx="4" fill="#0b63b3" />
          <circle cx="8" cy="12" r="2.2" fill="#fff" />
          <rect x="14" y="9" width="4" height="6" rx="1" fill="#fff" />
        </svg>
      ), action:()=>onOpen('XP Pong')},

      {id:'trivia-quiz', label:'Trivia Quiz', icon:(
        <svg width="56" height="56" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
          <rect x="2" y="2" width="20" height="20" rx="4" fill="#37a234" />
          <text x="50%" y="55%" textAnchor="middle" fontSize="10" fontFamily="Segoe UI, Arial" fill="#fff">TQ</text>
        </svg>
      ), action:()=>onOpen('Trivia Quiz')},

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

  // icon order for Android grid (reorderable). Initialize from localStorage if present.
  const [iconsOrder, setIconsOrder] = useState(()=>{
    try{
      const raw = localStorage.getItem('androidIconsOrder')
      if (raw) return JSON.parse(raw)
    }catch(e){}
    return iconsList.map(i=>i.id)
  })

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

  const dateStr = new Date().toLocaleDateString(undefined, { weekday: 'long', month: 'short', day: 'numeric' })

  const iconsRef = useRef(null)
  const dockRef = useRef(null)
  const focusSinkRef = useRef(null)
  const [dockVisible, setDockVisible] = useState(true)
  const [showDock, setShowDock] = useState(false)

  // select dock icons (prefer certain ids if present)
  const preferredDock = ['profile','resume','projects','linkedin']
  const dockIcons = preferredDock.map(id => iconsList.find(i=>i.id===id)).filter(Boolean)

  useEffect(()=>{
    if (isMobile && iconsRef.current){
      // ensure icons grid starts at top so first rows are visible
      iconsRef.current.scrollTop = 0
    }
  },[isMobile])

  // inert helper with fallback: if browser supports element.inert, use it.
  function setInert(el, inert){
    if (!el) return
    try{
      if ('inert' in HTMLElement.prototype){
        el.inert = inert
        return
      }
    }catch(e){}
    // fallback: toggle aria-hidden and disable focusable descendants
    if (inert){
      el.setAttribute('aria-hidden','true')
      const focusables = el.querySelectorAll('a,button,input,select,textarea,[tabindex]')
      focusables.forEach(f=>{
        const prev = f.getAttribute('tabindex')
        if (prev !== null) f.setAttribute('data-prev-tabindex', prev)
        f.setAttribute('tabindex','-1')
      })
    } else {
      el.removeAttribute('aria-hidden')
      const focusables = el.querySelectorAll('[data-prev-tabindex]')
      focusables.forEach(f=>{
        const prev = f.getAttribute('data-prev-tabindex')
        if (prev !== null) f.setAttribute('tabindex', prev)
        f.removeAttribute('data-prev-tabindex')
      })
      // also restore any that were set to -1 but had no data-prev (best effort)
      const maybes = el.querySelectorAll('[tabindex="-1"]')
      maybes.forEach(f=>{
        if (!f.hasAttribute('data-prev-tabindex')) f.removeAttribute('tabindex')
      })
    }
  }

  // hide dock while user scrolls; move focus to a hidden sink before hiding to avoid aria-hidden on focused element
  useEffect(()=>{
    if (!iconsRef.current || !dockRef.current) return undefined
    let timeout = null
    function onScroll(){
      // if already hidden, refresh timeout
      if (dockVisible){
        // move focus away from dock if it's focused
        const active = document.activeElement
        if (dockRef.current.contains(active)){
          // focus the sink
          try{ focusSinkRef.current && focusSinkRef.current.focus() }catch(e){}
        }
        // apply inert to dock
        setInert(dockRef.current, true)
        setDockVisible(false)
      }
      clearTimeout(timeout)
      timeout = setTimeout(()=>{
        // on scroll end, restore dock
        setInert(dockRef.current, false)
        setDockVisible(true)
      }, 450)
    }
    const el = iconsRef.current
    el.addEventListener('scroll', onScroll, {passive:true})
    return ()=>{ el.removeEventListener('scroll', onScroll); clearTimeout(timeout) }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  },[iconsRef.current, dockRef.current])

  // touch gesture: swipe up from near the bottom to reveal the dock
  useEffect(()=>{
    if (!iconsRef.current) return undefined
    let startY = 0, startX = 0, startTime = 0, tracking = false
    function onTouchStart(e){
      if (!e.touches || e.touches.length === 0) return
      const t = e.touches[0]
      startY = t.clientY
      startX = t.clientX
      startTime = Date.now()
      // only begin tracking if touch starts near the bottom (within 140px)
      tracking = (startY > window.innerHeight - 140)
    }
    function onTouchMove(e){
      if (!tracking) return
      // nothing to do here for now; we could provide feedback
    }
    function onTouchEnd(e){
      if (!tracking) return
      const endTime = Date.now()
      const dt = endTime - startTime
      // if there are changedTouches, use the last one
      const t = (e.changedTouches && e.changedTouches[0]) || (e.touches && e.touches[0])
      const endY = t ? t.clientY : 0
      const endX = t ? t.clientX : 0
      const deltaY = endY - startY
      const deltaX = endX - startX
      // detect an upward swipe with reasonable threshold and not too slow
      if (deltaY < -40 && Math.abs(deltaX) < 60 && dt < 700){
        // reveal the dock (user intent)
        try{ setShowDock(true) }catch(e){}
      }
      tracking = false
    }
    const el = iconsRef.current
    el.addEventListener('touchstart', onTouchStart, {passive:true})
    el.addEventListener('touchmove', onTouchMove, {passive:true})
    el.addEventListener('touchend', onTouchEnd, {passive:true})
    return ()=>{
      el.removeEventListener('touchstart', onTouchStart)
      el.removeEventListener('touchmove', onTouchMove)
      el.removeEventListener('touchend', onTouchEnd)
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  },[iconsRef.current])

  // ensure inert state follows combined visibility (showDock && dockVisible)
  useEffect(()=>{
    if (!dockRef.current) return
    const visible = !!(showDock && dockVisible)
    setInert(dockRef.current, !visible)
  },[showDock, dockVisible])

  useEffect(()=>{
    // log icon count for debugging
    try{ console.log('[Desktop] icons count=', iconsList.length) }catch(e){}
  // eslint-disable-next-line react-hooks/exhaustive-deps
  },[])

  // persist iconsOrder when it changes
  useEffect(()=>{
    try{ localStorage.setItem('androidIconsOrder', JSON.stringify(iconsOrder)) }catch(e){}
  },[iconsOrder])

  // keep the desktop wallpaper consistent across devices; show profile photo only inside the About window
  const wallpaper = '/assets/wallpaper.jpeg'

  return (
    <div className="desktop" style={{backgroundImage:`url(${wallpaper})`}}>
      {isMobile ? (
        <>
          <header className="android-header">
            <div className="time">{new Date().toLocaleTimeString([], {hour:'2-digit', minute:'2-digit'})}</div>
            <div className="date">{dateStr}</div>
          </header>

          <div className="android-widgets">
            <div className="widget card">
              <div className="widget-left">
                <div className="weather-emoji">🌙</div>
                <div className="weather-temp">23°</div>
              </div>
              <div className="widget-meta">
                <div className="place">Kale Township</div>
                <div className="updated">Updated 11/25 6:26 PM</div>
              </div>
            </div>
            <div className="widget card">
              <div className="large-number">30</div>
              <div className="small-meta">days left<br/><strong>Christmas Day</strong></div>
            </div>
          </div>

          <div className="android-search">
            <div className="g-pill">
              <div className="g-logo">G</div>
              <div className="g-input">Search</div>
              <div className="g-mic">🎤</div>
            </div>
          </div>

          <div ref={iconsRef} className="icons android-grid">
            {iconsOrder.map(id => {
              const it = iconsList.find(x=>x.id===id) || iconsList[0]
              return (
                <div key={it.id}
                     className={"card app-card"}
                     role="button"
                     draggable
                     onDragStart={(e)=>{ e.dataTransfer.setData('text/plain', it.id); e.dataTransfer.effectAllowed = 'move'; e.currentTarget.classList.add('dragging') }}
                     onDragOver={(e)=>{ e.preventDefault(); e.currentTarget.classList.add('drag-over') }}
                     onDragLeave={(e)=>{ e.currentTarget.classList.remove('drag-over') }}
                     onDrop={(e)=>{
                       e.preventDefault();
                       const dragId = e.dataTransfer.getData('text/plain')
                       const dropId = it.id
                       if (dragId && dragId !== dropId){
                         const next = [...iconsOrder]
                         const from = next.indexOf(dragId)
                         const to = next.indexOf(dropId)
                         if (from > -1 && to > -1){
                           next.splice(from,1)
                           next.splice(to,0,dragId)
                           setIconsOrder(next)
                         }
                       }
                       // cleanup classes
                       const cards = iconsRef.current && iconsRef.current.querySelectorAll('.card')
                       cards && cards.forEach(c=>{ c.classList.remove('drag-over'); c.classList.remove('dragging') })
                     }}
                     onDragEnd={(e)=>{ e.currentTarget.classList.remove('dragging'); const cards = iconsRef.current && iconsRef.current.querySelectorAll('.card'); cards && cards.forEach(c=>c.classList.remove('drag-over')) }}
                     onClick={it.action}
                     tabIndex={0}>
                  <div className="card-icon">{it.icon}</div>
                  <div className="card-body"><div className="label">{it.label}</div></div>
                </div>
              )
            })}
          </div>

          <div className="page-indicator">
            <span className="dot active" />
            <span className="dot" />
            <span className="dot" />
          </div>

          {/* android dock must not be aria-hidden while its buttons can receive focus */}
          <nav className={"android-dock" + (showDock && dockVisible ? '' : ' hidden')} ref={dockRef} aria-hidden={(showDock && dockVisible) ? 'false' : 'true'}>
            <div className="dock-tray">
              {dockIcons.map((d,i)=> (
                <button key={d.id} className="dock-btn" onClick={d.action} aria-label={d.label}>
                  <div className="dock-icon">{d.icon}</div>
                </button>
              ))}
            </div>
            <div className="home-pill" />
          </nav>
          {/* floating toggle to show/hide dock */}
          <button className="dock-toggle" onClick={()=>setShowDock(s=>!s)} aria-pressed={showDock} aria-label={showDock ? 'Hide dock' : 'Show dock'}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M12 5v14" stroke="#334" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" opacity={showDock?1:0.6}/><path d="M5 12h14" stroke="#334" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" opacity={showDock?0.6:1}/></svg>
          </button>
          {/* hidden focus sink used when moving focus away from dock before hiding it */}
          <button ref={focusSinkRef} aria-hidden="true" tabIndex={-1} style={{position:'absolute',left:-9999,top:-9999,width:1,height:1,border:0,padding:0,opacity:0}}>.</button>
        </>
      ) : (
        <div className="icons" role="list">
          {iconsList.map(it=> (
            <Icon key={it.id} id={it.id} label={it.label} icon={it.icon} pos={positions[it.id] || {x:0,y:0}} onDoubleClick={it.action} onMoveEnd={handleMoveEnd} />
          ))}
        </div>
      )}

      {windows.map(w=> (
        <WindowCmp key={w.id} win={w} content={content} onFocus={()=>onFocus(w.id)} onClose={()=>onClose(w.id)} onMinimize={()=>onMinimize(w.id)} onUpdate={(patch)=>onUpdate(w.id,patch)} onOpen={(title)=>onOpen(title)} />
      ))}

      {!isMobile && <StartMenu />}
    </div>
  )
    }


