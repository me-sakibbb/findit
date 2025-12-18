"use client"

import { useState } from "react"
import { Bell, Check, MessageCircle, AlertCircle, Info, Heart, UserPlus } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "@/components/ui/popover"
import { ScrollArea } from "@/components/ui/scroll-area"
import { useNotifications } from "@/hooks/use-notifications"
import { cn } from "@/lib/utils"
import Link from "next/link"
import { formatDistanceToNow } from "date-fns"

interface NotificationBellProps {
    userId?: string
}

const getNotificationIcon = (type: string) => {
    switch (type) {
        case 'comment':
            return <MessageCircle className="h-4 w-4 text-blue-500" />
        case 'claim':
            return <AlertCircle className="h-4 w-4 text-yellow-500" />
        case 'status_change':
            return <Info className="h-4 w-4 text-green-500" />
        case 'like':
            return <Heart className="h-4 w-4 text-red-500" />
        case 'follow':
            return <UserPlus className="h-4 w-4 text-purple-500" />
        default:
            return <Bell className="h-4 w-4 text-gray-500" />
    }
}

export function NotificationBell({ userId }: NotificationBellProps) {
    const [open, setOpen] = useState(false)
    const { notifications, unreadCount, loading, markAsRead, markAllAsRead } = useNotifications(userId)

    if (!userId) return null

    return (
        <Popover open={open} onOpenChange={setOpen}>
            <PopoverTrigger asChild>
                <Button variant="ghost" size="icon" className="relative">
                    <Bell className="h-5 w-5" />
                    {unreadCount > 0 && (
                        <span className="absolute top-1.5 right-1.5 h-2.5 w-2.5 rounded-full bg-red-600 ring-2 ring-background" />
                    )}
                    <span className="sr-only">Notifications</span>
                </Button>
            </PopoverTrigger>
            <PopoverContent className="w-80 p-0" align="end">
                <div className="flex items-center justify-between p-4 border-b">
                    <h4 className="font-semibold">Notifications</h4>
                    {unreadCount > 0 && (
                        <Button
                            variant="ghost"
                            size="sm"
                            className="text-xs h-auto py-1 px-2"
                            onClick={() => markAllAsRead()}
                        >
                            Mark all read
                        </Button>
                    )}
                </div>
                <ScrollArea className="h-[300px]">
                    {loading ? (
                        <div className="p-4 text-center text-sm text-muted-foreground">Loading...</div>
                    ) : notifications.length === 0 ? (
                        <div className="p-8 text-center text-sm text-muted-foreground">
                            No notifications yet
                        </div>
                    ) : (
                        <div className="divide-y">
                            {notifications.map((notification) => (
                                <div
                                    key={notification.id}
                                    className={cn(
                                        "p-4 hover:bg-muted/50 transition-colors relative group",
                                        !notification.is_read && "bg-muted/20"
                                    )}
                                >
                                    <div className="flex gap-3">
                                        <div className="mt-1 shrink-0">
                                            {getNotificationIcon(notification.type)}
                                        </div>
                                        <div className="flex-1 space-y-1">
                                            <p className={cn("text-sm font-medium leading-none", !notification.is_read && "font-semibold")}>
                                                {notification.title}
                                            </p>
                                            <p className="text-sm text-muted-foreground line-clamp-2">
                                                {notification.message}
                                            </p>
                                            <p className="text-xs text-muted-foreground pt-1">
                                                {formatDistanceToNow(new Date(notification.created_at), { addSuffix: true })}
                                            </p>
                                        </div>
                                        {!notification.is_read && (
                                            <div className="flex flex-col justify-center">
                                                <div className="h-2 w-2 rounded-full bg-blue-600" />
                                            </div>
                                        )}
                                    </div>

                                    {notification.link && (
                                        <Link
                                            href={notification.link}
                                            className="absolute inset-0"
                                            onClick={() => {
                                                markAsRead(notification.id)
                                                setOpen(false)
                                            }}
                                        />
                                    )}
                                </div>
                            ))}
                        </div>
                    )}
                </ScrollArea>
            </PopoverContent>
        </Popover>
    )
}
