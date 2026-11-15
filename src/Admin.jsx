import { useEffect, useMemo, useState } from 'react'
import { questions } from './data/questions.js'
import { ui } from './i18n.js'
import { fetchResponses, supabaseConfigured } from './supabase.js'

const ADMIN_PASSWORD = '1234'

// Likert questions: 1 = strongly agree ... 5 = strongly disagree
const LIKERT = ['q5', 'q6', 'q7']

function StatTile({ label, value }) {
  return (
    <div className="rounded-xl border border-hairline bg-surface px-5 py-4">
      <p className="text-xs font-semibold uppercase tracking-wider text-ink-muted">{label}</p>
      <p className="mt-1 text-3xl font-bold tabular-nums">{value}</p>
    </div>
  )
}

function BarChart({ q, lang, counts, total }) {
  const t = ui[lang]
  const max = Math.max(...counts, 1)
  return (
    <div className="rounded-xl border border-hairline bg-surface p-5">
      <h3 className="text-sm font-bold leading-snug">{lang === 'en' ? q.en : q.kr}</h3>
      <div className="mt-4 space-y-2.5">
        {q.options.map((opt, i) => {
          const count = counts[i]
          const pct = total ? Math.round((count / total) * 100) : 0
          const width = (count / max) * 100
          return (
            <div key={i} className="group flex items-center gap-3 text-xs" title={`${count} (${pct}%)`}>
              <span className="w-40 shrink-0 truncate text-ink-2 sm:w-56" title={lang === 'en' ? opt.en : opt.kr}>
                {i + 1}. {lang === 'en' ? opt.en : opt.kr}
              </span>
              <div className="relative h-5 flex-1 rounded bg-hairline/40">
                <div
                  className="absolute inset-y-0 left-0 rounded-r bg-f1-soft transition-all group-hover:brightness-125"
                  style={{ width: `${width}%`, borderRadius: '0 4px 4px 0' }}
                />
                <span className="absolute left-full top-1/2 ml-2 -translate-y-1/2 whitespace-nowrap font-semibold tabular-nums text-ink-2">
                  {count} ({pct}%)
                </span>
              </div>
            </div>
          )
        })}
      </div>
      <p className="mt-3 text-right text-[11px] text-ink-muted">
        n = {total} · {t.responsesByQuestion}
      </p>
    </div>
  )
}

