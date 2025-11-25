import React, {useEffect, useState, useRef} from 'react'

export default function Splash({duration = 3000, onFinish, durationMultiplier = 1.5}){
  const [progress, setProgress] = useState(0)
  // try multiple image candidates (prefer the project-provided XP logo first)
  const imgCandidates = ['/assets/microsoft-windows-xp-logo.png', '/assets/winxp-logo-v2.png', '/assets/winxp-logo.png', '/assets/winxp-boot.png', '/assets/logo.svg']
  const [imgIndex, setImgIndex] = useState(0)
  const [showImage, setShowImage] = useState(true)
  const [status, setStatus] = useState('Starting...')
  const mountedRef = useRef(true)

  useEffect(()=>{
    mountedRef.current = true
    const mult = Math.max(0.5, durationMultiplier)
    const phases = [
      {label: 'Initializing hardware', from: 0, to: 12, dur: 600 * mult},
      {label: 'Loading drivers', from: 12, to: 48, dur: 900 * mult},
      {label: 'Starting services', from: 48, to: 76, dur: 800 * mult},
      {label: 'Applying settings', from: 76, to: 92, dur: 500 * mult},
      {label: 'Finalizing', from: 92, to: 100, dur: 300 * mult}
    ]

    let cancelled = false
    let raf = null

    async function runPhases(){
      for(const ph of phases){
        if (!mountedRef.current || cancelled) break
        setStatus(ph.label)
        const start = performance.now()
        const startP = ph.from
        const range = ph.to - ph.from
        // within-phase ticks for small jumps
        while(true){
          const now = performance.now()
          const t = Math.min(1, (now - start) / ph.dur)
          const eased = t // linear is fine for now
          const value = Math.round(startP + range * eased)
          if (mountedRef.current && !cancelled) setProgress(value)
          if (t >= 1) break
          // occasionally introduce a tiny random jump to simulate ticks
          if (Math.random() < 0.018 && mountedRef.current && !cancelled){
            const jitter = Math.min(ph.to, value + Math.round(Math.random() * 3))
            setProgress(jitter)
          }
          await new Promise(r => raf = requestAnimationFrame(r))
        }
        // small pause between phases (also scaled)
        await new Promise(r => setTimeout(r, (80 + Math.random()*120) * mult))
      }
      if (!cancelled && mountedRef.current){
        setProgress(100)
        setStatus('Welcome')
        // give a small pause so the final state is visible
        setTimeout(()=>{ if (mountedRef.current && !cancelled) onFinish && onFinish() }, 260 * mult)
      }
    }

    runPhases()

    function cleanup(){ cancelled = true; mountedRef.current = false; if (raf) cancelAnimationFrame(raf) }
    window.addEventListener('keydown', cleanup, {once:true})
    return ()=>{ cleanup(); window.removeEventListener('keydown', cleanup) }
  },[onFinish])

  return (
    <div className="xp-splash" onClick={() => onFinish && onFinish()}>
      <div className="xp-splash-inner">
        <div className="xp-logo-wrap">
          {showImage ? (
            <img src={imgCandidates[imgIndex]} alt="Windows XP" onError={() => {
              // try next candidate, otherwise fall back to text
              if (imgIndex + 1 < imgCandidates.length) setImgIndex(i => i + 1)
              else setShowImage(false)
            }} />
          ) : (
            <div style={{textAlign:'center'}}>
              <div style={{fontSize:42,fontWeight:700}}>Microsoft</div>
              <div style={{fontSize:64,fontWeight:800,letterSpacing:4}}>Windows<span style={{color:'#ff8b00'}}>xp</span></div>
            </div>
          )}
        </div>
        <div className="xp-dots" aria-hidden>
          <div className="xp-dots-track">
            <div className="xp-dots-inner">
              {[0,1,2].map(i=> (
                <span key={i} className="xp-dot" />
              ))}
            </div>
          </div>
        </div>
        <div className="xp-status">{status}</div>
      </div>
    </div>
  )
}
