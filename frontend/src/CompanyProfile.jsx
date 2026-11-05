import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import "./CompanyProfile.css";

const API_URL = "http://127.0.0.1:8000/api";

const initialFormData = {
  company_name: "",
  logo_url: "",
  website: "",
  industry: "",
  company_size: "",
  location: "",
  description: "",
  linkedin_url: "",
};

function CompanyProfile() {
  const [formData, setFormData] = useState(initialFormData);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [isRecruiter, setIsRecruiter] = useState(false);

  const navigate = useNavigate();

  useEffect(() => {
    const accessToken = sessionStorage.getItem("accessToken");

    if (!accessToken) {
      navigate("/login");
      return;
    }

    const loadCompanyProfile = async () => {
      try {
        const userResponse = await fetch(`${API_URL}/auth/me/`, {
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
        });

        if (!userResponse.ok) {
          throw new Error("Unable to verify your account.");
        }

        const userData = await userResponse.json();

        if (userData.role !== "RECRUITER") {
          setIsRecruiter(false);
          setError("Only recruiters can manage a company profile.");
          return;
        }

        setIsRecruiter(true);

        const profileResponse = await fetch(
          `${API_URL}/company-profile/`,
          {
            headers: {
              Authorization: `Bearer ${accessToken}`,
            },
          }
        );

        if (!profileResponse.ok) {
          throw new Error("Unable to load your company profile.");
        }

        const profileData = await profileResponse.json();

        setFormData({
          company_name: profileData.company_name || "",
          logo_url: profileData.logo_url || "",
          website: profileData.website || "",
          industry: profileData.industry || "",
          company_size: profileData.company_size || "",
          location: profileData.location || "",
          description: profileData.description || "",
          linkedin_url: profileData.linkedin_url || "",
        });
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    loadCompanyProfile();
  }, [navigate]);

  const handleChange = (event) => {
    const { name, value } = event.target;

    setFormData((previousData) => ({
      ...previousData,
      [name]: value,
    }));

    setSuccess("");
    setError("");
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    const accessToken = sessionStorage.getItem("accessToken");

    if (!accessToken) {
      navigate("/login");
      return;
    }

    setSaving(true);
    setError("");
    setSuccess("");

    try {
      const response = await fetch(`${API_URL}/company-profile/`, {
        method: "PUT",
        headers: {
          Authorization: `Bearer ${accessToken}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(formData),
      });

      const responseData = await response.json();

      if (!response.ok) {
        if (typeof responseData === "object" && responseData !== null) {
          const errorMessages = Object.entries(responseData)
            .map(([field, messages]) => {
              const message = Array.isArray(messages)
                ? messages.join(" ")
                : String(messages);

              return `${field}: ${message}`;
            })
            .join(" ");

          throw new Error(
            errorMessages || "Unable to save your company profile."
          );
        }

        throw new Error("Unable to save your company profile.");
      }

      setFormData({
        company_name: responseData.company_name || "",
        logo_url: responseData.logo_url || "",
        website: responseData.website || "",
        industry: responseData.industry || "",
        company_size: responseData.company_size || "",
        location: responseData.location || "",
        description: responseData.description || "",
        linkedin_url: responseData.linkedin_url || "",
      });

      setSuccess("Your company profile has been saved successfully.");
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="company-profile-section">
        <div className="company-profile-container">
          <p>Loading company profile...</p>
        </div>
      </div>
    );
  }

  if (!isRecruiter) {
    return (
      <div className="company-profile-section">
        <div className="company-profile-container">
          <div className="company-profile-header">
            <h1>Company Profile</h1>
            <p>{error || "Access denied."}</p>
          </div>

          <Link to="/dashboard" className="company-back-link">
            Back to Dashboard
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="company-profile-section">
      <div className="company-profile-container">
        <header className="company-profile-header">
          <span className="eyebrow">RECRUITER SETTINGS</span>

          <h1>Company Profile</h1>

          <p>
            Share information about your company to help candidates
            understand your organization.
          </p>

          <Link to="/dashboard" className="company-back-link">
            ← Back to Dashboard
          </Link>
        </header>

        {success && (
          <div className="success-message" role="status">
            {success}
          </div>
        )}

        {error && (
          <div className="error-message" role="alert">
            {error}
          </div>
        )}

        <section className="company-form-card">
          <div className="company-form-heading">
            <h2>Company Information</h2>
            <p>Fields marked with * are required.</p>
          </div>

          {formData.logo_url && (
            <div className="company-logo-preview">
              <img
                src={formData.logo_url}
                alt="Company logo preview"
                onError={(event) => {
                  event.currentTarget.style.display = "none";
                }}
              />
            </div>
          )}

          <form onSubmit={handleSubmit}>
            <div className="company-form-grid">
              <div className="company-form-group">
                <label htmlFor="company_name">
                  Company Name *
                </label>

                <input
                  id="company_name"
                  type="text"
                  name="company_name"
                  placeholder="Enter your company name"
                  value={formData.company_name}
                  onChange={handleChange}
                  maxLength={200}
                  required
                />
              </div>

              <div className="company-form-group">
                <label htmlFor="industry">
                  Industry
                </label>

                <input
                  id="industry"
                  type="text"
                  name="industry"
                  placeholder="Example: Information Technology"
                  value={formData.industry}
                  onChange={handleChange}
                  maxLength={150}
                />
              </div>

              <div className="company-form-group">
                <label htmlFor="website">
                  Company Website
                </label>

                <input
                  id="website"
                  type="url"
                  name="website"
                  placeholder="https://example.com"
                  value={formData.website}
                  onChange={handleChange}
                />
              </div>

              <div className="company-form-group">
                <label htmlFor="logo_url">
                  Company Logo URL
                </label>

                <input
                  id="logo_url"
                  type="url"
                  name="logo_url"
                  placeholder="https://example.com/logo.png"
                  value={formData.logo_url}
                  onChange={handleChange}
                />
              </div>

              <div className="company-form-group">
                <label htmlFor="company_size">
                  Company Size
                </label>

                <select
                  id="company_size"
                  name="company_size"
                  value={formData.company_size}
                  onChange={handleChange}
                >
                  <option value="">Select company size</option>
                  <option value="1-10">1-10 employees</option>
                  <option value="11-50">11-50 employees</option>
                  <option value="51-200">51-200 employees</option>
                  <option value="201-500">201-500 employees</option>
                  <option value="501-1000">501-1000 employees</option>
                  <option value="1000+">1000+ employees</option>
                </select>
              </div>

              <div className="company-form-group">
                <label htmlFor="location">
                  Company Location
                </label>

                <input
                  id="location"
                  type="text"
                  name="location"
                  placeholder="Example: Pune, India"
                  value={formData.location}
                  onChange={handleChange}
                  maxLength={200}
                />
              </div>

              <div className="company-form-group company-full-width">
                <label htmlFor="linkedin_url">
                  LinkedIn Company URL
                </label>

                <input
                  id="linkedin_url"
                  type="url"
                  name="linkedin_url"
                  placeholder="https://www.linkedin.com/company/example"
                  value={formData.linkedin_url}
                  onChange={handleChange}
                />
              </div>

              <div className="company-form-group company-full-width">
                <label htmlFor="description">
                  Company Description
                </label>

                <textarea
                  id="description"
                  name="description"
                  placeholder="Tell candidates about your company, its mission, culture, and work environment..."
                  value={formData.description}
                  onChange={handleChange}
                  rows={6}
                />
              </div>
            </div>

            <div className="company-form-actions">
              <button
                type="submit"
                className="button button-primary"
                disabled={saving}
              >
                {saving ? "Saving..." : "Save Company Profile"}
              </button>

              <Link
                to="/dashboard"
                className="button button-outline"
              >
                Cancel
              </Link>
            </div>
          </form>
        </section>
      </div>
    </div>
  );
}

export default CompanyProfile;