import { useI18n } from './i18n'
import { Link } from './router'
import { Download, Zap, Globe, Layers, Terminal } from './icons'

// New icons for features
function BrowserIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="3" width="18" height="18" rx="2" />
      <line x1="3" y1="9" x2="21" y2="9" />
      <line x1="9" y1="21" x2="9" y2="9" />
    </svg>
  )
}

function SettingsIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="3" />
      <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z" />
    </svg>
  )
}

export function HomePage() {
  const { t } = useI18n()

  return (
    <main className="pt-24">
      {/* Hero Section */}
      <section className="max-w-6xl mx-auto px-6 py-20 text-center">
        <div className="inline-flex items-center gap-2 bg-zinc-800/50 border border-zinc-700 rounded-full px-4 py-1.5 mb-8">
          <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
          <span className="text-sm text-zinc-300">{t.hero.badge}</span>
        </div>

        <h1 className="text-5xl sm:text-6xl lg:text-7xl font-bold text-white mb-6 leading-tight">
          {t.hero.title}
          <span className="bg-gradient-to-r from-violet-400 to-fuchsia-400 bg-clip-text text-transparent"> {t.hero.titleHighlight}</span>
        </h1>

        <p className="text-xl text-zinc-400 max-w-2xl mx-auto mb-10">
          {t.hero.description}
        </p>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
          <Link to="/download"
             className="bg-violet-600 hover:bg-violet-500 text-white px-8 py-3 rounded-xl font-semibold transition-colors flex items-center gap-2 text-lg">
            <Download className="w-5 h-5" />
            {t.hero.downloadFree}
          </Link>
        </div>
      </section>

      {/* Screenshot Section */}
      <section className="max-w-5xl mx-auto px-6 py-8">
        <div className="rounded-2xl overflow-hidden border border-zinc-800 shadow-2xl shadow-violet-500/10">
          <img
            src="/screenshots/main-interface.png"
            alt="CraftPlus Interface"
            className="w-full"
          />
        </div>
      </section>

      {/* Features Section */}
      <section className="max-w-6xl mx-auto px-6 py-20">
        <h2 className="text-3xl font-bold text-white text-center mb-12">{t.features.title}</h2>
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          <FeatureCard
            icon={<Terminal className="w-6 h-6" />}
            title={t.features.claudeSdk.title}
            description={t.features.claudeSdk.description}
          />
          <FeatureCard
            icon={<Globe className="w-6 h-6" />}
            title={t.features.chineseSupport.title}
            description={t.features.chineseSupport.description}
          />
          <FeatureCard
            icon={<SettingsIcon className="w-6 h-6" />}
            title={t.features.autoSetup.title}
            description={t.features.autoSetup.description}
          />
          <FeatureCard
            icon={<BrowserIcon className="w-6 h-6" />}
            title={t.features.browserAutomation.title}
            description={t.features.browserAutomation.description}
          />
          <FeatureCard
            icon={<Layers className="w-6 h-6" />}
            title={t.features.multiProvider.title}
            description={t.features.multiProvider.description}
          />
          <FeatureCard
            icon={<Download className="w-6 h-6" />}
            title={t.features.crossPlatform.title}
            description={t.features.crossPlatform.description}
          />
        </div>
      </section>

      {/* CTA Section */}
      <section className="max-w-6xl mx-auto px-6 py-20">
        <div className="bg-gradient-to-r from-violet-900/50 to-fuchsia-900/50 rounded-2xl p-12 text-center border border-violet-800/50">
          <h2 className="text-3xl font-bold text-white mb-4">{t.cta.title}</h2>
          <p className="text-zinc-300 mb-8 max-w-xl mx-auto">
            {t.cta.description}
          </p>
          <Link to="/download"
             className="inline-flex items-center gap-2 bg-white text-zinc-900 px-8 py-3 rounded-xl font-semibold hover:bg-zinc-100 transition-colors">
            <Download className="w-5 h-5" />
            {t.cta.downloadNow}
          </Link>
        </div>
      </section>
    </main>
  )
}

function FeatureCard({ icon, title, description }: { icon: React.ReactNode; title: string; description: string }) {
  return (
    <div className="bg-zinc-900/50 border border-zinc-800 rounded-xl p-6 hover:border-zinc-700 transition-colors">
      <div className="w-12 h-12 bg-violet-600/20 rounded-lg flex items-center justify-center text-violet-400 mb-4">
        {icon}
      </div>
      <h3 className="text-lg font-semibold text-white mb-2">{title}</h3>
      <p className="text-zinc-400">{description}</p>
    </div>
  )
}
