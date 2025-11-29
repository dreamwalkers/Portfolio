import React, {useMemo, useState, useEffect, createContext, useContext} from 'react'
import './themes/XPTheme.scss'
import './themes/AndroidTheme.scss'

const ThemeContext = createContext({ isMobile: false, theme: 'xp' })

export default function ThemeProvider({children}){
  // perform initial detection synchronously so consumers render the correct theme on first paint
  const ua = typeof navigator !== 'undefined' ? (navigator.userAgent || '') : ''
  const mobileUA = /Mobi|Android|iPhone|iPad|iPod/i.test(ua)
  const smallScreen = typeof window !== 'undefined' ? window.innerWidth <= 768 : false
  const initialMobile = mobileUA || smallScreen

  const [isMobile, setIsMobile] = useState(initialMobile)

  useEffect(()=>{
    console.log('[ThemeProvider] detected mobile (effect):', initialMobile, 'ua:', ua)
    function onResize(){
      const nowSmall = window.innerWidth <= 768
      setIsMobile(mobileUA || nowSmall)
    }
    window.addEventListener('resize', onResize)
    return ()=> window.removeEventListener('resize', onResize)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  },[])

  const theme = useMemo(()=> isMobile ? 'android' : 'xp', [isMobile])
  const className = theme === 'android' ? 'android-theme' : 'xp-theme'
  const value = useMemo(()=> ({ isMobile, theme }), [isMobile, theme])

  return (
    <div className={className} data-theme={theme}>
      <ThemeContext.Provider value={value}>
        {children}
      </ThemeContext.Provider>
    </div>
  )
}

export function useTheme(){
  return useContext(ThemeContext)
}
