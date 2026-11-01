
import { useState } from 'react'
import { Link } from 'react-router-dom'
import './Auth.css'

function Register() {
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [successMessage, setSuccessMessage] = useState('')
  const [errorMessage, setErrorMessage] = useState('')

  async function handleSubmit(event) {
    event.preventDefault()
    const form = event.currentTarget

    setIsSubmitting(true)
    setSuccessMessage('')
    setErrorMessage('')

    const formData = new FormData(event.currentTarget)

    const registrationData = {
      username: formData.get('username'),
      email: formData.get('email'),
      password: formData.get('password'),
    }

    try {
      const response = await fetch(
        'http://127.0.0.1:8000/api/auth/register/',
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(registrationData),
        },
      )

      const data = await response.json()

      if (!response.ok) {
        const messages = Object.entries(data)
          .map(([field, errors]) => {
            const details = Array.isArray(errors)
              ? errors.join(' ')
              : String(errors)

            return `${field}: ${details}`
          })
          .join(' ')

        throw new Error(messages || 'Registration failed. Please try again.')
      }

      setSuccessMessage(
        'Account created successfully! You can now sign in.',
      )
      form.reset()
    } catch (error) {
      setErrorMessage(
        error.message ||
          'Could not connect to the server. Please try again.',
      )
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
          <h1>Create your account</h1>
          <p>Join CareerHub and take the next step in your career.</p>
        </div>

        <form className="auth-form" onSubmit={handleSubmit}>
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

          {errorMessage && (
            <p role="alert" className="form-message form-error">
              {errorMessage}
            </p>
          )}

          {successMessage && (
            <p role="status" className="form-message form-success">
              {successMessage}
            </p>
          )}

          <button
            className="button button-primary auth-submit"
            type="submit"
            disabled={isSubmitting}
          >
            {isSubmitting ? 'Creating account...' : 'Create account'}
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
