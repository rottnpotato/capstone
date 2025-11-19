"use client"

import { useState, useRef, useEffect } from "react"
import { motion } from "framer-motion"
import { Search, Plus, Package, ArrowUpDown, MoreHorizontal, Edit, Trash2, AlertCircle, Image as ImageIcon,Archive } from "lucide-react"
import { Navbar } from "@/components/ui/navbar"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useToast } from "@/components/ui/use-toast"
import Image from "next/image"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"

// Product type definition
interface Product {
  id: string
  name: string
  price: number
  basePrice: number
  profitType: "percentage" | "fixed"
  profitValue: number
  category: string
  image: string
  stock: number
  description: string
  supplier: string
  lastRestocked: string
  sku: string
  expiryDate?: string | null
  isActive?: boolean
}
// Category type definition
interface Category {
  id: string
  name: string
  description: string
  createdAt: string
  updatedAt: string
}

// Add helper functions for date handling at the top of the component
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

// Add a helper function to determine stock status
const getStockStatus = (stock: number) => {
  if (stock < 15) return { color: 'text-red-500', badge: 'Low', bgColor: 'bg-red-100' };
  return { color: 'text-green-500', badge: null, bgColor: 'bg-green-100' };
};

export default function InventoryPage() {
  const [searchQuery, setSearchQuery] = useState("")
  const [selectedCategory, setSelectedCategory] = useState("all")
  const [sortBy, setSortBy] = useState("name")
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("asc")
  const [isAddProductModalOpen, setIsAddProductModalOpen] = useState(false)
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null)
  const [isProductDetailModalOpen, setIsProductDetailModalOpen] = useState(false)
  const [isEditMode, setIsEditMode] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [isLoadingProducts, setIsLoadingProducts] = useState(true)
  const [newProductImage, setNewProductImage] = useState<string | null>(null)
  const [editProductImage, setEditProductImage] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const editFileInputRef = useRef<HTMLInputElement>(null)
  const { toast } = useToast()
  
  // Add a function to check for products near expiration
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
  
  // Form state for new product
  const [newProduct, setNewProduct] = useState({
    name: "",
    category: "",
    price: "",
    basePrice: "",
    profitType: "percentage",
    profitValue: "",
    stock: "",
    supplier: "",
    description: "",
    sku: "",
    expiryDate: ""
  })
  
  // Form state for editing product
  const [editProduct, setEditProduct] = useState({
    id: "",
    name: "",
    category: "",
    price: "",
    basePrice: "",
    profitType: "percentage",
    profitValue: "",
    stock: "",
    supplier: "",
    description: "",
    sku: "",
    lastRestocked: "",
    expiryDate: "",
    isActive: true
  })
  
  // For stock update in the product detail modal
  const [updatedStock, setUpdatedStock] = useState("")
  const [stockUpdateError, setStockUpdateError] = useState("")
  
  // Form validation errors for new product
  const [errors, setErrors] = useState({
    name: "",
    category: "",
    price: "",
    basePrice: "",
    profitValue: "",
    stock: "",
    image: "",
    sku: "",
    expiryDate: ""
  })
  
  // Form validation errors for edit product
  const [editErrors, setEditErrors] = useState({
    name: "",
    category: "",
    price: "",
    basePrice: "",
    profitValue: "",
    stock: "",
    sku: "",
    expiryDate: ""
  })

  // Products state - will be fetched from API
  const [products, setProducts] = useState<Product[]>([
    {
      id: "1",
      name: "Organic Rice",
      price: 75.5,
      basePrice: 60.0,
      profitType: "percentage",
      profitValue: 25,
      category: "grocery",
      image: "https://images.unsplash.com/photo-1586201375761-83865001e31c?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=300&q=80",
      stock: 50,
      description: "Premium organic rice grown locally by our cooperative members. High quality and nutritious.",
      supplier: "Local Farmers Cooperative",
      lastRestocked: "Apr 10, 2025",
      expiryDate:"",
      sku: "GRO-123456"
    },
    // Initial sample products (keep for testing, will be replaced with API data)
    // ... other sample products with SKU added
  ])

  const [category, setCategory] = useState<Category[]>([
 
    // Initial sample products (keep for testing, will be replaced with API data)
    // ... other sample products with SKU added
  ])

  // Fetch products from API on component mount
  useEffect(() => {
    const fetchProducts = async () => {
      setIsLoadingProducts(true)
      try {
        // Call the products API endpoint
        const response = await fetch('/api/products')
        if (!response.ok) {
          throw new Error('Failed to fetch products')
        }
        
        const data = await response.json()
        // console.log("resp prod"+data.toS)
        //display all response data
        // data.products.map((element: any) => {
        //   console.log("value"+element.expiryDate);
        // });

        if (data.products && Array.isArray(data.products)) {
          // Map database columns to frontend model
          const formattedProducts = data.products.map((p: { Products: any; Categories: { Name: any }; category: any }) => {
            // Handle the case where p.Products is the actual product data (from a join query)
            const product = p.Products || p;
            const category = p.Categories ? p.Categories.Name : (p.category || 'uncategorized');
            console.log("ahsd"+product.expiryDate);
            // Format the expiry date properly
            let expiryDate = null;
            if (product.ExpiryDate || product.expiryDate) {
              const rawDate = product.ExpiryDate || product.expiryDate;
              expiryDate = rawDate;
            }
            
            return {
              id: (product.ProductId || product.id || '').toString(),
              name: product.Name || product.name || 'Unnamed Product',
              price: parseFloat(product.Price || product.price || 0),
              basePrice: parseFloat(product.BasePrice || product.basePrice || 0),
              profitType: product.ProfitType || product.profitType || 'percentage',
              profitValue: parseFloat(product.ProfitValue || product.profitValue || 0),
              category: category,
              image: product.Image || product.image || '/placeholder.svg',
              stock: parseInt(product.StockQuantity || product.stock || 0),
              description: product.Description || product.description || '',
              supplier: product.Supplier || product.supplier || 'No supplier',
              lastRestocked: formatDate(product.LastRestocked || product.lastRestocked) || new Date().toLocaleDateString('en-US', {
                year: 'numeric',
                month: 'short',
                day: 'numeric'
              }),
              sku: product.Sku || product.sku || 'NO-SKU',
              expiryDate: expiryDate,
              isActive: product.IsActive !== undefined ? product.IsActive : (product.isActive !== undefined ? product.isActive : true)
            };
          });
          
          setProducts(formattedProducts);
          console.log('Loaded products:', formattedProducts);
          
          // Check for products near expiration
          checkForNearExpiryProducts(formattedProducts);
        } else {
          console.log('No products found or invalid data structure:', data);
        }
      } catch (error) {
        console.error('Error fetching products:', error)
        toast({
          title: "Error",
          description: "Failed to load products. Please try again.",
          variant: "destructive"
        })
      } finally {
        setIsLoadingProducts(false)
      }
    }

    const fetchCategories = async () => {
      // setIsLoadingProducts(true)
      try {
        // Call the products API endpoint
        const response = await fetch('/api/category')
        if (!response.ok) {
          throw new Error('Failed to fetch products')
        }
        
        const data = await response.json()
        if (data.categories && Array.isArray(data.categories)) {
          // Map database columns to frontend model
          const formattedCategories: Category[] = data.categories.map((c: Category) => {
            return {
              id: c.id.toString(),
              name: c.name || 'Unnamed Category',
              description: c.description || '',
              createdAt: c.createdAt || new Date().toLocaleDateString(),
              updatedAt: c.updatedAt || new Date().toLocaleDateString()
            };
          });

          setCategory(formattedCategories);
          console.log('Loaded Category:', formattedCategories);
        } else {
          console.log('No categories found or invalid data structure:', data);
        }
      } catch (error) {
        console.error('Error fetching category:', error)
        toast({
          title: "Error",
          description: "Failed to load category. Please try again.",
          variant: "destructive"
        })
      } finally {
        setIsLoadingProducts(false)
      }
    }

    fetchCategories()

    fetchProducts()
  }, [toast])

  // Get unique categories from products
  const categories = ["all", ...Array.from(new Set(category.map((category) => category.name)))]

  // Filter and sort products
  const filteredProducts = products
    .filter((product) => {
      const matchesSearch = product.name.toLowerCase().includes(searchQuery.toLowerCase())
      const matchesCategory = selectedCategory === "all" || product.category === selectedCategory
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
        default:
          comparison = 0
      }

      return sortOrder === "asc" ? comparison : -comparison
    })

  // Handle product click to view details
  const handleProductClick = (product: Product) => {
    setSelectedProduct(product)
    setUpdatedStock(product.stock.toString()) // Initialize with current stock
    setStockUpdateError("") // Clear any previous errors
    setIsEditMode(false) // Default to view mode when clicking a product
    setIsProductDetailModalOpen(true)
  }

  // Toggle sort order
  const toggleSortOrder = () => {
    setSortOrder(sortOrder === "asc" ? "desc" : "asc")
  }

  // Handle form field changes
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target
    setNewProduct({
      ...newProduct,
      [name]: value
    })
    
    // Clear error when field is updated
    if (name in errors) {
      setErrors({
        ...errors,
        [name]: ""
      })
    }
  }
  
  // Handle stock input change in the product detail modal
  const handleStockInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setUpdatedStock(e.target.value)
    setStockUpdateError("") // Clear error when input changes
  }
  
  // Handle category select change
  const handleCategoryChange = (value: string) => {
    setNewProduct({
      ...newProduct,
      category: value
    })
    
    // Clear error when field is updated
    setErrors({
      ...errors,
      category: ""
    })
  }
  
  // Calculate price based on base price and profit settings
  const calculatePrice = (basePrice: string, profitType: string, profitValue: string): number => {
    const basePriceNum = parseFloat(basePrice);
    const profitValueNum = parseFloat(profitValue);
    
    if (isNaN(basePriceNum) || isNaN(profitValueNum)) {
      return 0;
    }
    
    if (profitType === "percentage") {
      return basePriceNum * (1 + profitValueNum / 100);
    } else {
      return basePriceNum + profitValueNum;
    }
  }
  
  // Handle profit type or value change to recalculate price
  const handleProfitChange = (type: string, value: string) => {
    const newProfitType = type || newProduct.profitType;
    const newProfitValue = value || newProduct.profitValue;
    
    const calculatedPrice = calculatePrice(newProduct.basePrice, newProfitType, newProfitValue);
    
    setNewProduct({
      ...newProduct,
      profitType: newProfitType as "percentage" | "fixed",
      profitValue: newProfitValue,
      price: calculatedPrice.toFixed(2)
    });
    
    // Clear error when field is updated
    if (value) {
      setErrors({
        ...errors,
        profitValue: ""
      });
    }
  }
  
  // Handle base price change to recalculate price
  const handleBasePriceChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { value } = e.target;
    const calculatedPrice = calculatePrice(value, newProduct.profitType, newProduct.profitValue);
    
    setNewProduct({
      ...newProduct,
      basePrice: value,
      price: calculatedPrice.toFixed(2)
    });
    
    // Clear error when field is updated
    setErrors({
      ...errors,
      basePrice: ""
    });
  }
  
  // Handle image upload
  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      const reader = new FileReader()
      reader.onloadend = () => {
        setNewProductImage(reader.result as string)
        
        // Clear error when image is uploaded
        setErrors({
          ...errors,
          image: ""
        })
      }
      reader.readAsDataURL(file)
    }
  }
  
  // Handle edit image upload
  const handleEditImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      const reader = new FileReader()
      reader.onloadend = () => {
        setEditProductImage(reader.result as string)
      }
      reader.readAsDataURL(file)
    }
  }
  
  // Initialize edit form with product data
  const initializeEditForm = (product: Product) => {
    setEditProduct({
      id: product.id,
      name: product.name,
      category: product.category,
      price: product.price.toString(),
      basePrice: product.basePrice.toString(),
      profitType: product.profitType,
      profitValue: product.profitValue.toString(),
      stock: product.stock.toString(),
      supplier: product.supplier || "",
      description: product.description || "",
      sku: product.sku,
      lastRestocked: product.lastRestocked,
      expiryDate: product.expiryDate || "",
      isActive: product.isActive || true
    })
    setEditProductImage(null)
    setEditErrors({
      name: "",
      category: "",
      price: "",
      basePrice: "",
      profitValue: "",
      stock: "",
      sku: "",
      expiryDate: ""
    })
    setIsEditMode(true)
  }
  
  // Handle edit form field changes
  const handleEditInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target
    setEditProduct({
      ...editProduct,
      [name]: value
    })
    
    // Clear error when field is updated
    if (name in editErrors) {
      setEditErrors({
        ...editErrors,
        [name]: ""
      })
    }
  }
  
  // Handle edit category select change
  const handleEditCategoryChange = (value: string) => {
    setEditProduct({
      ...editProduct,
      category: value
    })
    
    // Clear error when field is updated
    setEditErrors({
      ...editErrors,
      category: ""
    })
  }
  
  // Handle edit profit type or value change to recalculate price
  const handleEditProfitChange = (type: string, value: string) => {
    const newProfitType = type || editProduct.profitType;
    const newProfitValue = value || editProduct.profitValue;
    
    const calculatedPrice = calculatePrice(editProduct.basePrice, newProfitType, newProfitValue);
    
    setEditProduct({
      ...editProduct,
      profitType: newProfitType as "percentage" | "fixed",
      profitValue: newProfitValue,
      price: calculatedPrice.toFixed(2)
    });
    
    // Clear error when field is updated
    if (value) {
      setEditErrors({
        ...editErrors,
        profitValue: ""
      });
    }
  }
  
  // Handle edit base price change to recalculate price
  const handleEditBasePriceChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { value } = e.target;
    const calculatedPrice = calculatePrice(value, editProduct.profitType, editProduct.profitValue);
    
    setEditProduct({
      ...editProduct,
      basePrice: value,
      price: calculatedPrice.toFixed(2)
    });
    
    // Clear error when field is updated
    setEditErrors({
      ...editErrors,
      basePrice: ""
    });
  }
  
  // Validate edit form
  const validateEditForm = (): boolean => {
    const newErrors = {
      name: "",
      category: "",
      price: "",
      basePrice: "",
      profitValue: "",
      stock: "",
      sku: "",
      expiryDate: ""
    }
    
    let isValid = true
    
    if (!editProduct.name.trim()) {
      newErrors.name = "Product name is required"
      isValid = false
    }
    
    if (!editProduct.category) {
      newErrors.category = "Category is required"
      isValid = false
    }
    
    if (!editProduct.basePrice || parseFloat(editProduct.basePrice) < 0) {
      newErrors.basePrice = "Valid base price is required"
      isValid = false
    }
    
    if (editProduct.profitType === "percentage") {
      if (!editProduct.profitValue || parseFloat(editProduct.profitValue) < 0) {
        newErrors.profitValue = "Valid profit percentage is required"
        isValid = false
      }
    } else {
      if (!editProduct.profitValue || parseFloat(editProduct.profitValue) < 0) {
        newErrors.profitValue = "Valid profit amount is required"
        isValid = false
      }
    }
    
    if (!editProduct.price || parseFloat(editProduct.price) <= 0) {
      newErrors.price = "Valid price is required"
      isValid = false
    }
    
    if (!editProduct.stock) {
      newErrors.stock = "Stock quantity is required"
      isValid = false
    } else {
      const stockValue = parseInt(editProduct.stock)
      if (isNaN(stockValue)) {
        newErrors.stock = "Stock must be a valid number"
        isValid = false
      } else if (stockValue < 0) {
        newErrors.stock = "Stock cannot be negative"
        isValid = false
      }
    }
    
    if (!editProduct.sku.trim()) {
      newErrors.sku = "SKU is required"
      isValid = false
    }
    
    if (editProduct.expiryDate) {
      const expiryDate = new Date(editProduct.expiryDate);
      if (isNaN(expiryDate.getTime())) {
        newErrors.expiryDate = "Invalid date format";
        isValid = false;
      }
    }
    
    setEditErrors(newErrors)
    return isValid
  }
  
  // Handle product update
  const handleUpdateProduct = async () => {
    if (!validateEditForm()) {
      return
    }
    
    setIsLoading(true)
    
    // Prepare product data for API
    const productData: any = {
      name: editProduct.name,
      price: parseFloat(editProduct.price),
      basePrice: parseFloat(editProduct.basePrice),
      profitType: editProduct.profitType as "percentage" | "fixed",
      profitValue: parseFloat(editProduct.profitValue),
      category: editProduct.category,
      stock: parseInt(editProduct.stock),
      description: editProduct.description,
      supplier: editProduct.supplier,
      sku: editProduct.sku,
      expiryDate: editProduct.expiryDate || null,
      isActive: editProduct.isActive
    }
    
    // Only include image if a new one was uploaded
    if (editProductImage) {
      productData.image = editProductImage
    }
    
    try {
      // Make API call to update product in database
      const response = await fetch(`/api/products/${editProduct.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(productData),
      })
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to update product');
      }
      
      const data = await response.json();
      
      // Update product in the products array
      const updatedProducts = products.map(product => {
        if (product.id === editProduct.id) {
          return {
            ...product,
            name: editProduct.name,
            price: parseFloat(editProduct.price),
            basePrice: parseFloat(editProduct.basePrice),
            profitType: editProduct.profitType as "percentage" | "fixed",
            profitValue: parseFloat(editProduct.profitValue),
            category: editProduct.category,
            stock: parseInt(editProduct.stock),
            description: editProduct.description,
            supplier: editProduct.supplier,
            sku: editProduct.sku,
            image: editProductImage || product.image,
            expiryDate: editProduct.expiryDate,
            isActive: editProduct.isActive
          }
        }
        return product
      })
      
      // Update the products state
      setProducts(updatedProducts)
      
      // If the updated product is currently selected, update the selected product
      if (selectedProduct && selectedProduct.id === editProduct.id) {
        setSelectedProduct({
          ...selectedProduct,
          name: editProduct.name,
          price: parseFloat(editProduct.price),
          basePrice: parseFloat(editProduct.basePrice),
          profitType: editProduct.profitType as "percentage" | "fixed",
          profitValue: parseFloat(editProduct.profitValue),
          category: editProduct.category,
          stock: parseInt(editProduct.stock),
          description: editProduct.description,
          supplier: editProduct.supplier,
          sku: editProduct.sku,
          image: editProductImage || selectedProduct.image,
          expiryDate: editProduct.expiryDate,
          isActive: editProduct.isActive
        })
      }
      
      // Show enhanced success message
      toast({
        title: "Product Updated Successfully",
        description: `${editProduct.name} has been updated with the latest information.`,
        variant: "default",
      })
      
      // Close the modal
      setIsProductDetailModalOpen(false)
      setIsEditMode(false)
      
      // Check for products near expiration
      checkForNearExpiryProducts(updatedProducts)
      
    } catch (error) {
      console.error('Error updating product:', error)
      toast({
        title: "Failed to Update Product",
        description: error instanceof Error ? error.message : "An unexpected error occurred. Please try again.",
        variant: "destructive"
      })
    } finally {
      setIsLoading(false)
    }
  }
  
  // Reset form fields
  const resetForm = () => {
    setNewProduct({
      name: "",
      category: "",
      price: "",
      basePrice: "",
      profitType: "percentage",
      profitValue: "",
      stock: "",
      supplier: "",
      description: "",
      sku: "",
      expiryDate: ""
    })
    setNewProductImage(null)
    setErrors({
      name: "",
      category: "",
      price: "",
      basePrice: "",
      profitValue: "",
      stock: "",
      image: "",
      sku: "",
      expiryDate: ""
    })
  }
  
  // Generate a random SKU if empty
  const generateSKU = () => {
    if (!newProduct.sku.trim()) {
      const prefix = newProduct.category.substring(0, 3).toUpperCase() || "PRD";
      const timestamp = Date.now().toString().slice(-6);
      const randomChars = Math.random().toString(36).substring(2, 5).toUpperCase();
      const sku = `${prefix}-${timestamp}-${randomChars}`;
      
      setNewProduct({
        ...newProduct,
        sku
      });
    }
  };
  
  // Validate form
  const validateForm = (): boolean => {
    const newErrors = {
      name: "",
      category: "",
      price: "",
      basePrice: "",
      profitValue: "",
      stock: "",
      image: "",
      sku: "",
      expiryDate: ""
    }
    
    let isValid = true
    
    if (!newProduct.name.trim()) {
      newErrors.name = "Product name is required"
      isValid = false
    }
    
    if (!newProduct.category) {
      newErrors.category = "Category is required"
      isValid = false
    }
    
    if (!newProduct.basePrice || parseFloat(newProduct.basePrice) < 0) {
      newErrors.basePrice = "Valid base price is required"
      isValid = false
    }
    
    if (newProduct.profitType === "percentage") {
      if (!newProduct.profitValue || parseFloat(newProduct.profitValue) < 0) {
        newErrors.profitValue = "Valid profit percentage is required"
        isValid = false
      }
    } else {
      if (!newProduct.profitValue || parseFloat(newProduct.profitValue) < 0) {
        newErrors.profitValue = "Valid profit amount is required"
        isValid = false
      }
    }
    
    if (!newProduct.price || parseFloat(newProduct.price) <= 0) {
      newErrors.price = "Valid price is required"
      isValid = false
    }
    
    if (!newProduct.stock) {
      newErrors.stock = "Stock quantity is required"
      isValid = false
    } else {
      const stockValue = parseInt(newProduct.stock)
      if (isNaN(stockValue)) {
        newErrors.stock = "Stock must be a valid number"
        isValid = false
      } else if (stockValue < 0) {
        newErrors.stock = "Stock cannot be negative"
        isValid = false
      }
    }
    
    if (!newProduct.sku.trim()) {
      newErrors.sku = "SKU is required"
      isValid = false
      // Generate SKU if missing
      generateSKU();
    }
    
    if (newProduct.expiryDate) {
      const expiryDate = new Date(newProduct.expiryDate);
      if (isNaN(expiryDate.getTime())) {
        newErrors.expiryDate = "Invalid date format";
        isValid = false;
      }
    }
    
    setErrors(newErrors)
    return isValid
  }
  
  // Handle product add submission
  const handleAddProduct = async () => {
    if (!validateForm()) {
      return
    }
    
    setIsLoading(true)
    
    // Prepare product data for API
    const productData: any = {
      name: newProduct.name,
      price: parseFloat(newProduct.price),
      basePrice: parseFloat(newProduct.basePrice),
      profitType: newProduct.profitType as "percentage" | "fixed",
      profitValue: parseFloat(newProduct.profitValue),
      category: newProduct.category,
      stock: parseInt(newProduct.stock),
      description: newProduct.description,
      supplier: newProduct.supplier,
      sku: newProduct.sku,
      expiryDate: newProduct.expiryDate || null
    }
    
    // Include image if one was uploaded
    if (newProductImage) {
      productData.image = newProductImage
    }
    
    try {
      // Make API call to add product to database
      const response = await fetch('/api/products', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(productData),
      })
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to add product');
      }
      
      const data = await response.json();
      
      // Add to products array for UI update
      const newProductItem: Product = {
        id: data.product.id || `${products.length + 1}`,
        name: newProduct.name,
        price: parseFloat(newProduct.price),
        basePrice: parseFloat(newProduct.basePrice),
        profitType: newProduct.profitType as "percentage" | "fixed",
        profitValue: parseFloat(newProduct.profitValue),
        category: newProduct.category,
        image: newProductImage || "",
        stock: parseInt(newProduct.stock),
        description: newProduct.description,
        supplier: newProduct.supplier,
        lastRestocked: new Date().toLocaleDateString('en-US', {
          month: 'short',
          day: 'numeric',
          year: 'numeric'
        }),
        sku: newProduct.sku,
        expiryDate: newProduct.expiryDate
      }
      
      // Update state with new product
      const updatedProducts = [...products, newProductItem]
      setProducts(updatedProducts)
      
      // Reset form and close modal
      resetForm()
      setIsAddProductModalOpen(false)
      
      // Show enhanced success message
      toast({
        title: "Product Added Successfully",
        description: `${newProduct.name} has been added to inventory with ${newProduct.stock} units.`,
        variant: "default",
      })
      
      // Check for products near expiration
      checkForNearExpiryProducts(updatedProducts)
      
    } catch (error) {
      console.error('Error adding product:', error)
      toast({
        title: "Failed to Add Product",
        description: error instanceof Error ? error.message : "An unexpected error occurred. Please try again.",
        variant: "destructive"
      })
    } finally {
      setIsLoading(false)
    }
  }
  
  // Validate stock update
  const validateStockUpdate = (): boolean => {
    // Clear previous error
    setStockUpdateError("")
    
    // Check if stock value is valid
    if (!updatedStock.trim()) {
      setStockUpdateError("Stock value is required")
      return false
    }
    
    const stockValue = parseInt(updatedStock)
    if (isNaN(stockValue)) {
      setStockUpdateError("Stock must be a valid number")
      return false
    }
    
    // Prevent negative stock values
    if (stockValue < 0) {
      setStockUpdateError("Stock cannot be negative")
      return false
    }
    
    return true
  }
  
  // Handle stock update
  const handleUpdateStock = async () => {
    if (!selectedProduct || !validateStockUpdate()) {
      return
    }
    
    setIsLoading(true)
    
    try {
      // API call to update stock in database
      const response = await fetch(`/api/products/${selectedProduct.id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          stock: parseInt(updatedStock),
          lastRestocked: new Date().toISOString(),
          expiryDate: selectedProduct.expiryDate // Include the existing expiry date
        }),
      })
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to update stock');
      }
      
      const data = await response.json();
      
      // Update product in the products array
      const updatedProducts = products.map(product => {
        if (product.id === selectedProduct.id) {
          return {
            ...product,
            stock: parseInt(updatedStock),
            lastRestocked: formatDate(new Date().toISOString()) || new Date().toLocaleDateString('en-US', {
              year: 'numeric',
              month: 'short',
              day: 'numeric'
            }),
            expiryDate: selectedProduct.expiryDate // Preserve the existing expiry date
          }
        }
        return product
      })
      
      // Update the products state
      setProducts(updatedProducts)
      
      // Show success message
      toast({
        title: "Stock Updated Successfully",
        description: `${selectedProduct.name} stock has been updated to ${updatedStock} units.`,
        variant: "default",
      })
      
      // Close the modal
      setIsProductDetailModalOpen(false)
      
      // Check for products near expiration
      checkForNearExpiryProducts(updatedProducts)
      
    } catch (error) {
      console.error('Error updating stock:', error)
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to update stock. Please try again.",
        variant: "destructive"
      })
    } finally {
      setIsLoading(false)
    }
  }
  
  // Handle product deletion (now archiving)
  const handleDeleteProduct = async (id: string) => {
    // Confirm archiving
    const confirmDelete = window.confirm("Are you sure you want to archive this product? Archived products will not appear in the POS system but can be restored later.")
    
    if (confirmDelete) {
      try {
        // API call to archive instead of delete
        const response = await fetch(`/api/products/${id}`, {
          method: 'DELETE',
        })
        
        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.message || 'Failed to archive product');
        }
        
        const data = await response.json();
        
        // Update the products array to reflect the archived status
        const updatedProducts = products.map(product => {
          if (product.id === id) {
            return { ...product, isActive: false }
          }
          return product
        })
        
        // Update the products state
        setProducts(updatedProducts)
        
        // If the archived product is currently selected, update the selected product
        if (selectedProduct && selectedProduct.id === id) {
          setSelectedProduct({ ...selectedProduct, isActive: false })
        }
        
        // Show enhanced success message
        toast({
          title: "Product Archived",
          description: "The product has been archived and will no longer appear in the POS system.",
          variant: "default",
        })
        
        // Close the modal if it's open
        setIsProductDetailModalOpen(false)
        
      } catch (error) {
        console.error('Error archiving product:', error)
        toast({
          title: "Failed to Archive Product",
          description: error instanceof Error ? error.message : "An unexpected error occurred. Please try again.",
          variant: "destructive"
        })
      }
    }
  }

  // Handle product activation
  const handleActivateProduct = async (id: string) => {
    try {
      // API call to activate product
      const response = await fetch(`/api/products/${id}/activate`, {
        method: 'POST',
      })
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to activate product');
      }
      
      const data = await response.json();
      
      // Update the products array to reflect the activated status
      const updatedProducts = products.map(product => {
        if (product.id === id) {
          return { ...product, isActive: true }
        }
        return product
      })
      
      // Update the products state
      setProducts(updatedProducts)
      
      // If the activated product is currently selected, update the selected product
      if (selectedProduct && selectedProduct.id === id) {
        setSelectedProduct({ ...selectedProduct, isActive: true })
      }
      
      // Show enhanced success message
      toast({
        title: "Product Activated",
        description: "The product has been activated and will now appear in the POS system.",
        variant: "default",
      })
      
    } catch (error) {
      console.error('Error activating product:', error)
      toast({
        title: "Failed to Activate Product",
        description: error instanceof Error ? error.message : "An unexpected error occurred. Please try again.",
        variant: "destructive"
      })
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar userType="cashier" userName="Cashier" />

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

          {/* Filters and Search */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
              <Input
                type="text"
                placeholder="Search products by name..."
                className="pl-10"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>

            <Select value={selectedCategory} onValueChange={setSelectedCategory}>
              <SelectTrigger>
                <SelectValue placeholder="Select category" />
              </SelectTrigger>
              <SelectContent>
                {categories.map((category) => (
                  <SelectItem key={category} value={category} className="capitalize">
                    {category}
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
                </SelectContent>
              </Select>

              <Button variant="outline" size="icon" onClick={toggleSortOrder}>
                <ArrowUpDown className={`h-4 w-4 ${sortOrder === "desc" ? "rotate-180" : ""} transition-transform`} />
              </Button>
            </div>
          </div>

          {/* Low Stock Alert */}
          {products.length > 0 && (
            <Card className="mb-6 border-red-200 bg-red-50">
              <CardContent className="p-4">
                <div className="flex items-start gap-3">
                  <AlertCircle className="h-5 w-5 text-red-500 flex-shrink-0 mt-0.5" />
                  <div>
                    <h3 className="font-medium text-gray-900">Low Stock Alert</h3>
                    <p className="text-sm text-gray-600">
                      {products.filter(p => p.stock < 30).length} products are running low on stock. Consider restocking soon.
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
              {isLoadingProducts ? (
                <div className="py-10 text-center">
                  <p className="text-gray-500">Loading products...</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="min-w-full">
                    <thead className="bg-gray-50 text-gray-600 text-sm">
                      <tr>
                        <th className="py-3 px-4 text-left">Product</th>
                        <th className="py-3 px-4 text-left">SKU</th>
                        <th className="py-3 px-4 text-left">Category</th>
                        <th className="py-3 px-4 text-left">
                          <button
                            className="flex items-center gap-1"
                            onClick={() => {
                              setSortBy("price")
                              toggleSortOrder()
                            }}
                          >
                            Price
                            {sortBy === "price" && (
                              <ArrowUpDown className={`h-3 w-3 transition-transform ${sortOrder === "desc" ? "rotate-180" : ""}`} />
                            )}
                          </button>
                        </th>
                        <th className="py-3 px-4 text-left">
                          <button
                            className="flex items-center gap-1"
                            onClick={() => {
                              setSortBy("stock")
                              toggleSortOrder()
                            }}
                          >
                            Stock
                            {sortBy === "stock" && (
                              <ArrowUpDown className={`h-3 w-3 transition-transform ${sortOrder === "desc" ? "rotate-180" : ""}`} />
                            )}
                          </button>
                        </th>
                        <th className="py-3 px-4 text-left">Status</th>
                        <th className="py-3 px-4 text-left">Last Updated</th>
                        <th className="py-3 px-4 text-center">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredProducts.length > 0 ? (
                        filteredProducts.map((product) => (
                          <motion.tr
                            key={product.id}
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            className={`border-b hover:bg-gray-50 cursor-pointer ${!product.isActive ? 'bg-gray-50 text-gray-500' : ''}`}
                            onClick={() => handleProductClick(product)}
                          >
                            <td className="py-3 px-4">
                              <div className="flex items-center gap-3">
                                <div className="relative h-10 w-10 rounded-md overflow-hidden bg-gray-100">
                                  <Image
                                    src={product.image || "/placeholder.svg"}
                                    alt={product.name}
                                    fill
                                    className="object-cover"
                                    unoptimized
                                    sizes="40px"
                                  />
                                </div>
                                <span className="font-medium">{product.name}</span>
                              </div>
                            </td>
                            <td className="py-3 px-4 text-gray-600 font-mono text-sm">{product.sku}</td>
                            <td className="py-3 px-4">
                              <Badge className="capitalize">{product.category}</Badge>
                            </td>
                            <td className="py-3 px-4 font-medium">₱{product.price.toFixed(2)}</td>
                            <td className="py-3 px-4">
                              <div className="flex flex-col">
                                <div className="flex items-center gap-1.5">
                                  <span className={`font-medium ${getStockStatus(product.stock).color}`}>
                                    {product.stock}
                                  </span>
                                  {getStockStatus(product.stock).badge && (
                                    <Badge className={`${getStockStatus(product.stock).bgColor} ${getStockStatus(product.stock).color} border-0 text-xs`}>
                                      {getStockStatus(product.stock).badge}
                                    </Badge>
                                  )}
                                </div>
                                {product.expiryDate && (
                                  <span className={`text-xs ${isExpired(product.expiryDate) ? 'text-red-500' : isExpiringSoon(product.expiryDate) ? 'text-amber-500' : ''}`}>
                                    Exp: {formatDate(product.expiryDate) || 'N/A'}
                                  </span>
                                )}
                              </div>
                            </td>
                            <td className="py-3 px-4">
                              {product.isActive ? (
                                <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                                  Active
                                </Badge>
                              ) : (
                                <Badge variant="outline" className="bg-gray-50 text-gray-700 border-gray-200">
                                  Archived
                                </Badge>
                              )}
                            </td>
                            <td className="py-3 px-4 text-gray-600">{product.lastRestocked}</td>
                            <td className="py-3 px-4">
                              <DropdownMenu>
                                <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                                  <Button variant="ghost" size="icon" className="h-8 w-8">
                                    <MoreHorizontal className="h-4 w-4" />
                                  </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end">
                                  <DropdownMenuLabel>Actions</DropdownMenuLabel>
                                  <DropdownMenuSeparator />
                                  <DropdownMenuItem onClick={(e) => {
                                    e.stopPropagation();
                                    handleProductClick(product);
                                  }}>
                                    <Edit className="h-4 w-4 mr-2" />
                                    Edit Product
                                  </DropdownMenuItem>
                                  <DropdownMenuItem onClick={(e) => {
                                    e.stopPropagation();
                                    handleProductClick(product);
                                  }}>
                                    <Package className="h-4 w-4 mr-2" />
                                    Update Stock
                                  </DropdownMenuItem>
                                  <DropdownMenuSeparator />
                                  {product.isActive ? (
                                    <DropdownMenuItem 
                                      className="text-red-600"
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        handleDeleteProduct(product.id);
                                      }}
                                    >
                                      <Archive className="h-4 w-4 mr-2" />
                                      Archive Product
                                    </DropdownMenuItem>
                                  ) : (
                                    <DropdownMenuItem 
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        handleActivateProduct(product.id);
                                      }}
                                    >
                                      <Package className="h-4 w-4 mr-2" />
                                      Restore Product
                                    </DropdownMenuItem>
                                  )}
                                </DropdownMenuContent>
                              </DropdownMenu>
                            </td>
                          </motion.tr>
                        ))
                      ) : (
                        <tr>
                          <td colSpan={7} className="py-10 text-center">
                            <Package className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                            <h3 className="text-lg font-medium text-gray-900">No products found</h3>
                            <p className="text-gray-500">Try adjusting your search or filters</p>
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </main>

      {/* Product Detail Modal */}
      <Dialog open={isProductDetailModalOpen} onOpenChange={setIsProductDetailModalOpen}>
        <DialogContent className="sm:max-w-md max-h-screen overflow-y-auto py-auto">
          <DialogHeader>
            <DialogTitle>{isEditMode ? "Edit Product" : "Product Details"}</DialogTitle>
            <DialogDescription>
              {isEditMode 
                ? "Edit product information" 
                : "View detailed information about this product"}
            </DialogDescription>
          </DialogHeader>

          {selectedProduct && (
            <>
              {/* Tabs for view/edit mode */}
              <Tabs defaultValue={isEditMode ? "edit" : "view"} className="w-full">
                <TabsList className="grid w-full grid-cols-2">
                  <TabsTrigger 
                    value="view" 
                    onClick={() => setIsEditMode(false)}
                    disabled={isLoading}
                  >
                    View Details
                  </TabsTrigger>
                  <TabsTrigger 
                    value="edit" 
                    onClick={() => {
                      if (!isEditMode) {
                        initializeEditForm(selectedProduct);
                      }
                    }}
                    disabled={isLoading}
                  >
                    Edit Product
                  </TabsTrigger>
                </TabsList>

                {/* View Mode */}
                <TabsContent value="view" className="mt-4">
                  <div className="grid gap-4">
                    <div className="relative aspect-video bg-gray-100 rounded-md overflow-hidden">
                      {selectedProduct.image && (
                        <Image
                          src={selectedProduct.image}
                          alt={selectedProduct.name}
                          fill
                          className="object-cover"
                          unoptimized // Add this to prevent optimization issues
                          sizes="(max-width: 768px) 100vw, 500px" // Add sizes to help with responsiveness
                        />
                      )}
                    </div>

                    <div className="grid gap-2">
                      <div className="flex justify-between items-start">
                        <h3 className="text-xl font-bold text-gray-900">{selectedProduct.name}</h3>
                        <Badge className="capitalize">{selectedProduct.category}</Badge>
                      </div>

                      <p className="text-sm text-gray-600 font-mono">SKU: {selectedProduct.sku}</p>
                      <p className="text-gray-600">{selectedProduct.description}</p>

                      <div className="grid grid-cols-2 gap-4 mt-2">
                        <div>
                          <p className="text-sm text-gray-500">Base Price</p>
                          <p className="font-medium">₱{selectedProduct.basePrice.toFixed(2)}</p>
                        </div>

                        <div>
                          <p className="text-sm text-gray-500">Profit Margin</p>
                          <p className="font-medium">
                            {selectedProduct.profitType === "percentage" 
                              ? `${selectedProduct.profitValue}%` 
                              : `₱${selectedProduct.profitValue.toFixed(2)}`}
                          </p>
                        </div>

                        <div>
                          <p className="text-sm text-gray-500">Selling Price</p>
                          <p className="font-bold text-amber-600">₱{selectedProduct.price.toFixed(2)}</p>
                        </div>

                        <div>
                          <p className="text-sm text-gray-500">Stock</p>
                          <div className="flex items-center gap-2">
                            <p
                              className={`font-bold ${getStockStatus(selectedProduct.stock).color}`}
                            >
                              {selectedProduct.stock} units
                            </p>
                            {getStockStatus(selectedProduct.stock).badge && (
                              <Badge className={`${getStockStatus(selectedProduct.stock).bgColor} ${getStockStatus(selectedProduct.stock).color} border-0`}>
                                {getStockStatus(selectedProduct.stock).badge}
                              </Badge>
                            )}
                          </div>
                        </div>

                        <div>
                          <p className="text-sm text-gray-500">Last Restocked</p>
                          <p className="font-medium">{selectedProduct.lastRestocked || 'N/A'}</p>
                        </div>

                        <div>
                          <p className="text-sm text-gray-500">Supplier</p>
                          <p className="font-medium">{selectedProduct.supplier}</p>
                        </div>

                        <div>
                          <p className="text-sm text-gray-500">Status</p>
                          <p className={`font-medium ${selectedProduct.isActive ? 'text-green-600' : 'text-red-600'}`}>
                            {selectedProduct.isActive ? 'Active' : 'Archived'}
                          </p>
                        </div>

                        <div>
                          <div className="text-sm text-gray-500">Expiry Date</div>
                          <div className={`font-medium ${isExpired(selectedProduct.expiryDate) ? 'text-red-600' : isExpiringSoon(selectedProduct.expiryDate) ? 'text-amber-600' : ''}`}>
                            {formatDate(selectedProduct.expiryDate) || 'N/A'}
                            {isExpired(selectedProduct.expiryDate) && (
                              <Badge variant="outline" className="ml-2 bg-red-50 text-red-700 border-red-200">
                                Expired
                              </Badge>
                            )}
                            {isExpiringSoon(selectedProduct.expiryDate) && !isExpired(selectedProduct.expiryDate) && (
                              <Badge variant="outline" className="ml-2 bg-amber-50 text-amber-700 border-amber-200">
                                Expires Soon
                              </Badge>
                            )}
                          </div>
                        </div>
                      </div>
                      
                      {/* Stock Update Form */}
                      <div className="mt-4 pt-4 border-t border-gray-200">
                        <h4 className="font-medium text-gray-900 mb-2">Update Stock</h4>
                        <div className="grid gap-2">
                          <label className="text-sm font-medium">New Stock Quantity</label>
                          <Input 
                            type="number" 
                            value={updatedStock}
                            onChange={handleStockInputChange}
                            className={stockUpdateError ? 'border-red-300' : ''}
                            min="0"
                          />
                          {stockUpdateError && (
                            <p className="text-xs text-red-500">{stockUpdateError}</p>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                </TabsContent>

                {/* Edit Mode */}
                <TabsContent value="edit" className="mt-4">
                  <div className="grid gap-4">
                    {/* Image Upload */}
                    <div 
                      className="relative aspect-video bg-gray-100 rounded-md overflow-hidden cursor-pointer flex flex-col items-center justify-center border-2 border-transparent"
                      onClick={() => editFileInputRef.current?.click()}
                    >
                      {editProductImage ? (
                        <Image
                          src={editProductImage}
                          alt="Product preview"
                          fill
                          className="object-cover"
                          unoptimized
                          sizes="(max-width: 768px) 100vw, 500px"
                        />
                      ) : selectedProduct.image ? (
                        <Image
                          src={selectedProduct.image}
                          alt={selectedProduct.name}
                          fill
                          className="object-cover"
                          unoptimized
                          sizes="(max-width: 768px) 100vw, 500px"
                        />
                      ) : (
                        <>
                          <ImageIcon className="h-10 w-10 text-gray-400 mb-2" />
                          <p className="text-sm text-gray-500">Click to upload product image</p>
                        </>
                      )}
                      <div className="absolute inset-0 bg-black bg-opacity-30 flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity">
                        <p className="text-white font-medium">Change Image</p>
                      </div>
                      <input 
                        title="image"
                        type="file" 
                        ref={editFileInputRef} 
                        className="hidden" 
                        accept="image/*"
                        onChange={handleEditImageUpload}
                      />
                    </div>
                    
                    <div className="grid grid-cols-2 gap-4">
                      <div className="grid gap-2">
                        <label className="text-sm font-medium">Product Name</label>
                        <Input 
                          placeholder="Enter product name" 
                          name="name"
                          value={editProduct.name}
                          onChange={handleEditInputChange}
                          className={editErrors.name ? 'border-red-300' : ''}
                        />
                        {editErrors.name && <p className="text-xs text-red-500">{editErrors.name}</p>}
                      </div>

                      <div className="grid gap-2">
                        <label className="text-sm font-medium">Category</label>
                        <Select value={editProduct.category} onValueChange={handleEditCategoryChange}>
                          <SelectTrigger className={editErrors.category ? 'border-red-300' : ''}>
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
                          </SelectContent>
                        </Select>
                        {editErrors.category && <p className="text-xs text-red-500">{editErrors.category}</p>}
                      </div>
                    </div>

                    <div className="grid gap-2">
                      <label className="text-sm font-medium">SKU (Stock Keeping Unit)</label>
                      <Input 
                        title="sku"
                        placeholder="Enter SKU" 
                        name="sku"
                        value={editProduct.sku}
                        onChange={handleEditInputChange}
                        className={editErrors.sku ? 'border-red-300' : ''}
                      />
                      {editErrors.sku && <p className="text-xs text-red-500">{editErrors.sku}</p>}
                    </div>

                    <div className="grid gap-2">
                      <label className="text-sm font-medium">Base Price (₱)</label>
                      <Input 
                        type="number" 
                        placeholder="0.00" 
                        name="basePrice"
                        value={editProduct.basePrice}
                        onChange={handleEditBasePriceChange}
                        className={editErrors.basePrice ? 'border-red-300' : ''}
                        step="0.01"
                        min="0"
                      />
                      <p className="text-xs text-gray-500">The price at which the product was purchased from the supplier.</p>
                      {editErrors.basePrice && <p className="text-xs text-red-500">{editErrors.basePrice}</p>}
                    </div>

                    <div className="grid gap-2">
                      <label className="text-sm font-medium">Profit Margin</label>
                      <div className="flex gap-2">
                        <Select 
                          value={editProduct.profitType} 
                          onValueChange={(value) => handleEditProfitChange(value, editProduct.profitValue)}
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
                          placeholder={editProduct.profitType === "percentage" ? "0%" : "₱0.00"} 
                          name="profitValue"
                          value={editProduct.profitValue}
                          onChange={(e) => handleEditProfitChange(editProduct.profitType, e.target.value)}
                          className={editErrors.profitValue ? 'border-red-300' : ''}
                          step="0.01"
                          min="0"
                        />
                      </div>
                      <p className="text-xs text-gray-500">
                        {editProduct.profitType === "percentage" 
                          ? "Percentage markup on the base price." 
                          : "Fixed amount added to the base price."}
                      </p>
                      {editErrors.profitValue && <p className="text-xs text-red-500">{editErrors.profitValue}</p>}
                    </div>

                    <div className="grid gap-2">
                      <label className="text-sm font-medium">Selling Price (₱)</label>
                      <Input 
                        type="number" 
                        placeholder="0.00" 
                        name="price"
                        value={editProduct.price}
                        onChange={handleEditInputChange}
                        className={editErrors.price ? 'border-red-300' : ''}
                        step="0.01"
                        min="0"
                        readOnly
                      />
                      <p className="text-xs text-gray-500">Final selling price calculated from base price and profit margin.</p>
                      {editErrors.price && <p className="text-xs text-red-500">{editErrors.price}</p>}
                    </div>

                    <div className="grid gap-2">
                      <label className="text-sm font-medium">Expiry Date (Optional)</label>
                      <Input 
                        type="date" 
                        name="expiryDate"
                        value={editProduct.expiryDate}
                        onChange={handleEditInputChange}
                        className={editErrors.expiryDate ? 'border-red-300' : ''}
                      />
                      {editErrors.expiryDate && <p className="text-xs text-red-500">{editErrors.expiryDate}</p>}
                      <p className="text-xs text-gray-500">The date when this product will expire. Leave empty if not applicable.</p>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div className="grid gap-2">
                        <label className="text-sm font-medium">Stock</label>
                        <Input 
                          type="number" 
                          placeholder="0" 
                          name="stock"
                          value={editProduct.stock}
                          onChange={handleEditInputChange}
                          className={editErrors.stock ? 'border-red-300' : ''}
                          min="0"
                        />
                        {editErrors.stock && <p className="text-xs text-red-500">{editErrors.stock}</p>}
                      </div>

                      <div className="grid gap-2">
                        <label className="text-sm font-medium">Status</label>
                        <div className="flex items-center space-x-2">
                          <input 
                            type="checkbox" 
                            id="isActive"
                            checked={editProduct.isActive} 
                            onChange={(e) => setEditProduct({...editProduct, isActive: e.target.checked})}
                            className="rounded border-gray-300 text-amber-600 shadow-sm focus:border-amber-300 focus:ring focus:ring-amber-200 focus:ring-opacity-50"
                          />
                          <label htmlFor="isActive" className="text-sm text-gray-700">
                            {editProduct.isActive ? 'Active (visible in POS)' : 'Archived (hidden from POS)'}
                          </label>
                        </div>
                      </div>
                    </div>

                    <div className="grid gap-2">
                      <label className="text-sm font-medium">Supplier</label>
                      <Input 
                        placeholder="Enter supplier name" 
                        name="supplier"
                        value={editProduct.supplier}
                        onChange={handleEditInputChange}
                      />
                    </div>

                    <div className="grid gap-2">
                      <label className="text-sm font-medium">Description</label>
                      <textarea
                        className="min-h-[80px] rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                        placeholder="Enter product description"
                        name="description"
                        value={editProduct.description}
                        onChange={handleEditInputChange}
                      />
                    </div>
                  </div>
                </TabsContent>
              </Tabs>
            </>
          )}

          <DialogFooter className="flex flex-col sm:flex-row gap-2">
            <Button variant="outline" className="sm:flex-1" onClick={() => {
              setIsProductDetailModalOpen(false);
              setIsEditMode(false);
            }}>
              Cancel
            </Button>
            {isEditMode ? (
              <Button 
                className="sm:flex-1 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600"
                onClick={handleUpdateProduct}
                disabled={isLoading}
              >
                {isLoading ? "Updating..." : "Save Changes"}
              </Button>
            ) : (
              <Button 
                className="sm:flex-1 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600"
                onClick={handleUpdateStock}
                disabled={isLoading}
              >
                {isLoading ? "Updating..." : "Update Stock"}
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Add Product Modal */}
      <Dialog open={isAddProductModalOpen} onOpenChange={setIsAddProductModalOpen}>
        <DialogContent className="sm:max-w-md max-h-screen overflow-y-auto py-2">
          <DialogHeader>
            <DialogTitle className="text-2xl font-bold sticky top-0">Add New Product</DialogTitle>
            <DialogDescription>Enter the details of the new product</DialogDescription>
          </DialogHeader>

          <div className="grid gap-4">
            {/* Image Upload */}
            <div 
              className={`relative aspect-video bg-gray-100 rounded-md overflow-hidden cursor-pointer flex flex-col items-center justify-center border-2 ${errors.image ? 'border-red-300' : 'border-transparent'}`}
              onClick={() => fileInputRef.current?.click()}
            >
              {newProductImage ? (
                <Image
                  src={newProductImage}
                  alt="Product preview"
                  fill
                  className="object-cover"
                  unoptimized
                  sizes="(max-width: 768px) 100vw, 500px"
                />
              ) : (
                <>
                  <ImageIcon className="h-10 w-10 text-gray-400 mb-2" />
                  <p className="text-sm text-gray-500">Click to upload product image</p>
                </>
              )}
              <input 
                title="image"
                type="file" 
                ref={fileInputRef} 
                className="hidden" 
                accept="image/*"
                onChange={handleImageUpload}
              />
            </div>
            {errors.image && <p className="text-xs text-red-500 -mt-3">{errors.image}</p>}
            
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <label className="text-sm font-medium">Product Name</label>
                <Input 
                  placeholder="Enter product name" 
                  name="name"
                  value={newProduct.name}
                  onChange={handleInputChange}
                  className={errors.name ? 'border-red-300' : ''}
                />
                {errors.name && <p className="text-xs text-red-500">{errors.name}</p>}
              </div>

              <div className="grid gap-2">
                <label className="text-sm font-medium">Category</label>
                <Select value={newProduct.category} onValueChange={handleCategoryChange}>
                  <SelectTrigger className={errors.category ? 'border-red-300' : ''}>
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
                  </SelectContent>
                </Select>
                {errors.category && <p className="text-xs text-red-500">{errors.category}</p>}
              </div>
            </div>

            <div className="grid gap-2">
              <label className="text-sm font-medium">SKU (Stock Keeping Unit)</label>
              <div className="flex gap-2">
                <Input 
                  placeholder="Enter SKU or generate automatically" 
                  name="sku"
                  value={newProduct.sku}
                  onChange={handleInputChange}
                  className={errors.sku ? 'border-red-300' : ''}
                />
                <Button 
                  variant="outline" 
                  type="button"
                  onClick={generateSKU}
                >
                  Generate
                </Button>
              </div>
              <p className="text-xs text-gray-500">A unique identifier for the product. Will be generated automatically if left empty.</p>
              {errors.sku && <p className="text-xs text-red-500">{errors.sku}</p>}
            </div>

            <div className="grid gap-2">
              <label className="text-sm font-medium">Base Price (₱)</label>
              <Input 
                type="number" 
                placeholder="0.00" 
                name="basePrice"
                value={newProduct.basePrice}
                onChange={handleBasePriceChange}
                className={errors.basePrice ? 'border-red-300' : ''}
                step="0.01"
                min="0"
              />
              <p className="text-xs text-gray-500">The price at which the product was purchased from the supplier.</p>
              {errors.basePrice && <p className="text-xs text-red-500">{errors.basePrice}</p>}
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
                  name="profitValue"
                  value={newProduct.profitValue}
                  onChange={(e) => handleProfitChange(newProduct.profitType, e.target.value)}
                  className={errors.profitValue ? 'border-red-300' : ''}
                  step="0.01"
                  min="0"
                />
              </div>
              <p className="text-xs text-gray-500">
                {newProduct.profitType === "percentage" 
                  ? "Percentage markup on the base price." 
                  : "Fixed amount added to the base price."}
              </p>
              {errors.profitValue && <p className="text-xs text-red-500">{errors.profitValue}</p>}
            </div>

            <div className="grid gap-2">
              <label className="text-sm font-medium">Selling Price (₱)</label>
              <Input 
                type="number" 
                placeholder="0.00" 
                name="price"
                value={newProduct.price}
                onChange={handleInputChange}
                className={errors.price ? 'border-red-300' : ''}
                step="0.01"
                min="0"
                readOnly
              />
              <p className="text-xs text-gray-500">Final selling price calculated from base price and profit margin.</p>
              {errors.price && <p className="text-xs text-red-500">{errors.price}</p>}
            </div>

            <div className="grid gap-2">
              <label className="text-sm font-medium">Expiry Date (Optional)</label>
              <Input 
                type="date" 
                name="expiryDate"
                value={newProduct.expiryDate}
                onChange={handleInputChange}
                className={errors.expiryDate ? 'border-red-300' : ''}
              />
              {errors.expiryDate && <p className="text-xs text-red-500">{errors.expiryDate}</p>}
              <p className="text-xs text-gray-500">The date when this product will expire. Leave empty if not applicable.</p>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <label className="text-sm font-medium">Initial Stock</label>
                <Input 
                  type="number" 
                  placeholder="0" 
                  name="stock"
                  value={newProduct.stock}
                  onChange={handleInputChange}
                  className={errors.stock ? 'border-red-300' : ''}
                  min="0"
                />
                {errors.stock && <p className="text-xs text-red-500">{errors.stock}</p>}
              </div>

              <div className="grid gap-2">
                <label className="text-sm font-medium">Supplier</label>
                <Input 
                  placeholder="Enter supplier name" 
                  name="supplier"
                  value={newProduct.supplier}
                  onChange={handleInputChange}
                />
              </div>
            </div>

            <div className="grid gap-2">
              <label className="text-sm font-medium">Description</label>
              <textarea
                className="min-h-[80px] rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                placeholder="Enter product description"
                name="description"
                value={newProduct.description}
                onChange={handleInputChange}
              />
            </div>
          </div>

          <DialogFooter className="flex flex-col sm:flex-row gap-2 mt-4">
            <Button 
              variant="outline" 
              className="sm:flex-1" 
              onClick={() => {
                resetForm()
                setIsAddProductModalOpen(false)
              }}
            >
              Cancel
            </Button>
            <Button
              className="sm:flex-1 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600"
              onClick={handleAddProduct}
              disabled={isLoading}
            >
              {isLoading ? "Adding..." : "Add Product"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
