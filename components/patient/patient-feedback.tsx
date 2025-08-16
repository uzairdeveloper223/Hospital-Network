"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { Star, Send, Clock, CheckCircle, User } from "lucide-react"
import { database } from "@/lib/firebase"
import { ref, push, onValue } from "firebase/database"

export default function PatientFeedback({ patient }) {
  const [completedAppointments, setCompletedAppointments] = useState([])
  const [doctors, setDoctors] = useState([])
  const [selectedAppointment, setSelectedAppointment] = useState("")
  const [rating, setRating] = useState(0)
  const [feedback, setFeedback] = useState("")
  const [category, setCategory] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [submittedFeedbacks, setSubmittedFeedbacks] = useState([])

  useEffect(() => {
    // Load completed appointments
    const appointmentsRef = ref(database, "appointments")
    const unsubscribeAppointments = onValue(appointmentsRef, (snapshot) => {
      if (snapshot.exists()) {
        const allAppointments = Object.entries(snapshot.val()).map(([key, value]) => ({
          id: key,
          ...value,
        }))
        const patientCompletedAppointments = allAppointments.filter(
          (apt) => apt.deviceId === patient.deviceId && apt.status === "completed",
        )
        setCompletedAppointments(patientCompletedAppointments)
      }
    })

    // Load doctors
    const doctorsRef = ref(database, "doctors")
    const unsubscribeDoctors = onValue(doctorsRef, (snapshot) => {
      if (snapshot.exists()) {
        const doctorsData = Object.entries(snapshot.val()).map(([key, value]) => ({
          id: key,
          ...value,
        }))
        setDoctors(doctorsData)
      }
    })

    // Load submitted feedbacks
    const feedbackRef = ref(database, "patientFeedback")
    const unsubscribeFeedback = onValue(feedbackRef, (snapshot) => {
      if (snapshot.exists()) {
        const allFeedbacks = Object.entries(snapshot.val()).map(([key, value]) => ({
          id: key,
          ...value,
        }))
        const patientFeedbacks = allFeedbacks.filter((fb) => fb.deviceId === patient.deviceId)
        setSubmittedFeedbacks(patientFeedbacks)
      }
    })

    return () => {
      unsubscribeAppointments()
      unsubscribeDoctors()
      unsubscribeFeedback()
    }
  }, [patient.deviceId])

  const handleSubmitFeedback = async (e) => {
    e.preventDefault()
    if (!selectedAppointment || rating === 0) return

    setIsSubmitting(true)

    const appointment = completedAppointments.find((apt) => apt.id === selectedAppointment)
    const doctor = doctors.find((doc) => doc.uid === appointment?.doctorId)

    const feedbackData = {
      deviceId: patient.deviceId,
      patientName: patient.name,
      patientPhone: patient.phone,
      appointmentId: selectedAppointment,
      doctorId: appointment.doctorId,
      doctorName: doctor?.name || "Unknown",
      rating,
      feedback,
      category,
      timestamp: new Date().toISOString(),
      status: "submitted",
    }

    try {
      const feedbackRef = ref(database, "patientFeedback")
      await push(feedbackRef, feedbackData)

      // Reset form
      setSelectedAppointment("")
      setRating(0)
      setFeedback("")
      setCategory("")

      alert("Thank you for your feedback! It has been submitted successfully.")
    } catch (error) {
      console.error("Error submitting feedback:", error)
      alert("Error submitting feedback. Please try again.")
    } finally {
      setIsSubmitting(false)
    }
  }

  const StarRating = ({ rating, onRatingChange, readonly = false }) => {
    return (
      <div className="flex space-x-1">
        {[1, 2, 3, 4, 5].map((star) => (
          <Star
            key={star}
            className={`h-6 w-6 cursor-pointer transition-colors ${
              star <= rating ? "text-yellow-400 fill-yellow-400" : "text-gray-300"
            } ${readonly ? "cursor-default" : "hover:text-yellow-400"}`}
            onClick={() => !readonly && onRatingChange(star)}
          />
        ))}
      </div>
    )
  }

  const getAppointmentDoctor = (appointmentId) => {
    const appointment = completedAppointments.find((apt) => apt.id === appointmentId)
    return doctors.find((doc) => doc.uid === appointment?.doctorId)
  }

  return (
    <div className="space-y-6">
      {/* Submit New Feedback */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Star className="h-5 w-5 text-yellow-500" />
            Submit Feedback
          </CardTitle>
          <CardDescription>Rate your experience and help us improve our services</CardDescription>
        </CardHeader>
        <CardContent>
          {completedAppointments.length > 0 ? (
            <form onSubmit={handleSubmitFeedback} className="space-y-4">
              <div>
                <Label htmlFor="appointment">Select Appointment *</Label>
                <Select value={selectedAppointment} onValueChange={setSelectedAppointment}>
                  <SelectTrigger>
                    <SelectValue placeholder="Choose an appointment to review" />
                  </SelectTrigger>
                  <SelectContent>
                    {completedAppointments
                      .filter((apt) => !submittedFeedbacks.some((fb) => fb.appointmentId === apt.id))
                      .map((appointment) => {
                        const doctor = doctors.find((d) => d.uid === appointment.doctorId)
                        return (
                          <SelectItem key={appointment.id} value={appointment.id}>
                            Dr. {doctor?.name || "Unknown"} - {new Date(appointment.createdAt).toLocaleDateString()}
                          </SelectItem>
                        )
                      })}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label>Overall Rating *</Label>
                <div className="mt-2">
                  <StarRating rating={rating} onRatingChange={setRating} />
                  <p className="text-sm text-gray-500 mt-1">
                    {rating === 0 && "Please select a rating"}
                    {rating === 1 && "Poor - Very unsatisfied"}
                    {rating === 2 && "Fair - Somewhat unsatisfied"}
                    {rating === 3 && "Good - Neutral"}
                    {rating === 4 && "Very Good - Satisfied"}
                    {rating === 5 && "Excellent - Very satisfied"}
                  </p>
                </div>
              </div>

              <div>
                <Label htmlFor="category">Feedback Category</Label>
                <Select value={category} onValueChange={setCategory}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select category (optional)" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="doctor-care">Doctor Care & Treatment</SelectItem>
                    <SelectItem value="staff-behavior">Staff Behavior</SelectItem>
                    <SelectItem value="facility-cleanliness">Facility & Cleanliness</SelectItem>
                    <SelectItem value="waiting-time">Waiting Time</SelectItem>
                    <SelectItem value="appointment-process">Appointment Process</SelectItem>
                    <SelectItem value="communication">Communication</SelectItem>
                    <SelectItem value="overall-experience">Overall Experience</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="feedback">Your Feedback</Label>
                <Textarea
                  id="feedback"
                  value={feedback}
                  onChange={(e) => setFeedback(e.target.value)}
                  placeholder="Please share your experience, suggestions, or concerns..."
                  rows={4}
                />
              </div>

              <Button type="submit" disabled={!selectedAppointment || rating === 0 || isSubmitting} className="w-full">
                {isSubmitting ? (
                  <>
                    <Clock className="h-4 w-4 mr-2 animate-spin" />
                    Submitting...
                  </>
                ) : (
                  <>
                    <Send className="h-4 w-4 mr-2" />
                    Submit Feedback
                  </>
                )}
              </Button>
            </form>
          ) : (
            <div className="text-center py-8">
              <Star className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-500">No completed appointments available for feedback.</p>
              <p className="text-sm text-gray-400 mt-2">Complete an appointment first to leave feedback.</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Previous Feedback */}
      <Card>
        <CardHeader>
          <CardTitle>Your Previous Feedback</CardTitle>
          <CardDescription>Review your submitted feedback and ratings</CardDescription>
        </CardHeader>
        <CardContent>
          {submittedFeedbacks.length > 0 ? (
            <div className="space-y-4">
              {submittedFeedbacks
                .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))
                .map((fb) => {
                  const doctor = getAppointmentDoctor(fb.appointmentId)
                  return (
                    <div key={fb.id} className="border rounded-lg p-4 bg-gray-50">
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex items-center gap-3">
                          <User className="h-5 w-5 text-gray-500" />
                          <div>
                            <p className="font-medium">Dr. {fb.doctorName}</p>
                            <p className="text-sm text-gray-500">{new Date(fb.timestamp).toLocaleDateString()}</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <StarRating rating={fb.rating} readonly />
                          <Badge variant="outline" className="bg-green-50 text-green-700">
                            <CheckCircle className="h-3 w-3 mr-1" />
                            Submitted
                          </Badge>
                        </div>
                      </div>

                      {fb.category && (
                        <Badge variant="secondary" className="mb-2">
                          {fb.category.replace("-", " ").replace(/\b\w/g, (l) => l.toUpperCase())}
                        </Badge>
                      )}

                      {fb.feedback && (
                        <p className="text-gray-700 text-sm bg-white p-3 rounded border">"{fb.feedback}"</p>
                      )}
                    </div>
                  )
                })}
            </div>
          ) : (
            <div className="text-center py-8">
              <Star className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-500">No feedback submitted yet.</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
