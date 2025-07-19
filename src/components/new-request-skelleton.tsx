import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import { Bike, ArrowLeft, User, CheckCircle } from "lucide-react"
import Link from "next/link"

export default function NewRequestSkeleton() {
  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-4 mb-4">
            <Link href="/buyer">
              <div className="flex items-center gap-2 px-3 py-2 rounded-md">
                <ArrowLeft className="w-4 h-4" />
                <span className="text-sm">Back to Dashboard</span>
              </div>
            </Link>
          </div>
          <div className="flex items-center gap-3">
            <Bike className="w-8 h-8 text-blue-600" />
            <div>
              <h1 className="text-3xl font-bold text-gray-900">New Bike Request</h1>
              <p className="text-gray-600 mt-1">Submit a request to get approval for a bike</p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Form Skeleton */}
          <div className="lg:col-span-2">
            <Card>
              <CardHeader>
                <CardTitle>Request Details</CardTitle>
                <CardDescription>Fill out the form below to submit your bike request</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-6">
                  {/* Seller Selection Skeleton */}
                  <div className="space-y-2">
                    <Skeleton className="h-4 w-24" />
                    <Skeleton className="h-10 w-full" />
                    <Skeleton className="h-3 w-64" />
                  </div>

                  {/* Bike Model Skeleton */}
                  <div className="space-y-2">
                    <Skeleton className="h-4 w-20" />
                    <Skeleton className="h-10 w-full" />
                    <Skeleton className="h-3 w-72" />
                  </div>

                  {/* Reason Skeleton */}
                  <div className="space-y-2">
                    <Skeleton className="h-4 w-32" />
                    <Skeleton className="h-24 w-full" />
                    <Skeleton className="h-3 w-80" />
                  </div>

                  {/* Image Upload Skeleton */}
                  <div className="space-y-4">
                    <Skeleton className="h-4 w-32" />
                    <div className="border-2 border-dashed border-gray-300 rounded-lg p-6">
                      <div className="text-center space-y-2">
                        <Skeleton className="w-8 h-8 mx-auto" />
                        <Skeleton className="h-4 w-48 mx-auto" />
                        <Skeleton className="h-3 w-40 mx-auto" />
                      </div>
                    </div>
                  </div>

                  {/* Submit Button Skeleton */}
                  <Skeleton className="h-10 w-full" />
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Sidebar Skeleton */}
          <div className="space-y-6">
            {/* Selected Seller Info Skeleton */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Selected Seller</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                      <User className="w-5 h-5 text-blue-600" />
                    </div>
                    <div className="flex-1 space-y-1">
                      <Skeleton className="h-4 w-32" />
                      <Skeleton className="h-3 w-40" />
                    </div>
                  </div>
                  <div className="space-y-1">
                    <Skeleton className="h-3 w-16" />
                    <Skeleton className="h-3 w-24" />
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Request Guidelines Skeleton */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Request Guidelines</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {[1, 2, 3, 4].map((item) => (
                    <div key={item} className="flex items-start gap-2">
                      <CheckCircle className="w-4 h-4 text-green-600 mt-0.5 flex-shrink-0" />
                      <Skeleton className="h-4 flex-1" />
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* What Happens Next Skeleton */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">What Happens Next?</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {[1, 2, 3, 4].map((step) => (
                    <div key={step} className="flex items-center gap-3">
                      <div
                        className={`w-6 h-6 ${step === 1 ? "bg-blue-100 text-blue-600" : "bg-gray-100 text-gray-400"} rounded-full flex items-center justify-center text-xs font-medium`}
                      >
                        {step}
                      </div>
                      <Skeleton className="h-4 flex-1" />
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  )
}
