import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import "./Companies.css";

const API_URL = "http://127.0.0.1:8000/api";

function Companies() {
  const [companies, setCompanies] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const loadCompanies = async () => {
      try {
        const response = await fetch(`${API_URL}/companies/`);

        if (!response.ok) {
          throw new Error("Unable to load companies.");
        }

        const data = await response.json();
        setCompanies(data);
      } catch (err) {
        setError(err.message || "Something went wrong.");
      } finally {
        setLoading(false);
      }
    };

    loadCompanies();
  }, []);

  return (
    <div className="public-companies-section">
      <div className="public-companies-container">
        <header className="public-companies-header">
          <Link to="/" className="public-companies-back">
            Back to Home
          </Link>

          <span className="eyebrow">DISCOVER ORGANIZATIONS</span>

          <h1>Explore Companies</h1>

          <p>
            Discover organizations, learn about their work culture,
            and explore their latest career opportunities.
          </p>
        </header>

        {loading && (
          <div className="public-companies-message">
            Loading companies...
          </div>
        )}

        {!loading && error && (
          <div className="public-companies-message error-message">
            {error}
          </div>
        )}

        {!loading && !error && companies.length === 0 && (
          <div className="public-companies-empty">
            <h2>No companies available yet</h2>
            <p>
              Companies with published job openings will appear here.
              Please check again later.
            </p>
          </div>
        )}

        {!loading && !error && companies.length > 0 && (
          <>
            <div className="public-companies-summary">
              <span>
                {companies.length}{" "}
                {companies.length === 1 ? "company" : "companies"} found
              </span>
            </div>

            <div className="public-companies-grid">
              {companies.map((company) => (
                <article className="public-company-card" key={company.id}>
                  <div className="public-company-card-top">
                    <div className="public-company-logo">
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

                    <span className="public-company-jobs-count">
                      {company.published_job_count}{" "}
                      {company.published_job_count === 1 ? "job" : "jobs"}
                    </span>
                  </div>

                  <h2>{company.company_name}</h2>

                  <p className="public-company-industry">
                    {company.industry || "Industry not specified"}
                  </p>

                  <div className="public-company-details">
                    {company.location && (
                      <span>Location: {company.location}</span>
                    )}

                    {company.company_size && (
                      <span>Company size: {company.company_size} employees</span>
                    )}
                  </div>

                  <p className="public-company-description">
                    {company.description
                      ? company.description.length > 140
                        ? `${company.description.slice(0, 140)}...`
                        : company.description
                      : "Learn more about this organization and explore its career opportunities."}
                  </p>

                  <Link
                    to={`/companies/${company.id}`}
                    className="public-company-view-link"
                  >
                    View Company Profile
                  </Link>
                </article>
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
}

export default Companies;
