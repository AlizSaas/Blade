"use client"

import { Button } from "@/components/ui/button"
import { MessageCircle, X } from "lucide-react"
import ChatbotModal from "./chatbot-modal"
import { Message } from "@/generated/prisma"
import { useChatbotStore } from "@/store/chatbot-store"

type ChatProps = {
  conversationId: string
  initialMessages: Message[]
}

export default function ChatbotToggle({ conversationId, initialMessages }: ChatProps) {
  const { isOpen, toggle } = useChatbotStore()

  return (
    <>
      {/* Floating Chat Button */}
      <div className="fixed bottom-6 right-6 z-[60]">
        <Button
          onClick={toggle}
          className={`h-14 w-14 rounded-full shadow-lg transition-all duration-300 hover:scale-105 ${
            isOpen
              ? "bg-red-500 hover:bg-red-600"
              : "bg-gradient-to-br from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700"
          }`}
          size="icon"
        >
          {isOpen ? (
            <X className="h-6 w-6 text-white" />
          ) : (
            <MessageCircle className="h-6 w-6 text-white" />
          )}
        </Button>

        {/* Notification Badge - Pulse animation */}
        {!isOpen && (
          <span className="absolute -top-1 -right-1 flex h-4 w-4">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-4 w-4 bg-red-500 items-center justify-center">
              <span className="text-[10px] text-white font-bold">!</span>
            </span>
          </span>
        )}
      </div>

      {/* Chatbot Modal */}
      <ChatbotModal
        conversationId={conversationId}
        initialMessages={initialMessages}
      />
    </>
  )
}
