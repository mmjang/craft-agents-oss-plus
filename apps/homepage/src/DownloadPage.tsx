import { useEffect, useState } from 'react'
import { useI18n } from './i18n'
import { Link } from './router'
import { Apple, Windows, ArrowLeft } from './icons'

interface DownloadsConfig {
  version: string
  releaseDate: string
  baseUrl: string
  downloads: {
    'mac-arm': string
    'mac-intel': string
    windows: string
  }
}

const defaultConfig: DownloadsConfig = {
  version: '0.0.0',
  releaseDate: '',
  baseUrl: '',
  downloads: {
    'mac-arm': '',
    'mac-intel': '',
    windows: '',
  },
}

type DownloadId = keyof DownloadsConfig['downloads']

const downloadItems: Array<{
  id: DownloadId
  icon: typeof Apple
  titleKey: 'macAppleSilicon' | 'macIntel' | 'windows'
  descKey: 'macAppleSiliconDesc' | 'macIntelDesc' | 'windowsDesc'
}> = [
  {
    id: 'mac-arm',
    icon: Apple,
    titleKey: 'macAppleSilicon',
    descKey: 'macAppleSiliconDesc',
  },
  {
    id: 'mac-intel',
    icon: Apple,
    titleKey: 'macIntel',
    descKey: 'macIntelDesc',
  },
  {
    id: 'windows',
    icon: Windows,
    titleKey: 'windows',
    descKey: 'windowsDesc',
  },
]

export function DownloadPage() {
  const { t } = useI18n()
  const [config, setConfig] = useState<DownloadsConfig>(defaultConfig)

  useEffect(() => {
    fetch('/downloads.json')
      .then((res) => res.json())
      .then((data: DownloadsConfig) => setConfig(data))
      .catch(() => {})
  }, [])

  const getDownloadUrl = (id: DownloadId): string => {
    if (!config.baseUrl || !config.downloads[id]) return '#'
    return config.baseUrl + config.downloads[id]
  }

  return (
    <div className="min-h-screen pt-24">
      <div className="mx-auto max-w-4xl px-6 py-12">
        <Link to="/" className="animate-enter mb-8 inline-flex items-center gap-2 text-[var(--color-muted)] transition-colors hover:text-[var(--color-accent)]">
          <ArrowLeft className="h-4 w-4" />
          {t.download.backToHome}
        </Link>

        <div className="animate-enter text-center" style={{ animationDelay: '90ms' }}>
          <h1 className="text-4xl text-[var(--color-ink)] sm:text-5xl">{t.download.title}</h1>
          <p className="mt-4 text-xl text-[var(--color-muted)]">{t.download.description}</p>
          {config.version !== '0.0.0' && (
            <p className="mt-2 text-sm text-[var(--color-muted)]">v{config.version}</p>
          )}
        </div>

        <div className="mt-12 grid gap-4 sm:grid-cols-2">
          {downloadItems.map((item, index) => (
            <a
              key={item.id}
              href={getDownloadUrl(item.id)}
              className="animate-enter group rounded-2xl border border-[var(--color-line)] bg-[var(--color-surface)] p-6 transition-all hover:-translate-y-1 hover:border-[var(--color-accent)] hover:shadow-[0_18px_34px_-26px_var(--shadow-accent)]"
              style={{ animationDelay: `${160 + index * 80}ms` }}
            >
              <div className="flex items-start gap-4">
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-[var(--color-accent-soft)] text-[var(--color-accent)] transition-colors group-hover:bg-[rgba(11,122,114,0.2)]">
                  <item.icon className="h-6 w-6" />
                </div>
                <div className="flex-1">
                  <h3 className="mb-1 text-lg font-semibold text-[var(--color-ink)]">{t.download[item.titleKey]}</h3>
                  <p className="mb-3 text-sm text-[var(--color-muted)]">{t.download[item.descKey]}</p>
                  <span className="inline-flex items-center gap-2 text-sm font-semibold text-[var(--color-accent)] group-hover:text-[var(--color-accent-strong)]">
                    {t.download.downloadButton}
                    <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4M7 10l5 5 5-5M12 15V3" />
                    </svg>
                  </span>
                </div>
              </div>
            </a>
          ))}
        </div>

        <p className="animate-enter mt-4 text-center text-sm text-[var(--color-muted)]" style={{ animationDelay: '250ms' }}>
          {t.download.macSecurityTip}{' '}
          <Link to="/manual/mac-security" className="text-[var(--color-accent)] hover:underline">
            {t.download.macSecurityLink}
          </Link>
        </p>

        <div className="animate-enter mt-12 rounded-2xl border border-[var(--color-line)] bg-[var(--color-surface-muted)] p-6" style={{ animationDelay: '300ms' }}>
          <div className="flex flex-col items-center text-center">
            <h2 className="mb-2 text-xl font-semibold text-[var(--color-ink)]">{t.download.wechatGroup.title}</h2>
            <p className="mb-6 text-[var(--color-muted)]">{t.download.wechatGroup.description}</p>
            <img
              src="/wechat-qr.png"
              alt="WeChat Group QR Code"
              className="max-w-64 rounded-xl"
            />
          </div>
        </div>
      </div>
    </div>
  )
}
