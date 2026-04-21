import { useMemo, useState } from 'react'
import axios from 'axios'

import * as aiApi from '../api/aiApi'
import toast from 'react-hot-toast'

import { Button } from './ui/Button'

type Tab = 'summarize' | 'tags' | 'improve' | 'ask'

type Props = {
  noteId: number
  onApplyContent: (text: string) => void
  onApplyTags: (tags: string[]) => void
}

export function AiPanel({ noteId, onApplyContent, onApplyTags }: Props) {
  const [tab, setTab] = useState<Tab>('summarize')
  const [output, setOutput] = useState('')
  const [question, setQuestion] = useState('')
  const [loading, setLoading] = useState(false)
  const [lastTags, setLastTags] = useState<string[]>([])

  const tabs = useMemo(
    () =>
      [
        { id: 'summarize' as const, label: 'Summarize' },
        { id: 'tags' as const, label: 'Generate Tags' },
        { id: 'improve' as const, label: 'Improve' },
        { id: 'ask' as const, label: 'Ask' },
      ] satisfies { id: Tab; label: string }[],
    [],
  )

  const run = async () => {
    if (tab === 'ask' && !question.trim()) {
      toast.error('Please enter a question first')
      return
    }

    setLoading(true)
    setOutput('')
    try {
      if (tab === 'summarize') {
        const res = await aiApi.summarize(noteId)
        setOutput(res.text ?? '')
      } else if (tab === 'tags') {
        const res = await aiApi.generateTags(noteId)
        const tags = res.tags ?? []
        setLastTags(tags)
        setOutput(tags.join(', '))
      } else if (tab === 'improve') {
        const res = await aiApi.improveNote(noteId)
        setOutput(res.text ?? '')
      } else {
        const res = await aiApi.askNotes(question.trim(), [noteId])
        setOutput(res.text ?? '')
      }
    } catch (e) {
      if (axios.isAxiosError(e)) {
        const data = e.response?.data as
          | { message?: string; fieldErrors?: Record<string, string> }
          | undefined
        const fieldError = data?.fieldErrors
          ? Object.values(data.fieldErrors).find(Boolean)
          : undefined
        toast.error(fieldError || data?.message || e.message || 'AI request failed')
      } else {
        toast.error(e instanceof Error ? e.message : 'AI request failed')
      }
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex h-full flex-col border-l border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-950">
      <div className="border-b border-slate-200 p-3 dark:border-slate-800">
        <div className="flex flex-wrap gap-2">
          {tabs.map((t) => (
            <button
              key={t.id}
              type="button"
              onClick={() => setTab(t.id)}
              className={`rounded-full px-3 py-1 text-xs font-semibold ${
                tab === t.id ? 'bg-accent-purple text-white' : 'bg-slate-100 text-slate-700 dark:bg-slate-900 dark:text-slate-200'
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>
      </div>

      <div className="flex-1 space-y-3 overflow-auto p-4">
        {tab === 'ask' ? (
          <textarea
            className="w-full rounded-lg border border-slate-200 bg-white p-3 text-sm text-slate-900 outline-none focus:ring-2 focus:ring-accent-purple/30 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-100"
            rows={4}
            placeholder="Ask a question about this note…"
            value={question}
            onChange={(e) => setQuestion(e.target.value)}
          />
        ) : null}

        <Button loading={loading} onClick={() => void run()} className="w-full">
          Run
        </Button>

        <div className="rounded-lg border border-slate-200 bg-slate-50 p-3 text-sm text-slate-800 whitespace-pre-wrap dark:border-slate-800 dark:bg-slate-900 dark:text-slate-100">
          {output || 'AI output will appear here.'}
        </div>

        {tab === 'improve' && output ? (
          <Button className="w-full" variant="secondary" onClick={() => onApplyContent(output)}>
            Apply
          </Button>
        ) : null}
        {tab === 'tags' && lastTags.length ? (
          <Button className="w-full" variant="secondary" onClick={() => onApplyTags(lastTags)}>
            Apply Tags
          </Button>
        ) : null}
      </div>
    </div>
  )
}
