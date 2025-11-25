import React from 'react'

export default function XPDialog({children}){
  return (
    <div className="xp-dialog" style={{width:'100%',height:'100%'}}>
      <div className="xp-dialog-body" style={{padding:8}}>
        {children}
      </div>
    </div>
  )
}
