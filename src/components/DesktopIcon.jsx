import React from 'react'
import Icon from './Icon'

export default function DesktopIcon({id='xp-pong', label='XP Pong', onDoubleClick, pos}){
  const svg = (
    <svg width="56" height="56" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
      <rect x="2" y="2" width="20" height="20" rx="4" fill="#0b63b3" />
      <circle cx="8" cy="12" r="2.2" fill="#fff" />
      <rect x="14" y="9" width="4" height="6" rx="1" fill="#fff" />
    </svg>
  )

  return <Icon id={id} label={label} icon={svg} pos={pos} onDoubleClick={onDoubleClick} />
}
