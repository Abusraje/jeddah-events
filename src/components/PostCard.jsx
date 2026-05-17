import { useState } from 'react'
import { timeAgo, getInitials } from '../utils/helpers'
import { likePost, unlikePost, getComments, addComment } from '../api/posts'
import { useAuthContext } from '../context/AuthContext'
import toast from 'react-hot-toast'

export default function PostCard({ post, onUpdate }) {
  const { user } = useAuthContext()
  const [showComments, setShowComments] = useState(false)
  const [comments, setComments] = useState([])
  const [commentText, setCommentText] = useState('')
  const [loadingComments, setLoadingComments] = useState(false)
  const [submitting, setSubmitting] = useState(false)

  const likes = post.likes || []
  const isLiked = user ? likes.some(l => l.user_id === user.id) : false
  const likeCount = likes.length
  const commentCount = post.comments?.[0]?.count || 0

  const profile = post.profiles || {}
  const name = profile.full_name || profile.username || 'Someone'

  const handleLike = async () => {
    if (!user) { toast.error('Sign in to like posts'); return }
    try {
      if (isLiked) {
        await unlikePost(post.id, user.id)
        onUpdate?.(post.id, p => ({ ...p, likes: p.likes.filter(l => l.user_id !== user.id) }))
      } else {
        await likePost(post.id, user.id)
        onUpdate?.(post.id, p => ({ ...p, likes: [...(p.likes || []), { user_id: user.id }] }))
      }
    } catch {
      toast.error('Something went wrong')
    }
  }

  const handleToggleComments = async () => {
    if (!showComments && comments.length === 0) {
      setLoadingComments(true)
      try {
        const data = await getComments(post.id)
        setComments(data)
      } catch {
        toast.error('Failed to load comments')
      } finally {
        setLoadingComments(false)
      }
    }
    setShowComments(v => !v)
  }

  const handleAddComment = async (e) => {
    e.preventDefault()
    if (!user) { toast.error('Sign in to comment'); return }
    if (!commentText.trim()) return
    setSubmitting(true)
    try {
      const newComment = await addComment({ postId: post.id, userId: user.id, content: commentText.trim() })
      setComments(prev => [...prev, newComment])
      setCommentText('')
    } catch {
      toast.error('Failed to add comment')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="card p-4">
      {/* Header */}
      <div className="flex items-center gap-3 mb-3">
        <div className="w-10 h-10 rounded-full bg-brand-500 flex items-center justify-center text-white text-sm font-semibold shrink-0 overflow-hidden">
          {profile.avatar_url ? (
            <img src={profile.avatar_url} alt={name} className="w-full h-full object-cover" />
          ) : getInitials(name)}
        </div>
        <div>
          <p className="font-semibold text-sm text-gray-900">{name}</p>
          <p className="text-xs text-gray-400">{timeAgo(post.created_at)}{post.location_tag ? ` · 📍 ${post.location_tag}` : ''}</p>
        </div>
      </div>

      {/* Content */}
      <p className="text-gray-800 text-sm leading-relaxed mb-3">{post.content}</p>

      {/* Image */}
      {post.image_url && (
        <div className="mb-3 rounded-xl overflow-hidden">
          <img src={post.image_url} alt="Post" className="w-full max-h-80 object-cover" />
        </div>
      )}

      {/* Actions */}
      <div className="flex items-center gap-4 pt-2 border-t border-gray-100">
        <button
          onClick={handleLike}
          className={`flex items-center gap-1.5 text-sm transition-colors ${
            isLiked ? 'text-red-500' : 'text-gray-500 hover:text-red-500'
          }`}
        >
          <span>{isLiked ? '♥' : '♡'}</span>
          <span>{likeCount}</span>
        </button>
        <button
          onClick={handleToggleComments}
          className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-brand-500 transition-colors"
        >
          <span>💬</span>
          <span>{commentCount}</span>
        </button>
      </div>

      {/* Comments */}
      {showComments && (
        <div className="mt-3 pt-3 border-t border-gray-100">
          {loadingComments ? (
            <div className="space-y-2">
              {[1, 2].map(i => (
                <div key={i} className="flex gap-2">
                  <div className="w-8 h-8 skeleton rounded-full" />
                  <div className="flex-1 h-8 skeleton rounded-lg" />
                </div>
              ))}
            </div>
          ) : (
            <div className="space-y-3 mb-3">
              {comments.map(c => (
                <div key={c.id} className="flex gap-2">
                  <div className="w-7 h-7 rounded-full bg-teal-500 flex items-center justify-center text-white text-xs font-medium shrink-0">
                    {getInitials(c.profiles?.username || '')}
                  </div>
                  <div className="flex-1 bg-gray-50 rounded-lg px-3 py-2">
                    <span className="text-xs font-semibold text-gray-700">{c.profiles?.username || 'User'} </span>
                    <span className="text-xs text-gray-700">{c.content}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
          <form onSubmit={handleAddComment} className="flex gap-2">
            <input
              value={commentText}
              onChange={e => setCommentText(e.target.value)}
              placeholder="Add a comment…"
              className="flex-1 text-sm px-3 py-2 rounded-lg border border-gray-200 focus:outline-none focus:ring-2 focus:ring-brand-500"
            />
            <button
              type="submit"
              disabled={submitting || !commentText.trim()}
              className="btn-primary text-sm py-2 px-3 disabled:opacity-50"
            >
              Post
            </button>
          </form>
        </div>
      )}
    </div>
  )
}
