"use client"

import { useState, useEffect, useRef } from "react"
import { motion } from "framer-motion"
import { Navbar } from "@/components/ui/navbar"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button, buttonVariants } from "@/components/ui/button"
import { Package, Search, Plus, ArrowUpDown, MoreHorizontal, Edit, Trash2, AlertCircle, Barcode, Archive } from "lucide-react"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import Image from "next/image"
import {
  DollarSign,
  TrendingUp,
  Package2,
  TrendingDown,
  FileText,
  Download,
} from "lucide-react"
import Link from "next/link"
import { toast } from "@/components/ui/use-toast"

// Product type definition
interface Product {
  id: number
  name: string
  price: number
  basePrice: number
  profitType: "percentage" | "fixed"
  profitValue: number
  discountType?: "percentage" | "fixed" // Added discount type
  discountValue?: number // Added discount value
  category: string
  image: string
  sku: string
  stock: number
  description: string
  supplier: string
  lastRestocked: string
  expiryDate?: string | null
  isActive?: boolean
}

// Form state type definition
interface ProductFormState {
  name: string;
  price: string;
  basePrice: string;
  profitType: "percentage" | "fixed";
  profitValue: string;
  discountType: "percentage" | "fixed";
  discountValue: string;
  category: string;
  sku: string;
  stock: string;
  description: string;
  supplier: string;
  image: string;
  expiryDate: string; // Assuming date input is string
  isActive: boolean;
}

// Inserted API response type for product listing
interface ProductsApiResponse {
  status: 'success' | 'error'
  products: Product[]
  message?: string
}

// Helper functions for date handling, moved outside the component
const formatDate = (dateString: string | null | undefined) => {
  if (!dateString) return null;
  
  try {
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return null;
    
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  } catch (error) {
    console.error('Error formatting date:', error);
    return null;
  }
};

const isExpired = (dateString: string | null | undefined) => {
  if (!dateString) return false;
  const date = new Date(dateString);
  return !isNaN(date.getTime()) && date < new Date();
};

const isExpiringSoon = (dateString: string | null | undefined) => {
  if (!dateString) return false;
  const date = new Date(dateString);
  if (isNaN(date.getTime())) return false;
  const today = new Date();
  const sevenDaysFromNow = new Date();
  sevenDaysFromNow.setDate(today.getDate() + 7);
  return date > today && date <= sevenDaysFromNow;
};

// New helper function to get product status, similar to Filament's badgeable column logic
const getProductStatus = (product: Product) => {
  if (product.isActive === false) {
    return {
      label: "Archived",
      color: "bg-gray-100 text-gray-600 border-gray-200",
      priority: 3,
    };
  }
  if (product.expiryDate) {
    if (isExpired(product.expiryDate)) {
      return {
        label: `Expired on ${formatDate(product.expiryDate)}`,
        color: "bg-red-50 text-red-600 border-red-200",
        priority: 0,
      };
    }
    if (isExpiringSoon(product.expiryDate)) {
      return {
        label: `Expires on ${formatDate(product.expiryDate)}`,
        color: "bg-amber-50 text-amber-600 border-amber-200",
        priority: 1,
      };
    }
  }
  return { label: "Active", color: "bg-green-50 text-green-600 border-green-200", priority: 2 };
};

export default function AdminInventoryPage() {
  const [searchQuery, setSearchQuery] = useState("")
  const [categoryFilter, setCategoryFilter] = useState("all")
  const [sortBy, setSortBy] = useState("name")
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("asc")
  const [isAddProductModalOpen, setIsAddProductModalOpen] = useState(false)
  const [isEditProductModalOpen, setIsEditProductModalOpen] = useState(false)
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null)
  const [isDeleteConfirmOpen, setIsDeleteConfirmOpen] = useState(false)
  
  // New states for API integration
  const [products, setProducts] = useState<Product[]>([])
  const [categories, setCategories] = useState<string[]>(["all"])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [lowStockCount, setLowStockCount] = useState(0)
  
  // New state for inventory summary
  const [inventorySummary, setInventorySummary] = useState({
    totalValue: 0,
    totalProfit: 0,
    totalStock: 0,
  })

  // Form states for Add Product
  const addFileInputRef = useRef<HTMLInputElement>(null);
  const [validationErrors, setValidationErrors] = useState<Partial<Record<keyof ProductFormState, string>>>({});
  const [newProduct, setNewProduct] = useState<ProductFormState>({
    name: "",
    price: "",
    basePrice: "",
    profitType: "percentage",
    profitValue: "",
    discountType: "percentage", // Added
    discountValue: "", // Added
    category: "",
    sku: "",
    stock: "",
    description: "",
    supplier: "",
    image: "/placeholder.svg",
    expiryDate: "",
    isActive: true
  })
  
  // Form states for Edit Product
  const editFileInputRef = useRef<HTMLInputElement>(null);
  const [editedProduct, setEditedProduct] = useState<ProductFormState>({
    name: "",
    price: "",
    basePrice: "",
    profitType: "percentage",
    profitValue: "",
    discountType: "percentage", // Added
    discountValue: "", // Added
    category: "",
    sku: "",
    stock: "",
    description: "",
    supplier: "",
    image: "",
    expiryDate: "",
    isActive: true
  })
  
  // Add function to check for products near expiration
  const checkForNearExpiryProducts = (productsList: Product[]) => {
    const nearExpiryProducts = productsList.filter(product => 
      product.expiryDate && isExpiringSoon(product.expiryDate) && !isExpired(product.expiryDate)
    );
    
    if (nearExpiryProducts.length > 0) {
      toast({
        title: "Products Expiring Soon",
        description: `${nearExpiryProducts.length} product(s) will expire soon. Check inventory for details.`,
        variant: "destructive",
      });
    }
    
    const expiredProducts = productsList.filter(product => 
      product.expiryDate && isExpired(product.expiryDate)
    );
    
    if (expiredProducts.length > 0) {
      toast({
        title: "Expired Products",
        description: `${expiredProducts.length} product(s) have expired. Please remove from inventory.`,
        variant: "destructive",
      });
    }
  };
  
  // Calculate price based on base price and profit settings
  const calculatePrice = (
    basePrice: string,
    profitType: "percentage" | "fixed",
    profitValue: string,
    discountType: "percentage" | "fixed", // Added
    discountValue: string // Added
  ): number => {
    const basePriceNum = parseFloat(basePrice);
    const profitValueNum = parseFloat(profitValue) || 0;

    if (isNaN(basePriceNum)) {
      return 0;
    }

    let calculatedPrice;
    if (profitType === "percentage") {
      calculatedPrice = basePriceNum * (1 + profitValueNum / 100);
    } else {
      calculatedPrice = basePriceNum + profitValueNum;
    }

    // Apply discount
    const discountValueNum = parseFloat(discountValue) || 0;
    if (discountValueNum > 0) {
      if (discountType === "percentage") {
        calculatedPrice *= 1 - discountValueNum / 100;
      } else {
        calculatedPrice -= discountValueNum;
      }
    }

    return Math.max(0, calculatedPrice); // Ensure price doesn't go below zero
  }
  
  // Handle profit type or value change to recalculate price for new product
  const handleProfitChange = (type: string, value: string) => {
    const newProfitType = type || newProduct.profitType;
    const newProfitValue = value || newProduct.profitValue;
    
    const calculatedPrice = calculatePrice( // No longer needs explicit cast here
      newProduct.basePrice,
      newProfitType as "percentage" | "fixed",
      newProfitValue,
      newProduct.discountType,
      newProduct.discountValue
    );
    
    setNewProduct({
      ...newProduct,
      profitType: newProfitType as "percentage" | "fixed",
      profitValue: newProfitValue,
      price: calculatedPrice.toFixed(2)
    });
  }
  
  // Handle base price change to recalculate price for new product
  const handleBasePriceChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { value } = e.target;
    const calculatedPrice = calculatePrice(
      value,
      newProduct.profitType,
      newProduct.profitValue,
      newProduct.discountType,
      newProduct.discountValue
    );
    
    setNewProduct({
      ...newProduct,
      basePrice: value,
      price: calculatedPrice.toFixed(2)
    });
  }
  
  // Handle discount type or value change to recalculate price for new product
  const handleDiscountChange = (type: string, value: string) => {
    const newDiscountType = type || newProduct.discountType;
    const newDiscountValue = value || newProduct.discountValue;

    const calculatedPrice = calculatePrice(
      newProduct.basePrice,
      newProduct.profitType,
      newProduct.profitValue,
      newDiscountType as "percentage" | "fixed", // Explicitly cast to the union type
      newDiscountValue
    );

    setNewProduct({
      ...newProduct,
      discountType: newDiscountType as "percentage" | "fixed",
      discountValue: newDiscountValue,
      price: calculatedPrice.toFixed(2)
    });
  }

  // Handle profit type or value change to recalculate price for edited product
  const handleEditProfitChange = (type: string, value: string) => {
    const newProfitType = (type || editedProduct.profitType); // No longer needs explicit cast here
    const newProfitValue = value || editedProduct.profitValue;
    
    const calculatedPrice = calculatePrice(
      editedProduct.basePrice,
      newProfitType as "percentage" | "fixed", // Cast needed here as `type` is string
      newProfitValue,
      editedProduct.discountType,
      editedProduct.discountValue
    );
    
    setEditedProduct({
      ...editedProduct,
      profitType: newProfitType as "percentage" | "fixed",
      profitValue: newProfitValue,
      price: calculatedPrice.toFixed(2)
    });
  }
  
  // Handle base price change to recalculate price for edited product
  const handleEditBasePriceChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { value } = e.target;
    const calculatedPrice = calculatePrice(
      value,
      editedProduct.profitType,
      editedProduct.profitValue,
      editedProduct.discountType,
      editedProduct.discountValue
    );
    
    setEditedProduct({
      ...editedProduct,
      basePrice: value,
      price: calculatedPrice.toFixed(2)
    });
  }
    // Helper function to get a numerical priority for sorting statuses

 const getStatusPriority = (product: Product): number => {
    return getProductStatus(product).priority;
  };

