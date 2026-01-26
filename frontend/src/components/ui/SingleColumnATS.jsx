const SingleColumnATS = ({ data = {} }) => {
  const {
    name,
    contact,
    education = [],
    experience = [],
    skills = {},
    projects = [],
    awards = []
  } = data

  return (
    <div className="h-full p-5 max-w-screen bg-gray-100">
      <div className="w-[794px] min-h-[1123px] bg-white mx-auto px-12 py-10 text-[13.5px] leading-[1.45] text-black font-sans">

        {/* Header */}
        <header className="text-center mb-6">
          <h1 className="text-3xl font-bold mb-2">
            {name || 'Your Name'}
          </h1>

          {contact && (
            <p className="text-sm text-gray-700">
              {Object.values(contact).filter(Boolean).join(' | ')}
            </p>
          )}
        </header>

        {/* Education */}
        {education.length > 0 && (
          <Section title="EDUCATION">
            {education.map((edu, idx) => (
              <div key={idx} className="mb-3">
                <div className="flex justify-between font-semibold">
                  <span>
                    {edu.institution}
                    {edu.gpa && ` | ${edu.gpa}`}
                  </span>
                  <span>{edu.date}</span>
                </div>

                <div className="italic flex justify-between text-sm">
                  <span>{edu.degree}</span>
                  <span>{edu.location}</span>
                </div>

                {(edu.details || []).length > 0 && (
                  <ul className="list-disc ml-5 mt-2">
                    {edu.details.map((d, i) => (
                      <li key={i}>{d}</li>
                    ))}
                  </ul>
                )}
              </div>
            ))}
          </Section>
        )}

        {/* Experience */}
        {experience.length > 0 && (
          <Section title="EXPERIENCE">
            {experience.map((exp, idx) => (
              <div key={idx} className="mb-4">
                <div className={`flex justify-between font-semibold ${exp.highlight ? 'text-blue-700' : ''}`}>
                  <span>{exp.company}</span>
                  <span>{exp.date}</span>
                </div>

                <div className="italic flex justify-between text-sm">
                  <span>{exp.role}</span>
                  <span>{exp.location}</span>
                </div>

                <ul className="list-disc ml-5 mt-2">
                  {(exp.points || []).map((p, i) => (
                    <li key={i}>{p}</li>
                  ))}
                </ul>
              </div>
            ))}
          </Section>
        )}

        {/* Skills */}
        {skills && (
          <Section title="SKILLS">
            <ul className="list-disc ml-5 space-y-1">
              {skills.languages && (
                <li>
                  <span className="font-semibold">Languages:</span>{' '}
                  {skills.languages.join(', ')}
                </li>
              )}

              {skills.technologies && (
                <li>
                  <span className="font-semibold">Technologies:</span>{' '}
                  {skills.technologies.join(', ')}
                </li>
              )}
            </ul>
          </Section>
        )}

        {/* Projects */}
        {projects.length > 0 && (
          <Section title="PROJECTS">
            {projects.map((proj, idx) => (
              <div key={idx} className="mb-3">
                <div className="font-semibold text-blue-700">
                  {proj.title}
                </div>

                <ul className="list-disc ml-5 mt-2">
                  {(proj.points || []).map((p, i) => (
                    <li key={i}>{p}</li>
                  ))}
                </ul>
              </div>
            ))}
          </Section>
        )}

        {/* Awards */}
        {awards.length > 0 && (
          <Section title="AWARDS">
            <ul className="list-disc ml-5 space-y-1">
              {awards.map((award, idx) => (
                <li key={idx}>{award}</li>
              ))}
            </ul>
          </Section>
        )}

      </div>
    </div>
  )
}

const Section = ({ title, children }) => (
  <section className="mb-6">
    <h2 className="text-sm font-bold tracking-wide border-b border-black mb-2">
      {title}
    </h2>
    {children}
  </section>
)

export default SingleColumnATS
