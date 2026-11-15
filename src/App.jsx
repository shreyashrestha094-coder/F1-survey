import { useState } from 'react'
import { questions } from './data/questions.js'
import { ui } from './i18n.js'

function LangToggle({ lang, setLang }) {
  return (
    <button
      onClick={() => setLang(lang === 'en' ? 'kr' : 'en')}
      className="rounded-full border border-neutral-300 bg-white px-4 py-1.5 text-sm font-semibold text-neutral-700 shadow-sm transition hover:border-f1 hover:text-f1"
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
      <div className="mt-auto mb-auto rounded-2xl bg-white p-8 shadow-lg sm:p-12">
        <p className="text-sm font-bold uppercase tracking-widest text-f1">
          {lang === 'en' ? 'Survey' : '설문조사'}
        </p>
        <h1 className="mt-2 text-3xl font-extrabold leading-tight sm:text-4xl">
          {t.title}
        </h1>
        <p className="mt-3 text-lg text-neutral-600">{t.subtitle}</p>

        <div className="mt-8 space-y-5">
          <div>
            <h2 className="font-bold text-neutral-900">{t.purposeLabel}</h2>
            <p className="mt-1 text-neutral-600">{t.purpose}</p>
          </div>
          <div>
            <h2 className="font-bold text-neutral-900">{t.instructionsLabel}</h2>
            <p className="mt-1 text-neutral-600">{t.instructions}</p>
          </div>
        </div>

        <div className="mt-8 rounded-xl bg-red-50 px-5 py-4 text-sm text-red-800">
          ※ {t.anonymity}
        </div>

        <button
          onClick={onStart}
          className="mt-8 w-full rounded-xl bg-f1 py-4 text-lg font-bold text-white shadow-md transition hover:brightness-110 active:scale-[0.99]"
        >
          {t.start}
        </button>
      </div>
    </div>
  )
}

function Survey({ lang, setLang, answers, setAnswers, onSubmit }) {
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
        <span className="text-sm font-semibold text-neutral-500">
          {t.question} {index + 1} {t.of} {questions.length}
        </span>
        <LangToggle lang={lang} setLang={setLang} />
      </div>

      <div className="mt-3 h-2 overflow-hidden rounded-full bg-neutral-200">
        <div
          className="h-full rounded-full bg-f1 transition-all duration-300"
          style={{ width: `${progress}%` }}
        />
      </div>

      <div className="mt-8" key={q.id}>
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
                    ? 'border-f1 bg-red-50 font-semibold text-neutral-900 shadow-sm'
                    : 'border-neutral-200 bg-white text-neutral-700 hover:border-neutral-400'
                }`}
              >
                <span
                  className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full border-2 text-xs font-bold ${
                    active ? 'border-f1 bg-f1 text-white' : 'border-neutral-300 text-neutral-400'
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
          <p className="mt-4 text-sm font-semibold text-f1">⚠ {t.pickOne}</p>
        )}

        <div className="mt-8 flex gap-3">
          {index > 0 && (
            <button
              onClick={() => { setIndex(index - 1); setShowError(false) }}
              className="rounded-xl border border-neutral-300 bg-white px-6 py-3 font-semibold text-neutral-700 transition hover:border-neutral-500"
            >
              {t.back}
            </button>
          )}
          <button
            onClick={handleNext}
            className="flex-1 rounded-xl bg-f1 py-3 text-lg font-bold text-white shadow-md transition hover:brightness-110 active:scale-[0.99]"
          >
            {isLast ? t.submit : t.next}
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
      <div className="mt-auto mb-auto rounded-2xl bg-white p-8 text-center shadow-lg sm:p-12">
        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-green-100 text-3xl">
          ✓
        </div>
        <h1 className="mt-6 text-2xl font-extrabold sm:text-3xl">{t.doneTitle}</h1>
        <p className="mx-auto mt-3 max-w-md text-neutral-600">{t.doneBody}</p>

        <div className="mx-auto mt-8 max-w-sm space-y-3">
          <button
            onClick={download}
            className="w-full rounded-xl bg-f1 py-4 text-lg font-bold text-white shadow-md transition hover:brightness-110 active:scale-[0.99]"
          >
            {t.download}
          </button>
          <button
            onClick={copy}
            className="w-full rounded-xl border border-neutral-300 bg-white py-3 font-semibold text-neutral-700 transition hover:border-neutral-500"
          >
            {copied ? `✓ ${t.copied}` : t.copy}
          </button>
          <button
            onClick={onRestart}
            className="w-full py-2 text-sm text-neutral-500 underline transition hover:text-neutral-800"
          >
            {t.restart}
          </button>
        </div>
      </div>
    </div>
  )
}

export default function App() {
  const [lang, setLang] = useState('kr')
  const [stage, setStage] = useState('intro') // intro | survey | done
  const [answers, setAnswers] = useState({})

  return (
    <div className="min-h-dvh bg-gradient-to-b from-neutral-100 to-neutral-200">
      {stage === 'intro' && (
        <Intro lang={lang} setLang={setLang} onStart={() => setStage('survey')} />
      )}
      {stage === 'survey' && (
        <Survey
          lang={lang}
          setLang={setLang}
          answers={answers}
          setAnswers={setAnswers}
          onSubmit={() => setStage('done')}
        />
      )}
      {stage === 'done' && (
        <Done lang={lang} setLang={setLang} answers={answers} onRestart={() => { setAnswers({}); setStage('intro') }} />
      )}
    </div>
  )
}
