import { motion } from "framer-motion"

// ============================================
// CONFIG: Update this array to add/remove companies
// ============================================
const COMPANIES = [
  { name: "Google", color: "#4285F4" },
  { name: "Microsoft", color: "#00A4EF" },
  { name: "Amazon", color: "#FF9900" },
  { name: "Meta", color: "#0668E1" },
  { name: "Apple", color: "#555555" },
  { name: "Netflix", color: "#E50914" },
  { name: "Spotify", color: "#1DB954" },
  { name: "Adobe", color: "#FF0000" },
  { name: "Salesforce", color: "#00A1E0" },
  { name: "Oracle", color: "#F80000" },
  { name: "IBM", color: "#006699" },
  { name: "Intel", color: "#0071C5" },
]

// ============================================
// Sub-components for modularity
// ============================================

/**
 * Company Logo Card
 * Individual company card with soft shadow and blue border
 */
function CompanyCard({ company, index }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{
        duration: 0.5,
        delay: index * 0.1,
        ease: [0.25, 0.1, 0.25, 1]
      }}
      whileHover={{
        y: -8,
        scale: 1.02,
        transition: { duration: 0.3, ease: "easeOut" }
      }}
      className="group relative flex flex-col items-center justify-center p-6 rounded-2xl bg-white border border-slate-100 shadow-sm hover:shadow-xl hover:shadow-blue-100/50 transition-all duration-300"
    >
      {/* Subtle blue glow on hover */}
      <div className="absolute inset-0 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-300">
        <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-blue-50/50 to-blue-100/30" />
      </div>

      {/* Blue border accent on hover */}
      <div className="absolute inset-0 rounded-2xl border-2 border-transparent group-hover:border-blue-200 transition-all duration-300" />

      {/* Logo placeholder - replace with actual logo */}
      <div
        className="w-16 h-16 rounded-xl flex items-center justify-center text-white font-bold text-lg mb-3 shadow-md"
        style={{ backgroundColor: company.color }}
      >
        {company.name.charAt(0)}
      </div>

      <span className="text-sm font-medium text-slate-600 group-hover:text-blue-600 transition-colors duration-300">
        {company.name}
      </span>
    </motion.div>
  )
}

/**
 * Floating Logo Row
 * A row of logos that floats up and down with staggered animation
 */
function FloatingLogoRow({ companies, rowIndex, duration = 4 }) {
  const rowVariants = {
    animate: {
      y: [0, -15, 0],
      transition: {
        duration: duration,
        repeat: Infinity,
        ease: [0.45, 0, 0.55, 1],
        delay: rowIndex * 0.5
      }
    }
  }

  return (
    <motion.div
      className="flex gap-6"
      variants={rowVariants}
      animate="animate"
    >
      {companies.map((company, index) => (
        <motion.div
          key={`${rowIndex}-${index}`}
          initial={{ opacity: 0.6, scale: 0.95 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: true }}
          whileHover={{
            y: -6,
            scale: 1.05,
            transition: { duration: 0.2 }
          }}
          className="flex-shrink-0"
        >
          <div
            className="w-14 h-14 md:w-16 md:h-16 rounded-xl md:rounded-2xl bg-white border border-slate-200 shadow-md hover:shadow-lg hover:border-blue-200 flex items-center justify-center transition-all duration-300 cursor-pointer"
            style={{ backgroundColor: company.color }}
          >
            <span className="text-white font-bold text-sm md:text-base">
              {company.name.charAt(0)}
            </span>
          </div>
        </motion.div>
      ))}
    </motion.div>
  )
}

// ============================================
// Main Component
// ============================================

export default function FeaturedCompanies() {
  // Split companies into rows for floating animation
  const rowSize = 6
  const rows = []
  for (let i = 0; i < COMPANIES.length; i += rowSize) {
    rows.push(COMPANIES.slice(i, i + rowSize))
  }

  return (
    <section className="relative py-24 bg-white overflow-hidden">
      {/* Background decoration */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-blue-100 to-transparent" />
        <div className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-blue-100 to-transparent" />
      </div>

      <div className="container mx-auto max-w-6xl px-4">
        {/* Section Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="text-center mb-16"
        >
          <h2 className="text-3xl md:text-4xl font-bold text-slate-900 mb-4">
            Trusted by Developers at
            <span className="text-blue-600"> Top Companies</span>
          </h2>
          <p className="text-lg text-slate-600 max-w-2xl mx-auto">
            Join thousands of engineers who have mastered their interview skills with interview.io
          </p>
        </motion.div>

        {/* Grid Layout - Responsive */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-4 md:gap-6">
          {COMPANIES.map((company, index) => (
            <CompanyCard
              key={company.name}
              company={company}
              index={index}
            />
          ))}
        </div>

        {/* Floating Marquee Row - Alternate Animation */}
        <div className="mt-16 overflow-hidden">
          <motion.div
            initial={{ opacity: 0, x: -50 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8 }}
            className="relative"
          >
            {/* Fade masks at edges */}
            <div className="absolute left-0 top-0 bottom-0 w-20 md:w-32 z-10 bg-gradient-to-r from-white to-transparent pointer-events-none" />
            <div className="absolute right-0 top-0 bottom-0 w-20 md:w-32 z-10 bg-gradient-to-l from-white to-transparent pointer-events-none" />

            {/* Infinite scrolling marquee */}
            <div className="flex gap-8 py-4">
              <motion.div
                className="flex gap-8"
                animate={{ x: [0, -500] }}
                transition={{
                  duration: 20,
                  repeat: Infinity,
                  ease: "linear"
                }}
              >
                {/* Double the companies for seamless loop */}
                {[...COMPANIES, ...COMPANIES].map((company, index) => (
                  <div
                    key={`marquee-${index}`}
                    className="flex-shrink-0 flex items-center gap-3 px-4 py-2 rounded-full bg-slate-50 border border-slate-100 shadow-sm"
                  >
                    <div
                      className="w-8 h-8 rounded-lg flex items-center justify-center text-white text-xs font-bold"
                      style={{ backgroundColor: company.color }}
                    >
                      {company.name.charAt(0)}
                    </div>
                    <span className="text-sm font-medium text-slate-700 whitespace-nowrap">
                      {company.name}
                    </span>
                  </div>
                ))}
              </motion.div>
            </div>
          </motion.div>
        </div>

        {/* Stats / Social Proof */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="mt-16 grid grid-cols-2 md:grid-cols-4 gap-8 text-center"
        >
          {[
            { value: "10K+", label: "Interviews Practiced" },
            { value: "50K+", label: "Questions Solved" },
            { value: "95%", label: "Success Rate" },
            { value: "500+", label: "Companies Represented" }
          ].map((stat, index) => (
            <div key={index} className="space-y-1">
              <div className="text-3xl md:text-4xl font-bold text-blue-600">
                {stat.value}
              </div>
              <div className="text-sm text-slate-600">{stat.label}</div>
            </div>
          ))}
        </motion.div>
      </div>

      {/* Bottom gradient overlay */}
      <div className="absolute bottom-0 left-0 right-0 h-24 bg-gradient-to-t from-white to-transparent pointer-events-none" />
    </section>
  )
}

// ============================================
// Export for easy customization
// ============================================
export { COMPANIES }
