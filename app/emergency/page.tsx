"use client"

import { useState, useEffect } from "react"
import { ref, onValue, push } from "firebase/database"
import { database } from "@/lib/firebase"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { Phone, Clock, AlertTriangle, Ambulance, Users } from "lucide-react"

export default function EmergencyPage() {
  const [emergencyQueue, setEmergencyQueue] = useState([])
  const [ambulanceRequests, setAmbulanceRequests] = useState([])
  const [currentWaitTime, setCurrentWaitTime] = useState(0)
  const [showRequestForm, setShowRequestForm] = useState(false)
  const [formData, setFormData] = useState({
    name: "",
    phone: "",
    emergencyType: "",
    description: "",
    location: "",
    severity: "medium",
  })

  useEffect(() => {
    // Listen to emergency queue
    const queueRef = ref(database, "emergencyQueue")
    const unsubscribeQueue = onValue(queueRef, (snapshot) => {
      if (snapshot.exists()) {
        const data = snapshot.val()
        const queueArray = Object.entries(data)
          .map(([id, item]) => ({
            id,
            ...item,
          }))
          .sort((a, b) => {
            const severityOrder = { critical: 0, high: 1, medium: 2, low: 3 }
            return (
              severityOrder[a.severity] - severityOrder[b.severity] || new Date(a.timestamp) - new Date(b.timestamp)
            )
          })
        setEmergencyQueue(queueArray)

        // Calculate average wait time
        const avgWait = queueArray.length * 15 // 15 minutes per case estimate
        setCurrentWaitTime(avgWait)
      } else {
        setEmergencyQueue([])
        setCurrentWaitTime(0)
      }
    })

    // Listen to ambulance requests
    const ambulanceRef = ref(database, "ambulanceRequests")
    const unsubscribeAmbulance = onValue(ambulanceRef, (snapshot) => {
      if (snapshot.exists()) {
        const data = snapshot.val()
        const ambulanceArray = Object.entries(data)
          .map(([id, item]) => ({ id, ...item }))
          .filter((item) => item.status === "pending")
          .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))
        setAmbulanceRequests(ambulanceArray)
      }
    })

    return () => {
      unsubscribeQueue()
      unsubscribeAmbulance()
    }
  }, [])

  const handleEmergencyRequest = async (e) => {
    e.preventDefault()

    const emergencyData = {
      ...formData,
      timestamp: new Date().toISOString(),
      status: "waiting",
      queuePosition: emergencyQueue.length + 1,
      deviceId: localStorage.getItem("deviceId") || "unknown",
    }

    try {
      const emergencyRef = ref(database, "emergencyQueue")
      await push(emergencyRef, emergencyData)

      setFormData({
        name: "",
        phone: "",
        emergencyType: "",
        description: "",
        location: "",
        severity: "medium",
      })
      setShowRequestForm(false)
      alert("Emergency request submitted successfully! You will be contacted shortly.")
    } catch (error) {
      console.error("Error submitting emergency request:", error)
      alert("Error submitting request. Please try again.")
    }
  }

  const getSeverityColor = (severity) => {
    switch (severity) {
      case "critical":
        return "bg-red-500"
      case "high":
        return "bg-orange-500"
      case "medium":
        return "bg-yellow-500"
      case "low":
        return "bg-green-500"
      default:
        return "bg-gray-500"
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 p-4">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-red-600 mb-2 flex items-center gap-2">
            <AlertTriangle className="h-8 w-8" />
            Emergency Services
          </h1>
          <p className="text-gray-600">24/7 Emergency medical services and support</p>
        </div>

        {/* Emergency Hotlines */}
        <Card className="mb-6 border-red-200">
          <CardHeader className="bg-red-50">
            <CardTitle className="text-red-700 flex items-center gap-2">
              <Phone className="h-5 w-5" />
              Emergency Hotlines
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-6">
            <div className="grid md:grid-cols-3 gap-4">
              <div className="text-center p-4 bg-red-100 rounded-lg">
                <Phone className="h-8 w-8 text-red-600 mx-auto mb-2" />
                <h3 className="font-semibold text-red-700">Ambulance</h3>
                <p className="text-2xl font-bold text-red-600">1122</p>
              </div>
              <div className="text-center p-4 bg-blue-100 rounded-lg">
                <Phone className="h-8 w-8 text-blue-600 mx-auto mb-2" />
                <h3 className="font-semibold text-blue-700">Hospital Direct</h3>
                <p className="text-2xl font-bold text-blue-600">042-111-222</p>
              </div>
              <div className="text-center p-4 bg-green-100 rounded-lg">
                <Phone className="h-8 w-8 text-green-600 mx-auto mb-2" />
                <h3 className="font-semibold text-green-700">Emergency Ward</h3>
                <p className="text-2xl font-bold text-green-600">042-333-444</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="grid lg:grid-cols-2 gap-6">
          {/* Current Queue Status */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5" />
                Emergency Queue Status
              </CardTitle>
              <CardDescription>Live waiting times and queue information</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center justify-between p-4 bg-blue-50 rounded-lg">
                  <div className="flex items-center gap-2">
                    <Clock className="h-5 w-5 text-blue-600" />
                    <span className="font-medium">Current Wait Time</span>
                  </div>
                  <Badge variant="outline" className="text-blue-600">
                    {currentWaitTime} minutes
                  </Badge>
                </div>

                <div className="flex items-center justify-between p-4 bg-orange-50 rounded-lg">
                  <div className="flex items-center gap-2">
                    <Users className="h-5 w-5 text-orange-600" />
                    <span className="font-medium">People in Queue</span>
                  </div>
                  <Badge variant="outline" className="text-orange-600">
                    {emergencyQueue.length}
                  </Badge>
                </div>

                <div className="flex items-center justify-between p-4 bg-red-50 rounded-lg">
                  <div className="flex items-center gap-2">
                    <Ambulance className="h-5 w-5 text-red-600" />
                    <span className="font-medium">Ambulance Requests</span>
                  </div>
                  <Badge variant="outline" className="text-red-600">
                    {ambulanceRequests.length} pending
                  </Badge>
                </div>
              </div>

              {/* Queue List */}
              {emergencyQueue.length > 0 && (
                <div className="mt-6">
                  <h4 className="font-semibold mb-3">Current Queue</h4>
                  <div className="space-y-2 max-h-60 overflow-y-auto">
                    {emergencyQueue.slice(0, 5).map((item, index) => (
                      <div key={item.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                        <div className="flex items-center gap-3">
                          <Badge className={`${getSeverityColor(item.severity)} text-white`}>#{index + 1}</Badge>
                          <div>
                            <p className="font-medium">{item.emergencyType}</p>
                            <p className="text-sm text-gray-600">{item.severity} priority</p>
                          </div>
                        </div>
                        <Badge variant="outline">{Math.max(0, index * 15)} min</Badge>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Emergency Request Form */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <AlertTriangle className="h-5 w-5" />
                Submit Emergency Request
              </CardTitle>
              <CardDescription>For non-life threatening emergencies</CardDescription>
            </CardHeader>
            <CardContent>
              {!showRequestForm ? (
                <div className="space-y-4">
                  <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                    <p className="text-yellow-800 font-medium mb-2">⚠️ Important Notice</p>
                    <p className="text-yellow-700 text-sm">
                      For life-threatening emergencies, call 1122 immediately. This form is for urgent but non-critical
                      medical situations.
                    </p>
                  </div>

                  <Button onClick={() => setShowRequestForm(true)} className="w-full bg-red-600 hover:bg-red-700">
                    Submit Emergency Request
                  </Button>

                  <Button
                    variant="outline"
                    className="w-full bg-transparent"
                    onClick={() => (window.location.href = "/patient")}
                  >
                    Request Ambulance
                  </Button>
                </div>
              ) : (
                <form onSubmit={handleEmergencyRequest} className="space-y-4">
                  <div>
                    <Label htmlFor="name">Full Name *</Label>
                    <Input
                      id="name"
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      required
                    />
                  </div>

                  <div>
                    <Label htmlFor="phone">Phone Number *</Label>
                    <Input
                      id="phone"
                      value={formData.phone}
                      onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                      placeholder="03XX-XXXXXXX"
                      required
                    />
                  </div>

                  <div>
                    <Label htmlFor="emergencyType">Emergency Type *</Label>
                    <Select onValueChange={(value) => setFormData({ ...formData, emergencyType: value })}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select emergency type" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="chest-pain">Chest Pain</SelectItem>
                        <SelectItem value="breathing-difficulty">Breathing Difficulty</SelectItem>
                        <SelectItem value="severe-injury">Severe Injury</SelectItem>
                        <SelectItem value="high-fever">High Fever</SelectItem>
                        <SelectItem value="severe-pain">Severe Pain</SelectItem>
                        <SelectItem value="allergic-reaction">Allergic Reaction</SelectItem>
                        <SelectItem value="other">Other</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label htmlFor="severity">Severity Level *</Label>
                    <Select onValueChange={(value) => setFormData({ ...formData, severity: value })}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select severity" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="critical">Critical - Life threatening</SelectItem>
                        <SelectItem value="high">High - Urgent attention needed</SelectItem>
                        <SelectItem value="medium">Medium - Important but stable</SelectItem>
                        <SelectItem value="low">Low - Can wait if necessary</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label htmlFor="location">Current Location *</Label>
                    <Input
                      id="location"
                      value={formData.location}
                      onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                      placeholder="Your current address"
                      required
                    />
                  </div>

                  <div>
                    <Label htmlFor="description">Description</Label>
                    <Textarea
                      id="description"
                      value={formData.description}
                      onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                      placeholder="Describe your emergency situation"
                      rows={3}
                    />
                  </div>

                  <div className="flex gap-2">
                    <Button type="submit" className="flex-1 bg-red-600 hover:bg-red-700">
                      Submit Emergency Request
                    </Button>
                    <Button type="button" variant="outline" onClick={() => setShowRequestForm(false)}>
                      Cancel
                    </Button>
                  </div>
                </form>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
