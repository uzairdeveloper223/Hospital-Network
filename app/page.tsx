"use client"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Hospital, UserCheck, Stethoscope, Shield } from "lucide-react"

export default function HomePage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-white">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="text-center mb-12">
          <div className="flex items-center justify-center mb-4">
            <Hospital className="h-12 w-12 text-blue-600 mr-3" />
            <h1 className="text-4xl font-bold text-gray-900">Hospital Management System</h1>
          </div>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            Streamlined healthcare management for patients, doctors, and administrators
          </p>
        </div>

        {/* User Type Selection */}
        <div className="grid md:grid-cols-3 gap-8 max-w-4xl mx-auto">
          {/* Patient Card */}
          <Card className="hover:shadow-lg transition-shadow cursor-pointer border-2 hover:border-blue-200">
            <CardHeader className="text-center">
              <UserCheck className="h-16 w-16 text-green-600 mx-auto mb-4" />
              <CardTitle className="text-2xl text-gray-900">Patient</CardTitle>
              <CardDescription className="text-gray-600">
                Book appointments, view medical records, and communicate with doctors
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button
                className="w-full bg-green-600 hover:bg-green-700 text-white"
                onClick={() => (window.location.href = "/patient")}
              >
                I am a Patient
              </Button>
            </CardContent>
          </Card>

          {/* Doctor Card */}
          <Card className="hover:shadow-lg transition-shadow cursor-pointer border-2 hover:border-blue-200">
            <CardHeader className="text-center">
              <Stethoscope className="h-16 w-16 text-blue-600 mx-auto mb-4" />
              <CardTitle className="text-2xl text-gray-900">Doctor</CardTitle>
              <CardDescription className="text-gray-600">
                Manage appointments, patient records, and availability schedule
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button
                className="w-full bg-blue-600 hover:bg-blue-700 text-white"
                onClick={() => (window.location.href = "/doctor/login")}
              >
                Doctor Login
              </Button>
            </CardContent>
          </Card>

          {/* Admin Card */}
          <Card className="hover:shadow-lg transition-shadow cursor-pointer border-2 hover:border-blue-200">
            <CardHeader className="text-center">
              <Shield className="h-16 w-16 text-red-600 mx-auto mb-4" />
              <CardTitle className="text-2xl text-gray-900">Administrator</CardTitle>
              <CardDescription className="text-gray-600">
                Manage doctors, patients, and oversee hospital operations
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button
                className="w-full bg-red-600 hover:bg-red-700 text-white"
                onClick={() => (window.location.href = "/admin")}
              >
                Admin Panel
              </Button>
            </CardContent>
          </Card>
        </div>

        {/* Emergency Section */}
        <div className="mt-16 text-center">
          <Card className="bg-red-50 border-red-200 max-w-2xl mx-auto">
            <CardHeader>
              <CardTitle className="text-red-800 text-2xl">Emergency Services</CardTitle>
              <CardDescription className="text-red-600">
                Need immediate medical attention or ambulance service?
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button
                className="bg-red-600 hover:bg-red-700 text-white text-lg px-8 py-3"
                onClick={() => (window.location.href = "/emergency")}
              >
                Request Emergency Help
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