// Handle discount type or value change to recalculate price for edited product
  const handleEditDiscountChange = (type: string, value: string) => {
    const newDiscountType = (type || editedProduct.discountType); // No longer needs explicit cast here
    const newDiscountValue = value || editedProduct.discountValue;

    const calculatedPrice = calculatePrice(
      editedProduct.basePrice,
      editedProduct.profitType,
      editedProduct.profitValue,
      newDiscountType as "percentage" | "fixed", // Cast needed here as `type` is string
      newDiscountValue
    );

    setEditedProduct({
      ...editedProduct,
      discountType: newDiscountType as "percentage" | "fixed",
      discountValue: newDiscountValue,
      price: calculatedPrice.toFixed(2)
    });
  }

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>, isEditing: boolean) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        const result = reader.result as string;
        if (isEditing) {
          setEditedProduct(prev => ({ ...prev, image: result }));
        } else {
          setNewProduct(prev => ({ ...prev, image: result }));
        }
      };
      reader.readAsDataURL(file);
    }
  };

  // Reset image when modal closes
  useEffect(() => {
    if (!isEditProductModalOpen && selectedProduct) setEditedProduct(prev => ({ ...prev, image: selectedProduct.image }));
  }, [isEditProductModalOpen, selectedProduct]);
  // Load products on component mount
  useEffect(() => {
    const fetchProducts = async () => {
      setIsLoading(true)
      try {
        const response = await fetch('/api/products')
        const data = (await response.json()) as ProductsApiResponse
        
        if (data.status === 'success') {
          setProducts(data.products)
          
          // Extract unique categories
          const uniqueCategories = ["all", ...Array.from(new Set(data.products.map((product: Product) => product.category)))]
          setCategories(uniqueCategories)
          
          // Count low stock items
          const lowStock = data.products.filter((product: Product) => product.stock < 10).length
          setLowStockCount(lowStock)
          
          // Check for products near expiration
          checkForNearExpiryProducts(data.products)

          // Calculate inventory summary
          const totalValue = data.products.reduce((sum: number, p: Product) => sum + p.price * p.stock, 0)
          const totalProfit = data.products.reduce((sum: number, p: Product) => sum + (p.price - p.basePrice) * p.stock, 0)
          const totalStock = data.products.reduce((sum: number, p: Product) => sum + p.stock, 0)
          setInventorySummary({
            totalValue,
            totalProfit,
            totalStock,
          })
        } else {
          setError(data.message || 'Failed to fetch products')
        }
      } catch (err) {
        setError('Error loading products. Please try again later.')
        console.error('Error fetching products:', err)
      } finally {
        setIsLoading(false)
      }
    }
    
    fetchProducts()
  }, [])

  // Filter and sort products
  const filteredProducts = products
    .filter((product) => {
      const matchesSearch =
        product.name.toLowerCase().includes(searchQuery.toLowerCase()) || product.sku.includes(searchQuery)
      const matchesCategory = categoryFilter === "all" || product.category === categoryFilter
      return matchesSearch && matchesCategory
    })
    .sort((a, b) => {
      let comparison = 0

      switch (sortBy) {
        case "name":
          comparison = a.name.localeCompare(b.name)
          break
        case "price":
          comparison = a.price - b.price
          break
        case "stock":
          comparison = a.stock - b.stock
          break
        case "status":
          const statusA = getStatusPriority(a);
          const statusB = getStatusPriority(b);
          comparison = statusA - statusB;
          break
        case "category":
          comparison = a.category.localeCompare(b.category)
          break
        default:
          comparison = 0
      }

      return sortOrder === "asc" ? comparison : -comparison
    })

  // Handle edit product
  const handleEditProduct = (product: Product) => {
    if (!product) {
      console.error("handleEditProduct: product is null or undefined");
      return;
    }
    setSelectedProduct(product)
    setEditedProduct({
      name: product.name ?? "",
      price: product.price != null ? product.price.toString() : "",
      basePrice: product.basePrice != null ? product.basePrice.toString() : "",
      profitType: (product.profitType ?? "percentage") as "percentage" | "fixed", // Explicitly cast
      profitValue: product.profitValue != null ? product.profitValue.toString() : "",
      discountType: (product.discountType ?? "percentage") as "percentage" | "fixed", // Explicitly cast
      discountValue: product.discountValue != null ? product.discountValue.toString() : "", // Added
      category: product.category ?? "",
      sku: product.sku ?? "",
      stock: product.stock != null ? product.stock.toString() : "",
      description: product.description ?? "",
      supplier: product.supplier ?? "",
      image: product.image ?? "/placeholder.svg",
      expiryDate: product.expiryDate ?? "",
      isActive: product.isActive != null ? product.isActive : true
    })
    setIsEditProductModalOpen(true)
  }

  // Handle view product
  const handleViewProduct = (product: Product) => {
    setSelectedProduct(product)
    setIsEditProductModalOpen(false)
    setIsDeleteConfirmOpen(false)
  }

  // Handle delete product
  const handleDeleteProduct = (product: Product) => {
    setSelectedProduct(product)
    setIsDeleteConfirmOpen(true)
  }
  
  // Handle generating reports
  const handleGenerateReport = (format: "csv" | "pdf") => {
    toast({
      title: "Generating Report...",
      description: `Your inventory report is being generated in ${format.toUpperCase()} format.`,
      variant: "default",
    })
    // Placeholder for actual report generation logic
  }

  // Handle add product submission
  const handleAddProduct = async () => {
    setValidationErrors({});
    const errors: Partial<Record<keyof ProductFormState, string>> = {};

    if (!newProduct.name.trim()) errors.name = "Product name is required.";
    if (!newProduct.basePrice.trim() || parseFloat(newProduct.basePrice) <= 0) errors.basePrice = "A valid base price is required.";
    if (!newProduct.category.trim() || newProduct.category === "new-category") errors.category = "Category is required.";
    if (!newProduct.sku.trim()) errors.sku = "SKU/Barcode is required.";
    if (!newProduct.stock.trim() || parseInt(newProduct.stock, 10) < 0) errors.stock = "A valid initial stock is required.";

    if (Object.keys(errors).length > 0) {
      setValidationErrors(errors);
      toast({
        title: "Validation Error",
        description: "Please fill in all required fields correctly.",
        variant: "destructive",
      });
      return;
    }

    try {
      // Validate stock is not negative
      const stockValue = parseInt(newProduct.stock) || 0
      if (stockValue < 0) {
        toast({
          title: "Invalid Stock Value",
          description: "Stock cannot be negative.",
          variant: "destructive",
        })
        return
      }

      const response = await fetch('/api/products', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: newProduct.name,
          price: parseFloat(newProduct.price),
          basePrice: parseFloat(newProduct.basePrice),
          profitType: newProduct.profitType,
          profitValue: parseFloat(newProduct.profitValue),
          discountType: newProduct.discountType, // Added
          discountValue: parseFloat(newProduct.discountValue) || 0, // Added
          category: newProduct.category,
          sku: newProduct.sku,
          stock: stockValue,
          description: newProduct.description,
          supplier: newProduct.supplier,
          image: newProduct.image,
          expiryDate: newProduct.expiryDate || null,
          isActive: newProduct.isActive
        })
      })
      
      const data = await response.json()
      
      if (data.status === 'success') {
        // Add the new product to the state
        const updatedProducts = [...products, data.product];
        setProducts(updatedProducts)
        
        // Reset form and close modal
        setNewProduct({
          name: "",
          price: "",
          basePrice: "",
          profitType: "percentage",
          profitValue: "",
          discountType: "percentage", // Added
          discountValue: "", // Added
          category: "",
          sku: "",
          stock: "",
          description: "",
          supplier: "",
          image: "/placeholder.svg",
          expiryDate: "",
          isActive: true
        });
        setValidationErrors({});
        setIsAddProductModalOpen(false)
        
        // Show enhanced success toast
        toast({
          title: "Product Added Successfully",
          description: `${data.product.name} has been added to inventory with ${data.product.stock} units.`,
          variant: "default"
        })
        
        // Check if we need to add a new category
        if (!categories.includes(data.product.category)) {
          setCategories([...categories, data.product.category])
        }
        
        // Check for products near expiration
        checkForNearExpiryProducts(updatedProducts)
      } else {
        toast({
          title: "Failed to Add Product",
          description: data.message || "An error occurred while adding the product. Please try again.",
          variant: "destructive"
        })
      }
    } catch (err) {
      console.error('Error adding product:', err)
      toast({
        title: "Failed to Add Product",
        description: "An unexpected error occurred. Please try again.",
        variant: "destructive"
      })
    }
  }
  
  // Handle edit product submission
  const handleSaveEdit = async () => {
    if (!selectedProduct) return
    
    try {
      // Validate form
      if (!editedProduct.name || !editedProduct.price || !editedProduct.category) {
        toast({
          title: "Missing Required Fields",
          description: "Please fill in all required fields: name, price, and category.",
          variant: "destructive"
        })
        return
      }
      
      // Validate stock is not negative
      const stockValue = parseInt(editedProduct.stock) || 0
      if (stockValue < 0) {
        toast({
          title: "Invalid Stock Value",
          description: "Stock cannot be negative.",
          variant: "destructive"
        })
        return
      }
      
      const response = await fetch(`/api/products/${selectedProduct.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: editedProduct.name,
          price: parseFloat(editedProduct.price),
          basePrice: parseFloat(editedProduct.basePrice),
          profitType: editedProduct.profitType,
          profitValue: parseFloat(editedProduct.profitValue),
          discountType: editedProduct.discountType, // Added
          discountValue: parseFloat(editedProduct.discountValue) || 0, // Added
          category: editedProduct.category,
          sku: editedProduct.sku,
          stock: stockValue,
          description: editedProduct.description,
          supplier: editedProduct.supplier,
          image: editedProduct.image,
          expiryDate: editedProduct.expiryDate || null,
          isActive: editedProduct.isActive
        })
      })
      
      const data = await response.json()
      
      if (data.status === 'success') {
        // Update product in the state
        const updatedProducts = products.map(p => p.id === selectedProduct.id ? data.product : p);
        setProducts(updatedProducts)
        
        // Close modal
        setIsEditProductModalOpen(false)
        
        // Show enhanced success toast
        toast({
          title: "Product Updated Successfully",
          description: `${data.product.name} has been updated with the latest information.`,
          variant: "default"
        })
        
        // Check if we need to add a new category
        if (!categories.includes(data.product.category)) {
          setCategories([...categories, data.product.category])
        }
        
        // Check for products near expiration
        checkForNearExpiryProducts(updatedProducts)

        // Recalculate summary on edit
        const totalValue = updatedProducts.reduce((sum: number, p: Product) => sum + p.price * p.stock, 0)
        const totalProfit = updatedProducts.reduce((sum: number, p: Product) => sum + (p.price - p.basePrice) * p.stock, 0)
        const totalStock = updatedProducts.reduce((sum: number, p: Product) => sum + p.stock, 0)
        setInventorySummary({ totalValue, totalProfit, totalStock })
      } else {


        toast({
          title: "Failed to Update Product",
          description: data.message || "An error occurred while updating the product. Please try again.",
          variant: "destructive"
        })
      }
    } catch (err) {
      console.error('Error updating product:', err)
      toast({
        title: "Failed to Update Product",
        description: "An unexpected error occurred. Please try again.",
        variant: "destructive"
      })
    }
  }
  
  // Handle delete product submission
  const handleConfirmDelete = async () => {
    if (!selectedProduct) return
    
    try {
      const response = await fetch(`/api/products/${selectedProduct.id}`, {
        method: 'DELETE'
      })
      
      const data = await response.json()
      
      if (data.status === 'success') {
        // Remove product from the state
        const updatedProducts = products.filter(p => p.id !== selectedProduct.id);
        setProducts(updatedProducts)
        
        // Close modal
        setIsDeleteConfirmOpen(false)
        
        // Show enhanced success toast
        toast({
          title: "Product Archived Successfully",
          description: `${selectedProduct.name} has been archived and will no longer appear in the POS system.`,
          variant: "default"
        })
        
        // Update low stock count
        setLowStockCount(updatedProducts.filter(p => p.stock < 10).length)

        // Recalculate summary on delete
        const totalValue = updatedProducts.reduce((sum, p) => sum + p.price * p.stock, 0)
        const totalProfit = updatedProducts.reduce((sum, p) => sum + (p.price - p.basePrice) * p.stock, 0)
        const totalStock = updatedProducts.reduce((sum, p) => sum + p.stock, 0)
        setInventorySummary({ totalValue, totalProfit, totalStock })

      } else {
        toast({
          title: "Failed to Archive Product",
          description: data.message || "An error occurred while archiving the product. Please try again.",
          variant: "destructive"
        })
      }
    } catch (err) {
      console.error('Error deleting product:', err)
      toast({
        title: "Failed to Archive Product",
        description: "An unexpected error occurred. Please try again.",
        variant: "destructive"
      })
    }
  }
  
  // Handle stock update
  const handleUpdateStock = async (product: Product) => {
    setSelectedProduct(product)
    setEditedProduct({
      name: product.name,
      price: product.price.toString(),
      basePrice: product.basePrice.toString(),
      profitType: product.profitType as "percentage" | "fixed", // Explicitly cast
      profitValue: product.profitValue.toString(),
      discountType: (product.discountType ?? "percentage") as "percentage" | "fixed", // Explicitly cast
      discountValue: product.discountValue != null ? product.discountValue.toString() : "", // Added
      category: product.category,
      sku: product.sku,
      stock: product.stock.toString(),
      description: product.description || "",
      supplier: product.supplier || "",
      image: product.image || "/placeholder.svg",
      expiryDate: product.expiryDate || "",
      isActive: product.isActive !== undefined ? product.isActive : true
    })
    setIsEditProductModalOpen(true)
  }

  // Enhanced helper functions for stock status
  const getStockStatus = (stock: number) => {
    if (stock <= 15) return { color: 'text-red-600', badge: 'Low', bgColor: 'bg-red-100', indicator: 'bg-red-500' };

    return { color: 'text-green-600', badge: null, bgColor: 'bg-green-100', indicator: 'bg-green-500' };
  };

  // Add this function to handle activating archived products
  const handleActivateProduct = async (product: Product) => {
    try {
      const response = await fetch(`/api/products/${product.id}/activate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      });
      
      const data = await response.json();
      
      if (data.status === 'success') {
        // Update product in the state
        const updatedProducts = products.map(p => p.id === product.id ? { ...p, isActive: true } : p);
        setProducts(updatedProducts);
        
        // Show enhanced success toast
        toast({
          title: "Product Activated Successfully",
          description: `${product.name} has been restored to active status and will now appear in the POS system.`,
          variant: "default"
        });
        
        // Check for products near expiration
        checkForNearExpiryProducts(updatedProducts);
      } else {
        toast({
          title: "Failed to Activate Product",
          description: data.message || "An error occurred while activating the product. Please try again.",
          variant: "destructive"
        });
      }
    } catch (err) {
      console.error('Error activating product:', err);
      toast({
        title: "Failed to Activate Product",
        description: "An unexpected error occurred. Please try again.",
        variant: "destructive"
      });
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar userType="admin" userName="Admin User" />

      <main className="pt-16 pb-20">
        <div className="container mx-auto px-4 py-8">
          <div className="flex flex-col md:flex-row gap-4 items-start md:items-center justify-between mb-8">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Inventory Management</h1>
              <p className="text-gray-600">Manage and track product inventory</p>
            </div>

            <div className="flex flex-col sm:flex-row gap-3">
              <Button
                className="bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600"
                onClick={() => setIsAddProductModalOpen(true)}
              >
                <Plus className="h-4 w-4 mr-2" />
                Add Product
              </Button>
            </div>
          </div>

          {/* Inventory Summary */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium">Total Inventory Value</CardTitle>
                <DollarSign className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  ₱{inventorySummary.totalValue.toLocaleString('en-PH', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </div>
                <p className="text-xs text-muted-foreground">Estimated value of all products</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium">Potential Profit</CardTitle>
                <TrendingUp className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  ₱{inventorySummary.totalProfit.toLocaleString('en-PH', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </div>
                <p className="text-xs text-muted-foreground">Estimated profit from current stock</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium">Total Stock</CardTitle>
                <Package2 className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{inventorySummary.totalStock.toLocaleString()}</div>
                <p className="text-xs text-muted-foreground">Total units of all products</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">Reports</CardTitle>
              </CardHeader>
              <CardContent className="flex flex-col gap-2">
                <Button variant="outline" size="sm" onClick={() => handleGenerateReport("csv")}><Download className="h-3 w-3 mr-2" /> Export as CSV</Button>
                <Button variant="outline" size="sm" onClick={() => handleGenerateReport("pdf")}><FileText className="h-3 w-3 mr-2" /> Export as PDF</Button>
              </CardContent>
            </Card>
          </div>

          {/* Filters and Search */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
              <Input
                type="text"
                placeholder="Search products by name or barcode..."
                className="pl-10"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>

            <Select value={categoryFilter} onValueChange={setCategoryFilter}>
              <SelectTrigger>
                <SelectValue placeholder="Filter by category" />
              </SelectTrigger>
              <SelectContent>
                {categories.map((category) => (
                  <SelectItem key={category} value={category} className="capitalize">
                    {category === "all" ? "All Categories" : category}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <div className="flex items-center gap-2">
              <Select value={sortBy} onValueChange={setSortBy}>
                <SelectTrigger>
                  <SelectValue placeholder="Sort by" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="name">Name</SelectItem>
                  <SelectItem value="price">Price</SelectItem>
                  <SelectItem value="stock">Stock</SelectItem>
                  <SelectItem value="status">Status</SelectItem>
                </SelectContent>
              </Select>

              <Button variant="outline" size="icon" onClick={() => setSortOrder(sortOrder === "asc" ? "desc" : "asc")}>
                <ArrowUpDown className={`h-4 w-4 ${sortOrder === "desc" ? "rotate-180" : ""} transition-transform`} />
              </Button>
            </div>
          </div>

          {/* Low Stock Alert */}
          {lowStockCount > 0 && (
            <Card className="mb-6 border-red-200 bg-red-50">
              <CardContent className="p-4">
                <div className="flex items-start gap-3">
                  <AlertCircle className="h-5 w-5 text-red-500 flex-shrink-0 mt-0.5" />
                  <div>
                    <h3 className="font-medium text-gray-900">Low Stock Alert</h3>
                    <p className="text-sm text-gray-600">
                      {lowStockCount} products are running low on stock. Consider restocking soon.
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Products Table */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-lg font-medium">Product Inventory</CardTitle>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="py-12 text-center">
                  <div className="inline-block animate-spin rounded-full h-8 w-8 border-4 border-amber-500 border-r-transparent mb-4"></div>
                  <p className="text-gray-600">Loading inventory data...</p>
                </div>
              ) : error ? (
                <div className="py-12 text-center">
                  <AlertCircle className="h-8 w-8 text-red-500 mx-auto mb-4" />
                  <p className="text-gray-900 font-medium">{error}</p>
                  <p className="text-gray-600 mt-1">Please try refreshing the page.</p>
                </div>
              ) : filteredProducts.length === 0 ? (
                <div className="py-12 text-center">
                  <Package className="h-8 w-8 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-900 font-medium">No products found</p>
                  <p className="text-gray-600 mt-1">
                    {products.length === 0 ? "Add your first product to get started!" : "Try adjusting your filters"}
                  </p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-gray-100 text-gray-600 text-sm">
                      <tr>
                        <th className="px-4 py-3 text-left">Product</th>
                        <th className="px-4 py-3 text-left hidden md:table-cell">
                          <div className="flex items-center">
                            Category
                            <Button variant="ghost" size="sm" className="ml-1 h-6 w-6 p-0" onClick={() => setSortBy("category")}>
                              <ArrowUpDown className="h-3 w-3" />
                            </Button>
                          </div>
                        </th>
                        <th className="px-4 py-3 text-left">
                          <div className="flex items-center">
                            Price
                            <Button variant="ghost" size="sm" className="ml-1 h-6 w-6 p-0" onClick={() => setSortBy("price")}>
                              <ArrowUpDown className="h-3 w-3" />
                            </Button>
                          </div>
                        </th>
                        <th className="px-4 py-3 text-left">
                          <div className="flex items-center">
                            Stock
                            <Button variant="ghost" size="sm" className="ml-1 h-6 w-6 p-0" onClick={() => setSortBy("stock")}>
                              <ArrowUpDown className="h-3 w-3" />
                            </Button>
                          </div>
                        </th>
                        <th className="px-4 py-3 text-left">
                          <div className="flex items-center">
                            Status
                            <Button variant="ghost" size="sm" className="ml-1 h-6 w-6 p-0" onClick={() => setSortBy("status")}>
                              <ArrowUpDown className="h-3 w-3" />
                            </Button>
                          </div>
                        </th>
                        <th className="px-4 py-3 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredProducts.map((product) => (
                        <motion.tr
                          key={product.id}
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          className="border-b hover:bg-gray-50"
                        >
                          <td className="px-4 py-3">
                            <div className="flex items-center gap-3">
                              <div className="h-10 w-10 rounded-md border bg-gray-100 relative overflow-hidden">
                                <Image 
                                  src={product.image || "/placeholder.svg"} 
                                  alt={product.name}
                                  fill
                                  className="object-cover"
                                  unoptimized
                                />
                              </div>
                              <div>
                                <p className="font-medium text-gray-900">{product.name}</p>
                                <p className="text-xs text-gray-500">SKU: {product.sku}</p>
                              </div>
                            </div>
                          </td>
                          <td className="px-4 py-3 hidden md:table-cell">
                            <Badge variant="outline" className="bg-gray-50">
                              {product.category}
                            </Badge>
                          </td>
                          <td className="px-4 py-3">₱{product.price != null ? product.price.toFixed(2) : '0.00'}</td>
                          <td className="px-4 py-3">
                            <div className="flex items-center gap-2">
                              <span className={`inline-block h-2 w-2 rounded-full ${getStockStatus(product.stock).indicator}`} />
                              <div className="flex flex-col">
                                <div className="flex items-center gap-1.5">
                                  <span className={getStockStatus(product.stock).color}>{product.stock}</span>
                                  {getStockStatus(product.stock).badge && (
                                    <Badge variant="outline" className={`${getStockStatus(product.stock).bgColor} ${getStockStatus(product.stock).color} border-0 text-xs py-0 px-1.5`}>
                                      {getStockStatus(product.stock).badge}
                                    </Badge>
                                  )}
                                </div>
                              </div>
                            </div>
                          </td>
                          <td className="px-4 py-3 hidden md:table-cell">
                            <Badge
                              variant="outline"
                              className={getProductStatus(product).color}
                            >{getProductStatus(product).label}</Badge>
                          </td>
                          <td className="px-4 py-3 text-right">
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="sm">
                                  <MoreHorizontal className="h-4 w-4" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end">
                                <DropdownMenuLabel>Actions</DropdownMenuLabel>
                                <DropdownMenuItem onClick={() => handleEditProduct(product)}>
                                  <Edit className="h-4 w-4 mr-2" /> Edit Product
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={() => handleUpdateStock(product)}>
                                  Update Stock
                                </DropdownMenuItem>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem onClick={() => handleDeleteProduct(product)} className="text-red-600">
                                  <Archive className="h-4 w-4 mr-2" /> {product.isActive === false ? "Delete Permanently" : "Archive Product"}
                                </DropdownMenuItem>
                                {product.isActive === false && (
                                  <DropdownMenuItem onClick={() => handleActivateProduct(product)} className="text-green-600">
                                    Restore Product
                                  </DropdownMenuItem>
                                )}
                              </DropdownMenuContent>
                            </DropdownMenu>
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

      {/* Add Product Modal */}
      <Dialog open={isAddProductModalOpen} onOpenChange={setIsAddProductModalOpen} >
        <DialogContent className="max-h-screen sm:max-w-md ">
          <DialogHeader>
            <DialogTitle>Add New Product</DialogTitle>
            <DialogDescription>Enter the details of the new product</DialogDescription>
          </DialogHeader>

          <div className="grid gap-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <label className="text-sm font-medium">Product Name</label>
                <Input 
                  placeholder="Enter product name" 
                  value={newProduct.name}
                  onChange={(e) => setNewProduct({...newProduct, name: e.target.value})}
                />
                {validationErrors.name && (
                  <p className="text-xs text-red-600">{validationErrors.name}</p>
                )}
              </div>

              <div className="grid gap-2">
                <label className="text-sm font-medium">Category</label>
                <Select 
                  value={newProduct.category}
                  onValueChange={(value) => setNewProduct({...newProduct, category: value})}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select category" />
                  </SelectTrigger>
                  <SelectContent>
                    {categories
                      .filter((c) => c !== "all")
                      .map((category) => (
                        <SelectItem key={category} value={category} className="capitalize">
                          {category}
                        </SelectItem>
                      ))}
                    <SelectItem value="new-category">+ Add New Category</SelectItem>
                  </SelectContent>
                </Select>
                {newProduct.category === "new-category" && (
                  <Input 
                    placeholder="Enter new category name" 
                    className="mt-2"
                    onChange={(e) => setNewProduct({...newProduct, category: e.target.value})}
                  />
                )}
                {validationErrors.category && (
                  <p className="text-xs text-red-600 mt-1">{validationErrors.category}</p>
                )}
              </div>
            </div>

            <div className="grid gap-2">
              <label className="text-sm font-medium">Base Price (₱)</label>
              <Input 
                type="number" 
                placeholder="0.00" 
                value={newProduct.basePrice}
                onChange={handleBasePriceChange}
                step="0.01"
                min="0"
              />
              {validationErrors.basePrice && (
                <p className="text-xs text-red-600">{validationErrors.basePrice}</p>
              )}
              <p className="text-xs text-gray-500">The price at which the product was purchased from the supplier.</p>
            </div>

            <div className="grid gap-2">
              <label className="text-sm font-medium">Profit Margin</label>
              <div className="flex gap-2">
                <Select 
                  value={newProduct.profitType} 
                  onValueChange={(value) => handleProfitChange(value, newProduct.profitValue)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select profit type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="percentage">Percentage (%)</SelectItem>
                    <SelectItem value="fixed">Fixed Amount (₱)</SelectItem>
                  </SelectContent>
                </Select>
                <Input 
                  type="number" 
                  placeholder={newProduct.profitType === "percentage" ? "0%" : "₱0.00"} 
                  value={newProduct.profitValue}
                  onChange={(e) => handleProfitChange(newProduct.profitType, e.target.value)}
                  step="0.01"
                  min="0"
                />
              </div>
              <p className="text-xs text-gray-500">
                {newProduct.profitType === "percentage" 
                  ? "Percentage markup on the base price." 
                  : "Fixed amount added to the base price."}
              </p>
            </div>

            <div className="grid gap-2">
              <label className="text-sm font-medium">Discount</label>
              <div className="flex gap-2">
                <Select 
                  value={newProduct.discountType} 
                  onValueChange={(value) => handleDiscountChange(value, newProduct.discountValue)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select discount type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="percentage">Percentage (%)</SelectItem>
                    <SelectItem value="fixed">Fixed Amount (₱)</SelectItem>
                  </SelectContent>
                </Select>
                <Input 
                  type="number" 
                  placeholder={newProduct.discountType === "percentage" ? "0%" : "₱0.00"} 
                  value={newProduct.discountValue}
                  onChange={(e) => handleDiscountChange(newProduct.discountType, e.target.value)}
                  step="0.01"
                  min="0"
                />
              </div>
              <p className="text-xs text-gray-500">
                {newProduct.discountType === "percentage" 
                  ? "Percentage discount applied to the calculated price." 
                  : "Fixed amount discount applied to the calculated price."}
              </p>
            </div>

            <div className="grid gap-2">
              <label className="text-sm font-medium">Selling Price (₱)</label>
              <Input 
                type="number" 
                placeholder="0.00" 
                value={newProduct.price}
                onChange={(e) => setNewProduct({...newProduct, price: e.target.value})}
                readOnly
              />
              <p className="text-xs text-gray-500">Final selling price calculated from base price and profit margin.</p>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <label className="text-sm font-medium">Initial Stock</label>
                <Input 
                  type="number" 
                  placeholder="0" 
                  value={newProduct.stock}
                  onChange={(e) => setNewProduct({...newProduct, stock: e.target.value})}
                />
                {validationErrors.stock && (
                  <p className="text-xs text-red-600">{validationErrors.stock}</p>
                )}
              </div>

              <div className="grid gap-2">
                <label className="text-sm font-medium">SKU/Barcode</label>
                <div className="flex gap-2">
                  <Input 
                    placeholder="Enter SKU or barcode number" 
                    className="flex-1" 
                    value={newProduct.sku}
                    onChange={(e) => setNewProduct({...newProduct, sku: e.target.value})}
                  />
                  <Button variant="outline" className="flex items-center gap-2">
                    <Barcode className="h-4 w-4" />
                    Scan
                  </Button>
                </div>
                {validationErrors.sku && (
                  <p className="text-xs text-red-600">{validationErrors.sku}</p>
                )}
              </div>
            </div>

            <div className="grid gap-2">
              <label className="text-sm font-medium">Supplier</label>
              <Input 
                placeholder="Enter supplier name" 
                value={newProduct.supplier}
                onChange={(e) => setNewProduct({...newProduct, supplier: e.target.value})}
              />
            </div>

            <div className="grid gap-2">
              <label className="text-sm font-medium">Expiry Date</label>
              <Input 
                type="date" 
                placeholder="Select expiry date (if applicable)" 
                value={newProduct.expiryDate}
                onChange={(e) => setNewProduct({...newProduct, expiryDate: e.target.value})}
              />
              <p className="text-xs text-gray-500">Leave blank if product doesn't expire</p>
            </div>

            <div className="grid gap-2">
              <label className="text-sm font-medium">Description</label>
              <textarea
                className="min-h-[80px] rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                placeholder="Enter product description"
                value={newProduct.description}
                onChange={(e) => setNewProduct({...newProduct, description: e.target.value})}
              />
            </div>
          </div>

          <DialogFooter className="flex flex-col sm:flex-row gap-2">
            <Button variant="outline" className="sm:flex-1" onClick={() => setIsAddProductModalOpen(false)}>
              Cancel
            </Button>
            <Button
              className="sm:flex-1 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600"
              onClick={handleAddProduct}
            >
              Add Product
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Product Modal */}
      <Dialog open={isEditProductModalOpen} onOpenChange={setIsEditProductModalOpen}>
        <DialogContent className="max-h-screen sm:max-w-md overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Edit Product</DialogTitle>
            <DialogDescription>Update product information</DialogDescription>
          </DialogHeader>

          {selectedProduct && (
            <div className="grid gap-4">
              <div 
                className="relative aspect-video bg-gray-100 rounded-md overflow-hidden cursor-pointer flex flex-col items-center justify-center border-2 border-dashed border-gray-300 hover:border-amber-500 transition-colors"
                onClick={() => editFileInputRef.current?.click()}
              >
                <Image
                  src={editedProduct.image || "/placeholder.svg"}
                  alt={editedProduct.name || "Product image"}
                  fill
                  className="object-cover"
                  unoptimized
                />
                <div className="absolute inset-0 bg-black bg-opacity-0 hover:bg-opacity-40 flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity">
                  <p className="text-white font-medium">Change Image</p>
                </div>
                <input
                  type="file"
                  ref={editFileInputRef}
                  className="hidden"
                  accept="image/*"
                  onChange={(e) => handleImageChange(e, true)}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <label className="text-sm font-medium">Product Name</label>
                  <Input 
                    placeholder="Enter product name" 
                    value={editedProduct.name} 
                    onChange={(e) => setEditedProduct({...editedProduct, name: e.target.value})}
                  />
                </div>

                <div className="grid gap-2">
                  <label className="text-sm font-medium">Category</label>
                  <Select 
                    value={editedProduct.category}
                    onValueChange={(value) => setEditedProduct({...editedProduct, category: value})}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select category" />
                    </SelectTrigger>
                    <SelectContent>
                      {categories
                        .filter((c) => c !== "all")
                        .map((category) => (
                          <SelectItem key={category} value={category} className="capitalize">
                            {category}
                          </SelectItem>
                        ))}
                      <SelectItem value="new-category">+ Add New Category</SelectItem>
                    </SelectContent>
                  </Select>
                  {editedProduct.category === "new-category" && (
                    <Input 
                      placeholder="Enter new category name" 
                      className="mt-2"
                      onChange={(e) => setEditedProduct({...editedProduct, category: e.target.value})}
                    />
                  )}
                </div>
              </div>

              <div className="grid gap-2">
                <label className="text-sm font-medium">Base Price (₱)</label>
                <Input 
                  type="number" 
                  placeholder="0.00" 
                  value={editedProduct.basePrice} 
                  onChange={handleEditBasePriceChange}
                  step="0.01"
                  min="0"
                />
                <p className="text-xs text-gray-500">The price at which the product was purchased from the supplier.</p>
              </div>

              <div className="grid gap-2">
                <label className="text-sm font-medium">Profit Margin</label>
                <div className="flex gap-2">
                  <Select 
                    value={editedProduct.profitType} 
                    onValueChange={(value) => handleEditProfitChange(value, editedProduct.profitValue)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select profit type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="percentage">Percentage (%)</SelectItem>
                      <SelectItem value="fixed">Fixed Amount (₱)</SelectItem>
                    </SelectContent>
                  </Select>
                  <Input 
                    type="number" 
                    placeholder={editedProduct.profitType === "percentage" ? "0%" : "₱0.00"} 
                    value={editedProduct.profitValue}
                    onChange={(e) => handleEditProfitChange(editedProduct.profitType, e.target.value)}
                    step="0.01"
                    min="0"
                  />
                </div>
                <p className="text-xs text-gray-500">
                  {editedProduct.profitType === "percentage" 
                    ? "Percentage markup on the base price." 
                    : "Fixed amount added to the base price."}
                </p>
              </div>

              <div className="grid gap-2">
                <label className="text-sm font-medium">Selling Price (₱)</label>
                <Input 
                  type="number" 
                  placeholder="0.00" 
                  value={editedProduct.price} 
                  onChange={(e) => setEditedProduct({...editedProduct, price: e.target.value})}
                  step="0.01"
                  min="0"
                  readOnly
                />
                <p className="text-xs text-gray-500">Final selling price calculated from base price and profit margin.</p>
              </div>

              <div className="grid gap-2">
                <label className="text-sm font-medium">Discount</label>
                <div className="flex gap-2">
                  <Select 
                    value={editedProduct.discountType} 
                    onValueChange={(value) => handleEditDiscountChange(value, editedProduct.discountValue)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select discount type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="percentage">Percentage (%)</SelectItem>
                      <SelectItem value="fixed">Fixed Amount (₱)</SelectItem>
                    </SelectContent>
                  </Select>
                  <Input 
                    type="number" 
                    placeholder={editedProduct.discountType === "percentage" ? "0%" : "₱0.00"} 
                    value={editedProduct.discountValue}
                    onChange={(e) => handleEditDiscountChange(editedProduct.discountType, e.target.value)}
                    step="0.01"
                    min="0"
                  />
                </div>
                <p className="text-xs text-gray-500">
                  {editedProduct.discountType === "percentage" 
                    ? "Percentage discount applied to the calculated price." 
                    : "Fixed amount discount applied to the calculated price."}
                </p>
              </div>

              <div className="grid gap-2">
                <label className="text-sm font-medium">SKU/Barcode</label>
                <Input 
                  placeholder="Enter barcode number" 
                  value={editedProduct.sku} 
                  onChange={(e) => setEditedProduct({...editedProduct, sku: e.target.value})}
                  disabled
                />
              </div>

              <div className="grid gap-2">
                <label className="text-sm font-medium">Stock</label>
                <Input 
                  type="number" 
                  placeholder="0" 
                  value={editedProduct.stock} 
                  onChange={(e) => setEditedProduct({...editedProduct, stock: e.target.value})}
                  min="0"
                />
              </div>

              <div className="grid gap-2">
                <label className="text-sm font-medium">Product Status</label>
                <Select 
                  value={editedProduct.isActive ? "active" : "archived"} 
                  onValueChange={(value) => setEditedProduct({...editedProduct, isActive: value === "active"})}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="active">Active</SelectItem>
                    <SelectItem value="archived">Archived</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="grid gap-2">
                <label className="text-sm font-medium">Supplier</label>
                <Input 
                  placeholder="Enter supplier name" 
                  value={editedProduct.supplier} 
                  onChange={(e) => setEditedProduct({...editedProduct, supplier: e.target.value})}
                />
              </div>

              <div className="grid gap-2">
                <label className="text-sm font-medium">Expiry Date</label>
                <Input 
                  type="date" 
                  placeholder="Select expiry date (if applicable)" 
                  value={editedProduct.expiryDate ? editedProduct.expiryDate.substring(0, 10) : ""}
                  onChange={(e) => setEditedProduct({...editedProduct, expiryDate: e.target.value})}
                />
                <p className="text-xs text-gray-500">Leave blank if product doesn't expire</p>
              </div>

              <div className="grid gap-2">
                <label className="text-sm font-medium">Description</label>
                <textarea
                  className="min-h-[80px] rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                  placeholder="Enter product description"
                  value={editedProduct.description}
                  onChange={(e) => setEditedProduct({...editedProduct, description: e.target.value})}
                />
              </div>
            </div>
          )}

          <DialogFooter className="flex flex-col sm:flex-row gap-2">
            <Button variant="outline" className="sm:flex-1" onClick={() => setIsEditProductModalOpen(false)}>
              Cancel
            </Button>
            <Button
              className="sm:flex-1 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600"
              onClick={handleSaveEdit}
            >
              Save Changes
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={isDeleteConfirmOpen} onOpenChange={setIsDeleteConfirmOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Confirm Deletion</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete this product? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>

          {selectedProduct && (
            <div className="flex items-center gap-3 bg-red-50 p-3 rounded-md">
              <div className="relative h-12 w-12 flex-shrink-0 bg-white rounded-md overflow-hidden">
                <Image
                  src={selectedProduct.image || "/placeholder.svg"}
                  alt={selectedProduct.name}
                  fill
                  className="object-cover"
                />
              </div>
              <div>
                <h4 className="font-medium">{selectedProduct.name}</h4>
                <p className="text-sm text-gray-600">
                  {selectedProduct.category} - ₱{selectedProduct.price != null ? selectedProduct.price.toFixed(2) : '0.00'}
                </p>
              </div>
            </div>
          )}

          <DialogFooter className="flex flex-col sm:flex-row gap-2">
            <Button variant="outline" className="sm:flex-1" onClick={() => setIsDeleteConfirmOpen(false)}>
              Cancel
            </Button>
            <Button
              variant="destructive"
              className="sm:flex-1"
              onClick={handleConfirmDelete}
            >
              Delete Product
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* View Product Modal */}
      <Dialog open={!!selectedProduct && !isEditProductModalOpen && !isDeleteConfirmOpen} onOpenChange={() => setSelectedProduct(null)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Product Details</DialogTitle>
          </DialogHeader>
          
          {selectedProduct && (
            <div className="grid gap-4">
              <div className="relative h-40 w-full rounded-md overflow-hidden bg-gray-100">
                <Image 
                  src={selectedProduct.image || "/placeholder.svg"} 
                  alt={selectedProduct.name}
                  fill
                  className="object-cover"
                  unoptimized
                />
              </div>
              
              <div>
                <h3 className="text-xl font-semibold">{selectedProduct.name}</h3>
                <p className="text-sm text-gray-500">SKU: {selectedProduct.sku}</p>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm font-medium text-gray-500">Base Price</p>
                  <p className="text-lg font-medium">₱{selectedProduct.basePrice != null ? selectedProduct.basePrice.toFixed(2) : '0.00'}</p>
                </div>
                
                <div>
                  <p className="text-sm font-medium text-gray-500">Profit Margin</p>
                  <p className="text-lg font-medium">
                    {selectedProduct.profitType === "percentage" 
                      ? `${selectedProduct.profitValue}%` 
                      : `₱${selectedProduct.profitValue != null ? selectedProduct.profitValue.toFixed(2) : '0.00'}`}
                  </p>
                </div>

                <div>
                  <p className="text-sm font-medium text-gray-500">Selling Price</p>
                  <p className="text-lg font-semibold">₱{selectedProduct.price != null ? selectedProduct.price.toFixed(2) : '0.00'}</p>
                </div>
                
                <div>
                  <p className="text-sm font-medium text-gray-500">Stock</p>
                  <div className="flex items-center gap-2">
                    <span className={`inline-block h-2 w-2 rounded-full ${getStockStatus(selectedProduct.stock).indicator}`} />
                    <span className={`text-lg font-semibold ${getStockStatus(selectedProduct.stock).color}`}>
                      {selectedProduct.stock}
                    </span>
                    {getStockStatus(selectedProduct.stock).badge && (
                      <Badge variant="outline" className={`${getStockStatus(selectedProduct.stock).bgColor} ${getStockStatus(selectedProduct.stock).color} border-0`}>
                        {getStockStatus(selectedProduct.stock).badge}
                      </Badge>
                    )}
                  </div>
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm font-medium text-gray-500">Category</p>
                  <p>{selectedProduct.category}</p>
                </div>
                
                <div>
                  <p className="text-sm font-medium text-gray-500">Discount</p>
                  <p className="text-lg font-medium">
                    {selectedProduct.discountValue && selectedProduct.discountValue > 0
                      ? `${selectedProduct.discountValue}${selectedProduct.discountType === "percentage" ? "%" : "₱"}`
                      : "No Discount"}
                  </p>
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm font-medium text-gray-500">Supplier</p>
                  <p>{selectedProduct.supplier || "Not specified"}</p>
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm font-medium text-gray-500">Last Restocked</p>
                  <p>{formatDate(selectedProduct.lastRestocked) || "Not available"}</p>
                </div>
                
                <div>
                  <p className="text-sm font-medium text-gray-500">Expiry Date</p>
                  <p>{selectedProduct.expiryDate ? formatDate(selectedProduct.expiryDate) : "No expiry date"}</p>
                  {selectedProduct.expiryDate && isExpired(selectedProduct.expiryDate) && (
                    <Badge variant="outline" className="bg-red-50 text-red-600 border-red-200 mt-1">
                      Expired
                    </Badge>
                  )}
                  {selectedProduct.expiryDate && isExpiringSoon(selectedProduct.expiryDate) && !isExpired(selectedProduct.expiryDate) && (
                    <Badge variant="outline" className="bg-amber-50 text-amber-600 border-amber-200 mt-1">
                      Expires Soon
                    </Badge>
                  )}
                </div>
              </div>
              
              <div>
                <p className="text-sm font-medium text-gray-500">Status</p>
                {selectedProduct.isActive === false ? (
                  <Badge variant="outline" className="bg-red-50 text-red-600 border-red-200">
                    Archived
                  </Badge>
                ) : (
                  <Badge variant="outline" className="bg-green-50 text-green-600 border-green-200">
                    Active
                  </Badge>
                )}
              </div>
              
              <div>
                <p className="text-sm font-medium text-gray-500">Description</p>
                <p className="text-gray-600">{selectedProduct.description || "No description provided."}</p>
              </div>
              
              <DialogFooter>
                <Button variant="outline" onClick={() => setSelectedProduct(null)}>Close</Button>
                <Button onClick={() => selectedProduct && handleEditProduct(selectedProduct)}>Edit Product</Button>
              </DialogFooter>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
