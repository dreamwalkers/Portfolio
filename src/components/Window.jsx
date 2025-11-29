import React, {useRef, useState, useEffect} from 'react'
import PdfViewer from './PdfViewer'
import LinkedInWindow from './LinkedInWindow'
import PongGame from './PongGame'
import Quiz from './Quiz'
import XPDialog from './XPDialog'

function Header({title,onClose,onMinimize,onMaximize,onMouseDown,onRestart}){
  const [menuOpen, setMenuOpen] = React.useState(false)
  return (
    <div className="xp-window-header" onMouseDown={onMouseDown}>
      <div style={{display:'flex',alignItems:'center',gap:8}}>
        <div style={{position:'relative'}}>
          <button className="menu-btn" onClick={(e)=>{ e.stopPropagation(); setMenuOpen(v=>!v) }} title="Menu">☰</button>
          {menuOpen ? (
            <div className="menu-dropdown" onClick={(e)=>e.stopPropagation()}>
              {title === 'XP Pong' ? (<div className="menu-item" onClick={()=>{ window.dispatchEvent(new CustomEvent('pong-restart')); setMenuOpen(false) }}>Restart</div>) : null}
            </div>
          ) : null}
        </div>
        <div className="title">{title}</div>
      </div>
      <div className="controls">
        <button className="min" onClick={onMinimize} title="Minimize">_</button>
        <button className="max" onClick={onMaximize} title="Maximize">▢</button>
        <button className="close" onClick={onClose} title="Close">✕</button>
      </div>
    </div>
  )
}

