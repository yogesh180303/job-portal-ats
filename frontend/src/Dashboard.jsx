
import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import "./Dashboard.css";

const API_URL = "http://127.0.0.1:8000/api";

function Dashboard() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [unreadNotifications, setUnreadNotifications] = useState(0);

  const [applications, setApplications] = useState([]);
  const [profileCompletion, setProfileCompletion] = useState(0);
  const [applicationStats, setApplicationStats] = useState({
    total: 0,
    underReview: 0,
    shortlisted: 0,
    interview: 0,
    selected: 0,
    rejected: 0,
  });

  const navigate = useNavigate();

  useEffect(() => {
    const accessToken = sessionStorage.getItem("accessToken");

    if (!accessToken) {
      navigate("/login");
      return;
    }

    const fetchData = async (endpoint) => {
      const response = await fetch(`${API_URL}${endpoint}`, {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      });

      if (!response.ok) {
        throw new Error(`Unable to load ${endpoint}.`);
      }

      return response.json();
    };

    const fetchDashboard = async () => {
      try {
        const userData = await fetchData("/auth/me/");
        setUser(userData);

        if (userData.role === "CANDIDATE") {
          const results = await Promise.allSettled([
            fetchData("/notifications/"),
            fetchData("/auth/profile/"),
            fetchData("/education/"),
            fetchData("/experience/"),
            fetchData("/skills/"),
            fetchData("/resumes/"),
            fetchData("/applications/"),
          ]);

          const getResult = (index, fallback) => {
            return results[index].status === "fulfilled"
              ? results[index].value
              : fallback;
          };

          const notifications = getResult(0, {});
          const profile = getResult(1, {});
          const education = getResult(2, []);
          const experience = getResult(3, []);
          const skills = getResult(4, []);
          const resumes = getResult(5, []);
          const applicationData = getResult(6, []);

          setUnreadNotifications(notifications.unread_count || 0);

          const completionChecks = [
            Boolean(profile.full_name?.trim()),
            Boolean(profile.phone?.trim()),
            Boolean(profile.location?.trim()),
            Boolean(profile.professional_summary?.trim()),
            education.length > 0,
            experience.length > 0,
            skills.length > 0,
            resumes.length > 0,
          ];

          const completedItems = completionChecks.filter(Boolean).length;
          setProfileCompletion(
            Math.round((completedItems / completionChecks.length) * 100)
          );

          const stats = {
            total: applicationData.length,
            underReview: applicationData.filter((app) =>
              ["APPLIED", "UNDER_REVIEW"].includes(app.status)
            ).length,
            shortlisted: applicationData.filter(
              (app) => app.status === "SHORTLISTED"
            ).length,
            interview: applicationData.filter(
              (app) => app.status === "INTERVIEW"
            ).length,
            selected: applicationData.filter(
              (app) => app.status === "SELECTED"
            ).length,
            rejected: applicationData.filter(
              (app) => app.status === "REJECTED"
            ).length,
          };

          setApplicationStats(stats);
          setApplications(applicationData.slice(0, 5));
        }
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchDashboard();
  }, [navigate]);

  const handleLogout = () => {
    sessionStorage.removeItem("accessToken");
    sessionStorage.removeItem("refreshToken");
    navigate("/login");
  };

  const formatDate = (dateValue) => {
    if (!dateValue) return "Not available";

    const date = new Date(dateValue);

    if (Number.isNaN(date.getTime())) return "Not available";

    return date.toLocaleDateString("en-IN", {
      day: "numeric",
      month: "short",
      year: "numeric",
    });
  };

  const formatStatus = (status) => {
    if (!status) return "Unknown";

    return status
      .replaceAll("_", " ")
      .toLowerCase()
      .replace(/\b\w/g, (letter) => letter.toUpperCase());
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
          <span className="eyebrow">
            {user.role === "CANDIDATE"
              ? "CANDIDATE DASHBOARD"
              : "CAREERHUB DASHBOARD"}
          </span>

          <h1>Welcome back, {user.username}!</h1>

          <p>
            Manage your job search and keep track of your career journey.
          </p>
        </section>

        {user.role === "CANDIDATE" && (
          <>
            <section className="dashboard-section">
              <div className="dashboard-section-heading">
                <div>
                  <span className="eyebrow">YOUR PROGRESS</span>
                  <h2>Application Overview</h2>
                </div>
                <Link to="/applications" className="dashboard-text-link">
                  View all applications
                </Link>
              </div>

              <div className="dashboard-stats-grid">
                <article className="dashboard-stat-card">
                  <span>Total Applications</span>
                  <strong>{applicationStats.total}</strong>
                </article>

                <article className="dashboard-stat-card">
                  <span>Under Review</span>
                  <strong>{applicationStats.underReview}</strong>
                </article>

                <article className="dashboard-stat-card">
                  <span>Shortlisted</span>
                  <strong>{applicationStats.shortlisted}</strong>
                </article>

                <article className="dashboard-stat-card">
                  <span>Interviews</span>
                  <strong>{applicationStats.interview}</strong>
                </article>

                <article className="dashboard-stat-card">
                  <span>Selected</span>
                  <strong>{applicationStats.selected}</strong>
                </article>

                <article className="dashboard-stat-card">
                  <span>Rejected</span>
                  <strong>{applicationStats.rejected}</strong>
                </article>
              </div>
            </section>

            <section className="dashboard-section dashboard-progress-card">
              <div className="dashboard-section-heading">
                <div>
                  <span className="eyebrow">BUILD YOUR PROFILE</span>
                  <h2>Profile Completion</h2>
                </div>
                <strong className="dashboard-completion-value">
                  {profileCompletion}%
                </strong>
              </div>

              <div
                className="dashboard-progress-track"
                role="progressbar"
                aria-valuenow={profileCompletion}
                aria-valuemin="0"
                aria-valuemax="100"
                aria-label="Profile completion"
              >
                <div
                  className="dashboard-progress-fill"
                  style={{ width: `${profileCompletion}%` }}
                />
              </div>

              <p>
                {profileCompletion === 100
                  ? "Excellent! Your profile is complete."
                  : "Complete your profile to help recruiters understand your qualifications."}
              </p>

              <Link to="/profile" className="button button-primary">
                Complete Your Profile
              </Link>
            </section>

            <section className="dashboard-section">
              <div className="dashboard-section-heading">
                <div>
                  <span className="eyebrow">LATEST ACTIVITY</span>
                  <h2>Recent Applications</h2>
                </div>
                <Link to="/applications" className="dashboard-text-link">
                  View all
                </Link>
              </div>

              {applications.length === 0 ? (
                <div className="dashboard-empty-state">
                  <h3>No applications yet</h3>
                  <p>
                    Start exploring jobs and submit your first application.
                  </p>
                  <Link to="/" className="button button-primary">
                    Explore Jobs
                  </Link>
                </div>
              ) : (
                <div className="dashboard-table-wrapper">
                  <table className="dashboard-applications-table">
                    <thead>
                      <tr>
                        <th>Job Title</th>
                        <th>Company</th>
                        <th>Applied On</th>
                        <th>Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {applications.map((application) => (
                        <tr key={application.id}>
                          <td>{application.job_title || "Untitled Job"}</td>
                          <td>{application.company_name || "Not available"}</td>
                          <td>{formatDate(application.applied_at)}</td>
                          <td>
                            <span
                              className={`dashboard-status dashboard-status-${(
                                application.status || "unknown"
                              ).toLowerCase()}`}
                            >
                              {formatStatus(application.status)}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </section>
          </>
        )}

        <section className="dashboard-grid">
          {user.role === "CANDIDATE" && (
            <article className="dashboard-card">
              <div className="dashboard-icon">🔔</div>
              <h2>Notifications</h2>
              <p>
                You have {unreadNotifications} unread notification(s) about
                your job applications.
              </p>
              <Link to="/notifications" className="button button-primary">
                View Notifications
              </Link>
            </article>
          )}

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
            <p>Keep interesting job opportunities in one place.</p>
            {user.role === "CANDIDATE" && (
              <Link to="/saved-jobs" className="button button-primary">
                View Saved Jobs
              </Link>
            )}
          </article>

          <article className="dashboard-card">
            <div className="dashboard-icon">👤</div>
            <h2>My Profile</h2>
            <p>
              View your account details and prepare your professional profile.
            </p>
            <Link to="/profile" className="button button-primary">
              View Profile
            </Link>
          </article>

          <article className="dashboard-card">
            <div className="dashboard-icon">📁</div>
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

          {["RECRUITER", "ADMIN"].includes(user.role) && (
            <article className="dashboard-card">
              <div className="dashboard-icon">👥</div>
              <h2>Manage Applicants</h2>
              <p>
                Review candidates who applied for your jobs and update their
                application status.
              </p>
              <Link to="/applicants" className="button button-primary">
                View Applicants
              </Link>
            </article>
          )}
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
        &copy; 2026 CareerHub. All rights reserved.
      </footer>
    </div>
  );
}

export default Dashboard;
