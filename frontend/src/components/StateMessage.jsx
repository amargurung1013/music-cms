export default function StateMessage({ error, children }) {
  return <p className={error ? 'state-message error' : 'state-message'}>{children}</p>
}
