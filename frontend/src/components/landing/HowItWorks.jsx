export default function HowItWorks() {
  return (
    <section className="py-24 px-4">
      <div className="container mx-auto max-w-4xl text-center">
        <h2 className="text-3xl font-bold mb-12">How it works</h2>

        <div className="grid md:grid-cols-3 gap-8">
          {[
            "Choose your role & stack",
            "Practice with AI",
            "Get feedback & improve"
          ].map((step, i) => (
            <div key={i} className="p-6 rounded-xl border bg-card">
              <div className="text-primary text-2xl font-bold mb-2">
                {i + 1}
              </div>
              <p>{step}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
