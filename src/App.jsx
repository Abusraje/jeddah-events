import { HashRouter, Routes, Route, Link } from 'react-router-dom'
import { Toaster } from 'react-hot-toast'
import { AuthProvider } from './context/AuthContext'
import Navbar from './components/Navbar'
import ProtectedRoute from './components/ProtectedRoute'

import HomePage from './pages/HomePage'
import EventsPage from './pages/EventsPage'
import EventDetailPage from './pages/EventDetailPage'
import CafeFinderPage from './pages/CafeFinderPage'
import CafeDetailPage from './pages/CafeDetailPage'
import CinemaPage from './pages/CinemaPage'
import SocialPage from './pages/SocialPage'
import SocialFeedPage from './pages/SocialFeedPage'
import NotificationsPage from './pages/NotificationsPage'
import ProfilePage from './pages/ProfilePage'
import SubmitEventPage from './pages/SubmitEventPage'
import LoginPage from './pages/LoginPage'
import RegisterPage from './pages/RegisterPage'

function Layout({ children }) {
  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      <main className="flex-1">
        {children}
      </main>
      <footer className="bg-brand-900 text-white py-8 mt-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid sm:grid-cols-3 gap-8">
            <div>
              <div className="flex items-center gap-2 mb-3">
                <div className="w-8 h-8 rounded-lg bg-brand-500 flex items-center justify-center font-bold text-sm">J</div>
                <span className="font-bold">JeddahEvents</span>
              </div>
              <p className="text-white/60 text-sm">Discover the best of Jeddah — events, cafes, cinema and more.</p>
            </div>
            <div>
              <h4 className="font-semibold mb-3 text-sm">Explore</h4>
              <div className="space-y-1.5 text-sm text-white/60">
                <Link to="/events" className="block hover:text-white transition-colors">Events</Link>
                <Link to="/cafes" className="block hover:text-white transition-colors">Cafes</Link>
                <Link to="/cinema" className="block hover:text-white transition-colors">Cinema</Link>
                <Link to="/social" className="block hover:text-white transition-colors">Social</Link>
              </div>
            </div>
            <div>
              <h4 className="font-semibold mb-3 text-sm">Account</h4>
              <div className="space-y-1.5 text-sm text-white/60">
                <Link to="/login" className="block hover:text-white transition-colors">Sign In</Link>
                <Link to="/register" className="block hover:text-white transition-colors">Register</Link>
                <Link to="/submit" className="block hover:text-white transition-colors">Submit Event</Link>
              </div>
            </div>
          </div>
          <div className="border-t border-white/10 mt-8 pt-6 text-center text-white/40 text-sm">
            © {new Date().getFullYear()} JeddahEvents. Built with ❤️ for the Jeddah community.
          </div>
        </div>
      </footer>
    </div>
  )
}

function AuthLayout({ children }) {
  return <div className="min-h-screen">{children}</div>
}

export default function App() {
  return (
    <AuthProvider>
      <HashRouter>
        <Toaster
          position="top-right"
          toastOptions={{
            duration: 3000,
            style: {
              borderRadius: '12px',
              fontFamily: 'Inter, sans-serif',
              fontSize: '14px',
            },
            success: { style: { background: '#f0fdf4', color: '#166534', border: '1px solid #bbf7d0' } },
            error: { style: { background: '#fef2f2', color: '#991b1b', border: '1px solid #fecaca' } },
          }}
        />
        <Routes>
          {/* Auth pages — no navbar */}
          <Route path="/login" element={<AuthLayout><LoginPage /></AuthLayout>} />
          <Route path="/register" element={<AuthLayout><RegisterPage /></AuthLayout>} />

          {/* Main app with navbar */}
          <Route path="/" element={<Layout><HomePage /></Layout>} />
          <Route path="/events" element={<Layout><EventsPage /></Layout>} />
          <Route path="/events/:id" element={<Layout><EventDetailPage /></Layout>} />
          <Route path="/cafes" element={<Layout><CafeFinderPage /></Layout>} />
          <Route path="/cafes/:id" element={<Layout><CafeDetailPage /></Layout>} />
          <Route path="/cinema" element={<Layout><CinemaPage /></Layout>} />
          <Route path="/social" element={<Layout><SocialPage /></Layout>} />
          <Route path="/social/feed" element={<Layout><SocialFeedPage /></Layout>} />
          <Route path="/notifications" element={<Layout><NotificationsPage /></Layout>} />
          <Route path="/profile/:id" element={<Layout><ProfilePage /></Layout>} />
          <Route
            path="/submit"
            element={
              <Layout>
                <ProtectedRoute>
                  <SubmitEventPage />
                </ProtectedRoute>
              </Layout>
            }
          />
          {/* 404 */}
          <Route
            path="*"
            element={
              <Layout>
                <div className="min-h-[60vh] flex flex-col items-center justify-center text-center px-4">
                  <div className="text-7xl mb-4">🌊</div>
                  <h1 className="text-4xl font-bold text-gray-900 mb-2">404</h1>
                  <p className="text-gray-500 mb-6">This page doesn't exist</p>
                  <Link to="/" className="btn-primary">Back to Home</Link>
                </div>
              </Layout>
            }
          />
        </Routes>
      </HashRouter>
    </AuthProvider>
  )
}
