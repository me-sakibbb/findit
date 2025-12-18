import { createBrowserClient } from "@/lib/supabase/client"

interface SendNotificationParams {
    userId: string
    type: "comment" | "claim" | "status_change" | "system"
    title: string
    message: string
    link?: string
    metadata?: any
}

export async function sendNotification({
    userId,
    type,
    title,
    message,
    link,
    metadata
}: SendNotificationParams) {
    const supabase = createBrowserClient()

    try {
        const { data, error } = await supabase.functions.invoke('send-notification', {
            body: {
                user_id: userId,
                type,
                title,
                message,
                link,
                metadata
            }
        })

        if (error) throw error
        return data
    } catch (error) {
        console.error("Error sending notification:", error)
        // We don't want to block the UI if notification fails
        return null
    }
}
