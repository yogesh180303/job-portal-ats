
import { useState } from 'react'
import './App.css'

const sampleJobs = [
  {
    id: 1,
    title: 'Software Developer',
    company: 'Tech Solutions',
    location: 'Pune, India',
    type: 'Full-time',
    category: 'Technology',
  },
  {
    id: 2,
    title: 'Data Analyst',
    company: 'Insight Analytics',
    location: 'Remote, India',
    type: 'Full-time',
    category: 'Analytics',
  },
  {
    id: 3,
    title: 'Frontend Developer',
    company: 'Digital Labs',
    location: 'Bengaluru, India',
    type: 'Internship',
    category: 'Technology',
  },
]

function App() {
  const [searchTerm, setSearchTerm] = useState('')

  const filteredJobs = sampleJobs.filter((job) => {
    const searchText = searchTerm.toLowerCase().trim()

    return (
      job.title.toLowerCase().includes(searchText) ||
      job.company.toLowerCase().includes(searchText) ||
      job.location.toLowerCase().includes(searchText) ||
      job.category.toLowerCase().includes(searchText)
    )
  })

  return (
    <div className="app">
      <header className="navbar">
        <a className="brand" href="#" aria-label="CareerHub home">
          <span className="brand-icon">C</span>
          <span>CareerHub</span>
        </a>

        <nav className="nav-links" aria-label="Main navigation">
          <a href="#jobs">Find jobs</a>
          <a href="#about">About</a>
        </nav>

        <div className="nav-actions">
          <button className="button button-outline" type="button">
            Sign in
          </button>
          <button className="button button-primary" type="button">
            Register
          </button>
        </div>
      </header>

      <main>
        <section className="hero">
          <span className="eyebrow">YOUR NEXT CHAPTER STARTS HERE</span>
          <h1>
            Find work that
            <br />
            <span>moves you forward.</span>
          </h1>
          <p className="hero-description">
            Discover opportunities, explore companies, and take
            the next step in your career.
          </p>

          <form
            className="search-form"
            onSubmit={(event) => event.preventDefault()}
          >
            <label className="search-field">
              <span className="search-symbol" aria-hidden="true">
                ⌕
              </span>
              <input
  type="search"
  placeholder="Job title, skill, or company"
  aria-label="Search jobs"
  value={searchTerm}
  onChange={(event) => setSearchTerm(event.target.value)}
/>
            </label>
            <button className="button button-primary search-button" type="submit">
              Search jobs
            </button>
          </form>

          <p className="search-hint">
            Popular searches: <span>React</span> <span>Python</span>{' '}
            <span>Data Analyst</span>
          </p>
        </section>

        <section className="jobs-section" id="jobs">
          <div className="section-heading">
            <div>
              <span className="eyebrow">CAREER OPPORTUNITIES</span>
              <h2>Explore sample jobs</h2>
              <p>Get a preview of opportunities you can discover here.</p>
            </div>
            <span className="job-count">{sampleJobs.length} examples</span>
          </div>

          <div className="job-grid">
  {filteredJobs.length > 0 ? (
    filteredJobs.map((job) => (
      <article className="job-card" key={job.id}>
                <div className="company-icon" aria-hidden="true">
                  {job.company.charAt(0)}
                </div>
                <span className="job-category">{job.category}</span>
                <h3>{job.title}</h3>
                <p className="company-name">{job.company}</p>
                <div className="job-meta">
                  <span>{job.location}</span>
                  <span>{job.type}</span>
                </div>
                <button className="job-link" type="button">
                  View details <span aria-hidden="true">→</span>
                </button>
                    </article>
    ))
  ) : (
    <p className="no-jobs">
      No jobs found. Try another job title, company, or location.
    </p>
  )}
</div>
        </section>

        <section className="about-section" id="about">
          <span className="eyebrow">BUILT FOR YOUR NEXT STEP</span>
          <h2>Your career journey starts here.</h2>
          <p>
            CareerHub is the foundation for our Job Portal and
            Applicant Tracking System. More features will be added
            as we build the project.
          </p>
        </section>
      </main>

      <footer className="footer">
        <a className="brand footer-brand" href="#">
          <span className="brand-icon">C</span>
          <span>CareerHub</span>
        </a>
        <p>Connecting people with opportunities.</p>
      </footer>
    </div>
  )
}

export default App
