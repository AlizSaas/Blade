"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button, buttonVariants } from "@/components/ui/button"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Skeleton } from "@/components/ui/skeleton"
import { CheckCircle, Clock, XCircle, Bike, User, Plus, Loader2, AlertTriangle, ExternalLink } from "lucide-react"
import Link from "next/link"
import { useInfiniteQuery } from "@tanstack/react-query"
import kyInstance from "@/lib/ky"
import type { BikeRequestResponse } from "@/lib/types"
import InfiniteScrollContainer from "@/components/infinite-scroll-container"

export default function BuyerDashboard() {
  const { data, fetchNextPage, hasNextPage, isFetchingNextPage, isPending, error } = useInfiniteQuery({
    queryKey: ["buyer-requests"],
    queryFn: ({ pageParam }) =>
      kyInstance
        .get("/api/buyer", pageParam ? { searchParams: { cursor: pageParam } } : {})
        .json<BikeRequestResponse>(),
    initialPageParam: null as string | null,
    getNextPageParam: (lastPage) => lastPage.nextCursor,
  })

  const requests = data?.pages.flatMap((page) => page.bikeRequests) || []

  // Calculate stats from actual data
  const stats = requests.reduce(
    (acc, req) => {
      acc.totalRequests++
      if (req.status === "PENDING") acc.pendingRequests++
      else if (req.status === "APPROVED") acc.approvedRequests++
      else if (req.status === "REJECTED") acc.rejectedRequests++
      return acc
    },
    {
      pendingRequests: 0,
      approvedRequests: 0,
      rejectedRequests: 0,
      totalRequests: 0,
    }
  )

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "PENDING":
        return (
          <Badge variant="outline" className="text-yellow-600 border-yellow-600">
            <Clock className="w-3 h-3 mr-1" />
            Pending
          </Badge>
        )
      case "APPROVED":
        return (
          <Badge variant="outline" className="text-green-600 border-green-600">
            <CheckCircle className="w-3 h-3 mr-1" />
            Approved
          </Badge>
        )
      case "REJECTED":
        return (
          <Badge variant="outline" className="text-red-600 border-red-600">
            <XCircle className="w-3 h-3 mr-1" />
            Rejected
          </Badge>
        )
      default:
        return <Badge variant="outline">{status}</Badge>
    }
  }

  const getStatusDescription = (status: string) => {
    switch (status) {
      case "PENDING":
        return "Waiting for seller response"
      case "APPROVED":
        return "Request approved! Contact seller"
      case "REJECTED":
        return "Request was declined"
      default:
        return ""
    }
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 p-6">
        <div className="max-w-7xl mx-auto">
          <Card className="border-red-200">
            <CardContent className="flex items-center justify-center py-12">
              <div className="text-center">
                <AlertTriangle className="w-12 h-12 text-red-500 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-red-900 mb-2">Error Loading Requests</h3>
                <p className="text-red-600 mb-4">
                  {error instanceof Error ? error.message : "An error occurred while loading your requests"}
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

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8 flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Buyer Dashboard</h1>
            <p className="text-gray-600 mt-2">Track your bike requests and approvals</p>
          </div>
          <Link
            href="/buyer/new-request"
            className={buttonVariants({ variant: "default", className: "bg-blue-600 hover:bg-blue-700" })}
          >
            <Plus className="w-4 h-4 mr-2" />
            New Bike Request
          </Link>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">Pending Requests</CardTitle>
              <Clock className="h-4 w-4 text-yellow-600" />
            </CardHeader>
            <CardContent>
              {isPending ? (
                <Skeleton className="h-8 w-12 mb-1" />
              ) : (
                <div className="text-2xl font-bold">{stats.pendingRequests}</div>
              )}
              <p className="text-xs text-gray-500 mt-1">Awaiting seller response</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">Approved Requests</CardTitle>
              <CheckCircle className="h-4 w-4 text-green-600" />
            </CardHeader>
            <CardContent>
              {isPending ? (
                <Skeleton className="h-8 w-12 mb-1" />
              ) : (
                <div className="text-2xl font-bold">{stats.approvedRequests}</div>
              )}
              <p className="text-xs text-gray-500 mt-1">Ready to proceed</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">Rejected Requests</CardTitle>
              <XCircle className="h-4 w-4 text-red-600" />
            </CardHeader>
            <CardContent>
              {isPending ? (
                <Skeleton className="h-8 w-12 mb-1" />
              ) : (
                <div className="text-2xl font-bold">{stats.rejectedRequests}</div>
              )}
              <p className="text-xs text-gray-500 mt-1">Not approved</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">Total Requests</CardTitle>
              <Bike className="h-4 w-4 text-blue-600" />
            </CardHeader>
            <CardContent>
              {isPending ? (
                <Skeleton className="h-8 w-12 mb-1" />
              ) : (
                <div className="text-2xl font-bold">{stats.totalRequests}</div>
              )}
              <p className="text-xs text-gray-500 mt-1">All time</p>
            </CardContent>
          </Card>
        </div>

        {/* My Requests Table */}
        <Card>
          <CardHeader>
            <CardTitle>My Bike Requests</CardTitle>
            <CardDescription>Track the status of your bike requests</CardDescription>
          </CardHeader>
          <CardContent>
            {!data && isPending ? ( // Check if data is loading
              // Loading skeleton for table
              <div className="space-y-4">
                {Array.from({ length: 5 }).map((_, index) => (
                  <div key={index} className="flex items-center space-x-4 p-4">
                    <Skeleton className="h-10 w-10 rounded-full" />
                    <div className="space-y-2 flex-1">
                      <Skeleton className="h-4 w-48" />
                      <Skeleton className="h-3 w-32" />
                    </div>
                    <Skeleton className="h-6 w-16" />
                    <Skeleton className="h-4 w-24" />
                  </div>
                ))}
              </div>
            ) : requests.length === 0 ? ( // Check if there are no requests
              <div className="text-center py-12">
                <Bike className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-gray-900 mb-2">No Requests Yet</h3>
                <p className="text-gray-500 mb-4">
                  You haven&apos;t submitted any bike requests yet. Create your first request to get started.
                </p>
                <Link href="/buyer/new-request">
                  <Button className="bg-blue-600 hover:bg-blue-700">
                    <Plus className="w-4 h-4 mr-2" />
                    Create First Request
                  </Button>
                </Link>
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
                      <TableHead>Seller</TableHead>
                      <TableHead>Bike Model</TableHead>
                      <TableHead>Reason</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Date Requested</TableHead>
                      <TableHead>Notes</TableHead>
                      <TableHead>Seller Message</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {requests.map((request) => (
                      <TableRow key={request.id} className="hover:bg-gray-50">
                        <TableCell>
                          <div className="flex items-center space-x-2">
                            <User className="h-4 w-4 text-gray-400" />
                            <div className="font-medium">{request.seller.firstname}</div>
                          </div>
                        </TableCell>
                  <TableCell>
                          <Link
                            href={`/buyer/${request.id}`}
                            className="font-medium text-blue-600 hover:text-blue-800 hover:underline flex items-center gap-1"
                          >
                            {request.bikeModel}
                            <ExternalLink className="w-3 h-3" />
                          </Link>
                        </TableCell>
                        <TableCell className="max-w-xs truncate" title={request.reason}>
                          {request.reason}
                        </TableCell>
                        <TableCell>{getStatusBadge(request.status)}</TableCell>
                        <TableCell>{new Date(request.createdAt).toLocaleDateString()}</TableCell>
                        <TableCell className="text-sm text-gray-500">{getStatusDescription(request.status)}</TableCell>
                        <TableCell>
                          {request.notes?.slice(0,25) + "..."}
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
                      <span className="text-sm">Loading more requests...</span>
                    </div>
                  </div>
                )}
              </InfiniteScrollContainer>
            )}
          </CardContent>
        </Card>

        {/* Quick Actions */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-8">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Approved Requests</CardTitle>
              <CardDescription>Bikes ready for pickup or delivery</CardDescription>
            </CardHeader>
            <CardContent>
              <InfiniteScrollContainer
                className="max-h-64 overflow-y-auto space-y-3"
                onBottomReached={() => {
                  // Could implement separate pagination for approved requests if needed
                }}
              >
                {isPending ? (
                  // Loading skeleton for approved requests
                  Array.from({ length: 3 }).map((_, index) => (
                    <div key={index} className="p-3 bg-green-50 rounded-lg border border-green-200">
                      <Skeleton className="h-4 w-32 mb-2" />
                      <Skeleton className="h-3 w-24" />
                    </div>
                  ))
                ) : (
                  <>
                    {requests
                      .filter((req) => req.status === "APPROVED")
                      .slice(0, 5)
                      .map((request) => (
                        <div
                          key={request.id}
                          className="flex items-center justify-between p-3 bg-green-50 rounded-lg border border-green-200"
                        >
                          <div>
                            <div className="font-medium text-green-800">{request.bikeModel}</div>
                            <div className="text-sm text-green-600">Approved By {request.seller.firstname}</div>
                          </div>
                          <Button size="sm" className="bg-green-600 hover:bg-green-700">
                            Contact Seller
                          </Button>
                        </div>
                      ))}
                    {requests.filter((req) => req.status === "APPROVED").length === 0 && (
                      <p className="text-gray-500 text-center py-4">No approved requests yet</p>
                    )}
                  </>
                )}
              </InfiniteScrollContainer>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Pending Requests</CardTitle>
              <CardDescription>Waiting for seller response</CardDescription>
            </CardHeader>
            <CardContent>
              <InfiniteScrollContainer
                className="max-h-64 overflow-y-auto space-y-3"
                onBottomReached={() => {
                  // Could implement separate pagination for pending requests if needed
                }}
              >
                {isPending ? (
                  // Loading skeleton for pending requests
                  Array.from({ length: 3 }).map((_, index) => (
                    <div key={index} className="p-3 bg-yellow-50 rounded-lg border border-yellow-200">
                      <Skeleton className="h-4 w-32 mb-2" />
                      <Skeleton className="h-3 w-24" />
                    </div>
                  ))
                ) : (
                  <>
                    {requests
                      .filter((req) => req.status === "PENDING")
                      .slice(0, 5) // Limit to 5 for quick view
                      .map((request) => (
                        <div
                          key={request.id}
                          className="flex items-center justify-between p-3 bg-yellow-50 rounded-lg border border-yellow-200"
                        >
                          <div>
                            <div className="font-medium text-yellow-800">{request.bikeModel}</div>
                            <div className="text-sm text-yellow-600">From {request.buyer.firstname}</div>
                          </div>
                          <Badge variant="outline" className="text-yellow-600 border-yellow-600">
                            <Clock className="w-3 h-3 mr-1" />
                            Pending
                          </Badge>
                        </div>
                      ))}
                    {requests.filter((req) => req.status === "PENDING").length === 0 && (
                      <p className="text-gray-500 text-center py-4">No pending requests</p>
                    )}
                  </>
                )}
              </InfiniteScrollContainer>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
