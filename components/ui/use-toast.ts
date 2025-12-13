'use client'

// Minimal shim for the legacy UI toast store. We forward to Sonner so that
// calls to the old API continue to work during migration. The app root mounts
// Sonner's Toaster component, so this doesn't render anything by itself.
import { toast as sonnerToast } from 'sonner'

export function useToast() {
  return {
    toasts: [],
    toast: (props: any) => {
      const { title, description, variant } = props || {}
      if (variant === 'destructive') return sonnerToast.error(title || description || 'Error', { description })
      if (variant === 'warning') return sonnerToast.warning(title || description || '', { description })
      if (variant === 'success') return sonnerToast.success(title || description || '', { description })
      return sonnerToast.success(title || description || '', { description })
    },
    dismiss: () => undefined,
  }
}

export const toast = (props: any) => {
  const { title, description, variant } = props || {}
  if (variant === 'destructive') return sonnerToast.error(title || description || 'Error', { description })
  if (variant === 'warning') return sonnerToast.warning(title || description || '', { description })
  if (variant === 'success') return sonnerToast.success(title || description || '', { description })
  return sonnerToast.success(title || description || '', { description })
}
