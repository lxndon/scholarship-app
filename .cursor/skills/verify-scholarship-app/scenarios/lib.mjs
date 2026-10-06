// Shared harness for scenarios. Run scenarios through `vsa drive <name>`,
// which sets VSA_BASE_URL, VSA_OUT and VSA_HARNESS.
import { createRequire } from 'node:module'
import { writeFileSync } from 'node:fs'
import { join } from 'node:path'

const BASE = process.env.VSA_BASE_URL
const OUT = process.env.VSA_OUT
const HARNESS = process.env.VSA_HARNESS
if (!BASE || !OUT || !HARNESS) {
  console.error('run via: vsa drive <scenario>')
  process.exit(2)
}

const require = createRequire(join(HARNESS, 'package.json'))
const { chromium } = require('playwright')

let step = 0

export async function openApp() {
  const browser = await chromium.launch()
  // Fresh context = empty localStorage, so every run starts from DEFAULT_PROFILE
  // and the 12 seed scholarships, and never touches the user's real browser data.
  const context = await browser.newContext({ viewport: { width: 1600, height: 1000 } })
  const page = await context.newPage()
  const consoleErrors = []
  page.on('console', m => { if (m.type() === 'error') consoleErrors.push(m.text()) })
  page.on('pageerror', e => consoleErrors.push(String(e)))
  return { browser, context, page, consoleErrors }
}

export function url(path) {
  return BASE + path
}

// Navigate and wait for client hydration (pages load localStorage in useEffect).
export async function go(page, path, readyHeading) {
  await page.goto(url(path))
  await page.getByRole('heading', { level: 1, name: readyHeading }).waitFor()
  await page.waitForLoadState('networkidle')
}

export async function readStorage(page, key) {
  const raw = await page.evaluate(k => localStorage.getItem(k), key)
  return raw === null ? null : JSON.parse(raw)
}

// Captures screenshot + ARIA snapshot of main + a log line for one proof step.
export async function capture(page, label) {
  step += 1
  const base = `${String(step).padStart(2, '0')}-${label}`
  await page.screenshot({ path: join(OUT, `${base}.png`), fullPage: true })
  const aria = await page.locator('main').ariaSnapshot()
  writeFileSync(join(OUT, `${base}.aria.txt`), aria)
  console.log(`[evidence] ${base}.png ${base}.aria.txt`)
}

export function saveJson(name, data) {
  writeFileSync(join(OUT, name), JSON.stringify(data, null, 2))
  console.log(`[evidence] ${name}`)
}

export function check(cond, msg) {
  if (!cond) throw new Error(`FAIL: ${msg}`)
  console.log(`PASS: ${msg}`)
}

export async function run(fn) {
  const app = await openApp()
  try {
    await fn(app)
    check(app.consoleErrors.length === 0, `no console errors (${app.consoleErrors.join(' | ')})`)
    console.log('RESULT: PASS')
  } catch (e) {
    console.error(String(e))
    await capture(app.page, 'failure').catch(() => {})
    saveJson('console-errors.json', app.consoleErrors)
    console.log('RESULT: FAIL')
    process.exitCode = 1
  } finally {
    await app.browser.close()
  }
}
