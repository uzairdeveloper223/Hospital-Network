"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Shield, AlertTriangle, Lock } from "lucide-react"
import { checkIPBlocked, getFailedAttempts, recordFailedAttempt, verifyAdminCode, getClientIP } from "@/lib/utils/admin"
import AdminDashboard from "@/components/admin/admin-dashboard"

export default function AdminPage() {
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [accessCode, setAccessCode] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState("")
  const [warning, setWarning] = useState("")
  const [isBlocked, setIsBlocked] = useState(false)
  const [failedAttempts, setFailedAttempts] = useState(0)

  const clientIP = getClientIP()
  const supportPhone = process.env.NEXT_PUBLIC_ADMIN_SUPPORT_PHONE || "+92-300-1234567"

  useEffect(() => {
    checkSecurityStatus()
  }, [])

  const checkSecurityStatus = async () => {
    try {
      const blocked = await checkIPBlocked(clientIP)
      const attempts = await getFailedAttempts(clientIP)

      setIsBlocked(blocked)
      setFailedAttempts(attempts)

      if (blocked) {
        setError("Your IP address has been blocked due to multiple failed attempts. Please contact support.")
      } else if (attempts === 2) {
        setWarning(
          `Warning: After 1 more wrong attempt, you will be blocked. Please call ${supportPhone} if you need assistance.`,
        )
      }
    } catch (error) {
      console.error("Error checking security status:", error)
    }
  }

  const handleLogin = async (e) => {
    e.preventDefault()

    if (isBlocked) {
      setError("Your IP address is blocked. Please contact support.")
      return
    }

    setIsLoading(true)
    setError("")
    setWarning("")

    try {
      const isValid = await verifyAdminCode(accessCode)

      if (isValid) {
        setIsAuthenticated(true)
        // Clear any failed attempts on successful login
        localStorage.setItem("adminAuthenticated", "true")
      } else {
        const newAttempts = await recordFailedAttempt(clientIP)

        if (newAttempts >= 3) {
          setIsBlocked(true)
          setError("Too many failed attempts. Your IP has been blocked. Please contact support.")
        } else if (newAttempts === 2) {
          setWarning(
            `Warning: After 1 more wrong attempt, you will be blocked. Please call ${supportPhone} if you need assistance.`,
          )
          setError("Invalid access code. Please try again.")
        } else {
          setError("Invalid access code. Please try again.")
        }

        setFailedAttempts(newAttempts)
      }
    } catch (error) {
      setError("An error occurred. Please try again.")
    } finally {
      setIsLoading(false)
    }
  }

  const handleLogout = () => {
    setIsAuthenticated(false)
    localStorage.removeItem("adminAuthenticated")
    setAccessCode("")
  }

  // Check if already authenticated on page load
  useEffect(() => {
    const isAuth = localStorage.getItem("adminAuthenticated")
    if (isAuth === "true") {
      setIsAuthenticated(true)
    }
  }, [])

  if (isAuthenticated) {
    return <AdminDashboard onLogout={handleLogout} />
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-red-50 to-gray-50 flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="flex items-center justify-center mb-4">
            <Shield className="h-12 w-12 text-red-600" />
          </div>
          <CardTitle className="text-2xl text-gray-900">Admin Access</CardTitle>
          <CardDescription className="text-gray-600">Enter the secure access code to continue</CardDescription>
        </CardHeader>

        <CardContent>
          {isBlocked && (
            <Alert className="mb-4 border-red-200 bg-red-50">
              <AlertTriangle className="h-4 w-4 text-red-600" />
              <AlertDescription className="text-red-800">
                Your IP address has been blocked due to multiple failed attempts. Please call {supportPhone} for
                assistance.
              </AlertDescription>
            </Alert>
          )}

          {warning && !isBlocked && (
            <Alert className="mb-4 border-yellow-200 bg-yellow-50">
              <AlertTriangle className="h-4 w-4 text-yellow-600" />
              <AlertDescription className="text-yellow-800">{warning}</AlertDescription>
            </Alert>
          )}

          {error && !isBlocked && !warning && (
            <Alert className="mb-4 border-red-200 bg-red-50">
              <AlertTriangle className="h-4 w-4 text-red-600" />
              <AlertDescription className="text-red-800">{error}</AlertDescription>
            </Alert>
          )}

          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label htmlFor="accessCode" className="block text-sm font-medium text-gray-700 mb-2">
                Access Code
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  id="accessCode"
                  type="password"
                  value={accessCode}
                  onChange={(e) => setAccessCode(e.target.value)}
                  placeholder="Enter access code"
                  className="pl-10"
                  disabled={isBlocked || isLoading}
                  required
                />
              </div>
            </div>

            <Button
              type="submit"
              className="w-full bg-red-600 hover:bg-red-700 text-white"
              disabled={isBlocked || isLoading || !accessCode.trim()}
            >
              {isLoading ? "Verifying..." : "Access Admin Panel"}
            </Button>
          </form>

          <div className="mt-6 text-center">
            <p className="text-sm text-gray-500">Failed attempts: {failedAttempts}/3</p>
            <p className="text-xs text-gray-400 mt-2">Need help? Call {supportPhone}</p>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
