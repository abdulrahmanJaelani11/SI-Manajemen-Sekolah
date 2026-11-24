'use client'

import React, { useState, useEffect, useCallback } from 'react'
import { useEditor, EditorContent } from '@tiptap/react'
import StarterKit from '@tiptap/starter-kit'
import Underline from '@tiptap/extension-underline'
import Link from '@tiptap/extension-link'
import TextAlign from '@tiptap/extension-text-align'
import Placeholder from '@tiptap/extension-placeholder'
import {
  Bold,
  Italic,
  Underline as UnderlineIcon,
  Strikethrough,
  Heading2,
  Heading3,
  List,
  ListOrdered,
  Quote,
  Minus,
  AlignLeft,
  AlignCenter,
  AlignRight,
  AlignJustify,
  Link2,
  Unlink,
  Undo,
  Redo,
  RemoveFormatting,
  Code,
  Eye,
  FilePlus,
} from 'lucide-react'

export interface EditorTemplate {
  label: string
  content: string
}

interface RichTextEditorProps {
  value: string
  onChange: (value: string) => void
  placeholder?: string
  minHeight?: string
  className?: string
  templates?: EditorTemplate[]
}

function normalizeToHtml(val: string): string {
  if (!val) return ''
  // If it already contains HTML tags like <p>, <div>, <br>, <ul>, <h3>, etc.
  if (/<[a-z][\s\S]*>/i.test(val)) {
    return val
  }
  // Convert plain text with newlines to clean <p> paragraphs
  return val
    .split(/\r?\n\r?\n/)
    .map((block) => {
      const trimmed = block.trim()
      if (!trimmed) return ''
      const lines = trimmed.split(/\r?\n/)
      return `<p>${lines.join('<br />')}</p>`
    })
    .filter(Boolean)
    .join('')
}

