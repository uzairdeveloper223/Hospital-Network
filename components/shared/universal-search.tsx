"use client"

import { useState, useEffect, useRef } from "react"
import { Search, Filter, X, User, UserCheck, Calendar, FileText, Pill, Award, Bed, Package } from "lucide-react"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { searchUtilities } from "@/lib/utils/search"

export default function UniversalSearch({
  onResultSelect,
  placeholder = "Search across all modules...",
  filters = {},
}) {
  const [searchTerm, setSearchTerm] = useState("")
  const [results, setResults] = useState({})
  const [isSearching, setIsSearching] = useState(false)
  const [showResults, setShowResults] = useState(false)
  const [showFilters, setShowFilters] = useState(false)
  const [activeFilters, setActiveFilters] = useState(filters)
  const searchRef = useRef(null)

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (searchRef.current && !searchRef.current.contains(event.target)) {
        setShowResults(false)
      }
    }

    document.addEventListener("mousedown", handleClickOutside)
    return () => document.removeEventListener("mousedown", handleClickOutside)
  }, [])

  useEffect(() => {
    const searchData = async () => {
      if (searchTerm.trim().length < 2) {
        setResults({})
        setShowResults(false)
        return
      }

      setIsSearching(true)
      try {
        const searchResults = await searchUtilities.universalSearch(searchTerm, activeFilters)
        setResults(searchResults)
        setShowResults(true)
      } catch (error) {
        console.error("Search error:", error)
      } finally {
        setIsSearching(false)
      }
    }

    const debounceTimer = setTimeout(searchData, 300)
    return () => clearTimeout(debounceTimer)
  }, [searchTerm, activeFilters])

  const getResultIcon = (type) => {
    const icons = {
      patients: User,
      doctors: UserCheck,
      appointments: Calendar,
      messages: FileText,
      labReports: FileText,
      prescriptions: Pill,
      certificates: Award,
      beds: Bed,
      inventory: Package,
    }
    return icons[type] || FileText
  }

  const getResultCount = () => {
    return Object.values(results).reduce((total, arr) => total + (arr?.length || 0), 0)
  }

  const handleResultClick = (type, item) => {
    if (onResultSelect) {
      onResultSelect(type, item)
    }
    setShowResults(false)
    setSearchTerm("")
  }

  return (
    <div ref={searchRef} className="relative w-full max-w-2xl">
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
        <Input
          type="text"
          placeholder={placeholder}
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="pl-10 pr-20"
          onFocus={() => searchTerm.length >= 2 && setShowResults(true)}
        />
        <div className="absolute right-2 top-1/2 transform -translate-y-1/2 flex items-center gap-1">
          <Button variant="ghost" size="sm" onClick={() => setShowFilters(!showFilters)} className="h-6 w-6 p-0">
            <Filter className="h-3 w-3" />
          </Button>
          {searchTerm && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                setSearchTerm("")
                setShowResults(false)
              }}
              className="h-6 w-6 p-0"
            >
              <X className="h-3 w-3" />
            </Button>
          )}
        </div>
      </div>

      {showFilters && (
        <Card className="absolute top-12 left-0 right-0 z-50 mt-1">
          <CardContent className="p-4">
            <div className="space-y-3">
              <h4 className="font-medium">Search Filters</h4>
              <div className="grid grid-cols-2 gap-2">
                <label className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    checked={!activeFilters.exclude?.includes("patients")}
                    onChange={(e) => {
                      const exclude = activeFilters.exclude || []
                      if (e.target.checked) {
                        setActiveFilters({
                          ...activeFilters,
                          exclude: exclude.filter((item) => item !== "patients"),
                        })
                      } else {
                        setActiveFilters({
                          ...activeFilters,
                          exclude: [...exclude, "patients"],
                        })
                      }
                    }}
                  />
                  <span className="text-sm">Patients</span>
                </label>
                <label className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    checked={!activeFilters.exclude?.includes("doctors")}
                    onChange={(e) => {
                      const exclude = activeFilters.exclude || []
                      if (e.target.checked) {
                        setActiveFilters({
                          ...activeFilters,
                          exclude: exclude.filter((item) => item !== "doctors"),
                        })
                      } else {
                        setActiveFilters({
                          ...activeFilters,
                          exclude: [...exclude, "doctors"],
                        })
                      }
                    }}
                  />
                  <span className="text-sm">Doctors</span>
                </label>
                <label className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    checked={!activeFilters.exclude?.includes("appointments")}
                    onChange={(e) => {
                      const exclude = activeFilters.exclude || []
                      if (e.target.checked) {
                        setActiveFilters({
                          ...activeFilters,
                          exclude: exclude.filter((item) => item !== "appointments"),
                        })
                      } else {
                        setActiveFilters({
                          ...activeFilters,
                          exclude: [...exclude, "appointments"],
                        })
                      }
                    }}
                  />
                  <span className="text-sm">Appointments</span>
                </label>
                <label className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    checked={!activeFilters.exclude?.includes("labReports")}
                    onChange={(e) => {
                      const exclude = activeFilters.exclude || []
                      if (e.target.checked) {
                        setActiveFilters({
                          ...activeFilters,
                          exclude: exclude.filter((item) => item !== "labReports"),
                        })
                      } else {
                        setActiveFilters({
                          ...activeFilters,
                          exclude: [...exclude, "labReports"],
                        })
                      }
                    }}
                  />
                  <span className="text-sm">Lab Reports</span>
                </label>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {showResults && (
        <Card className="absolute top-12 left-0 right-0 z-40 mt-1 max-h-96 overflow-y-auto">
          <CardContent className="p-0">
            {isSearching ? (
              <div className="p-4 text-center text-gray-500">Searching...</div>
            ) : getResultCount() === 0 ? (
              <div className="p-4 text-center text-gray-500">No results found for "{searchTerm}"</div>
            ) : (
              <div className="divide-y">
                {Object.entries(results).map(([type, items]) => {
                  if (!items || items.length === 0) return null

                  const Icon = getResultIcon(type)

                  return (
                    <div key={type} className="p-3">
                      <div className="flex items-center gap-2 mb-2">
                        <Icon className="h-4 w-4 text-gray-500" />
                        <span className="font-medium capitalize text-sm">{type.replace(/([A-Z])/g, " $1").trim()}</span>
                        <Badge variant="secondary" className="text-xs">
                          {items.length}
                        </Badge>
                      </div>
                      <div className="space-y-1">
                        {items.slice(0, 3).map((item, index) => (
                          <div
                            key={index}
                            className="p-2 hover:bg-gray-50 rounded cursor-pointer text-sm"
                            onClick={() => handleResultClick(type, item)}
                          >
                            <div className="font-medium">
                              {item.name || item.patientName || item.doctorName || item.bedNumber || "Unknown"}
                            </div>
                            <div className="text-gray-500 text-xs">
                              {type === "patients" && item.phone}
                              {type === "doctors" && item.specialization}
                              {type === "appointments" && item.date}
                              {type === "labReports" && item.testType}
                              {type === "prescriptions" && `${item.medications?.length || 0} medications`}
                              {type === "certificates" && item.type}
                              {type === "beds" && `${item.ward} - ${item.type}`}
                              {type === "inventory" && item.category}
                            </div>
                          </div>
                        ))}
                        {items.length > 3 && (
                          <div className="text-xs text-gray-500 p-2">+{items.length - 3} more results</div>
                        )}
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  )
}
