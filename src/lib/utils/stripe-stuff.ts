// app/actions/createCheckoutSession.ts
'use server'

import { prisma } from '@/lib/prisma'
import { stripe } from '@/lib/stripe'

import { validateAuthRequest } from '@/lib/auth'

export async function createCheckoutSession() {
  const user = await validateAuthRequest()
  if (!user) {
    throw new Error('Unauthorized')
  }

  const dbUser = await prisma.user.findUnique({
    where: { clerkId: user.id },
    select:{
        role: true,
        company: true,
        email: true,
     
        clerkId: true,
    }
  })
if(!dbUser || !dbUser.company) {
    throw new Error('Unauthorized')
}
  if(dbUser?.role !== 'SELLER' ) {
    throw new Error('Unauthorized')
  }

  const session = await stripe.checkout.sessions.create({
    payment_method_types: ['card'],
    mode: 'subscription',
    line_items: [
      {
        price: process.env.STRIPE_PRICE_ID, // replace with your Stripe price ID
        quantity: 1,
      },
    ],
    metadata: {
      clerkId: dbUser.clerkId,
    },
    customer_email: dbUser.email,
    success_url: `${process.env.NEXT_PUBLIC_APP_URL}/payment?success=true`,
    cancel_url: `${process.env.NEXT_PUBLIC_APP_URL}/payment?success=false`,
  })

  return session.url
}