export function RichTextEditor({
  value,
  onChange,
  placeholder = 'Tulis konten Anda di sini...',
  minHeight = '180px',
  className = '',
  templates = [],
}: RichTextEditorProps) {
  const [isCodeView, setIsCodeView] = useState(false)
  const [codeValue, setCodeValue] = useState(value || '')
  const [showTemplates, setShowTemplates] = useState(false)

  const editor = useEditor({
    immediatelyRender: false,
    extensions: [
      StarterKit.configure({
        heading: {
          levels: [2, 3],
        },
      }),
      Underline,
      Link.configure({
        openOnClick: false,
        autolink: true,
        defaultProtocol: 'https',
        HTMLAttributes: {
          class: 'text-blue-600 underline font-medium hover:text-blue-800',
        },
      }),
      TextAlign.configure({
        types: ['heading', 'paragraph'],
      }),
      Placeholder.configure({
        placeholder,
      }),
    ],
    content: normalizeToHtml(value || ''),
    editorProps: {
      attributes: {
        class: `prose max-w-none focus:outline-none p-3.5 text-slate-800 dark:text-slate-100 text-sm leading-relaxed`,
        style: `min-height: ${minHeight};`,
      },
    },
    onUpdate: ({ editor }) => {
      const html = editor.getHTML()
      const isEmpty = editor.isEmpty
      const result = isEmpty ? '' : html
      setCodeValue(result)
      onChange(result)
    },
  })

  // Sync external value changes into editor
  useEffect(() => {
    if (!editor) return
    const currentHtml = editor.getHTML()
    const targetHtml = normalizeToHtml(value || '')
    if (value !== currentHtml && targetHtml !== currentHtml && !editor.isFocused && !isCodeView) {
      editor.commands.setContent(targetHtml)
      setCodeValue(value || '')
    }
  }, [value, editor, isCodeView])

  const setLink = useCallback(() => {
    if (!editor) return
    const previousUrl = editor.getAttributes('link').href
    const url = window.prompt('Masukkan tautan URL (misal: https://sekolah.sch.id):', previousUrl || 'https://')

    if (url === null) return

    if (url.trim() === '' || url.trim() === 'https://') {
      editor.chain().focus().extendMarkRange('link').unsetLink().run()
      return
    }

    editor.chain().focus().extendMarkRange('link').setLink({ href: url.trim() }).run()
  }, [editor])

  const toggleCodeView = useCallback(() => {
    if (!editor) return
    if (!isCodeView) {
      setCodeValue(editor.getHTML())
      setIsCodeView(true)
    } else {
      editor.commands.setContent(codeValue)
      onChange(codeValue)
      setIsCodeView(false)
    }
  }, [editor, isCodeView, codeValue, onChange])

  const handleCodeChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setCodeValue(e.target.value)
    onChange(e.target.value)
  }

  const applyTemplate = (tplContent: string) => {
    if (!editor) return
    if (!editor.isEmpty && !window.confirm('Terapkan template ini? Konten yang ada saat ini akan digantikan.')) {
      return
    }
    editor.commands.setContent(tplContent)
    setCodeValue(tplContent)
    onChange(tplContent)
    setShowTemplates(false)
  }

  if (!editor) {
    return (
      <div
        className={`w-full rounded-xl border border-slate-300 bg-slate-50 p-4 text-xs text-slate-400 dark:border-slate-700 dark:bg-slate-800 animate-pulse ${className}`}
        style={{ minHeight }}
      >
        Memuat editor...
      </div>
    )
  }

  return (
    <div
      className={`rounded-xl border border-slate-300 bg-white transition-colors focus-within:border-blue-500 focus-within:ring-1 focus-within:ring-blue-500 dark:border-slate-700 dark:bg-slate-800 ${className}`}
    >
      {/* TOOLBAR */}
      <div className="flex flex-wrap items-center gap-1 border-b border-slate-200 bg-slate-50/80 p-2 dark:border-slate-700/80 dark:bg-slate-900/60 rounded-t-xl text-slate-700 dark:text-slate-300">
        {/* Undo & Redo */}
        <div className="flex items-center gap-0.5 pr-1 border-r border-slate-200 dark:border-slate-700">
          <button
            type="button"
            title="Urungkan (Undo)"
            disabled={!editor.can().undo() || isCodeView}
            onClick={() => editor.chain().focus().undo().run()}
            className="rounded p-1.5 hover:bg-slate-200 disabled:opacity-30 dark:hover:bg-slate-700 transition"
          >
            <Undo className="h-4 w-4" />
          </button>
          <button
            type="button"
            title="Ulangi (Redo)"
            disabled={!editor.can().redo() || isCodeView}
            onClick={() => editor.chain().focus().redo().run()}
            className="rounded p-1.5 hover:bg-slate-200 disabled:opacity-30 dark:hover:bg-slate-700 transition"
          >
            <Redo className="h-4 w-4" />
          </button>
        </div>

        {/* Headings */}
        <div className="flex items-center gap-0.5 px-1 border-r border-slate-200 dark:border-slate-700">
          <button
            type="button"
            title="Judul Utama (H2)"
            disabled={isCodeView}
            onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
            className={`rounded px-2 py-1 text-xs font-bold transition flex items-center gap-0.5 ${
              editor.isActive('heading', { level: 2 })
                ? 'bg-blue-600 text-white dark:bg-blue-600'
                : 'hover:bg-slate-200 dark:hover:bg-slate-700'
            }`}
          >
            <Heading2 className="h-4 w-4" />
            <span>H2</span>
          </button>
          <button
            type="button"
            title="Sub Judul (H3)"
            disabled={isCodeView}
            onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}
            className={`rounded px-2 py-1 text-xs font-bold transition flex items-center gap-0.5 ${
              editor.isActive('heading', { level: 3 })
                ? 'bg-blue-600 text-white dark:bg-blue-600'
                : 'hover:bg-slate-200 dark:hover:bg-slate-700'
            }`}
          >
            <Heading3 className="h-4 w-4" />
            <span>H3</span>
          </button>
        </div>

        {/* Text Formats */}
        <div className="flex items-center gap-0.5 px-1 border-r border-slate-200 dark:border-slate-700">
          <button
            type="button"
            title="Tebal (Ctrl+B)"
            disabled={isCodeView}
            onClick={() => editor.chain().focus().toggleBold().run()}
            className={`rounded p-1.5 transition ${
              editor.isActive('bold')
                ? 'bg-blue-600 text-white dark:bg-blue-600'
                : 'hover:bg-slate-200 dark:hover:bg-slate-700'
            }`}
          >
            <Bold className="h-4 w-4" />
          </button>
          <button
            type="button"
            title="Miring (Ctrl+I)"
            disabled={isCodeView}
            onClick={() => editor.chain().focus().toggleItalic().run()}
            className={`rounded p-1.5 transition ${
              editor.isActive('italic')
                ? 'bg-blue-600 text-white dark:bg-blue-600'
                : 'hover:bg-slate-200 dark:hover:bg-slate-700'
            }`}
          >
            <Italic className="h-4 w-4" />
          </button>
          <button
            type="button"
            title="Garis Bawah (Ctrl+U)"
            disabled={isCodeView}
            onClick={() => editor.chain().focus().toggleUnderline().run()}
            className={`rounded p-1.5 transition ${
              editor.isActive('underline')
                ? 'bg-blue-600 text-white dark:bg-blue-600'
                : 'hover:bg-slate-200 dark:hover:bg-slate-700'
            }`}
          >
            <UnderlineIcon className="h-4 w-4" />
          </button>
          <button
            type="button"
            title="Coret (Strikethrough)"
            disabled={isCodeView}
            onClick={() => editor.chain().focus().toggleStrike().run()}
            className={`rounded p-1.5 transition ${
              editor.isActive('strike')
                ? 'bg-blue-600 text-white dark:bg-blue-600'
                : 'hover:bg-slate-200 dark:hover:bg-slate-700'
            }`}
          >
            <Strikethrough className="h-4 w-4" />
          </button>
        </div>

        {/* Alignments */}
        <div className="flex items-center gap-0.5 px-1 border-r border-slate-200 dark:border-slate-700">
          <button
            type="button"
            title="Rata Kiri"
            disabled={isCodeView}
            onClick={() => editor.chain().focus().setTextAlign('left').run()}
            className={`rounded p-1.5 transition ${
              editor.isActive({ textAlign: 'left' })
                ? 'bg-blue-600 text-white dark:bg-blue-600'
                : 'hover:bg-slate-200 dark:hover:bg-slate-700'
            }`}
          >
            <AlignLeft className="h-4 w-4" />
          </button>
          <button
            type="button"
            title="Rata Tengah"
            disabled={isCodeView}
            onClick={() => editor.chain().focus().setTextAlign('center').run()}
            className={`rounded p-1.5 transition ${
              editor.isActive({ textAlign: 'center' })
                ? 'bg-blue-600 text-white dark:bg-blue-600'
                : 'hover:bg-slate-200 dark:hover:bg-slate-700'
            }`}
          >
            <AlignCenter className="h-4 w-4" />
          </button>
          <button
            type="button"
            title="Rata Kanan"
            disabled={isCodeView}
            onClick={() => editor.chain().focus().setTextAlign('right').run()}
            className={`rounded p-1.5 transition ${
              editor.isActive({ textAlign: 'right' })
                ? 'bg-blue-600 text-white dark:bg-blue-600'
                : 'hover:bg-slate-200 dark:hover:bg-slate-700'
            }`}
          >
            <AlignRight className="h-4 w-4" />
          </button>
          <button
            type="button"
            title="Rata Kiri-Kanan (Justify)"
            disabled={isCodeView}
            onClick={() => editor.chain().focus().setTextAlign('justify').run()}
            className={`rounded p-1.5 transition ${
              editor.isActive({ textAlign: 'justify' })
                ? 'bg-blue-600 text-white dark:bg-blue-600'
                : 'hover:bg-slate-200 dark:hover:bg-slate-700'
            }`}
          >
            <AlignJustify className="h-4 w-4" />
          </button>
        </div>

        {/* Lists & Quotation */}
        <div className="flex items-center gap-0.5 px-1 border-r border-slate-200 dark:border-slate-700">
          <button
            type="button"
            title="Daftar Poin (Bullet List)"
            disabled={isCodeView}
            onClick={() => editor.chain().focus().toggleBulletList().run()}
            className={`rounded p-1.5 transition ${
              editor.isActive('bulletList')
                ? 'bg-blue-600 text-white dark:bg-blue-600'
                : 'hover:bg-slate-200 dark:hover:bg-slate-700'
            }`}
          >
            <List className="h-4 w-4" />
          </button>
          <button
            type="button"
            title="Daftar Nomor (Numbered List)"
            disabled={isCodeView}
            onClick={() => editor.chain().focus().toggleOrderedList().run()}
            className={`rounded p-1.5 transition ${
              editor.isActive('orderedList')
                ? 'bg-blue-600 text-white dark:bg-blue-600'
                : 'hover:bg-slate-200 dark:hover:bg-slate-700'
            }`}
          >
            <ListOrdered className="h-4 w-4" />
          </button>
          <button
            type="button"
            title="Kutipan (Blockquote)"
            disabled={isCodeView}
            onClick={() => editor.chain().focus().toggleBlockquote().run()}
            className={`rounded p-1.5 transition ${
              editor.isActive('blockquote')
                ? 'bg-blue-600 text-white dark:bg-blue-600'
                : 'hover:bg-slate-200 dark:hover:bg-slate-700'
            }`}
          >
            <Quote className="h-4 w-4" />
          </button>
          <button
            type="button"
            title="Garis Pemisah (Horizontal Rule)"
            disabled={isCodeView}
            onClick={() => editor.chain().focus().setHorizontalRule().run()}
            className="rounded p-1.5 hover:bg-slate-200 dark:hover:bg-slate-700 transition"
          >
            <Minus className="h-4 w-4" />
          </button>
        </div>

        {/* Links & Clear */}
        <div className="flex items-center gap-0.5 px-1 border-r border-slate-200 dark:border-slate-700">
          <button
            type="button"
            title="Sisipkan Tautan (Link)"
            disabled={isCodeView}
            onClick={setLink}
            className={`rounded p-1.5 transition ${
              editor.isActive('link')
                ? 'bg-blue-600 text-white dark:bg-blue-600'
                : 'hover:bg-slate-200 dark:hover:bg-slate-700'
            }`}
          >
            <Link2 className="h-4 w-4" />
          </button>
          {editor.isActive('link') && (
            <button
              type="button"
              title="Hapus Tautan (Unlink)"
              disabled={isCodeView}
              onClick={() => editor.chain().focus().unsetLink().run()}
              className="rounded p-1.5 text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition"
            >
              <Unlink className="h-4 w-4" />
            </button>
          )}
          <button
            type="button"
            title="Bersihkan Format"
            disabled={isCodeView}
            onClick={() => editor.chain().focus().clearNodes().unsetAllMarks().run()}
            className="rounded p-1.5 hover:bg-slate-200 dark:hover:bg-slate-700 transition"
          >
            <RemoveFormatting className="h-4 w-4" />
          </button>
        </div>

        {/* Templates Option (if available) */}
        {templates.length > 0 && (
          <div className="relative">
            <button
              type="button"
              title="Gunakan Template Siap Pakai"
              disabled={isCodeView}
              onClick={() => setShowTemplates(!showTemplates)}
              className="flex items-center gap-1 rounded px-2 py-1 text-xs font-semibold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 dark:bg-emerald-950/40 dark:text-emerald-400 dark:hover:bg-emerald-950/70 border border-emerald-200 dark:border-emerald-800 transition"
            >
              <FilePlus className="h-3.5 w-3.5" />
              <span>Template</span>
            </button>
            {showTemplates && (
              <div className="absolute left-0 top-full mt-1.5 z-20 w-64 rounded-xl border border-slate-200 bg-white p-1.5 shadow-xl dark:border-slate-700 dark:bg-slate-800">
                <div className="px-2 py-1 text-[11px] font-bold uppercase tracking-wider text-slate-400">
                  Pilih Template Format:
                </div>
                {templates.map((tpl, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => applyTemplate(tpl.content)}
                    className="w-full text-left rounded-lg px-2.5 py-1.5 text-xs text-slate-700 hover:bg-slate-100 dark:text-slate-200 dark:hover:bg-slate-700 transition"
                  >
                    {tpl.label}
                  </button>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Code View Toggle (Like Summernote Codeview) */}
        <div className="flex items-center gap-0.5 pl-1 ml-auto">
          <button
            type="button"
            title={isCodeView ? 'Kembali ke Tampilan Visual' : 'Lihat Kode HTML (Code View)'}
            onClick={toggleCodeView}
            className={`flex items-center gap-1.5 rounded px-2.5 py-1 text-xs font-semibold transition ${
              isCodeView
                ? 'bg-amber-500 text-white shadow-sm hover:bg-amber-600'
                : 'bg-slate-200 text-slate-700 hover:bg-slate-300 dark:bg-slate-700 dark:text-slate-200 dark:hover:bg-slate-600'
            }`}
          >
            {isCodeView ? (
              <>
                <Eye className="h-3.5 w-3.5" />
                <span>Visual</span>
              </>
            ) : (
              <>
                <Code className="h-3.5 w-3.5" />
                <span>HTML</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* EDITOR CONTENT OR CODE VIEW */}
      {isCodeView ? (
        <textarea
          value={codeValue}
          onChange={handleCodeChange}
          placeholder="Tulis kode HTML di sini..."
          style={{ minHeight }}
          className="w-full font-mono text-xs p-3.5 bg-slate-900 text-emerald-400 focus:outline-none rounded-b-xl resize-y border-none"
        />
      ) : (
        <div
          className="tiptap-content-container relative [&_.ProseMirror]:min-h-[160px] [&_.ProseMirror]:focus:outline-none [&_.ProseMirror_p]:my-1.5 [&_.ProseMirror_p]:leading-relaxed [&_.ProseMirror_h2]:text-xl [&_.ProseMirror_h2]:font-bold [&_.ProseMirror_h2]:text-slate-900 [&_.ProseMirror_h2]:dark:text-white [&_.ProseMirror_h2]:mt-3 [&_.ProseMirror_h2]:mb-1.5 [&_.ProseMirror_h3]:text-lg [&_.ProseMirror_h3]:font-semibold [&_.ProseMirror_h3]:text-slate-900 [&_.ProseMirror_h3]:dark:text-white [&_.ProseMirror_h3]:mt-2.5 [&_.ProseMirror_h3]:mb-1 [&_.ProseMirror_ul]:list-disc [&_.ProseMirror_ul]:pl-6 [&_.ProseMirror_ul]:my-2 [&_.ProseMirror_ul]:space-y-1 [&_.ProseMirror_ol]:list-decimal [&_.ProseMirror_ol]:pl-6 [&_.ProseMirror_ol]:my-2 [&_.ProseMirror_ol]:space-y-1 [&_.ProseMirror_li]:leading-relaxed [&_.ProseMirror_blockquote]:border-l-4 [&_.ProseMirror_blockquote]:border-blue-500 [&_.ProseMirror_blockquote]:bg-blue-50/50 [&_.ProseMirror_blockquote]:dark:bg-blue-950/20 [&_.ProseMirror_blockquote]:py-1.5 [&_.ProseMirror_blockquote]:px-3 [&_.ProseMirror_blockquote]:italic [&_.ProseMirror_blockquote]:text-slate-600 [&_.ProseMirror_blockquote]:dark:text-slate-400 [&_.ProseMirror_blockquote]:rounded-r [&_.ProseMirror_blockquote]:my-2 [&_.ProseMirror_hr]:my-3 [&_.ProseMirror_hr]:border-slate-200 [&_.ProseMirror_hr]:dark:border-slate-700 [&_.ProseMirror_p.is-editor-empty:first-child::before]:text-slate-400 [&_.ProseMirror_p.is-editor-empty:first-child::before]:content-[attr(data-placeholder)] [&_.ProseMirror_p.is-editor-empty:first-child::before]:float-left [&_.ProseMirror_p.is-editor-empty:first-child::before]:pointer-events-none [&_.ProseMirror_p.is-editor-empty:first-child::before]:h-0"
        >
          <EditorContent editor={editor} />
        </div>
      )}
    </div>
  )
}
