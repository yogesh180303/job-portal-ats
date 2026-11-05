
import { useState, useEffect } from "react";
import "./CandidateProfile.css";

const INITIAL_PROFILE = {
  full_name: "",
  phone: "",
  location: "",
  professional_summary: "",
  skills: "",
};

const API_URL = "http://127.0.0.1:8000/api/auth/profile/";
const SUMMARY_MAX_LENGTH = 1000;

function CandidateProfile() {
  const [profile, setProfile] = useState(INITIAL_PROFILE);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [errorMessage, setErrorMessage] = useState("");

  // Calculate profile completion using the five profile fields.
  const completedFields = Object.values(profile).filter(
    (value) => String(value).trim().length > 0
  ).length;

  const completionPercentage = Math.round(
    (completedFields / Object.keys(INITIAL_PROFILE).length) * 100
  );

  // Load the candidate profile from Django when the page opens.
  useEffect(() => {
    const loadProfile = async () => {
      const accessToken = sessionStorage.getItem("accessToken");

      if (!accessToken) {
        setErrorMessage("Please log in to view your profile.");
        setIsLoading(false);
        return;
      }

      try {
        const response = await fetch(API_URL, {
          method: "GET",
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
        });

        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.detail || "Could not load your profile.");
        }

        setProfile({
          full_name: data.full_name || "",
          phone: data.phone || "",
          location: data.location || "",
          professional_summary: data.professional_summary || "",
          skills: data.skills || "",
        });
      } catch (error) {
        setErrorMessage(error.message);
      } finally {
        setIsLoading(false);
      }
    };

    loadProfile();
  }, []);

  const handleChange = (event) => {
    const { name, value } = event.target;

    setProfile((previousProfile) => ({
      ...previousProfile,
      [name]: value,
    }));

    setMessage("");
    setErrorMessage("");
  };

  // Validate and save the candidate profile.
  const handleSubmit = async (event) => {
    event.preventDefault();

    setMessage("");
    setErrorMessage("");

    const accessToken = sessionStorage.getItem("accessToken");

    if (!accessToken) {
      setErrorMessage("Please log in before saving your profile.");
      return;
    }

    if (!profile.full_name.trim()) {
      setErrorMessage("Please enter your full name.");
      return;
    }

    if (profile.full_name.trim().length > 150) {
      setErrorMessage("Full name cannot exceed 150 characters.");
      return;
    }

    if (profile.phone.trim().length > 20) {
      setErrorMessage("Phone number cannot exceed 20 characters.");
      return;
    }

    if (
      profile.phone.trim() &&
      !/^[+()\d\s.-]+$/.test(profile.phone.trim())
    ) {
      setErrorMessage(
        "Please enter a valid phone number using digits and common phone symbols."
      );
      return;
    }

    if (profile.location.trim().length > 150) {
      setErrorMessage("Location cannot exceed 150 characters.");
      return;
    }

    if (profile.professional_summary.length > SUMMARY_MAX_LENGTH) {
      setErrorMessage(
        `Professional summary cannot exceed ${SUMMARY_MAX_LENGTH} characters.`
      );
      return;
    }

    setIsSaving(true);

    try {
      const response = await fetch(API_URL, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${accessToken}`,
        },
        body: JSON.stringify({
          ...profile,
          full_name: profile.full_name.trim(),
          phone: profile.phone.trim(),
          location: profile.location.trim(),
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        const errorText =
          data.detail ||
          Object.entries(data)
            .map(([field, errors]) => {
              const error = Array.isArray(errors)
                ? errors.join(" ")
                : String(errors);
              return `${field}: ${error}`;
            })
            .join(" ");

        throw new Error(errorText || "Could not save your profile.");
      }

      setProfile({
        full_name: data.full_name || "",
        phone: data.phone || "",
        location: data.location || "",
        professional_summary: data.professional_summary || "",
        skills: data.skills || "",
      });

      setMessage("Your profile has been saved successfully!");
    } catch (error) {
      setErrorMessage(error.message);
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <div className="profile-page">
        <div className="profile-loading">Loading your profile...</div>
      </div>
    );
  }

  return (
    <div className="profile-page">
      <div className="profile-container">

        <div className="profile-header">
          <h1>My Candidate Profile</h1>
          <p>Build your professional profile on CareerHub.</p>
        </div>

        {/* Profile Completion */}
        <div className="profile-completion-card">
          <div className="completion-header">
            <div>
              <h3>Profile Completion</h3>
              <p>Complete your profile to improve your professional presence.</p>
            </div>

            <span className="completion-percentage">
              {completionPercentage}%
            </span>
          </div>

          <div
            className="completion-progress-track"
            role="progressbar"
            aria-label="Profile completion"
            aria-valuenow={completionPercentage}
            aria-valuemin="0"
            aria-valuemax="100"
          >
            <div
              className="completion-progress-fill"
              style={{ width: `${completionPercentage}%` }}
            />
          </div>

          <p className="completion-count">
            {completedFields} of 5 profile sections completed
          </p>
        </div>

        <div className="profile-card">
          <form className="profile-form" onSubmit={handleSubmit}>

            <div className="profile-field">
              <label htmlFor="full_name">Full Name *</label>

              <input
                id="full_name"
                type="text"
                name="full_name"
                value={profile.full_name}
                onChange={handleChange}
                placeholder="Enter your full name"
                maxLength={150}
                required
              />

              <small>Maximum 150 characters.</small>
            </div>

            <div className="profile-field">
              <label htmlFor="phone">Phone Number</label>

              <input
                id="phone"
                type="tel"
                name="phone"
                value={profile.phone}
                onChange={handleChange}
                placeholder="Enter your phone number"
                maxLength={20}
              />

              <small>Maximum 20 characters.</small>
            </div>

            <div className="profile-field">
              <label htmlFor="location">Location</label>

              <input
                id="location"
                type="text"
                name="location"
                value={profile.location}
                onChange={handleChange}
                placeholder="Enter your city"
                maxLength={150}
              />
            </div>

            <div className="profile-field">
              <label htmlFor="professional_summary">
                Professional Summary
              </label>

              <textarea
                id="professional_summary"
                name="professional_summary"
                value={profile.professional_summary}
                onChange={handleChange}
                placeholder="Write a short professional summary about your experience, education, and career goals."
                rows="5"
                maxLength={SUMMARY_MAX_LENGTH}
              />

              <small className="character-counter">
                {profile.professional_summary.length}/{SUMMARY_MAX_LENGTH} characters
              </small>
            </div>

            <div className="profile-field">
              <label htmlFor="skills">Skills</label>

              <textarea
                id="skills"
                name="skills"
                value={profile.skills}
                onChange={handleChange}
                placeholder="Example: Python, React, Django, SQL"
                rows="3"
              />

              <small>
                Separate your skills with commas.
              </small>
            </div>

            {message && (
              <p className="form-message form-success" role="status">
                {message}
              </p>
            )}

            {errorMessage && (
              <p className="form-message form-error" role="alert">
                {errorMessage}
              </p>
            )}

            <button
              type="submit"
              className="button button-primary"
              disabled={isSaving}
            >
              {isSaving ? "Saving..." : "Save Profile"}
            </button>

          </form>
        </div>
      </div>
    </div>
  );
}

export default CandidateProfile;
