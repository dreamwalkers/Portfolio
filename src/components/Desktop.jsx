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
  const dragSrcRef = useRef(null)
  const [dockVisible, setDockVisible] = useState(true)
  const [showDock, setShowDock] = useState(false)
  // always show lockscreen on mobile reloads (do not persist unlocked state)
  const [mobileLocked, setMobileLocked] = useState(() => {
    try{
      return !!isMobile
    }catch(e){ return true }
  })
  const [unlocking, setUnlocking] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const lockOverlayRef = useRef(null)
  const lockTouchRef = useRef({startY:0,startX:0,startTime:0,tracking:false})

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

  // if not mobile, ensure lock state is disabled
  useEffect(()=>{
    if (!isMobile){ setMobileLocked(false); setUnlocking(false) }
  },[isMobile])

  function doUnlock(){
    if (!mobileLocked) return
    setUnlocking(true)
    setTimeout(()=>{
      // do not persist unlocked state so lockscreen appears on each reload
      setMobileLocked(false)
      setUnlocking(false)
      try{ if (lockOverlayRef.current) lockOverlayRef.current.style.transform = '' }catch(e){}
    }, 420)
  }

  function handleLockTouchStart(e){
    if (!mobileLocked || unlocking) return
    const t = (e.touches && e.touches[0]) || null
    const y = t ? t.clientY : (e.clientY || 0)
    const x = t ? t.clientX : (e.clientX || 0)
    lockTouchRef.current.startY = y
    lockTouchRef.current.startX = x
    lockTouchRef.current.startTime = Date.now()
    lockTouchRef.current.tracking = (y > window.innerHeight - 180)
    // add visual tracking class and subtle haptic feedback if available
    try{ if (lockOverlayRef.current) lockOverlayRef.current.classList.add('tracking') }catch(e){}
    try{ if (navigator && navigator.vibrate) navigator.vibrate(10) }catch(e){}
  }

  function handleLockTouchMove(e){
    if (!lockTouchRef.current.tracking) return
    const t = (e.touches && e.touches[0]) || null
    const y = t ? t.clientY : (e.clientY || 0)
    const deltaY = Math.min(0, y - lockTouchRef.current.startY)
    try{ if (lockOverlayRef.current) lockOverlayRef.current.style.transform = `translateY(${deltaY}px)` }catch(e){}
  }

  function handleLockTouchEnd(e){
    if (!lockTouchRef.current.tracking) return
    const t = (e.changedTouches && e.changedTouches[0]) || null
    const y = t ? t.clientY : (e.clientY || 0)
    const x = t ? t.clientX : (e.clientX || 0)
    const dt = Date.now() - lockTouchRef.current.startTime
    const deltaY = y - lockTouchRef.current.startY
    const deltaX = x - lockTouchRef.current.startX
    if (deltaY < -80 && Math.abs(deltaX) < 120 && dt < 900){
      doUnlock()
    } else {
      try{ if (lockOverlayRef.current) lockOverlayRef.current.style.transform = '' }catch(e){}
    }
    // remove tracking class
    try{ if (lockOverlayRef.current) lockOverlayRef.current.classList.remove('tracking') }catch(e){}
    lockTouchRef.current.tracking = false
  }

  function handleLockMouseDown(e){
    if (!mobileLocked || unlocking) return
    lockTouchRef.current.startY = e.clientY || 0
    lockTouchRef.current.startX = e.clientX || 0
    lockTouchRef.current.startTime = Date.now()
    lockTouchRef.current.tracking = (lockTouchRef.current.startY > window.innerHeight - 180)
    try{ if (lockOverlayRef.current) lockOverlayRef.current.classList.add('tracking') }catch(e){}
    try{ if (navigator && navigator.vibrate) navigator.vibrate(10) }catch(e){}
    window.addEventListener('mousemove', handleLockMouseMove)
    window.addEventListener('mouseup', handleLockMouseUp)
  }

  function handleLockMouseMove(e){
    if (!lockTouchRef.current.tracking) return
    const deltaY = Math.min(0, e.clientY - lockTouchRef.current.startY)
    try{ if (lockOverlayRef.current) lockOverlayRef.current.style.transform = `translateY(${deltaY}px)` }catch(e){}
  }

  function handleLockMouseUp(e){
    if (!lockTouchRef.current.tracking) return
    const dt = Date.now() - lockTouchRef.current.startTime
    const deltaY = e.clientY - lockTouchRef.current.startY
    const deltaX = e.clientX - lockTouchRef.current.startX
    if (deltaY < -80 && Math.abs(deltaX) < 120 && dt < 900){
      doUnlock()
    } else {
      try{ if (lockOverlayRef.current) lockOverlayRef.current.style.transform = '' }catch(e){}
    }
    try{ if (lockOverlayRef.current) lockOverlayRef.current.classList.remove('tracking') }catch(e){}
    lockTouchRef.current.tracking = false
    window.removeEventListener('mousemove', handleLockMouseMove)
    window.removeEventListener('mouseup', handleLockMouseUp)
  }

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

  // compute which icons to show based on search query
  const qLower = (searchQuery || '').trim().toLowerCase()
  // defensive: ensure iconsOrder is an array (in case localStorage was corrupted)
  const baseIcons = Array.isArray(iconsOrder) ? iconsOrder : (iconsOrder ? Object.keys(iconsOrder) : [])
  if (!Array.isArray(iconsOrder)) console.warn('[Desktop] iconsOrder is not an array, using fallback keys', iconsOrder)
  const shownIcons = qLower ? baseIcons.filter(id => {
    const it = iconsList.find(x=>x.id===id)
    return it && it.label && it.label.toLowerCase().includes(qLower)
  }) : baseIcons
  // defensive: ensure we render an array
  let shownList = []
  if (Array.isArray(shownIcons)) shownList = shownIcons
  else if (shownIcons && typeof shownIcons === 'object') shownList = Object.values(shownIcons)
  else shownList = []
  if (!Array.isArray(shownIcons)) console.warn('[Desktop] shownIcons coerced to array', shownIcons)

  return (
    <div className="desktop" style={{backgroundImage:`url(${wallpaper})`}}>
      {isMobile ? (
        <>
         {/* Mobile lock screen overlay shown on first visit */}
          {mobileLocked && (
            <div
              ref={lockOverlayRef}
              className={"android-lockscreen" + (unlocking ? ' unlocking' : '')}
              style={{backgroundImage: `url(${(content && content.profile && content.profile.photo) || '/assets/wallpaper.jpeg'})`}}
              onTouchStart={handleLockTouchStart} onTouchMove={handleLockTouchMove} onTouchEnd={handleLockTouchEnd}
              onMouseDown={handleLockMouseDown}
              role="button" aria-label="Unlock">
              <div className="ls-top">
                <div className="ls-date">{dateStr}</div>
                <div className="ls-weather">🌤 58°F</div>
              </div>
              <div className="ls-time">{new Date().toLocaleTimeString([], {hour:'2-digit', minute:'2-digit'})}</div>
              <div className="ls-handle" aria-hidden="true">
                <div className="ls-handle-bar" />
                <div className="ls-handle-arrow">▲</div>
              </div>
              <div className="ls-lock">
                <div className="ls-lock-circle">🔓</div>
              </div>
              <div className="ls-bottom">
                <div className="ls-left">🏠</div>
                <div className="ls-note">Kept unlocked by Smart Lock</div>
                <div className="ls-right">▦</div>
              </div>
            </div>
          )}
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
              <input className="g-input" value={searchQuery} onChange={e=>setSearchQuery(e.target.value)} placeholder="Search" aria-label="Search apps" />
              <button className="g-mic" aria-label="Voice search">🎤</button>
            </div>
          </div>

          <div ref={iconsRef} className="icons android-grid">
            {shownList.map(id => {
              const it = iconsList.find(x=>x.id===id) || iconsList[0]
              return (
                <div key={it.id}
                     className={"card app-card"}
                     data-id={it.id}
                     role="button"
                     draggable
                     onDragStart={(e)=>{
                       try{ e.dataTransfer.setData('text/plain', it.id); e.dataTransfer.effectAllowed = 'move'; }catch(err){}
                       dragSrcRef.current = it.id
                       e.currentTarget.classList.add('dragging')
                     }}
                     onTouchStart={(e)=>{
                       // begin touch-based drag: record source id and add dragging class
                       dragSrcRef.current = it.id
                       try{ e.currentTarget.classList.add('dragging') }catch(e){}
                     }}
                     onTouchEnd={(e)=>{
                       // detect where the touch ended and perform swap if over another card
                       try{
                         const t = (e.changedTouches && e.changedTouches[0]) || null
                         if (!t) return
                         const el = document.elementFromPoint(t.clientX, t.clientY)
                         if (!el) return
                         // find nearest card ancestor
                         const card = el.closest && el.closest('.card')
                         const dropId = card && card.getAttribute && card.getAttribute('data-id')
                         const dragId = dragSrcRef.current
                         if (dragId && dropId && dragId !== dropId){
                           const next = [...iconsOrder]
                           const from = next.indexOf(dragId)
                           const to = next.indexOf(dropId)
                           if (from > -1 && to > -1 && from !== to){
                             const tmp = next[from]
                             next[from] = next[to]
                             next[to] = tmp
                             setIconsOrder(next)
                           }
                         }
                       }catch(e){}
                       // cleanup
                       try{ e.currentTarget.classList.remove('dragging') }catch(e){}
                       dragSrcRef.current = null
                     }}
                     onDragOver={(e)=>{ e.preventDefault(); e.currentTarget.classList.add('drag-over') }}
                     onDragLeave={(e)=>{ e.currentTarget.classList.remove('drag-over') }}
                     onDrop={(e)=>{
                       e.preventDefault();
                       // prefer in-memory drag id (safer on some browsers/devices), fall back to dataTransfer
                       const dt = (e.dataTransfer && (()=>{
                         try{ return e.dataTransfer.getData('text/plain') }catch(e){ return '' }
                       })()) || ''
                       const dragId = dragSrcRef.current || dt
                       const dropId = it.id
                       if (dragId && dragId !== dropId){
                          // swap positions of dragged and dropped icons (swap-on-drop)
                          const next = [...iconsOrder]
                          const from = next.indexOf(dragId)
                          const to = next.indexOf(dropId)
                          if (from > -1 && to > -1 && from !== to){
                            const tmp = next[from]
                            next[from] = next[to]
                            next[to] = tmp
                            setIconsOrder(next)
                          }
                       }
                       // cleanup classes
                       const cards = iconsRef.current && iconsRef.current.querySelectorAll('.card')
                       cards && cards.forEach(c=>{ c.classList.remove('drag-over'); c.classList.remove('dragging') })
                       // clear fallback drag id
                       dragSrcRef.current = null
                     }}
                     onDragEnd={(e)=>{ e.currentTarget.classList.remove('dragging'); const cards = iconsRef.current && iconsRef.current.querySelectorAll('.card'); cards && cards.forEach(c=>c.classList.remove('drag-over')); dragSrcRef.current = null }}
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


