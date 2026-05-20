import { useEffect, useMemo, useState } from 'react'
import PostCard from '../components/PostCard'
import usePosts from '../hooks/usePosts'
import { createPost } from '../api/posts'
import { follow, getSuggestedFriends } from '../api/profiles'
import { supabase } from '../api/supabase'
import { useAuthContext } from '../context/AuthContext'
import { getInitials } from '../utils/helpers'
import { useNavigate } from 'react-router-dom'
import toast from 'react-hot-toast'

const TRENDING_TAGS = [
  '#JeddahFood', '#Corniche', '#WeekendVibes', '#JeddahCafe',
  '#HistoricJeddah', '#RedSea', '#JeddahEvents', '#SaudiArt',
]

export default function SocialPage() {
  const { user, profile } = useAuthContext()
  const navigate = useNavigate()
  const { posts, loading, loadingMore, hasMore, loadMore, prependPost, updatePost, removePost } = usePosts()

  const [postContent, setPostContent] = useState('')
  const [postLocation, setPostLocation] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [activeTag, setActiveTag] = useState('')
  const [suggestedFriends, setSuggestedFriends] = useState([])

  const name = profile?.full_name || profile?.username || ''

  const filteredPosts = useMemo(() => {
    if (!activeTag) return posts

    const normalizedTag = activeTag.replace('#', '').toLowerCase()
    return posts.filter((post) => {
      const content = (post.content || '').toLowerCase()
      const location = (post.location_tag || '').toLowerCase()
      return content.includes(activeTag.toLowerCase()) ||
        content.includes(normalizedTag) ||
        location.includes(normalizedTag)
    })
  }, [activeTag, posts])

  useEffect(() => {
    if (!user) {
      setSuggestedFriends([])
      return
    }

    getSuggestedFriends(user.id).then(setSuggestedFriends)
  }, [user])

  useEffect(() => {
    if (!user) return

    const refreshSuggestions = () => {
      getSuggestedFriends(user.id).then(setSuggestedFriends)
    }

    const channel = supabase
      .channel(`social-suggestions-${user.id}`)
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'profiles' }, refreshSuggestions)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'follows' }, refreshSuggestions)
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [user])

  const handleFollowSuggested = async (suggestedUserId) => {
    if (!user) { toast.error('Please sign in'); return }
    try {
      await follow(user.id, suggestedUserId)
      setSuggestedFriends(prev => prev.filter(friend => friend.id !== suggestedUserId))
      toast.success('Friend added')
    } catch {
      toast.error('Something went wrong')
    }
  }

  const handleCreatePost = async (e) => {
    e.preventDefault()
    if (!user) { toast.error('Please sign in'); return }
    if (!postContent.trim()) return
    setSubmitting(true)
    try {
      const newPost = await createPost({
        content: postContent.trim(),
        locationTag: postLocation.trim() || null,
        userId: user.id,
      })
      prependPost({ ...newPost, profiles: profile, likes: [], comments: [{ count: 0 }] })
      setPostContent('')
      setPostLocation('')
      toast.success('Posted!')
    } catch {
      toast.error('Failed to post')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="grid lg:grid-cols-[200px_1fr_240px] gap-6">
        {/* Left sidebar */}
        <aside className="hidden lg:block space-y-2">
          <h2 className="text-xs font-semibold text-gray-500 uppercase tracking-wide px-2 mb-3">Navigation</h2>
          {[
            { icon: '🏠', label: 'Feed', onClick: () => navigate('/social/feed') },
            { icon: '👤', label: 'Profile', onClick: () => user && navigate(`/profile/${user.id}`) },
          ].map(item => (
            <button
              key={item.label}
              onClick={item.onClick}
              className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl transition-colors text-left text-gray-700 hover:bg-brand-50 hover:text-brand-600"
            >
              <span className="text-lg">{item.icon}</span>
              <span className="font-medium">{item.label}</span>
            </button>
          ))}
        </aside>

        {/* Center feed */}
        <div className="space-y-4">
          {activeTag && (
            <div className="card p-3 flex flex-wrap items-center justify-between gap-3">
              <div>
                <p className="text-sm font-semibold text-gray-900">Showing posts for {activeTag}</p>
                <p className="text-xs text-gray-500 mt-1">{filteredPosts.length} matching posts</p>
              </div>
              <button
                onClick={() => setActiveTag('')}
                className="btn-secondary text-sm py-2 px-3"
              >
                Clear filter
              </button>
            </div>
          )}

          {/* Create post */}
          <div className="card p-4">
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-full bg-brand-500 flex items-center justify-center text-white text-sm font-semibold shrink-0">
                {user ? getInitials(name) : '?'}
              </div>
              <div className="flex-1">
                <textarea
                  value={postContent}
                  onChange={e => setPostContent(e.target.value)}
                  placeholder={user ? "What's happening in Jeddah?" : 'Sign in to post…'}
                  disabled={!user}
                  rows={3}
                  className="w-full text-sm border border-gray-200 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-brand-500 resize-none disabled:bg-gray-50 disabled:cursor-not-allowed"
                />
                <div className="flex items-center justify-between mt-2">
                  <input
                    value={postLocation}
                    onChange={e => setPostLocation(e.target.value)}
                    placeholder="📍 Add location…"
                    className="text-sm border-0 text-gray-500 placeholder-gray-400 focus:outline-none bg-transparent"
                  />
                  <button
                    onClick={handleCreatePost}
                    disabled={submitting || !postContent.trim() || !user}
                    className="btn-primary text-sm py-1.5 px-4 disabled:opacity-50"
                  >
                    {submitting ? 'Posting…' : 'Post'}
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Feed */}
          {loading ? (
            Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="card p-4 space-y-3">
                <div className="flex gap-3">
                  <div className="w-10 h-10 skeleton rounded-full" />
                  <div className="flex-1 space-y-2">
                    <div className="h-4 skeleton rounded w-1/3" />
                    <div className="h-3 skeleton rounded w-1/4" />
                  </div>
                </div>
                <div className="h-16 skeleton rounded-lg" />
              </div>
            ))
          ) : filteredPosts.length > 0 ? (
            <>
              {filteredPosts.map(post => (
                <PostCard key={post.id} post={post} onUpdate={updatePost} onDelete={removePost} />
              ))}
              {!activeTag && hasMore && (
                <div className="text-center pt-2">
                  <button
                    onClick={loadMore}
                    disabled={loadingMore}
                    className="btn-secondary text-sm"
                  >
                    {loadingMore ? 'Loading…' : 'Load more'}
                  </button>
                </div>
              )}
            </>
          ) : (
            <div className="flex flex-col items-center justify-center py-16 text-center text-gray-400">
              <div className="text-5xl mb-3">💬</div>
              <p className="font-medium">{activeTag ? `No posts found for ${activeTag}` : 'No posts yet'}</p>
              <p className="text-sm mt-1">
                {activeTag ? 'Try a different trending tag or clear the filter.' : 'Be the first to share something!'}
              </p>
            </div>
          )}
        </div>

        {/* Right sidebar */}
        <aside className="hidden lg:block space-y-5">
          {user && suggestedFriends.length > 0 && (
            <div className="card p-4">
              <h3 className="font-semibold text-gray-900 mb-3 text-sm">People to Follow</h3>
              <div className="space-y-3">
                {suggestedFriends.map(friend => (
                  <div key={friend.id} className="border border-gray-100 rounded-xl p-3">
                    <button
                      onClick={() => navigate(`/profile/${friend.id}`)}
                      className="w-full text-left"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-11 h-11 rounded-full bg-teal-500 flex items-center justify-center text-white font-semibold text-sm overflow-hidden shrink-0">
                          {friend.avatar_url ? (
                            <img src={friend.avatar_url} alt={friend.full_name || friend.username} className="w-full h-full object-cover" />
                          ) : (
                            getInitials(friend.full_name || friend.username)
                          )}
                        </div>
                        <div className="min-w-0">
                          <p className="font-medium text-sm text-gray-900 truncate">{friend.full_name || friend.username}</p>
                          {friend.username && <p className="text-xs text-gray-500 truncate">@{friend.username}</p>}
                        </div>
                      </div>
                    </button>
                    <button
                      onClick={() => handleFollowSuggested(friend.id)}
                      className="btn-primary w-full text-sm mt-3 py-2"
                    >
                      Add Friend
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Trending */}
          <div className="card p-4">
            <h3 className="font-semibold text-gray-900 mb-3 text-sm">Trending in Jeddah</h3>
            <div className="space-y-2">
              {TRENDING_TAGS.map(tag => (
                <button
                  key={tag}
                  onClick={() => setActiveTag(tag)}
                  className={`block text-sm font-medium transition-colors ${
                    activeTag === tag
                      ? 'text-brand-700'
                      : 'text-teal-600 hover:text-teal-800'
                  }`}
                >
                  {tag}
                </button>
              ))}
            </div>
          </div>
        </aside>
      </div>
    </div>
  )
}
