"use client"

import { useState } from "react"
import { motion } from "framer-motion"
import { CreditCard, Calendar, AlertCircle, CheckCircle2, BarChart4, Wallet, Download } from "lucide-react"
import { Navbar } from "@/components/ui/navbar"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { Alert, AlertDescription } from "@/components/ui/alert"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"

interface Payment {
  id: string
  date: string
  amount: number
  method: string
  status: string
  description?: string
}

export default function CreditStatusPage() {
  const [showPaymentModal, setShowPaymentModal] = useState(false)
  const [showCreditModal, setShowCreditModal] = useState(false)
  const [selectedPayment, setSelectedPayment] = useState<Payment | null>(null)
  const [paymentAmount, setPaymentAmount] = useState("")
  const [paymentMethod, setPaymentMethod] = useState("cash")
  const [processingPayment, setProcessingPayment] = useState(false)
  const [paymentSuccess, setPaymentSuccess] = useState(false)
  const [creditIncreaseAmount, setCreditIncreaseAmount] = useState(1000)
  const [showReceiptModal, setShowReceiptModal] = useState(false)
  const [selectedPaymentReceipt, setSelectedPaymentReceipt] = useState<Payment | null>(null)

  // Member data
  const memberData = {
    name: "Maria Santos",
    memberID: "M001",
    joinDate: "January 15, 2020",
    creditLimit: 5000,
    currentCredit: 2500,
    availableCredit: 2500,
    creditUtilization: 50,
    upcomingPayments: [
      { id: "PAY-001", dueDate: "Apr 30, 2025", amount: 2340.75, description: "Credit payment for TRX-003" },
      { id: "PAY-002", dueDate: "May 15, 2025", amount: 1875.0, description: "Credit payment for TRX-005" },
    ],
    paymentHistory: [
      { 
        id: "PMT-001", 
        date: "Mar 30, 2025", 
        amount: 1500.0, 
        method: "Cash", 
        status: "Completed",
        description: "Payment for TRX-001"
      },
      { 
        id: "PMT-002", 
        date: "Mar 15, 2025", 
        amount: 2000.0, 
        method: "Bank Transfer", 
        status: "Completed",
        description: "Payment for TRX-002"
      },
      { 
        id: "PMT-003", 
        date: "Feb 28, 2025", 
        amount: 1200.0, 
        method: "Cash", 
        status: "Completed",
        description: "Payment for TRX-003"
      },
    ],
  }

  // Function to make a payment
  const makePayment = (payment = null) => {
    if (payment) {
      setSelectedPayment(payment)
      setPaymentAmount(payment)
    } else {
      setSelectedPayment(null)
      setPaymentAmount("")
    }
    setShowPaymentModal(true)
    setProcessingPayment(false)
    setPaymentSuccess(false)
  }

  // Function to process payment
  const processPayment = () => {
    setProcessingPayment(true)
    // Simulate payment processing
    setTimeout(() => {
      setProcessingPayment(false)
      setPaymentSuccess(true)
    }, 2000)
  }

  // Function to request credit increase
  const requestCreditIncrease = () => {
    setShowCreditModal(true)
  }

  // Function to process credit increase request
  const processCreditRequest = () => {
    // Simulate processing
    setTimeout(() => {
      setShowCreditModal(false)
      // In a real app, we would update the credit limit
    }, 1000)
  }

  // Function to view payment receipt
  const viewPaymentReceipt = (payment: Payment) => {
    setSelectedPaymentReceipt(payment)
    setShowReceiptModal(true)
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar userType="member" userName={memberData.name} />

      <main className="pt-16 pb-20">
        <div className="container mx-auto px-4 py-8">
          {/* Credit Status Header */}
          <div className="flex flex-col md:flex-row gap-4 items-start md:items-center justify-between mb-8">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Credit Status</h1>
              <p className="text-gray-600">Manage your credit with Pandol Cooperative</p>
            </div>

            <div className="flex flex-col sm:flex-row gap-3">
              <Button
                className="bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600"
                onClick={() => makePayment()}
              >
                Make a Payment
              </Button>
            </div>
          </div>

          {/* Credit Summary Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            <Card className="border-none shadow-sm">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-500">Available Credit</p>
                    <p className="text-2xl font-bold text-gray-900">₱{memberData.availableCredit.toFixed(2)}</p>
                  </div>
                  <div className="h-10 w-10 rounded-full bg-green-100 flex items-center justify-center">
                    <Wallet className="h-5 w-5 text-green-600" />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="border-none shadow-sm">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-500">Current Credit Used</p>
                    <p className="text-2xl font-bold text-gray-900">₱{memberData.currentCredit.toFixed(2)}</p>
                  </div>
                  <div className="h-10 w-10 rounded-full bg-amber-100 flex items-center justify-center">
                    <CreditCard className="h-5 w-5 text-amber-600" />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="border-none shadow-sm">
              <CardContent className="p-4">
                <div className="flex items-center justify-between mb-2">
                  <div>
                    <p className="text-sm text-gray-500">Credit Utilization</p>
                    <p className="text-2xl font-bold text-gray-900">{memberData.creditUtilization}%</p>
                  </div>
                  <div className="h-10 w-10 rounded-full bg-blue-100 flex items-center justify-center">
                    <BarChart4 className="h-5 w-5 text-blue-600" />
                  </div>
                </div>
                <Progress value={memberData.creditUtilization} className="h-2" />
              </CardContent>
            </Card>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3 }}
            >
              <Card>
                <CardHeader>
                  <CardTitle>Credit Status</CardTitle>
                  <CardDescription>Your current credit standing with Pandol Cooperative</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-6">
                    <div>
                      <p className="text-sm text-gray-500 mb-1">Credit Limit</p>
                      <p className="text-2xl font-bold text-gray-900">₱{memberData.creditLimit.toFixed(2)}</p>
                    </div>

                    <div>
                      <div className="flex justify-between items-center mb-1">
                        <p className="text-sm text-gray-500">Credit Utilization</p>
                        <p className="text-sm font-medium">{memberData.creditUtilization}%</p>
                      </div>
                      <Progress value={memberData.creditUtilization} className="h-2" />
                      <div className="flex justify-between text-xs text-gray-500 mt-1">
                        <span>0%</span>
                        <span>50%</span>
                        <span>100%</span>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div className="bg-green-50 rounded-lg p-4">
                        <p className="text-sm text-gray-600 mb-1">Available Credit</p>
                        <p className="text-xl font-bold text-green-600">₱{memberData.availableCredit.toFixed(2)}</p>
                      </div>

                      <div className="bg-amber-50 rounded-lg p-4">
                        <p className="text-sm text-gray-600 mb-1">Current Credit Used</p>
                        <p className="text-xl font-bold text-amber-600">₱{memberData.currentCredit.toFixed(2)}</p>
                      </div>
                    </div>

                    <Button
                      className="w-full bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600"
                      onClick={requestCreditIncrease}
                    >
                      Request Credit Increase
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: 0.1 }}
            >
              <Card>
                <CardHeader>
                  <CardTitle>Payment Schedule</CardTitle>
                  <CardDescription>Upcoming credit payments</CardDescription>
                </CardHeader>
                <CardContent>
                  {memberData.upcomingPayments.length > 0 ? (
                    <div className="space-y-4">
                      {memberData.upcomingPayments.map((payment, index) => (
                        <div key={index} className="flex items-center justify-between p-4 border rounded-lg">
                          <div>
                            <h4 className="font-medium text-gray-900">{payment.description}</h4>
                            <div className="flex items-center gap-2 mt-1">
                              <Calendar className="h-4 w-4 text-gray-500" />
                              <p className="text-sm text-gray-600">Due: {payment.dueDate}</p>
                            </div>
                          </div>
                          <div className="text-right">
                            <p className="font-bold text-gray-900">₱{payment.amount.toFixed(2)}</p>
                            <Button
                              size="sm"
                              className="mt-2 h-8 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600"
                              onClick={() => makePayment(payment as any)}
                            >
                              Pay Now
                            </Button>
                          </div>
                        </div>
                      ))}

                      <div className="p-4 bg-blue-50 rounded-lg">
                        <div className="flex items-start gap-3">
                          <AlertCircle className="h-5 w-5 text-blue-600 flex-shrink-0 mt-0.5" />
                          <div>
                            <h4 className="font-medium text-gray-900">Payment Reminder</h4>
                            <p className="text-sm text-gray-600">
                              Making timely payments helps maintain your good credit standing with the cooperative.
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="text-center py-8">
                      <CheckCircle2 className="h-12 w-12 text-green-500 mx-auto mb-3" />
                      <p className="text-gray-600">No upcoming payments</p>
                      <p className="text-sm text-gray-500">You're all caught up!</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </motion.div>
          </div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: 0.2 }}
            className="mt-6"
          >
            <Card>
              <CardHeader>
                <CardTitle>Payment History</CardTitle>
                <CardDescription>Record of your previous payments</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b">
                        <th className="text-left py-3 px-4 font-medium text-gray-600">Payment ID</th>
                        <th className="text-left py-3 px-4 font-medium text-gray-600">Date</th>
                        <th className="text-left py-3 px-4 font-medium text-gray-600">Description</th>
                        <th className="text-left py-3 px-4 font-medium text-gray-600">Amount</th>
                        <th className="text-left py-3 px-4 font-medium text-gray-600">Method</th>
                        <th className="text-left py-3 px-4 font-medium text-gray-600">Status</th>
                        <th className="text-left py-3 px-4 font-medium text-gray-600">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {memberData.paymentHistory.map((payment, index) => (
                        <tr key={index} className="border-b hover:bg-gray-50">
                          <td className="py-3 px-4">{payment.id}</td>
                          <td className="py-3 px-4">{payment.date}</td>
                          <td className="py-3 px-4">{payment.description || "Credit Payment"}</td>
                          <td className="py-3 px-4 font-medium">₱{payment.amount.toFixed(2)}</td>
                          <td className="py-3 px-4">{payment.method}</td>
                          <td className="py-3 px-4">
                            <span className="inline-block px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                              {payment.status}
                            </span>
                          </td>
                          <td className="py-3 px-4">
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-8 text-amber-600"
                              onClick={() => viewPaymentReceipt(payment)}
                            >
                              View Receipt
                            </Button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </div>
      </main>

      {/* Payment Modal */}
      <Dialog open={showPaymentModal} onOpenChange={setShowPaymentModal}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Make a Payment</DialogTitle>
            <DialogDescription>
              {selectedPayment
                ? `Payment for ${selectedPayment.description}`
                : "Make a payment towards your credit balance"}
            </DialogDescription>
          </DialogHeader>

          {!paymentSuccess ? (
            <>
              <div className="space-y-4 mb-6">
                {selectedPayment && (
                  <div>
                    <p className="text-sm text-gray-500">Payment For</p>
                    <p className="font-medium">{selectedPayment.description}</p>
                  </div>
                )}

                <div>
                  <label className="block text-sm font-medium mb-1">Amount (₱)</label>
                  <input
                    type="number"
                    className="w-full p-2 border rounded-md"
                    value={paymentAmount}
                    onChange={(e) => setPaymentAmount(e.target.value)}
                    min="1"
                    step="0.01"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-1">Payment Method</label>
                  <div className="grid grid-cols-3 gap-2">
                    <Button
                      variant={paymentMethod === "cash" ? "default" : "outline"}
                      size="sm"
                      onClick={() => setPaymentMethod("cash")}
                    >
                      Cash
                    </Button>
                    <Button
                      variant={paymentMethod === "bank" ? "default" : "outline"}
                      size="sm"
                      onClick={() => setPaymentMethod("bank")}
                    >
                      Bank Transfer
                    </Button>
                    <Button
                      variant={paymentMethod === "gcash" ? "default" : "outline"}
                      size="sm"
                      onClick={() => setPaymentMethod("gcash")}
                    >
                      GCash
                    </Button>
                  </div>
                </div>

                {paymentMethod === "bank" && (
                  <div className="p-3 bg-blue-50 rounded-md">
                    <p className="text-sm">Bank Transfer Details:</p>
                    <p className="text-sm">Bank: Sample Bank</p>
                    <p className="text-sm">Account: 1234-5678-9012</p>
                    <p className="text-sm">Name: Pandol Cooperative</p>
                  </div>
                )}

                {paymentMethod === "gcash" && (
                  <div className="p-3 bg-blue-50 rounded-md">
                    <p className="text-sm">GCash Number: 0917-123-4567</p>
                    <p className="text-sm">Name: Pandol Cooperative</p>
                  </div>
                )}
              </div>

              <DialogFooter className="flex flex-col sm:flex-row gap-2">
                <Button variant="outline" onClick={() => setShowPaymentModal(false)}>
                  Cancel
                </Button>
                <Button
                  onClick={processPayment}
                  disabled={!paymentAmount || processingPayment}
                  className="bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600"
                >
                  {processingPayment ? "Processing..." : "Make Payment"}
                </Button>
              </DialogFooter>

              {processingPayment && (
                <div className="mt-4">
                  <p className="text-sm text-gray-500 mb-2">Processing payment...</p>
                  <Progress value={45} className="h-2" />
                </div>
              )}
            </>
          ) : (
            <div className="text-center py-6">
              <div className="h-16 w-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <CheckCircle2 className="h-8 w-8 text-green-600" />
              </div>
              <h3 className="text-lg font-medium mb-2">Payment Successful!</h3>
              <p className="text-gray-500 mb-6">
                Your payment of ₱{Number.parseFloat(paymentAmount).toFixed(2)} has been processed successfully.
              </p>
              <div className="flex justify-center">
                <Button
                  onClick={() => setShowPaymentModal(false)}
                  className="bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600"
                >
                  Close
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Credit Increase Modal */}
      <Dialog open={showCreditModal} onOpenChange={setShowCreditModal}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Request Credit Increase</DialogTitle>
            <DialogDescription>Request an increase to your credit limit</DialogDescription>
          </DialogHeader>

          <div className="space-y-4 mb-6">
            <div>
              <p className="text-sm text-gray-500">Current Credit Limit</p>
              <p className="font-medium">₱{memberData.creditLimit.toFixed(2)}</p>
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">Requested Increase Amount (₱)</label>
              <input
                type="number"
                className="w-full p-2 border rounded-md"
                value={creditIncreaseAmount}
                onChange={(e) => setCreditIncreaseAmount(Number.parseFloat(e.target.value))}
                min="1000"
                step="1000"
              />
            </div>

            <div>
              <p className="text-sm text-gray-500">New Credit Limit (if approved)</p>
              <p className="font-medium">₱{(memberData.creditLimit + creditIncreaseAmount).toFixed(2)}</p>
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">Reason for Increase</label>
              <textarea
                className="w-full p-2 border rounded-md"
                rows={3}
                placeholder="Please provide a reason for your credit increase request"
              ></textarea>
            </div>

            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                Credit increase requests are subject to approval  
                </AlertDescription>
              <AlertDescription>
                Credit increase requests are subject to approval by the cooperative management.
              </AlertDescription>
            </Alert>
          </div>

          <DialogFooter className="flex flex-col sm:flex-row gap-2">
            <Button variant="outline" onClick={() => setShowCreditModal(false)}>
              Cancel
            </Button>
            <Button
              onClick={processCreditRequest}
              className="bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600"
            >
              Submit Request
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Payment Receipt Modal */}
      <Dialog open={showReceiptModal} onOpenChange={setShowReceiptModal}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Payment Receipt</DialogTitle>
            <DialogDescription>Payment details and receipt</DialogDescription>
          </DialogHeader>

          {selectedPaymentReceipt && (
            <div className="space-y-4">
              <div className="text-center border-b border-dashed border-gray-200 pb-4">
                <h3 className="font-bold text-xl">Pandol Cooperative</h3>
                <p className="text-gray-600 text-sm">Pandol, Corella, Bohol</p>
                <p className="text-gray-600 text-sm">Tel: +63 (38) 412-5678</p>
              </div>

              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Receipt ID:</span>
                <span className="font-medium">{selectedPaymentReceipt.id}</span>
              </div>

              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Date:</span>
                <span className="font-medium">{selectedPaymentReceipt.date}</span>
              </div>

              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Member:</span>
                <span className="font-medium">
                  {memberData.name} ({memberData.memberID})
                </span>
              </div>

              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Description:</span>
                <span className="font-medium">
                  {selectedPaymentReceipt.description || "Credit Payment"}
                </span>
              </div>

              <div className="border-t border-dashed border-gray-200 pt-4 space-y-2">
                <div className="flex justify-between font-bold">
                  <span>Amount Paid:</span>
                  <span className="text-amber-600">₱{selectedPaymentReceipt.amount.toFixed(2)}</span>
                </div>

                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Payment Method:</span>
                  <span>{selectedPaymentReceipt.method}</span>
                </div>

                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Status:</span>
                  <span className="text-green-600">{selectedPaymentReceipt.status}</span>
                </div>
              </div>

              <div className="text-center border-t border-dashed border-gray-200 pt-4">
                <p className="font-medium">Thank you for your payment!</p>
                <p className="text-gray-600 text-sm">This receipt serves as proof of your payment</p>
              </div>
            </div>
          )}

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowReceiptModal(false)}
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
