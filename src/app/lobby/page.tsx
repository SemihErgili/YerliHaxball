
"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { motion } from "framer-motion"
import { Crown, DoorOpen, Goal } from "lucide-react"

import type { UserProfile } from "@/lib/types"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { useToast } from "@/hooks/use-toast"
import { Skeleton } from "@/components/ui/skeleton"

export default function LobbyPage() {
  const router = useRouter()
  const { toast } = useToast()
  const [user, setUser] = useState<UserProfile | null>(null)
  const [roomCode, setRoomCode] = useState("")
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    try {
      const storedUser = localStorage.getItem("web-arena-user")
      if (storedUser) {
        setUser(JSON.parse(storedUser))
      } else {
        router.push("/")
        toast({
          variant: "destructive",
          title: "Profil bulunamadı!",
          description: "Lütfen önce bir karakter oluştur.",
        })
      }
    } catch (error) {
      router.push("/")
      toast({
        variant: "destructive",
        title: "Profil yüklenirken hata",
        description: "Verilerinizi yüklerken bir sorun oluştu.",
      })
    }
    setIsLoading(false)
  }, [router, toast])

  const handleCreateRoom = () => {
    const newRoomCode = Math.random().toString(36).substring(2, 8).toUpperCase()
    router.push(`/room/${newRoomCode}`)
  }

  const handleJoinRoom = (e: React.FormEvent) => {
    e.preventDefault()
    if (roomCode.trim().length === 6) {
      router.push(`/room/${roomCode.trim().toUpperCase()}`)
    } else {
      toast({
        variant: "destructive",
        title: "Geçersiz Oda Kodu",
        description: "Oda kodları 6 karakter uzunluğunda olmalıdır.",
      })
    }
  }
  
  if (isLoading || !user) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center p-4">
        <Card className="w-full max-w-4xl">
           <CardHeader>
              <Skeleton className="h-8 w-48" />
              <Skeleton className="h-4 w-64" />
           </CardHeader>
           <CardContent className="grid gap-8 md:grid-cols-2">
             <div className="space-y-4">
                <Skeleton className="h-10 w-full" />
                <Skeleton className="h-20 w-full" />
             </div>
             <div className="space-y-4">
                <Skeleton className="h-10 w-full" />
                <Skeleton className="h-20 w-full" />
             </div>
           </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-4xl"
      >
        <Card className="shadow-2xl">
          <CardHeader className="text-center">
            <div className="flex justify-center items-center gap-2 mb-2">
              <Goal className="h-8 w-8 text-primary" />
              <h1 className="text-3xl font-bold font-headline">Lobi</h1>
            </div>
            <p className="text-lg text-muted-foreground">
              Hoş geldin, <span className="font-semibold text-primary">{user.username}</span>!
            </p>
          </CardHeader>
          <CardContent className="grid gap-8 md:grid-cols-2 md:gap-12 p-8">
            <motion.div whileHover={{ y: -5 }}>
              <Card className="h-full flex flex-col">
                <CardHeader className="items-center text-center">
                  <Crown className="h-10 w-10 text-accent mb-2" />
                  <CardTitle className="text-2xl">Oda Oluştur</CardTitle>
                  <CardDescription>Yeni bir oyun başlat ve arkadaşlarını davet et.</CardDescription>
                </CardHeader>
                <CardContent className="flex-grow flex items-center justify-center">
                  <Button size="lg" onClick={handleCreateRoom} className="w-full max-w-xs bg-accent hover:bg-accent/90 text-accent-foreground">
                    Yeni Oda Oluştur
                  </Button>
                </CardContent>
              </Card>
            </motion.div>

            <motion.div whileHover={{ y: -5 }}>
              <Card className="h-full flex flex-col">
                <CardHeader className="items-center text-center">
                   <DoorOpen className="h-10 w-10 text-primary mb-2" />
                  <CardTitle className="text-2xl">Odaya Katıl</CardTitle>
                  <CardDescription>Mevcut bir oyuna katılmak için oda kodunu gir.</CardDescription>
                </CardHeader>
                <CardContent className="flex-grow flex items-center justify-center">
                  <form onSubmit={handleJoinRoom} className="w-full max-w-xs space-y-4">
                    <Input
                      placeholder="6 haneli kodu gir"
                      value={roomCode}
                      onChange={(e) => setRoomCode(e.target.value)}
                      className="text-center text-lg tracking-widest"
                      maxLength={6}
                    />
                    <Button type="submit" size="lg" className="w-full">
                      Oyuna Katıl
                    </Button>
                  </form>
                </CardContent>
              </Card>
            </motion.div>
          </CardContent>
        </Card>
      </motion.div>
    </main>
  )
}
