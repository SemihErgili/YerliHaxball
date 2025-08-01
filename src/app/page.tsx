
"use client"

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import { z } from "zod"
import { motion } from "framer-motion"

import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form"
import { Goal } from 'lucide-react'
import { useToast } from '@/hooks/use-toast'

const formSchema = z.object({
  username: z.string().min(2, "Kullanıcı adı en az 2 karakter olmalı.").max(20, "Kullanıcı adı en fazla 20 karakter olabilir."),
})

export default function Home() {
  const router = useRouter()
  const { toast } = useToast()
  
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      username: "",
    },
  })

  function onSubmit(values: z.infer<typeof formSchema>) {
    try {
      // Color is no longer needed, we assign teams in the room
      const userProfile = { username: values.username, color: '' };
      localStorage.setItem("web-arena-user", JSON.stringify(userProfile))
      toast({
        title: "Profil kaydedildi!",
        description: `Arenaya hoş geldin, ${values.username}!`,
      })
      router.push('/lobby')
    } catch (error) {
       toast({
        variant: "destructive",
        title: "Eyvah! Bir şeyler ters gitti.",
        description: "Profilin kaydedilemedi. Lütfen localStorage'ı etkinleştir.",
      })
    }
  }

  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-4">
       <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <Card className="w-full max-w-md shadow-2xl">
          <CardHeader className="text-center">
            <div className="flex justify-center items-center gap-2 mb-2">
              <Goal className="h-8 w-8 text-primary" />
              <h1 className="text-3xl font-bold font-headline">Yerli Haxball</h1>
            </div>
            <CardDescription>Sahaya çıkmak için karakterini oluştur</CardDescription>
          </CardHeader>
          <CardContent>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
                <FormField
                  control={form.control}
                  name="username"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Kullanıcı Adı</FormLabel>
                      <FormControl>
                        <Input placeholder="Savaşçı adını gir" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <Button type="submit" className="w-full bg-accent hover:bg-accent/90">
                  Arenaya Gir
                </Button>
              </form>
            </Form>
          </CardContent>
          <CardFooter>
            <p className="text-xs text-muted-foreground text-center w-full">
              Profilin bu cihaza kaydedilir.
            </p>
          </CardFooter>
        </Card>
      </motion.div>
    </main>
  )
}
