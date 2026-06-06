'use client'

import { useState, useEffect, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'
import JournalCard from '@/components/JournalCard'
import MoodPicker from '@/components/MoodPicker'
import styles from './journal.module.css'

export default function JournalPage() {
  const [entries, setEntries] = useState([])
  const [showForm, setShowForm] = useState(false)
  const [title, setTitle] = useState('')
  const [content, setContent] = useState('')
  const [moodTag, setMoodTag] = useState(null)
  const [loading, setLoading] = useState(false)
  const [fetching, setFetching] = useState(true)
  const supabase = createClient()

  const fetchEntries = useCallback(async () => {
    const { data: { user } } = await supabase.auth.getUser()
    const { data } = await supabase
      .from('journal_entries')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
    setEntries(data || [])
    setFetching(false)
  }, [supabase])

  useEffect(() => { fetchEntries() }, [fetchEntries])

  async function handleSubmit(e) {
    e.preventDefault()
    if (!content.trim()) return
    setLoading(true)

    const { data: { user } } = await supabase.auth.getUser()
    await supabase.from('journal_entries').insert({
      user_id: user.id,
      title: title.trim() || new Date().toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long' }),
      content: content.trim(),
      mood_tag: moodTag,
    })

    setTitle(''); setContent(''); setMoodTag(null); setShowForm(false)
    fetchEntries()
    setLoading(false)
  }

  return (
    <div className="animate-in">
      <div className="page-header flex justify-between items-center" style={{ flexWrap: 'wrap', gap: '12px' }}>
        <div>
          <h1>Journal</h1>
          <p>Reflect on your thoughts and emotions.</p>
        </div>
        <button
          id="new-entry-btn"
          className="btn btn-primary"
          onClick={() => setShowForm(s => !s)}
        >
          {showForm ? '✕ Cancel' : '+ New Entry'}
        </button>
      </div>

      {showForm && (
        <form onSubmit={handleSubmit} className={`glass-card ${styles.form} animate-in`}>
          <div className={styles.field}>
            <label className={styles.label}>Title <span className={styles.optional}>(optional)</span></label>
            <input
              id="journal-title"
              className="input"
              type="text"
              placeholder="Give your entry a title"
              value={title}
              onChange={e => setTitle(e.target.value)}
            />
          </div>
          <div className={styles.field}>
            <label className={styles.label}>How were you feeling?</label>
            <MoodPicker value={moodTag} onChange={setMoodTag} />
          </div>
          <div className={styles.field}>
            <label className={styles.label}>Write your thoughts</label>
            <textarea
              id="journal-content"
              className="input"
              placeholder="What's on your mind? How did your study session go? What are you grateful for?"
              value={content}
              onChange={e => setContent(e.target.value)}
              style={{ minHeight: '160px' }}
              required
            />
          </div>
          <button id="save-entry-btn" className="btn btn-primary" type="submit" disabled={loading} style={{ alignSelf: 'flex-start' }}>
            {loading ? 'Saving…' : 'Save Entry'}
          </button>
        </form>
      )}

      {fetching ? (
        <p className="text-muted">Loading entries…</p>
      ) : entries.length === 0 ? (
        <div className={`glass-card ${styles.empty}`}>
          <p className={styles.emptyIcon}>📝</p>
          <h3>No journal entries yet</h3>
          <p>Start writing to reflect on your exam journey.</p>
        </div>
      ) : (
        <div className={styles.entries}>
          {entries.map(entry => <JournalCard key={entry.id} entry={entry} />)}
        </div>
      )}
    </div>
  )
}
