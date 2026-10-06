// Feed: browse the seed cards (free), then, only with VSA_ALLOW_AI=1, click
// "Score with AI" which makes one real Anthropic call through scoreScholarships().
import { run, go, capture, readStorage, saveJson, check } from './lib.mjs'

const allowAi = process.env.VSA_ALLOW_AI === '1'

await run(async ({ page }) => {
  await go(page, '/feed', 'Scholarship Feed')
  const viewLinks = page.getByRole('link', { name: 'View & Generate →' })
  const cardCount = await viewLinks.count()
  check(cardCount > 0, `feed renders ${cardCount} open scholarship cards`)
  check(await page.getByText(`${cardCount} open`).isVisible(), 'header "N open" matches card count')
  check(await page.getByRole('button', { name: 'Score with AI' }).isVisible(), 'unscored feed offers Score with AI')
  await capture(page, 'unscored')

  if (!allowAi) {
    console.log('SKIP: scoring not driven (set VSA_ALLOW_AI=1 to spend one Anthropic call)')
    return
  }

  await page.getByRole('button', { name: 'Score with AI' }).click()
  await page.getByText('Claude is scoring all scholarships against your profile…').waitFor()
  await capture(page, 'scoring')
  await page.getByRole('button', { name: 'Re-score' }).waitFor({ timeout: 180_000 })
  await capture(page, 'scored')

  const scores = await readStorage(page, 'scholarship-scores')
  saveJson('storage-scores.json', scores)
  const ids = Object.keys(scores ?? {})
  check(ids.length > 0, `localStorage scholarship-scores has ${ids.length} entries`)
  check(ids.every(id => ['high', 'medium', 'low'].includes(scores[id].win_probability_tier)), 'every score has a valid tier')
  check(await page.getByText(/avg score \d+/).isVisible(), 'header shows avg score chip')
})
