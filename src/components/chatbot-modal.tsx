"use client"

import { useState, useRef, useEffect } from "react"
import type React from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Send, X, Bot, User, Maximize2, Minimize2 } from "lucide-react"

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

const SCROLL_DELAY_MS = 100

const QUICK_ACTIONS = [
  "Show me all the latest requests",
  "How many rejected requests do I have?",
  "How many approved requests do I have?",
  "How many pending requests do I have?",
  "What is my total number of requests?",
]

export default function ChatbotModal({ isOpen, onClose, onToggle, conversationId, initialMessages }: ChatbotModalProps) {
  const [messages, setMessages] = useState<Message[]>(initialMessages)
  const [inputValue, setInputValue] = useState("")
  const [isTyping, setIsTyping] = useState(false)
  const [isFullscreen, setIsFullscreen] = useState(false)
  const messagesContainerRef = useRef<HTMLDivElement>(null)

  const sendMessageMutation = useSendMessageToAI()

  const scrollToBottom = () => {
    if (messagesContainerRef.current) {
      messagesContainerRef.current.scrollTop = messagesContainerRef.current.scrollHeight
    }
  }

  useEffect(() => {
    if (isOpen) {
      setTimeout(scrollToBottom, SCROLL_DELAY_MS)
    }
  }, [isOpen])

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  const sendMessage = async (text: string) => {
    if (!text.trim()) return

    const userMessage: Message = {
      content: text,
      Role: 'USER',
      conversationId,
      createdAt: new Date(),
      id: uuidv4(),
    }

    setMessages((prev) => [...prev, userMessage])
    setInputValue("")
    setIsTyping(true)

    try {
      const aiResponse = await sendMessageMutation.mutateAsync({
        conversationId,
        content: text,
      })

      const botMessage: Message = {
        content: aiResponse.content,
        Role: 'AI',
        conversationId,
        createdAt: new Date(),
        id: uuidv4(),
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
        id: Date.now().toString(),
      }])
    } finally {
      setIsTyping(false)
    }
  }

  const handleSendMessage = () => sendMessage(inputValue)

  const handleQuickAction = (action: string) => {
    sendMessage(action)
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault()
      handleSendMessage()
    }
  }

  if (!isOpen) return null

  const isEmpty = messages.length === 0

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent
        className={`p-0 gap-0 flex flex-col rounded-2xl overflow-hidden border-border bg-background transition-all duration-300 ${
          isFullscreen
            ? "fixed inset-0 max-w-none w-full h-full rounded-none"
            : "sm:max-w-md max-h-[85vh] h-[500px] lg:max-h-[80vh] lg:h-[600px]"
        }`}
        showCloseButton={false}
        onInteractOutside={(e) => e.preventDefault()}
      >
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
              {/* Fullscreen toggle */}
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setIsFullscreen((v) => !v)}
                className="h-8 w-8 rounded-full hover:bg-muted"
                aria-label={isFullscreen ? "Exit fullscreen" : "Fullscreen"}
              >
                {isFullscreen ? (
                  <Minimize2 className="h-4 w-4 text-muted-foreground" />
                ) : (
                  <Maximize2 className="h-4 w-4 text-muted-foreground" />
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

        {/* Messages + Sidebar */}
        <div className="flex flex-1 overflow-hidden">
          {/* Main chat column */}
          <div
            ref={messagesContainerRef}
            className="flex-1 overflow-y-auto p-4 space-y-4 bg-background"
          >
            {isEmpty && (
              <div className="flex flex-col items-center justify-center h-full text-center">
                <div className="rounded-full bg-muted p-4 mb-4">
                  <Bot className="h-8 w-8 text-muted-foreground" />
                </div>
                <p className="text-sm font-medium text-foreground">How can I help you today?</p>
                <p className="text-xs text-muted-foreground mt-1">Ask me anything about your requests</p>

                {/* Quick action chips — shown inline when chat is empty */}
                <div className="mt-6 flex flex-col gap-2 w-full max-w-sm">
                  {QUICK_ACTIONS.map((action) => (
                    <button
                      key={action}
                      onClick={() => handleQuickAction(action)}
                      disabled={isTyping}
                      className="text-left text-xs px-3 py-2 rounded-xl border border-border bg-muted hover:bg-muted/80 text-foreground transition-colors disabled:opacity-50"
                    >
                      {action}
                    </button>
                  ))}
                </div>
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

          {/* Floating suggestion sidebar — only on large screens when messages exist */}
          {!isEmpty && (
            <aside className="hidden lg:flex flex-col gap-2 w-48 p-3 border-l border-border bg-card flex-shrink-0 overflow-y-auto">
              <p className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wide mb-1">
                Quick actions
              </p>
              {QUICK_ACTIONS.map((action) => (
                <button
                  key={action}
                  onClick={() => handleQuickAction(action)}
                  disabled={isTyping}
                  className="text-left text-xs px-2.5 py-2 rounded-lg border border-border bg-background hover:bg-muted text-foreground transition-colors disabled:opacity-50 leading-snug"
                >
                  {action}
                </button>
              ))}
            </aside>
          )}
        </div>

        {/* Input Area */}
        <div className="p-3 border-t border-border flex-shrink-0 bg-card">
          {/* Quick action chips row — mobile/tablet when messages exist */}
          {!isEmpty && (
            <div className="flex gap-1.5 mb-2 overflow-x-auto pb-1 lg:hidden">
              {QUICK_ACTIONS.map((action) => (
                <button
                  key={action}
                  onClick={() => handleQuickAction(action)}
                  disabled={isTyping}
                  className="flex-shrink-0 text-xs px-3 py-1.5 rounded-full border border-border bg-muted hover:bg-muted/80 text-foreground transition-colors disabled:opacity-50 whitespace-nowrap"
                >
                  {action}
                </button>
              ))}
            </div>
          )}

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
      </DialogContent>
    </Dialog>
  )
}
