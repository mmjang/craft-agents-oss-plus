import { createContext, useContext, useState, useEffect, ReactNode } from 'react'

interface RouterContextType {
  route: string
  navigate: (route: string) => void
}

const RouterContext = createContext<RouterContextType | null>(null)

function getRouteFromHash(): string {
  return window.location.hash.slice(1) || '/'
}

export function RouterProvider({ children }: { children: ReactNode }) {
  const [route, setRoute] = useState<string>(getRouteFromHash)

  useEffect(() => {
    const handleHashChange = () => setRoute(getRouteFromHash())
    window.addEventListener('hashchange', handleHashChange)
    return () => window.removeEventListener('hashchange', handleHashChange)
  }, [])

  const navigate = (newRoute: string) => {
    window.location.hash = newRoute
  }

  return (
    <RouterContext.Provider value={{ route, navigate }}>
      {children}
    </RouterContext.Provider>
  )
}

export function useRouter() {
  const context = useContext(RouterContext)
  if (!context) throw new Error('useRouter must be used within RouterProvider')
  return context
}

export function Link({ to, children, className }: { to: string; children: ReactNode; className?: string }) {
  const { navigate } = useRouter()
  return (
    <a
      href={`#${to}`}
      className={className}
      onClick={(e) => {
        e.preventDefault()
        navigate(to)
        window.scrollTo(0, 0)
      }}
    >
      {children}
    </a>
  )
}
