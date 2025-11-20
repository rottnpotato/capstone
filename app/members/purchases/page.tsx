"use client"

import { useState, useEffect } from "react"
import { 
  ShoppingBag, 
  Calendar, 
  ChevronRight, 
  AlertCircle, 
  Receipt,
  X,
  Search,
  CheckCircle2,
  Clock,
  Filter,
  Calendar as CalendarIcon,
  Package,
  ArrowRight,
  FileText,
  Tag
} from "lucide-react"
import { motion } from "framer-motion"
import { Navbar } from "@/components/ui/navbar"
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useAuth } from "@/hooks/useAuth"
import { GetCurrentMemberData, MemberProfileData, Purchase, ItemDetail } from "../actions"

export default function MemberPurchasesPage() {
  const { user } = useAuth();
  const [memberData, setMemberData] = useState<MemberProfileData | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [showReceiptModal, setShowReceiptModal] = useState(false)
  const [selectedPurchase, setSelectedPurchase] = useState<Purchase | null>(null)
  const [searchTerm, setSearchTerm] = useState("")
  const [dateFilter, setDateFilter] = useState("all")
  const [statusFilter, setStatusFilter] = useState("all")
  const [sortOrder, setSortOrder] = useState("newest")

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
            setMemberData(data as MemberProfileData);
          } else {
            setError("Could not retrieve member data. Please try again.");
          }
        } catch (e) {
          setError("An error occurred while fetching purchase data.");
        }
      } else { // User is not logged in (user is null)
        // Redirect to login if session is invalid but we are on a protected page
        window.location.href = '/login';
        return;
      }
      setIsLoading(false);
    };

    fetchMemberData();
  }, [user]);

  // Function to view receipt
  const viewReceipt = (purchase: Purchase) => {
    setSelectedPurchase(purchase)
    setShowReceiptModal(true)
  }

  // Filter purchases based on search term, filters, and sort order
  const filteredPurchases = memberData?.purchaseHistory.filter((purchase: Purchase) => {
    // Search term filter
    const matchesSearch = 
      purchase.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
      purchase.date.toLowerCase().includes(searchTerm.toLowerCase()) ||
      purchase.itemDetails.some((item: ItemDetail) => 
        item.name.toLowerCase().includes(searchTerm.toLowerCase())
      );
    
    // Date filter
    const purchaseDate = new Date(purchase.date);
    const now = new Date();
    const isWithinLastMonth = 
      purchaseDate >= new Date(now.getFullYear(), now.getMonth() - 1, now.getDate());
    const isWithinLastThreeMonths = 
      purchaseDate >= new Date(now.getFullYear(), now.getMonth() - 3, now.getDate());
    
    const matchesDateFilter = 
      dateFilter === "all" || 
      (dateFilter === "month" && isWithinLastMonth) ||
      (dateFilter === "quarter" && isWithinLastThreeMonths);
    
    // Status filter
    const matchesStatusFilter = 
      statusFilter === "all" || 
      purchase.status.toLowerCase() === statusFilter.toLowerCase();
    
    return matchesSearch && matchesDateFilter && matchesStatusFilter;
  })
  .sort((a: Purchase, b: Purchase) => {
    const dateA = new Date(a.date);
    const dateB = new Date(b.date);
    
    if (sortOrder === "newest") {
      return dateB.getTime() - dateA.getTime();
    } else if (sortOrder === "oldest") {
      return dateA.getTime() - dateB.getTime();
    } else if (sortOrder === "highest") {
      return b.total - a.total;
    } else {
      return a.total - b.total;
    }
  }) || [];

  // Format currency
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-PH', {
      style: 'currency',
      currency: 'PHP',
      minimumFractionDigits: 2
    }).format(amount);
  }

  // Format date
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return new Intl.DateTimeFormat('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    }).format(date);
  }

  // Animation variants
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: { 
      opacity: 1,
      transition: {
        staggerChildren: 0.1
      }
    }
  };

  const itemVariants = {
    hidden: { y: 20, opacity: 0 },
    visible: { 
      y: 0, 
      opacity: 1,
      transition: {
        type: "spring",
        stiffness: 100,
        damping: 15
      }
    }
  };

  // If loading, show loading spinner
  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-amber-500 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading purchase history...</p>
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
          <p className="text-gray-600 mb-4">{error || "Unable to load purchase history. Please try again later."}</p>
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
    <div className="min-h-screen bg-gradient-to-b from-amber-50/50 to-white">
      <Navbar userType="member" userName={memberData.name} memberData={memberData} />

      <main className="pt-16 pb-20">
        <div className="container mx-auto px-4 py-8">
          {/* Header section */}
          <motion.div 
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8"
          >
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Purchase History</h1>
              <p className="text-gray-500 mt-1">View and manage your purchases</p>
            </div>
            <Button 
              variant="outline" 
              className="flex items-center gap-2 border-amber-200 hover:bg-amber-50 transition-all"
              onClick={() => window.location.href = '/member'}
            >
              <ArrowRight className="h-4 w-4 text-amber-600" />
              <span>Back to Dashboard</span>
            </Button>
          </motion.div>
          
          {/* Statistics cards */}
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8"
          >
            <Card className="bg-gradient-to-br from-amber-50 to-white border-amber-100 shadow-sm hover:shadow-md transition-all">
              <CardContent className="p-6">
                <div className="flex justify-between items-center mb-2">
                  <h3 className="text-gray-500 font-medium">Total Purchases</h3>
                  <div className="h-8 w-8 rounded-full bg-amber-100 flex items-center justify-center">
                    <FileText className="h-4 w-4 text-amber-600" />
                  </div>
                </div>
                <div className="text-3xl font-bold text-gray-900">{memberData.purchaseHistory.length}</div>
                <p className="text-sm text-gray-500 mt-1">All-time transactions</p>
              </CardContent>
            </Card>
            
            <Card className="bg-gradient-to-br from-amber-50 to-white border-amber-100 shadow-sm hover:shadow-md transition-all">
              <CardContent className="p-6">
                <div className="flex justify-between items-center mb-2">
                  <h3 className="text-gray-500 font-medium">Total Spent</h3>
                  <div className="h-8 w-8 rounded-full bg-amber-100 flex items-center justify-center">
                    <Tag className="h-4 w-4 text-amber-600" />
                  </div>
                </div>
                <div className="text-3xl font-bold text-gray-900">
                  {formatCurrency(memberData.purchaseHistory.reduce((total: number, purchase: Purchase) => total + purchase.total, 0))}
                </div>
                <p className="text-sm text-gray-500 mt-1">Lifetime spending</p>
              </CardContent>
            </Card>
            
            <Card className="bg-gradient-to-br from-amber-50 to-white border-amber-100 shadow-sm hover:shadow-md transition-all">
              <CardContent className="p-6">
                <div className="flex justify-between items-center mb-2">
                  <h3 className="text-gray-500 font-medium">Recent Purchase</h3>
                  <div className="h-8 w-8 rounded-full bg-amber-100 flex items-center justify-center">
                    <CalendarIcon className="h-4 w-4 text-amber-600" />
                  </div>
                </div>
                {memberData.purchaseHistory.length > 0 ? (
                  <>
                    <div className="text-3xl font-bold text-gray-900">
                      {formatDate(memberData.purchaseHistory[0].date)}
                    </div>
                    <p className="text-sm text-gray-500 mt-1">
                      {formatCurrency(memberData.purchaseHistory[0].total)}
                    </p>
                  </>
                ) : (
                  <>
                    <div className="text-xl font-medium text-gray-400">No purchases yet</div>
                    <p className="text-sm text-gray-500 mt-1">Make your first purchase</p>
                  </>
                )}
              </CardContent>
            </Card>
          </motion.div>
          
          {/* Filters */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.3 }}
          >
            <Card className="mb-6 shadow-sm bg-white border-amber-100">
              <CardContent className="pt-6">
                <div className="flex flex-col md:flex-row gap-4 items-end">
                  <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                    <Input 
                      className="pl-10 border-amber-200 focus:ring-amber-500 focus:border-amber-500" 
                      placeholder="Search by transaction ID, date, or product..." 
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                    />
                  </div>
                  <div className="flex gap-2 flex-wrap md:flex-nowrap">
                    <div className="flex items-center gap-2">
                      <Filter className="h-4 w-4 text-amber-600" />
                      <span className="text-sm text-amber-600 font-medium">Filter:</span>
                    </div>
                    <Select value={dateFilter} onValueChange={setDateFilter}>
                      <SelectTrigger className="w-[150px] border-amber-200 focus:ring-amber-500">
                        <SelectValue placeholder="Filter by date" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Time</SelectItem>
                        <SelectItem value="month">Last Month</SelectItem>
                        <SelectItem value="quarter">Last 3 Months</SelectItem>
                      </SelectContent>
                    </Select>
                    <Select value={statusFilter} onValueChange={setStatusFilter}>
                      <SelectTrigger className="w-[150px] border-amber-200 focus:ring-amber-500">
                        <SelectValue placeholder="Filter by status" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Statuses</SelectItem>
                        <SelectItem value="completed">Completed</SelectItem>
                        <SelectItem value="credit">Credit</SelectItem>
                      </SelectContent>
                    </Select>
                    <Select value={sortOrder} onValueChange={setSortOrder}>
                      <SelectTrigger className="w-[150px] border-amber-200 focus:ring-amber-500">
                        <SelectValue placeholder="Sort by" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="newest">Newest First</SelectItem>
                        <SelectItem value="oldest">Oldest First</SelectItem>
                        <SelectItem value="highest">Highest Amount</SelectItem>
                        <SelectItem value="lowest">Lowest Amount</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>

          {/* Results */}
          <motion.div 
            className="space-y-4"
            variants={containerVariants}
            initial="hidden"
            animate="visible"
          >
            {filteredPurchases.length === 0 ? (
              <motion.div variants={itemVariants}>
                <Card className="shadow-sm bg-white border-amber-100">
                  <CardContent className="flex flex-col items-center justify-center p-12">
                    <div className="h-20 w-20 rounded-full bg-amber-50 flex items-center justify-center mb-4">
                      <ShoppingBag className="h-10 w-10 text-amber-300" />
                    </div>
                    <h3 className="text-xl font-medium text-gray-900 mb-2">No purchases found</h3>
                    <p className="text-gray-500 text-center max-w-md">
                      {searchTerm || dateFilter !== "all" || statusFilter !== "all" 
                        ? "Try adjusting your filters or search term" 
                        : "You haven't made any purchases yet"}
                    </p>
                  </CardContent>
                </Card>
              </motion.div>
            ) : (
              filteredPurchases.map((purchase: Purchase, index: number) => (
                <motion.div key={purchase.id} variants={itemVariants}>
                  <Card className="overflow-hidden shadow-sm hover:shadow-md transition-all duration-300 border-amber-100 bg-white">
                    <CardContent className="p-0">
                      <div className="p-6">
                        <div className="flex flex-col md:flex-row justify-between gap-4">
                          <div className="flex flex-col md:flex-row md:items-center gap-4">
                            <div className={`h-14 w-14 rounded-lg ${
                              purchase.status === "Completed" ? "bg-green-50" : "bg-amber-50"
                            } flex items-center justify-center shrink-0`}>
                              <ShoppingBag className={`h-7 w-7 ${
                                purchase.status === "Completed" ? "text-green-500" : "text-amber-500"
                              }`} />
                            </div>
                            <div>
                              <h3 className="text-lg font-semibold text-gray-900">{purchase.id}</h3>
                              <div className="flex items-center gap-2 text-sm text-gray-600 mt-1 flex-wrap">
                                <div className="flex items-center">
                                  <Calendar className="h-4 w-4 text-amber-500 mr-1" />
                                  <span>{formatDate(purchase.date)}</span>
                                </div>
                                <span className="hidden md:inline">•</span>
                                <div className="flex items-center">
                                  <Package className="h-4 w-4 text-amber-500 mr-1" />
                                  <span>{purchase.items} {purchase.items === 1 ? 'item' : 'items'}</span>
                                </div>
                              </div>
                            </div>
                          </div>
                          <div className="flex flex-col items-end justify-center">
                            <div className="text-xl font-semibold text-gray-900">{formatCurrency(purchase.total)}</div>
                            <Badge className={`mt-1 ${
                              purchase.status === "Completed" 
                                ? "bg-green-100 text-green-800 hover:bg-green-200" 
                                : "bg-amber-100 text-amber-800 hover:bg-amber-200"
                            } px-3 py-1`}>
                              {purchase.status === "Completed" ? (
                                <CheckCircle2 className="h-3.5 w-3.5 mr-1.5" />
                              ) : (
                                <Clock className="h-3.5 w-3.5 mr-1.5" />
                              )}
                              {purchase.status}
                            </Badge>
                          </div>
                        </div>
                        
                        <div className="mt-4 space-y-3 bg-gray-50 p-4 rounded-lg">
                          {purchase.itemDetails.slice(0, 3).map((item: ItemDetail, idx: number) => (
                            <div key={idx} className="flex justify-between text-sm">
                              <span className="text-gray-700 font-medium">
                                {item.quantity}x {item.name}
                              </span>
                              <span className="font-semibold text-gray-900">{formatCurrency(item.price * item.quantity)}</span>
                            </div>
                          ))}
                          {purchase.itemDetails.length > 3 && (
                            <div className="text-sm text-amber-600 font-medium">
                              + {purchase.itemDetails.length - 3} more items
                            </div>
                          )}
                        </div>
                      </div>
                      <div className="border-t border-amber-100 p-4 bg-gray-50">
                        <Button 
                          variant="ghost" 
                          className="w-full flex items-center justify-center gap-2 text-amber-600 hover:text-amber-700 hover:bg-amber-50 transition-all duration-300"
                          onClick={() => viewReceipt(purchase)}
                        >
                          <Receipt className="h-4 w-4" />
                          <span>View Receipt</span>
                          <ChevronRight className="h-4 w-4 ml-auto" />
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              ))
            )}
          </motion.div>
        </div>
      </main>

      {/* Receipt Modal */}
      {showReceiptModal && selectedPurchase && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <motion.div 
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            transition={{ type: "spring", stiffness: 300, damping: 25 }}
            className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto"
          >
            <div className="p-6 border-b border-gray-200 flex justify-between items-center sticky top-0 bg-white z-10">
              <h3 className="text-xl font-semibold">Receipt Details</h3>
              <Button 
                variant="ghost" 
                size="icon" 
                onClick={() => setShowReceiptModal(false)}
              >
                <X className="h-5 w-5" />
              </Button>
            </div>
            <div className="p-6">
              <div className="mb-6 text-center">
                <h2 className="text-2xl font-bold text-gray-900">Pandol Cooperative</h2>
                <p className="text-gray-600">Official Receipt</p>
              </div>
              
              <div className="flex justify-between mb-6">
                <div>
                  <p className="text-sm text-gray-500">Transaction ID</p>
                  <p className="font-medium">{selectedPurchase.id}</p>
                </div>
                <div className="text-right">
                  <p className="text-sm text-gray-500">Date</p>
                  <p className="font-medium">{formatDate(selectedPurchase.date)}</p>
                </div>
              </div>
              
              <div className="mb-6">
                <div className="flex justify-between border-b border-gray-200 pb-2 mb-2">
                  <span className="font-medium">Item</span>
                  <div className="flex gap-8">
                    <span className="font-medium">Qty</span>
                    <span className="font-medium text-right w-24">Amount</span>
                  </div>
                </div>
                
                {selectedPurchase.itemDetails.map((item, idx) => (
                  <div key={idx} className="flex justify-between py-2 border-b border-gray-100">
                    <span className="text-gray-800">{item.name}</span>
                    <div className="flex gap-8">
                      <span className="text-center w-10">{item.quantity}</span>
                      <span className="text-right w-24">{formatCurrency(item.price * item.quantity)}</span>
                    </div>
                  </div>
                ))}
                
                <div className="flex justify-between pt-4 font-semibold">
                  <span>Total</span>
                  <span>{formatCurrency(selectedPurchase.total)}</span>
                </div>
              </div>
              
              <div className="mt-8 pt-6 border-t border-gray-200">
                <div className="flex justify-between mb-2">
                  <span className="text-gray-600">Payment Method</span>
                  <span className="font-medium">{selectedPurchase.status === "Credit" ? "Credit" : "Cash"}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Status</span>
                  <Badge className={
                    selectedPurchase.status === "Completed" 
                      ? "bg-green-100 text-green-800" 
                      : "bg-amber-100 text-amber-800"
                  }>
                    {selectedPurchase.status === "Completed" ? (
                      <CheckCircle2 className="h-3.5 w-3.5 mr-1" />
                    ) : (
                      <Clock className="h-3.5 w-3.5 mr-1" />
                    )}
                    {selectedPurchase.status}
                  </Badge>
                </div>
              </div>
              
              <div className="mt-8 text-center text-gray-500 text-sm">
                <p>Thank you for shopping with Pandol Cooperative!</p>
                <p>For any inquiries, please contact our customer service.</p>
              </div>
            </div>
            <div className="p-4 bg-gray-50 rounded-b-lg flex justify-end">
              <Button
                className="bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600"
                onClick={() => setShowReceiptModal(false)}
              >
                Close
              </Button>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  )
}
