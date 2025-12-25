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
import { Input } from "@/components/ui/input"
import { deleteCategory, addCategory } from "@/app/(admin)/actions"
import { useTransition, useState } from "react"
import { toast } from "sonner"
import { Trash2, Plus } from "lucide-react"

interface CategoriesTableProps {
    categories: any[]
}

export function CategoriesTable({ categories }: CategoriesTableProps) {
    const [isPending, startTransition] = useTransition()
    const [newCategory, setNewCategory] = useState("")

    const handleDelete = (categoryId: string) => {
        if (!confirm("Are you sure you want to delete this category?")) return

        startTransition(async () => {
            try {
                await deleteCategory(categoryId)
                toast.success("Category deleted")
            } catch (error) {
                toast.error("Failed to delete category")
            }
        })
    }

    const handleAdd = () => {
        if (!newCategory.trim()) return

        startTransition(async () => {
            try {
                await addCategory(newCategory)
                setNewCategory("")
                toast.success("Category added")
            } catch (error) {
                toast.error("Failed to add category")
            }
        })
    }

    return (
        <div className="space-y-4">
            <div className="flex items-center gap-2">
                <Input
                    placeholder="New category name"
                    value={newCategory}
                    onChange={(e) => setNewCategory(e.target.value)}
                    className="max-w-sm"
                />
                <Button onClick={handleAdd} disabled={isPending || !newCategory.trim()}>
                    <Plus className="mr-2 h-4 w-4" />
                    Add Category
                </Button>
            </div>

            <div className="rounded-md border bg-card">
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Name</TableHead>
                            <TableHead>Created At</TableHead>
                            <TableHead className="text-right">Actions</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {categories.map((category) => (
                            <TableRow key={category.id}>
                                <TableCell className="font-medium capitalize">
                                    {category.name}
                                </TableCell>
                                <TableCell>
                                    {new Date(category.created_at).toLocaleDateString()}
                                </TableCell>
                                <TableCell className="text-right">
                                    <Button
                                        variant="ghost"
                                        size="icon"
                                        onClick={() => handleDelete(category.id)}
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
        </div>
    )
}
