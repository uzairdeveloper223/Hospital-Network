// Device ID utilities for patient registration
export const generateDeviceId = () => {
  // Generate a unique device ID based on browser fingerprint
  const canvas = document.createElement("canvas")
  const ctx = canvas.getContext("2d")
  ctx.textBaseline = "top"
  ctx.font = "14px Arial"
  ctx.fillText("Device fingerprint", 2, 2)

  const fingerprint = canvas.toDataURL()
  const userAgent = navigator.userAgent
  const language = navigator.language
  const platform = navigator.platform
  const screenResolution = `${screen.width}x${screen.height}`

  const deviceString = `${fingerprint}-${userAgent}-${language}-${platform}-${screenResolution}`

  // Simple hash function
  let hash = 0
  for (let i = 0; i < deviceString.length; i++) {
    const char = deviceString.charCodeAt(i)
    hash = (hash << 5) - hash + char
    hash = hash & hash // Convert to 32-bit integer
  }

  return Math.abs(hash).toString(36).toUpperCase()
}

// Validate Pakistani phone number
export const validatePakistaniPhone = (phone) => {
  // Pakistani phone number patterns: +92, 03xx, 92xxx
  const patterns = [
    /^\+92[0-9]{10}$/, // +92xxxxxxxxxx
    /^92[0-9]{10}$/, // 92xxxxxxxxxx
    /^03[0-9]{9}$/, // 03xxxxxxxxx
    /^[0-9]{11}$/, // xxxxxxxxxxx
  ]

  return patterns.some((pattern) => pattern.test(phone))
}

// Format Pakistani phone number
export const formatPakistaniPhone = (phone) => {
  // Remove all non-digits
  const digits = phone.replace(/\D/g, "")

  // Add +92 prefix if needed
  if (digits.startsWith("03")) {
    return `+92${digits.substring(1)}`
  } else if (digits.startsWith("92")) {
    return `+${digits}`
  } else if (digits.length === 11) {
    return `+92${digits.substring(1)}`
  }

  return `+92${digits}`
}
