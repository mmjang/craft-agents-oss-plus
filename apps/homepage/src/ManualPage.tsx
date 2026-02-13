import { useState, useMemo, useCallback } from 'react'
import Markdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import { useRouter } from './router'
import { useI18n } from './i18n'

const modules = import.meta.glob('./manual/*.md', { query: '?raw', import: 'default', eager: true }) as Record<string, string>

interface DocEntry {
  slug: string
  title: string
  order: number
  content: string
}

function parseFrontmatter(raw: string): { title: string; order: number; content: string } {
  const match = raw.match(/^---\r?\n([\s\S]*?)\r?\n---\r?\n([\s\S]*)$/)
  if (!match) return { title: '', order: 999, content: raw }
  const meta = match[1]
  const content = match[2]
  const title = meta.match(/^title:\s*(.+)$/m)?.[1]?.trim() ?? ''
  const order = parseInt(meta.match(/^order:\s*(\d+)$/m)?.[1] ?? '999', 10)
  return { title, order, content }
}

function buildDocs(): { docs: Map<string, DocEntry>; sorted: DocEntry[]; readme: string } {
  const docs = new Map<string, DocEntry>()
  let readme = ''

  for (const [path, raw] of Object.entries(modules)) {
    const filename = path.split('/').pop()!
    if (filename === 'README.md') {
      readme = raw
      continue
    }
    const slug = filename.replace(/\.md$/, '')
    const { title, order, content } = parseFrontmatter(raw)
    docs.set(slug, { slug, title: title || slug, order, content })
  }

  const sorted = [...docs.values()].sort((a, b) => a.order - b.order)
  return { docs, sorted, readme }
}

const { docs, sorted, readme } = buildDocs()

function MarkdownLink({ href, children, ...props }: React.AnchorHTMLAttributes<HTMLAnchorElement>) {
  if (href && /^\.\/(.+)\.md/.test(href)) {
    const match = href.match(/^\.\/(.+?)\.md(.*)$/)
    if (match) {
      const [, slug, hash] = match
      const newHref = `#/manual/${slug}${hash}`
      return <a href={newHref} {...props}>{children}</a>
    }
  }
  if (href && /^https?:\/\//.test(href)) {
    return <a href={href} target="_blank" rel="noopener noreferrer" {...props}>{children}</a>
  }
  return <a href={href} {...props}>{children}</a>
}

function Sidebar({ currentSlug, onNavigate }: { currentSlug: string | null; onNavigate?: () => void }) {
  const { navigate } = useRouter()

  return (
    <nav className="flex flex-col gap-1">
      <a
        href="#/manual"
        className={`block rounded-lg px-3 py-2 text-sm transition-colors ${
          currentSlug === null
            ? 'bg-[var(--color-accent-soft)] text-[var(--color-accent)] font-medium'
            : 'text-[var(--color-muted)] hover:text-[var(--color-ink)] hover:bg-[var(--color-surface-muted)]'
        }`}
        onClick={(e) => {
          e.preventDefault()
          navigate('/manual')
          onNavigate?.()
          window.scrollTo(0, 0)
        }}
      >
        目录
      </a>
      {sorted.map((doc) => (
        <a
          key={doc.slug}
          href={`#/manual/${doc.slug}`}
          className={`block rounded-lg px-3 py-2 text-sm transition-colors ${
            currentSlug === doc.slug
              ? 'bg-[var(--color-accent-soft)] text-[var(--color-accent)] font-medium'
              : 'text-[var(--color-muted)] hover:text-[var(--color-ink)] hover:bg-[var(--color-surface-muted)]'
          }`}
          onClick={(e) => {
            e.preventDefault()
            navigate(`/manual/${doc.slug}`)
            onNavigate?.()
            window.scrollTo(0, 0)
          }}
        >
          {doc.title}
        </a>
      ))}
    </nav>
  )
}

export function ManualPage() {
  const { route } = useRouter()
  const { lang } = useI18n()
  const [sidebarOpen, setSidebarOpen] = useState(false)

  const slug = useMemo(() => {
    const match = route.match(/^\/manual\/(.+)$/)
    return match ? match[1] : null
  }, [route])

  const content = useMemo(() => {
    if (slug === null) return readme
    return docs.get(slug)?.content ?? ''
  }, [slug])

  const closeSidebar = useCallback(() => setSidebarOpen(false), [])

  const title = slug === null
    ? (lang === 'zh' ? '用户手册' : 'Manual')
    : docs.get(slug)?.title ?? slug

  return (
    <main className="mx-auto max-w-6xl px-4 pt-24 pb-16 sm:px-6">
      {/* Mobile sidebar toggle */}
      <button
        className="mb-4 flex items-center gap-2 rounded-lg border border-[var(--color-line)] bg-[var(--color-surface)] px-3 py-2 text-sm text-[var(--color-muted)] lg:hidden"
        onClick={() => setSidebarOpen(!sidebarOpen)}
      >
        <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" />
        </svg>
        {title}
      </button>

      <div className="flex gap-8">
        {/* Sidebar - desktop */}
        <aside className="hidden w-56 shrink-0 lg:block">
          <div className="sticky top-24">
            <Sidebar currentSlug={slug} />
          </div>
        </aside>

        {/* Sidebar - mobile overlay */}
        {sidebarOpen && (
          <div className="fixed inset-0 z-50 lg:hidden" onClick={closeSidebar}>
            <div className="absolute inset-0 bg-black/20" />
            <div
              className="absolute left-0 top-0 h-full w-64 bg-[var(--color-surface)] p-4 shadow-xl"
              onClick={(e) => e.stopPropagation()}
            >
              <Sidebar currentSlug={slug} onNavigate={closeSidebar} />
            </div>
          </div>
        )}

        {/* Content */}
        <article className="prose min-w-0 flex-1">
          <Markdown
            remarkPlugins={[remarkGfm]}
            components={{ a: MarkdownLink }}
          >
            {content}
          </Markdown>
        </article>
      </div>
    </main>
  )
}
