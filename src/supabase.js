// Supabase configuration.
// Paste your project's values here after running supabase-setup.sql.
// The anon key is safe to expose in client code (Row Level Security protects the data).
export const SUPABASE_URL = 'https://YOUR-PROJECT-REF.supabase.co'
export const SUPABASE_ANON_KEY = 'YOUR-ANON-KEY'

export const supabaseConfigured = () =>
  !SUPABASE_URL.includes('YOUR-PROJECT-REF') && !SUPABASE_ANON_KEY.includes('YOUR-ANON-KEY')

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
  return res.status === 204 ? null : res.json()
}

// Submit one survey response. `answers` is { q1: 2, q2: 5, ... } (1-based option numbers).
export async function submitResponse(answers) {
  const ip = await getIpAddress()
  const row = {
    ...answers,
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
