"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Package, Plus, Edit, Trash2, Search, AlertTriangle, TrendingDown, TrendingUp } from "lucide-react"
import { database } from "@/lib/firebase"
import { ref, push, onValue, set, remove } from "firebase/database"

export default function InventoryManagement() {
  const [inventory, setInventory] = useState([])
  const [filteredInventory, setFilteredInventory] = useState([])
  const [searchTerm, setSearchTerm] = useState("")
  const [filterCategory, setFilterCategory] = useState("all")
  const [filterStatus, setFilterStatus] = useState("all")
  const [showAddForm, setShowAddForm] = useState(false)
  const [editingItem, setEditingItem] = useState(null)
  const [formData, setFormData] = useState({
    name: "",
    category: "",
    currentStock: "",
    minStock: "",
    maxStock: "",
    unit: "",
    supplier: "",
    cost: "",
    expiryDate: "",
    location: "",
    notes: "",
  })
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [stats, setStats] = useState({
    totalItems: 0,
    lowStockItems: 0,
    expiringSoon: 0,
    totalValue: 0,
  })

  useEffect(() => {
    // Load inventory data
    const inventoryRef = ref(database, "hospitalInventory")
    const unsubscribe = onValue(inventoryRef, (snapshot) => {
      if (snapshot.exists()) {
        const inventoryData = Object.entries(snapshot.val()).map(([key, value]) => ({
          id: key,
          ...value,
        }))
        setInventory(inventoryData.sort((a, b) => a.name.localeCompare(b.name)))
      } else {
        setInventory([])
      }
    })

    return () => unsubscribe()
  }, [])

  useEffect(() => {
    // Calculate stats
    const totalItems = inventory.length
    const lowStockItems = inventory.filter(
      (item) => Number.parseInt(item.currentStock) <= Number.parseInt(item.minStock),
    ).length

    const today = new Date()
    const thirtyDaysFromNow = new Date(today.getTime() + 30 * 24 * 60 * 60 * 1000)
    const expiringSoon = inventory.filter(
      (item) => item.expiryDate && new Date(item.expiryDate) <= thirtyDaysFromNow,
    ).length

    const totalValue = inventory.reduce(
      (sum, item) => sum + Number.parseInt(item.currentStock) * Number.parseFloat(item.cost || 0),
      0,
    )

    setStats({
      totalItems,
      lowStockItems,
      expiringSoon,
      totalValue,
    })
  }, [inventory])

  useEffect(() => {
    // Filter inventory
    let filtered = inventory

    if (searchTerm) {
      filtered = filtered.filter(
        (item) =>
          item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
          item.supplier.toLowerCase().includes(searchTerm.toLowerCase()) ||
          item.location.toLowerCase().includes(searchTerm.toLowerCase()),
      )
    }

    if (filterCategory !== "all") {
      filtered = filtered.filter((item) => item.category === filterCategory)
    }

    if (filterStatus !== "all") {
      if (filterStatus === "low-stock") {
        filtered = filtered.filter((item) => Number.parseInt(item.currentStock) <= Number.parseInt(item.minStock))
      } else if (filterStatus === "expiring") {
        const today = new Date()
        const thirtyDaysFromNow = new Date(today.getTime() + 30 * 24 * 60 * 60 * 1000)
        filtered = filtered.filter((item) => item.expiryDate && new Date(item.expiryDate) <= thirtyDaysFromNow)
      }
    }

    setFilteredInventory(filtered)
  }, [inventory, searchTerm, filterCategory, filterStatus])

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!formData.name || !formData.category || !formData.currentStock) return

    setIsSubmitting(true)

    try {
      const itemData = {
        ...formData,
        currentStock: Number.parseInt(formData.currentStock),
        minStock: Number.parseInt(formData.minStock || 0),
        maxStock: Number.parseInt(formData.maxStock || 0),
        cost: Number.parseFloat(formData.cost || 0),
        lastUpdated: new Date().toISOString(),
      }

      if (editingItem) {
        const itemRef = ref(database, `hospitalInventory/${editingItem.id}`)
        await set(itemRef, itemData)
      } else {
        const inventoryRef = ref(database, "hospitalInventory")
        await push(inventoryRef, itemData)
      }

      resetForm()
      alert(editingItem ? "Item updated successfully!" : "Item added successfully!")
    } catch (error) {
      console.error("Error saving item:", error)
      alert("Error saving item. Please try again.")
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleEdit = (item) => {
    setEditingItem(item)
    setFormData({
      name: item.name,
      category: item.category,
      currentStock: item.currentStock.toString(),
      minStock: item.minStock.toString(),
      maxStock: item.maxStock.toString(),
      unit: item.unit,
      supplier: item.supplier,
      cost: item.cost.toString(),
      expiryDate: item.expiryDate || "",
      location: item.location,
      notes: item.notes || "",
    })
    setShowAddForm(true)
  }

  const handleDelete = async (itemId) => {
    if (!confirm("Are you sure you want to delete this item?")) return

    try {
      const itemRef = ref(database, `hospitalInventory/${itemId}`)
      await remove(itemRef)
      alert("Item deleted successfully!")
    } catch (error) {
      console.error("Error deleting item:", error)
      alert("Error deleting item. Please try again.")
    }
  }

  const resetForm = () => {
    setFormData({
      name: "",
      category: "",
      currentStock: "",
      minStock: "",
      maxStock: "",
      unit: "",
      supplier: "",
      cost: "",
      expiryDate: "",
      location: "",
      notes: "",
    })
    setShowAddForm(false)
    setEditingItem(null)
  }

  const getStockStatus = (item) => {
    const current = Number.parseInt(item.currentStock)
    const min = Number.parseInt(item.minStock)
    const max = Number.parseInt(item.maxStock)

    if (current <= min) return { status: "low", color: "bg-red-100 text-red-800" }
    if (current >= max) return { status: "high", color: "bg-blue-100 text-blue-800" }
    return { status: "normal", color: "bg-green-100 text-green-800" }
  }

  const isExpiringSoon = (expiryDate) => {
    if (!expiryDate) return false
    const today = new Date()
    const thirtyDaysFromNow = new Date(today.getTime() + 30 * 24 * 60 * 60 * 1000)
    return new Date(expiryDate) <= thirtyDaysFromNow
  }

  const getUniqueCategories = () => {
    const categories = [...new Set(inventory.map((item) => item.category))]
    return categories.sort()
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
          title="Total Items"
          value={stats.totalItems}
          icon={Package}
          color="text-blue-600"
          description="In inventory"
        />
        <StatCard
          title="Low Stock"
          value={stats.lowStockItems}
          icon={TrendingDown}
          color="text-red-600"
          description="Need restocking"
        />
        <StatCard
          title="Expiring Soon"
          value={stats.expiringSoon}
          icon={AlertTriangle}
          color="text-yellow-600"
          description="Within 30 days"
        />
        <StatCard
          title="Total Value"
          value={`Rs. ${stats.totalValue.toLocaleString()}`}
          icon={TrendingUp}
          color="text-green-600"
          description="Current inventory"
        />
      </div>

      <Tabs defaultValue="inventory" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="inventory">Inventory Management</TabsTrigger>
          <TabsTrigger value="alerts">Stock Alerts</TabsTrigger>
          <TabsTrigger value="reports">Reports</TabsTrigger>
        </TabsList>

        <TabsContent value="inventory" className="space-y-6">
          {/* Controls */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Medical Inventory</CardTitle>
                  <CardDescription>Manage hospital supplies and equipment</CardDescription>
                </div>
                <Button onClick={() => setShowAddForm(true)}>
                  <Plus className="h-4 w-4 mr-2" />
                  Add Item
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="flex flex-col md:flex-row gap-4">
                <div className="flex-1">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <Input
                      placeholder="Search items by name, supplier, or location..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-10"
                    />
                  </div>
                </div>
                <div className="flex gap-2">
                  <Select value={filterCategory} onValueChange={setFilterCategory}>
                    <SelectTrigger className="w-40">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Categories</SelectItem>
                      {getUniqueCategories().map((category) => (
                        <SelectItem key={category} value={category}>
                          {category}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Select value={filterStatus} onValueChange={setFilterStatus}>
                    <SelectTrigger className="w-40">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Items</SelectItem>
                      <SelectItem value="low-stock">Low Stock</SelectItem>
                      <SelectItem value="expiring">Expiring Soon</SelectItem>
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
                <CardTitle>{editingItem ? "Edit Item" : "Add New Item"}</CardTitle>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div className="grid md:grid-cols-3 gap-4">
                    <div>
                      <Label htmlFor="name">Item Name *</Label>
                      <Input
                        id="name"
                        value={formData.name}
                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                        placeholder="e.g., Surgical Gloves"
                        required
                      />
                    </div>
                    <div>
                      <Label htmlFor="category">Category *</Label>
                      <Select
                        value={formData.category}
                        onValueChange={(value) => setFormData({ ...formData, category: value })}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select category" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="Medications">Medications</SelectItem>
                          <SelectItem value="Surgical Supplies">Surgical Supplies</SelectItem>
                          <SelectItem value="Medical Equipment">Medical Equipment</SelectItem>
                          <SelectItem value="Disposables">Disposables</SelectItem>
                          <SelectItem value="Laboratory">Laboratory</SelectItem>
                          <SelectItem value="Emergency">Emergency</SelectItem>
                          <SelectItem value="Cleaning Supplies">Cleaning Supplies</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label htmlFor="unit">Unit</Label>
                      <Select
                        value={formData.unit}
                        onValueChange={(value) => setFormData({ ...formData, unit: value })}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select unit" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="pieces">Pieces</SelectItem>
                          <SelectItem value="boxes">Boxes</SelectItem>
                          <SelectItem value="bottles">Bottles</SelectItem>
                          <SelectItem value="vials">Vials</SelectItem>
                          <SelectItem value="packets">Packets</SelectItem>
                          <SelectItem value="kg">Kilograms</SelectItem>
                          <SelectItem value="liters">Liters</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div className="grid md:grid-cols-3 gap-4">
                    <div>
                      <Label htmlFor="currentStock">Current Stock *</Label>
                      <Input
                        id="currentStock"
                        type="number"
                        value={formData.currentStock}
                        onChange={(e) => setFormData({ ...formData, currentStock: e.target.value })}
                        placeholder="0"
                        required
                      />
                    </div>
                    <div>
                      <Label htmlFor="minStock">Minimum Stock</Label>
                      <Input
                        id="minStock"
                        type="number"
                        value={formData.minStock}
                        onChange={(e) => setFormData({ ...formData, minStock: e.target.value })}
                        placeholder="0"
                      />
                    </div>
                    <div>
                      <Label htmlFor="maxStock">Maximum Stock</Label>
                      <Input
                        id="maxStock"
                        type="number"
                        value={formData.maxStock}
                        onChange={(e) => setFormData({ ...formData, maxStock: e.target.value })}
                        placeholder="0"
                      />
                    </div>
                  </div>

                  <div className="grid md:grid-cols-3 gap-4">
                    <div>
                      <Label htmlFor="supplier">Supplier</Label>
                      <Input
                        id="supplier"
                        value={formData.supplier}
                        onChange={(e) => setFormData({ ...formData, supplier: e.target.value })}
                        placeholder="Supplier name"
                      />
                    </div>
                    <div>
                      <Label htmlFor="cost">Cost per Unit (Rs.)</Label>
                      <Input
                        id="cost"
                        type="number"
                        step="0.01"
                        value={formData.cost}
                        onChange={(e) => setFormData({ ...formData, cost: e.target.value })}
                        placeholder="0.00"
                      />
                    </div>
                    <div>
                      <Label htmlFor="expiryDate">Expiry Date</Label>
                      <Input
                        id="expiryDate"
                        type="date"
                        value={formData.expiryDate}
                        onChange={(e) => setFormData({ ...formData, expiryDate: e.target.value })}
                      />
                    </div>
                  </div>

                  <div className="grid md:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="location">Storage Location</Label>
                      <Input
                        id="location"
                        value={formData.location}
                        onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                        placeholder="e.g., Pharmacy Store Room A"
                      />
                    </div>
                    <div>
                      <Label htmlFor="notes">Notes</Label>
                      <Input
                        id="notes"
                        value={formData.notes}
                        onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                        placeholder="Additional notes"
                      />
                    </div>
                  </div>

                  <div className="flex gap-2">
                    <Button type="submit" disabled={isSubmitting}>
                      {isSubmitting ? "Saving..." : editingItem ? "Update Item" : "Add Item"}
                    </Button>
                    <Button type="button" variant="outline" onClick={resetForm}>
                      Cancel
                    </Button>
                  </div>
                </form>
              </CardContent>
            </Card>
          )}

          {/* Inventory List */}
          <Card>
            <CardContent className="p-0">
              {filteredInventory.length > 0 ? (
                <div className="divide-y">
                  {filteredInventory.map((item) => {
                    const stockStatus = getStockStatus(item)
                    const expiring = isExpiringSoon(item.expiryDate)

                    return (
                      <div key={item.id} className="p-4 hover:bg-gray-50">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-4">
                            <Package className="h-5 w-5 text-gray-500" />
                            <div>
                              <div className="flex items-center gap-2">
                                <h3 className="font-medium">{item.name}</h3>
                                <Badge className={stockStatus.color}>{stockStatus.status}</Badge>
                                {expiring && <Badge className="bg-yellow-100 text-yellow-800">Expiring Soon</Badge>}
                              </div>
                              <p className="text-sm text-gray-600">
                                {item.category} • {item.currentStock} {item.unit} • {item.supplier}
                              </p>
                              <p className="text-sm text-gray-600">
                                Location: {item.location} • Cost: Rs. {item.cost}
                              </p>
                              {item.expiryDate && (
                                <p className="text-xs text-gray-500">
                                  Expires: {new Date(item.expiryDate).toLocaleDateString()}
                                </p>
                              )}
                            </div>
                          </div>
                          <div className="flex gap-2">
                            <Button variant="outline" size="sm" onClick={() => handleEdit(item)}>
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button variant="outline" size="sm" onClick={() => handleDelete(item.id)}>
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                      </div>
                    )
                  })}
                </div>
              ) : (
                <div className="text-center py-12">
                  <Package className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">No items found</h3>
                  <p className="text-gray-500">
                    {searchTerm || filterCategory !== "all" || filterStatus !== "all"
                      ? "No items match your current filters."
                      : "Add your first inventory item to get started."}
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="alerts" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Stock Alerts</CardTitle>
              <CardDescription>Items requiring immediate attention</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {/* Low Stock Items */}
                {inventory.filter((item) => Number.parseInt(item.currentStock) <= Number.parseInt(item.minStock))
                  .length > 0 && (
                  <div>
                    <h3 className="font-medium text-red-700 mb-3">Low Stock Items</h3>
                    <div className="space-y-2">
                      {inventory
                        .filter((item) => Number.parseInt(item.currentStock) <= Number.parseInt(item.minStock))
                        .map((item) => (
                          <div
                            key={item.id}
                            className="flex items-center justify-between p-3 bg-red-50 border border-red-200 rounded"
                          >
                            <div>
                              <p className="font-medium">{item.name}</p>
                              <p className="text-sm text-gray-600">
                                Current: {item.currentStock} {item.unit} (Min: {item.minStock})
                              </p>
                            </div>
                            <Badge className="bg-red-100 text-red-800">Low Stock</Badge>
                          </div>
                        ))}
                    </div>
                  </div>
                )}

                {/* Expiring Items */}
                {inventory.filter((item) => isExpiringSoon(item.expiryDate)).length > 0 && (
                  <div>
                    <h3 className="font-medium text-yellow-700 mb-3">Expiring Soon</h3>
                    <div className="space-y-2">
                      {inventory
                        .filter((item) => isExpiringSoon(item.expiryDate))
                        .map((item) => (
                          <div
                            key={item.id}
                            className="flex items-center justify-between p-3 bg-yellow-50 border border-yellow-200 rounded"
                          >
                            <div>
                              <p className="font-medium">{item.name}</p>
                              <p className="text-sm text-gray-600">
                                Expires: {new Date(item.expiryDate).toLocaleDateString()}
                              </p>
                            </div>
                            <Badge className="bg-yellow-100 text-yellow-800">Expiring</Badge>
                          </div>
                        ))}
                    </div>
                  </div>
                )}

                {inventory.filter(
                  (item) =>
                    Number.parseInt(item.currentStock) <= Number.parseInt(item.minStock) ||
                    isExpiringSoon(item.expiryDate),
                ).length === 0 && (
                  <div className="text-center py-8">
                    <AlertTriangle className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-500">No alerts at this time</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="reports" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Inventory Reports</CardTitle>
              <CardDescription>Summary and analytics</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="grid md:grid-cols-2 gap-4">
                  <div className="border rounded-lg p-4">
                    <h3 className="font-medium mb-2">Stock by Category</h3>
                    <div className="space-y-2">
                      {getUniqueCategories().map((category) => {
                        const categoryItems = inventory.filter((item) => item.category === category)
                        const totalValue = categoryItems.reduce(
                          (sum, item) => sum + Number.parseInt(item.currentStock) * Number.parseFloat(item.cost || 0),
                          0,
                        )
                        return (
                          <div key={category} className="flex justify-between text-sm">
                            <span>{category}</span>
                            <span>
                              {categoryItems.length} items (Rs. {totalValue.toLocaleString()})
                            </span>
                          </div>
                        )
                      })}
                    </div>
                  </div>

                  <div className="border rounded-lg p-4">
                    <h3 className="font-medium mb-2">Stock Status Summary</h3>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span>Normal Stock</span>
                        <span>
                          {
                            inventory.filter((item) => {
                              const current = Number.parseInt(item.currentStock)
                              const min = Number.parseInt(item.minStock)
                              const max = Number.parseInt(item.maxStock)
                              return current > min && current < max
                            }).length
                          }{" "}
                          items
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span>Low Stock</span>
                        <span className="text-red-600">{stats.lowStockItems} items</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Expiring Soon</span>
                        <span className="text-yellow-600">{stats.expiringSoon} items</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
