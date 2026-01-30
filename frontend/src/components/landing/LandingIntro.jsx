import Hero from "./Hero"
import LandingIntro from "./LandingIntro"
import Features from "./Features"
import CTA from "./CTA"
import Footer from "./Footer"

export default function LandingPage() {
  return (
    <>
      <Hero />
      <LandingIntro />   {/* 👈 directly below Hero */}
      <Features />
      <CTA />
      <Footer />
    </>
  )
}
