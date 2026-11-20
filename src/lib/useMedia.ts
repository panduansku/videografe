import { useEffect, useState } from 'react'

/** Di bawah lebar ini (iPad, laptop kecil) UI memakai mode ringkas: inspector menjadi panel geser. */
export const COMPACT_QUERY = '(max-width: 1400px)'

export const isCompact = (): boolean => typeof window !== 'undefined' && window.matchMedia(COMPACT_QUERY).matches

export function useMedia(query: string): boolean {
  const [match, setMatch] = useState(() => window.matchMedia(query).matches)
  useEffect(() => {
    const mq = window.matchMedia(query)
    const on = () => setMatch(mq.matches)
    mq.addEventListener('change', on)
    on()
    return () => mq.removeEventListener('change', on)
  }, [query])
  return match
}
