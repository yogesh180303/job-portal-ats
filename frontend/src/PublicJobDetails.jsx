import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import "./PublicJobDetails.css";

const API_URL = "http://127.0.0.1:8000/api";

function PublicJobDetails() {
  const { id } = useParams();

  const [job, setJob] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const loadJob = async () => {
      try {
        setLoading(true);
        setError("");

        const response = await fetch(`${API_URL}/public-jobs/${id}/`);

        if (!response.ok) {
          if (response.status === 404) {
            throw new Error("This job is no longer available.");
          }

          throw new Error("Unable to load job details.");
        }

        const data = await response.json();
        setJob(data);
      } catch (err) {
        setError(err.message || "Something went wrong.");
      } finally {
        setLoading(false);
      }
    };

    loadJob();
  }, [id]);

  const formatJobType = (jobType) => {
    if (!jobType) return "Not specified";

    return jobType
      .toLowerCase()
      .split("_")
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
      .join(" ");
  };

  const formatSalary = (salary) => {
    if (salary === null || salary === undefined) {
      return "Not specified";
    }

    return `₹${Number(salary).toLocaleString("en-IN")}`;
  };

  const formatDate = (dateValue) => {
    if (!dateValue) return "";

    const date = new Date(dateValue);

    if (Number.isNaN(date.getTime())) return "";

    return date.toLocaleDateString();
  };

  if (loading) {
    return (
      <div className="public-job-details-section">
        <div className="public-job-message">
          Loading job details...
        </div>
      </div>
    );
  }

  if (error || !job) {
    return (
      <div className="public-job-details-section">
        <div className="public-job-message error-message">
          <h2>Unable to display job</h2>
          <p>{error || "Job not found."}</p>
          <Link to="/companies">Explore Companies</Link>
        </div>
      </div>
    );
  }

  return (
    <div className="public-job-details-section">
      <div className="public-job-details-container">
        <Link to="/companies" className="public-job-back-link">
          ← Back to Companies
        </Link>

        <section className="public-job-hero">
          <span className="public-job-label">JOB OPPORTUNITY</span>

          <h1>{job.title}</h1>

          <p className="public-job-company">
            {job.company_name}
          </p>

          <div className="public-job-meta">
            <span>
              <strong>Location</strong>
              {job.location || "Not specified"}
            </span>

            <span>
              <strong>Employment Type</strong>
              {formatJobType(job.job_type)}
            </span>

            <span>
              <strong>Salary Range</strong>
              {formatSalary(job.salary_min)} – {formatSalary(job.salary_max)}
            </span>
          </div>

          {job.created_at && (
            <p className="public-job-posted">
              Posted on {formatDate(job.created_at)}
            </p>
          )}

          <div className="public-job-apply-area">
            <Link to="/login" className="public-job-apply-button">
              Sign in to Apply
            </Link>

            <Link to="/register" className="public-job-register-link">
              New to CareerHub? Create an account
            </Link>
          </div>
        </section>

        <section className="public-job-content">
          <div className="public-job-description">
            <span className="public-job-label">ABOUT THE ROLE</span>
            <h2>Job Description</h2>

            <p className="public-job-description-text">
              {job.description || "No job description provided."}
            </p>
          </div>

          <div className="public-job-requirements">
            <span className="public-job-label">WHAT WE ARE LOOKING FOR</span>
            <h2>Requirements and Qualifications</h2>

            <p className="public-job-description-text">
              {job.requirements || "No specific requirements provided."}
            </p>
          </div>

          <div className="public-job-company-info">
            <span className="public-job-label">HIRING COMPANY</span>
            <h2>{job.company_name}</h2>
            <p>Recruiter: {job.recruiter_name || "Not specified"}</p>
            <p>Location: {job.location || "Not specified"}</p>
          </div>
        </section>

        <section className="public-job-bottom-apply">
          <h2>Interested in this opportunity?</h2>
          <p>Sign in to your CareerHub account to apply for this position.</p>

          <Link to="/login" className="public-job-apply-button">
            Sign in to Apply
          </Link>
        </section>
      </div>
    </div>
  );
}

export default PublicJobDetails;