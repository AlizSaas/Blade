'use server'

import { prisma } from "../prisma"
import { validateAuthRequest } from "../auth"
import openai from "@/lib/open-ai"

import { $Enums } from "@/generated/prisma"
import { ChatCompletionMessageParam } from "openai/resources/index.mjs"



interface AITask {
  id: string
  content: string
  sender: $Enums.MessageRole
  timestamp: Date
}

export async function sendMessageToAI(
  conversationId: string,
  content: string
): Promise<AITask> {
  const sessionUser = await validateAuthRequest()
  if (!sessionUser) throw new Error("Unauthorized")

  const user = await prisma.user.findUnique({
    where: { clerkId: sessionUser.id, },
    include:{
      subscription: true,
    }
  
  })

  if (!user) throw new Error("User not found")
  if (user.role !== "SELLER" ) throw new Error("Only sellers can talk to the AI")
    if(user.subscription?.plan === 'FREE' ) {
    throw new Error("You need to upgrade your plan to use the AI chatbot")
    }
  

  // Fetch the conversation
  const conversation = await prisma.conversation.findUnique({
    where: { id: conversationId },
    include: {
      company: true,
      messages: {
        orderBy: { createdAt: "asc" },
        take: 10, // limit context size
      },
    },
  })

  if (!conversation) throw new Error("Conversation not found")

  // Fetch related company data
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
  })

  if (!companyData) throw new Error("Company data not found")

  // Save the user's message
  await prisma.message.create({
    data: {
      content,
      conversationId,
      Role: $Enums.MessageRole.USER,
    },
  })



  // Build AI prompt
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
- Website: ${companyData.website ?? "Not available"}

Company Stats:
- Total Users: ${companyData._count.users}
  - Sellers: ${companyData.users.filter((u) => u.role === "SELLER").length}
  - Buyers: ${companyData.users.filter((u) => u.role === "BUYER").length}
- Total Codes Issued: ${companyData._count.codes}

User Directory:
${companyData.users
  .map(
    (u) =>
      `- ${u.firstname} ${u.lastname ?? ""} (${u.email}) [${u.role}] - ` +
      
      `Pending Requests: ${u.approvedRequests.filter((r) => r.status === 'PENDING').length}, ` +
      `Approved Requests: ${u.approvedRequests.filter((r) => r.status === 'APPROVED').length}, ` +
      `Rejected Requests: ${u.approvedRequests.filter((r) => r.status === 'REJECTED').length}`
  )
  .join("\n")}

Recent Referral Codes:
${companyData.codes.map((code) => `- ${code.code}`).join("\n")}

Guidelines:
- Use this data to help sellers understand activity within the company.
- Be concise, polite, and specific to what the seller asks.
- If you're not sure, offer to clarify or ask a follow-up question.
- Never reveal data unrelated to the seller’s company.

You are always honest, concise, and focused on helping the seller succeed.
`.trim()


  const promptMessages = [
    { role: "system", content: systemContent },
    ...conversation.messages.map((msg) => ({
      role: msg.Role === "USER" ? "user" : "assistant",
      content: msg.content,
    })),
    {
      role: "user",
      content,
    },
  ]

  const chatResponse = await openai.chat.completions.create({
    model: "gpt-4o",
    messages: promptMessages as ChatCompletionMessageParam[],
  })

  const aiContent =
    chatResponse.choices?.[0]?.message?.content || "Sorry, I couldn't understand that."

  // Save AI response
  const aiMessage = await prisma.message.create({
    data: {
      content: aiContent,
      conversationId,
      Role: $Enums.MessageRole.AI,
    },
  })

  return {
    id: aiMessage.id,
    content: aiMessage.content,
    sender: aiMessage.Role,
    timestamp: aiMessage.createdAt,
  }
}
