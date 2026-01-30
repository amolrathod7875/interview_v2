import Navbar from "@/components/landing/Navbar"
import Hero from "@/components/landing/Hero"
import SocialProof from "@/components/landing/SocialProof"
import Features from "@/components/landing/Features"
import HowItWorks from "@/components/landing/HowItWorks"
import CTA from "@/components/landing/CTA"
import Footer from "@/components/landing/Footer"

export default function Starter() {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <Navbar />
      <main>
        <Hero />
        <SocialProof />
        <Features />
        <HowItWorks />
        <CTA />
      </main>
      <Footer />
    </div>
  )
}
