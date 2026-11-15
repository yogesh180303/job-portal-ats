import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import "./Dashboard.css";

import {
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Tooltip,
  Legend,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
} from "recharts";

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
  const [recruiterAllApplications, setRecruiterAllApplications] = useState([]);
  const [recruiterInterviews, setRecruiterInterviews] = useState([]);
  const [recruiterInterviewFeedback, setRecruiterInterviewFeedback] = useState([]);

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

        // Candidate dashboard data
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

        // Recruiter dashboard data
        if (userData.role === "RECRUITER") {
          const results = await Promise.allSettled([
  fetchData("/jobs/"),
  fetchData("/applications/"),
  fetchData("/interviews/"),
  fetchData("/interview-feedback/"),
]);

          const jobsResult = results[0];
          const applicationsResult = results[1];
          const interviewsResult = results[2];
          const feedbackResult = results[3];

          if (jobsResult.status === "rejected") {
            throw jobsResult.reason;
          }

          if (applicationsResult.status === "rejected") {
            throw applicationsResult.reason;
          }

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

          // Keep all applications for analytics.
          setRecruiterAllApplications(recruiterApplicationData);
          setRecruiterInterviews(
  interviewsResult.status === "fulfilled"
    ? interviewsResult.value
    : []
);

setRecruiterInterviewFeedback(
  feedbackResult.status === "fulfilled"
    ? feedbackResult.value
    : []
);

          // Keep only five for the recent applicants table.
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

  const exportRecruiterApplications = () => {
  if (recruiterAllApplications.length === 0) {
    return;
  }

  const headers = [
    "Candidate Name",
    "Candidate Email",
    "Location",
    "Job Title",
    "Company",
    "Application Status",
    "Applied At",
    "Last Updated",
  ];

  const escapeCsvValue = (value) => {
    const text = String(value ?? "");
    const safeText = /^[\t\r ]*[=+\-@]/.test(text)
      ? `'${text}`
      : text;

    return `"${safeText.replaceAll('"', '""')}"`;
  };

  const rows = recruiterAllApplications.map((application) => [
    application.candidate_full_name || application.candidate_name,
    application.candidate_email,
    application.candidate_location,
    application.job_title,
    application.company_name,
    application.status,
    application.applied_at,
    application.updated_at,
  ]);

  const csvContent = [
    headers,
    ...rows,
  ]
    .map((row) => row.map(escapeCsvValue).join(","))
    .join("\r\n");

  const blob = new Blob(
    ["\uFEFF" + csvContent],
    { type: "text/csv;charset=utf-8;" }
  );

  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");

  link.href = url;
  link.download = `recruiter-applications-${new Date()
    .toISOString()
    .slice(0, 10)}.csv`;

  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);

  URL.revokeObjectURL(url);
};

const exportJobWiseReport = () => {
  if (recruiterJobs.length === 0) {
    return;
  }

  const headers = [
    "Job Title",
    "Company",
    "Job Status",
    "Total Applications",
    "Under Review",
    "Shortlisted",
    "Interviews",
    "Selected",
    "Rejected",
    "Withdrawn",
    "Hiring Conversion Rate",
  ];

  const escapeCsvValue = (value) => {
    const text = String(value ?? "");
    const safeText = /^[\t\r ]*[=+\-@]/.test(text)
      ? `'${text}`
      : text;

    return `"${safeText.replaceAll('"', '""')}"`;
  };

  const rows = recruiterJobs.map((job) => {
    const applications = recruiterAllApplications.filter(
      (application) =>
        String(
          typeof application.job === "object"
            ? application.job?.id
            : application.job
        ) === String(job.id)
    );

    const total = applications.length;
    const selected = applications.filter(
      (application) => application.status === "SELECTED"
    ).length;

    const underReview = applications.filter((application) =>
      ["APPLIED", "UNDER_REVIEW"].includes(application.status)
    ).length;

    const shortlisted = applications.filter(
      (application) => application.status === "SHORTLISTED"
    ).length;

    const interviews = applications.filter(
      (application) => application.status === "INTERVIEW"
    ).length;

    const rejected = applications.filter(
      (application) => application.status === "REJECTED"
    ).length;

    const withdrawn = applications.filter(
      (application) => application.status === "WITHDRAWN"
    ).length;

    const conversionRate =
      total > 0 ? `${Math.round((selected / total) * 100)}%` : "0%";

    return [
      job.title,
      job.company_name,
      job.status,
      total,
      underReview,
      shortlisted,
      interviews,
      selected,
      rejected,
      withdrawn,
      conversionRate,
    ];
  });

  const csvContent = [
    headers,
    ...rows,
  ]
    .map((row) => row.map(escapeCsvValue).join(","))
    .join("\r\n");

  const blob = new Blob(
    ["\uFEFF" + csvContent],
    { type: "text/csv;charset=utf-8;" }
  );

  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");

  link.href = url;
  link.download = `job-wise-recruitment-report-${new Date()
    .toISOString()
    .slice(0, 10)}.csv`;

  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);

  URL.revokeObjectURL(url);
};

