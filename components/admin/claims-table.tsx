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
import { Badge } from "@/components/ui/badge"
import { updateClaimStatus } from "@/app/(admin)/actions"
import { useTransition } from "react"
import { toast } from "sonner"
import { ExternalLink } from "lucide-react"
import Link from "next/link"

interface ClaimsTableProps {
    claims: any[]
}

export function ClaimsTable({ claims }: ClaimsTableProps) {
    const [isPending, startTransition] = useTransition()

    const handleStatusChange = (claimId: string, newStatus: string) => {
        startTransition(async () => {
            try {
                await updateClaimStatus(claimId, newStatus as any)
                toast.success("Claim status updated")
            } catch (error) {
                toast.error("Failed to update claim status")
            }
        })
    }

    return (
        <div className="rounded-md border bg-card">
            <Table>
                <TableHeader>
                    <TableRow>
                        <TableHead>Item</TableHead>
                        <TableHead>Claimant</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>AI Verdict</TableHead>
                        <TableHead>Date</TableHead>
                        <TableHead>Actions</TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {claims.map((claim) => (
                        <TableRow key={claim.id}>
                            <TableCell className="font-medium">
                                <Link
                                    href={`/items/${claim.item_id}`}
                                    className="flex items-center gap-2 hover:underline"
                                    target="_blank"
                                >
                                    {claim.items?.title || "Unknown Item"}
                                    <ExternalLink className="h-3 w-3" />
                                </Link>
                            </TableCell>
                            <TableCell>
                                <div className="flex flex-col">
                                    <span className="font-medium">
                                        {claim.profiles?.full_name || "Unknown"}
                                    </span>
                                    <span className="text-xs text-muted-foreground">
                                        {claim.profiles?.email}
                                    </span>
                                </div>
                            </TableCell>
                            <TableCell>
                                <Badge
                                    variant={
                                        claim.status === "approved"
                                            ? "default"
                                            : claim.status === "rejected"
                                                ? "destructive"
                                                : "secondary"
                                    }
                                >
                                    {claim.status}
                                </Badge>
                            </TableCell>
                            <TableCell>
                                <span className="text-sm text-muted-foreground">
                                    {claim.ai_verdict || "N/A"}
                                </span>
                            </TableCell>
                            <TableCell>
                                {new Date(claim.created_at).toLocaleDateString()}
                            </TableCell>
                            <TableCell>
                                <Select
                                    defaultValue={claim.status}
                                    onValueChange={(value) => handleStatusChange(claim.id, value)}
                                    disabled={isPending}
                                >
                                    <SelectTrigger className="w-32">
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="pending">Pending</SelectItem>
                                        <SelectItem value="approved">Approved</SelectItem>
                                        <SelectItem value="rejected">Rejected</SelectItem>
                                    </SelectContent>
                                </Select>
                            </TableCell>
                        </TableRow>
                    ))}
                </TableBody>
            </Table>
        </div>
    )
}
