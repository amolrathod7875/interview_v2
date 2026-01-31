export default function HowItWorks() {
  return (
    <section className="py-32 px-4 bg-gradient-to-b from-slate-50 to-white">
      <div className="container mx-auto max-w-5xl text-center">
        <h2 className="text-4xl font-bold text-slate-900 mb-6">
          How it works
        </h2>
        <p className="text-lg text-slate-600 mb-16 max-w-2xl mx-auto">
          Get started in minutes with our simple three-step process
        </p>

        <div className="grid md:grid-cols-3 gap-8">
          {[
            {
              step: "Choose your role & stack",
              description: "Select your target role and tech stack to personalize your prep"
            },
            {
              step: "Practice with AI",
              description: "Engage with AI-powered mock interviews and adaptive quizzes"
            },
            {
              step: "Get feedback & improve",
              description: "Receive instant feedback and track your progress over time"
            }
          ].map((item, i) => (
            <div 
              key={i} 
              className="p-8 rounded-2xl border border-slate-200 bg-white shadow-sm hover:shadow-md transition-shadow duration-300"
            >
              <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-blue-600 text-white text-xl font-bold mb-6">
                {i + 1}
              </div>
              <h3 className="text-xl font-semibold text-slate-900 mb-3">
                {item.step}
              </h3>
              <p className="text-slate-600 leading-relaxed">
                {item.description}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}