const exportInterviewReport = () => {
  if (recruiterInterviews.length === 0) {
    return;
  }

  const headers = [
    "Candidate Name",
    "Candidate Email",
    "Job Title",
    "Company",
    "Interview Title",
    "Interview Date",
    "Interview Type",
    "Duration (Minutes)",
    "Interview Status",
    "Technical Skills Rating",
    "Communication Rating",
    "Problem Solving Rating",
    "Overall Rating",
    "Recommendation",
  ];

  const escapeCsvValue = (value) => {
    const text = String(value ?? "");
    const safeText = /^[\t\r ]*[=+\-@]/.test(text)
      ? `'${text}`
      : text;

    return `"${safeText.replaceAll('"', '""')}"`;
  };

  const rows = recruiterInterviews.map((interview) => {
    const feedback = recruiterInterviewFeedback.find(
      (item) => String(item.interview) === String(interview.id)
    );

    return [
      interview.candidate_name,
      interview.candidate_email,
      interview.job_title,
      interview.company_name,
      interview.title,
      interview.scheduled_at,
      interview.interview_type,
      interview.duration_minutes,
      interview.status,
      feedback?.technical_skills ?? "",
      feedback?.communication ?? "",
      feedback?.problem_solving ?? "",
      feedback?.overall_rating ?? "",
      feedback?.recommendation ?? "",
    ];
  });

  const csvContent = [
    headers,
    ...rows,
  ]
    .map((row) => row.map(escapeCsvValue).join(","))
    .join("\r\n");

  const blob = new Blob(
    ["\uFEFF" + csvContent],
    { type: "text/csv;charset=utf-8;" }
  );

  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");

  link.href = url;
  link.download = `interview-report-${new Date()
    .toISOString()
    .slice(0, 10)}.csv`;

  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);

  URL.revokeObjectURL(url);
};

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

  // Application status chart data
  const statusChartData = [
    {
      name: "Applied / Under Review",
      value: recruiterAllApplications.filter((app) =>
        ["APPLIED", "UNDER_REVIEW"].includes(app.status)
      ).length,
    },
    {
      name: "Shortlisted",
      value: recruiterAllApplications.filter(
        (app) => app.status === "SHORTLISTED"
      ).length,
    },
    {
      name: "Interview",
      value: recruiterAllApplications.filter(
        (app) => app.status === "INTERVIEW"
      ).length,
    },
    {
      name: "Selected",
      value: recruiterAllApplications.filter(
        (app) => app.status === "SELECTED"
      ).length,
    },
    {
      name: "Rejected",
      value: recruiterAllApplications.filter(
        (app) => app.status === "REJECTED"
      ).length,
    },
  ].filter((item) => item.value > 0);

  const statusChartColors = [
    "#8b9cf6",
    "#a78bfa",
    "#f6c177",
    "#65c99a",
    "#ef8585",
  ];

  // Selection conversion rate
  const hiringConversionRate =
    recruiterApplicationStats.total > 0
      ? Math.round(
          (recruiterApplicationStats.selected /
            recruiterApplicationStats.total) *
            100
        )
      : 0;

  // Job-wise application performance
  const jobPerformanceData = Object.values(
    recruiterAllApplications.reduce((groups, application) => {
      const jobTitle =
        application.job_title ||
        recruiterJobs.find(
          (job) =>
            String(job.id) ===
            String(
              typeof application.job === "object"
                ? application.job?.id
                : application.job
            )
        )?.title ||
        "Untitled Job";

      if (!groups[jobTitle]) {
        groups[jobTitle] = {
          jobTitle,
          applications: 0,
          selected: 0,
        };
      }

      groups[jobTitle].applications += 1;

      if (application.status === "SELECTED") {
        groups[jobTitle].selected += 1;
      }

      return groups;
    }, {})
  )
    .sort((a, b) => b.applications - a.applications)
    .slice(0, 6);

  // Candidate application status chart data
  const candidateStatusChartData = [
    {
      name: "Applied / Under Review",
      value: applicationStats.underReview,
    },
    {
      name: "Shortlisted",
      value: applicationStats.shortlisted,
    },
    {
      name: "Interview",
      value: applicationStats.interview,
    },
    {
      name: "Selected",
      value: applicationStats.selected,
    },
    {
      name: "Rejected",
      value: applicationStats.rejected,
    },
  ].filter((item) => item.value > 0);

  // Candidate selection progress
  const candidateSelectionRate =
    applicationStats.total > 0
      ? Math.round(
          (applicationStats.selected / applicationStats.total) * 100
        )
      : 0;

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

        {/* RECRUITER DASHBOARD */}
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

            {/* RECRUITER ANALYTICS */}
            <section className="dashboard-section">
              <div className="dashboard-section-heading">
                <div>
                  <span className="eyebrow">HIRING ANALYTICS</span>
                  <h2>Recruitment Performance</h2>

                </div>
               <button
  type="button"
  className="button button-primary"
  onClick={exportRecruiterApplications}
  disabled={recruiterAllApplications.length === 0}
