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
      },
    });

    if (!companyData) {
      return NextResponse.json({ error: 'Company data not found' }, { status: 404 });
    }

    // Fetch accurate per-seller bike request counts
    const [approvedCount, rejectedCount, pendingCount, latestRequests] = await Promise.all([
      prisma.bikeRequest.count({
        where: { seller: { clerkId: sessionUser.id }, status: 'APPROVED' },
      }),
      prisma.bikeRequest.count({
        where: { seller: { clerkId: sessionUser.id }, status: 'REJECTED' },
      }),
      prisma.bikeRequest.count({
        where: { seller: { clerkId: sessionUser.id }, status: 'PENDING' },
      }),
      prisma.bikeRequest.findMany({
        where: { seller: { clerkId: sessionUser.id } },
        orderBy: { createdAt: 'desc' },
        take: 10,
        select: {
          id: true,
          status: true,
          bikeModel: true,
          createdAt: true,
          buyer: { select: { firstname: true, lastname: true } },
        },
      }),
    ]);

    const totalCount = approvedCount + rejectedCount + pendingCount;

    // Save user message
    await prisma.message.create({
      data: {
        content,
        conversationId,
        Role: $Enums.MessageRole.USER,
      },
    });



    // Build prompt
    const systemContent = `
You are an AI assistant for a motorcycle company dashboard.
Your job is to help sellers understand their bike requests using ONLY the provided database data.

-------------------------------------
🔒 STRICT RULES (DO NOT BREAK)
-------------------------------------
- ONLY use the data in the DATA section below
- NEVER guess, estimate, or calculate missing values
- If data is missing → say: "I don't have enough information to answer that."
- DO NOT make up requests, counts, or statuses
- DO NOT assume anything not explicitly provided

-------------------------------------
📊 DATA
-------------------------------------
Company: ${companyData.name}
Website: ${companyData.website ?? 'Not available'}

DATA:
{
  "approvedCount": ${approvedCount},
  "rejectedCount": ${rejectedCount},
  "pendingCount": ${pendingCount},
  "totalCount": ${totalCount},
  "latestRequests": ${JSON.stringify(
    latestRequests.map((r) => ({
      id: r.id,
      status: r.status,
      customerName: `${r.buyer.firstname} ${r.buyer.lastname ?? ''}`.trim(),
      bikeModel: r.bikeModel,
      createdAt: r.createdAt.toISOString(),
    }))
  )}
}

-------------------------------------
🧠 HOW TO RESPOND
-------------------------------------
### Counting questions
- "How many rejected requests?" → use rejectedCount
- "How many approved?" → use approvedCount
- "How many pending?" → use pendingCount
- "Total requests?" → use totalCount

### Listing requests
- "Show latest requests" / "Recent requests" → use latestRequests array
  Format:
  Here are your latest requests:
  1. [bikeModel] — [STATUS] — [customerName] ([date])

### Unknown questions
→ "I don't have enough information to answer that."

### UI FRIENDLY OUTPUT
- Keep answers short and use lists when possible
`.trim();

    const promptMessages: { role: 'system' | 'user' | 'assistant'; content: string }[] = [
      { role: 'system', content: systemContent },
      ...conversation.messages.map((msg) => ({
        role: (msg.Role === 'USER' ? 'user' : 'assistant') as 'user' | 'assistant',
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

const clearConversationSchema = z.object({
  conversationId: z.string().uuid(),
});

export const DELETE = async (req: NextRequest) => {
  try {
    const body = await req.json();
    const { conversationId } = clearConversationSchema.parse(body);

    const sessionUser = await validateAuthRequest();
    if (!sessionUser) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const conversation = await prisma.conversation.findUnique({
      where: { id: conversationId },
      select: { sellerId: true, seller: { select: { clerkId: true } } },
    });

    if (!conversation) {
      return NextResponse.json({ error: 'Conversation not found' }, { status: 404 });
    }

    if (conversation.seller.clerkId !== sessionUser.id) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    await prisma.message.deleteMany({ where: { conversationId } });

    return NextResponse.json({ success: true });
  } catch (err: unknown) {
    console.error(err);
    const errorMessage = err instanceof Error ? err.message : 'Internal Server Error';
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}
