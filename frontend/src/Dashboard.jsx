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

  const [recruiterJobs, setRecruiterJobs] = useState([]);
  const [recruiterApplications, setRecruiterApplications] = useState([]);
  const [recruiterJobStats, setRecruiterJobStats] = useState({
    total: 0,
    active: 0,
    draft: 0,
    closed: 0,
  });
  const [recruiterApplicationStats, setRecruiterApplicationStats] = useState({
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

        if (userData.role === "RECRUITER") {
          const results = await Promise.allSettled([
            fetchData("/jobs/"),
            fetchData("/applications/"),
          ]);

          const jobsResult = results[0];
          const applicationsResult = results[1];

          if (jobsResult.status === "rejected") {
            throw jobsResult.reason;
          }

          if (applicationsResult.status === "rejected") {
            throw applicationsResult.reason;
          }

          // Count only jobs owned by the currently logged-in recruiter.
          const ownJobs = jobsResult.value.filter(
            (job) => job.recruiter === userData.id
          );

          const recruiterApplicationData = applicationsResult.value;

          const jobStats = {
            total: ownJobs.length,
            active: ownJobs.filter((job) => job.status === "PUBLISHED").length,
            draft: ownJobs.filter((job) => job.status === "DRAFT").length,
            closed: ownJobs.filter((job) => job.status === "CLOSED").length,
          };

          const applicantStats = {
            total: recruiterApplicationData.length,
            underReview: recruiterApplicationData.filter((app) =>
              ["APPLIED", "UNDER_REVIEW"].includes(app.status)
            ).length,
            shortlisted: recruiterApplicationData.filter(
              (app) => app.status === "SHORTLISTED"
            ).length,
            interview: recruiterApplicationData.filter(
              (app) => app.status === "INTERVIEW"
            ).length,
            selected: recruiterApplicationData.filter(
              (app) => app.status === "SELECTED"
            ).length,
            rejected: recruiterApplicationData.filter(
              (app) => app.status === "REJECTED"
            ).length,
          };

          const recentApplications = [...recruiterApplicationData].sort(
            (first, second) =>
              new Date(second.applied_at || 0) -
              new Date(first.applied_at || 0)
          );

          setRecruiterJobs(ownJobs);
          setRecruiterApplications(recentApplications.slice(0, 5));
          setRecruiterJobStats(jobStats);
          setRecruiterApplicationStats(applicantStats);
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
              : user.role === "RECRUITER"
                ? "RECRUITER DASHBOARD"
                : "CAREERHUB DASHBOARD"}
          </span>

          <h1>Welcome back, {user.username}!</h1>

          <p>
            {user.role === "RECRUITER"
              ? "Manage your job postings, review applicants, and track hiring progress."
              : "Manage your job search and keep track of your career journey."}
          </p>
        </section>

        {user.role === "RECRUITER" && (
          <>
            <section className="dashboard-section">
              <div className="dashboard-section-heading">
                <div>
                  <span className="eyebrow">YOUR JOB POSTINGS</span>
                  <h2>Job Overview</h2>
                </div>

                <Link to="/jobs" className="dashboard-text-link">
                  Manage jobs
                </Link>
              </div>

              <div className="dashboard-stats-grid">
                <article className="dashboard-stat-card">
                  <span>Total Jobs</span>
                  <strong>{recruiterJobStats.total}</strong>
                </article>

                <article className="dashboard-stat-card">
                  <span>Active Jobs</span>
                  <strong>{recruiterJobStats.active}</strong>
                </article>

                <article className="dashboard-stat-card">
                  <span>Draft Jobs</span>
                  <strong>{recruiterJobStats.draft}</strong>
                </article>

                <article className="dashboard-stat-card">
                  <span>Closed Jobs</span>
                  <strong>{recruiterJobStats.closed}</strong>
                </article>
              </div>
            </section>

            <section className="dashboard-section">
              <div className="dashboard-section-heading">
                <div>
                  <span className="eyebrow">HIRING ACTIVITY</span>
                  <h2>Applicant Overview</h2>
                </div>

                <Link to="/applicants" className="dashboard-text-link">
                  View applicants
                </Link>
              </div>

              <div className="dashboard-stats-grid">
                <article className="dashboard-stat-card">
                  <span>Total Applicants</span>
                  <strong>{recruiterApplicationStats.total}</strong>
                </article>

                <article className="dashboard-stat-card">
                  <span>Under Review</span>
                  <strong>{recruiterApplicationStats.underReview}</strong>
                </article>

                <article className="dashboard-stat-card">
                  <span>Shortlisted</span>
                  <strong>{recruiterApplicationStats.shortlisted}</strong>
                </article>

                <article className="dashboard-stat-card">
                  <span>Interviews</span>
                  <strong>{recruiterApplicationStats.interview}</strong>
                </article>

                <article className="dashboard-stat-card">
                  <span>Selected</span>
                  <strong>{recruiterApplicationStats.selected}</strong>
                </article>

                <article className="dashboard-stat-card">
                  <span>Rejected</span>
                  <strong>{recruiterApplicationStats.rejected}</strong>
                </article>
              </div>
            </section>

            <section className="dashboard-section">
              <div className="dashboard-section-heading">
                <div>
                  <span className="eyebrow">LATEST HIRING ACTIVITY</span>
                  <h2>Recent Applicants</h2>
                </div>

                <Link to="/applicants" className="dashboard-text-link">
                  View all applicants
                </Link>
              </div>

              {recruiterApplications.length === 0 ? (
                <div className="dashboard-empty-state">
                  <h3>No applicants yet</h3>
                  <p>
                    Applicants will appear here when candidates apply to your
                    published jobs.
                  </p>

                  <Link to="/jobs" className="button button-primary">
                    Manage Jobs
                  </Link>
                </div>
              ) : (
                <div className="dashboard-table-wrapper">
                  <table className="dashboard-applications-table">
                    <thead>
                      <tr>
                        <th>Candidate</th>
                        <th>Job Title</th>
                        <th>Applied On</th>
                        <th>Status</th>
                      </tr>
                    </thead>

                    <tbody>
                      {recruiterApplications.map((application) => (
                        <tr key={application.id}>
                          <td>
                            {application.candidate_name || "Candidate"}
                          </td>
                          <td>
                            {application.job_title || "Untitled Job"}
                          </td>
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

            <section className="dashboard-section">
              <div className="dashboard-section-heading">
                <div>
                  <span className="eyebrow">QUICK ACTIONS</span>
                  <h2>Manage Your Hiring</h2>
                </div>
              </div>

              <div className="dashboard-grid">
                <article className="dashboard-card">
                  <div className="dashboard-icon" aria-hidden="true">
                    +
                  </div>
                  <h2>Post a Job</h2>
                  <p>Create a new job opening and publish it for candidates.</p>
                  <Link to="/jobs" className="button button-primary">
                    Create Job
                  </Link>
                </article>

                <article className="dashboard-card">
                  <div className="dashboard-icon" aria-hidden="true">
                    J
                  </div>
                  <h2>Manage Jobs</h2>
                  <p>
                    Edit your job postings, publish drafts, or close positions.
                  </p>
                  <Link to="/jobs" className="button button-primary">
                    Manage Jobs
                  </Link>
                </article>

                <article className="dashboard-card">
                  <div className="dashboard-icon" aria-hidden="true">
                    A
                  </div>
                  <h2>View Applicants</h2>
                  <p>
                    Review candidates and update their application status.
                  </p>
                  <Link to="/applicants" className="button button-primary">
                    View Applicants
                  </Link>
                </article>

                {/* Phase 19: Company Profile Quick Action */}
                <article className="dashboard-card">
                  <div className="dashboard-icon" aria-hidden="true">
                    C
                  </div>
                  <h2>Company Profile</h2>
                  <p>
                    Manage your company information, logo, website, and
                    organization details.
                  </p>
                  <Link
                    to="/company-profile"
                    className="button button-primary"
                  >
                    Manage Company Profile
                  </Link>
                </article>
              </div>
            </section>
          </>
        )}

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
                          <td>
                            {application.job_title || "Untitled Job"}
                          </td>
                          <td>
                            {application.company_name || "Not available"}
                          </td>
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

          {user.role === "CANDIDATE" && (
            <>
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
                <div className="dashboard-icon">📋</div>
                <h2>My Resumes</h2>
                <p>
                  Upload, view, download, and manage your professional resumes.
                </p>
                <Link to="/resumes" className="button button-primary">
                  Manage Resumes
                </Link>
              </article>
            </>
          )}

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

          {user.role === "ADMIN" && (
            <article className="dashboard-card">
              <div className="dashboard-icon">👥</div>
              <h2>Manage Applicants</h2>
              <p>
                Review applications across the platform and update their status.
              </p>
              <Link to="/applicants" className="button button-primary">
                View Applicants
              </Link>
            </article>
          )}
        </section>

        <div className="dashboard-actions">
          {user.role === "CANDIDATE" && (
            <Link to="/" className="button button-primary">
              Explore Jobs
            </Link>
          )}

          {user.role === "RECRUITER" && (
            <Link to="/jobs" className="button button-primary">
              Manage Jobs
            </Link>
          )}

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