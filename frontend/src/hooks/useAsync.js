import { useEffect, useState } from 'react'

export function useAsync(load, deps) {
  const [state, setState] = useState({ data: null, loading: true, error: '' })

  useEffect(() => {
    let alive = true
    const run = async () => {
      if (!alive) return
      setState((current) => ({ ...current, loading: true, error: '' }))
      try {
        const data = await load()
        if (alive) setState({ data, loading: false, error: '' })
      } catch (error) {
        if (alive) setState({ data: null, loading: false, error: error.message })
      }
    }

    queueMicrotask(run)

    return () => {
      alive = false
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps)

  return state
}
