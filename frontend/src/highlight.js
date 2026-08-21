import { createElement } from 'react'

export function highlightMatch(text, query) {
  const term = query?.trim()
  if (!term) return text

  const escaped = term.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
  const matcher = new RegExp(`(${escaped})`, 'gi')

  return text.split(matcher).map((part, index) => (
    part.toLowerCase() === term.toLowerCase()
      ? createElement('mark', { key: index }, part)
      : part
  ))
}
