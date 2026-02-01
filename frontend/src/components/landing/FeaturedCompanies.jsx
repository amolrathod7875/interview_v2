import { motion } from "framer-motion";
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

// ============================================
// CONFIG: Update this array to add/remove companies
// ============================================
const COMPANIES = [
  { name: "Google", logo: "https://img.icons8.com/color/96/google-logo.png" },
  { name: "Microsoft", logo: "https://img.icons8.com/color/96/microsoft.png" },
  { name: "Amazon", logo: "https://img.icons8.com/color/96/amazon.png" },
  { name: "Meta", logo: "https://img.icons8.com/color/96/meta.png" },
  { name: "Apple", logo: "https://img.icons8.com/ios-filled/100/mac-os.png" },
  { name: "Netflix", logo: "https://img.icons8.com/color/96/netflix.png" },
  { name: "Spotify", logo: "https://img.icons8.com/color/96/spotify.png" },
  { name: "Adobe", logo: "https://img.icons8.com/color/96/adobe-creative-cloud.png" },
  { name: "Salesforce", logo: "https://img.icons8.com/color/96/salesforce.png" },
  { name: "Oracle", logo: "https://img.icons8.com/color/96/oracle-logo.png" },
  { name: "IBM", logo: "https://img.icons8.com/color/96/ibm.png" },
  { name: "Intel", logo: "https://upload.wikimedia.org/wikipedia/commons/7/7d/Intel_logo_%282006-2020%29.svg" },
  { name: "Tesla", logo: "https://img.icons8.com/color/96/tesla-model-x.png" },
  { name: "Uber", logo: "https://upload.wikimedia.org/wikipedia/commons/c/cc/Uber_logo_2018.png" },
  { name: "LinkedIn", logo: "https://img.icons8.com/color/96/linkedin.png" },
  { name: "Airbnb", logo: "https://img.icons8.com/color/96/airbnb.png" },
];

/**
 * Animated Company Logo Card with floating effect
 */
function CompanyLogoCard({ company, index }) {
  const randomDelay = Math.random() * 2;
  const randomDuration = 3 + Math.random() * 2;
  const randomY = -10 - Math.random() * 15;

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.8 }}
      animate={{
        opacity: 1,
        scale: 1,
        y: [0, randomY, 0],
      }}
      transition={{
        opacity: { duration: 0.6, delay: index * 0.05 },
        scale: { duration: 0.6, delay: index * 0.05 },
        y: {
          duration: randomDuration,
          repeat: Infinity,
          repeatType: "reverse",
          ease: "easeInOut",
          delay: randomDelay,
        },
      }}
      whileHover={{
        scale: 1.15,
        rotate: [0, -3, 3, 0],
        transition: { duration: 0.4, ease: "easeOut" },
      }}
      className="group relative flex-shrink-0"
    >
      <div className="relative flex items-center justify-center w-20 h-20 sm:w-24 sm:h-24 md:w-28 md:h-28 rounded-2xl bg-white border-2 border-blue-100/50 shadow-lg shadow-blue-100/20 hover:shadow-2xl hover:shadow-blue-200/40 hover:border-blue-300 transition-all duration-300">
        {/* Blue glow effect on hover */}
        <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-blue-50/80 to-blue-100/40 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />

        {/* Company Logo */}
        <img
          src={company.logo}
          alt={`${company.name} logo`}
          className="relative z-10 w-10 h-10 sm:w-12 sm:h-12 md:w-14 md:h-14 object-contain filter grayscale group-hover:grayscale-0 transition-all duration-300"
        />

        {/* Bouncy indicator dot */}
        <motion.div
          animate={{
            scale: [1, 1.3, 1],
            opacity: [0.5, 1, 0.5],
          }}
          transition={{
            duration: 2,
            repeat: Infinity,
            ease: "easeInOut",
          }}
          className="absolute -top-1 -right-1 w-3 h-3 bg-blue-500 rounded-full opacity-0 group-hover:opacity-100"
        />
      </div>
    </motion.div>
  );
}

/**
 * Infinite Scrolling Row with smooth animation
 */
function ScrollingRow({ companies, direction = "left", speed = 40 }) {
  const [offset, setOffset] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setOffset((prev) => {
        const newOffset = direction === "left" ? prev - 1 : prev + 1;
        const cardWidth = 112; // width + gap (approx)
        const maxOffset = companies.length * cardWidth;
        
        if (direction === "left" && newOffset <= -maxOffset) {
          return 0;
        } else if (direction === "right" && newOffset >= maxOffset) {
          return 0;
        }
        return newOffset;
      });
    }, speed);

    return () => clearInterval(interval);
  }, [companies.length, direction, speed]);

  // Triple the companies for seamless loop
  const duplicatedCompanies = [...companies, ...companies, ...companies];

  return (
    <div className="relative overflow-hidden w-full">
      <motion.div
        className="flex gap-6 md:gap-8"
        style={{
          transform: `translateX(${offset}px)`,
        }}
      >
        {duplicatedCompanies.map((company, index) => (
          <CompanyLogoCard
            key={`${company.name}-${index}`}
            company={company}
            index={index}
          />
        ))}
      </motion.div>
    </div>
  );
}

