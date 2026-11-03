
import { useState, useEffect } from "react";
import "./WorkExperience.css";

const initialFormData = {
  job_title: "",
  company: "",
  employment_type: "FULL_TIME",
  location: "",
  start_date: "",
  end_date: "",
  currently_working: false,
  description: "",
};

function WorkExperience() {
  const [experiences, setExperiences] = useState([]);
  const [formData, setFormData] = useState(initialFormData);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [message, setMessage] = useState("");
  const [errorMessage, setErrorMessage] = useState("");

  const handleChange = (event) => {
    const { name, value, type, checked } = event.target;

    setFormData((previousData) => ({
      ...previousData,
      [name]: type === "checkbox" ? checked : value,
    }));
  };

  const handleEdit = (experience) => {
    setEditingId(experience.id);

    setFormData({
      job_title: experience.job_title,
      company: experience.company,
      employment_type: experience.employment_type,
      location: experience.location || "",
      start_date: experience.start_date,
      end_date: experience.end_date || "",
      currently_working: experience.currently_working,
      description: experience.description || "",
    });

    setMessage("");
    setErrorMessage("");

    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleCancelEdit = () => {
    setEditingId(null);
    setFormData(initialFormData);
    setMessage("");
    setErrorMessage("");
  };

  const handleDelete = async (experienceId) => {
    const confirmDelete = window.confirm(
      "Are you sure you want to delete this work experience record?"
    );

    if (!confirmDelete) return;

    const accessToken = sessionStorage.getItem("accessToken");

    if (!accessToken) {
      setErrorMessage("Please log in before deleting work experience.");
      return;
    }

    setMessage("");
    setErrorMessage("");

    try {
      const response = await fetch(
        `http://127.0.0.1:8000/api/experience/${experienceId}/`,
        {
          method: "DELETE",
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.detail || data.message || JSON.stringify(data));
      }

      setExperiences((previous) =>
        previous.filter((item) => item.id !== experienceId)
      );

      if (editingId === experienceId) {
        handleCancelEdit();
      }

      setMessage("Work experience deleted successfully!");
    } catch (error) {
      setErrorMessage(error.message);
    }
  };

  useEffect(() => {
    const loadExperiences = async () => {
      const accessToken = sessionStorage.getItem("accessToken");

      if (!accessToken) {
        setErrorMessage("Please log in to manage work experience.");
        setIsLoading(false);
        return;
      }

      try {
        const response = await fetch(
          "http://127.0.0.1:8000/api/experience/",
          {
            headers: {
              Authorization: `Bearer ${accessToken}`,
            },
          }
        );

        const data = await response.json();

        if (!response.ok) {
          throw new Error(
            data.detail || JSON.stringify(data) ||
            "Could not load work experience records."
          );
        }

        setExperiences(data);
      } catch (error) {
        setErrorMessage(error.message);
      } finally {
        setIsLoading(false);
      }
    };

    loadExperiences();
  }, []);

  const handleSubmit = async (event) => {
    event.preventDefault();

    setMessage("");
    setErrorMessage("");

    const accessToken = sessionStorage.getItem("accessToken");

    if (!accessToken) {
      setErrorMessage("Please log in before saving work experience.");
      return;
    }

    if (
      formData.end_date &&
      !formData.currently_working &&
      formData.end_date < formData.start_date
    ) {
      setErrorMessage("End date cannot be earlier than start date.");
      return;
    }

    setIsSaving(true);

    try {
      const payload = {
        job_title: formData.job_title.trim(),
        company: formData.company.trim(),
        employment_type: formData.employment_type,
        location: formData.location.trim(),
        start_date: formData.start_date,
        end_date: formData.currently_working ? null : formData.end_date || null,
        currently_working: formData.currently_working,
        description: formData.description.trim(),
      };

      const url = editingId
        ? `http://127.0.0.1:8000/api/experience/${editingId}/`
        : "http://127.0.0.1:8000/api/experience/";

      const response = await fetch(url, {
        method: editingId ? "PUT" : "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${accessToken}`,
        },
        body: JSON.stringify(payload),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(JSON.stringify(data));
      }

      if (editingId) {
        setExperiences((previous) =>
          previous.map((item) => item.id === editingId ? data : item)
        );
        setMessage("Work experience updated successfully!");
        setEditingId(null);
      } else {
        setExperiences((previous) => [data, ...previous]);
        setMessage("Work experience added successfully!");
      }

      setFormData(initialFormData);
    } catch (error) {
      setErrorMessage(error.message);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <section className="experience-section">
      <div className="experience-container">
        <div className="experience-header">
          <h2>Work Experience</h2>
          <p>Add your professional work experience.</p>
        </div>

        {message && (
          <p className="form-message form-success">{message}</p>
        )}

        {errorMessage && (
          <p className="form-message form-error">{errorMessage}</p>
        )}

        <div className="experience-card">
          <h3>{editingId ? "Edit Experience" : "Add Experience"}</h3>

          <form className="experience-form" onSubmit={handleSubmit}>
            <div className="experience-field">
              <label>Job Title</label>
              <input
                type="text"
                name="job_title"
                value={formData.job_title}
                onChange={handleChange}
                placeholder="Example: Software Developer"
                required
              />
            </div>

            <div className="experience-field">
              <label>Company</label>
              <input
                type="text"
                name="company"
                value={formData.company}
                onChange={handleChange}
                placeholder="Enter company name"
                required
              />
            </div>

            <div className="experience-field">
              <label>Employment Type</label>
              <select
                name="employment_type"
                value={formData.employment_type}
                onChange={handleChange}
              >
                <option value="FULL_TIME">Full-time</option>
                <option value="PART_TIME">Part-time</option>
                <option value="INTERNSHIP">Internship</option>
                <option value="CONTRACT">Contract</option>
                <option value="FREELANCE">Freelance</option>
              </select>
            </div>

            <div className="experience-field">
              <label>Location</label>
              <input
                type="text"
                name="location"
                value={formData.location}
                onChange={handleChange}
                placeholder="Example: Pune, India"
              />
            </div>

            <div className="experience-row">
              <div className="experience-field">
                <label>Start Date</label>
                <input
                  type="date"
                  name="start_date"
                  value={formData.start_date}
                  onChange={handleChange}
                  required
                />
              </div>

              <div className="experience-field">
                <label>End Date</label>
                <input
                  type="date"
                  name="end_date"
                  value={formData.end_date}
                  onChange={handleChange}
                  disabled={formData.currently_working}
                  required={!formData.currently_working}
                />
              </div>
            </div>

            <label className="experience-checkbox">
              <input
                type="checkbox"
                name="currently_working"
                checked={formData.currently_working}
                onChange={handleChange}
              />
              I currently work here
            </label>

            <div className="experience-field">
              <label>Job Description</label>
              <textarea
                name="description"
                value={formData.description}
                onChange={handleChange}
                placeholder="Describe your responsibilities and achievements..."
                rows="5"
              />
            </div>

            <button
              type="submit"
              className="button button-primary"
              disabled={isSaving}
            >
              {isSaving
                ? "Saving..."
                : editingId
                  ? "Update Experience"
                  : "Add Experience"}
            </button>

            {editingId && (
              <button
                type="button"
                onClick={handleCancelEdit}
                className="button button-outline"
              >
                Cancel
              </button>
            )}
          </form>
        </div>

        <div className="experience-card">
          <h3>My Work Experience</h3>

          {isLoading ? (
            <p>Loading work experience...</p>
          ) : experiences.length === 0 ? (
            <p>No work experience records added yet.</p>
          ) : (
            <div className="experience-list">
              {experiences.map((experience) => (
                <div className="experience-item" key={experience.id}>
                  <h4>{experience.job_title}</h4>
                  <p>{experience.company}</p>

                  <p>{experience.employment_type.replace("_", " ")}</p>

                  {experience.location && <p>{experience.location}</p>}

                  <p>
                    {experience.start_date} -{" "}
                    {experience.currently_working
                      ? "Present"
                      : experience.end_date}
                  </p>

                  {experience.description && (
                    <p>{experience.description}</p>
                  )}

                  <div className="experience-actions">
                    <button
                      type="button"
                      className="button button-primary"
                      onClick={() => handleEdit(experience)}
                    >
                      Edit
                    </button>

                    <button
                      type="button"
                      className="button button-danger"
                      onClick={() => handleDelete(experience.id)}
                    >
                      Delete
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </section>
  );
}

export default WorkExperience;
