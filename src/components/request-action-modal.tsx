"use client"

import { useState, useTransition } from "react"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent } from "@/components/ui/card"
import { CheckCircle, XCircle, User, Bike, Calendar, MessageSquare, Loader2 } from "lucide-react"
import { toast } from "sonner"
import { useQueryClient } from "@tanstack/react-query"
import updateRequestBikeStatus from "@/lib/actions/seller"
import type {  IndividualBikeRequest, } from "@/lib/types"
import Image from "next/image"

interface RequestActionModalProps {
  request: IndividualBikeRequest 
  actionType: "approve" | "reject",
  isOpen: boolean
  onClose: () => void
}

export default function RequestActionModal({ request, actionType, isOpen, onClose }: RequestActionModalProps) {
  const [reason, setReason] = useState("")
  const [isPending, startTransition] = useTransition()
  const queryClient = useQueryClient()

  const handleSubmit = () => {
    if (!reason.trim()) {
      toast.error("Please provide a reason for your decision")
      return
    }

    startTransition(async () => {
      try {
        const result = await updateRequestBikeStatus({
          requestId: request?.id,
          status: actionType === "approve" ? "APPROVED" : "REJECTED",
          notes: reason.trim(), // This will be sent to the buyer
        })

        if (result.error) {
          toast.error(result.error)
          return
        }

        if (result.success) {
          toast.success(result.message)
          // Invalidate and refetch the requests data
          queryClient.invalidateQueries({ queryKey: ["seller-requests"] })
          onClose()
        }
      } catch (error) {
        console.error(`Error ${actionType}ing request:`, error)
        toast.error(`Failed to ${actionType} request. Please try again.`)
      }
    })
  }

  const isApprove = actionType === "approve" // Determine if the action is approve or reject

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader className="space-y-3">
          <DialogTitle className="flex items-center gap-2 text-lg">
            {isApprove ? (
              <CheckCircle className="w-5 h-5 text-green-600" />
            ) : (
              <XCircle className="w-5 h-5 text-red-600" />
            )}
            {isApprove ? "Approve" : "Reject"} Bike Request
          </DialogTitle>
          <DialogDescription className="text-sm">
            {isApprove
              ? "You are about to approve this bike request. Please provide a reason or additional instructions."
              : "You are about to reject this bike request. Please provide a clear reason for the rejection."}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Request Details Card */}
          <Card className="border-gray-200">
            <CardContent className="p-4 space-y-4">
              {/* Buyer Info */}
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center">
                  <User className="w-4 h-4 text-gray-600" />
                </div>
                <div>
                  <p className="font-medium text-sm">
                    {request.buyer.firstname} {request.buyer.lastname || ""}
                  </p>
                  <p className="text-xs text-gray-500">{request.buyer.email}</p>
                </div>
              </div> 

              {/* Bike Model */}
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                  <Bike className="w-4 h-4 text-blue-600" />
                </div>
                <div>
                  <p className="font-medium text-sm">{request.bikeModel}</p>
                  <p className="text-xs text-gray-500">Requested bike model</p>
                </div>
              </div>

              {/* Date and Status */}
              <div className="flex items-center justify-between pt-2 border-t border-gray-100">
                <div className="flex items-center gap-2">
                  <Calendar className="w-4 h-4 text-gray-400" />
                  <span className="text-xs text-gray-600">{new Date(request.createdAt).toLocaleDateString()}</span>
                </div>
                <Badge variant="outline" className="text-yellow-600 border-yellow-600 text-xs">
                  {request.status}
                </Badge>
              </div>

              {/* Buyer's Reason */}
              <div className="pt-2 border-t border-gray-100">
                <div className="flex items-start gap-2">
                  <MessageSquare className="w-4 h-4 text-gray-400 mt-0.5" />
                  <div className="flex-1">
                    <p className="font-medium text-xs text-gray-700 mb-1">Buyer&apos;s Reason:</p>
                    <p className="text-xs text-gray-600 bg-gray-50 p-2 rounded text-wrap break-words">
                      {request.reason}
                    </p>
                  </div>
                </div>
              </div>

              {/* Show bike image if available */}
              {request.url && (
                <div className="pt-2 border-t border-gray-100">
                  <p className="font-medium text-xs text-gray-700 mb-2">Attached Image:</p>
                  <div className="flex justify-center">
                    <div className="relative w-full max-w-xs">
                      <Image
                        src={request.url || "/placeholder.svg"}
                        width={300}
                        height={200}
                        alt="Bike request"
                        className="w-full h-auto object-cover rounded-lg border border-gray-200 shadow-sm"
                        priority={false}
                        quality={85}
                      />
                    </div>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Reason Input */}
          <div className="space-y-2">
            <Label htmlFor="reason" className="text-sm font-medium">
              {isApprove ? "Approval Message" : "Rejection Reason"} *
            </Label>
            <Textarea
              id="reason"
              placeholder={
                isApprove
                  ? "Provide instructions for pickup, contact details, or any additional information..."
                  : "Explain why this request is being rejected (e.g., bike not available, requirements not met, etc.)..."
              }
              value={reason}
              onChange={(e) => setReason(e.target.value)} // Update reason state
              rows={3} // Adjust rows as needed
              className="resize-none text-sm"
              disabled={isPending}
            />
            <p className="text-xs text-gray-500">This message will be sent to the buyer along with your decision.</p>
          </div>
        </div>

        <DialogFooter className="gap-2 pt-4">
          <Button variant="outline" onClick={onClose} disabled={isPending} size="sm">
            Cancel
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={isPending || !reason.trim()}
            className={isApprove ? "bg-green-600 hover:bg-green-700" : "bg-red-600 hover:bg-red-700"}
            size="sm"
          >
            {isPending ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                {isApprove ? "Approving..." : "Rejecting..."}
              </>
            ) : (
              <>
                {isApprove ? <CheckCircle className="w-4 h-4 mr-2" /> : <XCircle className="w-4 h-4 mr-2" />}
                {isApprove ? "Approve Request" : "Reject Request"}
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
