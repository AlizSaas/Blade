"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { CheckCircle, Clock, XCircle, Bike, User, Loader2, AlertTriangle, ExternalLink, ArrowRight } from "lucide-react"

import kyInstance from "@/lib/ky"
import type { BikeRequestResponse, IndividualBikeRequest } from "@/lib/types"
import { useInfiniteQuery } from "@tanstack/react-query"
import InfiniteScrollContainer from "@/components/infinite-scroll-container"
import RequestActionModal from "@/components/request-action-modal"
import { useState } from "react"
import Link from "next/link"
import SellerDashboardSkeleton from "@/components/seller-dash-skelo-ui"
// import ChatbotToggle from "@/components/chatbot-toggle"

export default function SellerDashboard() {
  const [selectedRequest, setSelectedRequest] = useState<IndividualBikeRequest | null>(null)
  const [actionType, setActionType] = useState<"approve" | "reject" | null>(null)


  const { data, fetchNextPage, hasNextPage, isFetchingNextPage, isPending, error,isFetching } = useInfiniteQuery({
    queryKey: ["seller-requests"],
    queryFn: ({ pageParam }) =>
      kyInstance
        .get("/api/saller", pageParam ? { searchParams: { cursor: pageParam } } : {})
        .json<BikeRequestResponse>(),
    initialPageParam: null as string | null,
    getNextPageParam: (lastPage) => lastPage.nextCursor,
  })

  const requests = data?.pages.flatMap((page) => page.bikeRequests) || []

  // Calculate stats from actual data
  const stats = requests.reduce(
    (acc, req) => {
      acc.totalRequests++
      if (req.status === "PENDING") acc.pendingRequests++ // Count pending requests
      else if (req.status === "APPROVED") acc.approvedRequests++ // Count approved requests
      else if (req.status === "REJECTED") acc.rejectedRequests++ // Count rejected requests
      return acc
    },
    {
      pendingRequests: 0, // Initialize pending requests count
      approvedRequests: 0, // Initialize approved requests count
      rejectedRequests: 0, // Initialize rejected requests count
      totalRequests: 0, // Initialize total requests count
    }
  )

  const handleApprove = (request: IndividualBikeRequest) => {
    setSelectedRequest(request)
    setActionType("approve")
  }

  const handleReject = (request: IndividualBikeRequest) => {
    setSelectedRequest(request)
    setActionType("reject")
  }

  const getStatusBadge = (status: "PENDING" | "APPROVED" | "REJECTED") => {
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


  if (error) {
    return (
      <div className="min-h-screen bg-background p-6">
        <div className="max-w-7xl mx-auto">
          <Card className="border-red-200 dark:border-red-800">
            <CardContent className="flex items-center justify-center py-12">
              <div className="text-center">
                <AlertTriangle className="w-12 h-12 text-red-500 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-red-900 dark:text-red-400 mb-2">Error Loading Requests</h3>
                <p className="text-red-600 dark:text-red-400 mb-4">
                  {error instanceof Error ? error.message : "An error occurred while loading requests"}
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

  if (isPending) {
    return (
      <SellerDashboardSkeleton />
    )
  }

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="max-w-7xl mx-auto"> 
        <div className="mb-4">
          <h1 className="text-3xl font-bold text-foreground">Seller Dashboard</h1>
          <p className="text-muted-foreground mt-2">Manage your bike requests and inventory</p>

          <div className="flex items-center gap-4 mb-4 mt-2">
            <Link href="/seller/customers">
              <Button variant="default" size="sm">
                VIEW ALL CUSTOMERS <ArrowRight className="w-4 h-4 mr-2" />
              </Button>
            </Link>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Pending Requests</CardTitle>
              <Clock className="h-4 w-4 text-yellow-600 dark:text-yellow-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.pendingRequests}</div>
              <p className="text-xs text-muted-foreground mt-1">Awaiting your response</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Approved Requests</CardTitle>
              <CheckCircle className="h-4 w-4 text-green-600 dark:text-green-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.approvedRequests}</div>
              <p className="text-xs text-muted-foreground mt-1">Successfully approved</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Rejected Requests</CardTitle>
              <XCircle className="h-4 w-4 text-red-600 dark:text-red-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.rejectedRequests}</div>
              <p className="text-xs text-muted-foreground mt-1">Declined requests</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Total Requests</CardTitle>
              <Bike className="h-4 w-4 text-blue-600 dark:text-blue-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.totalRequests}</div>
              <p className="text-xs text-muted-foreground mt-1">All time</p>
            </CardContent>
          </Card>
        </div>

        {/* Recent Requests Table */}
        <Card>
          <CardHeader>
            <CardTitle>Recent Bike Requests</CardTitle>
            <CardDescription>Manage incoming requests from buyers</CardDescription>
          </CardHeader>
          <CardContent>
            {requests.length === 0 ? ( // Show empty state if no requests
              <div className="text-center py-12">
                <Bike className="w-12 h-12 text-muted-foreground/50 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-foreground mb-2">No Requests Yet</h3>
                <p className="text-muted-foreground">No bike requests have been submitted yet.</p>
              </div>
            ) : (
              <InfiniteScrollContainer
                className="max-h-[600px] overflow-y-auto" // Set a max height for the scrollable area
                onBottomReached={() =>  hasNextPage && !isFetching && fetchNextPage()}
              >
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Buyer</TableHead>
                      <TableHead>Bike Model</TableHead>
                      <TableHead>Reason</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Date</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {requests.map((request) => (
                      <TableRow key={request.id} className="hover:bg-muted/50">
                        <TableCell>
                          <div className="flex items-center space-x-2">
                            <User className="h-4 w-4 text-muted-foreground" />
                            <div>
                              <div className="font-medium">
                                {request.buyer.firstname} {request.buyer.lastname || ""}
                              </div>
                              <div className="text-sm text-muted-foreground">{request.buyer.email}</div>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Link
                            href={`/seller/requests/${request.id}`}
                            className="font-medium text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 hover:underline flex items-center gap-1"
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
                        <TableCell>
                          {request.status === "PENDING" && (
                            <div className="flex space-x-2">
                              <Button
                                size="sm"
                                onClick={() => handleApprove(request)}
                                className="bg-green-600 hover:bg-green-700 dark:bg-green-700 dark:hover:bg-green-600"
                              >
                                Approve
                              </Button>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => handleReject(request)}
                                className="text-red-600 dark:text-red-400 border-red-600 dark:border-red-400 hover:bg-red-50 dark:hover:bg-red-950"
                              >
                                Reject
                              </Button>
                            </div>
                          )}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>

                {/* Loading indicator for infinite scroll */}
                {isFetchingNextPage && (
                  <div className="flex justify-center py-6">
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <Loader2 className="h-5 w-5 animate-spin" />
                      <span className="text-sm">Loading more requests...</span>
                    </div>
                  </div>
                )}
              </InfiniteScrollContainer>
            )}
          </CardContent>
        </Card>



        {selectedRequest && actionType && (
          <RequestActionModal
            request={selectedRequest}
            actionType={actionType}
            onClose={() => {
              setSelectedRequest(null)
              setActionType(null)
            }}
            isOpen={!!selectedRequest && !!actionType} // Ensure modal is open when request and action type are set
          />
        )}
      </div>

    </div>
  )
}
