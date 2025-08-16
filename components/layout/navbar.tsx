"use client"

import { Hospital, Menu, X } from "lucide-react"
import { useState } from "react"
import { Button } from "@/components/ui/button"

export default function Navbar() {
  const [isMenuOpen, setIsMenuOpen] = useState(false)

  return (
    <nav className="bg-white shadow-sm border-b">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <div className="flex items-center space-x-3">
            <Hospital className="h-8 w-8 text-blue-600" />
            <span className="text-xl font-bold text-gray-900">HMS</span>
          </div>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center space-x-6">
            <a href="/" className="text-gray-600 hover:text-blue-600 transition-colors">
              Home
            </a>
            <a href="/patient" className="text-gray-600 hover:text-blue-600 transition-colors">
              Patient
            </a>
            <a href="/doctor/login" className="text-gray-600 hover:text-blue-600 transition-colors">
              Doctor
            </a>
            <a href="/admin" className="text-gray-600 hover:text-blue-600 transition-colors">
              Admin
            </a>
            <Button
              variant="outline"
              className="border-red-200 text-red-600 hover:bg-red-50 bg-transparent"
              onClick={() => (window.location.href = "/emergency")}
            >
              Emergency
            </Button>
          </div>

          {/* Mobile menu button */}
          <div className="md:hidden">
            <Button variant="ghost" size="sm" onClick={() => setIsMenuOpen(!isMenuOpen)}>
              {isMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
            </Button>
          </div>
        </div>

        {/* Mobile Navigation */}
        {isMenuOpen && (
          <div className="md:hidden py-4 border-t">
            <div className="flex flex-col space-y-3">
              <a href="/" className="text-gray-600 hover:text-blue-600 transition-colors py-2">
                Home
              </a>
              <a href="/patient" className="text-gray-600 hover:text-blue-600 transition-colors py-2">
                Patient
              </a>
              <a href="/doctor/login" className="text-gray-600 hover:text-blue-600 transition-colors py-2">
                Doctor
              </a>
              <a href="/admin" className="text-gray-600 hover:text-blue-600 transition-colors py-2">
                Admin
              </a>
              <Button
                variant="outline"
                className="border-red-200 text-red-600 hover:bg-red-50 w-full bg-transparent"
                onClick={() => (window.location.href = "/emergency")}
              >
                Emergency
              </Button>
            </div>
          </div>
        )}
      </div>
    </nav>
  )
}
