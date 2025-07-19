import OnboardingForm from "@/components/onboarding-form"
import { validateAuthRequest } from "@/lib/auth"

import { Loader2 } from "lucide-react"

export default async function Onboarding() {
  const user = await validateAuthRequest()

  if (!user) {
    return (
      <div className="flex items-center justify-center h-screen">
        <Loader2 className="animate-spin" size={24} />
      </div>
    )
  }

  return (
    <div className="container max-w-2xl mx-auto py-10">
      <div className="text-center mb-8">
        <h1 className="text-3xl font-bold mb-2">Complete your profile</h1>
        <p className="text-gray-600">Welcome to BikeRequest! Let&apos;s get you set up.</p>
      </div>
      <OnboardingForm
        firstName={user.firstName || ""}
        lastName={user.lastName || "user"}
        userEmail={user.emailAddresses[0]?.emailAddress || ""}
       
      />
    </div>
  )
}
