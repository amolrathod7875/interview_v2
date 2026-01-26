const ClassicATS = ({ data = {} }) => {
  const {
    name,
    contact,
    experience = [],
    projects = [],
    education = [],
    skills = {}
  } = data

  return (
    <div className="h-full p-5 max-w-screen bg-gray-100">
      <div className="w-[794px] bg-white min-h-[1123px] mx-auto px-10 py-8 text-[13px] leading-[1.4] text-gray-900 font-sans">

        {/* Header */}
        <header className="text-center mb-4">
          <h1 className="text-2xl font-bold">
            {name || 'Your Name'}
          </h1>

          {contact && (
            <p className="text-sm mt-1">
              {Object.values(contact).filter(Boolean).join(' | ')}
            </p>
          )}
        </header>

        {/* Experience */}
        {experience.length > 0 && (
          <Section title="EXPERIENCE">
            {experience.map((exp, idx) => (
              <div key={idx} className="mb-3">
                <div className="flex justify-between font-semibold">
                  <span>{exp.company}</span>
                  <span className="text-sm">{exp.date}</span>
                </div>

                <div className="flex justify-between italic text-sm">
                  <span>{exp.role}</span>
                  <span>{exp.location}</span>
                </div>

                <ul className="list-disc ml-5 mt-1">
                  {(exp.points || []).map((p, i) => (
                    <li key={i}>{p}</li>
                  ))}
                </ul>
              </div>
            ))}
          </Section>
        )}

        {/* Projects */}
        {projects.length > 0 && (
          <Section title="PROJECTS">
            {projects.map((proj, idx) => (
              <div key={idx} className="mb-3">
                <div className="font-semibold">{proj.title}</div>
                <ul className="list-disc ml-5 mt-1">
                  {(proj.points || []).map((p, i) => (
                    <li key={i}>{p}</li>
                  ))}
                </ul>
              </div>
            ))}
          </Section>
        )}

        {/* Education */}
        {education.length > 0 && (
          <Section title="EDUCATION">
            {education.map((edu, idx) => (
              <div key={idx} className="mb-3">
                <div className="flex justify-between font-semibold">
                  <span>{edu.institution}</span>
                  <span className="text-sm">{edu.date}</span>
                </div>

                <div className="italic text-sm">
                  {edu.degree}
                  {edu.location && `, ${edu.location}`}
                </div>

                {edu.details && (
                  <ul className="list-disc ml-5 mt-1">
                    {edu.details.map((d, i) => (
                      <li key={i}>{d}</li>
                    ))}
                  </ul>
                )}
              </div>
            ))}
          </Section>
        )}

        {/* Skills */}
        {skills && (
          <Section title="SKILLS">
            <div className="space-y-1">
              {skills.languages && (
                <div>
                  <span className="font-semibold">Languages:</span>{' '}
                  {skills.languages.join(', ')}
                </div>
              )}

              {skills.tools && (
                <div>
                  <span className="font-semibold">Tools:</span>{' '}
                  {skills.tools.join(', ')}
                </div>
              )}
            </div>
          </Section>
        )}

      </div>
    </div>
  )
}

const Section = ({ title, children }) => (
  <section className="mb-4">
    <h2 className="text-sm font-bold border-b border-gray-300 mb-2">
      {title}
    </h2>
    {children}
  </section>
)

export default ClassicATS
