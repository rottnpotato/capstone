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
  Info,
  User,
  Clock,
  Star,
  TrendingUp,
  Shield,
  ArrowUpRight,
  Gift,
  BadgePercent,
  BadgeCheck,
  ChevronDown,
} from "lucide-react"
import { Navbar } from "@/components/ui/navbar"
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { useAuth } from "@/hooks/useAuth"
import { GetCurrentMemberData, MemberProfileData } from "./actions"
import Image from "next/image"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"

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
  timestamp: Date;
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
  const [selectedPayment, setSelectedPayment] = useState<Payment | null>(null);
  const [creditIncreaseAmount, setCreditIncreaseAmount] = useState(1000)
  const [memberData, setMemberData] = useState<MemberProfileData | null>(null);
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Fetch member data from the database
  useEffect(() => {
    const fetchMemberData = async () => {
      if (user === undefined) {
        // Still loading auth state, do nothing yet.
        return;
      }

      setIsLoading(true);
      if (user) { // User is logged in
        try {
          const data = await GetCurrentMemberData();
          if (data) {
            setMemberData(data);
          } else {
            setError("Could not retrieve member data. Please try again.");
          }
        } catch (e) {
          setError("An error occurred while fetching member data.");
        }
      } else { // User is not logged in (user is null)
        // Redirect to login if session is invalid but we are on a protected page
        window.location.href = '/login';
        return;
      }
      setIsLoading(false);
    }

    fetchMemberData();
  }, [user]);

  // Function to view receipt
  const viewReceipt = (purchase: Purchase) => {
    setSelectedPurchase(purchase)
    setShowReceiptModal(true)
  }

  // Function to make a payment
  const makePayment = (payment: Payment | null = null) => {
    if (payment) {
      setSelectedPayment(payment)
    } else {
      setSelectedPayment(null)
    }
    setShowPaymentModal(true)
  }

  // Function to process payment
  const processPayment = () => {
    // Simulate payment processing
    setTimeout(() => {
      // In a real app, we would update the payment status
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
  }

  // Get time of day for greeting
  const getTimeOfDay = () => {
    const hour = new Date().getHours();
    if (hour < 12) return "morning";
    if (hour < 18) return "afternoon";
    return "evening";
  }

  // Format date for better display
  const formatDate = (dateString: string | Date) => {
    const options: Intl.DateTimeFormatOptions = { 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    };
    return new Date(dateString).toLocaleDateString('en-US', options);
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
            className="bg-gradient-to-r from-amber-500 to-orange-500"
          >
            Retry
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar userType="member" userName={memberData.name} memberData={memberData} />

      <main className="pt-16 pb-20">
        <div className="container mx-auto px-4 py-8">
          {/* Hero Section */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
            className="mb-8 relative overflow-hidden"
          >
            <div className="bg-white rounded-xl p-8 text-amber-600 relative z-10 shadow-lg border border-amber-100">
              <div className="absolute top-0 right-0 w-64 h-64 bg-amber-500 opacity-5 rounded-full -translate-y-1/2 translate-x-1/2 blur-3xl"></div>
              <div className="absolute bottom-0 left-0 w-96 h-96 bg-orange-500 opacity-5 rounded-full translate-y-1/2 -translate-x-1/3 blur-3xl"></div>
              
              <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
                <div>
                  <h1 className="text-3xl font-bold mb-2 bg-gradient-to-r from-amber-500 to-orange-600 bg-clip-text text-transparent">Good {getTimeOfDay()}, {memberData.name}</h1>
                  <p className="text-amber-700">Welcome back to your Pandol Cooperative dashboard</p>
                  
                  <div className="flex items-center gap-3 mt-4">
                    <Badge className="bg-amber-100 hover:bg-amber-200 text-amber-700 border-amber-200">
                      <BadgeCheck className="h-3.5 w-3.5 mr-1" />
                      Member since {formatDate(memberData.joinDate)}
                    </Badge>
                    <Badge className="bg-amber-100 hover:bg-amber-200 text-amber-700 border-amber-200">
                      <User className="h-3.5 w-3.5 mr-1" />
                      ID: {memberData.memberID}
                    </Badge>
                  </div>
                </div>
              
                <Button 
                  className="bg-gradient-to-r from-amber-500 to-orange-500 text-white hover:from-amber-600 hover:to-orange-600 rounded-lg shadow-sm"
                  onClick={() => window.location.href = '/members/profile'}
                >
                  <User className="mr-2 h-4 w-4" />
                  View Profile
                </Button>
              </div>
            
              {/* Clean, properly positioned card layout */}
              <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-6">
                {/* Credit Overview Card */}
                <Card className="bg-gradient-to-br from-amber-50 to-amber-100 border-none shadow-sm">
                  <CardHeader className="pb-2">
                    <CardTitle className="flex items-center gap-2 text-amber-800">
                      <Wallet className="h-5 w-5 text-amber-600" />
                      Credit Overview
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <p className="text-xs text-amber-700 mb-1">Available Credit</p>
                        <p className="text-xl font-bold text-amber-900">₱{memberData.availableCredit.toFixed(2)}</p>
                      </div>
                      <div>
                        <p className="text-xs text-amber-700 mb-1">Credit Used</p>
                        <p className="text-xl font-bold text-amber-900">₱{memberData.creditBalance.toFixed(2)}</p>
                      </div>
                    </div>
                    
                    <div>
                      <div className="flex justify-between items-center mb-1">
                        <p className="text-xs text-amber-700">Credit Utilization</p>
                        <p className="text-xs font-medium text-amber-900">{memberData.creditUtilization}%</p>
                      </div>
                      <Progress value={memberData.creditUtilization} className="h-1.5 bg-amber-200 [&>div]:bg-gradient-to-r [&>div]:from-amber-500 [&>div]:to-orange-500" />
                    </div>
                  </CardContent>
                </Card>

              </div>
            </div>
          </motion.div>

          {/* Main Content */}
          <Tabs 
            defaultValue="overview" 
            onValueChange={setActiveTab}
            className="space-y-8"
          >
            <div className="bg-white rounded-xl shadow-sm p-1">
              <TabsList className="grid grid-cols-3 bg-gray-100/80 p-1 gap-1">
                <TabsTrigger 
                  value="overview" 
                  onClick={() => setActiveTab("overview")}
                  className="rounded-lg data-[state=active]:bg-gradient-to-r data-[state=active]:from-amber-500 data-[state=active]:to-orange-500 data-[state=active]:text-white py-3"
                >
                  <BarChart4 className="h-4 w-4 mr-2" />
                  Overview
                </TabsTrigger>
                <TabsTrigger
                  value="purchases"
                  onClick={() => {
                    setActiveTab("purchases")
                    // window.location.href = "/members/purchases"
                  }}
                  className="rounded-lg data-[state=active]:bg-gradient-to-r data-[state=active]:from-amber-500 data-[state=active]:to-orange-500 data-[state=active]:text-white py-3"
                >
                  <ShoppingBag className="h-4 w-4 mr-2" />
                  Purchase History
                </TabsTrigger>
                <TabsTrigger
                  value="credit"
                  onClick={() => {
                    setActiveTab("credit")
                    // window.location.href = "/members/credit"
                  }}
                  className="rounded-lg data-[state=active]:bg-gradient-to-r data-[state=active]:from-amber-500 data-[state=active]:to-orange-500 data-[state=active]:text-white py-3"
                >
                  <CreditCard className="h-4 w-4 mr-2" />
                  Credit Management
                </TabsTrigger>
              </TabsList>
            </div>

            <TabsContent value="overview" className="space-y-8">
              {/* Activity Summary */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3, delay: 0.1 }}
                className="grid grid-cols-1 md:grid-cols-2 gap-6"
              >
                {/* Recent Activity */}
                <Card className="border border-gray-200 shadow-sm overflow-hidden hover:shadow-md transition-shadow duration-300">
                  <CardHeader className="pb-2 bg-gray-50/50 border-b">
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-lg font-medium flex items-center gap-2">
                        <Clock className="h-5 w-5 text-amber-500" />
                        Recent Activity
                      </CardTitle>
                      <Button
                        variant="ghost"
                        className="text-amber-600 h-8 px-2"
                        onClick={() => (window.location.href = "/members/purchases")}
                      >
                        View All <ChevronRight className="h-4 w-4 ml-1" />
                      </Button>
                    </div>
                  </CardHeader>
                  <CardContent className="p-0">
                    <div className="divide-y">
                      {memberData.purchaseHistory.slice(0, 3).map((purchase, index) => (
                        <div
                          key={purchase.id}
                          className="flex items-center justify-between p-4 hover:bg-amber-50/40 transition-colors duration-200"
                        >
                          <div className="flex items-center gap-3">
                            <div className="h-10 w-10 rounded-full bg-amber-100 flex items-center justify-center flex-shrink-0">
                              <ShoppingBag className="h-5 w-5 text-amber-600" />
                            </div>
                            <div>
                              <h4 className="font-medium text-gray-900">{purchase.id}</h4>
                              <div className="flex items-center gap-2 text-sm text-gray-600">
                                <Calendar className="h-3 w-3" />
                                <span>{formatDate(purchase.date)}</span>
                                <span>•</span>
                                <span>{purchase.items} items</span>
                              </div>
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            <div className="text-right">
                              <p className="font-medium text-gray-900">₱{purchase.total.toFixed(2)}</p>
                              <span
                                className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${
                                  purchase.status === "Completed"
                                    ? "bg-green-100 text-green-800"
                                    : "bg-amber-100 text-amber-800"
                                }`}
                              >
                                {purchase.status === "Completed" ? (
                                  <CheckCircle2 className="h-3 w-3 mr-1" />
                                ) : (
                                  <Clock className="h-3 w-3 mr-1" />
                                )}
                                {purchase.status}
                              </span>
                            </div>
                            <Button 
                              variant="outline" 
                              size="sm" 
                              onClick={() => viewReceipt(purchase)}
                              className="h-8 bg-white hover:bg-gray-50 border-gray-200 text-gray-700"
                            >
                              <Receipt className="h-3.5 w-3.5 mr-1.5" />
                              Receipt
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>

                {/* Upcoming Payments */}
                <Card className="border border-gray-200 shadow-sm overflow-hidden hover:shadow-md transition-shadow duration-300">
                  <CardHeader className="pb-2 bg-gray-50/50 border-b">
                    <CardTitle className="text-lg font-medium flex items-center gap-2">
                      <Calendar className="h-5 w-5 text-amber-500" />
                      Upcoming Payments
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="p-0">
                    {memberData.upcomingPayments.length > 0 ? (
                      <div className="divide-y">
                        {memberData.upcomingPayments.map((payment, index) => (
                          <div
                            key={payment.id}
                            className="flex items-center justify-between p-4 bg-amber-50/80 hover:bg-amber-50 transition-colors duration-200"
                          >
                            <div className="flex items-center gap-3">
                              <div className="h-10 w-10 rounded-full bg-amber-100 flex items-center justify-center flex-shrink-0">
                                <Calendar className="h-5 w-5 text-amber-600" />
                              </div>
                              <div>
                                <h4 className="font-medium text-gray-900">{payment.description}</h4>
                                <div className="flex items-center gap-2 text-sm text-gray-600">
                                  <Clock className="h-3 w-3" />
                                  <span>Due: {payment.dueDate}</span>
                                </div>
                              </div>
                            </div>
                            <div className="flex items-center gap-2">
                              <div className="text-right">
                                <p className="font-medium text-gray-900">₱{payment.amount.toFixed(2)}</p>
                              </div>
                              <Button
                                size="sm"
                                className="bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 shadow-sm"
                                onClick={() => makePayment(payment)}
                              >
                                Pay at Cooperative
                              </Button>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="text-center py-12">
                        <div className="bg-green-50 rounded-full w-16 h-16 mx-auto mb-4 flex items-center justify-center">
                          <CheckCircle2 className="h-8 w-8 text-green-500" />
                        </div>
                        <h3 className="text-lg font-medium text-gray-900 mb-1">All Caught Up!</h3>
                        <p className="text-gray-500">You have no upcoming payments due</p>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </motion.div>

              {/* Recently Purchased Items & Promotions */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {/* Recently Purchased Items */}
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3, delay: 0.2 }}
                  className="col-span-2"
                >
                  <Card className="border border-gray-200 shadow-sm overflow-hidden hover:shadow-md transition-shadow duration-300 h-full">
                    <CardHeader className="pb-2 bg-gray-50/50 border-b">
                      <CardTitle className="text-lg font-medium flex items-center gap-2">
                        <ShoppingBag className="h-5 w-5 text-amber-500" />
                        Recently Purchased Items
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="p-4">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {memberData.recentItems.map((item, index) => (
                          <div
                            key={`${item.name}-${index}`}
                            className="flex items-start gap-3 p-3 rounded-lg border border-gray-100 bg-white shadow-sm hover:shadow-md transition-all duration-200"
                          >
                            <div className="h-12 w-12 bg-amber-50 rounded-md overflow-hidden flex items-center justify-center flex-shrink-0">
                              <ShoppingBag className="h-6 w-6 text-amber-500" />
                            </div>
                            <div className="flex-1 min-w-0">
                              <h4 className="font-medium text-gray-900 line-clamp-1">{item.name}</h4>
                              <div className="flex items-center justify-between mt-1">
                                <div className="flex items-center gap-2 text-sm text-gray-600">
                                  <span className="px-1.5 py-0.5 bg-gray-100 rounded text-xs">Qty: {item.quantity}</span>
                                  <span className="text-gray-400">•</span>
                                  <span className="text-xs text-gray-500">{item.date}</span>
                                </div>
                                <p className="text-sm font-medium text-amber-600">₱{item.price.toFixed(2)}</p>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>

                {/* Member Benefits */}
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3, delay: 0.3 }}
                >
                  <Card className="border border-gray-200 shadow-sm overflow-hidden hover:shadow-md transition-shadow duration-300 h-full">
                    <CardHeader className="pb-2 bg-gray-50/50 border-b">
                      <CardTitle className="text-lg font-medium flex items-center gap-2">
                        <Star className="h-5 w-5 text-amber-500" />
                        Member Benefits
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="p-4">
                      <div className="space-y-4">
                        <div className="flex gap-3 p-3 rounded-lg bg-amber-50">
                          <div className="h-10 w-10 rounded-full bg-amber-100 flex items-center justify-center flex-shrink-0">
                            <BadgePercent className="h-5 w-5 text-amber-600" />
                          </div>
                          <div>
                            <h4 className="font-medium text-gray-900">Member Discounts</h4>
                            <p className="text-sm text-gray-600">Enjoy special pricing on selected items</p>
                          </div>
                        </div>
                        
                        <div className="flex gap-3 p-3 rounded-lg bg-blue-50">
                          <div className="h-10 w-10 rounded-full bg-blue-100 flex items-center justify-center flex-shrink-0">
                            <Gift className="h-5 w-5 text-blue-600" />
                          </div>
                          <div>
                            <h4 className="font-medium text-gray-900">Annual Dividends</h4>
                            <p className="text-sm text-gray-600">Share in cooperative profits</p>
                          </div>
                        </div>
                        
                        <div className="flex gap-3 p-3 rounded-lg bg-green-50">
                          <div className="h-10 w-10 rounded-full bg-green-100 flex items-center justify-center flex-shrink-0">
                            <Shield className="h-5 w-5 text-green-600" />
                          </div>
                          <div>
                            <h4 className="font-medium text-gray-900">Credit Access</h4>
                            <p className="text-sm text-gray-600">Exclusive credit privileges</p>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              </div>
              
              {/* Purchase Analytics */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3, delay: 0.4 }}
              >
                <Card className="border border-gray-200 shadow-sm overflow-hidden hover:shadow-md transition-shadow duration-300">
                  <CardHeader className="pb-2 bg-gray-50/50 border-b">
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-lg font-medium flex items-center gap-2">
                        <TrendingUp className="h-5 w-5 text-amber-500" />
                        Purchase Analytics
                      </CardTitle>
                      <Button
                        variant="outline"
                        size="sm"
                        className="h-8 text-amber-600 border-amber-200 hover:bg-amber-50"
                      >
                        View Detailed Report
                      </Button>
                    </div>
                    <CardDescription>View your spending patterns</CardDescription>
                  </CardHeader>
                  <CardContent className="p-6">
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
                      <div className="bg-gray-50 rounded-lg p-4 text-center">
                        <p className="text-gray-500 text-sm mb-1">Total Purchases</p>
                        <p className="text-xl font-bold text-amber-600">{memberData.purchaseHistory.length}</p>
                      </div>
                      <div className="bg-gray-50 rounded-lg p-4 text-center">
                        <p className="text-gray-500 text-sm mb-1">Total Spent</p>
                        <p className="text-xl font-bold text-amber-600">
                          ₱{memberData.purchaseHistory.reduce((total: number, purchase: Purchase) => total + purchase.total, 0).toFixed(2)}
                        </p>
                      </div>
                      <div className="bg-gray-50 rounded-lg p-4 text-center">
                        <p className="text-gray-500 text-sm mb-1">Average Purchase</p>
                        <p className="text-xl font-bold text-amber-600">
                          ₱{(memberData.purchaseHistory.reduce((total: number, purchase: Purchase) => total + purchase.total, 0) / 
                             Math.max(1, memberData.purchaseHistory.length)).toFixed(2)}
                        </p>
                      </div>
                      <div className="bg-gray-50 rounded-lg p-4 text-center">
                        <p className="text-gray-500 text-sm mb-1">Credit Purchases</p>
                        <p className="text-xl font-bold text-amber-600">
                          {memberData.purchaseHistory.filter((p: Purchase) => p.status === "Credit").length}
                        </p>
                      </div>
                    </div>
                    <div className="h-64 bg-gradient-to-r from-amber-50 to-orange-50 rounded-lg flex flex-col items-center justify-center">
                      <div className="w-full h-full flex items-center justify-center">
                        <BarChart4 className="h-32 w-32 text-amber-200" />
                      </div>
                      <div className="mt-4 text-center">
                        <p className="text-gray-500">Your purchase analytics and spending patterns</p>
                        <p className="text-sm text-gray-400 mt-1">
                          Detailed analytics will be available with more purchase history
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            </TabsContent>

            <TabsContent value="purchases" className="space-y-6">
              <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }}>
                <Card className="border border-gray-200 shadow-sm overflow-hidden">
                  <CardHeader className="bg-gray-50/50 border-b">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                      <div>
                        <CardTitle className="flex items-center gap-2">
                          <ShoppingBag className="h-5 w-5 text-amber-500" />
                          Purchase History
                        </CardTitle>
                        <CardDescription>View all your transactions with Pandol Cooperative</CardDescription>
                      </div>
                      <Button
                        onClick={() => (window.location.href = "/members/purchases")}
                        className="bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600"
                      >
                        View Full History
                      </Button>
                    </div>
                  </CardHeader>
                  <CardContent className="p-0">
                    <div className="overflow-x-auto">
                      <table className="w-full">
                        <thead>
                          <tr className="bg-gray-50">
                            <th className="text-left py-3 px-4 font-medium text-gray-600">Transaction ID</th>
                            <th className="text-left py-3 px-4 font-medium text-gray-600">Date</th>
                            <th className="text-left py-3 px-4 font-medium text-gray-600">Items</th>
                            <th className="text-left py-3 px-4 font-medium text-gray-600">Total</th>
                            <th className="text-left py-3 px-4 font-medium text-gray-600">Status</th>
                            <th className="text-left py-3 px-4 font-medium text-gray-600">Actions</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y">
                          {memberData.purchaseHistory.map((purchase, index) => (
                            <tr key={purchase.id} className="hover:bg-amber-50/30 transition-colors duration-150">
                              <td className="py-3 px-4 font-medium">{purchase.id}</td> 
                              <td className="py-3 px-4">{formatDate(purchase.date)}</td>
                              <td className="py-3 px-4">{purchase.items}</td>
                              <td className="py-3 px-4 font-medium">₱{purchase.total.toFixed(2)}</td>
                              <td className="py-3 px-4">
                                <span
                                  className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                                    purchase.status === "Completed"
                                      ? "bg-green-100 text-green-800"
                                      : "bg-amber-100 text-amber-800"
                                  }`}
                                >
                                  {purchase.status === "Completed" ? (
                                    <CheckCircle2 className="h-3 w-3 mr-1" />
                                  ) : (
                                    <Clock className="h-3 w-3 mr-1" />
                                  )}
                                  {purchase.status}
                                </span>
                              </td>
                              <td className="py-3 px-4">
                                <div className="flex gap-2">
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    className="h-8 border-gray-200 text-amber-600 hover:bg-amber-50 hover:text-amber-700"
                                    onClick={() => viewReceipt(purchase)}
                                  >
                                    <Receipt className="h-3.5 w-3.5 mr-1.5" />
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
                                      Pay at Cooperative
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
                <Card className="border border-gray-200 shadow-sm overflow-hidden">
                  <CardHeader className="bg-gray-50/50 border-b">
                    <CardTitle className="flex items-center gap-2">
                      <TrendingUp className="h-5 w-5 text-amber-500" />
                      Purchase Analytics
                    </CardTitle>
                    <CardDescription>View your spending patterns</CardDescription>
                  </CardHeader>
                  <CardContent className="p-6">
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
                      <Card className="bg-gradient-to-br from-amber-50 to-amber-100 border-none shadow-sm">
                        <CardContent className="p-4">
                          <div className="flex items-center justify-between mb-2">
                            <div className="h-10 w-10 rounded-full bg-amber-200 flex items-center justify-center">
                              <ShoppingBag className="h-5 w-5 text-amber-700" />
                            </div>
                            <ArrowUpRight className="h-5 w-5 text-amber-500" />
                          </div>
                          <p className="text-sm text-amber-700 mb-1">Total Purchases</p>
                          <p className="text-2xl font-bold text-amber-900">{memberData.purchaseHistory.length}</p>
                        </CardContent>
                      </Card>
                      
                      <Card className="bg-gradient-to-br from-orange-50 to-orange-100 border-none shadow-sm">
                        <CardContent className="p-4">
                          <div className="flex items-center justify-between mb-2">
                            <div className="h-10 w-10 rounded-full bg-orange-200 flex items-center justify-center">
                              <Receipt className="h-5 w-5 text-orange-700" />
                            </div>
                            <ArrowUpRight className="h-5 w-5 text-orange-500" />
                          </div>
                          <p className="text-sm text-orange-700 mb-1">Total Spent</p>
                          <p className="text-2xl font-bold text-orange-900">
                            ₱{memberData.purchaseHistory.reduce((total: number, purchase: Purchase) => total + purchase.total, 0).toFixed(2)}
                          </p>
                        </CardContent>
                      </Card>
                      
                      <Card className="bg-gradient-to-br from-green-50 to-green-100 border-none shadow-sm">
                        <CardContent className="p-4">
                          <div className="flex items-center justify-between mb-2">
                            <div className="h-10 w-10 rounded-full bg-green-200 flex items-center justify-center">
                              <CheckCircle2 className="h-5 w-5 text-green-700" />
                            </div>
                            <ArrowUpRight className="h-5 w-5 text-green-500" />
                          </div>
                          <p className="text-sm text-green-700 mb-1">Completed</p>
                          <p className="text-2xl font-bold text-green-900">
                            {memberData.purchaseHistory.filter((p: Purchase) => p.status === "Completed").length}
                          </p>
                        </CardContent>
                      </Card>
                      
                      <Card className="bg-gradient-to-br from-blue-50 to-blue-100 border-none shadow-sm">
                        <CardContent className="p-4">
                          <div className="flex items-center justify-between mb-2">
                            <div className="h-10 w-10 rounded-full bg-blue-200 flex items-center justify-center">
                              <CreditCard className="h-5 w-5 text-blue-700" />
                            </div>
                            <ArrowUpRight className="h-5 w-5 text-blue-500" />
                          </div>
                          <p className="text-sm text-blue-700 mb-1">Credit Purchases</p>
                          <p className="text-2xl font-bold text-blue-900">
                            {memberData.purchaseHistory.filter((p: Purchase) => p.status === "Credit").length}
                          </p>
                        </CardContent>
                      </Card>
                    </div>
                    
                    <div className="h-64 bg-gradient-to-r from-amber-50 to-orange-50 rounded-lg flex flex-col items-center justify-center">
                      <div className="w-full h-full flex items-center justify-center">
                        <BarChart4 className="h-32 w-32 text-amber-200" />
                      </div>
                      <div className="mt-4 text-center">
                        <p className="text-gray-500">Your purchase analytics and spending patterns</p>
                        <p className="text-sm text-gray-400 mt-1">
                          Detailed analytics will be available with more purchase history
                        </p>
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
                  <Card className="border border-gray-200 shadow-sm overflow-hidden h-full">
                    <CardHeader className="bg-gray-50/50 border-b">
                      <CardTitle className="flex items-center gap-2">
                        <CreditCard className="h-5 w-5 text-amber-500" />
                        Credit Status
                      </CardTitle>
                      <CardDescription>Your current credit standing with Pandol Cooperative</CardDescription>
                    </CardHeader>
                    <CardContent className="p-6">
                      <div className="space-y-6">
                        <div className="bg-white rounded-xl p-6 text-amber-700 shadow-md border border-amber-100">
                          <p className="text-amber-600 mb-1">Credit Limit</p>
                          <div className="flex items-end justify-between">
                            <p className="text-3xl font-bold bg-gradient-to-r from-amber-500 to-orange-600 bg-clip-text text-transparent">₱{memberData.creditLimit.toFixed(2)}</p>
                            <Shield className="h-6 w-6 text-amber-500" />
                          </div>
                          
                          <div className="mt-6">
                          <div className="flex justify-between items-center mb-1">
                              <p className="text-amber-600">Credit Utilization</p>
                              <p className="text-amber-600 font-medium">{memberData.creditUtilization}%</p>
                          </div>
                            <Progress 
                              value={memberData.creditUtilization} 
                              className="h-2 bg-amber-100 [&>div]:bg-amber-500"
                            />
                          </div>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                          <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-lg p-4 shadow-sm">
                            <div className="flex items-center justify-between mb-2">
                              <div className="h-10 w-10 rounded-full bg-green-200 flex items-center justify-center">
                                <Wallet className="h-5 w-5 text-green-700" />
                              </div>
                              <ArrowUpRight className="h-5 w-5 text-green-500" />
                            </div>
                            <p className="text-sm text-green-700 mb-1">Available Credit</p>
                            <p className="text-xl font-bold text-green-900">₱{memberData.availableCredit.toFixed(2)}</p>
                          </div>

                          <div className="bg-gradient-to-br from-amber-50 to-amber-100 rounded-lg p-4 shadow-sm">
                            <div className="flex items-center justify-between mb-2">
                              <div className="h-10 w-10 rounded-full bg-amber-200 flex items-center justify-center">
                                <CreditCard className="h-5 w-5 text-amber-700" />
                              </div>
                              <ArrowUpRight className="h-5 w-5 text-amber-500" />
                            </div>
                            <p className="text-sm text-amber-700 mb-1">Current Credit Used</p>
                            <p className="text-xl font-bold text-amber-900">₱{memberData.creditBalance.toFixed(2)}</p>
                          </div>
                        </div>

                        <Button
                          className="w-full bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 shadow-sm"
                          onClick={requestCreditIncrease}
                        >
                          <TrendingUp className="h-4 w-4 mr-2" />
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
                  <Card className="border border-gray-200 shadow-sm overflow-hidden h-full">
                    <CardHeader className="bg-gray-50/50 border-b">
                      <CardTitle className="flex items-center gap-2">
                        <Calendar className="h-5 w-5 text-amber-500" />
                        Payment Schedule
                      </CardTitle>
                      <CardDescription>Upcoming credit payments</CardDescription>
                    </CardHeader>
                    <CardContent className="p-6">
                      {memberData.upcomingPayments.length > 0 ? (
                        <div className="space-y-4">
                          {memberData.upcomingPayments.map((payment, index) => (
                            <div key={payment.id} className="flex items-center justify-between p-4 border border-amber-100 bg-amber-50/50 rounded-lg shadow-sm">
                              <div className="flex gap-3">
                                <div className="h-12 w-12 rounded-full bg-amber-100 flex items-center justify-center flex-shrink-0">
                                  <Calendar className="h-5 w-5 text-amber-600" />
                                </div>
                                <div>
                                  <h4 className="font-medium text-gray-900">{payment.description}</h4>
                                  <div className="flex items-center gap-2 mt-1 text-sm">
                                    <Clock className="h-4 w-4 text-amber-500" />
                                    <p className="text-gray-600">Due: {payment.dueDate}</p>
                                  </div>
                                </div>
                              </div>
                              <div className="text-right">
                                <p className="font-bold text-gray-900 text-lg">₱{payment.amount.toFixed(2)}</p>
                                <Button
                                  size="sm"
                                  className="mt-2 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 shadow-sm"
                                  onClick={() => makePayment(payment)}
                                >
                                  Pay at Cooperative
                                </Button>
                              </div>
                            </div>
                          ))}

                          <div className="p-4 bg-blue-50 rounded-lg border border-blue-100 shadow-sm">
                            <div className="flex items-start gap-3">
                              <div className="h-10 w-10 rounded-full bg-blue-100 flex items-center justify-center flex-shrink-0">
                                <AlertCircle className="h-5 w-5 text-blue-600" />
                              </div>
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
                        <div className="text-center py-12">
                          <div className="bg-green-50 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-4 shadow-sm">
                            <CheckCircle2 className="h-10 w-10 text-green-500" />
                          </div>
                          <h3 className="text-xl font-medium text-gray-900 mb-2">All Caught Up!</h3>
                          <p className="text-gray-500 max-w-sm mx-auto">
                            You have no upcoming payments due. Your credit account is in good standing.
                          </p>
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
                <Card className="border border-gray-200 shadow-sm overflow-hidden">
                  <CardHeader className="bg-gray-50/50 border-b">
                    <CardTitle className="flex items-center gap-2">
                      <Receipt className="h-5 w-5 text-amber-500" />
                      Payment History
                    </CardTitle>
                    <CardDescription>Record of your previous payments</CardDescription>
                  </CardHeader>
                  <CardContent className="p-0">
                    <div className="overflow-x-auto">
                      <table className="w-full">
                        <thead>
                          <tr className="bg-gray-50">
                            <th className="text-left py-3 px-4 font-medium text-gray-600">Payment ID</th>
                            <th className="text-left py-3 px-4 font-medium text-gray-600">Date</th>
                            <th className="text-left py-3 px-4 font-medium text-gray-600">Amount</th>
                            <th className="text-left py-3 px-4 font-medium text-gray-600">Method</th>
                            <th className="text-left py-3 px-4 font-medium text-gray-600">Status</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y">
                          {memberData.paymentHistory.map((payment, index) => (
                            <tr key={payment.id} className="hover:bg-amber-50/30 transition-colors duration-150">
                              <td className="py-3 px-4 font-medium">{payment.id}</td>
                              <td className="py-3 px-4">{payment.date}</td>
                              <td className="py-3 px-4 font-medium">₱{payment.amount.toFixed(2)}</td>
                              <td className="py-3 px-4">{payment.method}</td>
                              <td className="py-3 px-4">
                                <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                                  <CheckCircle2 className="h-3 w-3 mr-1" />
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
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4"
        >
          <motion.div 
            initial={{ scale: 0.9, y: 20 }}
            animate={{ scale: 1, y: 0 }}
            exit={{ scale: 0.9, y: 20 }}
            className="bg-white rounded-xl w-full max-w-md shadow-2xl overflow-hidden"
          >
            <div className="bg-gradient-to-r from-amber-500 to-orange-500 px-6 py-4">
              <div className="flex items-center justify-between">
                <h3 className="text-xl font-bold text-white">Purchase Receipt</h3>
                <Button variant="ghost" size="sm" onClick={closeModal} className="h-8 w-8 p-0 text-white hover:bg-white/20">
                  <X className="h-4 w-4" />
                </Button>
              </div>
            </div>

            <div className="p-6">
              <div className="text-center mb-6 pb-6 border-b">
                <Image 
                  src="/pandol-logo.png" 
                  alt="Pandol Cooperative Logo" 
                  width={60} 
                  height={60} 
                  className="rounded-full mx-auto mb-3"
                />
                <h2 className="text-xl font-bold text-gray-900">Pandol Cooperative</h2>
                <p className="text-sm text-gray-500">123 Main Street, Anytown</p>
                <p className="text-sm text-gray-500">Tel: (123) 456-7890</p>
              </div>

              <div className="grid grid-cols-2 gap-4 mb-6 text-sm">
                <div className="bg-gray-50 p-3 rounded-md">
                  <p className="text-gray-500 text-xs">Receipt No:</p>
                  <p className="font-medium text-gray-900">{selectedPurchase.id}</p>
                </div>
                <div className="bg-gray-50 p-3 rounded-md">
                  <p className="text-gray-500 text-xs">Date:</p>
                  <p className="font-medium text-gray-900">{formatDate(selectedPurchase.date)}</p>
                </div>
                <div className="bg-gray-50 p-3 rounded-md">
                  <p className="text-gray-500 text-xs">Member:</p>
                  <p className="font-medium text-gray-900">{memberData.name}</p>
                </div>
                <div className="bg-gray-50 p-3 rounded-md">
                  <p className="text-gray-500 text-xs">Member ID:</p>
                  <p className="font-medium text-gray-900">{memberData.memberID}</p>
                </div>
              </div>

              <div className="mb-6">
                <h4 className="font-medium mb-3 flex items-center gap-2">
                  <ShoppingBag className="h-4 w-4 text-amber-500" />
                  Items Purchased
                </h4>
                <div className="border rounded-lg overflow-hidden shadow-sm">
                  <table className="w-full text-sm">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="text-left py-2 px-3 font-medium text-gray-600">Item</th>
                        <th className="text-center py-2 px-3 font-medium text-gray-600">Qty</th>
                        <th className="text-right py-2 px-3 font-medium text-gray-600">Price</th>
                        <th className="text-right py-2 px-3 font-medium text-gray-600">Total</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y">
                      {selectedPurchase.itemDetails?.map((item, index) => (
                        <tr key={`${item.name}-${index}`}>
                          <td className="py-2 px-3">{item.name}</td>
                          <td className="py-2 px-3 text-center">{item.quantity}</td>
                          <td className="py-2 px-3 text-right">₱{item.price.toFixed(2)}</td>
                          <td className="py-2 px-3 text-right">₱{(item.quantity * item.price).toFixed(2)}</td>
                        </tr>
                      ))}
                    </tbody>
                    <tfoot className="bg-gray-50">
                      <tr className="border-t">
                        <td colSpan={3} className="py-2 px-3 text-right font-medium text-gray-700">
                          Total
                        </td>
                        <td className="py-2 px-3 text-right font-bold text-amber-600">₱{selectedPurchase.total.toFixed(2)}</td>
                      </tr>
                    </tfoot>
                  </table>
                </div>
              </div>

              <div className="flex justify-between items-center mb-6 pb-6 border-b">
                <div>
                  <p className="text-sm text-gray-500 mb-1">Payment Status</p>
                  <span
                    className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                      selectedPurchase.status === "Completed"
                        ? "bg-green-100 text-green-800"
                        : "bg-amber-100 text-amber-800"
                    }`}
                  >
                    {selectedPurchase.status === "Completed" ? (
                      <CheckCircle2 className="h-3 w-3 mr-1" />
                    ) : (
                      <Clock className="h-3 w-3 mr-1" />
                    )}
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
                    className="bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 shadow-sm"
                  >
                    Pay at Cooperative
                  </Button>
                )}
              </div>

              <div className="text-center text-sm text-gray-500 mb-6">
                <p>Thank you for shopping at Pandol Cooperative!</p>
                <p>This receipt serves as proof of your purchase.</p>
              </div>

              <div className="flex justify-end">
                <Button className="bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 shadow-sm">
                  <Receipt className="h-4 w-4 mr-2" /> Print Receipt
                </Button>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}

      {/* Payment Modal */}
      {showPaymentModal && (
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4"
        >
          <motion.div 
            initial={{ scale: 0.9, y: 20 }}
            animate={{ scale: 1, y: 0 }}
            exit={{ scale: 0.9, y: 20 }}
            className="bg-white rounded-xl w-full max-w-md shadow-2xl overflow-hidden"
          >
            <div className="bg-gradient-to-r from-amber-500 to-orange-500 px-6 py-4">
              <div className="flex items-center justify-between">
                <h3 className="text-xl font-bold text-white">Payment Information</h3>
                <Button variant="ghost" size="sm" onClick={closeModal} className="h-8 w-8 p-0 text-white hover:bg-white/20">
                  <X className="h-4 w-4" />
                </Button>
              </div>
            </div>

            <div className="p-6">
              <div className="text-center py-6">
                <div className="h-20 w-20 bg-amber-100 rounded-full flex items-center justify-center mx-auto mb-6 shadow-md">
                  <Info className="h-10 w-10 text-amber-600" />
                </div>
                <h3 className="text-xl font-medium mb-4 text-gray-900">Visit the Cooperative</h3>
                <p className="text-gray-600 mb-6 max-w-sm mx-auto">
                  To make a payment on your credit balance, please visit the cooperative office in person. 
                  Online payments are not available at this time.
                </p>
                
                {selectedPayment && (
                  <div className="w-full bg-gray-50 p-5 rounded-lg mb-6 text-left border shadow-sm">
                    <div className="flex justify-between items-center mb-4 pb-4 border-b">
                      <span className="text-gray-500">Payment Details</span>
                      <Badge className="bg-amber-100 text-amber-800 hover:bg-amber-200">
                        <Clock className="h-3.5 w-3.5 mr-1" />
                        Pending
                      </Badge>
                    </div>
                    
                    <div className="space-y-3">
                      <div className="flex justify-between">
                        <span className="text-gray-600">Payment ID</span>
                        <span className="font-medium">{selectedPayment.id}</span>
                      </div>
                      {selectedPayment.dueDate && (
                        <div className="flex justify-between">
                          <span className="text-gray-600">Due Date</span>
                          <span className="font-medium">{selectedPayment.dueDate}</span>
                        </div>
                      )}
                      <div className="flex justify-between">
                        <span className="text-gray-600">Amount</span>
                        <span className="font-bold text-amber-600">₱{selectedPayment.amount.toFixed(2)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Description</span>
                        <span className="font-medium">{selectedPayment.description || "Credit payment"}</span>
                      </div>
                    </div>
                  </div>
                )}
                
                <div className="flex justify-center">
                  <Button
                    onClick={closeModal}
                    className="bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 shadow-sm"
                  >
                    Close
                  </Button>
                </div>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}

      {/* Credit Increase Modal */}
      {showCreditModal && (
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4"
        >
          <motion.div 
            initial={{ scale: 0.9, y: 20 }}
            animate={{ scale: 1, y: 0 }}
            exit={{ scale: 0.9, y: 20 }}
            className="bg-white rounded-xl w-full max-w-md shadow-2xl overflow-hidden"
          >
            <div className="bg-gradient-to-r from-amber-500 to-orange-500 px-6 py-4">
              <div className="flex items-center justify-between">
                <h3 className="text-xl font-bold text-white">Request Credit Increase</h3>
                <Button variant="ghost" size="sm" onClick={closeModal} className="h-8 w-8 p-0 text-white hover:bg-white/20">
                  <X className="h-4 w-4" />
                </Button>
              </div>
            </div>

            <div className="p-6">
              <div className="space-y-6">
                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-gray-50 p-4 rounded-lg border shadow-sm">
                    <p className="text-sm text-gray-500 mb-1">Current Credit Limit</p>
                    <p className="text-xl font-bold text-gray-900">₱{memberData.creditLimit.toFixed(2)}</p>
                  </div>
                  
                  <div className="bg-green-50 p-4 rounded-lg border border-green-100 shadow-sm">
                    <p className="text-sm text-gray-500 mb-1">New Credit Limit</p>
                    <p className="text-xl font-bold text-green-700">₱{(memberData.creditLimit + creditIncreaseAmount).toFixed(2)}</p>
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="block text-sm font-medium mb-1 text-gray-700">Requested Increase Amount (₱)</label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <span className="text-gray-500 sm:text-sm">₱</span>
                    </div>
                    <input
                      title="Credit Increase Amount"
                      type="number"
                      className="w-full pl-7 p-2.5 border rounded-lg focus:ring-amber-500 focus:border-amber-500"
                      value={creditIncreaseAmount}
                      onChange={(e) => setCreditIncreaseAmount(Number.parseFloat(e.target.value))}
                      min="1000"
                      step="1000"
                    />
                    <div className="absolute inset-y-0 right-0 flex items-center">
                      <div className="flex items-center space-x-1 px-2">
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          className="h-6 w-6 p-0 text-gray-400 hover:text-gray-900 hover:bg-gray-100"
                          onClick={() => setCreditIncreaseAmount(prev => Math.max(1000, prev - 1000))}
                        >
                          <ChevronDown className="h-4 w-4" />
                        </Button>
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          className="h-6 w-6 p-0 text-gray-400 hover:text-gray-900 hover:bg-gray-100"
                          onClick={() => setCreditIncreaseAmount(prev => prev + 1000)}
                        >
                          <ChevronRight className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="block text-sm font-medium mb-1 text-gray-700">Reason for Increase</label>
                  <textarea
                    className="w-full p-3 border rounded-lg focus:ring-amber-500 focus:border-amber-500"
                    rows={3}
                    placeholder="Please provide a reason for your credit increase request"
                  ></textarea>
                </div>

                <Alert className="bg-blue-50 text-blue-800 border border-blue-100">
                  <AlertCircle className="h-4 w-4 text-blue-600" />
                  <AlertDescription className="text-blue-700">
                    Credit increase requests are subject to approval by the cooperative management.
                  </AlertDescription>
                </Alert>
              </div>

              <div className="flex justify-end gap-3 mt-6">
                <Button 
                  variant="outline" 
                  onClick={closeModal}
                  className="border-gray-200"
                >
                  Cancel
                </Button>
                <Button
                  onClick={processCreditRequest}
                  className="bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 shadow-sm"
                >
                  <TrendingUp className="h-4 w-4 mr-2" />
                  Submit Request
                </Button>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </div>
  )
}
