"use client"

import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table"
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Profile } from "@/lib/types"
import { updateUserRole } from "@/app/(admin)/actions"
import { useTransition } from "react"
import { toast } from "sonner"

interface UsersTableProps {
    users: Profile[]
}

export function UsersTable({ users }: UsersTableProps) {
    const [isPending, startTransition] = useTransition()

    const handleRoleChange = (userId: string, newRole: "user" | "admin") => {
        startTransition(async () => {
            try {
                await updateUserRole(userId, newRole)
                toast.success("User role updated")
            } catch (error) {
                toast.error("Failed to update user role")
            }
        })
    }

    return (
        <div className="rounded-md border bg-card">
            <Table>
                <TableHeader>
                    <TableRow>
                        <TableHead>User</TableHead>
                        <TableHead>Email</TableHead>
                        <TableHead>Role</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Joined</TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {users.map((user) => (
                        <TableRow key={user.id}>
                            <TableCell className="flex items-center gap-3">
                                <Avatar>
                                    <AvatarImage src={user.avatar_url || ""} />
                                    <AvatarFallback>
                                        {user.full_name?.slice(0, 2).toUpperCase() || "U"}
                                    </AvatarFallback>
                                </Avatar>
                                <div className="flex flex-col">
                                    <span className="font-medium">{user.full_name || "N/A"}</span>
                                    <span className="text-xs text-muted-foreground">
                                        {user.display_name}
                                    </span>
                                </div>
                            </TableCell>
                            <TableCell>{user.email}</TableCell>
                            <TableCell>
                                <Select
                                    defaultValue={user.role || "user"}
                                    onValueChange={(value) =>
                                        handleRoleChange(user.id, value as "user" | "admin")
                                    }
                                    disabled={isPending}
                                >
                                    <SelectTrigger className="w-24">
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="user">User</SelectItem>
                                        <SelectItem value="admin">Admin</SelectItem>
                                    </SelectContent>
                                </Select>
                            </TableCell>
                            <TableCell>
                                <Badge variant={user.is_onboarded ? "default" : "secondary"}>
                                    {user.is_onboarded ? "Active" : "Pending"}
                                </Badge>
                            </TableCell>
                            <TableCell>
                                {new Date(user.created_at).toLocaleDateString()}
                            </TableCell>
                        </TableRow>
                    ))}
                </TableBody>
            </Table>
        </div>
    )
}
