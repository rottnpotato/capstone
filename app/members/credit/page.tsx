"use client"

import { Navbar } from "@/components/ui/navbar"
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card"

export default function MemberCreditPage() {
  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar userType="member" userName="Maria Santos" />

      <main className="pt-16 pb-20">
        <div className="container mx-auto px-4 py-8">
          <h1 className="text-3xl font-bold mb-6">Credit Management</h1>
          
          <Card>
            <CardHeader>
              <CardTitle>Your Credit Status</CardTitle>
              <CardDescription>Manage your credit and view payment schedules</CardDescription>
            </CardHeader>
            <CardContent>
              <p>Credit management content will be displayed here.</p>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  )
}
