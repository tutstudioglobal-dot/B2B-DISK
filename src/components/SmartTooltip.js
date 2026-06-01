'use client'
import { useState, useRef, useEffect } from 'react'

const POSITIONS = ['bottom', 'top', 'left', 'right']

export default function SmartTooltip({ children, content, lang = 'ar' }) {
  const [visible, setVisible] = useState(false)
  const [position, setPosition] = useState('bottom')
  const wrapperRef = useRef(null)
  const tipRef = useRef(null)

  useEffect(() => {
    if (!visible || !wrapperRef.current || !tipRef.current) return
    const wrapper = wrapperRef.current.getBoundingClientRect()
    const tip = tipRef.current.getBoundingClientRect()
    const vw = window.innerWidth
    const vh = window.innerHeight

    const checks = {
      bottom: wrapper.bottom + tip.height + 8 < vh,
      top:    wrapper.top - tip.height > 8,
      left:   wrapper.left - tip.width > 8,
      right:  wrapper.right + tip.width + 8 < vw,
    }

    for (const pos of POSITIONS) {
      if (checks[pos]) { setPosition(pos); return }
    }
    const spaces = {
      top: wrapper.top,
      bottom: vh - wrapper.bottom,
      left: wrapper.left,
      right: vw - wrapper.right,
    }
    const best = Object.entries(spaces).sort((a, b) => b[1] - a[1])[0][0]
    setPosition(best === 'left' || best === 'right' ? 'bottom' : best)
  }, [visible])

  const posClasses = {
    top:    'bottom-full end-1/2 translate-x-1/2 mb-2',
    bottom: 'top-full end-1/2 -translate-x-1/2 mt-2',
    left:   'end-full top-1/2 -translate-y-1/2 me-2',
    right:  'start-full top-1/2 -translate-y-1/2 ms-2',
  }

  const arrowClasses = {
    top:    'top-full end-1/2 -translate-x-1/2 border-l-transparent border-r-transparent border-b-transparent border-t-slate-900',
    bottom: 'bottom-full end-1/2 -translate-x-1/2 border-l-transparent border-r-transparent border-t-transparent border-b-slate-900',
    left:   'left-full top-1/2 -translate-y-1/2 border-t-transparent border-b-transparent border-r-transparent border-l-slate-900',
    right:  'right-full top-1/2 -translate-y-1/2 border-t-transparent border-b-transparent border-l-transparent border-r-slate-900',
  }

  return (
    <div
      ref={wrapperRef}
      className="relative inline-flex"
      onMouseEnter={() => setVisible(true)}
      onMouseLeave={() => setVisible(false)}
      onFocus={() => setVisible(true)}
      onBlur={() => setVisible(false)}
    >
      {children}
      {visible && (
        <div
          ref={tipRef}
          className={`absolute z-50 ${posClasses[position]}`}
          style={{ direction: lang === 'ar' ? 'rtl' : 'ltr' }}
        >
          <div className="bg-slate-900 text-slate-100 text-xs rounded-md px-2.5 py-1.5 shadow-xl whitespace-nowrap max-w-[240px] overflow-hidden text-ellipsis border border-slate-700/50">
            {content}
          </div>
          <div className={`absolute w-0 h-0 border-4 ${arrowClasses[position]}`}></div>
        </div>
      )}
    </div>
  )
}
