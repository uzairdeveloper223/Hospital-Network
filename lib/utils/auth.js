// Authentication utilities
import { auth, database } from "../firebase"
import { signInWithEmailAndPassword, createUserWithEmailAndPassword } from "firebase/auth"
import { ref, set, get } from "firebase/database"

// Generate random 6-digit ID with uppercase letters and numbers
export const generateDoctorId = () => {
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789"
  let result = ""
  for (let i = 0; i < 6; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length))
  }
  return result
}

// Generate random password
export const generateRandomPassword = () => {
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*"
  let result = ""
  for (let i = 0; i < 12; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length))
  }
  return result
}

// Create doctor account
export const createDoctorAccount = async (doctorData) => {
  try {
    const password = generateRandomPassword()
    const doctorId = generateDoctorId()

    // Create Firebase Auth account
    const userCredential = await createUserWithEmailAndPassword(auth, doctorData.email, password)
    const user = userCredential.user

    // Store doctor data in Realtime Database
    await set(ref(database, `doctors/${user.uid}`), {
      ...doctorData,
      doctorId,
      uid: user.uid,
      createdAt: new Date().toISOString(),
      isAvailable: false,
      isInHospital: false,
    })

    // Store doctor ID mapping for login
    await set(ref(database, `doctorIds/${doctorId}`), {
      email: doctorData.email,
      uid: user.uid,
    })

    return {
      success: true,
      doctorId,
      password,
      uid: user.uid,
    }
  } catch (error) {
    console.error("Error creating doctor account:", error)
    return {
      success: false,
      error: error.message,
    }
  }
}

// Doctor login with ID
export const loginDoctorWithId = async (doctorId, password) => {
  try {
    // Get email from doctor ID
    const doctorIdRef = ref(database, `doctorIds/${doctorId}`)
    const snapshot = await get(doctorIdRef)

    if (!snapshot.exists()) {
      throw new Error("Invalid doctor ID")
    }

    const { email } = snapshot.val()

    // Sign in with email and password
    const userCredential = await signInWithEmailAndPassword(auth, email, password)
    return {
      success: true,
      user: userCredential.user,
    }
  } catch (error) {
    console.error("Error logging in doctor:", error)
    return {
      success: false,
      error: error.message,
    }
  }
}
