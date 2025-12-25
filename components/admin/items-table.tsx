"use client"

import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Item } from "@/lib/types"
import { deleteItem } from "@/app/(admin)/actions"
import { useTransition } from "react"
import { toast } from "sonner"
import { Trash2, ExternalLink } from "lucide-react"
import Link from "next/link"

interface ItemsTableProps {
    items: Item[]
}

export function ItemsTable({ items }: ItemsTableProps) {
    const [isPending, startTransition] = useTransition()

    const handleDelete = (itemId: string) => {
        if (!confirm("Are you sure you want to delete this item?")) return

        startTransition(async () => {
            try {
                await deleteItem(itemId)
                toast.success("Item deleted")
            } catch (error) {
                toast.error("Failed to delete item")
            }
        })
    }

    return (
        <div className="rounded-md border bg-card">
            <Table>
                <TableHeader>
                    <TableRow>
                        <TableHead>Title</TableHead>
                        <TableHead>Category</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Location</TableHead>
                        <TableHead>Posted By</TableHead>
                        <TableHead>Date</TableHead>
                        <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {items.map((item) => (
                        <TableRow key={item.id}>
                            <TableCell className="font-medium">
                                <Link
                                    href={`/items/${item.id}`}
                                    className="flex items-center gap-2 hover:underline"
                                    target="_blank"
                                >
                                    {item.title}
                                    <ExternalLink className="h-3 w-3" />
                                </Link>
                            </TableCell>
                            <TableCell className="capitalize">{item.category}</TableCell>
                            <TableCell>
                                <Badge
                                    variant={item.status === "lost" ? "destructive" : "default"}
                                >
                                    {item.status}
                                </Badge>
                            </TableCell>
                            <TableCell>{item.location}</TableCell>
                            <TableCell>
                                {item.profiles?.full_name || item.profiles?.email || "Unknown"}
                            </TableCell>
                            <TableCell>
                                {new Date(item.created_at).toLocaleDateString()}
                            </TableCell>
                            <TableCell className="text-right">
                                <Button
                                    variant="ghost"
                                    size="icon"
                                    onClick={() => handleDelete(item.id)}
                                    disabled={isPending}
                                    className="text-destructive hover:bg-destructive/10 hover:text-destructive"
                                >
                                    <Trash2 className="h-4 w-4" />
                                </Button>
                            </TableCell>
                        </TableRow>
                    ))}
                </TableBody>
            </Table>
        </div>
    )
}
