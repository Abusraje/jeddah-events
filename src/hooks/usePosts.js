import { useState, useEffect, useCallback, useRef } from 'react'
import { getPosts } from '../api/posts'
import { supabase } from '../api/supabase'

export function usePosts() {
  const [posts, setPosts] = useState([])
  const [page, setPage] = useState(1)
  const [hasMore, setHasMore] = useState(true)
  const [loading, setLoading] = useState(true)
  const [loadingMore, setLoadingMore] = useState(false)
  const [error, setError] = useState(null)
  const channelRef = useRef(null)

  const fetchPage = useCallback(async (p) => {
    try {
      const result = await getPosts({ page: p })
      return result
    } catch (err) {
      throw err
    }
  }, [])

  // Initial load
  useEffect(() => {
    setLoading(true)
    fetchPage(1)
      .then(({ data, count }) => {
        setPosts(data)
        setHasMore(data.length < count)
        setPage(1)
      })
      .catch(setError)
      .finally(() => setLoading(false))
  }, [fetchPage])

  // Realtime subscription
  useEffect(() => {
    const channel = supabase
      .channel('posts-realtime')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'posts' }, (payload) => {
        setPosts((prev) => [payload.new, ...prev])
      })
      .subscribe()

    channelRef.current = channel
    return () => {
      supabase.removeChannel(channel)
    }
  }, [])

  const loadMore = useCallback(async () => {
    if (loadingMore || !hasMore) return
    setLoadingMore(true)
    try {
      const nextPage = page + 1
      const { data, count } = await fetchPage(nextPage)
      setPosts((prev) => [...prev, ...data])
      setPage(nextPage)
      setHasMore(posts.length + data.length < count)
    } catch (err) {
      setError(err)
    } finally {
      setLoadingMore(false)
    }
  }, [loadingMore, hasMore, page, posts.length, fetchPage])

  const prependPost = useCallback((post) => {
    setPosts((prev) => [post, ...prev])
  }, [])

  const updatePost = useCallback((postId, updater) => {
    setPosts((prev) => prev.map((p) => p.id === postId ? updater(p) : p))
  }, [])

  const removePost = useCallback((postId) => {
    setPosts((prev) => prev.filter((p) => p.id !== postId))
  }, [])

  return { posts, loading, loadingMore, hasMore, error, loadMore, prependPost, updatePost, removePost }
}

export default usePosts
