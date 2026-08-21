import { useState } from 'react'
import { api } from '../api'
import StateMessage from '../components/StateMessage'
import FormattedAnswer from '../components/FormattedAnswer'

export default function AskAI() {
  const [messages, setMessages] = useState([])
  const [question, setQuestion] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  async function submit(event) {
    event.preventDefault()
    const message = question.trim()
    if (!message || loading) return
    setQuestion('')
    setError('')
    setMessages((current) => [...current, { role: 'user', content: message }])
    setLoading(true)
    try {
      const response = await api('/ai/ask', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message, history: messages }),
      })
      setMessages((current) => [...current, { role: 'assistant', content: response.answer }])
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <main className="ask-page">
      <section className="ask-intro">
        <p className="eyebrow">Library companion</p>
        <h1>Ask AI</h1>
        <p>Ask about the albums and songs in this archive. Ask for a mood recommendation, a lyric interpretation, or the central conflict of a record.</p>
      </section>

      <section className="chat-panel" aria-label="Ask AI chat">
        {messages.length === 0 && <div className="chat-empty">Try: “I’m in a reflective mood. Which album should I listen to?”</div>}
        {messages.map((item, index) => (
          <article className={`chat-message ${item.role}`} key={`${item.role}-${index}`}>
            <p className="eyebrow">{item.role === 'user' ? 'You' : 'Ask AI'}</p>
            {item.role === 'assistant' ? <FormattedAnswer>{item.content}</FormattedAnswer> : <div>{item.content}</div>}
          </article>
        ))}
        {loading && <div className="chat-message assistant"><p className="eyebrow">Ask AI</p><div>Thinking about the archive…</div></div>}
      </section>

      {error && <StateMessage error>{error}</StateMessage>}
      <form className="ask-form" onSubmit={submit}>
        <label htmlFor="ask-question"><span>Your question</span></label>
        <div>
          <textarea id="ask-question" value={question} onChange={(event) => setQuestion(event.target.value)} placeholder="Ask anything about the music…" rows="3" disabled={loading} />
          <button type="submit" disabled={loading || !question.trim()}>{loading ? 'Sending…' : 'Ask AI'}</button>
        </div>
      </form>
    </main>
  )
}
