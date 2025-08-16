"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import DoctorDashboard from "@/components/doctor/doctor-dashboard"

export default function DoctorDashboardPage() {
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const router = useRouter()

  useEffect(() => {
    const checkAuth = () => {
      const isAuth = localStorage.getItem("doctorAuthenticated")
      const doctorId = localStorage.getItem("doctorId")

      if (isAuth === "true" && doctorId) {
        setIsAuthenticated(true)
      } else {
        router.push("/doctor/login")
      }
      setIsLoading(false)
    }

    checkAuth()
  }, [router])

  const handleLogout = () => {
    localStorage.removeItem("doctorAuthenticated")
    localStorage.removeItem("doctorId")
    router.push("/doctor/login")
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading dashboard...</p>
        </div>
      </div>
    )
  }

  if (!isAuthenticated) {
    return null // Will redirect to login
  }

  return <DoctorDashboard onLogout={handleLogout} />
}
