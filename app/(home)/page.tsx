import { Button } from "@/components/ui/button"
import Link from "next/link"
import { Search, Upload, MessageCircle, Shield, Sparkles, MapPin } from "lucide-react"

export default function HomePage() {
  return (
    <div className="flex flex-col min-h-svh bg-background">
      <main className="flex-1">
        <section className="container mx-auto px-4 py-16 md:py-24 lg:py-32">
          <div className="max-w-4xl mx-auto text-center">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 text-primary text-sm font-medium mb-6">
              <Sparkles className="w-4 h-4" />
              <span>AI-Powered Lost & Found</span>
            </div>
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold mb-6 text-balance leading-tight">
              Lost Something?
              <br />
              <span className="text-primary">We'll Help You Find It</span>
            </h1>
            <p className="text-lg md:text-xl text-muted-foreground mb-10 max-w-2xl mx-auto text-pretty leading-relaxed">
              FindIt uses smart AI matching to reunite lost items with their owners. Post what you've lost or found, and
              let our intelligent system do the rest.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button size="lg" className="h-12 px-8" asChild>
                <Link href="/items">
                  <Search className="w-5 h-5 mr-2" />
                  Browse Items
                </Link>
              </Button>
              <Button size="lg" variant="outline" className="h-12 px-8" asChild>
                <Link href="/post/lost">
                  <Upload className="w-5 h-5 mr-2" />
                  Report an Item
                </Link>
              </Button>
            </div>
          </div>
        </section>
        <section className="bg-muted/30 py-16 md:py-24">
          <div className="container mx-auto px-4">
            <div className="text-center mb-12 md:mb-16">
              <h2 className="text-3xl md:text-4xl font-bold mb-4">How FindIt Works</h2>
              <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
                Our platform makes it easy to report and find lost items with just a few clicks
              </p>
            </div>
            <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6 md:gap-8">
              <div className="bg-card rounded-xl p-6 shadow-sm border hover:shadow-md transition-shadow">
                <div className="inline-flex items-center justify-center w-14 h-14 rounded-xl bg-primary/10 text-primary mb-5">
                  <Upload className="w-7 h-7" />
                </div>
                <h3 className="font-semibold text-lg mb-3">Post Your Item</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  Report a lost or found item with photos and details in under a minute
                </p>
              </div>
              <div className="bg-card rounded-xl p-6 shadow-sm border hover:shadow-md transition-shadow">
                <div className="inline-flex items-center justify-center w-14 h-14 rounded-xl bg-accent/10 text-accent mb-5">
                  <Sparkles className="w-7 h-7" />
                </div>
                <h3 className="font-semibold text-lg mb-3">AI Matching</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  Our intelligent system automatically finds potential matches for your item
                </p>
              </div>
              <div className="bg-card rounded-xl p-6 shadow-sm border hover:shadow-md transition-shadow">
                <div className="inline-flex items-center justify-center w-14 h-14 rounded-xl bg-chart-3/10 text-chart-3 mb-5">
                  <MessageCircle className="w-7 h-7" />
                </div>
                <h3 className="font-semibold text-lg mb-3">Connect Securely</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  Message owners directly through our secure, private messaging platform
                </p>
              </div>
              <div className="bg-card rounded-xl p-6 shadow-sm border hover:shadow-md transition-shadow">
                <div className="inline-flex items-center justify-center w-14 h-14 rounded-xl bg-chart-2/10 text-chart-2 mb-5">
                  <Shield className="w-7 h-7" />
                </div>
                <h3 className="font-semibold text-lg mb-3">Stay Private</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  Your contact info stays hidden until you choose to share it
                </p>
              </div>
            </div>
          </div>
        </section>
        <section className="py-16 md:py-24">
          <div className="container mx-auto px-4">
            <div className="grid sm:grid-cols-3 gap-8 md:gap-12 max-w-4xl mx-auto text-center">
              <div>
                <div className="text-4xl md:text-5xl font-bold text-primary mb-2">5,000+</div>
                <div className="text-muted-foreground">Items Reunited</div>
              </div>
              <div>
                <div className="text-4xl md:text-5xl font-bold text-primary mb-2">10,000+</div>
                <div className="text-muted-foreground">Active Users</div>
              </div>
              <div>
                <div className="text-4xl md:text-5xl font-bold text-primary mb-2">95%</div>
                <div className="text-muted-foreground">Success Rate</div>
              </div>
            </div>
          </div>
        </section>
        <section className="bg-primary/5 py-16 md:py-24">
          <div className="container mx-auto px-4">
            <div className="max-w-3xl mx-auto text-center">
              <h2 className="text-3xl md:text-4xl font-bold mb-4">Ready to Find What You Lost?</h2>
              <p className="text-lg text-muted-foreground mb-8 leading-relaxed">
                Join thousands of users who have successfully reunited with their lost items through our community
              </p>
              <Button size="lg" className="h-12 px-8" asChild>
                <Link href="/items">
                  <MapPin className="w-5 h-5 mr-2" />
                  Start Searching Now
                </Link>
              </Button>
            </div>
          </div>
        </section>
      </main>
      <footer className="border-t bg-card py-8 md:py-12">
        <div className="container mx-auto px-4">
          <div className="flex flex-col md:flex-row justify-between items-center gap-4">
            <div className="text-2xl font-bold">FindIt</div>
            <div className="text-sm text-muted-foreground">
              &copy; 2025 FindIt. Helping reunite lost items with their owners.
            </div>
          </div>
        </div>
      </footer>
    </div>
  )
}
