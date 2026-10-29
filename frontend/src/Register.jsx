import { Link } from 'react-router-dom'
import './Auth.css'

function Register() {
  return (
    <main className="auth-page">
      <section className="auth-card">
        <a className="brand" href="/">
          <span className="brand-icon">C</span>
          <span>CareerHub</span>
        </a>

        <div className="auth-heading">
          <h1>Create your account</h1>
          <p>Join CareerHub and take the next step in your career.</p>
        </div>

        <form className="auth-form" onSubmit={(event) => event.preventDefault()}>
          <label>
            Username
            <input
              type="text"
              name="username"
              placeholder="Choose a username"
              autoComplete="username"
              required
            />
          </label>

          <label>
            Email address
            <input
              type="email"
              name="email"
              placeholder="you@example.com"
              autoComplete="email"
              required
            />
          </label>

          <label>
            Password
            <input
              type="password"
              name="password"
              placeholder="At least 8 characters"
              autoComplete="new-password"
              minLength={8}
              required
            />
          </label>

          <button className="button button-primary auth-submit" type="submit">
            Create account
          </button>
        </form>

        <p className="auth-switch">
          Already have an account? <Link to="/login">Sign in</Link>
        </p>
      </section>
    </main>
  )
}

export default Register