
import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import "./Interviews.css";

const API_URL = "http://127.0.0.1:8000/api";

const emptyForm = {
  application: "",
  title: "",
  interview_type: "ONLINE",
  scheduled_at: "",
  duration_minutes: 30,
  meeting_link: "",
  location: "",
  notes: "",
};

function Interviews() {
  const [interviews, setInterviews] = useState([]);
  const [applications, setApplications] = useState([]);
  const [user, setUser] = useState(null);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  const [form, setForm] = useState(emptyForm);

  const token = sessionStorage.getItem("accessToken");

  const headers = {
    Authorization: `Bearer ${token}`,
    "Content-Type": "application/json",
  };

  const fetchInterviews = async () => {
    const response = await fetch(`${API_URL}/interviews/`, {
      headers,
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.detail || "Failed to load interviews.");
    }

    setInterviews(Array.isArray(data) ? data : []);
  };

  useEffect(() => {
    const loadPage = async () => {
      if (!token) {
        setError("Please log in to view interviews.");
        setLoading(false);
        return;
      }

      try {
        const [userResponse, interviewResponse] = await Promise.all([
          fetch(`${API_URL}/auth/me/`, { headers }),
          fetch(`${API_URL}/interviews/`, { headers }),
        ]);

        const userData = await userResponse.json();
        const interviewData = await interviewResponse.json();

        if (!userResponse.ok) {
          throw new Error("Unable to load account information.");
        }

        if (!interviewResponse.ok) {
          throw new Error(
            interviewData.detail || "Failed to load interviews."
          );
        }

        setUser(userData);
        setInterviews(
          Array.isArray(interviewData) ? interviewData : []
        );

        if (["RECRUITER", "ADMIN"].includes(userData.role)) {
          const applicationsResponse = await fetch(
            `${API_URL}/applications/`,
            { headers }
          );

          const applicationsData = await applicationsResponse.json();

          if (!applicationsResponse.ok) {
            throw new Error(
              applicationsData.detail ||
              "Unable to load applications."
            );
          }

          setApplications(
            Array.isArray(applicationsData) ? applicationsData : []
          );
        }
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    loadPage();
  }, []);

  const handleChange = (event) => {
    const { name, value } = event.target;

    setForm((previous) => ({
      ...previous,
      [name]: value,
    }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    setError("");
    setMessage("");

    if (!form.application) {
      setError("Please select an application.");
      return;
    }

    if (!form.scheduled_at) {
      setError("Please select an interview date and time.");
      return;
    }

    if (
      form.interview_type === "ONLINE" &&
      !form.meeting_link.trim()
    ) {
      setError("Please enter the online meeting link.");
      return;
    }

    if (
      form.interview_type === "IN_PERSON" &&
      !form.location.trim()
    ) {
      setError("Please enter the interview location.");
      return;
    }

    try {
      setSaving(true);

      const payload = {
        ...form,
        application: Number(form.application),
        scheduled_at: new Date(form.scheduled_at).toISOString(),
        duration_minutes: Number(form.duration_minutes),
        meeting_link:
          form.interview_type === "ONLINE"
            ? form.meeting_link.trim()
            : "",
        location:
          form.interview_type === "IN_PERSON"
            ? form.location.trim()
            : "",
      };

      const response = await fetch(`${API_URL}/interviews/`, {
        method: "POST",
        headers,
        body: JSON.stringify(payload),
      });

      const data = await response.json();

      if (!response.ok) {
        const detail =
          data.detail ||
          Object.entries(data)
            .map(([key, value]) =>
              `${key}: ${Array.isArray(value) ? value.join(", ") : value}`
            )
            .join(" ");

        throw new Error(detail || "Unable to schedule interview.");
      }

      await fetchInterviews();
      setForm(emptyForm);
      setMessage("Interview scheduled successfully.");
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  const formatDate = (dateString) =>
    new Date(dateString).toLocaleString();

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
          <p>View and manage your scheduled job interviews.</p>
        </section>

        {error && (
          <div className="interviews-error">{error}</div>
        )}

        {message && (
          <div className="interviews-success">{message}</div>
        )}

        {!loading && user &&
          ["RECRUITER", "ADMIN"].includes(user.role) && (
            <section className="interview-form-section">
              <h2>Schedule an Interview</h2>
              <p>Choose an application and provide the interview details.</p>

              <form onSubmit={handleSubmit} className="interview-form">
                <label>
                  Select Application
                  <select
                    name="application"
                    value={form.application}
                    onChange={handleChange}
                    required
                  >
                    <option value="">Choose an application</option>
                    {applications.map((application) => (
                      <option
                        key={application.id}
                        value={application.id}
                      >
                        {application.job_title} — {application.candidate_name}
                        {application.company_name
                          ? ` (${application.company_name})`
                          : ""}
                      </option>
                    ))}
                  </select>
                </label>

                {applications.length === 0 && (
                  <p className="interviews-message">
                    No applications are available to schedule.
                  </p>
                )}

                <label>
                  Interview Title
                  <input
                    name="title"
                    value={form.title}
                    onChange={handleChange}
                    placeholder="e.g. Technical Interview"
                    required
                  />
                </label>

                <label>
                  Interview Type
                  <select
                    name="interview_type"
                    value={form.interview_type}
                    onChange={handleChange}
                  >
                    <option value="ONLINE">Online</option>
                    <option value="IN_PERSON">In Person</option>
                  </select>
                </label>

                <label>
                  Date and Time
                  <input
                    type="datetime-local"
                    name="scheduled_at"
                    value={form.scheduled_at}
                    onChange={handleChange}
                    min={new Date().toISOString().slice(0, 16)}
                    required
                  />
                </label>

                <label>
                  Duration (minutes)
                  <input
                    type="number"
                    name="duration_minutes"
                    value={form.duration_minutes}
                    onChange={handleChange}
                    min="15"
                    max="480"
                    required
                  />
                </label>

                {form.interview_type === "ONLINE" ? (
                  <label>
                    Meeting Link
                    <input
                      type="url"
                      name="meeting_link"
                      value={form.meeting_link}
                      onChange={handleChange}
                      placeholder="https://meet.google.com/..."
                      required
                    />
                  </label>
                ) : (
                  <label>
                    Interview Location
                    <input
                      name="location"
                      value={form.location}
                      onChange={handleChange}
                      placeholder="Enter interview address"
                      required
                    />
                  </label>
                )}

                <label className="interview-notes-field">
                  Notes (optional)
                  <textarea
                    name="notes"
                    value={form.notes}
                    onChange={handleChange}
                    placeholder="Additional instructions for the candidate"
                    rows="4"
                  />
                </label>

                <button
                  type="submit"
                  className="interview-submit-button"
                  disabled={saving || applications.length === 0}
                >
                  {saving ? "Scheduling..." : "Schedule Interview"}
                </button>
              </form>
            </section>
          )}

        <section className="interviews-list-section">
          <h2>Your Interviews</h2>

          {loading ? (
            <p className="interviews-message">
              Loading interviews...
            </p>
          ) : interviews.length === 0 ? (
            <section className="interviews-empty">
              <div className="interviews-empty-icon">📅</div>
              <h2>No interviews yet</h2>
              <p>Your scheduled interviews will appear here.</p>
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
        </section>
      </main>
    </div>
  );
}

export default Interviews;
