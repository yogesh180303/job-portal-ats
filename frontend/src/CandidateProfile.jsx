
import { useState, useEffect } from "react";
import "./CandidateProfile.css";

function CandidateProfile() {
  const [profile, setProfile] = useState({
    full_name: "",
    phone: "",
    location: "",
    professional_summary: "",
    skills: "",
  });

  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [errorMessage, setErrorMessage] = useState("");

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
        const response = await fetch(
          "http://127.0.0.1:8000/api/auth/profile/",
          {
            method: "GET",
            headers: {
              Authorization: `Bearer ${accessToken}`,
            },
          }
        );

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
  };

  // Save the candidate profile to Django.
  const handleSubmit = async (event) => {
    event.preventDefault();

    setMessage("");
    setErrorMessage("");

    const accessToken = sessionStorage.getItem("accessToken");

    if (!accessToken) {
      setErrorMessage("Please log in before saving your profile.");
      return;
    }

    setIsSaving(true);

    try {
      const response = await fetch(
        "http://127.0.0.1:8000/api/auth/profile/",
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${accessToken}`,
          },
          body: JSON.stringify(profile),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.detail || "Could not save your profile. Please try again."
        );
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
    return <div className="profile-page">Loading your profile...</div>;
  }

  return (
    <div className="profile-page">
      <div className="profile-container">
        <div className="profile-header">
          <h1>My Candidate Profile</h1>
          <p>Build your professional profile on CareerHub.</p>
        </div>

        <div className="profile-card">
          <form className="profile-form" onSubmit={handleSubmit}>
            <div className="profile-field">
              <label>Full Name</label>
              <input
                type="text"
                name="full_name"
                value={profile.full_name}
                onChange={handleChange}
                placeholder="Enter your full name"
              />
            </div>

            <div className="profile-field">
              <label>Phone Number</label>
              <input
                type="tel"
                name="phone"
                value={profile.phone}
                onChange={handleChange}
                placeholder="Enter your phone number"
              />
            </div>

            <div className="profile-field">
              <label>Location</label>
              <input
                type="text"
                name="location"
                value={profile.location}
                onChange={handleChange}
                placeholder="Enter your city"
              />
            </div>

            <div className="profile-field">
              <label>Professional Summary</label>
              <textarea
                name="professional_summary"
                value={profile.professional_summary}
                onChange={handleChange}
                placeholder="Write a short professional summary"
                rows="5"
              />
            </div>

            <div className="profile-field">
              <label>Skills</label>
              <textarea
                name="skills"
                value={profile.skills}
                onChange={handleChange}
                placeholder="Example: Python, React, Django, SQL"
                rows="3"
              />
            </div>

            {message && (
              <p className="form-message form-success">{message}</p>
            )}

            {errorMessage && (
              <p className="form-message form-error">{errorMessage}</p>
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
