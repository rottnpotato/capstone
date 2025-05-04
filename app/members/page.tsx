"use client"

import { SetStateAction, useState, useEffect } from "react"
import { motion } from "framer-motion"
import {
  ShoppingBag,
  CreditCard,
  Calendar,
  ChevronRight,
  AlertCircle,
  CheckCircle2,
  BarChart4,
  Wallet,
  X,
  Receipt,
} from "lucide-react"
import { Navbar } from "@/components/ui/navbar"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { useAuth } from "@/hooks/useAuth"
import { GetCurrentMemberData, MemberData } from "./actions"

// Define TypeScript interfaces for our data
interface ItemDetail {
  name: string;
  quantity: number;
  price: number;
}

interface Purchase {
  id: string;
  date: string;
  items: number;
  total: number;
  status: string;
  itemDetails: ItemDetail[];
}

interface Payment {
  id: string;
  dueDate?: string;
  date?: string;
  amount: number;
  description?: string;
  method?: string;
  status?: string;
}

interface RecentItem {
  name: string;
  quantity: number;
  price: number;
  date: string;
}

export default function MemberDashboard() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState("overview")
  const [showReceiptModal, setShowReceiptModal] = useState(false)
  const [showPaymentModal, setShowPaymentModal] = useState(false)
  const [showCreditModal, setShowCreditModal] = useState(false)
  const [selectedPurchase, setSelectedPurchase] = useState<Purchase | null>(null)
  const [selectedPayment, setSelectedPayment] = useState<Payment | null>(null)
  const [paymentAmount, setPaymentAmount] = useState("")
  const [paymentMethod, setPaymentMethod] = useState("cash")
  const [processingPayment, setProcessingPayment] = useState(false)
  const [paymentSuccess, setPaymentSuccess] = useState(false)
  const [creditIncreaseAmount, setCreditIncreaseAmount] = useState(1000)
  const [memberData, setMemberData] = useState<MemberData | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Fetch member data from the database
  useEffect(() => {
    async function fetchMemberData() {
      try {
        setIsLoading(true);
        const data = await GetCurrentMemberData();
        if (data) {
          setMemberData(data);
        } else {
          setError("Could not retrieve member data. Please try again.");
        }
      } catch (err) {
        console.error("Error fetching member data:", err);
        setError("Failed to load member data. Please try again.");
      } finally {
        setIsLoading(false);
      }
    }

    fetchMemberData();
  }, []);

  // Function to view receipt
  const viewReceipt = (purchase: Purchase) => {
    setSelectedPurchase(purchase)
    setShowReceiptModal(true)
  }

  // Function to make a payment
  const makePayment = (payment: Payment | null = null) => {
    if (payment) {
      setSelectedPayment(payment)
      setPaymentAmount(payment.amount.toString())
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

  // Function to close modals
  const closeModal = () => {
    setShowReceiptModal(false)
    setShowPaymentModal(false)
    setShowCreditModal(false)
    setSelectedPurchase(null)
    setSelectedPayment(null)
    setProcessingPayment(false)
    setPaymentSuccess(false)
  }

  // If loading, show loading spinner
  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-amber-500 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading member data...</p>
        </div>
      </div>
    );
  }

  // If error, show error message
  if (error || !memberData) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center max-w-md mx-auto p-6 bg-white rounded-lg shadow-md">
          <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
          <h2 className="text-xl font-bold mb-2">Error Loading Data</h2>
          <p className="text-gray-600 mb-4">{error || "Unable to load member data. Please try again later."}</p>
          <Button 
            onClick={() => window.location.reload()}
            className="bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600"
          >
            Retry
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar userType="member" userName={memberData.name} />

      <main className="pt-16 pb-20">
        <div className="container mx-auto px-4 py-8">
          {/* Member Header */}
          <div className="mb-8">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3 }}
              className="bg-white rounded-xl shadow-sm p-6 border border-gray-100"
            >
              <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div className="flex items-center gap-4">
                  <div className="h-16 w-16 rounded-full bg-gradient-to-r from-amber-500 to-orange-500 flex items-center justify-center text-white text-xl font-bold">
                    {memberData.name
                      .split(" ")
                      .map((n) => n[0])
                      .join("")}
                  </div>
                  <div>
                    <h1 className="text-2xl font-bold text-gray-900">{memberData.name}</h1>
                    <div className="flex items-center gap-2 text-gray-600">
                      <span>Member ID: {memberData.memberID}</span>
                      <span>•</span>
                      <span>Joined: {memberData.joinDate}</span>
                    </div>
                  </div>
                </div>
                <Button
                  className="bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600"
                  onClick={() => makePayment()}
                >
                  Make a Payment
                </Button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-8">
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
            </motion.div>
          </div>

          {/* Main Content */}
          <Tabs defaultValue="overview" onValueChange={setActiveTab}>
            <TabsList className="grid grid-cols-3 mb-8">
              <TabsTrigger value="overview" onClick={() => setActiveTab("overview")}>
                Overview
              </TabsTrigger>
              <TabsTrigger
                value="purchases"
                onClick={() => {
                  setActiveTab("purchases")
                  window.location.href = "/members/purchases"
                }}
              >
                Purchase History
              </TabsTrigger>
              <TabsTrigger
                value="credit"
                onClick={() => {
                  setActiveTab("credit")
                  window.location.href = "/members/credit"
                }}
              >
                Credit Management
              </TabsTrigger>
            </TabsList>

            <TabsContent value="overview" className="space-y-6">
              {/* Recent Purchases */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3, delay: 0.1 }}
              >
                <Card>
                  <CardHeader className="pb-2">
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-lg font-medium">Recent Purchases</CardTitle>
                      <Button
                        variant="ghost"
                        className="text-amber-600 h-8 px-2"
                        onClick={() => (window.location.href = "/members/purchases")}
                      >
                        View All <ChevronRight className="h-4 w-4 ml-1" />
                      </Button>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {memberData.purchaseHistory.slice(0, 3).map((purchase, index) => (
                        <div key={index} className="flex items-center justify-between p-3 hover:bg-gray-50 rounded-lg">
                          <div className="flex items-center gap-3">
                            <div className="h-10 w-10 rounded-full bg-amber-100 flex items-center justify-center flex-shrink-0">
                              <ShoppingBag className="h-5 w-5 text-amber-600" />
                            </div>
                            <div>
                              <h4 className="font-medium text-gray-900">{purchase.id}</h4>
                              <p className="text-sm text-gray-600">
                                {purchase.date} • {purchase.items} items
                              </p>
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            <div className="text-right">
                              <p className="font-medium text-gray-900">₱{purchase.total.toFixed(2)}</p>
                              <span
                                className={`inline-block px-2 py-0.5 rounded-full text-xs font-medium ${
                                  purchase.status === "Completed"
                                    ? "bg-green-100 text-green-800"
                                    : "bg-amber-100 text-amber-800"
                                }`}
                              >
                                {purchase.status}
                              </span>
                            </div>
                            <Button variant="outline" size="sm" onClick={() => viewReceipt(purchase)}>
                              View Receipt
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </motion.div>

              {/* Upcoming Payments */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3, delay: 0.2 }}
              >
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-lg font-medium">Upcoming Payments</CardTitle>
                  </CardHeader>
                  <CardContent>
                    {memberData.upcomingPayments.length > 0 ? (
                      <div className="space-y-4">
                        {memberData.upcomingPayments.map((payment, index) => (
                          <div key={index} className="flex items-center justify-between p-3 bg-amber-50 rounded-lg">
                            <div className="flex items-center gap-3">
                              <div className="h-10 w-10 rounded-full bg-amber-100 flex items-center justify-center flex-shrink-0">
                                <Calendar className="h-5 w-5 text-amber-600" />
                              </div>
                              <div>
                                <h4 className="font-medium text-gray-900">{payment.description}</h4>
                                <p className="text-sm text-gray-600">Due: {payment.dueDate}</p>
                              </div>
                            </div>
                            <div className="flex items-center gap-2">
                              <div className="text-right">
                                <p className="font-medium text-gray-900">₱{payment.amount.toFixed(2)}</p>
                              </div>
                              <Button
                                size="sm"
                                className="bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600"
                                onClick={() => makePayment(payment)}
                              >
                                Pay Now
                              </Button>
                            </div>
                          </div>
                        ))}
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

              {/* Recently Purchased Items */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3, delay: 0.3 }}
              >
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-lg font-medium">Recently Purchased Items</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {memberData.recentItems.map((item, index) => (
                        <div key={index} className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                          <div className="h-12 w-12 bg-white rounded-md overflow-hidden flex items-center justify-center">
                            <ShoppingBag className="h-6 w-6 text-amber-500" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <h4 className="font-medium text-gray-900 line-clamp-1">{item.name}</h4>
                            <div className="flex items-center justify-between">
                              <p className="text-sm text-gray-600">Qty: {item.quantity}</p>
                              <p className="text-sm font-medium text-amber-600">₱{item.price.toFixed(2)}</p>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            </TabsContent>

            <TabsContent value="purchases" className="space-y-6">
              <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }}>
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
                            <th className="text-left py-3 px-4 font-medium text-gray-600">Status</th>
                            <th className="text-left py-3 px-4 font-medium text-gray-600">Actions</th>
                          </tr>
                        </thead>
                        <tbody>
                          {memberData.purchaseHistory.map((purchase, index) => (
                            <tr key={index} className="border-b hover:bg-gray-50">
                              <td className="py-3 px-4">{purchase.id}</td>
                              <td className="py-3 px-4">{purchase.date}</td>
                              <td className="py-3 px-4">{purchase.items}</td>
                              <td className="py-3 px-4 font-medium">₱{purchase.total.toFixed(2)}</td>
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
                                <div className="flex gap-2">
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    className="h-8 text-amber-600"
                                    onClick={() => viewReceipt(purchase)}
                                  >
                                    View Receipt
                                  </Button>
                                  {purchase.status === "Credit" && (
                                    <Button
                                      size="sm"
                                      className="h-8 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600"
                                      onClick={() =>
                                        makePayment({
                                          amount: purchase.total,
                                          description: `Payment for ${purchase.id}`,
                                          id: `PAY-${purchase.id.split("-")[1]}`,
                                        })}
                                    >
                                      Pay Now
                                    </Button>
                                  )}
                                </div>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
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
                    <CardTitle>Purchase Analytics</CardTitle>
                    <CardDescription>View your spending patterns</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="h-80 flex flex-col items-center justify-center bg-gray-50 rounded-md p-4">
                      <div className="w-full h-full flex items-center justify-center">
                        <BarChart4 className="h-32 w-32 text-amber-500 opacity-20" />
                      </div>
                      <div className="mt-4 text-center">
                        <p className="text-gray-500">Your purchase analytics and spending patterns</p>
                        <Button variant="outline" size="sm" className="mt-2">
                          View Detailed Report
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            </TabsContent>

            <TabsContent value="credit" className="space-y-6">
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
                                  onClick={() => makePayment(payment)}
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
                            <th className="text-left py-3 px-4 font-medium text-gray-600">Amount</th>
                            <th className="text-left py-3 px-4 font-medium text-gray-600">Method</th>
                            <th className="text-left py-3 px-4 font-medium text-gray-600">Status</th>
                          </tr>
                        </thead>
                        <tbody>
                          {memberData.paymentHistory.map((payment, index) => (
                            <tr key={index} className="border-b hover:bg-gray-50">
                              <td className="py-3 px-4">{payment.id}</td>
                              <td className="py-3 px-4">{payment.date}</td>
                              <td className="py-3 px-4 font-medium">₱{payment.amount.toFixed(2)}</td>
                              <td className="py-3 px-4">{payment.method}</td>
                              <td className="py-3 px-4">
                                <span className="inline-block px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                                  {payment.status}
                                </span>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            </TabsContent>
          </Tabs>
        </div>
      </main>

      {/* Receipt Modal */}
      {showReceiptModal && selectedPurchase && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 max-h-screen">
          <div className="bg-white rounded-lg w-full max-w-md p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xl font-bold">Receipt</h3>
              <Button variant="ghost" size="sm" onClick={closeModal} className="h-8 w-8 p-0">
                <X className="h-4 w-4" />
              </Button>
            </div>

            <div className="text-center mb-4 pb-4 border-b">
              <h2 className="text-xl font-bold">Pandol Cooperative</h2>
              <p className="text-sm text-gray-500">123 Main Street, Anytown</p>
              <p className="text-sm text-gray-500">Tel: (123) 456-7890</p>
            </div>

            <div className="grid grid-cols-2 gap-2 mb-4 text-sm">
              <div>
                <p className="text-gray-500">Receipt No:</p>
                <p className="font-medium">{selectedPurchase.id}</p>
              </div>
              <div>
                <p className="text-gray-500">Date:</p>
                <p className="font-medium">{selectedPurchase.date}</p>
              </div>
              <div>
                <p className="text-gray-500">Member:</p>
                <p className="font-medium">{memberData.name}</p>
              </div>
              <div>
                <p className="text-gray-500">Member ID:</p>
                <p className="font-medium">{memberData.memberID}</p>
              </div>
            </div>

            <div className="mb-4">
              <h4 className="font-medium mb-2">Items</h4>
              <div className="border rounded-md overflow-hidden">
                <table className="w-full text-sm">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="text-left py-2 px-3 font-medium">Item</th>
                      <th className="text-center py-2 px-3 font-medium">Qty</th>
                      <th className="text-right py-2 px-3 font-medium">Price</th>
                      <th className="text-right py-2 px-3 font-medium">Total</th>
                    </tr>
                  </thead>
                  <tbody>
                    {selectedPurchase.itemDetails?.map((item, index) => (
                      <tr key={index} className="border-t">
                        <td className="py-2 px-3">{item.name}</td>
                        <td className="py-2 px-3 text-center">{item.quantity}</td>
                        <td className="py-2 px-3 text-right">₱{item.price.toFixed(2)}</td>
                        <td className="py-2 px-3 text-right">₱{(item.quantity * item.price).toFixed(2)}</td>
                      </tr>
                    ))}
                  </tbody>
                  <tfoot className="bg-gray-50">
                    <tr className="border-t">
                      <td colSpan={3} className="py-2 px-3 text-right font-medium">
                        Total
                      </td>
                      <td className="py-2 px-3 text-right font-bold">₱{selectedPurchase.total.toFixed(2)}</td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            </div>

            <div className="flex justify-between items-center mb-4 pb-4 border-b">
              <div>
                <p className="text-sm text-gray-500">Payment Status</p>
                <span
                  className={`inline-block px-2 py-1 rounded-full text-xs font-medium ${
                    selectedPurchase.status === "Completed"
                      ? "bg-green-100 text-green-800"
                      : "bg-amber-100 text-amber-800"
                  }`}
                >
                  {selectedPurchase.status}
                </span>
              </div>
              {selectedPurchase.status === "Credit" && (
                <Button
                  size="sm"
                  onClick={() => {
                    closeModal()
                    makePayment({
                      amount: selectedPurchase.total,
                      description: `Payment for ${selectedPurchase.id}`,
                      id: `PAY-${selectedPurchase.id.split('-')[1]}`,
                    })
                  }}
                  className="bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600"
                >
                  Pay Now
                </Button>
              )}
            </div>

            <div className="text-center text-sm text-gray-500 mb-4">
              <p>Thank you for shopping at Pandol Cooperative!</p>
              <p>This receipt serves as proof of your purchase.</p>
            </div>

            <div className="flex justify-end">
              <Button className="bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600">
                <Receipt className="h-4 w-4 mr-2" /> Print Receipt
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Payment Modal */}
      {showPaymentModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg w-full max-w-md p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xl font-bold">Make a Payment</h3>
              <Button variant="ghost" size="sm" onClick={closeModal} className="h-8 w-8 p-0">
                <X className="h-4 w-4" />
              </Button>
            </div>

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
                      min={1}
                      step={0.01}
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

                <div className="flex justify-end gap-2">
                  <Button variant="outline" onClick={closeModal}>
                    Cancel
                  </Button>
                  <Button
                    onClick={processPayment}
                    disabled={!paymentAmount || processingPayment}
                    className="bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600"
                  >
                    {processingPayment ? "Processing..." : "Make Payment"}
                  </Button>
                </div>

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
                    onClick={closeModal}
                    className="bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600"
                  >
                    Close
                  </Button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Credit Increase Modal */}
      {showCreditModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg w-full max-w-md p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xl font-bold">Request Credit Increase</h3>
              <Button variant="ghost" size="sm" onClick={closeModal} className="h-8 w-8 p-0">
                <X className="h-4 w-4" />
              </Button>
            </div>

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
                  Credit increase requests are subject to approval by the cooperative management.
                </AlertDescription>
              </Alert>
            </div>

            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={closeModal}>
                Cancel
              </Button>
              <Button
                onClick={processCreditRequest}
                className="bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600"
              >
                Submit Request
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
