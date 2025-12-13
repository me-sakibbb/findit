"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"

interface UsePeopleSearchProps {
  initialFilters: {
    query: string
    city: string
    state: string
  }
}

export function usePeopleSearch({ initialFilters }: UsePeopleSearchProps) {
  const router = useRouter()
  const [query, setQuery] = useState(initialFilters.query)
  const [city, setCity] = useState(initialFilters.city)
  const [state, setState] = useState(initialFilters.state)

  const handleSearch = () => {
    const params = new URLSearchParams()
    if (query) params.set("query", query)
    if (city) params.set("city", city)
    if (state) params.set("state", state)
    
    router.push(`/people?${params.toString()}`)
  }

  const clearFilters = () => {
    setQuery("")
    setCity("")
    setState("")
    router.push("/people")
  }

  const hasActiveFilters = query || city || state

  return {
    query,
    setQuery,
    city,
    setCity,
    state,
    setState,
    handleSearch,
    clearFilters,
    hasActiveFilters,
  }
}
