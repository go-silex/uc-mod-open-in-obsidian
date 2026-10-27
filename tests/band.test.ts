import { expect, test } from 'claude-code/testing'

const BAND = {
  component: 'AbovePrompt',
  props: { hasSurvey: false, isWorking: false, maxRows: 10 },
} as const

test('a Markdown file Claude wrote gets a button that opens it in Obsidian', async ($, on) => {
  const runs: string[][] = []
  on('tool.call', () => ({ result: 'ok' }))
  on('process.run', (_$, e) => {
    runs.push([...e.argv])
    return { value: { exitCode: 0, stdout: '', stderr: '' } }
  })

  await $.tool.call({ tool: 'Write', file_path: '/vault/Diner.md', content: '# x' })
  await $.tool.call({ tool: 'Write', file_path: '/vault/script.py', content: '' })

  for (const surface of ['terminal', 'desktop'] as const) {
    const ui = await $.ui.mount({ plugin: 'open-in-obsidian', surface, ...BAND })
    expect(await ui.find({ key: '/vault/script.py' })).toBeUndefined()
    await ui.press({ key: '/vault/Diner.md' })
    await ui.unmount()
  }

  expect(runs[0]).toEqual(['open', 'obsidian://open?path=%2Fvault%2FDiner.md'])
})

test('accented paths are sent decomposed, as Obsidian stores them', async ($, on) => {
  const runs: string[][] = []
  on('tool.call', () => ({ result: 'ok' }))
  on('process.run', (_$, e) => {
    runs.push([...e.argv])
    return { value: { exitCode: 0, stdout: '', stderr: '' } }
  })

  await $.tool.call({ tool: 'Read', file_path: '/Drive partag\u00e9s/Note.md' })
  const ui = await $.ui.mount({ plugin: 'open-in-obsidian', surface: 'desktop', ...BAND })
  await ui.press({ key: '/Drive partag\u00e9s/Note.md' })

  expect(runs[0]?.[1]).toBe('obsidian://open?path=%2FDrive%20partage%CC%81s%2FNote.md')
})

test('/obsidian resolves a relative path against the vault root in hub-root', async ($, on) => {
  const runs: string[][] = []
  on('process.run', (_$, e) => {
    runs.push([...e.argv])
    const stdout = e.argv[0] === 'sh' ? '/vault\n' : ''
    return { value: { exitCode: 0, stdout, stderr: '' } }
  })

  const { text } = await $.command.run({ command: 'obsidian', args: '00_COCKPIT/CEO.md' })

  expect(runs.at(-1)).toEqual(['open', 'obsidian://open?path=%2Fvault%2F00_COCKPIT%2FCEO.md'])
  expect(text).toBe('Opened in Obsidian: CEO')
})
