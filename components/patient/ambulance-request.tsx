"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Ambulance, MapPin, Phone, Clock, AlertTriangle } from "lucide-react"
import { database } from "@/lib/firebase"
import { ref, push, serverTimestamp } from "firebase/database"

export default function AmbulanceRequest({ patient }) {
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)
  const [formData, setFormData] = useState({
    emergencyType: "",
    location: "",
    contactNumber: patient.phone || "",
    alternateNumber: "",
    description: "",
    urgencyLevel: "high",
    patientCondition: "",
    isAtHospital: "no",
  })

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)

    try {
      const ambulanceRequestsRef = ref(database, "ambulanceRequests")
      await push(ambulanceRequestsRef, {
        ...formData,
        patientName: patient.name,
        patientPhone: patient.phone,
        deviceId: patient.deviceId,
        isGovEmployee: patient.isGovEmployee || false,
        status: "pending",
        requestedAt: serverTimestamp(),
        createdAt: new Date().toISOString(),
      })

      setSuccess(true)
      setFormData({
        emergencyType: "",
        location: "",
        contactNumber: patient.phone || "",
        alternateNumber: "",
        description: "",
        urgencyLevel: "high",
        patientCondition: "",
        isAtHospital: "no",
      })
    } catch (error) {
      console.error("Error submitting ambulance request:", error)
      alert("Failed to submit request. Please try again.")
    } finally {
      setLoading(false)
    }
  }

  if (success) {
    return (
      <Card className="border-green-200">
        <CardContent className="pt-6">
          <div className="text-center space-y-4">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto">
              <Ambulance className="h-8 w-8 text-green-600" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-green-900">Request Submitted Successfully!</h3>
              <p className="text-green-700 mt-2">
                Your ambulance request has been sent to the hospital administration. You will be contacted shortly at{" "}
                {formData.contactNumber}.
              </p>
            </div>
            <Alert className="border-yellow-200 bg-yellow-50">
              <AlertTriangle className="h-4 w-4 text-yellow-600" />
              <AlertDescription className="text-yellow-800">
                <strong>Emergency Hotline:</strong> For immediate life-threatening emergencies, call 1122 directly.
              </AlertDescription>
            </Alert>
            <Button variant="outline" onClick={() => setSuccess(false)} className="mt-4">
              Submit Another Request
            </Button>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center space-x-2 text-red-600">
          <Ambulance className="h-5 w-5" />
          <span>Request Emergency Ambulance</span>
        </CardTitle>
        <CardDescription>
          Fill out this form to request an ambulance. For life-threatening emergencies, call 1122 immediately.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Emergency Type */}
          <div className="space-y-2">
            <Label htmlFor="emergencyType">Type of Emergency *</Label>
            <Select
              value={formData.emergencyType}
              onValueChange={(value) => setFormData((prev) => ({ ...prev, emergencyType: value }))}
              required
            >
              <SelectTrigger>
                <SelectValue placeholder="Select emergency type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="medical">Medical Emergency</SelectItem>
                <SelectItem value="accident">Accident</SelectItem>
                <SelectItem value="cardiac">Cardiac Emergency</SelectItem>
                <SelectItem value="respiratory">Breathing Problems</SelectItem>
                <SelectItem value="trauma">Trauma/Injury</SelectItem>
                <SelectItem value="pregnancy">Pregnancy Related</SelectItem>
                <SelectItem value="other">Other Emergency</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Location */}
          <div className="space-y-2">
            <Label htmlFor="location">Current Location *</Label>
            <div className="relative">
              <MapPin className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
              <Textarea
                id="location"
                placeholder="Provide detailed address with landmarks..."
                value={formData.location}
                onChange={(e) => setFormData((prev) => ({ ...prev, location: e.target.value }))}
                className="pl-10"
                required
              />
            </div>
          </div>

          {/* Contact Numbers */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="contactNumber">Primary Contact Number *</Label>
              <div className="relative">
                <Phone className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                <Input
                  id="contactNumber"
                  type="tel"
                  placeholder="03XX-XXXXXXX"
                  value={formData.contactNumber}
                  onChange={(e) => setFormData((prev) => ({ ...prev, contactNumber: e.target.value }))}
                  className="pl-10"
                  required
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="alternateNumber">Alternate Contact (Optional)</Label>
              <div className="relative">
                <Phone className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                <Input
                  id="alternateNumber"
                  type="tel"
                  placeholder="03XX-XXXXXXX"
                  value={formData.alternateNumber}
                  onChange={(e) => setFormData((prev) => ({ ...prev, alternateNumber: e.target.value }))}
                  className="pl-10"
                />
              </div>
            </div>
          </div>

          {/* Patient Condition */}
          <div className="space-y-2">
            <Label htmlFor="patientCondition">Patient Condition *</Label>
            <Select
              value={formData.patientCondition}
              onValueChange={(value) => setFormData((prev) => ({ ...prev, patientCondition: value }))}
              required
            >
              <SelectTrigger>
                <SelectValue placeholder="Select patient condition" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="conscious">Conscious and Alert</SelectItem>
                <SelectItem value="semiconscious">Semi-conscious</SelectItem>
                <SelectItem value="unconscious">Unconscious</SelectItem>
                <SelectItem value="stable">Stable but needs transport</SelectItem>
                <SelectItem value="critical">Critical condition</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Urgency Level */}
          <div className="space-y-2">
            <Label htmlFor="urgencyLevel">Urgency Level *</Label>
            <Select
              value={formData.urgencyLevel}
              onValueChange={(value) => setFormData((prev) => ({ ...prev, urgencyLevel: value }))}
              required
            >
              <SelectTrigger>
                <SelectValue placeholder="Select urgency level" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="critical">Critical - Life threatening</SelectItem>
                <SelectItem value="high">High - Urgent medical attention</SelectItem>
                <SelectItem value="medium">Medium - Needs medical care</SelectItem>
                <SelectItem value="low">Low - Non-emergency transport</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Location Type */}
          <div className="space-y-2">
            <Label htmlFor="isAtHospital">Current Location Type *</Label>
            <Select
              value={formData.isAtHospital}
              onValueChange={(value) => setFormData((prev) => ({ ...prev, isAtHospital: value }))}
              required
            >
              <SelectTrigger>
                <SelectValue placeholder="Select location type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="no">At Home/Other Location</SelectItem>
                <SelectItem value="yes">Already at Hospital</SelectItem>
                <SelectItem value="clinic">At Clinic/Medical Center</SelectItem>
                <SelectItem value="workplace">At Workplace</SelectItem>
                <SelectItem value="public">Public Place</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Description */}
          <div className="space-y-2">
            <Label htmlFor="description">Additional Details</Label>
            <Textarea
              id="description"
              placeholder="Describe the situation, symptoms, or any other relevant information..."
              value={formData.description}
              onChange={(e) => setFormData((prev) => ({ ...prev, description: e.target.value }))}
              rows={3}
            />
          </div>

          {/* Emergency Alert */}
          <Alert className="border-red-200 bg-red-50">
            <AlertTriangle className="h-4 w-4 text-red-600" />
            <AlertDescription className="text-red-800">
              <strong>For immediate life-threatening emergencies, call 1122 directly.</strong>
              <br />
              This form is for non-critical ambulance requests and hospital transport services.
            </AlertDescription>
          </Alert>

          {/* Submit Button */}
          <Button type="submit" className="w-full bg-red-600 hover:bg-red-700 text-white py-3" disabled={loading}>
            {loading ? (
              <>
                <Clock className="h-4 w-4 mr-2 animate-spin" />
                Submitting Request...
              </>
            ) : (
              <>
                <Ambulance className="h-4 w-4 mr-2" />
                Submit Ambulance Request
              </>
            )}
          </Button>
        </form>
      </CardContent>
    </Card>
  )
}
