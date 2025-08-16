"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { UserCheck, Calendar, MessageSquare, Ambulance, Shield, Clock } from "lucide-react"
import { database } from "@/lib/firebase"
import { ref, onValue, off } from "firebase/database"
import AppointmentBooking from "./appointment-booking"
import PatientMessages from "./patient-messages"
import GovEmployeeVerification from "./gov-employee-verification"
import AmbulanceRequest from "./ambulance-request"
import PatientFeedback from "./patient-feedback"
import LabReports from "./lab-reports"
import UniversalSearch from "@/components/shared/universal-search"

export default function PatientDashboard({ patient }) {
  const [activeTab, setActiveTab] = useState("overview")
  const [appointments, setAppointments] = useState([])
  const [doctors, setDoctors] = useState([])
  const [stats, setStats] = useState({
    totalAppointments: 0,
    pendingAppointments: 0,
    completedAppointments: 0,
    unreadMessages: 0,
  })

  useEffect(() => {
    // Listen to appointments for this patient
    const appointmentsRef = ref(database, "appointments")
    const unsubscribeAppointments = onValue(appointmentsRef, (snapshot) => {
      if (snapshot.exists()) {
        const allAppointments = Object.entries(snapshot.val()).map(([key, value]) => ({
          id: key,
          ...value,
        }))
        const patientAppointments = allAppointments.filter((apt) => apt.deviceId === patient.deviceId)
        setAppointments(patientAppointments)

        setStats((prev) => ({
          ...prev,
          totalAppointments: patientAppointments.length,
          pendingAppointments: patientAppointments.filter((a) => a.status === "pending").length,
          completedAppointments: patientAppointments.filter((a) => a.status === "completed").length,
        }))
      }
    })

    // Listen to doctors
    const doctorsRef = ref(database, "doctors")
    const unsubscribeDoctors = onValue(doctorsRef, (snapshot) => {
      if (snapshot.exists()) {
        const doctorsData = Object.entries(snapshot.val()).map(([key, value]) => ({
          id: key,
          ...value,
        }))
        setDoctors(doctorsData)
      }
    })

    return () => {
      off(appointmentsRef, "value", unsubscribeAppointments)
      off(doctorsRef, "value", unsubscribeDoctors)
    }
  }, [patient.deviceId])

  const handleSearchResult = (type, item) => {
    // Navigate to appropriate tab based on search result type
    const tabMapping = {
      doctors: "appointments", // Doctors are viewed when booking appointments
      appointments: "appointments",
      messages: "messages",
      labReports: "lab-reports",
      prescriptions: "lab-reports", // Prescriptions can be viewed in lab reports section
    }

    if (tabMapping[type]) {
      setActiveTab(tabMapping[type])
    }
  }

  const StatCard = ({ title, value, icon: Icon, color, description }) => (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium text-gray-600">{title}</CardTitle>
        <Icon className={`h-4 w-4 ${color}`} />
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold text-gray-900">{value}</div>
        {description && <p className="text-xs text-gray-500 mt-1">{description}</p>}
      </CardContent>
    </Card>
  )

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <UserCheck className="h-8 w-8 text-green-600" />
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Welcome, {patient.name}</h1>
                <p className="text-sm text-gray-500">Patient Dashboard</p>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              {patient.isGovEmployee && (
                <Badge variant="secondary" className="bg-blue-100 text-blue-800">
                  <Shield className="h-3 w-3 mr-1" />
                  Gov Employee
                </Badge>
              )}
              <div className="text-right">
                <p className="text-sm font-medium text-gray-900">{patient.phone}</p>
                <p className="text-xs text-gray-500">Device ID: {patient.deviceId?.slice(-6)}</p>
              </div>
            </div>
          </div>
          <div className="mt-4">
            <UniversalSearch
              onResultSelect={handleSearchResult}
              placeholder="Search doctors, your appointments, lab reports..."
              filters={{ exclude: ["beds", "inventory", "certificates"] }}
            />
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8">
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-7">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="appointments">Appointments</TabsTrigger>
            <TabsTrigger value="messages">Messages</TabsTrigger>
            <TabsTrigger value="feedback">Feedback</TabsTrigger>
            <TabsTrigger value="lab-reports">Lab Reports</TabsTrigger>
            <TabsTrigger value="verification">Verification</TabsTrigger>
            <TabsTrigger value="emergency">Emergency</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-6">
            {/* Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <StatCard
                title="Total Appointments"
                value={stats.totalAppointments}
                icon={Calendar}
                color="text-blue-600"
                description="All time"
              />
              <StatCard
                title="Pending"
                value={stats.pendingAppointments}
                icon={Clock}
                color="text-yellow-600"
                description="Awaiting approval"
              />
              <StatCard
                title="Completed"
                value={stats.completedAppointments}
                icon={UserCheck}
                color="text-green-600"
                description="Finished visits"
              />
              <StatCard
                title="Messages"
                value={stats.unreadMessages}
                icon={MessageSquare}
                color="text-purple-600"
                description="Unread messages"
              />
            </div>

            {/* Quick Actions */}
            <Card>
              <CardHeader>
                <CardTitle>Quick Actions</CardTitle>
                <CardDescription>Common tasks and services</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <Button
                    className="flex items-center space-x-2 h-12 bg-blue-600 hover:bg-blue-700"
                    onClick={() => setActiveTab("appointments")}
                  >
                    <Calendar className="h-4 w-4" />
                    <span>Book Appointment</span>
                  </Button>
                  <Button
                    variant="outline"
                    className="flex items-center space-x-2 h-12 bg-transparent"
                    onClick={() => setActiveTab("messages")}
                  >
                    <MessageSquare className="h-4 w-4" />
                    <span>Message Admin</span>
                  </Button>
                  <Button
                    variant="outline"
                    className="flex items-center space-x-2 h-12 border-red-200 text-red-600 hover:bg-red-50 bg-transparent"
                    onClick={() => setActiveTab("emergency")}
                  >
                    <Ambulance className="h-4 w-4" />
                    <span>Emergency Help</span>
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Recent Appointments */}
            <Card>
              <CardHeader>
                <CardTitle>Recent Appointments</CardTitle>
                <CardDescription>Your latest appointment history</CardDescription>
              </CardHeader>
              <CardContent>
                {appointments.length > 0 ? (
                  <div className="space-y-3">
                    {appointments.slice(0, 3).map((appointment) => {
                      const doctor = doctors.find((d) => d.uid === appointment.doctorId)
                      return (
                        <div
                          key={appointment.id}
                          className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                        >
                          <div className="flex items-center space-x-3">
                            <div className="w-2 h-2 bg-blue-600 rounded-full"></div>
                            <div>
                              <p className="font-medium text-gray-900">{doctor?.name || "Unknown Doctor"}</p>
                              <p className="text-sm text-gray-500">{appointment.appointmentReason}</p>
                            </div>
                          </div>
                          <div className="text-right">
                            <Badge
                              variant="secondary"
                              className={
                                appointment.status === "approved"
                                  ? "bg-green-100 text-green-800"
                                  : appointment.status === "pending"
                                    ? "bg-yellow-100 text-yellow-800"
                                    : "bg-red-100 text-red-800"
                              }
                            >
                              {appointment.status}
                            </Badge>
                            <p className="text-xs text-gray-500 mt-1">
                              {new Date(appointment.createdAt).toLocaleDateString()}
                            </p>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <Calendar className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-500">No appointments yet. Book your first appointment!</p>
                    <Button className="mt-4" onClick={() => setActiveTab("appointments")}>
                      Book Appointment
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="appointments">
            <AppointmentBooking patient={patient} doctors={doctors} />
          </TabsContent>

          <TabsContent value="messages">
            <PatientMessages patient={patient} />
          </TabsContent>

          <TabsContent value="feedback">
            <PatientFeedback patient={patient} />
          </TabsContent>

          <TabsContent value="lab-reports">
            <LabReports patient={patient} />
          </TabsContent>

          <TabsContent value="verification">
            <GovEmployeeVerification patient={patient} />
          </TabsContent>

          <TabsContent value="emergency">
            <AmbulanceRequest patient={patient} />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}
