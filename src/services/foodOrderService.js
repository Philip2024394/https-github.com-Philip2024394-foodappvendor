/**
 * foodOrderService.js
 *
 * Restaurant ordering — self-delivery model.
 * No platform drivers. Restaurant delivers with their own staff.
 *
 * Payment flow:
 *   1. Order created (order_received) → customer picks payment method
 *   2. If bank transfer: customer uploads proof screenshot → payment_sent
 *   3. Restaurant confirms → preparing
 *   4. Restaurant's driver delivers → on_the_way
 *   5. Delivered → done
 *   OR: Cash on delivery → skips payment proof step
 *
 * No commission taken. Restaurants pay flat monthly subscription.
 * No money held or processed on-platform.
 */
import { supabase } from '@/lib/supabase'

// ── Order status pipeline ─────────────────────────────────────────────────────
export const ORDER_STATUSES = [
  { key: 'order_received',  label: 'Order Received',      icon: '📋', color: '#F59E0B' },
  { key: 'payment_sent',    label: 'Payment Sent',        icon: '🧾', color: '#F59E0B' },
  { key: 'preparing',       label: 'Preparing Your Food', icon: '🍳', color: '#E8458C' },
  { key: 'on_the_way',      label: 'On The Way',          icon: '🛵', color: '#8DC63F' },
  { key: 'delivered',        label: 'Delivered!',          icon: '✅', color: '#8DC63F' },
]

export function getStatusIndex(status) {
  return ORDER_STATUSES.findIndex(s => s.key === status)
}

/** True while the order is awaiting payment confirmation */
export function isAwaitingPayment(status) {
  return status === 'order_received' || status === 'payment_sent'
}

// ── Spam / abuse guards ───────────────────────────────────────────────────────

const ACTIVE_STATUSES = ['preparing', 'on_the_way']
const CANCEL_COOLDOWN_MS = 30 * 60 * 1000 // 30 min after a cancellation

/**
 * Returns a human-readable reason string if the sender should be blocked,
 * or null if they're clear to order.
 */
export async function checkOrderEligibility(senderId) {
  if (!supabase || !senderId) return null

  const since = new Date(Date.now() - CANCEL_COOLDOWN_MS).toISOString()

  const { data: recent } = await supabase
    .from('food_orders')
    .select('id, status, updated_at')
    .eq('sender_id', senderId)
    .in('status', [...ACTIVE_STATUSES, 'cancelled'])
    .gte('created_at', since)
    .order('created_at', { ascending: false })
    .limit(10)

  if (!recent?.length) return null

  // Block if any order is still active
  const active = recent.find(o => ACTIVE_STATUSES.includes(o.status))
  if (active) return 'You already have an order in progress. Wait for it to be delivered before placing a new one.'

  // Block if last cancellation was within the cooldown window
  const lastCancel = recent.find(o => o.status === 'cancelled')
  if (lastCancel) {
    const elapsed = Date.now() - new Date(lastCancel.updated_at).getTime()
    if (elapsed < CANCEL_COOLDOWN_MS) {
      const minsLeft = Math.ceil((CANCEL_COOLDOWN_MS - elapsed) / 60000)
      return `Please wait ${minsLeft} minute${minsLeft !== 1 ? 's' : ''} before placing another order.`
    }
  }

  return null
}

// ── Order creation ────────────────────────────────────────────────────────────

/**
 * Create a food order.
 * No platform drivers involved — restaurant handles delivery.
 * Delivery fee is set by restaurant's zone configuration.
 */
export async function createFoodOrder({
  restaurant,
  items,
  sender,
  deliveryFee = 0,
  deliveryZone = null,
  paymentMethod = 'cash', // 'cash' or 'transfer'
  customerAddress = '',
  customerPhone = '',
  comment,
}) {
  // ── Spam guard ──
  const blocked = await checkOrderEligibility(sender?.id)
  if (blocked) throw new Error(blocked)

  const subtotal = items.reduce((s, i) => s + i.price * i.qty, 0)
  const extrasTotal = items.reduce((s, i) => s + (i.extras_total || 0) * i.qty, 0)
  const total = subtotal + extrasTotal + deliveryFee

  // Short human-readable order reference
  const orderRef = `FD-${Date.now().toString(36).toUpperCase().slice(-6)}`

  const order = {
    restaurant_id: restaurant.id,
    restaurant_name: restaurant.name,
    restaurant_lat: restaurant.lat ?? null,
    restaurant_lng: restaurant.lng ?? null,
    sender_id: sender?.id ?? null,
    customer_name: sender?.displayName ?? sender?.display_name ?? sender?.name ?? null,
    customer_phone: customerPhone || sender?.phone ?? null,
    customer_address: customerAddress || null,
    items: items.map(i => ({
      id: i.id,
      name: i.name,
      qty: i.qty,
      price: i.price,
      extras: i.extras || [],
      extras_total: i.extras_total || 0,
      notes: i.notes || null,
    })),
    subtotal,
    extras_total: extrasTotal,
    delivery_fee: deliveryFee,
    delivery_zone: deliveryZone,
    total,
    payment_method: paymentMethod,
    comment: comment?.trim() || null,
    order_ref: orderRef,
    status: 'order_received',
    created_at: new Date().toISOString(),
  }

  if (supabase) {
    try {
      const { data, error } = await supabase
        .from('food_orders')
        .insert(order)
        .select()
        .single()
      if (!error && data) return data
    } catch {}
  }

  // Local fallback
  return { ...order, id: `local-${Date.now()}` }
}

// ── Realtime subscriptions ────────────────────────────────────────────────────

