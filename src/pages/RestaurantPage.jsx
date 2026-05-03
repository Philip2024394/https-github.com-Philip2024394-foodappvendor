import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'

const DEMO_RESTAURANT = {
  id: 'demo-1',
  name: 'Warung Bu Tini',
  cuisine_type: 'Javanese',
  cover_url: 'https://images.unsplash.com/photo-1504674900247-0877df9cc836?w=800&h=300&fit=crop',
  logo_url: null,
  rating: 4.8,
  is_open: true,
  slug: 'warung-bu-tini',
  delivery_radius_km: 5,
  delivery_fee: 0,
  whatsapp: '6281573635143',
  promo_text: 'Free delivery for orders above Rp 50,000!',
}

const DEMO_MENU = [
  { id: '1', name: 'Nasi Gudeg Komplit', price: 25000, category: 'Makanan', photo_url: 'https://images.unsplash.com/photo-1567620905732-2d1ec7ab7445?w=200', description: 'Gudeg, ayam, telur, sambal krecek', is_available: true },
  { id: '2', name: 'Nasi Ayam Goreng', price: 20000, category: 'Makanan', photo_url: 'https://images.unsplash.com/photo-1562967916-eb82221dfb92?w=200', description: 'Ayam goreng kremes + nasi + lalapan', is_available: true },
  { id: '3', name: 'Es Teh Manis', price: 5000, category: 'Minuman', photo_url: 'https://images.unsplash.com/photo-1556679343-c7306c1976bc?w=200', description: 'Teh manis dingin', is_available: true },
  { id: '4', name: 'Es Jeruk', price: 7000, category: 'Minuman', photo_url: 'https://images.unsplash.com/photo-1621263764928-df1444c5e859?w=200', description: 'Jeruk peras segar', is_available: true },
  { id: '5', name: 'Bakso Urat', price: 18000, category: 'Makanan', photo_url: 'https://images.unsplash.com/photo-1555126634-323283e090fa?w=200', description: 'Bakso urat jumbo + mie + tahu', is_available: true },
]

function formatRupiah(num) {
  return 'Rp ' + num.toLocaleString('id-ID')
}

