import CodeBlock from '@tiptap/extension-code-block'
import Highlight from '@tiptap/extension-highlight'
import Placeholder from '@tiptap/extension-placeholder'
import { EditorContent, useEditor } from '@tiptap/react'
import StarterKit from '@tiptap/starter-kit'
import {
  Bold,
  Code,
  Heading1,
  Heading2,
  Italic,
  List,
  ListOrdered,
  Quote,
  Sparkles,
  Trash2,
} from 'lucide-react'
import type { ReactNode } from 'react'
import { useEffect, useMemo, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import toast from 'react-hot-toast'

import * as notesApi from '../api/notesApi'
import { AiPanel } from '../components/AiPanel'
import { Button } from '../components/ui/Button'
import { Skeleton } from '../components/ui/Skeleton'
import { db } from '../services/db'
import { enqueuePendingOp } from '../services/syncService'
import type { Note } from '../types'

function wordCountFromHtml(html: string) {
  const text = html.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim()
  if (!text) return 0
  return text.split(' ').length
}

export function NoteEditorPage() {
  const { id } = useParams()
  const noteId = Number(id)
  const navigate = useNavigate()

  const [title, setTitle] = useState('Untitled')
  const [loading, setLoading] = useState(true)
  const [saveState, setSaveState] = useState<'idle' | 'saving' | 'saved'>('idle')
  const [aiOpen, setAiOpen] = useState(false)
  const [note, setNote] = useState<Note | null>(null)
  const [wordCount, setWordCount] = useState(0)
  const [docVersion, setDocVersion] = useState(0)

  const editor = useEditor({
    immediatelyRender: false,
    extensions: [
      StarterKit.configure({ heading: { levels: [1, 2] } }),
      Placeholder.configure({ placeholder: 'Start writing your idea…' }),
      Highlight,
      CodeBlock,
    ],
    content: '<p></p>',
    editorProps: {
      attributes: {
        class:
          'focus:outline-none min-h-[50vh] px-8 py-6 text-base leading-relaxed text-slate-900 dark:text-slate-100',
      },
    },
    onUpdate: ({ editor }) => {
      setWordCount(wordCountFromHtml(editor.getHTML()))
      setDocVersion((v) => v + 1)
    },
  })

  useEffect(() => {
    const run = async () => {
      setLoading(true)
      try {
        const n = await notesApi.getNote(noteId)
        setNote(n)
        setTitle(n.title ?? 'Untitled')
        editor?.commands.setContent(n.content ? n.content : '<p></p>')
        setWordCount(n.wordCount ?? wordCountFromHtml(editor?.getHTML() ?? ''))
      } catch {
        const local = await db.notes.get(noteId)
        if (local && !local.deleted) {
          setNote(local)
          setTitle(local.title ?? 'Untitled')
          editor?.commands.setContent(local.content ? local.content : '<p></p>')
          setWordCount(local.wordCount ?? wordCountFromHtml(editor?.getHTML() ?? ''))
          toast.error('Server unavailable. Loaded local copy.')
        } else {
          toast.error('Could not load note')
          navigate('/')
        }
      } finally {
        setLoading(false)
      }
    }
    if (Number.isFinite(noteId)) void run()
  }, [editor, navigate, noteId])

  useEffect(() => {
    if (loading || !editor || !note) return
    const handle = window.setTimeout(async () => {
      setSaveState('saving')
      const html = editor.getHTML()
      try {
        if (!navigator.onLine) {
          const updated: Note = {
            ...note,
            title,
            content: html,
            wordCount: wordCountFromHtml(html),
            updatedAt: new Date().toISOString(),
          }
          await db.notes.put(updated)
          await enqueuePendingOp('update', {
            id: note.id,
            title,
            content: html,
            tags: note.tags,
          })
          setSaveState('saved')
          return
        }
        const updated = await notesApi.updateNote(note.id, { title, content: html })
        setNote(updated)
        await db.notes.put(updated)
        setSaveState('saved')
      } catch {
        toast.error('Save failed')
        setSaveState('idle')
      }
    }, 1500)
    return () => window.clearTimeout(handle)
  }, [docVersion, title, editor, note, loading])

  const toolbar = useMemo(() => {
    if (!editor) return null
    return (
      <div className="flex flex-wrap items-center gap-1 border-b border-slate-200 bg-white px-4 py-2 dark:border-slate-800 dark:bg-slate-950">
        <IconBtn label="Bold" onClick={() => editor.chain().focus().toggleBold().run()} active={editor.isActive('bold')}>
          <Bold className="h-4 w-4" />
        </IconBtn>
        <IconBtn label="Italic" onClick={() => editor.chain().focus().toggleItalic().run()} active={editor.isActive('italic')}>
          <Italic className="h-4 w-4" />
        </IconBtn>
        <IconBtn label="H1" onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()} active={editor.isActive('heading', { level: 1 })}>
          <Heading1 className="h-4 w-4" />
        </IconBtn>
        <IconBtn label="H2" onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()} active={editor.isActive('heading', { level: 2 })}>
          <Heading2 className="h-4 w-4" />
        </IconBtn>
        <IconBtn label="Bullet list" onClick={() => editor.chain().focus().toggleBulletList().run()} active={editor.isActive('bulletList')}>
          <List className="h-4 w-4" />
        </IconBtn>
        <IconBtn label="Ordered list" onClick={() => editor.chain().focus().toggleOrderedList().run()} active={editor.isActive('orderedList')}>
          <ListOrdered className="h-4 w-4" />
        </IconBtn>
        <IconBtn label="Quote" onClick={() => editor.chain().focus().toggleBlockquote().run()} active={editor.isActive('blockquote')}>
          <Quote className="h-4 w-4" />
        </IconBtn>
        <IconBtn label="Code block" onClick={() => editor.chain().focus().toggleCodeBlock().run()} active={editor.isActive('codeBlock')}>
          <Code className="h-4 w-4" />
        </IconBtn>
        <div className="ml-auto flex items-center gap-2">
          <Button size="sm" className="bg-accent-purple" type="button" onClick={() => setAiOpen((v) => !v)}>
            <Sparkles className="h-4 w-4" />
            AI
          </Button>
          <Button
            size="sm"
            variant="danger"
            type="button"
            onClick={async () => {
              try {
                await notesApi.deleteNote(noteId)
                navigate('/')
              } catch {
                toast.error('Could not delete note')
              }
            }}
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      </div>
    )
  }, [editor, noteId, navigate])

  if (loading || !editor) {
    return (
      <div className="p-8">
        <Skeleton className="mb-4 h-10 w-1/2" />
        <Skeleton className="mb-2 h-4 w-full" />
        <Skeleton className="mb-2 h-4 w-full" />
        <Skeleton className="h-4 w-3/4" />
      </div>
    )
  }

  return (
    <div className="flex h-full min-h-0">
      <div className="flex min-w-0 flex-1 flex-col">
        {toolbar}
        <div className="border-b border-slate-200 bg-white px-8 pt-8 dark:border-slate-800 dark:bg-slate-950">
          <input
            className="w-full bg-transparent text-4xl font-bold text-slate-900 outline-none dark:text-slate-100"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
          />
        </div>
        <div className="min-h-0 flex-1 overflow-auto bg-white dark:bg-slate-950">
          <EditorContent editor={editor} />
        </div>
        <div className="flex items-center justify-between border-t border-slate-200 bg-white px-8 py-3 text-sm text-slate-600 dark:border-slate-800 dark:bg-slate-950 dark:text-slate-300">
          <div>{wordCount} words</div>
          <div>{saveState === 'saving' ? 'Saving…' : saveState === 'saved' ? 'Saved ✓' : ''}</div>
        </div>
      </div>

      {aiOpen && note ? (
        <div className="w-[320px] max-w-[85vw] shrink-0 border-l border-slate-200 dark:border-slate-800">
          <AiPanel
            noteId={note.id}
            onApplyContent={(text) => {
              const safe = text
                .replaceAll('&', '&amp;')
                .replaceAll('<', '&lt;')
                .replaceAll('>', '&gt;')
              editor.chain().focus().setContent(`<p>${safe.replace(/\n/g, '</p><p>')}</p>`).run()
            }}
            onApplyTags={(tags) => {
              void notesApi
                .updateNote(note.id, { tags })
                .then((updated) => setNote(updated))
                .catch(() => toast.error('Could not apply tags'))
            }}
          />
        </div>
      ) : null}
    </div>
  )
}

function IconBtn({
  children,
  onClick,
  active,
  label,
}: {
  children: ReactNode
  onClick: () => void
  active?: boolean
  label: string
}) {
  return (
    <button
      type="button"
      aria-label={label}
      title={label}
      onClick={onClick}
      className={`inline-flex h-9 w-9 items-center justify-center rounded-md border text-slate-700 hover:bg-slate-50 dark:text-slate-200 dark:hover:bg-slate-900 ${
        active ? 'border-accent-purple bg-indigo-50 dark:bg-slate-900' : 'border-slate-200 dark:border-slate-800'
      }`}
    >
      {children}
    </button>
  )
}
