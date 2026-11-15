import { useEffect, useMemo, useRef, useState } from 'react'
import { questions, getOptions } from './data/questions.js'
import { ui } from './i18n.js'
import { fetchResponses, supabaseConfigured } from './supabase.js'

const ADMIN_PASSWORD = '1234'

const LIKERT = ['q5', 'q6', 'q7']

// count-up for stat tiles
function useCountUp(target, duration = 600) {
  const [value, setValue] = useState(0)
  const prev = useRef(0)
  useEffect(() => {
    const from = prev.current
    const start = performance.now()
    let raf
    const tick = (now) => {
      const p = Math.min((now - start) / duration, 1)
      const eased = 1 - (1 - p) ** 3
      setValue(Math.round(from + (target - from) * eased))
      if (p < 1) raf = requestAnimationFrame(tick)
      else prev.current = target
    }
    raf = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(raf)
  }, [target, duration])
  return value
}

function StatTile({ label, value }) {
  const counted = useCountUp(value)
  return (
    <div className="cut-corner-sm border border-hairline bg-surface px-6 py-5">
      <p className="font-display text-xs font-semibold uppercase tracking-wider text-ink-muted">{label}</p>
      <p className="font-display mt-2 text-3xl font-bold tabular-nums text-ink">{counted}</p>
    </div>
  )
}

function BarChart({ q, lang, counts, total }) {
  const text = (o) => (o.label ?? (lang === 'en' ? o.en : lang === 'kr' ? o.kr : lang === 'zh' ? o.zh : lang === 'vi' ? o.vi : o.mn))
  const opts = getOptions(q, lang)
  const max = Math.max(...counts, 1)
  return (
    <div className="border border-hairline bg-surface p-6">
      <h3 className="font-display text-sm font-bold leading-snug">{text(q)}</h3>
      <div className="mt-5 space-y-3">
        {opts.map((opt, i) => {
          const count = counts[i]
          const pct = total ? Math.round((count / total) * 100) : 0
          return (
            <div key={i} className="group flex items-center gap-3 text-xs" title={`${count} (${pct}%)`}>
              <span className="w-36 shrink-0 truncate text-ink-2 sm:w-52" title={text(opt)}>
                {i + 1}. {text(opt)}
              </span>
              <div className="flex flex-1 items-center gap-2.5">
                <div className="relative h-5 flex-1 bg-hairline/40">
                  <div
                    className="bar-grow absolute inset-y-0 left-0 bg-chart-red transition-all group-hover:brightness-125"
                    style={{ width: `${(count / max) * 100}%` }}
                  />
                </div>
                <span className="w-16 shrink-0 whitespace-nowrap text-right font-semibold tabular-nums text-ink-2">
                  {count} ({pct}%)
                </span>
              </div>
            </div>
          )
        })}
      </div>
      <p className="mt-4 text-right text-[11px] text-ink-muted">n = {total}</p>
    </div>
  )
}

function DivergingChart({ q, lang, counts, total }) {
  const text = (o) => (lang === 'en' ? o.en : lang === 'kr' ? o.kr : lang === 'zh' ? o.zh : lang === 'vi' ? o.vi : o.mn)
  const agreePct = ((counts[0] + counts[1]) / total) * 100
  const neutralPct = (counts[2] / total) * 100
  const disagreePct = ((counts[3] + counts[4]) / total) * 100
  const segments = [
    { pct: disagreePct, cls: 'bg-chart-red', label: lang === 'en' ? 'Disagree' : lang === 'kr' ? '그렇지 않다' : lang === 'zh' ? '不同意' : lang === 'vi' ? 'Không đồng ý' : 'Зөвшөөрөхгүй' },
    { pct: neutralPct, cls: 'bg-baseline', label: lang === 'en' ? 'Neutral' : lang === 'kr' ? '보통' : lang === 'zh' ? '一般' : lang === 'vi' ? 'Bình thường' : 'Дунд' },
    { pct: agreePct, cls: 'bg-chart-agree', label: lang === 'en' ? 'Agree' : lang === 'kr' ? '그렇다' : lang === 'zh' ? '同意' : lang === 'vi' ? 'Đồng ý' : 'Зөвшөөрөх' },
  ]
  return (
    <div className="border border-hairline bg-surface p-6">
      <h3 className="font-display text-sm font-bold leading-snug">{text(q)}</h3>
      <div className="mt-6 flex h-7 overflow-hidden" style={{ gap: 2 }}>
        {segments.map(
          (s, i) =>
            s.pct > 0 && (
              <div
                key={i}
                className={`bar-grow ${s.cls}`}
                style={{ width: `${s.pct}%` }}
                title={`${s.label}: ${Math.round(s.pct)}%`}
              />
            ),
        )}
      </div>
      <div className="mt-4 flex flex-wrap gap-x-5 gap-y-1.5 text-[11px] text-ink-2">
        {segments.map(
          (s, i) =>
            s.pct > 0 && (
              <span key={i} className="flex items-center gap-1.5">
                <span className={`h-2.5 w-2.5 ${s.cls}`} />
                {s.label} {Math.round(s.pct)}%
              </span>
            ),
        )}
      </div>
    </div>
  )
}

