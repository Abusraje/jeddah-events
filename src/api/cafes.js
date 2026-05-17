import { supabase } from './supabase'

export async function getCafes({ tags = [], search } = {}) {
  try {
    let query = supabase.from('cafes').select('*')

    if (search) query = query.ilike('name', `%${search}%`)
    if (tags && tags.length > 0) {
      query = query.contains('tags', tags)
    }

    query = query.order('rating', { ascending: false })

    const { data, error } = await query
    if (error) throw error
    return data || []
  } catch (err) {
    console.error('getCafes error:', err)
    return []
  }
}

export async function getCafeById(id) {
  try {
    const { data, error } = await supabase
      .from('cafes')
      .select('*, reviews(*, profiles(username, avatar_url))')
      .eq('id', id)
      .single()
    if (error) throw error
    return data
  } catch (err) {
    console.error('getCafeById error:', err)
    return null
  }
}