>
  Export Applications CSV
</button><button
  type="button"
  className="button button-outline"
  onClick={exportJobWiseReport}
  disabled={recruiterJobs.length === 0}
>
  Export Job-wise Report
</button>
<button
  type="button"
  className="button button-outline"
  onClick={exportInterviewReport}
  disabled={recruiterInterviews.length === 0}
>
  Export Interview Report
</button>
              </div>

              <div className="dashboard-analytics-grid">
                {/* Application status chart */}
                <article className="dashboard-analytics-card">
                  <div className="dashboard-section-heading">
                    <div>
                      <h3>Application Status Distribution</h3>
                      <p>Breakdown of all applications received</p>
                    </div>
                  </div>

                  {recruiterAllApplications.length === 0 ? (
                    <div className="dashboard-empty-state">
                      <p>No application data available yet.</p>
                    </div>
                  ) : (
                    <div className="dashboard-chart">
                      <ResponsiveContainer width="100%" height={280}>
                        <PieChart>
                          <Pie
                            data={statusChartData}
                            dataKey="value"
                            nameKey="name"
                            cx="50%"
                            cy="50%"
                            outerRadius={88}
                            innerRadius={48}
                            paddingAngle={3}
                          >
                            {statusChartData.map((entry, index) => (
                              <Cell
                                key={entry.name}
                                fill={
                                  statusChartColors[
                                    index % statusChartColors.length
                                  ]
                                }
                              />
                            ))}
                          </Pie>

                          <Tooltip />
                          <Legend />
                        </PieChart>
                      </ResponsiveContainer>
                    </div>
                  )}
                </article>

                {/* Hiring conversion rate */}
                <article className="dashboard-analytics-card dashboard-conversion-card">
                  <span className="eyebrow">HIRING CONVERSION</span>
                  <h3>Selection Rate</h3>

                  <strong className="dashboard-conversion-value">
                    {hiringConversionRate}%
                  </strong>

                  <p>
                    {recruiterApplicationStats.selected} selected out of{" "}
                    {recruiterApplicationStats.total} total applications.
                  </p>

                  <div
                    className="dashboard-progress-track"
                    role="progressbar"
                    aria-valuenow={hiringConversionRate}
                    aria-valuemin="0"
                    aria-valuemax="100"
                    aria-label="Hiring selection rate"
                  >
                    <div
                      className="dashboard-progress-fill"
                      style={{ width: `${hiringConversionRate}%` }}
                    />
                  </div>

                  {recruiterApplicationStats.total === 0 && (
                    <p className="dashboard-analytics-note">
                      The rate will appear when candidates apply to your jobs.
                    </p>
                  )}
                </article>
              </div>

              {/* Job-wise performance chart */}
              <article className="dashboard-analytics-card dashboard-job-performance">
                <div className="dashboard-section-heading">
                  <div>
                    <h3>Job-wise Application Performance</h3>
                    <p>Top jobs by number of applications</p>
                  </div>
                </div>

                {jobPerformanceData.length === 0 ? (
                  <div className="dashboard-empty-state">
                    <p>No job application data available yet.</p>
                  </div>
                ) : (
                  <div className="dashboard-chart dashboard-chart-wide">
                    <ResponsiveContainer width="100%" height={320}>
                      <BarChart
                        data={jobPerformanceData}
                        margin={{
                          top: 12,
                          right: 18,
                          left: 0,
                          bottom: 8,
                        }}
                      >
                        <CartesianGrid
                          strokeDasharray="3 3"
                          stroke="var(--border)"
                        />

                        <XAxis
                          dataKey="jobTitle"
                          tick={{
                            fill: "var(--text-muted)",
                            fontSize: 12,
                          }}
                          interval={0}
                          angle={-15}
                          textAnchor="end"
                          height={72}
                        />

                        <YAxis
                          allowDecimals={false}
                          tick={{
                            fill: "var(--text-muted)",
                            fontSize: 12,
                          }}
                        />

                        <Tooltip />
                        <Legend />

                        <Bar
                          dataKey="applications"
                          name="Applications"
                          fill="#8b9cf6"
                          radius={[6, 6, 0, 0]}
                        />

                        <Bar
                          dataKey="selected"
                          name="Selected"
                          fill="#65c99a"
                          radius={[6, 6, 0, 0]}
                        />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                )}
              </article>
            </section>

            {/* RECENT APPLICANTS */}
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

            {/* RECRUITER QUICK ACTIONS */}
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
                  <p>
                    Create a new job opening and publish it for candidates.
                  </p>

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

        {/* CANDIDATE DASHBOARD */}
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

            {/* CANDIDATE APPLICATION INSIGHTS */}
            <section className="dashboard-section">
              <div className="dashboard-section-heading">
                <div>
                  <span className="eyebrow">APPLICATION ANALYTICS</span>
                  <h2>Application Insights</h2>
                </div>
              </div>

              <div className="dashboard-analytics-grid">
                {/* Application status distribution */}
                <article className="dashboard-analytics-card">
                  <div className="dashboard-section-heading">
                    <div>
                      <h3>Application Status Distribution</h3>
                      <p>Track the progress of your applications</p>
                    </div>
                  </div>

                  {applicationStats.total === 0 ? (
                    <div className="dashboard-empty-state">
                      <p>
                        Your application insights will appear after you apply
                        for a job.
                      </p>

                      <Link to="/" className="button button-primary">
                        Explore Jobs
                      </Link>
                    </div>
                  ) : (
                    <div className="dashboard-chart">
                      <ResponsiveContainer width="100%" height={280}>
                        <PieChart>
                          <Pie
                            data={candidateStatusChartData}
                            dataKey="value"
                            nameKey="name"
                            cx="50%"
                            cy="50%"
                            outerRadius={88}
                            innerRadius={48}
                            paddingAngle={3}
                          >
                            {candidateStatusChartData.map((entry, index) => (
                              <Cell
                                key={entry.name}
                                fill={
                                  statusChartColors[
                                    index % statusChartColors.length
                                  ]
                                }
                              />
                            ))}
                          </Pie>

                          <Tooltip />
                          <Legend />
                        </PieChart>
                      </ResponsiveContainer>
                    </div>
                  )}
                </article>

                {/* Candidate progress summary */}
                <article className="dashboard-analytics-card dashboard-conversion-card">
                  <span className="eyebrow">YOUR PROGRESS</span>
                  <h3>Application Summary</h3>

                  <strong className="dashboard-conversion-value">
                    {applicationStats.underReview}
                  </strong>

                  <p>Applications awaiting a decision</p>

                  <div className="dashboard-stats-grid">
                    <article className="dashboard-stat-card">
                      <span>Shortlisted</span>
                      <strong>{applicationStats.shortlisted}</strong>
                    </article>

                    <article className="dashboard-stat-card">
                      <span>Interviews</span>
                      <strong>{applicationStats.interview}</strong>
                    </article>
                  </div>

                  <div className="dashboard-section-heading">
                    <h3>Selection Progress</h3>
                    <strong>{candidateSelectionRate}%</strong>
                  </div>

                  <div
                    className="dashboard-progress-track"
                    role="progressbar"
                    aria-valuenow={candidateSelectionRate}
                    aria-valuemin="0"
                    aria-valuemax="100"
                    aria-label="Application selection progress"
                  >
                    <div
                      className="dashboard-progress-fill"
                      style={{ width: `${candidateSelectionRate}%` }}
                    />
                  </div>

                  <p>
                    {applicationStats.selected} selected out of{" "}
                    {applicationStats.total} total applications.
                  </p>

                  {applicationStats.total === 0 && (
                    <p className="dashboard-analytics-note">
                      Apply for jobs to start tracking your application
                      progress.
                    </p>
                  )}
                </article>
              </div>
            </section>

            {/* PROFILE COMPLETION */}
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

            {/* RECENT APPLICATIONS */}
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

        {/* SHARED DASHBOARD CARDS */}
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

              <article className="dashboard-card">
                <div className="dashboard-icon">🔔</div>

                <h2>Job Alerts</h2>

                <p>
                  Create and manage job alerts to get notified about matching
                  opportunities through in-app and email notifications.
                </p>

                <Link to="/job-alerts" className="button button-primary">
                  Manage Job Alerts
                </Link>
              </article>
            </>
          )}

          {/* ACCOUNT INFORMATION */}
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

          {/* ADMIN DASHBOARD */}
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

        {/* DASHBOARD ACTIONS */}
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