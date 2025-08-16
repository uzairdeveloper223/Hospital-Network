"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Bed, Plus, Edit, Trash2, Search, Users, Activity } from "lucide-react"
import { database } from "@/lib/firebase"
import { ref, push, onValue, set, remove } from "firebase/database"

export default function BedManagement() {
  const [beds, setBeds] = useState([])
  const [filteredBeds, setFilteredBeds] = useState([])
  const [searchTerm, setSearchTerm] = useState("")
  const [filterStatus, setFilterStatus] = useState("all")
  const [filterWard, setFilterWard] = useState("all")
  const [showAddForm, setShowAddForm] = useState(false)
  const [editingBed, setEditingBed] = useState(null)
  const [formData, setFormData] = useState({
    bedNumber: "",
    ward: "",
    type: "",
    status: "available",
    patientName: "",
    patientPhone: "",
    admissionDate: "",
    notes: "",
  })
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [stats, setStats] = useState({
    totalBeds: 0,
    availableBeds: 0,
    occupiedBeds: 0,
    maintenanceBeds: 0,
  })

  useEffect(() => {
    // Load beds data
    const bedsRef = ref(database, "hospitalBeds")
    const unsubscribe = onValue(bedsRef, (snapshot) => {
      if (snapshot.exists()) {
        const bedsData = Object.entries(snapshot.val()).map(([key, value]) => ({
          id: key,
          ...value,
        }))
        setBeds(bedsData.sort((a, b) => a.bedNumber.localeCompare(b.bedNumber)))
      } else {
        setBeds([])
      }
    })

    return () => unsubscribe()
  }, [])

  useEffect(() => {
    // Calculate stats
    const totalBeds = beds.length
    const availableBeds = beds.filter((bed) => bed.status === "available").length
    const occupiedBeds = beds.filter((bed) => bed.status === "occupied").length
    const maintenanceBeds = beds.filter((bed) => bed.status === "maintenance").length

    setStats({
      totalBeds,
      availableBeds,
      occupiedBeds,
      maintenanceBeds,
    })
  }, [beds])

  useEffect(() => {
    // Filter beds
    let filtered = beds

    if (searchTerm) {
      filtered = filtered.filter(
        (bed) =>
          bed.bedNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
          bed.ward.toLowerCase().includes(searchTerm.toLowerCase()) ||
          (bed.patientName && bed.patientName.toLowerCase().includes(searchTerm.toLowerCase())),
      )
    }

    if (filterStatus !== "all") {
      filtered = filtered.filter((bed) => bed.status === filterStatus)
    }

    if (filterWard !== "all") {
      filtered = filtered.filter((bed) => bed.ward === filterWard)
    }

    setFilteredBeds(filtered)
  }, [beds, searchTerm, filterStatus, filterWard])

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!formData.bedNumber || !formData.ward || !formData.type) return

    setIsSubmitting(true)

    try {
      const bedData = {
        ...formData,
        lastUpdated: new Date().toISOString(),
      }

      if (editingBed) {
        const bedRef = ref(database, `hospitalBeds/${editingBed.id}`)
        await set(bedRef, bedData)
      } else {
        const bedsRef = ref(database, "hospitalBeds")
        await push(bedsRef, bedData)
      }

      resetForm()
      alert(editingBed ? "Bed updated successfully!" : "Bed added successfully!")
    } catch (error) {
      console.error("Error saving bed:", error)
      alert("Error saving bed. Please try again.")
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleEdit = (bed) => {
    setEditingBed(bed)
    setFormData({
      bedNumber: bed.bedNumber,
      ward: bed.ward,
      type: bed.type,
      status: bed.status,
      patientName: bed.patientName || "",
      patientPhone: bed.patientPhone || "",
      admissionDate: bed.admissionDate || "",
      notes: bed.notes || "",
    })
    setShowAddForm(true)
  }

  const handleDelete = async (bedId) => {
    if (!confirm("Are you sure you want to delete this bed?")) return

    try {
      const bedRef = ref(database, `hospitalBeds/${bedId}`)
      await remove(bedRef)
      alert("Bed deleted successfully!")
    } catch (error) {
      console.error("Error deleting bed:", error)
      alert("Error deleting bed. Please try again.")
    }
  }

  const resetForm = () => {
    setFormData({
      bedNumber: "",
      ward: "",
      type: "",
      status: "available",
      patientName: "",
      patientPhone: "",
      admissionDate: "",
      notes: "",
    })
    setShowAddForm(false)
    setEditingBed(null)
  }

  const getStatusColor = (status) => {
    switch (status) {
      case "available":
        return "bg-green-100 text-green-800"
      case "occupied":
        return "bg-red-100 text-red-800"
      case "maintenance":
        return "bg-yellow-100 text-yellow-800"
      case "reserved":
        return "bg-blue-100 text-blue-800"
      default:
        return "bg-gray-100 text-gray-800"
    }
  }

  const getUniqueWards = () => {
    const wards = [...new Set(beds.map((bed) => bed.ward))]
    return wards.sort()
  }

  const StatCard = ({ title, value, icon: Icon, color, description }) => (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium text-gray-600">{title}</CardTitle>
        <Icon className={`h-4 w-4 ${color}`} />
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold text-gray-900">{value}</div>
        {description && <p className="text-xs text-gray-500 mt-1">{description}</p>}
      </CardContent>
    </Card>
  )

  return (
    <div className="space-y-6">
      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard
          title="Total Beds"
          value={stats.totalBeds}
          icon={Bed}
          color="text-blue-600"
          description="All hospital beds"
        />
        <StatCard
          title="Available"
          value={stats.availableBeds}
          icon={Bed}
          color="text-green-600"
          description="Ready for patients"
        />
        <StatCard
          title="Occupied"
          value={stats.occupiedBeds}
          icon={Users}
          color="text-red-600"
          description="Currently in use"
        />
        <StatCard
          title="Maintenance"
          value={stats.maintenanceBeds}
          icon={Activity}
          color="text-yellow-600"
          description="Under maintenance"
        />
      </div>

      <Tabs defaultValue="beds" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="beds">Bed Management</TabsTrigger>
          <TabsTrigger value="occupancy">Occupancy Overview</TabsTrigger>
        </TabsList>

        <TabsContent value="beds" className="space-y-6">
          {/* Controls */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Hospital Beds</CardTitle>
                  <CardDescription>Manage hospital bed inventory and occupancy</CardDescription>
                </div>
                <Button onClick={() => setShowAddForm(true)}>
                  <Plus className="h-4 w-4 mr-2" />
                  Add Bed
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="flex flex-col md:flex-row gap-4">
                <div className="flex-1">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <Input
                      placeholder="Search beds by number, ward, or patient..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-10"
                    />
                  </div>
                </div>
                <div className="flex gap-2">
                  <Select value={filterStatus} onValueChange={setFilterStatus}>
                    <SelectTrigger className="w-40">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Status</SelectItem>
                      <SelectItem value="available">Available</SelectItem>
                      <SelectItem value="occupied">Occupied</SelectItem>
                      <SelectItem value="maintenance">Maintenance</SelectItem>
                      <SelectItem value="reserved">Reserved</SelectItem>
                    </SelectContent>
                  </Select>
                  <Select value={filterWard} onValueChange={setFilterWard}>
                    <SelectTrigger className="w-40">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Wards</SelectItem>
                      {getUniqueWards().map((ward) => (
                        <SelectItem key={ward} value={ward}>
                          {ward}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Add/Edit Form */}
          {showAddForm && (
            <Card>
              <CardHeader>
                <CardTitle>{editingBed ? "Edit Bed" : "Add New Bed"}</CardTitle>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div className="grid md:grid-cols-3 gap-4">
                    <div>
                      <Label htmlFor="bedNumber">Bed Number *</Label>
                      <Input
                        id="bedNumber"
                        value={formData.bedNumber}
                        onChange={(e) => setFormData({ ...formData, bedNumber: e.target.value })}
                        placeholder="e.g., A-101"
                        required
                      />
                    </div>
                    <div>
                      <Label htmlFor="ward">Ward *</Label>
                      <Select
                        value={formData.ward}
                        onValueChange={(value) => setFormData({ ...formData, ward: value })}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select ward" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="General Ward">General Ward</SelectItem>
                          <SelectItem value="ICU">ICU</SelectItem>
                          <SelectItem value="Emergency">Emergency</SelectItem>
                          <SelectItem value="Pediatric">Pediatric</SelectItem>
                          <SelectItem value="Maternity">Maternity</SelectItem>
                          <SelectItem value="Cardiac">Cardiac</SelectItem>
                          <SelectItem value="Orthopedic">Orthopedic</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label htmlFor="type">Bed Type *</Label>
                      <Select
                        value={formData.type}
                        onValueChange={(value) => setFormData({ ...formData, type: value })}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select type" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="Standard">Standard</SelectItem>
                          <SelectItem value="Electric">Electric</SelectItem>
                          <SelectItem value="ICU">ICU</SelectItem>
                          <SelectItem value="Pediatric">Pediatric</SelectItem>
                          <SelectItem value="Bariatric">Bariatric</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div className="grid md:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="status">Status</Label>
                      <Select
                        value={formData.status}
                        onValueChange={(value) => setFormData({ ...formData, status: value })}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="available">Available</SelectItem>
                          <SelectItem value="occupied">Occupied</SelectItem>
                          <SelectItem value="maintenance">Maintenance</SelectItem>
                          <SelectItem value="reserved">Reserved</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    {formData.status === "occupied" && (
                      <div>
                        <Label htmlFor="admissionDate">Admission Date</Label>
                        <Input
                          id="admissionDate"
                          type="date"
                          value={formData.admissionDate}
                          onChange={(e) => setFormData({ ...formData, admissionDate: e.target.value })}
                        />
                      </div>
                    )}
                  </div>

                  {formData.status === "occupied" && (
                    <div className="grid md:grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="patientName">Patient Name</Label>
                        <Input
                          id="patientName"
                          value={formData.patientName}
                          onChange={(e) => setFormData({ ...formData, patientName: e.target.value })}
                          placeholder="Patient's full name"
                        />
                      </div>
                      <div>
                        <Label htmlFor="patientPhone">Patient Phone</Label>
                        <Input
                          id="patientPhone"
                          value={formData.patientPhone}
                          onChange={(e) => setFormData({ ...formData, patientPhone: e.target.value })}
                          placeholder="03XX-XXXXXXX"
                        />
                      </div>
                    </div>
                  )}

                  <div>
                    <Label htmlFor="notes">Notes</Label>
                    <Input
                      id="notes"
                      value={formData.notes}
                      onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                      placeholder="Additional notes or special requirements"
                    />
                  </div>

                  <div className="flex gap-2">
                    <Button type="submit" disabled={isSubmitting}>
                      {isSubmitting ? "Saving..." : editingBed ? "Update Bed" : "Add Bed"}
                    </Button>
                    <Button type="button" variant="outline" onClick={resetForm}>
                      Cancel
                    </Button>
                  </div>
                </form>
              </CardContent>
            </Card>
          )}

          {/* Beds List */}
          <Card>
            <CardContent className="p-0">
              {filteredBeds.length > 0 ? (
                <div className="divide-y">
                  {filteredBeds.map((bed) => (
                    <div key={bed.id} className="p-4 hover:bg-gray-50">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                          <Bed className="h-5 w-5 text-gray-500" />
                          <div>
                            <div className="flex items-center gap-2">
                              <h3 className="font-medium">{bed.bedNumber}</h3>
                              <Badge className={getStatusColor(bed.status)}>{bed.status}</Badge>
                            </div>
                            <p className="text-sm text-gray-600">
                              {bed.ward} • {bed.type}
                            </p>
                            {bed.patientName && <p className="text-sm text-gray-600">Patient: {bed.patientName}</p>}
                            {bed.notes && <p className="text-xs text-gray-500 mt-1">{bed.notes}</p>}
                          </div>
                        </div>
                        <div className="flex gap-2">
                          <Button variant="outline" size="sm" onClick={() => handleEdit(bed)}>
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button variant="outline" size="sm" onClick={() => handleDelete(bed.id)}>
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-12">
                  <Bed className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">No beds found</h3>
                  <p className="text-gray-500">
                    {searchTerm || filterStatus !== "all" || filterWard !== "all"
                      ? "No beds match your current filters."
                      : "Add your first bed to get started."}
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="occupancy" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Ward Occupancy Overview</CardTitle>
              <CardDescription>Bed occupancy by ward</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {getUniqueWards().map((ward) => {
                  const wardBeds = beds.filter((bed) => bed.ward === ward)
                  const occupiedBeds = wardBeds.filter((bed) => bed.status === "occupied").length
                  const totalBeds = wardBeds.length
                  const occupancyRate = totalBeds > 0 ? Math.round((occupiedBeds / totalBeds) * 100) : 0

                  return (
                    <div key={ward} className="border rounded-lg p-4">
                      <div className="flex items-center justify-between mb-2">
                        <h3 className="font-medium">{ward}</h3>
                        <Badge variant="outline">{occupancyRate}% occupied</Badge>
                      </div>
                      <div className="flex items-center gap-4 text-sm text-gray-600">
                        <span>Total: {totalBeds}</span>
                        <span>Occupied: {occupiedBeds}</span>
                        <span>Available: {totalBeds - occupiedBeds}</span>
                      </div>
                      <div className="mt-2 w-full bg-gray-200 rounded-full h-2">
                        <div className="bg-blue-600 h-2 rounded-full" style={{ width: `${occupancyRate}%` }}></div>
                      </div>
                    </div>
                  )
                })}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
