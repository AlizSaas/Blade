"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"

import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import {
  
  Clock,

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

export default function BikeRequestSingle({request}: BikeRequestDetailPageProps) {






       


  


  const getStatusColor = (status: string) => {
    switch (status) {
      case "PENDING":
        return "border-l-yellow-500 bg-yellow-50"
      case "APPROVED":
        return "border-l-green-500 bg-green-50"
      case "REJECTED":
        return "border-l-red-500 bg-red-50"
      default:
        return "border-l-gray-500 bg-gray-50"
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

  // if (isPending) {
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

  

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-6">
          <Link href="/buyer">
            <Button variant="ghost" className="mb-4">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Dashboard
            </Button>
          </Link>
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Bike Request Details</h1>
              <p className="text-gray-600 mt-1">Request ID: {request.id}</p>
            </div>
          
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6"> {/* Main Content and Sidebar */}
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
                  <label className="text-sm font-medium text-gray-700">Bike Model</label>
                  <p className="text-lg font-semibold text-gray-900">{request.bikeModel}</p>
                </div>
                <Separator />
                <div>
                  <label className="text-sm font-medium text-gray-700">Reason for Request</label>
                  <p className="text-gray-900 mt-1 leading-relaxed">{request.reason}</p>
                  <br />
                  <label className="text-sm font-medium text-gray-700 mt-2">Additional Notes from seller</label>
                  <p className="text-gray-900 mt-1 leading-relaxed">{request.notes}</p>
                  
                </div>
                <Separator />
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium text-gray-700">Request Date</label>
                    <p className="text-gray-900 flex items-center gap-2 mt-1">
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
                    <label className="text-sm font-medium text-gray-700">Last Updated</label>
                    <p className="text-gray-900 flex items-center gap-2 mt-1">
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
                        className="w-full h-auto object-cover rounded-lg border border-gray-200 shadow-sm"
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
                    <AvatarFallback className="bg-blue-100 text-blue-600">
                      {request.buyer.firstname.charAt(0)}
                      {request.buyer.lastname?.charAt(0) || ""}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <p className="font-semibold text-gray-900">
                      {request.buyer.firstname} {request.buyer.lastname}
                    </p>
                    <p className="text-sm text-gray-500 capitalize">{request.buyer.role.toLowerCase()}</p>
                  </div>
                </div>
                <Separator />
                <div className="space-y-3">
                  <div className="flex items-center gap-2 text-sm">
                    <Mail className="w-4 h-4 text-gray-400" />
                    <span className="text-gray-600">Email:</span>
                    <a href={`mailto:${request.buyer.email}`} className="text-blue-600 hover:underline">
                      {request.buyer.email}
                    </a>
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <Building2 className="w-4 h-4 text-gray-400" />
                    <span className="text-gray-600 ">Company: {request.buyer.company.name}</span>
             
                    
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <Calendar className="w-4 h-4 text-gray-400" />
                    <span className="text-gray-600">Member since:</span>
                    <span className="text-gray-900">{new Date(request.buyer.createdAt).toLocaleDateString()}</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Request Actions */}
            

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
                      <p className="text-gray-500">
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
                        <p className="text-gray-500">
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

       
      </div>
    </div>
  )
}
