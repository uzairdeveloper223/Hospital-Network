"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Plus, Search, Stethoscope, Mail, Phone, Clock, MapPin, CheckCircle, XCircle, Copy } from "lucide-react"
import { createDoctorAccount } from "@/lib/utils/auth"
import { database } from "@/lib/firebase"
import { ref, onValue, off } from "firebase/database"

export default function DoctorManagement() {
  const [doctors, setDoctors] = useState([])
  const [showAddForm, setShowAddForm] = useState(false)
  const [searchTerm, setSearchTerm] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [message, setMessage] = useState("")
  const [messageType, setMessageType] = useState("")

  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    specialization: "",
    qualification: "",
    room: "",
    availableTime: "",
    additionalDetails: "",
  })

  useEffect(() => {
    const doctorsRef = ref(database, "doctors")
    const unsubscribe = onValue(doctorsRef, (snapshot) => {
      if (snapshot.exists()) {
        const doctorsData = Object.entries(snapshot.val()).map(([key, value]) => ({
          id: key,
          ...value,
        }))
        setDoctors(doctorsData)
      } else {
        setDoctors([])
      }
    })

    return () => off(doctorsRef, "value", unsubscribe)
  }, [])

  const handleInputChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    })
  }

  const handleAddDoctor = async (e) => {
    e.preventDefault()
    setIsLoading(true)
    setMessage("")

    try {
      const result = await createDoctorAccount(formData)

      if (result.success) {
        setMessage(`Doctor added successfully! ID: ${result.doctorId}, Password: ${result.password}`)
        setMessageType("success")
        setFormData({
          name: "",
          email: "",
          phone: "",
          specialization: "",
          qualification: "",
          room: "",
          availableTime: "",
          additionalDetails: "",
        })
        setShowAddForm(false)
      } else {
        setMessage(result.error || "Failed to add doctor")
        setMessageType("error")
      }
    } catch (error) {
      setMessage("An error occurred while adding the doctor")
      setMessageType("error")
    } finally {
      setIsLoading(false)
    }
  }

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text)
  }

  const filteredDoctors = doctors.filter(
    (doctor) =>
      doctor.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      doctor.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      doctor.specialization?.toLowerCase().includes(searchTerm.toLowerCase()),
  )

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Doctor Management</h2>
          <p className="text-gray-600">Add and manage hospital doctors</p>
        </div>
        <Button onClick={() => setShowAddForm(!showAddForm)} className="flex items-center space-x-2">
          <Plus className="h-4 w-4" />
          <span>Add New Doctor</span>
        </Button>
      </div>

      {/* Success/Error Messages */}
      {message && (
        <Alert className={`${messageType === "success" ? "border-green-200 bg-green-50" : "border-red-200 bg-red-50"}`}>
          {messageType === "success" ? (
            <CheckCircle className="h-4 w-4 text-green-600" />
          ) : (
            <XCircle className="h-4 w-4 text-red-600" />
          )}
          <AlertDescription className={messageType === "success" ? "text-green-800" : "text-red-800"}>
            {message}
            {messageType === "success" && message.includes("ID:") && (
              <Button variant="ghost" size="sm" className="ml-2 h-6 px-2" onClick={() => copyToClipboard(message)}>
                <Copy className="h-3 w-3" />
              </Button>
            )}
          </AlertDescription>
        </Alert>
      )}

      {/* Add Doctor Form */}
      {showAddForm && (
        <Card>
          <CardHeader>
            <CardTitle>Add New Doctor</CardTitle>
            <CardDescription>
              Fill in the doctor's information. Login credentials will be generated automatically.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleAddDoctor} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="name">Full Name *</Label>
                  <Input
                    id="name"
                    name="name"
                    value={formData.name}
                    onChange={handleInputChange}
                    placeholder="Dr. John Smith"
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="email">Email Address *</Label>
                  <Input
                    id="email"
                    name="email"
                    type="email"
                    value={formData.email}
                    onChange={handleInputChange}
                    placeholder="doctor@hospital.com"
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="phone">Phone Number *</Label>
                  <Input
                    id="phone"
                    name="phone"
                    value={formData.phone}
                    onChange={handleInputChange}
                    placeholder="+92-300-1234567"
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="specialization">Specialization *</Label>
                  <Input
                    id="specialization"
                    name="specialization"
                    value={formData.specialization}
                    onChange={handleInputChange}
                    placeholder="Cardiology, Neurology, etc."
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="qualification">Qualification</Label>
                  <Input
                    id="qualification"
                    name="qualification"
                    value={formData.qualification}
                    onChange={handleInputChange}
                    placeholder="MBBS, MD, etc."
                  />
                </div>
                <div>
                  <Label htmlFor="room">Room Number</Label>
                  <Input
                    id="room"
                    name="room"
                    value={formData.room}
                    onChange={handleInputChange}
                    placeholder="Room 101"
                  />
                </div>
                <div>
                  <Label htmlFor="availableTime">Available Time</Label>
                  <Input
                    id="availableTime"
                    name="availableTime"
                    value={formData.availableTime}
                    onChange={handleInputChange}
                    placeholder="9:00 AM - 5:00 PM"
                  />
                </div>
              </div>
              <div>
                <Label htmlFor="additionalDetails">Additional Details</Label>
                <Input
                  id="additionalDetails"
                  name="additionalDetails"
                  value={formData.additionalDetails}
                  onChange={handleInputChange}
                  placeholder="Any additional information"
                />
              </div>
              <div className="flex space-x-4">
                <Button type="submit" disabled={isLoading} className="flex items-center space-x-2">
                  {isLoading ? "Adding..." : "Add Doctor"}
                </Button>
                <Button type="button" variant="outline" onClick={() => setShowAddForm(false)}>
                  Cancel
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
        <Input
          placeholder="Search doctors by name, email, or specialization..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="pl-10"
        />
      </div>

      {/* Doctors List */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredDoctors.map((doctor) => (
          <Card key={doctor.id} className="hover:shadow-lg transition-shadow">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <Stethoscope className="h-5 w-5 text-blue-600" />
                  <CardTitle className="text-lg">{doctor.name}</CardTitle>
                </div>
                <div className="flex space-x-1">
                  {doctor.isAvailable && (
                    <Badge variant="secondary" className="bg-green-100 text-green-800">
                      Available
                    </Badge>
                  )}
                  {doctor.isInHospital && (
                    <Badge variant="secondary" className="bg-blue-100 text-blue-800">
                      In Hospital
                    </Badge>
                  )}
                </div>
              </div>
              <CardDescription>{doctor.specialization}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center space-x-2 text-sm text-gray-600">
                <Mail className="h-4 w-4" />
                <span>{doctor.email}</span>
              </div>
              <div className="flex items-center space-x-2 text-sm text-gray-600">
                <Phone className="h-4 w-4" />
                <span>{doctor.phone}</span>
              </div>
              {doctor.room && (
                <div className="flex items-center space-x-2 text-sm text-gray-600">
                  <MapPin className="h-4 w-4" />
                  <span>{doctor.room}</span>
                </div>
              )}
              {doctor.availableTime && (
                <div className="flex items-center space-x-2 text-sm text-gray-600">
                  <Clock className="h-4 w-4" />
                  <span>{doctor.availableTime}</span>
                </div>
              )}
              <div className="pt-2">
                <p className="text-xs text-gray-500">
                  Doctor ID: <span className="font-mono font-medium">{doctor.doctorId}</span>
                </p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {filteredDoctors.length === 0 && (
        <Card>
          <CardContent className="text-center py-8">
            <Stethoscope className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-500">
              {searchTerm ? "No doctors found matching your search." : "No doctors added yet."}
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
