"use server"

import { createClient } from "@/lib/supabase/server"
import { revalidatePath } from "next/cache"

export async function updateUserRole(userId: string, role: "user" | "admin") {
    const supabase = await createClient()

    // Check if current user is admin
    const {
        data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
        throw new Error("Unauthorized")
    }

    const { data: currentUserProfile } = await supabase
        .from("profiles")
        .select("role")
        .eq("id", user.id)
        .single()

    if (currentUserProfile?.role !== "admin") {
        throw new Error("Unauthorized: Admin access required")
    }

    const { error } = await supabase
        .from("profiles")
        .update({ role })
        .eq("id", userId)

    if (error) {
        throw new Error(error.message)
    }

    revalidatePath("/admin/users")
}

export async function deleteItem(itemId: string) {
    const supabase = await createClient()

    // Check admin
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) throw new Error("Unauthorized")

    const { data: profile } = await supabase
        .from("profiles")
        .select("role")
        .eq("id", user.id)
        .single()

    if (profile?.role !== "admin") throw new Error("Unauthorized")

    const { error } = await supabase
        .from("items")
        .delete()
        .eq("id", itemId)

    if (error) throw new Error(error.message)

    revalidatePath("/admin/items")
}

export async function deleteCategory(categoryId: string) {
    const supabase = await createClient()

    // Check admin
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) throw new Error("Unauthorized")

    const { data: profile } = await supabase
        .from("profiles")
        .select("role")
        .eq("id", user.id)
        .single()

    if (profile?.role !== "admin") throw new Error("Unauthorized")

    const { error } = await supabase
        .from("categories")
        .delete()
        .eq("id", categoryId)

    if (error) throw new Error(error.message)

    revalidatePath("/admin/categories")
}

export async function updateClaimStatus(claimId: string, status: "approved" | "rejected" | "pending") {
    const supabase = await createClient()

    // Check admin
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) throw new Error("Unauthorized")

    const { data: profile } = await supabase
        .from("profiles")
        .select("role")
        .eq("id", user.id)
        .single()

    if (profile?.role !== "admin") throw new Error("Unauthorized")

    const { error } = await supabase
        .from("claims")
        .update({ status })
        .eq("id", claimId)

    if (error) throw new Error(error.message)

    revalidatePath("/admin/claims")
}

export async function addCategory(name: string) {
    const supabase = await createClient()

    // Check admin
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) throw new Error("Unauthorized")

    const { data: profile } = await supabase
        .from("profiles")
        .select("role")
        .eq("id", user.id)
        .single()

    if (profile?.role !== "admin") throw new Error("Unauthorized")

    const { error } = await supabase
        .from("categories")
        .insert({ name })

    if (error) throw new Error(error.message)

    revalidatePath("/admin/categories")
}
