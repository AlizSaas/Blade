import React, { cache } from 'react'
import SellerDashboard from './saler-ui'
import { validateAuthRequest } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { prisma } from '@/lib/prisma'

import ChatbotToggle from '@/components/chatbot-toggle'
import { createCheckoutSession } from '@/lib/utils/stripe-stuff'
import { Suspense } from 'react'
import UpgradeDialog from '@/components/upgrade-dialog'
import InvitationCodesModal from '@/components/invitation-codes-model'

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

export default async function page() {
  const user = await validateAuthRequest()
  if (!user) redirect('/')

  const userAdmin = await adminUser(user.id)
  if (!userAdmin || userAdmin.role !== 'SELLER') redirect('/buyer')

  const { id, messages } = await getConversationId(userAdmin.id, userAdmin.companyId!)

  const isFreePlan = userAdmin.subscription?.plan === 'FREE'

  return (
    <>
      <SellerDashboard />

      {/*
        Inviting employees has nothing to do with the AI chatbot's paid
        plan - it's core company management that every seller needs
        regardless of subscription tier. Previously this only rendered
        inside the "paid plan" branch below, which meant free-plan sellers
        had no way to invite anyone. It's also a self-contained client
        component with its own react-query data fetching, so it doesn't
        need to sit inside the Suspense boundary meant for the chatbot's
        server-loaded conversation history.
      */}
      <div className="flex justify-center px-4">
        <InvitationCodesModal />
      </div>

      {isFreePlan ? (
        <div className="flex justify-center px-4">
          {/*
            Only call Stripe when we're actually about to render the
            upgrade dialog. Previously createCheckoutSession() ran
            unconditionally at the top of the page for every seller on
            every load - including paid sellers who never see this dialog
            and whose checkout session was created and immediately thrown
            away.
          */}
          <UpgradeDialog checkoutUrl={(await createCheckoutSession())!} />
        </div>
      ) : (
        <Suspense fallback={<div>Loading chatbot...</div>}>
          <ChatbotToggle conversationId={id} initialMessages={messages} />
        </Suspense>
      )}
    </>
  )
}