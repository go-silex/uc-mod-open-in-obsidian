export type Recent = string[]

declare module 'claude-code' {
  interface PluginState {
    'open-in-obsidian': { recent: Recent }
  }
}
