"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Calendar } from "@/components/ui/calendar"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import {
  Clock,
  MapPin,
  CheckCircle,
  AlertTriangle,
  CalendarIcon,
  Plus,
  Trash2,
  Coffee,
  Users,
  Stethoscope,
} from "lucide-react"
import { database } from "@/lib/firebase"
import { ref, update, push, onValue, remove } from "firebase/database"
import { format } from "date-fns"

export default function DoctorSchedule({ doctor }) {
  const [scheduleData, setScheduleData] = useState({
    isAvailable: doctor.isAvailable || false,
    isInHospital: doctor.isInHospital || false,
    availableTime: doctor.availableTime || "",
    room: doctor.room || "",
  })
  const [blockedSlots, setBlockedSlots] = useState([])
  const [newBlock, setNewBlock] = useState({
    date: null,
    startTime: "",
    endTime: "",
    type: "",
    reason: "",
  })
  const [isLoading, setIsLoading] = useState(false)
  const [message, setMessage] = useState("")
  const [messageType, setMessageType] = useState("")

  useEffect(() => {
    // Load blocked time slots
    const blockedSlotsRef = ref(database, `doctorSchedule/${doctor.uid}/blockedSlots`)
    const unsubscribe = onValue(blockedSlotsRef, (snapshot) => {
      if (snapshot.exists()) {
        const slots = Object.entries(snapshot.val()).map(([key, value]) => ({
          id: key,
          ...value,
        }))
        setBlockedSlots(slots.sort((a, b) => new Date(a.date) - new Date(b.date)))
      }
    })

    return () => unsubscribe()
  }, [doctor.uid])

  const handleInputChange = (e) => {
    setScheduleData({
      ...scheduleData,
      [e.target.name]: e.target.value,
    })
  }

  const handleSwitchChange = (name, checked) => {
    setScheduleData({
      ...scheduleData,
      [name]: checked,
    })
  }

  const handleUpdateSchedule = async (e) => {
    e.preventDefault()
    setIsLoading(true)
    setMessage("")

    try {
      await update(ref(database, `doctors/${doctor.uid}`), {
        ...scheduleData,
        lastUpdated: new Date().toISOString(),
      })

      setMessage("Schedule updated successfully!")
      setMessageType("success")
    } catch (error) {
      console.error("Error updating schedule:", error)
      setMessage("Failed to update schedule")
      setMessageType("error")
    } finally {
      setIsLoading(false)
    }
  }

  const handleAddBlockedSlot = async (e) => {
    e.preventDefault()
    if (!newBlock.date || !newBlock.startTime || !newBlock.endTime || !newBlock.type) return

    try {
      const blockData = {
        ...newBlock,
        date: newBlock.date.toISOString(),
        createdAt: new Date().toISOString(),
      }

      const blockedSlotsRef = ref(database, `doctorSchedule/${doctor.uid}/blockedSlots`)
      await push(blockedSlotsRef, blockData)

      setNewBlock({
        date: null,
        startTime: "",
        endTime: "",
        type: "",
        reason: "",
      })

      setMessage("Time slot blocked successfully!")
      setMessageType("success")
    } catch (error) {
      console.error("Error blocking time slot:", error)
      setMessage("Failed to block time slot")
      setMessageType("error")
    }
  }

  const handleRemoveBlockedSlot = async (slotId) => {
    try {
      const slotRef = ref(database, `doctorSchedule/${doctor.uid}/blockedSlots/${slotId}`)
      await remove(slotRef)

      setMessage("Time slot unblocked successfully!")
      setMessageType("success")
    } catch (error) {
      console.error("Error removing blocked slot:", error)
      setMessage("Failed to remove blocked slot")
      setMessageType("error")
    }
  }

  const getBlockTypeIcon = (type) => {
    switch (type) {
      case "break":
        return <Coffee className="h-4 w-4" />
      case "meeting":
        return <Users className="h-4 w-4" />
      case "surgery":
        return <Stethoscope className="h-4 w-4" />
      case "holiday":
        return <CalendarIcon className="h-4 w-4" />
      default:
        return <Clock className="h-4 w-4" />
    }
  }

  const getBlockTypeColor = (type) => {
    switch (type) {
      case "break":
        return "bg-green-100 text-green-800"
      case "meeting":
        return "bg-blue-100 text-blue-800"
      case "surgery":
        return "bg-red-100 text-red-800"
      case "holiday":
        return "bg-purple-100 text-purple-800"
      default:
        return "bg-gray-100 text-gray-800"
    }
  }

  return (
    <div className="space-y-6">
      <Tabs defaultValue="availability" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="availability">Availability</TabsTrigger>
          <TabsTrigger value="blocked-slots">Blocked Time</TabsTrigger>
          <TabsTrigger value="analytics">Schedule Analytics</TabsTrigger>
        </TabsList>

        <TabsContent value="availability" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Clock className="h-5 w-5 text-blue-600" />
                <span>Availability & Schedule</span>
              </CardTitle>
              <CardDescription>Manage your availability status and working hours</CardDescription>
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

              <form onSubmit={handleUpdateSchedule} className="space-y-6">
                <div className="space-y-4">
                  <div className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="space-y-1">
                      <Label className="text-base font-medium">Available for Appointments</Label>
                      <p className="text-sm text-gray-500">
                        Turn this on to receive new appointment requests from patients
                      </p>
                    </div>
                    <Switch
                      checked={scheduleData.isAvailable}
                      onCheckedChange={(checked) => handleSwitchChange("isAvailable", checked)}
                    />
                  </div>

                  <div className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="space-y-1">
                      <Label className="text-base font-medium">Currently in Hospital</Label>
                      <p className="text-sm text-gray-500">
                        Indicates whether you are physically present in the hospital
                      </p>
                    </div>
                    <Switch
                      checked={scheduleData.isInHospital}
                      onCheckedChange={(checked) => handleSwitchChange("isInHospital", checked)}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="availableTime">Available Hours</Label>
                    <Input
                      id="availableTime"
                      name="availableTime"
                      value={scheduleData.availableTime}
                      onChange={handleInputChange}
                      placeholder="e.g., 9:00 AM - 5:00 PM"
                      className="mt-1"
                    />
                    <p className="text-xs text-gray-500 mt-1">Your general working hours</p>
                  </div>

                  <div>
                    <Label htmlFor="room">Room Number</Label>
                    <Input
                      id="room"
                      name="room"
                      value={scheduleData.room}
                      onChange={handleInputChange}
                      placeholder="e.g., Room 101"
                      className="mt-1"
                    />
                    <p className="text-xs text-gray-500 mt-1">Your current room or office location</p>
                  </div>
                </div>

                <Button type="submit" className="w-full bg-blue-600 hover:bg-blue-700 text-white" disabled={isLoading}>
                  {isLoading ? "Updating Schedule..." : "Update Schedule"}
                </Button>
              </form>
            </CardContent>
          </Card>

          {/* Current Status */}
          <Card>
            <CardHeader>
              <CardTitle>Current Status</CardTitle>
              <CardDescription>Your current availability status visible to patients</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div
                  className={`p-4 rounded-lg border-2 ${
                    scheduleData.isAvailable ? "border-green-200 bg-green-50" : "border-gray-200 bg-gray-50"
                  }`}
                >
                  <div className="flex items-center space-x-2 mb-2">
                    <div
                      className={`w-3 h-3 rounded-full ${scheduleData.isAvailable ? "bg-green-600" : "bg-gray-400"}`}
                    ></div>
                    <span className={`font-medium ${scheduleData.isAvailable ? "text-green-900" : "text-gray-700"}`}>
                      {scheduleData.isAvailable ? "Available" : "Unavailable"}
                    </span>
                  </div>
                  <p className={`text-sm ${scheduleData.isAvailable ? "text-green-700" : "text-gray-600"}`}>
                    {scheduleData.isAvailable
                      ? "Patients can book appointments with you"
                      : "Not accepting new appointments"}
                  </p>
                </div>

                <div
                  className={`p-4 rounded-lg border-2 ${
                    scheduleData.isInHospital ? "border-blue-200 bg-blue-50" : "border-gray-200 bg-gray-50"
                  }`}
                >
                  <div className="flex items-center space-x-2 mb-2">
                    <MapPin className={`h-4 w-4 ${scheduleData.isInHospital ? "text-blue-600" : "text-gray-400"}`} />
                    <span className={`font-medium ${scheduleData.isInHospital ? "text-blue-900" : "text-gray-700"}`}>
                      {scheduleData.isInHospital ? "In Hospital" : "Away"}
                    </span>
                  </div>
                  <p className={`text-sm ${scheduleData.isInHospital ? "text-blue-700" : "text-gray-600"}`}>
                    {scheduleData.isInHospital ? "Currently at the hospital" : "Not in hospital premises"}
                  </p>
                </div>
              </div>

              {scheduleData.availableTime && (
                <div className="mt-4 p-3 bg-gray-50 rounded-lg">
                  <div className="flex items-center space-x-2">
                    <Clock className="h-4 w-4 text-gray-600" />
                    <span className="font-medium text-gray-900">Working Hours:</span>
                    <span className="text-gray-700">{scheduleData.availableTime}</span>
                  </div>
                </div>
              )}

              {scheduleData.room && (
                <div className="mt-2 p-3 bg-gray-50 rounded-lg">
                  <div className="flex items-center space-x-2">
                    <MapPin className="h-4 w-4 text-gray-600" />
                    <span className="font-medium text-gray-900">Location:</span>
                    <span className="text-gray-700">{scheduleData.room}</span>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="blocked-slots" className="space-y-6">
          {/* Add New Blocked Slot */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Plus className="h-5 w-5" />
                Block Time Slot
              </CardTitle>
              <CardDescription>Block time for breaks, meetings, surgeries, or holidays</CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleAddBlockedSlot} className="space-y-4">
                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <Label>Date</Label>
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button variant="outline" className="w-full justify-start text-left font-normal bg-transparent">
                          <CalendarIcon className="mr-2 h-4 w-4" />
                          {newBlock.date ? format(newBlock.date, "PPP") : "Select date"}
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0">
                        <Calendar
                          mode="single"
                          selected={newBlock.date}
                          onSelect={(date) => setNewBlock({ ...newBlock, date })}
                          initialFocus
                        />
                      </PopoverContent>
                    </Popover>
                  </div>

                  <div>
                    <Label>Block Type</Label>
                    <Select value={newBlock.type} onValueChange={(value) => setNewBlock({ ...newBlock, type: value })}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select type" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="break">Break/Lunch</SelectItem>
                        <SelectItem value="meeting">Meeting</SelectItem>
                        <SelectItem value="surgery">Surgery/Procedure</SelectItem>
                        <SelectItem value="holiday">Holiday/Leave</SelectItem>
                        <SelectItem value="other">Other</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label>Start Time</Label>
                    <Input
                      type="time"
                      value={newBlock.startTime}
                      onChange={(e) => setNewBlock({ ...newBlock, startTime: e.target.value })}
                    />
                  </div>

                  <div>
                    <Label>End Time</Label>
                    <Input
                      type="time"
                      value={newBlock.endTime}
                      onChange={(e) => setNewBlock({ ...newBlock, endTime: e.target.value })}
                    />
                  </div>
                </div>

                <div>
                  <Label>Reason (Optional)</Label>
                  <Textarea
                    value={newBlock.reason}
                    onChange={(e) => setNewBlock({ ...newBlock, reason: e.target.value })}
                    placeholder="Additional details about this blocked time"
                    rows={2}
                  />
                </div>

                <Button
                  type="submit"
                  disabled={!newBlock.date || !newBlock.startTime || !newBlock.endTime || !newBlock.type}
                >
                  Block Time Slot
                </Button>
              </form>
            </CardContent>
          </Card>

          {/* Blocked Slots List */}
          <Card>
            <CardHeader>
              <CardTitle>Blocked Time Slots</CardTitle>
              <CardDescription>Your scheduled breaks, meetings, and unavailable times</CardDescription>
            </CardHeader>
            <CardContent>
              {blockedSlots.length > 0 ? (
                <div className="space-y-3">
                  {blockedSlots.map((slot) => (
                    <div key={slot.id} className="flex items-center justify-between p-4 border rounded-lg">
                      <div className="flex items-center gap-3">
                        <div className="flex items-center gap-2">
                          {getBlockTypeIcon(slot.type)}
                          <Badge className={getBlockTypeColor(slot.type)}>
                            {slot.type.charAt(0).toUpperCase() + slot.type.slice(1)}
                          </Badge>
                        </div>
                        <div>
                          <p className="font-medium">
                            {new Date(slot.date).toLocaleDateString()} • {slot.startTime} - {slot.endTime}
                          </p>
                          {slot.reason && <p className="text-sm text-gray-600">{slot.reason}</p>}
                        </div>
                      </div>
                      <Button variant="outline" size="sm" onClick={() => handleRemoveBlockedSlot(slot.id)}>
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <Clock className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-500">No blocked time slots</p>
                  <p className="text-sm text-gray-400 mt-2">Add blocked slots to manage your schedule better</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="analytics" className="space-y-6">
          {/* Schedule Tips */}
          <Card>
            <CardHeader>
              <CardTitle>Schedule Tips</CardTitle>
              <CardDescription>Best practices for managing your availability</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3 text-sm text-gray-600">
                <div className="flex items-start space-x-2">
                  <div className="w-2 h-2 bg-blue-600 rounded-full mt-2"></div>
                  <p>Update your status regularly to help patients know when you're available</p>
                </div>
                <div className="flex items-start space-x-2">
                  <div className="w-2 h-2 bg-blue-600 rounded-full mt-2"></div>
                  <p>Set "Available" to ON when you want to receive new appointment requests</p>
                </div>
                <div className="flex items-start space-x-2">
                  <div className="w-2 h-2 bg-blue-600 rounded-full mt-2"></div>
                  <p>Use "In Hospital" to let patients know if you're physically present</p>
                </div>
                <div className="flex items-start space-x-2">
                  <div className="w-2 h-2 bg-blue-600 rounded-full mt-2"></div>
                  <p>Block time slots for breaks, meetings, and procedures to avoid conflicts</p>
                </div>
                <div className="flex items-start space-x-2">
                  <div className="w-2 h-2 bg-blue-600 rounded-full mt-2"></div>
                  <p>Emergency appointments may still come through even when unavailable</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
