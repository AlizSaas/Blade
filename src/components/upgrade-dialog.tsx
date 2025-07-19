"use client"

import { useState } from "react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Check, Crown, Zap, MessageSquare, BarChart3 } from "lucide-react"

interface UpgradeDialogProps {
  checkoutUrl: string
}

export default function UpgradeDialog({ checkoutUrl }: UpgradeDialogProps) {
  const [isOpen, setIsOpen] = useState(false)

  const features = [
    {
      icon: <MessageSquare className="h-4 w-4" />,
      title: "Unlimited Conversations",
      description: "No limits on customer interactions",
    },
    {
      icon: <BarChart3 className="h-4 w-4" />,
      title: "Advanced Analytics",
      description: "Detailed insights and performance metrics",
    },
    {
      icon: <Zap className="h-4 w-4" />,
      title: "Priority Support",
      description: "Get help when you need it most",
    },
    {
      icon: <Crown className="h-4 w-4" />,
      title: "Premium Features",
      description: "Access to all advanced tools and integrations",
    },
  ]

  const handleUpgrade = () => {
    window.location.href = checkoutUrl
  }

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button
          variant="outline"
          className="w-full mt-4 border-dashed border-2 hover:border-primary/50 transition-colors bg-transparent"
        >
          <Crown className="h-4 w-4 mr-2" />
          Upgrade to Premium to use AI Chatbot
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto mx-auto">
        <DialogHeader className="text-center">
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
            <Crown className="h-6 w-6 text-primary" />
          </div>
          <DialogTitle className="text-2xl font-bold">Upgrade to Premium to use AI Chatbot</DialogTitle>
          <DialogDescription className="text-base">
            Unlock powerful features to grow your business and enhance customer experience. 
          </DialogDescription>
        </DialogHeader>

        <div className="py-6">
          <div className="mb-6 text-center">
            <Badge variant="secondary" className="mb-2">
              Limited Time Offer
            </Badge>
            <div className="text-3xl font-bold">
              $9.99<span className="text-lg font-normal text-muted-foreground">/month</span>
            </div>
            <p className="text-sm text-muted-foreground">Billed monthly, cancel anytime</p>
          </div>

          <div className="space-y-4">
            <h4 className="font-semibold text-sm uppercase tracking-wide text-muted-foreground">What&apos;s included:</h4>
            {features.map((feature, index) => (
              <div key={index} className="flex items-start gap-3">
                <div className="flex-shrink-0 mt-0.5">
                  <div className="flex h-5 w-5 items-center justify-center rounded-full bg-green-100 dark:bg-green-900/20">
                    <Check className="h-3 w-3 text-green-600 dark:text-green-400" />
                  </div>
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    {feature.icon}
                    <p className="font-medium text-sm">{feature.title}</p>
                  </div>
                  <p className="text-sm text-muted-foreground">{feature.description}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        <DialogFooter className="flex-col sm:flex-col gap-2">
          <Button
            onClick={handleUpgrade}
            className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
            size="lg"
          >
            <Crown className="h-4 w-4 mr-2" />
            Upgrade Now
          </Button>
          <Button variant="ghost" onClick={() => setIsOpen(false)} className="w-full">
            Maybe Later
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
