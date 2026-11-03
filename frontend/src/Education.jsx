
import { useState, useEffect } from "react";
import "./Education.css";

function Education() {
  const [educations, setEducations] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [message, setMessage] = useState("");
  const [errorMessage, setErrorMessage] = useState("");

  const [formData, setFormData] = useState({
    degree: "",
    institution: "",
    field_of_study: "",
    start_year: "",
    graduation_year: "",
    grade: "",
  });

  const handleChange = (event) => {
    const { name, value } = event.target;

    setFormData((previousData) => ({
      ...previousData,
      [name]: value,
    }));
  };
  const handleEdit = (education) => {
  setEditingId(education.id);

  setFormData({
    degree: education.degree,
    institution: education.institution,
    field_of_study: education.field_of_study || "",
    start_year: String(education.start_year),
    graduation_year: String(education.graduation_year),
    grade: education.grade || "",
  });

  setMessage("");
  setErrorMessage("");

  window.scrollTo({ top: 0, behavior: "smooth" });
};

const handleCancelEdit = () => {
  setEditingId(null);

  setFormData({
    degree: "",
    institution: "",
    field_of_study: "",
    start_year: "",
    graduation_year: "",
    grade: "",
  });

  setMessage("");
  setErrorMessage("");
};
const handleDelete = async (educationId) => {
  const confirmDelete = window.confirm(
    "Are you sure you want to delete this education record?"
  );

  if (!confirmDelete) {
    return;
  }

  const accessToken = sessionStorage.getItem("accessToken");

  if (!accessToken) {
    setErrorMessage("Please log in before deleting education.");
    return;
  }

  setMessage("");
  setErrorMessage("");

  try {
    const response = await fetch(
      `http://127.0.0.1:8000/api/education/${educationId}/`,
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

    setEducations((previousEducations) =>
      previousEducations.filter((item) => item.id !== educationId)
    );

    if (editingId === educationId) {
      handleCancelEdit();
    }

    setMessage("Education record deleted successfully!");
  } catch (error) {
    setErrorMessage(error.message);
  }
};

  // Load saved education records.
  useEffect(() => {
    const loadEducations = async () => {
      const accessToken = sessionStorage.getItem("accessToken");

      if (!accessToken) {
        setErrorMessage("Please log in to manage your education.");
        setIsLoading(false);
        return;
      }

      try {
        const response = await fetch(
          "http://127.0.0.1:8000/api/education/",
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
            "Could not load education records."
          );
        }

        setEducations(data);
      } catch (error) {
        setErrorMessage(error.message);
      } finally {
        setIsLoading(false);
      }
    };

    loadEducations();
  }, []);

  // Save education details.
  const handleSubmit = async (event) => {
    event.preventDefault();

    setMessage("");
    setErrorMessage("");

    const accessToken = sessionStorage.getItem("accessToken");

    if (!accessToken) {
      setErrorMessage("Please log in before saving education.");
      return;
    }

    if (!formData.institution.trim()) {
      setErrorMessage("Please enter your institution name.");
      return;
    }

    if (
      Number(formData.start_year) >
      Number(formData.graduation_year)
    ) {
      setErrorMessage("Graduation year cannot be earlier than start year.");
      return;
    }

    setIsSaving(true);

    try {
      const payload = {
        degree: formData.degree.trim(),
        institution: formData.institution.trim(),
        field_of_study: formData.field_of_study.trim(),
        start_year: Number(formData.start_year),
        graduation_year: Number(formData.graduation_year),
        grade: formData.grade.trim(),
      };

      console.log("Education data being submitted:", payload);

      const url = editingId
  ? `http://127.0.0.1:8000/api/education/${editingId}/`
  : "http://127.0.0.1:8000/api/education/";

const response = await fetch(url, {
  method: editingId ? "PUT" : "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${accessToken}`,
          },
          body: JSON.stringify(payload),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(JSON.stringify(data));
      }

      if (editingId) {
  setEducations((previousEducations) =>
    previousEducations.map((item) =>
      item.id === editingId ? data : item
    )
  );

  setMessage("Education details updated successfully!");
  setEditingId(null);
} else {
  setEducations((previousEducations) => [data, ...previousEducations]);

  setMessage("Education details saved successfully!");
}

      setFormData({
        degree: "",
        institution: "",
        field_of_study: "",
        start_year: "",
        graduation_year: "",
        grade: "",
      });

      setMessage("Education details saved successfully!");
    } catch (error) {
      setErrorMessage(error.message);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <section className="education-section">
      <div className="education-container">
        <div className="education-header">
          <h2>Education</h2>
          <p>Add your academic qualifications.</p>
        </div>

        {message && (
          <p className="form-message form-success">{message}</p>
        )}

        {errorMessage && (
          <p className="form-message form-error">{errorMessage}</p>
        )}

        <div className="education-card">
          <h3>{editingId ? "Edit Education" : "Add Education"}</h3>

          <form className="education-form" onSubmit={handleSubmit}>
            <div className="education-field">
              <label>Degree</label>
              <input
                type="text"
                name="degree"
                value={formData.degree}
                onChange={handleChange}
                placeholder="Example: MCA"
                required
              />
            </div>

            <div className="education-field">
              <label>Institution</label>
              <input
                type="text"
                name="institution"
                value={formData.institution}
                onChange={handleChange}
                placeholder="Enter college or university name"
                required
              />
            </div>

            <div className="education-field">
              <label>Field of Study</label>
              <input
                type="text"
                name="field_of_study"
                value={formData.field_of_study}
                onChange={handleChange}
                placeholder="Example: Computer Applications"
              />
            </div>

            <div className="education-row">
              <div className="education-field">
                <label>Start Year</label>
                <input
                  type="number"
                  name="start_year"
                  value={formData.start_year}
                  onChange={handleChange}
                  placeholder="2024"
                  required
                />
              </div>

              <div className="education-field">
                <label>Graduation Year</label>
                <input
                  type="number"
                  name="graduation_year"
                  value={formData.graduation_year}
                  onChange={handleChange}
                  placeholder="2026"
                  required
                />
              </div>
            </div>

            <div className="education-field">
              <label>Grade / Percentage / CGPA</label>
              <input
                type="text"
                name="grade"
                value={formData.grade}
                onChange={handleChange}
                placeholder="Example: 8.5 CGPA"
              />
            </div>

            <button type="submit" className="button button-primary" disabled={isSaving}>
  {isSaving ? "Saving..." : editingId ? "Update Education" : "Add Education"}
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

        <div className="education-card">
          <h3>My Education</h3>

          {isLoading ? (
            <p>Loading education records...</p>
          ) : educations.length === 0 ? (
            <p>No education records added yet.</p>
          ) : (
            <div className="education-list">
              {educations.map((education) => (
                <div className="education-item" key={education.id}>
                  <h4>{education.degree}</h4>
                  <p>{education.institution}</p>

                  {education.field_of_study && (
                    <p>{education.field_of_study}</p>
                  )}

                  <p>
                    {education.start_year} - {education.graduation_year}
                  </p>

                  {education.grade && <p>{education.grade}</p>}

                  <div className="education-actions">
  <button
    type="button"
    className="button button-primary"
    onClick={() => handleEdit(education)}
  >
    Edit
  </button>

  <button
    type="button"
    className="button button-danger"
    onClick={() => handleDelete(education.id)}
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

export default Education;
