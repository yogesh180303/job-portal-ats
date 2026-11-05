import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import "./PublicCompanyProfile.css";

const API_URL = "http://127.0.0.1:8000/api";

function PublicCompanyProfile() {
  const { id } = useParams();

  const [company, setCompany] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const loadCompany = async () => {
      try {
        setLoading(true);
        setError("");

        const response = await fetch(`${API_URL}/companies/${id}/`);

        if (!response.ok) {
          if (response.status === 404) {
            throw new Error("Company profile not found.");
          }

          throw new Error("Unable to load company profile.");
        }

        const data = await response.json();
        setCompany(data);
      } catch (err) {
        setError(err.message || "Something went wrong.");
      } finally {
        setLoading(false);
      }
    };

    loadCompany();
  }, [id]);

  const formatJobType = (jobType) => {
    if (!jobType) return "Not specified";

    return jobType
      .toLowerCase()
      .split("_")
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
      .join(" ");
  };

  const formatDate = (dateValue) => {
    if (!dateValue) return "";

    const date = new Date(dateValue);

    if (Number.isNaN(date.getTime())) return "";

    return date.toLocaleDateString();
  };

  const formatSalary = (salary) => {
    if (salary === null || salary === undefined) {
      return "Not specified";
    }

    return `₹${Number(salary).toLocaleString("en-IN")}`;
  };

  if (loading) {
    return (
      <div className="public-company-profile-section">
        <div className="public-company-profile-message">
          Loading company profile...
        </div>
      </div>
    );
  }

  if (error || !company) {
    return (
      <div className="public-company-profile-section">
        <div className="public-company-profile-message error-message">
          <h2>Unable to display company</h2>
          <p>{error || "Company profile not found."}</p>
          <Link to="/companies">Back to Companies</Link>
        </div>
      </div>
    );
  }

  return (
    <div className="public-company-profile-section">
      <div className="public-company-profile-container">
        <Link to="/companies" className="public-profile-back-link">
          Back to Companies
        </Link>

        <section className="public-company-hero">
          <div className="public-company-hero-top">
            <div className="public-company-profile-logo">
              {company.logo_url ? (
                <img
                  src={company.logo_url}
                  alt={`${company.company_name} logo`}
                />
              ) : (
                <span>
                  {company.company_name?.charAt(0)?.toUpperCase() || "C"}
                </span>
              )}
            </div>

            <div className="public-company-hero-info">
              <span className="public-company-label">
                COMPANY PROFILE
              </span>

              <h1>{company.company_name}</h1>

              <p className="public-company-profile-industry">
                {company.industry || "Industry not specified"}
              </p>
            </div>
          </div>

          <div className="public-company-profile-meta">
            {company.location && (
              <span>Location: {company.location}</span>
            )}

            {company.company_size && (
              <span>
                Company size: {company.company_size} employees
              </span>
            )}

            <span>
              {company.published_job_count || 0} published{" "}
              {(company.published_job_count || 0) === 1 ? "job" : "jobs"}
            </span>
          </div>

          {company.description && (
            <div className="public-company-about">
              <h2>About the Company</h2>
              <p>{company.description}</p>
            </div>
          )}

          <div className="public-company-external-links">
            {company.website && (
              <a
                href={company.website}
                target="_blank"
                rel="noreferrer"
              >
                Visit Website
              </a>
            )}

            {company.linkedin_url && (
              <a
                href={company.linkedin_url}
                target="_blank"
                rel="noreferrer"
              >
                LinkedIn Profile
              </a>
            )}
          </div>
        </section>

        <section className="public-company-jobs-section">
          <div className="public-company-jobs-heading">
            <div>
              <span className="public-company-label">
                CAREER OPPORTUNITIES
              </span>

              <h2>Open Positions</h2>

              <p>
                Explore published job opportunities at{" "}
                {company.company_name}.
              </p>
            </div>

            <span className="public-company-total-jobs">
              {company.jobs?.length || 0} jobs
            </span>
          </div>

          {!company.jobs || company.jobs.length === 0 ? (
            <div className="public-company-profile-message">
              No published jobs are available right now.
            </div>
          ) : (
            <div className="public-company-jobs-list">
              {company.jobs.map((job) => (
                <article className="public-company-job-card" key={job.id}>
                  <div className="public-company-job-main">
                    <h3>
                      <Link
                        to={`/job-details/${job.id}`}
                        className="public-company-job-title-link"
                      >
                        {job.title}
                      </Link>
                    </h3>

                    <p className="public-company-job-company">
                      {company.company_name}
                    </p>

                    <div className="public-company-job-meta">
                      {job.location && (
                        <span>Location: {job.location}</span>
                      )}

                      <span>
                        Job type: {formatJobType(job.job_type)}
                      </span>

                      {job.created_at && (
                        <span>
                          Posted: {formatDate(job.created_at)}
                        </span>
                      )}
                    </div>

                    {(job.salary_min || job.salary_max) && (
                      <p className="public-company-job-salary">
                        Salary: {formatSalary(job.salary_min)}
                        {" - "}
                        {formatSalary(job.salary_max)}
                      </p>
                    )}
                  </div>

                  <div className="public-company-job-action">
                    <Link to={`/job-details/${job.id}`}>
                      View Job Details
                    </Link>

                    <Link to="/login" className="public-company-apply-link">
                      Sign in to apply
                    </Link>
                  </div>
                </article>
              ))}
            </div>
          )}
        </section>
      </div>
    </div>
  );
}

export default PublicCompanyProfile;