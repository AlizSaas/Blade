import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  Clock,
  CheckCircle,
  XCircle,
  Bike,
} from "lucide-react"

export default function SellerDashboardSkeleton() {
  return (
    <div className="min-h-screen bg-background p-6">
      <div className="mx-auto max-w-7xl">
        {/* Header Skeleton */}
        <div className="mb-8">
          <Skeleton className="mb-2 h-9 w-64" />
          <Skeleton className="mb-4 h-5 w-96" />

          <div className="mt-2 mb-4 flex items-center gap-4">
            <Skeleton className="h-9 w-40" />
          </div>
        </div>

        {/* Stats Cards Skeleton */}
        <div className="mb-8 grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Pending Requests
              </CardTitle>

              <Clock className="h-4 w-4 text-muted-foreground/50" />
            </CardHeader>

            <CardContent>
              <Skeleton className="mb-1 h-8 w-12" />
              <Skeleton className="h-3 w-32" />
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Approved Requests
              </CardTitle>

              <CheckCircle className="h-4 w-4 text-muted-foreground/50" />
            </CardHeader>

            <CardContent>
              <Skeleton className="mb-1 h-8 w-12" />
              <Skeleton className="h-3 w-36" />
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Rejected Requests
              </CardTitle>

              <XCircle className="h-4 w-4 text-muted-foreground/50" />
            </CardHeader>

            <CardContent>
              <Skeleton className="mb-1 h-8 w-12" />
              <Skeleton className="h-3 w-32" />
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Total Requests
              </CardTitle>

              <Bike className="h-4 w-4 text-muted-foreground/50" />
            </CardHeader>

            <CardContent>
              <Skeleton className="mb-1 h-8 w-12" />
              <Skeleton className="h-3 w-20" />
            </CardContent>
          </Card>
        </div>

        {/* Recent Requests Table Skeleton */}
        <Card>
          <CardHeader>
            <CardTitle>Recent Bike Requests</CardTitle>
            <CardDescription>
              Manage incoming requests from buyers
            </CardDescription>
          </CardHeader>

          <CardContent>
            <div className="max-h-[600px] overflow-y-auto">
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
                  {Array.from({ length: 8 }).map((_, index) => (
                    <TableRow
                      key={index}
                      className="hover:bg-muted/50"
                    >
                      {/* Buyer */}
                      <TableCell>
                        <div className="flex items-center space-x-2">
                          <Skeleton className="h-4 w-4 rounded" />

                          <div>
                            <Skeleton className="mb-1 h-4 w-32" />
                            <Skeleton className="h-3 w-40" />
                          </div>
                        </div>
                      </TableCell>

                      {/* Bike Model */}
                      <TableCell>
                        <Skeleton className="h-4 w-24" />
                      </TableCell>

                      {/* Reason */}
                      <TableCell>
                        <Skeleton className="h-4 w-48" />
                      </TableCell>

                      {/* Status */}
                      <TableCell>
                        <Skeleton className="h-6 w-20 rounded-full" />
                      </TableCell>

                      {/* Date */}
                      <TableCell>
                        <Skeleton className="h-4 w-20" />
                      </TableCell>

                      {/* Actions */}
                      <TableCell>
                        <div className="flex space-x-2">
                          <Skeleton className="h-8 w-16" />
                          <Skeleton className="h-8 w-16" />
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>

        {/* Team Management Skeleton */}
        <Card className="mt-8">
          <CardHeader>
            <CardTitle>Team Management</CardTitle>
            <CardDescription>
              Manage your team and invite new members
            </CardDescription>
          </CardHeader>

          <CardContent>
            <Skeleton className="h-10 w-40" />
          </CardContent>
        </Card>
      </div>
    </div>
  )
}