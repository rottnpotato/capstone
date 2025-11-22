"use client"

import { useState, useEffect, useRef, ReactNode, useTransition } from "react";
import { io, Socket } from "socket.io-client";
import { motion, AnimatePresence } from "framer-motion";
import { Navbar } from "@/components/ui/navbar"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import jsPDF from "jspdf"
import autoTable from 'jspdf-autotable'
import { Package, Search, Plus, ArrowUpDown, MoreHorizontal, Edit, Trash2, AlertCircle, Image as ImageIcon, Archive } from "lucide-react"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectGroup, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
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
  TrendingUp,
  Package2,
  FileText,
  Barcode,
  Download,
} from "lucide-react"
import { useToast } from "@/components/ui/use-toast"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { desc } from "drizzle-orm"

interface ProductUnit {
  id?: string
  name: string
  conversionFactor: number
  price?: number | null
  barcode?: string | null
}

// Product type definition
interface Product {
  id: string
  name: string
  price: number
  basePrice: number
  profitValue: number
  category: string
  stock: number
  unit: string
  productUnits: ProductUnit[]
  description: string
  supplier: string
  lastRestocked: string
  sku: string
  expiryDate?: string | null
  image?: string | null
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
  const oneMonthFromNow = new Date();
  oneMonthFromNow.setDate(today.getDate() + 30); // Set to 30 days from now

  return date > today && date <= oneMonthFromNow;
};

// Add a helper function to determine stock status
const getStockStatus = (stock: number) => {
  if (stock < 15) return { color: 'text-red-500', badge: 'Low', bgColor: 'bg-red-100' };
  return { color: 'text-green-500', badge: null, bgColor: 'bg-green-100' };
};

interface AlertData {
  type: 'lowStock' | 'expiry' | 'expired';
  title: string;
  message: string;
  icon: ReactNode;
  className: string;
  count: number;
  filterType: 'lowStock' | 'expiringSoon' | 'expired';
}

