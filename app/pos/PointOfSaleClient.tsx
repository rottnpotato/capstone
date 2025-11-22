"use client"

import { useState, useEffect, useMemo, useCallback } from "react"
import { motion, AnimatePresence } from "framer-motion" 
import { Search, X, Plus, Minus, Trash2, User, CreditCard, DollarSign, Printer, Mail, ShoppingCart, ChevronDown, ChevronUp, CheckCircle } from "lucide-react"
import { useToast } from "@/components/ui/use-toast"
import { Product, Member, getProducts, getCategories, searchProducts, getMembers, searchMembers, createTransaction, sendReceiptEmail, getProductsByCategory } from "./actions"
import { Navbar } from "@/components/ui/navbar"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter, DialogClose } from "@/components/ui/dialog"
import { Command, CommandInput, CommandEmpty, CommandGroup, CommandItem, CommandList } from "@/components/ui/command"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Card, CardContent } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import { Label } from "@/components/ui/label"
import Image from "next/image"
import { Badge } from "@/components/ui/badge"
import { getCurrentUserData, UserProfileData } from "@/app/actions/userActions"
import { Receipt } from "./Receipt"
import "./print.css"

export type CartItem = Product & { 
  quantity: number;
  selectedUnit: string;
  selectedUnitName: string;
  unitPrice: number;
  conversionFactor: number;
}

export interface CompletedTransaction {
  transactionId: string;
  member?: Member;
  items: CartItem[];
  subtotal: number;
  discount: number;
  manualDiscount: number;
  total: number;
  cashierName: string;
}

