import React, {useEffect, useRef, useState} from 'react'
import * as pdfjsLib from 'pdfjs-dist/build/pdf'

export default function PdfViewer({src}){
  const containerRef = useRef(null)
  const canvasRef = useRef(null)
  const [pdfDoc, setPdfDoc] = useState(null)
  const [pageNum, setPageNum] = useState(1)
  const [numPages, setNumPages] = useState(0)
  const [scale, setScale] = useState(1)
  const [fitWidth, setFitWidth] = useState(true)
  const cancelledRef = useRef(false)
  const currentPdfRef = useRef(null)

  // Ensure worker is served from the copied build folder
  useEffect(()=>{
    try{ pdfjsLib.GlobalWorkerOptions.workerSrc = '/pdfjs/build/pdf.worker.js'; console.log('pdf worker set to /pdfjs/build/pdf.worker.js') }catch(e){console.warn(e)}
  },[])
  // Load document
  useEffect(()=>{
    if(!src) return
  const url = encodeURI(decodeURI(src))
  const loadingTask = pdfjsLib.getDocument(url)
    cancelledRef.current = false
    loadingTask.promise.then(doc=>{
      if (cancelledRef.current){
        try{ doc.destroy && doc.destroy() }catch(e){}
        return
      }
      currentPdfRef.current = doc
      setPdfDoc(doc)
      setNumPages(doc.numPages)
      setPageNum(1)
    }).catch(err=>{
      console.error('Failed to load PDF', err)
    })
    return ()=>{
      // mark cancelled to stop any ongoing render work
      cancelledRef.current = true
      // avoid destroying the worker/task here — letting pdf.js manage worker lifecycle
    }
  },[src])

  // Render current page and respond to resize / zoom / fit changes
  useEffect(()=>{
    if(!pdfDoc) return
  let ro = null
  let activeRenderTasks = []
  const renderId = { current: 0 }

  async function renderPage(){
    const container = containerRef.current
    if(!container) return
    // cancel any previous render tasks
    activeRenderTasks.forEach(t=>{ try{ t.cancel && t.cancel() }catch(e){} })
    activeRenderTasks = []
    renderId.current += 1
    const thisId = renderId.current
    // clear container synchronously so re-renders replace content
    container.innerHTML = ''
    const cw = container.clientWidth || 800
    for(let p=1; p<=pdfDoc.numPages; p++){
      if (cancelledRef.current) break
      if (thisId !== renderId.current) break
      try{
        const page = await pdfDoc.getPage(p)
        if (cancelledRef.current) break
        if (thisId !== renderId.current) break
        const viewport = page.getViewport({scale:1})
        const targetScale = fitWidth ? (cw / viewport.width) * (scale || 1) : (scale || 1)
        const vp = page.getViewport({scale: targetScale})
        const dpr = window.devicePixelRatio || 1
        const canvas = document.createElement('canvas')
        canvas.style.display = 'block'
        canvas.style.marginBottom = '12px'
        canvas.style.width = Math.round(vp.width) + 'px'
        canvas.style.height = Math.round(vp.height) + 'px'
        canvas.width = Math.round(vp.width * dpr)
        canvas.height = Math.round(vp.height * dpr)
        const ctx = canvas.getContext('2d')
        ctx.setTransform(dpr,0,0,dpr,0,0)
        container.appendChild(canvas)
        const rtask = page.render({canvasContext: ctx, viewport: vp})
        activeRenderTasks.push(rtask)
        await rtask.promise
      }catch(e){ if(e && e.name !== 'RenderingCancelledException') console.error('page render error', e) }
    }
  }

  let resizeTimer = null
  let lastWidth = null
  function scheduleRender(){
    if (resizeTimer) clearTimeout(resizeTimer)
    resizeTimer = setTimeout(()=>{ renderPage(); resizeTimer = null }, 120)
  }

  renderPage()
  if (typeof ResizeObserver !== 'undefined'){
    ro = new ResizeObserver(()=>{
      const c = containerRef.current
      if(!c || cancelledRef.current) return
      const w = c.clientWidth
      // only re-render when width changes (avoid height/content change loops)
      if (lastWidth === null) lastWidth = w
      if (w !== lastWidth){ lastWidth = w; scheduleRender() }
    })
    ro.observe(containerRef.current)
  }

  return ()=>{ ro && ro.disconnect(); activeRenderTasks.forEach(t=>{ try{ t.cancel && t.cancel() }catch(e){} }); activeRenderTasks = [] }
  },[pdfDoc, pageNum, scale, fitWidth])
  function toggleFit(){ setFitWidth(f=>!f) }

  function prevPage(){ setPageNum(p=>{
    const next = Math.max(1,p-1)
    const c = containerRef.current
    if (c && c.children[next-1]) c.children[next-1].scrollIntoView({behavior:'smooth', block:'start'})
    return next
  }) }
  function nextPage(){ setPageNum(p=>{
    const next = Math.min(numPages,p+1)
    const c = containerRef.current
    if (c && c.children[next-1]) c.children[next-1].scrollIntoView({behavior:'smooth', block:'start'})
    return next
  }) }
  function zoomIn(){ setFitWidth(false); setScale(s=>Math.min(3, +(s+0.25).toFixed(2))) }
  function zoomOut(){ setFitWidth(false); setScale(s=>Math.max(0.25, +(s-0.25).toFixed(2))) }

  return (
    <div className="pdf-viewer" style={{height:'100%',display:'flex',flexDirection:'column'}}>
      <div className="pdf-toolbar" style={{display:'flex',alignItems:'center',gap:8,padding:8,borderBottom:'1px solid #eee'}}>
        <button onClick={prevPage} disabled={pageNum<=1}>Prev</button>
  <button onClick={nextPage} disabled={pageNum>=numPages}>Next</button>
  <div style={{width:8}} />
  <button onClick={zoomOut}>-</button>
  <button onClick={zoomIn}>+</button>
  <button onClick={toggleFit} style={{marginLeft:8}}>{fitWidth? 'Fit Width':'Fixed'}</button>
  <div style={{flex:1}} />
  <span>Page {pageNum} / {numPages}</span>
  <a style={{marginLeft:12}} href={src} target="_blank" rel="noreferrer">Open in new tab</a>
  <a style={{marginLeft:8}} href={src} download>Download</a>
      </div>
      <div ref={containerRef} style={{flex:1, overflow:'auto', display:'flex', flexDirection:'column', alignItems:'center', padding:12}}>
        <canvas ref={canvasRef} style={{background:'#eee', boxShadow:'0 0 0 1px rgba(0,0,0,0.06)'}} />
      </div>
    </div>
  )
}

