"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { Plus, Trash2, FileText, Search, Pill } from "lucide-react"
import { database } from "@/lib/firebase"
import { ref, push, onValue } from "firebase/database"

export default function PrescriptionManagement({ doctor }) {
  const [patients, setPatients] = useState([])
  const [prescriptions, setPrescriptions] = useState([])
  const [selectedPatient, setSelectedPatient] = useState("")
  const [medications, setMedications] = useState([
    { name: "", dosage: "", frequency: "", duration: "", instructions: "" },
  ])
  const [diagnosis, setDiagnosis] = useState("")
  const [additionalNotes, setAdditionalNotes] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [searchTerm, setSearchTerm] = useState("")

  useEffect(() => {
    // Load patients who have appointments with this doctor
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
            })
          }
        })

        setPatients(uniquePatients)
      }
    })

    // Load prescriptions created by this doctor
    const prescriptionsRef = ref(database, "prescriptions")
    const unsubscribePrescriptions = onValue(prescriptionsRef, (snapshot) => {
      if (snapshot.exists()) {
        const allPrescriptions = Object.entries(snapshot.val()).map(([key, value]) => ({
          id: key,
          ...value,
        }))
        const doctorPrescriptions = allPrescriptions
          .filter((prescription) => prescription.doctorId === doctor.uid)
          .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
        setPrescriptions(doctorPrescriptions)
      }
    })

    return () => {
      unsubscribeAppointments()
      unsubscribePrescriptions()
    }
  }, [doctor.uid])

  const addMedication = () => {
    setMedications([...medications, { name: "", dosage: "", frequency: "", duration: "", instructions: "" }])
  }

  const removeMedication = (index) => {
    if (medications.length > 1) {
      setMedications(medications.filter((_, i) => i !== index))
    }
  }

  const updateMedication = (index, field, value) => {
    const updatedMedications = medications.map((med, i) => (i === index ? { ...med, [field]: value } : med))
    setMedications(updatedMedications)
  }

  const handleSubmitPrescription = async (e) => {
    e.preventDefault()
    if (!selectedPatient || medications.some((med) => !med.name || !med.dosage)) return

    setIsSubmitting(true)

    const selectedPatientData = patients.find((p) => p.deviceId === selectedPatient)
    const prescriptionData = {
      deviceId: selectedPatient,
      patientName: selectedPatientData.name,
      patientPhone: selectedPatientData.phone,
      doctorId: doctor.uid,
      doctorName: doctor.name,
      doctorSpecialization: doctor.specialization,
      diagnosis,
      medications: medications.filter((med) => med.name && med.dosage),
      additionalNotes,
      createdAt: new Date().toISOString(),
      status: "active",
      prescriptionNumber: `RX-${Date.now()}`,
    }

    try {
      const prescriptionsRef = ref(database, "prescriptions")
      await push(prescriptionsRef, prescriptionData)

      // Reset form
      setSelectedPatient("")
      setMedications([{ name: "", dosage: "", frequency: "", duration: "", instructions: "" }])
      setDiagnosis("")
      setAdditionalNotes("")

      alert("Prescription created successfully!")
    } catch (error) {
      console.error("Error creating prescription:", error)
      alert("Error creating prescription. Please try again.")
    } finally {
      setIsSubmitting(false)
    }
  }

  const filteredPrescriptions = prescriptions.filter(
    (prescription) =>
      prescription.patientName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      prescription.prescriptionNumber.toLowerCase().includes(searchTerm.toLowerCase()),
  )

  return (
    <div className="grid lg:grid-cols-2 gap-6">
      {/* Create New Prescription */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Pill className="h-5 w-5" />
            Create New Prescription
          </CardTitle>
          <CardDescription>Write a new prescription for your patient</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmitPrescription} className="space-y-4">
            <div>
              <Label htmlFor="patient">Select Patient *</Label>
              <Select value={selectedPatient} onValueChange={setSelectedPatient}>
                <SelectTrigger>
                  <SelectValue placeholder="Choose a patient" />
                </SelectTrigger>
                <SelectContent>
                  {patients.map((patient) => (
                    <SelectItem key={patient.deviceId} value={patient.deviceId}>
                      {patient.name} - {patient.phone}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="diagnosis">Diagnosis</Label>
              <Input
                id="diagnosis"
                value={diagnosis}
                onChange={(e) => setDiagnosis(e.target.value)}
                placeholder="Patient's diagnosis"
              />
            </div>

            <div>
              <div className="flex items-center justify-between mb-3">
                <Label>Medications *</Label>
                <Button type="button" variant="outline" size="sm" onClick={addMedication}>
                  <Plus className="h-4 w-4 mr-1" />
                  Add Medication
                </Button>
              </div>

              <div className="space-y-4">
                {medications.map((medication, index) => (
                  <div key={index} className="border rounded-lg p-4 space-y-3">
                    <div className="flex items-center justify-between">
                      <h4 className="font-medium">Medication {index + 1}</h4>
                      {medications.length > 1 && (
                        <Button type="button" variant="outline" size="sm" onClick={() => removeMedication(index)}>
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      )}
                    </div>

                    <div className="grid md:grid-cols-2 gap-3">
                      <div>
                        <Label>Medicine Name *</Label>
                        <Input
                          value={medication.name}
                          onChange={(e) => updateMedication(index, "name", e.target.value)}
                          placeholder="e.g., Paracetamol"
                        />
                      </div>
                      <div>
                        <Label>Dosage *</Label>
                        <Input
                          value={medication.dosage}
                          onChange={(e) => updateMedication(index, "dosage", e.target.value)}
                          placeholder="e.g., 500mg"
                        />
                      </div>
                      <div>
                        <Label>Frequency</Label>
                        <Select
                          value={medication.frequency}
                          onValueChange={(value) => updateMedication(index, "frequency", value)}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="How often" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="once-daily">Once daily</SelectItem>
                            <SelectItem value="twice-daily">Twice daily</SelectItem>
                            <SelectItem value="three-times-daily">Three times daily</SelectItem>
                            <SelectItem value="four-times-daily">Four times daily</SelectItem>
                            <SelectItem value="as-needed">As needed</SelectItem>
                            <SelectItem value="before-meals">Before meals</SelectItem>
                            <SelectItem value="after-meals">After meals</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div>
                        <Label>Duration</Label>
                        <Input
                          value={medication.duration}
                          onChange={(e) => updateMedication(index, "duration", e.target.value)}
                          placeholder="e.g., 7 days"
                        />
                      </div>
                    </div>

                    <div>
                      <Label>Special Instructions</Label>
                      <Textarea
                        value={medication.instructions}
                        onChange={(e) => updateMedication(index, "instructions", e.target.value)}
                        placeholder="Any special instructions for this medication"
                        rows={2}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div>
              <Label htmlFor="notes">Additional Notes</Label>
              <Textarea
                id="notes"
                value={additionalNotes}
                onChange={(e) => setAdditionalNotes(e.target.value)}
                placeholder="Any additional instructions or notes for the patient"
                rows={3}
              />
            </div>

            <Button
              type="submit"
              disabled={!selectedPatient || medications.some((med) => !med.name || !med.dosage) || isSubmitting}
              className="w-full"
            >
              {isSubmitting ? "Creating Prescription..." : "Create Prescription"}
            </Button>
          </form>
        </CardContent>
      </Card>

      {/* Prescription History */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Prescription History
          </CardTitle>
          <CardDescription>Your recent prescriptions</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Search prescriptions..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>

            <div className="space-y-3 max-h-96 overflow-y-auto">
              {filteredPrescriptions.length > 0 ? (
                filteredPrescriptions.map((prescription) => (
                  <div key={prescription.id} className="border rounded-lg p-4">
                    <div className="flex items-start justify-between mb-3">
                      <div>
                        <p className="font-medium">{prescription.patientName}</p>
                        <p className="text-sm text-gray-600">{prescription.prescriptionNumber}</p>
                        <p className="text-xs text-gray-500">{new Date(prescription.createdAt).toLocaleDateString()}</p>
                      </div>
                      <Badge variant="outline" className="bg-green-50 text-green-700">
                        {prescription.status}
                      </Badge>
                    </div>

                    {prescription.diagnosis && (
                      <div className="mb-3">
                        <p className="text-sm font-medium text-gray-700">Diagnosis:</p>
                        <p className="text-sm text-gray-600">{prescription.diagnosis}</p>
                      </div>
                    )}

                    <div className="space-y-2">
                      <p className="text-sm font-medium text-gray-700">Medications:</p>
                      {prescription.medications.map((med, index) => (
                        <div key={index} className="bg-gray-50 p-2 rounded text-sm">
                          <p className="font-medium">
                            {med.name} - {med.dosage}
                          </p>
                          {med.frequency && <p className="text-gray-600">{med.frequency}</p>}
                          {med.duration && <p className="text-gray-600">Duration: {med.duration}</p>}
                        </div>
                      ))}
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center py-8">
                  <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-500">No prescriptions found</p>
                </div>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
