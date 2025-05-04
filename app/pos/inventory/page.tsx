"use client"

import { useState, useRef, useEffect } from "react"
import { motion } from "framer-motion"
import { Search, Plus, Package, ArrowUpDown, MoreHorizontal, Edit, Trash2, AlertCircle, Image as ImageIcon } from "lucide-react"
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
  category: string
  image: string
  stock: number
  description: string
  supplier: string
  lastRestocked: string
  sku: string
}
// Category type definition
interface Category {
  id: string
  name: string
  description: string
  createdAt: string
  updatedAt: string
}


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
  
  // Form state for new product
  const [newProduct, setNewProduct] = useState({
    name: "",
    category: "",
    price: "",
    stock: "",
    supplier: "",
    description: "",
    sku: ""
  })
  
  // Form state for editing product
  const [editProduct, setEditProduct] = useState({
    id: "",
    name: "",
    category: "",
    price: "",
    stock: "",
    supplier: "",
    description: "",
    sku: "",
    lastRestocked: ""
  })
  
  // For stock update in the product detail modal
  const [updatedStock, setUpdatedStock] = useState("")
  const [stockUpdateError, setStockUpdateError] = useState("")
  
  // Form validation errors for new product
  const [errors, setErrors] = useState({
    name: "",
    category: "",
    price: "",
    stock: "",
    image: "",
    sku: ""
  })
  
  // Form validation errors for edit product
  const [editErrors, setEditErrors] = useState({
    name: "",
    category: "",
    price: "",
    stock: "",
    sku: ""
  })

  // Products state - will be fetched from API
  const [products, setProducts] = useState<Product[]>([
    {
      id: "1",
      name: "Organic Rice",
      price: 75.5,
      category: "grocery",
      image: "https://images.unsplash.com/photo-1586201375761-83865001e31c?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=300&q=80",
      stock: 50,
      description: "Premium organic rice grown locally by our cooperative members. High quality and nutritious.",
      supplier: "Local Farmers Cooperative",
      lastRestocked: "Apr 10, 2025",
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
        if (data.products && Array.isArray(data.products)) {
          // Map database columns to frontend model
          const formattedProducts = data.products.map((p: { Products: any; Categories: { Name: any }; category: any }) => {
            // Handle the case where p.Products is the actual product data (from a join query)
            const product = p.Products || p;
            const category = p.Categories ? p.Categories.Name : (p.category || 'uncategorized');
            
            return {
              id: (product.ProductId || product.id || '').toString(),
              name: product.Name || product.name || 'Unnamed Product',
              price: parseFloat(product.Price || product.price || 0),
              category: category,
              image: product.Image || product.image || '/placeholder.svg',
              stock: parseInt(product.StockQuantity || product.stock || 0),
              description: product.Description || product.description || '',
              supplier: product.Supplier || product.supplier || 'No supplier',
              lastRestocked: product.LastRestocked || product.lastRestocked || new Date().toLocaleDateString(),
              sku: product.Sku || product.sku || 'NO-SKU'
            };
          });
          
          setProducts(formattedProducts);
          console.log('Loaded products:', formattedProducts);
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
      stock: product.stock.toString(),
      supplier: product.supplier || "",
      description: product.description || "",
      sku: product.sku,
      lastRestocked: product.lastRestocked
    })
    setEditProductImage(null)
    setEditErrors({
      name: "",
      category: "",
      price: "",
      stock: "",
      sku: ""
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
  
  // Validate edit form
  const validateEditForm = (): boolean => {
    const newErrors = {
      name: "",
      category: "",
      price: "",
      stock: "",
      sku: ""
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
    
    if (!editProduct.price || parseFloat(editProduct.price) <= 0) {
      newErrors.price = "Valid price is required"
      isValid = false
    }
    
    if (!editProduct.stock || parseInt(editProduct.stock) < 0) {
      newErrors.stock = "Valid stock quantity is required"
      isValid = false
    }
    
    if (!editProduct.sku.trim()) {
      newErrors.sku = "SKU is required"
      isValid = false
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
      category: editProduct.category,
      stock: parseInt(editProduct.stock),
      description: editProduct.description,
      supplier: editProduct.supplier,
      sku: editProduct.sku
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
      
      // Update product in the products array
      const updatedProducts = products.map(product => {
        if (product.id === editProduct.id) {
          return {
            ...product,
            name: editProduct.name,
            price: parseFloat(editProduct.price),
            category: editProduct.category,
            stock: parseInt(editProduct.stock),
            description: editProduct.description,
            supplier: editProduct.supplier,
            sku: editProduct.sku,
            image: editProductImage || product.image
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
          category: editProduct.category,
          stock: parseInt(editProduct.stock),
          description: editProduct.description,
          supplier: editProduct.supplier,
          sku: editProduct.sku,
          image: editProductImage || selectedProduct.image
        })
      }
      
      // Show success message
      toast({
        title: "Product Updated",
        description: `${editProduct.name} has been updated successfully.`,
      })
      
      // Exit edit mode
      setIsEditMode(false)
      
    } catch (error) {
      console.error('Error updating product:', error)
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to update product. Please try again.",
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
      stock: "",
      supplier: "",
      description: "",
      sku: ""
    })
    setNewProductImage(null)
    setErrors({
      name: "",
      category: "",
      price: "",
      stock: "",
      image: "",
      sku: ""
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
  
  // Validate form fields
  const validateForm = (): boolean => {
    const newErrors = {
      name: "",
      category: "",
      price: "",
      stock: "",
      image: "",
      sku: ""
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
    
    if (!newProduct.price || parseFloat(newProduct.price) <= 0) {
      newErrors.price = "Valid price is required"
      isValid = false
    }
    
    if (!newProduct.stock || parseInt(newProduct.stock) < 0) {
      newErrors.stock = "Valid stock quantity is required"
      isValid = false
    }
    
    if (!newProductImage) {
      newErrors.image = "Product image is required"
      isValid = false
    }
    
    if (!newProduct.sku.trim()) {
      // Instead of marking as error, we'll generate a SKU
      generateSKU();
    }
    
    setErrors(newErrors)
    return isValid
  }
  
  // Handle product addition
  const handleAddProduct = async () => {
    if (!validateForm()) {
      return
    }
    
    setIsLoading(true)
    
    // Generate SKU if not provided
    if (!newProduct.sku.trim()) {
      generateSKU();
    }
    
    // Prepare product data for API
    const productData = {
      name: newProduct.name,
      price: parseFloat(newProduct.price),
      category: newProduct.category,
      image: newProductImage,
      stock: parseInt(newProduct.stock),
      description: newProduct.description,
      supplier: newProduct.supplier,
      sku: newProduct.sku
    }
    
    try {
      // Make API call to save product to database
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
        sku: newProduct.sku
      }
      
      // Update state with new product
      setProducts([...products, newProductItem])
      
      // Show success message
      toast({
        title: "Product Added",
        description: `${newProduct.name} has been added to inventory.`,
      })
      
      // Reset form
      resetForm()
      setIsAddProductModalOpen(false)
      
    } catch (error) {
      console.error('Error adding product:', error)
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to add product. Please try again.",
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
    if (isNaN(stockValue) || stockValue < 0) {
      setStockUpdateError("Stock must be a valid positive number")
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
          lastRestocked: new Date().toISOString()
        }),
      })
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to update stock');
      }
      
      // Update product in the products array
      const updatedProducts = products.map(product => {
        if (product.id === selectedProduct.id) {
          return {
            ...product,
            stock: parseInt(updatedStock),
            lastRestocked: new Date().toLocaleDateString('en-US', {
              month: 'short',
              day: 'numeric',
              year: 'numeric'
            })
          }
        }
        return product
      })
      
      // Update the products state
      setProducts(updatedProducts)
      
      // Show success message
      toast({
        title: "Stock Updated",
        description: `${selectedProduct.name} stock has been updated to ${updatedStock} units.`,
      })
      
      // Close the modal and reset loading state
      setIsProductDetailModalOpen(false)
      
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
  
  // Handle product deletion
  const handleDeleteProduct = async (id: string) => {
    // Confirm deletion
    const confirmDelete = window.confirm("Are you sure you want to delete this product?")
    
    if (confirmDelete) {
      try {
        // API call to delete from database
        const response = await fetch(`/api/products/${id}`, {
          method: 'DELETE',
        })
        
        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.message || 'Failed to delete product');
        }
        
        // Remove from UI
        setProducts(products.filter(product => product.id !== id))
        
        toast({
          title: "Product Deleted",
          description: "The product has been removed from inventory.",
        })
      } catch (error) {
        console.error('Error deleting product:', error)
        toast({
          title: "Error",
          description: error instanceof Error ? error.message : "Failed to delete product. Please try again.",
          variant: "destructive"
        })
      }
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
                  <table className="w-full">
                    <thead>
                      <tr className="border-b">
                        <th className="text-left py-3 px-4 font-medium text-gray-600">Product</th>
                        <th className="text-left py-3 px-4 font-medium text-gray-600">SKU</th>
                        <th className="text-left py-3 px-4 font-medium text-gray-600">Category</th>
                        <th className="text-left py-3 px-4 font-medium text-gray-600">Price</th>
                        <th className="text-left py-3 px-4 font-medium text-gray-600">Stock</th>
                        <th className="text-left py-3 px-4 font-medium text-gray-600">Last Restocked</th>
                        <th className="text-left py-3 px-4 font-medium text-gray-600">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredProducts.length > 0 ? (
                        filteredProducts.map((product) => (
                          <motion.tr
                            key={product.id}
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            className="border-b hover:bg-gray-50 cursor-pointer"
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
                              <span
                                className={`inline-block px-2 py-1 rounded-full text-xs font-medium ${
                                  product.stock < 10
                                    ? "bg-red-100 text-red-800"
                                    : product.stock < 30
                                      ? "bg-amber-100 text-amber-800"
                                      : "bg-green-100 text-green-800"
                                }`}
                              >
                                {product.stock}
                              </span>
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
                                  <DropdownMenuItem 
                                    className="text-red-600"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      handleDeleteProduct(product.id);
                                    }}
                                  >
                                    <Trash2 className="h-4 w-4 mr-2" />
                                    Delete Product
                                  </DropdownMenuItem>
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
                          <p className="text-sm text-gray-500">Price</p>
                          <p className="font-bold text-amber-600">₱{selectedProduct.price.toFixed(2)}</p>
                        </div>

                        <div>
                          <p className="text-sm text-gray-500">Stock</p>
                          <p
                            className={`font-bold ${
                              selectedProduct.stock < 10
                                ? "text-red-600"
                                : selectedProduct.stock < 30
                                  ? "text-amber-600"
                                  : "text-green-600"
                            }`}
                          >
                            {selectedProduct.stock} units
                          </p>
                        </div>

                        <div>
                          <p className="text-sm text-gray-500">Last Restocked</p>
                          <p className="font-medium">{selectedProduct.lastRestocked}</p>
                        </div>

                        <div>
                          <p className="text-sm text-gray-500">Supplier</p>
                          <p className="font-medium">{selectedProduct.supplier}</p>
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

                    <div className="grid grid-cols-2 gap-4">
                      <div className="grid gap-2">
                        <label className="text-sm font-medium">Price (₱)</label>
                        <Input 
                          type="number" 
                          placeholder="0.00" 
                          name="price"
                          value={editProduct.price}
                          onChange={handleEditInputChange}
                          className={editErrors.price ? 'border-red-300' : ''}
                          step="0.01"
                          min="0"
                        />
                        {editErrors.price && <p className="text-xs text-red-500">{editErrors.price}</p>}
                      </div>

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

            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <label className="text-sm font-medium">Price (₱)</label>
                <Input 
                  type="number" 
                  placeholder="0.00" 
                  name="price"
                  value={newProduct.price}
                  onChange={handleInputChange}
                  className={errors.price ? 'border-red-300' : ''}
                  step="0.01"
                  min="0"
                />
                {errors.price && <p className="text-xs text-red-500">{errors.price}</p>}
              </div>

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
