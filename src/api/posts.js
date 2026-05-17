import { supabase } from './supabase'

const PAGE_SIZE = 10

export async function getPosts({ page = 1 } = {}) {
  try {
    const from = (page - 1) * PAGE_SIZE
    const { data, error, count } = await supabase
      .from('posts')
      .select('*, profiles(username, avatar_url), likes(user_id), comments(count)', { count: 'exact' })
      .order('created_at', { ascending: false })
      .range(from, from + PAGE_SIZE - 1)
    if (error) throw error
    return { data: data || [], count: count || 0 }
  } catch (err) {
    console.error('getPosts error:', err)
    return { data: [], count: 0 }
  }
}

export async function createPost({ content, imageUrl, locationTag, userId }) {
  try {
    const { data, error } = await supabase
      .from('posts')
      .insert([{ content, image_url: imageUrl, location_tag: locationTag, user_id: userId }])
      .select()
      .single()
    if (error) throw error
    return data
  } catch (err) {
    console.error('createPost error:', err)
    throw err
  }
}

export async function likePost(postId, userId) {
  try {
    const { error } = await supabase
      .from('likes')
      .insert([{ post_id: postId, user_id: userId }])
    if (error) throw error
    return true
  } catch (err) {
    console.error('likePost error:', err)
    throw err
  }
}

export async function unlikePost(postId, userId) {
  try {
    const { error } = await supabase
      .from('likes')
      .delete()
      .eq('post_id', postId)
      .eq('user_id', userId)
    if (error) throw error
    return true
  } catch (err) {
    console.error('unlikePost error:', err)
    throw err
  }
}

export async function getComments(postId) {
  try {
    const { data, error } = await supabase
      .from('comments')
      .select('*, profiles(username, avatar_url)')
      .eq('post_id', postId)
      .order('created_at', { ascending: true })
    if (error) throw error
    return data || []
  } catch (err) {
    console.error('getComments error:', err)
    return []
  }
}

export async function addComment({ postId, userId, content }) {
  try {
    const { data, error } = await supabase
      .from('comments')
      .insert([{ post_id: postId, user_id: userId, content }])
      .select('*, profiles(username, avatar_url)')
      .single()
    if (error) throw error
    return data
  } catch (err) {
    console.error('addComment error:', err)
    throw err
  }
}
