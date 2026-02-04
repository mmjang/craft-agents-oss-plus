import type { ReactNode } from 'react'
import { useI18n } from './i18n'
import { Link } from './router'
import { Download, Globe, Layers, Terminal } from './icons'

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
  const features: Array<{ icon: ReactNode; title: string; description: string }> = [
    {
      icon: <Terminal className="w-6 h-6" />,
      title: t.features.claudeSdk.title,
      description: t.features.claudeSdk.description,
    },
    {
      icon: <Globe className="w-6 h-6" />,
      title: t.features.chineseSupport.title,
      description: t.features.chineseSupport.description,
    },
    {
      icon: <SettingsIcon className="w-6 h-6" />,
      title: t.features.autoSetup.title,
      description: t.features.autoSetup.description,
    },
    {
      icon: <BrowserIcon className="w-6 h-6" />,
      title: t.features.browserAutomation.title,
      description: t.features.browserAutomation.description,
    },
    {
      icon: <Layers className="w-6 h-6" />,
      title: t.features.multiProvider.title,
      description: t.features.multiProvider.description,
    },
    {
      icon: <Download className="w-6 h-6" />,
      title: t.features.crossPlatform.title,
      description: t.features.crossPlatform.description,
    },
  ]

  const highlightItems = [
    {
      title: t.features.claudeSdk.title,
      description: t.features.claudeSdk.description,
    },
    {
      title: t.features.browserAutomation.title,
      description: t.features.browserAutomation.description,
    },
    {
      title: t.features.crossPlatform.title,
      description: t.features.crossPlatform.description,
    },
  ]

  return (
    <main className="pb-8 pt-28">
      <section className="mx-auto max-w-6xl px-6 py-14">
        <div className="mx-auto max-w-3xl text-center">
          <div className="animate-enter inline-flex items-center gap-2 rounded-full border border-[var(--color-line)] bg-[var(--color-surface)]/90 px-4 py-1.5">
            <span className="h-2 w-2 rounded-full bg-[var(--color-accent)]" />
            <span className="text-sm font-medium text-[var(--color-muted)]">{t.hero.badge}</span>
          </div>

          <h1 className="animate-enter mt-8 text-5xl leading-tight text-[var(--color-ink)] sm:text-6xl lg:text-7xl" style={{ animationDelay: '80ms' }}>
            {t.hero.title}
            <span className="block text-[var(--color-accent)]"> {t.hero.titleHighlight}</span>
          </h1>

          <p className="animate-enter mx-auto mt-6 max-w-2xl text-lg text-[var(--color-muted)] sm:text-xl" style={{ animationDelay: '150ms' }}>
            {t.hero.description}
          </p>

          <div className="animate-enter mt-10 flex flex-col items-center justify-center gap-3 sm:flex-row" style={{ animationDelay: '220ms' }}>
            <Link
              to="/download"
              className="inline-flex items-center gap-2 rounded-full bg-[var(--color-accent)] px-8 py-3 text-lg font-semibold text-white shadow-[0_12px_28px_-15px_var(--shadow-accent)] transition-colors hover:bg-[var(--color-accent-strong)]"
            >
              <Download className="h-5 w-5" />
              {t.hero.downloadFree}
            </Link>
            <a
              href="#features"
              className="inline-flex items-center rounded-full border border-[var(--color-line)] bg-[var(--color-surface)] px-8 py-3 text-lg font-semibold text-[var(--color-ink)] transition-colors hover:border-[var(--color-accent)] hover:text-[var(--color-accent)]"
            >
              {t.features.title}
            </a>
          </div>
        </div>

        <div className="animate-enter mt-14 rounded-[30px] border border-[var(--color-line)] bg-[var(--color-surface)] p-3 shadow-[0_30px_80px_-55px_rgba(21,38,52,0.55)]" style={{ animationDelay: '280ms' }}>
          <div className="overflow-hidden rounded-2xl border border-[var(--color-line)] bg-[var(--color-surface-muted)]">
            <img
              src="/screenshots/main-interface.png"
              alt="CraftPlus Interface"
              className="w-full"
            />
          </div>
          <div className="mt-3 grid gap-3 sm:grid-cols-3">
            {highlightItems.map((item, index) => (
              <div
                key={item.title}
                className="animate-enter rounded-xl border border-[var(--color-line)] bg-[var(--color-surface-muted)] p-4"
                style={{ animationDelay: `${340 + index * 80}ms` }}
              >
                <h3 className="text-sm font-semibold text-[var(--color-ink)]">{item.title}</h3>
                <p className="mt-1 text-sm text-[var(--color-muted)]">{item.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section id="features" className="mx-auto max-w-6xl px-6 py-16">
        <h2 className="text-center text-3xl text-[var(--color-ink)] sm:text-4xl">{t.features.title}</h2>
        <div className="mt-12 grid gap-5 md:grid-cols-2 lg:grid-cols-3">
          {features.map((feature, index) => (
            <FeatureCard
              key={feature.title}
              icon={feature.icon}
              title={feature.title}
              description={feature.description}
              delayMs={index * 70}
            />
          ))}
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-6 py-16">
        <div className="animate-enter rounded-[34px] border border-[var(--color-line)] bg-[linear-gradient(140deg,#f8f3e7_0%,#e7f3f0_75%)] p-10 text-center sm:p-14">
          <h2 className="text-3xl text-[var(--color-ink)] sm:text-4xl">{t.cta.title}</h2>
          <p className="mx-auto mt-4 max-w-2xl text-lg text-[var(--color-muted)]">
            {t.cta.description}
          </p>
          <Link
            to="/download"
            className="mt-8 inline-flex items-center gap-2 rounded-full bg-[var(--color-ink)] px-8 py-3 text-lg font-semibold text-white transition-colors hover:bg-[var(--color-accent)]"
          >
            <Download className="h-5 w-5" />
            {t.cta.downloadNow}
          </Link>
        </div>
      </section>
    </main>
  )
}

function FeatureCard({
  icon,
  title,
  description,
  delayMs,
}: {
  icon: ReactNode
  title: string
  description: string
  delayMs: number
}) {
  return (
    <div
      className="animate-enter rounded-2xl border border-[var(--color-line)] bg-[var(--color-surface)] p-6 transition-[transform,border-color,box-shadow] duration-300 hover:-translate-y-1 hover:border-[var(--color-accent)] hover:shadow-[0_20px_34px_-24px_var(--shadow-accent)]"
      style={{ animationDelay: `${delayMs}ms` }}
    >
      <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-[var(--color-accent-soft)] text-[var(--color-accent)]">
        {icon}
      </div>
      <h3 className="text-lg font-semibold text-[var(--color-ink)]">{title}</h3>
      <p className="mt-2 text-[var(--color-muted)]">{description}</p>
    </div>
  )
}
