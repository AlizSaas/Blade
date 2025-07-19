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

export default async function page() {
  const user = await validateAuthRequest()
  if (!user) redirect('/')

  const userAdmin = await adminUser(user.id)
  if (!userAdmin || userAdmin.role !== 'SELLER') redirect('/buyer')

  const checkoutSessionUrl = await createCheckoutSession()

  const { id, messages } = await getConversationId(userAdmin.id, userAdmin.companyId!)

  return (
    <>
      <SellerDashboard />
      {userAdmin.subscription?.plan === 'FREE' ? (
        <div className="flex justify-center px-4">
          <UpgradeDialog checkoutUrl={checkoutSessionUrl!} />
        </div>
      ) : (
        <Suspense fallback={<div>Loading chatbot...</div>}>
          <ChatbotToggle
          
          
          conversationId={id} initialMessages={messages} />
        </Suspense>
      )}
    </>
  )
}
