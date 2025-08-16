"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Calendar, Clock, User, Phone, MapPin, Bell, CheckCircle, XCircle, Shield, AlertTriangle } from "lucide-react"
import { database } from "@/lib/firebase"
import { ref, update } from "firebase/database"

export default function AppointmentManagement({ doctor, appointments }) {
  const [selectedAppointment, setSelectedAppointment] = useState(null)
  const [appointmentTime, setAppointmentTime] = useState("")
  const [appointmentDate, setAppointmentDate] = useState("")
  const [doctorNotes, setDoctorNotes] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [message, setMessage] = useState("")
  const [messageType, setMessageType] = useState("")

  const pendingAppointments = appointments.filter((a) => a.status === "pending")
  const approvedAppointments = appointments.filter((a) => a.status === "approved")
  const completedAppointments = appointments.filter((a) => a.status === "completed")
  const rejectedAppointments = appointments.filter((a) => a.status === "rejected")

  const handleApproveAppointment = async (appointmentId) => {
    if (!appointmentDate || !appointmentTime) {
      setMessage("Please select both date and time for the appointment")
      setMessageType("error")
      return
    }

    setIsLoading(true)
    setMessage("")

    try {
      const appointmentDateTime = new Date(`${appointmentDate}T${appointmentTime}`)

      await update(ref(database, `appointments/${appointmentId}`), {
        status: "approved",
        appointmentTime: appointmentDateTime.toISOString(),
        approvedAt: new Date().toISOString(),
        doctorNotes: doctorNotes || "",
        approvedBy: doctor.uid,
      })

      setMessage("Appointment approved successfully!")
      setMessageType("success")
      setSelectedAppointment(null)
      setAppointmentDate("")
      setAppointmentTime("")
      setDoctorNotes("")
    } catch (error) {
      console.error("Error approving appointment:", error)
      setMessage("Failed to approve appointment")
      setMessageType("error")
    } finally {
      setIsLoading(false)
    }
  }

  const handleRejectAppointment = async (appointmentId, reason) => {
    setIsLoading(true)
    setMessage("")

    try {
      await update(ref(database, `appointments/${appointmentId}`), {
        status: "rejected",
        rejectedAt: new Date().toISOString(),
        rejectionReason: reason || "No reason provided",
        rejectedBy: doctor.uid,
      })

      setMessage("Appointment rejected")
      setMessageType("success")
      setSelectedAppointment(null)
    } catch (error) {
      console.error("Error rejecting appointment:", error)
      setMessage("Failed to reject appointment")
      setMessageType("error")
    } finally {
      setIsLoading(false)
    }
  }

  const handleCompleteAppointment = async (appointmentId) => {
    setIsLoading(true)
    setMessage("")

    try {
      await update(ref(database, `appointments/${appointmentId}`), {
        status: "completed",
        completedAt: new Date().toISOString(),
        completedBy: doctor.uid,
      })

      setMessage("Appointment marked as completed")
      setMessageType("success")
    } catch (error) {
      console.error("Error completing appointment:", error)
      setMessage("Failed to complete appointment")
      setMessageType("error")
    } finally {
      setIsLoading(false)
    }
  }

  const AppointmentCard = ({ appointment, showActions = false, status }) => (
    <Card className={`${appointment.isEmergency ? "border-red-200 bg-red-50" : ""}`}>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <User className="h-4 w-4 text-gray-600" />
            <CardTitle className="text-lg">{appointment.patientName}</CardTitle>
          </div>
          <div className="flex space-x-1">
            {appointment.isEmergency && (
              <Badge variant="destructive" className="text-xs">
                <Bell className="h-3 w-3 mr-1" />
                Emergency
              </Badge>
            )}
            {appointment.isGovEmployee && (
              <Badge variant="secondary" className="bg-blue-100 text-blue-800 text-xs">
                <Shield className="h-3 w-3 mr-1" />
                Gov Employee
              </Badge>
            )}
            <Badge
              variant="secondary"
              className={`text-xs ${
                status === "approved"
                  ? "bg-green-100 text-green-800"
                  : status === "rejected"
                    ? "bg-red-100 text-red-800"
                    : status === "completed"
                      ? "bg-blue-100 text-blue-800"
                      : "bg-yellow-100 text-yellow-800"
              }`}
            >
              {status}
            </Badge>
          </div>
        </div>
        <CardDescription>{appointment.appointmentReason}</CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm text-gray-600">
          <div className="flex items-center space-x-2">
            <Phone className="h-3 w-3" />
            <span>{appointment.patientPhone}</span>
          </div>
          <div className="flex items-center space-x-2">
            <MapPin className="h-3 w-3" />
            <span>{appointment.location === "home" ? "Home Visit" : "Hospital Visit"}</span>
          </div>
          <div className="flex items-center space-x-2">
            <Calendar className="h-3 w-3" />
            <span>{new Date(appointment.createdAt).toLocaleDateString()}</span>
          </div>
          {appointment.appointmentTime && (
            <div className="flex items-center space-x-2">
              <Clock className="h-3 w-3" />
              <span>{new Date(appointment.appointmentTime).toLocaleString()}</span>
            </div>
          )}
        </div>

        {appointment.additionalNotes && (
          <div className="p-3 bg-gray-50 rounded-lg">
            <p className="text-sm text-gray-700">
              <strong>Patient Notes:</strong> {appointment.additionalNotes}
            </p>
          </div>
        )}

        {appointment.doctorNotes && (
          <div className="p-3 bg-blue-50 rounded-lg">
            <p className="text-sm text-blue-700">
              <strong>Doctor Notes:</strong> {appointment.doctorNotes}
            </p>
          </div>
        )}

        {showActions && (
          <div className="flex space-x-2 pt-2">
            <Button
              size="sm"
              className="bg-green-600 hover:bg-green-700"
              onClick={() => setSelectedAppointment(appointment)}
            >
              <CheckCircle className="h-3 w-3 mr-1" />
              Approve
            </Button>
            <Button
              size="sm"
              variant="outline"
              className="border-red-200 text-red-600 hover:bg-red-50 bg-transparent"
              onClick={() => handleRejectAppointment(appointment.id, "Doctor unavailable")}
              disabled={isLoading}
            >
              <XCircle className="h-3 w-3 mr-1" />
              Reject
            </Button>
          </div>
        )}

        {status === "approved" && (
          <Button
            size="sm"
            variant="outline"
            className="w-full bg-transparent"
            onClick={() => handleCompleteAppointment(appointment.id)}
            disabled={isLoading}
          >
            Mark as Completed
          </Button>
        )}
      </CardContent>
    </Card>
  )

  return (
    <div className="space-y-6">
      {message && (
        <Alert className={`${messageType === "success" ? "border-green-200 bg-green-50" : "border-red-200 bg-red-50"}`}>
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

      <Tabs defaultValue="pending">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="pending" className="relative">
            Pending ({pendingAppointments.length})
            {pendingAppointments.length > 0 && (
              <Badge variant="destructive" className="absolute -top-2 -right-2 h-5 w-5 p-0 text-xs">
                {pendingAppointments.length}
              </Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="approved">Approved ({approvedAppointments.length})</TabsTrigger>
          <TabsTrigger value="completed">Completed ({completedAppointments.length})</TabsTrigger>
          <TabsTrigger value="rejected">Rejected ({rejectedAppointments.length})</TabsTrigger>
        </TabsList>

        <TabsContent value="pending" className="space-y-4">
          {pendingAppointments.length > 0 ? (
            pendingAppointments
              .sort((a, b) => {
                // Sort emergency appointments first
                if (a.isEmergency && !b.isEmergency) return -1
                if (!a.isEmergency && b.isEmergency) return 1
                // Then sort by government employee status
                if (a.isGovEmployee && !b.isGovEmployee) return -1
                if (!a.isGovEmployee && b.isGovEmployee) return 1
                // Finally sort by creation date
                return new Date(b.createdAt) - new Date(a.createdAt)
              })
              .map((appointment) => (
                <AppointmentCard key={appointment.id} appointment={appointment} showActions={true} status="pending" />
              ))
          ) : (
            <Card>
              <CardContent className="text-center py-8">
                <Calendar className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-500">No pending appointment requests</p>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="approved" className="space-y-4">
          {approvedAppointments.length > 0 ? (
            approvedAppointments.map((appointment) => (
              <AppointmentCard key={appointment.id} appointment={appointment} status="approved" />
            ))
          ) : (
            <Card>
              <CardContent className="text-center py-8">
                <CheckCircle className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-500">No approved appointments</p>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="completed" className="space-y-4">
          {completedAppointments.length > 0 ? (
            completedAppointments.map((appointment) => (
              <AppointmentCard key={appointment.id} appointment={appointment} status="completed" />
            ))
          ) : (
            <Card>
              <CardContent className="text-center py-8">
                <CheckCircle className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-500">No completed appointments</p>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="rejected" className="space-y-4">
          {rejectedAppointments.length > 0 ? (
            rejectedAppointments.map((appointment) => (
              <AppointmentCard key={appointment.id} appointment={appointment} status="rejected" />
            ))
          ) : (
            <Card>
              <CardContent className="text-center py-8">
                <XCircle className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-500">No rejected appointments</p>
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>

      {/* Appointment Approval Modal */}
      {selectedAppointment && (
        <Card className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-md w-full max-h-[90vh] overflow-y-auto">
            <CardHeader>
              <CardTitle>Schedule Appointment</CardTitle>
              <CardDescription>Set date and time for {selectedAppointment.patientName}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="appointmentDate">Appointment Date *</Label>
                <Input
                  id="appointmentDate"
                  type="date"
                  value={appointmentDate}
                  onChange={(e) => setAppointmentDate(e.target.value)}
                  min={new Date().toISOString().split("T")[0]}
                  required
                />
              </div>

              <div>
                <Label htmlFor="appointmentTime">Appointment Time *</Label>
                <Input
                  id="appointmentTime"
                  type="time"
                  value={appointmentTime}
                  onChange={(e) => setAppointmentTime(e.target.value)}
                  required
                />
              </div>

              <div>
                <Label htmlFor="doctorNotes">Doctor Notes (Optional)</Label>
                <Textarea
                  id="doctorNotes"
                  value={doctorNotes}
                  onChange={(e) => setDoctorNotes(e.target.value)}
                  placeholder="Any special instructions or notes for the patient"
                  rows={3}
                />
              </div>

              <div className="flex space-x-2">
                <Button
                  className="flex-1 bg-green-600 hover:bg-green-700"
                  onClick={() => handleApproveAppointment(selectedAppointment.id)}
                  disabled={isLoading || !appointmentDate || !appointmentTime}
                >
                  {isLoading ? "Approving..." : "Approve Appointment"}
                </Button>
                <Button variant="outline" onClick={() => setSelectedAppointment(null)} className="bg-transparent">
                  Cancel
                </Button>
              </div>
            </CardContent>
          </div>
        </Card>
      )}
    </div>
  )
}
