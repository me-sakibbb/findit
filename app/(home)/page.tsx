import { Button } from "@/components/ui/button"
import Link from "next/link"
import Image from "next/image"
import { Search, Upload, MessageCircle, Shield, Sparkles, MapPin, CheckCircle2, ArrowRight, Mail, Github, Twitter } from "lucide-react"
import { RecentItems } from "@/components/recent-items"
import { CategoryGrid } from "@/components/category-grid"
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion"

const testimonials = [
  {
    name: "Sarah M.",
    avatar: "SM",
    quote: "Found my lost laptop within 24 hours thanks to FindIt! The AI matching connected me with someone who found it at a coffee shop.",
    location: "New York"
  },
  {
    name: "James K.",
    avatar: "JK",
    quote: "I lost my wallet with all my IDs. Within a day, someone reached out through FindIt. The verification questions gave me peace of mind.",
    location: "Los Angeles"
  },
  {
    name: "Priya R.",
    avatar: "PR",
    quote: "My dog went missing and I was devastated. Posted on FindIt and a kind neighbor found her and contacted me the same evening!",
    location: "Chicago"
  }
]

const faqItems = [
  {
    question: "How do I post a lost or found item?",
    answer: "Click the 'Report an Item' button, sign in or create an account, then fill out the form with details like title, description, category, location, and photos. The more details you provide, the better chance of a match!"
  },
  {
    question: "Is my personal information safe?",
    answer: "Absolutely! Your contact information is never shared publicly. Communication happens through our secure messaging system, and you control when and how to share personal details."
  },
  {
    question: "How does the AI matching work?",
    answer: "Our AI analyzes item descriptions, categories, locations, dates, and even images to identify potential matches between lost and found items. You'll receive notifications when a potential match is found."
  },
  {
    question: "Is FindIt free to use?",
    answer: "Yes! FindIt is completely free for both finding and reporting items. Our mission is to reunite people with their lost belongings."
  },
  {
    question: "How do I verify I'm the real owner?",
    answer: "When claiming an item, you'll answer verification questions set by the finder. Our AI analyzes your answers to help verify ownership, making the process secure and trustworthy."
  },
  {
    question: "Can I search for items in my area?",
    answer: "Yes! You can filter items by location, category, and date. Our search helps you find items reported near you."
  }
]

