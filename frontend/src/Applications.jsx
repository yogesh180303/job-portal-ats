
import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import "./Applications.css";

const API_URL = "http://127.0.0.1:8000/api";

function Applications() {
  const [applications, setApplications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [withdrawingId, setWithdrawingId] = useState(null);

  const [expandedTimelineId, setExpandedTimelineId] = useState(null);
  const [timelines, setTimelines] = useState({});
  const [timelineLoadingId, setTimelineLoadingId] = useState(null);
  const [timelineErrors, setTimelineErrors] = useState({});

  const token = sessionStorage.getItem("accessToken");

  const fetchApplications = async () => {
    try {
      setLoading(true);
      setError("");

      const response = await fetch(`${API_URL}/applications/`, {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.detail || "Failed to load applications.");
      }

      setApplications(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!token) {
      setError("Please log in to view your applications.");
      setLoading(false);
      return;
    }

    fetchApplications();
  }, []);

  const handleWithdraw = async (applicationId) => {
    const confirmed = window.confirm(
      "Are you sure you want to withdraw this application?"
    );

    if (!confirmed) return;

    try {
      setWithdrawingId(applicationId);
      setError("");
      setMessage("");

      const response = await fetch(
        `${API_URL}/applications/${applicationId}/`,
        {
          method: "DELETE",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.detail || "Failed to withdraw application.");
      }

      setApplications((previous) =>
        previous.filter((application) => application.id !== applicationId)
      );

      setMessage("Application withdrawn successfully.");
    } catch (err) {
      setError(err.message);
    } finally {
      setWithdrawingId(null);
    }
  };

  const handleViewTimeline = async (applicationId) => {
    if (expandedTimelineId === applicationId) {
      setExpandedTimelineId(null);
      return;
    }

    setExpandedTimelineId(applicationId);

    if (timelines[applicationId]) {
      return;
    }

    try {
      setTimelineLoadingId(applicationId);

      setTimelineErrors((previous) => ({
        ...previous,
        [applicationId]: "",
      }));

      const response = await fetch(
        `${API_URL}/applications/${applicationId}/timeline/`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.detail || "Failed to load application timeline.");
      }

      setTimelines((previous) => ({
        ...previous,
        [applicationId]: data,
      }));
    } catch (err) {
      setTimelineErrors((previous) => ({
        ...previous,
        [applicationId]: err.message,
      }));
    } finally {
      setTimelineLoadingId(null);
    }
  };

  const getStatusClass = (status) => {
    return status.toLowerCase().replaceAll("_", "-");
  };

  const formatDateTime = (dateTime) => {
    return new Date(dateTime).toLocaleString();
  };

  return (
    <div className="applications-page">
      <nav className="applications-navbar">
        <Link to="/dashboard" className="applications-brand">
          Career<span>Hub</span>
        </Link>

        <Link to="/dashboard" className="applications-back">
          Back to Dashboard
        </Link>
      </nav>

      <main className="applications-container">
        <div className="applications-heading">
          <span className="applications-eyebrow">CANDIDATE DASHBOARD</span>
          <h1>My Applications</h1>
          <p>
            Track your job applications and monitor your recruitment progress.
          </p>
        </div>

        {message && <div className="applications-success">{message}</div>}

        {error && <div className="applications-error">{error}</div>}

        {loading ? (
          <p className="applications-message">Loading your applications...</p>
        ) : applications.length === 0 ? (
          <div className="applications-empty">
            <h2>No Applications Yet</h2>
            <p>
              You haven't applied for any jobs yet. Explore available jobs to
              get started.
            </p>
            <Link to="/jobs" className="applications-button">
              Explore Jobs
            </Link>
          </div>
        ) : (
          <div className="applications-list">
            {applications.map((application) => (
              <article className="application-card" key={application.id}>
                <div className="application-card-header">
                  <div>
                    <h2>{application.job_title}</h2>
                    <p>{application.company_name}</p>
                  </div>

                  <span
                    className={`application-status ${getStatusClass(
                      application.status
                    )}`}
                  >
                    {application.status.replaceAll("_", " ")}
                  </span>
                </div>

                <div className="application-details">
                  <p>
                    <strong>Application ID:</strong> #{application.id}
                  </p>

                  <p>
                    <strong>Applied On:</strong>{" "}
                    {new Date(application.applied_at).toLocaleDateString()}
                  </p>
                </div>

                <div className="application-card-actions">
                  <button
                    type="button"
                    className="application-timeline-button"
                    onClick={() => handleViewTimeline(application.id)}
                  >
                    {expandedTimelineId === application.id
                      ? "Hide Timeline"
                      : "View Timeline"}
                  </button>

                  <button
                    type="button"
                    className="application-withdraw-button"
                    onClick={() => handleWithdraw(application.id)}
                    disabled={withdrawingId === application.id}
                  >
                    {withdrawingId === application.id
                      ? "Withdrawing..."
                      : "Withdraw Application"}
                  </button>
                </div>

                {expandedTimelineId === application.id && (
                  <div className="application-timeline">
                    <h3>Application Timeline</h3>

                    {timelineLoadingId === application.id ? (
                      <p className="applications-message">
                        Loading timeline...
                      </p>
                    ) : timelineErrors[application.id] ? (
                      <div className="applications-error">
                        {timelineErrors[application.id]}
                      </div>
                    ) : timelines[application.id]?.length > 0 ? (
                      <div className="timeline-list">
                        {timelines[application.id].map((event) => (
                          <div className="timeline-item" key={event.id}>
                            <div className="timeline-marker"></div>

                            <div className="timeline-content">
                              <h4>
                                {event.old_status
                                  ? `${event.old_status.replaceAll(
                                      "_",
                                      " "
                                    )} → ${event.new_status.replaceAll(
                                      "_",
                                      " "
                                    )}`
                                  : event.new_status.replaceAll("_", " ")}
                              </h4>

                              <p>
                                Updated by:{" "}
                                {event.changed_by_name || "System"}
                              </p>

                              <span>
                                {formatDateTime(event.changed_at)}
                              </span>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="applications-message">
                        No timeline history available.
                      </p>
                    )}
                  </div>
                )}
              </article>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}

export default Applications;
