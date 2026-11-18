import { useEffect, useRef, useState } from 'react'
import { questions, getOptions } from './data/questions.js'
import { ui } from './i18n.js'
import { submitResponse } from './supabase.js'
import { TopBar } from './components.jsx'
import { AdminGate } from './Admin.jsx'
import RaceProgress from './RaceProgress.jsx'

const STATE_KEY = 'f1-survey-state'

function Intro({ lang, onStart }) {
  const t = ui[lang]
  return (
    <div className="mx-auto max-w-2xl px-4 pb-16">
      <div className="relative mt-6 overflow-hidden border border-hairline bg-surface">
        <div className="relative h-52 sm:h-64">
          <img
            src="/F1-survey/images/night-blur.jpg"
            alt=""
            className="absolute inset-0 h-full w-full object-cover object-[50%_28%]"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-surface via-carbon/30 to-transparent" />
          <div className="absolute bottom-0 left-0 p-6 sm:p-8">
            <p className="slant inline-block bg-f1 px-2.5 py-1 font-display text-[11px] font-bold uppercase tracking-[0.2em] text-white">
              {lang === 'en' ? 'Survey' : lang === 'kr' ? '설문조사' : lang === 'zh' ? '调查' : lang === 'vi' ? 'Khảo sát' : 'Судалгаа'}
            </p>
            <h1 className="font-display mt-3 text-2xl font-bold uppercase italic leading-tight sm:text-3xl">
              {t.title}
            </h1>
          </div>
        </div>

        <div className="p-6 sm:p-8">
          <p className="font-display text-lg font-semibold text-ink">{t.subtitle}</p>

          <div className="mt-6 space-y-5">
            <div className="border-l-2 border-f1 pl-4">
              <h2 className="font-display text-sm font-semibold uppercase tracking-wider text-ink-muted">
                {t.purposeLabel}
              </h2>
              <p className="mt-1 text-ink-2">{t.purpose}</p>
            </div>
            <div className="border-l-2 border-baseline pl-4">
              <h2 className="font-display text-sm font-semibold uppercase tracking-wider text-ink-muted">
                {t.instructionsLabel}
              </h2>
              <p className="mt-1 text-ink-2">{t.instructions}</p>
            </div>
          </div>

          <div className="mt-6 border border-hairline bg-carbon px-5 py-4 text-sm text-ink-2">
            ※ {t.anonymity}
          </div>

          <button
            onClick={onStart}
            className="glow cut-corner mt-8 w-full bg-f1 py-4 font-display text-lg font-bold uppercase italic tracking-wide text-white transition hover:brightness-110 active:scale-[0.99]"
          >
            {t.start} →
          </button>
        </div>
      </div>
    </div>
  )
}

