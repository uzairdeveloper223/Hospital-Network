"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Badge } from "@/components/ui/badge"
import { Shield, CheckCircle, AlertTriangle, Clock, CreditCard } from "lucide-react"
import { updateGovEmployeeStatus } from "@/lib/utils/patient"

export default function GovEmployeeVerification({ patient }) {
  const [cnic, setCnic] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [message, setMessage] = useState("")
  const [messageType, setMessageType] = useState("")

  const handleSubmitVerification = async (e) => {
    e.preventDefault()
    setIsLoading(true)
    setMessage("")

    try {
      const result = await updateGovEmployeeStatus(cnic)

      if (result.success) {
        setMessage(result.message)
        setMessageType("success")
        setCnic("")
      } else {
        setMessage(result.error || "Verification request failed")
        setMessageType("error")
      }
    } catch (error) {
      setMessage("An error occurred during verification")
      setMessageType("error")
    } finally {
      setIsLoading(false)
    }
  }

  const formatCNIC = (value) => {
    // Remove all non-digits
    const digits = value.replace(/\D/g, "")

    // Format as XXXXX-XXXXXXX-X
    if (digits.length <= 5) {
      return digits
    } else if (digits.length <= 12) {
      return `${digits.slice(0, 5)}-${digits.slice(5)}`
    } else {
      return `${digits.slice(0, 5)}-${digits.slice(5, 12)}-${digits.slice(12, 13)}`
    }
  }

  const handleCNICChange = (e) => {
    const formatted = formatCNIC(e.target.value)
    setCnic(formatted)
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Shield className="h-5 w-5 text-blue-600" />
              <CardTitle>Government Employee Verification</CardTitle>
            </div>
            {patient.isGovEmployee && (
              <Badge variant="secondary" className="bg-green-100 text-green-800">
                <CheckCircle className="h-3 w-3 mr-1" />
                Verified
              </Badge>
            )}
            {patient.govEmployeeRequested && !patient.isGovEmployee && (
              <Badge variant="secondary" className="bg-yellow-100 text-yellow-800">
                <Clock className="h-3 w-3 mr-1" />
                Pending Review
              </Badge>
            )}
          </div>
          <CardDescription>
            Verify your government employee status to receive special benefits and priority services
          </CardDescription>
        </CardHeader>
        <CardContent>
          {patient.isGovEmployee ? (
            <Alert className="border-green-200 bg-green-50">
              <CheckCircle className="h-4 w-4 text-green-600" />
              <AlertDescription className="text-green-800">
                Your government employee status has been verified. You are eligible for special benefits and priority
                services.
              </AlertDescription>
            </Alert>
          ) : patient.govEmployeeRequested ? (
            <Alert className="border-yellow-200 bg-yellow-50">
              <Clock className="h-4 w-4 text-yellow-600" />
              <AlertDescription className="text-yellow-800">
                Your government employee verification request is pending admin review. This process typically takes 2-3
                business days.
              </AlertDescription>
            </Alert>
          ) : (
            <>
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

              <form onSubmit={handleSubmitVerification} className="space-y-4">
                <div>
                  <Label htmlFor="cnic" className="flex items-center space-x-2">
                    <CreditCard className="h-4 w-4" />
                    <span>CNIC Number *</span>
                  </Label>
                  <Input
                    id="cnic"
                    value={cnic}
                    onChange={handleCNICChange}
                    placeholder="XXXXX-XXXXXXX-X"
                    maxLength={15}
                    required
                    className="mt-1 font-mono"
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Enter your 13-digit Pakistani CNIC number for verification
                  </p>
                </div>

                <Button
                  type="submit"
                  className="w-full bg-blue-600 hover:bg-blue-700 text-white"
                  disabled={isLoading || cnic.replace(/\D/g, "").length !== 13}
                >
                  {isLoading ? "Submitting for Review..." : "Submit for Verification"}
                </Button>
              </form>
            </>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Government Employee Benefits</CardTitle>
          <CardDescription>Special privileges available to verified government employees</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <div className="flex items-center space-x-3 p-3 bg-blue-50 rounded-lg">
              <CheckCircle className="h-5 w-5 text-blue-600" />
              <div>
                <p className="font-medium text-blue-900">Priority Appointment Scheduling</p>
                <p className="text-sm text-blue-700">Faster appointment approval and scheduling</p>
              </div>
            </div>
            <div className="flex items-center space-x-3 p-3 bg-green-50 rounded-lg">
              <CheckCircle className="h-5 w-5 text-green-600" />
              <div>
                <p className="font-medium text-green-900">Discounted Medical Services</p>
                <p className="text-sm text-green-700">Special rates for consultations and treatments</p>
              </div>
            </div>
            <div className="flex items-center space-x-3 p-3 bg-purple-50 rounded-lg">
              <CheckCircle className="h-5 w-5 text-purple-600" />
              <div>
                <p className="font-medium text-purple-900">Extended Consultation Time</p>
                <p className="text-sm text-purple-700">Longer appointment slots when needed</p>
              </div>
            </div>
            <div className="flex items-center space-x-3 p-3 bg-orange-50 rounded-lg">
              <CheckCircle className="h-5 w-5 text-orange-600" />
              <div>
                <p className="font-medium text-orange-900">Emergency Priority</p>
                <p className="text-sm text-orange-700">Priority handling in emergency situations</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Verification Process</CardTitle>
          <CardDescription>How government employee verification works</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex items-start space-x-3">
              <div className="w-6 h-6 bg-blue-600 text-white rounded-full flex items-center justify-center text-xs font-bold">
                1
              </div>
              <div>
                <p className="font-medium text-gray-900">Submit CNIC</p>
                <p className="text-sm text-gray-600">Provide your 13-digit Pakistani CNIC number</p>
              </div>
            </div>
            <div className="flex items-start space-x-3">
              <div className="w-6 h-6 bg-blue-600 text-white rounded-full flex items-center justify-center text-xs font-bold">
                2
              </div>
              <div>
                <p className="font-medium text-gray-900">Admin Review</p>
                <p className="text-sm text-gray-600">
                  Hospital admin manually verifies your government employee status
                </p>
              </div>
            </div>
            <div className="flex items-start space-x-3">
              <div className="w-6 h-6 bg-blue-600 text-white rounded-full flex items-center justify-center text-xs font-bold">
                3
              </div>
              <div>
                <p className="font-medium text-gray-900">Verification Complete</p>
                <p className="text-sm text-gray-600">
                  Once verified, you'll automatically receive government employee benefits
                </p>
              </div>
            </div>
          </div>
          <div className="mt-4 p-3 bg-gray-50 rounded-lg">
            <p className="text-xs text-gray-600">
              <strong>Note:</strong> Verification typically takes 2-3 business days. You will be notified once your
              status is updated.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
