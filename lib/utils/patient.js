// Patient registration and management utilities
import { database } from "../firebase"
import { ref, set, get, push } from "firebase/database"
import { generateDeviceId, validatePakistaniPhone, formatPakistaniPhone } from "./device"

// Register patient with device ID
export const registerPatient = async (patientData) => {
  try {
    const deviceId = generateDeviceId()

    // Validate phone number
    if (!validatePakistaniPhone(patientData.phone)) {
      return {
        success: false,
        error: "Please enter a valid Pakistani phone number",
      }
    }

    const formattedPhone = formatPakistaniPhone(patientData.phone)

    // Check if device is already registered
    const existingPatientRef = ref(database, `patients/${deviceId}`)
    const existingSnapshot = await get(existingPatientRef)

    if (existingSnapshot.exists()) {
      return {
        success: true,
        deviceId,
        patient: existingSnapshot.val(),
        isExisting: true,
      }
    }

    // Register new patient
    const patientRecord = {
      deviceId,
      name: patientData.name,
      phone: formattedPhone,
      registeredAt: new Date().toISOString(),
      isGovEmployee: false,
      cnic: null,
      totalAppointments: 0,
      lastVisit: null,
    }

    await set(existingPatientRef, patientRecord)

    return {
      success: true,
      deviceId,
      patient: patientRecord,
      isExisting: false,
    }
  } catch (error) {
    console.error("Error registering patient:", error)
    return {
      success: false,
      error: error.message,
    }
  }
}

// Get patient by device ID
export const getPatientByDevice = async () => {
  try {
    const deviceId = generateDeviceId()
    const patientRef = ref(database, `patients/${deviceId}`)
    const snapshot = await get(patientRef)

    if (snapshot.exists()) {
      return {
        success: true,
        patient: snapshot.val(),
      }
    }

    return {
      success: false,
      error: "Patient not found",
    }
  } catch (error) {
    console.error("Error getting patient:", error)
    return {
      success: false,
      error: error.message,
    }
  }
}

// Update government employee status
export const updateGovEmployeeStatus = async (cnic) => {
  try {
    const deviceId = generateDeviceId()
    const patientRef = ref(database, `patients/${deviceId}`)

    // Validate CNIC format (13 digits)
    const cnicRegex = /^\d{5}-\d{7}-\d{1}$|^\d{13}$/
    if (!cnicRegex.test(cnic)) {
      return {
        success: false,
        error: "Please enter a valid CNIC number (13 digits)",
      }
    }

    const formattedCNIC = cnic.replace(/\D/g, "")

    await set(ref(database, `patients/${deviceId}/cnic`), formattedCNIC)
    await set(ref(database, `patients/${deviceId}/govEmployeeRequested`), true)
    await set(ref(database, `patients/${deviceId}/govEmployeeRequestedAt`), new Date().toISOString())

    // Add to admin review queue
    await push(ref(database, "admin/govEmployeeReviews"), {
      deviceId,
      cnic: formattedCNIC,
      requestedAt: new Date().toISOString(),
      status: "pending",
    })

    return {
      success: true,
      message: "Government employee verification request submitted for admin review",
    }
  } catch (error) {
    console.error("Error updating gov employee status:", error)
    return {
      success: false,
      error: error.message,
    }
  }
}

// Send message to admin
export const sendMessageToAdmin = async (message) => {
  try {
    const deviceId = generateDeviceId()
    const patient = await getPatientByDevice()

    if (!patient.success) {
      return {
        success: false,
        error: "Please register first",
      }
    }

    const messageData = {
      deviceId,
      patientName: patient.patient.name,
      patientPhone: patient.patient.phone,
      message,
      sentAt: new Date().toISOString(),
      read: false,
      replied: false,
    }

    await push(ref(database, "messages"), messageData)

    return {
      success: true,
      message: "Message sent to admin successfully",
    }
  } catch (error) {
    console.error("Error sending message:", error)
    return {
      success: false,
      error: error.message,
    }
  }
}

// Request ambulance
export const requestAmbulance = async (emergencyData) => {
  try {
    const deviceId = generateDeviceId()
    const patient = await getPatientByDevice()

    if (!patient.success) {
      return {
        success: false,
        error: "Please register first",
      }
    }

    const ambulanceRequest = {
      deviceId,
      patientName: patient.patient.name,
      patientPhone: patient.patient.phone,
      emergencyPhone: emergencyData.emergencyPhone || patient.patient.phone,
      location: emergencyData.location,
      emergencyType: emergencyData.emergencyType,
      description: emergencyData.description,
      requestedAt: new Date().toISOString(),
      status: "pending",
      priority: "high",
    }

    await push(ref(database, "emergency/ambulance"), ambulanceRequest)

    return {
      success: true,
      message: "Ambulance request sent successfully. Emergency services will contact you shortly.",
    }
  } catch (error) {
    console.error("Error requesting ambulance:", error)
    return {
      success: false,
      error: error.message,
    }
  }
}
