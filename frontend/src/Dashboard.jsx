import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import "./Dashboard.css";

function Dashboard() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const navigate = useNavigate();

  useEffect(() => {
    const accessToken = sessionStorage.getItem("accessToken");

    if (!accessToken) {
      navigate("/login");
      return;
    }

    const fetchProfile = async () => {
      try {
        const response = await fetch(
          "http://127.0.0.1:8000/api/auth/me/",
          {
            method: "GET",
            headers: {
              Authorization: `Bearer ${accessToken}`,
            },
          }
        );

        if (!response.ok) {
          throw new Error("Your session has expired. Please log in again.");
        }

        const data = await response.json();
        setUser(data);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchProfile();
  }, [navigate]);

  const handleLogout = () => {
    sessionStorage.removeItem("accessToken");
    sessionStorage.removeItem("refreshToken");
    navigate("/login");
  };

  if (loading) {
    return (
      <div className="dashboard-page">
        <div className="dashboard-content">
          <p>Loading your dashboard...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="dashboard-page">
        <div className="dashboard-content">
          <p className="form-error">{error}</p>
          <Link to="/login" className="button button-primary">
            Go to Login
          </Link>
        </div>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  return (
    <div className="dashboard-page">
      <nav className="navbar">
        <Link to="/" className="brand">
          Career<span>Hub</span>
        </Link>

        <button
          type="button"
          className="button button-outline"
          onClick={handleLogout}
        >
          Logout
        </button>
      </nav>

      <main className="dashboard-content">
        <section className="dashboard-welcome">
          <span className="eyebrow">CANDIDATE DASHBOARD</span>

          <h1>
            Welcome back, {user.username}!
          </h1>

          <p>
            Manage your job search and keep track of your career journey.
          </p>
        </section>

        <section className="dashboard-grid">
          <article className="dashboard-card">
  <div className="dashboard-icon">📄</div>
  <h2>My Applications</h2>
  <p>
    Track the jobs you have applied for and monitor their status.
  </p>
  <Link to="/applications" className="button button-primary">
    View Applications
  </Link>
</article>

          <article className="dashboard-card">
            <div className="dashboard-icon">⭐</div>
            <h2>Saved Jobs</h2>
            <p>
              Keep interesting job opportunities in one place.
            </p>
          </article>

          <article className="dashboard-card">
            <div className="dashboard-icon">👤</div>
            <h2>My Profile</h2>
            <p>
              View your account details and prepare your professional profile.
            </p>
          </article>
        </section>

                {["RECRUITER", "ADMIN"].includes(user.role) && (
          <article className="dashboard-card">
            <div className="dashboard-icon">👥</div>
            <h2>Manage Applicants</h2>
            <p>
              Review candidates who applied for your jobs and update their application status.
            </p>
            <Link to="/applicants" className="button button-primary">
              View Applicants
            </Link>
          </article>
        )}

        <article className="dashboard-card">
  <div className="dashboard-icon">💻</div>
  <h2>My Skills</h2>
  <p>
    Add, update, and manage your technical and professional skills.
  </p>
  <Link to="/skills" className="button button-primary">
    Manage Skills
  </Link>
</article>

<article className="dashboard-card">
  <div className="dashboard-icon">📄</div>
  <h2>My Resumes</h2>
  <p>
    Upload, view, download, and manage your professional resumes.
  </p>
  <Link to="/resumes" className="button button-primary">
    Manage Resumes
  </Link>
</article>

        <section className="dashboard-card dashboard-profile">
          <h2>Account Information</h2>

          <p>
            <strong>Username:</strong> {user.username}
          </p>

          <p>
            <strong>Email:</strong> {user.email}
          </p>

          <p>
            <strong>Role:</strong> {user.role}
          </p>
        </section>

        <div className="dashboard-actions">
          <Link to="/" className="button button-primary">
            Explore Jobs
          </Link>

          <button
            type="button"
            className="button button-outline"
            onClick={handleLogout}
          >
            Sign Out
          </button>
        </div>
      </main>

      <footer className="dashboard-footer">
        © 2026 CareerHub. All rights reserved.
      </footer>
    </div>
  );
}

export default Dashboard;