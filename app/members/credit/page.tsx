"use client"

import { useState, useEffect } from "react"
import { 
  CreditCard, 
  Calendar, 
  ChevronRight, 
  AlertCircle, 
  Clock, 
  X,
  CheckCircle2,
  Wallet,
  DollarSign,
  ArrowUp,
  Bell,
  Info
} from "lucide-react"
import { Navbar } from "@/components/ui/navbar"
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Input } from "@/components/ui/input"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { useAuth } from "@/hooks/useAuth"
import { GetCurrentMemberData, MemberProfileData, Payment } from "../actions"

export default function MemberCreditPage() {
  const { user } = useAuth();
  const [memberData, setMemberData] = useState<MemberProfileData | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [activeTab, setActiveTab] = useState("overview")
  const [showPaymentModal, setShowPaymentModal] = useState(false)
  const [showCreditModal, setShowCreditModal] = useState(false)
  const [selectedPayment, setSelectedPayment] = useState<Payment | null>(null)
  const [paymentAmount, setPaymentAmount] = useState("")
  const [paymentMethod, setPaymentMethod] = useState("cash")
  const [processingPayment, setProcessingPayment] = useState(false)
  const [paymentSuccess, setPaymentSuccess] = useState(false)
  const [creditIncreaseAmount, setCreditIncreaseAmount] = useState(1000)

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
          setError("An error occurred while fetching member data.");
        }
      } else { // User is not logged in (user is null)
        setError("You must be logged in to view this page.");
      }
      setIsLoading(false);
    };

    fetchMemberData();
  }, [user]);

  // ... rest of the component
  // Function to make a payment
  const makePayment = (payment: Payment | null = null) => {
    if (payment) {
      setSelectedPayment(payment)
    } else {
      setSelectedPayment(null)
    }
    setShowPaymentModal(true)
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
    setShowPaymentModal(false)
    setShowCreditModal(false)
    setSelectedPayment(null)
  }

  // Format currency
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-PH', {
      style: 'currency',
      currency: 'PHP',
      minimumFractionDigits: 2
    }).format(amount);
  }

  // If loading, show loading spinner
  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-amber-500 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading credit information...</p>
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
          <p className="text-gray-600 mb-4">{error || "Unable to load credit information. Please try again later."}</p>
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
      <Navbar userType="member" userName={memberData.name} memberData={memberData} />

      <main className="pt-16 pb-20">
        <div className="container mx-auto px-4 py-8">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
            <h1 className="text-3xl font-bold">Credit Management</h1>
            <div className="flex items-center space-x-2">
              <Button 
                variant="ghost" 
                className="flex items-center gap-2"
                onClick={() => window.location.href = '/member'}
              >
                <span>Back to Dashboard</span>
              </Button>
            </div>
          </div>

          {/* Credit Overview Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            <Card className="bg-gradient-to-r from-amber-50 to-orange-50 border-amber-100 shadow-sm hover:shadow-md transition-shadow">
              <CardContent className="p-6">
                <div className="flex items-center gap-4 mb-4">
                  <div className="h-12 w-12 rounded-full bg-amber-100 flex items-center justify-center">
                    <Wallet className="h-6 w-6 text-amber-600" />
                  </div>
                  <div>
                    <h3 className="text-sm font-medium text-amber-600">Available Credit</h3>
                    <p className="text-2xl font-bold">{formatCurrency(memberData.availableCredit)}</p>
                  </div>
                </div>
                <div className="mt-2">
                  <div className="flex justify-between text-sm mb-1">
                    <span className="text-gray-600">Credit Limit</span>
                    <span className="font-medium">{formatCurrency(memberData.creditLimit)}</span>
                  </div>
                  <Progress value={memberData.creditUtilization} className="h-2 bg-amber-100" />
                  <div className="flex justify-between text-xs mt-1">
                    <span className="text-gray-500">{memberData.creditUtilization}% Used</span>
                    <span className="text-gray-500">{100 - memberData.creditUtilization}% Available</span>
                  </div>
                </div>
              </CardContent>
              <CardFooter className="p-4 bg-white border-t border-amber-100 rounded-b-lg">
                <Button 
                  variant="ghost" 
                  className="w-full text-amber-600 hover:text-amber-700 hover:bg-amber-50"
                  onClick={requestCreditIncrease}
                >
                  Request Credit Increase
                  <ArrowUp className="h-4 w-4 ml-2" />
                </Button>
              </CardFooter>
            </Card>

            <Card className="shadow-sm hover:shadow-md transition-shadow">
              <CardContent className="p-6">
                <div className="flex items-center gap-4 mb-4">
                  <div className="h-12 w-12 rounded-full bg-orange-100 flex items-center justify-center">
                    <CreditCard className="h-6 w-6 text-orange-600" />
                  </div>
                  <div>
                    <h3 className="text-sm font-medium text-orange-600">Current Balance</h3>
                    <p className="text-2xl font-bold">{formatCurrency(memberData.creditBalance)}</p>
                  </div>
                </div>
                <Button 
                  className="w-full bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600"
                  onClick={() => makePayment()}
                >
                  Make a Payment
                  <DollarSign className="h-4 w-4 ml-2" />
                </Button>
              </CardContent>
            </Card>

            <Card className="shadow-sm hover:shadow-md transition-shadow">
              <CardContent className="p-6">
                <div className="flex items-center gap-4 mb-4">
                  <div className="h-12 w-12 rounded-full bg-red-100 flex items-center justify-center">
                    <Bell className="h-6 w-6 text-red-600" />
                  </div>
                  <div>
                    <h3 className="text-sm font-medium text-red-600">Upcoming Payments</h3>
                    <p className="text-2xl font-bold">
                      {memberData.upcomingPayments && memberData.upcomingPayments.length > 0 
                        ? formatCurrency(memberData.upcomingPayments.reduce((sum: number, payment: Payment) => sum + payment.amount, 0))
                        : formatCurrency(0)}
                    </p>
                  </div>
                </div>
                <div className="space-y-2">
                  {memberData.upcomingPayments && memberData.upcomingPayments.length > 0 ? (
                    memberData.upcomingPayments.slice(0, 2).map((payment: Payment, idx: number) => (
                      <div key={idx} className="flex justify-between items-center p-2 bg-gray-50 rounded-md text-sm">
                        <div className="flex items-center gap-2">
                          <Calendar className="h-4 w-4 text-gray-500" />
                          <span>Due: {payment.dueDate}</span>
                        </div>
                        <span className="font-medium">{formatCurrency(payment.amount)}</span>
                      </div>
                    ))
                  ) : (
                    <div className="flex items-center gap-2 p-3 bg-green-50 text-green-700 rounded-md text-sm">
                      <CheckCircle2 className="h-4 w-4" />
                      <span>No upcoming payments due</span>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Credit Information Alert */}
          <Alert className="mb-6 bg-blue-50 border-blue-100 text-blue-800">
            <div className="flex gap-3">
              <Info className="h-5 w-5" />
              <AlertDescription>
                Your credit utilization is {memberData.creditUtilization}%. 
                Keeping your utilization below 30% is recommended for maintaining good credit status.
              </AlertDescription>
            </div>
          </Alert>

          {/* Tabs for Credit Activity */}
          <Tabs defaultValue="upcoming" className="mb-8">
            <TabsList className="grid grid-cols-2 mb-6">
              <TabsTrigger value="upcoming">Upcoming Payments</TabsTrigger>
              <TabsTrigger value="history">Payment History</TabsTrigger>
            </TabsList>
            
            <TabsContent value="upcoming" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>Upcoming Payments</CardTitle>
                  <CardDescription>Payments due based on your credit purchases</CardDescription>
                </CardHeader>
                <CardContent>
                  {!memberData.upcomingPayments || memberData.upcomingPayments.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-10 text-center">
                      <CheckCircle2 className="h-12 w-12 text-green-500 mb-4" />
                      <h3 className="text-xl font-medium mb-2">No Upcoming Payments</h3>
                      <p className="text-gray-600 max-w-md">
                        You don't have any upcoming payments at this time. Any future credit purchases will appear here.
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {memberData.upcomingPayments.map((payment: Payment, idx: number) => (
                        <Card key={idx} className="shadow-sm">
                          <CardContent className="p-0">
                            <div className="p-4">
                              <div className="flex justify-between items-center">
                                <div>
                                  <p className="font-medium">{payment.id}</p>
                                  <div className="flex items-center gap-2 text-sm text-gray-600 mt-1">
                                    <Calendar className="h-4 w-4" />
                                    <span>Due: {payment.dueDate}</span>
                                  </div>
                                  <p className="text-sm text-gray-600 mt-1">{payment.description}</p>
                                </div>
                                <div className="text-right">
                                  <p className="text-lg font-semibold">{formatCurrency(payment.amount)}</p>
                                </div>
                              </div>
                            </div>
                            <div className="border-t border-gray-100 p-3 bg-gray-50 rounded-b-lg">
                              <Button 
                                variant="ghost" 
                                className="w-full flex items-center justify-center gap-2 text-amber-600 hover:text-amber-700 hover:bg-amber-50"
                                onClick={() => makePayment(payment)}
                              >
                                <DollarSign className="h-4 w-4" />
                                <span>Pay Now</span>
                                <ChevronRight className="h-4 w-4 ml-auto" />
                              </Button>
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
            
            <TabsContent value="history" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>Payment History</CardTitle>
                  <CardDescription>Record of your credit-related payments</CardDescription>
                </CardHeader>
                <CardContent>
                  {/* Filter payment history to only show credit-related payments */}
                  {memberData.paymentHistory && memberData.paymentHistory.filter((payment: Payment) => 
                    (payment.description && payment.description.toLowerCase().includes('credit')) || 
                    (payment.id && payment.id.startsWith('PAY-'))
                  ).length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-10 text-center">
                      <AlertCircle className="h-12 w-12 text-amber-500 mb-4" />
                      <h3 className="text-xl font-medium mb-2">No Credit Payment History</h3>
                      <p className="text-gray-600 max-w-md">
                        You haven't made any credit payments yet. Your credit payment history will appear here once you start making payments.
                      </p>
                    </div>
                  ) : (
                    <div className="overflow-x-auto">
                      <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                          <tr>
                            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                              ID
                            </th>
                            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                              Date
                            </th>
                            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                              Amount
                            </th>
                            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                              Method
                            </th>
                            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                              Status
                            </th>
                          </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                          {memberData.paymentHistory.filter((payment: Payment) => 
                            (payment.description && payment.description.toLowerCase().includes('credit')) || 
                            (payment.id && payment.id.startsWith('PAY-'))
                          ).map((payment: Payment, idx: number) => (
                            <tr key={idx}>
                              <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                                {payment.id}
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                {payment.date}
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                                {formatCurrency(payment.amount)}
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                {payment.method}
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap">
                                <Badge className="bg-green-100 text-green-800">
                                  <CheckCircle2 className="h-3.5 w-3.5 mr-1" />
                                  {payment.status}
                                </Badge>
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
          </Tabs>
        </div>
      </main>

      {/* Payment Modal */}
      {showPaymentModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full">
            <div className="p-6 border-b border-gray-200 flex justify-between items-center">
              <h3 className="text-xl font-semibold">Payment Information</h3>
              <Button variant="ghost" size="icon" onClick={closeModal}>
                <X className="h-5 w-5" />
              </Button>
            </div>
            <div className="p-6">
              <div className="flex flex-col items-center justify-center py-6 text-center">
                <div className="h-16 w-16 rounded-full bg-amber-100 flex items-center justify-center mb-4">
                  <Info className="h-8 w-8 text-amber-600" />
                </div>
                <h3 className="text-xl font-medium mb-4">Visit the Cooperative</h3>
                <p className="text-gray-600 mb-6">
                  To make a payment on your credit balance, please visit the cooperative office in person. 
                  Online payments are not available at this time.
                </p>
                {selectedPayment && (
                  <div className="w-full bg-gray-50 p-4 rounded-lg mb-4">
                    <div className="flex justify-between mb-2">
                      <span className="text-gray-600">Payment ID</span>
                      <span className="font-medium">{selectedPayment.id}</span>
                    </div>
                    <div className="flex justify-between mb-2">
                      <span className="text-gray-600">Due Date</span>
                      <span className="font-medium">{selectedPayment.dueDate}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Amount</span>
                      <span className="font-medium">{formatCurrency(selectedPayment.amount)}</span>
                    </div>
                  </div>
                )}
                <Button 
                  className="bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600"
                  onClick={closeModal}
                >
                  Close
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Credit Increase Modal */}
      {showCreditModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full">
            <div className="p-6 border-b border-gray-200 flex justify-between items-center">
              <h3 className="text-xl font-semibold">Request Credit Increase</h3>
              <Button variant="ghost" size="icon" onClick={closeModal}>
                <X className="h-5 w-5" />
              </Button>
            </div>
            <div className="p-6">
              <div className="mb-6">
                <p className="text-gray-600">
                  Your current credit limit is {formatCurrency(memberData.creditLimit)}. How much would you like to increase it by?
                </p>
              </div>
              
              <div className="space-y-6">
                <div>
                  <label htmlFor="creditAmount" className="block text-sm font-medium text-gray-700 mb-1">
                    Requested Increase Amount
                  </label>
                  <div className="mt-1 relative rounded-md shadow-sm">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <span className="text-gray-500 sm:text-sm">₱</span>
                    </div>
                    <Input
                      type="number"
                      name="creditAmount"
                      id="creditAmount"
                      className="pl-7 pr-12"
                      placeholder="1000.00"
                      value={creditIncreaseAmount}
                      onChange={(e) => setCreditIncreaseAmount(parseFloat(e.target.value))}
                    />
                    <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                      <span className="text-gray-500 sm:text-sm">PHP</span>
                    </div>
                  </div>
                </div>
                
                <Alert className="bg-blue-50 border-blue-100 text-blue-800">
                  <div className="flex gap-3">
                    <Info className="h-5 w-5" />
                    <AlertDescription>
                      Credit increase requests are subject to approval. You will be notified once your request has been processed.
                    </AlertDescription>
                  </div>
                </Alert>
              </div>
            </div>
            <div className="p-4 bg-gray-50 rounded-b-lg flex justify-end gap-3">
              <Button
                variant="outline"
                onClick={closeModal}
              >
                Cancel
              </Button>
              <Button
                className="bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600"
                onClick={processCreditRequest}
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
