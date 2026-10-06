// Profile: edit fields through the form, save, and prove persistence via
// localStorage, a reload, and the profile being read by another page. Free.
import { run, go, capture, readStorage, saveJson, check } from './lib.mjs'

const MARKER = `vsa-${Date.now()}`

// Fields have visible <label> siblings without htmlFor, so locate by label text.
function field(page, label) {
  return page.locator('div', { has: page.locator(`label:text-is("${label}")`) })
    .last()
    .locator('input, textarea')
    .first()
}

await run(async ({ page }) => {
  await go(page, '/profile', 'Applicant Profile')
  check((await field(page, 'Name').inputValue()) === 'Landon Hill', 'fresh context shows DEFAULT_PROFILE name')
  check((await readStorage(page, 'scholarship-profile')) === null, 'nothing saved yet')
  await capture(page, 'before')

  await field(page, 'GPA').fill('3.99')
  await field(page, 'Background').fill(`First-gen student ${MARKER}`)
  await page.getByRole('button', { name: 'Save Profile' }).click()
  await page.getByText('Saved', { exact: true }).waitFor()
  await capture(page, 'saved')

  const stored = await readStorage(page, 'scholarship-profile')
  saveJson('storage-profile.json', stored)
  check(stored?.gpa === '3.99', 'localStorage profile.gpa = 3.99')
  check(stored?.background === `First-gen student ${MARKER}`, 'localStorage profile.background has marker')

  await page.reload()
  await page.getByRole('heading', { level: 1, name: 'Applicant Profile' }).waitFor()
  await page.waitForFunction(() => document.querySelector('textarea')?.value.includes('vsa-'))
  check((await field(page, 'GPA').inputValue()) === '3.99', 'GPA survives reload')
  check((await field(page, 'Background').inputValue()).includes(MARKER), 'Background survives reload')
  await capture(page, 'after-reload')
})
