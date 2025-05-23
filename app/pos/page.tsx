"use client"

import { useState, useEffect } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Search, ShoppingCart, Plus, Minus, X, Package, Tag, Info, Trash2, Mail, Printer } from "lucide-react"
import { Navbar } from "@/components/ui/navbar"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent } from "@/components/ui/card"
import { Checkbox } from "@/components/ui/checkbox"
import { useRouter } from "next/navigation"
import Image from "next/image"
import { 
  GetProducts, 
  GetCategories, 
  GetMembers, 
  GetTransactions, 
  CreateTransaction,
  SearchProducts,
  SearchMembers,
  GetProductsByCategory,
  Product,
  Member,
  Transaction as ApiTransaction,
  SendReceiptEmail
} from "./actions"
import { Alert, AlertDescription } from "@/components/ui/alert"

// Cart item type definition
interface CartItem extends Product {
  Quantity: number
}

// Transaction type definition
interface Transaction {
  id: string
  date: string
  time: string
  items: number
  total: number
  paymentMethod: string
  status: string
  member?: string
  memberID?: string
  cashier: string
  itemDetails: {
    name: string
    quantity: number
    price: number
  }[]
}

export default function POSPage() {
  const router = useRouter()
  const [searchQuery, setSearchQuery] = useState("")
  const [activeCategory, setActiveCategory] = useState("all")
  const [cart, setCart] = useState<CartItem[]>([])
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null)
  const [isProductModalOpen, setIsProductModalOpen] = useState(false)
  const [isCheckoutModalOpen, setIsCheckoutModalOpen] = useState(false)
  const [memberSearchQuery, setMemberSearchQuery] = useState("")
  const [selectedMember, setSelectedMember] = useState<Member | null>(null)
  const [paymentMethod, setPaymentMethod] = useState("cash")
  const [isReceiptModalOpen, setIsReceiptModalOpen] = useState(false)
  const [cashAmount, setCashAmount] = useState<number | "">("")
  const [completedSale, setCompletedSale] = useState<{
    Items: CartItem[]
    Subtotal: number
    Discount: number
    Total: number
    CashAmount: number
    Change: number
    Date: string
    TransactionId: string
    Member: string | null
    MemberId: string | null
    PaymentMethod: string
  } | null>(null)
  const [isMemberPurchase, setIsMemberPurchase] = useState(false)
  const [isEmailSent, setIsEmailSent] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [products, setProducts] = useState<Product[]>([])
  const [categories, setCategories] = useState<string[]>([])
  const [members, setMembers] = useState<Member[]>([])
  const [transactions, setTransactions] = useState<ApiTransaction[]>([])
  const [error, setError] = useState<string | null>(null)
  const [emailError, setEmailError] = useState<string | null>(null)

  // Load products, categories, and members on component mount
  useEffect(() => {
    async function loadData() {
      setIsLoading(true)
      try {
        // Fetch products
        const productsData = await GetProducts()
        setProducts(productsData)
        
        // Fetch categories
        const categoriesData = await GetCategories()
        setCategories(["all", ...categoriesData])
        
        // Fetch members
        const membersData = await GetMembers()
        setMembers(membersData)

        // Fetch transactions to ensure they're in memory
        const transactionsData = await GetTransactions()
        setTransactions(transactionsData)
      } catch (err) {
        setError("Failed to load data. Please try refreshing the page.")
        console.error("Error loading data:", err)
      } finally {
        setIsLoading(false)
      }
    }
    
    loadData()
  }, [])

  // Handle product search
  useEffect(() => {
    async function searchProductsData() {
      if (searchQuery) {
        const results = await SearchProducts(searchQuery)
        setProducts(results)
      } else {
        const allProducts = await GetProducts()
        setProducts(allProducts)
      }
    }
    
    searchProductsData()
  }, [searchQuery])

  // Handle category filter
  useEffect(() => {
    async function filterByCategory() {
      if (activeCategory === "all") {
        const allProducts = await GetProducts()
        setProducts(allProducts)
      } else {
        const filteredProducts = await GetProductsByCategory(activeCategory)
        setProducts(filteredProducts)
      }
    }
    
    filterByCategory()
  }, [activeCategory])

  // Filter products based on search query and active category
  const filteredProducts = products

  // Calculate cart totals
  const subtotal = cart.reduce((sum, item) => sum + item.Price * item.Quantity, 0)
  const discount = cart.reduce((sum, item) => sum + (item.Discount || 0) * item.Quantity, 0)
  const total = subtotal - discount

  // Handle adding product to cart
  const addToCart = (product: Product, quantity = 1) => {
    setCart((prevCart) => {
      const existingItem = prevCart.find((item) => item.Id === product.Id)

      if (existingItem) {
        return prevCart.map((item) => (item.Id === product.Id ? { ...item, Quantity: item.Quantity + quantity } : item))
      } else {
        return [...prevCart, { ...product, Quantity: quantity }]
      }
    })

    // Add animation effect
    const cartIcon = document.querySelector(".cart-icon")
    if (cartIcon) {
      cartIcon.classList.add("animate-bounce")
      setTimeout(() => {
        cartIcon.classList.remove("animate-bounce")
      }, 1000)
    }
  }

  // Handle removing product from cart
  const removeFromCart = (productId: string) => {
    setCart((prevCart) => prevCart.filter((item) => item.Id !== productId))
  }

  // Handle updating product quantity in cart
  const updateCartItemQuantity = (productId: string, quantity: number) => {
    if (quantity <= 0) {
      removeFromCart(productId)
      return
    }

    setCart((prevCart) => prevCart.map((item) => (item.Id === productId ? { ...item, Quantity: quantity } : item)))
  }

  // Handle product click to open modal
  const handleProductClick = (product: Product) => {
    setSelectedProduct(product)
    setIsProductModalOpen(true)
  }

  // Handle member search
  const handleMemberSearch = async () => {
    if (memberSearchQuery) {
      const results = await SearchMembers(memberSearchQuery)
      setMembers(results)
    } else {
      const allMembers = await GetMembers()
      setMembers(allMembers)
    }
  }

  // Handle checkout process
  const handleCheckout = async () => {
    // Generate a transaction ID - this will be generated by the database
    const currentDate = new Date()
    const formattedDate = `${currentDate.toLocaleDateString("en-US", { month: "short", day: "2-digit", year: "numeric" })}`
    const formattedTime = `${currentDate.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit", hour12: true })}`

    try {
      // Format cart items for transaction
      const transactionItems = cart.map(item => ({
        ProductId: parseInt(item.Id),
        Quantity: item.Quantity,
        Price: item.Price
      }))
      
      // Create transaction in database
      const result = await CreateTransaction(
        transactionItems,
        total,
        paymentMethod.toLowerCase(),
        selectedMember ? parseInt(selectedMember.Id) : undefined
      )
      
      if (!result.success) {
        throw new Error(result.error || "Failed to create transaction")
      }
      
      // Create completed sale object
      const newSale = {
        Items: [...cart],
        Subtotal: subtotal,
        Discount: discount,
        Total: total,
        CashAmount: typeof cashAmount === "number" ? cashAmount : total,
        Change: typeof cashAmount === "number" ? cashAmount - total : 0,
        Date: formattedDate,
        Time: formattedTime,
        TransactionId: result.transactionId || `TRX-${Math.floor(100000 + Math.random() * 900000)}`,
        Member: selectedMember ? selectedMember.Name : null,
        MemberId: selectedMember ? selectedMember.MemberId : null,
        PaymentMethod: paymentMethod,
      }

      setCompletedSale(newSale)

      // Open receipt modal
      setIsReceiptModalOpen(true)

      // Close checkout modal
      setIsCheckoutModalOpen(false)
      
      // Refresh transactions
      const updatedTransactions = await GetTransactions()
      setTransactions(updatedTransactions)
      
    } catch (error) {
      console.error("Error during checkout:", error)
      alert("Transaction failed. Please try again.")
    }
  }

  // Handle sending receipt to email
  const handleSendReceipt = async () => {
    if (!completedSale || !selectedMember || !selectedMember.Email) {
      setEmailError("Cannot send receipt: Missing email address");
      return;
    }
    
    setIsEmailSent(true);
    setEmailError(null);
    
    try {
      // Call the actual send receipt email function
      const result = await SendReceiptEmail(
        completedSale.TransactionId,
        selectedMember.Email,
        selectedMember.Name
      );
      
      if (!result.success) {
        throw new Error(result.error || "Failed to send email");
      }
      
      // Success - wait a moment before redirecting
      setTimeout(() => {
        setIsReceiptModalOpen(false);
        setIsEmailSent(false);
        setEmailError(null);

        // Clear cart and reset state
        setCart([]);
        setSelectedMember(null);
        setMemberSearchQuery("");
        setPaymentMethod("cash");
        setCashAmount("");
        setIsMemberPurchase(false);

        // Navigate to transactions page to show the new transaction
        router.push("/pos/transactions");
      }, 2000);
    } catch (error) {
      console.error("Error sending receipt email:", error);
      setEmailError(error instanceof Error ? error.message : "Unknown error");
      setIsEmailSent(false);
    }
  };

  // Filter members based on search query
  const filteredMembers = members

  // Show loading state
  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin h-12 w-12 border-4 border-amber-500 border-t-transparent rounded-full mx-auto mb-4"></div>
          <p className="text-gray-600">Loading POS system...</p>
        </div>
      </div>
    )
  }

  // Show error state
  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center max-w-md p-6 bg-white rounded-lg shadow-md">
          <div className="text-red-500 text-5xl mb-4">⚠️</div>
          <h2 className="text-2xl font-bold text-gray-800 mb-2">Something went wrong</h2>
          <p className="text-gray-600 mb-4">{error}</p>
          <Button onClick={() => window.location.reload()}>Retry</Button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar userType="cashier" userName="Cashier" />

      <main className="pt-16 pb-20">
        <div className="container mx-auto px-4 py-8">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Product Listing Section */}
            <div className="lg:col-span-2 space-y-6">
              <div className="flex flex-col md:flex-row gap-4 items-start md:items-center justify-between">
                <h1 className="text-2xl font-bold text-gray-900">Sales Management</h1>

                <div className="relative w-full md:w-auto flex-1 md:max-w-md">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                  <Input
                    type="text"
                    placeholder="Search products by name..."
                    className="pl-10 pr-10"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                  />
                  {searchQuery && (
                    <button
                      title="Clear Search"
                      name="button"
                      className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                      onClick={() => setSearchQuery("")}
                    >
                      <X className="h-4 w-4" />
                    </button>
                  )}
                </div>
              </div>

              {/* Categories */}
              <div className="overflow-x-auto pb-2">
                <div className="flex space-x-2 min-w-max">
                  {categories.map((category) => (
                    <Button
                      key={category}
                      variant={activeCategory === category ? "default" : "outline"}
                      className={`capitalize ${
                        activeCategory === category
                          ? "bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600"
                          : ""
                      }`}
                      onClick={() => setActiveCategory(category)}
                    >
                      {category}
                    </Button>
                  ))}
                </div>
              </div>

              {/* Products Grid */}
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                <AnimatePresence>
                  {filteredProducts.map((product) => (
                    <motion.div
                      key={product.Id}
                      layout
                      initial={{ opacity: 0, scale: 0.9 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.9 }}
                      transition={{ duration: 0.2 }}
                      className="cursor-pointer"
                    >
                      <Card className="overflow-hidden h-full border border-gray-200 hover:border-amber-300 hover:shadow-md transition-all">
                        <CardContent className="p-3">
                          <div
                            className="relative aspect-square mb-2 bg-gray-100 rounded-md overflow-hidden"
                            onClick={() => handleProductClick(product)}
                          >
                            <Image
                              src={product.Image || "/placeholder.svg"}
                              alt={product.Name}
                              fill
                              className="object-cover"
                            />
                            {product.Stock < 10 && (
                              <Badge className="absolute top-2 left-2 bg-red-500">Low Stock</Badge>
                            )}
                            {product.ExpiryDate && new Date(product.ExpiryDate) < new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) && (
                              <Badge className="absolute top-2 right-2 bg-amber-500">Expires Soon</Badge>
                            )}
                          </div>
                          <h3
                            className="font-medium text-gray-900 line-clamp-1"
                            onClick={() => handleProductClick(product)}
                          >
                            {product.Name}
                          </h3>
                          <div className="flex justify-between items-center mt-1">
                            <p className="text-amber-600 font-bold">₱{product.Price.toFixed(2)}</p>
                            <Badge variant="outline" className="text-xs">
                              Stock: {product.Stock}
                            </Badge>
                          </div>
                          <Button
                            size="sm"
                            className="w-full mt-2 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600"
                            onClick={(e) => {
                              e.stopPropagation()
                              addToCart(product, 1)
                            }}
                          >
                            Add to Cart
                          </Button>
                        </CardContent>
                      </Card>
                    </motion.div>
                  ))}
                </AnimatePresence>
              </div>
            </div>

            {/* Billing Section */}
            <div className="lg:col-span-1">
              <Card className="sticky top-24">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between mb-6">
                    <h2 className="text-xl font-bold text-gray-900">Current Sale</h2>
                    <div className="relative cart-icon">
                      <ShoppingCart className="h-6 w-6 text-amber-600" />
                      {cart.length > 0 && (
                        <span className="absolute -top-2 -right-2 h-5 w-5 rounded-full bg-red-500 text-white text-xs flex items-center justify-center">
                          {cart.reduce((sum, item) => sum + item.Quantity, 0)}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Cart Items */}
                  <div className="space-y-4 max-h-[calc(100vh-350px)] overflow-y-auto mb-6">
                    {cart.length === 0 ? (
                      <div className="text-center py-8">
                        <ShoppingCart className="h-12 w-12 text-gray-300 mx-auto mb-3" />
                        <p className="text-gray-500">Your cart is empty</p>
                        <p className="text-sm text-gray-400">Add products by clicking on them</p>
                      </div>
                    ) : (
                      cart.map((item) => (
                        <motion.div
                          key={item.Id}
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, y: -10 }}
                          className="flex items-center gap-3 bg-gray-50 p-3 rounded-lg"
                        >
                          <div className="relative h-12 w-12 flex-shrink-0 bg-white rounded-md overflow-hidden">
                            <Image
                              src={item.Image || "/placeholder.svg"}
                              alt={item.Name}
                              fill
                              className="object-cover"
                            />
                          </div>
                          <div className="flex-1 min-w-0">
                            <h4 className="font-medium text-gray-900 text-sm line-clamp-1">{item.Name}</h4>
                            <p className="text-amber-600 font-bold text-sm">₱{item.Price.toFixed(2)}</p>
                          </div>
                          <div className="flex items-center gap-2">
                            <Button
                              variant="outline"
                              size="icon"
                              className="h-7 w-7"
                              onClick={() => updateCartItemQuantity(item.Id, item.Quantity - 1)}
                            >
                              <Minus className="h-3 w-3" />
                            </Button>
                            <span className="w-8 text-center">{item.Quantity}</span>
                            <Button
                              variant="outline"
                              size="icon"
                              className="h-7 w-7"
                              onClick={() => updateCartItemQuantity(item.Id, item.Quantity + 1)}
                            >
                              <Plus className="h-3 w-3" />
                            </Button>
                          </div>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-7 w-7 text-gray-400 hover:text-red-500"
                            onClick={() => removeFromCart(item.Id)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </motion.div>
                      ))
                    )}
                  </div>

                  {/* Cart Summary */}
                  <div className="space-y-3 border-t border-gray-200 pt-4">
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">Subtotal</span>
                      <span className="font-medium">₱{subtotal.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">Discount</span>
                      <span className="font-medium">₱{discount.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between text-lg font-bold">
                      <span>Total</span>
                      <span className="text-amber-600">₱{total.toFixed(2)}</span>
                    </div>
                  </div>

                  {/* Action Buttons */}
                  <div className="grid grid-cols-2 gap-3 mt-6">
                    <Button
                      variant="outline"
                      className="w-full"
                      onClick={() => setCart([])}
                      disabled={cart.length === 0}
                    >
                      Clear Cart
                    </Button>
                    <Button
                      className="w-full bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600"
                      disabled={cart.length === 0}
                      onClick={() => setIsCheckoutModalOpen(true)}
                    >
                      Checkout
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </main>

      {/* Product Detail Modal */}
      <Dialog open={isProductModalOpen} onOpenChange={setIsProductModalOpen}>
        <DialogContent className="sm:max-w-md max-h-screen overflow-y-auto py-2 my-10">
          <DialogHeader>
            <DialogTitle>Product Details</DialogTitle>
            <DialogDescription>View product information and add to cart</DialogDescription>
          </DialogHeader>

          {selectedProduct && (
            <div className="grid gap-4">
              <div className="relative aspect-video bg-gray-100 rounded-md overflow-hidden">
                <Image
                  src={selectedProduct.Image || "/placeholder.svg"}
                  alt={selectedProduct.Name}
                  fill
                  className="object-cover"
                />
              </div>

              <div className="grid gap-2">
                <div className="flex justify-between items-start">
                  <h3 className="text-xl font-bold text-gray-900">{selectedProduct.Name}</h3>
                  <Badge className="capitalize">{selectedProduct.Category}</Badge>
                </div>

                <p className="text-gray-600">{selectedProduct.Description}</p>

                <div className="flex justify-between items-center mt-2">
                  <div className="flex items-center gap-2">
                    <Tag className="h-4 w-4 text-amber-600" />
                    <span className="text-xl font-bold text-amber-600">₱{selectedProduct.Price.toFixed(2)}</span>
                  </div>

                  <div className="flex items-center gap-2">
                    <Package className="h-4 w-4 text-gray-600" />
                    <span className="text-sm text-gray-600">Stock: {selectedProduct.Stock}</span>
                  </div>
                </div>

                {selectedProduct.ExpiryDate && (
                  <div className="mt-2 border-t pt-2">
                    <div className="flex items-center gap-2">
                      <Info className="h-4 w-4 text-gray-600" />
                      <span className="text-sm text-gray-600">
                        Expiry Date: {new Date(selectedProduct.ExpiryDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                      </span>
                    </div>
                    {new Date(selectedProduct.ExpiryDate) < new Date() ? (
                      <Badge variant="outline" className="mt-1 bg-red-50 text-red-600 border-red-200">
                        Expired
                      </Badge>
                    ) : new Date(selectedProduct.ExpiryDate) < new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) ? (
                      <Badge variant="outline" className="mt-1 bg-amber-50 text-amber-600 border-amber-200">
                        Expires Soon
                      </Badge>
                    ) : null}
                  </div>
                )}
              </div>

              <div className="flex items-center gap-3 mt-2">
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => {
                    const existingItem = cart.find((item) => item.Id === selectedProduct.Id)
                    const currentQuantity = existingItem ? existingItem.Quantity : 0
                    if (currentQuantity > 0) {
                      updateCartItemQuantity(selectedProduct.Id, currentQuantity - 1)
                    }
                  }}
                >
                  <Minus className="h-4 w-4" />
                </Button>

                <span className="w-8 text-center">
                  {cart.find((item) => item.Id === selectedProduct.Id)?.Quantity || 0}
                </span>

                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => {
                    const existingItem = cart.find((item) => item.Id === selectedProduct.Id)
                    const currentQuantity = existingItem ? existingItem.Quantity : 0
                    updateCartItemQuantity(selectedProduct.Id, currentQuantity + 1)
                  }}
                >
                  <Plus className="h-4 w-4" />
                </Button>
              </div>
            </div>
          )}

          <DialogFooter className="flex flex-col sm:flex-row gap-2">
            <Button variant="outline" className="sm:flex-1" onClick={() => setIsProductModalOpen(false)}>
              Cancel
            </Button>
            <Button
              className="sm:flex-1 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600"
              onClick={() => {
                if (selectedProduct) {
                  addToCart(selectedProduct, 1)
                  setIsProductModalOpen(false)
                }
              }}
            >
              Add to Cart
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Checkout Modal */}
      <Dialog open={isCheckoutModalOpen} onOpenChange={setIsCheckoutModalOpen}>
        <DialogContent className="sm:max-w-md max-h-screen overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Checkout</DialogTitle>
            <DialogDescription>Complete the transaction</DialogDescription>
          </DialogHeader>

          <div className="grid gap-4">
            <Tabs defaultValue="cash" onValueChange={setPaymentMethod}>
              <TabsList className="grid grid-cols-2">
                <TabsTrigger value="cash">Cash Payment</TabsTrigger>
                <TabsTrigger value="credit">Member Credit</TabsTrigger>
              </TabsList>

              <TabsContent value="cash" className="space-y-4 pt-4">
                <div className="flex items-center space-x-2 mb-4">
                  <Checkbox
                    id="member-purchase"
                    checked={isMemberPurchase}
                    onCheckedChange={(checked) => {
                      setIsMemberPurchase(checked === true)
                      if (checked === false) {
                        setSelectedMember(null)
                        setMemberSearchQuery("")
                      }
                    }}
                  />
                  <label
                    htmlFor="member-purchase"
                    className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                  >
                    Member Purchase
                  </label>
                </div>

                {isMemberPurchase && (
                  <div className="mb-4 space-y-4 border-b pb-4">
                    <div className="grid gap-2">
                      <label className="text-sm font-medium">Search Member</label>
                      <Input
                        type="text"
                        placeholder="Enter member name or ID"
                        value={memberSearchQuery}
                        onChange={(e) => setMemberSearchQuery(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') {
                            handleMemberSearch()
                          }
                        }}
                      />
                      <Button variant="outline" size="sm" onClick={handleMemberSearch}>
                        Search
                      </Button>
                    </div>

                    {memberSearchQuery && (
                      <div className="max-h-40 overflow-y-auto border rounded-md">
                        {filteredMembers.length > 0 ? (
                          filteredMembers.map((member) => (
                            <div
                              key={member.Id}
                              className={`p-3 cursor-pointer hover:bg-gray-50 ${
                                selectedMember?.Id === member.Id ? "bg-amber-50" : ""
                              }`}
                              onClick={() => setSelectedMember(member)}
                            >
                              <div className="font-medium">{member.Name}</div>
                              <div className="text-sm text-gray-600">ID: {member.MemberId}</div>
                            </div>
                          ))
                        ) : (
                          <div className="p-3 text-center text-gray-500">No members found</div>
                        )}
                      </div>
                    )}

                    {selectedMember && (
                      <div className="border rounded-md p-3 bg-amber-50">
                        <div className="flex justify-between">
                          <span className="font-medium">{selectedMember.Name}</span>
                          <Badge>{selectedMember.MemberId}</Badge>
                        </div>
                        <div className="grid grid-cols-2 gap-2 mt-2 text-sm">
                          <div>
                            <span className="text-gray-600">Credit Limit:</span>
                            <span className="font-medium ml-1">₱{selectedMember.CreditLimit.toFixed(2)}</span>
                          </div>
                          <div>
                            <span className="text-gray-600">Current Credit:</span>
                            <span className="font-medium ml-1">₱{selectedMember.CurrentCredit.toFixed(2)}</span>
                          </div>
                        </div>
                        <div className="mt-2">
                          <span className="text-gray-600">Available Credit:</span>
                          <span className="font-medium ml-1">
                            ₱{(selectedMember.CreditLimit - selectedMember.CurrentCredit).toFixed(2)}
                          </span>
                        </div>
                      </div>
                    )}
                  </div>
                )}

                <div className="flex justify-between text-lg font-bold">
                  <span>Total Amount</span>
                  <span className="text-amber-600">₱{total.toFixed(2)}</span>
                </div>

                <div className="grid gap-2">
                  <label className="text-sm font-medium">Amount Received</label>
                  <Input
                    type="number"
                    placeholder="Enter amount"
                    value={cashAmount}
                    onChange={(e) => setCashAmount(e.target.value === "" ? "" : Number.parseFloat(e.target.value))}
                  />
                </div>

                <div className="flex justify-between text-lg font-bold">
                  <span>Change</span>
                  <span
                    className={
                      typeof cashAmount === "number" && cashAmount >= total ? "text-green-600" : "text-gray-400"
                    }
                  >
                    ₱{typeof cashAmount === "number" && cashAmount >= total ? (cashAmount - total).toFixed(2) : "0.00"}
                  </span>
                </div>
              </TabsContent>

              <TabsContent value="credit" className="space-y-4 pt-4">
                <div className="grid gap-2">
                  <label className="text-sm font-medium">Search Member</label>
                  <Input
                    type="text"
                    placeholder="Enter member name or ID"
                    value={memberSearchQuery}
                    onChange={(e) => setMemberSearchQuery(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        handleMemberSearch()
                      }
                    }}
                  />
                  <Button variant="outline" size="sm" onClick={handleMemberSearch}>
                    Search
                  </Button>
                </div>

                {memberSearchQuery && (
                  <div className="max-h-40 overflow-y-auto border rounded-md">
                    {filteredMembers.length > 0 ? (
                      filteredMembers.map((member) => (
                        <div
                          key={member.Id}
                          className={`p-3 cursor-pointer hover:bg-gray-50 ${
                            selectedMember?.Id === member.Id ? "bg-amber-50" : ""
                          }`}
                          onClick={() => setSelectedMember(member)}
                        >
                          <div className="font-medium">{member.Name}</div>
                          <div className="text-sm text-gray-600">ID: {member.MemberId}</div>
                        </div>
                      ))
                    ) : (
                      <div className="p-3 text-center text-gray-500">No members found</div>
                    )}
                  </div>
                )}

                {selectedMember && (
                  <div className="border rounded-md p-3 bg-amber-50">
                    <div className="flex justify-between">
                      <span className="font-medium">{selectedMember.Name}</span>
                      <Badge>{selectedMember.MemberId}</Badge>
                    </div>
                    <div className="grid grid-cols-2 gap-2 mt-2 text-sm">
                      <div>
                        <span className="text-gray-600">Credit Limit:</span>
                        <span className="font-medium ml-1">₱{selectedMember.CreditLimit.toFixed(2)}</span>
                      </div>
                      <div>
                        <span className="text-gray-600">Current Credit:</span>
                        <span className="font-medium ml-1">₱{selectedMember.CurrentCredit.toFixed(2)}</span>
                      </div>
                    </div>
                    <div className="mt-2">
                      <span className="text-gray-600">Available Credit:</span>
                      <span className="font-medium ml-1">
                        ₱{(selectedMember.CurrentCredit - selectedMember.CreditLimit).toFixed(2)}
                      </span>
                    </div>

                    {total > selectedMember.CurrentCredit - selectedMember.CreditLimit && (
                      <div className="mt-2 text-red-500 text-sm">
                        <Info className="h-4 w-4 inline mr-1" />
                        Insufficient credit available
                      </div>
                    )}
                  </div>
                )}
              </TabsContent>
            </Tabs>
          </div>

          <DialogFooter className="flex flex-col sm:flex-row gap-2">
            <Button variant="outline" className="sm:flex-1" onClick={() => setIsCheckoutModalOpen(false)}>
              Cancel
            </Button>
            <Button
              className="sm:flex-1 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600"
              onClick={handleCheckout}
              disabled={
                (paymentMethod === "credit" && !selectedMember) ||
                (paymentMethod === "credit" &&
                  selectedMember &&
                  total > selectedMember.CurrentCredit - selectedMember.CreditLimit) ||
                (paymentMethod === "cash" && (typeof cashAmount !== "number" || cashAmount < total)) ||
                (paymentMethod === "cash" && isMemberPurchase && !selectedMember)
              }
            >
              Complete Sale
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Receipt Modal */}
      <Dialog open={isReceiptModalOpen} onOpenChange={setIsReceiptModalOpen}>
        <DialogContent className="sm:max-w-md max-h-screen overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Receipt</DialogTitle>
            <DialogDescription>Transaction completed successfully</DialogDescription>
          </DialogHeader>

          {completedSale && (
            <div className="space-y-4">
              <div className="text-center border-b border-dashed border-gray-200 pb-4">
                <h3 className="font-bold text-xl">Pandol Cooperative</h3>
                <p className="text-gray-600 text-sm">Pandol, Corella, Bohol</p>
                <p className="text-gray-600 text-sm">Tel: +63 (38) 412-5678</p>
              </div>

              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Transaction ID:</span>
                <span className="font-medium">{completedSale.TransactionId}</span>
              </div>

              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Date & Time:</span>
                <span className="font-medium">{completedSale.Date}</span>
              </div>

              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Cashier:</span>
                <span className="font-medium">Cashier</span>
              </div>

              {completedSale.Member && (
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Member:</span>
                  <span className="font-medium">
                    {completedSale.Member} ({completedSale.MemberId})
                  </span>
                </div>
              )}

              <div className="border-t border-dashed border-gray-200 pt-4 mt-4">
                <h4 className="font-medium mb-2">Items</h4>
                <div className="space-y-2 max-h-60 overflow-y-auto">
                  {completedSale.Items.map((item) => (
                    <div key={item.Id} className="flex justify-between text-sm">
                      <div>
                        <span className="font-medium">{item.Name}</span>
                        <div className="text-gray-600">
                          {item.Quantity} x ₱{item.Price.toFixed(2)}
                        </div>
                      </div>
                      <span className="font-medium">₱{(item.Price * item.Quantity).toFixed(2)}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="border-t border-dashed border-gray-200 pt-4 space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Subtotal:</span>
                  <span>₱{completedSale.Subtotal.toFixed(2)}</span>
                </div>

                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Discount:</span>
                  <span>₱{completedSale.Discount.toFixed(2)}</span>
                </div>

                <div className="flex justify-between font-bold">
                  <span>Total:</span>
                  <span className="text-amber-600">₱{completedSale.Total.toFixed(2)}</span>
                </div>

                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Payment Method:</span>
                  <span className="capitalize">{completedSale.PaymentMethod}</span>
                </div>

                {completedSale.PaymentMethod === "cash" && (
                  <>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">Cash:</span>
                      <span>₱{completedSale.CashAmount.toFixed(2)}</span>
                    </div>

                    <div className="flex justify-between text-sm font-medium">
                      <span className="text-gray-600">Change:</span>
                      <span>₱{completedSale.Change.toFixed(2)}</span>
                    </div>
                  </>
                )}
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
                    Receipt being sent to {selectedMember?.Email}...
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
                setIsReceiptModalOpen(false);
                // Clear cart and reset state after closing
                setCart([]);
                setSelectedMember(null);
                setMemberSearchQuery("");
                setPaymentMethod("cash");
                setCashAmount("");
                setIsMemberPurchase(false);
                setEmailError(null);
              }}
            >
              Close
            </Button>
            <Button 
              variant="outline" 
              className="sm:flex-1" 
              onClick={() => window.print()}
            >
              <Printer className="h-4 w-4 mr-2" />
              Print
            </Button>
            <Button
              className="sm:flex-1 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600"
              onClick={handleSendReceipt}
              disabled={isEmailSent || !selectedMember?.Email}
            >
              {isEmailSent ? (
                <span className="flex items-center">
                  <span className="animate-spin mr-2">⏳</span> Sending...
                </span>
              ) : (
                <span className="flex items-center">
                  <Mail className="h-4 w-4 mr-2" /> Send Receipt
                </span>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
