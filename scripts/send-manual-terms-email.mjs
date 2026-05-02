import { readFile } from 'node:fs/promises'
import { resolve } from 'node:path'

async function loadLocalEnv() {
  const envPath = resolve(process.cwd(), '.env.local')
  let envFile = ''

  try {
    envFile = await readFile(envPath, 'utf8')
  } catch {
    return
  }

  for (const line of envFile.split('\n')) {
    const trimmed = line.trim()

    if (!trimmed || trimmed.startsWith('#') || !trimmed.includes('=')) continue

    const [key, ...valueParts] = trimmed.split('=')
    const value = valueParts.join('=').trim().replace(/^['"]|['"]$/g, '')

    if (!process.env[key]) {
      process.env[key] = value
    }
  }
}

function required(name) {
  const value = process.env[name]?.trim()

  if (!value) {
    throw new Error(`Missing ${name}. Add it to .env.local or pass it before the command.`)
  }

  return value
}

await loadLocalEnv()

const recipient = process.argv[2]
const subject = process.argv[3] || "We've updated our terms"

if (!recipient) {
  throw new Error('Usage: node scripts/send-manual-terms-email.mjs user@example.com "Optional subject"')
}

const appUrl = process.env.NEXT_PUBLIC_APP_URL?.trim() || 'https://rezoomed.com'
const assetBaseUrl = process.env.EMAIL_ASSET_BASE_URL?.trim() || appUrl
const from = process.env.RESEND_FROM_EMAIL?.trim() || 'Rezoomed <onboarding@resend.dev>'
const replyTo = process.env.RESEND_REPLY_TO?.trim() || 'support@rezoomed.com'
const policyUrl = process.env.EMAIL_POLICY_URL?.trim() || `${appUrl.replace(/\/$/, '')}/terms`
const browserUrl = process.env.EMAIL_BROWSER_URL?.trim() || policyUrl

const templatePath = resolve(process.cwd(), 'email-templates/terms-update.html')
let html = await readFile(templatePath, 'utf8')

html = html
  .replaceAll('{{asset_base_url}}', assetBaseUrl.replace(/\/$/, ''))
  .replaceAll('{{browser_url}}', browserUrl)
  .replaceAll('{{policy_url}}', policyUrl)

const response = await fetch('https://api.resend.com/emails', {
  method: 'POST',
  headers: {
    Authorization: `Bearer ${required('RESEND_API_KEY')}`,
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({
    from,
    to: [recipient],
    reply_to: replyTo,
    subject,
    html,
  }),
})

const body = await response.json().catch(() => ({}))

if (!response.ok) {
  console.error(body)
  throw new Error(`Resend failed with HTTP ${response.status}`)
}

console.log(`Sent email to ${recipient}`)
console.log(`Resend id: ${body.id}`)
