"use client"

import { useState, useEffect } from "react"
import { motion } from "framer-motion"
import { Search, Calendar, Download, Eye, Mail, Printer } from "lucide-react"
import { Navbar } from "@/components/ui/navbar"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { toast } from "@/components/ui/use-toast"
import { Spinner } from "@/components/ui/spinner"
import { GetTransactions, SendReceiptEmail } from "../actions"

// Transaction type definition
interface Transaction {
  Id: string
  Date: string
  Time: string
  Items: number
  Total: number
  AmountReceived?: number
  Change?: number
  PaymentMethod: string
  Status: string
  Member?: string
  MemberId?: string
  MemberEmail?: string
  Cashier: string
  ItemDetails: {
    Name: string
    Quantity: number
    Price: number
  }[]
}

export default function TransactionsPage() {
  const [searchQuery, setSearchQuery] = useState("")
  const [dateFilter, setDateFilter] = useState("all")
  const [statusFilter, setStatusFilter] = useState("all")
  const [selectedTransaction, setSelectedTransaction] = useState<Transaction | null>(null)
  const [isReceiptModalOpen, setIsReceiptModalOpen] = useState(false)
  const [isEmailSent, setIsEmailSent] = useState(false)
  const [isSendingEmail, setIsSendingEmail] = useState(false)
  const [emailError, setEmailError] = useState<string | null>(null)
  const [transactions, setTransactions] = useState<Transaction[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Fetch transactions from database
  useEffect(() => {
    const fetchTransactions = async () => {
      setIsLoading(true)
      setError(null)
      
      try {
        const data = await GetTransactions()
        setTransactions(data)
      } catch (err) {
        console.error("Error fetching transactions:", err)
        setError("Failed to load transactions. Please try again.")
      } finally {
        setIsLoading(false)
      }
    }
    
    fetchTransactions()
  }, [])

  // Filter transactions based on search query, date filter, and status filter
  const filteredTransactions = transactions.filter((transaction) => {
    const matchesSearch =
      transaction.Id.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (transaction.Member && transaction.Member.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (transaction.MemberId && transaction.MemberId.toLowerCase().includes(searchQuery.toLowerCase()))

    const matchesDate = dateFilter === "all" || transaction.Date === dateFilter

    const matchesStatus = statusFilter === "all" || transaction.Status === statusFilter

    return matchesSearch && matchesDate && matchesStatus
  })

  // Get unique dates from transactions
  const uniqueDates = ["all", ...Array.from(new Set(transactions.map((transaction) => transaction.Date)))]

  // Get unique statuses from transactions
  const uniqueStatuses = ["all", ...Array.from(new Set(transactions.map((transaction) => transaction.Status)))]

  // Handle transaction click to view receipt
  const viewReceipt = (transaction: Transaction) => {
    setSelectedTransaction(transaction)
    setIsReceiptModalOpen(true)
    setIsEmailSent(false)
    setEmailError(null)
  }

  // Handle sending receipt to email
  const handleSendReceipt = async () => {
    if (!selectedTransaction) {
      return
    }
    
    // Check if member email is available
    if (!selectedTransaction.MemberEmail) {
      setEmailError("Customer email not available. Cannot send receipt.")
      toast({
        title: "Email Not Available",
        description: "This transaction doesn't have an associated email address.",
        variant: "destructive"
      })
      return
    }
    
    setIsSendingEmail(true)
    setEmailError(null)
    
    // Show optimistic toast
    toast({
      title: "Sending Receipt",
      description: `Sending to ${selectedTransaction.MemberEmail}...`,
    })
    
    try {
      const result = await SendReceiptEmail(
        selectedTransaction.Id,
        selectedTransaction.MemberEmail,
        selectedTransaction.Member || "Customer"
      )
      
      if (result.success) {
        setIsEmailSent(true)
        toast({
          title: "Receipt Sent Successfully",
          description: `Receipt for transaction ${selectedTransaction.Id} has been sent to ${selectedTransaction.MemberEmail}.`,
          variant: "default"
        })
        
        // Clear email sent status after 5 seconds
        setTimeout(() => {
          setIsEmailSent(false)
        }, 5000)
      } else {
        setEmailError(result.error || "Failed to send email. Please try again.")
        toast({
          title: "Failed to Send Receipt",
          description: result.error || "An error occurred while sending the receipt. Please try again.",
          variant: "destructive"
        })
      }
    } catch (error) {
      console.error("Error sending receipt:", error)
      setEmailError("An unexpected error occurred. Please try again.")
      toast({
        title: "Email Error",
        description: "An unexpected error occurred while sending the email.",
        variant: "destructive"
      })
    } finally {
      setIsSendingEmail(false)
    }
  }

  // Handle printing receipt
  const handlePrintReceipt = () => {
    window.print()
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar userType="cashier" userName="Cashier" />

      <main className="pt-16 pb-20">
        <div className="container mx-auto px-4 py-8">
          <div className="flex flex-col md:flex-row gap-4 items-start md:items-center justify-between mb-8">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Transaction History</h1>
              <p className="text-gray-600">View and manage all transactions</p>
            </div>

            <div className="flex flex-col sm:flex-row gap-3">
              <Button variant="outline" className="flex items-center gap-2">
                <Calendar className="h-4 w-4" />
                Select Date Range
              </Button>
              <Button className="bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600">
                <Download className="h-4 w-4 mr-2" />
                Export Transactions
              </Button>
            </div>
          </div>

          {/* Filters and Search */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
              <Input
                type="text"
                placeholder="Search by transaction ID or member..."
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

          {/* Transactions Table */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-lg font-medium">Transactions</CardTitle>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="space-y-4">
                  {[...Array(5)].map((_, index) => (
                    <div key={index} className="w-full h-12 bg-gray-200 rounded animate-pulse"/>
                  ))}
                </div>
              ) : error ? (
                <Alert className="bg-red-50 border-red-200 text-red-800">
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              ) : filteredTransactions.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  No transactions found. {searchQuery || dateFilter !== "all" || statusFilter !== "all" 
                    ? "Try adjusting your filters." 
                    : ""}
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b">
                        <th className="text-left py-3 px-4 font-medium text-gray-600">Transaction ID</th>
                        <th className="text-left py-3 px-4 font-medium text-gray-600">Date & Time</th>
                        <th className="text-left py-3 px-4 font-medium text-gray-600">Items</th>
                        <th className="text-left py-3 px-4 font-medium text-gray-600">Total</th>
                        <th className="text-left py-3 px-4 font-medium text-gray-600">Payment</th>
                        <th className="text-left py-3 px-4 font-medium text-gray-600">Member</th>
                        <th className="text-left py-3 px-4 font-medium text-gray-600">Status</th>
                        <th className="text-left py-3 px-4 font-medium text-gray-600">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredTransactions.map((transaction) => (
                        <motion.tr
                          key={transaction.Id}
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          className="border-b hover:bg-gray-50"
                        >
                          <td className="py-3 px-4 font-medium">{transaction.Id}</td>
                          <td className="py-3 px-4">
                            {transaction.Date}
                            <div className="text-xs text-gray-500">{transaction.Time}</div>
                          </td>
                          <td className="py-3 px-4">{transaction.Items}</td>
                          <td className="py-3 px-4 font-medium">
                            ₱{transaction.Total ? transaction.Total.toFixed(2) : "0.00"}
                          </td>
                          <td className="py-3 px-4">{transaction.PaymentMethod}</td>
                          <td className="py-3 px-4">
                            {transaction.Member ? (
                              <div>
                                <div>{transaction.Member}</div>
                                <div className="text-xs text-gray-500">{transaction.MemberId}</div>
                              </div>
                            ) : (
                              <span className="text-gray-500">Non-member</span>
                            )}
                          </td>
                          <td className="py-3 px-4">
                            <span
                              className={`inline-block px-2 py-1 rounded-full text-xs font-medium ${
                                transaction.Status === "Completed"
                                  ? "bg-green-100 text-green-800"
                                  : "bg-amber-100 text-amber-800"
                              }`}
                            >
                              {transaction.Status}
                            </span>
                          </td>
                          <td className="py-3 px-4">
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-8 text-amber-600"
                              onClick={() => viewReceipt(transaction)}
                            >
                              <Eye className="h-4 w-4 mr-1" /> View
                            </Button>
                          </td>
                        </motion.tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </main>

      {/* Receipt Modal */}
      <Dialog open={isReceiptModalOpen} onOpenChange={setIsReceiptModalOpen}>
        <DialogContent className="sm:max-w-md max-h-screen overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Transaction Receipt</DialogTitle>
            <DialogDescription>Transaction details and receipt</DialogDescription>
          </DialogHeader>

          {selectedTransaction && (
            <div className="space-y-4">
              <div className="text-center border-b border-dashed border-gray-200 pb-4">
                <h3 className="font-bold text-xl">Pandol Cooperative</h3>
                <p className="text-gray-600 text-sm">Pandol, Corella, Bohol</p>
                <p className="text-gray-600 text-sm">Tel: +63 (38) 412-5678</p>
              </div>

              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Transaction ID:</span>
                <span className="font-medium">{selectedTransaction.Id}</span>
              </div>

              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Date & Time:</span>
                <span className="font-medium">
                  {selectedTransaction.Date} {selectedTransaction.Time}
                </span>
              </div>

              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Cashier:</span>
                <span className="font-medium">{selectedTransaction.Cashier}</span>
              </div>

              {selectedTransaction.Member && (
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Member:</span>
                  <span className="font-medium">
                    {selectedTransaction.Member} ({selectedTransaction.MemberId})
                  </span>
                </div>
              )}

              <div className="border-t border-dashed border-gray-200 pt-4 mt-4">
                <h4 className="font-medium mb-2">Items</h4>
                <div className="space-y-2 max-h-60 overflow-y-auto">
                  {selectedTransaction.ItemDetails.map((item, index) => (
                    <div key={index} className="flex justify-between text-sm">
                      <div>
                        <span className="font-medium">{item.Name}</span>
                        <div className="text-gray-600">
                          {item.Quantity} x ₱{item.Price ? item.Price.toFixed(2) : "0.00"}
                        </div>
                      </div>
                      <span className="font-medium">
                        ₱{item.Price && item.Quantity ? (item.Price * item.Quantity).toFixed(2) : "0.00"}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="border-t border-dashed border-gray-200 pt-4 space-y-2">
                <div className="flex justify-between font-bold">
                  <span>Total:</span>
                  <span className="text-amber-600">
                    ₱{selectedTransaction.Total ? selectedTransaction.Total.toFixed(2) : "0.00"}
                  </span>
                </div>

                {selectedTransaction.AmountReceived !== undefined && (
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Amount Received:</span>
                    <span>
                      ₱{selectedTransaction.AmountReceived.toFixed(2)}
                    </span>
                  </div>
                )}

                {selectedTransaction.Change !== undefined && selectedTransaction.Change > 0 && (
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Change:</span>
                    <span>₱{selectedTransaction.Change.toFixed(2)}</span>
                  </div>
                )}

                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Payment Method:</span>
                  <span>{selectedTransaction.PaymentMethod}</span>
                </div>

                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Status:</span>
                  <span
                    className={`${selectedTransaction.Status === "Completed" ? "text-green-600" : "text-amber-600"}`}
                  >
                    {selectedTransaction.Status}
                  </span>
                </div>
              </div>

              <div className="text-center border-t border-dashed border-gray-200 pt-4">
                <p className="font-medium">Thank you for shopping with us!</p>
                <p className="text-gray-600 text-sm">Please come again</p>
              </div>

              {emailError && (
                <Alert className="bg-red-50 border-red-200 text-red-800">
                  <AlertDescription>{emailError}</AlertDescription>
                </Alert>
              )}
              
              {isEmailSent && (
                <Alert className="bg-green-50 border-green-200 text-green-800">
                  <AlertDescription>
                    Receipt sent successfully to {selectedTransaction.MemberEmail || "customer"}!
                  </AlertDescription>
                </Alert>
              )}
            </div>
          )}

          <DialogFooter className="flex flex-col sm:flex-row gap-2">
            <Button
              variant="outline"
              className="sm:flex-1"
              onClick={() => {
                setIsReceiptModalOpen(false)
              }}
            >
              Close
            </Button>
            <Button variant="outline" className="sm:flex-1" onClick={handlePrintReceipt}>
              <Printer className="h-4 w-4 mr-2" />
              Print
            </Button>
            <Button
              className="sm:flex-1 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600"
              onClick={handleSendReceipt}
              disabled={isEmailSent || isSendingEmail || !selectedTransaction?.MemberEmail}
            >
              <Mail className="h-4 w-4 mr-2" />
              {isSendingEmail ? (
                <span className="flex items-center">
                  <span className="animate-spin mr-2">⏳</span> Sending...
                </span>
              ) : isEmailSent ? (
                "Sent!"
              ) : (
                "Send Receipt"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