export default function WindowCmp({win, content, onFocus, onClose, onMinimize, onUpdate, onOpen}){
  const ref = useRef()
  const [state, setState] = useState({pos:win.position, size: win.size, maximized:false})
  const [visible, setVisible] = useState(false)
  const [closing, setClosing] = useState(false)
  const [minimizing, setMinimizing] = useState(false)

  useEffect(()=>{
    setState({pos:win.position, size:win.size, maximized:false})
  },[win.position.x, win.position.y, win.size.w, win.size.h])

  useEffect(()=>{
    // trigger open animation shortly after mount
    const t = setTimeout(()=>setVisible(true), 10)
    return ()=> clearTimeout(t)
  },[])

  if (win.minimized) return null

  function startDrag(e){
    e.preventDefault(); onFocus()
    const startX = e.clientX; const startY = e.clientY
    const startPos = {...state.pos}
    function onMove(ev){
      const nx = startPos.x + (ev.clientX - startX)
      const ny = startPos.y + (ev.clientY - startY)
      setState(s=>({...s,pos:{x:Math.max(0,nx),y:Math.max(0,ny)}}))
      onUpdate({position:{x:Math.max(0,nx),y:Math.max(0,ny)}})
    }
    function up(){ window.removeEventListener('mousemove',onMove); window.removeEventListener('mouseup',up) }
    window.addEventListener('mousemove',onMove); window.addEventListener('mouseup',up)
  }

  function startResize(e){
    e.preventDefault(); onFocus()
    const startX = e.clientX; const startY = e.clientY
    const startSize = {...state.size}
    function onMove(ev){
      const nw = Math.max(300, startSize.w + (ev.clientX - startX))
      const nh = Math.max(200, startSize.h + (ev.clientY - startY))
      setState(s=>({...s,size:{w:nw,h:nh}}))
      onUpdate({size:{w:nw,h:nh}})
    }
    function up(){ window.removeEventListener('mousemove',onMove); window.removeEventListener('mouseup',up) }
    window.addEventListener('mousemove',onMove); window.addEventListener('mouseup',up)
  }

  function toggleMax(){
    if(state.maximized){
      setState(s=>({...s,maximized:false,pos:win.position,size:win.size}))
      onUpdate({position:win.position,size:win.size})
    }else{
      // Use viewport-sized dimensions when maximizing so embedded iframe can occupy full area
      const w = window.innerWidth
      const h = window.innerHeight - 40
      setState(s=>({...s,maximized:true,pos:{x:0,y:0},size:{w,h}}))
      onUpdate({position:{x:0,y:0},size:{w,h}})
    }
  }

  function handleClose(){
    // play close animation, then call onClose when animation ends
    setClosing(true)
  }

  function handleMinimize(){
    // play minimize animation, then call onMinimize when animation ends
    setMinimizing(true)
  }

  function handleAnimationEnd(e){
    // only act when our custom animations finish
    if (closing){
      onClose && onClose()
      setClosing(false)
    } else if (minimizing){
      onMinimize && onMinimize()
      setMinimizing(false)
    }
  }

  const classes = [ 'xp-window' ]
  if (visible) classes.push('opening')
  if (closing) classes.push('closing')
  if (minimizing) classes.push('minimizing')
  if (state.maximized) classes.push('max')

  const style = state.maximized ? {left:0, top:0, width:'100vw', height:'calc(100vh - 40px)', zIndex: win.z} : {left: state.pos.x, top: state.pos.y, width: state.size.w, height: state.size.h, zIndex: win.z}

  return (
    <div className={classes.join(' ')} style={style} ref={ref} onMouseDown={onFocus} onAnimationEnd={handleAnimationEnd}>
      <Header title={win.title} onClose={handleClose} onMinimize={handleMinimize} onMaximize={toggleMax} onMouseDown={startDrag} />
      <div className="xp-window-body">
        {win.title === 'About Me' && (
          <div className="about">
            <img src={content.profile.photo} alt="profile" className="profile" />
            <div className="about-text">
              <div className="about-card">
                <div className="about-badge">MY STORY</div>
                <h2 className="about-hero">{content.profile.name}</h2>
                <div className="about-meta">
                  <h4>{content.profile.title}</h4>
                  {content.profile.subtitle ? (
                    <>
                      <span className="about-divider" aria-hidden></span>
                      <div className="about-subtitle">{content.profile.subtitle}</div>
                    </>
                  ) : null}
                </div>
                <div className="about-copy">
                  {Array.isArray(content.profile.summary) ? (
                    content.profile.summary.map((para, i) => (<p key={i}>{para}</p>))
                  ) : (
                    <p>{content.profile.summary}</p>
                  )}
                </div>
                <a className="about-cta" href={'/assets/NINSHID CV.pdf'} target="_blank" rel="noopener noreferrer">Swipe to know more ›</a>
              </div>
            </div>
          </div>
        )}
        {win.title === 'Resume' && (
          <div className="resume">
            <div style={{height:'100%',display:'flex',flexDirection:'column'}}>
              <div style={{paddingBottom:8}} />
              <div style={{flex:1,overflow:'auto'}}>
                <PdfViewer src={'/assets/NINSHID CV.pdf'} />
              </div>
            </div>
          </div>
        )}
        {win.title === 'Experience' && (
          <div className="experience">
            {content.experience.map((e,i)=> (
              <div key={i} className="exp-item"><strong>{e.role}</strong> — {e.company} <span className="period">{e.period}</span><div className="details">{e.details}</div></div>
            ))}
          </div>
        )}
        {win.title === 'Skills' && (
          <div className="skills">{content.skills.map((s,i)=>(<span key={i} className="skill">{s}</span>))}</div>
        )}
        {win.title === 'Projects' && (
          <div className="projects-folder-view" style={{display:'flex',flexWrap:'wrap',gap:12}}>
            {Array.isArray(content.projects) && content.projects.map((p,i)=> (
              <div key={i} className="project-folder" style={{width:120,display:'flex',flexDirection:'column',alignItems:'center',cursor:'pointer'}} onDoubleClick={()=>onOpen && onOpen(p.name)} onClick={(e)=>{ /* single click: select (no-op for now) */ }}>
                <div style={{fontSize:48,lineHeight:1}}>📁</div>
                <div style={{marginTop:8,textAlign:'center',fontWeight:600}}>{p.name}</div>
              </div>
            ))}
          </div>
        )}

        {/* Render individual project window when its title matches a project name */}
        {Array.isArray(content.projects) && content.projects.some(pr => pr.name === win.title) && (
          (() => {
            const proj = content.projects.find(pr => pr.name === win.title)
            return (
              <div className="project-detail" style={{padding:12,overflow:'auto'}}>
                <h3>{proj.name}</h3>
                <div style={{marginBottom:12}}>{proj.desc}</div>
                {proj.link ? (<div><a href={proj.link} target="_blank" rel="noreferrer">Open project</a></div>) : null}
                {proj.details ? (<div style={{marginTop:8}}>{proj.details}</div>) : null}
              </div>
            )
          })()
        )}
        {win.title === 'Contact' && (
          <div className="contact">
            <div>Phone: <a href={`tel:${content.contact.phone}`}>{content.contact.phone}</a></div>
            <div>Email: <a href={`mailto:${content.contact.email}`}>{content.contact.email}</a></div>
            <div>LinkedIn: <a href={content.contact.linkedin} target="_blank" rel="noreferrer">Profile</a></div>
            <div>Blog: <a href={content.contact.blog} target="_blank" rel="noreferrer">Blog</a></div>
          </div>
        )}
        {win.title === 'LinkedIn' && (
          <LinkedInWindow profileUrl={content.contact.linkedin} />
        )}
        {win.title === 'XP Pong' && (
          <div style={{height:'100%',display:'flex',flexDirection:'column',alignItems:'center',justifyContent:'center'}}>
            <PongGame width={Math.max(420, state.size.w - 40)} height={Math.max(260, state.size.h - 120)} />
          </div>
        )}
        {win.title === 'Trivia Quiz' && (
          <div style={{height:'100%',display:'flex',flexDirection:'column',alignItems:'stretch',justifyContent:'flex-start'}}>
            <div style={{padding:8}}>
              <div style={{fontWeight:700,marginBottom:8}}>Trivia Quiz</div>
              <div style={{fontSize:13,color:'#334'}}>Test your knowledge about Ninshid and Windows XP.</div>
            </div>
            <div style={{flex:1,overflow:'auto',padding:12}}>
              <div style={{maxWidth:720,margin:'0 auto'}}>
                <XPDialog>
                  <Quiz />
                </XPDialog>
              </div>
            </div>
          </div>
        )}
      </div>
      <div className="resize-handle" onMouseDown={startResize} />
    </div>
  )
}
