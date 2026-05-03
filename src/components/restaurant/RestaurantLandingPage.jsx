/**
 * RestaurantLandingPage — Beautiful welcome page for individual restaurants.
 * Indonesian wood-themed design. Shows before the menu.
 */

const WOOD_BG = 'https://ik.imagekit.io/nepgaxllc/ChatGPT%20Image%20May%203,%202026,%2009_03_46%20AM.png'
const RICE_TERRACE = 'https://images.unsplash.com/photo-1555400038-63f5ba517a47?w=800&h=400&fit=crop'

function fmtRp(n) { return 'Rp ' + (n ?? 0).toLocaleString('id-ID').replace(/,/g, '.') }

export default function RestaurantLandingPage({ restaurant, onViewMenu, onBack }) {
  const r = restaurant || {}
  const menuItems = r.menu_items || []
  const specialties = menuItems.filter(i => i.photo_url).slice(0, 4)

  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 130, background: '#1a0e04', overflowY: 'auto', fontFamily: 'inherit' }}>

      {/* ═══ HERO SECTION ═══ */}
      <section style={{ position: 'relative', minHeight: '70vh', display: 'flex', flexDirection: 'column', justifyContent: 'flex-end', padding: '0 24px 40px' }}>
        {/* Background */}
        <img src={r.cover_url || r.hero_dish_url || WOOD_BG} alt="" style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover', zIndex: 0 }} />
        <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to top, rgba(26,14,4,0.95) 0%, rgba(26,14,4,0.6) 40%, rgba(26,14,4,0.3) 70%, rgba(26,14,4,0.1) 100%)', zIndex: 1 }} />

        {/* Back button */}
        <button onClick={onBack} style={{
          position: 'absolute', top: 'calc(env(safe-area-inset-top, 0px) + 16px)', left: 16, zIndex: 10,
          width: 40, height: 40, borderRadius: '50%',
          background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(8px)',
          border: '1px solid rgba(255,255,255,0.15)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer',
        }}>
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.5" strokeLinecap="round"><path d="M19 12H5M12 5l-7 7 7 7"/></svg>
        </button>

        {/* Profile icon */}
        <div style={{ position: 'absolute', top: 'calc(env(safe-area-inset-top, 0px) + 16px)', right: 16, zIndex: 10, width: 40, height: 40, borderRadius: '50%', background: 'rgba(0,0,0,0.5)', border: '1px solid rgba(255,255,255,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.6)" strokeWidth="2"><path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
        </div>

        {/* Content */}
        <div style={{ position: 'relative', zIndex: 2 }}>
          <p style={{ fontSize: 14, color: 'rgba(210,180,140,0.7)', fontWeight: 600, marginBottom: 4, letterSpacing: '1px' }}>Welcome to</p>
          <h1 style={{ fontSize: 42, fontWeight: 900, color: '#f5e6d0', margin: '0 0 12px', lineHeight: 1.05, fontFamily: '"Georgia", serif' }}>
            {r.name || 'Our Restaurant'}
          </h1>
          <div style={{ width: 60, height: 2, background: 'rgba(210,180,140,0.4)', marginBottom: 14 }} />
          <p style={{ fontSize: 15, color: 'rgba(210,180,140,0.6)', margin: '0 0 24px', maxWidth: 280, lineHeight: 1.5 }}>
            {r.description || 'Where authentic flavors meet the beauty of nature.'}
          </p>

          {/* Rating + Status */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 20 }}>
            {r.rating && (
              <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                <span style={{ color: '#FACC15', fontSize: 16 }}>★</span>
                <span style={{ fontSize: 15, fontWeight: 800, color: '#f5e6d0' }}>{r.rating}</span>
              </div>
            )}
            <span style={{ padding: '4px 12px', borderRadius: 8, fontSize: 12, fontWeight: 700, background: r.is_open !== false ? 'rgba(141,198,63,0.2)' : 'rgba(239,68,68,0.2)', color: r.is_open !== false ? '#8DC63F' : '#EF4444' }}>
              {r.is_open !== false ? 'Open Now' : 'Closed'}
            </span>
            {r.cuisine_type && <span style={{ fontSize: 13, color: 'rgba(210,180,140,0.5)' }}>{r.cuisine_type}</span>}
          </div>

          {/* View Menu Button */}
          <button onClick={onViewMenu} style={{
            padding: '14px 32px', borderRadius: 12, border: '1.5px solid rgba(210,180,140,0.4)',
            background: 'rgba(26,14,4,0.6)', backdropFilter: 'blur(8px)',
            color: '#f5e6d0', fontSize: 16, fontWeight: 800, cursor: 'pointer',
            fontFamily: '"Georgia", serif', letterSpacing: '1px',
          }}>
            View Menu
          </button>
        </div>
      </section>

      {/* ═══ INSPIRED BY NATURE ═══ */}
      <section style={{ position: 'relative', minHeight: 300, display: 'flex', alignItems: 'center', padding: '40px 24px' }}>
        <img src={RICE_TERRACE} alt="" style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover', zIndex: 0 }} />
        <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(135deg, rgba(26,14,4,0.85) 0%, rgba(26,14,4,0.5) 100%)', zIndex: 1 }} />
        <div style={{ position: 'relative', zIndex: 2, maxWidth: 300 }}>
          <h2 style={{ fontSize: 32, fontWeight: 900, color: '#f5e6d0', margin: '0 0 12px', lineHeight: 1.1, fontFamily: '"Georgia", serif' }}>
            Inspired by Nature
          </h2>
          <p style={{ fontSize: 14, color: 'rgba(210,180,140,0.7)', lineHeight: 1.7, margin: '0 0 20px' }}>
            Enjoy crafted dishes made with fresh ingredients, inspired by the richness of Indonesia.
          </p>
          <button onClick={onViewMenu} style={{
            padding: '10px 24px', borderRadius: 10, border: '1.5px solid rgba(210,180,140,0.4)',
            background: 'rgba(26,14,4,0.5)', color: '#f5e6d0', fontSize: 14, fontWeight: 700,
            cursor: 'pointer', fontFamily: '"Georgia", serif',
          }}>
            Explore Our Story
          </button>
        </div>
      </section>

      {/* ═══ OUR SPECIALTIES ═══ */}
      {specialties.length > 0 && (
        <section style={{ padding: '40px 24px', background: '#1a0e04' }}>
          <div style={{ textAlign: 'center', marginBottom: 24 }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
              <span style={{ fontSize: 14, color: 'rgba(210,180,140,0.4)' }}>✿</span>
              <h2 style={{ fontSize: 22, fontWeight: 900, color: '#f5e6d0', margin: 0, fontFamily: '"Georgia", serif' }}>Our Specialties</h2>
              <span style={{ fontSize: 14, color: 'rgba(210,180,140,0.4)' }}>✿</span>
            </div>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12 }}>
            {specialties.map((item, i) => (
              <div key={i} onClick={onViewMenu} style={{ textAlign: 'center', cursor: 'pointer' }}>
                <div style={{ width: '100%', paddingTop: '100%', borderRadius: '50%', overflow: 'hidden', position: 'relative', border: '2px solid rgba(210,180,140,0.2)', marginBottom: 8 }}>
                  <img src={item.photo_url} alt={item.name} style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover' }} />
                </div>
                <p style={{ fontSize: 13, fontWeight: 800, color: '#f5e6d0', margin: '0 0 2px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{item.name}</p>
                <p style={{ fontSize: 11, color: 'rgba(210,180,140,0.5)', margin: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{item.description || fmtRp(item.price)}</p>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* ═══ RESERVE / CONTACT ═══ */}
      <section style={{ position: 'relative', minHeight: 280, display: 'flex', alignItems: 'center', justifyContent: 'flex-end', padding: '40px 24px' }}>
        <img src={r.cover_url || 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=800&h=400&fit=crop'} alt="" style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover', zIndex: 0 }} />
        <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(90deg, rgba(26,14,4,0.3) 0%, rgba(26,14,4,0.9) 50%)', zIndex: 1 }} />

        <div style={{ position: 'relative', zIndex: 2, width: '55%' }}>
          <h2 style={{ fontSize: 24, fontWeight: 900, color: '#f5e6d0', margin: '0 0 16px', fontFamily: '"Georgia", serif' }}>Order Now</h2>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 16 }}>
            {r.opening_hours && (
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <span style={{ fontSize: 14, color: 'rgba(210,180,140,0.5)' }}>🕐</span>
                <span style={{ fontSize: 14, color: 'rgba(210,180,140,0.7)' }}>{r.opening_hours}</span>
              </div>
            )}
            {r.address && (
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <span style={{ fontSize: 14, color: 'rgba(210,180,140,0.5)' }}>📍</span>
                <span style={{ fontSize: 13, color: 'rgba(210,180,140,0.7)', lineHeight: 1.4 }}>{r.address}</span>
              </div>
            )}
            {r.phone && (
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <span style={{ fontSize: 14, color: 'rgba(210,180,140,0.5)' }}>📱</span>
                <span style={{ fontSize: 14, color: 'rgba(210,180,140,0.7)' }}>{r.phone}</span>
              </div>
            )}
          </div>

          <button onClick={onViewMenu} style={{
            width: '100%', padding: '14px', borderRadius: 10, border: 'none',
            background: 'rgba(210,180,140,0.15)', border: '1.5px solid rgba(210,180,140,0.3)',
            color: '#f5e6d0', fontSize: 16, fontWeight: 800, cursor: 'pointer',
            fontFamily: '"Georgia", serif',
          }}>
            View Full Menu
          </button>
        </div>
      </section>

      {/* Footer */}
      <div style={{ padding: '24px', textAlign: 'center', background: '#1a0e04', borderTop: '1px solid rgba(210,180,140,0.1)' }}>
        <p style={{ fontSize: 12, color: 'rgba(210,180,140,0.3)', margin: 0 }}>Powered by INDOO</p>
      </div>
    </div>
  )
}
