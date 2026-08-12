import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import { Bike, ArrowLeft, User, CheckCircle } from "lucide-react"
import Link from "next/link"

export default function NewRequestSkeleton() {
  return (
    <div className="min-h-screen bg-background p-6">
      <div className="mx-auto max-w-4xl">
        {/* Header */}
        <div className="mb-8">
          <div className="mb-4 flex items-center gap-4">
            <Link
              href="/buyer"
              className="rounded-md transition-colors hover:bg-muted"
            >
              <div className="flex items-center gap-2 px-3 py-2">
                <ArrowLeft className="h-4 w-4" />
                <span className="text-sm">Back to Dashboard</span>
              </div>
            </Link>
          </div>

          <div className="flex items-center gap-3">
            <Bike className="h-8 w-8 text-primary" />

            <div>
              <h1 className="text-3xl font-bold text-foreground">
                New Bike Request
              </h1>

              <p className="mt-1 text-muted-foreground">
                Submit a request to get approval for a bike
              </p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
          {/* Main Form Skeleton */}
          <div className="lg:col-span-2">
            <Card>
              <CardHeader>
                <CardTitle>Request Details</CardTitle>
                <CardDescription>
                  Fill out the form below to submit your bike request
                </CardDescription>
              </CardHeader>

              <CardContent>
                <div className="space-y-6">
                  {/* Seller Selection */}
                  <div className="space-y-2">
                    <Skeleton className="h-4 w-24" />
                    <Skeleton className="h-10 w-full" />
                    <Skeleton className="h-3 w-64" />
                  </div>

                  {/* Bike Model */}
                  <div className="space-y-2">
                    <Skeleton className="h-4 w-20" />
                    <Skeleton className="h-10 w-full" />
                    <Skeleton className="h-3 w-72" />
                  </div>

                  {/* Reason */}
                  <div className="space-y-2">
                    <Skeleton className="h-4 w-32" />
                    <Skeleton className="h-24 w-full" />
                    <Skeleton className="h-3 w-80" />
                  </div>

                  {/* Image Upload */}
                  <div className="space-y-4">
                    <Skeleton className="h-4 w-32" />

                    <div className="rounded-lg border-2 border-dashed border-border p-6">
                      <div className="space-y-2 text-center">
                        <Skeleton className="mx-auto h-8 w-8" />
                        <Skeleton className="mx-auto h-4 w-48" />
                        <Skeleton className="mx-auto h-3 w-40" />
                      </div>
                    </div>
                  </div>

                  {/* Submit */}
                  <Skeleton className="h-10 w-full" />
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Selected Seller */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">
                  Selected Seller
                </CardTitle>
              </CardHeader>

              <CardContent>
                <div className="space-y-3">
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10">
                      <User className="h-5 w-5 text-primary" />
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

            {/* Request Guidelines */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">
                  Request Guidelines
                </CardTitle>
              </CardHeader>

              <CardContent>
                <div className="space-y-3">
                  {[1, 2, 3, 4].map((item) => (
                    <div
                      key={item}
                      className="flex items-start gap-2"
                    >
                      <CheckCircle className="mt-0.5 h-4 w-4 shrink-0 text-primary/50" />
                      <Skeleton className="h-4 flex-1" />
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* What Happens Next */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">
                  What Happens Next?
                </CardTitle>
              </CardHeader>

              <CardContent>
                <div className="space-y-4">
                  {[1, 2, 3, 4].map((step) => (
                    <div
                      key={step}
                      className="flex items-center gap-3"
                    >
                      <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-muted text-xs font-medium text-muted-foreground">
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