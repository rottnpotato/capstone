"use client"

import { Navbar } from "@/components/ui/navbar"
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card"

export default function MemberPurchasesPage() {
  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar userType="member" userName="Maria Santos" />

      <main className="pt-16 pb-20">
        <div className="container mx-auto px-4 py-8">
          <h1 className="text-3xl font-bold mb-6">Purchase History</h1>
          
          <Card>
            <CardHeader>
              <CardTitle>Your Purchases</CardTitle>
              <CardDescription>View all your transactions with Pandol Cooperative</CardDescription>
            </CardHeader>
            <CardContent>
              <p>Purchase history content will be displayed here.</p>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  )
}
