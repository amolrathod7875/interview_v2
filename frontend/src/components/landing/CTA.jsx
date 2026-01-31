import { Link } from "react-router-dom"
import { Button } from "../ui/button"

export default function CTA() {
  return (
    <section className="mt-40 py-32 px-4 bg-slate-900 text-white">
      <div className="container mx-auto max-w-4xl text-center">
        <h2 className="text-4xl md:text-5xl font-bold leading-tight mb-6">
          Your next interview shouldn't be your first practice
        </h2>

        <p className="text-lg text-slate-300 mb-12 max-w-2xl mx-auto">
          Practice mock interviews, quizzes, and resume analysis in one
          structured dashboard designed to help you crack interviews faster.
        </p>

        <Link to="/signup">
          <Button
            size="lg"
            className="px-10 py-6 text-base font-semibold bg-blue-600 hover:bg-blue-700 shadow-lg hover:shadow-xl transition-all duration-200"
          >
            Start Free
          </Button>
        </Link>
      </div>
    </section>
  )
}