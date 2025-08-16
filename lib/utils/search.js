import { ref, get } from "firebase/database"
import { database } from "../firebase"

export const searchUtilities = {
  // Universal search function that searches across multiple data types
  async universalSearch(searchTerm, filters = {}) {
    const results = {
      patients: [],
      doctors: [],
      appointments: [],
      messages: [],
      labReports: [],
      prescriptions: [],
      certificates: [],
      beds: [],
      inventory: [],
    }

    if (!searchTerm.trim()) return results

    const searchLower = searchTerm.toLowerCase()

    try {
      // Search patients
      if (!filters.exclude?.includes("patients")) {
        const patientsRef = ref(database, "patients")
        const patientsSnapshot = await get(patientsRef)
        if (patientsSnapshot.exists()) {
          Object.entries(patientsSnapshot.val()).forEach(([id, patient]) => {
            if (
              patient.name?.toLowerCase().includes(searchLower) ||
              patient.phone?.includes(searchTerm) ||
              patient.cnic?.includes(searchTerm)
            ) {
              results.patients.push({ id, ...patient })
            }
          })
        }
      }

      // Search doctors
      if (!filters.exclude?.includes("doctors")) {
        const doctorsRef = ref(database, "doctors")
        const doctorsSnapshot = await get(doctorsRef)
        if (doctorsSnapshot.exists()) {
          Object.entries(doctorsSnapshot.val()).forEach(([id, doctor]) => {
            if (
              doctor.name?.toLowerCase().includes(searchLower) ||
              doctor.email?.toLowerCase().includes(searchLower) ||
              doctor.specialization?.toLowerCase().includes(searchLower) ||
              doctor.doctorId?.toLowerCase().includes(searchLower)
            ) {
              results.doctors.push({ id, ...doctor })
            }
          })
        }
      }

      // Search appointments
      if (!filters.exclude?.includes("appointments")) {
        const appointmentsRef = ref(database, "appointments")
        const appointmentsSnapshot = await get(appointmentsRef)
        if (appointmentsSnapshot.exists()) {
          Object.entries(appointmentsSnapshot.val()).forEach(([id, appointment]) => {
            if (
              appointment.patientName?.toLowerCase().includes(searchLower) ||
              appointment.doctorName?.toLowerCase().includes(searchLower) ||
              appointment.reason?.toLowerCase().includes(searchLower) ||
              appointment.status?.toLowerCase().includes(searchLower)
            ) {
              results.appointments.push({ id, ...appointment })
            }
          })
        }
      }

      // Search lab reports
      if (!filters.exclude?.includes("labReports")) {
        const labReportsRef = ref(database, "labReports")
        const labReportsSnapshot = await get(labReportsRef)
        if (labReportsSnapshot.exists()) {
          Object.entries(labReportsSnapshot.val()).forEach(([id, report]) => {
            if (
              report.patientName?.toLowerCase().includes(searchLower) ||
              report.testType?.toLowerCase().includes(searchLower) ||
              report.doctorName?.toLowerCase().includes(searchLower)
            ) {
              results.labReports.push({ id, ...report })
            }
          })
        }
      }

      // Search prescriptions
      if (!filters.exclude?.includes("prescriptions")) {
        const prescriptionsRef = ref(database, "prescriptions")
        const prescriptionsSnapshot = await get(prescriptionsRef)
        if (prescriptionsSnapshot.exists()) {
          Object.entries(prescriptionsSnapshot.val()).forEach(([id, prescription]) => {
            if (
              prescription.patientName?.toLowerCase().includes(searchLower) ||
              prescription.doctorName?.toLowerCase().includes(searchLower) ||
              prescription.medications?.some((med) => med.name?.toLowerCase().includes(searchLower))
            ) {
              results.prescriptions.push({ id, ...prescription })
            }
          })
        }
      }

      // Search medical certificates
      if (!filters.exclude?.includes("certificates")) {
        const certificatesRef = ref(database, "certificates")
        const certificatesSnapshot = await get(certificatesRef)
        if (certificatesSnapshot.exists()) {
          Object.entries(certificatesSnapshot.val()).forEach(([id, certificate]) => {
            if (
              certificate.patientName?.toLowerCase().includes(searchLower) ||
              certificate.doctorName?.toLowerCase().includes(searchLower) ||
              certificate.type?.toLowerCase().includes(searchLower) ||
              certificate.diagnosis?.toLowerCase().includes(searchLower)
            ) {
              results.certificates.push({ id, ...certificate })
            }
          })
        }
      }

      // Search beds
      if (!filters.exclude?.includes("beds")) {
        const bedsRef = ref(database, "beds")
        const bedsSnapshot = await get(bedsRef)
        if (bedsSnapshot.exists()) {
          Object.entries(bedsSnapshot.val()).forEach(([id, bed]) => {
            if (
              bed.bedNumber?.toLowerCase().includes(searchLower) ||
              bed.ward?.toLowerCase().includes(searchLower) ||
              bed.patientName?.toLowerCase().includes(searchLower) ||
              bed.type?.toLowerCase().includes(searchLower)
            ) {
              results.beds.push({ id, ...bed })
            }
          })
        }
      }

      // Search inventory
      if (!filters.exclude?.includes("inventory")) {
        const inventoryRef = ref(database, "inventory")
        const inventorySnapshot = await get(inventoryRef)
        if (inventorySnapshot.exists()) {
          Object.entries(inventorySnapshot.val()).forEach(([id, item]) => {
            if (
              item.name?.toLowerCase().includes(searchLower) ||
              item.category?.toLowerCase().includes(searchLower) ||
              item.supplier?.toLowerCase().includes(searchLower) ||
              item.description?.toLowerCase().includes(searchLower)
            ) {
              results.inventory.push({ id, ...item })
            }
          })
        }
      }
    } catch (error) {
      console.error("Search error:", error)
    }

    return results
  },

  // Filter functions for different data types
  filterPatients(patients, filters) {
    return patients.filter((patient) => {
      if (filters.isGovEmployee !== undefined && patient.isGovEmployee !== filters.isGovEmployee) return false
      if (filters.hasAppointments !== undefined) {
        const hasAppts = patient.appointmentHistory && patient.appointmentHistory.length > 0
        if (hasAppts !== filters.hasAppointments) return false
      }
      return true
    })
  },

  filterDoctors(doctors, filters) {
    return doctors.filter((doctor) => {
      if (filters.specialization && doctor.specialization !== filters.specialization) return false
      if (filters.isAvailable !== undefined && doctor.isAvailable !== filters.isAvailable) return false
      if (filters.isInHospital !== undefined && doctor.isInHospital !== filters.isInHospital) return false
      return true
    })
  },

  filterAppointments(appointments, filters) {
    return appointments.filter((appointment) => {
      if (filters.status && appointment.status !== filters.status) return false
      if (filters.isEmergency !== undefined && appointment.isEmergency !== filters.isEmergency) return false
      if (filters.dateRange) {
        const appointmentDate = new Date(appointment.date)
        const startDate = new Date(filters.dateRange.start)
        const endDate = new Date(filters.dateRange.end)
        if (appointmentDate < startDate || appointmentDate > endDate) return false
      }
      return true
    })
  },

  filterLabReports(reports, filters) {
    return reports.filter((report) => {
      if (filters.testType && report.testType !== filters.testType) return false
      if (filters.status && report.status !== filters.status) return false
      if (filters.dateRange) {
        const reportDate = new Date(report.date)
        const startDate = new Date(filters.dateRange.start)
        const endDate = new Date(filters.dateRange.end)
        if (reportDate < startDate || reportDate > endDate) return false
      }
      return true
    })
  },

  filterInventory(items, filters) {
    return items.filter((item) => {
      if (filters.category && item.category !== filters.category) return false
      if (filters.lowStock && item.quantity > item.minQuantity) return false
      if (filters.expired && new Date(item.expiryDate) > new Date()) return false
      if (filters.nearExpiry) {
        const thirtyDaysFromNow = new Date()
        thirtyDaysFromNow.setDate(thirtyDaysFromNow.getDate() + 30)
        if (new Date(item.expiryDate) > thirtyDaysFromNow) return false
      }
      return true
    })
  },
}
