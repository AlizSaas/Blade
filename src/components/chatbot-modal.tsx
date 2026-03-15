"use client"

import { useState, useRef, useEffect } from "react"
import type React from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Send, X, Bot, User, Minimize2, Maximize2 } from "lucide-react"

import { Message } from "@/generated/prisma"
import { useSendMessageToAI } from "@/hooks"

import { v4 as uuidv4 } from "uuid"

interface ChatbotModalProps {
  isOpen: boolean
  onClose: () => void
  onToggle: () => void
  conversationId: string
  initialMessages: Message[]
}

export default function ChatbotModal({ isOpen, onClose, onToggle, conversationId, initialMessages }: ChatbotModalProps) {
  const [messages, setMessages] = useState<Message[]>(initialMessages)
  const [inputValue, setInputValue] = useState("")
  const [isTyping, setIsTyping] = useState(false)
  const [isMinimized, setIsMinimized] = useState(false)
  const messagesContainerRef = useRef<HTMLDivElement>(null)

  const sendMessageMutation = useSendMessageToAI()

  const scrollToBottom = () => {
    if (messagesContainerRef.current) {
      messagesContainerRef.current.scrollTop = messagesContainerRef.current.scrollHeight
    }
  }

  // Scroll to bottom when modal opens
  useEffect(() => {
    if (isOpen) {
      // Small delay to ensure DOM is ready
      setTimeout(scrollToBottom, 100)
    }
  }, [isOpen])

  // Scroll to bottom when messages change
  useEffect(() => {
    scrollToBottom()
  }, [messages])

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
      <DialogContent className="sm:max-w-md h-[500px] p-0 gap-0 flex flex-col rounded-2xl overflow-hidden border-border bg-background">
        {/* Header */}
        <DialogHeader className="px-4 py-3 border-b border-border flex-shrink-0 bg-card">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="relative">
                <Avatar className="h-10 w-10 ring-2 ring-blue-500/20">
                  <AvatarFallback className="bg-gradient-to-br from-blue-500 to-blue-600">
                    <Bot className="h-5 w-5 text-white" />
                  </AvatarFallback>
                </Avatar>
                <span className="absolute bottom-0 right-0 h-3 w-3 bg-green-500 border-2 border-card rounded-full"></span>
              </div>
              <div>
                <DialogTitle className="text-base font-semibold text-foreground">Seller Assistant</DialogTitle>
                <p className="text-xs text-muted-foreground">Online • Ready to help</p>
              </div>
            </div>
            <div className="flex items-center gap-1">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setIsMinimized(!isMinimized)}
                className="h-8 w-8 rounded-full hover:bg-muted"
                aria-label={isMinimized ? "Maximize chat" : "Minimize chat"}
              >
                {isMinimized ? (
                  <Maximize2 className="h-4 w-4 text-muted-foreground" />
                ) : (
                  <Minimize2 className="h-4 w-4 text-muted-foreground" />
                )}
              </Button>
              <Button
                variant="ghost"
                size="icon"
                onClick={onClose}
                className="h-8 w-8 rounded-full hover:bg-destructive/10"
                aria-label="Close chat"
              >
                <X className="h-4 w-4 text-muted-foreground hover:text-destructive" />
              </Button>
            </div>
          </div>
        </DialogHeader>

        {!isMinimized && (
          <>
            {/* Messages Area */}
            <div
              ref={messagesContainerRef}
              className="flex-1 overflow-y-auto p-4 space-y-4 bg-background"
            >
              {messages.length === 0 && (
                <div className="flex flex-col items-center justify-center h-full text-center">
                  <div className="rounded-full bg-muted p-4 mb-4">
                    <Bot className="h-8 w-8 text-muted-foreground" />
                  </div>
                  <p className="text-sm font-medium text-foreground">How can I help you today?</p>
                  <p className="text-xs text-muted-foreground mt-1">Ask me anything about your business</p>
                </div>
              )}

              {messages.map((message) => (
                <div
                  key={message.id}
                  className={`flex gap-2 ${message.Role === "USER" ? "justify-end" : "justify-start"}`}
                >
                  {message.Role === "AI" && (
                    <Avatar className="h-7 w-7 mt-1 flex-shrink-0">
                      <AvatarFallback className="bg-gradient-to-br from-blue-500 to-blue-600">
                        <Bot className="h-3.5 w-3.5 text-white" />
                      </AvatarFallback>
                    </Avatar>
                  )}

                  <div
                    className={`max-w-[75%] rounded-2xl px-4 py-2.5 ${
                      message.Role === "USER"
                        ? "bg-blue-600 text-white rounded-br-md"
                        : "bg-muted text-foreground rounded-bl-md"
                    }`}
                  >
                    <p className="text-sm whitespace-pre-wrap leading-relaxed">{message.content}</p>
                    <p
                      className={`text-[10px] mt-1.5 ${
                        message.Role === "USER" ? "text-blue-200" : "text-muted-foreground"
                      }`}
                    >
                      {message.createdAt.toLocaleTimeString([], {
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </p>
                  </div>

                  {message.Role === "USER" && (
                    <Avatar className="h-7 w-7 mt-1 flex-shrink-0">
                      <AvatarFallback className="bg-gradient-to-br from-gray-600 to-gray-700 dark:from-gray-500 dark:to-gray-600">
                        <User className="h-3.5 w-3.5 text-white" />
                      </AvatarFallback>
                    </Avatar>
                  )}
                </div>
              ))}

              {isTyping && (
                <div className="flex gap-2 justify-start">
                  <Avatar className="h-7 w-7 mt-1 flex-shrink-0">
                    <AvatarFallback className="bg-gradient-to-br from-blue-500 to-blue-600">
                      <Bot className="h-3.5 w-3.5 text-white" />
                    </AvatarFallback>
                  </Avatar>
                  <div className="bg-muted rounded-2xl rounded-bl-md px-4 py-3">
                    <div className="flex space-x-1.5">
                      <div className="w-2 h-2 bg-muted-foreground/50 rounded-full animate-bounce"></div>
                      <div
                        className="w-2 h-2 bg-muted-foreground/50 rounded-full animate-bounce"
                        style={{ animationDelay: "0.15s" }}
                      ></div>
                      <div
                        className="w-2 h-2 bg-muted-foreground/50 rounded-full animate-bounce"
                        style={{ animationDelay: "0.3s" }}
                      ></div>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Input Area */}
            <div className="p-3 border-t border-border flex-shrink-0 bg-card">
              <div className="flex gap-2 items-center">
                <Input
                  value={inputValue}
                  onChange={(e) => setInputValue(e.target.value)}
                  onKeyDown={handleKeyPress}
                  placeholder="Type a message..."
                  className="flex-1 rounded-full bg-muted border-0 focus-visible:ring-1 focus-visible:ring-blue-500 px-4"
                  disabled={isTyping}
                />
                <Button
                  onClick={handleSendMessage}
                  disabled={!inputValue.trim() || isTyping}
                  size="icon"
                  className="h-10 w-10 rounded-full bg-blue-600 hover:bg-blue-700 flex-shrink-0 disabled:opacity-50"
                >
                  <Send className="h-4 w-4 text-white" />
                </Button>
              </div>
            </div>
          </>
        )}
      </DialogContent>
    </Dialog>
  )
}
