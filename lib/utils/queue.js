import { ref, onValue, push, set, remove } from "firebase/database"
import { database } from "@/lib/firebase"

// Queue management utilities
export const queueUtils = {
  // Add patient to emergency queue
  addToEmergencyQueue: async (patientData) => {
    try {
      const queueRef = ref(database, "emergencyQueue")
      const newEntry = {
        ...patientData,
        timestamp: new Date().toISOString(),
        status: "waiting",
        estimatedWaitTime: 0,
      }

      await push(queueRef, newEntry)
      return { success: true }
    } catch (error) {
      console.error("Error adding to emergency queue:", error)
      return { success: false, error: error.message }
    }
  },

  // Update queue positions and wait times
  updateQueuePositions: async () => {
    try {
      const queueRef = ref(database, "emergencyQueue")

      return new Promise((resolve) => {
        onValue(
          queueRef,
          async (snapshot) => {
            if (snapshot.exists()) {
              const data = snapshot.val()
              const queueArray = Object.entries(data)
                .map(([id, item]) => ({ id, ...item }))
                .filter((item) => item.status === "waiting")
                .sort((a, b) => {
                  // Sort by severity first, then by timestamp
                  const severityOrder = { critical: 0, high: 1, medium: 2, low: 3 }
                  const severityDiff = severityOrder[a.severity] - severityOrder[b.severity]
                  if (severityDiff !== 0) return severityDiff
                  return new Date(a.timestamp) - new Date(b.timestamp)
                })

              // Update positions and estimated wait times
              const updates = {}
              queueArray.forEach((item, index) => {
                updates[`emergencyQueue/${item.id}/queuePosition`] = index + 1
                updates[`emergencyQueue/${item.id}/estimatedWaitTime`] = index * 15 // 15 minutes per position
              })

              if (Object.keys(updates).length > 0) {
                await set(ref(database), updates)
              }
            }
            resolve()
          },
          { onlyOnce: true },
        )
      })
    } catch (error) {
      console.error("Error updating queue positions:", error)
    }
  },

  // Remove patient from queue
  removeFromQueue: async (queueId) => {
    try {
      const queueRef = ref(database, `emergencyQueue/${queueId}`)
      await remove(queueRef)

      // Update remaining queue positions
      await queueUtils.updateQueuePositions()

      return { success: true }
    } catch (error) {
      console.error("Error removing from queue:", error)
      return { success: false, error: error.message }
    }
  },

  // Get current queue status
  getQueueStatus: () => {
    return new Promise((resolve) => {
      const queueRef = ref(database, "emergencyQueue")
      onValue(
        queueRef,
        (snapshot) => {
          if (snapshot.exists()) {
            const data = snapshot.val()
            const queueArray = Object.entries(data)
              .map(([id, item]) => ({ id, ...item }))
              .filter((item) => item.status === "waiting")
              .sort((a, b) => (a.queuePosition || 999) - (b.queuePosition || 999))

            const totalWaitTime = queueArray.length * 15
            const criticalCases = queueArray.filter((item) => item.severity === "critical").length

            resolve({
              totalInQueue: queueArray.length,
              averageWaitTime: totalWaitTime,
              criticalCases,
              queue: queueArray,
            })
          } else {
            resolve({
              totalInQueue: 0,
              averageWaitTime: 0,
              criticalCases: 0,
              queue: [],
            })
          }
        },
        { onlyOnce: true },
      )
    })
  },

  // Update patient status in queue
  updateQueueStatus: async (queueId, status, additionalData = {}) => {
    try {
      const updates = {
        [`emergencyQueue/${queueId}/status`]: status,
        [`emergencyQueue/${queueId}/lastUpdated`]: new Date().toISOString(),
        ...Object.entries(additionalData).reduce((acc, [key, value]) => {
          acc[`emergencyQueue/${queueId}/${key}`] = value
          return acc
        }, {}),
      }

      await set(ref(database), updates)

      // If status changed to completed or cancelled, update queue positions
      if (status === "completed" || status === "cancelled") {
        await queueUtils.updateQueuePositions()
      }

      return { success: true }
    } catch (error) {
      console.error("Error updating queue status:", error)
      return { success: false, error: error.message }
    }
  },
}

// Real-time queue listener
export const useQueueListener = (callback) => {
  const queueRef = ref(database, "emergencyQueue")

  const unsubscribe = onValue(queueRef, (snapshot) => {
    if (snapshot.exists()) {
      const data = snapshot.val()
      const queueArray = Object.entries(data)
        .map(([id, item]) => ({ id, ...item }))
        .sort((a, b) => {
          const severityOrder = { critical: 0, high: 1, medium: 2, low: 3 }
          const severityDiff = severityOrder[a.severity] - severityOrder[b.severity]
          if (severityDiff !== 0) return severityDiff
          return new Date(a.timestamp) - new Date(b.timestamp)
        })

      callback(queueArray)
    } else {
      callback([])
    }
  })

  return unsubscribe
}
