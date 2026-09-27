import { NextRequest } from 'next/server';

import { stripe } from '@/lib/stripe';
import { prisma } from '@/lib/prisma';
import { getResend } from '@/lib/resend';
import { z } from 'zod';

const checkoutSessionSchema = z.object({
  customer: z.union([z.string(), z.null()]),
  customer_email: z.string().email().nullish(),
  metadata: z.object({
    clerkId: z.string().min(1),
  }),
})

export async function POST(req: NextRequest) {
const body = await req.text()
const signature = req.headers.get('stripe-signature');
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET!;

  if(!signature || !webhookSecret) {
    console.error('❌ Missing Stripe signature or webhook secret.');
    return new Response('Webhook Error', { status: 400 });
  }
  let event;

  try {
    event = stripe.webhooks.constructEvent(
      body,
      signature,
      webhookSecret
    );
  } catch (err) {
    console.error('❌ Webhook signature verification failed.', err);
    return new Response('Webhook Error', { status: 400 });
  }

  // ✅ Handle the event
  if (event.type === 'checkout.session.completed') {
    const session = checkoutSessionSchema.parse(event.data.object);
    const userId = session.metadata.clerkId;
    const customerId = session.customer;

    if (!customerId) {
      return new Response('Missing customer id', { status: 400 });
    }

    await prisma.user.update({
      where:{
        clerkId: userId,

      },
      data:{
        subscription:{
          update:{
            data:{
              customerId: customerId,
              plan: 'PRO',
              
            }
          }
        }
      }
    })

    if (session.customer_email) {
      await getResend().emails.send({
        from: 'YourApp <no-reply@alizmail.com>',
        to: session.customer_email,
        subject: '🎉 Subscription Confirmed!',
        html: `
          <h1>Thanks for subscribing to PRO 🚀</h1>
          <p>Your premium features are now active. Enjoy!</p>
        `,
      });
    }
  }

  return new Response('Webhook received', { status: 200 });
}