export default function HomePage() {
  return (
    <>
      {/* Hero Section */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-accent/5" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-primary/10 via-transparent to-transparent" />

        <div className="container mx-auto px-4 py-16 md:py-24 lg:py-32 relative">
          <div className="max-w-4xl mx-auto text-center">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 text-primary text-sm font-medium mb-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
              <Sparkles className="w-4 h-4" />
              <span>AI-Powered Lost & Found Platform</span>
            </div>
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold mb-6 text-balance leading-tight animate-in fade-in slide-in-from-bottom-4 duration-500 delay-100">
              Lost Something?
              <br />
              <span className="bg-gradient-to-r from-primary to-blue-600 bg-clip-text text-transparent">We'll Help You Find It</span>
            </h1>
            <p className="text-lg md:text-xl text-muted-foreground mb-10 max-w-2xl mx-auto text-pretty leading-relaxed animate-in fade-in slide-in-from-bottom-4 duration-500 delay-200">
              FindIt uses smart AI matching to reunite lost items with their owners. Post what you've lost or found, and
              let our intelligent system do the rest.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center animate-in fade-in slide-in-from-bottom-4 duration-500 delay-300">
              <Button size="lg" className="h-12 px-8 shadow-lg hover:shadow-xl transition-shadow" asChild>
                <Link href="/items">
                  <Search className="w-5 h-5 mr-2" />
                  Browse Items
                </Link>
              </Button>
              <Button size="lg" variant="outline" className="h-12 px-8 hover:bg-primary/5" asChild>
                <Link href="/post">
                  <Upload className="w-5 h-5 mr-2" />
                  Report an Item
                </Link>
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Recent Items Section */}
      <section className="py-16 md:py-24">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">Recently Posted Items</h2>
            <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
              Browse the latest lost and found items in your community
            </p>
          </div>
          <RecentItems />
        </div>
      </section>

      {/* Categories Section */}
      <section className="bg-muted/30 py-16 md:py-24">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">Browse by Category</h2>
            <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
              Find items faster by searching within specific categories
            </p>
          </div>
          <div className="max-w-4xl mx-auto">
            <CategoryGrid />
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section className="py-16 md:py-24">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12 md:mb-16">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">How FindIt Works</h2>
            <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
              Our platform makes it easy to report and find lost items with just a few clicks
            </p>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6 md:gap-8">
            <div className="bg-card rounded-xl p-6 shadow-sm border hover:shadow-md transition-shadow group">
              <div className="inline-flex items-center justify-center w-14 h-14 rounded-xl bg-primary/10 text-primary mb-5 group-hover:scale-110 transition-transform">
                <Upload className="w-7 h-7" />
              </div>
              <h3 className="font-semibold text-lg mb-3">Post Your Item</h3>
              <p className="text-sm text-muted-foreground leading-relaxed">
                Report a lost or found item with photos and details in under a minute
              </p>
            </div>
            <div className="bg-card rounded-xl p-6 shadow-sm border hover:shadow-md transition-shadow group">
              <div className="inline-flex items-center justify-center w-14 h-14 rounded-xl bg-accent/10 text-accent mb-5 group-hover:scale-110 transition-transform">
                <Sparkles className="w-7 h-7" />
              </div>
              <h3 className="font-semibold text-lg mb-3">AI Matching</h3>
              <p className="text-sm text-muted-foreground leading-relaxed">
                Our intelligent system automatically finds potential matches for your item
              </p>
            </div>
            <div className="bg-card rounded-xl p-6 shadow-sm border hover:shadow-md transition-shadow group">
              <div className="inline-flex items-center justify-center w-14 h-14 rounded-xl bg-green-500/10 text-green-500 mb-5 group-hover:scale-110 transition-transform">
                <MessageCircle className="w-7 h-7" />
              </div>
              <h3 className="font-semibold text-lg mb-3">Connect Securely</h3>
              <p className="text-sm text-muted-foreground leading-relaxed">
                Message owners directly through our secure, private messaging platform
              </p>
            </div>
            <div className="bg-card rounded-xl p-6 shadow-sm border hover:shadow-md transition-shadow group">
              <div className="inline-flex items-center justify-center w-14 h-14 rounded-xl bg-blue-500/10 text-blue-500 mb-5 group-hover:scale-110 transition-transform">
                <Shield className="w-7 h-7" />
              </div>
              <h3 className="font-semibold text-lg mb-3">Verify & Reclaim</h3>
              <p className="text-sm text-muted-foreground leading-relaxed">
                Answer verification questions to prove ownership and get your item back
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="bg-gradient-to-r from-primary/5 via-primary/10 to-accent/5 py-16 md:py-24">
        <div className="container mx-auto px-4">
          <div className="grid sm:grid-cols-3 gap-8 md:gap-12 max-w-4xl mx-auto text-center">
            <div className="space-y-2">
              <div className="text-4xl md:text-5xl font-bold text-primary">5,000+</div>
              <div className="text-muted-foreground font-medium">Items Reunited</div>
            </div>
            <div className="space-y-2">
              <div className="text-4xl md:text-5xl font-bold text-primary">10,000+</div>
              <div className="text-muted-foreground font-medium">Active Users</div>
            </div>
            <div className="space-y-2">
              <div className="text-4xl md:text-5xl font-bold text-primary">95%</div>
              <div className="text-muted-foreground font-medium">Success Rate</div>
            </div>
          </div>
        </div>
      </section>

      {/* Testimonials Section */}
      <section className="py-16 md:py-24">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">Success Stories</h2>
            <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
              Real stories from people who found their lost items through FindIt
            </p>
          </div>
          <div className="grid md:grid-cols-3 gap-6 max-w-5xl mx-auto">
            {testimonials.map((testimonial, index) => (
              <div key={index} className="bg-card border rounded-xl p-6 hover:shadow-lg transition-shadow">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center text-primary font-semibold">
                    {testimonial.avatar}
                  </div>
                  <div>
                    <div className="font-semibold">{testimonial.name}</div>
                    <div className="text-sm text-muted-foreground flex items-center gap-1">
                      <MapPin className="w-3 h-3" />
                      {testimonial.location}
                    </div>
                  </div>
                </div>
                <p className="text-muted-foreground italic">"{testimonial.quote}"</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <section className="bg-muted/30 py-16 md:py-24">
        <div className="container mx-auto px-4">
          <div className="max-w-3xl mx-auto">
            <div className="text-center mb-12">
              <h2 className="text-3xl md:text-4xl font-bold mb-4">Frequently Asked Questions</h2>
              <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
                Find answers to common questions about our platform
              </p>
            </div>
            <Accordion type="single" collapsible className="space-y-4">
              {faqItems.map((item, index) => (
                <AccordionItem key={index} value={`item-${index}`} className="bg-card border rounded-lg px-6">
                  <AccordionTrigger className="text-left font-semibold hover:no-underline">
                    {item.question}
                  </AccordionTrigger>
                  <AccordionContent className="text-muted-foreground">
                    {item.answer}
                  </AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-16 md:py-24">
        <div className="container mx-auto px-4">
          <div className="max-w-3xl mx-auto text-center bg-gradient-to-r from-primary/10 via-primary/5 to-accent/10 rounded-2xl p-8 md:p-12 border">
            <CheckCircle2 className="w-12 h-12 text-primary mx-auto mb-6" />
            <h2 className="text-2xl md:text-3xl font-bold mb-4">Ready to Find Your Lost Item?</h2>
            <p className="text-muted-foreground mb-8 max-w-xl mx-auto">
              Join thousands of people who have successfully reunited with their belongings through FindIt.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button size="lg" className="h-12 px-8" asChild>
                <Link href="/auth/register">
                  Get Started Free
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
              <Button size="lg" variant="outline" className="h-12 px-8" asChild>
                <Link href="/items">Browse Items</Link>
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t bg-muted/30">
        <div className="container mx-auto px-4 py-12">
          <div className="grid sm:grid-cols-2 md:grid-cols-4 gap-8 mb-8">
            <div>
              <div className="flex items-center gap-2 mb-4">
                <Image src="/icon-black.svg" alt="FindIt" width={24} height={24} />
                <span className="font-bold text-lg">FindIt</span>
              </div>
              <p className="text-sm text-muted-foreground">
                AI-powered lost and found platform helping reunite people with their belongings.
              </p>
            </div>
            <div>
              <h4 className="font-semibold mb-4">Quick Links</h4>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li><Link href="/items" className="hover:text-foreground transition-colors">Browse Items</Link></li>
                <li><Link href="/post" className="hover:text-foreground transition-colors">Report Item</Link></li>
                <li><Link href="/people" className="hover:text-foreground transition-colors">Find People</Link></li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mb-4">Support</h4>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li><Link href="#faq" className="hover:text-foreground transition-colors">FAQ</Link></li>
                <li><Link href="/contact" className="hover:text-foreground transition-colors">Contact Us</Link></li>
                <li><Link href="/privacy" className="hover:text-foreground transition-colors">Privacy Policy</Link></li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mb-4">Connect</h4>
              <div className="flex gap-4">
                <a href="#" className="text-muted-foreground hover:text-foreground transition-colors">
                  <Twitter className="w-5 h-5" />
                </a>
                <a href="#" className="text-muted-foreground hover:text-foreground transition-colors">
                  <Github className="w-5 h-5" />
                </a>
                <a href="#" className="text-muted-foreground hover:text-foreground transition-colors">
                  <Mail className="w-5 h-5" />
                </a>
              </div>
            </div>
          </div>
          <div className="border-t pt-8 text-center text-sm text-muted-foreground">
            &copy; {new Date().getFullYear()} FindIt. All rights reserved.
          </div>
        </div>
      </footer>
    </>
  )
}
