"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { Stethoscope, Calendar, Users, Clock, LogOut, Settings, Bell } from "lucide-react"
import { database } from "@/lib/firebase"
import { ref, onValue, off, get } from "firebase/database"
import AppointmentManagement from "./appointment-management"
import DoctorProfile from "./doctor-profile"
import DoctorSchedule from "./doctor-schedule"
import PatientRecords from "./patient-records"
import PrescriptionManagement from "./prescription-management"
import MedicalCertificates from "./medical-certificates"
import DoctorAnalytics from "./doctor-analytics"
import UniversalSearch from "@/components/shared/universal-search"

export default function DoctorDashboard({ onLogout }) {
  const [doctor, setDoctor] = useState(null)
  const [appointments, setAppointments] = useState([])
  const [stats, setStats] = useState({
    pendingAppointments: 0,
    todayAppointments: 0,
    totalPatients: 0,
    emergencyAppointments: 0,
  })
  const [activeTab, setActiveTab] = useState("overview")
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const loadDoctorData = async () => {
      try {
        const doctorId = localStorage.getItem("doctorId")
        if (!doctorId) return

        const doctorIdsRef = ref(database, `doctorIds/${doctorId}`)
        const doctorIdSnapshot = await get(doctorIdsRef)

        if (doctorIdSnapshot.exists()) {
          const { uid } = doctorIdSnapshot.val()

          const doctorRef = ref(database, `doctors/${uid}`)
          const unsubscribeDoctor = onValue(doctorRef, (snapshot) => {
            if (snapshot.exists()) {
              setDoctor({ uid, ...snapshot.val() })
            }
          })

          const appointmentsRef = ref(database, "appointments")
          const unsubscribeAppointments = onValue(appointmentsRef, (snapshot) => {
            if (snapshot.exists()) {
              const allAppointments = Object.entries(snapshot.val()).map(([key, value]) => ({
                id: key,
                ...value,
              }))
              const doctorAppointments = allAppointments.filter((apt) => apt.doctorId === uid)
              setAppointments(doctorAppointments)

              const today = new Date().toDateString()
              setStats({
                pendingAppointments: doctorAppointments.filter((a) => a.status === "pending").length,
                todayAppointments: doctorAppointments.filter(
                  (a) => a.appointmentTime && new Date(a.appointmentTime).toDateString() === today,
                ).length,
                totalPatients: new Set(doctorAppointments.map((a) => a.deviceId)).size,
                emergencyAppointments: doctorAppointments.filter((a) => a.isEmergency && a.status === "pending").length,
              })
            }
          })

          setIsLoading(false)

          return () => {
            off(doctorRef, "value", unsubscribeDoctor)
            off(appointmentsRef, "value", unsubscribeAppointments)
          }
        }
      } catch (error) {
        console.error("Error loading doctor data:", error)
        setIsLoading(false)
      }
    }

    loadDoctorData()
  }, [])

  const StatCard = ({ title, value, icon: Icon, color, description, urgent = false }) => (
    <Card className={urgent ? "border-red-200 bg-red-50" : ""}>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className={`text-sm font-medium ${urgent ? "text-red-800" : "text-gray-600"}`}>{title}</CardTitle>
        <Icon className={`h-4 w-4 ${color}`} />
      </CardHeader>
      <CardContent>
        <div className={`text-2xl font-bold ${urgent ? "text-red-900" : "text-gray-900"}`}>{value}</div>
        {description && <p className={`text-xs mt-1 ${urgent ? "text-red-600" : "text-gray-500"}`}>{description}</p>}
      </CardContent>
    </Card>
  )

  const handleSearchResult = (type, item) => {
    // Navigate to appropriate tab based on search result type
    const tabMapping = {
      patients: "patients",
      appointments: "appointments",
      prescriptions: "prescriptions",
      certificates: "certificates",
      labReports: "patients", // Lab reports are viewed in patient records
    }

    if (tabMapping[type]) {
      setActiveTab(tabMapping[type])
    }
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading your dashboard...</p>
        </div>
      </div>
    )
  }

  if (!doctor) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Card className="max-w-md">
          <CardContent className="text-center py-8">
            <p className="text-red-600 mb-4">Unable to load doctor profile</p>
            <Button onClick={onLogout}>Return to Login</Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-white shadow-sm border-b">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <Stethoscope className="h-8 w-8 text-blue-600" />
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Dr. {doctor.name}</h1>
                <p className="text-sm text-gray-500">{doctor.specialization}</p>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              {stats.emergencyAppointments > 0 && (
                <Badge variant="destructive" className="animate-pulse">
                  <Bell className="h-3 w-3 mr-1" />
                  {stats.emergencyAppointments} Emergency
                </Badge>
              )}
              <div className="flex items-center space-x-2">
                <Badge
                  variant="secondary"
                  className={doctor.isAvailable ? "bg-green-100 text-green-800" : "bg-gray-100 text-gray-800"}
                >
                  {doctor.isAvailable ? "Available" : "Unavailable"}
                </Badge>
                <Badge
                  variant="secondary"
                  className={doctor.isInHospital ? "bg-blue-100 text-blue-800" : "bg-gray-100 text-gray-800"}
                >
                  {doctor.isInHospital ? "In Hospital" : "Away"}
                </Badge>
              </div>
              <Button variant="outline" onClick={onLogout} className="flex items-center space-x-2 bg-transparent">
                <LogOut className="h-4 w-4" />
                <span>Logout</span>
              </Button>
            </div>
          </div>
          <div className="mt-4">
            <UniversalSearch
              onResultSelect={handleSearchResult}
              placeholder="Search your patients, appointments, prescriptions..."
              filters={{ exclude: ["doctors", "beds", "inventory"] }}
            />
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8">
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-8">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="appointments" className="relative">
              Appointments
              {stats.pendingAppointments > 0 && (
                <Badge variant="destructive" className="absolute -top-2 -right-2 h-5 w-5 p-0 text-xs">
                  {stats.pendingAppointments}
                </Badge>
              )}
            </TabsTrigger>
            <TabsTrigger value="patients">Patients</TabsTrigger>
            <TabsTrigger value="prescriptions">Prescriptions</TabsTrigger>
            <TabsTrigger value="certificates">Certificates</TabsTrigger>
            <TabsTrigger value="analytics">Analytics</TabsTrigger>
            <TabsTrigger value="schedule">Schedule</TabsTrigger>
            <TabsTrigger value="profile">Profile</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <StatCard
                title="Pending Requests"
                value={stats.pendingAppointments}
                icon={Clock}
                color="text-yellow-600"
                description="Awaiting your approval"
              />
              <StatCard
                title="Today's Appointments"
                value={stats.todayAppointments}
                icon={Calendar}
                color="text-blue-600"
                description="Scheduled for today"
              />
              <StatCard
                title="Total Patients"
                value={stats.totalPatients}
                icon={Users}
                color="text-green-600"
                description="Unique patients served"
              />
              <StatCard
                title="Emergency Requests"
                value={stats.emergencyAppointments}
                icon={Bell}
                color="text-red-600"
                description="Urgent appointments"
                urgent={stats.emergencyAppointments > 0}
              />
            </div>

            <Card>
              <CardHeader>
                <CardTitle>Quick Actions</CardTitle>
                <CardDescription>Common tasks and settings</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <Button
                    className="flex items-center space-x-2 h-12"
                    onClick={() => setActiveTab("appointments")}
                    disabled={stats.pendingAppointments === 0}
                  >
                    <Calendar className="h-4 w-4" />
                    <span>Review Appointments ({stats.pendingAppointments})</span>
                  </Button>
                  <Button
                    variant="outline"
                    className="flex items-center space-x-2 h-12 bg-transparent"
                    onClick={() => setActiveTab("schedule")}
                  >
                    <Clock className="h-4 w-4" />
                    <span>Manage Schedule</span>
                  </Button>
                  <Button
                    variant="outline"
                    className="flex items-center space-x-2 h-12 bg-transparent"
                    onClick={() => setActiveTab("profile")}
                  >
                    <Settings className="h-4 w-4" />
                    <span>Update Profile</span>
                  </Button>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Recent Appointment Requests</CardTitle>
                <CardDescription>Latest patient appointment requests</CardDescription>
              </CardHeader>
              <CardContent>
                {appointments.filter((a) => a.status === "pending").length > 0 ? (
                  <div className="space-y-3">
                    {appointments
                      .filter((a) => a.status === "pending")
                      .slice(0, 5)
                      .map((appointment) => (
                        <div
                          key={appointment.id}
                          className={`flex items-center justify-between p-3 rounded-lg ${
                            appointment.isEmergency ? "bg-red-50 border border-red-200" : "bg-gray-50"
                          }`}
                        >
                          <div className="flex items-center space-x-3">
                            {appointment.isEmergency && <Bell className="h-4 w-4 text-red-600" />}
                            <div>
                              <p className="font-medium text-gray-900">{appointment.patientName}</p>
                              <p className="text-sm text-gray-600">{appointment.appointmentReason}</p>
                              <div className="flex items-center space-x-2 mt-1">
                                {appointment.isGovEmployee && (
                                  <Badge variant="secondary" className="bg-blue-100 text-blue-800 text-xs">
                                    Gov Employee
                                  </Badge>
                                )}
                                {appointment.isEmergency && (
                                  <Badge variant="destructive" className="text-xs">
                                    Emergency
                                  </Badge>
                                )}
                                <Badge variant="secondary" className="bg-gray-100 text-gray-800 text-xs">
                                  {appointment.location === "home" ? "Home Visit" : "Hospital"}
                                </Badge>
                              </div>
                            </div>
                          </div>
                          <div className="text-right">
                            <p className="text-xs text-gray-500">
                              {new Date(appointment.createdAt).toLocaleDateString()}
                            </p>
                            <p className="text-xs text-gray-500">{appointment.patientPhone}</p>
                          </div>
                        </div>
                      ))}
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <Calendar className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-500">No pending appointment requests</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="appointments">
            <AppointmentManagement doctor={doctor} appointments={appointments} />
          </TabsContent>

          <TabsContent value="patients">
            <PatientRecords doctor={doctor} />
          </TabsContent>

          <TabsContent value="prescriptions">
            <PrescriptionManagement doctor={doctor} />
          </TabsContent>

          <TabsContent value="certificates">
            <MedicalCertificates doctor={doctor} />
          </TabsContent>

          <TabsContent value="analytics">
            <DoctorAnalytics doctor={doctor} />
          </TabsContent>

          <TabsContent value="schedule">
            <DoctorSchedule doctor={doctor} />
          </TabsContent>

          <TabsContent value="profile">
            <DoctorProfile doctor={doctor} />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}
