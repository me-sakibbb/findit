import { redirect } from "next/navigation"
import { createServerClient } from "@/lib/supabase/server"
import Link from "next/link"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { SearchX, Package } from "lucide-react"

export default async function PostPage() {
  const supabase = await createServerClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect("/auth/login")
  }

  return (
    <div className="container mx-auto px-4 py-8 md:py-12">
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-8 md:mb-12">
          <h1 className="text-3xl md:text-4xl font-bold mb-3">Post an Item</h1>
          <p className="text-lg text-muted-foreground">
            Choose whether you've lost an item or found something that belongs to someone else
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-6">
          <Link href="/post/lost" className="block group">
            <Card className="h-full transition-all hover:shadow-lg hover:border-teal-500">
              <CardHeader className="text-center pb-4">
                <div className="mx-auto mb-4 p-4 bg-red-100 dark:bg-red-950 rounded-full w-fit group-hover:scale-110 transition-transform">
                  <SearchX className="h-12 w-12 text-red-600 dark:text-red-400" />
                </div>
                <CardTitle className="text-2xl">I Lost Something</CardTitle>
                <CardDescription className="text-base">
                  Report an item you've lost and get help finding it
                </CardDescription>
              </CardHeader>
              <CardContent className="text-center">
                <Button className="w-full" size="lg" variant="destructive">
                  Post Lost Item
                </Button>
                <p className="text-sm text-muted-foreground mt-4">
                  Describe what you lost, where, and when. We'll help you find it.
                </p>
              </CardContent>
            </Card>
          </Link>

          <Link href="/post/found" className="block group">
            <Card className="h-full transition-all hover:shadow-lg hover:border-teal-500">
              <CardHeader className="text-center pb-4">
                <div className="mx-auto mb-4 p-4 bg-green-100 dark:bg-green-950 rounded-full w-fit group-hover:scale-110 transition-transform">
                  <Package className="h-12 w-12 text-green-600 dark:text-green-400" />
                </div>
                <CardTitle className="text-2xl">I Found Something</CardTitle>
                <CardDescription className="text-base">
                  Help return a found item to its rightful owner
                </CardDescription>
              </CardHeader>
              <CardContent className="text-center">
                <Button className="w-full" size="lg" variant="default">
                  Post Found Item
                </Button>
                <p className="text-sm text-muted-foreground mt-4">
                  Share details about what you found. Help someone get their item back.
                </p>
              </CardContent>
            </Card>
          </Link>
        </div>

        <div className="mt-8 text-center">
          <p className="text-sm text-muted-foreground">
            All posts are reviewed to ensure quality and prevent spam.
            <br />
            Please provide accurate information to help the community.
          </p>
        </div>
      </div>
    </div>
  )
}
