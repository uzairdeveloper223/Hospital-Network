"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
} from "recharts"
import { TrendingUp, Users, Calendar, Star, Award, Activity } from "lucide-react"
import { database } from "@/lib/firebase"
import { ref, onValue } from "firebase/database"

export default function DoctorAnalytics({ doctor }) {
  const [appointments, setAppointments] = useState([])
  const [feedback, setFeedback] = useState([])
  const [prescriptions, setPrescriptions] = useState([])
  const [certificates, setCertificates] = useState([])
  const [timeRange, setTimeRange] = useState("30")
  const [analytics, setAnalytics] = useState({
    totalPatients: 0,
    completedAppointments: 0,
    averageRating: 0,
    totalPrescriptions: 0,
    totalCertificates: 0,
    emergencyHandled: 0,
    govEmployeesServed: 0,
  })

  useEffect(() => {
    // Load appointments
    const appointmentsRef = ref(database, "appointments")
    const unsubscribeAppointments = onValue(appointmentsRef, (snapshot) => {
      if (snapshot.exists()) {
        const allAppointments = Object.entries(snapshot.val()).map(([key, value]) => ({
          id: key,
          ...value,
        }))
        const doctorAppointments = allAppointments.filter((apt) => apt.doctorId === doctor.uid)
        setAppointments(doctorAppointments)
      }
    })

    // Load feedback
    const feedbackRef = ref(database, "patientFeedback")
    const unsubscribeFeedback = onValue(feedbackRef, (snapshot) => {
      if (snapshot.exists()) {
        const allFeedback = Object.entries(snapshot.val()).map(([key, value]) => ({
          id: key,
          ...value,
        }))
        const doctorFeedback = allFeedback.filter((fb) => fb.doctorId === doctor.uid)
        setFeedback(doctorFeedback)
      }
    })

    // Load prescriptions
    const prescriptionsRef = ref(database, "prescriptions")
    const unsubscribePrescriptions = onValue(prescriptionsRef, (snapshot) => {
      if (snapshot.exists()) {
        const allPrescriptions = Object.entries(snapshot.val()).map(([key, value]) => ({
          id: key,
          ...value,
        }))
        const doctorPrescriptions = allPrescriptions.filter((prescription) => prescription.doctorId === doctor.uid)
        setPrescriptions(doctorPrescriptions)
      }
    })

    // Load certificates
    const certificatesRef = ref(database, "medicalCertificates")
    const unsubscribeCertificates = onValue(certificatesRef, (snapshot) => {
      if (snapshot.exists()) {
        const allCertificates = Object.entries(snapshot.val()).map(([key, value]) => ({
          id: key,
          ...value,
        }))
        const doctorCertificates = allCertificates.filter((certificate) => certificate.doctorId === doctor.uid)
        setCertificates(doctorCertificates)
      }
    })

    return () => {
      unsubscribeAppointments()
      unsubscribeFeedback()
      unsubscribePrescriptions()
      unsubscribeCertificates()
    }
  }, [doctor.uid])

  useEffect(() => {
    // Calculate analytics based on time range
    const daysAgo = Number.parseInt(timeRange)
    const cutoffDate = new Date()
    cutoffDate.setDate(cutoffDate.getDate() - daysAgo)

    const filteredAppointments = appointments.filter((apt) => new Date(apt.createdAt) >= cutoffDate)
    const filteredFeedback = feedback.filter((fb) => new Date(fb.timestamp) >= cutoffDate)
    const filteredPrescriptions = prescriptions.filter((prescription) => new Date(prescription.createdAt) >= cutoffDate)
    const filteredCertificates = certificates.filter((certificate) => new Date(certificate.createdAt) >= cutoffDate)

    const uniquePatients = new Set(filteredAppointments.map((apt) => apt.deviceId)).size
    const completedAppointments = filteredAppointments.filter((apt) => apt.status === "completed").length
    const averageRating =
      filteredFeedback.length > 0
        ? filteredFeedback.reduce((sum, fb) => sum + fb.rating, 0) / filteredFeedback.length
        : 0
    const emergencyHandled = filteredAppointments.filter((apt) => apt.isEmergency).length
    const govEmployeesServed = filteredAppointments.filter((apt) => apt.isGovEmployee).length

    setAnalytics({
      totalPatients: uniquePatients,
      completedAppointments,
      averageRating: Math.round(averageRating * 10) / 10,
      totalPrescriptions: filteredPrescriptions.length,
      totalCertificates: filteredCertificates.length,
      emergencyHandled,
      govEmployeesServed,
    })
  }, [appointments, feedback, prescriptions, certificates, timeRange])

  // Prepare chart data
  const getAppointmentTrends = () => {
    const last7Days = []
    for (let i = 6; i >= 0; i--) {
      const date = new Date()
      date.setDate(date.getDate() - i)
      const dateStr = date.toISOString().split("T")[0]

      const dayAppointments = appointments.filter((apt) => apt.createdAt && apt.createdAt.split("T")[0] === dateStr)

      last7Days.push({
        date: date.toLocaleDateString("en-US", { weekday: "short" }),
        appointments: dayAppointments.length,
        completed: dayAppointments.filter((apt) => apt.status === "completed").length,
      })
    }
    return last7Days
  }

  const getRatingDistribution = () => {
    const distribution = { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 }
    feedback.forEach((fb) => {
      distribution[fb.rating] = (distribution[fb.rating] || 0) + 1
    })

    return Object.entries(distribution).map(([rating, count]) => ({
      rating: `${rating} Stars`,
      count,
      percentage: feedback.length > 0 ? Math.round((count / feedback.length) * 100) : 0,
    }))
  }

  const getAppointmentTypes = () => {
    const types = {}
    appointments.forEach((apt) => {
      const type = apt.isEmergency ? "Emergency" : "Regular"
      types[type] = (types[type] || 0) + 1
    })

    return Object.entries(types).map(([type, count]) => ({
      type,
      count,
      percentage: appointments.length > 0 ? Math.round((count / appointments.length) * 100) : 0,
    }))
  }

  const StatCard = ({ title, value, icon: Icon, color, description, trend }) => (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium text-gray-600">{title}</CardTitle>
        <Icon className={`h-4 w-4 ${color}`} />
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold text-gray-900">{value}</div>
        {description && <p className="text-xs text-gray-500 mt-1">{description}</p>}
        {trend && (
          <div className="flex items-center mt-2">
            <TrendingUp className="h-3 w-3 text-green-600 mr-1" />
            <span className="text-xs text-green-600">{trend}</span>
          </div>
        )}
      </CardContent>
    </Card>
  )

  const COLORS = ["#0088FE", "#00C49F", "#FFBB28", "#FF8042", "#8884D8"]

  return (
    <div className="space-y-6">
      {/* Time Range Selector */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Performance Analytics</h2>
          <p className="text-gray-600">Track your performance and patient satisfaction</p>
        </div>
        <Select value={timeRange} onValueChange={setTimeRange}>
          <SelectTrigger className="w-48">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="7">Last 7 days</SelectItem>
            <SelectItem value="30">Last 30 days</SelectItem>
            <SelectItem value="90">Last 3 months</SelectItem>
            <SelectItem value="365">Last year</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard
          title="Total Patients"
          value={analytics.totalPatients}
          icon={Users}
          color="text-blue-600"
          description={`Last ${timeRange} days`}
        />
        <StatCard
          title="Completed Appointments"
          value={analytics.completedAppointments}
          icon={Calendar}
          color="text-green-600"
          description={`Last ${timeRange} days`}
        />
        <StatCard
          title="Average Rating"
          value={analytics.averageRating}
          icon={Star}
          color="text-yellow-600"
          description="Patient satisfaction"
        />
        <StatCard
          title="Emergency Cases"
          value={analytics.emergencyHandled}
          icon={Activity}
          color="text-red-600"
          description="Urgent appointments"
        />
      </div>

      <Tabs defaultValue="trends" className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="trends">Appointment Trends</TabsTrigger>
          <TabsTrigger value="ratings">Patient Ratings</TabsTrigger>
          <TabsTrigger value="types">Appointment Types</TabsTrigger>
          <TabsTrigger value="summary">Summary</TabsTrigger>
        </TabsList>

        <TabsContent value="trends" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Daily Appointment Trends</CardTitle>
              <CardDescription>Appointments over the last 7 days</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={getAppointmentTrends()}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" />
                  <YAxis />
                  <Tooltip />
                  <Line type="monotone" dataKey="appointments" stroke="#8884d8" strokeWidth={2} />
                  <Line type="monotone" dataKey="completed" stroke="#82ca9d" strokeWidth={2} />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="ratings" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Patient Rating Distribution</CardTitle>
              <CardDescription>How patients rate your services</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={getRatingDistribution()}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="rating" />
                  <YAxis />
                  <Tooltip />
                  <Bar dataKey="count" fill="#8884d8" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="types" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Appointment Types</CardTitle>
              <CardDescription>Distribution of regular vs emergency appointments</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={getAppointmentTypes()}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ type, percentage }) => `${type}: ${percentage}%`}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="count"
                  >
                    {getAppointmentTypes().map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="summary" className="space-y-4">
          <div className="grid md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Performance Summary</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-gray-600">Prescriptions Written</span>
                  <Badge variant="outline">{analytics.totalPrescriptions}</Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-gray-600">Certificates Issued</span>
                  <Badge variant="outline">{analytics.totalCertificates}</Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-gray-600">Government Employees Served</span>
                  <Badge variant="outline">{analytics.govEmployeesServed}</Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-gray-600">Emergency Cases Handled</span>
                  <Badge variant="outline" className="bg-red-50 text-red-700">
                    {analytics.emergencyHandled}
                  </Badge>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Recent Achievements</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {analytics.averageRating >= 4.5 && (
                  <div className="flex items-center gap-2 p-2 bg-yellow-50 rounded">
                    <Award className="h-4 w-4 text-yellow-600" />
                    <span className="text-sm text-yellow-800">Excellent Patient Satisfaction</span>
                  </div>
                )}
                {analytics.completedAppointments >= 50 && (
                  <div className="flex items-center gap-2 p-2 bg-green-50 rounded">
                    <Award className="h-4 w-4 text-green-600" />
                    <span className="text-sm text-green-800">High Volume Practice</span>
                  </div>
                )}
                {analytics.emergencyHandled >= 10 && (
                  <div className="flex items-center gap-2 p-2 bg-red-50 rounded">
                    <Award className="h-4 w-4 text-red-600" />
                    <span className="text-sm text-red-800">Emergency Care Specialist</span>
                  </div>
                )}
                {analytics.govEmployeesServed >= 20 && (
                  <div className="flex items-center gap-2 p-2 bg-blue-50 rounded">
                    <Award className="h-4 w-4 text-blue-600" />
                    <span className="text-sm text-blue-800">Public Service Excellence</span>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
}
