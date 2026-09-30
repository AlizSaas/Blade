import React, { cache } from 'react'
import SellerDashboard from './saler-ui'
import { validateAuthRequest } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { prisma } from '@/lib/prisma'

import ChatbotToggle from '@/components/chatbot-toggle'
import { createCheckoutSession } from '@/lib/utils/stripe-stuff'
import { Suspense } from 'react'
import UpgradeDialog from '@/components/upgrade-dialog'

const adminUser = cache(async (id: string) => {
  return prisma.user.findUnique({
    where: { clerkId: id },
    select: {
      role: true,
      companyId: true,
      id: true,
      clerkId: true,
      subscription: true,
    },
  })
})

const getConversationId = cache(async (sellerId: string, companyId: string) => {
  // Use upsert with compound unique key
  const conversation = await prisma.conversation.upsert({
    where: {
      companyId_sellerId: { sellerId, companyId },
    },
    create: {
      sellerId,
      companyId,
    },
    update: {}, // nothing to update
    select: { id: true },
  })

  // Fetch messages tied to that conversation
  const messages = await prisma.message.findMany({
    where: { conversationId: conversation.id },
    orderBy: { createdAt: 'asc' },
  })

  return {
    id: conversation.id,
    messages,
  }
})

async function UpgradeSection() {
  const checkoutUrl = await createCheckoutSession()
  return (
    <div className="flex justify-center px-4">
      <UpgradeDialog checkoutUrl={checkoutUrl!} />
    </div>
  )
}

async function ChatbotSection({ sellerId, companyId }: { sellerId: string; companyId: string }) {
  const { id, messages } = await getConversationId(sellerId, companyId)
  return <ChatbotToggle conversationId={id} initialMessages={messages} />
}

export default async function page() {
  const user = await validateAuthRequest()
  if (!user) redirect('/')

  const userAdmin = await adminUser(user.id)
  if (!userAdmin || userAdmin.role !== 'SELLER') redirect('/buyer')

  const isFreePlan = userAdmin.subscription?.plan === 'FREE'

  return (
    <>
      {/*
        The invitation-codes dialog is rendered inside SellerDashboard
        (saler-ui.tsx), a pure client component, so it no longer waits on
        the async server children below (Stripe checkout, conversation
        load) before the seller can generate a code.
      */}
      <SellerDashboard />

      {isFreePlan ? (
        <Suspense fallback={null}>
          <UpgradeSection />
        </Suspense>
      ) : (
        <Suspense fallback={<div>Loading chatbot...</div>}>
          <ChatbotSection sellerId={userAdmin.id} companyId={userAdmin.companyId!} />
        </Suspense>
      )}
    </>
  )
}