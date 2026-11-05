
import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import "./SavedJobs.css";

const API_URL = "http://127.0.0.1:8000/api";

function SavedJobs() {
  const [savedJobs, setSavedJobs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [removingJobId, setRemovingJobId] = useState(null);

  const navigate = useNavigate();
  const token = sessionStorage.getItem("accessToken");

  useEffect(() => {
    if (!token) {
      navigate("/login");
      return;
    }

    const fetchSavedJobs = async () => {
      try {
        const response = await fetch(`${API_URL}/saved-jobs/`, {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        });

        const data = await response.json();

        if (!response.ok) {
          throw new Error(
            data.detail || "Unable to load saved jobs."
          );
        }

        setSavedJobs(data);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchSavedJobs();
  }, [token, navigate]);

  const handleRemove = async (savedJobId) => {
    setError("");
    setMessage("");
    setRemovingJobId(savedJobId);

    try {
      const response = await fetch(
        `${API_URL}/saved-jobs/${savedJobId}/`,
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
          data.detail || "Unable to remove saved job."
        );
      }

      setSavedJobs((previous) =>
        previous.filter((job) => job.id !== savedJobId)
      );

      setMessage("Job removed from your saved jobs.");
    } catch (err) {
      setError(err.message);
    } finally {
      setRemovingJobId(null);
    }
  };

  const formatSalary = (job) => {
    if (job.salary_min == null && job.salary_max == null) {
      return "Salary not specified";
    }

    const minimum =
      job.salary_min != null
        ? `₹${Number(job.salary_min).toLocaleString("en-IN")}`
        : null;

    const maximum =
      job.salary_max != null
        ? `₹${Number(job.salary_max).toLocaleString("en-IN")}`
        : null;

    if (minimum && maximum) {
      return `${minimum} - ${maximum}`;
    }

    return minimum || maximum;
  };

  const formatJobType = (jobType) => {
    const labels = {
      FULL_TIME: "Full-time",
      PART_TIME: "Part-time",
      INTERNSHIP: "Internship",
      CONTRACT: "Contract",
      REMOTE: "Remote",
    };

    return labels[jobType] || jobType;
  };

  if (loading) {
    return (
      <section className="saved-jobs-section">
        <div className="saved-jobs-container">
          <p>Loading your saved jobs...</p>
        </div>
      </section>
    );
  }

  return (
    <section className="saved-jobs-section">
      <div className="saved-jobs-container">
        <div className="saved-jobs-header">
          <span className="eyebrow">CAREERHUB</span>
          <h1>My Saved Jobs</h1>
          <p>
            Keep track of opportunities you are interested in.
          </p>

          <Link to="/dashboard" className="button button-outline">
            Back to Dashboard
          </Link>
        </div>

        {message && (
          <div className="success-message">{message}</div>
        )}

        {error && (
          <div className="error-message">{error}</div>
        )}

        <div className="saved-jobs-list-header">
          <h2>Your Saved Opportunities</h2>
          <p>
            {savedJobs.length}{" "}
            {savedJobs.length === 1 ? "job" : "jobs"} saved
          </p>
        </div>

        {savedJobs.length === 0 ? (
          <div className="saved-jobs-empty">
            <h3>No saved jobs yet</h3>
            <p>
              Explore available jobs and save the opportunities
              you are interested in.
            </p>
            <Link to="/jobs" className="button button-primary">
              Explore Jobs
            </Link>
          </div>
        ) : (
          <div className="saved-jobs-grid">
            {savedJobs.map((savedJob) => {
              const job = savedJob.job_details;

              if (!job) {
                return null;
              }

              return (
                <article
                  className="saved-job-card"
                  key={savedJob.id}
                >
                  <div className="saved-job-heading">
                    <div>
                      <span className="saved-job-company">
                        {job.company_name}
                      </span>
                      <h3>{job.title}</h3>
                    </div>

                    <span className="saved-job-status">
                      {job.status}
                    </span>
                  </div>

                  <div className="saved-job-details">
                    <span>{job.location}</span>
                    <span>{formatJobType(job.job_type)}</span>
                    <span>{formatSalary(job)}</span>
                  </div>

                  <div className="saved-job-description">
                    <h4>Description</h4>
                    <p>{job.description}</p>

                    <h4>Requirements</h4>
                    <p>{job.requirements}</p>
                  </div>

                  <div className="saved-job-footer">
                    <span>
                      Saved on:{" "}
                      {new Date(savedJob.saved_at).toLocaleDateString()}
                    </span>

                    <button
                      type="button"
                      className="button button-danger"
                      onClick={() => handleRemove(savedJob.id)}
                      disabled={removingJobId === savedJob.id}
                    >
                      {removingJobId === savedJob.id
                        ? "Removing..."
                        : "Remove Saved"}
                    </button>
                  </div>
                </article>
              );
            })}
          </div>
        )}
      </div>
    </section>
  );
}

export default SavedJobs;
