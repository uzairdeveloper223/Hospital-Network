"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { User, Mail, Phone, Stethoscope, GraduationCap, CheckCircle, AlertTriangle } from "lucide-react"
import { database } from "@/lib/firebase"
import { ref, update } from "firebase/database"

export default function DoctorProfile({ doctor }) {
  const [profileData, setProfileData] = useState({
    name: doctor.name || "",
    phone: doctor.phone || "",
    specialization: doctor.specialization || "",
    qualification: doctor.qualification || "",
    additionalDetails: doctor.additionalDetails || "",
  })
  const [isLoading, setIsLoading] = useState(false)
  const [message, setMessage] = useState("")
  const [messageType, setMessageType] = useState("")

  const handleInputChange = (e) => {
    setProfileData({
      ...profileData,
      [e.target.name]: e.target.value,
    })
  }

  const handleUpdateProfile = async (e) => {
    e.preventDefault()
    setIsLoading(true)
    setMessage("")

    try {
      await update(ref(database, `doctors/${doctor.uid}`), {
        ...profileData,
        profileUpdatedAt: new Date().toISOString(),
      })

      setMessage("Profile updated successfully!")
      setMessageType("success")
    } catch (error) {
      console.error("Error updating profile:", error)
      setMessage("Failed to update profile")
      setMessageType("error")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <User className="h-5 w-5 text-blue-600" />
            <span>Doctor Profile</span>
          </CardTitle>
          <CardDescription>Update your professional information and contact details</CardDescription>
        </CardHeader>
        <CardContent>
          {message && (
            <Alert
              className={`mb-4 ${
                messageType === "success" ? "border-green-200 bg-green-50" : "border-red-200 bg-red-50"
              }`}
            >
              {messageType === "success" ? (
                <CheckCircle className="h-4 w-4 text-green-600" />
              ) : (
                <AlertTriangle className="h-4 w-4 text-red-600" />
              )}
              <AlertDescription className={messageType === "success" ? "text-green-800" : "text-red-800"}>
                {message}
              </AlertDescription>
            </Alert>
          )}

          <form onSubmit={handleUpdateProfile} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="name" className="flex items-center space-x-2">
                  <User className="h-4 w-4" />
                  <span>Full Name *</span>
                </Label>
                <Input
                  id="name"
                  name="name"
                  value={profileData.name}
                  onChange={handleInputChange}
                  placeholder="Dr. John Smith"
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
                  value={profileData.phone}
                  onChange={handleInputChange}
                  placeholder="+92-300-1234567"
                  required
                  className="mt-1"
                />
              </div>

              <div>
                <Label htmlFor="specialization" className="flex items-center space-x-2">
                  <Stethoscope className="h-4 w-4" />
                  <span>Specialization *</span>
                </Label>
                <Input
                  id="specialization"
                  name="specialization"
                  value={profileData.specialization}
                  onChange={handleInputChange}
                  placeholder="Cardiology, Neurology, etc."
                  required
                  className="mt-1"
                />
              </div>

              <div>
                <Label htmlFor="qualification" className="flex items-center space-x-2">
                  <GraduationCap className="h-4 w-4" />
                  <span>Qualification</span>
                </Label>
                <Input
                  id="qualification"
                  name="qualification"
                  value={profileData.qualification}
                  onChange={handleInputChange}
                  placeholder="MBBS, MD, etc."
                  className="mt-1"
                />
              </div>
            </div>

            <div>
              <Label htmlFor="additionalDetails">Additional Details</Label>
              <Textarea
                id="additionalDetails"
                name="additionalDetails"
                value={profileData.additionalDetails}
                onChange={handleInputChange}
                placeholder="Any additional information about your practice, experience, or specialties"
                rows={4}
                className="mt-1"
              />
            </div>

            <Button type="submit" className="w-full bg-blue-600 hover:bg-blue-700 text-white" disabled={isLoading}>
              {isLoading ? "Updating Profile..." : "Update Profile"}
            </Button>
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Account Information</CardTitle>
          <CardDescription>Read-only account details managed by admin</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="p-3 bg-gray-50 rounded-lg">
              <div className="flex items-center space-x-2 mb-1">
                <Mail className="h-4 w-4 text-gray-600" />
                <span className="text-sm font-medium text-gray-700">Email Address</span>
              </div>
              <p className="text-gray-900 font-mono">{doctor.email}</p>
            </div>

            <div className="p-3 bg-gray-50 rounded-lg">
              <div className="flex items-center space-x-2 mb-1">
                <User className="h-4 w-4 text-gray-600" />
                <span className="text-sm font-medium text-gray-700">Doctor ID</span>
              </div>
              <p className="text-gray-900 font-mono">{doctor.doctorId}</p>
            </div>

            <div className="p-3 bg-gray-50 rounded-lg">
              <div className="flex items-center space-x-2 mb-1">
                <CheckCircle className="h-4 w-4 text-gray-600" />
                <span className="text-sm font-medium text-gray-700">Account Created</span>
              </div>
              <p className="text-gray-900">{new Date(doctor.createdAt).toLocaleDateString()}</p>
            </div>

            <div className="p-3 bg-gray-50 rounded-lg">
              <div className="flex items-center space-x-2 mb-1">
                <CheckCircle className="h-4 w-4 text-gray-600" />
                <span className="text-sm font-medium text-gray-700">Last Updated</span>
              </div>
              <p className="text-gray-900">
                {doctor.profileUpdatedAt ? new Date(doctor.profileUpdatedAt).toLocaleDateString() : "Never updated"}
              </p>
            </div>
          </div>

          <div className="p-3 bg-blue-50 rounded-lg">
            <h4 className="text-sm font-medium text-blue-900 mb-2">Account Notes</h4>
            <ul className="text-xs text-blue-800 space-y-1">
              <li>• Your email and doctor ID cannot be changed - contact admin if needed</li>
              <li>• Profile updates are immediately visible to patients and admin</li>
              <li>• Keep your contact information current for patient communication</li>
              <li>• Specialization helps patients find the right doctor for their needs</li>
            </ul>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