function DivergingChart({ q, lang, counts, total }) {
  // options: 1 strongly agree, 2 agree, 3 neutral, 4 disagree, 5 strongly disagree
  const agreePct = ((counts[0] + counts[1]) / total) * 100
  const neutralPct = (counts[2] / total) * 100
  const disagreePct = ((counts[3] + counts[4]) / total) * 100
  const segments = [
    { pct: disagreePct, cls: 'bg-f1-soft', label: lang === 'en' ? 'Disagree' : '그렇지 않다' },
    { pct: neutralPct, cls: 'bg-baseline', label: lang === 'en' ? 'Neutral' : '보통' },
    { pct: agreePct, cls: 'bg-agree', label: lang === 'en' ? 'Agree' : '그렇다' },
  ]
  return (
    <div className="rounded-xl border border-hairline bg-surface p-5">
      <h3 className="text-sm font-bold leading-snug">{lang === 'en' ? q.en : q.kr}</h3>
      <div className="mt-4 flex h-7 overflow-hidden rounded" style={{ gap: 2 }}>
        {segments.map(
          (s, i) =>
            s.pct > 0 && (
              <div
                key={i}
                className={s.cls}
                style={{ width: `${s.pct}%` }}
                title={`${s.label}: ${Math.round(s.pct)}%`}
              />
            ),
        )}
      </div>
      <div className="mt-3 flex flex-wrap gap-x-5 gap-y-1 text-[11px] text-ink-2">
        {segments.map(
          (s, i) =>
            s.pct > 0 && (
              <span key={i} className="flex items-center gap-1.5">
                <span className={`h-2.5 w-2.5 rounded-sm ${s.cls}`} />
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
    const ts = (r) => new Date(r.created_at + (r.created_at.endsWith('Z') ? '' : 'Z')).getTime()
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
    const blob = new Blob([[header, ...lines].join('\n')], { type: 'text/csv' })
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
        <div className="rounded-xl border border-hairline bg-surface p-8 text-center text-ink-2">
          ⚠ {t.notConfigured}
        </div>
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-5xl px-4 py-8">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl font-extrabold">
          {t.admin} <span className="text-f1-soft">·</span> {t.title}
        </h1>
        <div className="flex gap-2">
          <button
            onClick={load}
            className="rounded-lg border border-hairline bg-surface px-4 py-2 text-sm font-semibold text-ink-2 transition hover:border-baseline"
          >
            ⟳ {t.refresh}
          </button>
          {rows?.length > 0 && (
            <button
              onClick={exportCsv}
              className="rounded-lg bg-f1 px-4 py-2 text-sm font-bold text-white transition hover:brightness-110"
            >
              {t.exportCsv}
            </button>
          )}
          <button
            onClick={onLogout}
            className="rounded-lg border border-hairline bg-surface px-4 py-2 text-sm font-semibold text-ink-2 transition hover:border-baseline"
          >
            {t.logout}
          </button>
        </div>
      </div>

      {error && (
        <p className="mt-6 rounded-lg border border-hairline bg-surface p-4 text-sm text-f1-soft">⚠ {t.loadError}</p>
      )}

      {rows && stats && (
        <>
          <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
            <StatTile label={t.totalResponses} value={stats.total} />
            <StatTile label={t.last24h} value={stats.last24h} />
            <StatTile label={t.last7d} value={stats.last7d} />
            <StatTile label={t.uniqueIps} value={stats.uniqueIps} />
          </div>

          {rows.length === 0 && (
            <p className="mt-8 text-center text-ink-muted">{t.noResponses}</p>
          )}

          {rows.length > 0 && (
            <>
              <h2 className="mt-10 text-lg font-bold">{t.responsesByQuestion}</h2>
              <div className="mt-4 grid gap-4 lg:grid-cols-2">
                {questions.map((q) => {
                  const counts = q.options.map(
                    (_, i) => rows.filter((r) => r[q.id] === i + 1).length,
                  )
                  return LIKERT.includes(q.id) ? (
                    <DivergingChart key={q.id} q={q} lang={lang} counts={counts} total={rows.length} />
                  ) : (
                    <BarChart key={q.id} q={q} lang={lang} counts={counts} total={rows.length} />
                  )
                })}
              </div>

              <h2 className="mt-10 text-lg font-bold">{t.respondents}</h2>
              <div className="mt-4 overflow-x-auto rounded-xl border border-hairline bg-surface">
                <table className="w-full text-left text-xs">
                  <thead>
                    <tr className="border-b border-hairline text-ink-muted">
                      <th className="px-4 py-3 font-semibold">{t.time}</th>
                      <th className="px-4 py-3 font-semibold">{t.ipAddress}</th>
                      <th className="px-4 py-3 font-semibold">{t.answersShort}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {rows.map((r) => (
                      <tr key={r.id} className="border-b border-hairline/50 last:border-0 hover:bg-hairline/20">
                        <td className="whitespace-nowrap px-4 py-2.5 tabular-nums text-ink-2">
                          {new Date(r.created_at).toLocaleString(lang === 'en' ? 'en-US' : 'ko-KR')}
                        </td>
                        <td className="whitespace-nowrap px-4 py-2.5 tabular-nums text-ink-2">
                          {r.ip_address ?? '—'}
                        </td>
                        <td className="px-4 py-2.5 tabular-nums tracking-widest text-ink-2">
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
  const [authed, setAuthed] = useState(
    () => sessionStorage.getItem('f1-admin') === '1',
  )
  const [pw, setPw] = useState('')
  const [wrong, setWrong] = useState(false)

  if (!authed) {
    return (
      <div className="mx-auto max-w-sm px-4 py-24">
        <form
          className="rounded-xl border border-hairline bg-surface p-8"
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
          <h1 className="text-xl font-extrabold">{t.adminLogin}</h1>
          <input
            type="password"
            value={pw}
            onChange={(e) => { setPw(e.target.value); setWrong(false) }}
            placeholder={t.password}
            autoFocus
            className="mt-4 w-full rounded-lg border border-hairline bg-page px-4 py-3 text-ink outline-none transition focus:border-f1-soft"
          />
          {wrong && <p className="mt-2 text-sm text-f1-soft">{t.wrongPassword}</p>}
          <button
            type="submit"
            className="mt-4 w-full rounded-lg bg-f1 py-3 font-bold text-white transition hover:brightness-110"
          >
            {t.login}
          </button>
        </form>
      </div>
    )
  }

  return <Admin lang={lang} onLogout={() => { sessionStorage.removeItem('f1-admin'); onLogout() }} />
}
