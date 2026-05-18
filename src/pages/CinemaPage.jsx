import { useState } from 'react'
import Modal from '../components/Modal'

const JEDDAH_CINEMAS = [
  { name: 'VOX Cinemas — Red Sea Mall', address: 'King Abdulaziz Rd, Jeddah', phone: '920001234', emoji: '🎬' },
  { name: 'AMC Cinemas — Al Andalus Mall', address: 'Al Andalus Mall, Jeddah', phone: '920003003', emoji: '🎥' },
  { name: 'Muvi Cinemas — Jeddah Park', address: 'Jeddah Park Mall, Jeddah', phone: '920005555', emoji: '🎞' },
  { name: 'Cinépolis — Mall of Arabia', address: 'Al Haramain Rd, Jeddah', phone: '920009999', emoji: '🍿' },
]

const NOW_PLAYING = [
  { id: 1, title: 'Avengers: Doomsday', genre: 'Action / Superhero', rating: 8.3, duration: '149 min', poster: 'https://images.unsplash.com/photo-1635805737707-575885ab0820?w=300&h=450&fit=crop', synopsis: 'The Avengers face their most dangerous threat yet as Doctor Doom wages war across the multiverse.' },
  { id: 2, title: 'Mission: Impossible – The Final Reckoning', genre: 'Action / Thriller', rating: 8.1, duration: '169 min', poster: 'https://images.unsplash.com/photo-1536440136628-849c177e76a1?w=300&h=450&fit=crop', synopsis: 'Ethan Hunt races to stop a rogue AI before it rewrites the world — in what may be his final mission.' },
  { id: 3, title: 'Sinners', genre: 'Horror / Drama', rating: 7.9, duration: '137 min', poster: 'https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?w=300&h=450&fit=crop', synopsis: 'Twin brothers returning home to start a new life find themselves fighting an even greater evil.' },
  { id: 4, title: 'Lilo & Stitch', genre: 'Family / Adventure', rating: 7.6, duration: '108 min', poster: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=300&h=450&fit=crop', synopsis: 'A young girl in Hawaii forms an unlikely bond with a mischievous alien creature who becomes her best friend.' },
  { id: 5, title: 'A Minecraft Movie', genre: 'Animation / Comedy', rating: 6.9, duration: '101 min', poster: 'https://images.unsplash.com/photo-1594908900066-3f47337549d8?w=300&h=450&fit=crop', synopsis: 'Four misfit heroes are transported into the Overworld and must survive the blocky, dangerous biomes to return home.' },
  { id: 6, title: 'Superman', genre: 'Action / Superhero', rating: 7.5, duration: '130 min', poster: 'https://images.unsplash.com/photo-1478720568477-152d9b164e26?w=300&h=450&fit=crop', synopsis: 'A fresh take on the Last Son of Krypton — Clark Kent navigates his identity as both journalist and hero.' },
]

const UPCOMING = [
  { id: 7, title: 'The Fantastic Four: First Steps', genre: 'Action / Superhero', rating: null, duration: 'TBA', poster: 'https://images.unsplash.com/photo-1446776653964-20c1d3a81b06?w=300&h=450&fit=crop', synopsis: 'Marvel\'s First Family debuts in a retro-futuristic world threatened by the planet-eating Galactus.' },
  { id: 8, title: 'Jurassic World Rebirth', genre: 'Action / Adventure', rating: null, duration: 'TBA', poster: 'https://images.unsplash.com/photo-1504711434969-e33886168f5c?w=300&h=450&fit=crop', synopsis: 'A covert team ventures into a tropical island to extract DNA from the three most powerful dinosaurs.' },
  { id: 9, title: 'Wicked: For Good', genre: 'Musical / Fantasy', rating: null, duration: 'TBA', poster: 'https://images.unsplash.com/photo-1518834107812-67b0b7c58434?w=300&h=450&fit=crop', synopsis: 'The thrilling conclusion of the untold story of the Witches of Oz — Elphaba and Glinda\'s final chapter.' },
  { id: 10, title: 'F1', genre: 'Action / Drama', rating: null, duration: '143 min', poster: 'https://images.unsplash.com/photo-1552832230-c0197dd311b5?w=300&h=450&fit=crop', synopsis: 'A veteran driver comes out of retirement to mentor a young prodigy in the high-octane world of Formula 1.' },
  { id: 11, title: 'How to Train Your Dragon', genre: 'Animation / Adventure', rating: null, duration: '120 min', poster: 'https://images.unsplash.com/photo-1519681393784-d120267933ba?w=300&h=450&fit=crop', synopsis: 'A live-action retelling of the beloved story of Hiccup and Toothless — a Viking and his dragon.' },
  { id: 12, title: 'Zootopia 2', genre: 'Animation / Comedy', rating: null, duration: 'TBA', poster: 'https://images.unsplash.com/photo-1440404653325-ab127d49abc1?w=300&h=450&fit=crop', synopsis: 'Judy Hopps and Nick Wilde return for a brand-new adventure in the sprawling city of Zootopia.' },
]

function StarDisplay({ rating }) {
  if (!rating) return <span className="text-xs text-gray-400 italic">Coming soon</span>
  const stars = Math.round(rating / 2)
  return (
    <div className="flex items-center gap-1">
      {[1, 2, 3, 4, 5].map(s => (
        <span key={s} className={`text-sm ${s <= stars ? 'text-yellow-400' : 'text-gray-300'}`}>★</span>
      ))}
      <span className="text-xs text-gray-500 ml-1">{rating.toFixed(1)}</span>
    </div>
  )
}

export default function CinemaPage() {
  const [activeTab, setActiveTab] = useState('now')
  const [selectedMovie, setSelectedMovie] = useState(null)

  const movies = activeTab === 'now' ? NOW_PLAYING : UPCOMING

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900 mb-1">Cinema in Jeddah</h1>
        <p className="text-gray-500">What's showing now and coming soon</p>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-gray-100 rounded-xl p-1 mb-8 w-fit">
        {[
          { key: 'now', label: '🎬 Now Playing' },
          { key: 'upcoming', label: '🗓 Upcoming' },
        ].map(tab => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={`px-5 py-2.5 rounded-lg text-sm font-medium transition-all ${
              activeTab === tab.key
                ? 'bg-white text-gray-900 shadow-sm'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Movie grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4 mb-12">
        {movies.map(movie => (
          <div
            key={movie.id}
            onClick={() => setSelectedMovie(movie)}
            className="card cursor-pointer group hover:shadow-md transition-all hover:-translate-y-0.5 duration-200"
          >
            <div className="relative h-72 overflow-hidden bg-gray-200">
              <img
                src={movie.poster}
                alt={movie.title}
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
              />
            </div>
            <div className="p-3">
              <h3 className="font-semibold text-xs text-gray-900 line-clamp-2 mb-1">{movie.title}</h3>
              <p className="text-xs text-gray-400 mb-1">{movie.genre}</p>
              <StarDisplay rating={movie.rating} />
            </div>
          </div>
        ))}
      </div>

      {/* Cinemas near you */}
      <section>
        <h2 className="text-xl font-bold text-gray-900 mb-4">Cinemas Near You</h2>
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {JEDDAH_CINEMAS.map(cinema => (
            <div key={cinema.name} className="card p-4">
              <div className="text-2xl mb-2">{cinema.emoji}</div>
              <h3 className="font-semibold text-gray-900 text-sm">{cinema.name}</h3>
              <p className="text-xs text-gray-500 mt-1">📍 {cinema.address}</p>
              <p className="text-xs text-gray-500">📞 {cinema.phone}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Movie detail modal */}
      <Modal
        isOpen={!!selectedMovie}
        onClose={() => setSelectedMovie(null)}
        title={selectedMovie?.title || ''}
        maxWidth="max-w-2xl"
      >
        {selectedMovie && (
          <div className="flex gap-5">
            <img
              src={selectedMovie.poster}
              alt={selectedMovie.title}
              className="w-28 h-42 object-cover rounded-lg shrink-0"
            />
            <div className="flex-1">
              <div className="flex flex-wrap gap-2 mb-3">
                {selectedMovie.genre.split(' / ').map(g => (
                  <span key={g} className="badge bg-purple-100 text-purple-800">{g}</span>
                ))}
              </div>
              <StarDisplay rating={selectedMovie.rating} />
              <p className="text-sm text-gray-500 mt-1">⏱ {selectedMovie.duration}</p>
              <p className="text-sm text-gray-700 mt-3 leading-relaxed">{selectedMovie.synopsis}</p>
            </div>
          </div>
        )}
      </Modal>
    </div>
  )
}
