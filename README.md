# open-in-obsidian

A Claude Code mod for people who keep their notes in Obsidian.

When Claude reads, writes or edits a Markdown file, the mod adds a button for it in a small band above the prompt. One click opens the note in Obsidian. The band keeps the last 3 files.

It also adds a `/obsidian` command:

- `/obsidian` opens the last Markdown file Claude touched.
- `/obsidian path/to/note.md` opens that file.

It works in the terminal and in the Code tab of the Claude desktop app.

## Install

At the prompt of a Claude Code terminal session:

```
/plugin install open-in-obsidian --marketplace go-silex/uc-mod-open-in-obsidian
```

Answer `y` to add the marketplace, then pick a scope (user scope loads it in every session).

From a shell:

```bash
claude plugin install open-in-obsidian --marketplace go-silex/uc-mod-open-in-obsidian
```

In the desktop app, where `/plugin` does not run: click + next to the prompt box, then Plugins, Add marketplace with `go-silex/uc-mod-open-in-obsidian`, then Add plugin.

## Requirements

- macOS (the mod opens notes with `open obsidian://...`).
- The file must be inside a vault Obsidian already knows.

## Relative paths for /obsidian

Absolute paths always work. For relative paths, write your vault's absolute path in `~/.config/silex/hub-root`:

```bash
mkdir -p ~/.config/silex && echo "/path/to/your/vault" > ~/.config/silex/hub-root
```

## A detail that cost us an hour

macOS stores paths with accents in decomposed form (NFD), and so does Obsidian. Claude's tools give them composed (NFC). A vault in a folder like `Drive partagés` then answers "Unable to find a vault". The mod normalizes paths to NFD before building the Obsidian URL.

## License

MIT. See [LICENSE](LICENSE).

## Built by Unkillable Companies

[Unkillable Companies](https://unkillablecompanies.com) helps business leaders rebuild how their company runs with AI: the leader builds their own system first, then brings the team along. We build tools like this one for ourselves first, and share the ones worth sharing.
