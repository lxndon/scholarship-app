// Detail: open a scholarship from the feed card (free), then, only with
// VSA_ALLOW_AI=1, click Generate on prompt 1 which makes one real Anthropic call.
import { run, go, url, capture, check } from './lib.mjs'

const allowAi = process.env.VSA_ALLOW_AI === '1'
const NAME = 'TechPoint Foundation Scholarship'

await run(async ({ page }) => {
  // The not-found view has no h1, so wait on its text instead of go().
  await page.goto(url('/scholarship/does-not-exist'))
  await page.getByText('Scholarship not found.').waitFor()
  check(true, 'unknown id shows Scholarship not found.')
  await capture(page, 'not-found')

  await go(page, '/feed', 'Scholarship Feed')
  // Innermost div holding both this card's heading and a View link = the card.
  const cardLink = page.locator('div')
    .filter({ has: page.getByRole('heading', { level: 3, name: NAME }) })
    .filter({ has: page.getByRole('link', { name: 'View & Generate →' }) })
    .last()
    .getByRole('link', { name: 'View & Generate →' })
  await cardLink.click()
  await page.waitForURL('**/scholarship/techpoint-indiana')
  await page.getByRole('heading', { level: 1, name: NAME }).waitFor()
  check(await page.getByRole('heading', { name: /Essay Prompts/ }).isVisible(), 'detail page lists essay prompts')
  const generate = page.getByRole('button', { name: 'Generate' }).first()
  await generate.waitFor()
  check(await generate.isEnabled(), 'Generate button enabled once profile loads')
  check(await page.getByRole('link', { name: 'score from the feed' }).isVisible(), 'unscored detail links back to feed for scoring')
  await capture(page, 'detail')

  if (!allowAi) {
    console.log('SKIP: generation not driven (set VSA_ALLOW_AI=1 to spend one Anthropic call)')
    return
  }

  await generate.click()
  await page.getByText('Claude is writing your response…').waitFor()
  await capture(page, 'writing')
  await page.getByRole('button', { name: 'Regenerate' }).first().waitFor({ timeout: 180_000 })
  const text = await page.locator('textarea').first().inputValue()
  check(text.split(/\s+/).filter(Boolean).length > 50, `generated response has ${text.split(/\s+/).length} words`)
  check(await page.getByText(/\d+ words/).first().isVisible(), 'word count shown under response')
  await capture(page, 'generated')
})
