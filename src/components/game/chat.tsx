"use client"

import { useState, useRef, useEffect } from "react"
import { Send } from "lucide-react"

import type { Message } from "@/lib/types"
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"

interface ChatProps {
  messages: Message[]
  onSendMessage: (text: string) => void
}

export function Chat({ messages, onSendMessage }: ChatProps) {
  const [newMessage, setNewMessage] = useState("")
  const scrollAreaRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (scrollAreaRef.current) {
        const scrollableView = scrollAreaRef.current.querySelector('div[data-radix-scroll-area-viewport]');
        if(scrollableView) {
            scrollableView.scrollTop = scrollableView.scrollHeight;
        }
    }
  }, [messages])

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (newMessage.trim()) {
      onSendMessage(newMessage.trim())
      setNewMessage("")
    }
  }

  return (
    <Card className="h-full w-full flex flex-col shadow-lg">
      <CardHeader>
        <CardTitle className="font-headline">Chat Room</CardTitle>
      </CardHeader>
      <CardContent className="flex-grow overflow-hidden">
        <ScrollArea className="h-full pr-4" ref={scrollAreaRef}>
          <div className="space-y-4">
            {messages.map(message => (
              <div
                key={message.id}
                className={`flex items-start gap-2 ${
                  message.playerId === "system" ? "justify-center" : ""
                }`}
              >
                {message.playerId !== "system" && (
                    <Avatar className="h-8 w-8">
                        <AvatarFallback style={{ backgroundColor: message.playerColor, color: '#fff', fontSize: '0.8rem', fontWeight: 'bold' }}>
                        {message.playerName.substring(0, 2).toUpperCase()}
                        </AvatarFallback>
                    </Avatar>
                )}
                <div className={`flex flex-col ${message.playerId === "system" ? "items-center" : ""}`}>
                  {message.playerId !== "system" && (
                    <p className="font-semibold text-sm" style={{ color: message.playerColor }}>{message.playerName}</p>
                  )}
                  <div className={`p-2 rounded-lg text-sm ${message.playerId === "system" ? "text-muted-foreground italic text-center" : "bg-muted"}`}>
                    <p>{message.text}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </ScrollArea>
      </CardContent>
      <CardFooter>
        <form onSubmit={handleSubmit} className="flex w-full items-center space-x-2">
          <Input
            value={newMessage}
            onChange={e => setNewMessage(e.target.value)}
            placeholder="Type a message..."
            autoComplete="off"
          />
          <Button type="submit" size="icon">
            <Send className="h-4 w-4" />
          </Button>
        </form>
      </CardFooter>
    </Card>
  )
}
