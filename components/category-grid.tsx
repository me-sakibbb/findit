"use client"

import Link from "next/link"
import {
    Smartphone,
    Watch,
    FileText,
    Key,
    Briefcase,
    Shirt,
    PawPrint,
    MoreHorizontal
} from "lucide-react"

const categories = [
    { id: "electronics", name: "Electronics", icon: Smartphone, color: "bg-blue-500/10 text-blue-500" },
    { id: "accessories", name: "Accessories", icon: Watch, color: "bg-purple-500/10 text-purple-500" },
    { id: "documents", name: "Documents", icon: FileText, color: "bg-amber-500/10 text-amber-500" },
    { id: "keys", name: "Keys", icon: Key, color: "bg-green-500/10 text-green-500" },
    { id: "bags", name: "Bags", icon: Briefcase, color: "bg-rose-500/10 text-rose-500" },
    { id: "clothing", name: "Clothing", icon: Shirt, color: "bg-cyan-500/10 text-cyan-500" },
    { id: "pets", name: "Pets", icon: PawPrint, color: "bg-orange-500/10 text-orange-500" },
    { id: "other", name: "Other", icon: MoreHorizontal, color: "bg-gray-500/10 text-gray-500" },
]

export function CategoryGrid() {
    return (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            {categories.map((category) => {
                const Icon = category.icon
                return (
                    <Link
                        key={category.id}
                        href={`/items?category=${category.id}`}
                        className="group flex flex-col items-center gap-3 p-6 rounded-xl bg-card border hover:border-primary/50 hover:shadow-lg transition-all duration-200"
                    >
                        <div className={`p-4 rounded-xl ${category.color} group-hover:scale-110 transition-transform`}>
                            <Icon className="w-6 h-6" />
                        </div>
                        <span className="font-medium text-sm">{category.name}</span>
                    </Link>
                )
            })}
        </div>
    )
}
