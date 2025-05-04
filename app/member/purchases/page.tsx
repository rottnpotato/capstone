"use client"

import { useState } from "react"
import { motion } from "framer-motion"
import { Search, Calendar, Download, Eye, ShoppingBag } from "lucide-react"
import { Navbar } from "@/components/ui/navbar"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"

// Purchase type definition
interface Purchase {
  id: string
  date: string
  items: number
  total: number
  paymentMethod: string
  status: string
  itemDetails: {
    name: string
    quantity: number
    price: number
  }[]
}

export default function PurchasesPage() {
  const [searchQuery, setSearchQuery] = useState("")
  const [dateFilter, setDateFilter] = useState("all")
  const [statusFilter, setStatusFilter] = useState("all")
  const [selectedPurchase, setSelectedPurchase] = useState<Purchase | null>(null)
  const [isReceiptModalOpen, setIsReceiptModalOpen] = useState(false)

  // Member data
  const memberData = {
    name: "Maria Santos",
    memberID: "M001",
    joinDate: "January 15, 2020",
    purchaseHistory: [
      {
        id: "TRX-001",
        date: "Apr 13, 2025",
        items: 5,
        total: 1250.0,
        paymentMethod: "Cash",
        status: "Completed",
        itemDetails: [
          { name: "Organic Rice (5kg)", quantity: 2, price: 500.0 },
          { name: "Fresh Eggs (tray)", quantity: 1, price: 180.0 },
          { name: "Cooking Oil (1L)", quantity: 1, price: 120.0 },
          { name: "Sugar (1kg)", quantity: 2, price: 130.0 },
          { name: "Coffee (250g)", quantity: 1, price: 320.0 },
        ],
      },
      {
        id: "TRX-002",
        date: "Apr 05, 2025",
        items: 3,
        total: 780.5,
        paymentMethod: "Cash",
        status: "Completed",
        itemDetails: [
          { name: "Flour (1kg)", quantity: 1, price: 85.5 },
          { name: "Milk (1L)", quantity: 3, price: 165.0 },
          { name: "Canned Goods", quantity: 5, price: 530.0 },
        ],
      },
      {
        id: "TRX-003",
        date: "Mar 28, 2025",
        items: 7,
        total: 2340.75,
        paymentMethod: "Credit",
        status: "Credit",
        itemDetails: [
          { name: "Rice (25kg)", quantity: 1, price: 1200.0 },
          { name: "Cooking Oil (5L)", quantity: 1, price: 550.75 },
          { name: "Sugar (5kg)", quantity: 1, price: 325.0 },
          { name: "Flour (5kg)", quantity: 1, price: 265.0 },
        ],
      },
      {
        id: "TRX-004",
        date: "Mar 20, 2025",
        items: 2,
        total: 450.25,
        paymentMethod: "Cash",
        status: "Completed",
        itemDetails: [
          { name: "Coffee (500g)", quantity: 1, price: 250.25 },
          { name: "Sugar (1kg)", quantity: 1, price: 65.0 },
          { name: "Creamer (250g)", quantity: 1, price: 135.0 },
        ],
      },
      {
        id: "TRX-005",
        date: "Mar 15, 2025",
        items: 4,
        total: 1875.0,
        paymentMethod: "Credit",
        status: "Credit",
        itemDetails: [
          { name: "Rice (10kg)", quantity: 1, price: 500.0 },
          { name: "Cooking Oil (2L)", quantity: 2, price: 480.0 },
          { name: "Meat Products", quantity: 5, price: 895.0 },
        ],
      },
    ],
  }

  // Filter purchases based on search query, date filter, and status filter
  const filteredPurchases = memberData.purchaseHistory.filter((purchase) => {
    const matchesSearch = purchase.id.toLowerCase().includes(searchQuery.toLowerCase())
    const matchesDate = dateFilter === "all" || purchase.date === dateFilter
    const matchesStatus = statusFilter === "all" || purchase.status === statusFilter

    return matchesSearch && matchesDate && matchesStatus
  })

  // Get unique dates from purchases
  const uniqueDates = ["all", ...Array.from(new Set(memberData.purchaseHistory.map((purchase) => purchase.date)))]

  // Get unique statuses from purchases
  const uniqueStatuses = ["all", ...Array.from(new Set(memberData.purchaseHistory.map((purchase) => purchase.status)))]

  // Handle purchase click to view receipt
  const viewReceipt = (purchase: Purchase) => {
    setSelectedPurchase(purchase)
    setIsReceiptModalOpen(true)
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar userType="member" userName={memberData.name} />

      <main className="pt-16 pb-20">
        <div className="container mx-auto px-4 py-8">
          <div className="flex flex-col md:flex-row gap-4 items-start md:items-center justify-between mb-8">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Purchase History</h1>
              <p className="text-gray-600">View all your purchases from Pandol Cooperative</p>
            </div>

            <div className="flex flex-col sm:flex-row gap-3">
              <Button variant="outline" className="flex items-center gap-2">
                <Calendar className="h-4 w-4" />
                Select Date Range
              </Button>
              <Button className="bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600">
                <Download className="h-4 w-4 mr-2" />
                Export History
              </Button>
            </div>
          </div>

          {/* Filters and Search */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
              <Input
                type="text"
                placeholder="Search by transaction ID..."
                className="pl-10"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>

            <Select value={dateFilter} onValueChange={setDateFilter}>
              <SelectTrigger>
                <SelectValue placeholder="Filter by date" />
              </SelectTrigger>
              <SelectContent>
                {uniqueDates.map((date) => (
                  <SelectItem key={date} value={date}>
                    {date === "all" ? "All Dates" : date}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger>
                <SelectValue placeholder="Filter by status" />
              </SelectTrigger>
              <SelectContent>
                {uniqueStatuses.map((status) => (
                  <SelectItem key={status} value={status}>
                    {status === "all" ? "All Statuses" : status}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Purchase Summary Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-500">Total Purchases</p>
                    <p className="text-2xl font-bold text-gray-900">{memberData.purchaseHistory.length}</p>
                  </div>
                  <div className="h-10 w-10 rounded-full bg-amber-100 flex items-center justify-center">
                    <ShoppingBag className="h-5 w-5 text-amber-600" />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-500">Total Spent</p>
                    <p className="text-2xl font-bold text-gray-900">
                      ₱{memberData.purchaseHistory.reduce((sum, purchase) => sum + purchase.total, 0).toFixed(2)}
                    </p>
                  </div>
                  <div className="h-10 w-10 rounded-full bg-green-100 flex items-center justify-center">
                    <ShoppingBag className="h-5 w-5 text-green-600" />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-500">Credit Purchases</p>
                    <p className="text-2xl font-bold text-gray-900">
                      {memberData.purchaseHistory.filter((p) => p.status === "Credit").length}
                    </p>
                  </div>
                  <div className="h-10 w-10 rounded-full bg-blue-100 flex items-center justify-center">
                    <ShoppingBag className="h-5 w-5 text-blue-600" />
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Purchases Table */}
          <Card>
            <CardHeader>
              <CardTitle>Purchase History</CardTitle>
              <CardDescription>View all your transactions with Pandol Cooperative</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left py-3 px-4 font-medium text-gray-600">Transaction ID</th>
                      <th className="text-left py-3 px-4 font-medium text-gray-600">Date</th>
                      <th className="text-left py-3 px-4 font-medium text-gray-600">Items</th>
                      <th className="text-left py-3 px-4 font-medium text-gray-600">Total</th>
                      <th className="text-left py-3 px-4 font-medium text-gray-600">Payment</th>
                      <th className="text-left py-3 px-4 font-medium text-gray-600">Status</th>
                      <th className="text-left py-3 px-4 font-medium text-gray-600">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredPurchases.map((purchase) => (
                      <motion.tr
                        key={purchase.id}
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        className="border-b hover:bg-gray-50"
                      >
                        <td className="py-3 px-4 font-medium">{purchase.id}</td>
                        <td className="py-3 px-4">{purchase.date}</td>
                        <td className="py-3 px-4">{purchase.items}</td>
                        <td className="py-3 px-4 font-medium">₱{purchase.total.toFixed(2)}</td>
                        <td className="py-3 px-4">{purchase.paymentMethod}</td>
                        <td className="py-3 px-4">
                          <span
                            className={`inline-block px-2 py-1 rounded-full text-xs font-medium ${
                              purchase.status === "Completed"
                                ? "bg-green-100 text-green-800"
                                : "bg-amber-100 text-amber-800"
                            }`}
                          >
                            {purchase.status}
                          </span>
                        </td>
                        <td className="py-3 px-4">
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-8 text-amber-600"
                            onClick={() => viewReceipt(purchase)}
                          >
                            <Eye className="h-4 w-4 mr-1" /> View Receipt
                          </Button>
                        </td>
                      </motion.tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </div>
      </main>

      {/* Receipt Modal */}
      <Dialog open={isReceiptModalOpen} onOpenChange={setIsReceiptModalOpen}>
        <DialogContent className="sm:max-w-md max-h-screen overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Purchase Receipt</DialogTitle>
            <DialogDescription>Purchase details and receipt</DialogDescription>
          </DialogHeader>

          {selectedPurchase && (
            <div className="space-y-4">
              <div className="text-center border-b border-dashed border-gray-200 pb-4">
                <h3 className="font-bold text-xl">Pandol Cooperative</h3>
                <p className="text-gray-600 text-sm">Pandol, Corella, Bohol</p>
                <p className="text-gray-600 text-sm">Tel: +63 (38) 412-5678</p>
              </div>

              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Transaction ID:</span>
                <span className="font-medium">{selectedPurchase.id}</span>
              </div>

              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Date:</span>
                <span className="font-medium">{selectedPurchase.date}</span>
              </div>

              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Member:</span>
                <span className="font-medium">
                  {memberData.name} ({memberData.memberID})
                </span>
              </div>

              <div className="border-t border-dashed border-gray-200 pt-4 mt-4">
                <h4 className="font-medium mb-2">Items</h4>
                <div className="space-y-2 max-h-60 overflow-y-auto">
                  {selectedPurchase.itemDetails.map((item, index) => (
                    <div key={index} className="flex justify-between text-sm">
                      <div>
                        <span className="font-medium">{item.name}</span>
                        <div className="text-gray-600">
                          {item.quantity} x ₱{item.price.toFixed(2)}
                        </div>
                      </div>
                      <span className="font-medium">₱{(item.price * item.quantity).toFixed(2)}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="border-t border-dashed border-gray-200 pt-4 space-y-2">
                <div className="flex justify-between font-bold">
                  <span>Total:</span>
                  <span className="text-amber-600">₱{selectedPurchase.total.toFixed(2)}</span>
                </div>

                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Payment Method:</span>
                  <span>{selectedPurchase.paymentMethod}</span>
                </div>

                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Status:</span>
                  <span className={`${selectedPurchase.status === "Completed" ? "text-green-600" : "text-amber-600"}`}>
                    {selectedPurchase.status}
                  </span>
                </div>
              </div>

              <div className="text-center border-t border-dashed border-gray-200 pt-4">
                <p className="font-medium">Thank you for shopping with us!</p>
                <p className="text-gray-600 text-sm">Please come again</p>
              </div>
            </div>
          )}

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setIsReceiptModalOpen(false)
              }}
            >
              Close
            </Button>
            <Button className="bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600">
              <Download className="h-4 w-4 mr-2" />
              Download
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
