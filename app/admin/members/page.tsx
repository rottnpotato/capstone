"use client"

import { useState, useEffect, useCallback } from "react"
import { motion } from "framer-motion"
import { Navbar } from "@/components/ui/navbar"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Search, Plus, ArrowUpDown, MoreHorizontal, Edit, Trash2, CreditCard, Mail, Loader2, BadgeInfo, Receipt, CheckCircle2, AlertCircle } from "lucide-react"
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import * as z from "zod"
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form"

// Use the interface from the API route
import type { MemberForAdminPage } from "@/app/api/members/route";
import { IssueAccountVerification, AddMember, UpdateMember, DeleteMember } from "./actions";

// Debounce function
function debounce<T extends (...args: any[]) => void>(func: T, wait: number): (...args: Parameters<T>) => void {
  let timeout: NodeJS.Timeout | null = null;
  return (...args: Parameters<T>) => {
    if (timeout) {
      clearTimeout(timeout);
    }
    timeout = setTimeout(() => func(...args), wait);
  };
}

// Form schemas
const addMemberFormSchema = z.object({
  name: z.string().min(2, {
    message: "Name must be at least 2 characters.",
  }),
  email: z.string().email({
    message: "Please enter a valid email address.",
  }),
  phone: z.string().optional(),
  address: z.string().optional(),
  userId: z.string().optional(),
  initialCredit: z.coerce.number().nonnegative().default(0),
  creditLimit: z.coerce.number().nonnegative().default(0),
});

type Role = {
  id: number;
  name: string;
  description?: string;
};

type User = {
  id: number;
  name: string;
  email: string;
  roleId: number;
  roleName: string;
};