export default function PointOfSaleClient() {
  const [products, setProducts] = useState<Product[]>([])
  const [categories, setCategories] = useState<{ Id: string; Name: string }[]>([])
  const [activeCategory, setActiveCategory] = useState("all")
  const [cart, setCart] = useState<CartItem[]>([])
  const [searchQuery, setSearchQuery] = useState("")
  const [isLoading, setIsLoading] = useState(true)
  const [currentUser, setCurrentUser] = useState<UserProfileData | null>(null)

  // Member state
  const [members, setMembers] = useState<Member[]>([])
  const [selectedMember, setSelectedMember] = useState<Member | null>(null)
  const [memberSearch, setMemberSearch] = useState("")
  const [isMemberPopoverOpen, setMemberPopoverOpen] = useState(false)

  // Payment state
  const [isPaymentModalOpen, setPaymentModalOpen] = useState(false)
  const [paymentMethod, setPaymentMethod] = useState<"cash" | "credit">("cash")
  const [isProcessing, setIsProcessing] = useState(false)
  const [transactionComplete, setTransactionComplete] = useState<CompletedTransaction | null>(null)

  // Manual Discount State
  const [isDiscountModalOpen, setDiscountModalOpen] = useState(false)
  const [manualDiscount, setManualDiscount] = useState(0)
  const [discountInput, setDiscountInput] = useState("")

  // Unit Selection State
  const [isUnitSelectionOpen, setUnitSelectionOpen] = useState(false)
  const [productToSelectUnit, setProductToSelectUnit] = useState<Product | null>(null)

  const { toast } = useToast()

  const fetchInitialData = useCallback(async () => {
    setIsLoading(true)
    try {
      const [productsData, categoriesData, membersData, userData] = await Promise.all([
        getProducts(),
        getCategories(),
        getMembers(),
        getCurrentUserData(),
      ])
      setProducts(productsData)
      setCategories([{ Id: "all", Name: "all" }, ...categoriesData])
      setMembers(membersData)
      setCurrentUser(userData)
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to load initial POS data. Please refresh the page.",
        variant: "destructive",
      })
      console.error("Error fetching initial data:", error)
    } finally {
      setIsLoading(false)
    }
  }, [toast])

  useEffect(() => {
    fetchInitialData()
  }, [fetchInitialData])

  useEffect(() => {
    const fetchProductsByCategory = async () => {
      if (activeCategory === "all") {
        // When "all" is selected, fetch all products
        const productsData = await getProducts();
        setProducts(productsData);
      } else if (activeCategory) {
        // Avoid fetching for "all" as it's handled by getProducts()
        const productsData = await getProductsByCategory(activeCategory);
        setProducts(productsData);
      }
    };
    fetchProductsByCategory();
  }, [activeCategory]);

  const handleSearch = async (query: string) => {
    setSearchQuery(query)
    if (query.trim() === "") {
      const productsData = await getProducts()
      setProducts(productsData)
      return
    }
    try {
      const results = await searchProducts(query)
      setProducts(results)
    } catch (error) {
      toast({
        title: "Search Error",
        description: "Could not perform search. Please try again.",
        variant: "destructive",
      })
    }
  }

  const addToCart = (product: Product) => {
    if (product.productUnits && product.productUnits.length > 0) {
      setProductToSelectUnit(product);
      setUnitSelectionOpen(true);
    } else {
      addItemToCart(product, 'base', product.unit || 'pcs', product.Price, 1);
    }
  }

  const addItemToCart = (product: Product, unitId: string, unitName: string, price: number, factor: number) => {
    setCart((prevCart) => {
      const existingItem = prevCart.find((item) => item.Id === product.Id && item.selectedUnit === unitId)
      if (existingItem) {
        return prevCart.map((item) =>
          item.Id === product.Id && item.selectedUnit === unitId ? { ...item, quantity: item.quantity + 1 } : item
        )
      }
      return [...prevCart, { 
        ...product, 
        quantity: 1,
        selectedUnit: unitId,
        selectedUnitName: unitName,
        unitPrice: price,
        conversionFactor: factor,
        Price: price // Override price for calculations
      }]
    })
  }

  const updateQuantity = (productId: string, newQuantity: number, unitId?: string) => {
    setCart((prevCart) => {
      if (newQuantity <= 0) {
        return prevCart.filter((item) => !(item.Id === productId && (unitId ? item.selectedUnit === unitId : true)))
      }
      return prevCart.map((item) =>
        item.Id === productId && (unitId ? item.selectedUnit === unitId : true) ? { ...item, quantity: newQuantity } : item
      )
    })
  }

  const removeFromCart = (productId: string, unitId?: string) => {
    setCart((prevCart) => prevCart.filter((item) => !(item.Id === productId && (unitId ? item.selectedUnit === unitId : true))))
  }

  const clearCart = () => {
    setCart([])
  }

  const subtotal = useMemo(() => {
    return cart.reduce((sum, item) => sum + item.Price * item.quantity, 0)
  }, [cart])

    const discount = useMemo(() => {
    return 0;
  }, [cart]);

  const total = useMemo(() => {
    return cart.reduce((sum, item) => sum + item.Price * item.quantity, 0) - manualDiscount;
  }, [cart, manualDiscount]);

  const handleMemberSearch = async (query: string) => {
    setMemberSearch(query)
    if (query.trim() === "") {
      const membersData = await getMembers()
      setMembers(membersData)
      return
    }
    const results = await searchMembers(query)
    setMembers(results)
  }

  const handleSelectMember = (member: Member) => {
    setSelectedMember(member)
    setMemberPopoverOpen(false)
    setMemberSearch("")
  }

  const handleProcessPayment = async () => {
     console.log("handleProcessPayment called.");
    if (!currentUser) {
      console.error("Current user is not set. Aborting payment.");
      toast({ title: "Error", description: "User not identified.", variant: "destructive" })
      return
    }

    setIsProcessing(true);
    if (paymentMethod === "credit" && !selectedMember) {
      toast({ 
        title: "Credit Payment Error",
        description: "A member must be selected for credit payments.",
        variant: "destructive",
      });
      setIsProcessing(false);
      return
    }

    if (paymentMethod === "credit" && selectedMember && total > selectedMember.CreditLimit - selectedMember.CurrentCredit) {
      toast({
        title: "Credit Limit Exceeded",
        description: `This purchase exceeds the member's available credit.`,
        variant: "destructive",
      });
      setIsProcessing(false);
      return
    }
    console.log("Pre-conditions passed. Attempting to set isProcessing to true.");

    try {
      const transactionData = {
        items: cart.map(item => ({ ProductId: parseInt(item.Id), Quantity: item.quantity, Price: item.Price, basePrice: item.basePrice })),
        totalAmount: total,
        paymentMethod,
        userId: currentUser.userId,
        memberId: selectedMember ? parseInt(selectedMember.Id) : undefined,
        manualDiscount: manualDiscount,
      }

      console.log("Transaction data prepared:", transactionData);
      const result = await createTransaction(
        transactionData.items,
        transactionData.totalAmount,
        transactionData.paymentMethod,
        transactionData.userId,
        transactionData.memberId,
        transactionData.manualDiscount
      )

      console.log("Result from createTransaction:", result);
      if (result.success && result.transactionId) {
        toast({
          title: "Transaction Successful",
          description: `Transaction ID: ${result.transactionId}`,
        })
        setTransactionComplete({
          transactionId: result.transactionId,
          member: selectedMember || undefined,
          items: cart,
          subtotal: subtotal,
          discount: discount,
          manualDiscount: manualDiscount,
          total: total,
          cashierName: currentUser.name,
        })
        setPaymentModalOpen(false)
      } else {
        console.log("Transaction failed, but no explicit error message from result.");
        throw new Error(result.error || "An unknown error occurred.")
      }
    } catch (error: any) {
      console.error("Transaction failed:", error)
      toast({
        title: "Transaction Failed",
        description: error.message || "Could not process the transaction.",
        variant: "destructive",
      })
      console.log("Caught error during transaction:", error);
      setPaymentModalOpen(false); // Close modal on failure to avoid getting stuck
    } finally {
      setIsProcessing(false)
    }
  }

  const handleSendReceipt = async () => {
    if (!transactionComplete || !transactionComplete.member) {
      toast({ title: "Error", description: "No member associated with this transaction.", variant: "destructive" })
      return
    }

    setIsProcessing(true)
    try {
      const result = await sendReceiptEmail(
        transactionComplete.transactionId,
        transactionComplete.member.Email,
        transactionComplete.member.Name
      )

      if (result.success) {
        toast({
          title: "Receipt Sent",
          description: `Email receipt sent to ${transactionComplete.member.Email}.`,
        })
      } else {
        throw new Error(result.error || "Failed to send receipt.")
      }
    } catch (error: any) {
      console.error("Failed to send receipt:", error)
      toast({
        title: "Failed to Send Receipt",
        description: error.message,
        variant: "destructive",
      })
    } finally {
      setIsProcessing(false)
    }
  }

  const resetPOS = () => {
    clearCart()
    setSelectedMember(null)
    setTransactionComplete(null)
    setManualDiscount(0)
    setDiscountInput("")
    setPaymentMethod("cash")
    // fetchInitialData() // This is inefficient. We will update stock locally.
  }

  const handlePrintReceipt = () => {
    window.print();
  };

  const applyManualDiscount = () => {
    const value = parseFloat(discountInput)
    if (isNaN(value) || value < 0) {
      toast({ title: "Invalid Discount", description: "Please enter a valid positive number.", variant: "destructive" })
      return
    }
    if (value > subtotal) {
      toast({ title: "Invalid Discount", description: "Discount cannot be greater than the subtotal.", variant: "destructive" })
      return
    }
    setManualDiscount(value)
    setDiscountModalOpen(false)
    toast({ title: "Discount Applied", description: `₱${value.toFixed(2)} discount has been applied.` })
  }




  if (isLoading) {
    return (
      <div className="flex h-screen items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-amber-500 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading Point of Sale...</p>
        </div>
      </div>
    )
  }

  return (
    <>
      <div className="h-screen bg-gray-50 flex flex-col screen-only">
        <Navbar userType="cashier" userName={currentUser?.name || "Cashier"} />
      <main className="flex-grow pt-16 flex">
        {/* Main content */}
        <div className="flex-grow flex flex-col">
          {/* Search and Categories */}
          <div className="p-4 bg-white border-b border-gray-200">
            <div className="flex items-center gap-4">
              <div className="relative flex-grow">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                <Input
                  placeholder="Search for products..."
                  className="pl-10"
                  value={searchQuery}
                  onChange={(e) => handleSearch(e.target.value)}
                />
              </div>
              <div className="flex items-center gap-2 overflow-x-auto pb-2">
                {categories.map((category) => (
                  <Button
                    key={category.Id}
                    variant={activeCategory === category.Id ? "default" : "outline"}
                    onClick={() => setActiveCategory(category.Id)}
                    className="capitalize shrink-0"
                  >
                    {category.Name}
                  </Button>
                ))}
              </div>
            </div>
          </div>

          {/* Product Grid */}
          <ScrollArea className="flex-grow">
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4 p-4">
              <AnimatePresence>
                {products.map((product) => (
                  <motion.div
                    key={product.Id}
                    layout
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.9 }}
                    transition={{ duration: 0.2 }}
                  >
                    <Card
                      onClick={() => addToCart(product)}
                      className="cursor-pointer hover:shadow-lg transition-shadow h-full flex flex-col"
                    >
                      <div className="relative w-full h-32">
                        <Image
                          src={product.Image || "/placeholder.svg"}
                          alt={product.Name}
                          fill
                          sizes="(max-width: 768px) 50vw, (max-width: 1200px) 33vw, 20vw"
                          className="object-cover rounded-t-lg"
                        />
                        {product.discountValue && product.discountValue > 0 && (
                           <Badge variant="destructive" className="absolute top-2 left-2">SALE</Badge>
                        )}
                      </div>
                      <CardContent className="p-4 flex-grow flex flex-col justify-between">
                        <div className="flex-grow">
                          <h3 className="font-semibold text-sm leading-tight capitalize">{product.Name}</h3>
                          <p className="text-xs text-gray-500">{product.Category}</p>
                        </div>
                        <div className="mt-2 text-right">
                          {product.discountValue && product.discountValue > 0 ? (
                            <div className="flex flex-col items-end">
                              {/* <p className="text-xs text-gray-500 line-through">₱{product.basePrice.toFixed(2)}</p> */}
                              <p className="font-bold text-lg text-red-600">₱{product.Price.toFixed(2)}</p>
                            </div>
                          ) : (
                            <p className="font-bold text-lg">₱{product.Price.toFixed(2)}</p>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>
          </ScrollArea>
        </div>

        {/* Cart / Order Summary */}
        <div className="w-full max-w-sm bg-white border-l border-gray-200 flex flex-col">
          <div className="p-4 border-b">
            <h2 className="text-xl font-bold flex items-center">
              <ShoppingCart className="mr-2 h-5 w-5" />
              Current Order
            </h2>
          </div>

          {/* Member Selection */}
          <div className="p-4 border-b">
            <Popover open={isMemberPopoverOpen} onOpenChange={setMemberPopoverOpen}>
              <PopoverTrigger asChild>
                <Button variant="outline" className="w-full justify-between">
                  {selectedMember ? (
                    <>
                      <span className="flex items-center">
                        <User className="mr-2 h-4 w-4" />
                        {selectedMember.Name}
                      </span>
                      <X className="h-4 w-4" onClick={(e) => { e.stopPropagation(); setSelectedMember(null); }} />
                    </>
                  ) : (
                    "Select Member (Optional)"
                  )}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-[350px] p-0" align="start">
                <Command>
                  <CommandInput
                    placeholder="Search member..."
                    value={memberSearch}
                    onValueChange={handleMemberSearch}
                  />
                  <CommandList>
                    <CommandEmpty>No member found.</CommandEmpty>
                    <CommandGroup>
                      {members.map((member) => (
                        <CommandItem
                          key={member.Id}
                          onSelect={() => handleSelectMember(member)}
                        >
                          {member.Name}
                        </CommandItem>
                      ))}
                    </CommandGroup>
                  </CommandList>
                </Command>
              </PopoverContent>
            </Popover>
            {selectedMember && (
              <div className="text-xs text-gray-600 mt-2">
                <p>Credit Limit: ₱{selectedMember.CreditLimit.toFixed(2)}</p>
                <p>Available Credit: ₱{(selectedMember.CreditLimit - selectedMember.CurrentCredit).toFixed(2)}</p>
              </div>
            )}
          </div>

          <ScrollArea className="flex-grow">
            {cart.length === 0 ? (
              <div className="p-8 text-center text-gray-500">
                <p>Your cart is empty.</p>
                <p className="text-sm">Click on products to add them to the order.</p>
              </div>
            ) : (
              <div className="divide-y">
                {cart.map((item, idx) => (
                  <div key={`${item.Id}-${item.selectedUnit}-${idx}`} className="p-4 flex items-center">
                    <div className="flex-grow">
                      <p className="font-medium capitalize">{item.Name}</p>
                      <p className="text-xs text-gray-500">{item.selectedUnitName}</p>
                      <p className="text-sm text-gray-500">₱{item.Price.toFixed(2)}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button variant="outline" size="icon" className="h-7 w-7" onClick={() => updateQuantity(item.Id, item.quantity - 1, item.selectedUnit)}>
                        <Minus className="h-4 w-4" />
                      </Button>
                      <Input 
                        type="number" 
                        className="w-16 h-8 text-center p-1 mx-1" 
                        defaultValue={item.quantity} 
                        onBlur={(e) => updateQuantity(item.Id, parseFloat(e.target.value), item.selectedUnit)}
                        key={item.quantity}
                        min="0"
                        step="0.01"
                      />
                      <Button variant="outline" size="icon" className="h-7 w-7" onClick={() => updateQuantity(item.Id, item.quantity + 1, item.selectedUnit)}>
                        <Plus className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="icon" className="h-7 w-7 text-red-500" onClick={() => removeFromCart(item.Id, item.selectedUnit)}>
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </ScrollArea>

          {cart.length > 0 && (
            <div className="p-4 border-t bg-gray-50">
              <div className="space-y-2 mb-4">
                <div className="flex justify-between items-center text-sm">
                  <span>Subtotal</span>
                  <span>₱{(subtotal + discount).toFixed(2)}</span>
                </div>
                {discount > 0 && (
                  <div className="flex justify-between items-center text-sm text-red-600">
                    <span>Discount</span>
                    <span>- ₱{discount.toFixed(2)}</span>
                  </div>
                )}
                {manualDiscount > 0 && (
                  <div className="flex justify-between items-center text-sm text-blue-600">
                    <span>Manual Discount</span>
                    <span>- ₱{manualDiscount.toFixed(2)}</span>
                  </div>
                )}
                <Separator />
                <div className="flex justify-between items-center font-bold text-2xl">
                  <span>Total</span>
                  <span>₱{total.toFixed(2)}</span>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <Button variant="outline" onClick={() => setDiscountModalOpen(true)}>
                  Add Discount
                </Button>
                <Button variant="outline" onClick={clearCart}>Clear Cart</Button>
              </div>
              <div className="grid grid-cols-1 gap-2 mt-2">
                <Button
                  className="bg-gradient-to-r from-amber-500 to-orange-500"
                  onClick={() => setPaymentModalOpen(true)}
                >
                  Checkout
                </Button>
              </div>
            </div>
          )}
        </div>
      </main>

      {/* Unit Selection Modal */}
      <Dialog open={isUnitSelectionOpen} onOpenChange={setUnitSelectionOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Select Unit</DialogTitle>
            <DialogDescription>
              Choose the unit for {productToSelectUnit?.Name}
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            {productToSelectUnit && (
              <>
                <Button 
                  variant="outline" 
                  className="justify-between h-auto py-3"
                  onClick={() => {
                    addItemToCart(productToSelectUnit, 'base', productToSelectUnit.unit || 'pcs', productToSelectUnit.Price, 1);
                    setUnitSelectionOpen(false);
                  }}
                >
                  <div className="text-left">
                    <div className="font-medium">{productToSelectUnit.unit || 'Base Unit'}</div>
                    <div className="text-xs text-gray-500">1 {productToSelectUnit.unit}</div>
                  </div>
                  <div className="font-bold">₱{productToSelectUnit.Price.toFixed(2)}</div>
                </Button>
                
                {productToSelectUnit.productUnits && productToSelectUnit.productUnits.map((u: any) => (
                  <Button 
                    key={u.id} 
                    variant="outline" 
                    className="justify-between h-auto py-3"
                    onClick={() => {
                      // Calculate price if not set
                      const price = u.price || (productToSelectUnit.Price * u.conversionFactor);
                      addItemToCart(productToSelectUnit, u.id, u.name, price, u.conversionFactor);
                      setUnitSelectionOpen(false);
                    }}
                  >
                    <div className="text-left">
                      <div className="font-medium">{u.name}</div>
                      <div className="text-xs text-gray-500">{u.conversionFactor} {productToSelectUnit.unit}</div>
                    </div>
                    <div className="font-bold">₱{(u.price || (productToSelectUnit.Price * u.conversionFactor)).toFixed(2)}</div>
                  </Button>
                ))}
              </>
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* Payment Modal */}
      <Dialog open={isPaymentModalOpen} onOpenChange={setPaymentModalOpen}>
        <DialogContent onPointerDownOutside={(e) => e.preventDefault()}>
          <DialogHeader>
            <DialogTitle>Complete Payment</DialogTitle>
            <DialogDescription>
              Select a payment method and confirm the transaction.
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <div className="text-center mb-6">
              <p className="text-lg text-gray-600">Total Amount</p>
              <p className="text-5xl font-bold">₱{total.toFixed(2)}</p>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <Button
                variant={paymentMethod === "cash" ? "default" : "outline"}
                className="py-6 text-lg"
                onClick={() => setPaymentMethod("cash")}
              >
                <span className="mr-2 font-bold text-xl">₱</span> Cash
              </Button>
              <Button
                variant={paymentMethod === "credit" ? "default" : "outline"}
                className="py-6 text-lg"
                onClick={() => setPaymentMethod("credit")}
                disabled={!selectedMember}
              >
                <CreditCard className="mr-2" /> Credit
              </Button>
            </div>
            {!selectedMember && (
              <p className="text-center text-sm text-red-500 mt-2">Select a member to enable credit payment.</p>
            )}
          </div>
          <DialogFooter>
            <DialogClose asChild>
              <Button variant="ghost" disabled={isProcessing}>Cancel</Button>
            </DialogClose>
            <Button
              onClick={handleProcessPayment}
              disabled={isProcessing}
              className="bg-gradient-to-r from-green-500 to-emerald-500"
            >
              {isProcessing ? "Processing..." : "Confirm Payment"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Transaction Complete Modal */}
      <Dialog open={!!transactionComplete} onOpenChange={() => resetPOS()}>
        <DialogContent onPointerDownOutside={(e) => e.preventDefault()}>
          <DialogHeader>
            <DialogTitle>Transaction Complete</DialogTitle>
            <DialogDescription>
              The transaction was successful. You can now start a new transaction or print a receipt.
            </DialogDescription>
          </DialogHeader>
          <div className="py-4 text-center">
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ type: "spring", stiffness: 260, damping: 20 }}
              className="mx-auto h-20 w-20 rounded-full bg-green-100 flex items-center justify-center mb-4"
            >
              <CheckCircle className="h-12 w-12 text-green-600" />
            </motion.div>
            <p className="text-lg font-medium">Payment was successful!</p>
            <p className="text-sm text-gray-500">Transaction ID: {transactionComplete?.transactionId}</p>
          </div>
          <DialogFooter className="sm:justify-between">
            <div className="flex gap-2">
              <Button variant="outline" onClick={handlePrintReceipt}>
                <Printer className="mr-2 h-4 w-4" /> Print Receipt
              </Button>
              {transactionComplete?.member && (
                <Button variant="outline" onClick={handleSendReceipt} disabled={isProcessing}>
                  <Mail className="mr-2 h-4 w-4" /> Email Receipt
                </Button>
              )}
            </div>
            <Button onClick={resetPOS}>
              Next Transaction
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      {/* Manual Discount Modal */}
      <Dialog open={isDiscountModalOpen} onOpenChange={setDiscountModalOpen}>
        <DialogContent onPointerDownOutside={(e) => e.preventDefault()}>
          <DialogHeader>
            <DialogTitle>Apply Manual Discount</DialogTitle>
            <DialogDescription>
              Enter a fixed amount to discount from the total.
            </DialogDescription>
          </DialogHeader>
          <div className="py-4 space-y-4">
            <div className="grid gap-2">
              <Label htmlFor="discount-amount">Discount Amount (₱)</Label>
              <Input
                id="discount-amount"
                type="number"
                placeholder="e.g., 10.00"
                value={discountInput}
                onChange={(e) => setDiscountInput(e.target.value)}
              />
            </div>
          </div>
          <DialogFooter>
            <DialogClose asChild>
              <Button variant="ghost">Cancel</Button>
            </DialogClose>
            <Button onClick={applyManualDiscount}>Apply Discount</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      </div>
      {/* Receipt component for printing. It's not visible on screen due to print.css */}
      <div id="receipt-container">
        <Receipt data={transactionComplete} />
      </div>
    </>
  )
}