export default function AdminInventoryPage() {
  const [searchQuery, setSearchQuery] = useState("")
  const [selectedCategory, setSelectedCategory] = useState("all")
  const [statusFilter, setStatusFilter] = useState("active") // 'active', 'archived', 'all'
  const [sortBy, setSortBy] = useState("name")
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("asc")
  const [isAddProductModalOpen, setIsAddProductModalOpen] = useState(false)
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null)
  const [isProductDetailModalOpen, setIsProductDetailModalOpen] = useState(false)
  const [isDeleteConfirmOpen, setIsDeleteConfirmOpen] = useState(false)
  const [isEditMode, setIsEditMode] = useState(false);
  const [isLoadingProducts, setIsLoadingProducts] = useState(false)
  const [newProductImage, setNewProductImage] = useState<String | null>(null)
  const[editProductImage, setEditProductImage] = useState<String | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const editFileInputRef = useRef<HTMLInputElement>(null)
  const [products, setProducts] = useState<Product[]>([])
  const [category, setCategory] = useState<Category[]>([])
  const [alerts, setAlerts] = useState<AlertData[]>([]);
  const [currentAlertIndex, setCurrentAlertIndex] = useState(0);
  const {toast} = useToast()
  const [alertFilter, setAlertFilter] = useState<'lowStock' | 'expiringSoon' | 'expired' | null>(null);
  const [isPending, startTransition] = useTransition();
  const [isLoading, setIsLoading] = useState(false)
  
  //state for inventory summary (kept from original admin page )
  const [inventorySummary, setInventorySummary] = useState({
    totalValue: 0,
    totalProfit: 0,
    totalStock: 0,
    totalBaseValue: 0,
  })

  useEffect(() => {
    if (products.length > 0) {
      console.log('Products before filtering:', products);
      const activeProducts = products.filter(p => p.isActive);
      // Calculate inventory summary
      const totalValue = activeProducts.reduce((sum, p) => sum + p.price * p.stock, 0);
      const totalProfit = activeProducts.reduce((sum, p) => sum + (p.profitValue || 0) * p.stock, 0);
      const totalBaseValue = activeProducts.reduce((sum, p) => sum + (p.basePrice || 0) * p.stock, 0);
      const totalStock = activeProducts.reduce((sum, p) => sum + p.stock, 0);

      setInventorySummary({
        totalValue,
        totalProfit,
        totalBaseValue,
        totalStock,
      });
    }
  }, [products])

  useEffect(() => {
    const lowStockProducts = products.filter(p => p.stock < 15);
    const expiringProducts = products.filter(p => p.expiryDate && isExpiringSoon(p.expiryDate) && !isExpired(p.expiryDate));
    const expiredProducts = products.filter(p => p.expiryDate && isExpired(p.expiryDate));

    const availableAlerts: AlertData[] = [];

    if (expiredProducts.length > 0) {
      availableAlerts.push({
        type: 'expiry',
        title: 'Expired Items Alert (Click to view)',
        message: `${expiredProducts.length} products have expired. Please remove them from inventory.`,
        icon: <AlertCircle className="h-5 w-5 text-red-700 flex-shrink-0 mt-0.5" />,
        className: 'border-red-300 bg-red-100',
        count: expiredProducts.length,
        filterType: 'expired',
      });
    }


    if (expiringProducts.length > 0) {
      availableAlerts.push({
        type: 'expiry',
        title: 'Expiry Alert (Click to view)',
        message: `${expiringProducts.length} products are expiring within a month.`,
        icon: <AlertCircle className="h-5 w-5 text-amber-500 flex-shrink-0 mt-0.5" />,
        className: 'border-amber-200 bg-amber-50',
        count: expiringProducts.length,
        filterType: 'expiringSoon',
      });
    }

    if (lowStockProducts.length > 0) {
      availableAlerts.push({
        type: 'lowStock',
        title: 'Low Stock Alert (Click to view)',
        message: `${lowStockProducts.length} products are running low on stock. Consider restocking soon.`,
        icon: <AlertCircle className="h-5 w-5 text-red-500 flex-shrink-0 mt-0.5" />,
        className: 'border-red-200 bg-red-50',
        count: lowStockProducts.length,
        filterType: 'lowStock',
      });
    }

    setAlerts(availableAlerts);
    setCurrentAlertIndex(0);
  }, [products]);

  useEffect(() => {
    if (alerts.length > 1) {
      const interval = setInterval(() => {
        setCurrentAlertIndex(prevIndex => (prevIndex + 1) % alerts.length);
      }, 5000); // Change alert every 5 seconds

      return () => clearInterval(interval);
    }
  }, [alerts.length]);

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

  const [newProduct, setNewProduct] = useState({
  
    name: "",
    category: "",
    price: "",
    basePrice: "",
    profitValue: "",
    stock: "",
    unit: "pcs",
    productUnits: [] as ProductUnit[],
    supplier: "",
    sku: "",
    description: "",
    expiryDate: "",
    image: null as string | null,
  })
  
  const [editedProduct, setEditedProduct] = useState({
    id: "",
    name: "",
    category: "",
    price: "",
    basePrice: "",
    profitValue: "",
    stock: "",
    unit: "pcs",
    productUnits: [] as ProductUnit[],
    supplier: "",
    description: "",
    sku: "",
    lastRestocked: "",
    // profitType: "fixed",
    expiryDate: "",
    isActive: true, // Default to active
    image: null as string | null,
  })
  
  const [updatedStock, setUpdatedStock] = useState("")
  const [stockUpdateError, setStockUpdateError] = useState("")

  const [errors, setErrors] = useState({
    name: "",
    category: "",
    price: "",
    basePrice: "",
    profitValue: "",
    stock: "",
    image: "",
    sku: "",
    expiryDate: "",
  })

  const [editErrors, setEditErrors] = useState({
    name: "",
    category: "",
    price: "",
    basePrice: "",
    profitValue: "",
    stock: "",
    image: "",
    sku: "",
    expiryDate: "",
  })

  const [stockUpdateUnit, setStockUpdateUnit] = useState("base");
  
  // Calculate price based on base price and profit settings
  const calculatePrice = (basePrice: string, profitValue: string): number => {
    const basePriceNum = parseFloat(basePrice);

    const profitValueNum = parseFloat(profitValue);

    if (isNaN(basePriceNum) || isNaN(profitValueNum)) {
      return isNaN(basePriceNum) ? 0 : basePriceNum;
    }
    return basePriceNum + profitValueNum;
  }
  
  // Handle profit type or value change to recalculate price for new product
  const handleProfitChange = (value: string) => {
    const newProfitValue = value || newProduct.profitValue;
    
    const calculatedPrice = calculatePrice(newProduct.basePrice, newProfitValue);
    
    setNewProduct({
      ...newProduct,
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
  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>, isEdit: boolean) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => { 
        if (isEdit) {
          setEditedProduct({ ...editedProduct, image: reader.result as string });
        } else {
          setNewProduct({ ...newProduct, image: reader.result as string });
        }
      };
      reader.readAsDataURL(file);
    }
  };
  // Load products and set up socket on component mount
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
              price: parseFloat(product.Price || product.price || '0'),
              basePrice: parseFloat(product.BasePrice || product.basePrice || '0'),
              profitValue: parseFloat(product.Price || product.price || '0') - parseFloat(product.BasePrice || product.basePrice || '0'),
              profitType: product.ProfitType || product.profitType || 'fixed',
              category: category,
              image: product.Image || product.image || '/placeholder.svg',
              stock: parseFloat(product.StockQuantity || product.stock || 0),
              unit: product.Unit || product.unit || 'pcs',
              productUnits: product.ProductUnits || product.productUnits || [],
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

    // Initialize socket connection
    const socket: Socket = io();

    // Listen for real-time product updates
    socket.on('product_updated', (updatedProduct: Product) => {
      console.log('Product update received:', updatedProduct);
      setProducts(prevProducts =>
        prevProducts.map(p => (p.id === updatedProduct.id ? { ...p, ...updatedProduct } : p))
      );
      toast({
        title: "Inventory Updated",
        description: `${updatedProduct.name} has been updated in real-time.`,
      });
    });

    socket.on('connect', () => {
      console.log('Connected to inventory socket');
    });

    socket.on('disconnect', () => {
      console.log('Disconnected from inventory socket');
    });

    // Cleanup on unmount
    return () => {
      socket.disconnect();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // Filter and sort products
  const filteredProducts = products
    .filter((product) => {
      const matchesSearch = product.name.toLowerCase().includes(searchQuery.toLowerCase())
      const matchesCategory = selectedCategory === "all" || product.category === selectedCategory;
      const matchesStatus = 
        statusFilter === 'all' ||
        (statusFilter === 'active' && product.isActive) ||
        (statusFilter === 'archived' && !product.isActive);
      
      const matchesAlertFilter = !alertFilter ||
        (alertFilter === 'lowStock' && product.stock < 15) ||
        (alertFilter === 'expiringSoon' && product.expiryDate && isExpiringSoon(product.expiryDate) && !isExpired(product.expiryDate)) ||
        (alertFilter === 'expired' && product.expiryDate && isExpired(product.expiryDate));

      return matchesSearch && matchesCategory && matchesStatus && matchesAlertFilter;
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
        case "expiryDate": {
          const dateA = a.expiryDate ? new Date(a.expiryDate).getTime() : null
          const dateB = b.expiryDate ? new Date(b.expiryDate).getTime() : null

          if (dateA === null && dateB === null) {
            comparison = 0
          } else if (dateA === null) {
            comparison = 1 // Sort nulls to the end
          } else if (dateB === null) {
            comparison = -1 // Sort nulls to the end
          } else {
            comparison = dateA - dateB
          }
          break
        }
        default:
          comparison = 0
      }

      return sortOrder === "asc" ? comparison : -comparison
    })

  // Handle product click to view details
  const handleProductClick = (product: Product) => {
    setSelectedProduct(product)
    setUpdatedStock("") // Clear input
    setStockUpdateUnit("base") // Reset unit
    setStockUpdateError("") // Clear any previous errors
    setIsEditMode(false) // Default to view mode when clicking a product
    setIsProductDetailModalOpen(true)
    // Also initialize editedProduct for the edit tab, even if not immediately in edit mode
    setEditedProduct({
      id: product.id,
      name: product.name,
      category: product.category,
      price: product.price.toString(),
      basePrice: product.basePrice.toString(),
      // profitType: "fixed", // Default to fixed as per previous change
      profitValue: product.profitValue.toString(),
      stock: product.stock.toString(),
      unit: product.unit,
      productUnits: product.productUnits,
      supplier: product.supplier,
      description: product.description,
      sku: product.sku,
      lastRestocked: product.lastRestocked,
      expiryDate: product.expiryDate || "",
      isActive: product.isActive ?? true,
      image: product.image || null,
    });
  }

  // Toggle sort order
  const toggleSortOrder = () => {
    setSortOrder(sortOrder === "asc" ? "desc" : "asc")
  }
  
  // Handle base price change to recalculate price for new product
  const handleBasePriceChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { value } = e.target;
    const calculatedPrice = calculatePrice(value, newProduct.profitValue);
    
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

  // Generate a random SKU if empty
  const generateSKU = () => {
    const categoryPrefix = (newProduct.category || "UNC").substring(0, 3).toUpperCase();
    const namePrefix = (newProduct.name || "PROD").substring(0, 3).toUpperCase();
    const timestamp = Date.now().toString().slice(-5);
    const randomChars = Math.random().toString(36).substring(2, 4).toUpperCase();
    const sku = `${categoryPrefix}-${namePrefix}-${timestamp}${randomChars}`;
    
    setNewProduct({
      ...newProduct,
      sku
    });
    toast({ title: "SKU Generated", description: `New SKU: ${sku}` });
  };

  const handleAddProduct = async () => {
    // Basic validation
    if (!newProduct.name || !newProduct.price || !newProduct.category) {
      toast({
        title: "Validation Error",
        description: "Please fill in all required fields.",
        variant: "destructive"
      });
      return;
    }

    setIsLoading(true);
    try {
      const response = await fetch('/api/products', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...newProduct,
          price: parseFloat(newProduct.price),
          basePrice: parseFloat(newProduct.basePrice),
          stock: parseFloat(newProduct.stock || '0'),
          // unit and productUnits are passed directly
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to add product');
      }

      const data = await response.json();
      
      toast({
        title: "Product Added",
        description: `${newProduct.name} has been added successfully.`,
      });
      
      // Reset form
      setNewProduct({
        name: "",
        category: "",
        price: "",
        basePrice: "",
        profitValue: "",
        stock: "",
        unit: "pcs",
        productUnits: [],
        supplier: "",
        sku: "",
        description: "",
        expiryDate: "",
        image: null,
      });
      
      setIsAddProductModalOpen(false);
      // Refresh products list (or rely on socket if implemented fully)
      // For now, let's just reload the page or re-fetch
      // Ideally we should update the state, but re-fetching is safer
      // fetchProducts(); // We can't easily call fetchProducts here as it's inside useEffect
      // But we can trigger a reload or just wait for socket if it works.
      // Let's just reload the window for simplicity in this context, or better, add the new product to state.
      if (data.product) {
         // We need to map the response product to our frontend model
         // But for now, let's just reload to be safe
         window.location.reload();
      }

    } catch (error) {
      console.error("Error adding product:", error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to add product",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const validateEditForm = (): boolean => {
    const newErrors = { name: "", category: "", price: "", basePrice: "", profitValue: "", stock: "", image: "", sku: "", expiryDate: "" };
    let isValid = true;

    if (!editedProduct.name.trim()) {
      newErrors.name = "Product Name Is Required";
      isValid = false;
    }
    if (!editedProduct.category) {
      newErrors.category = "Category Is Required";
      isValid = false;
    }
    if (!editedProduct.basePrice || parseFloat(editedProduct.basePrice) < 0) {
      newErrors.basePrice = "Valid Base Price Is Required";
      isValid = false;
    }
    if (!editedProduct.price || parseFloat(editedProduct.price) <= 0) {
      newErrors.price = "Valid Price Is Required";
      isValid = false;
    }
    if (!editedProduct.stock) {
      newErrors.stock = "Stock Quantity Is Required";
      isValid = false;
    }
    if (!editedProduct.sku.trim()) {
      newErrors.sku = "SKU Is Required";
      isValid = false;
    }
    if (!editedProduct.image) {
      newErrors.image = "Image Is Required";
      isValid = false;
    }

    setEditErrors(newErrors);
    return isValid;
  }

  const handleSaveEdit = async () => {
    if (!validateEditForm()) return;

    setIsLoading(true);
    try {
      const productData = {
        ...editedProduct,
        price: parseFloat(editedProduct.price),
        basePrice: parseFloat(editedProduct.basePrice),
        profitValue: parseFloat(editedProduct.profitValue),
        stock: parseInt(editedProduct.stock),
      };

      const response = await fetch(`/api/products/${editedProduct.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(productData),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to update product');
      }

      const updatedProduct = await response.json();

      // The local state will be updated via WebSocket broadcast, so no need to setProducts here.
      
      toast({
        title: "Product Updated",
        description: `${editedProduct.name} has been updated successfully.`,
      });
      setIsEditMode(false); // Use setIsEditMode
    } catch (error) {
      console.error("Error Updating Product:", error);
      toast({
        title: "Update Failed",
        description: error instanceof Error ? error.message : "An unexpected error occurred.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
    setIsProductDetailModalOpen(false); // Close the main detail modal
    setIsEditMode(false); // Exit edit mode
    
  };

  const handleConfirmDelete = () => {
    if (selectedProduct) {
      // Logic to delete product
      console.log("Deleting Product:", selectedProduct.id);
      toast({
        title: "Product Deleted",
        description: `${selectedProduct.name} has been deleted.`,
        variant: "destructive",
      });
      setIsDeleteConfirmOpen(false);
      setSelectedProduct(null);
    }
  };

  const handleEditProduct = (product: Product) => {
    setEditedProduct({
      id: product.id,
      name: product.name,
      category: product.category,
      price: product.price.toString(),
      // @ts-ignore
      basePrice: product.basePrice.toString(),
      // profitType: "fixed", // Set default profit type
      profitValue: product.profitValue.toString(),
      stock: product.stock.toString(),
      unit: product.unit,
      productUnits: product.productUnits,
      supplier: product.supplier,
      description: product.description,
      sku: product.sku,
      lastRestocked: product.lastRestocked,
      expiryDate: product.expiryDate || "",
      isActive: product.isActive ?? true, image: product.image || null
    });
    // setSelectedProduct(product); // Set selected product for the detail modal
    // setIsEditMode(true); // Switch to edit mode
    // setIsProductDetailModalOpen(true); // Open the detail modal
  };  

  const handleEditBasePriceChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { value } = e.target;
    const calculatedPrice = calculatePrice(value, editedProduct.profitValue);
    
    setEditedProduct({
      ...editedProduct,
      basePrice: value,
      price: calculatedPrice.toFixed(2)
    });
  };

  const handleEditProfitChange = (value: string) => {
    const newProfitValue = value || editedProduct.profitValue;
    
    const calculatedPrice = calculatePrice(editedProduct.basePrice, newProfitValue);
    
    setEditedProduct({
      ...editedProduct,
      profitValue: newProfitValue,
      price: calculatedPrice.toFixed(2)
    });
  };

  const handleDiscountChange = (type: string, value: string) => {
    // Dummy function, as discount fields are not in state
    console.log("Discount Changed", type, value);
  };

  const handleEditDiscountChange = (type: string, value: string) => {
    // Dummy function, as discount fields are not in state
    console.log("Edit Discount Changed", type, value);
  };

  const handleArchiveProduct = async (productId: string) => {
    startTransition(async () => {
      try {
        const response = await fetch(`/api/products/${productId}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ isActive: false }),
        });

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.message || 'Failed to archive product');
        }

        setProducts(products => products.map(p => p.id === productId ? { ...p, isActive: false } : p));
        toast({ title: "Product Archived", description: "The product has been successfully archived." });
      } catch (error) {
        console.error("Error archiving product:", error);
        toast({ title: "Error", description: "Failed to archive product.", variant: "destructive" });
      }
    });
  };

  const handleRestoreProduct = async (productId: string) => {
    startTransition(async () => {
      try {
        const response = await fetch(`/api/products/${productId}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ isActive: true }),
        });

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.message || 'Failed to restore product');
        }

        setProducts(products => products.map(p => p.id === productId ? { ...p, isActive: true } : p));
        toast({ title: "Product Restored", description: "The product has been successfully restored." });
      } catch (error) {
        console.error("Error restoring product:", error);
        toast({ title: "Error", description: "Failed to restore product.", variant: "destructive" });
      }
    });
  };


  // Handle generating reports
  const handleGenerateReport = (format: "csv" | "pdf") => {
    if (format === "csv") {
      toast({
        title: "Generating CSV...",
        description: "Your inventory data is being prepared for download.",
      });

      const headers = [
        "ID", "Name", "SKU", "Category", "Stock", "Base Price", "Price",
        "Supplier", "Last Restocked", "Expiry Date", "Is Active", "Description"
      ];

      const csvRows = [headers.join(',')];

      const escapeCsvCell = (cellData: any) => {
        if (cellData === null || cellData === undefined) {
          return '';
        }
        const stringData = String(cellData);
        if (stringData.includes(',') || stringData.includes('"') || stringData.includes('\n')) {
          return `"${stringData.replace(/"/g, '""')}"`;
        }
        return stringData;
      };

      products.forEach(product => {
        const row = [
          escapeCsvCell(product.id),
          escapeCsvCell(product.name),
          escapeCsvCell(product.sku),
          escapeCsvCell(product.category),
          escapeCsvCell(product.stock),
          escapeCsvCell(product.basePrice.toFixed(2)),
          escapeCsvCell(product.price.toFixed(2)),
          escapeCsvCell(product.supplier),
          escapeCsvCell(product.lastRestocked),
          escapeCsvCell(formatDate(product.expiryDate) || 'N/A'),
          escapeCsvCell(product.isActive ? 'Yes' : 'No'),
          escapeCsvCell(product.description),
        ];
        csvRows.push(row.join(','));
      });

      const csvString = csvRows.join('\n');
      const blob = new Blob([csvString], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.setAttribute('href', url);
      link.setAttribute('download', 'inventory_report.csv');
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    } else if (format === "pdf") {
      toast({
        title: "Generating PDF...",
        description: "Your inventory report is being prepared for download.",
        variant: "default",
      });

      const doc = new jsPDF();
      
      doc.text("Inventory Report", 14, 16);
      doc.setFontSize(10);
      doc.text(`Generated on: ${new Date().toLocaleDateString()}`, 14, 22);

      const head = [
        ["ID", "Name", "SKU", "Category", "Stock", "Base Price", "Price", "Expiry Date"],
      ];

      const body = products.map(product => [
        product.id,
        product.name,
        product.sku,
        product.category,
        product.stock,
        `₱${product.basePrice.toFixed(2)}`,
        `₱${product.price.toFixed(2)}`,
        formatDate(product.expiryDate) || 'N/A',
      ]);

      autoTable(doc, {
        head: head,
        body: body,
        theme: 'striped',
        headStyles: { fillColor: [255, 165, 0] }, // Orange color for header
      });

      doc.save('inventory_report.pdf');
    }
  };

  const handleUpdateStock = async () => {
    if (!selectedProduct || !updatedStock) return;
    
    const qtyToAdd = parseFloat(updatedStock);
    if (isNaN(qtyToAdd) || qtyToAdd <= 0) {
      setStockUpdateError("Please enter a valid quantity");
      return;
    }

    let conversionFactor = 1;
    if (stockUpdateUnit !== 'base') {
      // Check if stockUpdateUnit is an ID or Name (depending on how we set the value)
      // In the SelectItem, we used u.id or u.name.
      // Let's try to find by ID first, then Name.
      const unit = selectedProduct.productUnits.find(u => 
        (u.id && u.id.toString() === stockUpdateUnit) || u.name === stockUpdateUnit
      );
      if (unit) {
        conversionFactor = unit.conversionFactor;
      }
    }

    const totalToAdd = qtyToAdd * conversionFactor;
    const newStock = selectedProduct.stock + totalToAdd;

    setIsLoading(true);
    try {
      // We can use PATCH to update just the stock
      const response = await fetch(`/api/products/${selectedProduct.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ stock: newStock })
      });

      if (!response.ok) {
        throw new Error('Failed to update stock');
      }

      toast({
        title: "Stock Updated",
        description: `Added ${qtyToAdd} ${stockUpdateUnit === 'base' ? selectedProduct.unit : stockUpdateUnit} (${totalToAdd} ${selectedProduct.unit}). New stock: ${newStock} ${selectedProduct.unit}`,
      });
      
      // Update local state
      const updatedProd = { ...selectedProduct, stock: newStock };
      setSelectedProduct(updatedProd);
      setProducts(products.map(p => p.id === selectedProduct.id ? updatedProd : p));
      
      setIsProductDetailModalOpen(false);
    } catch (error) {
      console.error("Error updating stock:", error);
      toast({
        title: "Error",
        description: "Failed to update stock",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar userType="admin" userName="Admin" />

      <main className="pt-16 pb-20">
        <div className="container mx-auto px-4 py-8">
          <div className="flex flex-col md:flex-row gap-4 items-start md:items-center justify-between mb-8">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Inventory Management</h1>
              <p className="text-gray-600">Manage And Track Product Inventory</p>
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
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6 mb-8">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium">Total Inventory Value</CardTitle>
                {/* <DollarSign className="h-4 w-4 text-muted-foreground" /> */}
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
                <CardTitle className="text-sm font-medium">Total Base Value</CardTitle>
                {/* <DollarSign className="h-4 w-4 text-muted-foreground" /> */}
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  ₱{inventorySummary.totalBaseValue.toLocaleString('en-PH', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </div>
                <p className="text-xs text-muted-foreground">Total cost of all products</p>
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
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
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
                <SelectItem value="all">All Categories</SelectItem>
                {category.map((cat) => (
                  <SelectItem key={cat.id} value={cat.name} className="capitalize">
                    {cat.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger>
                <SelectValue placeholder="Filter by status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="archived">Archived</SelectItem>
                <SelectItem value="all">All Products</SelectItem>
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
                  <SelectItem value="expiryDate">Expiry Date</SelectItem>
                </SelectContent>
              </Select>

              <Button variant="outline" size="icon" onClick={toggleSortOrder}>
                <ArrowUpDown className={`h-4 w-4 ${sortOrder === "desc" ? "rotate-180" : ""} transition-transform`} />
              </Button>
            </div>
          </div>

          {alertFilter && (
            <div className="mb-6 flex items-center justify-center">
              <Badge variant="secondary" className="p-2 text-sm">
                Filtering by: {
                  { lowStock: 'Low Stock', expiringSoon: 'Expiring Soon', expired: 'Expired' }[alertFilter]
                }
                <Button variant="ghost" size="sm" className="h-auto p-0 ml-2 text-red-500 hover:bg-transparent" onClick={() => setAlertFilter(null)}>
                  &times; Clear
                </Button>
              </Badge>
            </div>
          )}

          {/* Animated Alerts Widget */}
          {alerts.length > 0 && (
            <div className="relative h-20 mb-6 overflow-hidden">
              <AnimatePresence initial={false}>
                <motion.div
                  key={currentAlertIndex}
                  initial={{ y: '100%', opacity: 0 }}
                  animate={{ y: '0%', opacity: 1 }}
                  exit={{ y: '-100%', opacity: 0 }}
                  transition={{ duration: 0.5, ease: 'easeInOut' }}
                  className="absolute w-full"
                >
                  <Card 
                    className={`${alerts[currentAlertIndex].className} cursor-pointer hover:shadow-md transition-shadow`}
                    onClick={() => setAlertFilter(alerts[currentAlertIndex].type === 'lowStock' ? 'lowStock' : (alerts[currentAlertIndex].title.includes('Expired') ? 'expired' : 'expiringSoon'))}
                  >
                    <CardContent className="p-4">
                      <div className="flex items-start gap-3">
                        {alerts[currentAlertIndex].icon}
                        <div>
                          <h3 className="font-medium text-gray-900">{alerts[currentAlertIndex].title}</h3>
                          <p className="text-sm text-gray-600">{alerts[currentAlertIndex].message}</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              </AnimatePresence>
            </div>
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
                        <th className="py-3 px-4 text-left">
                          <button
                            className="flex items-center gap-1"
                            onClick={() => {
                              setSortBy("expiryDate")
                              toggleSortOrder()
                            }}
                          >
                            Expiry Date
                            {sortBy === "expiryDate" && (
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
                            className={`border-b hover:bg-gray-50 cursor-pointer transition-colors
                              ${!product.isActive ? 'bg-gray-100 text-gray-500' : 
                                isExpired(product.expiryDate) ? 'bg-red-50 hover:bg-red-100' : 
                                isExpiringSoon(product.expiryDate) ? 'bg-amber-50 hover:bg-amber-100' : ''
                              }`}
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
                                <span className="font-medium capitalize">{product.name}</span>
                              </div>
                            </td>
                            <td className="py-3 px-4 text-gray-600 font-mono text-sm">{product.sku}</td>
                            <td className="py-3 px-4">
                              <Badge className="capitalize">{product.category}</Badge>
                            </td>
                            <td className="py-3 px-4 font-medium">₱{product.price.toFixed(2)}</td>
                            <td className="py-3 px-4">
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
                            </td>
                            <td className={`py-3 px-4 text-sm ${isExpired(product.expiryDate) ? 'text-red-500' : isExpiringSoon(product.expiryDate) ? 'text-amber-500' : ''}`}>
                              {formatDate(product.expiryDate) || 'N/A'}
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
                                  <DropdownMenuItem onSelect={(e) => {
                                    e.stopPropagation();
                                    handleProductClick(product);
                                  }}>
                                    <Edit className="h-4 w-4 mr-2" />
                                    Edit Product
                                  </DropdownMenuItem>
                                  <DropdownMenuItem onSelect={(e) => {
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
                                        handleArchiveProduct(product.id);
                                      }}
                                    >
                                      <Archive className="h-4 w-4 mr-2" />
                                      Archive Product
                                    </DropdownMenuItem>
                                  ) : (
                                    <DropdownMenuItem
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        handleRestoreProduct(product.id);
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
                          <td colSpan={8} className="py-10 text-center">
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
              {newProduct.image ? (
                <Image
                  src={newProduct.image}
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
                onChange={(e) => handleImageChange(e, false)}
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
                  onChange={(e) => setNewProduct({...newProduct, name: e.target.value})}
                  className={errors.name ? 'border-red-300' : ''}
                />
                {errors.name && <p className="text-xs text-red-500">{errors.name}</p>}
              </div>

              <div className="grid gap-2">
                <label className="text-sm font-medium">Category</label>
                <Select value={newProduct.category} onValueChange={(value) => setNewProduct({...newProduct, category: value})}>
                  <SelectTrigger className={errors.category ? 'border-red-300' : ''}>
                    <SelectValue placeholder="Select category" />
                  </SelectTrigger>
                  <SelectContent>
                    {category.map((cat: Category) => (
                      <SelectItem key={cat.id} value={cat.name} className="capitalize">
                        {cat.name}
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
                  placeholder="Enter or generate SKU"
                  name="sku"
                  value={newProduct.sku}
                  onChange={(e) => setNewProduct({...newProduct, sku: e.target.value})}
                  className={errors.sku ? 'border-red-300' : ''}
                />
                <Button variant="outline" type="button" onClick={generateSKU}>
                  Generate
                </Button>
                <Button variant="outline" className="flex items-center gap-2" onClick={() => toast({
                    title: "Barcode Scanner",
                    description: "Camera barcode scanning functionality would be triggered here.",
                  })}>
             <Barcode className="h-4 w-4" />
                    Scan
                  </Button>
              </div>
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
              <Input 
                type="number" 
                placeholder="₱0.00" 
                name="profitValue"
                value={newProduct.profitValue}
                onChange={(e) => handleProfitChange(e.target.value)}
                className={errors.profitValue ? 'border-red-300' : ''}
                step="0.01"
                min="0"
              />
              <p className="text-xs text-gray-500">Fixed amount added to the base price.</p>
              {errors.profitValue && <p className="text-xs text-red-500">{errors.profitValue}</p>}
            </div>

            <div className="grid gap-2">
              <label className="text-sm font-medium">Selling Price (₱)</label>
              <Input 
                type="number" 
                placeholder="0.00" 
                name="price"
                value={newProduct.price}
                onChange={(e) => setNewProduct({...newProduct, price: e.target.value})}
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
                onChange={(e) => setNewProduct({...newProduct, expiryDate: e.target.value})}
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
                  onChange={(e) => setNewProduct({...newProduct, stock: e.target.value})}
                  className={errors.stock ? 'border-red-300' : ''}
                  min="0"
                />
                {errors.stock && <p className="text-xs text-red-500">{errors.stock}</p>}
              </div>

              <div className="grid gap-2">
                <label className="text-sm font-medium">Base Unit</label>
                <Input 
                  placeholder="e.g. kg, pcs" 
                  name="unit"
                  value={newProduct.unit}
                  onChange={(e) => setNewProduct({...newProduct, unit: e.target.value})}
                />
              </div>
            </div>

            <div className="border rounded-md p-4 bg-gray-50">
              <h4 className="text-sm font-medium mb-2">Alternative Units (e.g. Sack)</h4>
              <div className="grid grid-cols-3 gap-2 mb-2">
                <Input placeholder="Unit Name (e.g. Sack)" id="new-unit-name" />
                <Input type="number" placeholder="Conversion (e.g. 50)" id="new-unit-factor" />
                <Button type="button" variant="secondary" onClick={() => {
                  const nameInput = document.getElementById('new-unit-name') as HTMLInputElement;
                  const factorInput = document.getElementById('new-unit-factor') as HTMLInputElement;
                  if (nameInput.value && factorInput.value) {
                    setNewProduct({
                      ...newProduct,
                      productUnits: [...newProduct.productUnits, {
                        name: nameInput.value,
                        conversionFactor: parseFloat(factorInput.value)
                      }]
                    });
                    nameInput.value = '';
                    factorInput.value = '';
                  }
                }}>Add Unit</Button>
              </div>
              <div className="space-y-2">
                {newProduct.productUnits.map((u, idx) => (
                  <div key={idx} className="flex justify-between items-center bg-white p-2 rounded border">
                    <span className="text-sm">{u.name} = {u.conversionFactor} {newProduct.unit}</span>
                    <Button variant="ghost" size="sm" onClick={() => {
                      const newUnits = [...newProduct.productUnits];
                      newUnits.splice(idx, 1);
                      setNewProduct({...newProduct, productUnits: newUnits});
                    }}>&times;</Button>
                  </div>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <label className="text-sm font-medium">Supplier</label>
                <Input 
                  placeholder="Enter supplier name" 
                  name="supplier"
                  value={newProduct.supplier}
                  onChange={(e) => setNewProduct({...newProduct, supplier: e.target.value})}
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
                onChange={(e) => setNewProduct({...newProduct, description: e.target.value})}
              />
            </div>
          </div>

          <DialogFooter className="flex flex-col sm:flex-row gap-2 mt-4">
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

      {/* View/Edit Product Modal (from POS) */}
      <Dialog open={isProductDetailModalOpen} onOpenChange={setIsProductDetailModalOpen}>
        <DialogContent className="sm:max-w-md max-h-screen overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{isEditMode ? "Edit Product" : "Product Details"}</DialogTitle>
            <DialogDescription>
              {isEditMode ? "Update product information." : "View product details and update stock."}
            </DialogDescription>
          </DialogHeader>

          {selectedProduct && (
            <>
             <Tabs value={isEditMode ? "edit" : "view"} onValueChange={(value) => setIsEditMode(value === 'edit')} className="w-full">
                <TabsList className="grid w-full grid-cols-2">
                  <TabsTrigger value="view" onClick={() => setIsEditMode(false)}>View Details</TabsTrigger>
                  <TabsTrigger value="edit" onClick={() => handleEditProduct(selectedProduct)}>Edit Product</TabsTrigger>
                </TabsList>

                <TabsContent value="view" className="mt-4">
                  <div className="grid gap-4">
                    <div className="relative aspect-video bg-gray-100 rounded-md overflow-hidden">
                     <Image
                        src={selectedProduct.image || "/placeholder.svg"}
                        alt={selectedProduct.name}
                        fill
                        className="object-cover"
                        unoptimized 
                      />
                    </div>

                    <div className="grid gap-2">
                      <div className="flex justify-between items-start">
                        <h3 className="text-xl font-bold text-gray-900 capitalize">{selectedProduct.name}</h3>
                        <Badge className="capitalize">{selectedProduct.category}</Badge>
                      </div>

                      <p className="text-sm text-gray-600 font-mono">SKU: {selectedProduct.sku}</p>
                      <p className="text-gray-600">{selectedProduct.description}</p>

                      <div className="grid grid-cols-2 gap-4 mt-2">
                        <div>
                          <p className="text-sm text-gray-500">Base Price</p>
                          <p className="font-medium">₱{selectedProduct.basePrice?.toFixed(2)}</p>
                        </div>

                        <div>
                          <p className="text-sm text-gray-500">Profit Margin</p>
                          <p className="font-medium">₱{selectedProduct.profitValue?.toFixed(2)}</p>
                        </div>

                        <div>
                          <p className="text-sm text-gray-500">Selling Price</p>
                          <p className="font-bold text-amber-600">₱{selectedProduct.price?.toFixed(2)}</p>
                        </div>

                        <div>
                          <p className="text-sm text-gray-500">Stock</p>
                          <div className="flex items-center gap-2">
                            <p className={`font-bold ${getStockStatus(selectedProduct.stock).color}`}>
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

                      <div className="mt-4 pt-4 border-t border-gray-200">
                        <h4 className="font-medium text-gray-900 mb-2">Update Stock</h4>
                        <div className="grid gap-2">
                          <label className="text-sm font-medium">Add Stock Quantity</label>
                          <div className="flex gap-2">
                            <Input 
                              type="number"
                              value={updatedStock}
                              onChange={(e) => setUpdatedStock(e.target.value)}
                              className={stockUpdateError ? 'border-red-300' : ''}
                              min="0"
                              placeholder="Qty to add"
                            />
                            <Select value={stockUpdateUnit} onValueChange={setStockUpdateUnit}>
                              <SelectTrigger className="w-[140px]">
                                <SelectValue placeholder="Unit" />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="base">{selectedProduct.unit} (Base)</SelectItem>
                                {selectedProduct.productUnits && selectedProduct.productUnits.map((u: any) => (
                                  <SelectItem key={u.id || u.name} value={u.id ? u.id.toString() : u.name}>
                                    {u.name} ({u.conversionFactor} {selectedProduct.unit})
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </div>
                          {stockUpdateError && <p className="text-xs text-red-500">{stockUpdateError}</p>}
                        </div>
                      </div>
                    </div>
                  </div>
                </TabsContent>

                <TabsContent value="edit" className="mt-4">
                  <div className="grid gap-4 py-4">
                    {/* This is where the edit form from Edit Product Modal goes */}
                    <div className="grid grid-cols-2 gap-4">
                      <div className="grid gap-2">
                        <label className="text-sm font-medium">Product Name</label>
                        <Input placeholder="Enter product name" value={editedProduct.name} onChange={(e) => setEditedProduct({...editedProduct, name: e.target.value})} />
                      </div>
                      <div className="grid gap-2">
                        <label className="text-sm font-medium">Category</label>
                        <Select value={editedProduct.category} onValueChange={(value) => setEditedProduct({...editedProduct, category: value})}>
                          <SelectTrigger><SelectValue placeholder="Select category" /></SelectTrigger>
                          <SelectContent>
                            {category.map((cat) => (
                              <SelectItem key={cat.id} value={cat.name} className="capitalize">{cat.name}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                    <div className="grid gap-2">
                      <label className="text-sm font-medium">Base Price (₱)</label>
                      <Input type="number" placeholder="0.00" value={editedProduct.basePrice} onChange={handleEditBasePriceChange} step="0.01" min="0" />
                    </div>
                    <div className="grid gap-2">
                      <label className="text-sm font-medium">Profit Margin</label>
                      <Input type="number" placeholder="₱0.00" value={editedProduct.profitValue} onChange={(e) => handleEditProfitChange(e.target.value)} step="0.01" min="0" />
                    </div>
                    <div className="grid gap-2">
                      <label className="text-sm font-medium">Selling Price (₱)</label>
                      <Input type="number" placeholder="0.00" value={editedProduct.price} onChange={(e) => setEditedProduct({...editedProduct, price: e.target.value})} step="0.01" min="0" readOnly />
                    </div>
                    <div className="grid gap-2">
                      <label className="text-sm font-medium">SKU/Barcode</label>
                      <Input placeholder="Enter barcode number" value={editedProduct.sku} onChange={(e) => setEditedProduct({...editedProduct, sku: e.target.value})} disabled />
                    </div>
                    <div className="grid gap-2">
                      <label className="text-sm font-medium">Stock</label>
                      <Input type="number" placeholder="0" value={editedProduct.stock} onChange={(e) => setEditedProduct({...editedProduct, stock: e.target.value})} min="0" />
                    </div>
                    <div className="grid gap-2">
                      <label className="text-sm font-medium">Expiry Date</label>
                      <Input type="date" value={editedProduct.expiryDate ? editedProduct.expiryDate.substring(0, 10) : ""} onChange={(e) => setEditedProduct({...editedProduct, expiryDate: e.target.value})} />
                    </div>
                    <div className="grid gap-2">
                      <label className="text-sm font-medium">Description</label>
                      <textarea className="min-h-[80px] rounded-md border border-input bg-background px-3 py-2 text-sm" placeholder="Enter product description" value={editedProduct.description} onChange={(e) => setEditedProduct({...editedProduct, description: e.target.value})} />
                    </div>
                  </div>
                </TabsContent>
              </Tabs>
            </>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsProductDetailModalOpen(false)} disabled={isLoading}>Cancel</Button>
            {isEditMode ? (
              <Button onClick={handleSaveEdit} disabled={isLoading}>
                {isLoading ? "Saving..." : "Save Changes"}
              </Button>
            ) : (
              <Button onClick={handleUpdateStock} disabled={isLoading}>
                Update Stock
              </Button>
            )}
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
                <h4 className="font-medium capitalize">{selectedProduct.name}</h4>
                <p className="text-sm text-gray-600">
                  {selectedProduct.category} - ₱{selectedProduct.price != null ? selectedProduct.price.toFixed(2) : '0.00'}
                </p>
              </div>
            </div>
          )}

          <DialogFooter className="flex flex-col sm:flex-row gap-2">
        <Button variant="outline" className="sm:flex-1" onClick={() => setIsProductDetailModalOpen(false)}>
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
  );
}