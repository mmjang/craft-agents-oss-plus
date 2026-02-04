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
    <div className="min-h-screen bg-gradient-to-b from-zinc-950 to-zinc-900 pt-24">
      <div className="max-w-4xl mx-auto px-6 py-12">
        {/* Back link */}
        <Link to="/" className="inline-flex items-center gap-2 text-zinc-400 hover:text-white mb-8 transition-colors">
          <ArrowLeft className="w-4 h-4" />
          {t.download.backToHome}
        </Link>

        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl sm:text-5xl font-bold text-white mb-4">{t.download.title}</h1>
          <p className="text-xl text-zinc-400">{t.download.description}</p>
        </div>

        {/* Download cards */}
        <div className="grid sm:grid-cols-2 gap-4 mb-12">
          {downloadItems.map((item) => (
            <a
              key={item.id}
              href={getDownloadUrl(item.id)}
              className="bg-zinc-900/50 border border-zinc-800 rounded-xl p-6 hover:border-violet-600 hover:bg-zinc-900 transition-all group"
            >
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 bg-violet-600/20 rounded-lg flex items-center justify-center text-violet-400 group-hover:bg-violet-600/30 transition-colors">
                  <item.icon className="w-6 h-6" />
                </div>
                <div className="flex-1">
                  <h3 className="text-lg font-semibold text-white mb-1">{t.download[item.titleKey]}</h3>
                  <p className="text-sm text-zinc-400 mb-3">{t.download[item.descKey]}</p>
                  <span className="inline-flex items-center gap-2 text-violet-400 text-sm font-medium group-hover:text-violet-300">
                    {t.download.downloadButton}
                    <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4M7 10l5 5 5-5M12 15V3" />
                    </svg>
                  </span>
                </div>
              </div>
            </a>
          ))}
        </div>

        {/* System requirements */}
        <div className="bg-zinc-900/30 border border-zinc-800 rounded-xl p-6">
          <h2 className="text-xl font-semibold text-white mb-4">{t.download.requirements}</h2>
          <ul className="space-y-2 text-zinc-400">
            <li className="flex items-center gap-2">
              <span className="w-1.5 h-1.5 bg-violet-500 rounded-full" />
              {t.download.requirementsList.mac}
            </li>
            <li className="flex items-center gap-2">
              <span className="w-1.5 h-1.5 bg-violet-500 rounded-full" />
              {t.download.requirementsList.windows}
            </li>
            <li className="flex items-center gap-2">
              <span className="w-1.5 h-1.5 bg-violet-500 rounded-full" />
              {t.download.requirementsList.memory}
            </li>
            <li className="flex items-center gap-2">
              <span className="w-1.5 h-1.5 bg-violet-500 rounded-full" />
              {t.download.requirementsList.disk}
            </li>
          </ul>
        </div>
      </div>
    </div>
  )
}
