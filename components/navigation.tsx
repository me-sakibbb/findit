"use client"

import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Search, Plus, MessageSquare, LogOut, User, Settings, Package, Users } from "lucide-react"
import { cn } from "@/lib/utils"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { useNavigation } from "@/hooks/use-navigation"

export function Navigation() {
  const {
    user,
    profile,
    searchQuery,
    setSearchQuery,
    handleSignOut,
    handleSearch,
    pathname
  } = useNavigation()

  return (
    <nav className="sticky top-0 z-50 border-b bg-background/95 backdrop-blur supports-backdrop-filter:bg-background/60 py-2">
      <div className="container mx-auto px-4">
        <div className="flex items-center gap-4 md:gap-6 h-16">
          <Link href="/" className="font-bold text-xl md:text-2xl hover:text-primary transition-colors shrink-0">
            FindIt
          </Link>

          <div className="flex items-center gap-3 ml-auto">
            <form
              onSubmit={handleSearch}
              className="group relative hidden md:block"
            >
              <div className="relative">
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="group-hover:opacity-0 group-focus-within:opacity-0 transition-opacity"
                >
                  <Search className="h-4 w-4" />
                </Button>
                <div
                  className="absolute right-0 top-0 opacity-0 group-hover:opacity-100 group-focus-within:opacity-100 transition-all duration-200 w-0 group-hover:w-64 group-focus-within:w-64 overflow-hidden"
                >
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
                    <Input
                      type="search"
                      placeholder="Search items..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="pl-10 h-9 w-64"
                    />
                  </div>
                </div>
              </div>
            </form>

            <Button
              variant="ghost"
              size="sm"
              asChild
              className={cn("hidden sm:flex text-base", pathname === "/items" && "bg-muted")}
            >
              <Link href="/items">
                <Package className="mr-2 h-4 w-4" />
                Items
              </Link>
            </Button>

            <Button
              variant="ghost"
              size="sm"
              asChild
              className={cn("hidden sm:flex text-base", pathname === "/people" && "bg-muted")}
            >
              <Link href="/people">
                <Users className="mr-2 h-4 w-4" />
                People
              </Link>
            </Button>

            <div className="flex items-center gap-3">
              {user ? (
                <>
                  <Button
                    variant="ghost"
                    size="sm"
                    asChild
                    className={cn("hidden md:flex text-base", pathname === "/messages" && "bg-muted")}
                  >
                    <Link href="/messages">
                      <MessageSquare className="mr-2 h-4 w-4" />
                      Messages
                    </Link>
                  </Button>
                  <Button size="sm" asChild className="text-base">
                    <Link href="/post">
                      <Plus className="mr-2 h-4 w-4" />
                      <span className="hidden sm:inline">Post Item</span>
                    </Link>
                  </Button>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" className="relative h-8 w-8 rounded-full">
                        <Avatar className="h-8 w-8">
                          <AvatarImage src={profile?.avatar_url} alt={profile?.display_name || user?.email} />
                          <AvatarFallback>
                            {profile?.display_name
                              ? profile.display_name.split(" ").map((n: string) => n[0]).join("").toUpperCase()
                              : user?.email?.[0]?.toUpperCase() || "?"}
                          </AvatarFallback>
                        </Avatar>
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent className="w-56" align="end" forceMount>
                      <DropdownMenuLabel className="font-normal">
                        <div className="flex flex-col space-y-1">
                          <p className="text-sm font-medium leading-none">
                            {profile?.display_name || profile?.full_name || "User"}
                          </p>
                          <p className="text-xs leading-none text-muted-foreground">
                            {user?.email}
                          </p>
                        </div>
                      </DropdownMenuLabel>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem asChild>
                        <Link href="/profile">
                          <User className="mr-2 h-4 w-4" />
                          <span>Profile</span>
                        </Link>
                      </DropdownMenuItem>
                      <DropdownMenuItem asChild>
                        <Link href="/saved">
                          <Package className="mr-2 h-4 w-4" />
                          <span>Saved Items</span>
                        </Link>
                      </DropdownMenuItem>
                      <DropdownMenuItem asChild>
                        <Link href="/profile">
                          <Settings className="mr-2 h-4 w-4" />
                          <span>Settings</span>
                        </Link>
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem onClick={handleSignOut}>
                        <LogOut className="mr-2 h-4 w-4" />
                        <span>Log out</span>
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </>
              ) : (
                <Button size="sm" asChild className="text-base">
                  <Link href="/auth/login">Sign In</Link>
                </Button>
              )}
            </div>
          </div>
        </div>
      </div>
    </nav>
  )
}
