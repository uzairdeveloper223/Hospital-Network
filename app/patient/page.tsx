"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { UserCheck, Phone, User, CheckCircle, AlertTriangle, Smartphone } from "lucide-react"
import { registerPatient, getPatientByDevice } from "@/lib/utils/patient"
import PatientDashboard from "@/components/patient/patient-dashboard"

export default function PatientPage() {
  const [isRegistered, setIsRegistered] = useState(false)
  const [patient, setPatient] = useState(null)
  const [isLoading, setIsLoading] = useState(true)
  const [registrationLoading, setRegistrationLoading] = useState(false)
  const [error, setError] = useState("")
  const [success, setSuccess] = useState("")

  const [formData, setFormData] = useState({
    name: "",
    phone: "",
  })

  useEffect(() => {
    checkExistingRegistration()
  }, [])

  const checkExistingRegistration = async () => {
    try {
      const result = await getPatientByDevice()
      if (result.success) {
        setPatient(result.patient)
        setIsRegistered(true)
      }
    } catch (error) {
      console.error("Error checking registration:", error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleInputChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    })
  }

  const handleRegistration = async (e) => {
    e.preventDefault()
    setRegistrationLoading(true)
    setError("")
    setSuccess("")

    try {
      const result = await registerPatient(formData)

      if (result.success) {
        setPatient(result.patient)
        setIsRegistered(true)
        if (result.isExisting) {
          setSuccess("Welcome back! Your device is already registered.")
        } else {
          setSuccess("Registration successful! You can now book appointments.")
        }
      } else {
        setError(result.error || "Registration failed")
      }
    } catch (error) {
      setError("An error occurred during registration")
    } finally {
      setRegistrationLoading(false)
    }
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-50 to-white flex items-center justify-center">
        <div className="text-center">
          <Smartphone className="h-12 w-12 text-green-600 mx-auto mb-4 animate-pulse" />
          <p className="text-gray-600">Checking device registration...</p>
        </div>
      </div>
    )
  }

  if (isRegistered && patient) {
    return <PatientDashboard patient={patient} />
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-white">
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-md mx-auto">
          {/* Header */}
          <div className="text-center mb-8">
            <div className="flex items-center justify-center mb-4">
              <UserCheck className="h-12 w-12 text-green-600 mr-3" />
              <h1 className="text-3xl font-bold text-gray-900">Patient Registration</h1>
            </div>
            <p className="text-gray-600">Register your device to book appointments and access medical services</p>
          </div>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Smartphone className="h-5 w-5 text-green-600" />
                <span>Device-Based Registration</span>
              </CardTitle>
              <CardDescription>
                No email or password required. Your device will be securely registered for future visits.
              </CardDescription>
            </CardHeader>

            <CardContent>
              {success && (
                <Alert className="mb-4 border-green-200 bg-green-50">
                  <CheckCircle className="h-4 w-4 text-green-600" />
                  <AlertDescription className="text-green-800">{success}</AlertDescription>
                </Alert>
              )}

              {error && (
                <Alert className="mb-4 border-red-200 bg-red-50">
                  <AlertTriangle className="h-4 w-4 text-red-600" />
                  <AlertDescription className="text-red-800">{error}</AlertDescription>
                </Alert>
              )}

              <form onSubmit={handleRegistration} className="space-y-4">
                <div>
                  <Label htmlFor="name" className="flex items-center space-x-2">
                    <User className="h-4 w-4" />
                    <span>Full Name *</span>
                  </Label>
                  <Input
                    id="name"
                    name="name"
                    value={formData.name}
                    onChange={handleInputChange}
                    placeholder="Enter your full name"
                    required
                    className="mt-1"
                  />
                </div>

                <div>
                  <Label htmlFor="phone" className="flex items-center space-x-2">
                    <Phone className="h-4 w-4" />
                    <span>Phone Number *</span>
                  </Label>
                  <Input
                    id="phone"
                    name="phone"
                    value={formData.phone}
                    onChange={handleInputChange}
                    placeholder="+92-300-1234567 or 03001234567"
                    required
                    className="mt-1"
                  />
                  <p className="text-xs text-gray-500 mt-1">Pakistani phone number format</p>
                </div>

                <Button
                  type="submit"
                  className="w-full bg-green-600 hover:bg-green-700 text-white"
                  disabled={registrationLoading || !formData.name.trim() || !formData.phone.trim()}
                >
                  {registrationLoading ? "Registering Device..." : "Register & Continue"}
                </Button>
              </form>

              <div className="mt-6 p-4 bg-blue-50 rounded-lg">
                <h4 className="text-sm font-medium text-blue-900 mb-2">How Device Registration Works</h4>
                <ul className="text-xs text-blue-800 space-y-1">
                  <li>• Your device is uniquely identified without storing personal data</li>
                  <li>• No email or password required for future visits</li>
                  <li>• Secure and privacy-focused registration</li>
                  <li>• Access all hospital services with just your name and phone</li>
                </ul>
              </div>
            </CardContent>
          </Card>

          {/* Emergency Button */}
          <div className="mt-8 text-center">
            <Card className="bg-red-50 border-red-200">
              <CardContent className="pt-6">
                <Button
                  className="w-full bg-red-600 hover:bg-red-700 text-white text-lg py-3"
                  onClick={() => (window.location.href = "/emergency")}
                >
                  Emergency Services
                </Button>
                <p className="text-xs text-red-600 mt-2">For immediate medical attention or ambulance</p>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  )
}
