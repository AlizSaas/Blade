"use client"

import { useState, useRef, useEffect } from "react"
import type React from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Send, X, Bot, User, Minimize2, Maximize2 } from "lucide-react"

import { Message  }  from "@/generated/prisma"
import { useSendMessageToAI } from "@/hooks"

import { v4 as uuidv4 } from "uuid";




interface ChatbotModalProps {
  isOpen: boolean
  onClose: () => void
  onToggle: () => void
  conversationId: string
  initialMessages: Message[]
}

// Mutation hook


export default function ChatbotModal({ isOpen, onClose, onToggle, conversationId, initialMessages }: ChatbotModalProps) {

    const [messages, setMessages] = useState<Message[]>(initialMessages)
  const [inputValue, setInputValue] = useState("")
  const [isTyping, setIsTyping] = useState(false)
  const [isMinimized, setIsMinimized] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)

  const sendMessageMutation = useSendMessageToAI()

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }

  useEffect(() => {
    scrollToBottom()
  }, [messages]) // Scroll to bottom when messages change

  const handleSendMessage = async () => {
    if (!inputValue.trim()) return

    const userMessage: Message = {
     content: inputValue,
     Role:'USER',
     conversationId,
     createdAt: new Date(),
      id: uuidv4(), // Generate a unique ID for the message

    }

    setMessages((prev) => [...prev, userMessage])
    setInputValue("")
    setIsTyping(true)

    try {
      const aiResponse = await sendMessageMutation.mutateAsync({
        conversationId,
        content: userMessage.content,
      })

      const botMessage: Message = {
        content: aiResponse.content,
        Role: 'AI',
        conversationId,
        createdAt: new Date(),
        id: uuidv4(), // Generate a unique ID for the message
      }

      setMessages((prev) => [...prev, botMessage])
    } catch (error: unknown) {
      console.error("Failed to fetch AI response:", error)
    setMessages((prev) => [...prev, {
        content: "Sorry, I couldn't understand that.",
        Role: 'AI',
        conversationId,
        createdAt: new Date(),
        updatedAt: new Date(),
        id: Date.now().toString(), // Temporary ID
      }]) 
      
    } finally {
      setIsTyping(false)
    }
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault()
      handleSendMessage()
    }
  }

  if (!isOpen) return null

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md h-[600px] p-0 gap-0 flex flex-col">
        <DialogHeader className="p-4 pb-2 border-b flex-shrink-0">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Avatar className="h-8 w-8">
                <AvatarFallback className="bg-blue-100">
                  <Bot className="h-4 w-4 text-blue-600" />
                </AvatarFallback>
              </Avatar>
              <div>
                <DialogTitle className="text-sm font-medium">Seller Assistant</DialogTitle>
                <p className="text-xs text-muted-foreground">Always here to help</p>
              </div>
            </div>
            <div className="flex items-center gap-1">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setIsMinimized(!isMinimized)}
                className={`h-8 w-8 p-0 rounded-full transition-colors ${
                  isMinimized
                    ? "hover:bg-green-100 focus:ring-2 focus:ring-green-300"
                    : "hover:bg-blue-100 focus:ring-2 focus:ring-blue-300"
                }`}
                aria-label={isMinimized ? "Maximize chat" : "Minimize chat"}
              >
                {isMinimized ? (
                  <Maximize2 className="h-4 w-4 text-green-600" />
                ) : (
                  <Minimize2 className="h-4 w-4 text-blue-600" />
                )}
              </Button>
              <Button onClick={onClose} aria-label="Close chat">
                <X className="h-8 w-8 text-red-500" />
              </Button>
            </div>
          </div>
        </DialogHeader>

        {!isMinimized && (
          <>
            {/* Messages Area */}
            <div className="flex-1 overflow-hidden">
              <ScrollArea className="h-full p-4">
                <div className="space-y-4">
                  {messages.map((message) => (
                    <div
                      key={message.id}
                      className={`flex gap-3 ${message.Role === "USER" ? "justify-end" : "justify-start"}`}
                    >
                      {message.Role === "AI" && (
                        <Avatar className="h-8 w-8 mt-1 flex-shrink-0">
                          <AvatarFallback className="bg-blue-100">
                            <Bot className="h-4 w-4 text-blue-600" />
                          </AvatarFallback>
                        </Avatar>
                      )}

                      <div
                        className={`max-w-[80%] rounded-lg px-3 py-2 text-sm ${
                          message.Role === "USER"
                            ? "bg-blue-600 text-white"
                            : "bg-gray-100 text-gray-900"
                        }`}
                      >
                        <p className="whitespace-pre-wrap">{message.content}</p>
                        <p
                          className={`text-xs mt-1 ${
                            message.Role === "USER" ? "text-blue-100" : "text-gray-500"
                          }`}
                        >
                          {message.createdAt.toLocaleTimeString([], {
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                        </p>
                      </div>

                      {message.Role === "USER" && (
                        <Avatar className="h-8 w-8 mt-1 flex-shrink-0">
                          <AvatarFallback className="bg-gray-100">
                            <User className="h-4 w-4 text-gray-600" />
                          </AvatarFallback>
                        </Avatar>
                      )}
                    </div>
                  ))}

                  {isTyping && (
                    <div className="flex gap-3 justify-start">
                      <Avatar className="h-8 w-8 mt-1 flex-shrink-0">
                        <AvatarFallback className="bg-blue-100">
                          <Bot className="h-4 w-4 text-blue-600" />
                        </AvatarFallback>
                      </Avatar>
                      <div className="bg-gray-100 rounded-lg px-3 py-2">
                        <div className="flex space-x-1">
                          <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                          <div
                            className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"
                            style={{ animationDelay: "0.1s" }}
                          ></div>
                          <div
                            className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"
                            style={{ animationDelay: "0.2s" }}
                          ></div>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
                <div ref={messagesEndRef} />
              </ScrollArea>
            </div>

            {/* Input Area */}
            <div className="p-4 border-t flex-shrink-0 bg-white">
              <div className="flex gap-2">
                <Input
                  value={inputValue}
                  onChange={(e) => setInputValue(e.target.value)}
                  onKeyDown={handleKeyPress}
                  placeholder="Type your message..."
                  className="flex-1"
                  disabled={isTyping}
                />
                <Button
                  onClick={handleSendMessage}
                  disabled={!inputValue.trim() || isTyping}
                  size="sm"
                  className="px-3 flex-shrink-0"
                >
                  <Send className="h-4 w-4" />
                </Button>
              </div>
              <p className="text-xs text-muted-foreground mt-2 text-center">
                Press Enter to send, Shift + Enter for new line
              </p>
            </div>
          </>
        )}
      </DialogContent>
    </Dialog>
  )
}
