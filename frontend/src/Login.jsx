
import { useState } from 'react'
import { Link, useNavigate } from "react-router-dom";
import './Auth.css'

function Login() {
  const navigate = useNavigate();

  const [isSubmitting, setIsSubmitting] = useState(false)
  const [successMessage, setSuccessMessage] = useState('')
  const [errorMessage, setErrorMessage] = useState('')

  async function handleSubmit(event) {
    event.preventDefault()

    const form = event.currentTarget
    setIsSubmitting(true)
    setSuccessMessage('')
    setErrorMessage('')

    const formData = new FormData(form)

    const loginData = {
      email: formData.get('email'),
      password: formData.get('password'),
    }

    try {
      const response = await fetch(
        'http://127.0.0.1:8000/api/auth/login/',
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(loginData),
        }
      )

      const data = await response.json()

      if (!response.ok) {
        throw new Error(
          data.detail || 'Login failed. Please check your credentials.'
        )
      }

      sessionStorage.setItem('accessToken', data.access)
      sessionStorage.setItem('refreshToken', data.refresh)

      navigate("/dashboard");

    } catch (error) {
      setErrorMessage(error.message)
    } finally {
      setIsSubmitting(false)
    }
  }

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

        <form className="auth-form" onSubmit={handleSubmit}>
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

          {errorMessage && (
            <p className="form-message form-error">{errorMessage}</p>
          )}

          {successMessage && (
            <p className="form-message form-success">{successMessage}</p>
          )}

          <button
            className="button button-primary auth-submit"
            type="submit"
            disabled={isSubmitting}
          >
            {isSubmitting ? 'Signing in...' : 'Sign in'}
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
