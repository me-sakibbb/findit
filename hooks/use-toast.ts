"use client"

// Shim for legacy useToast: forward to Sonner's toast API.
import { toast as sonnerToast } from "sonner"

// Provide a minimal useToast hook so existing imports won't break during
// the migration. This simply forwards calls to Sonner.
export function useToast() {
  return {
    toasts: [],
    toast: (props: any) => {
      const title = props?.title || ""
      const description = props?.description
      const variant = props?.variant

      if (variant === "destructive") {
        return sonnerToast.error(title || description || "Error", { description })
      }
      if (variant === "warning") {
        return sonnerToast.warning(title || description || "", { description })
      }
      if (variant === "success") {
        return sonnerToast.success(title || description || "", { description })
      }

      // Default: treat as success per user preference
      return sonnerToast.success(title || description || "", { description })
    },
    dismiss: (_id?: string) => undefined,
  }
}

export const toast = (props: any) => {
  const { title, description, variant } = props || {}
  if (variant === "destructive") return sonnerToast.error(title || description || "Error", { description })
  if (variant === "warning") return sonnerToast.warning(title || description || "", { description })
  if (variant === "success") return sonnerToast.success(title || description || "", { description })
  return sonnerToast.success(title || description || "", { description })
}
