import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import "./Interviews.css";

const API_URL = "http://127.0.0.1:8000/api";

function Interviews() {
  const [interviews, setInterviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const token = sessionStorage.getItem("accessToken");

  useEffect(() => {
    const fetchInterviews = async () => {
      if (!token) {
        setError("Please log in to view interviews.");
        setLoading(false);
        return;
      }

      try {
        const response = await fetch(`${API_URL}/interviews/`, {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        });

        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.detail || "Failed to load interviews.");
        }

        setInterviews(Array.isArray(data) ? data : []);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchInterviews();
  }, []);

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleString();
  };

  return (
    <div className="interviews-page">
      <nav className="navbar">
        <Link to="/" className="brand">
          Career<span>Hub</span>
        </Link>

        <Link to="/dashboard" className="button button-outline">
          Back to Dashboard
        </Link>
      </nav>

      <main className="interviews-content">
        <section className="interviews-heading">
          <span className="eyebrow">INTERVIEW MANAGEMENT</span>
          <h1>Interviews</h1>
          <p>
            View and manage your scheduled job interviews.
          </p>
        </section>

        {error && (
          <div className="interviews-error">{error}</div>
        )}

        {loading ? (
          <p className="interviews-message">
            Loading interviews...
          </p>
        ) : interviews.length === 0 ? (
          <section className="interviews-empty">
            <div className="interviews-empty-icon">??</div>
            <h2>No interviews yet</h2>
            <p>
              Your scheduled interviews will appear here.
            </p>
          </section>
        ) : (
          <section className="interviews-list">
            {interviews.map((interview) => (
              <article className="interview-card" key={interview.id}>
                <div className="interview-card-top">
                  <div>
                    <span className="eyebrow">
                      {interview.interview_type?.replace("_", " ")}
                    </span>
                    <h2>{interview.title}</h2>
                    <p className="interview-job">
                      {interview.job_title}
                      {interview.company_name
                        ? ` · ${interview.company_name}`
                        : ""}
                    </p>
                  </div>

                  <span
                    className={`interview-status ${interview.status?.toLowerCase()}`}
                  >
                    {interview.status?.replace("_", " ")}
                  </span>
                </div>

                <div className="interview-details">
                  <p>
                    <strong>Candidate:</strong>{" "}
                    {interview.candidate_name}
                  </p>
                  <p>
                    <strong>Recruiter:</strong>{" "}
                    {interview.recruiter_name || "Not specified"}
                  </p>
                  <p>
                    <strong>Scheduled:</strong>{" "}
                    {formatDate(interview.scheduled_at)}
                  </p>
                  <p>
                    <strong>Duration:</strong>{" "}
                    {interview.duration_minutes} minutes
                  </p>

                  {interview.meeting_link && (
                    <p>
                      <strong>Meeting link:</strong>{" "}
                      <a
                        href={interview.meeting_link}
                        target="_blank"
                        rel="noreferrer"
                      >
                        Join meeting
                      </a>
                    </p>
                  )}

                  {interview.location && (
                    <p>
                      <strong>Location:</strong> {interview.location}
                    </p>
                  )}

                  {interview.notes && (
                    <p>
                      <strong>Notes:</strong> {interview.notes}
                    </p>
                  )}
                </div>
              </article>
            ))}
          </section>
        )}
      </main>
    </div>
  );
}

export default Interviews;
