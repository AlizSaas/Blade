import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Skeleton } from "@/components/ui/skeleton"
import { Users, UserCheck,  } from "lucide-react"

export default function CustomersTableSkeleton() {
  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header Skeleton */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <Users className="w-8 h-8 text-gray-300" />
            <Skeleton className="h-9 w-64" />
          </div>
          <Skeleton className="h-5 w-80" />
        </div>

        {/* Stats Cards Skeleton */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">Total Customers</CardTitle>
              <Users className="h-4 w-4 text-gray-300" />
            </CardHeader>
            <CardContent>
              <Skeleton className="h-8 w-12 mb-1" />
              <Skeleton className="h-3 w-20" />
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">Buyers</CardTitle>
              <UserCheck className="h-4 w-4 text-gray-300" />
            </CardHeader>
            <CardContent>
              <Skeleton className="h-8 w-8 mb-1" />
              <Skeleton className="h-3 w-24" />
            </CardContent>
          </Card>

        
        </div>

        {/* Table Skeleton */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="w-5 h-5 text-gray-300" />
              <Skeleton className="h-6 w-32" />
            </CardTitle>
            <CardDescription>
              <Skeleton className="h-4 w-64" />
            </CardDescription>
          </CardHeader>
          <CardContent>
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
                {/* Generate multiple skeleton rows */}
                {Array.from({ length: 8 }).map((_, index) => (
                  <TableRow key={index} className="hover:bg-gray-50">
                    {/* Customer Column */}
                    <TableCell>
                      <div className="flex items-center space-x-3">
                        <Skeleton className="h-10 w-10 rounded-full" />
                        <div className="space-y-2">
                          <Skeleton className="h-4 w-32" />
                          <Skeleton className="h-3 w-20" />
                        </div>
                      </div>
                    </TableCell>

                    {/* Email Column */}
                    <TableCell>
                      <div className="space-y-2">
                        <Skeleton className="h-4 w-48" />
                        <Skeleton className="h-3 w-24" />
                      </div>
                    </TableCell>

                    {/* Role Column */}
                    <TableCell>
                      <Skeleton className="h-6 w-16 rounded-full" />
                    </TableCell>

                    {/* Joined Column */}
                    <TableCell>
                      <Skeleton className="h-4 w-28" />
                    </TableCell>

                    {/* Last Updated Column */}
                    <TableCell>
                      <Skeleton className="h-4 w-28" />
                    </TableCell>

                    {/* Actions Column */}
                    <TableCell className="text-right">
                      <Skeleton className="h-8 w-8 ml-auto" />
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>

            {/* Loading indicator at bottom */}
            <div className="flex justify-center py-6 border-t">
              <div className="flex items-center gap-2 text-gray-400">
                <Skeleton className="h-5 w-5 rounded-full" />
                <Skeleton className="h-4 w-32" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
