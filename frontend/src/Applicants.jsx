
import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import "./Applicants.css";

const API_URL = "http://127.0.0.1:8000/api";

const statusOptions = [
  { value: "APPLIED", label: "Applied" },
  { value: "UNDER_REVIEW", label: "Under Review" },
  { value: "SHORTLISTED", label: "Shortlisted" },
  { value: "INTERVIEW", label: "Interview" },
  { value: "SELECTED", label: "Selected" },
  { value: "REJECTED", label: "Rejected" },
];

function Applicants() {
  const [applicants, setApplicants] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [updatingId, setUpdatingId] = useState(null);

  const token = sessionStorage.getItem("accessToken");

  const fetchApplicants = async () => {
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
        throw new Error(data.detail || "Failed to load applicants.");
      }

      setApplicants(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!token) {
      setError("Please log in to manage applicants.");
      setLoading(false);
      return;
    }

    fetchApplicants();
  }, []);

  const handleStatusChange = async (applicationId, newStatus) => {
    setUpdatingId(applicationId);
    setError("");
    setMessage("");

    try {
      const response = await fetch(
        `${API_URL}/applications/${applicationId}/`,
        {
          method: "PATCH",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ status: newStatus }),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.detail || "Failed to update application status.");
      }

      setApplicants((previous) =>
        previous.map((applicant) =>
          applicant.id === applicationId
            ? { ...applicant, status: data.status }
            : applicant
        )
      );

      setMessage("Application status updated successfully.");
    } catch (err) {
      setError(err.message);
    } finally {
      setUpdatingId(null);
    }
  };

  return (
    <div className="applicants-page">
      <nav className="applicants-navbar">
        <Link to="/dashboard" className="applicants-brand">
          Career<span>Hub</span>
        </Link>

        <Link to="/dashboard" className="applicants-back">
          Back to Dashboard
        </Link>
      </nav>

      <main className="applicants-container">
        <div className="applicants-heading">
          <span className="applicants-eyebrow">RECRUITER DASHBOARD</span>
          <h1>Manage Applicants</h1>
          <p>
            Review candidates and manage the progress of their job applications.
          </p>
        </div>

        {message && <div className="applicants-success">{message}</div>}
        {error && <div className="applicants-error">{error}</div>}

        {loading ? (
          <p className="applicants-message">Loading applicants...</p>
        ) : applicants.length === 0 ? (
          <div className="applicants-empty">
            <h2>No Applicants Yet</h2>
            <p>
              Applications submitted for your published jobs will appear here.
            </p>
            <Link to="/jobs" className="applicants-button">
              Manage Jobs
            </Link>
          </div>
        ) : (
          <div className="applicants-list">
            {applicants.map((applicant) => (
              <article className="applicant-card" key={applicant.id}>
                <div className="applicant-card-header">
                  <div>
                    <h2>{applicant.candidate_name}</h2>
                    <p>{applicant.job_title}</p>
                    <span className="applicant-company">
                      {applicant.company_name}
                    </span>
                  </div>

                  <span
                    className={`applicant-status status-${applicant.status.toLowerCase().replaceAll("_", "-")}`}
                  >
                    {applicant.status.replaceAll("_", " ")}
                  </span>
                </div>

                <div className="applicant-details">
                  <p>
                    <strong>Application ID:</strong> #{applicant.id}
                  </p>

                  <p>
                    <strong>Applied On:</strong>{" "}
                    {new Date(applicant.applied_at).toLocaleDateString()}
                  </p>
                </div>

                <div className="applicant-status-control">
                  <label htmlFor={`status-${applicant.id}`}>
                    Update Application Status
                  </label>

                  <select
                    id={`status-${applicant.id}`}
                    value={applicant.status}
                    onChange={(event) =>
                      handleStatusChange(applicant.id, event.target.value)
                    }
                    disabled={updatingId === applicant.id}
                  >
                    {statusOptions.map((option) => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>

                  {updatingId === applicant.id && (
                    <span className="applicant-updating">
                      Updating...
                    </span>
                  )}
                </div>
              </article>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}

export default Applicants;
