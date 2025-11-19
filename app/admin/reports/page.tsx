"use client"

import { useState, useEffect, useRef } from "react"
import Image from "next/image"
import { Navbar } from "@/components/ui/navbar"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { DollarSign, Package, Archive, AlertTriangle, Printer, TrendingUp, ShoppingCart } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { GetSalesReport, SalesReportData } from "../actions"

interface Product {
  id: number
  name: string
  price: number
  basePrice: number
  stock: number
  category: string
  expiryDate?: string | null
  isActive?: boolean
}

interface InventoryReportData {
  totalProducts: number
  totalInventoryValue: number
  lowStockItems: number
  expiredItems: number
  inventoryByCategory: { category: string; count: number; value: number }[]
}

const isExpired = (dateString: string | null | undefined) => {
  if (!dateString) return false
  const date = new Date(dateString)
  return !isNaN(date.getTime()) && date < new Date()
}

export default function AdminReportsPage() {
  const [inventoryReport, setInventoryReport] = useState<InventoryReportData | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Sales Report State
  const [salesReport, setSalesReport] = useState<SalesReportData | null>(null);
  const [isSalesLoading, setIsSalesLoading] = useState(true);
  const [salesError, setSalesError] = useState<string | null>(null);
  const [startDate, setStartDate] = useState(() => {
    const date = new Date(); // Default to yesterday
    date.setDate(date.getDate() - 1);
    return date.toISOString().split('T')[0];
  });
  const [endDate, setEndDate] = useState(new Date().toISOString().split('T')[0]);

  const reportRef = useRef<HTMLDivElement>(null);

  const handlePrint = () => {
    window.print();
  };

  useEffect(() => {
    const fetchInventoryReport = async () => {
      try {
        const response = await fetch('/api/products')
        const data = await response.json()

        if (data.status === 'success') {
          const products: Product[] = data.products

          const totalProducts = products.length
          const totalInventoryValue = products.reduce(
            (sum, p) => sum + (p.basePrice || 0) * p.stock,
            0
          )
          const lowStockItems = products.filter((p) => p.stock < 10).length
          const expiredItems = products.filter((p) => isExpired(p.expiryDate)).length

          const inventoryByCategory = products.reduce((acc, p) => {
            let categoryData = acc.find((item) => item.category === p.category)
            if (!categoryData) {
              categoryData = { category: p.category, count: 0, value: 0 }
              acc.push(categoryData)
            }
            categoryData.count += 1
            categoryData.value += (p.basePrice || 0) * p.stock
            return acc
          }, [] as { category: string; count: number; value: number }[])

          setInventoryReport({
            totalProducts,
            totalInventoryValue,
            lowStockItems,
            expiredItems,
            inventoryByCategory,
          })
        } else {
          setError(data.message || 'Failed to fetch inventory data')
        }
      } catch (err) {
        setError('Error loading inventory data. Please try again later.')
        console.error('Error fetching inventory data:', err)
      } finally {
        setIsLoading(false)
      }
    }

    fetchInventoryReport()
  }, []);

  useEffect(() => {
    const fetchSalesReport = async () => {
      if (!startDate || !endDate) return;
      setIsSalesLoading(true);
      setSalesError(null);
      try {
        const reportData = await GetSalesReport(new Date(startDate), new Date(endDate));
        setSalesReport(reportData);
      } catch (err) {
        setSalesError('Error loading sales data. Please try again later.');
        console.error('Error fetching sales data:', err);
      } finally {
        setIsSalesLoading(false);
      }
    };

    fetchSalesReport();
  }, [startDate, endDate]);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-PH', {
      style: 'currency',
      currency: 'PHP',
    }).format(amount)
  }

  return (
    <div className="min-h-screen bg-gray-50 print:bg-white">
      <style jsx global>{`
        @media print {
          body {
            -webkit-print-color-adjust: exact;
            print-color-adjust: exact;
          }
          .no-print {
            display: none !important;
          }
          .print-only {
            display: block !important;
          }
          main {
            padding-top: 0 !important;
            padding-bottom: 0 !important;
          }
          .print-container {
            padding: 0 !important;
            margin: 0 !important;
            max-width: 100% !important;
            box-shadow: none !important;
            border: none !important;
          }
          .print-card {
            box-shadow: none !important;
            border: 1px solid #e5e7eb;
          }
        }
      `}</style>
      <div className="print-only hidden p-4 mb-4 border-b">
        <Image
          src="/pandol-logo.png"
          alt="Pandol Logo"
          width={150}
          height={40}
          className="mx-auto"
        />
      </div>
      <div className="no-print">
        <Navbar userType="admin" userName="Admin User" />
      </div>
      <main className="pt-20 pb-8 print:pt-4">
        <div ref={reportRef} className="container mx-auto px-4 print-container">
          <div className="flex justify-between items-center mb-8 no-print">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 mb-2">Reports</h1>
              <p className="text-gray-600">An overview of your inventory and sales.</p>
            </div>
            <Button onClick={handlePrint}>
              <Printer className="h-4 w-4 mr-2" />
              Print Report
            </Button>
          </div>

          <h2 className="text-2xl font-semibold text-gray-800 mb-4">Inventory Summary</h2>
          {isLoading ? (
            <div className="text-center py-12">Loading report...</div>
          ) : error ? (
            <div className="text-center py-12 text-red-600">{error}</div>
          ) : inventoryReport && (
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4 mb-12">
              <Card className="print-card">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Total Products</CardTitle>
                  <Package className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{inventoryReport.totalProducts}</div>
                </CardContent>
              </Card>
              <Card className="print-card">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Total Inventory Value</CardTitle>
                  <DollarSign className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{formatCurrency(inventoryReport.totalInventoryValue)}</div>
                </CardContent>
              </Card>
              <Card className="print-card">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Low Stock Items</CardTitle>
                  <AlertTriangle className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{inventoryReport.lowStockItems}</div>
                </CardContent>
              </Card>
              <Card className="print-card">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Expired Items</CardTitle>
                  <Archive className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{inventoryReport.expiredItems}</div>
                </CardContent>
              </Card>
            </div>
          )}

          <h2 className="text-2xl font-semibold text-gray-800 mb-4">Sales Report</h2>
          <div className="flex items-center gap-4 mb-6 no-print">
            <div className="grid gap-1.5">
              <label htmlFor="start-date" className="text-sm font-medium">Start Date</label>
              <Input id="start-date" type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} />
            </div>
            <div className="grid gap-1.5">
              <label htmlFor="end-date" className="text-sm font-medium">End Date</label>
              <Input id="end-date" type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} />
            </div>
          </div>

          {isSalesLoading ? (
            <div className="text-center py-12">Loading sales report...</div>
          ) : salesError ? (
            <div className="text-center py-12 text-red-600">{salesError}</div>
          ) : salesReport && (
            <div>
              <div className="grid gap-6 md:grid-cols-3 mb-8">
                <Card className="print-card">
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
                    <DollarSign className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{formatCurrency(salesReport.totalRevenue)}</div>
                  </CardContent>
                </Card>
                <Card className="print-card">
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Total Sales</CardTitle>
                    <ShoppingCart className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{salesReport.totalSales}</div>
                  </CardContent>
                </Card>
                <Card className="print-card">
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Total Profit</CardTitle>
                    <TrendingUp className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{formatCurrency(salesReport.totalProfit)}</div>
                  </CardContent>
                </Card>
              </div>

              <Card className="print-card">
                <CardHeader>
                  <CardTitle>Detailed Sales</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead className="bg-gray-100 text-gray-600 text-sm">
                        <tr>
                          <th className="px-4 py-3 text-left">Product</th>
                          <th className="px-4 py-3 text-right">Quantity</th>
                          <th className="px-4 py-3 text-right">Unit Price</th>
                          <th className="px-4 py-3 text-right">Total</th>
                        </tr>
                      </thead>
                      <tbody>
                        {salesReport.sales.map((sale) => (
                          <tr key={sale.id} className="border-b hover:bg-gray-50">
                            <td className="px-4 py-3 font-medium">{sale.productName}</td>
                            <td className="px-4 py-3 text-right">{sale.quantity}</td>
                            <td className="px-4 py-3 text-right">{formatCurrency(sale.price)}</td>
                            <td className="px-4 py-3 text-right">{formatCurrency(sale.total)}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}
        </div>
      </main>
    </div>
  )
}