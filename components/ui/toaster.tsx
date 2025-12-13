'use client'

// Legacy Toaster component - after migrating to Sonner we mount the
// Sonner <Toaster /> at the application root (app/layout). This component
// is kept as a no-op shim to avoid breaking references during the migration.
export function Toaster() {
  return null
}
