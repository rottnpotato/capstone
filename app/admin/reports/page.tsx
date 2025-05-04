"use client"

import { useState } from "react"
import { Navbar } from "@/components/ui/navbar"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { FileText, DownloadCloud, Calendar, Filter, Printer } from "lucide-react"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"

// Mock data for reports
const salesData = [
  { id: 1, date: "2023-05-01", amount: 1250.75, items: 15, customer: "Walk-in" },
  { id: 2, date: "2023-05-02", amount: 876.5, items: 8, customer: "Member #1024" },
  { id: 3, date: "2023-05-03", amount: 1432.25, items: 12, customer: "Member #1056" },
  { id: 4, date: "2023-05-04", amount: 965.0, items: 10, customer: "Walk-in" },
  { id: 5, date: "2023-05-05", amount: 2145.3, items: 22, customer: "Member #1078" },
]

const inventoryData = [
  { id: 1, name: "Organic Apples", category: "Produce", stock: 45, reorderLevel: 10, status: "In Stock" },
  { id: 2, name: "Whole Milk", category: "Dairy", stock: 12, reorderLevel: 15, status: "Low Stock" },
  { id: 3, name: "Whole Wheat Bread", category: "Bakery", stock: 30, reorderLevel: 8, status: "In Stock" },
  { id: 4, name: "Free Range Eggs", category: "Dairy", stock: 24, reorderLevel: 12, status: "In Stock" },
  { id: 5, name: "Organic Bananas", category: "Produce", stock: 5, reorderLevel: 10, status: "Low Stock" },
]

const memberData = [
  { id: 1, name: "John Doe", email: "john@example.com", joinDate: "2023-01-15", purchases: 24, points: 240 },
  { id: 2, name: "Jane Smith", email: "jane@example.com", joinDate: "2023-02-20", purchases: 18, points: 180 },
  { id: 3, name: "Robert Johnson", email: "robert@example.com", joinDate: "2023-03-10", purchases: 32, points: 320 },
  { id: 4, name: "Emily Davis", email: "emily@example.com", joinDate: "2023-04-05", purchases: 15, points: 150 },
  { id: 5, name: "Michael Wilson", email: "michael@example.com", joinDate: "2023-05-12", purchases: 28, points: 280 },
]

const creditData = [
  { id: 1, member: "John Doe", balance: 450.0, limit: 1000.0, lastPayment: "2023-04-28", status: "Good Standing" },
  { id: 2, member: "Jane Smith", balance: 750.0, limit: 1000.0, lastPayment: "2023-04-15", status: "Good Standing" },
  { id: 3, member: "Robert Johnson", balance: 950.0, limit: 1000.0, lastPayment: "2023-04-10", status: "Near Limit" },
  { id: 4, member: "Emily Davis", balance: 200.0, limit: 500.0, lastPayment: "2023-04-22", status: "Good Standing" },
  { id: 5, member: "Michael Wilson", balance: 0.0, limit: 1000.0, lastPayment: "2023-04-30", status: "Paid in Full" },
]

