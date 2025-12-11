import { redirect } from "next/navigation"
import { createServerClient } from "@/lib/supabase/server"

import { MessageList } from "@/components/message-list"
import { MessageThread } from "@/components/message-thread"

interface MessagesPageProps {
  searchParams: Promise<{
    item?: string
    user?: string
    thread?: string
  }>
}

export default async function MessagesPage({ searchParams }: MessagesPageProps) {
  const supabase = await createServerClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect("/auth/login")
  }

  const params = await searchParams

  return (
    <div className="min-h-svh flex flex-col">
      
      <main className="flex-1">
        <div className="container py-8 max-w-7xl">
          <div className="mb-6">
            <h1 className="text-3xl font-bold">Messages</h1>
            <p className="text-muted-foreground">Connect with people about lost and found items</p>
          </div>

          <div className="grid lg:grid-cols-[350px_1fr] gap-6 h-[calc(100vh-250px)]">
            <MessageList userId={user.id} activeThreadId={params.thread} />
            <MessageThread userId={user.id} threadId={params.thread} itemId={params.item} recipientId={params.user} />
          </div>
        </div>
      </main>
    </div>
  )
}