/**
 * Main Featured Companies Component with gradient mask
 */
export default function FeaturedCompanies() {
  // Split companies into rows for staggered effect
  const row1 = COMPANIES.slice(0, 8);
  const row2 = COMPANIES.slice(8, 16);
  const navigate = useNavigate();

  return (
    <section className="relative py-20 bg-gradient-to-b from-slate-50 via-white to-slate-50 overflow-hidden">
      {/* Background decoration */}
      <div className="absolute inset-0 bg-[radial-gradient(#e5e7eb_1px,transparent_1px)] [background-size:20px_20px] [mask-image:linear-gradient(0deg,white,rgba(255,255,255,0.6))] opacity-30 pointer-events-none" />
      
      {/* Floating orbs */}
      <motion.div
        animate={{
          y: [0, -30, 0],
          opacity: [0.3, 0.6, 0.3],
        }}
        transition={{
          duration: 6,
          repeat: Infinity,
          ease: "easeInOut",
        }}
        className="absolute top-20 left-10 w-72 h-72 bg-blue-200/20 rounded-full blur-3xl"
      />
      <motion.div
        animate={{
          y: [0, 30, 0],
          opacity: [0.2, 0.5, 0.2],
        }}
        transition={{
          duration: 8,
          repeat: Infinity,
          ease: "easeInOut",
        }}
        className="absolute bottom-20 right-10 w-96 h-96 bg-blue-300/15 rounded-full blur-3xl"
      />

      <div className="relative container mx-auto px-4">
        {/* Section Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="text-center mb-16"
        >
          <motion.span
            initial={{ opacity: 0, scale: 0.9 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
            className="inline-block px-4 py-2 mb-4 text-sm font-semibold text-blue-600 bg-blue-50 rounded-full border border-blue-100"
          >
            Trusted by Industry Leaders
          </motion.span>
          <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold text-slate-900 mb-4">
            Featured Companies
          </h2>
          <p className="text-base sm:text-lg text-slate-600 max-w-2xl mx-auto px-4">
            Join thousands of candidates preparing for interviews at top tech companies
          </p>
        </motion.div>

        {/* Animated Logo Grid with Gradient Mask */}
        <div className="relative">
          {/* Top gradient mask for fade in */}
          <div className="absolute top-0 left-0 right-0 h-24 bg-gradient-to-b from-white via-white/80 to-transparent z-10 pointer-events-none" />
          
          {/* Bottom gradient mask for fade out */}
          <div className="absolute bottom-0 left-0 right-0 h-24 bg-gradient-to-t from-white via-white/80 to-transparent z-10 pointer-events-none" />

          {/* Left edge fade */}
          <div className="absolute top-0 bottom-0 left-0 w-12 sm:w-20 bg-gradient-to-r from-white via-white/50 to-transparent z-10 pointer-events-none" />

          {/* Right edge fade */}
          <div className="absolute top-0 bottom-0 right-0 w-12 sm:w-20 bg-gradient-to-l from-white via-white/50 to-transparent z-10 pointer-events-none" />

          {/* Scrolling Rows */}
          <div className="space-y-8 py-8">
            <ScrollingRow companies={row1} direction="left" speed={30} />
            <ScrollingRow companies={row2} direction="right" speed={35} />
          </div>
        </div>

        {/* CTA */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: 0.3 }}
          className="text-center mt-16"
        >
          <p className="text-slate-600 mb-6">
            Start preparing for your dream company today
          </p>
          <motion.button
            whileHover={{ 
              scale: 1.05, 
              boxShadow: "0 20px 40px rgba(59, 130, 246, 0.3)" 
            }}
            onClick={() => navigate('/signup')}
            whileTap={{ scale: 0.95 }}
            className="px-8 py-4 bg-gradient-to-r from-blue-600 to-blue-700 text-white font-semibold rounded-xl shadow-lg shadow-blue-500/30 hover:shadow-xl hover:shadow-blue-500/40 transition-all duration-300"
          >
            Get Started Now
          </motion.button>
        </motion.div>
      </div>
    </section>
  );
}

// Export for customization
export { COMPANIES };
