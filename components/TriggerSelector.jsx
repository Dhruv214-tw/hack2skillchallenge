'use client'

export const TRIGGERS = [
  'Exam Pressure',
  'Fear of Failure',
  'Peer Comparison',
  'Sleep Issues',
  'Physical Exhaustion',
  'Family Expectations',
  'Time Pressure',
  'Difficulty Concentrating',
  'Social Isolation',
]

export default function TriggerSelector({ selected, onChange }) {
  function toggle(trigger) {
    if (selected.includes(trigger)) {
      onChange(selected.filter(t => t !== trigger))
    } else {
      onChange([...selected, trigger])
    }
  }

  return (
    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
      {TRIGGERS.map(trigger => (
        <button
          key={trigger}
          id={`trigger-${trigger.toLowerCase().replace(/\s+/g, '-')}`}
          type="button"
          className={`chip ${selected.includes(trigger) ? 'selected' : ''}`}
          onClick={() => toggle(trigger)}
          aria-pressed={selected.includes(trigger)}
        >
          {trigger}
        </button>
      ))}
    </div>
  )
}
