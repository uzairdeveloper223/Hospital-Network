// Admin authentication and security utilities
import { database } from "../firebase"
import { ref, get, set, push } from "firebase/database"

// Check if IP is blocked
export const checkIPBlocked = async (ipAddress) => {
  try {
    const blockedIPRef = ref(database, `security/blockedIPs/${ipAddress.replace(/\./g, "_")}`)
    const snapshot = await get(blockedIPRef)

    if (snapshot.exists()) {
      const blockData = snapshot.val()
      const blockTime = new Date(blockData.blockedAt)
      const now = new Date()
      const hoursSinceBlock = (now - blockTime) / (1000 * 60 * 60)

      // Unblock after 24 hours
      if (hoursSinceBlock > 24) {
        await set(blockedIPRef, null)
        return false
      }
      return true
    }
    return false
  } catch (error) {
    console.error("Error checking IP block:", error)
    return false
  }
}

// Get failed attempts for IP
export const getFailedAttempts = async (ipAddress) => {
  try {
    const attemptsRef = ref(database, `security/failedAttempts/${ipAddress.replace(/\./g, "_")}`)
    const snapshot = await get(attemptsRef)

    if (snapshot.exists()) {
      const attempts = snapshot.val()
      const lastAttempt = new Date(attempts.lastAttempt)
      const now = new Date()
      const hoursSinceLastAttempt = (now - lastAttempt) / (1000 * 60 * 60)

      // Reset attempts after 1 hour
      if (hoursSinceLastAttempt > 1) {
        await set(attemptsRef, null)
        return 0
      }
      return attempts.count || 0
    }
    return 0
  } catch (error) {
    console.error("Error getting failed attempts:", error)
    return 0
  }
}

// Record failed attempt
export const recordFailedAttempt = async (ipAddress) => {
  try {
    const currentAttempts = await getFailedAttempts(ipAddress)
    const newCount = currentAttempts + 1

    const attemptsRef = ref(database, `security/failedAttempts/${ipAddress.replace(/\./g, "_")}`)
    await set(attemptsRef, {
      count: newCount,
      lastAttempt: new Date().toISOString(),
    })

    // Block IP after 3 failed attempts
    if (newCount >= 3) {
      const blockedIPRef = ref(database, `security/blockedIPs/${ipAddress.replace(/\./g, "_")}`)
      await set(blockedIPRef, {
        blockedAt: new Date().toISOString(),
        attempts: newCount,
      })

      // Clear failed attempts
      await set(attemptsRef, null)
    }

    return newCount
  } catch (error) {
    console.error("Error recording failed attempt:", error)
    return 0
  }
}

// Verify admin code
export const verifyAdminCode = async (code) => {
  try {
    const adminRef = ref(database, "admin/accessCode")
    const snapshot = await get(adminRef)

    if (snapshot.exists()) {
      return snapshot.val() === code
    }

    // Set default admin code if not exists
    await set(adminRef, "ADMIN123")
    return code === "ADMIN123"
  } catch (error) {
    console.error("Error verifying admin code:", error)
    return false
  }
}

// Change admin code
export const changeAdminCode = async (currentCode, newCode) => {
  try {
    const isCurrentValid = await verifyAdminCode(currentCode)
    if (!isCurrentValid) {
      return { success: false, error: "Current code is incorrect" }
    }

    const adminRef = ref(database, "admin/accessCode")
    await set(adminRef, newCode)

    // Log the change
    const logRef = ref(database, "admin/codeChanges")
    await push(logRef, {
      changedAt: new Date().toISOString(),
      oldCodeHash: btoa(currentCode), // Basic encoding for logging
    })

    return { success: true }
  } catch (error) {
    console.error("Error changing admin code:", error)
    return { success: false, error: error.message }
  }
}

// Get client IP (for development, this is simplified)
export const getClientIP = () => {
  
  return "127.0.0.1" // Localhost for development
}
