import { useState, useEffect } from 'react'
import DirectoryPage from './pages/DirectoryPage'
import RestaurantPage from './pages/RestaurantPage'

export default function App() {
  const [restaurantSlug, setRestaurantSlug] = useState(null)

  useEffect(() => {
    // Check if we're on a subdomain
    const hostname = window.location.hostname
    const parts = hostname.split('.')
    // If subdomain exists (e.g., warung-bu-tini.indoo.id -> parts = ['warung-bu-tini', 'indoo', 'id'])
    // In development: check for ?restaurant=slug query param as fallback
    if (parts.length > 2 && parts[0] !== 'www') {
      setRestaurantSlug(parts[0])
    } else {
      // Development fallback: use query param
      const params = new URLSearchParams(window.location.search)
      const slug = params.get('restaurant')
      if (slug) setRestaurantSlug(slug)
    }
  }, [])

  if (restaurantSlug) {
    return <RestaurantPage slug={restaurantSlug} />
  }

  return <DirectoryPage onSelectRestaurant={(slug) => {
    // In production: redirect to subdomain
    // In development: use query param
    if (window.location.hostname.includes('indoo.id')) {
      window.location.href = `https://${slug}.indoo.id`
    } else {
      window.location.search = `?restaurant=${slug}`
    }
  }} />
}
