"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { MessageSquare, Send, User, Phone, Clock, CheckCircle, AlertTriangle, Eye } from "lucide-react"
import { database } from "@/lib/firebase"
import { ref, onValue, off, update, push } from "firebase/database"

export default function AdminMessages() {
  const [messages, setMessages] = useState([])
  const [selectedMessage, setSelectedMessage] = useState(null)
  const [replyText, setReplyText] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [feedback, setFeedback] = useState("")
  const [feedbackType, setFeedbackType] = useState("")
  const [filter, setFilter] = useState("all") // all, unread, replied

  useEffect(() => {
    // Listen to real-time messages
    const messagesRef = ref(database, "messages")
    const unsubscribe = onValue(messagesRef, (snapshot) => {
      if (snapshot.exists()) {
        const messagesData = Object.entries(snapshot.val()).map(([key, value]) => ({
          id: key,
          ...value,
        }))
        // Sort by newest first
        messagesData.sort((a, b) => new Date(b.sentAt) - new Date(a.sentAt))
        setMessages(messagesData)
      } else {
        setMessages([])
      }
    })

    return () => off(messagesRef, "value", unsubscribe)
  }, [])

  const handleMarkAsRead = async (messageId) => {
    try {
      await update(ref(database, `messages/${messageId}`), {
        read: true,
        readAt: new Date().toISOString(),
      })
    } catch (error) {
      console.error("Error marking message as read:", error)
    }
  }

  const handleReplyToMessage = async (messageId) => {
    if (!replyText.trim()) return

    setIsLoading(true)
    setFeedback("")

    try {
      // Add reply to the message
      await update(ref(database, `messages/${messageId}`), {
        replied: true,
        adminReply: replyText,
        repliedAt: new Date().toISOString(),
        read: true,
        readAt: new Date().toISOString(),
      })

      // Also create a separate reply record for patient to see
      await push(ref(database, "messageReplies"), {
        originalMessageId: messageId,
        deviceId: selectedMessage.deviceId,
        patientName: selectedMessage.patientName,
        adminReply: replyText,
        sentAt: new Date().toISOString(),
      })

      setFeedback("Reply sent successfully!")
      setFeedbackType("success")
      setReplyText("")
      setSelectedMessage(null)
    } catch (error) {
      console.error("Error sending reply:", error)
      setFeedback("Failed to send reply")
      setFeedbackType("error")
    } finally {
      setIsLoading(false)
    }
  }

  const filteredMessages = messages.filter((message) => {
    if (filter === "unread") return !message.read
    if (filter === "replied") return message.replied
    return true
  })

  const unreadCount = messages.filter((m) => !m.read).length

  const MessageCard = ({ message }) => (
    <Card
      className={`cursor-pointer transition-all hover:shadow-md ${
        !message.read ? "border-blue-200 bg-blue-50" : "border-gray-200"
      } ${selectedMessage?.id === message.id ? "ring-2 ring-blue-500" : ""}`}
      onClick={() => {
        setSelectedMessage(message)
        if (!message.read) {
          handleMarkAsRead(message.id)
        }
      }}
    >
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <User className="h-4 w-4 text-gray-600" />
            <CardTitle className="text-base">{message.patientName}</CardTitle>
            {!message.read && (
              <Badge variant="destructive" className="text-xs">
                New
              </Badge>
            )}
            {message.replied && (
              <Badge variant="secondary" className="bg-green-100 text-green-800 text-xs">
                Replied
              </Badge>
            )}
          </div>
          <div className="text-xs text-gray-500">
            {new Date(message.sentAt).toLocaleDateString()} {new Date(message.sentAt).toLocaleTimeString()}
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-2">
          <div className="flex items-center space-x-2 text-sm text-gray-600">
            <Phone className="h-3 w-3" />
            <span>{message.patientPhone}</span>
          </div>
          <p className="text-sm text-gray-800 line-clamp-2">{message.message}</p>
          {message.adminReply && (
            <div className="mt-2 p-2 bg-green-50 border border-green-200 rounded">
              <p className="text-xs text-green-800">
                <strong>Your Reply:</strong> {message.adminReply}
              </p>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  )

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Patient Messages</h2>
          <p className="text-gray-600">Live messages from patients - {unreadCount} unread</p>
        </div>
        <div className="flex space-x-2">
          <Button
            variant={filter === "all" ? "default" : "outline"}
            size="sm"
            onClick={() => setFilter("all")}
            className={filter !== "all" ? "bg-transparent" : ""}
          >
            All ({messages.length})
          </Button>
          <Button
            variant={filter === "unread" ? "default" : "outline"}
            size="sm"
            onClick={() => setFilter("unread")}
            className={filter !== "unread" ? "bg-transparent" : ""}
          >
            Unread ({unreadCount})
          </Button>
          <Button
            variant={filter === "replied" ? "default" : "outline"}
            size="sm"
            onClick={() => setFilter("replied")}
            className={filter !== "replied" ? "bg-transparent" : ""}
          >
            Replied ({messages.filter((m) => m.replied).length})
          </Button>
        </div>
      </div>

      {feedback && (
        <Alert
          className={`${feedbackType === "success" ? "border-green-200 bg-green-50" : "border-red-200 bg-red-50"}`}
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

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Messages List */}
        <div className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <MessageSquare className="h-5 w-5 text-purple-600" />
                <span>Messages ({filteredMessages.length})</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="max-h-[600px] overflow-y-auto space-y-3">
              {filteredMessages.length > 0 ? (
                filteredMessages.map((message) => <MessageCard key={message.id} message={message} />)
              ) : (
                <div className="text-center py-8">
                  <MessageSquare className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-500">
                    {filter === "unread"
                      ? "No unread messages"
                      : filter === "replied"
                        ? "No replied messages"
                        : "No messages yet"}
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Message Detail & Reply */}
        <div className="space-y-4">
          {selectedMessage ? (
            <>
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <User className="h-5 w-5 text-blue-600" />
                    <span>{selectedMessage.patientName}</span>
                  </CardTitle>
                  <CardDescription className="flex items-center space-x-4">
                    <div className="flex items-center space-x-1">
                      <Phone className="h-3 w-3" />
                      <span>{selectedMessage.patientPhone}</span>
                    </div>
                    <div className="flex items-center space-x-1">
                      <Clock className="h-3 w-3" />
                      <span>{new Date(selectedMessage.sentAt).toLocaleString()}</span>
                    </div>
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="p-4 bg-gray-50 rounded-lg">
                      <h4 className="font-medium text-gray-900 mb-2">Patient Message:</h4>
                      <p className="text-gray-800">{selectedMessage.message}</p>
                    </div>

                    {selectedMessage.adminReply && (
                      <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
                        <h4 className="font-medium text-green-900 mb-2">Your Reply:</h4>
                        <p className="text-green-800">{selectedMessage.adminReply}</p>
                        <p className="text-xs text-green-600 mt-2">
                          Sent: {new Date(selectedMessage.repliedAt).toLocaleString()}
                        </p>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <Send className="h-5 w-5 text-purple-600" />
                    <span>{selectedMessage.replied ? "Send Another Reply" : "Reply to Patient"}</span>
                  </CardTitle>
                  <CardDescription>
                    Your reply will be sent directly to the patient and stored in their message history
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <Textarea
                      value={replyText}
                      onChange={(e) => setReplyText(e.target.value)}
                      placeholder="Type your reply to the patient here..."
                      rows={4}
                      className="resize-none"
                    />
                    <Button
                      onClick={() => handleReplyToMessage(selectedMessage.id)}
                      disabled={isLoading || !replyText.trim()}
                      className="w-full bg-purple-600 hover:bg-purple-700 text-white"
                    >
                      {isLoading ? (
                        <>
                          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                          Sending Reply...
                        </>
                      ) : (
                        <>
                          <Send className="h-4 w-4 mr-2" />
                          Send Reply
                        </>
                      )}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </>
          ) : (
            <Card>
              <CardContent className="text-center py-12">
                <MessageSquare className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">Select a Message</h3>
                <p className="text-gray-500">Choose a message from the list to view details and reply</p>
              </CardContent>
            </Card>
          )}
        </div>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <MessageSquare className="h-5 w-5 text-blue-600" />
              <div>
                <p className="text-sm font-medium text-gray-600">Total Messages</p>
                <p className="text-2xl font-bold text-gray-900">{messages.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <Eye className="h-5 w-5 text-yellow-600" />
              <div>
                <p className="text-sm font-medium text-gray-600">Unread</p>
                <p className="text-2xl font-bold text-gray-900">{unreadCount}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <CheckCircle className="h-5 w-5 text-green-600" />
              <div>
                <p className="text-sm font-medium text-gray-600">Replied</p>
                <p className="text-2xl font-bold text-gray-900">{messages.filter((m) => m.replied).length}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <User className="h-5 w-5 text-purple-600" />
              <div>
                <p className="text-sm font-medium text-gray-600">Unique Patients</p>
                <p className="text-2xl font-bold text-gray-900">{new Set(messages.map((m) => m.deviceId)).size}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
