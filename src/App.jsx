import { useEffect, useState } from 'react'
import { questions } from './data/questions.js'
import { ui } from './i18n.js'
import { submitResponse } from './supabase.js'
import { AdminGate } from './Admin.jsx'

function LangToggle({ lang, setLang }) {
  return (
    <button
      onClick={() => setLang(lang === 'en' ? 'kr' : 'en')}
      className="rounded-full border border-hairline bg-surface/80 px-4 py-1.5 text-sm font-semibold text-ink-2 backdrop-blur transition hover:border-f1-soft hover:text-ink"
    >
      {ui[lang].otherLang}
    </button>
  )
}

function Intro({ lang, setLang, onStart }) {
  const t = ui[lang]
  return (
    <div className="mx-auto flex min-h-dvh max-w-2xl flex-col px-4 py-8">
      <div className="flex justify-end">
        <LangToggle lang={lang} setLang={setLang} />
      </div>
      <div className="mb-auto mt-auto">
        <div className="overflow-hidden rounded-2xl border border-hairline bg-surface shadow-2xl">
          {/* hero image */}
          <div className="relative h-44 sm:h-56">
            <img
              src="/F1-survey/images/night-blur.jpg"
              alt=""
              className="absolute inset-0 h-full w-full object-cover object-[50%_28%]"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-surface via-surface/40 to-transparent" />
            <div className="absolute bottom-0 left-0 p-6 sm:p-8">
              <p className="text-xs font-bold uppercase tracking-[0.2em] text-f1-soft">
                {lang === 'en' ? 'Survey' : '설문조사'}
              </p>
              <h1 className="mt-1 text-2xl font-extrabold leading-tight sm:text-3xl">{t.title}</h1>
            </div>
          </div>

          <div className="p-6 sm:p-8">
            <p className="text-lg font-semibold text-ink">{t.subtitle}</p>

            <div className="mt-6 space-y-5">
              <div>
                <h2 className="text-sm font-bold uppercase tracking-wider text-ink-muted">
                  {t.purposeLabel}
                </h2>
                <p className="mt-1 text-ink-2">{t.purpose}</p>
              </div>
              <div>
                <h2 className="text-sm font-bold uppercase tracking-wider text-ink-muted">
                  {t.instructionsLabel}
                </h2>
                <p className="mt-1 text-ink-2">{t.instructions}</p>
              </div>
            </div>

            <div className="mt-6 rounded-xl border border-hairline bg-page px-5 py-4 text-sm text-ink-2">
              ※ {t.anonymity}
            </div>

            <button
              onClick={onStart}
              className="mt-6 w-full rounded-xl bg-f1 py-4 text-lg font-bold text-white shadow-lg transition hover:brightness-110 active:scale-[0.99]"
            >
              {t.start}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

function Survey({ lang, setLang, answers, setAnswers, onSubmit, submitting }) {
  const t = ui[lang]
  const [index, setIndex] = useState(0)
  const [showError, setShowError] = useState(false)
  const q = questions[index]
  const selected = answers[q.id]
  const isLast = index === questions.length - 1

  const handleSelect = (optIndex) => {
    setAnswers({ ...answers, [q.id]: optIndex })
    setShowError(false)
    if (!isLast) {
      setTimeout(() => setIndex(index + 1), 180)
    }
  }

  const handleNext = () => {
    if (selected === undefined) {
      setShowError(true)
      return
    }
    if (isLast) {
      onSubmit()
    } else {
      setIndex(index + 1)
    }
  }

  const progress = ((index + (selected !== undefined ? 1 : 0)) / questions.length) * 100

  return (
    <div className="mx-auto flex min-h-dvh max-w-2xl flex-col px-4 py-8">
      <div className="flex items-center justify-between">
        <span className="text-sm font-semibold tabular-nums text-ink-muted">
          {t.question} {index + 1} {t.of} {questions.length}
        </span>
        <LangToggle lang={lang} setLang={setLang} />
      </div>

      <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-hairline">
        <div
          className="h-full rounded-full bg-f1 transition-all duration-300"
          style={{ width: `${progress}%` }}
        />
      </div>

      <div className="mt-10" key={q.id}>
        <h2 className="text-xl font-bold leading-snug sm:text-2xl">
          {lang === 'en' ? q.en : q.kr}
        </h2>

        <div className="mt-6 space-y-3">
          {q.options.map((opt, i) => {
            const active = selected === i
            return (
              <button
                key={i}
                onClick={() => handleSelect(i)}
                className={`flex w-full items-center gap-4 rounded-xl border-2 px-5 py-4 text-left transition ${
                  active
                    ? 'border-f1 bg-f1/10 font-semibold text-ink shadow-md'
                    : 'border-hairline bg-surface text-ink-2 hover:border-baseline'
                }`}
              >
                <span
                  className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full border-2 text-xs font-bold ${
                    active ? 'border-f1 bg-f1 text-white' : 'border-baseline text-ink-muted'
                  }`}
                >
                  {i + 1}
                </span>
                <span>{lang === 'en' ? opt.en : opt.kr}</span>
              </button>
            )
          })}
        </div>

        {showError && (
          <p className="mt-4 text-sm font-semibold text-f1-soft">⚠ {t.pickOne}</p>
        )}

        <div className="mt-8 flex gap-3">
          {index > 0 && (
            <button
              onClick={() => { setIndex(index - 1); setShowError(false) }}
              className="rounded-xl border border-hairline bg-surface px-6 py-3 font-semibold text-ink-2 transition hover:border-baseline"
            >
              {t.back}
            </button>
          )}
          <button
            onClick={handleNext}
            disabled={submitting}
            className="flex-1 rounded-xl bg-f1 py-3 text-lg font-bold text-white shadow-lg transition hover:brightness-110 active:scale-[0.99] disabled:opacity-60"
          >
            {submitting ? '…' : isLast ? t.submit : t.next}
          </button>
        </div>
      </div>
    </div>
  )
}

function Done({ lang, setLang, answers, onRestart }) {
  const t = ui[lang]
  const [copied, setCopied] = useState(false)

  const payload = {
    survey: 'f1-championship',
    version: 1,
    submittedAt: new Date().toISOString(),
    answers: Object.fromEntries(
      questions.map((q) => [q.id, answers[q.id] + 1]),
    ),
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
    <div className="mx-auto flex min-h-dvh max-w-2xl flex-col px-4 py-8">
      <div className="flex justify-end">
        <LangToggle lang={lang} setLang={setLang} />
      </div>
      <div className="mb-auto mt-auto rounded-2xl border border-hairline bg-surface p-8 text-center shadow-2xl sm:p-12">
        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-f1/15 text-3xl">
          🏁
        </div>
        <h1 className="mt-6 text-2xl font-extrabold sm:text-3xl">{t.doneTitle}</h1>
        <p className="mx-auto mt-3 max-w-md text-ink-2">{t.doneBody}</p>

        <div className="mx-auto mt-8 max-w-sm space-y-3">
          <button
            onClick={download}
            className="w-full rounded-xl border border-hairline bg-page py-3 font-semibold text-ink-2 transition hover:border-baseline"
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
  )
}

function AdminLink({ lang }) {
  const t = ui[lang]
  return (
    <a
      href="#/admin"
      className="fixed bottom-3 right-3 z-10 rounded-full border border-hairline bg-surface/80 px-3 py-1 text-[11px] font-semibold text-ink-muted backdrop-blur transition hover:text-ink"
    >
      {t.admin}
    </a>
  )
}

export default function App() {
  const [lang, setLang] = useState('kr')
  const [stage, setStage] = useState('intro') // intro | survey | done
  const [answers, setAnswers] = useState({})
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    const onHash = () => {
      if (window.location.hash === '#/admin') {
        setStage('admin')
      } else {
        setStage((s) => (s === 'admin' ? 'intro' : s))
      }
    }
    window.addEventListener('hashchange', onHash)
    onHash()
    return () => window.removeEventListener('hashchange', onHash)
  }, [])

  const handleSubmit = async () => {
    setSubmitting(true)
    const numbered = Object.fromEntries(
      questions.map((q) => [q.id, answers[q.id] + 1]),
    )
    try {
      await submitResponse(numbered)
    } catch (err) {
      console.error('Submission failed', err)
    }
    setSubmitting(false)
    setStage('done')
  }

  if (stage === 'admin') {
    return (
      <div className="min-h-dvh bg-page">
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
    <div className="min-h-dvh bg-page">
      {/* subtle texture: aerial track photo, heavily dimmed */}
      <div
        className="pointer-events-none fixed inset-0 opacity-[0.06]"
        style={{
          backgroundImage: 'url(/F1-survey/images/track-aerial.jpg)',
          backgroundSize: 'cover',
          backgroundPosition: 'center',
        }}
      />
      <div className="relative">
        {stage === 'intro' && (
          <Intro lang={lang} setLang={setLang} onStart={() => setStage('survey')} />
        )}
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
          <Done lang={lang} setLang={setLang} answers={answers} onRestart={() => { setAnswers({}); setStage('intro') }} />
        )}
      </div>
      <AdminLink lang={lang} />
    </div>
  )
}
