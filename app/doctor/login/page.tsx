"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Stethoscope, User, Lock, AlertTriangle } from "lucide-react"
import { loginDoctorWithId } from "@/lib/utils/auth"
import { useRouter } from "next/navigation"

export default function DoctorLoginPage() {
  const [credentials, setCredentials] = useState({
    doctorId: "",
    password: "",
  })
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState("")
  const router = useRouter()

  const handleInputChange = (e) => {
    setCredentials({
      ...credentials,
      [e.target.name]: e.target.value,
    })
  }

  const handleLogin = async (e) => {
    e.preventDefault()
    setIsLoading(true)
    setError("")

    try {
      const result = await loginDoctorWithId(credentials.doctorId.toUpperCase(), credentials.password)

      if (result.success) {
        // Store doctor session
        localStorage.setItem("doctorAuthenticated", "true")
        localStorage.setItem("doctorId", credentials.doctorId.toUpperCase())
        router.push("/doctor/dashboard")
      } else {
        setError(result.error || "Invalid credentials")
      }
    } catch (error) {
      setError("An error occurred during login")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-white flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="flex items-center justify-center mb-4">
            <Stethoscope className="h-12 w-12 text-blue-600" />
          </div>
          <CardTitle className="text-2xl text-gray-900">Doctor Login</CardTitle>
          <CardDescription className="text-gray-600">
            Enter your doctor ID and password provided by the admin
          </CardDescription>
        </CardHeader>

        <CardContent>
          {error && (
            <Alert className="mb-4 border-red-200 bg-red-50">
              <AlertTriangle className="h-4 w-4 text-red-600" />
              <AlertDescription className="text-red-800">{error}</AlertDescription>
            </Alert>
          )}

          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <Label htmlFor="doctorId" className="flex items-center space-x-2">
                <User className="h-4 w-4" />
                <span>Doctor ID *</span>
              </Label>
              <Input
                id="doctorId"
                name="doctorId"
                value={credentials.doctorId}
                onChange={handleInputChange}
                placeholder="Enter your 6-digit doctor ID"
                maxLength={6}
                className="mt-1 font-mono uppercase"
                style={{ textTransform: "uppercase" }}
                required
              />
              <p className="text-xs text-gray-500 mt-1">6-character ID provided by admin</p>
            </div>

            <div>
              <Label htmlFor="password" className="flex items-center space-x-2">
                <Lock className="h-4 w-4" />
                <span>Password *</span>
              </Label>
              <Input
                id="password"
                name="password"
                type="password"
                value={credentials.password}
                onChange={handleInputChange}
                placeholder="Enter your password"
                className="mt-1"
                required
              />
              <p className="text-xs text-gray-500 mt-1">Password provided by admin</p>
            </div>

            <Button
              type="submit"
              className="w-full bg-blue-600 hover:bg-blue-700 text-white"
              disabled={isLoading || !credentials.doctorId.trim() || !credentials.password.trim()}
            >
              {isLoading ? "Signing In..." : "Sign In"}
            </Button>
          </form>

          <div className="mt-6 p-4 bg-blue-50 rounded-lg">
            <h4 className="text-sm font-medium text-blue-900 mb-2">Need Help?</h4>
            <ul className="text-xs text-blue-800 space-y-1">
              <li>• Contact admin if you forgot your doctor ID or password</li>
              <li>• Your doctor ID is a 6-character code (letters and numbers)</li>
              <li>• Both ID and password are case-sensitive</li>
            </ul>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
