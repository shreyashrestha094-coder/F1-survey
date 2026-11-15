import { useEffect, useRef, useState } from 'react'
import { LANGS } from './data/questions.js'

export function LangSelect({ lang, setLang }) {
  const [open, setOpen] = useState(false)
  const ref = useRef(null)

  useEffect(() => {
    const onClick = (e) => {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false)
    }
    document.addEventListener('click', onClick)
    return () => document.removeEventListener('click', onClick)
  }, [])

  const current = LANGS.find((l) => l.code === lang)

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setOpen(!open)}
        className="cut-corner-sm flex items-center gap-2 border border-hairline bg-surface/80 px-3.5 py-1.5 text-sm font-semibold text-ink-2 backdrop-blur transition hover:border-ink-muted hover:text-ink"
      >
        <span className="h-1.5 w-1.5 bg-f1" />
        {current?.name}
        <span className="text-[10px] text-ink-muted">▼</span>
      </button>
      {open && (
        <div className="absolute right-0 z-20 mt-2 w-40 border border-hairline bg-surface shadow-2xl">
          {LANGS.map((l) => (
            <button
              key={l.code}
              onClick={() => { setLang(l.code); setOpen(false) }}
              className={`flex w-full items-center gap-2 px-4 py-2.5 text-left text-sm transition hover:bg-hairline/40 ${
                l.code === lang ? 'font-bold text-ink' : 'text-ink-2'
              }`}
            >
              <span className={`h-1.5 w-1.5 ${l.code === lang ? 'bg-f1' : 'bg-transparent'}`} />
              {l.name}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}

export function TopBar({ lang, setLang }) {
  return (
    <header className="sticky top-0 z-30 border-b border-hairline bg-carbon/85 backdrop-blur">
      <div className="mx-auto flex max-w-5xl items-center justify-between px-4 py-3">
        <a href="#" className="group flex items-center gap-2.5">
          <span className="slant font-display text-lg font-bold italic tracking-tight text-ink">
            F1<span className="ml-1.5 inline-block h-4 w-1 bg-f1 align-middle" />
          </span>
          <span className="font-display text-xs font-semibold uppercase tracking-[0.18em] text-ink-muted transition group-hover:text-ink-2">
            Survey
          </span>
        </a>
        <LangSelect lang={lang} setLang={setLang} />
      </div>
    </header>
  )
}
