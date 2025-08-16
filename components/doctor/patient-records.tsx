"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Search, User, FileText, Calendar, Phone, Shield, AlertCircle, Clock, Stethoscope } from "lucide-react"
import { database } from "@/lib/firebase"
import { ref, onValue, push } from "firebase/database"

export default function PatientRecords({ doctor }) {
  const [patients, setPatients] = useState([])
  const [selectedPatient, setSelectedPatient] = useState(null)
  const [patientHistory, setPatientHistory] = useState([])
  const [labReports, setLabReports] = useState([])
  const [prescriptions, setPrescriptions] = useState([])
  const [searchTerm, setSearchTerm] = useState("")
  const [newNote, setNewNote] = useState("")
  const [isAddingNote, setIsAddingNote] = useState(false)

  useEffect(() => {
    // Load all patients who have appointments with this doctor
    const appointmentsRef = ref(database, "appointments")
    const unsubscribeAppointments = onValue(appointmentsRef, (snapshot) => {
      if (snapshot.exists()) {
        const allAppointments = Object.entries(snapshot.val()).map(([key, value]) => ({
          id: key,
          ...value,
        }))
        const doctorAppointments = allAppointments.filter((apt) => apt.doctorId === doctor.uid)

        // Extract unique patients
        const uniquePatients = []
        const seenDeviceIds = new Set()

        doctorAppointments.forEach((apt) => {
          if (!seenDeviceIds.has(apt.deviceId)) {
            seenDeviceIds.add(apt.deviceId)
            uniquePatients.push({
              deviceId: apt.deviceId,
              name: apt.patientName,
              phone: apt.patientPhone,
              isGovEmployee: apt.isGovEmployee,
              lastVisit: apt.appointmentTime || apt.createdAt,
              totalAppointments: doctorAppointments.filter((a) => a.deviceId === apt.deviceId).length,
              completedAppointments: doctorAppointments.filter(
                (a) => a.deviceId === apt.deviceId && a.status === "completed",
              ).length,
            })
          }
        })

        setPatients(uniquePatients.sort((a, b) => new Date(b.lastVisit) - new Date(a.lastVisit)))
      }
    })

    return () => unsubscribeAppointments()
  }, [doctor.uid])

  useEffect(() => {
    if (selectedPatient) {
      // Load patient's appointment history
      const appointmentsRef = ref(database, "appointments")
      const unsubscribeHistory = onValue(appointmentsRef, (snapshot) => {
        if (snapshot.exists()) {
          const allAppointments = Object.entries(snapshot.val()).map(([key, value]) => ({
            id: key,
            ...value,
          }))
          const patientAppointments = allAppointments
            .filter((apt) => apt.deviceId === selectedPatient.deviceId)
            .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
          setPatientHistory(patientAppointments)
        }
      })

      // Load patient's lab reports
      const labReportsRef = ref(database, "labReports")
      const unsubscribeLab = onValue(labReportsRef, (snapshot) => {
        if (snapshot.exists()) {
          const allReports = Object.entries(snapshot.val()).map(([key, value]) => ({
            id: key,
            ...value,
          }))
          const patientReports = allReports
            .filter((report) => report.deviceId === selectedPatient.deviceId)
            .sort((a, b) => new Date(b.reportDate) - new Date(a.reportDate))
          setLabReports(patientReports)
        }
      })

      // Load patient's prescriptions
      const prescriptionsRef = ref(database, "prescriptions")
      const unsubscribePrescriptions = onValue(prescriptionsRef, (snapshot) => {
        if (snapshot.exists()) {
          const allPrescriptions = Object.entries(snapshot.val()).map(([key, value]) => ({
            id: key,
            ...value,
          }))
          const patientPrescriptions = allPrescriptions
            .filter((prescription) => prescription.deviceId === selectedPatient.deviceId)
            .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
          setPrescriptions(patientPrescriptions)
        }
      })

      return () => {
        unsubscribeHistory()
        unsubscribeLab()
        unsubscribePrescriptions()
      }
    }
  }, [selectedPatient])

  const handleAddNote = async (e) => {
    e.preventDefault()
    if (!newNote.trim() || !selectedPatient) return

    setIsAddingNote(true)

    const noteData = {
      deviceId: selectedPatient.deviceId,
      patientName: selectedPatient.name,
      doctorId: doctor.uid,
      doctorName: doctor.name,
      note: newNote,
      timestamp: new Date().toISOString(),
      type: "doctor_note",
    }

    try {
      const notesRef = ref(database, "patientNotes")
      await push(notesRef, noteData)
      setNewNote("")
      alert("Note added successfully!")
    } catch (error) {
      console.error("Error adding note:", error)
      alert("Error adding note. Please try again.")
    } finally {
      setIsAddingNote(false)
    }
  }

  const filteredPatients = patients.filter(
    (patient) => patient.name.toLowerCase().includes(searchTerm.toLowerCase()) || patient.phone.includes(searchTerm),
  )

  const getStatusColor = (status) => {
    switch (status) {
      case "completed":
        return "bg-green-100 text-green-800"
      case "approved":
        return "bg-blue-100 text-blue-800"
      case "pending":
        return "bg-yellow-100 text-yellow-800"
      case "cancelled":
        return "bg-red-100 text-red-800"
      default:
        return "bg-gray-100 text-gray-800"
    }
  }

  return (
    <div className="grid lg:grid-cols-3 gap-6">
      {/* Patient List */}
      <Card className="lg:col-span-1">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <User className="h-5 w-5" />
            Your Patients
          </CardTitle>
          <CardDescription>Patients who have appointments with you</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Search patients..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>

            <div className="space-y-2 max-h-96 overflow-y-auto">
              {filteredPatients.map((patient) => (
                <div
                  key={patient.deviceId}
                  className={`p-3 rounded-lg border cursor-pointer transition-colors ${
                    selectedPatient?.deviceId === patient.deviceId
                      ? "bg-blue-50 border-blue-200"
                      : "bg-gray-50 hover:bg-gray-100"
                  }`}
                  onClick={() => setSelectedPatient(patient)}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <p className="font-medium text-gray-900">{patient.name}</p>
                      <p className="text-sm text-gray-600">{patient.phone}</p>
                      <div className="flex items-center gap-2 mt-2">
                        {patient.isGovEmployee && (
                          <Badge variant="secondary" className="bg-blue-100 text-blue-800 text-xs">
                            <Shield className="h-3 w-3 mr-1" />
                            Gov Employee
                          </Badge>
                        )}
                        <Badge variant="outline" className="text-xs">
                          {patient.completedAppointments}/{patient.totalAppointments} visits
                        </Badge>
                      </div>
                    </div>
                  </div>
                  <p className="text-xs text-gray-500 mt-2">
                    Last visit: {new Date(patient.lastVisit).toLocaleDateString()}
                  </p>
                </div>
              ))}
            </div>

            {filteredPatients.length === 0 && (
              <div className="text-center py-8">
                <User className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-500">No patients found</p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Patient Details */}
      <div className="lg:col-span-2">
        {selectedPatient ? (
          <div className="space-y-6">
            {/* Patient Info Header */}
            <Card>
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div>
                    <CardTitle className="text-xl">{selectedPatient.name}</CardTitle>
                    <CardDescription className="flex items-center gap-4 mt-2">
                      <span className="flex items-center gap-1">
                        <Phone className="h-4 w-4" />
                        {selectedPatient.phone}
                      </span>
                      <span className="flex items-center gap-1">
                        <Calendar className="h-4 w-4" />
                        {selectedPatient.totalAppointments} total visits
                      </span>
                    </CardDescription>
                  </div>
                  <div className="flex gap-2">
                    {selectedPatient.isGovEmployee && (
                      <Badge variant="secondary" className="bg-blue-100 text-blue-800">
                        <Shield className="h-3 w-3 mr-1" />
                        Government Employee
                      </Badge>
                    )}
                  </div>
                </div>
              </CardHeader>
            </Card>

            {/* Patient Records Tabs */}
            <Tabs defaultValue="history" className="w-full">
              <TabsList className="grid w-full grid-cols-4">
                <TabsTrigger value="history">Appointment History</TabsTrigger>
                <TabsTrigger value="lab-reports">Lab Reports</TabsTrigger>
                <TabsTrigger value="prescriptions">Prescriptions</TabsTrigger>
                <TabsTrigger value="notes">Notes</TabsTrigger>
              </TabsList>

              <TabsContent value="history" className="space-y-4">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Appointment History</CardTitle>
                  </CardHeader>
                  <CardContent>
                    {patientHistory.length > 0 ? (
                      <div className="space-y-4">
                        {patientHistory.map((appointment) => (
                          <div key={appointment.id} className="border rounded-lg p-4">
                            <div className="flex items-start justify-between mb-3">
                              <div>
                                <p className="font-medium">{appointment.appointmentReason}</p>
                                <p className="text-sm text-gray-600">
                                  {new Date(appointment.createdAt).toLocaleDateString()}
                                  {appointment.appointmentTime && (
                                    <span> • Scheduled: {new Date(appointment.appointmentTime).toLocaleString()}</span>
                                  )}
                                </p>
                              </div>
                              <div className="flex gap-2">
                                <Badge className={getStatusColor(appointment.status)}>{appointment.status}</Badge>
                                {appointment.isEmergency && <Badge variant="destructive">Emergency</Badge>}
                              </div>
                            </div>
                            {appointment.symptoms && (
                              <div className="mb-2">
                                <p className="text-sm font-medium text-gray-700">Symptoms:</p>
                                <p className="text-sm text-gray-600">{appointment.symptoms}</p>
                              </div>
                            )}
                            {appointment.doctorNotes && (
                              <div className="bg-blue-50 p-3 rounded">
                                <p className="text-sm font-medium text-blue-900">Doctor's Notes:</p>
                                <p className="text-sm text-blue-800">{appointment.doctorNotes}</p>
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="text-center py-8">
                        <Calendar className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                        <p className="text-gray-500">No appointment history found</p>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="lab-reports" className="space-y-4">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Lab Reports</CardTitle>
                  </CardHeader>
                  <CardContent>
                    {labReports.length > 0 ? (
                      <div className="space-y-4">
                        {labReports.map((report) => (
                          <div key={report.id} className="border rounded-lg p-4">
                            <div className="flex items-start justify-between mb-3">
                              <div>
                                <p className="font-medium">{report.testName}</p>
                                <p className="text-sm text-gray-600">
                                  {new Date(report.reportDate).toLocaleDateString()} • {report.reportType}
                                </p>
                              </div>
                              <Badge className={getStatusColor(report.status)}>{report.status}</Badge>
                            </div>
                            {report.summary && <p className="text-sm text-gray-700 mb-2">{report.summary}</p>}
                            {report.status === "abnormal" && (
                              <div className="bg-red-50 border border-red-200 p-3 rounded">
                                <div className="flex items-center gap-2">
                                  <AlertCircle className="h-4 w-4 text-red-600" />
                                  <p className="text-sm font-medium text-red-900">Abnormal Results</p>
                                </div>
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="text-center py-8">
                        <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                        <p className="text-gray-500">No lab reports found</p>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="prescriptions" className="space-y-4">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Prescription History</CardTitle>
                  </CardHeader>
                  <CardContent>
                    {prescriptions.length > 0 ? (
                      <div className="space-y-4">
                        {prescriptions.map((prescription) => (
                          <div key={prescription.id} className="border rounded-lg p-4">
                            <div className="flex items-start justify-between mb-3">
                              <div>
                                <p className="font-medium">Prescription #{prescription.id.slice(-6)}</p>
                                <p className="text-sm text-gray-600">
                                  {new Date(prescription.createdAt).toLocaleDateString()}
                                </p>
                              </div>
                              <Badge className={getStatusColor(prescription.status)}>{prescription.status}</Badge>
                            </div>
                            {prescription.medications && (
                              <div className="space-y-2">
                                {prescription.medications.map((med, index) => (
                                  <div key={index} className="bg-gray-50 p-3 rounded">
                                    <p className="font-medium text-sm">{med.name}</p>
                                    <p className="text-xs text-gray-600">
                                      {med.dosage} • {med.frequency} • {med.duration}
                                    </p>
                                  </div>
                                ))}
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="text-center py-8">
                        <Stethoscope className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                        <p className="text-gray-500">No prescriptions found</p>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="notes" className="space-y-4">
                {/* Add New Note */}
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Add Patient Note</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <form onSubmit={handleAddNote} className="space-y-4">
                      <div>
                        <Label htmlFor="note">Note</Label>
                        <Textarea
                          id="note"
                          value={newNote}
                          onChange={(e) => setNewNote(e.target.value)}
                          placeholder="Add notes about patient condition, follow-up instructions, etc."
                          rows={4}
                        />
                      </div>
                      <Button type="submit" disabled={!newNote.trim() || isAddingNote}>
                        {isAddingNote ? (
                          <>
                            <Clock className="h-4 w-4 mr-2 animate-spin" />
                            Adding Note...
                          </>
                        ) : (
                          "Add Note"
                        )}
                      </Button>
                    </form>
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          </div>
        ) : (
          <Card>
            <CardContent className="text-center py-12">
              <User className="h-16 w-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">Select a Patient</h3>
              <p className="text-gray-500">Choose a patient from the list to view their medical records</p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  )
}
