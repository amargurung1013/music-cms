import { useEffect, useRef, useState } from 'react'

export default function SelectField({ label, value, options, placeholder, onChange, required = false, disabled = false }) {
  const [open, setOpen] = useState(false)
  const ref = useRef(null)
  const selected = options.find((option) => String(option.value) === String(value))

  useEffect(() => {
    function close(event) {
      if (!ref.current?.contains(event.target)) setOpen(false)
    }
    document.addEventListener('mousedown', close)
    return () => document.removeEventListener('mousedown', close)
  }, [])

  function choose(option) {
    onChange(option.value)
    setOpen(false)
  }

  return <div className="custom-select-field" ref={ref}><span className="custom-select-label">{label}{required && <span aria-hidden="true"> *</span>}</span><button type="button" className={`custom-select-trigger ${open ? 'open' : ''}`} aria-haspopup="listbox" aria-expanded={open} disabled={disabled} onClick={() => setOpen((current) => !current)}>{selected?.label ?? placeholder}<span className="custom-select-chevron">⌄</span></button>{open && <div className="custom-select-menu" role="listbox">{options.map((option) => <button type="button" role="option" aria-selected={String(option.value) === String(value)} className={String(option.value) === String(value) ? 'selected' : ''} key={option.value} onClick={() => choose(option)}>{option.label}</button>)}</div>}</div>
}
