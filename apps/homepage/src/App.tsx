import { I18nProvider, useI18n } from './i18n'
import { RouterProvider, useRouter, Link } from './router'
import { HomePage } from './HomePage'
import { DownloadPage } from './DownloadPage'
import { Download, Globe } from './icons'

function BrandMark({ className }: { className?: string }) {
  return (
    <div
      className={className}
      aria-hidden="true"
      style={{
        background:
          'linear-gradient(145deg, #0b7a72 0%, #33a097 58%, #d9b471 100%)',
      }}
    />
  )
}

function Header() {
  const { t, lang, setLang } = useI18n()
  const appName = lang === 'zh' ? '巧作' : 'CraftPlus'

  return (
    <header className="fixed top-0 w-full z-50 border-b border-[var(--color-line)] bg-[rgba(252,250,246,0.82)] backdrop-blur-xl">
      <nav className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
        <Link to="/" className="flex items-center gap-2">
          <BrandMark className="h-8 w-8 rounded-xl shadow-[0_10px_22px_-14px_var(--shadow-accent)]" />
          <span className="text-xl font-semibold tracking-tight text-[var(--color-ink)]">{appName}</span>
        </Link>
        <div className="flex items-center gap-3 sm:gap-4">
          <button
            onClick={() => setLang(lang === 'en' ? 'zh' : 'en')}
            className="inline-flex items-center gap-1.5 rounded-full border border-[var(--color-line)] bg-white/85 px-3 py-1.5 text-sm text-[var(--color-muted)] transition-colors hover:text-[var(--color-ink)]"
          >
            <Globe className="w-4 h-4" />
            <span>{lang === 'en' ? '中文' : 'EN'}</span>
          </button>
          <Link to="/download"
             className="download-primary-button inline-flex items-center gap-2 rounded-full px-4 py-2 font-medium transition-colors">
            <Download className="w-4 h-4" />
            {t.nav.download}
          </Link>
        </div>
      </nav>
    </header>
  )
}

function Footer() {
  const { t, lang } = useI18n()
  const appName = lang === 'zh' ? '巧作' : 'CraftPlus'

  return (
    <footer className="border-t border-[var(--color-line)] py-8">
      <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-4 px-6 sm:flex-row">
        <Link to="/" className="flex items-center gap-2">
          <BrandMark className="h-6 w-6 rounded-md" />
          <span className="text-[var(--color-muted)]">{appName}</span>
        </Link>
        <p className="text-sm text-[var(--color-muted)]">
          {t.footer.builtBy}{' '}
          <a href="https://craft.do" target="_blank" rel="noopener noreferrer" className="font-semibold text-[var(--color-ink)] hover:text-[var(--color-accent)]">Craft.do</a>
        </p>
      </div>
    </footer>
  )
}

function AppContent() {
  const { route } = useRouter()

  return (
    <div className="relative flex min-h-screen flex-col overflow-x-hidden bg-[var(--color-page)]">
      <div className="pointer-events-none absolute inset-0 -z-0">
        <div className="ambient-shape ambient-shape-one" />
        <div className="ambient-shape ambient-shape-two" />
      </div>
      <Header />
      <div className="relative z-10 flex-1">
        {route === '/download' ? <DownloadPage /> : <HomePage />}
      </div>
      <Footer />
    </div>
  )
}

function App() {
  return (
    <I18nProvider>
      <RouterProvider>
        <AppContent />
      </RouterProvider>
    </I18nProvider>
  )
}

export default App
