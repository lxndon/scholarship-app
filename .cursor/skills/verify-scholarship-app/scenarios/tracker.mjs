// Tracker: move a seed scholarship Not Started -> In Progress -> back,
// proving the column, the header stats, localStorage and reload persistence.
// Free: no AI calls.
import { run, go, capture, readStorage, saveJson, check } from './lib.mjs'

const NAME = 'Dell Scholars Program'
const ID = 'dell-scholars'

function card(page) {
  // The scholarship link sits directly inside its card div.
  return page.getByRole('link', { name: NAME, exact: true }).locator('xpath=..')
}

// The card lives in a column drop zone whose previous sibling is the column header.
async function columnOf(page) {
  const header = card(page).locator('xpath=../preceding-sibling::div[1]')
  return (await header.innerText()).split('\n')[0].trim()
}

await run(async ({ page }) => {
  await go(page, '/tracker', 'Application Tracker')
  check((await readStorage(page, 'scholarship-tracker')) === null, 'fresh context has no tracker state')
  check((await columnOf(page)).toLowerCase() === 'not started', `${NAME} starts in Not Started`)
  check(await page.getByText('0 in progress').isVisible(), 'header shows 0 in progress')
  check((await card(page).getByRole('button', { name: '← Back' }).count()) === 0, 'Not Started card has no Back button')
  await capture(page, 'before')

  await card(page).getByRole('button', { name: 'Next →' }).click()
  await page.getByText('1 in progress').waitFor()
  check((await columnOf(page)).toLowerCase() === 'in progress', `${NAME} moved to In Progress`)
  const afterNext = await readStorage(page, 'scholarship-tracker')
  check(afterNext?.[ID] === 'in_progress', `localStorage scholarship-tracker.${ID} = in_progress`)
  saveJson('storage-after-next.json', afterNext)
  await capture(page, 'after-next')

  await page.reload()
  await page.getByText('1 in progress').waitFor()
  check((await columnOf(page)).toLowerCase() === 'in progress', 'stage survives reload')
  await capture(page, 'after-reload')

  await card(page).getByRole('button', { name: '← Back' }).click()
  await page.getByText('0 in progress').waitFor()
  check((await columnOf(page)).toLowerCase() === 'not started', `${NAME} moved back to Not Started`)
  const afterBack = await readStorage(page, 'scholarship-tracker')
  check(afterBack?.[ID] === 'not_started', `localStorage scholarship-tracker.${ID} = not_started`)
  saveJson('storage-after-back.json', afterBack)
  await capture(page, 'after-back')
})
