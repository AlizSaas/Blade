"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { MessageCircle, X } from "lucide-react"
import ChatbotModal from "./chatbot-modal"
import { Message } from "@/generated/prisma"
type ChatProps = {
  conversationId: string,
  initialMessages: Message[],
  plan?: string // Optional plan prop to handle different subscription plans,
  checkoutSessionUrl?: string // Optional URL for checkout session
}
export default function ChatbotToggle( { conversationId, initialMessages, plan }: ChatProps) {
  const [isOpen, setIsOpen] = useState(false)

  const toggleChatbot = () => {
    setIsOpen(!isOpen) // Toggle the chatbot visibility 
  }

  const closeChatbot = () => {
    setIsOpen(false)
  }
 

  return (
    <>
      {/* Floating Chat Button */}
      <div className="fixed bottom-[60] right-6 z-50">
        <Button
          onClick={toggleChatbot}
          className={`h-14 w-14 rounded-full shadow-lg transition-all duration-200 ${
            isOpen ? "bg-red-600 hover:bg-red-700" : "bg-blue-600 hover:bg-blue-700"
          }`}
          size="sm"
        >
          {isOpen ? <X className="h-6 w-6 text-white" /> : <MessageCircle className="h-6 w-6 text-white" />}
        </Button>

        {/* Notification Badge (optional) */}
        {!isOpen && (
          <div className="absolute -top-1 -right-1 h-4 w-4 bg-red-500 rounded-full flex items-center justify-center">
            <span className="text-xs text-white font-bold">!</span>
          </div> // Notification badge
        )}
      </div>

      {/* Chatbot Modal */}
      
      <ChatbotModal conversationId={conversationId} isOpen={isOpen} onClose={closeChatbot} onToggle={toggleChatbot} initialMessages={initialMessages} />
    </>
  )
}