export default function RestaurantPage({ slug }) {
  const [restaurant, setRestaurant] = useState(null)
  const [menuItems, setMenuItems] = useState([])
  const [cart, setCart] = useState([])
  const [loading, setLoading] = useState(true)
  const [showInstallPrompt, setShowInstallPrompt] = useState(false)
  const [deferredPrompt, setDeferredPrompt] = useState(null)

  useEffect(() => {
    async function fetchData() {
      if (supabase) {
        try {
          const { data: restData, error: restError } = await supabase
            .from('restaurants')
            .select('*')
            .eq('slug', slug)
            .single()

          if (!restError && restData) {
            setRestaurant(restData)

            const { data: menuData, error: menuError } = await supabase
              .from('menu_items')
              .select('*')
              .eq('restaurant_id', restData.id)
              .eq('is_available', true)
              .order('sort_order')

            if (!menuError && menuData?.length) {
              setMenuItems(menuData)
              setLoading(false)
              return
            }
          }
        } catch (e) {
          // fallback to demo
        }
      }
      setRestaurant(DEMO_RESTAURANT)
      setMenuItems(DEMO_MENU)
      setLoading(false)
    }
    fetchData()
  }, [slug])

  // PWA install prompt
  useEffect(() => {
    const handler = (e) => {
      e.preventDefault()
      setDeferredPrompt(e)
      setShowInstallPrompt(true)
    }
    window.addEventListener('beforeinstallprompt', handler)
    return () => window.removeEventListener('beforeinstallprompt', handler)
  }, [])

  const handleInstall = async () => {
    if (deferredPrompt) {
      deferredPrompt.prompt()
      await deferredPrompt.userChoice
      setDeferredPrompt(null)
      setShowInstallPrompt(false)
    }
  }

  const addToCart = (item) => {
    setCart((prev) => {
      const existing = prev.find((c) => c.id === item.id)
      if (existing) {
        return prev.map((c) => c.id === item.id ? { ...c, qty: c.qty + 1 } : c)
      }
      return [...prev, { ...item, qty: 1 }]
    })
  }

  const cartCount = cart.reduce((sum, c) => sum + c.qty, 0)
  const cartTotal = cart.reduce((sum, c) => sum + c.price * c.qty, 0)

  // Group menu by category
  const categories = [...new Set(menuItems.map((item) => item.category))]

  if (loading) {
    return (
      <div style={{ minHeight: '100vh', background: '#0a0a0a', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <p style={{ fontSize: '16px' }}>Loading...</p>
      </div>
    )
  }

  if (!restaurant) {
    return (
      <div style={{ minHeight: '100vh', background: '#0a0a0a', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <p style={{ fontSize: '16px' }}>Restaurant not found.</p>
      </div>
    )
  }

  return (
    <div style={{ minHeight: '100vh', background: '#0a0a0a', color: '#fff', fontFamily: 'system-ui, -apple-system, sans-serif', paddingBottom: cartCount > 0 ? '100px' : '0' }}>
      {/* Promo Banner */}
      {restaurant.promo_text && (
        <div style={{ background: 'linear-gradient(90deg, #8DC63F, #6ba32e)', padding: '10px 16px', textAlign: 'center', fontSize: '14px', fontWeight: '600', color: '#000' }}>
          {restaurant.promo_text}
        </div>
      )}

      {/* PWA Install Prompt */}
      {showInstallPrompt && (
        <div style={{ background: '#1a1a1a', padding: '12px 16px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '1px solid #333' }}>
          <span style={{ fontSize: '14px' }}>Add to Home Screen for quick access</span>
          <button onClick={handleInstall} style={{ background: '#8DC63F', color: '#000', border: 'none', padding: '8px 16px', borderRadius: '8px', fontWeight: '600', fontSize: '14px', cursor: 'pointer' }}>
            Install
          </button>
        </div>
      )}

      {/* Header */}
      <header style={{ position: 'relative' }}>
        <img
          src={restaurant.cover_url}
          alt={restaurant.name}
          style={{ width: '100%', height: '220px', objectFit: 'cover' }}
        />
        <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, background: 'linear-gradient(transparent, rgba(0,0,0,0.9))', padding: '40px 24px 20px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            {restaurant.logo_url && (
              <img src={restaurant.logo_url} alt="" style={{ width: '48px', height: '48px', borderRadius: '12px', objectFit: 'cover' }} />
            )}
            <div>
              <h1 style={{ fontSize: '24px', fontWeight: '800', marginBottom: '4px' }}>{restaurant.name}</h1>
              <p style={{ fontSize: '14px', color: '#aaa' }}>{restaurant.cuisine_type}</p>
            </div>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginTop: '12px' }}>
            <span style={{ color: '#FACC15', fontSize: '14px' }}>{'★'.repeat(Math.floor(restaurant.rating))} {restaurant.rating}</span>
            <span style={{
              padding: '4px 10px',
              borderRadius: '8px',
              fontSize: '12px',
              fontWeight: '700',
              background: restaurant.is_open ? '#8DC63F' : '#ef4444',
              color: restaurant.is_open ? '#000' : '#fff',
            }}>
              {restaurant.is_open ? 'Open' : 'Closed'}
            </span>
          </div>
        </div>
      </header>

      {/* Delivery Info */}
      {restaurant.delivery_radius_km && (
        <div style={{ padding: '16px 24px', borderBottom: '1px solid #222', fontSize: '14px', color: '#aaa' }}>
          Free delivery within {restaurant.delivery_radius_km} km
          {restaurant.delivery_fee > 0 && ` | Delivery fee: ${formatRupiah(restaurant.delivery_fee)}`}
        </div>
      )}

      {/* Menu Sections */}
      <main style={{ padding: '24px', maxWidth: '800px', margin: '0 auto' }}>
        {categories.map((category) => (
          <section key={category} style={{ marginBottom: '32px' }}>
            <h2 style={{ fontSize: '20px', fontWeight: '700', marginBottom: '16px', color: '#8DC63F' }}>{category}</h2>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {menuItems.filter((item) => item.category === category).map((item) => (
                <div key={item.id} style={{
                  display: 'flex',
                  gap: '12px',
                  background: 'rgba(0,0,0,0.8)',
                  borderRadius: '16px',
                  border: '1px solid #222',
                  padding: '12px',
                  alignItems: 'center',
                }}>
                  <img
                    src={item.photo_url}
                    alt={item.name}
                    style={{ width: '80px', height: '80px', borderRadius: '12px', objectFit: 'cover', flexShrink: 0 }}
                  />
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <h3 style={{ fontSize: '16px', fontWeight: '600', marginBottom: '4px' }}>{item.name}</h3>
                    <p style={{ fontSize: '14px', color: '#aaa', marginBottom: '6px' }}>{item.description}</p>
                    <p style={{ fontSize: '16px', fontWeight: '700', color: '#FACC15' }}>{formatRupiah(item.price)}</p>
                  </div>
                  <button
                    onClick={() => addToCart(item)}
                    style={{
                      background: '#8DC63F',
                      color: '#000',
                      border: 'none',
                      width: '36px',
                      height: '36px',
                      borderRadius: '50%',
                      fontSize: '20px',
                      fontWeight: '700',
                      cursor: 'pointer',
                      flexShrink: 0,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  >
                    +
                  </button>
                </div>
              ))}
            </div>
          </section>
        ))}
      </main>

      {/* WhatsApp Button */}
      {restaurant.whatsapp && (
        <a
          href={`https://wa.me/${restaurant.whatsapp}`}
          target="_blank"
          rel="noopener noreferrer"
          style={{
            position: 'fixed',
            bottom: cartCount > 0 ? '110px' : '24px',
            right: '24px',
            width: '56px',
            height: '56px',
            borderRadius: '50%',
            background: '#25D366',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: '0 4px 12px rgba(0,0,0,0.3)',
            zIndex: 50,
            textDecoration: 'none',
            fontSize: '28px',
          }}
          title="Chat via WhatsApp"
        >
          <svg width="28" height="28" viewBox="0 0 24 24" fill="#fff">
            <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
          </svg>
        </a>
      )}

      {/* Sticky Cart */}
      {cartCount > 0 && (
        <div style={{
          position: 'fixed',
          bottom: 0,
          left: 0,
          right: 0,
          background: 'linear-gradient(135deg, #1a3a0a, #2a5a14)',
          padding: '16px 24px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          borderTop: '1px solid #8DC63F',
          zIndex: 100,
        }}>
          <div>
            <p style={{ fontSize: '14px', color: '#aaa' }}>{cartCount} item{cartCount > 1 ? 's' : ''}</p>
            <p style={{ fontSize: '18px', fontWeight: '700', color: '#fff' }}>{formatRupiah(cartTotal)}</p>
          </div>
          <button style={{
            background: '#8DC63F',
            color: '#000',
            border: 'none',
            padding: '12px 24px',
            borderRadius: '12px',
            fontSize: '16px',
            fontWeight: '700',
            cursor: 'pointer',
          }}>
            Place Order
          </button>
        </div>
      )}
    </div>
  )
}
