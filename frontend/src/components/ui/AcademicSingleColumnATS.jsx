const AcademicSingleColumnATS = ({ data }) => {
  const {
    name,
    links,
    education = [],
    coursework,
    skills,
    projects = [],
    experience = [],
    hobbies = [],
    lastUpdated
  } = data

  return (
    <div className="h-full p-5 max-w-screen bg-gray-100">
      <div className="w-[794px] min-h-[1123px] bg-white mx-auto px-12 py-10 text-[13.5px] leading-[1.45] text-black font-serif">

        {lastUpdated && (
          <div className="text-right text-xs mb-2">
            Last Updated on {lastUpdated}
          </div>
        )}

        <header className="text-center mb-6">
          <h1 className="text-3xl font-bold mb-2">
            {name || 'Your Name'}
          </h1>

          {links && (
            <p className="text-sm">
              {Object.values(links).filter(Boolean).join(' · ')}
            </p>
          )}
        </header>

        {education.length > 0 && (
          <Section title="EDUCATION">
            {education.map((edu, idx) => (
              <div key={idx} className="mb-3">
                <div className="flex justify-between font-semibold">
                  <span>{edu.institution}</span>
                  <span>{edu.date}</span>
                </div>

                {edu.degree && (
                  <div className="italic text-sm">{edu.degree}</div>
                )}

                {edu.location && (
                  <div className="flex justify-between text-sm">
                    <span>{edu.location}</span>
                    <span>{edu.endDate}</span>
                  </div>
                )}

                {edu.gpa && (
                  <div className="text-sm italic">
                    GPA: {edu.gpa}
                  </div>
                )}
              </div>
            ))}
          </Section>
        )}

        {coursework && (
          <Section title="COURSEWORK">
            {coursework.courses && (
              <p className="mb-2">
                <span className="font-semibold">Courses:</span>{' '}
                {coursework.courses.join(', ')}
              </p>
            )}

            {coursework.awards && (
              <p>
                <span className="font-semibold">Awards:</span>{' '}
                {coursework.awards.join(', ')}
              </p>
            )}
          </Section>
        )}

        {skills && (
          <Section title="SKILLS">
            {skills.languages && (
              <p className="mb-1">
                <span className="font-semibold">Languages:</span>{' '}
                {skills.languages.join(', ')}
              </p>
            )}

            {skills.tools && (
              <p>
                <span className="font-semibold">Tools:</span>{' '}
                {skills.tools.join(', ')}
              </p>
            )}
          </Section>
        )}

        {projects.length > 0 && (
          <Section title="PROJECTS">
            {projects.map((proj, idx) => (
              <div key={idx} className="mb-4">
                <div className="flex justify-between font-semibold">
                  <span>{proj.title}</span>
                  <span>{proj.date}</span>
                </div>

                {proj.tech && (
                  <div className="italic text-sm mb-1">
                    {proj.tech.join(', ')}
                  </div>
                )}

                <ul className="list-disc ml-5">
                  {(proj.points || []).map((p, i) => (
                    <li key={i}>{p}</li>
                  ))}
                </ul>
              </div>
            ))}
          </Section>
        )}

        {experience.length > 0 && (
          <Section title="EXPERIENCE">
            {experience.map((exp, idx) => (
              <div key={idx} className="flex justify-between mb-2">
                <span className="font-semibold">
                  {exp.org} {exp.role && `| ${exp.role}`}
                </span>
                <span>{exp.date}</span>
              </div>
            ))}
          </Section>
        )}

        {hobbies.length > 0 && (
          <Section title="HOBBIES">
            {hobbies.map((hobby, idx) => (
              <div key={idx}>{hobby}</div>
            ))}
          </Section>
        )}
      </div>
    </div>
  )
}

const Section = ({ title, children }) => (
  <section className="mb-6">
    <h2 className="text-sm font-bold uppercase border-b border-black mb-2">
      {title}
    </h2>
    {children}
  </section>
)

export default AcademicSingleColumnATS
