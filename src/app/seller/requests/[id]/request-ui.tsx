"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import {
  CheckCircle,
  Clock,
  XCircle,
  Bike,
  User,
  Calendar,
  Mail,
  ArrowLeft,
 
  Building2,
} from "lucide-react"


import type {  BikeRequestWithRelations,} from "@/lib/types"

import Link from "next/link"
import Image from "next/image"


type BikeRequestDetailPageProps = {
  request:BikeRequestWithRelations 
    }

export default function BikeRequestDetailPage({ request }: BikeRequestDetailPageProps) {




  

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "PENDING":
        return (
          <Badge variant="outline" className="border-amber-300 bg-amber-50 text-amber-700 dark:border-amber-700 dark:bg-amber-500/10 dark:text-amber-300">
            <Clock className="w-4 h-4 mr-2" />
            Pending Review
          </Badge>
        )
      case "APPROVED":
        return (
          <Badge variant="outline" className="border-emerald-300 bg-emerald-50 text-emerald-700 dark:border-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-300">
            <CheckCircle className="w-4 h-4 mr-2" />
            Approved
          </Badge>
        )
      case "REJECTED":
        return (
          <Badge variant="outline" className="border-rose-300 bg-rose-50 text-rose-700 dark:border-rose-700 dark:bg-rose-500/10 dark:text-rose-300">
            <XCircle className="w-4 h-4 mr-2" />
            Rejected
          </Badge>
        )
      default:
        return <Badge variant="outline">{status}</Badge>
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case "PENDING":
        return "border-l-amber-500 bg-amber-50/80 dark:bg-amber-500/10"
      case "APPROVED":
        return "border-l-emerald-500 bg-emerald-50/80 dark:bg-emerald-500/10"
      case "REJECTED":
        return "border-l-rose-500 bg-rose-50/80 dark:bg-rose-500/10"
      default:
        return "border-l-border bg-muted/40"
    }
  }

  // if (error) {
  //   return (
  //     <div className="min-h-screen bg-gray-50 p-6">
  //       <div className="max-w-4xl mx-auto">
  //         <Card className="border-red-200">
  //           <CardContent className="flex items-center justify-center py-12">
  //             <div className="text-center">
  //               <AlertTriangle className="w-12 h-12 text-red-500 mx-auto mb-4" />
  //               <h3 className="text-lg font-semibold text-red-900 mb-2">Request Not Found</h3>
  //               <p className="text-red-600 mb-4">
  //                 The bike request you&apos;re looking for doesn&apos;t exist or you don&apos;t have permission to view it.
  //               </p>
  //               <Link href="/seller">
  //                 <Button variant="outline">
  //                   <ArrowLeft className="w-4 h-4 mr-2" />
  //                   Back to Dashboard
  //                 </Button>
  //               </Link>
  //             </div>
  //           </CardContent>
  //         </Card>
  //       </div>
  //     </div>
  //   )
  // }

  // if (request) {
  //   return (
  //     <div className="min-h-screen bg-gray-50 p-6">
  //       <div className="max-w-4xl mx-auto">
  //         <div className="flex items-center justify-center py-12">
  //           <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
  //           <span className="ml-2 text-gray-600">Loading request details...</span>
  //         </div>
  //       </div>
  //     </div>
  //   )
  // }

  if (!request) {
    return null
  }

  return (
    <div className="min-h-screen bg-background p-6 text-foreground">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-6">
          <Link href="/seller">
            <Button variant="ghost" className="mb-4">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Dashboard
            </Button>
          </Link>
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-foreground">Bike Request Details</h1>
              <p className="mt-1 text-muted-foreground">Request ID: {request.id}</p>
            </div>
            <div className="flex items-center gap-3">
              {getStatusBadge(request.status)}
             
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Request Overview */}
            <Card className={`border-l-4 ${getStatusColor(request.status)}`}>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Bike className="w-5 h-5" />
                  Request Overview
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Bike Model</label>
                  <p className="text-lg font-semibold text-foreground">{request.bikeModel}</p>
                </div>
                <Separator />
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Reason for Request</label>
                  <p className="mt-1 leading-relaxed text-foreground">{request.reason}</p>
                  <br />
                  <label className="mt-2 text-sm font-medium text-muted-foreground">Additional Notes from seller</label>
                  <p className="mt-1 leading-relaxed text-foreground">{request.notes}</p>
                  
                </div>
                <Separator />
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">Request Date</label>
                    <p className="mt-1 flex items-center gap-2 text-foreground">
                      <Calendar className="w-4 h-4" />
                      {new Date(request.createdAt).toLocaleDateString("en-US", {
                        year: "numeric",
                        month: "long",
                        day: "numeric",
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">Last Updated</label>
                    <p className="mt-1 flex items-center gap-2 text-foreground">
                      <Clock className="w-4 h-4" />
                      {new Date(request.updatedAt).toLocaleDateString("en-US", {
                        year: "numeric",
                        month: "long",
                        day: "numeric",
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Attached Image */}
            {request.url && (
              <Card>
                <CardHeader>
                  <CardTitle>Attached Image</CardTitle>
                  <CardDescription>Image provided by the buyer</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="flex justify-center">
                    <div className="relative max-w-md w-full">
                      <Image
                        src={request.url || "/placeholder.svg"}
                        width={400}
                        height={300}
                        alt={`Bike request for ${request.bikeModel}`}
                        className="h-auto w-full rounded-lg border border-border object-cover shadow-sm"
                        quality={85}
                        priority={false}
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Buyer Information */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <User className="w-5 h-5" />
                  Buyer Information
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center gap-3">
                  <Avatar className="w-12 h-12">
                    <AvatarImage src={request.buyer.image || undefined} />
                    <AvatarFallback className="bg-blue-500/15 text-blue-600 dark:text-blue-300">
                      {request.buyer.firstname.charAt(0)}
                      {request.buyer.lastname?.charAt(0) || ""}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <p className="font-semibold text-foreground">
                      {request.buyer.firstname} {request.buyer.lastname}
                    </p>
                    <p className="text-sm capitalize text-muted-foreground">{request.buyer.role.toLowerCase()}</p>
                  </div>
                </div>
                <Separator />
                <div className="space-y-3">
                  <div className="flex items-center gap-2 text-sm">
                    <Mail className="h-4 w-4 text-muted-foreground" />
                    <span className="text-muted-foreground">Email:</span>
                    <a href={`mailto:${request.buyer.email}`} className="text-blue-600 hover:underline">
                      {request.buyer.email}
                    </a>
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <Building2 className="h-4 w-4 text-muted-foreground" />
                    <span className="text-muted-foreground">Company: {request.buyer.company.name}</span>
             
                    
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <Calendar className="h-4 w-4 text-muted-foreground" />
                    <span className="text-muted-foreground">Member since:</span>
                    <span className="text-foreground">{new Date(request.buyer.createdAt).toLocaleDateString()}</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Request Actions */}
            {/* {request.status === "PENDING" && (
              <Card>
                <CardHeader>
                  <CardTitle>Quick Actions</CardTitle>
                  <CardDescription>Respond to this request</CardDescription>
                </CardHeader>
                <CardContent className="space-y-3">
                  <Button onClick={handleApprove} className="w-full bg-green-600 hover:bg-green-700">
                    <CheckCircle className="w-4 h-4 mr-2" />
                    Approve Request
                  </Button>
                  <Button
                    onClick={handleReject}
                    variant="outline"
                    className="w-full text-red-600 border-red-600 hover:bg-red-50 bg-transparent"
                  >
                    <XCircle className="w-4 h-4 mr-2" />
                    Reject Request
                  </Button>
                </CardContent>
              </Card>
            )} */}

            {/* Request Status History */}
            <Card>
              <CardHeader>
                <CardTitle>Status History</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex items-center gap-3 text-sm">
                    <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                    <div>
                      <p className="font-medium">Request Submitted</p>
                      <p className="text-muted-foreground">
                        {new Date(request.createdAt).toLocaleDateString("en-US", {
                          month: "short",
                          day: "numeric",
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </p>
                    </div>
                  </div>
                  {request.status !== "PENDING" && (
                    <div className="flex items-center gap-3 text-sm">
                      <div
                        className={`w-2 h-2 rounded-full ${
                          request.status === "APPROVED" ? "bg-green-500" : "bg-red-500"
                        }`}
                      ></div>
                      <div>
                        <p className="font-medium">Request {request.status}</p>
                        <p className="text-muted-foreground">
                          {new Date(request.updatedAt).toLocaleDateString("en-US", {
                            month: "short",
                            day: "numeric",
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Request Action Modal
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
        )} */}
      </div>
    </div>
  )
}
