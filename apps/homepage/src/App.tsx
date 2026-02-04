import { I18nProvider, useI18n } from './i18n'
import { RouterProvider, useRouter, Link } from './router'
import { HomePage } from './HomePage'
import { DownloadPage } from './DownloadPage'
import { Download, Globe } from './icons'

function Header() {
  const { t, lang, setLang } = useI18n()
  const appName = lang === 'zh' ? '巧作' : 'CraftPlus'

  return (
    <header className="fixed top-0 w-full z-50 bg-zinc-950/80 backdrop-blur-sm border-b border-zinc-800">
      <nav className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between">
        <Link to="/" className="flex items-center gap-2">
          <div className="w-8 h-8 bg-gradient-to-br from-violet-500 to-fuchsia-500 rounded-lg" />
          <span className="text-xl font-semibold text-white">{appName}</span>
        </Link>
        <div className="flex items-center gap-4 sm:gap-6">
          <button
            onClick={() => setLang(lang === 'en' ? 'zh' : 'en')}
            className="text-zinc-400 hover:text-white transition-colors flex items-center gap-1.5 text-sm"
          >
            <Globe className="w-4 h-4" />
            <span>{lang === 'en' ? '中文' : 'EN'}</span>
          </button>
          <Link to="/download"
             className="bg-violet-600 hover:bg-violet-500 text-white px-4 py-2 rounded-lg font-medium transition-colors flex items-center gap-2">
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
    <footer className="border-t border-zinc-800 py-8">
      <div className="max-w-6xl mx-auto px-6 flex flex-col sm:flex-row items-center justify-between gap-4">
        <Link to="/" className="flex items-center gap-2">
          <div className="w-6 h-6 bg-gradient-to-br from-violet-500 to-fuchsia-500 rounded-md" />
          <span className="text-zinc-400">{appName}</span>
        </Link>
        <p className="text-zinc-500 text-sm">
          {t.footer.builtBy} <a href="https://craft.do" target="_blank" rel="noopener noreferrer" className="text-zinc-400 hover:text-white">Craft.do</a>
        </p>
      </div>
    </footer>
  )
}

function AppContent() {
  const { route } = useRouter()

  return (
    <div className="min-h-screen bg-gradient-to-b from-zinc-950 to-zinc-900 flex flex-col">
      <Header />
      <div className="flex-1">
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
