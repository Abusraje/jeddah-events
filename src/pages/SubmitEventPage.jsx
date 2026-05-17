import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { submitEvent } from '../api/events'
import { useAuthContext } from '../context/AuthContext'
import toast from 'react-hot-toast'

const CATEGORIES = ['Cinema', 'Music', 'Art', 'Comedy', 'Workshop', 'Food', 'Sports', 'Festival', 'Other']

export default function SubmitEventPage() {
  const { user } = useAuthContext()
  const navigate = useNavigate()
  const [submitting, setSubmitting] = useState(false)
  const [form, setForm] = useState({
    title: '',
    description: '',
    category: '',
    date: '',
    time: '',
    venue: '',
    price: '',
    image_url: '',
    ticket_url: '',
  })

  const update = (key, val) => setForm(prev => ({ ...prev, [key]: val }))

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!form.title || !form.category || !form.date || !form.venue) {
      toast.error('Please fill in all required fields')
      return
    }
    setSubmitting(true)
    try {
      const dateTime = form.time ? `${form.date}T${form.time}` : form.date
      const event = await submitEvent({
        title: form.title,
        description: form.description,
        category: form.category,
        date: dateTime,
        venue: form.venue,
        price: form.price ? Number(form.price) : 0,
        image_url: form.image_url || null,
        ticket_url: form.ticket_url || null,
        submitted_by: user.id,
      })
      toast.success('Event submitted for review!')
      navigate(`/events/${event.id}`)
    } catch (err) {
      toast.error('Failed to submit event. Please try again.')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="max-w-2xl mx-auto px-4 sm:px-6 py-8">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">Submit an Event</h1>
        <p className="text-gray-500 mt-1">Share your event with the Jeddah community</p>
      </div>

      <div className="card p-6">
        <form onSubmit={handleSubmit} className="space-y-5">
          {/* Title */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1">
              Event Title <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={form.title}
              onChange={e => update('title', e.target.value)}
              placeholder="e.g. Jeddah Jazz Night at Al Corniche"
              required
              className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
            />
          </div>

          {/* Description */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1">Description</label>
            <textarea
              value={form.description}
              onChange={e => update('description', e.target.value)}
              placeholder="Describe your event…"
              rows={4}
              className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 resize-none"
            />
          </div>

          {/* Category & Price */}
          <div className="grid sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1">
                Category <span className="text-red-500">*</span>
              </label>
              <select
                value={form.category}
                onChange={e => update('category', e.target.value)}
                required
                className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 bg-white"
              >
                <option value="">Select category</option>
                {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1">
                Price (SAR) — 0 for Free
              </label>
              <input
                type="number"
                min="0"
                value={form.price}
                onChange={e => update('price', e.target.value)}
                placeholder="0"
                className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
              />
            </div>
          </div>

          {/* Date & Time */}
          <div className="grid sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1">
                Date <span className="text-red-500">*</span>
              </label>
              <input
                type="date"
                value={form.date}
                onChange={e => update('date', e.target.value)}
                required
                className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1">Time</label>
              <input
                type="time"
                value={form.time}
                onChange={e => update('time', e.target.value)}
                className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
              />
            </div>
          </div>

          {/* Venue */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1">
              Venue <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={form.venue}
              onChange={e => update('venue', e.target.value)}
              placeholder="e.g. Al Corniche, Jeddah Historic Area"
              required
              className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
            />
          </div>

          {/* Image URL */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1">Event Image URL</label>
            <input
              type="url"
              value={form.image_url}
              onChange={e => update('image_url', e.target.value)}
              placeholder="https://example.com/image.jpg"
              className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
            />
            {form.image_url && (
              <div className="mt-2 h-32 rounded-xl overflow-hidden">
                <img src={form.image_url} alt="Preview" className="w-full h-full object-cover" onError={() => update('image_url', '')} />
              </div>
            )}
          </div>

          {/* Ticket URL */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1">Ticket URL</label>
            <input
              type="url"
              value={form.ticket_url}
              onChange={e => update('ticket_url', e.target.value)}
              placeholder="https://tickets.example.com"
              className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
            />
          </div>

          {/* Note */}
          <div className="bg-brand-50 rounded-xl p-4 text-sm text-brand-800">
            <span className="font-semibold">Note:</span> Your event will be reviewed by our team before being published.
          </div>

          <button
            type="submit"
            disabled={submitting}
            className="w-full btn-primary py-3 text-base disabled:opacity-50"
          >
            {submitting ? 'Submitting…' : 'Submit Event'}
          </button>
        </form>
      </div>
    </div>
  )
}
