import { Link, useNavigate } from "react-router-dom"
import { Button } from "./ui/button"
import { Zap, ArrowRight, CheckCircle, MessageSquareText, HelpCircle, Video } from "lucide-react"
import { FaRobot } from "react-icons/fa6"

const features = [
  { icon: MessageSquareText, title: "AI Q&A Generator", description: "Generate custom interview questions with AI-powered answers" },
  { icon: HelpCircle, title: "Interactive Quizzes", description: "Test your knowledge with adaptive quizzes" },
  { icon: Video, title: "Video Rooms", description: "Conduct mock interviews with video conferencing" },
  { icon: MessageSquareText, title: "Daily Summary", description: "Get curated daily tech news summaries" },
  { icon: FaRobot, title: "AI Assistant", description: "Interact with your personal AI interview coach" }
]

export default function Starter() {
  const navigate = useNavigate()
  return (
    <div className="min-h-screen bg-background text-foreground">

      <header className="fixed top-0 left-0 right-0 z-50 border-b border-border bg-background/80 backdrop-blur-sm">
        <div className="container mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2" onClick={() => navigate('/')}>
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-red-500">
              <Zap className="h-5 w-5 text-primary-foreground " />
            </div>
            <span className="text-lg font-bold cursor-pointer">Interview.io</span>
          </div>

          <div className="flex items-center gap-4">
            <Link to="/login">
              <Button variant="ghost">Sign in</Button>
            </Link>
            <Link to="/signup">
              <Button className={'cursor-pointer'}>Get Started</Button>
            </Link>
          </div>
        </div>
      </header>

      <section className="pt-32 pb-20 px-4 text-center">
        <div className="container mx-auto max-w-4xl">
          <div className="inline-flex items-center gap-2 rounded-full bg-primary/10 px-4 py-1.5 text-sm font-medium text-primary mb-6">
            <Zap className="h-4 w-4" />
            AI-Powered Interview Prep
          </div>

          <h1 className="text-5xl md:text-6xl font-bold mb-6">
            <span className="text-red-500">Ace</span> Your Next
            <span className="text-primary block">Technical Interview</span>
          </h1>

          <p className="text-xl text-muted-foreground mb-8 max-w-2xl mx-auto">
            Practice with AI-generated questions, take interactive quizzes, and conduct mock interviews — all in one platform.
          </p>

          <div className="flex flex-col sm:flex-row justify-center gap-4">
            <Link to="/signup">
              <Button size="lg" className="px-8 bg-red-500 hover:bg-red-700 cursor-pointer">
                Start Free
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </Link>

            <Link to="/login">
              <Button size="lg" variant="outline" className="px-8 cursor-pointer">
                I have an account
              </Button>
            </Link>
          </div>
        </div>
      </section>

      <section className="py-20 px-4 bg-muted/50">
        <div className="container mx-auto max-w-5xl">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold mb-4">Everything you need to prepare</h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              From practicing questions to conducting mock interviews, we've got you covered.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-6">
            {features.map((feature, index) => (
              <div key={index} className="bg-card rounded-xl p-6 border border-border hover:shadow-xl transition">
                <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10 mb-4">
                  <feature.icon className="h-6 w-6 text-primary" />
                </div>
                <h3 className="text-lg font-semibold mb-2">{feature.title}</h3>
                <p className="text-muted-foreground">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="py-20 px-4 text-center">
        <div className="container mx-auto max-w-3xl">
          <h2 className="text-3xl font-bold mb-4">Ready to start preparing?</h2>
          <p className="text-muted-foreground mb-8">
            Join thousands of developers who improved their interview skills
          </p>

          <Link to="/signup">
            <Button size="lg" className="px-8">
              Create Free Account
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </Link>

          <div className="flex justify-center gap-6 mt-8 text-sm text-muted-foreground">
            <div className="flex items-center gap-2">
              <CheckCircle className="h-4 w-4 text-green-500" />
              No credit card required
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle className="h-4 w-4 text-green-500" />
              Free tier available
            </div>
          </div>
        </div>
      </section>

      <footer className="border-t border-border py-8 text-center">
        <div className="flex items-center justify-center gap-2 mb-4">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary">
            <Zap className="h-4 w-4 text-primary-foreground" />
          </div>
          <span className="font-bold">Interview.io</span>
        </div>
        <p className="text-sm text-muted-foreground">© 2024 Interview.io</p>
      </footer>
    </div>
  )
}