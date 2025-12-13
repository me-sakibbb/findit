"use client"

import { Button } from "@/components/ui/button"
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { User, Check } from "lucide-react"
import { cn } from "@/lib/utils"
import { useUserSearch, UserProfile } from "@/hooks/use-user-search"

interface UserSearchProps {
  value?: string
  onSelect: (userId: string | null) => void
}

export function UserSearch({ value, onSelect }: UserSearchProps) {
  const {
    open,
    setOpen,
    users,
    searchQuery,
    setSearchQuery,
    selectedUser,
    handleSelect,
    handleClear
  } = useUserSearch({ value, onSelect })

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button variant="outline" className="w-full justify-start text-left font-normal bg-transparent">
          <User className="mr-2 h-4 w-4" />
          {selectedUser ? selectedUser.display_name || selectedUser.full_name : "Search users..."}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[300px] p-0" align="start">
        <Command>
          <CommandInput placeholder="Type to search users..." value={searchQuery} onValueChange={setSearchQuery} />
          <CommandList>
            <CommandEmpty>{searchQuery.length < 2 ? "Type at least 2 characters..." : "No users found."}</CommandEmpty>
            <CommandGroup>
              {users.map((user) => (
                <CommandItem key={user.id} onSelect={() => handleSelect(user)} className="cursor-pointer">
                  <Check className={cn("mr-2 h-4 w-4", selectedUser?.id === user.id ? "opacity-100" : "opacity-0")} />
                  <div className="flex items-center gap-2">
                    {user.avatar_url ? (
                      <img
                        src={user.avatar_url || "/placeholder.svg"}
                        alt={user.display_name || user.full_name}
                        className="h-6 w-6 rounded-full object-cover"
                      />
                    ) : (
                      <div className="h-6 w-6 rounded-full bg-muted flex items-center justify-center">
                        <User className="h-3 w-3" />
                      </div>
                    )}
                    <div className="flex flex-col">
                      <span className="font-medium text-sm">{user.display_name || user.full_name}</span>
                      {user.display_name && <span className="text-xs text-muted-foreground">{user.full_name}</span>}
                    </div>
                  </div>
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  )
}
