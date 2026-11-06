import nodemailer from 'nodemailer'

export type NotifyTarget = { email?: string; name?: string } | string

function getSMTP() {
  const host = process.env.SMTP_HOST
  const port = process.env.SMTP_PORT ? Number(process.env.SMTP_PORT) : 587
  const user = process.env.SMTP_USER
  const pass = process.env.SMTP_PASS
  if (!host || !user || !pass) return null
  const transporter = nodemailer.createTransport({ host, port, secure: port === 465, auth: { user, pass } })
  return transporter
}

export async function sendEmail(to: NotifyTarget, subject: string, html: string) {
  const t = getSMTP()
  if (!t) {
    // no SMTP configured; noop
    console.log('[notify] (noop) to=%o subject=%s', to, subject)
    return { ok: false, reason: 'noop' }
  }
  const toAddr = typeof to === 'string' ? to : (to.email || '')
  if (!toAddr) return { ok:false, error:'missing recipient' }
  await t.sendMail({ from: process.env.SMTP_FROM || process.env.SMTP_USER!, to: toAddr, subject, html })
  return { ok:true }
}

export async function notifyRequestSubmitted(opts: { kind: 'FIELD'|'OVERTIME'; id: string; to?: NotifyTarget; details?: string }) {
  if (!opts.to) return
  const subject = `[${opts.kind}] Request Submitted: ${opts.id}`
  const html = `<div>Request <b>${opts.id}</b> (${opts.kind}) was submitted.<br/>${opts.details||''}</div>`
  try { await sendEmail(opts.to, subject, html) } catch {}
}

export async function notifyRequestStatus(opts: { kind: 'FIELD'|'OVERTIME'; id: string; to?: NotifyTarget; status: string; comments?: string }) {
  if (!opts.to) return
  const subject = `[${opts.kind}] Request ${opts.status}: ${opts.id}`
  const html = `<div>Request <b>${opts.id}</b> (${opts.kind}) is now <b>${opts.status}</b>.<br/>${opts.comments? 'Comments: '+opts.comments : ''}</div>`
  try { await sendEmail(opts.to, subject, html) } catch {}
}
