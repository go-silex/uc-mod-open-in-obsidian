import { atom, read, update } from 'claude-code'
import type { EngineInterface, Register } from 'claude-code'

import type { Recent } from '../types'

const MAX = 3

const recent = atom({ plugin: 'open-in-obsidian', key: 'recent' } as const, [] as Recent)

const isMarkdown = (path: string) => path.toLowerCase().endsWith('.md')
const baseName = (path: string) => (path.split('/').pop() ?? path).replace(/\.md$/i, '')

// Obsidian stores vault paths decomposed (NFD, as macOS does); "partagés" in NFC is not found.
const openInObsidian = ($: EngineInterface, path: string) =>
  $.process.run(['open', `obsidian://open?path=${encodeURIComponent(path.normalize('NFD'))}`])

// Relative paths given to /obsidian resolve against the vault root each machine keeps in ~/.config/silex/hub-root.
const vaultRoot = async ($: EngineInterface) => {
  const { exitCode, stdout } = await $.process.run(['sh', '-c', 'cat "$HOME/.config/silex/hub-root"'])
  return exitCode === 0 && stdout.trim() !== '' ? stdout.trim() : undefined
}

const remember = async ($: EngineInterface, path: string) => {
  if (!isMarkdown(path)) return
  await update($, recent, list => [path, ...list.filter(p => p !== path)].slice(0, MAX))
}

export const register: Register = on => {
  on('session.start', async ($, e, next) => {
    await $.command.register({
      name: 'obsidian',
      description: 'Open a file in Obsidian (default: the last Markdown file Claude touched)',
    })
    return next(e)
  })

  on('command.run', { command: 'obsidian' }, async ($, e) => {
    const arg = e.args.trim()
    const list = await read($, recent)
    if (arg === '' && list[0] === undefined) return { text: 'No Markdown file touched yet. Pass a path: /obsidian 00_COCKPIT/CEO_Cockpit.md' }

    let path = arg === '' ? list[0] : arg
    if (!path.startsWith('/')) {
      const root = await vaultRoot($)
      if (root === undefined) return { text: 'No vault root in ~/.config/silex/hub-root. Pass an absolute path.' }
      path = `${root}/${path}`
    }

    const { exitCode } = await openInObsidian($, path)
    return { text: exitCode === 0 ? `Opened in Obsidian: ${baseName(path)}` : `Could not open ${path}` }
  })

  on('tool.call', { tool: 'Write' }, async ($, e, next) => {
    const ran = await next(e)
    if (ran.deny === undefined && ran.isError !== true) await remember($, e.file_path)
    return ran
  }).catch(($, e, next) => next(e))

  on('tool.call', { tool: 'Edit' }, async ($, e, next) => {
    const ran = await next(e)
    if (ran.deny === undefined && ran.isError !== true) await remember($, e.file_path)
    return ran
  }).catch(($, e, next) => next(e))

  on('tool.call', { tool: 'Read' }, async ($, e, next) => {
    const ran = await next(e)
    if (ran.deny === undefined && ran.isError !== true) await remember($, e.file_path)
    return ran
  }).catch(($, e, next) => next(e))

  on('ui.render', { component: 'AbovePrompt' }, async ($, e, next) => {
    const list = await read($, recent)
    if (e.props.hasSurvey || list.length === 0) return next(e)

    const { Box, Button, Text } = $.ui.resolve(e)

    return (
      <Box>
        <Text dimColor>Obsidian: </Text>
        {list.map(path => (
          <Button key={path} label={baseName(path)} onPress={() => openInObsidian($, path)} />
        ))}
      </Box>
    )
  })
}
