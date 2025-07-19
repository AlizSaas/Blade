"use client"

import type React from "react"
import { useState } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Progress } from "@/components/ui/progress"
import { Bike, Upload, X, ImageIcon, Loader2, ArrowLeft, Send, AlertCircle, CheckCircle, User } from "lucide-react"
import { toast } from "sonner"
import useMediaUpload from "@/hooks/index"
import { createBikeRequest } from "@/lib/actions/buyer"
import Link from "next/link"

// Form validation schema
const bikeRequestSchema = z.object({
  sellerId: z.string().min(1, "Please select a seller"),
  bikeModel: z.string().min(1, "Bike model is required").max(100, "Bike model must be less than 100 characters"),
  reason: z
    .string()
    .min(10, "Please provide a detailed reason (at least 10 characters)")
    .max(500, "Reason must be less than 500 characters"),
  url: z.string().optional(), // Optional for image URL
})

type BikeRequestFormValues = z.infer<typeof bikeRequestSchema>

export default function NewRequestPage({ sellers }: { sellers: { id: string; name: string; email: string; company: string }[] }) {
  const router = useRouter()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const {
    startUpload,
    attachments,
    isUploading,
    uploadProgress,
    removeAttachment,
    reset: resetUpload,
    getUploadedImageUrl,
    hasUploadedImages,
  } = useMediaUpload()

  const form = useForm<BikeRequestFormValues>({
    resolver: zodResolver(bikeRequestSchema),
    defaultValues: {
      sellerId: "",
      bikeModel: "",
      reason: "",
    },
  })

  const handleImageUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files || [])
    if (files.length > 0) {
      startUpload(files)
    }
    // Reset the input value so the same file can be uploaded again if needed
    event.target.value = "" // Clear the input value
  }

  const onSubmit = async (data: BikeRequestFormValues) => {
    if (attachments.some((a) => a.isUploading)) {
      toast.error("Please wait for all images to finish uploading")
      return
    }

    setIsSubmitting(true)
    setError(null)

    try {
      // Get the uploaded image URL
      const imageUrl = getUploadedImageUrl() || ""

      const result = await createBikeRequest({
        sellerId: data.sellerId,
        bikeModel: data.bikeModel,
        reason: data.reason,
        url: imageUrl,
      })

      if (result.success) {
        toast.success("Bike request submitted successfully!")
        resetUpload()
        router.push("/buyer")
      } else {
        setError(result.error || "Failed to submit request")
      }
    } catch (error) {
      console.error("Error submitting request:", error)
      setError("An unexpected error occurred")
    } finally {
      setIsSubmitting(false)
    }
  }

  const selectedSeller = sellers.find((s) => s.id === form.watch("sellerId")) // Find the selected seller

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-4 mb-4">
            <Link href="/buyer">
              <Button variant="ghost" size="sm">
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back to Dashboard
              </Button>
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
          {/* Main Form */}
          <div className="lg:col-span-2">
            <Card>
              <CardHeader>
                <CardTitle>Request Details</CardTitle>
                <CardDescription>Fill out the form below to submit your bike request</CardDescription>
              </CardHeader>
              <CardContent>
                <Form {...form}>
                  <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                    {/* Seller Selection */}
                    <FormField
                      control={form.control}
                      name="sellerId"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Select Seller *</FormLabel>
                          <Select onValueChange={field.onChange} defaultValue={field.value}>
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Choose a seller to request from" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              {sellers.map((seller) => (
                                <SelectItem key={seller.id} value={seller.id}>
                                  <div className="flex items-center gap-2">
                                    <User className="w-4 h-4" />
                                    <div>
                                      <div className="font-medium">{seller.name}</div>
                                      <div className="text-sm text-gray-500">{seller.company}</div>
                                    </div>
                                  </div>
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <FormDescription>Select the seller you want to request a bike from</FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    {/* Bike Model */}
                    <FormField
                      control={form.control}
                      name="bikeModel"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Bike Model *</FormLabel>
                          <FormControl>
                            <Input
                              {...field}
                              placeholder="e.g., Trek Mountain Bike X1, Specialized Road Bike Pro"
                              className="bg-white"
                            />
                          </FormControl>
                          <FormDescription>Specify the exact bike model you&apos;re interested in</FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    {/* Reason */}
                    <FormField
                      control={form.control}
                      name="reason"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Reason for Request *</FormLabel>
                          <FormControl>
                            <Textarea
                              {...field}
                              placeholder="Please explain why you need this bike and how you plan to use it..."
                              rows={4}
                              className="bg-white resize-none"
                            />
                          </FormControl>
                          <FormDescription>
                            Provide a detailed explanation to help the seller understand your needs (
                            {field.value?.length || 0}/500 characters)
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    {/* Image Upload */}
                    <div className="space-y-4">
                      <Label>Bike Image (Optional)</Label>
                      <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-gray-400 transition-colors">
                        <input
                          type="file"
                          accept="image/jpeg,image/png,image/webp"
                          onChange={handleImageUpload}
                          className="hidden"
                          id="image-upload"
                          disabled={isUploading || attachments.length >= 1}
                        />
                        <label
                          htmlFor="image-upload"
                          className={`cursor-pointer ${isUploading || attachments.length >= 1 ? "cursor-not-allowed opacity-50" : ""}`}
                        >
                          <Upload className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                          <p className="text-sm text-gray-600">
                            {attachments.length >= 1 ? "Image uploaded" : "Click to upload bike image"}
                          </p>
                          <p className="text-xs text-gray-500 mt-1">JPEG, PNG, WebP up to 512KB</p>
                        </label>
                      </div>

                      {/* Upload Progress */}
                      {isUploading && uploadProgress !== undefined && (
                        <div className="space-y-2">
                          <div className="flex items-center justify-between text-sm">
                            <span className="text-gray-600">Uploading...</span>
                            <span className="text-gray-600">{Math.round(uploadProgress)}%</span>
                          </div>
                          <Progress value={uploadProgress} className="h-2" />
                        </div>
                      )}

                      {/* Uploaded Images */}
                      {attachments.length > 0 && (
                        <div className="space-y-2">
                          {attachments.map((attachment) => (
                            <div
                              key={attachment.file.name}
                              className="flex items-center justify-between p-3 bg-gray-50 rounded-lg border"
                            >
                              <div className="flex items-center gap-3">
                                <ImageIcon className="w-5 h-5 text-gray-400" />
                                <div>
                                  <p className="text-sm font-medium text-gray-900">{attachment.file.name}</p>
                                  <p className="text-xs text-gray-500">
                                    {(attachment.file.size / 1024 / 1024).toFixed(2)} MB
                                  </p>
                                </div>
                              </div>
                              <div className="flex items-center gap-2">
                                {attachment.isUploading ? (
                                  <Loader2 className="w-4 h-4 animate-spin text-blue-600" />
                                ) : (
                                  <CheckCircle className="w-4 h-4 text-green-600" />
                                )}
                                <Button
                                  type="button"
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => removeAttachment(attachment.file.name)}
                                  disabled={attachment.isUploading}
                                >
                                  <X className="w-4 h-4" />
                                </Button>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}

                      {/* Show uploaded image preview */}
                      {hasUploadedImages() && (
                        <div className="mt-4">
                          <Label className="text-sm font-medium">Preview:</Label>
                          <div className="mt-2 border rounded-lg p-2 bg-gray-50">
                            <img 
                              src={getUploadedImageUrl()} 
                              alt="Uploaded bike" 
                              className="max-w-full h-32 object-cover rounded"
                            />
                          </div>
                        </div>
                      )}
                    </div>

                    {error && (
                      <Alert variant="destructive">
                        <AlertCircle className="h-4 w-4" />
                        <AlertDescription>{error}</AlertDescription>
                      </Alert>
                    )}

                    {/* Submit Button */}
                    <Button
                      type="submit"
                      className="w-full bg-blue-600 hover:bg-blue-700"
                      disabled={isSubmitting || isUploading}
                    >
                      {isSubmitting ? (
                        <>
                          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                          Submitting Request...
                        </>
                      ) : (
                        <>
                          <Send className="w-4 h-4 mr-2" />
                          Submit Request
                        </>
                      )}
                    </Button>
                  </form>
                </Form>
              </CardContent>
            </Card>
          </div>

          {/* Sidebar - keeping the same */}
          <div className="space-y-6">
            {/* Selected Seller Info */}
            {selectedSeller && (
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
                      <div>
                        <p className="font-medium text-gray-900">{selectedSeller.name}</p>
                        <p className="text-sm text-gray-500">{selectedSeller.email}</p>
                      </div>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-700">Company</p>
                      <p className="text-sm text-gray-600">{selectedSeller.company}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Request Guidelines */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Request Guidelines</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3 text-sm">
                  <div className="flex items-start gap-2">
                    <CheckCircle className="w-4 h-4 text-green-600 mt-0.5 flex-shrink-0" />
                    <p>Be specific about the bike model you need</p>
                  </div>
                  <div className="flex items-start gap-2">
                    <CheckCircle className="w-4 h-4 text-green-600 mt-0.5 flex-shrink-0" />
                    <p>Provide a clear reason for your request</p>
                  </div>
                  <div className="flex items-start gap-2">
                    <CheckCircle className="w-4 h-4 text-green-600 mt-0.5 flex-shrink-0" />
                    <p>Include an image if you have a specific bike in mind</p>
                  </div>
                  <div className="flex items-start gap-2">
                    <CheckCircle className="w-4 h-4 text-green-600 mt-0.5 flex-shrink-0" />
                    <p>Wait for seller approval before proceeding</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Status Info */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">What Happens Next?</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center gap-3">
                    <div className="w-6 h-6 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center text-xs font-medium">
                      1
                    </div>
                    <p className="text-sm">Your request will be sent to the seller</p>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="w-6 h-6 bg-gray-100 text-gray-400 rounded-full flex items-center justify-center text-xs font-medium">
                      2
                    </div>
                    <p className="text-sm text-gray-500">Seller reviews your request</p>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="w-6 h-6 bg-gray-100 text-gray-400 rounded-full flex items-center justify-center text-xs font-medium">
                      3
                    </div>
                    <p className="text-sm text-gray-500">You&apos;ll receive approval or feedback</p>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="w-6 h-6 bg-gray-100 text-gray-400 rounded-full flex items-center justify-center text-xs font-medium">
                      4
                    </div>
                    <p className="text-sm text-gray-500">Contact seller if approved</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  )
}