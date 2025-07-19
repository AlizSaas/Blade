"use client"

import { useState } from "react"
import { useForm } from "react-hook-form"

import { zodResolver } from "@hookform/resolvers/zod"
import { useUser } from "@clerk/nextjs"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import { Label } from "@/components/ui/label"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Separator } from "@/components/ui/separator"
import { useRouter } from "next/navigation"
import { RadioGroup } from "@radix-ui/react-radio-group"
import { RadioGroupItem } from "./ui/radio-group"
import { cn } from "@/lib/utils"
import { createBuyer, createSeller } from "@/lib/actions/index"
import { toast } from "sonner"
import { Building2, Users, Globe } from "lucide-react"
import { BuyerFormValues, buyerSchema, SellerFormValues, sellerSchema } from "@/lib/validation"


interface OnboardingFormProps {
  userEmail: string
  firstName: string
  lastName: string

}

const OnboardingForm = ({ userEmail, firstName, lastName }: OnboardingFormProps) => {
   
  const router = useRouter()
  const { user, isLoaded } = useUser()

  const [accountType, setAccountType] = useState<"seller" | "buyer">("buyer")
 
  const [error, setError] = useState<string | null>(null)

  const buyerForm = useForm<BuyerFormValues>({
    resolver: zodResolver(buyerSchema),
    defaultValues: {
      firstName,
      lastName: lastName || "",
      email: userEmail,
      invitationCode: "",
    },
  })

  const sellerForm = useForm<SellerFormValues>({
    resolver: zodResolver(sellerSchema),
    defaultValues: {
      firstName: firstName || "",
      lastName: lastName || "",
      email: userEmail,
      companyName: "",
      companyWebsite: "",
      companyLogo: "",
    },
  })



 const [isSubmitting, setIsSubmitting] = useState(false);

const handleSellerSubmit = async (data: SellerFormValues) => {
  if (!user) return;

  setError(null);
  setIsSubmitting(true);

  const { error, success } = await createSeller(
    data.companyName,
    data.companyWebsite,
    data.companyLogo,
    user.id
  );

  if (!success) {
    setError(error ?? "Something went wrong.");
    toast.error(error ?? "Failed to create company. Please try again.");
    setIsSubmitting(false);
    return;
  }

  toast.success("Company created successfully!");

  try {
    await user.reload(); // Reload user data to reflect changes 
  } catch (err) {
    console.error("Failed to reload user:", err);
  }

  router.push("/seller");
};

  const handleBuyerSubmit = async (data: BuyerFormValues) => {
    if (!user) {
      return
    }
  setError(null);
  setIsSubmitting(true);

  const {error,success} = await createBuyer(user.id,data.invitationCode)
  if (!success) {
    setError(error ?? "Something went wrong.");
    toast.error(error ?? "Failed to create company. Please try again.");
    setIsSubmitting(false);
    return;
  }

  toast.success("Successfully joined company!");
  try {
    await user.reload(); // Reload user data to reflect changes
  } catch (error) {
    console.error("Failed to reload user:", error);
  }
  router.push("/buyer");

    
  }

  if (!isLoaded) {
    return <div>Loading...</div>
  }

  return (
    <Card className="shadow-lg">
      <CardHeader>
        <CardTitle className="text-2xl font-bold">Complete your account setup</CardTitle>
        <CardDescription>Welcome to BikeRequest! Let&apos;s get you onboarded.</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-6">
          <div className="space-y-3">
            <Label className="text-base font-medium">Account Type</Label>
            <RadioGroup
              defaultValue="buyer"
              value={accountType}
              onValueChange={(value) => setAccountType(value as "seller" | "buyer")}
              className="grid grid-cols-2 gap-4"
            >
              <div>
                <RadioGroupItem value="buyer" id="buyer" className="peer sr-only" />
                <Label
                  htmlFor="buyer"
                  className={cn(
                    "flex flex-col items-center justify-center rounded-lg border-2 p-6 transition-all duration-200 cursor-pointer",
                    "hover:border-gray-300 hover:bg-gray-50",
                    accountType === "buyer"
                      ? "border-blue-500 bg-blue-50 text-blue-700 font-medium shadow-sm"
                      : "border-gray-200 bg-white",
                  )}
                >
                  <Users className="w-8 h-8 mb-2" />
                  <span className="text-lg font-medium">Buyer</span>
                  <span className="text-sm text-gray-500 text-center mt-1">Join a company to request bikes</span>
                </Label>
              </div>
              <div>
                <RadioGroupItem value="seller" id="seller" className="peer sr-only" />
                <Label
                  htmlFor="seller"
                  className={cn(
                    "flex flex-col items-center justify-center rounded-lg border-2 p-6 transition-all duration-200 cursor-pointer",
                    "hover:border-gray-300 hover:bg-gray-50",
                    accountType === "seller"
                      ? "border-blue-500 bg-blue-50 text-blue-700 font-medium shadow-sm"
                      : "border-gray-200 bg-white",
                  )}
                >
                  <Building2 className="w-8 h-8 mb-2" />
                  <span className="text-lg font-medium">Seller</span>
                  <span className="text-sm text-gray-500 text-center mt-1">Create a company to manage bikes</span>
                </Label>
              </div>
            </RadioGroup>
          </div>

          <Separator />

          {accountType === "buyer" ? (
            <Form {...buyerForm}>
              <form onSubmit={buyerForm.handleSubmit(handleBuyerSubmit)} className="space-y-6">
                <div>
                  <h3 className="text-lg font-medium mb-4">Personal Information</h3>
                  <div className="grid grid-cols-2 gap-4">
                    <FormField
                      control={buyerForm.control}
                      name="firstName"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>First Name</FormLabel>
                          <FormControl>
                            <Input {...field} disabled className="bg-gray-100" />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={buyerForm.control}
                      name="lastName"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Last Name</FormLabel>
                          <FormControl>
                            <Input {...field} disabled className="bg-gray-100" />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                  <FormField
                    control={buyerForm.control}
                    name="email"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Email</FormLabel>
                        <FormControl>
                          <Input {...field} disabled className="bg-gray-100" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <div>
                  <h3 className="text-lg font-medium mb-4">Company Access</h3>
                  <FormField
                    control={buyerForm.control}
                    name="invitationCode"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Invitation Code</FormLabel>
                        <FormControl>
                          <Input
                            {...field}
                            placeholder="Enter the 6-digit code"
                            maxLength={6}
                            className="text-center text-lg tracking-widest font-mono"
                          />
                        </FormControl>
                        <FormDescription>Enter the 6-digit invitation code provided by your company.</FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                {error && (
                  <Alert variant="destructive">
                    <AlertDescription>{error}</AlertDescription>
                  </Alert>
                )}

                <Button type="submit" className="w-full h-12 text-base" disabled={isSubmitting}>
                  {isSubmitting ? "Processing..." : "Join Company"}
                </Button>
              </form>
            </Form>
          ) : (
            <Form {...sellerForm}>
              <form onSubmit={sellerForm.handleSubmit(handleSellerSubmit)} className="space-y-6">
                <div>
                  <h3 className="text-lg font-medium mb-4">Personal Information</h3>
                  <div className="grid grid-cols-2 gap-4">
                    <FormField
                      control={sellerForm.control}
                      name="firstName"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>First Name</FormLabel>
                          <FormControl>
                            <Input {...field} disabled className="bg-gray-100" />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={sellerForm.control}
                      name="lastName"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Last Name</FormLabel>
                          <FormControl>
                            <Input {...field} disabled className="bg-gray-100" />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                  <FormField
                    control={sellerForm.control}
                    name="email"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Email</FormLabel>
                        <FormControl>
                          <Input {...field} disabled className="bg-gray-100" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <Separator />

                <div>
                  <h3 className="text-lg font-medium mb-4">Company Information</h3>
                  <div className="space-y-4">
                    <FormField
                      control={sellerForm.control}
                      name="companyName"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Company Name *</FormLabel>
                          <FormControl>
                            <Input {...field} placeholder="Enter your company name" />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={sellerForm.control}
                      name="companyWebsite"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Company Website (optional)</FormLabel>
                          <FormControl>
                            <div className="relative">
                              <Globe className="absolute left-3 top-3 w-4 h-4 text-gray-400" />
                              <Input {...field} placeholder="https://yourcompany.com" className="pl-10" />
                            </div>
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={sellerForm.control}
                      name="companyLogo"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Company Logo URL (optional)</FormLabel>
                          <FormControl>
                            <Input {...field} placeholder="https://example.com/logo.png" />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                </div>

                {error && (
                  <Alert variant="destructive">
                    <AlertDescription>{error}</AlertDescription>
                  </Alert>
                )}

                <Button type="submit" className="w-full h-12 text-base" disabled={isSubmitting}>
                  {isSubmitting ? "Creating Company..." : "Create Company"}
                </Button>
              </form>
            </Form>
          )}
        </div>
      </CardContent>
    </Card>
  )
}

export default OnboardingForm
