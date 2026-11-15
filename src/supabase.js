// Supabase configuration.
// Values come from build-time environment variables (Vite inlines them):
//   - Local dev:   .env file (gitignored) with VITE_SUPABASE_URL / VITE_SUPABASE_ANON_KEY
//   - CI (Pages):  GitHub Actions secrets of the same names, injected at build
// The anon key is designed to be public (Row Level Security protects the data).
const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL || ''
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY || ''

export const supabaseConfigured = () => Boolean(SUPABASE_URL && SUPABASE_ANON_KEY)

export async function getIpAddress() {
  try {
    const res = await fetch('https://api.ipify.org?format=json')
    const data = await res.json()
    return data.ip || null
  } catch {
    return null
  }
}

async function supabaseFetch(path, options = {}) {
  const res = await fetch(`${SUPABASE_URL}/rest/v1/${path}`, {
    ...options,
    headers: {
      'apikey': SUPABASE_ANON_KEY,
      'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
      'Content-Type': 'application/json',
      ...options.headers,
    },
  })
  if (!res.ok) throw new Error(`Supabase ${res.status}: ${await res.text()}`)
  // 201 with Prefer: return=minimal (and 204) return an empty body
  const text = await res.text()
  return text ? JSON.parse(text) : null
}

// Distribution-source attribution: ?src=kakao|zalo|... on the share link.
// Saved on first visit; sent with the submission.
export function getSource() {
  const fromUrl = new URLSearchParams(window.location.search).get('src')
  if (fromUrl) {
    localStorage.setItem('f1-src', fromUrl)
    return fromUrl
  }
  return localStorage.getItem('f1-src')
}

// Submit one survey response. `answers` is { q1: 2, q2: 5, ... } (1-based option numbers).
// `extras` carries the optional open question: { q9, respondent_name }.
export async function submitResponse(answers, extras = {}) {
  const ip = await getIpAddress()
  const row = {
    ...answers,
    ...extras,
    src: getSource(),
    ip_address: ip,
    user_agent: navigator.userAgent,
  }
  await supabaseFetch('responses', {
    method: 'POST',
    body: JSON.stringify(row),
    headers: { 'Prefer': 'return=minimal' },
  })
  return ip
}

// Fetch all responses, newest first.
export async function fetchResponses() {
  return supabaseFetch('responses?select=*&order=created_at.desc&limit=1000')
}
