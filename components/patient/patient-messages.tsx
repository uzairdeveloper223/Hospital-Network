"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Badge } from "@/components/ui/badge"
import { MessageSquare, Send, CheckCircle, AlertTriangle, Clock, User } from "lucide-react"
import { sendMessageToAdmin } from "@/lib/utils/patient"
import { database } from "@/lib/firebase"
import { ref, onValue, off } from "firebase/database"

export default function PatientMessages({ patient }) {
  const [message, setMessage] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [feedback, setFeedback] = useState("")
  const [feedbackType, setFeedbackType] = useState("")
  const [messageHistory, setMessageHistory] = useState([])
  const [adminReplies, setAdminReplies] = useState([])

  useEffect(() => {
    // Listen to patient's message history
    const messagesRef = ref(database, "messages")
    const unsubscribeMessages = onValue(messagesRef, (snapshot) => {
      if (snapshot.exists()) {
        const allMessages = Object.entries(snapshot.val()).map(([key, value]) => ({
          id: key,
          ...value,
        }))
        const patientMessages = allMessages
          .filter((msg) => msg.deviceId === patient.deviceId)
          .sort((a, b) => new Date(b.sentAt) - new Date(a.sentAt))
        setMessageHistory(patientMessages)
      }
    })

    // Listen to admin replies
    const repliesRef = ref(database, "messageReplies")
    const unsubscribeReplies = onValue(repliesRef, (snapshot) => {
      if (snapshot.exists()) {
        const allReplies = Object.entries(snapshot.val()).map(([key, value]) => ({
          id: key,
          ...value,
        }))
        const patientReplies = allReplies
          .filter((reply) => reply.deviceId === patient.deviceId)
          .sort((a, b) => new Date(b.sentAt) - new Date(a.sentAt))
        setAdminReplies(patientReplies)
      }
    })

    return () => {
      off(messagesRef, "value", unsubscribeMessages)
      off(repliesRef, "value", unsubscribeReplies)
    }
  }, [patient.deviceId])

  const handleSendMessage = async (e) => {
    e.preventDefault()
    setIsLoading(true)
    setFeedback("")

    try {
      const result = await sendMessageToAdmin(message)

      if (result.success) {
        setFeedback("Message sent successfully! Admin will respond soon.")
        setFeedbackType("success")
        setMessage("")
      } else {
        setFeedback(result.error || "Failed to send message")
        setFeedbackType("error")
      }
    } catch (error) {
      setFeedback("An error occurred while sending the message")
      setFeedbackType("error")
    } finally {
      setIsLoading(false)
    }
  }

  const MessageCard = ({ msg, isReply = false }) => (
    <Card className={`${isReply ? "bg-green-50 border-green-200" : "bg-blue-50 border-blue-200"}`}>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            {isReply ? (
              <User className="h-4 w-4 text-green-600" />
            ) : (
              <MessageSquare className="h-4 w-4 text-blue-600" />
            )}
            <CardTitle className={`text-sm ${isReply ? "text-green-900" : "text-blue-900"}`}>
              {isReply ? "Admin Reply" : "Your Message"}
            </CardTitle>
            {!isReply && (
              <div className="flex space-x-1">
                {msg.read && (
                  <Badge variant="secondary" className="bg-green-100 text-green-800 text-xs">
                    Read
                  </Badge>
                )}
                {msg.replied && (
                  <Badge variant="secondary" className="bg-purple-100 text-purple-800 text-xs">
                    Replied
                  </Badge>
                )}
              </div>
            )}
          </div>
          <div className="flex items-center space-x-1 text-xs text-gray-500">
            <Clock className="h-3 w-3" />
            <span>{new Date(isReply ? msg.sentAt : msg.sentAt).toLocaleString()}</span>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <p className={`text-sm ${isReply ? "text-green-800" : "text-blue-800"}`}>
          {isReply ? msg.adminReply : msg.message}
        </p>
      </CardContent>
    </Card>
  )

  // Combine and sort messages and replies chronologically
  const allCommunications = [
    ...messageHistory.map((msg) => ({ ...msg, type: "message" })),
    ...adminReplies.map((reply) => ({ ...reply, type: "reply" })),
  ].sort((a, b) => new Date(b.sentAt) - new Date(a.sentAt))

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <MessageSquare className="h-5 w-5 text-purple-600" />
            <span>Send Message to Admin</span>
          </CardTitle>
          <CardDescription>
            Send a message directly to the hospital administration. You will receive a response soon.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {feedback && (
            <Alert
              className={`mb-4 ${
                feedbackType === "success" ? "border-green-200 bg-green-50" : "border-red-200 bg-red-50"
              }`}
            >
              {feedbackType === "success" ? (
                <CheckCircle className="h-4 w-4 text-green-600" />
              ) : (
                <AlertTriangle className="h-4 w-4 text-red-600" />
              )}
              <AlertDescription className={feedbackType === "success" ? "text-green-800" : "text-red-800"}>
                {feedback}
              </AlertDescription>
            </Alert>
          )}

          <form onSubmit={handleSendMessage} className="space-y-4">
            <div>
              <Textarea
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="Type your message to the admin here..."
                rows={6}
                required
                className="resize-none"
              />
              <p className="text-xs text-gray-500 mt-1">
                Your message will be sent with your name and phone number for identification.
              </p>
            </div>

            <Button
              type="submit"
              className="w-full bg-purple-600 hover:bg-purple-700 text-white"
              disabled={isLoading || !message.trim()}
            >
              {isLoading ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Sending Message...
                </>
              ) : (
                <>
                  <Send className="h-4 w-4 mr-2" />
                  Send Message
                </>
              )}
            </Button>
          </form>
        </CardContent>
      </Card>

      {/* Message History */}
      {allCommunications.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Message History</CardTitle>
            <CardDescription>Your conversation with hospital administration</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4 max-h-[500px] overflow-y-auto">
            {allCommunications.map((item) => (
              <MessageCard key={`${item.type}-${item.id}`} msg={item} isReply={item.type === "reply"} />
            ))}
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Message Guidelines</CardTitle>
          <CardDescription>Tips for effective communication with hospital administration</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3 text-sm text-gray-600">
            <div className="flex items-start space-x-2">
              <div className="w-2 h-2 bg-blue-600 rounded-full mt-2"></div>
              <p>Be clear and specific about your concern or request</p>
            </div>
            <div className="flex items-start space-x-2">
              <div className="w-2 h-2 bg-blue-600 rounded-full mt-2"></div>
              <p>Include relevant details like appointment dates or doctor names</p>
            </div>
            <div className="flex items-start space-x-2">
              <div className="w-2 h-2 bg-blue-600 rounded-full mt-2"></div>
              <p>For urgent medical issues, call the hospital directly or visit emergency</p>
            </div>
            <div className="flex items-start space-x-2">
              <div className="w-2 h-2 bg-blue-600 rounded-full mt-2"></div>
              <p>Admin typically responds within 24 hours during business days</p>
            </div>
            <div className="flex items-start space-x-2">
              <div className="w-2 h-2 bg-green-600 rounded-full mt-2"></div>
              <p>You'll see admin replies in real-time in your message history above</p>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Contact Information</CardTitle>
          <CardDescription>Alternative ways to reach the hospital</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="p-4 bg-blue-50 rounded-lg">
              <h4 className="font-medium text-blue-900 mb-2">Hospital Reception</h4>
              <p className="text-blue-800 font-mono">+92-XXX-XXXXXXX</p>
              <p className="text-xs text-blue-600 mt-1">Mon-Fri: 8:00 AM - 8:00 PM</p>
            </div>
            <div className="p-4 bg-green-50 rounded-lg">
              <h4 className="font-medium text-green-900 mb-2">Patient Services</h4>
              <p className="text-green-800 font-mono">+92-XXX-XXXXXXX</p>
              <p className="text-xs text-green-600 mt-1">Mon-Sat: 9:00 AM - 6:00 PM</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
