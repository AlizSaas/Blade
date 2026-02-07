import { SignInButton, SignUpButton, SignedIn, SignedOut, UserButton } from "@clerk/nextjs"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Bike, Building2, Users, CheckCircle, ArrowRight, Sparkles } from "lucide-react"
import Link from "next/link"
import CheckUserRoleRed from "@/components/check-user.role-red"

export default function HomePage() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950 text-white">
      {/* Ambient glow effects */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-blue-500/10 rounded-full blur-[128px]" />
        <div className="absolute top-1/3 right-1/4 w-96 h-96 bg-violet-500/10 rounded-full blur-[128px]" />
        <div className="absolute bottom-1/4 left-1/3 w-96 h-96 bg-emerald-500/8 rounded-full blur-[128px]" />
      </div>

      {/* Navigation */}
      <nav className="border-b border-white/5 sticky top-0 z-50 bg-slate-950/60 backdrop-blur-xl">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-2">
              <div className="p-1.5 bg-gradient-to-br from-blue-500 to-violet-500 rounded-lg">
                <Bike className="h-5 w-5" />
              </div>
              <span className="text-lg font-semibold tracking-tight">BikeRequest</span>
            </div>

            <div className="flex items-center space-x-3">
              <SignedOut>
                <SignInButton mode="modal">
                  <Button variant="ghost" className="text-white/70 hover:text-white hover:bg-white/10">
                    Sign In
                  </Button>
                </SignInButton>
                <SignUpButton mode="modal">
                  <Button className="bg-gradient-to-r from-blue-500 to-violet-500 text-white hover:from-blue-600 hover:to-violet-600 border-0 shadow-lg shadow-blue-500/25">
                    Get Started
                  </Button>
                </SignUpButton>
              </SignedOut>

              <SignedIn>
                <CheckUserRoleRed />
                <UserButton
                  signInUrl="/seller"
                />
              </SignedIn>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative py-28 px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto text-center relative z-10">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 bg-white/5 border border-white/10 rounded-full text-sm text-white/60 mb-8 backdrop-blur-sm">
            <Sparkles className="h-3.5 w-3.5 text-blue-400" />
            Streamline Your Company&apos;s Bike Program
          </div>
          <h1 className="text-5xl md:text-7xl font-bold tracking-tight mb-6 leading-[1.1]">
            Manage Bike Requests,{" "}
            <span className="bg-gradient-to-r from-blue-400 via-violet-400 to-emerald-400 bg-clip-text text-transparent">
              Made Simple.
            </span>
          </h1>
          <p className="text-lg text-slate-400 mb-10 max-w-2xl mx-auto leading-relaxed">
            Connect employees with bike sellers through a streamlined request platform.
           
          </p>

          <SignedOut>
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <SignUpButton mode="modal">
                <Button size="lg" className="bg-gradient-to-r from-blue-500 to-violet-500 text-white hover:from-blue-600 hover:to-violet-600 border-0 shadow-lg shadow-blue-500/25 px-8">
                  Start Free Trial
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </SignUpButton>
              <SignInButton mode="modal">
                <Button size="lg" variant="outline" className="border-white/10 bg-white/5 text-white hover:bg-white/10 px-8 backdrop-blur-sm">
                  Sign In
                </Button>
              </SignInButton>
            </div>
          </SignedOut>

          <SignedIn>
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <Link href="/buyer">
                <Button size="lg" className="bg-gradient-to-r from-blue-500 to-violet-500 text-white hover:from-blue-600 hover:to-violet-600 border-0 shadow-lg shadow-blue-500/25 px-8">
                  View My Requests
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </Link>
              <Link href="/seller">
                <Button size="lg" variant="outline" className="border-white/10 bg-white/5 text-white px-8 backdrop-blur-sm">
                  Manage Company
                </Button>
              </Link>
            </div>
          </SignedIn>
        </div>
      </section>

      {/* Divider */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="border-t border-white/5" />
      </div>

      {/* Features Section */}
      <section className="py-24 px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold tracking-tight mb-4">Everything You Need</h2>
            <p className="text-slate-400 max-w-xl mx-auto">
              Tools for both employees and companies to manage bike requests efficiently.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Card className="bg-gradient-to-b from-white/[0.07] to-white/[0.03] border-white/10 text-white group hover:border-blue-500/30 transition-all duration-300 hover:shadow-lg hover:shadow-blue-500/5">
              <CardHeader>
                <div className="w-10 h-10 bg-gradient-to-br from-blue-500/20 to-blue-500/5 border border-blue-500/20 rounded-lg flex items-center justify-center mb-3">
                  <Users className="h-5 w-5 text-blue-400" />
                </div>
                <CardTitle className="text-white">For Employees</CardTitle>
                <CardDescription className="text-slate-500">Easy bike request management</CardDescription>
              </CardHeader>
              <CardContent>
                <ul className="space-y-3">
                  {["Submit bike requests instantly", "Track approval status", "View approved requests", "Contact sellers directly"].map((item) => (
                    <li key={item} className="flex items-center text-sm text-slate-400">
                      <CheckCircle className="h-4 w-4 text-blue-400/60 mr-2 flex-shrink-0" />
                      {item}
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>

            <Card className="bg-gradient-to-b from-white/[0.07] to-white/[0.03] border-white/10 text-white group hover:border-violet-500/30 transition-all duration-300 hover:shadow-lg hover:shadow-violet-500/5">
              <CardHeader>
                <div className="w-10 h-10 bg-gradient-to-br from-violet-500/20 to-violet-500/5 border border-violet-500/20 rounded-lg flex items-center justify-center mb-3">
                  <Building2 className="h-5 w-5 text-violet-400" />
                </div>
                <CardTitle className="text-white">For Companies</CardTitle>
                <CardDescription className="text-slate-500">Complete management tools</CardDescription>
              </CardHeader>
              <CardContent>
                <ul className="space-y-3">
                  {["Manage all bike requests", "Generate invitation codes", "Team member oversight", "Analytics and reporting"].map((item) => (
                    <li key={item} className="flex items-center text-sm text-slate-400">
                      <CheckCircle className="h-4 w-4 text-violet-400/60 mr-2 flex-shrink-0" />
                      {item}
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>

            <Card className="bg-gradient-to-b from-white/[0.07] to-white/[0.03] border-white/10 text-white group hover:border-emerald-500/30 transition-all duration-300 hover:shadow-lg hover:shadow-emerald-500/5">
              <CardHeader>
                <div className="w-10 h-10 bg-gradient-to-br from-emerald-500/20 to-emerald-500/5 border border-emerald-500/20 rounded-lg flex items-center justify-center mb-3">
                  <Bike className="h-5 w-5 text-emerald-400" />
                </div>
                <CardTitle className="text-white">Platform Benefits</CardTitle>
                <CardDescription className="text-slate-500">Why choose BikeRequest</CardDescription>
              </CardHeader>
              <CardContent>
                <ul className="space-y-3">
                  {["Streamlined approval process", "Real-time notifications", "Secure and reliable", "Mobile-friendly design"].map((item) => (
                    <li key={item} className="flex items-center text-sm text-slate-400">
                      <CheckCircle className="h-4 w-4 text-emerald-400/60 mr-2 flex-shrink-0" />
                      {item}
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Divider */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="border-t border-white/5" />
      </div>

      {/* How It Works */}
      <section className="py-24 px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold tracking-tight mb-4">How It Works</h2>
            <p className="text-slate-400">Get started in three simple steps.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-12">
            {[
              { step: "01", title: "Sign Up", desc: "Create your account as an employee or company admin.", color: "from-blue-500 to-blue-600" },
              { step: "02", title: "Set Up", desc: "Companies create profiles and generate invitation codes.", color: "from-violet-500 to-violet-600" },
              { step: "03", title: "Start Requesting", desc: "Submit bike requests and manage approvals seamlessly.", color: "from-emerald-500 to-emerald-600" },
            ].map((item) => (
              <div key={item.step} className="text-center group">
                <div className={`text-5xl font-bold bg-gradient-to-b ${item.color} bg-clip-text text-transparent opacity-30 group-hover:opacity-60 transition-opacity mb-4`}>
                  {item.step}
                </div>
                <h3 className="text-lg font-semibold mb-2">{item.title}</h3>
                <p className="text-slate-400 text-sm leading-relaxed">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Divider */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="border-t border-white/5" />
      </div>

      {/* CTA Section */}
      <section className="py-24 px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="max-w-3xl mx-auto text-center">
          <div className="relative">
            <div className="absolute inset-0 bg-gradient-to-r from-blue-500/10 via-violet-500/10 to-emerald-500/10 rounded-3xl blur-xl" />
            <div className="relative bg-white/[0.03] border border-white/10 rounded-3xl px-8 py-16 backdrop-blur-sm">
              <h2 className="text-3xl md:text-4xl font-bold tracking-tight mb-4">
                Ready to Get Started?
              </h2>
              <p className="text-slate-400 mb-8">
                Join companies already using BikeRequest for sustainable transportation.
              </p>

              <SignedOut>
                <SignUpButton mode="modal">
                  <Button size="lg" className="bg-gradient-to-r from-blue-500 to-violet-500 text-white hover:from-blue-600 hover:to-violet-600 border-0 shadow-lg shadow-blue-500/25 px-8">
                    Get Started Free
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>
                </SignUpButton>
              </SignedOut>

              <SignedIn>
                <Link href="/seller">
                  <Button size="lg" className="bg-gradient-to-r from-blue-500 to-violet-500 text-white hover:from-blue-600 hover:to-violet-600 border-0 shadow-lg shadow-blue-500/25 px-8">
                    Go to Dashboard
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>
                </Link>
              </SignedIn>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-white/5 py-10 px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-col md:flex-row justify-between items-center">
            <div className="flex items-center space-x-2 mb-4 md:mb-0">
              <div className="p-1 bg-gradient-to-br from-blue-500/50 to-violet-500/50 rounded-md">
                <Bike className="h-4 w-4 text-white/70" />
              </div>
              <span className="text-sm font-medium text-slate-500">BikeRequest</span>
            </div>
            <div className="flex space-x-6 text-sm text-slate-600">
              <a href="#" className="hover:text-slate-400 transition-colors">Privacy</a>
              <a href="#" className="hover:text-slate-400 transition-colors">Terms</a>
              <a href="#" className="hover:text-slate-400 transition-colors">Contact</a>
            </div>
          </div>
          <div className="mt-8 text-center text-xs text-slate-700">
            <p>&copy; 2024 BikeRequest. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  )
}
