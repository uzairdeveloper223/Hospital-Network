"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Badge } from "@/components/ui/badge"
import { Stethoscope, Clock, MapPin, Phone, AlertTriangle, CheckCircle, Calendar } from "lucide-react"
import { database } from "@/lib/firebase"
import { ref, push } from "firebase/database"

export default function AppointmentBooking({ patient, doctors }) {
  const [selectedDoctor, setSelectedDoctor] = useState("")
  const [appointmentData, setAppointmentData] = useState({
    reason: "",
    isEmergency: false,
    location: "hospital", // hospital or home
    additionalNotes: "",
  })
  const [isLoading, setIsLoading] = useState(false)
  const [message, setMessage] = useState("")
  const [messageType, setMessageType] = useState("")

  const availableDoctors = doctors.filter((doctor) => doctor.isAvailable)

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target
    setAppointmentData({
      ...appointmentData,
      [name]: type === "checkbox" ? checked : value,
    })
  }

  const handleBookAppointment = async (e) => {
    e.preventDefault()
    setIsLoading(true)
    setMessage("")

    try {
      const doctor = doctors.find((d) => d.uid === selectedDoctor)

      const appointmentRequest = {
        deviceId: patient.deviceId,
        patientName: patient.name,
        patientPhone: patient.phone,
        doctorId: selectedDoctor,
        doctorName: doctor.name,
        appointmentReason: appointmentData.reason,
        isEmergency: appointmentData.isEmergency,
        location: appointmentData.location,
        additionalNotes: appointmentData.additionalNotes,
        isGovEmployee: patient.isGovEmployee || false,
        status: "pending",
        createdAt: new Date().toISOString(),
        appointmentTime: null,
        approvedAt: null,
      }

      await push(ref(database, "appointments"), appointmentRequest)

      setMessage("Appointment request sent successfully! The doctor will review and approve your request.")
      setMessageType("success")

      // Reset form
      setSelectedDoctor("")
      setAppointmentData({
        reason: "",
        isEmergency: false,
        location: "hospital",
        additionalNotes: "",
      })
    } catch (error) {
      console.error("Error booking appointment:", error)
      setMessage("Failed to book appointment. Please try again.")
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
            <Calendar className="h-5 w-5 text-blue-600" />
            <span>Book New Appointment</span>
          </CardTitle>
          <CardDescription>Select a doctor and provide appointment details</CardDescription>
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

          <form onSubmit={handleBookAppointment} className="space-y-6">
            {/* Doctor Selection */}
            <div>
              <Label htmlFor="doctor">Select Doctor *</Label>
              <Select value={selectedDoctor} onValueChange={setSelectedDoctor} required>
                <SelectTrigger className="mt-1">
                  <SelectValue placeholder="Choose a doctor" />
                </SelectTrigger>
                <SelectContent>
                  {availableDoctors.map((doctor) => (
                    <SelectItem key={doctor.uid} value={doctor.uid}>
                      <div className="flex items-center space-x-2">
                        <Stethoscope className="h-4 w-4 text-blue-600" />
                        <div>
                          <p className="font-medium">{doctor.name}</p>
                          <p className="text-xs text-gray-500">{doctor.specialization}</p>
                        </div>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {availableDoctors.length === 0 && (
                <p className="text-sm text-red-600 mt-1">No doctors are currently available</p>
              )}
            </div>

            {/* Selected Doctor Info */}
            {selectedDoctor && (
              <Card className="bg-blue-50 border-blue-200">
                <CardContent className="pt-4">
                  {(() => {
                    const doctor = doctors.find((d) => d.uid === selectedDoctor)
                    return (
                      <div className="space-y-2">
                        <div className="flex items-center justify-between">
                          <h4 className="font-medium text-blue-900">{doctor.name}</h4>
                          <div className="flex space-x-1">
                            {doctor.isInHospital && (
                              <Badge variant="secondary" className="bg-green-100 text-green-800 text-xs">
                                In Hospital
                              </Badge>
                            )}
                          </div>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm text-blue-800">
                          <div className="flex items-center space-x-2">
                            <Stethoscope className="h-3 w-3" />
                            <span>{doctor.specialization}</span>
                          </div>
                          {doctor.room && (
                            <div className="flex items-center space-x-2">
                              <MapPin className="h-3 w-3" />
                              <span>{doctor.room}</span>
                            </div>
                          )}
                          {doctor.phone && (
                            <div className="flex items-center space-x-2">
                              <Phone className="h-3 w-3" />
                              <span>{doctor.phone}</span>
                            </div>
                          )}
                          {doctor.availableTime && (
                            <div className="flex items-center space-x-2">
                              <Clock className="h-3 w-3" />
                              <span>{doctor.availableTime}</span>
                            </div>
                          )}
                        </div>
                      </div>
                    )
                  })()}
                </CardContent>
              </Card>
            )}

            {/* Appointment Details */}
            <div>
              <Label htmlFor="reason">Reason for Appointment *</Label>
              <Input
                id="reason"
                name="reason"
                value={appointmentData.reason}
                onChange={handleInputChange}
                placeholder="Brief description of your medical concern"
                required
                className="mt-1"
              />
            </div>

            <div>
              <Label htmlFor="location">Appointment Location *</Label>
              <Select
                value={appointmentData.location}
                onValueChange={(value) => setAppointmentData({ ...appointmentData, location: value })}
              >
                <SelectTrigger className="mt-1">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="hospital">At Hospital</SelectItem>
                  <SelectItem value="home">Home Visit</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="flex items-center space-x-2">
              <input
                type="checkbox"
                id="isEmergency"
                name="isEmergency"
                checked={appointmentData.isEmergency}
                onChange={handleInputChange}
                className="rounded border-gray-300"
              />
              <Label htmlFor="isEmergency" className="flex items-center space-x-2 cursor-pointer">
                <AlertTriangle className="h-4 w-4 text-red-600" />
                <span>This is an emergency appointment</span>
              </Label>
            </div>

            <div>
              <Label htmlFor="additionalNotes">Additional Notes</Label>
              <Textarea
                id="additionalNotes"
                name="additionalNotes"
                value={appointmentData.additionalNotes}
                onChange={handleInputChange}
                placeholder="Any additional information for the doctor"
                className="mt-1"
                rows={3}
              />
            </div>

            <Button
              type="submit"
              className="w-full bg-blue-600 hover:bg-blue-700 text-white"
              disabled={isLoading || !selectedDoctor || !appointmentData.reason.trim()}
            >
              {isLoading ? "Booking Appointment..." : "Book Appointment"}
            </Button>
          </form>
        </CardContent>
      </Card>

      {/* Available Doctors List */}
      <Card>
        <CardHeader>
          <CardTitle>Available Doctors</CardTitle>
          <CardDescription>Currently available doctors in the hospital</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {availableDoctors.map((doctor) => (
              <div key={doctor.uid} className="p-4 border rounded-lg hover:bg-gray-50">
                <div className="flex items-center justify-between mb-2">
                  <h4 className="font-medium text-gray-900">{doctor.name}</h4>
                  <div className="flex space-x-1">
                    {doctor.isInHospital && (
                      <Badge variant="secondary" className="bg-green-100 text-green-800 text-xs">
                        Available
                      </Badge>
                    )}
                  </div>
                </div>
                <p className="text-sm text-gray-600 mb-2">{doctor.specialization}</p>
                <div className="space-y-1 text-xs text-gray-500">
                  {doctor.room && (
                    <div className="flex items-center space-x-1">
                      <MapPin className="h-3 w-3" />
                      <span>{doctor.room}</span>
                    </div>
                  )}
                  {doctor.availableTime && (
                    <div className="flex items-center space-x-1">
                      <Clock className="h-3 w-3" />
                      <span>{doctor.availableTime}</span>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
          {availableDoctors.length === 0 && (
            <div className="text-center py-8">
              <Stethoscope className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-500">No doctors are currently available</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
