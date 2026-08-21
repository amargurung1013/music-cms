function inlineText(text) {
  return text.split(/(\*\*[^*]+\*\*|\*[^*]+\*)/g).map((part, index) => {
    if (part.startsWith('**') && part.endsWith('**')) {
      return <strong key={index}>{part.slice(2, -2)}</strong>
    }
    if (part.startsWith('*') && part.endsWith('*')) {
      return <em key={index}>{part.slice(1, -1)}</em>
    }
    return <span key={index}>{part}</span>
  })
}

export default function FormattedAnswer({ children }) {
  const lines = String(children).split('\n')
  const blocks = []
  let list = []
  let listType = null

  function flushList() {
    if (!list.length) return
    const List = listType === 'ordered' ? 'ol' : 'ul'
    blocks.push(<List key={`list-${blocks.length}`}>{list}</List>)
    list = []
    listType = null
  }

  lines.forEach((line, index) => {
    const heading = line.match(/^#{1,3}\s+(.+)$/)
    const unordered = line.match(/^\s*[-*]\s+(.+)$/)
    const ordered = line.match(/^\s*\d+[.)]\s+(.+)$/)
    if (heading) {
      flushList()
      blocks.push(<h3 key={`heading-${index}`}>{inlineText(heading[1])}</h3>)
    } else if (unordered || ordered) {
      const type = ordered ? 'ordered' : 'unordered'
      if (listType && listType !== type) flushList()
      listType = type
      list.push(<li key={`item-${index}`}>{inlineText((ordered || unordered)[1])}</li>)
    } else if (line.trim()) {
      flushList()
      blocks.push(<p key={`paragraph-${index}`}>{inlineText(line)}</p>)
    } else {
      flushList()
    }
  })
  flushList()

  return <div className="formatted-answer">{blocks}</div>
}
