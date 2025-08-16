"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { Calendar } from "@/components/ui/calendar"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { FileText, Download, CalendarIcon, Search, Award } from "lucide-react"
import { database } from "@/lib/firebase"
import { ref, push, onValue } from "firebase/database"
import { format } from "date-fns"

export default function MedicalCertificates({ doctor }) {
  const [patients, setPatients] = useState([])
  const [certificates, setCertificates] = useState([])
  const [selectedPatient, setSelectedPatient] = useState("")
  const [certificateType, setCertificateType] = useState("")
  const [diagnosis, setDiagnosis] = useState("")
  const [recommendations, setRecommendations] = useState("")
  const [startDate, setStartDate] = useState(null)
  const [endDate, setEndDate] = useState(null)
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

    // Load certificates created by this doctor
    const certificatesRef = ref(database, "medicalCertificates")
    const unsubscribeCertificates = onValue(certificatesRef, (snapshot) => {
      if (snapshot.exists()) {
        const allCertificates = Object.entries(snapshot.val()).map(([key, value]) => ({
          id: key,
          ...value,
        }))
        const doctorCertificates = allCertificates
          .filter((certificate) => certificate.doctorId === doctor.uid)
          .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
        setCertificates(doctorCertificates)
      }
    })

    return () => {
      unsubscribeAppointments()
      unsubscribeCertificates()
    }
  }, [doctor.uid])

  const handleSubmitCertificate = async (e) => {
    e.preventDefault()
    if (!selectedPatient || !certificateType) return

    setIsSubmitting(true)

    const selectedPatientData = patients.find((p) => p.deviceId === selectedPatient)
    const certificateData = {
      deviceId: selectedPatient,
      patientName: selectedPatientData.name,
      patientPhone: selectedPatientData.phone,
      doctorId: doctor.uid,
      doctorName: doctor.name,
      doctorSpecialization: doctor.specialization,
      certificateType,
      diagnosis,
      recommendations,
      startDate: startDate ? startDate.toISOString() : null,
      endDate: endDate ? endDate.toISOString() : null,
      additionalNotes,
      createdAt: new Date().toISOString(),
      certificateNumber: `CERT-${Date.now()}`,
      status: "active",
    }

    try {
      const certificatesRef = ref(database, "medicalCertificates")
      await push(certificatesRef, certificateData)

      // Reset form
      setSelectedPatient("")
      setCertificateType("")
      setDiagnosis("")
      setRecommendations("")
      setStartDate(null)
      setEndDate(null)
      setAdditionalNotes("")

      alert("Medical certificate generated successfully!")
    } catch (error) {
      console.error("Error creating certificate:", error)
      alert("Error creating certificate. Please try again.")
    } finally {
      setIsSubmitting(false)
    }
  }

  const generateCertificatePDF = (certificate) => {
    // In a real application, this would generate a proper PDF
    // For now, we'll create a formatted text version
    const certificateContent = `
MEDICAL CERTIFICATE

Certificate No: ${certificate.certificateNumber}
Date: ${new Date(certificate.createdAt).toLocaleDateString()}

This is to certify that ${certificate.patientName} has been examined by me.

Patient Details:
Name: ${certificate.patientName}
Phone: ${certificate.patientPhone}

Medical Information:
${certificate.diagnosis ? `Diagnosis: ${certificate.diagnosis}` : ""}
${certificate.recommendations ? `Recommendations: ${certificate.recommendations}` : ""}

${
  certificate.certificateType === "sick-leave" && certificate.startDate && certificate.endDate
    ? `Period of Rest: ${new Date(certificate.startDate).toLocaleDateString()} to ${new Date(certificate.endDate).toLocaleDateString()}`
    : ""
}

${certificate.additionalNotes ? `Additional Notes: ${certificate.additionalNotes}` : ""}

Doctor's Details:
Dr. ${certificate.doctorName}
${certificate.doctorSpecialization}

Signature: _________________
Date: ${new Date(certificate.createdAt).toLocaleDateString()}
    `

    // Create and download the certificate
    const blob = new Blob([certificateContent], { type: "text/plain" })
    const url = window.URL.createObjectURL(blob)
    const link = document.createElement("a")
    link.href = url
    link.download = `Medical_Certificate_${certificate.certificateNumber}.txt`
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    window.URL.revokeObjectURL(url)
  }

  const filteredCertificates = certificates.filter(
    (certificate) =>
      certificate.patientName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      certificate.certificateNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
      certificate.certificateType.toLowerCase().includes(searchTerm.toLowerCase()),
  )

  const getCertificateTypeLabel = (type) => {
    switch (type) {
      case "sick-leave":
        return "Sick Leave Certificate"
      case "fitness":
        return "Medical Fitness Certificate"
      case "disability":
        return "Disability Certificate"
      case "vaccination":
        return "Vaccination Certificate"
      case "medical-report":
        return "Medical Report"
      case "referral":
        return "Referral Letter"
      default:
        return type
    }
  }

  return (
    <div className="grid lg:grid-cols-2 gap-6">
      {/* Generate New Certificate */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Award className="h-5 w-5" />
            Generate Medical Certificate
          </CardTitle>
          <CardDescription>Create medical certificates for your patients</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmitCertificate} className="space-y-4">
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
              <Label htmlFor="certificateType">Certificate Type *</Label>
              <Select value={certificateType} onValueChange={setCertificateType}>
                <SelectTrigger>
                  <SelectValue placeholder="Select certificate type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="sick-leave">Sick Leave Certificate</SelectItem>
                  <SelectItem value="fitness">Medical Fitness Certificate</SelectItem>
                  <SelectItem value="disability">Disability Certificate</SelectItem>
                  <SelectItem value="vaccination">Vaccination Certificate</SelectItem>
                  <SelectItem value="medical-report">Medical Report</SelectItem>
                  <SelectItem value="referral">Referral Letter</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="diagnosis">Diagnosis/Condition</Label>
              <Input
                id="diagnosis"
                value={diagnosis}
                onChange={(e) => setDiagnosis(e.target.value)}
                placeholder="Patient's medical condition or diagnosis"
              />
            </div>

            <div>
              <Label htmlFor="recommendations">Medical Recommendations</Label>
              <Textarea
                id="recommendations"
                value={recommendations}
                onChange={(e) => setRecommendations(e.target.value)}
                placeholder="Treatment recommendations, restrictions, or medical advice"
                rows={3}
              />
            </div>

            {certificateType === "sick-leave" && (
              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <Label>Start Date</Label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button variant="outline" className="w-full justify-start text-left font-normal bg-transparent">
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {startDate ? format(startDate, "PPP") : "Select start date"}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0">
                      <Calendar mode="single" selected={startDate} onSelect={setStartDate} initialFocus />
                    </PopoverContent>
                  </Popover>
                </div>
                <div>
                  <Label>End Date</Label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button variant="outline" className="w-full justify-start text-left font-normal bg-transparent">
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {endDate ? format(endDate, "PPP") : "Select end date"}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0">
                      <Calendar mode="single" selected={endDate} onSelect={setEndDate} initialFocus />
                    </PopoverContent>
                  </Popover>
                </div>
              </div>
            )}

            <div>
              <Label htmlFor="notes">Additional Notes</Label>
              <Textarea
                id="notes"
                value={additionalNotes}
                onChange={(e) => setAdditionalNotes(e.target.value)}
                placeholder="Any additional information or special instructions"
                rows={3}
              />
            </div>

            <Button type="submit" disabled={!selectedPatient || !certificateType || isSubmitting} className="w-full">
              {isSubmitting ? "Generating Certificate..." : "Generate Certificate"}
            </Button>
          </form>
        </CardContent>
      </Card>

      {/* Certificate History */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Certificate History
          </CardTitle>
          <CardDescription>Previously generated certificates</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Search certificates..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>

            <div className="space-y-3 max-h-96 overflow-y-auto">
              {filteredCertificates.length > 0 ? (
                filteredCertificates.map((certificate) => (
                  <div key={certificate.id} className="border rounded-lg p-4">
                    <div className="flex items-start justify-between mb-3">
                      <div>
                        <p className="font-medium">{certificate.patientName}</p>
                        <p className="text-sm text-gray-600">{certificate.certificateNumber}</p>
                        <p className="text-xs text-gray-500">{new Date(certificate.createdAt).toLocaleDateString()}</p>
                      </div>
                      <div className="flex flex-col items-end gap-2">
                        <Badge variant="outline" className="bg-blue-50 text-blue-700">
                          {getCertificateTypeLabel(certificate.certificateType)}
                        </Badge>
                        <Button size="sm" variant="outline" onClick={() => generateCertificatePDF(certificate)}>
                          <Download className="h-4 w-4 mr-1" />
                          Download
                        </Button>
                      </div>
                    </div>

                    {certificate.diagnosis && (
                      <div className="mb-2">
                        <p className="text-sm font-medium text-gray-700">Diagnosis:</p>
                        <p className="text-sm text-gray-600">{certificate.diagnosis}</p>
                      </div>
                    )}

                    {certificate.certificateType === "sick-leave" && certificate.startDate && certificate.endDate && (
                      <div className="mb-2">
                        <p className="text-sm font-medium text-gray-700">Leave Period:</p>
                        <p className="text-sm text-gray-600">
                          {new Date(certificate.startDate).toLocaleDateString()} to{" "}
                          {new Date(certificate.endDate).toLocaleDateString()}
                        </p>
                      </div>
                    )}

                    {certificate.recommendations && (
                      <div className="bg-gray-50 p-3 rounded text-sm">
                        <p className="font-medium text-gray-700 mb-1">Recommendations:</p>
                        <p className="text-gray-600">{certificate.recommendations}</p>
                      </div>
                    )}
                  </div>
                ))
              ) : (
                <div className="text-center py-8">
                  <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-500">No certificates found</p>
                </div>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
