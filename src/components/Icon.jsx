import React, {useState, useEffect, useRef} from 'react'
import Draggable from 'react-draggable'

export default function Icon({id, label, icon, pos = {x:0,y:0}, onDoubleClick, onMoveEnd}){
  const [localPos, setLocalPos] = useState(pos)
  const nodeRef = useRef(null)
  const pointerStartRef = useRef(null)
  const draggedRef = useRef(false)

  useEffect(()=>{ setLocalPos(pos) },[pos.x,pos.y])

  function handleDouble(){ onDoubleClick && onDoubleClick() }

  function handleDrag(e, data){
    draggedRef.current = true
    setLocalPos({x: data.x, y: data.y})
  }

  function handleStart(){
    draggedRef.current = false
  }

  function handleStop(e, data){
    const nx = Math.max(8, Math.min(data.x, window.innerWidth - 80))
    const ny = Math.max(8, Math.min(data.y, window.innerHeight - 120))
    setLocalPos({x: nx, y: ny})
    onMoveEnd && onMoveEnd(id, {x: nx, y: ny})
    // reset drag flag after stop
    draggedRef.current = false
  }

  const style = { position: 'absolute', left: localPos.x, top: localPos.y }

  // pointer handlers detect short touch taps and trigger the double-click action
  function onPointerDown(e){
    try{ pointerStartRef.current = {x: e.clientX, y: e.clientY, pointerType: e.pointerType} }catch(err){ pointerStartRef.current = null }
  }

  function onPointerUp(e){
    const start = pointerStartRef.current
    pointerStartRef.current = null
    if(!start) return
    const dx = (e.clientX || 0) - start.x
    const dy = (e.clientY || 0) - start.y
    const dist = Math.hypot(dx, dy)
    // treat as a tap only for touch inputs, with small movement and not dragged
    if(start.pointerType === 'touch' && dist < 12 && !draggedRef.current){
      handleDouble()
    }
  }

  return (
    <Draggable nodeRef={nodeRef} position={{x: localPos.x, y: localPos.y }} onStart={handleStart} onDrag={handleDrag} onStop={handleStop} bounds="parent">
      <div ref={nodeRef} className="desktop-icon" style={style} onDoubleClick={handleDouble} onPointerDown={onPointerDown} onPointerUp={onPointerUp}>
        <div className="icon-art">{icon}</div>
        <div className="icon-label">{label}</div>
      </div>
    </Draggable>
  )
}
