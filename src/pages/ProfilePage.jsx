import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import {
  getProfile, getUserFavorites, getFollowers,
  getFollowing, follow, unfollow, getUserSubmissions, getUserAttendance, getSuggestedFriends, searchUsers
} from '../api/profiles'
import { supabase } from '../api/supabase'
import { useAuthContext } from '../context/AuthContext'
import EventCard from '../components/EventCard'
import { getInitials, formatDate } from '../utils/helpers'
import toast from 'react-hot-toast'

const TABS = [
  { key: 'favorites', label: '❤️ Favorites' },
  { key: 'friends', label: '👥 Friends' },
  { key: 'submissions', label: '📋 Submissions' },
  { key: 'history', label: '🗓 History' },
]

export default function ProfilePage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { user, updateProfile } = useAuthContext()
  const [profile, setProfile] = useState(null)
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState('favorites')
  const [tabData, setTabData] = useState([])
  const [tabLoading, setTabLoading] = useState(false)
  const [followers, setFollowers] = useState([])
  const [following, setFollowing] = useState([])
  const [suggestedFriends, setSuggestedFriends] = useState([])
  const [friendSearch, setFriendSearch] = useState('')
  const [friendSearchResults, setFriendSearchResults] = useState([])
  const [searchingFriends, setSearchingFriends] = useState(false)
  const [isFollowing, setIsFollowing] = useState(false)
  const [editMode, setEditMode] = useState(false)
  const [editData, setEditData] = useState({})

  const profileId = id === 'me' ? user?.id : id
  const isOwn = user && profileId === user.id

  useEffect(() => {
    if (!profileId) { navigate('/login'); return }
    setLoading(true)
    Promise.all([
      getProfile(profileId),
      getFollowers(profileId),
      getFollowing(profileId),
    ]).then(([p, flrs, flwg]) => {
      setProfile(p)
      setFollowers(flrs)
      setFollowing(flwg)
      if (user && !isOwn) {
        setIsFollowing(flrs.some(f => f.follower_id === user.id))
      }
      setLoading(false)
    })
  }, [profileId]) // eslint-disable-line

  useEffect(() => {
    if (!user) {
      setSuggestedFriends([])
      return
    }

    getSuggestedFriends(user.id).then(setSuggestedFriends)
  }, [user, following.length])

  useEffect(() => {
    if (!user) return

    const refreshSuggestions = () => {
      getSuggestedFriends(user.id).then(setSuggestedFriends)
    }

    const channel = supabase
      .channel(`profile-suggestions-${user.id}`)
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'profiles' }, refreshSuggestions)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'follows' }, refreshSuggestions)
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [user])

  useEffect(() => {
    if (!profileId) return
    setTabLoading(true)
    const loaders = {
      favorites: () => getUserFavorites(profileId),
      friends: async () => {
        const data = await getFollowing(profileId)
        return data.map(f => f.profiles).filter(Boolean)
      },
      submissions: () => getUserSubmissions(profileId),
      history: () => getUserAttendance(profileId),
    }
    loaders[activeTab]?.().then(data => {
      setTabData(data || [])
      setTabLoading(false)
    })
  }, [activeTab, profileId]) // eslint-disable-line

  useEffect(() => {
    if (activeTab !== 'friends') return

    const query = friendSearch.trim()
    if (!query) {
      setFriendSearchResults([])
      setSearchingFriends(false)
      return
    }

    setSearchingFriends(true)
    const timeoutId = setTimeout(() => {
      searchUsers(query)
        .then((results) => {
          setFriendSearchResults(results.filter(result => result.id !== profileId))
        })
        .finally(() => setSearchingFriends(false))
    }, 250)

    return () => clearTimeout(timeoutId)
  }, [friendSearch, activeTab, profileId])

  const handleFollow = async () => {
    if (!user) { toast.error('Please sign in'); return }
    try {
      if (isFollowing) {
        await unfollow(user.id, profileId)
        setIsFollowing(false)
        setFollowers(prev => prev.filter(f => f.follower_id !== user.id))
        toast.success('Unfollowed')
      } else {
        await follow(user.id, profileId)
        setIsFollowing(true)
        toast.success('Following!')
      }
    } catch {
      toast.error('Something went wrong')
    }
  }

  const handleFollowSuggested = async (suggestedUserId) => {
    if (!user) { toast.error('Please sign in'); return }
    try {
      await follow(user.id, suggestedUserId)
      setSuggestedFriends(prev => prev.filter(friend => friend.id !== suggestedUserId))
      if (profileId === suggestedUserId) {
        setIsFollowing(true)
      }
      toast.success('Friend added')
    } catch {
      toast.error('Something went wrong')
    }
  }

  const handleSaveProfile = async (e) => {
    e.preventDefault()
    try {
      await updateProfile(editData)
      setProfile(prev => ({ ...prev, ...editData }))
      setEditMode(false)
      toast.success('Profile updated!')
    } catch {
      toast.error('Failed to update profile')
    }
  }

  if (loading) {
    return (
      <div className="max-w-5xl mx-auto px-4 py-8 space-y-6">
        <div className="h-64 skeleton rounded-2xl" />
        <div className="h-24 w-24 skeleton rounded-full -mt-12 ml-6" />
        <div className="h-6 skeleton rounded w-1/3" />
      </div>
    )
  }

  if (!profile) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center text-center">
        <div className="text-5xl mb-4">👤</div>
        <h2 className="text-xl font-bold text-gray-900">Profile not found</h2>
      </div>
    )
  }

  const name = profile.full_name || profile.username || 'User'

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div
        className="relative h-56 sm:h-64 rounded-2xl overflow-hidden bg-gradient-to-r from-brand-600 via-brand-500 to-teal-500"
        style={profile.cover_url ? { backgroundImage: `url(${profile.cover_url})`, backgroundSize: 'cover', backgroundPosition: 'center' } : {}}
      >
        <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-black/10 to-transparent" />
        <div className="absolute left-6 right-6 bottom-6">
          <p className="text-white/75 text-sm">JeddahEvents Profile</p>
          <h1 className="text-2xl sm:text-3xl font-bold text-white">{name}</h1>
        </div>
      </div>

      <div className="px-6 pb-6 -mt-10 relative z-10">
        <div className="flex flex-wrap items-end justify-between gap-4 mb-4">
          <div className="w-24 h-24 rounded-full border-4 border-white bg-brand-500 flex items-center justify-center text-white text-2xl font-bold overflow-hidden shadow-lg">
            {profile.avatar_url ? (
              <img src={profile.avatar_url} alt={name} className="w-full h-full object-cover" />
            ) : getInitials(name)}
          </div>
          <div className="flex gap-2">
            {isOwn ? (
              <button
                onClick={() => {
                  setEditMode(true)
                  setEditData({
                    full_name: profile.full_name || '',
                    username: profile.username || '',
                    bio: profile.bio || '',
                    avatar_url: profile.avatar_url || '',
                    cover_url: profile.cover_url || '',
                  })
                }}
                className="btn-secondary text-sm"
              >
                ✏️ Edit Profile
              </button>
            ) : (
              <button
                onClick={handleFollow}
                className={`text-sm font-semibold px-5 py-2 rounded-xl transition-colors ${
                  isFollowing
                    ? 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    : 'bg-brand-500 text-white hover:bg-brand-600'
                }`}
              >
                {isFollowing ? 'Following ✓' : '+ Follow'}
              </button>
            )}
          </div>
        </div>

        <div>
          <h2 className="text-2xl font-bold text-gray-900">{name}</h2>
          {profile.username && <p className="text-gray-500 text-sm">@{profile.username}</p>}
          {profile.bio && <p className="text-gray-700 mt-2 text-sm leading-relaxed max-w-2xl">{profile.bio}</p>}
        </div>

        <div className="flex gap-6 mt-4 text-center">
          {[
            { label: 'Followers', value: followers.length },
            { label: 'Following', value: following.length },
          ].map(s => (
            <div key={s.label}>
              <p className="font-bold text-gray-900">{s.value}</p>
              <p className="text-xs text-gray-500">{s.label}</p>
            </div>
          ))}
        </div>
      </div>

      {editMode && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/50" onClick={() => setEditMode(false)} />
          <div className="relative bg-white rounded-2xl p-6 w-full max-w-md z-10">
            <h2 className="text-lg font-bold mb-4">Edit Profile</h2>
            <form onSubmit={handleSaveProfile} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Full Name</label>
                <input value={editData.full_name || ''} onChange={e => setEditData(p => ({ ...p, full_name: e.target.value }))}
                  className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Username</label>
                <input value={editData.username || ''} onChange={e => setEditData(p => ({ ...p, username: e.target.value }))}
                  className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Bio</label>
                <textarea value={editData.bio || ''} onChange={e => setEditData(p => ({ ...p, bio: e.target.value }))}
                  rows={3} className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 resize-none" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Avatar URL</label>
                <input value={editData.avatar_url || ''} onChange={e => setEditData(p => ({ ...p, avatar_url: e.target.value }))}
                  placeholder="https://example.com/avatar.jpg"
                  className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Cover URL</label>
                <input value={editData.cover_url || ''} onChange={e => setEditData(p => ({ ...p, cover_url: e.target.value }))}
                  placeholder="https://example.com/cover.jpg"
                  className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500" />
              </div>
              <div className="flex gap-3 pt-2">
                <button type="submit" className="btn-primary flex-1">Save</button>
                <button type="button" onClick={() => setEditMode(false)} className="btn-secondary flex-1">Cancel</button>
              </div>
            </form>
          </div>
        </div>
      )}

      <div className="border-b border-gray-200 mb-6">
        <div className="flex gap-1 overflow-x-auto scrollbar-hide">
          {TABS.map(tab => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`px-4 py-3 text-sm font-medium whitespace-nowrap border-b-2 transition-colors ${
                activeTab === tab.key
                  ? 'border-brand-500 text-brand-600'
                  : 'border-transparent text-gray-500 hover:text-gray-800'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {user && activeTab === 'friends' && suggestedFriends.length > 0 && (
        <div className="card p-5 mb-6">
          <div className="flex items-center justify-between gap-3 mb-4">
            <div>
              <h3 className="font-semibold text-gray-900">Friend Suggestions</h3>
              <p className="text-sm text-gray-500 mt-1">People you may want to follow.</p>
            </div>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-3">
            {suggestedFriends.map(friend => (
              <div key={friend.id} className="border border-gray-100 rounded-xl p-4">
                <button
                  onClick={() => navigate(`/profile/${friend.id}`)}
                  className="w-full text-left"
                >
                  <div className="w-12 h-12 rounded-full bg-teal-500 flex items-center justify-center text-white font-semibold text-sm overflow-hidden mb-3">
                    {friend.avatar_url ? (
                      <img src={friend.avatar_url} alt={friend.full_name || friend.username} className="w-full h-full object-cover" />
                    ) : (
                      getInitials(friend.full_name || friend.username)
                    )}
                  </div>
                  <p className="font-semibold text-sm text-gray-900">{friend.full_name || friend.username}</p>
                  {friend.username && <p className="text-xs text-gray-500 mt-0.5">@{friend.username}</p>}
                  {friend.bio && <p className="text-xs text-gray-500 mt-2 line-clamp-2">{friend.bio}</p>}
                </button>
                <button
                  onClick={() => handleFollowSuggested(friend.id)}
                  className="btn-primary w-full text-sm mt-4 py-2"
                >
                  Add Friend
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {activeTab === 'friends' && (
        <div className="card p-5 mb-6">
          <div className="flex items-center justify-between gap-3 mb-4">
            <div>
              <h3 className="font-semibold text-gray-900">Find Friends</h3>
              <p className="text-sm text-gray-500 mt-1">Search by full name or username.</p>
            </div>
          </div>
          <input
            value={friendSearch}
            onChange={e => setFriendSearch(e.target.value)}
            placeholder="Search friends by name or username"
            className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
          />

          {friendSearch.trim() && (
            <div className="mt-4">
              {searchingFriends ? (
                <div className="space-y-3">
                  {Array.from({ length: 2 }).map((_, i) => (
                    <div key={i} className="h-16 skeleton rounded-xl" />
                  ))}
                </div>
              ) : friendSearchResults.length > 0 ? (
                <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
                  {friendSearchResults.map(result => (
                    <div key={result.id} className="border border-gray-100 rounded-xl p-4">
                      <button
                        onClick={() => navigate(`/profile/${result.id}`)}
                        className="w-full text-left"
                      >
                        <div className="flex items-center gap-3">
                          <div className="w-12 h-12 rounded-full bg-teal-500 flex items-center justify-center text-white font-semibold text-sm overflow-hidden shrink-0">
                            {result.avatar_url ? (
                              <img src={result.avatar_url} alt={result.full_name || result.username} className="w-full h-full object-cover" />
                            ) : (
                              getInitials(result.full_name || result.username)
                            )}
                          </div>
                          <div className="min-w-0">
                            <p className="font-semibold text-sm text-gray-900 truncate">{result.full_name || result.username}</p>
                            {result.username && <p className="text-xs text-gray-500 truncate">@{result.username}</p>}
                          </div>
                        </div>
                      </button>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-gray-500">No users found.</p>
              )}
            </div>
          )}
        </div>
      )}

      {tabLoading ? (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="card h-48 skeleton" />
          ))}
        </div>
      ) : tabData.length === 0 ? (
        <div className="text-center py-16 text-gray-400">
          <div className="text-5xl mb-3">📭</div>
          <p>Nothing here yet</p>
        </div>
      ) : activeTab === 'favorites' ? (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {tabData.map(fav => (
            fav.events ? (
              <div key={fav.id} className="space-y-2">
                <EventCard event={fav.events} isFavorited />
                <p className="px-1 text-xs text-gray-400">Saved {formatDate(fav.created_at)}</p>
              </div>
            ) : null
          ))}
        </div>
      ) : activeTab === 'friends' ? (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {tabData.map(u => (
            <div key={u.id} className="card p-4 flex items-center gap-3 cursor-pointer hover:shadow-md transition-shadow" onClick={() => navigate(`/profile/${u.id}`)}>
              <div className="w-12 h-12 rounded-full bg-teal-500 flex items-center justify-center text-white font-semibold text-sm overflow-hidden">
                {u.avatar_url ? (
                  <img src={u.avatar_url} alt={u.full_name || u.username} className="w-full h-full object-cover" />
                ) : (
                  getInitials(u.full_name || u.username)
                )}
              </div>
              <div>
                <p className="font-semibold text-sm text-gray-900">{u.full_name || u.username}</p>
                {u.username && <p className="text-xs text-gray-500">@{u.username}</p>}
              </div>
            </div>
          ))}
        </div>
      ) : activeTab === 'submissions' ? (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {tabData.map(event => <EventCard key={event.id} event={event} />)}
        </div>
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {tabData.map(a => a.events ? <EventCard key={a.id} event={a.events} /> : null)}
        </div>
      )}
    </div>
  )
}
