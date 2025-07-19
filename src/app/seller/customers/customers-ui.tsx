"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"
import { Skeleton } from "@/components/ui/skeleton"
import { Users, Trash2, UserCheck,  Loader2, AlertTriangle, ArrowLeft } from "lucide-react"
import { toast } from "sonner"
import { useMutation, useQueryClient } from "@tanstack/react-query"
import InfiniteScrollContainer from "@/components/infinite-scroll-container"
import kyInstance from "@/lib/ky"
import type { UsersResponse } from "@/lib/types"
import { useInfiniteQuery } from "@tanstack/react-query"

import CustomersTableSkeleton from "@/components/customer-skeleton"
import InvitationCodesModal from "@/components/invitation-codes-model"
import Link from "next/link"

export default function CustomersPage() {
  const queryClient = useQueryClient()

  const { data, fetchNextPage, hasNextPage, isFetchingNextPage, isPending, error,isLoading } = useInfiniteQuery({
    queryKey: ["customers"],
    queryFn: ({ pageParam }) =>
      kyInstance
        .get("/api/saller/customers", pageParam ? { searchParams: { cursor: pageParam } } : {})
        .json<UsersResponse>(),
    initialPageParam: null as string | null,
    getNextPageParam: (lastPage) => lastPage.nextCursor,
  })

  const customers = data?.pages.flatMap((page) => page.users) || []

  // Delete customer mutation
  const deleteCustomerMutation = useMutation({
    mutationFn: async (customerId: string) => {
      await kyInstance.delete(`/api/saller/customers/${customerId}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["customers"] });
      toast.success("Customer removed successfully");
    },
    onError: (error: unknown) => {
      toast.error((error as Error)?.message || "Failed to remove customer");
    },
  });

  const handleDeleteCustomer = (customerId: string) => {
    deleteCustomerMutation.mutate(customerId);
  };


  const getInitials = (firstname: string, lastname: string | null) => {
    return `${firstname.charAt(0)}${lastname?.charAt(0) || ""}`.toUpperCase()
  } // Function to get role badge based on customer role

  const getRoleBadge = (role: string) => {
    switch (role) {
      case "BUYER":
        return (
          <Badge variant="secondary" className="text-blue-600 bg-blue-50 border-blue-200">
            <UserCheck className="w-3 h-3 mr-1" />
            Buyer
          </Badge>
        )
    
      default:
        return <Badge variant="outline">{role}</Badge>
    }
  }

  const formatDate = (date: Date) => {
    return new Intl.DateTimeFormat("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    }).format(new Date(date))
  } // Format date for display

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 p-6">
        <div className="max-w-7xl mx-auto">
          <Card className="border-red-200">
            <CardContent className="flex items-center justify-center py-12">
              <div className="text-center">
                <AlertTriangle className="w-12 h-12 text-red-500 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-red-900 mb-2">Error Loading Customers</h3>
                <p className="text-red-600 mb-4">
                  {error instanceof Error ? error.message : "An error occurred while loading customers"}
                </p>
                <Button onClick={() => window.location.reload()} variant="outline">
                  Try Again
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    )
  }
if(isLoading) {
    return (
       <CustomersTableSkeleton/>
    )
}
  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <Users className="w-8 h-8 text-blue-600" />
            <h1 className="text-3xl font-bold text-gray-900">Customer Management</h1>
          </div>
          <p className="text-gray-600">Manage your company&apos;s customers and team members</p>
           <div className="flex items-center gap-4 mb-4 mt-2">
                    <Link href="/seller">
                      <Button variant="default" size="sm">
                        <ArrowLeft className="w-4 h-4 mr-2" />
                        Back to Seller
                      </Button>
                    </Link>
                  </div>
        </div>

        {/* Stats Card */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">Total Customers</CardTitle>
              <Users className="h-4 w-4 text-blue-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{customers.length}</div>
              <p className="text-xs text-gray-500 mt-1">Active users</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">Buyers</CardTitle>
              <UserCheck className="h-4 w-4 text-green-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {customers.filter((customer) => customer.role === "BUYER").length}
              </div>
              <p className="text-xs text-gray-500 mt-1">Customer accounts</p>
            </CardContent>
          </Card>

        </div>
        <div className="mb-6">
             <InvitationCodesModal  />
        </div>
         

        {/* Customers Table */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="w-5 h-5" />
              Customer List
            </CardTitle>
            <CardDescription>View and manage all customers in your company</CardDescription>
          </CardHeader>
          <CardContent>
            {isPending ? (
              // Loading skeleton
              <div className="space-y-4">
                {Array.from({ length: 5 }).map((_, index) => (
                  <div key={index} className="flex items-center space-x-4 p-4">
                    <Skeleton className="h-10 w-10 rounded-full" />
                    <div className="space-y-2 flex-1">
                      <Skeleton className="h-4 w-48" />
                      <Skeleton className="h-3 w-32" />
                    </div>
                    <Skeleton className="h-6 w-16" />
                    <Skeleton className="h-8 w-8" />
                  </div>
                ))}
              </div>
            ) : customers.length === 0 ? (
              <div className="text-center py-12">
                <Users className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-gray-900 mb-2">No Customers Found</h3>
                <p className="text-gray-500">
                  No customers have joined your company yet. Share invitation codes to get started.
                </p>
              </div>
            ) : (
              <InfiniteScrollContainer
                className="max-h-[600px] overflow-y-auto"
                onBottomReached={() => {
                  if (hasNextPage && !isFetchingNextPage) {
                    fetchNextPage()
                  }
                }}
              >
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Customer</TableHead>
                      <TableHead>Email</TableHead>
                      <TableHead>Role</TableHead>
                      <TableHead>Joined</TableHead>
                      <TableHead>Last Updated</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {customers.map((customer) => (
                      <TableRow key={customer.id} className="hover:bg-gray-50">
                        <TableCell>
                          <div className="flex items-center space-x-3">
                            <Avatar className="h-10 w-10">
                              <AvatarImage
                                src={customer.image || undefined}
                                alt={`${customer.firstname} ${customer.lastname || ""}`}
                              />
                              <AvatarFallback className="bg-blue-100 text-blue-600 font-medium">
                                {getInitials(customer.firstname, customer.lastname)}
                              </AvatarFallback>
                            </Avatar>
                            <div>
                              <div className="font-medium text-gray-900">
                                {customer.firstname} {customer.lastname || ""}
                              </div>
                              
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="text-sm">
                            <div className="font-medium text-gray-900">{customer.email}</div>
                           
                          </div>
                        </TableCell>
                        <TableCell>{getRoleBadge(customer.role)}</TableCell>
                        <TableCell className="text-sm text-gray-500">{formatDate(customer.createdAt)}</TableCell>
                        <TableCell className="text-sm text-gray-500">{formatDate(customer.updatedAt)}</TableCell>
                        <TableCell className="text-right">
                          <AlertDialog>
                            <AlertDialogTrigger asChild>
                              <Button
                                variant="ghost"
                                size="sm"
                                className="text-red-600 hover:text-red-700 hover:bg-red-50"
                                disabled={deleteCustomerMutation.isPending}
                              >
                                {deleteCustomerMutation.isPending &&
                                deleteCustomerMutation.variables === customer.id ? (
                                  <Loader2 className="h-4 w-4 animate-spin" />
                                ) : (
                                  <Trash2 className="h-4 w-4" />
                                )}
                              </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                              <AlertDialogHeader>
                                <AlertDialogTitle className="flex items-center gap-2">
                                  <AlertTriangle className="h-5 w-5 text-red-500" />
                                  Remove Customer
                                </AlertDialogTitle>
                                <AlertDialogDescription>
                                  Are you sure you want to remove{" "}
                                  <span className="font-semibold">
                                    {customer.firstname} {customer.lastname}
                                  </span>{" "}
                                  from your company? This action cannot be undone and they will lose access to all
                                  company resources.
                                </AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel>Cancel</AlertDialogCancel>
                                <AlertDialogAction
                                  onClick={() =>
                                    handleDeleteCustomer(
                                      customer.id,
                                   
                                    )
                                  }
                                  className="bg-red-600 hover:bg-red-700"
                                >
                                  Remove Customer
                                </AlertDialogAction>
                              </AlertDialogFooter>
                            </AlertDialogContent>
                          </AlertDialog>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>

                {/* Loading indicator for infinite scroll */}
                {isFetchingNextPage && (
                  <div className="flex justify-center py-6">
                    <div className="flex items-center gap-2 text-gray-500">
                      <Loader2 className="h-5 w-5 animate-spin" />
                      <span className="text-sm">Loading more customers...</span>
                    </div>
                  </div>
                )}
              </InfiniteScrollContainer>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}