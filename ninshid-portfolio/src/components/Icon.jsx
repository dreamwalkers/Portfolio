import React, {useState, useEffect, useRef} from 'react'
import Draggable from 'react-draggable'

export default function Icon({id, label, icon, pos = {x:0,y:0}, onDoubleClick, onMoveEnd}){
  const [localPos, setLocalPos] = useState(pos)
  const nodeRef = useRef(null)

  useEffect(()=>{ setLocalPos(pos) },[pos.x,pos.y])

  function handleDouble(){ onDoubleClick && onDoubleClick() }

  function handleDrag(e, data){
    setLocalPos({x: data.x, y: data.y})
  }

  function handleStop(e, data){
    const nx = Math.max(8, Math.min(data.x, window.innerWidth - 80))
    const ny = Math.max(8, Math.min(data.y, window.innerHeight - 120))
    setLocalPos({x: nx, y: ny})
    onMoveEnd && onMoveEnd(id, {x: nx, y: ny})
  }

  const style = { position: 'absolute', left: localPos.x, top: localPos.y }

  return (
    <Draggable nodeRef={nodeRef} position={{x: localPos.x, y: localPos.y }} onDrag={handleDrag} onStop={handleStop} bounds="parent">
      <div ref={nodeRef} className="desktop-icon" style={style} onDoubleClick={handleDouble}>
        <div className="icon-art">{icon}</div>
        <div className="icon-label">{label}</div>
      </div>
    </Draggable>
  )
}
