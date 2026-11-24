import React from 'react'

interface RichTextViewerProps {
  content?: string | null
  className?: string
  fallback?: React.ReactNode
}

export function RichTextViewer({ content, className = '', fallback = null }: RichTextViewerProps) {
  if (!content || !content.trim()) {
    return <>{fallback}</>
  }

  // Check if content is formatted HTML
  const isHtml = /<[a-z][\s\S]*>/i.test(content)

  if (!isHtml) {
    return (
      <div className={`whitespace-pre-line leading-relaxed ${className}`}>
        {content}
      </div>
    )
  }

  return (
    <div
      className={`rich-text-viewer leading-relaxed break-words
        [&_p]:mb-3 [&_p]:leading-relaxed
        [&_h2]:text-xl sm:[&_h2]:text-2xl [&_h2]:font-bold [&_h2]:text-slate-900 [&_h2]:mt-6 [&_h2]:mb-2.5
        [&_h3]:text-lg sm:[&_h3]:text-xl [&_h3]:font-semibold [&_h3]:text-slate-900 [&_h3]:mt-5 [&_h3]:mb-2
        [&_ul]:list-disc [&_ul]:pl-5 [&_ul]:my-3 [&_ul]:space-y-1.5
        [&_ol]:list-decimal [&_ol]:pl-5 [&_ol]:my-3 [&_ol]:space-y-1.5
        [&_li]:leading-relaxed
        [&_blockquote]:border-l-4 [&_blockquote]:border-blue-500 [&_blockquote]:bg-blue-50/60 [&_blockquote]:py-2.5 [&_blockquote]:px-4 [&_blockquote]:italic [&_blockquote]:text-slate-700 [&_blockquote]:rounded-r-xl [&_blockquote]:my-3
        [&_hr]:my-5 [&_hr]:border-slate-200
        [&_a]:text-blue-600 [&_a]:underline [&_a:hover]:text-blue-800
        [&_strong]:font-bold [&_strong]:text-slate-900
        [&_u]:underline
        [&_s]:line-through
        ${className}`}
      dangerouslySetInnerHTML={{ __html: content }}
    />
  )
}
