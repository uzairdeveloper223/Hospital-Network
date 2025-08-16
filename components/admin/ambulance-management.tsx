"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { Ambulance, Phone, MapPin, Clock, AlertTriangle, CheckCircle, Shield, User } from "lucide-react"
import { database } from "@/lib/firebase"
import { ref, onValue, off, update } from "firebase/database"

export default function AmbulanceManagement() {
  const [requests, setRequests] = useState([])
  const [selectedRequest, setSelectedRequest] = useState(null)
  const [filter, setFilter] = useState("all")
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    const requestsRef = ref(database, "ambulanceRequests")
    const unsubscribe = onValue(requestsRef, (snapshot) => {
      if (snapshot.exists()) {
        const requestsData = Object.entries(snapshot.val()).map(([key, value]) => ({
          id: key,
          ...value,
        }))
        // Sort by urgency and time
        requestsData.sort((a, b) => {
          const urgencyOrder = { critical: 4, high: 3, medium: 2, low: 1 }
          if (urgencyOrder[a.urgencyLevel] !== urgencyOrder[b.urgencyLevel]) {
            return urgencyOrder[b.urgencyLevel] - urgencyOrder[a.urgencyLevel]
          }
          return new Date(b.createdAt) - new Date(a.createdAt)
        })
        setRequests(requestsData)
      } else {
        setRequests([])
      }
    })

    return () => off(requestsRef, "value", unsubscribe)
  }, [])

  const updateRequestStatus = async (requestId, status, notes = "") => {
    setLoading(true)
    try {
      const requestRef = ref(database, `ambulanceRequests/${requestId}`)
      await update(requestRef, {
        status,
        adminNotes: notes,
        updatedAt: new Date().toISOString(),
      })
      setSelectedRequest(null)
    } catch (error) {
      console.error("Error updating request:", error)
      alert("Failed to update request status")
    } finally {
      setLoading(false)
    }
  }

  const filteredRequests = requests.filter((request) => {
    if (filter === "all") return true
    return request.status === filter
  })

  const getUrgencyColor = (urgency) => {
    switch (urgency) {
      case "critical":
        return "bg-red-100 text-red-800 border-red-200"
      case "high":
        return "bg-orange-100 text-orange-800 border-orange-200"
      case "medium":
        return "bg-yellow-100 text-yellow-800 border-yellow-200"
      case "low":
        return "bg-green-100 text-green-800 border-green-200"
      default:
        return "bg-gray-100 text-gray-800 border-gray-200"
    }
  }

  const getStatusColor = (status) => {
    switch (status) {
      case "pending":
        return "bg-yellow-100 text-yellow-800"
      case "dispatched":
        return "bg-blue-100 text-blue-800"
      case "completed":
        return "bg-green-100 text-green-800"
      case "cancelled":
        return "bg-red-100 text-red-800"
      default:
        return "bg-gray-100 text-gray-800"
    }
  }

  return (
    <div className="space-y-6">
      {/* Header Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Requests</p>
                <p className="text-2xl font-bold text-gray-900">{requests.length}</p>
              </div>
              <Ambulance className="h-8 w-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Pending</p>
                <p className="text-2xl font-bold text-yellow-600">
                  {requests.filter((r) => r.status === "pending").length}
                </p>
              </div>
              <Clock className="h-8 w-8 text-yellow-600" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Critical</p>
                <p className="text-2xl font-bold text-red-600">
                  {requests.filter((r) => r.urgencyLevel === "critical").length}
                </p>
              </div>
              <AlertTriangle className="h-8 w-8 text-red-600" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Completed</p>
                <p className="text-2xl font-bold text-green-600">
                  {requests.filter((r) => r.status === "completed").length}
                </p>
              </div>
              <CheckCircle className="h-8 w-8 text-green-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filter */}
      <Card>
        <CardHeader>
          <CardTitle>Ambulance Requests</CardTitle>
          <CardDescription>Manage emergency ambulance requests from patients</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center space-x-4 mb-6">
            <Label htmlFor="filter">Filter by Status:</Label>
            <Select value={filter} onValueChange={setFilter}>
              <SelectTrigger className="w-48">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Requests</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="dispatched">Dispatched</SelectItem>
                <SelectItem value="completed">Completed</SelectItem>
                <SelectItem value="cancelled">Cancelled</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Requests List */}
          <div className="space-y-4">
            {filteredRequests.length > 0 ? (
              filteredRequests.map((request) => (
                <Card key={request.id} className="border-l-4 border-l-red-500">
                  <CardContent className="pt-4">
                    <div className="flex items-start justify-between">
                      <div className="flex-1 space-y-3">
                        {/* Header */}
                        <div className="flex items-center space-x-3">
                          <div className="flex items-center space-x-2">
                            <User className="h-4 w-4 text-gray-500" />
                            <span className="font-medium text-gray-900">{request.patientName}</span>
                            {request.isGovEmployee && (
                              <Badge variant="secondary" className="bg-blue-100 text-blue-800">
                                <Shield className="h-3 w-3 mr-1" />
                                Gov Employee
                              </Badge>
                            )}
                          </div>
                          <div className="flex items-center space-x-2">
                            <Badge className={getUrgencyColor(request.urgencyLevel)}>
                              {request.urgencyLevel?.toUpperCase()}
                            </Badge>
                            <Badge className={getStatusColor(request.status)}>{request.status?.toUpperCase()}</Badge>
                          </div>
                        </div>

                        {/* Details */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                          <div className="space-y-2">
                            <div className="flex items-center space-x-2">
                              <Phone className="h-4 w-4 text-gray-400" />
                              <span className="font-medium">Primary:</span>
                              <a href={`tel:${request.contactNumber}`} className="text-blue-600 hover:underline">
                                {request.contactNumber}
                              </a>
                            </div>
                            {request.alternateNumber && (
                              <div className="flex items-center space-x-2">
                                <Phone className="h-4 w-4 text-gray-400" />
                                <span className="font-medium">Alternate:</span>
                                <a href={`tel:${request.alternateNumber}`} className="text-blue-600 hover:underline">
                                  {request.alternateNumber}
                                </a>
                              </div>
                            )}
                            <div className="flex items-start space-x-2">
                              <MapPin className="h-4 w-4 text-gray-400 mt-0.5" />
                              <div>
                                <span className="font-medium">Location:</span>
                                <p className="text-gray-600">{request.location}</p>
                              </div>
                            </div>
                          </div>
                          <div className="space-y-2">
                            <p>
                              <span className="font-medium">Emergency Type:</span> {request.emergencyType}
                            </p>
                            <p>
                              <span className="font-medium">Patient Condition:</span> {request.patientCondition}
                            </p>
                            <p>
                              <span className="font-medium">Location Type:</span>{" "}
                              {request.isAtHospital === "yes" ? "At Hospital" : "External Location"}
                            </p>
                            <p>
                              <span className="font-medium">Requested:</span>{" "}
                              {new Date(request.createdAt).toLocaleString()}
                            </p>
                          </div>
                        </div>

                        {request.description && (
                          <div className="mt-3 p-3 bg-gray-50 rounded-lg">
                            <p className="text-sm text-gray-700">
                              <span className="font-medium">Additional Details:</span> {request.description}
                            </p>
                          </div>
                        )}

                        {request.adminNotes && (
                          <div className="mt-3 p-3 bg-blue-50 rounded-lg">
                            <p className="text-sm text-blue-700">
                              <span className="font-medium">Admin Notes:</span> {request.adminNotes}
                            </p>
                          </div>
                        )}
                      </div>

                      {/* Actions */}
                      <div className="flex flex-col space-y-2 ml-4">
                        {request.status === "pending" && (
                          <>
                            <Button
                              size="sm"
                              className="bg-blue-600 hover:bg-blue-700"
                              onClick={() => updateRequestStatus(request.id, "dispatched", "Ambulance dispatched")}
                              disabled={loading}
                            >
                              Dispatch
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              className="border-red-200 text-red-600 hover:bg-red-50 bg-transparent"
                              onClick={() => updateRequestStatus(request.id, "cancelled", "Request cancelled")}
                              disabled={loading}
                            >
                              Cancel
                            </Button>
                          </>
                        )}
                        {request.status === "dispatched" && (
                          <Button
                            size="sm"
                            className="bg-green-600 hover:bg-green-700"
                            onClick={() => updateRequestStatus(request.id, "completed", "Service completed")}
                            disabled={loading}
                          >
                            Complete
                          </Button>
                        )}
                        <Button size="sm" variant="outline" onClick={() => setSelectedRequest(request)}>
                          Add Notes
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))
            ) : (
              <div className="text-center py-8">
                <Ambulance className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-500">No ambulance requests found</p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Add Notes Modal */}
      {selectedRequest && (
        <Card className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md mx-4">
            <h3 className="text-lg font-semibold mb-4">Add Notes - {selectedRequest.patientName}</h3>
            <div className="space-y-4">
              <div>
                <Label htmlFor="notes">Admin Notes</Label>
                <Textarea
                  id="notes"
                  placeholder="Add notes about this request..."
                  defaultValue={selectedRequest.adminNotes || ""}
                  rows={3}
                />
              </div>
              <div className="flex space-x-2">
                <Button
                  onClick={() => {
                    const notes = document.getElementById("notes").value
                    updateRequestStatus(selectedRequest.id, selectedRequest.status, notes)
                  }}
                  disabled={loading}
                >
                  Save Notes
                </Button>
                <Button variant="outline" onClick={() => setSelectedRequest(null)}>
                  Cancel
                </Button>
              </div>
            </div>
          </div>
        </Card>
      )}
    </div>
  )
}
