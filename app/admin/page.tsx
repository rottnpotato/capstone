"use client"

import { useState, useEffect } from "react"
import { motion } from "framer-motion"
import {
  Users,
  ShoppingCart,
  Package,
  CreditCard,
  ArrowUpRight,
  ArrowDownRight,
  BarChart3,
  PieChart,
  Calendar,
  X,
  CheckCircle2,
  Loader2
} from "lucide-react"
import { Navbar } from "@/components/ui/navbar"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Progress } from "@/components/ui/progress"
import { 
  GetRecentTransactions, 
  GetInventoryAlerts, 
  GetDashboardStats,
  GetRecentMemberActivities,
  GetUpcomingEvents,
  AdminTransaction, 
  InventoryAlert,
  MemberActivity,
  UpcomingEvent,
  DashboardStats
} from "./actions"
import { Alert, AlertDescription } from "@/components/ui/alert"

export default function AdminDashboard() {
  const [timeRange, setTimeRange] = useState("week")
  const [showReportModal, setShowReportModal] = useState(false)
  const [showTransactionModal, setShowTransactionModal] = useState(false)
  const [showInventoryModal, setShowInventoryModal] = useState(false)
  const [showMemberModal, setShowMemberModal] = useState(false)
  const [selectedTransaction, setSelectedTransaction] = useState<AdminTransaction | null>(null)
  const [selectedInventory, setSelectedInventory] = useState<InventoryAlert | null>(null)
  const [selectedMember, setSelectedMember] = useState<MemberActivity | null>(null)
  const [reportType, setReportType] = useState("")
  const [reportFormat, setReportFormat] = useState("pdf")
  const [reportGenerating, setReportGenerating] = useState(false)
  const [reportGenerated, setReportGenerated] = useState(false)
  
  // State for real data
  const [transactions, setTransactions] = useState<AdminTransaction[]>([])
  const [inventoryAlerts, setInventoryAlerts] = useState<InventoryAlert[]>([])
  const [memberActivities, setMemberActivities] = useState<MemberActivity[]>([])
  const [upcomingEvents, setUpcomingEvents] = useState<UpcomingEvent[]>([])
  const [dashboardStats, setDashboardStats] = useState<DashboardStats | null>(null)
  
  // Loading states
  const [isLoadingTransactions, setIsLoadingTransactions] = useState(true)
  const [isLoadingInventory, setIsLoadingInventory] = useState(true)
  const [isLoadingActivities, setIsLoadingActivities] = useState(true)
  const [isLoadingEvents, setIsLoadingEvents] = useState(true)
  const [isLoadingStats, setIsLoadingStats] = useState(true)
  
  // Error states
  const [transactionError, setTransactionError] = useState<string | null>(null)
  const [inventoryError, setInventoryError] = useState<string | null>(null)
  const [activitiesError, setActivitiesError] = useState<string | null>(null)
  const [eventsError, setEventsError] = useState<string | null>(null)
  const [statsError, setStatsError] = useState<string | null>(null)

  // Fetch transactions from database
  useEffect(() => {
    const fetchTransactions = async () => {
      setIsLoadingTransactions(true)
      setTransactionError(null)
      
      try {
        const data = await GetRecentTransactions(5)
        setTransactions(data)
      } catch (err) {
        console.error("Error fetching recent transactions:", err)
        setTransactionError("Failed to load recent transactions. Please try again.")
      } finally {
        setIsLoadingTransactions(false)
      }
    }
    
    fetchTransactions()
  }, [])

  // Fetch inventory alerts from database
  useEffect(() => {
    const fetchInventoryAlerts = async () => {
      setIsLoadingInventory(true)
      setInventoryError(null)
      
      try {
        const data = await GetInventoryAlerts(10, 5)
        setInventoryAlerts(data)
      } catch (err) {
        console.error("Error fetching inventory alerts:", err)
        setInventoryError("Failed to load inventory alerts. Please try again.")
      } finally {
        setIsLoadingInventory(false)
      }
    }
    
    fetchInventoryAlerts()
  }, [])

  // Fetch dashboard stats from database
  useEffect(() => {
    const fetchDashboardStats = async () => {
      setIsLoadingStats(true)
      setStatsError(null)
      
      try {
        const data = await GetDashboardStats(timeRange)
        setDashboardStats(data)
      } catch (err) {
        console.error("Error fetching dashboard stats:", err)
        setStatsError("Failed to load dashboard statistics. Please try again.")
      } finally {
        setIsLoadingStats(false)
      }
    }
    
    fetchDashboardStats()
  }, [timeRange])

  // Fetch member activities from database
  useEffect(() => {
    const fetchMemberActivities = async () => {
      setIsLoadingActivities(true)
      setActivitiesError(null)
      
      try {
        const data = await GetRecentMemberActivities(5)
        setMemberActivities(data)
      } catch (err) {
        console.error("Error fetching member activities:", err)
        setActivitiesError("Failed to load member activities. Please try again.")
      } finally {
        setIsLoadingActivities(false)
      }
    }
    
    fetchMemberActivities()
  }, [])

  // Fetch upcoming events from database
  useEffect(() => {
    const fetchEvents = async () => {
      setIsLoadingEvents(true)
      setEventsError(null)
      
      try {
        const data = await GetUpcomingEvents(4)
        setUpcomingEvents(data)
      } catch (err) {
        console.error("Error fetching upcoming events:", err)
        setEventsError("Failed to load upcoming events. Please try again.")
      } finally {
        setIsLoadingEvents(false)
      }
    }
    
    fetchEvents()
  }, [])

  // Function to generate reports
  const generateReport = (type: string) => {
    setReportType(type)
    setShowReportModal(true)
  }

  // Function to view transaction details
  const viewTransaction = (transaction: AdminTransaction) => {
    setSelectedTransaction(transaction)
    setShowTransactionModal(true)
  }

  // Function to view inventory details
  const viewInventory = (item: InventoryAlert) => {
    setSelectedInventory(item)
    setShowInventoryModal(true)
  }

  // Function to view member details
  const viewMember = (member: MemberActivity) => {
    setSelectedMember(member)
    setShowMemberModal(true)
  }

  // Function to process report generation
  const processReport = () => {
    setReportGenerating(true)
    // Simulate report generation
    setTimeout(() => {
      setReportGenerating(false)
      setReportGenerated(true)
    }, 2000)
  }

  // Function to close modals
  const closeModal = () => {
    setShowReportModal(false)
    setShowTransactionModal(false)
    setShowInventoryModal(false)
    setShowMemberModal(false)
    setSelectedTransaction(null)
    setSelectedInventory(null)
    setSelectedMember(null)
    setReportGenerating(false)
    setReportGenerated(false)
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar userType="admin" userName="Admin User" />

      <main className="pt-16 pb-20">
        <div className="container mx-auto px-4 py-8">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Admin Dashboard</h1>
              <p className="text-gray-600">Welcome back to Pandol Cooperative management system</p>
            </div>

            <div className="flex items-center gap-3">
              <Select defaultValue="week" onValueChange={setTimeRange}>
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="Select time range" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="day">Today</SelectItem>
                  <SelectItem value="week">This Week</SelectItem>
                  <SelectItem value="month">This Month</SelectItem>
                  <SelectItem value="year">This Year</SelectItem>
                </SelectContent>
              </Select>

              <Button
                className="bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600"
                onClick={() => generateReport("sales")}
              >
                Generate Report
              </Button>
            </div>
          </div>

          {/* Stats Overview */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            {isLoadingStats ? (
              // Show skeletons while loading
              Array(4).fill(0).map((_, index) => (
                <Card key={index}>
                  <CardContent className="p-6">
                    <div className="animate-pulse flex justify-between items-start">
                      <div className="w-full">
                        <div className="h-4 bg-gray-200 rounded w-1/3 mb-2"></div>
                        <div className="h-8 bg-gray-200 rounded w-2/3 mb-2"></div>
                        <div className="h-4 bg-gray-200 rounded w-1/2"></div>
                      </div>
                      <div className="h-10 w-10 rounded-full bg-gray-200"></div>
                    </div>
                  </CardContent>
                </Card>
              ))
            ) : statsError ? (
              // Show error alert if there's an error
              <div className="lg:col-span-4">
                <Alert className="bg-red-50 border-red-200 text-red-800">
                  <AlertDescription>{statsError}</AlertDescription>
                </Alert>
              </div>
            ) : dashboardStats ? (
              // Show actual stats data
              [
                {
                  title: "Total Sales",
                  value: dashboardStats.totalSales.value,
                  change: dashboardStats.totalSales.change,
                  trend: dashboardStats.totalSales.trend,
                  icon: <ShoppingCart className="h-5 w-5" />,
                  color: "from-amber-500 to-orange-500",
                },
                {
                  title: "Active Members",
                  value: dashboardStats.activeMembers.value,
                  change: dashboardStats.activeMembers.change,
                  trend: dashboardStats.activeMembers.trend,
                  icon: <Users className="h-5 w-5" />,
                  color: "from-emerald-500 to-teal-500",
                },
                {
                  title: "Total Inventory",
                  value: dashboardStats.totalInventory.value,
                  change: dashboardStats.totalInventory.change,
                  trend: dashboardStats.totalInventory.trend,
                  icon: <Package className="h-5 w-5" />,
                  color: "from-blue-500 to-indigo-500",
                },
                {
                  title: "Credit Outstanding",
                  value: dashboardStats.creditOutstanding.value,
                  change: dashboardStats.creditOutstanding.change,
                  trend: dashboardStats.creditOutstanding.trend,
                  icon: <CreditCard className="h-5 w-5" />,
                  color: "from-purple-500 to-pink-500",
                },
              ].map((stat, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3, delay: index * 0.1 }}
                >
                  <Card>
                    <CardContent className="p-6">
                      <div className="flex justify-between items-start">
                        <div>
                          <p className="text-sm font-medium text-gray-500">{stat.title}</p>
                          <h3 className="text-2xl font-bold mt-1">{stat.value}</h3>
                          <div className="flex items-center mt-1">
                            {stat.trend === "up" ? (
                              <ArrowUpRight className="h-4 w-4 text-emerald-500 mr-1" />
                            ) : (
                              <ArrowDownRight className="h-4 w-4 text-red-500 mr-1" />
                            )}
                            <span
                              className={`text-sm font-medium ${
                                stat.trend === "up" ? "text-emerald-500" : "text-red-500"
                              }`}
                            >
                              {stat.change} from last {timeRange}
                            </span>
                          </div>
                        </div>
                        <div
                          className={`h-10 w-10 rounded-full bg-gradient-to-r ${stat.color} flex items-center justify-center text-white`}
                        >
                          {stat.icon}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              ))
            ) : null}
          </div>

          {/* Charts Section */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: 0.4 }}
            >
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-lg font-medium">Sales Overview</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="h-80 flex flex-col items-center justify-center bg-gray-50 rounded-md p-4">
                    <div className="w-full h-full flex items-center justify-center">
                      <BarChart3 className="h-32 w-32 text-amber-500 opacity-20" />
                    </div>
                    <div className="mt-4 text-center">
                      <p className="text-gray-500">Sales data visualization</p>
                      <Button variant="outline" size="sm" className="mt-2" onClick={() => generateReport("sales")}>
                        View Detailed Report
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: 0.5 }}
            >
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-lg font-medium">Revenue Distribution</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="h-80 flex flex-col items-center justify-center bg-gray-50 rounded-md p-4">
                    <div className="w-full h-full flex items-center justify-center">
                      <PieChart className="h-32 w-32 text-amber-500 opacity-20" />
                    </div>
                    <div className="mt-4 text-center">
                      <p className="text-gray-500">Revenue distribution by category</p>
                      <Button variant="outline" size="sm" className="mt-2" onClick={() => generateReport("revenue")}>
                        View Detailed Report
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          </div>

          {/* Tabbed Content */}
          <Tabs defaultValue="recent-transactions" className="mb-8">
            <TabsList className="grid grid-cols-3 mb-6">
              <TabsTrigger value="recent-transactions">Recent Transactions</TabsTrigger>
              <TabsTrigger value="inventory-alerts">Inventory Alerts</TabsTrigger>
              <TabsTrigger value="member-activity">Member Activity</TabsTrigger>
            </TabsList>

            <TabsContent value="recent-transactions">
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-lg font-medium">Recent Transactions</CardTitle>
                </CardHeader>
                <CardContent>
                  {isLoadingTransactions ? (
                    <div className="space-y-4">
                      {[...Array(5)].map((_, index) => (
                        <div key={index} className="w-full h-12 bg-gray-200 rounded animate-pulse"/>
                      ))}
                    </div>
                  ) : transactionError ? (
                    <Alert className="bg-red-50 border-red-200 text-red-800">
                      <AlertDescription>{transactionError}</AlertDescription>
                    </Alert>
                  ) : transactions.length === 0 ? (
                    <div className="text-center py-8 text-gray-500">
                      No transactions found.
                    </div>
                  ) : (
                    <div className="overflow-x-auto">
                      <table className="w-full">
                        <thead>
                          <tr className="border-b">
                            <th className="text-left py-3 px-4 font-medium text-gray-600">Transaction ID</th>
                            <th className="text-left py-3 px-4 font-medium text-gray-600">Member</th>
                            <th className="text-left py-3 px-4 font-medium text-gray-600">Date</th>
                            <th className="text-left py-3 px-4 font-medium text-gray-600">Amount</th>
                            <th className="text-left py-3 px-4 font-medium text-gray-600">Status</th>
                            <th className="text-left py-3 px-4 font-medium text-gray-600">Actions</th>
                          </tr>
                        </thead>
                        <tbody>
                          {transactions.map((transaction, index) => (
                            <tr key={index} className="border-b hover:bg-gray-50">
                              <td className="py-3 px-4">{transaction.Id}</td>
                              <td className="py-3 px-4">{transaction.Member || "Non-member"}</td>
                              <td className="py-3 px-4">{transaction.Date}</td>
                              <td className="py-3 px-4 font-medium">₱{transaction.Total.toFixed(2)}</td>
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
                                  onClick={() => viewTransaction(transaction)}
                                >
                                  View Details
                                </Button>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="inventory-alerts">
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-lg font-medium">Inventory Alerts</CardTitle>
                </CardHeader>
                <CardContent>
                  {isLoadingInventory ? (
                    <div className="space-y-4">
                      {[...Array(5)].map((_, index) => (
                        <div key={index} className="w-full h-16 bg-gray-200 rounded animate-pulse"/>
                      ))}
                    </div>
                  ) : inventoryError ? (
                    <Alert className="bg-red-50 border-red-200 text-red-800">
                      <AlertDescription>{inventoryError}</AlertDescription>
                    </Alert>
                  ) : inventoryAlerts.length === 0 ? (
                    <div className="text-center py-8 text-gray-500">
                      No inventory alerts found. All products are above threshold levels.
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {inventoryAlerts.map((item, index) => (
                        <div key={index} className="flex items-center justify-between p-4 bg-red-50 rounded-lg">
                          <div>
                            <h4 className="font-medium text-gray-900">{item.Product}</h4>
                            <p className="text-sm text-gray-600">Category: {item.Category}</p>
                          </div>
                          <div className="flex items-center gap-3">
                            <div className="text-right">
                              <p className="text-red-600 font-bold">Stock: {item.Stock}</p>
                              <p className="text-sm text-gray-600">Threshold: {item.Threshold}</p>
                            </div>
                            <Button variant="outline" size="sm" onClick={() => viewInventory(item)}>
                              Manage
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="member-activity">
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-lg font-medium">Member Activity</CardTitle>
                </CardHeader>
                <CardContent>
                  {isLoadingActivities ? (
                    <div className="space-y-4">
                      {[...Array(5)].map((_, index) => (
                        <div key={index} className="w-full h-16 bg-gray-200 rounded animate-pulse"/>
                      ))}
                    </div>
                  ) : activitiesError ? (
                    <Alert className="bg-red-50 border-red-200 text-red-800">
                      <AlertDescription>{activitiesError}</AlertDescription>
                    </Alert>
                  ) : memberActivities.length === 0 ? (
                    <div className="text-center py-8 text-gray-500">
                      No member activities found.
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {memberActivities.map((activity, index) => (
                        <div key={index} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                          <div className="flex items-center gap-3">
                            <div className="h-10 w-10 rounded-full bg-amber-100 flex items-center justify-center">
                              <Users className="h-5 w-5 text-amber-600" />
                            </div>
                            <div>
                              <h4 className="font-medium text-gray-900">{activity.member}</h4>
                              <p className="text-sm text-gray-600">{activity.action}</p>
                            </div>
                          </div>
                          <div className="flex items-center gap-3">
                            <div className="text-right">
                              {activity.amount && <p className="font-medium text-amber-600">{activity.amount}</p>}
                              <p className="text-sm text-gray-500">{activity.time}</p>
                            </div>
                            <Button variant="outline" size="sm" onClick={() => viewMember(activity)}>
                              View Profile
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>

          {/* Calendar and Upcoming Events */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: 0.6 }}
              className="lg:col-span-2"
            >
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-lg font-medium">Calendar</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="h-80 flex flex-col items-center justify-center bg-gray-50 rounded-md p-4">
                    <div className="w-full h-full flex items-center justify-center">
                      <Calendar className="h-32 w-32 text-amber-500 opacity-20" />
                    </div>
                    <div className="mt-4 text-center">
                      <p className="text-gray-500">Calendar and scheduling</p>
                      <Button variant="outline" size="sm" className="mt-2">
                        View Full Calendar
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: 0.7 }}
            >
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-lg font-medium">Upcoming Events</CardTitle>
                </CardHeader>
                <CardContent>
                  {isLoadingEvents ? (
                    <div className="space-y-4">
                      {[...Array(4)].map((_, index) => (
                        <div key={index} className="w-full h-12 bg-gray-200 rounded animate-pulse"/>
                      ))}
                    </div>
                  ) : eventsError ? (
                    <Alert className="bg-red-50 border-red-200 text-red-800">
                      <AlertDescription>{eventsError}</AlertDescription>
                    </Alert>
                  ) : upcomingEvents.length === 0 ? (
                    <div className="text-center py-8 text-gray-500">
                      No upcoming events found.
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {upcomingEvents.map((event, index) => (
                        <div key={index} className="flex items-center gap-3 p-3 hover:bg-gray-50 rounded-lg">
                          <div className="h-10 w-10 rounded-full bg-amber-100 flex items-center justify-center flex-shrink-0">
                            <span className="text-xs font-medium text-amber-800">
                              {event.date.split(",")[0].split(" ")[1]}
                            </span>
                          </div>
                          <div>
                            <h4 className="font-medium text-gray-900">{event.title}</h4>
                            <div className="flex items-center gap-2">
                              <p className="text-sm text-gray-600">{event.date}</p>
                              <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-amber-100 text-amber-800">
                                {event.type}
                              </span>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </motion.div>
          </div>
        </div>
      </main>

      {/* Report Generation Modal */}
      {showReportModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg w-full max-w-md p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xl font-bold">
                Generate {reportType.charAt(0).toUpperCase() + reportType.slice(1)} Report
              </h3>
              <Button variant="ghost" size="sm" onClick={closeModal} className="h-8 w-8 p-0">
                <X className="h-4 w-4" />
              </Button>
            </div>

            {!reportGenerated ? (
              <>
                <div className="space-y-4 mb-6">
                  <div>
                    <label className="block text-sm font-medium mb-1">Time Range</label>
                    <div className="grid grid-cols-4 gap-2">
                      <Button
                        variant={timeRange === "day" ? "default" : "outline"}
                        size="sm"
                        onClick={() => setTimeRange("day")}
                      >
                        Day
                      </Button>
                      <Button
                        variant={timeRange === "week" ? "default" : "outline"}
                        size="sm"
                        onClick={() => setTimeRange("week")}
                      >
                        Week
                      </Button>
                      <Button
                        variant={timeRange === "month" ? "default" : "outline"}
                        size="sm"
                        onClick={() => setTimeRange("month")}
                      >
                        Month
                      </Button>
                      <Button
                        variant={timeRange === "year" ? "default" : "outline"}
                        size="sm"
                        onClick={() => setTimeRange("year")}
                      >
                        Year
                      </Button>
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-1">Format</label>
                    <div className="grid grid-cols-3 gap-2">
                      <Button
                        variant={reportFormat === "pdf" ? "default" : "outline"}
                        size="sm"
                        onClick={() => setReportFormat("pdf")}
                      >
                        PDF
                      </Button>
                      <Button
                        variant={reportFormat === "excel" ? "default" : "outline"}
                        size="sm"
                        onClick={() => setReportFormat("excel")}
                      >
                        Excel
                      </Button>
                      <Button
                        variant={reportFormat === "csv" ? "default" : "outline"}
                        size="sm"
                        onClick={() => setReportFormat("csv")}
                      >
                        CSV
                      </Button>
                    </div>
                  </div>
                </div>

                <div className="flex justify-end gap-2">
                  <Button variant="outline" onClick={closeModal}>
                    Cancel
                  </Button>
                  <Button
                    onClick={processReport}
                    disabled={reportGenerating}
                    className="bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600"
                  >
                    {reportGenerating ? "Generating..." : "Generate Report"}
                  </Button>
                </div>

                {reportGenerating && (
                  <div className="mt-4">
                    <p className="text-sm text-gray-500 mb-2">Generating report...</p>
                    <Progress value={45} className="h-2" />
                  </div>
                )}
              </>
            ) : (
              <div className="text-center py-6">
                <div className="h-16 w-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <CheckCircle2 className="h-8 w-8 text-green-600" />
                </div>
                <h3 className="text-lg font-medium mb-2">Report Generated Successfully</h3>
                <p className="text-gray-500 mb-6">
                  Your {reportType} report has been generated in {reportFormat.toUpperCase()} format.
                </p>
                <div className="flex justify-center gap-2">
                  <Button variant="outline" onClick={closeModal}>
                    Close
                  </Button>
                  <Button className="bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600">
                    Download Report
                  </Button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Transaction Modal */}
      {showTransactionModal && selectedTransaction && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg w-full max-w-2xl p-6 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-bold">Transaction Details</h3>
              <Button variant="ghost" size="sm" onClick={closeModal} className="h-8 w-8 p-0">
                <X className="h-4 w-4" />
              </Button>
            </div>

            <div className="grid grid-cols-2 gap-4 mb-6">
              <div>
                <p className="text-sm text-gray-500">Transaction ID</p>
                <p className="font-medium">{selectedTransaction.Id}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Date</p>
                <p className="font-medium">{selectedTransaction.Date}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Member</p>
                <p className="font-medium">{selectedTransaction.Member || "Non-member"}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Status</p>
                <span
                  className={`inline-block px-2 py-1 rounded-full text-xs font-medium ${
                    selectedTransaction.Status === "Completed"
                      ? "bg-green-100 text-green-800"
                      : "bg-amber-100 text-amber-800"
                  }`}
                >
                  {selectedTransaction.Status}
                </span>
              </div>
            </div>

            <div className="mb-6">
              <h4 className="font-medium mb-2">Items</h4>
              <div className="border rounded-lg overflow-hidden">
                <table className="w-full">
                  <thead className="bg-gray-50 text-xs">
                    <tr>
                      <th className="py-2 px-4 text-left font-medium text-gray-600">Item</th>
                      <th className="py-2 px-4 text-left font-medium text-gray-600">Qty</th>
                      <th className="py-2 px-4 text-left font-medium text-gray-600">Price</th>
                      <th className="py-2 px-4 text-left font-medium text-gray-600">Subtotal</th>
                    </tr>
                  </thead>
                  <tbody>
                    {selectedTransaction.ItemDetails.map((item, index) => (
                      <tr key={index} className="border-b">
                        <td className="py-2 px-4">{item.Name}</td>
                        <td className="py-2 px-4">{item.Quantity}</td>
                        <td className="py-2 px-4">₱{item.Price.toFixed(2)}</td>
                        <td className="py-2 px-4">₱{(item.Quantity * item.Price).toFixed(2)}</td>
                      </tr>
                    ))}
                  </tbody>
                  <tfoot className="bg-gray-50">
                    <tr>
                      <td colSpan={3} className="py-2 px-4 text-right font-medium">
                        Total
                      </td>
                      <td className="py-2 px-4 font-bold">₱{selectedTransaction.Total.toFixed(2)}</td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            </div>

            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={closeModal}>
                Close
              </Button>
              <Button className="bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600">
                Print Receipt
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Inventory Detail Modal */}
      {showInventoryModal && selectedInventory && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white rounded-lg w-full max-w-lg relative"
          >
            <div className="p-6">
              <button
                className="absolute right-6 top-6 text-gray-500 hover:text-gray-800"
                onClick={closeModal}
              >
                <X className="h-5 w-5" />
              </button>
              <h2 className="text-xl font-bold text-gray-900 mb-4">Inventory Details</h2>
              <div className="space-y-4">
                <div className="flex justify-between items-center py-3 border-b">
                  <h3 className="font-medium text-gray-600">Product Name</h3>
                  <p className="font-medium text-gray-900">{selectedInventory.Product}</p>
                </div>
                <div className="flex justify-between items-center py-3 border-b">
                  <h3 className="font-medium text-gray-600">SKU</h3>
                  <p className="font-medium text-gray-900">{selectedInventory.SKU}</p>
                </div>
                <div className="flex justify-between items-center py-3 border-b">
                  <h3 className="font-medium text-gray-600">Category</h3>
                  <p className="font-medium text-gray-900">{selectedInventory.Category}</p>
                </div>
                <div className="flex justify-between items-center py-3 border-b">
                  <h3 className="font-medium text-gray-600">Current Stock</h3>
                  <p className="font-medium text-gray-900">
                    <span
                      className={`px-2 py-1 rounded ${
                        selectedInventory.Stock <= selectedInventory.Threshold / 2
                          ? "bg-red-100 text-red-800"
                          : "bg-amber-100 text-amber-800"
                      }`}
                    >
                      {selectedInventory.Stock} units
                    </span>
                  </p>
                </div>
                <div className="flex justify-between items-center py-3 border-b">
                  <h3 className="font-medium text-gray-600">Threshold</h3>
                  <p className="font-medium text-gray-900">{selectedInventory.Threshold} units</p>
                </div>
              </div>
              <div className="mt-6 flex justify-end space-x-3">
                <Button variant="outline" onClick={closeModal}>
                  Close
                </Button>
                <Button
                  className="bg-amber-500 hover:bg-amber-600"
                  onClick={() => {
                    closeModal()
                    // Placeholder for update stock action
                    alert(`Add stock to ${selectedInventory.Product}`)
                  }}
                >
                  Restock
                </Button>
              </div>
            </div>
          </motion.div>
        </div>
      )}

      {/* Member Detail Modal */}
      {showMemberModal && selectedMember && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white rounded-lg w-full max-w-lg"
          >
            <div className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-xl font-bold">Member Details</h3>
                <Button variant="ghost" size="sm" onClick={closeModal} className="h-8 w-8 p-0">
                  <X className="h-4 w-4" />
                </Button>
              </div>

              <div className="flex flex-col sm:flex-row gap-4 mb-6">
                <div className="flex-shrink-0">
                  <div className="h-24 w-24 rounded-full bg-amber-100 flex items-center justify-center">
                    <Users className="h-12 w-12 text-amber-600" />
                  </div>
                </div>
                <div>
                  <h2 className="text-2xl font-bold">{selectedMember.member}</h2>
                  <p className="text-gray-500">{selectedMember.memberId}</p>
                  <div className="mt-2">
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                      Active Member
                    </span>
                  </div>
                </div>
              </div>

              <div className="space-y-4 mb-6">
                <div>
                  <p className="text-sm text-gray-500">Recent Activity</p>
                  <p className="font-medium">{selectedMember.action}</p>
                  <p className="text-sm text-gray-500">{selectedMember.time}</p>
                  {selectedMember.amount && (
                    <p className="font-medium text-amber-600">{selectedMember.amount}</p>
                  )}
                </div>
              </div>

              <div className="flex flex-wrap gap-2">
                <Button
                  variant="outline"
                  className="flex-1"
                  onClick={() => {
                    closeModal();
                    // Navigate to member details page (placeholder)
                    alert(`View full profile for ${selectedMember.member}`);
                  }}
                >
                  View Full Profile
                </Button>
                <Button
                  className="bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 flex-1"
                  onClick={() => {
                    closeModal();
                    // Navigate to member credit page (placeholder)
                    alert(`Manage credit for ${selectedMember.member}`);
                  }}
                >
                  Manage Credit
                </Button>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  )
}
