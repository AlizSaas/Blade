import { NextRequest } from 'next/server';

import { stripe } from '@/lib/stripe';
import { prisma } from '@/lib/prisma';
import { resend } from '@/lib/resend';

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
    const session = event.data.object as any;
 

    const userId = session.metadata.clerkId;
    const customerId = session.customer;

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

   await resend.emails.send({
      from: 'YourApp <no-reply@alizmail.com>',
      to: event.data.object.customer_email!,
      subject: '🎉 Subscription Confirmed!',
      html: `
        <h1>Thanks for subscribing to PRO 🚀</h1>
        <p>Your premium features are now active. Enjoy!</p>
      `,
    });
    console.log('✅ Subscription created for user:', userId);
  }

  return new Response('Webhook received', { status: 200 });
}
