"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Lock, Shield, CheckCircle, AlertTriangle } from "lucide-react"
import { changeAdminCode } from "@/lib/utils/admin"

export default function SettingsPanel() {
  const [currentCode, setCurrentCode] = useState("")
  const [newCode, setNewCode] = useState("")
  const [confirmCode, setConfirmCode] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [message, setMessage] = useState("")
  const [messageType, setMessageType] = useState("") // success, error

  const handleChangeCode = async (e) => {
    e.preventDefault()

    if (newCode !== confirmCode) {
      setMessage("New codes do not match")
      setMessageType("error")
      return
    }

    if (newCode.length < 6) {
      setMessage("New code must be at least 6 characters long")
      setMessageType("error")
      return
    }

    setIsLoading(true)
    setMessage("")

    try {
      const result = await changeAdminCode(currentCode, newCode)

      if (result.success) {
        setMessage("Admin access code changed successfully")
        setMessageType("success")
        setCurrentCode("")
        setNewCode("")
        setConfirmCode("")
      } else {
        setMessage(result.error || "Failed to change code")
        setMessageType("error")
      }
    } catch (error) {
      setMessage("An error occurred while changing the code")
      setMessageType("error")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center space-x-2">
            <Shield className="h-5 w-5 text-red-600" />
            <CardTitle>Security Settings</CardTitle>
          </div>
          <CardDescription>Manage admin access code and security settings</CardDescription>
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

          <form onSubmit={handleChangeCode} className="space-y-4">
            <div>
              <label htmlFor="currentCode" className="block text-sm font-medium text-gray-700 mb-2">
                Current Access Code
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  id="currentCode"
                  type="password"
                  value={currentCode}
                  onChange={(e) => setCurrentCode(e.target.value)}
                  placeholder="Enter current code"
                  className="pl-10"
                  required
                />
              </div>
            </div>

            <div>
              <label htmlFor="newCode" className="block text-sm font-medium text-gray-700 mb-2">
                New Access Code
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  id="newCode"
                  type="password"
                  value={newCode}
                  onChange={(e) => setNewCode(e.target.value)}
                  placeholder="Enter new code (min 6 characters)"
                  className="pl-10"
                  minLength={6}
                  required
                />
              </div>
            </div>

            <div>
              <label htmlFor="confirmCode" className="block text-sm font-medium text-gray-700 mb-2">
                Confirm New Code
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  id="confirmCode"
                  type="password"
                  value={confirmCode}
                  onChange={(e) => setConfirmCode(e.target.value)}
                  placeholder="Confirm new code"
                  className="pl-10"
                  required
                />
              </div>
            </div>

            <Button
              type="submit"
              className="w-full bg-red-600 hover:bg-red-700 text-white"
              disabled={isLoading || !currentCode || !newCode || !confirmCode}
            >
              {isLoading ? "Changing Code..." : "Change Access Code"}
            </Button>
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Security Information</CardTitle>
          <CardDescription>Current security status and policies</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between p-3 bg-green-50 rounded-lg">
            <div className="flex items-center space-x-3">
              <CheckCircle className="h-5 w-5 text-green-600" />
              <span className="text-sm font-medium text-green-800">IP Blocking Active</span>
            </div>
            <span className="text-xs text-green-600">3 attempts limit</span>
          </div>

          <div className="flex items-center justify-between p-3 bg-blue-50 rounded-lg">
            <div className="flex items-center space-x-3">
              <Shield className="h-5 w-5 text-blue-600" />
              <span className="text-sm font-medium text-blue-800">Auto-unlock Active</span>
            </div>
            <span className="text-xs text-blue-600">24 hours</span>
          </div>

          <div className="p-3 bg-gray-50 rounded-lg">
            <h4 className="text-sm font-medium text-gray-900 mb-2">Security Policies</h4>
            <ul className="text-xs text-gray-600 space-y-1">
              <li>• Failed attempts are tracked per IP address</li>
              <li>• Warning shown after 2 failed attempts</li>
              <li>• IP blocked after 3 failed attempts</li>
              <li>• Automatic unblock after 24 hours</li>
              <li>• Code changes are logged for audit</li>
            </ul>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
