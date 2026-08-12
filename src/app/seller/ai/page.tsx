import { getSellerMcpContext } from '@/lib/mcp/auth'
import { SubscriptionRequiredError } from '@/lib/auth'
import { createCheckoutSession } from '@/lib/utils/stripe-stuff'
import UpgradeDialog from '@/components/upgrade-dialog'
import SellerAiChat from './_components/saller-ai-chat'

export const metadata = {
  title: 'Seller AI Assistant',
}

export default async function SellerAiPage() {
  let context
  try {
    context = await getSellerMcpContext()
  } catch (error) {
    if (error instanceof SubscriptionRequiredError) {
      // Only hit Stripe once we've confirmed this seller actually needs to
      // upgrade - not on every page load the way /seller's page currently
      // does it for every seller regardless of plan.
      const checkoutSessionUrl = await createCheckoutSession()

      return (
        <div className="flex h-svh items-center justify-center p-6">
          <div className="flex justify-center px-4">
            <UpgradeDialog checkoutUrl={checkoutSessionUrl!} />
          </div>
        </div>
      )
    }

    return (
      <div className="flex h-svh items-center justify-center p-6">
        <div className="max-w-sm space-y-2 text-center">
          <h1 className="text-lg font-semibold">Access Denied</h1>
          <p className="text-sm text-muted-foreground">
            The Seller AI Assistant is only available to authenticated sellers.
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="h-svh">
      <SellerAiChat sellerName={context.name ?? 'Seller'} />
    </div>
  )
}