"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { FileText, Download, Eye, Search, AlertCircle } from "lucide-react"
import { database } from "@/lib/firebase"
import { ref, onValue } from "firebase/database"

export default function LabReports({ patient }) {
  const [labReports, setLabReports] = useState([])
  const [filteredReports, setFilteredReports] = useState([])
  const [searchTerm, setSearchTerm] = useState("")
  const [filterStatus, setFilterStatus] = useState("all")
  const [filterType, setFilterType] = useState("all")
  const [selectedReport, setSelectedReport] = useState(null)

  useEffect(() => {
    // Load lab reports for this patient
    const reportsRef = ref(database, "labReports")
    const unsubscribe = onValue(reportsRef, (snapshot) => {
      if (snapshot.exists()) {
        const allReports = Object.entries(snapshot.val()).map(([key, value]) => ({
          id: key,
          ...value,
        }))
        const patientReports = allReports.filter(
          (report) => report.deviceId === patient.deviceId || report.patientPhone === patient.phone,
        )
        setLabReports(patientReports.sort((a, b) => new Date(b.reportDate) - new Date(a.reportDate)))
      }
    })

    return () => unsubscribe()
  }, [patient.deviceId, patient.phone])

  useEffect(() => {
    // Filter reports based on search and filters
    let filtered = labReports

    if (searchTerm) {
      filtered = filtered.filter(
        (report) =>
          report.testName.toLowerCase().includes(searchTerm.toLowerCase()) ||
          report.doctorName.toLowerCase().includes(searchTerm.toLowerCase()) ||
          report.reportType.toLowerCase().includes(searchTerm.toLowerCase()),
      )
    }

    if (filterStatus !== "all") {
      filtered = filtered.filter((report) => report.status === filterStatus)
    }

    if (filterType !== "all") {
      filtered = filtered.filter((report) => report.reportType === filterType)
    }

    setFilteredReports(filtered)
  }, [labReports, searchTerm, filterStatus, filterType])

  const getStatusColor = (status) => {
    switch (status) {
      case "completed":
        return "bg-green-100 text-green-800"
      case "pending":
        return "bg-yellow-100 text-yellow-800"
      case "processing":
        return "bg-blue-100 text-blue-800"
      case "abnormal":
        return "bg-red-100 text-red-800"
      default:
        return "bg-gray-100 text-gray-800"
    }
  }

  const handleDownloadReport = (report) => {
    if (report.reportUrl) {
      // Create a temporary link to download the file
      const link = document.createElement("a")
      link.href = report.reportUrl
      link.download = `${report.testName}_${report.reportDate}.pdf`
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
    } else {
      alert("Report file not available for download")
    }
  }

  const handleViewReport = (report) => {
    setSelectedReport(report)
  }

  const ReportCard = ({ report }) => (
    <Card className="hover:shadow-md transition-shadow">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <FileText className="h-5 w-5 text-blue-600" />
            <div>
              <CardTitle className="text-lg">{report.testName}</CardTitle>
              <CardDescription>
                Dr. {report.doctorName} • {new Date(report.reportDate).toLocaleDateString()}
              </CardDescription>
            </div>
          </div>
          <Badge className={getStatusColor(report.status)}>{report.status}</Badge>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          <div className="flex items-center justify-between text-sm">
            <span className="text-gray-600">Report Type:</span>
            <span className="font-medium">{report.reportType}</span>
          </div>
          <div className="flex items-center justify-between text-sm">
            <span className="text-gray-600">Test Date:</span>
            <span className="font-medium">{new Date(report.testDate).toLocaleDateString()}</span>
          </div>
          {report.urgency && (
            <div className="flex items-center justify-between text-sm">
              <span className="text-gray-600">Urgency:</span>
              <Badge variant="outline" className={report.urgency === "urgent" ? "border-red-300 text-red-700" : ""}>
                {report.urgency}
              </Badge>
            </div>
          )}
          {report.summary && (
            <div className="text-sm">
              <span className="text-gray-600">Summary:</span>
              <p className="mt-1 text-gray-800">{report.summary}</p>
            </div>
          )}
          <div className="flex gap-2 pt-2">
            <Button size="sm" variant="outline" onClick={() => handleViewReport(report)}>
              <Eye className="h-4 w-4 mr-1" />
              View
            </Button>
            {report.reportUrl && (
              <Button size="sm" onClick={() => handleDownloadReport(report)}>
                <Download className="h-4 w-4 mr-1" />
                Download
              </Button>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  )

  return (
    <div className="space-y-6">
      {/* Search and Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5 text-blue-600" />
            Lab Reports
          </CardTitle>
          <CardDescription>View and download your medical test reports</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Search reports by test name, doctor, or type..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <div className="flex gap-2">
              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
                className="px-3 py-2 border rounded-md text-sm"
              >
                <option value="all">All Status</option>
                <option value="completed">Completed</option>
                <option value="pending">Pending</option>
                <option value="processing">Processing</option>
                <option value="abnormal">Abnormal</option>
              </select>
              <select
                value={filterType}
                onChange={(e) => setFilterType(e.target.value)}
                className="px-3 py-2 border rounded-md text-sm"
              >
                <option value="all">All Types</option>
                <option value="blood-test">Blood Test</option>
                <option value="urine-test">Urine Test</option>
                <option value="x-ray">X-Ray</option>
                <option value="mri">MRI</option>
                <option value="ct-scan">CT Scan</option>
                <option value="ultrasound">Ultrasound</option>
                <option value="ecg">ECG</option>
                <option value="other">Other</option>
              </select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Reports List */}
      {filteredReports.length > 0 ? (
        <div className="grid gap-4">
          {filteredReports.map((report) => (
            <ReportCard key={report.id} report={report} />
          ))}
        </div>
      ) : (
        <Card>
          <CardContent className="text-center py-12">
            <FileText className="h-16 w-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No Lab Reports Found</h3>
            <p className="text-gray-500 mb-4">
              {searchTerm || filterStatus !== "all" || filterType !== "all"
                ? "No reports match your current filters."
                : "You don't have any lab reports yet."}
            </p>
            {(searchTerm || filterStatus !== "all" || filterType !== "all") && (
              <Button
                variant="outline"
                onClick={() => {
                  setSearchTerm("")
                  setFilterStatus("all")
                  setFilterType("all")
                }}
              >
                Clear Filters
              </Button>
            )}
          </CardContent>
        </Card>
      )}

      {/* Report Detail Modal */}
      {selectedReport && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <Card className="max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <CardHeader>
              <div className="flex items-start justify-between">
                <div>
                  <CardTitle className="text-xl">{selectedReport.testName}</CardTitle>
                  <CardDescription>
                    Report Date: {new Date(selectedReport.reportDate).toLocaleDateString()}
                  </CardDescription>
                </div>
                <Button variant="outline" size="sm" onClick={() => setSelectedReport(null)}>
                  ✕
                </Button>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <h4 className="font-medium text-gray-900 mb-2">Test Information</h4>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-600">Doctor:</span>
                      <span>Dr. {selectedReport.doctorName}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Type:</span>
                      <span>{selectedReport.reportType}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Test Date:</span>
                      <span>{new Date(selectedReport.testDate).toLocaleDateString()}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Status:</span>
                      <Badge className={getStatusColor(selectedReport.status)}>{selectedReport.status}</Badge>
                    </div>
                  </div>
                </div>
                <div>
                  <h4 className="font-medium text-gray-900 mb-2">Results Summary</h4>
                  <p className="text-sm text-gray-700">{selectedReport.summary || "No summary available"}</p>
                </div>
              </div>

              {selectedReport.results && (
                <div>
                  <h4 className="font-medium text-gray-900 mb-2">Detailed Results</h4>
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <pre className="text-sm text-gray-700 whitespace-pre-wrap">{selectedReport.results}</pre>
                  </div>
                </div>
              )}

              {selectedReport.doctorNotes && (
                <div>
                  <h4 className="font-medium text-gray-900 mb-2">Doctor's Notes</h4>
                  <div className="bg-blue-50 p-4 rounded-lg">
                    <p className="text-sm text-blue-900">{selectedReport.doctorNotes}</p>
                  </div>
                </div>
              )}

              {selectedReport.status === "abnormal" && (
                <div className="bg-red-50 border border-red-200 p-4 rounded-lg">
                  <div className="flex items-center gap-2 mb-2">
                    <AlertCircle className="h-5 w-5 text-red-600" />
                    <h4 className="font-medium text-red-900">Abnormal Results Detected</h4>
                  </div>
                  <p className="text-sm text-red-800">
                    Please consult with your doctor immediately to discuss these results and next steps.
                  </p>
                </div>
              )}

              <div className="flex gap-2 pt-4">
                {selectedReport.reportUrl && (
                  <Button onClick={() => handleDownloadReport(selectedReport)}>
                    <Download className="h-4 w-4 mr-2" />
                    Download PDF
                  </Button>
                )}
                <Button variant="outline" onClick={() => setSelectedReport(null)}>
                  Close
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  )
}
