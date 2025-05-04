"use client"

import { useState, useEffect } from "react"
import { motion } from "framer-motion"
import { Navbar } from "@/components/ui/navbar"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Package, Search, Plus, ArrowUpDown, MoreHorizontal, Edit, Trash2, AlertCircle, Barcode } from "lucide-react"
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
import { toast } from "@/components/ui/use-toast"

// Product type definition
interface Product {
  id: number
  name: string
  price: number
  category: string
  image: string
  sku: string
  stock: number
  description: string
  supplier: string
  lastRestocked: string
}

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
  
  // Form states for Add Product
  const [newProduct, setNewProduct] = useState({
    name: "",
    price: "",
    category: "",
    sku: "",
    stock: "",
    description: "",
    supplier: "",
    image: "/placeholder.svg"
  })
  
  // Form states for Edit Product
  const [editedProduct, setEditedProduct] = useState({
    name: "",
    price: "",
    category: "",
    sku: "",
    stock: "",
    description: "",
    supplier: "",
    image: ""
  })
  
  // Load products on component mount
  useEffect(() => {
    const fetchProducts = async () => {
      setIsLoading(true)
      try {
        const response = await fetch('/api/products')
        const data = await response.json()
        
        if (data.status === 'success') {
          setProducts(data.products)
          
          // Extract unique categories
          const uniqueCategories = ["all", ...Array.from(new Set(data.products.map((product: Product) => product.category)))]
          setCategories(uniqueCategories)
          
          // Count low stock items
          const lowStock = data.products.filter((product: Product) => product.stock < 10).length
          setLowStockCount(lowStock)
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
        default:
          comparison = 0
      }

      return sortOrder === "asc" ? comparison : -comparison
    })

  // Handle edit product
  const handleEditProduct = (product: Product) => {
    setSelectedProduct(product)
    setEditedProduct({
      name: product.name,
      price: product.price.toString(),
      category: product.category,
      sku: product.sku,
      stock: product.stock.toString(),
      description: product.description || "",
      supplier: product.supplier || "",
      image: product.image || "/placeholder.svg"
    })
    setIsEditProductModalOpen(true)
  }

  // Handle delete product
  const handleDeleteProduct = (product: Product) => {
    setSelectedProduct(product)
    setIsDeleteConfirmOpen(true)
  }
  
  // Handle add product submission
  const handleAddProduct = async () => {
    try {
      // Validate form
      if (!newProduct.name || !newProduct.price || !newProduct.category || !newProduct.sku) {
        toast({
          title: "Missing required fields",
          description: "Please fill in all required fields",
          variant: "destructive"
        })
        return
      }
      
      const response = await fetch('/api/products', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: newProduct.name,
          price: parseFloat(newProduct.price),
          category: newProduct.category,
          sku: newProduct.sku,
          stock: parseInt(newProduct.stock) || 0,
          description: newProduct.description,
          supplier: newProduct.supplier,
          image: newProduct.image
        })
      })
      
      const data = await response.json()
      
      if (data.status === 'success') {
        // Add the new product to the state
        setProducts([...products, data.product])
        
        // Reset form and close modal
        setNewProduct({
          name: "",
          price: "",
          category: "",
          sku: "",
          stock: "",
          description: "",
          supplier: "",
          image: "/placeholder.svg"
        })
        setIsAddProductModalOpen(false)
        
        // Show success toast
        toast({
          title: "Product added",
          description: "The product has been successfully added",
        })
        
        // Check if we need to add a new category
        if (!categories.includes(data.product.category)) {
          setCategories([...categories, data.product.category])
        }
      } else {
        toast({
          title: "Error adding product",
          description: data.message || "Failed to add product",
          variant: "destructive"
        })
      }
    } catch (err) {
      console.error('Error adding product:', err)
      toast({
        title: "Error",
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
          title: "Missing required fields",
          description: "Please fill in all required fields",
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
          category: editedProduct.category,
          sku: editedProduct.sku,
          stock: parseInt(editedProduct.stock) || 0,
          description: editedProduct.description,
          supplier: editedProduct.supplier,
          image: editedProduct.image
        })
      })
      
      const data = await response.json()
      
      if (data.status === 'success') {
        // Update product in the state
        setProducts(products.map(p => p.id === selectedProduct.id ? data.product : p))
        
        // Close modal
        setIsEditProductModalOpen(false)
        
        // Show success toast
        toast({
          title: "Product updated",
          description: "The product has been successfully updated",
        })
        
        // Check if we need to add a new category
        if (!categories.includes(data.product.category)) {
          setCategories([...categories, data.product.category])
        }
      } else {
        toast({
          title: "Error updating product",
          description: data.message || "Failed to update product",
          variant: "destructive"
        })
      }
    } catch (err) {
      console.error('Error updating product:', err)
      toast({
        title: "Error",
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
        setProducts(products.filter(p => p.id !== selectedProduct.id))
        
        // Close modal
        setIsDeleteConfirmOpen(false)
        
        // Show success toast
        toast({
          title: "Product deleted",
          description: "The product has been successfully deleted",
        })
        
        // Update low stock count
        setLowStockCount(products.filter(p => p.id !== selectedProduct.id && p.stock < 10).length)
      } else {
        toast({
          title: "Error deleting product",
          description: data.message || "Failed to delete product",
          variant: "destructive"
        })
      }
    } catch (err) {
      console.error('Error deleting product:', err)
      toast({
        title: "Error",
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
      category: product.category,
      sku: product.sku,
      stock: product.stock.toString(),
      description: product.description || "",
      supplier: product.supplier || "",
      image: product.image || "/placeholder.svg"
    })
    setIsEditProductModalOpen(true)
  }

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
                    <thead>
                      <tr className="border-b">
                        <th className="text-left py-3 px-4 font-medium text-gray-600">Product</th>
                        <th className="text-left py-3 px-4 font-medium text-gray-600">Category</th>
                        <th className="text-left py-3 px-4 font-medium text-gray-600">Price</th>
                        <th className="text-left py-3 px-4 font-medium text-gray-600">Stock</th>
                        <th className="text-left py-3 px-4 font-medium text-gray-600">Barcode</th>
                        <th className="text-left py-3 px-4 font-medium text-gray-600">Last Restocked</th>
                        <th className="text-left py-3 px-4 font-medium text-gray-600">Actions</th>
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
                          <td className="py-3 px-4">
                            <div className="flex items-center gap-3">
                              <div className="relative h-10 w-10 rounded-md overflow-hidden bg-gray-100">
                                <Image
                                  src={product.image || "/placeholder.svg"}
                                  alt={product.name}
                                  fill
                                  className="object-cover"
                                />
                              </div>
                              <span className="font-medium">{product.name}</span>
                            </div>
                          </td>
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
                          <td className="py-3 px-4 text-gray-600">{product.sku}</td>
                          <td className="py-3 px-4 text-gray-600">{product.lastRestocked}</td>
                          <td className="py-3 px-4">
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="icon" className="h-8 w-8">
                                  <MoreHorizontal className="h-4 w-4" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end">
                                <DropdownMenuLabel>Actions</DropdownMenuLabel>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem onClick={() => handleEditProduct(product)}>
                                  <Edit className="h-4 w-4 mr-2" />
                                  Edit Product
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={() => handleUpdateStock(product)}>
                                  <Package className="h-4 w-4 mr-2" />
                                  Update Stock
                                </DropdownMenuItem>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem className="text-red-600" onClick={() => handleDeleteProduct(product)}>
                                  <Trash2 className="h-4 w-4 mr-2" />
                                  Delete Product
                                </DropdownMenuItem>
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
      <Dialog open={isAddProductModalOpen} onOpenChange={setIsAddProductModalOpen}>
        <DialogContent className="sm:max-w-md">
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
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <label className="text-sm font-medium">Price (₱)</label>
                <Input 
                  type="number" 
                  placeholder="0.00" 
                  value={newProduct.price}
                  onChange={(e) => setNewProduct({...newProduct, price: e.target.value})}
                />
              </div>

              <div className="grid gap-2">
                <label className="text-sm font-medium">Initial Stock</label>
                <Input 
                  type="number" 
                  placeholder="0" 
                  value={newProduct.stock}
                  onChange={(e) => setNewProduct({...newProduct, stock: e.target.value})}
                />
              </div>
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
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Edit Product</DialogTitle>
            <DialogDescription>Update product information</DialogDescription>
          </DialogHeader>

          {selectedProduct && (
            <div className="grid gap-4">
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

              <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <label className="text-sm font-medium">Price (₱)</label>
                  <Input 
                    type="number" 
                    placeholder="0.00" 
                    value={editedProduct.price} 
                    onChange={(e) => setEditedProduct({...editedProduct, price: e.target.value})}
                  />
                </div>

                <div className="grid gap-2">
                  <label className="text-sm font-medium">Stock</label>
                  <Input 
                    type="number" 
                    placeholder="0" 
                    value={editedProduct.stock} 
                    onChange={(e) => setEditedProduct({...editedProduct, stock: e.target.value})}
                  />
                </div>
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
                <label className="text-sm font-medium">Supplier</label>
                <Input 
                  placeholder="Enter supplier name" 
                  value={editedProduct.supplier} 
                  onChange={(e) => setEditedProduct({...editedProduct, supplier: e.target.value})}
                />
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
                  {selectedProduct.category} - ₱{selectedProduct.price.toFixed(2)}
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
    </div>
  )
}
