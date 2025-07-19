"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { toast } from "sonner"
import { CheckIcon, CopyIcon, PlusIcon, RefreshCwIcon, Code2, Trash2, Loader2 } from "lucide-react"

import { useInfiniteQuery,   } from "@tanstack/react-query"
import kyInstance from "@/lib/ky"
import type { CodesResponse } from "@/lib/types"
import InfiniteScrollContainer from "@/components/infinite-scroll-container"
import { useDeleteCodeMutation, useGenerateCodeMutation } from "@/lib/actions/mutation"
import InvitationCodesSkeleton from "./invitation-code-skeleton"



export default function InvitationCodesModal() {

    
  
  const [isOpen, setIsOpen] = useState(false)
  const [copied, setCopied] = useState<Record<string, boolean>>({})

  const { data, fetchNextPage, hasNextPage, isFetchingNextPage, isPending, error, } = useInfiniteQuery({
    queryKey: ["invitation-codes", ],
    
    queryFn: ({ pageParam }) =>
      kyInstance
        .get(`/api/saller/generate`, pageParam ? { searchParams: { cursor: pageParam } } : {})
        .json<CodesResponse>(),
    initialPageParam:null as string | null,
    getNextPageParam: (lastPage) => lastPage.nextCursor,
   
  })

  const codes = data?.pages.flatMap((page) => page.codes) || []

  // Generate code mutation


  // Delete code mutation
const deleteCodeMutation = useDeleteCodeMutation()
const generateCodeMutation = useGenerateCodeMutation()

  const handleGenerateCode = () => {
    generateCodeMutation.mutate()
  }

  const handleDeleteCode = (codeId: string) => {
    deleteCodeMutation.mutate(codeId) // Call the mutation to delete the code
  }

  const copyToClipboard = async (code: string) => {
    try {
      await navigator.clipboard.writeText(code)
      setCopied({ ...copied, [code]: true })
      toast.success("Code copied to clipboard!")

      setTimeout(() => {
        setCopied((prev) => ({ ...prev, [code]: false }))
      }, 2000)
    } catch (error) {
        console.error("Failed to copy code:", error)
      toast.error("Failed to copy code")
    }
  }

  const activeCodes = codes.filter((code) => !code.used)
  const usedCodes = codes.filter((code) => code.used)

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button className="bg-blue-600 hover:bg-blue-700">
          <Code2 className="w-4 h-4 mr-2" />
          Manage Invitation Codes
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Code2 className="w-5 h-5" />
            Invitation Codes Management
          </DialogTitle>
          <DialogDescription>
            Generate and manage invitation codes for your employees to join your company.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {error && (
            <Alert variant="destructive">
              <AlertDescription>
                {error instanceof Error ? error.message : "An error occurred while loading codes"}
              </AlertDescription>
            </Alert>
          )}

          {/* Generate Button */}
          <div className="flex justify-between items-center">
            <div>
              <h3 className="text-lg font-semibold">Generate New Code</h3>
              <p className="text-sm text-gray-600">Create a new invitation code for employees</p>
            </div>
            <Button onClick={handleGenerateCode} disabled={generateCodeMutation.isPending}>
              {generateCodeMutation.isPending ? (
                <>
                  <RefreshCwIcon className="mr-2 h-4 w-4 animate-spin" />
                  Generating...
                </>
              ) : (
                <>
                  <PlusIcon className="mr-2 h-4 w-4" />
                  Generate Code
                </>
              )}
            </Button>
          </div>

          {isPending ? (
            <InvitationCodesSkeleton />
          ) : (
            <InfiniteScrollContainer
              className="space-y-6"
              onBottomReached={() => hasNextPage && !isFetchingNextPage && fetchNextPage()}
            >
              {/* Active Codes */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Active Codes ({activeCodes.length})</CardTitle>
                  <CardDescription>Codes that can be used to join your company</CardDescription>
                </CardHeader>
                <CardContent>
                  {activeCodes.length > 0 ? (
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Code</TableHead>
                          <TableHead>Created</TableHead>
                          <TableHead>Status</TableHead>
                          <TableHead className="text-right">Actions</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {activeCodes.map((code) => (
                          <TableRow key={code.id}>
                            <TableCell className="font-mono text-lg font-semibold">{code.code}</TableCell>
                            <TableCell className="text-sm text-gray-500">
                              {new Date(code.createdAt).toLocaleDateString()}
                            </TableCell>
                            <TableCell>
                              <Badge className="bg-green-500 hover:bg-green-600 text-white">Active</Badge>
                            </TableCell>
                            <TableCell className="text-right">
                              <div className="flex justify-end gap-2">
                                <Button variant="ghost" size="sm" onClick={() => copyToClipboard(code.code)}>
                                  {copied[code.code] ? (
                                    <CheckIcon className="h-4 w-4 text-green-600" />
                                  ) : (
                                    <CopyIcon className="h-4 w-4" />
                                  )}
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => handleDeleteCode(code.id)}
                                  disabled={deleteCodeMutation.isPending}
                                  className="text-red-600 hover:text-red-700 hover:bg-red-50"
                                >
                                  {deleteCodeMutation.isPending && deleteCodeMutation.variables === code.id ? (
                                    <RefreshCwIcon className="h-4 w-4 animate-spin" />
                                  ) : (
                                    <Trash2 className="h-4 w-4" />
                                  )}
                                </Button>
                              </div>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  ) : (
                    <div className="text-center py-8">
                      <Code2 className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                      <p className="text-gray-500">No active codes available</p>
                      <p className="text-sm text-gray-400">Generate a new code to get started</p>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Used Codes */}
              {usedCodes.length > 0 && (
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Used Codes ({usedCodes.length})</CardTitle>
                    <CardDescription>Codes that have already been used</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Code</TableHead>
                          <TableHead>Created</TableHead>
                          <TableHead>Status</TableHead>
                          <TableHead className="text-right">Actions</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {usedCodes.map((code) => (
                          <TableRow key={code.id} className="opacity-60">
                            <TableCell className="font-mono text-lg">{code.code}</TableCell>
                            <TableCell className="text-sm text-gray-500">
                              {new Date(code.createdAt).toLocaleDateString()}
                            </TableCell>
                            <TableCell>
                              <Badge variant="secondary">Used</Badge>
                            </TableCell>
                            <TableCell className="text-right">
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleDeleteCode(code.id)}
                                disabled={deleteCodeMutation.isPending}
                                className="text-red-600 hover:text-red-700 hover:bg-red-50"
                              >
                                {deleteCodeMutation.isPending && deleteCodeMutation.variables === code.id ? (
                                  <RefreshCwIcon className="h-4 w-4 animate-spin" />
                                ) : (
                                  <Trash2 className="h-4 w-4" />
                                )}
                              </Button>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </CardContent>
                </Card>
              )}

              {/* Loading indicator for infinite scroll */}
              {isFetchingNextPage && (
                <div className="flex justify-center py-4">
                  <Loader2 className="h-6 w-6 animate-spin text-gray-400" />
                </div>
              )}
            </InfiniteScrollContainer>
          )}

          {/* Instructions */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">How to Use Invitation Codes</CardTitle>
              <CardDescription>Instructions for sharing codes with employees</CardDescription>
            </CardHeader>
            <CardContent>
              <ol className="list-decimal pl-5 space-y-2 text-sm">
                <li>Click &quot;Generate Code&quot; to create a new 6-digit invitation code</li>
                <li>Copy the code using the copy button next to it</li>
                <li>Share the code with your employee via email, message, or in person</li>
                <li>The employee will use this code during their onboarding process</li>
                <li>Once used, the code will be marked as &quot;Used&quot; and cannot be reused</li>
                <li>You can delete unused codes if they&apos;re no longer needed</li>
              </ol>
            </CardContent>
          </Card>
        </div>
      </DialogContent>
    </Dialog>
  )
}