function Survey({ lang, setLang, answers, setAnswers, onSubmit, submitting }) {
  const t = ui[lang]
  const firstUnanswered = Math.max(
    questions.findIndex((x) => answers[x.id] === undefined),
    0,
  )
  const [index, setIndex] = useState(firstUnanswered)
  const [dir, setDir] = useState('next')
  const [showError, setShowError] = useState(false)
  const [shakeNext, setShakeNext] = useState(false)
  const headingRef = useRef(null)
  const TOTAL = questions.length + 1 // 8 choice questions + 1 open question
  const isOpen = index >= questions.length
  const q = questions[Math.min(index, questions.length - 1)]
  const selected = answers[q.id]
  const isLast = isOpen

  // focus heading + scroll top on question change (a11y)
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' })
    headingRef.current?.focus({ preventScroll: true })
  }, [index])

  const go = (nextIndex) => {
    setDir(nextIndex > index ? 'next' : 'back')
    setShowError(false)
    setIndex(nextIndex)
  }

  const handleSelect = (optIndex) => {
    setAnswers({ ...answers, [q.id]: optIndex })
    setShowError(false)
    if (!isLast) {
      setTimeout(() => {
        setDir('next')
        setIndex((i) => (i === index ? index + 1 : i))
      }, 180)
    }
  }

  const handleNext = () => {
    if (isOpen) {
      if (!answers.respondent_name?.trim()) {
        setShowError(true)
        return
      }
      onSubmit()
      return
    }
    if (selected === undefined) {
      setShowError(true)
      setShakeNext(true)
      setTimeout(() => setShakeNext(false), 250)
      return
    }
    if (isLast) {
      onSubmit()
    } else {
      go(index + 1)
    }
  }

  // keyboard: 1-9 select, arrows navigate, Enter next/submit
  useEffect(() => {
    const onKey = (e) => {
      if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return
      const n = parseInt(e.key, 10)
      if (!isOpen && n >= 1 && n <= getOptions(q, lang).length) handleSelect(n - 1)
      else if (e.key === 'ArrowRight' && !isLast) go(index + 1)
      else if (e.key === 'ArrowLeft' && index > 0) go(index - 1)
      else if (e.key === 'Enter' && !isOpen) handleNext()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  })

  const answered = questions.filter((x) => answers[x.id] !== undefined).length

  return (
    <div className="mx-auto max-w-2xl px-4 pb-16">
      {/* race-track progress: car moves one corner per question */}
      <RaceProgress index={index} total={TOTAL} lang={lang} />
      <div className="mt-1 flex items-center justify-between">
        <span className="font-display text-sm font-semibold tracking-wider text-ink-muted">
          {t.qOf(index + 1, TOTAL)}
        </span>
        <span className="font-display text-xs tabular-nums text-ink-muted">{answered}/{questions.length}</span>
      </div>

      <div key={isOpen ? 'open' : q.id} className={dir === 'next' ? 'anim-next' : 'anim-back'}>
        {!isOpen ? (
          <>
            <h2
              ref={headingRef}
              tabIndex={-1}
              className="font-display mt-10 text-xl font-bold leading-snug outline-none sm:text-2xl"
            >
              <span className="mr-3 inline-block h-6 w-1 bg-f1 align-middle" />
              {lang === 'en' ? q.en : lang === 'kr' ? q.kr : lang === 'zh' ? q.zh : lang === 'vi' ? q.vi : q.mn}
            </h2>

            <div className="mt-7 space-y-3.5">
              {getOptions(q, lang).map((opt, i) => {
                const active = selected === i
                const label = opt.label ?? (lang === 'en' ? opt.en : lang === 'kr' ? opt.kr : lang === 'zh' ? opt.zh : lang === 'vi' ? opt.vi : opt.mn)
                return (
                  <button
                    key={i}
                    onClick={() => handleSelect(i)}
                    className={`opt cut-corner-sm group flex w-full items-center gap-4 border-2 px-5 py-4 text-left ${
                      active
                        ? 'opt-active border-f1 bg-f1/10 font-semibold text-ink'
                        : 'border-hairline bg-surface text-ink-2 hover:border-f1/50 hover:bg-surface/70 hover:pl-6'
                    }`}
                  >
                    <span
                      className={`font-display flex h-8 w-8 shrink-0 items-center justify-center text-sm font-bold transition ${
                        active ? 'bg-f1 text-white' : 'bg-hairline text-ink-muted group-hover:bg-baseline group-hover:text-ink-2'
                      }`}
                      style={{ clipPath: 'polygon(0 0, calc(100% - 6px) 0, 100% 6px, 100% 100%, 6px 100%, 0 calc(100% - 6px))' }}
                    >
                      {i + 1}
                    </span>
                    <span>{label}</span>
                    {active && (
                      <span className="ml-auto font-display text-f1">▸</span>
                    )}
                  </button>
                )
              })}
            </div>

            {showError && (
              <p className="mt-5 font-display text-sm font-semibold text-chart-red">⚠ {t.pickOne}</p>
            )}
          </>
        ) : (
          <>
            <h2
              ref={headingRef}
              tabIndex={-1}
              className="font-display mt-10 text-xl font-bold leading-snug outline-none sm:text-2xl"
            >
              <span className="mr-3 inline-block h-6 w-1 bg-f1 align-middle" />
              {t.openTitle}
            </h2>
            <p className="mt-3 text-sm text-ink-muted">{t.optional}</p>

            <label className="font-display mt-7 block text-sm font-semibold uppercase tracking-wider text-ink-muted">
              {t.nameLabel} *
            </label>
            <input
              type="text"
              value={answers.respondent_name || ''}
              required
              aria-required="true"
              aria-invalid={showError && !answers.respondent_name?.trim()}
              onChange={(e) => {
                setAnswers({ ...answers, respondent_name: e.target.value })
                if (e.target.value.trim()) setShowError(false)
              }}
              placeholder={t.namePlaceholder}
              maxLength={100}
              className="mt-2 w-full border border-hairline bg-surface px-4 py-3.5 text-ink outline-none transition placeholder:text-ink-muted focus:border-f1"
            />

            {showError && !answers.respondent_name?.trim() && (
              <p role="alert" className="mt-2 text-sm font-semibold text-chart-red">
                {lang === 'kr' ? '이름을 입력해 주세요.' : lang === 'zh' ? '请输入姓名。' : lang === 'vi' ? 'Vui lòng nhập tên.' : lang === 'mn' ? 'Нэрээ оруулна уу.' : 'Please enter your name.'}
              </p>
            )}

            <label className="font-display mt-6 block text-sm font-semibold uppercase tracking-wider text-ink-muted">
              {t.feedbackLabel} · {t.optional}
            </label>
            <textarea
              value={answers.q9 || ''}
              onChange={(e) => setAnswers({ ...answers, q9: e.target.value })}
              placeholder={t.feedbackPlaceholder}
              rows={5}
              maxLength={1000}
              className="mt-2 w-full resize-y border border-hairline bg-surface px-4 py-3.5 text-ink outline-none transition placeholder:text-ink-muted focus:border-f1"
            />
          </>
        )}

        <div className="mt-10 flex gap-3">
          {index > 0 && (
            <button
              onClick={() => go(index - 1)}
              className="cut-corner-sm border border-hairline bg-surface px-6 py-3 font-display font-semibold text-ink-2 transition hover:border-baseline"
            >
              ← {t.back}
            </button>
          )}
          <button
            onClick={handleNext}
            disabled={submitting}
            aria-disabled={!isOpen && selected === undefined}
            className={`cut-corner flex-1 bg-f1 py-3.5 font-display text-lg font-bold uppercase italic tracking-wide text-white transition hover:brightness-110 active:scale-[0.99] disabled:opacity-60 ${
              !isOpen && selected === undefined ? 'opacity-50' : ''
            } ${shakeNext ? 'shake' : ''}`}
          >
            {submitting ? '…' : isLast ? `${t.submit} →` : `${t.next} →`}
          </button>
        </div>

        <p className="mt-4 text-center text-[11px] text-ink-muted">
          {lang === 'kr' ? '키보드: 숫자로 선택, ←/→ 이동, Enter 다음' :
           lang === 'zh' ? '键盘：数字选择，←/→ 切换，Enter 下一题' :
           lang === 'vi' ? 'Bàn phím: số để chọn, ←/→ để chuyển, Enter để tiếp tục' :
           lang === 'mn' ? 'Гараас: тоо сонгох, ←/→ шилжих, Enter үргэлжлүүлэх' :
           'Keyboard: number to select, ←/→ to navigate, Enter for next'}
        </p>
      </div>
    </div>
  )
}

