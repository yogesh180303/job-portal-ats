
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

  const getStatusClass = (status) => {
    return status.toLowerCase().replaceAll("_", "-");
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
                    className="application-withdraw-button"
                    onClick={() => handleWithdraw(application.id)}
                    disabled={withdrawingId === application.id}
                  >
                    {withdrawingId === application.id
                      ? "Withdrawing..."
                      : "Withdraw Application"}
                  </button>
                </div>
              </article>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}

export default Applications;
