// Profile resume: upload a throwaway PDF through Choose PDF + Upload & Parse,
// prove "N words extracted" and resume_text, then Remove. Free: pdf-parse only.
import { join } from 'node:path'
import { run, go, capture, check } from './lib.mjs'

const MARKER = 'vsaresumemarker'

await run(async ({ context, page }) => {
  // Build a synthetic text PDF with the browser itself; never use a real resume.
  const pdfPath = join(process.env.VSA_OUT, 'synthetic-resume.pdf')
  const maker = await context.newPage()
  await maker.setContent(`<h1>Test Applicant</h1><p>${MARKER} Python Java automation consulting projects.</p>`)
  await maker.pdf({ path: pdfPath })
  await maker.close()
  console.log('[evidence] synthetic-resume.pdf')

  await go(page, '/profile', 'Applicant Profile')
  check(await page.getByText('No resume uploaded yet.').isVisible(), 'fresh context has no resume')
  // The file input is hidden behind the Choose PDF button.
  await page.locator('input[type=file]').setInputFiles(pdfPath)
  check(await page.getByText('synthetic-resume.pdf').isVisible(), 'chosen file name shown')
  await capture(page, 'chosen')

  await page.getByRole('button', { name: 'Upload & Parse' }).click()
  const done = page.getByText(/words extracted/)
  const failed = page.locator('p.text-red-400')
  await done.or(failed).first().waitFor({ timeout: 60_000 })
  await capture(page, 'after-upload')
  if (await failed.isVisible()) {
    throw new Error(`FAIL: upload shows error: ${await failed.innerText()}`)
  }
  // resume_text is stored as plain text, not JSON, so readStorage does not apply.
  const raw = await page.evaluate(() => localStorage.getItem('resume_text'))
  check((raw ?? '').includes(MARKER), 'localStorage resume_text contains marker')

  await page.getByRole('button', { name: 'Remove' }).click()
  await page.getByText('No resume uploaded yet.').waitFor()
  check((await page.evaluate(() => localStorage.getItem('resume_text'))) === null, 'Remove clears resume_text')
  await capture(page, 'after-remove')
})