function Done({ lang, answers, onRestart }) {
  const t = ui[lang]
  const [copied, setCopied] = useState(false)

  const payload = {
    survey: 'f1-championship',
    version: 1,
    submittedAt: new Date().toISOString(),
    answers: Object.fromEntries(questions.map((q) => [q.id, answers[q.id] + 1])),
  }
  const json = JSON.stringify(payload, null, 2)

  const download = () => {
    const blob = new Blob([json], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'f1-survey-response.json'
    a.click()
    URL.revokeObjectURL(url)
  }

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(json)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch {
      window.prompt('Copy the text below:', json)
    }
  }

  return (
    <div className="mx-auto max-w-2xl px-4 pb-16">
      <div className="mt-10 border border-hairline bg-surface text-center">
        {/* checkered flag banner */}
        <div className="checkered h-10 opacity-90" />
        <div className="p-8 sm:p-12">
          <div className="relative mx-auto h-20 w-20">
            <div className="glow absolute inset-0 flex items-center justify-center bg-f1 font-display text-3xl text-white" style={{ clipPath: 'polygon(0 0, calc(100% - 14px) 0, 100% 14px, 100% 100%, 14px 100%, 0 calc(100% - 14px))' }}>
              ✓
            </div>
            {/* passport-style stamp slam */}
            <div className="stamp pointer-events-none absolute -right-8 -top-4 border-4 border-white px-2 py-1 font-display text-[11px] font-bold uppercase tracking-widest text-white" style={{ background: 'rgba(21,21,30,0.85)', borderColor: '#e10600' }}>
              FINISH
            </div>
          </div>
          <h1 className="font-display mt-6 text-2xl font-bold uppercase italic sm:text-3xl">{t.doneTitle}</h1>
          <p className="mx-auto mt-3 max-w-md text-ink-2">{t.doneBody}</p>

          <div className="mx-auto mt-8 max-w-sm space-y-3">
            <button
              onClick={download}
              className="cut-corner-sm w-full border border-hairline bg-carbon py-3 font-display font-semibold text-ink-2 transition hover:border-baseline"
            >
              {t.download}
            </button>
            <button
              onClick={copy}
              className="w-full py-2 text-sm text-ink-muted underline transition hover:text-ink"
            >
              {copied ? `✓ ${t.copied}` : t.copy}
            </button>
            <button
              onClick={onRestart}
              className="w-full py-2 text-sm text-ink-muted underline transition hover:text-ink"
            >
              {t.restart}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

export default function App() {
  const [lang, setLang] = useState(() => localStorage.getItem('f1-lang') || 'kr')
  const saved = (() => {
    try {
      return JSON.parse(localStorage.getItem(STATE_KEY)) || {}
    } catch {
      return {}
    }
  })()
  const [stage, setStage] = useState(saved.stage || 'intro') // intro | survey | done | admin
  const [answers, setAnswers] = useState(saved.answers || {})
  const [submitting, setSubmitting] = useState(false)

  // resume support: persist stage + answers
  useEffect(() => {
    if (stage === 'survey' || stage === 'done') {
      localStorage.setItem(STATE_KEY, JSON.stringify({ stage, answers }))
    }
  }, [stage, answers])

  useEffect(() => {
    localStorage.setItem('f1-lang', lang)
    document.documentElement.lang = lang === 'kr' ? 'ko' : lang
  }, [lang])

  useEffect(() => {
    const applyHash = () => {
      if (window.location.hash === '#/admin') setStage('admin')
      else setStage((s) => (s === 'admin' ? 'intro' : s))
    }
    window.addEventListener('hashchange', applyHash)
    applyHash()
    return () => window.removeEventListener('hashchange', applyHash)
  }, [])

  const handleSubmit = async () => {
    if (!answers.respondent_name?.trim() || submitting) return
    setSubmitting(true)
    const numbered = Object.fromEntries(questions.map((q) => [q.id, answers[q.id] + 1]))
    const extras = {
      q9: answers.q9?.trim() || null,
      respondent_name: answers.respondent_name?.trim() || null,
    }
    try {
      await submitResponse(numbered, extras)
    } catch (err) {
      console.error('Submission failed', err)
    }
    setSubmitting(false)
    setStage('done')
  }

  if (stage === 'admin') {
    return (
      <div className="min-h-dvh bg-carbon">
        <TopBar lang={lang} setLang={setLang} />
        <AdminGate lang={lang} onLogout={() => { window.location.hash = '' }} />
        <div className="fixed bottom-3 left-3 z-10">
          <a href="#" className="text-[11px] font-semibold text-ink-muted underline hover:text-ink">
            ← {ui[lang].title}
          </a>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-dvh bg-carbon">
      {/* dimmed aerial track texture */}
      <div
        className="pointer-events-none fixed inset-0 opacity-[0.05]"
        style={{
          backgroundImage: 'url(/F1-survey/images/track-aerial.jpg)',
          backgroundSize: 'cover',
          backgroundPosition: 'center',
        }}
      />
      <div className="relative">
        <TopBar lang={lang} setLang={setLang} />
        {stage === 'intro' && <Intro lang={lang} onStart={() => setStage('survey')} />}
        {stage === 'survey' && (
          <Survey
            lang={lang}
            setLang={setLang}
            answers={answers}
            setAnswers={setAnswers}
            onSubmit={handleSubmit}
            submitting={submitting}
          />
        )}
        {stage === 'done' && (
          <Done lang={lang} answers={answers} onRestart={() => { localStorage.removeItem(STATE_KEY); setAnswers({}); setStage('intro') }} />
        )}
      </div>
    </div>
  )
}

 