function Admin({ lang, onLogout }) {
  const t = ui[lang]
  const [rows, setRows] = useState(null)
  const [error, setError] = useState(false)

  const load = async () => {
    setError(false)
    try {
      setRows(await fetchResponses())
    } catch {
      setError(true)
    }
  }

  useEffect(() => {
    load()
  }, [])

  const stats = useMemo(() => {
    if (!rows) return null
    const now = Date.now()
    const day = 86400000
    const ts = (r) => new Date(r.created_at).getTime()
    return {
      total: rows.length,
      last24h: rows.filter((r) => now - ts(r) < day).length,
      last7d: rows.filter((r) => now - ts(r) < 7 * day).length,
      uniqueIps: new Set(rows.map((r) => r.ip_address).filter(Boolean)).size,
    }
  }, [rows])

  const exportCsv = () => {
    const header = 'created_at,ip_address,q1,q2,q3,q4,q5,q6,q7,q8'
    const lines = rows.map((r) =>
      [r.created_at, r.ip_address, r.q1, r.q2, r.q3, r.q4, r.q5, r.q6, r.q7, r.q8].join(','),
    )
    const blob = new Blob(['﻿' + [header, ...lines].join('\n')], { type: 'text/csv;charset=utf-8' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'f1-survey-responses.csv'
    a.click()
    URL.revokeObjectURL(url)
  }

  if (!supabaseConfigured()) {
    return (
      <div className="mx-auto max-w-xl px-4 py-20">
        <div className="border border-hairline bg-surface p-8 text-center text-ink-2">
          ⚠ {t.notConfigured}
        </div>
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-5xl px-4 py-10">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="font-display text-2xl font-bold uppercase italic">
          <span className="mr-3 inline-block h-6 w-1.5 bg-f1 align-middle" />
          {t.admin}
        </h1>
        <div className="flex gap-2">
          <button
            onClick={load}
            className="cut-corner-sm border border-hairline bg-surface px-4 py-2 font-display text-sm font-semibold text-ink-2 transition hover:border-baseline"
          >
            ⟳ {t.refresh}
          </button>
          {rows?.length > 0 && (
            <button
              onClick={exportCsv}
              className="cut-corner-sm bg-f1 px-4 py-2 font-display text-sm font-bold text-white transition hover:brightness-110"
            >
              {t.exportCsv}
            </button>
          )}
          <button
            onClick={onLogout}
            className="cut-corner-sm border border-hairline bg-surface px-4 py-2 font-display text-sm font-semibold text-ink-2 transition hover:border-baseline"
          >
            {t.logout}
          </button>
        </div>
      </div>

      {error && (
        <p className="mt-6 border border-hairline bg-surface p-4 text-sm text-chart-red">⚠ {t.loadError}</p>
      )}

      {rows && stats && (
        <>
          <div className="mt-8 grid grid-cols-2 gap-4 sm:grid-cols-4">
            <StatTile label={t.totalResponses} value={stats.total} />
            <StatTile label={t.last24h} value={stats.last24h} />
            <StatTile label={t.last7d} value={stats.last7d} />
            <StatTile label={t.uniqueIps} value={stats.uniqueIps} />
          </div>

          {rows.length === 0 && (
            <p className="mt-10 text-center text-ink-muted">{t.noResponses}</p>
          )}

          {rows.length > 0 && (
            <>
              <h2 className="font-display mt-12 text-lg font-bold uppercase italic">
                <span className="mr-2 inline-block h-4 w-1 bg-f1 align-middle" />
                {t.responsesByQuestion}
              </h2>
              <div className="mt-5 grid gap-5 lg:grid-cols-2">
                {questions.map((q) => {
                  const counts = getOptions(q, lang).map(
                    (_, i) => rows.filter((r) => r[q.id] === i + 1).length,
                  )
                  return LIKERT.includes(q.id) ? (
                    <DivergingChart key={q.id} q={q} lang={lang} counts={counts} total={rows.length} />
                  ) : (
                    <BarChart key={q.id} q={q} lang={lang} counts={counts} total={rows.length} />
                  )
                })}
              </div>

              <h2 className="font-display mt-12 text-lg font-bold uppercase italic">
                <span className="mr-2 inline-block h-4 w-1 bg-f1 align-middle" />
                {t.respondents}
              </h2>
              <div className="mt-5 overflow-x-auto border border-hairline bg-surface">
                <table className="w-full text-left text-xs">
                  <thead>
                    <tr className="border-b border-hairline text-ink-muted">
                      <th className="px-5 py-4 font-display font-semibold uppercase tracking-wider">{t.time}</th>
                      <th className="px-5 py-4 font-display font-semibold uppercase tracking-wider">{t.ipAddress}</th>
                      <th className="px-5 py-4 font-display font-semibold uppercase tracking-wider">{t.answersShort}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {rows.map((r) => (
                      <tr key={r.id} className="border-b border-hairline/50 last:border-0 transition hover:bg-hairline/20">
                        <td className="whitespace-nowrap px-5 py-3 tabular-nums text-ink-2">
                          {new Date(r.created_at).toLocaleString(lang === 'en' ? 'en-US' : lang === 'zh' ? 'zh-CN' : lang === 'vi' ? 'vi-VN' : lang === 'mn' ? 'mn-MN' : 'ko-KR')}
                        </td>
                        <td className="whitespace-nowrap px-5 py-3 tabular-nums text-ink-2">
                          {r.ip_address ?? '—'}
                        </td>
                        <td className="px-5 py-3 tabular-nums tracking-widest text-ink-2">
                          {questions.map((q) => r[q.id] ?? '–').join(' ')}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </>
          )}
        </>
      )}
    </div>
  )
}

export function AdminGate({ lang, onLogout }) {
  const t = ui[lang]
  const [authed, setAuthed] = useState(() => sessionStorage.getItem('f1-admin') === '1')
  const [pw, setPw] = useState('')
  const [wrong, setWrong] = useState(false)

  if (!authed) {
    return (
      <div className="mx-auto max-w-sm px-4 py-24">
        <form
          className="cut-corner border border-hairline bg-surface p-8"
          onSubmit={(e) => {
            e.preventDefault()
            if (pw === ADMIN_PASSWORD) {
              sessionStorage.setItem('f1-admin', '1')
              setAuthed(true)
            } else {
              setWrong(true)
            }
          }}
        >
          <h1 className="font-display text-xl font-bold uppercase italic">
            <span className="mr-2 inline-block h-5 w-1 bg-f1 align-middle" />
            {t.adminLogin}
          </h1>
          <input
            type="password"
            value={pw}
            onChange={(e) => { setPw(e.target.value); setWrong(false) }}
            placeholder={t.password}
            autoFocus
            className="mt-5 w-full border border-hairline bg-carbon px-4 py-3 text-ink outline-none transition focus:border-f1"
          />
          {wrong && <p className="mt-2 font-display text-sm font-semibold text-chart-red">{t.wrongPassword}</p>}
          <button
            type="submit"
            className="cut-corner-sm mt-5 w-full bg-f1 py-3 font-display font-bold uppercase italic tracking-wide text-white transition hover:brightness-110"
          >
            {t.login}
          </button>
        </form>
      </div>
    )
  }

  return <Admin lang={lang} onLogout={() => { sessionStorage.removeItem('f1-admin'); onLogout() }} />
}
