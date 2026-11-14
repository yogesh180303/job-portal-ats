
import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import "./InterviewFeedback.css";

const API_URL = "http://127.0.0.1:8000/api";

const emptyForm = {
  interview: "",
  technical_skills: 3,
  communication: 3,
  problem_solving: 3,
  overall_rating: 3,
  strengths: "",
  weaknesses: "",
  comments: "",
  recommendation: "NEXT_ROUND",
};

function InterviewFeedback() {
  const token = sessionStorage.getItem("accessToken");

  const [feedbackList, setFeedbackList] = useState([]);
  const [interviews, setInterviews] = useState([]);
  const [form, setForm] = useState(emptyForm);
  const [editingId, setEditingId] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const headers = {
    Authorization: `Bearer ${token}`,
    "Content-Type": "application/json",
  };

  const loadData = async () => {
    setLoading(true);
    setError("");

    try {
      const [feedbackResponse, interviewsResponse] = await Promise.all([
        fetch(`${API_URL}/interview-feedback/`, { headers }),
        fetch(`${API_URL}/interviews/`, { headers }),
      ]);

      const feedbackData = await feedbackResponse.json();
      const interviewsData = await interviewsResponse.json();

      if (!feedbackResponse.ok) {
        throw new Error(
          feedbackData.detail || "Unable to load interview feedback."
        );
      }

      if (!interviewsResponse.ok) {
        throw new Error(
          interviewsData.detail || "Unable to load interviews."
        );
      }

      setFeedbackList(Array.isArray(feedbackData) ? feedbackData : []);
      setInterviews(Array.isArray(interviewsData) ? interviewsData : []);
    } catch (err) {
      setError(err.message || "Something went wrong while loading data.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!token) {
      setError("Please log in again to view interview feedback.");
      setLoading(false);
      return;
    }

    loadData();
  }, []);

  const feedbackInterviewIds = useMemo(
    () => new Set(feedbackList.map((item) => Number(item.interview))),
    [feedbackList]
  );

  const completedInterviews = interviews.filter(
    (interview) =>
      interview.status === "COMPLETED" &&
      !feedbackInterviewIds.has(Number(interview.id))
  );

  const updateField = (event) => {
    const { name, value } = event.target;
    setForm((current) => ({
      ...current,
      [name]: [
        "technical_skills",
        "communication",
        "problem_solving",
        "overall_rating",
      ].includes(name)
        ? Number(value)
        : value,
    }));
  };

  const openCreateForm = () => {
    setEditingId(null);
    setForm({
      ...emptyForm,
      interview: completedInterviews[0]
        ? String(completedInterviews[0].id)
        : "",
    });
    setError("");
    setSuccess("");
    setShowForm(true);
  };

  const openEditForm = (feedback) => {
    setEditingId(feedback.id);
    setForm({
      interview: String(feedback.interview),
      technical_skills: feedback.technical_skills,
      communication: feedback.communication,
      problem_solving: feedback.problem_solving,
      overall_rating: feedback.overall_rating,
      strengths: feedback.strengths || "",
      weaknesses: feedback.weaknesses || "",
      comments: feedback.comments || "",
      recommendation: feedback.recommendation || "NEXT_ROUND",
    });
    setError("");
    setSuccess("");
    setShowForm(true);
  };

  const closeForm = () => {
    setShowForm(false);
    setEditingId(null);
    setForm(emptyForm);
    setError("");
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setSaving(true);
    setError("");
    setSuccess("");

    const payload = {
      technical_skills: form.technical_skills,
      communication: form.communication,
      problem_solving: form.problem_solving,
      overall_rating: form.overall_rating,
      strengths: form.strengths,
      weaknesses: form.weaknesses,
      comments: form.comments,
      recommendation: form.recommendation,
    };

    if (!editingId) {
      payload.interview = Number(form.interview);
    }

    try {
      const url = editingId
        ? `${API_URL}/interview-feedback/${editingId}/`
        : `${API_URL}/interview-feedback/`;

      const response = await fetch(url, {
        method: editingId ? "PATCH" : "POST",
        headers,
        body: JSON.stringify(payload),
      });

      const data = await response.json();

      if (!response.ok) {
        const message =
          typeof data === "object"
            ? Object.entries(data)
                .map(([key, value]) =>
                  `${key}: ${Array.isArray(value) ? value.join(", ") : value}`
                )
                .join(" | ")
            : "Unable to save feedback.";

        throw new Error(message);
      }

      setSuccess(editingId ? "Feedback updated successfully." : "Feedback submitted successfully.");
      setShowForm(false);
      setEditingId(null);
      setForm(emptyForm);
      await loadData();
    } catch (err) {
      setError(err.message || "Unable to save feedback.");
    } finally {
      setSaving(false);
    }
  };

  const getRecommendationLabel = (value) => {
    const labels = {
      HIRE: "Hire",
      NEXT_ROUND: "Next round",
      REJECT: "Reject",
      ON_HOLD: "On hold",
    };

    return labels[value] || value;
  };

  return (
    <main className="feedback-page">
      <header className="feedback-header">
        <div>
          <span className="feedback-eyebrow">RECRUITER WORKSPACE</span>
          <h1>Interview Feedback</h1>
          <p>Review candidate performance and manage interview evaluations.</p>
        </div>

        <div className="feedback-header-actions">
          <Link to="/dashboard" className="feedback-back-link">
            Dashboard
          </Link>
          <button
            type="button"
            className="feedback-primary-button"
            onClick={openCreateForm}
            disabled={completedInterviews.length === 0}
          >
            + Add feedback
          </button>
        </div>
      </header>

      {error && <div className="feedback-alert feedback-error">{error}</div>}
      {success && <div className="feedback-alert feedback-success">{success}</div>}

      <section className="feedback-summary">
        <article className="feedback-stat">
          <span>Total feedback</span>
          <strong>{feedbackList.length}</strong>
        </article>
        <article className="feedback-stat">
          <span>Completed interviews without feedback</span>
          <strong>{completedInterviews.length}</strong>
        </article>
      </section>

      {showForm && (
        <section className="feedback-form-card">
          <div className="feedback-form-heading">
            <div>
              <span className="feedback-eyebrow">
                {editingId ? "UPDATE EVALUATION" : "NEW EVALUATION"}
              </span>
              <h2>{editingId ? "Edit feedback" : "Submit interview feedback"}</h2>
            </div>
            <button type="button" className="feedback-close" onClick={closeForm}>
              Close
            </button>
          </div>

          <form onSubmit={handleSubmit}>
            {!editingId && (
              <label className="feedback-field">
                Completed interview
                <select
                  name="interview"
                  value={form.interview}
                  onChange={updateField}
                  required
                >
                  <option value="">Select an interview</option>
                  {completedInterviews.map((interview) => (
                    <option key={interview.id} value={interview.id}>
                      Interview #{interview.id} — {interview.candidate_name || "Candidate"} — {interview.job_title || "Job"}
                    </option>
                  ))}
                </select>
              </label>
            )}

            <div className="feedback-rating-grid">
              {[
                ["technical_skills", "Technical skills"],
                ["communication", "Communication"],
                ["problem_solving", "Problem solving"],
                ["overall_rating", "Overall rating"],
              ].map(([name, label]) => (
                <label className="feedback-field" key={name}>
                  {label} (1–5)
                  <select
                    name={name}
                    value={form[name]}
                    onChange={updateField}
                    required
                  >
                    {[1, 2, 3, 4, 5].map((rating) => (
                      <option key={rating} value={rating}>
                        {rating} / 5
                      </option>
                    ))}
                  </select>
                </label>
              ))}
            </div>

            <label className="feedback-field">
              Strengths
              <textarea
                name="strengths"
                value={form.strengths}
                onChange={updateField}
                rows="3"
                placeholder="Describe the candidate's strengths"
              />
            </label>

            <label className="feedback-field">
              Areas to improve
              <textarea
                name="weaknesses"
                value={form.weaknesses}
                onChange={updateField}
                rows="3"
                placeholder="Describe areas for improvement"
              />
            </label>

            <label className="feedback-field">
              Comments
              <textarea
                name="comments"
                value={form.comments}
                onChange={updateField}
                rows="3"
                placeholder="Additional interview notes"
              />
            </label>

            <label className="feedback-field">
              Recommendation
              <select
                name="recommendation"
                value={form.recommendation}
                onChange={updateField}
              >
                <option value="NEXT_ROUND">Next round</option>
                <option value="HIRE">Hire</option>
                <option value="REJECT">Reject</option>
                <option value="ON_HOLD">On hold</option>
              </select>
            </label>

            <div className="feedback-form-actions">
              <button
                type="button"
                className="feedback-secondary-button"
                onClick={closeForm}
              >
                Cancel
              </button>
              <button
                type="submit"
                className="feedback-primary-button"
                disabled={saving || (!editingId && !form.interview)}
              >
                {saving ? "Saving..." : editingId ? "Update feedback" : "Submit feedback"}
              </button>
            </div>
          </form>
        </section>
      )}

      <section className="feedback-list-section">
        <div className="feedback-list-heading">
          <div>
            <span className="feedback-eyebrow">EVALUATIONS</span>
            <h2>Submitted feedback</h2>
          </div>
          <button
            type="button"
            className="feedback-refresh-button"
            onClick={loadData}
            disabled={loading}
          >
            Refresh
          </button>
        </div>

        {loading ? (
          <p className="feedback-empty">Loading feedback...</p>
        ) : feedbackList.length === 0 ? (
          <div className="feedback-empty">
            No interview feedback has been submitted yet.
          </div>
        ) : (
          <div className="feedback-card-list">
            {feedbackList.map((feedback) => (
              <article className="feedback-card" key={feedback.id}>
                <div className="feedback-card-top">
                  <div>
                    <h3>{feedback.candidate_name || "Candidate"}</h3>
                    <p>{feedback.job_title || "Job title unavailable"}</p>
                  </div>
                  <span className="feedback-recommendation">
                    {getRecommendationLabel(feedback.recommendation)}
                  </span>
                </div>

                <div className="feedback-ratings">
                  <span>Technical: <strong>{feedback.technical_skills}/5</strong></span>
                  <span>Communication: <strong>{feedback.communication}/5</strong></span>
                  <span>Problem solving: <strong>{feedback.problem_solving}/5</strong></span>
                  <span>Overall: <strong>{feedback.overall_rating}/5</strong></span>
                </div>

                {feedback.strengths && (
                  <p className="feedback-detail">
                    <strong>Strengths:</strong> {feedback.strengths}
                  </p>
                )}
                {feedback.weaknesses && (
                  <p className="feedback-detail">
                    <strong>Areas to improve:</strong> {feedback.weaknesses}
                  </p>
                )}
                {feedback.comments && (
                  <p className="feedback-detail">
                    <strong>Comments:</strong> {feedback.comments}
                  </p>
                )}

                <div className="feedback-card-footer">
                  <span>
                    Submitted by: {feedback.submitted_by_name || "Recruiter"}
                  </span>
                  <button
  type="button"
  className="feedback-edit-button"
  onClick={() => {
    alert("Edit button clicked");
    openEditForm(feedback);
  }}
>
  Edit feedback
</button>
                </div>
              </article>
            ))}
          </div>
        )}
      </section>
    </main>
  );
}

export default InterviewFeedback;
