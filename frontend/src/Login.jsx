import { Link } from 'react-router-dom'
import './Auth.css'

function Login() {
  return (
    <main className="auth-page">
      <section className="auth-card">
        <a className="brand" href="/">
          <span className="brand-icon">C</span>
          <span>CareerHub</span>
        </a>

        <div className="auth-heading">
          <h1>Welcome back</h1>
          <p>Sign in to continue your career journey.</p>
        </div>

        <form className="auth-form" onSubmit={(event) => event.preventDefault()}>
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
              placeholder="Enter your password"
              autoComplete="current-password"
              required
            />
          </label>

          <button className="button button-primary auth-submit" type="submit">
            Sign in
          </button>
        </form>

        <p className="auth-switch">
         New to CareerHub? <Link to="/register">Create an account</Link>
        </p>
      </section>
    </main>
  )
}

export default Login