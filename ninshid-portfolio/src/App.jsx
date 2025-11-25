import React, {useState, useEffect} from 'react'
import Desktop from './components/Desktop'
import Taskbar from './components/Taskbar'
import DesktopSplash from './components/Splash'
import content from './content.json'

export default function App(){
  console.log('App mount')
  const [showSplash, setShowSplash] = useState(true)
  const [windows, setWindows] = useState([]) // {id, title, type, minimized, z, position, size}
  const [zIndex, setZIndex] = useState(10)

  useEffect(()=>{
    // preload a sample window open for welcome
  },[])

  useEffect(()=>{
    // splash lifecycle is handled by the Splash component (phased timing)
    // keep this effect empty so Splash controls dismissal via onFinish
    return undefined
  },[])

  function openWindow(type){
    const id = Date.now()
    const title = type
    // ensure we increment zIndex and use the new value atomically when creating the window
    setZIndex(prevZ => {
      const newZ = prevZ + 1
      const win = {id,title,type,minimized:false,z:newZ,position:{x:80+(windows.length*20)%300,y:80+(windows.length*10)%200},size:{w:640,h:360}}
      setWindows(ws=>[...ws,win])
      return newZ
    })
  }

  function closeWindow(id){
    setWindows(ws=>ws.filter(w=>w.id!==id))
  }
  function minimizeWindow(id){
    setWindows(ws=>ws.map(w=>w.id===id?{...w,minimized:true}:w))
  }
  function restoreWindow(id){
    // increment zIndex and apply it to the restored window so it appears on top
    setZIndex(prevZ => {
      const newZ = prevZ + 1
      setWindows(ws=>ws.map(w=> w.id===id ? {...w, minimized:false, z:newZ} : w))
      return newZ
    })
  }
  function focusWindow(id){
    // bring the window to front by bumping z-index atomically
    setZIndex(prevZ => {
      const newZ = prevZ + 1
      setWindows(ws=>ws.map(w=> w.id===id ? {...w, z:newZ} : w))
      return newZ
    })
  }
  function updateWindow(id,patch){
    setWindows(ws=>ws.map(w=>w.id===id?{...w,...patch}:w))
  }

  return (
    <div className="xp-root">
      {showSplash ? (
        <React.Suspense fallback={null}>
          <div style={{position:'absolute',inset:0,zIndex:9999}}>
            <DesktopSplash durationMultiplier={1.8} onFinish={() => setShowSplash(false)} />
          </div>
        </React.Suspense>
      ) : null}
      <Desktop content={content} windows={windows} onOpen={openWindow} onFocus={focusWindow} onUpdate={updateWindow} onClose={closeWindow} onMinimize={minimizeWindow} />
      <Taskbar windows={windows} onOpen={openWindow} onRestore={restoreWindow} onFocus={focusWindow} />
    </div>
  )
}
