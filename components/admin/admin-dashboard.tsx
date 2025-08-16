"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Users, Stethoscope, Calendar, Ambulance, LogOut, Shield, Plus, Eye, AlertTriangle } from "lucide-react"
import { database } from "@/lib/firebase"
import { ref, onValue, off } from "firebase/database"
import DoctorManagement from "./doctor-management"
import SettingsPanel from "./settings-panel"
import AdminMessages from "./admin-messages"
import AmbulanceManagement from "./ambulance-management"
import BedManagement from "./bed-management"
import InventoryManagement from "./inventory-management"
import { Badge } from "@/components/ui/badge"
import UniversalSearch from "@/components/shared/universal-search"

export default function AdminDashboard({ onLogout }) {
  const [stats, setStats] = useState({
    totalDoctors: 0,
    availableDoctors: 0,
    totalPatients: 0,
    pendingAppointments: 0,
    emergencyRequests: 0,
    unreadMessages: 0,
  })

  const [recentActivity, setRecentActivity] = useState([])
  const [activeTab, setActiveTab] = useState("overview")

  useEffect(() => {
    // Listen to real-time data
    const doctorsRef = ref(database, "doctors")
    const appointmentsRef = ref(database, "appointments")
    const ambulanceRef = ref(database, "ambulanceRequests")
    const messagesRef = ref(database, "messages")

    const unsubscribeDoctors = onValue(doctorsRef, (snapshot) => {
      if (snapshot.exists()) {
        const doctors = Object.values(snapshot.val())
        setStats((prev) => ({
          ...prev,
          totalDoctors: doctors.length,
          availableDoctors: doctors.filter((d) => d.isAvailable && d.isInHospital).length,
        }))
      }
    })

    const unsubscribeAppointments = onValue(appointmentsRef, (snapshot) => {
      if (snapshot.exists()) {
        const appointments = Object.values(snapshot.val())
        setStats((prev) => ({
          ...prev,
          pendingAppointments: appointments.filter((a) => a.status === "pending").length,
        }))
      }
    })

    const unsubscribeAmbulance = onValue(ambulanceRef, (snapshot) => {
      if (snapshot.exists()) {
        const ambulanceRequests = Object.values(snapshot.val())
        setStats((prev) => ({
          ...prev,
          emergencyRequests: ambulanceRequests.filter((e) => e.status === "pending").length,
        }))
      } else {
        setStats((prev) => ({
          ...prev,
          emergencyRequests: 0,
        }))
      }
    })

    const unsubscribeMessages = onValue(messagesRef, (snapshot) => {
      if (snapshot.exists()) {
        const messages = Object.values(snapshot.val())
        setStats((prev) => ({
          ...prev,
          unreadMessages: messages.filter((m) => !m.read).length,
        }))
      } else {
        setStats((prev) => ({
          ...prev,
          unreadMessages: 0,
        }))
      }
    })

    return () => {
      off(doctorsRef, "value", unsubscribeDoctors)
      off(appointmentsRef, "value", unsubscribeAppointments)
      off(ambulanceRef, "value", unsubscribeAmbulance)
      off(messagesRef, "value", unsubscribeMessages)
    }
  }, [])

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

  const handleSearchResult = (type, item) => {
    // Navigate to appropriate tab based on search result type
    const tabMapping = {
      doctors: "doctors",
      appointments: "appointments",
      beds: "beds",
      inventory: "inventory",
      messages: "messages",
      ambulanceRequests: "emergency",
    }

    if (tabMapping[type]) {
      setActiveTab(tabMapping[type])
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <Shield className="h-8 w-8 text-red-600" />
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Admin Dashboard</h1>
                <p className="text-sm text-gray-500">Hospital Management System</p>
              </div>
            </div>
            <Button variant="outline" onClick={onLogout} className="flex items-center space-x-2 bg-transparent">
              <LogOut className="h-4 w-4" />
              <span>Logout</span>
            </Button>
          </div>
          <div className="mt-4">
            <UniversalSearch
              onResultSelect={handleSearchResult}
              placeholder="Search patients, doctors, appointments, inventory..."
            />
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8">
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-8">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="doctors">Doctors</TabsTrigger>
            <TabsTrigger value="appointments">Appointments</TabsTrigger>
            <TabsTrigger value="beds">Beds</TabsTrigger>
            <TabsTrigger value="inventory">Inventory</TabsTrigger>
            <TabsTrigger value="emergency">Emergency</TabsTrigger>
            <TabsTrigger value="messages" className="relative">
              Messages
              {stats.unreadMessages > 0 && (
                <Badge variant="destructive" className="absolute -top-2 -right-2 h-5 w-5 p-0 text-xs">
                  {stats.unreadMessages}
                </Badge>
              )}
            </TabsTrigger>
            <TabsTrigger value="settings">Settings</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-6">
            {/* Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <StatCard
                title="Total Doctors"
                value={stats.totalDoctors}
                icon={Stethoscope}
                color="text-blue-600"
                description="Registered doctors"
              />
              <StatCard
                title="Available Now"
                value={stats.availableDoctors}
                icon={Users}
                color="text-green-600"
                description="Doctors in hospital"
              />
              <StatCard
                title="Pending Appointments"
                value={stats.pendingAppointments}
                icon={Calendar}
                color="text-yellow-600"
                description="Awaiting approval"
              />
              <StatCard
                title="Emergency Requests"
                value={stats.emergencyRequests}
                icon={Ambulance}
                color="text-red-600"
                description="Active emergencies"
              />
            </div>

            {/* Quick Actions */}
            <Card>
              <CardHeader>
                <CardTitle>Quick Actions</CardTitle>
                <CardDescription>Common administrative tasks</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <Button className="flex items-center space-x-2 h-12" onClick={() => setActiveTab("doctors")}>
                    <Plus className="h-4 w-4" />
                    <span>Add New Doctor</span>
                  </Button>
                  <Button
                    variant="outline"
                    className="flex items-center space-x-2 h-12 bg-transparent"
                    onClick={() => setActiveTab("appointments")}
                  >
                    <Eye className="h-4 w-4" />
                    <span>View Appointments</span>
                  </Button>
                  <Button
                    variant="outline"
                    className="flex items-center space-x-2 h-12 border-red-200 text-red-600 hover:bg-red-50 bg-transparent"
                    onClick={() => setActiveTab("emergency")}
                  >
                    <AlertTriangle className="h-4 w-4" />
                    <span>Emergency Center</span>
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Recent Activity */}
            <Card>
              <CardHeader>
                <CardTitle>Recent Activity</CardTitle>
                <CardDescription>Latest system events</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex items-center space-x-3 p-3 bg-blue-50 rounded-lg">
                    <div className="w-2 h-2 bg-blue-600 rounded-full"></div>
                    <div className="flex-1">
                      <p className="text-sm font-medium">New doctor registration pending</p>
                      <p className="text-xs text-gray-500">2 minutes ago</p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-3 p-3 bg-green-50 rounded-lg">
                    <div className="w-2 h-2 bg-green-600 rounded-full"></div>
                    <div className="flex-1">
                      <p className="text-sm font-medium">Appointment approved by Dr. Smith</p>
                      <p className="text-xs text-gray-500">5 minutes ago</p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-3 p-3 bg-red-50 rounded-lg">
                    <div className="w-2 h-2 bg-red-600 rounded-full"></div>
                    <div className="flex-1">
                      <p className="text-sm font-medium">Emergency ambulance request</p>
                      <p className="text-xs text-gray-500">8 minutes ago</p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="doctors">
            <DoctorManagement />
          </TabsContent>

          <TabsContent value="appointments">
            <Card>
              <CardHeader>
                <CardTitle>Appointment Management</CardTitle>
                <CardDescription>View and manage all appointments</CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-gray-500">Appointment management interface will be implemented in the next phase.</p>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="beds">
            <BedManagement />
          </TabsContent>

          <TabsContent value="inventory">
            <InventoryManagement />
          </TabsContent>

          <TabsContent value="emergency">
            <AmbulanceManagement />
          </TabsContent>

          <TabsContent value="messages">
            <AdminMessages />
          </TabsContent>

          <TabsContent value="settings">
            <SettingsPanel />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}
