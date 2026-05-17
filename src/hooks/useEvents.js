import { useState, useEffect, useCallback } from 'react'
import { getEvents } from '../api/events'

export function useEvents(filters = {}) {
  const [data, setData] = useState([])
  const [count, setCount] = useState(0)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  const fetch = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const result = await getEvents(filters)
      setData(result.data)
      setCount(result.count)
    } catch (err) {
      setError(err)
    } finally {
      setLoading(false)
    }
  }, [JSON.stringify(filters)]) // eslint-disable-line

  useEffect(() => {
    fetch()
  }, [fetch])

  return { data, count, loading, error, refetch: fetch }
}

export default useEvents
