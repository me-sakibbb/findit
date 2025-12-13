import { useState, useEffect } from "react"

export interface UserProfile {
  id: string
  full_name: string
  display_name: string
  avatar_url: string | null
}

interface UseUserSearchProps {
  value?: string
  onSelect: (userId: string | null) => void
}

export function useUserSearch({ value, onSelect }: UseUserSearchProps) {
  const [open, setOpen] = useState(false)
  const [users, setUsers] = useState<UserProfile[]>([])
  const [searchQuery, setSearchQuery] = useState("")
  const [selectedUser, setSelectedUser] = useState<UserProfile | null>(null)

  useEffect(() => {
    const fetchUsers = async () => {
      if (searchQuery.length < 2) {
        setUsers([])
        return
      }

      try {
        const response = await fetch(`/api/users/search?q=${searchQuery}`)
        const data = await response.json()
        setUsers(data)
      } catch (error) {
        console.error("[v0] Error fetching users:", error)
      }
    }

    const debounce = setTimeout(() => {
      fetchUsers()
    }, 300)

    return () => clearTimeout(debounce)
  }, [searchQuery])

  const handleSelect = (user: UserProfile) => {
    setSelectedUser(user)
    onSelect(user.id)
    setOpen(false)
  }

  const handleClear = () => {
    setSelectedUser(null)
    onSelect(null)
    setSearchQuery("")
  }

  return {
    open,
    setOpen,
    users,
    searchQuery,
    setSearchQuery,
    selectedUser,
    handleSelect,
    handleClear
  }
}
