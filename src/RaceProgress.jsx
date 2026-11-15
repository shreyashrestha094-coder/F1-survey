import { useEffect, useMemo, useRef, useState } from 'react'
import { questions } from './data/questions.js'

const W = 600
const H = 96
// circuit-ish path: start straight, sweepers, chicane, finish straight
const TRACK_D = 'M 24 66 C 110 18, 190 88, 300 54 S 470 16, 576 60'

// fraction along the track for question step i (0-based)
const fracFor = (i, total) => Math.min(Math.max((i + 1) / (total + 1), 0.02), 1)

function useReducedMotion() {
  return useMemo(
    () => window.matchMedia?.('(prefers-reduced-motion: reduce)').matches ?? false,
    [],
  )
}

export default function RaceProgress({ index, total = questions.length, lang }) {
  const trackRef = useRef(null)
  const carRef = useRef(null)
  const [dots, setDots] = useState([])
  const targetFrac = fracFor(index, total)
  const animFrac = useRef(targetFrac)
  const reduced = useReducedMotion()

  // waypoint positions, computed once the path is laid out
  useEffect(() => {
    const path = trackRef.current
    if (!path) return
    const L = path.getTotalLength()
    setDots(
      Array.from({ length: total }, (_, i) => {
        const p = path.getPointAtLength(L * fracFor(i))
        return { x: p.x, y: p.y }
      }),
    )
  }, [total])

  // move the car with ease-out; respect reduced motion
  useEffect(() => {
    const path = trackRef.current
    const car = carRef.current
    if (!path || !car) return
    const L = path.getTotalLength()

    const place = (f) => {
      const p = path.getPointAtLength(L * f)
      const q = path.getPointAtLength(Math.min(L * f + 1, L))
      const ang = (Math.atan2(q.y - p.y, q.x - p.x) * 180) / Math.PI
      car.setAttribute('transform', `translate(${p.x.toFixed(1)} ${p.y.toFixed(1)}) rotate(${ang.toFixed(1)})`)
    }

    if (reduced) {
      place(targetFrac)
      return
    }
    const from = animFrac.current
    const to = targetFrac
    if (from === to) {
      place(to)
      return
    }
    const start = performance.now()
    const dur = 520
    let raf
    const tick = (now) => {
      const k = Math.min((now - start) / dur, 1)
      const e = 1 - (1 - k) ** 3
      const f = from + (to - from) * e
      animFrac.current = f
      place(f)
      if (k < 1) raf = requestAnimationFrame(tick)
      else animFrac.current = to
    }
    raf = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(raf)
  }, [targetFrac, reduced])

  const labels =
    lang === 'kr' ? ['시작', '피니시'] :
    lang === 'zh' ? ['起点', '终点'] :
    lang === 'vi' ? ['Khởi đầu', 'Về đích'] :
    lang === 'mn' ? ['Эхлэл', 'Бүтээл'] : ['START', 'FINISH']

  return (
    <div className="mt-6" aria-hidden>
      <svg viewBox={`0 0 ${W} ${H}`} className="w-full">
        {/* track base */}
        <path
          ref={trackRef}
          d={TRACK_D}
          fill="none"
          stroke="#2b2b3a"
          strokeWidth="3"
          strokeLinecap="round"
          strokeDasharray="1 9"
        />
        {/* progress overlay: red dashes up to current position */}
        <path
          d={TRACK_D}
          fill="none"
          stroke="#e10600"
          strokeWidth="3"
          strokeLinecap="round"
          pathLength="1"
          strokeDasharray={`${targetFrac} 1`}
        />
        {/* waypoints */}
        {dots.map((d, i) => {
          const done = i < index
          const current = i === index
          return (
            <circle
              key={i}
              cx={d.x}
              cy={d.y}
              r={current ? 6 : 4.5}
              fill={done ? '#e10600' : current ? '#ffffff' : '#1c1c28'}
              stroke={current ? '#e10600' : done ? '#e10600' : '#3a3a4c'}
              strokeWidth="2"
              className={current ? 'pulse' : ''}
            />
          )
        })}
        {/* car */}
        <g ref={carRef}>
          <circle r="9" fill="#15151e" opacity="0.85" />
          <path d="M-10 -3.5 L4 -3.5 L12 0 L4 3.5 L-10 3.5 L-12 0 Z" fill="#e10600" stroke="#ffffff" strokeWidth="1" />
          <rect x="-12" y="-4.5" width="2.5" height="9" fill="#ffffff" />
        </g>
        {/* start/finish labels */}
        <text x="24" y={H - 8} fill="#7a7a85" fontSize="10" fontFamily="Chakra Petch, sans-serif" fontWeight="600" letterSpacing="2">
          {labels[0]}
        </text>
        <text x={W - 24} y={H - 8} fill="#7a7a85" fontSize="10" fontFamily="Chakra Petch, sans-serif" fontWeight="600" letterSpacing="2" textAnchor="end">
          {labels[1]}
        </text>
      </svg>
    </div>
  )
}