/** Customer: subscribe to status updates for their order. */
export function subscribeToFoodOrder(orderId, onUpdate) {
  if (!supabase || String(orderId).startsWith('local-')) return () => {}
  const ch = supabase
    .channel(`food-order-${orderId}`)
    .on('postgres_changes', {
      event: 'UPDATE', schema: 'public', table: 'food_orders',
      filter: `id=eq.${orderId}`,
    }, p => onUpdate(p.new))
    .subscribe()
  return () => supabase.removeChannel(ch)
}

/** Restaurant: subscribe to new incoming orders. */
export function subscribeToRestaurantOrders(restaurantId, onNew) {
  if (!supabase) return () => {}
  const ch = supabase
    .channel(`restaurant-orders-${restaurantId}`)
    .on('postgres_changes', {
      event: 'INSERT', schema: 'public', table: 'food_orders',
      filter: `restaurant_id=eq.${restaurantId}`,
    }, p => onNew(p.new))
    .subscribe()
  return () => supabase.removeChannel(ch)
}

// ── Payment proof ────────────────────────────────────────────────────────────

/**
 * Customer uploads transfer screenshot as payment proof.
 * Uploads to Supabase storage bucket 'payment-proofs'.
 * Updates order status to 'payment_sent'.
 */
export async function submitPaymentProof(orderId, imageFile) {
  let screenshotUrl = null

  if (supabase && imageFile) {
    const ext = imageFile.name.split('.').pop()
    const path = `${orderId}/${Date.now()}.${ext}`
    const { error: upErr } = await supabase.storage
      .from('payment-proofs')
      .upload(path, imageFile, { upsert: true })
    if (!upErr) {
      const { data } = supabase.storage.from('payment-proofs').getPublicUrl(path)
      screenshotUrl = data?.publicUrl ?? null
    }
  }

  if (supabase) {
    await supabase.from('food_orders')
      .update({ status: 'payment_sent', payment_screenshot_url: screenshotUrl })
      .eq('id', orderId)
  }
  return screenshotUrl
}

// ── Status updates (restaurant controls these) ───────────────────────────────

/** Restaurant confirms order and starts preparing. */
export async function confirmOrder(orderId) {
  if (!supabase) return
  await supabase.from('food_orders')
    .update({ status: 'preparing', confirmed_at: new Date().toISOString() })
    .eq('id', orderId)
}

/** Restaurant marks food as on the way (their driver has left). */
export async function markOnTheWay(orderId) {
  if (!supabase) return
  await supabase.from('food_orders')
    .update({ status: 'on_the_way' })
    .eq('id', orderId)
}

/** Restaurant marks order as delivered. */
export async function markDelivered(orderId) {
  if (!supabase) return
  await supabase.from('food_orders')
    .update({ status: 'delivered', delivered_at: new Date().toISOString() })
    .eq('id', orderId)
}

/** Cancel an order (by customer or restaurant). */
export async function cancelOrder(orderId, reason = null) {
  if (!supabase) return
  await supabase.from('food_orders')
    .update({ status: 'cancelled', cancel_reason: reason })
    .eq('id', orderId)
}

// ── QR pickup code ───────────────────────────────────────────────────────────

/** Generate a 4-digit pickup code for an order. */
export function generatePickupCode() {
  return String(Math.floor(1000 + Math.random() * 9000))
}

/** Verify QR/pickup code matches the order. */
export async function verifyPickupCode(orderId, code) {
  if (!supabase) return true
  const { data } = await supabase
    .from('food_orders')
    .select('pickup_code')
    .eq('id', orderId)
    .single()
  return data?.pickup_code === code
}

// ── Fetch orders ─────────────────────────────────────────────────────────────

/** Get customer's order history. */
export async function getMyOrders(userId) {
  if (!supabase || !userId) return []
  const { data } = await supabase
    .from('food_orders')
    .select('*')
    .eq('sender_id', userId)
    .order('created_at', { ascending: false })
    .limit(50)
  return data || []
}

/** Get restaurant's incoming orders. */
export async function getRestaurantOrders(restaurantId, status = null) {
  if (!supabase || !restaurantId) return []
  let query = supabase
    .from('food_orders')
    .select('*')
    .eq('restaurant_id', restaurantId)
    .order('created_at', { ascending: false })
    .limit(100)
  if (status) query = query.eq('status', status)
  const { data } = await query
  return data || []
}

// ── Delivery zones ───────────────────────────────────────────────────────────

/** Get delivery zones for a restaurant. */
export async function getDeliveryZones(restaurantId) {
  if (!supabase) return []
  const { data } = await supabase
    .from('delivery_zones')
    .select('*')
    .eq('restaurant_id', restaurantId)
    .eq('is_active', true)
    .order('radius_km', { ascending: true })
  return data || []
}

/** Save/update delivery zones for a restaurant. */
export async function saveDeliveryZones(restaurantId, zones) {
  if (!supabase) return
  // Delete existing zones and re-insert
  await supabase.from('delivery_zones').delete().eq('restaurant_id', restaurantId)
  if (zones.length > 0) {
    await supabase.from('delivery_zones').insert(
      zones.map(z => ({
        restaurant_id: restaurantId,
        zone_name: z.zone_name,
        radius_km: z.radius_km,
        delivery_fee: z.delivery_fee,
        is_active: true,
      }))
    )
  }
}

/** Calculate delivery fee based on customer distance and restaurant zones. */
export function calculateDeliveryFee(distanceKm, zones) {
  if (!zones?.length) return 0
  // Find the matching zone (smallest zone that covers the distance)
  const sorted = [...zones].sort((a, b) => a.radius_km - b.radius_km)
  for (const zone of sorted) {
    if (distanceKm <= zone.radius_km) return zone.delivery_fee
  }
  // Beyond all zones — delivery not available
  return null
}
