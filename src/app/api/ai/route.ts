import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { prisma } from '@/lib/prisma';
import { validateAuthRequest } from '@/lib/auth';
import openai from '@/lib/open-ai';
import { $Enums } from '@/generated/prisma';
import arcjet, { shield, tokenBucket } from '@arcjet/next'
import { ChatCompletionAssistantMessageParam } from 'openai/resources/index.mjs';

// Optional: add Arcjet here if needed

const aj = arcjet({
    key: process.env.ARCJET_KEY!,
    characteristics:['ip.src'],
    rules:[
         tokenBucket({
            mode: 'LIVE',
            refillRate: 100, // 100 requests per hour
            interval: '1h',
            capacity: 500, // 500 requests per hour

         }),
         shield({
            mode:'DRY_RUN'
         }) // Optional: add shield for dry run mode
    ]
    
})

const messageSchema = z.object({
  conversationId: z.string().min(1),
  content: z.string().min(1, 'Message content cannot be empty'),
});



export const POST = async (req: NextRequest) => {
  try {
    const body = await req.json();
    const { conversationId, content } = messageSchema.parse(body);

    const sessionUser = await validateAuthRequest();
    if (!sessionUser) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { clerkId: sessionUser.id },
      include: { subscription: true },
    });

    if (!user || user.role !== 'SELLER') {
      return NextResponse.json({ error: 'Only sellers can talk to the AI' }, { status: 403 });
    }

    if (user.subscription?.plan === 'FREE') {
      return NextResponse.json({ error: 'Upgrade your plan to use the AI chatbot' }, { status: 403 });
    }

    const conversation = await prisma.conversation.findUnique({
      where: { id: conversationId },
      include: {
        company: true,
        messages: {
          orderBy: { createdAt: 'asc' },
          take: 10,
        },
      },
    });

    if (!conversation) {
      return NextResponse.json({ error: 'Conversation not found' }, { status: 404 });
    }

    const companyData = await prisma.company.findUnique({
      where: { id: conversation.companyId },
      select: {
        name: true,
        website: true,
        codes: true,
        users: {
          select: {
            approvedRequests: true,
            role: true,
            company: true,
            bikeRequests: true,
            firstname: true,
            lastname: true,
            email: true,
          },
        },
        _count: {
          select: {
            users: true,
            codes: true,
          },
        },
      },
    });

    if (!companyData) {
      return NextResponse.json({ error: 'Company data not found' }, { status: 404 });
    }

    // Save user message
    const sellerMessage = await prisma.message.create({
      data: {
        content,
        conversationId,
        Role: $Enums.MessageRole.USER,
      },
    });



    // Build prompt
    const systemContent = `
You are a helpful, knowledgeable AI assistant for the motorcycle seller company "${companyData.name}".
Your goal is to assist the company's sellers with questions related to:
- Buyer activity
- Approved or pending bike requests
- Internal users (sellers and buyers)
- Unique referral codes
- General company insights

Company Overview:
- Name: ${companyData.name}
- Website: ${companyData.website ?? 'Not available'}

Company Stats:
- Total Users: ${companyData._count.users}
  - Sellers: ${companyData.users.filter((u) => u.role === 'SELLER').length}
  - Buyers: ${companyData.users.filter((u) => u.role === 'BUYER').length}
- Total Codes Issued: ${companyData._count.codes}

User Directory:
${companyData.users
  .map(
    (u) =>
      `- ${u.firstname} ${u.lastname ?? ''} (${u.email}) [${u.role}] - Approved Requests: ${u.approvedRequests.length}, Bike Requests: ${u.bikeRequests.length}`
  )
  .join('\n')}

Recent Referral Codes:
${companyData.codes.map((code) => `- ${code.code}`).join('\n')}
`.trim();

    const promptMessages = [
      { role: 'system', content: systemContent },
      ...conversation.messages.map((msg) => ({
        role: msg.Role === 'USER' ? 'user' : 'assistant',
        content: msg.content,
      })),
      { role: 'user', content },
    ];

    const decision = await aj.protect(req,{
        requested: 1,
   
    })

    if(decision.isDenied()) {
        if(decision.reason.isRateLimit()) {
            return NextResponse.json({ error: 'Rate limit exceeded. Please try again later.' }, { status: 429 });
        }
    }

    if(decision.reason.isShield()) {
        return NextResponse.json({ error: 'Request blocked by security rules.' }, { status: 403 });
    }




    const chatResponse = await openai.chat.completions.create({
      model: 'gpt-4o',
      messages: promptMessages as ChatCompletionAssistantMessageParam[],
    });

    const aiContent =
      chatResponse.choices?.[0]?.message?.content || "Sorry, I couldn't understand that.";

    const aiMessage = await prisma.message.create({
      data: {
        content: aiContent,
        conversationId,
        Role: $Enums.MessageRole.AI,
      },
    });

    return NextResponse.json({
      id: aiMessage.id,
      content: aiMessage.content,
      sender: aiMessage.Role,
      timestamp: aiMessage.createdAt,
   
      
    });
  } catch (err: unknown) {
    console.error(err);
    const errorMessage = err instanceof Error ? err.message : 'Internal Server Error';
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}

    