export default function AdminReportsPage() {
  const [reportType, setReportType] = useState("sales")
  const [timeRange, setTimeRange] = useState("week")
  const [format, setFormat] = useState("pdf")

  // Sample report types
  const reportTypes = [
    { value: "sales", label: "Sales Report" },
    { value: "inventory", label: "Inventory Report" },
    { value: "members", label: "Member Report" },
    { value: "credit", label: "Credit Report" },
  ]

  // Sample time ranges
  const timeRanges = [
    { value: "day", label: "Today" },
    { value: "week", label: "This Week" },
    { value: "month", label: "This Month" },
    { value: "quarter", label: "This Quarter" },
    { value: "year", label: "This Year" },
    { value: "custom", label: "Custom Range" },
  ]

  // Sample formats
  const formats = [
    { value: "pdf", label: "PDF" },
    { value: "excel", label: "Excel" },
    { value: "csv", label: "CSV" },
  ]

  // Function to generate and print report
  const generateReport = () => {
    let reportContent = ""
    let reportTitle = ""
    const reportDate = new Date().toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    })
    const reportTime = new Date().toLocaleTimeString("en-US", {
      hour: "2-digit",
      minute: "2-digit",
    })

    // Create report content based on selected report type
    if (reportType === "sales") {
      reportTitle = "Sales Report"
      reportContent = `
        <div class="report-header">
          <div class="report-meta">
            <p><strong>Report Type:</strong> Sales Report</p>
            <p><strong>Time Range:</strong> ${timeRange.charAt(0).toUpperCase() + timeRange.slice(1)}</p>
            <p><strong>Generated:</strong> ${reportDate} at ${reportTime}</p>
          </div>
        </div>
        
        <div class="report-summary">
          <div class="summary-card">
            <h3>Total Sales</h3>
            <p class="summary-value">₱${salesData.reduce((sum, item) => sum + item.amount, 0).toFixed(2)}</p>
          </div>
          <div class="summary-card">
            <h3>Total Items</h3>
            <p class="summary-value">${salesData.reduce((sum, item) => sum + item.items, 0)}</p>
          </div>
          <div class="summary-card">
            <h3>Transactions</h3>
            <p class="summary-value">${salesData.length}</p>
          </div>
        </div>

        <table class="report-table">
          <thead>
            <tr>
              <th>ID</th>
              <th>Date</th>
              <th>Amount</th>
              <th>Items</th>
              <th>Customer</th>
            </tr>
          </thead>
          <tbody>
            ${salesData
              .map(
                (item) => `
              <tr>
                <td>${item.id}</td>
                <td>${item.date}</td>
                <td>₱${item.amount.toFixed(2)}</td>
                <td>${item.items}</td>
                <td>${item.customer}</td>
              </tr>
            `,
              )
              .join("")}
          </tbody>
          <tfoot>
            <tr>
              <td colspan="2"><strong>Total</strong></td>
              <td><strong>₱${salesData.reduce((sum, item) => sum + item.amount, 0).toFixed(2)}</strong></td>
              <td><strong>${salesData.reduce((sum, item) => sum + item.items, 0)}</strong></td>
              <td></td>
            </tr>
          </tfoot>
        </table>
        
        <div class="report-chart">
          <div class="chart-title">Sales Trend</div>
          <div class="chart-placeholder">
            <div class="chart-bar" style="height: 60%;"></div>
            <div class="chart-bar" style="height: 40%;"></div>
            <div class="chart-bar" style="height: 75%;"></div>
            <div class="chart-bar" style="height: 50%;"></div>
            <div class="chart-bar" style="height: 90%;"></div>
          </div>
        </div>
      `
    } else if (reportType === "inventory") {
      reportTitle = "Inventory Report"
      reportContent = `
        <div class="report-header">
          <div class="report-meta">
            <p><strong>Report Type:</strong> Inventory Report</p>
            <p><strong>Status:</strong> Current Stock</p>
            <p><strong>Generated:</strong> ${reportDate} at ${reportTime}</p>
          </div>
        </div>
        
        <div class="report-summary">
          <div class="summary-card">
            <h3>Total Products</h3>
            <p class="summary-value">${inventoryData.length}</p>
          </div>
          <div class="summary-card">
            <h3>Low Stock Items</h3>
            <p class="summary-value">${inventoryData.filter((item) => item.status === "Low Stock").length}</p>
          </div>
          <div class="summary-card">
            <h3>Categories</h3>
            <p class="summary-value">${new Set(inventoryData.map((item) => item.category)).size}</p>
          </div>
        </div>

        <table class="report-table">
          <thead>
            <tr>
              <th>ID</th>
              <th>Product Name</th>
              <th>Category</th>
              <th>Current Stock</th>
              <th>Reorder Level</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            ${inventoryData
              .map(
                (item) => `
              <tr ${item.status === "Low Stock" ? 'class="low-stock"' : ""}>
                <td>${item.id}</td>
                <td>${item.name}</td>
                <td>${item.category}</td>
                <td>${item.stock}</td>
                <td>${item.reorderLevel}</td>
                <td>${item.status}</td>
              </tr>
            `,
              )
              .join("")}
          </tbody>
        </table>
        
        <div class="report-chart">
          <div class="chart-title">Stock by Category</div>
          <div class="chart-placeholder pie-chart">
            <div class="pie-segment" style="transform: rotate(0deg); background-color: #f59e0b;"></div>
            <div class="pie-segment" style="transform: rotate(120deg); background-color: #10b981;"></div>
            <div class="pie-segment" style="transform: rotate(240deg); background-color: #3b82f6;"></div>
          </div>
        </div>
      `
    } else if (reportType === "members") {
      reportTitle = "Member Report"
      reportContent = `
        <div class="report-header">
          <div class="report-meta">
            <p><strong>Report Type:</strong> Member Activity Report</p>
            <p><strong>Time Range:</strong> ${timeRange.charAt(0).toUpperCase() + timeRange.slice(1)}</p>
            <p><strong>Generated:</strong> ${reportDate} at ${reportTime}</p>
          </div>
        </div>
        
        <div class="report-summary">
          <div class="summary-card">
            <h3>Total Members</h3>
            <p class="summary-value">${memberData.length}</p>
          </div>
          <div class="summary-card">
            <h3>Total Purchases</h3>
            <p class="summary-value">${memberData.reduce((sum, item) => sum + item.purchases, 0)}</p>
          </div>
          <div class="summary-card">
            <h3>Total Points</h3>
            <p class="summary-value">${memberData.reduce((sum, item) => sum + item.points, 0)}</p>
          </div>
        </div>

        <table class="report-table">
          <thead>
            <tr>
              <th>ID</th>
              <th>Name</th>
              <th>Email</th>
              <th>Join Date</th>
              <th>Purchases</th>
              <th>Loyalty Points</th>
            </tr>
          </thead>
          <tbody>
            ${memberData
              .map(
                (item) => `
              <tr>
                <td>${item.id}</td>
                <td>${item.name}</td>
                <td>${item.email}</td>
                <td>${item.joinDate}</td>
                <td>${item.purchases}</td>
                <td>${item.points}</td>
              </tr>
            `,
              )
              .join("")}
          </tbody>
        </table>
        
        <div class="report-chart">
          <div class="chart-title">Member Activity</div>
          <div class="chart-placeholder line-chart">
            <div class="line-point" style="bottom: 20%; left: 10%;"></div>
            <div class="line-point" style="bottom: 40%; left: 30%;"></div>
            <div class="line-point" style="bottom: 60%; left: 50%;"></div>
            <div class="line-point" style="bottom: 50%; left: 70%;"></div>
            <div class="line-point" style="bottom: 70%; left: 90%;"></div>
          </div>
        </div>
      `
    } else if (reportType === "credit") {
      reportTitle = "Credit Report"
      reportContent = `
        <div class="report-header">
          <div class="report-meta">
            <p><strong>Report Type:</strong> Member Credit Report</p>
            <p><strong>Status:</strong> Current Balances</p>
            <p><strong>Generated:</strong> ${reportDate} at ${reportTime}</p>
          </div>
        </div>
        
        <div class="report-summary">
          <div class="summary-card">
            <h3>Total Credit</h3>
            <p class="summary-value">₱${creditData.reduce((sum, item) => sum + item.balance, 0).toFixed(2)}</p>
          </div>
          <div class="summary-card">
            <h3>Near Limit</h3>
            <p class="summary-value">${creditData.filter((item) => item.status === "Near Limit").length}</p>
          </div>
          <div class="summary-card">
            <h3>Paid in Full</h3>
            <p class="summary-value">${creditData.filter((item) => item.status === "Paid in Full").length}</p>
          </div>
        </div>

        <table class="report-table">
          <thead>
            <tr>
              <th>ID</th>
              <th>Member</th>
              <th>Balance</th>
              <th>Credit Limit</th>
              <th>Last Payment</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            ${creditData
              .map(
                (item) => `
              <tr ${item.status === "Near Limit" ? 'class="near-limit"' : ""}>
                <td>${item.id}</td>
                <td>${item.member}</td>
                <td>₱${item.balance.toFixed(2)}</td>
                <td>₱${item.limit.toFixed(2)}</td>
                <td>${item.lastPayment}</td>
                <td>${item.status}</td>
              </tr>
            `,
              )
              .join("")}
          </tbody>
        </table>
        
        <div class="report-chart">
          <div class="chart-title">Credit Utilization</div>
          <div class="chart-placeholder">
            <div class="gauge-chart">
              <div class="gauge-fill" style="transform: rotate(${
                (creditData.reduce((sum, item) => sum + item.balance, 0) /
                  creditData.reduce((sum, item) => sum + item.limit, 0)) *
                180
              }deg);"></div>
              <div class="gauge-center">
                <span>${Math.round(
                  (creditData.reduce((sum, item) => sum + item.balance, 0) /
                    creditData.reduce((sum, item) => sum + item.limit, 0)) *
                    100,
                )}%</span>
              </div>
            </div>
          </div>
        </div>
      `
    }

    // Create a new window for printing
    const printWindow = window.open("", "_blank")
    if (printWindow) {
      printWindow.document.write(`
        <html>
        <head>
          <title>${reportTitle} - Pandol Cooperative</title>
          <style>
            @page {
              size: A4;
              margin: 1cm;
            }
            body {
              font-family: 'Segoe UI', Arial, sans-serif;
              margin: 0;
              padding: 20px;
              color: #333;
              line-height: 1.5;
            }
            .report-container {
              max-width: 100%;
              margin: 0 auto;
            }
            .report-header {
              display: flex;
              justify-content: space-between;
              align-items: center;
              margin-bottom: 30px;
              padding-bottom: 20px;
              border-bottom: 2px solid #f59e0b;
            }
            .logo-container {
              display: flex;
              align-items: center;
            }
            .logo {
              font-weight: bold;
              font-size: 24px;
              color: #f59e0b;
              margin-right: 10px;
            }
            .logo-icon {
              width: 40px;
              height: 40px;
              background: linear-gradient(to right, #f59e0b, #ea580c);
              border-radius: 50%;
              display: flex;
              align-items: center;
              justify-content: center;
              color: white;
              font-weight: bold;
              margin-right: 10px;
            }
            h1 {
              color: #333;
              font-size: 28px;
              margin: 0 0 10px 0;
              text-align: center;
            }
            .report-meta {
              font-size: 14px;
              color: #666;
            }
            .report-meta p {
              margin: 5px 0;
            }
            .report-summary {
              display: flex;
              justify-content: space-between;
              margin-bottom: 30px;
              gap: 15px;
            }
            .summary-card {
              flex: 1;
              background-color: #fff;
              border: 1px solid #e5e7eb;
              border-radius: 8px;
              padding: 15px;
              box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);
              text-align: center;
            }
            .summary-card h3 {
              margin: 0 0 10px 0;
              font-size: 16px;
              color: #666;
            }
            .summary-value {
              font-size: 24px;
              font-weight: bold;
              color: #f59e0b;
              margin: 0;
            }
            .report-table {
              width: 100%;
              border-collapse: collapse;
              margin-bottom: 30px;
              font-size: 14px;
            }
            .report-table th, .report-table td {
              padding: 12px 15px;
              text-align: left;
              border-bottom: 1px solid #e5e7eb;
            }
            .report-table th {
              background-color: #f9fafb;
              font-weight: 600;
              color: #374151;
            }
            .report-table tr:nth-child(even) {
              background-color: #f9fafb;
            }
            .report-table tr:hover {
              background-color: #f3f4f6;
            }
            .report-table tfoot {
              font-weight: bold;
              background-color: #f3f4f6;
            }
            .low-stock {
              color: #ef4444;
            }
            .near-limit {
              color: #f59e0b;
            }
            .report-chart {
              margin-top: 30px;
              border: 1px solid #e5e7eb;
              border-radius: 8px;
              padding: 20px;
              background-color: #fff;
            }
            .chart-title {
              font-weight: 600;
              margin-bottom: 15px;
              text-align: center;
              color: #374151;
            }
            .chart-placeholder {
              height: 200px;
              display: flex;
              justify-content: space-around;
              align-items: flex-end;
              padding: 10px 0;
              border-bottom: 1px solid #e5e7eb;
              position: relative;
            }
            .chart-bar {
              width: 40px;
              background: linear-gradient(to top, #f59e0b, #ea580c);
              border-radius: 4px 4px 0 0;
            }
            .pie-chart {
              position: relative;
              width: 200px;
              height: 200px;
              border-radius: 50%;
              margin: 0 auto;
              overflow: hidden;
            }
            .pie-segment {
              position: absolute;
              width: 100%;
              height: 100%;
              clip-path: polygon(50% 50%, 50% 0%, 100% 0%, 100% 100%, 50% 100%);
            }
            .line-chart {
              position: relative;
              border-bottom: 2px solid #e5e7eb;
              border-left: 2px solid #e5e7eb;
            }
            .line-point {
              position: absolute;
              width: 10px;
              height: 10px;
              background-color: #f59e0b;
              border-radius: 50%;
            }
            .line-point::before {
              content: '';
              position: absolute;
              width: 100%;
              height: 2px;
              background-color: #f59e0b;
              left: -50%;
              top: 50%;
              transform: translateY(-50%);
            }
            .gauge-chart {
              position: relative;
              width: 200px;
              height: 100px;
              margin: 0 auto;
              background-color: #e5e7eb;
              border-radius: 100px 100px 0 0;
              overflow: hidden;
            }
            .gauge-fill {
              position: absolute;
              width: 100%;
              height: 100%;
              background: linear-gradient(to right, #f59e0b, #ea580c);
              transform-origin: bottom center;
            }
            .gauge-center {
              position: absolute;
              bottom: 0;
              left: 50%;
              transform: translateX(-50%);
              width: 60px;
              height: 60px;
              background-color: white;
              border-radius: 50%;
              display: flex;
              align-items: center;
              justify-content: center;
              font-weight: bold;
              color: #f59e0b;
            }
            .footer {
              margin-top: 30px;
              text-align: center;
              font-size: 12px;
              color: #6b7280;
              padding-top: 20px;
              border-top: 1px solid #e5e7eb;
            }
            @media print {
              body {
                -webkit-print-color-adjust: exact;
                print-color-adjust: exact;
              }
              .no-print {
                display: none;
              }
            }
          </style>
        </head>
        <body>
          <div class="report-container">
            <div class="report-header">
              <div class="logo-container">
                <div class="logo-icon">PC</div>
                <div class="logo">Pandol Cooperative</div>
              </div>
              <div class="report-meta">
                <p>${reportDate}</p>
              </div>
            </div>
            <h1>${reportTitle}</h1>
            ${reportContent}
            <div class="footer">
              <p>© ${new Date().getFullYear()} Pandol Cooperative. All rights reserved.</p>
              <p>This report was generated automatically. For questions, please contact the admin office.</p>
            </div>
          </div>
        </body>
        </html>
      `)
      printWindow.document.close()

      // Trigger print dialog after content is loaded
      setTimeout(() => {
        printWindow.print()
      }, 500)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar userType="admin" userName="Admin User" />

      <main className="pt-16 pb-20">
        <div className="container mx-auto px-4 py-8">
          <div className="flex flex-col md:flex-row gap-4 items-start md:items-center justify-between mb-8">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Reports</h1>
              <p className="text-gray-600">Generate and view reports</p>
            </div>
          </div>

          {/* Report Generator */}
          <Card className="mb-8 border border-gray-200 shadow-sm">
            <CardHeader className="bg-gradient-to-r from-amber-50 to-orange-50 border-b border-gray-200">
              <CardTitle className="text-xl text-gray-800">Generate Report</CardTitle>
              <CardDescription>Select options to generate a report</CardDescription>
            </CardHeader>
            <CardContent className="pt-6">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
                <div>
                  <label className="block text-sm font-medium mb-2 text-gray-700">Report Type</label>
                  <Select value={reportType} onValueChange={setReportType}>
                    <SelectTrigger className="border-gray-300 focus:ring-amber-500 focus:border-amber-500">
                      <SelectValue placeholder="Select report type" />
                    </SelectTrigger>
                    <SelectContent>
                      {reportTypes.map((type) => (
                        <SelectItem key={type.value} value={type.value}>
                          {type.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2 text-gray-700">Time Range</label>
                  <Select value={timeRange} onValueChange={setTimeRange}>
                    <SelectTrigger className="border-gray-300 focus:ring-amber-500 focus:border-amber-500">
                      <SelectValue placeholder="Select time range" />
                    </SelectTrigger>
                    <SelectContent>
                      {timeRanges.map((range) => (
                        <SelectItem key={range.value} value={range.value}>
                          {range.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2 text-gray-700">Format</label>
                  <Select value={format} onValueChange={setFormat}>
                    <SelectTrigger className="border-gray-300 focus:ring-amber-500 focus:border-amber-500">
                      <SelectValue placeholder="Select format" />
                    </SelectTrigger>
                    <SelectContent>
                      {formats.map((f) => (
                        <SelectItem key={f.value} value={f.value}>
                          {f.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="flex justify-end">
                <Button
                  className="bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 shadow-md transition-all"
                  onClick={generateReport}
                >
                  <FileText className="h-4 w-4 mr-2" />
                  Generate Report
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Report Preview */}
          <Card className="border border-gray-200 shadow-sm">
            <CardHeader className="bg-gradient-to-r from-amber-50 to-orange-50 border-b border-gray-200">
              <div className="flex justify-between items-center">
                <div>
                  <CardTitle className="text-xl text-gray-800">Report Preview</CardTitle>
                  <CardDescription>Preview of the selected report type</CardDescription>
                </div>
                <div className="flex gap-2">
                  <Button variant="outline" size="sm" className="text-gray-600">
                    <Filter className="h-4 w-4 mr-1" /> Filter
                  </Button>
                  <Button variant="outline" size="sm" className="text-gray-600">
                    <Calendar className="h-4 w-4 mr-1" /> Date
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent className="pt-6">
              {reportType === "sales" && (
                <div>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                    <Card className="bg-gradient-to-br from-amber-50 to-orange-50 border border-amber-100">
                      <CardContent className="p-4 text-center">
                        <h3 className="text-sm font-medium text-gray-600 mb-1">Total Sales</h3>
                        <p className="text-2xl font-bold text-amber-600">
                          ₱{salesData.reduce((sum, item) => sum + item.amount, 0).toFixed(2)}
                        </p>
                      </CardContent>
                    </Card>
                    <Card className="bg-gradient-to-br from-amber-50 to-orange-50 border border-amber-100">
                      <CardContent className="p-4 text-center">
                        <h3 className="text-sm font-medium text-gray-600 mb-1">Total Items</h3>
                        <p className="text-2xl font-bold text-amber-600">
                          {salesData.reduce((sum, item) => sum + item.items, 0)}
                        </p>
                      </CardContent>
                    </Card>
                    <Card className="bg-gradient-to-br from-amber-50 to-orange-50 border border-amber-100">
                      <CardContent className="p-4 text-center">
                        <h3 className="text-sm font-medium text-gray-600 mb-1">Transactions</h3>
                        <p className="text-2xl font-bold text-amber-600">{salesData.length}</p>
                      </CardContent>
                    </Card>
                  </div>

                  <h3 className="text-lg font-medium mb-4 text-gray-800">Sales Report</h3>
                  <div className="rounded-lg border border-gray-200 overflow-hidden">
                    <Table>
                      <TableHeader className="bg-gray-50">
                        <TableRow>
                          <TableHead>ID</TableHead>
                          <TableHead>Date</TableHead>
                          <TableHead>Amount</TableHead>
                          <TableHead>Items</TableHead>
                          <TableHead>Customer</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {salesData.map((sale) => (
                          <TableRow key={sale.id} className="hover:bg-gray-50">
                            <TableCell>{sale.id}</TableCell>
                            <TableCell>{sale.date}</TableCell>
                            <TableCell>₱{sale.amount.toFixed(2)}</TableCell>
                            <TableCell>{sale.items}</TableCell>
                            <TableCell>{sale.customer}</TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                  <div className="mt-4 text-right">
                    <p className="font-medium text-gray-700">
                      Total Sales:{" "}
                      <span className="text-amber-600">
                        ₱{salesData.reduce((sum, item) => sum + item.amount, 0).toFixed(2)}
                      </span>
                    </p>
                    <p className="font-medium text-gray-700">
                      Total Items:{" "}
                      <span className="text-amber-600">{salesData.reduce((sum, item) => sum + item.items, 0)}</span>
                    </p>
                  </div>
                </div>
              )}

              {reportType === "inventory" && (
                <div>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                    <Card className="bg-gradient-to-br from-amber-50 to-orange-50 border border-amber-100">
                      <CardContent className="p-4 text-center">
                        <h3 className="text-sm font-medium text-gray-600 mb-1">Total Products</h3>
                        <p className="text-2xl font-bold text-amber-600">{inventoryData.length}</p>
                      </CardContent>
                    </Card>
                    <Card className="bg-gradient-to-br from-amber-50 to-orange-50 border border-amber-100">
                      <CardContent className="p-4 text-center">
                        <h3 className="text-sm font-medium text-gray-600 mb-1">Low Stock Items</h3>
                        <p className="text-2xl font-bold text-amber-600">
                          {inventoryData.filter((item) => item.status === "Low Stock").length}
                        </p>
                      </CardContent>
                    </Card>
                    <Card className="bg-gradient-to-br from-amber-50 to-orange-50 border border-amber-100">
                      <CardContent className="p-4 text-center">
                        <h3 className="text-sm font-medium text-gray-600 mb-1">Categories</h3>
                        <p className="text-2xl font-bold text-amber-600">
                          {new Set(inventoryData.map((item) => item.category)).size}
                        </p>
                      </CardContent>
                    </Card>
                  </div>

                  <h3 className="text-lg font-medium mb-4 text-gray-800">Inventory Report</h3>
                  <div className="rounded-lg border border-gray-200 overflow-hidden">
                    <Table>
                      <TableHeader className="bg-gray-50">
                        <TableRow>
                          <TableHead>ID</TableHead>
                          <TableHead>Product Name</TableHead>
                          <TableHead>Category</TableHead>
                          <TableHead>Current Stock</TableHead>
                          <TableHead>Reorder Level</TableHead>
                          <TableHead>Status</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {inventoryData.map((item) => (
                          <TableRow key={item.id} className="hover:bg-gray-50">
                            <TableCell>{item.id}</TableCell>
                            <TableCell>{item.name}</TableCell>
                            <TableCell>{item.category}</TableCell>
                            <TableCell>{item.stock}</TableCell>
                            <TableCell>{item.reorderLevel}</TableCell>
                            <TableCell className={item.status === "Low Stock" ? "text-red-500 font-medium" : ""}>
                              {item.status}
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                </div>
              )}

              {reportType === "members" && (
                <div>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                    <Card className="bg-gradient-to-br from-amber-50 to-orange-50 border border-amber-100">
                      <CardContent className="p-4 text-center">
                        <h3 className="text-sm font-medium text-gray-600 mb-1">Total Members</h3>
                        <p className="text-2xl font-bold text-amber-600">{memberData.length}</p>
                      </CardContent>
                    </Card>
                    <Card className="bg-gradient-to-br from-amber-50 to-orange-50 border border-amber-100">
                      <CardContent className="p-4 text-center">
                        <h3 className="text-sm font-medium text-gray-600 mb-1">Total Purchases</h3>
                        <p className="text-2xl font-bold text-amber-600">
                          {memberData.reduce((sum, item) => sum + item.purchases, 0)}
                        </p>
                      </CardContent>
                    </Card>
                    <Card className="bg-gradient-to-br from-amber-50 to-orange-50 border border-amber-100">
                      <CardContent className="p-4 text-center">
                        <h3 className="text-sm font-medium text-gray-600 mb-1">Total Points</h3>
                        <p className="text-2xl font-bold text-amber-600">
                          {memberData.reduce((sum, item) => sum + item.points, 0)}
                        </p>
                      </CardContent>
                    </Card>
                  </div>

                  <h3 className="text-lg font-medium mb-4 text-gray-800">Member Report</h3>
                  <div className="rounded-lg border border-gray-200 overflow-hidden">
                    <Table>
                      <TableHeader className="bg-gray-50">
                        <TableRow>
                          <TableHead>ID</TableHead>
                          <TableHead>Name</TableHead>
                          <TableHead>Email</TableHead>
                          <TableHead>Join Date</TableHead>
                          <TableHead>Purchases</TableHead>
                          <TableHead>Loyalty Points</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {memberData.map((member) => (
                          <TableRow key={member.id} className="hover:bg-gray-50">
                            <TableCell>{member.id}</TableCell>
                            <TableCell>{member.name}</TableCell>
                            <TableCell>{member.email}</TableCell>
                            <TableCell>{member.joinDate}</TableCell>
                            <TableCell>{member.purchases}</TableCell>
                            <TableCell>{member.points}</TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                </div>
              )}

              {reportType === "credit" && (
                <div>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                    <Card className="bg-gradient-to-br from-amber-50 to-orange-50 border border-amber-100">
                      <CardContent className="p-4 text-center">
                        <h3 className="text-sm font-medium text-gray-600 mb-1">Total Credit</h3>
                        <p className="text-2xl font-bold text-amber-600">
                          ₱{creditData.reduce((sum, item) => sum + item.balance, 0).toFixed(2)}
                        </p>
                      </CardContent>
                    </Card>
                    <Card className="bg-gradient-to-br from-amber-50 to-orange-50 border border-amber-100">
                      <CardContent className="p-4 text-center">
                        <h3 className="text-sm font-medium text-gray-600 mb-1">Near Limit</h3>
                        <p className="text-2xl font-bold text-amber-600">
                          {creditData.filter((item) => item.status === "Near Limit").length}
                        </p>
                      </CardContent>
                    </Card>
                    <Card className="bg-gradient-to-br from-amber-50 to-orange-50 border border-amber-100">
                      <CardContent className="p-4 text-center">
                        <h3 className="text-sm font-medium text-gray-600 mb-1">Paid in Full</h3>
                        <p className="text-2xl font-bold text-amber-600">
                          {creditData.filter((item) => item.status === "Paid in Full").length}
                        </p>
                      </CardContent>
                    </Card>
                  </div>

                  <h3 className="text-lg font-medium mb-4 text-gray-800">Credit Report</h3>
                  <div className="rounded-lg border border-gray-200 overflow-hidden">
                    <Table>
                      <TableHeader className="bg-gray-50">
                        <TableRow>
                          <TableHead>ID</TableHead>
                          <TableHead>Member</TableHead>
                          <TableHead>Balance</TableHead>
                          <TableHead>Credit Limit</TableHead>
                          <TableHead>Last Payment</TableHead>
                          <TableHead>Status</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {creditData.map((credit) => (
                          <TableRow key={credit.id} className="hover:bg-gray-50">
                            <TableCell>{credit.id}</TableCell>
                            <TableCell>{credit.member}</TableCell>
                            <TableCell>₱{credit.balance.toFixed(2)}</TableCell>
                            <TableCell>₱{credit.limit.toFixed(2)}</TableCell>
                            <TableCell>{credit.lastPayment}</TableCell>
                            <TableCell className={credit.status === "Near Limit" ? "text-orange-500 font-medium" : ""}>
                              {credit.status}
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                </div>
              )}

              <div className="mt-6 flex justify-end">
                <Button variant="outline" className="mr-2">
                  <DownloadCloud className="h-4 w-4 mr-2" />
                  Download
                </Button>
                <Button
                  className="bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 shadow-md transition-all"
                  onClick={generateReport}
                >
                  <Printer className="h-4 w-4 mr-2" />
                  Print Report
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  )
}