// Purchase History Component
function PurchaseHistory({ memberId }: { memberId: string }) {
  const [transactions, setTransactions] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchPurchaseHistory = async () => {
      setIsLoading(true);
      setError(null);
      try {
        const response = await fetch(`/api/members/${memberId}/transactions`);
        const data = await response.json();
        
        if (!response.ok) {
          throw new Error(data.message || "Failed to fetch purchase history");
        }
        
        setTransactions(data.transactions || []);
      } catch (err: any) {
        console.error("Fetch purchase history error:", err);
        setError(err.message || "An error occurred while fetching purchase history.");
      } finally {
        setIsLoading(false);
      }
    };
    
    if (memberId) {
      fetchPurchaseHistory();
    }
  }, [memberId]);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center">
          <Receipt className="mr-2 h-4 w-4" /> Purchase History
        </CardTitle>
      </CardHeader>
      <CardContent>
        {isLoading && (
          <div className="flex items-center justify-center py-4">
            <Loader2 className="h-6 w-6 animate-spin text-amber-500 mr-2" />
            <p>Loading purchase history...</p>
          </div>
        )}
        
        {error && !isLoading && (
          <div className="text-red-500 py-2">
            Error: {error}
          </div>
        )}
        
        {!isLoading && !error && transactions.length === 0 && (
          <p className="text-gray-500 py-2">No purchase history found for this member.</p>
        )}
        
        {!isLoading && !error && transactions.length > 0 && (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b">
                  <th className="text-left py-2 font-medium text-gray-600">Date</th>
                  <th className="text-left py-2 font-medium text-gray-600">Time</th>
                  <th className="text-left py-2 font-medium text-gray-600">Amount</th>
                  <th className="text-left py-2 font-medium text-gray-600">Payment</th>
                  <th className="text-left py-2 font-medium text-gray-600">Cashier</th>
                </tr>
              </thead>
              <tbody>
                {transactions.map((transaction) => (
                  <tr key={transaction.id} className="border-b hover:bg-gray-50">
                    <td className="py-2">{transaction.date}</td>
                    <td className="py-2">{transaction.time}</td>
                    <td className="py-2">{transaction.totalAmount.toLocaleString('en-PH', { style: 'currency', currency: 'PHP' })}</td>
                    <td className="py-2 capitalize">{transaction.paymentMethod}</td>
                    <td className="py-2">{transaction.cashierName}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

export default function AdminMembersPage() {
  // State for data, loading, errors, filters, sorting, pagination
  const [members, setMembers] = useState<MemberForAdminPage[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [sortBy, setSortBy] = useState("name");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("asc");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10); // Match API default
  const [totalCount, setTotalCount] = useState(0);
  const [users, setUsers] = useState<User[]>([]);
  const [isLoadingUsers, setIsLoadingUsers] = useState(false);

  // State for modals
  const [isAddMemberModalOpen, setIsAddMemberModalOpen] = useState(false);
  const [isEditMemberModalOpen, setIsEditMemberModalOpen] = useState(false);
  const [selectedMember, setSelectedMember] = useState<MemberForAdminPage | null>(null);
  const [isDeleteConfirmOpen, setIsDeleteConfirmOpen] = useState(false);
  const [isViewMemberModalOpen, setIsViewMemberModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [issuingAccount, setIssuingAccount] = useState<string | null>(null);
  const [accountIssueMessage, setAccountIssueMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);

  // Setup form
  const addMemberForm = useForm<z.infer<typeof addMemberFormSchema>>({
    resolver: zodResolver(addMemberFormSchema),
    defaultValues: {
      name: "",
      email: "",
      phone: "",
      address: "",
      userId: "",
      initialCredit: 0,
      creditLimit: 0,
    },
  });

  // Add edit member form setup
  const editMemberForm = useForm<z.infer<typeof addMemberFormSchema>>({
    resolver: zodResolver(addMemberFormSchema),
    defaultValues: {
      name: "",
      email: "",
      phone: "",
      address: "",
      userId: "",
      initialCredit: 0,
      creditLimit: 0,
    },
  });

  // Data fetching function
  const fetchMembers = useCallback(async (params: { 
    searchQuery: string; 
    statusFilter: string; 
    sortBy: string; 
    sortOrder: string; 
    page: number; 
    pageSize: number; 
  }) => {
    setIsLoading(true);
    setError(null);
    try {
      const urlParams = new URLSearchParams();
      if (params.searchQuery) urlParams.set('searchQuery', params.searchQuery);
      if (params.statusFilter !== 'all') urlParams.set('statusFilter', params.statusFilter);
      urlParams.set('sortBy', params.sortBy);
      urlParams.set('sortOrder', params.sortOrder);
      urlParams.set('page', params.page.toString());
      urlParams.set('pageSize', params.pageSize.toString());

      const response = await fetch(`/api/members?${urlParams.toString()}`);
      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.message || "Failed to fetch members");
      }

      setMembers(data.members || []);
      setTotalCount(data.pagination?.totalCount || 0);

    } catch (err: any) {
      console.error("Fetch members error:", err);
      setError(err.message || "An error occurred while fetching members.");
      setMembers([]); // Clear members on error
      setTotalCount(0);
    } finally {
      setIsLoading(false);
    }
  }, []); // Dependencies: fetchMembers doesn't change

  // Fetch users with member roles
  const fetchUsers = useCallback(async () => {
    setIsLoadingUsers(true);
    try {
      const response = await fetch('/api/users?role=Member');
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.message || "Failed to fetch users");
      }
      
      setUsers(data.data || []);
    } catch (err: any) {
      console.error("Fetch users error:", err);
      // Don't set general error state to avoid interfering with members display
    } finally {
      setIsLoadingUsers(false);
    }
  }, []);

  // Debounced search handler
  const debouncedFetch = useCallback(debounce(fetchMembers, 500), [fetchMembers]);

  // Initial fetch and fetch on dependency change
  useEffect(() => {
    debouncedFetch({ searchQuery, statusFilter, sortBy, sortOrder, page, pageSize });
  }, [searchQuery, statusFilter, sortBy, sortOrder, page, pageSize, debouncedFetch]);

  // Fetch users when add member modal is opened
  useEffect(() => {
    if (isAddMemberModalOpen || isEditMemberModalOpen) {
      fetchUsers();
    }
  }, [isAddMemberModalOpen, isEditMemberModalOpen, fetchUsers]);

  // Update form values when selectedMember changes for edit
  useEffect(() => {
    if (selectedMember && isEditMemberModalOpen) {
      editMemberForm.reset({
        name: selectedMember.name,
        email: selectedMember.email,
        phone: selectedMember.phone || "",
        address: selectedMember.address || "",
        userId: selectedMember.userId ? selectedMember.userId.toString() : "",
        initialCredit: selectedMember.currentCredit,
        creditLimit: selectedMember.creditLimit,
      });
    }
  }, [selectedMember, isEditMemberModalOpen, editMemberForm]);

  // Edit member form submission
  const onEditMemberSubmit = async (values: z.infer<typeof addMemberFormSchema>) => {
    if (!selectedMember) return;
    
    setIsSubmitting(true);
    try {
      // Convert userId from string to number or null
      const userId = values.userId && values.userId !== "0" ? parseInt(values.userId) : null;
      
      // Use the server action instead of fetch
      const result = await UpdateMember(selectedMember.id, {
        name: values.name,
        email: values.email,
        phone: values.phone,
        address: values.address,
        userId: userId,
        creditBalance: values.initialCredit,
        creditLimit: values.creditLimit,
      });
      
      if (!result.success) {
        throw new Error(result.message || "Failed to update member");
      }
      
      // Refetch members to show updated data
      fetchMembers({ searchQuery, statusFilter, sortBy, sortOrder, page, pageSize });
      
      // Reset form and close modal
      editMemberForm.reset();
      setIsEditMemberModalOpen(false);
      setSelectedMember(null);
      
    } catch (err: any) {
      console.error("Update member error:", err);
      // Display error in form context
      editMemberForm.setError("root", { 
        message: err.message || "Failed to update member. Please try again." 
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  // --- Modal Handlers (Placeholder - Need actual API calls for Add/Edit/Delete) ---
  const handleEditMember = async (member: MemberForAdminPage) => {
    try {
      // Fetch the complete member details
      const response = await fetch(`/api/members/${member.id}`);
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.message || "Failed to fetch member details");
      }
      
      setSelectedMember(data.member);
      setIsEditMemberModalOpen(true);
    } catch (err: any) {
      console.error("Fetch member details error:", err);
      // Could show error notification here
    }
  };

  const handleDeleteMember = (member: MemberForAdminPage) => {
    setSelectedMember(member);
    setIsDeleteConfirmOpen(true);
  };

  const handleViewMember = async (member: MemberForAdminPage) => {
    try {
      // Fetch the complete member details
      const response = await fetch(`/api/members/${member.id}`);
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.message || "Failed to fetch member details");
      }
      
      setSelectedMember(data.member);
      setIsViewMemberModalOpen(true);
    } catch (err: any) {
      console.error("Fetch member details error:", err);
      // Could show error notification here
    }
  };

  const confirmDelete = async () => {
    if (!selectedMember) return;
    setIsSubmitting(true);
    try {
      // Use the server action instead of fetch
      const result = await DeleteMember(selectedMember.id);
      
      if (!result.success) {
        throw new Error(result.message || "Failed to delete member");
      }
      
      // Refetch members to update the list
      fetchMembers({ searchQuery, statusFilter, sortBy, sortOrder, page, pageSize });
      
      // Close modal and clear selection
      setIsDeleteConfirmOpen(false);
      setSelectedMember(null);
      
    } catch (err: any) {
      console.error("Delete member error:", err);
      // Could add toast notification here for error
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSort = (column: string) => {
    if (sortBy === column) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(column);
      setSortOrder('asc');
    }
    setPage(1); // Reset to first page on sort change
  };

  const onAddMemberSubmit = async (values: z.infer<typeof addMemberFormSchema>) => {
    setIsSubmitting(true);
    try {
      // Convert userId from string to number or null
      const userId = values.userId && values.userId !== "0" ? parseInt(values.userId) : null;
      
      // Use the server action instead of fetch
      const result = await AddMember({
        name: values.name,
        email: values.email,
        phone: values.phone,
        address: values.address,
        userId: userId,
        initialCredit: values.initialCredit,
        creditLimit: values.creditLimit,
      });
      
      if (!result.success) {
        throw new Error(result.message || "Failed to add member");
      }
      
      // Refetch members to show the new addition
      fetchMembers({ searchQuery, statusFilter, sortBy, sortOrder, page, pageSize });
      
      // Reset form and close modal
      addMemberForm.reset();
      setIsAddMemberModalOpen(false);
      
    } catch (err: any) {
      console.error("Add member error:", err);
      // Display error in form context
      addMemberForm.setError("root", { 
        message: err.message || "Failed to add member. Please try again." 
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleIssueAccount = async (member: MemberForAdminPage) => {
    if (member.userId) {
      setAccountIssueMessage({
        type: 'error',
        text: 'This member already has an account'
      });
      return;
    }

    try {
      setIssuingAccount(member.id);
      const result = await IssueAccountVerification(member.id);
      
      if (result.success) {
        setAccountIssueMessage({
          type: 'success',
          text: result.message
        });
      } else {
        setAccountIssueMessage({
          type: 'error',
          text: result.message
        });
      }
    } catch (error) {
      console.error("Error issuing account:", error);
      setAccountIssueMessage({
        type: 'error',
        text: 'Failed to issue account verification'
      });
    } finally {
      setIssuingAccount(null);
      // Clear message after 5 seconds
      setTimeout(() => {
        setAccountIssueMessage(null);
      }, 5000);
    }
  };

  const totalPages = Math.ceil(totalCount / pageSize);

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar userType="admin" userName="Admin User" />

      <main className="pt-16 pb-20">
        <div className="container mx-auto px-4 py-8">
          {/* Header */}
          <div className="flex flex-col md:flex-row gap-4 items-start md:items-center justify-between mb-8">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Member Management</h1>
              <p className="text-gray-600">Manage cooperative members ({totalCount} total)</p>
            </div>
            <Button
              className="bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600"
              onClick={() => setIsAddMemberModalOpen(true)}
            >
              <Plus className="h-4 w-4 mr-2" /> Add Member
            </Button>
          </div>

          {/* Filters */}
          <Card className="mb-8">
            <CardContent className="p-4 flex flex-col md:flex-row gap-4 items-center">
              <div className="relative flex-grow w-full md:w-auto">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Search by Name, ID, or Email..."
                  className="pl-10 w-full"
                  value={searchQuery}
                  onChange={(e) => {
                      setSearchQuery(e.target.value);
                      setPage(1); // Reset page on new search
                  }}
                />
              </div>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-full md:w-[180px]">
                  <SelectValue placeholder="Filter by Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Statuses</SelectItem>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="inactive">Inactive</SelectItem>
                  <SelectItem value="pending">Pending</SelectItem>
                  {/* These statuses need to exist in the DB */}
                </SelectContent>
              </Select>
              {/* Add more filters if needed (e.g., date range for joinDate) */}
            </CardContent>
          </Card>

          {/* Loading and Error States */}
          {isLoading && (
              <div className="text-center py-10">
                  <Loader2 className="h-8 w-8 animate-spin mx-auto text-amber-500" />
                  <p className="mt-2 text-gray-600">Loading members...</p>
              </div>
          )}
          {error && !isLoading && (
              <Alert variant="destructive" className="mb-8">
                  <AlertDescription>{error}</AlertDescription>
              </Alert>
          )}

          {/* Members Table */}
          {!isLoading && !error && (
            <Card>
              <CardContent className="p-0">
                <div className="overflow-x-auto">
                  <table className="w-full min-w-[800px]">
                    <thead className="bg-gray-100">
                      <tr>
                        {/* Sortable Headers */} 
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer" onClick={() => handleSort('name')}>
                          Name <ArrowUpDown className="inline h-3 w-3 ml-1" />
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer" onClick={() => handleSort('id')}>
                          Member ID <ArrowUpDown className="inline h-3 w-3 ml-1" />
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Email</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer" onClick={() => handleSort('credit')}>
                          Credit Bal. <ArrowUpDown className="inline h-3 w-3 ml-1" />
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Role</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer" onClick={() => handleSort('date')}>
                          Join Date <ArrowUpDown className="inline h-3 w-3 ml-1" />
                        </th>
                        <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {members.length === 0 ? (
                          <tr>
                              <td colSpan={8} className="px-6 py-10 text-center text-gray-500">
                                  No members found matching your criteria.
                              </td>
                          </tr>
                      ) : (
                          members.map((member) => (
                            <tr key={member.id}>
                              <td className="px-6 py-4 whitespace-nowrap">
                                <div className="flex items-center">
                                  <Avatar className="h-8 w-8 mr-3">
                                    {/* <AvatarImage src={`/avatars/${member.id}.png`} alt={member.name} /> */}
                                    <AvatarFallback>{member.name.split(' ').map(n => n[0]).join('')}</AvatarFallback>
                                  </Avatar>
                                  <span className="text-sm font-medium text-gray-900 hover:text-amber-600 cursor-pointer" onClick={() => handleViewMember(member)}>{member.name}</span>
                                </div>
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{member.memberID}</td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{member.email}</td>
                              <td className="px-6 py-4 whitespace-nowrap">
                                <Badge 
                                  variant={member.status === 'active' ? 'default' : member.status === 'inactive' ? 'secondary' : 'outline'}
                                  className="capitalize"
                                >
                                  {member.status} {/* Needs actual status data */}
                                </Badge>
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                {member.currentCredit.toLocaleString('en-PH', { style: 'currency', currency: 'PHP' })}
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                {member.roleName || 'No Role'}
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{member.joinDate}</td>
                              <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                <DropdownMenu>
                                  <DropdownMenuTrigger asChild>
                                    <Button variant="ghost" className="h-8 w-8 p-0">
                                      <span className="sr-only">Open menu</span>
                                      <MoreHorizontal className="h-4 w-4" />
                                    </Button>
                                  </DropdownMenuTrigger>
                                  <DropdownMenuContent align="end">
                                    <DropdownMenuItem onClick={() => handleViewMember(member)}>
                                      <BadgeInfo className="mr-2 h-4 w-4" />
                                      View Details
                                    </DropdownMenuItem>
                                    <DropdownMenuItem onClick={() => handleEditMember(member)}>
                                      <Edit className="mr-2 h-4 w-4" />
                                      Edit
                                    </DropdownMenuItem>
                                    <DropdownMenuItem onClick={() => handleDeleteMember(member)}>
                                      <Trash2 className="mr-2 h-4 w-4" />
                                      Delete
                                    </DropdownMenuItem>
                                    <DropdownMenuSeparator />
                                    {!member.userId ? (
                                      <DropdownMenuItem 
                                        onClick={() => handleIssueAccount(member)}
                                        disabled={issuingAccount === member.id}
                                      >
                                        {issuingAccount === member.id ? (
                                          <>
                                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                            Sending Email...
                                          </>
                                        ) : (
                                          <>
                                            <Mail className="mr-2 h-4 w-4" />
                                            Issue Account
                                          </>
                                        )}
                                      </DropdownMenuItem>
                                    ) : (
                                      <DropdownMenuItem disabled>
                                        <CheckCircle2 className="mr-2 h-4 w-4 text-green-500" />
                                        Account Created
                                      </DropdownMenuItem>
                                    )}
                                  </DropdownMenuContent>
                                </DropdownMenu>
                              </td>
                            </tr>
                          ))
                      )}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Pagination Controls */}
          {!isLoading && !error && totalCount > 0 && (
              <div className="flex items-center justify-between mt-8">
                  <span className="text-sm text-gray-700">
                      Showing {Math.min((page - 1) * pageSize + 1, totalCount)} to {Math.min(page * pageSize, totalCount)} of {totalCount} members
                  </span>
                  <div className="flex gap-2">
                      <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setPage(p => Math.max(1, p - 1))}
                          disabled={page <= 1}
                      >
                          Previous
                      </Button>
                      <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                          disabled={page >= totalPages}
                      >
                          Next
                      </Button>
                  </div>
              </div>
          )}
        </div>
      </main>

      {/* --- Modals (Placeholders - Need Forms and API Calls) --- */}

      {/* Add Member Modal */}
      <Dialog open={isAddMemberModalOpen} onOpenChange={setIsAddMemberModalOpen}>
        <DialogContent className="sm:max-w-[500px] max-h-[95vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Add New Member</DialogTitle>
            <DialogDescription>Enter the details for the new cooperative member.</DialogDescription>
          </DialogHeader>
          <Form {...addMemberForm}>
            <form onSubmit={addMemberForm.handleSubmit(onAddMemberSubmit)} className="space-y-4">
              <FormField
                control={addMemberForm.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Name</FormLabel>
                    <FormControl>
                      <Input placeholder="Full Name" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={addMemberForm.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Email</FormLabel>
                    <FormControl>
                      <Input placeholder="Email Address" type="email" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={addMemberForm.control}
                  name="phone"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Phone Number</FormLabel>
                      <FormControl>
                        <Input placeholder="Phone Number (Optional)" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={addMemberForm.control}
                  name="initialCredit"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Initial Credit</FormLabel>
                      <FormControl>
                        <Input placeholder="0.00" type="number" min="0" step="0.01" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              <FormField
                control={addMemberForm.control}
                name="creditLimit"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Credit Limit</FormLabel>
                    <FormControl>
                      <Input placeholder="0.00" type="number" min="0" step="0.01" {...field} />
                    </FormControl>
                    <FormDescription>
                      Maximum amount of credit this member can use for purchases
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={addMemberForm.control}
                name="address"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Address</FormLabel>
                    <FormControl>
                      <Textarea placeholder="Member Address (Optional)" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={addMemberForm.control}
                name="userId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>User Account</FormLabel>
                    <FormControl>
                      <Select 
                        onValueChange={field.onChange} 
                        defaultValue={field.value}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select a user account" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="0">None</SelectItem>
                          {isLoadingUsers ? (
                            <SelectItem value="loading" disabled>Loading users...</SelectItem>
                          ) : (
                            users.map(user => (
                              <SelectItem key={user.id} value={user.id.toString()}>
                                {user.name} ({user.email}) - {user.roleName}
                              </SelectItem>
                            ))
                          )}
                        </SelectContent>
                      </Select>
                    </FormControl>
                    <FormDescription>
                      Associate this member with a user account that has a member role
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              {/* Display general form errors */}
              {addMemberForm.formState.errors.root && (
                <Alert variant="destructive">
                  <AlertDescription>
                    {addMemberForm.formState.errors.root.message}
                  </AlertDescription>
                </Alert>
              )}
              
              <DialogFooter>
                <Button 
                  variant="outline" 
                  type="button" 
                  onClick={() => {
                    addMemberForm.reset();
                    setIsAddMemberModalOpen(false);
                  }}
                >
                  Cancel
                </Button>
                <Button type="submit" disabled={isSubmitting}>
                  {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Add Member
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      {/* Edit Member Modal */}
      <Dialog open={isEditMemberModalOpen} onOpenChange={setIsEditMemberModalOpen}>
        <DialogContent className="max-h-screen overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Edit Member: {selectedMember?.name}</DialogTitle>
            <DialogDescription>Update the details for this member.</DialogDescription>
          </DialogHeader>
          <Form {...editMemberForm}>
            <form onSubmit={editMemberForm.handleSubmit(onEditMemberSubmit)} className="space-y-4">
              <FormField
                control={editMemberForm.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Name</FormLabel>
                    <FormControl>
                      <Input placeholder="Full Name" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={editMemberForm.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Email</FormLabel>
                    <FormControl>
                      <Input placeholder="Email Address" type="email" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={editMemberForm.control}
                  name="phone"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Phone Number</FormLabel>
                      <FormControl>
                        <Input placeholder="Phone Number (Optional)" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={editMemberForm.control}
                  name="initialCredit"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Initial Credit</FormLabel>
                      <FormControl>
                        <Input placeholder="0.00" type="number" min="0" step="0.01" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              <FormField
                control={editMemberForm.control}
                name="creditLimit"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Credit Limit</FormLabel>
                    <FormControl>
                      <Input placeholder="0.00" type="number" min="0" step="0.01" {...field} />
                    </FormControl>
                    <FormDescription>
                      Maximum amount of credit this member can use for purchases
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={editMemberForm.control}
                name="address"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Address</FormLabel>
                    <FormControl>
                      <Textarea placeholder="Member Address (Optional)" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={editMemberForm.control}
                name="userId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>User Account</FormLabel>
                    <FormControl>
                      <Select 
                        onValueChange={field.onChange} 
                        defaultValue={field.value}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select a user account" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="0">None</SelectItem>
                          {isLoadingUsers ? (
                            <SelectItem value="loading" disabled>Loading users...</SelectItem>
                          ) : (
                            users.map(user => (
                              <SelectItem key={user.id} value={user.id.toString()}>
                                {user.name} ({user.email}) - {user.roleName}
                              </SelectItem>
                            ))
                          )}
                        </SelectContent>
                      </Select>
                    </FormControl>
                    <FormDescription>
                      Associate this member with a user account that has a member role
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              {/* Display general form errors */}
              {editMemberForm.formState.errors.root && (
                <Alert variant="destructive">
                  <AlertDescription>
                    {editMemberForm.formState.errors.root.message}
                  </AlertDescription>
                </Alert>
              )}
              
              <DialogFooter>
                <Button variant="outline" onClick={() => setIsEditMemberModalOpen(false)}>Cancel</Button>
                <Button type="submit" disabled={isSubmitting}>
                  {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Save Changes
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      {/* View Member Modal */}
      <Dialog open={isViewMemberModalOpen} onOpenChange={setIsViewMemberModalOpen}>
        <DialogContent className="max-h-screen max-w-2xl overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Member Details: {selectedMember?.name}</DialogTitle>
          </DialogHeader>
          {selectedMember && (
            <div className="mt-4 space-y-4">
              <p><strong>Member ID:</strong> {selectedMember.memberID}</p>
              <p><strong>Email:</strong> {selectedMember.email}</p>
              <p><strong>Phone:</strong> {selectedMember.phone}</p>
              <p><strong>Join Date:</strong> {selectedMember.joinDate}</p>
              <div><strong>Status:</strong> <Badge variant={selectedMember.status === 'active' ? 'default' : 'secondary'} className="capitalize">{selectedMember.status}</Badge></div>
              <p><strong>Credit Balance:</strong> {selectedMember.currentCredit.toLocaleString('en-PH', { style: 'currency', currency: 'PHP' })}</p>
              <p><strong>Credit Limit:</strong> {selectedMember.creditLimit.toLocaleString('en-PH', { style: 'currency', currency: 'PHP' })}</p>
              <p><strong>Role:</strong> {selectedMember.roleName || 'No Role Assigned'}</p>
              
              <PurchaseHistory memberId={selectedMember.id} />
            </div>
          )}
          <DialogFooter className="mt-6">
            <Button variant="outline" onClick={() => setIsViewMemberModalOpen(false)}>Close</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Modal */}
      <Dialog open={isDeleteConfirmOpen} onOpenChange={setIsDeleteConfirmOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirm Deletion</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete member "{selectedMember?.name}" (ID: {selectedMember?.memberID})?
              This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDeleteConfirmOpen(false)}>Cancel</Button>
            <Button variant="destructive" onClick={confirmDelete}>Delete Member</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Account Issue Notification */}
      {accountIssueMessage && (
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0 }}
          className={`mb-4 p-4 rounded-md ${
            accountIssueMessage.type === 'success' 
              ? 'bg-green-50 border border-green-200 text-green-800' 
              : 'bg-red-50 border border-red-200 text-red-800'
          }`}
        >
          <div className="flex items-center">
            {accountIssueMessage.type === 'success' ? (
              <CheckCircle2 className="h-5 w-5 mr-2 text-green-500" />
            ) : (
              <AlertCircle className="h-5 w-5 mr-2 text-red-500" />
            )}
            <p>{accountIssueMessage.text}</p>
          </div>
        </motion.div>
      )}

    </div>
  )
}
