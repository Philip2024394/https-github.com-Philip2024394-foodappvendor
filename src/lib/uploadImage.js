import { supabase } from './supabase'

const BUCKET = 'images'
const ALLOWED_EXTS = ['jpg', 'jpeg', 'png', 'webp', 'avif', 'gif', 'heic', 'heif', 'bmp', 'tiff']
const MAX_SIZE = 10 * 1024 * 1024 // 10 MB

/**
 * Upload an image file to Supabase Storage and return the public URL.
 * Falls back to a local object URL in demo mode (no Supabase).
 *
 * @param {File} file - the image file to upload
 * @param {string} folder - sub-folder inside the bucket (e.g. 'avatars', 'products')
 * @returns {Promise<string>} public URL
 */
export async function uploadImage(file, folder = 'general') {
  if (!file) throw new Error('No file provided')

  const ext = file.name.split('.').pop().toLowerCase()
  if (!ALLOWED_EXTS.includes(ext)) {
    throw new Error(`Format .${ext} not supported. Use PNG, JPG, WEBP, GIF, etc.`)
  }
  if (file.size > MAX_SIZE) {
    throw new Error('Image must be under 10 MB')
  }

  // Demo mode — return a local blob URL so previews still work
  if (!supabase) {
    return URL.createObjectURL(file)
  }

  const unique = `${Date.now()}-${Math.random().toString(36).slice(2)}`
  const path = `${folder}/${unique}.${ext}`

  const { error } = await supabase.storage
    .from(BUCKET)
    .upload(path, file, { upsert: false, contentType: file.type })

  if (error) throw new Error(error.message)

  const { data } = supabase.storage.from(BUCKET).getPublicUrl(path)
  return data.publicUrl
}
