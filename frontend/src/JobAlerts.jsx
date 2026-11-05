import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import "./JobAlerts.css";

const API_URL = "http://127.0.0.1:8000/api";

const initialForm = {
  keywords: "",
  location: "",
  job_type: "",
  minimum_salary: "",
  email_notifications: true,
  is_active: true,
};

function JobAlerts() {
  const [alerts, setAlerts] = useState([]);
  const [form, setForm] = useState(initialForm);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [editingId, setEditingId] = useState(null);
  const [deletingId, setDeletingId] = useState(null);

  const navigate = useNavigate();
  const token = sessionStorage.getItem("accessToken");

  useEffect(() => {
    if (!token) {
      navigate("/login");
      return;
    }

    const fetchAlerts = async () => {
      try {
        const response = await fetch(`${API_URL}/job-alerts/`, {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        });

        const data = await response.json();

        if (!response.ok) {
          throw new Error(
            data.detail || "Unable to load your job alerts."
          );
        }

        setAlerts(data);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchAlerts();
  }, [token, navigate]);

  const handleChange = (event) => {
    const { name, value, type, checked } = event.target;

    setForm((previous) => ({
      ...previous,
      [name]: type === "checkbox" ? checked : value,
    }));
  };

  const resetForm = () => {
    setForm(initialForm);
    setEditingId(null);
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    setError("");
    setMessage("");
    setSaving(true);

    const payload = {
      ...form,
      minimum_salary:
        form.minimum_salary === ""
          ? null
          : Number(form.minimum_salary),
    };

    const url = editingId
      ? `${API_URL}/job-alerts/${editingId}/`
      : `${API_URL}/job-alerts/`;

    try {
      const response = await fetch(url, {
        method: editingId ? "PATCH" : "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      const data = await response.json();

      if (!response.ok) {
        const validationMessage =
          typeof data === "object"
            ? Object.entries(data)
                .map(([field, errors]) => {
                  const errorText = Array.isArray(errors)
                    ? errors.join(", ")
                    : String(errors);

                  return `${field}: ${errorText}`;
                })
                .join(" ")
            : "Unable to save your job alert.";

        throw new Error(
          data.detail || validationMessage
        );
      }

      if (editingId) {
        setAlerts((previous) =>
          previous.map((alert) =>
            alert.id === editingId ? data : alert
          )
        );

        setMessage("Job alert updated successfully.");
      } else {
        setAlerts((previous) => [data, ...previous]);
        setMessage("Job alert created successfully.");
      }

      resetForm();
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  const handleEdit = (alert) => {
    setError("");
    setMessage("");

    setForm({
      keywords: alert.keywords || "",
      location: alert.location || "",
      job_type: alert.job_type || "",
      minimum_salary:
        alert.minimum_salary == null
          ? ""
          : String(alert.minimum_salary),
      email_notifications: alert.email_notifications,
      is_active: alert.is_active,
    });

    setEditingId(alert.id);

    window.scrollTo({
      top: 0,
      behavior: "smooth",
    });
  };

  const handleDelete = async (alertId) => {
    const confirmed = window.confirm(
      "Are you sure you want to delete this job alert?"
    );

    if (!confirmed) {
      return;
    }

    setError("");
    setMessage("");
    setDeletingId(alertId);

    try {
      const response = await fetch(
        `${API_URL}/job-alerts/${alertId}/`,
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
        throw new Error(
          data.detail || "Unable to delete this job alert."
        );
      }

      setAlerts((previous) =>
        previous.filter((alert) => alert.id !== alertId)
      );

      if (editingId === alertId) {
        resetForm();
      }

      setMessage("Job alert deleted successfully.");
    } catch (err) {
      setError(err.message);
    } finally {
      setDeletingId(null);
    }
  };

  const handleToggleActive = async (alert) => {
    setError("");
    setMessage("");

    try {
      const response = await fetch(
        `${API_URL}/job-alerts/${alert.id}/`,
        {
          method: "PATCH",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            is_active: !alert.is_active,
          }),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.detail || "Unable to update alert status."
        );
      }

      setAlerts((previous) =>
        previous.map((item) =>
          item.id === alert.id ? data : item
        )
      );

      setMessage(
        data.is_active
          ? "Job alert activated."
          : "Job alert paused."
      );
    } catch (err) {
      setError(err.message);
    }
  };

  const formatSalary = (salary) => {
    if (salary == null) {
      return "No minimum salary";
    }

    return `₹${Number(salary).toLocaleString("en-IN")}`;
  };

  const formatJobType = (jobType) => {
    const labels = {
      FULL_TIME: "Full-time",
      PART_TIME: "Part-time",
      INTERNSHIP: "Internship",
      CONTRACT: "Contract",
      REMOTE: "Remote",
    };

    return labels[jobType] || jobType || "Any type";
  };

  if (loading) {
    return (
      <section className="job-alerts-section">
        <div className="job-alerts-container">
          <p>Loading your job alerts...</p>
        </div>
      </section>
    );
  }

  return (
    <section className="job-alerts-section">
      <div className="job-alerts-container">
        <header className="job-alerts-header">
          <span className="eyebrow">CAREERHUB</span>
          <h1>My Job Alerts</h1>
          <p>
            Get notified when new opportunities match your
            career interests.
          </p>

          <Link
            to="/dashboard"
            className="button button-outline"
          >
            Back to Dashboard
          </Link>
        </header>

        {message && (
          <div className="job-alert-success" role="status">
            {message}
          </div>
        )}

        {error && (
          <div className="job-alert-error" role="alert">
            {error}
          </div>
        )}

        <section className="job-alert-form-card">
          <div className="job-alert-section-heading">
            <div>
              <span className="eyebrow">
                {editingId ? "UPDATE PREFERENCES" : "PERSONALIZE YOUR SEARCH"}
              </span>

              <h2>
                {editingId ? "Edit Job Alert" : "Create a Job Alert"}
              </h2>

              <p>
                Choose the types of jobs you want CareerHub
                to notify you about.
              </p>
            </div>
          </div>

          <form onSubmit={handleSubmit}>
            <div className="job-alert-form-grid">
              <label className="job-alert-field">
                <span>Keywords</span>
                <input
                  type="text"
                  name="keywords"
                  value={form.keywords}
                  onChange={handleChange}
                  placeholder="Example: Python Django Developer"
                />
                <small>
                  Separate multiple keywords with spaces.
                </small>
              </label>

              <label className="job-alert-field">
                <span>Preferred Location</span>
                <input
                  type="text"
                  name="location"
                  value={form.location}
                  onChange={handleChange}
                  placeholder="Example: Mumbai"
                />
              </label>

              <label className="job-alert-field">
                <span>Employment Type</span>
                <select
                  name="job_type"
                  value={form.job_type}
                  onChange={handleChange}
                >
                  <option value="">Any employment type</option>
                  <option value="FULL_TIME">Full-time</option>
                  <option value="PART_TIME">Part-time</option>
                  <option value="INTERNSHIP">Internship</option>
                  <option value="CONTRACT">Contract</option>
                  <option value="REMOTE">Remote</option>
                </select>
              </label>

              <label className="job-alert-field">
                <span>Minimum Salary (₹)</span>
                <input
                  type="number"
                  name="minimum_salary"
                  min="0"
                  value={form.minimum_salary}
                  onChange={handleChange}
                  placeholder="Example: 300000"
                />
              </label>
            </div>

            <div className="job-alert-options">
              <label className="job-alert-checkbox">
                <input
                  type="checkbox"
                  name="email_notifications"
                  checked={form.email_notifications}
                  onChange={handleChange}
                />
                <span>
                  Send me email notifications for matching jobs.
                </span>
              </label>

              <label className="job-alert-checkbox">
                <input
                  type="checkbox"
                  name="is_active"
                  checked={form.is_active}
                  onChange={handleChange}
                />
                <span>
                  Keep this job alert active.
                </span>
              </label>
            </div>

            <div className="job-alert-form-actions">
              <button
                type="submit"
                className="button button-primary"
                disabled={saving}
              >
                {saving
                  ? "Saving..."
                  : editingId
                    ? "Update Job Alert"
                    : "Create Job Alert"}
              </button>

              {editingId && (
                <button
                  type="button"
                  className="button button-outline"
                  onClick={resetForm}
                  disabled={saving}
                >
                  Cancel Editing
                </button>
              )}
            </div>
          </form>
        </section>

        <section className="job-alert-list-section">
          <div className="job-alert-list-heading">
            <div>
              <h2>Your Saved Alerts</h2>
              <p>
                {alerts.length}{" "}
                {alerts.length === 1 ? "alert" : "alerts"} created
              </p>
            </div>
          </div>

          {alerts.length === 0 ? (
            <div className="job-alert-empty">
              <h3>No job alerts created yet</h3>
              <p>
                Create your first alert to receive notifications
                about matching job opportunities.
              </p>
              <Link
                to="/jobs"
                className="button button-primary"
              >
                Explore Jobs
              </Link>
            </div>
          ) : (
            <div className="job-alert-list">
              {alerts.map((alert) => (
                <article
                  className="job-alert-card"
                  key={alert.id}
                >
                  <div className="job-alert-card-heading">
                    <div>
                      <span className="job-alert-label">
                        JOB ALERT #{alert.id}
                      </span>

                      <h3>
                        {alert.keywords || "All job opportunities"}
                      </h3>
                    </div>

                    <span
                      className={
                        alert.is_active
                          ? "job-alert-status active"
                          : "job-alert-status inactive"
                      }
                    >
                      {alert.is_active ? "Active" : "Paused"}
                    </span>
                  </div>

                  <div className="job-alert-details">
                    <span>
                      <strong>Location:</strong>{" "}
                      {alert.location || "Any location"}
                    </span>

                    <span>
                      <strong>Job Type:</strong>{" "}
                      {formatJobType(alert.job_type)}
                    </span>

                    <span>
                      <strong>Minimum Salary:</strong>{" "}
                      {formatSalary(alert.minimum_salary)}
                    </span>

                    <span>
                      <strong>Email Notifications:</strong>{" "}
                      {alert.email_notifications ? "Enabled" : "Disabled"}
                    </span>
                  </div>

                  <div className="job-alert-card-footer">
                    <span>
                      Created:{" "}
                      {new Date(alert.created_at).toLocaleDateString("en-IN")}
                    </span>

                    <div className="job-alert-actions">
                      <button
                        type="button"
                        className="button button-outline"
                        onClick={() => handleToggleActive(alert)}
                      >
                        {alert.is_active ? "Pause Alert" : "Activate Alert"}
                      </button>

                      <button
                        type="button"
                        className="button button-outline"
                        onClick={() => handleEdit(alert)}
                      >
                        Edit
                      </button>

                      <button
                        type="button"
                        className="button button-danger"
                        onClick={() => handleDelete(alert.id)}
                        disabled={deletingId === alert.id}
                      >
                        {deletingId === alert.id
                          ? "Deleting..."
                          : "Delete"}
                      </button>
                    </div>
                  </div>
                </article>
              ))}
            </div>
          )}
        </section>
      </div>
    </section>
  );
}

export default JobAlerts;