import React, {useMemo, useRef, useEffect, useState} from 'react'
import content from '../content.json'

export default function LinkedInWindow({profileUrl}){
  // derive vanity from profileUrl when possible
  const vanity = useMemo(() => {
    if (!profileUrl) return ''
    try{
      const u = new URL(profileUrl)
      const parts = u.pathname.split('/').filter(Boolean)
      return parts[parts.length - 1] || ''
    }catch(e){
      const parts = (profileUrl||'').split('/').filter(Boolean)
      return parts[parts.length - 1] || ''
    }
  },[profileUrl])

  const href = profileUrl || (vanity ? `https://www.linkedin.com/in/${vanity}` : 'https://www.linkedin.com')

  // read name/title from content.json so the badge fallback shows real values
  const name = content && content.profile && content.profile.name ? content.profile.name : ''
  const title = content && content.profile && content.profile.title ? content.profile.title : ''

  const src = vanity ? `/linkedin-badge.html?vanity=${encodeURIComponent(vanity)}&name=${encodeURIComponent(name)}&title=${encodeURIComponent(title)}` : `/linkedin-badge.html`

  const iframeRef = useRef(null)
  const [height, setHeight] = useState(160)

  useEffect(()=>{
    function onMsg(e){
      // Only accept messages of the expected shape
      try{
        const d = e.data || {}
        if (d && d.type === 'linkedin-badge-height' && typeof d.height === 'number'){
          // optional origin check: ensure message comes from same origin as our app
          if (e.origin === window.location.origin){
            setHeight(d.height)
          }
        }
      }catch(err){/* ignore */}
    }
    window.addEventListener('message', onMsg)
    return ()=> window.removeEventListener('message', onMsg)
  },[])

  return (
    <div style={{padding:8}}>
      <iframe
        ref={iframeRef}
        title="LinkedIn profile badge"
        src={src}
        style={{width:'100%', height, border:'none', background:'transparent'}}
        // LinkedIn's badge script requires same-origin access inside the iframe to function.
        // This iframe is served from our app `public/` folder and loads only the LinkedIn badge script.
        sandbox="allow-scripts allow-popups allow-same-origin"
        scrolling="no"
      />
    </div>
  )
}
