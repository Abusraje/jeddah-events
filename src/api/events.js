import { supabase } from './supabase'

export async function getEvents({
  category,
  dateRange,
  minPrice,
  maxPrice,
  sort = 'date_asc',
  page = 1,
  pageSize = 10,
  search,
} = {}) {
  try {
    let query = supabase.from('events').select('*', { count: 'exact' })

    if (category) query = query.eq('category', category)
    if (search) query = query.ilike('title', `%${search}%`)
    if (minPrice !== undefined) query = query.gte('price', minPrice)
    if (maxPrice !== undefined) query = query.lte('price', maxPrice)

    const now = new Date()
    if (dateRange === 'today') {
      const start = new Date(now.setHours(0, 0, 0, 0)).toISOString()
      const end = new Date(now.setHours(23, 59, 59, 999)).toISOString()
      query = query.gte('date', start).lte('date', end)
    } else if (dateRange === 'tomorrow') {
      const tomorrow = new Date()
      tomorrow.setDate(tomorrow.getDate() + 1)
      const start = new Date(tomorrow.setHours(0, 0, 0, 0)).toISOString()
      const end = new Date(tomorrow.setHours(23, 59, 59, 999)).toISOString()
      query = query.gte('date', start).lte('date', end)
    } else if (dateRange === 'weekend') {
      const day = now.getDay()
      const daysUntilSat = (6 - day + 7) % 7 || 7
      const sat = new Date()
      sat.setDate(now.getDate() + daysUntilSat)
      const sun = new Date(sat)
      sun.setDate(sat.getDate() + 1)
      query = query
        .gte('date', sat.toISOString().split('T')[0])
        .lte('date', sun.toISOString().split('T')[0] + 'T23:59:59')
    }

    const [sortField, sortDir] = sort === 'date_asc'
      ? ['date', true]
      : sort === 'date_desc'
      ? ['date', false]
      : sort === 'price_asc'
      ? ['price', true]
      : sort === 'price_desc'
      ? ['price', false]
      : ['date', true]

    query = query.order(sortField, { ascending: sortDir })

    const from = (page - 1) * pageSize
    query = query.range(from, from + pageSize - 1)

    const { data, error, count } = await query
    if (error) throw error
    return { data: data || [], count: count || 0 }
  } catch (err) {
    console.error('getEvents error:', err)
    return { data: [], count: 0 }
  }
}

export async function getFeaturedEvents() {
  try {
    const { data, error } = await supabase
      .from('events')
      .select('*')
      .eq('is_featured', true)
      .order('date', { ascending: true })
      .limit(10)
    if (error) throw error
    return data || []
  } catch (err) {
    console.error('getFeaturedEvents error:', err)
    return []
  }
}

export async function getEventById(id) {
  try {
    const { data, error } = await supabase
      .from('events')
      .select('*, reviews(*, profiles(username, avatar_url))')
      .eq('id', id)
      .single()
    if (error) throw error
    return data
  } catch (err) {
    console.error('getEventById error:', err)
    return null
  }
}

export async function getRelatedEvents(category, excludeId) {
  try {
    const { data, error } = await supabase
      .from('events')
      .select('*')
      .eq('category', category)
      .neq('id', excludeId)
      .order('date', { ascending: true })
      .limit(4)
    if (error) throw error
    return data || []
  } catch (err) {
    console.error('getRelatedEvents error:', err)
    return []
  }
}

export async function submitEvent(eventData) {
  try {
    const { data, error } = await supabase
      .from('events')
      .insert([{ ...eventData, is_featured: false, is_approved: false }])
      .select()
      .single()
    if (error) throw error
    return data
  } catch (err) {
    console.error('submitEvent error:', err)
    throw err
  }
}

export async function addAttendance(eventId, userId) {
  try {
    const { error } = await supabase
      .from('attendance')
      .insert([{ event_id: eventId, user_id: userId }])
    if (error) throw error
    return true
  } catch (err) {
    console.error('addAttendance error:', err)
    throw err
  }
}

export async function removeAttendance(eventId, userId) {
  try {
    const { error } = await supabase
      .from('attendance')
      .delete()
      .eq('event_id', eventId)
      .eq('user_id', userId)
    if (error) throw error
    return true
  } catch (err) {
    console.error('removeAttendance error:', err)
    throw err
  }
}

export async function addReview(eventId, userId, rating, comment) {
  try {
    const { data, error } = await supabase
      .from('reviews')
      .insert([{ event_id: eventId, user_id: userId, rating, comment }])
      .select()
      .single()
    if (error) throw error
    return data
  } catch (err) {
    console.error('addReview error:', err)
    throw err
  }
}
