import React, { useRef, useEffect, useState } from 'react'

const PADDLE_HEIGHT = 80
const PADDLE_WIDTH = 10
const BALL_SIZE = 10
const WINNING_SCORE = 10

function playBeep(freq = 440, time = 0.05){
  try{
    const ctx = new (window.AudioContext || window.webkitAudioContext)()
    const o = ctx.createOscillator()
    const g = ctx.createGain()
    o.type = 'sine'
    o.frequency.value = freq
    g.gain.value = 0.05
    o.connect(g); g.connect(ctx.destination)
    o.start()
    setTimeout(()=>{ o.stop(); ctx.close() }, time*1000)
  }catch(e){/* ignore audio errors */}
}

export default function PongGame({width = 600, height = 360}){
  const canvasRef = useRef(null)
  const rafRef = useRef(null)
  const stateRef = useRef({
    ball: { x: width/2, y: height/2, vx: 4, vy: 2 },
    leftY: height/2 - PADDLE_HEIGHT/2,
    rightY: height/2 - PADDLE_HEIGHT/2,
    leftScore: 0,
    rightScore: 0,
    running: true,
    keys: {}
  })

  const [scores, setScores] = useState({l:0,r:0})
  const [gameOver, setGameOver] = useState(false)

  function resetBall(side){
    const s = stateRef.current
    s.ball.x = width/2
    s.ball.y = height/2
    const speed = 4
    const dir = side === 'left' ? -1 : 1
    s.ball.vx = speed * dir * (Math.random()*0.4 + 0.8)
    s.ball.vy = (Math.random()*2.2 - 1.1)
  }

  function resetGame(){
    const s = stateRef.current
    s.leftY = height/2 - PADDLE_HEIGHT/2
    s.rightY = height/2 - PADDLE_HEIGHT/2
    s.leftScore = 0
    s.rightScore = 0
    s.running = true
    setScores({l:0,r:0})
    setGameOver(false)
    resetBall(Math.random() > 0.5 ? 'left' : 'right')
  }

  useEffect(()=>{
    const s = stateRef.current
    resetBall(Math.random() > 0.5 ? 'left' : 'right')

    function onKey(e){
      s.keys[e.key] = e.type === 'keydown'
    }
    window.addEventListener('keydown', onKey)
    window.addEventListener('keyup', onKey)

    function onRestart(){ resetGame(); }
    window.addEventListener('pong-restart', onRestart)

    return ()=>{
      window.removeEventListener('keydown', onKey)
      window.removeEventListener('keyup', onKey)
      window.removeEventListener('pong-restart', onRestart)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  },[])

  useEffect(()=>{
    const canvas = canvasRef.current
    if (!canvas) return
    canvas.width = width
    canvas.height = height
    const ctx = canvas.getContext('2d')

    function draw(){
      const s = stateRef.current
      // clear
      ctx.fillStyle = '#cfe9ff'
      ctx.fillRect(0,0,width,height)

      // middle line
      ctx.fillStyle = '#b0d4ff'
      for(let y=0;y<height;y+=20){ ctx.fillRect(width/2 -1, y+5, 2, 10) }

      // paddles
      ctx.fillStyle = '#012a4a'
      ctx.fillRect(8, s.leftY, PADDLE_WIDTH, PADDLE_HEIGHT)
      ctx.fillRect(width - 8 - PADDLE_WIDTH, s.rightY, PADDLE_WIDTH, PADDLE_HEIGHT)

      // ball
      ctx.fillStyle = '#072034'
      ctx.fillRect(s.ball.x - BALL_SIZE/2, s.ball.y - BALL_SIZE/2, BALL_SIZE, BALL_SIZE)

      // scores
      ctx.fillStyle = '#012a4a'
      ctx.font = '20px Segoe UI, Arial'
      ctx.fillText(s.leftScore, width/2 - 40, 30)
      ctx.fillText(s.rightScore, width/2 + 24, 30)

      if (gameOver){
        ctx.fillStyle = 'rgba(0,0,0,0.6)'
        ctx.fillRect(0,0,width,height)
        ctx.fillStyle = '#fff'
        ctx.font = '28px Segoe UI'
        ctx.fillText('Game Over', width/2 - 70, height/2 - 10)
        ctx.font = '16px Segoe UI'
        ctx.fillText('Press Restart to play again', width/2 - 120, height/2 + 20)
      }
    }

    function step(){
      const s = stateRef.current
      if (!s.running) { rafRef.current = requestAnimationFrame(step); draw(); return }
      // handle input
      if (s.keys['w'] || s.keys['W']) s.leftY -= 6
      if (s.keys['s'] || s.keys['S']) s.leftY += 6
      if (s.keys['ArrowUp']) s.rightY -= 6
      if (s.keys['ArrowDown']) s.rightY += 6
      s.leftY = Math.max(0, Math.min(height - PADDLE_HEIGHT, s.leftY))
      s.rightY = Math.max(0, Math.min(height - PADDLE_HEIGHT, s.rightY))

      // update ball
      s.ball.x += s.ball.vx
      s.ball.y += s.ball.vy

      // top/bottom collision
      if (s.ball.y - BALL_SIZE/2 <= 0 || s.ball.y + BALL_SIZE/2 >= height){ s.ball.vy *= -1; playBeep(800, 0.03) }

      // left paddle collision
      if (s.ball.x - BALL_SIZE/2 <= 8 + PADDLE_WIDTH){
        if (s.ball.y >= s.leftY && s.ball.y <= s.leftY + PADDLE_HEIGHT){
          s.ball.vx = Math.abs(s.ball.vx) * 1.03
          const delta = (s.ball.y - (s.leftY + PADDLE_HEIGHT/2)) / (PADDLE_HEIGHT/2)
          s.ball.vy = delta * 5
          playBeep(600,0.03)
        }
      }

      // right paddle collision
      if (s.ball.x + BALL_SIZE/2 >= width - 8 - PADDLE_WIDTH){
        if (s.ball.y >= s.rightY && s.ball.y <= s.rightY + PADDLE_HEIGHT){
          s.ball.vx = -Math.abs(s.ball.vx) * 1.03
          const delta = (s.ball.y - (s.rightY + PADDLE_HEIGHT/2)) / (PADDLE_HEIGHT/2)
          s.ball.vy = delta * 5
          playBeep(600,0.03)
        }
      }

      // score
      if (s.ball.x < 0){
        s.rightScore += 1
        setScores({l: s.leftScore, r: s.rightScore})
        playBeep(240,0.12)
        if (s.rightScore >= WINNING_SCORE){ setGameOver(true); s.running = false } else { resetBall('left') }
      }
      if (s.ball.x > width){
        s.leftScore += 1
        setScores({l: s.leftScore, r: s.rightScore})
        playBeep(240,0.12)
        if (s.leftScore >= WINNING_SCORE){ setGameOver(true); s.running = false } else { resetBall('right') }
      }

      draw()
      rafRef.current = requestAnimationFrame(step)
    }

    rafRef.current = requestAnimationFrame(step)
    return ()=>{ cancelAnimationFrame(rafRef.current) }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  },[gameOver])

  return (
    <div className="pong-wrap" style={{width, height}}>
      <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:8}}>
        <div style={{fontWeight:700}}>XP Pong</div>
        <div style={{fontSize:14}}>W/S — Left | ↑/↓ — Right</div>
        <div style={{fontWeight:700}}>{scores.l} : {scores.r}</div>
      </div>
      <canvas ref={canvasRef} style={{display:'block',background:'#cfe9ff',border:'2px solid #bcdcff',borderRadius:6}} />
      <div style={{marginTop:8,display:'flex',gap:8}}>
        <button onClick={()=>{ resetGame() }} style={{padding:'6px 10px',background:'#0b63b3',color:'#fff',border:'none',borderRadius:4}}>Restart</button>
        <button onClick={()=>{ window.dispatchEvent(new CustomEvent('pong-restart')) }} style={{padding:'6px 10px'}}>Signal Restart</button>
      </div>
    </div>
  )
}
