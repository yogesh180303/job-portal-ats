
import { useState, useEffect } from "react";
import "./Skills.css";

function Skills() {
  const [skills, setSkills] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [message, setMessage] = useState("");
  const [errorMessage, setErrorMessage] = useState("");

  const [formData, setFormData] = useState({
    name: "",
    proficiency: "BEGINNER",
  });

  const handleChange = (event) => {
    const { name, value } = event.target;

    setFormData((previousData) => ({
      ...previousData,
      [name]: value,
    }));
  };

  const resetForm = () => {
    setEditingId(null);
    setFormData({
      name: "",
      proficiency: "BEGINNER",
    });
  };

  const handleEdit = (skill) => {
    setEditingId(skill.id);
    setFormData({
      name: skill.name,
      proficiency: skill.proficiency,
    });

    setMessage("");
    setErrorMessage("");
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleCancelEdit = () => {
    resetForm();
    setMessage("");
    setErrorMessage("");
  };

  const handleDelete = async (skillId) => {
    const confirmDelete = window.confirm(
      "Are you sure you want to delete this skill?"
    );

    if (!confirmDelete) return;

    const accessToken = sessionStorage.getItem("accessToken");

    if (!accessToken) {
      setErrorMessage("Please log in before deleting skills.");
      return;
    }

    setMessage("");
    setErrorMessage("");

    try {
      const response = await fetch(
        `http://127.0.0.1:8000/api/skills/${skillId}/`,
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

      setSkills((previousSkills) =>
        previousSkills.filter((item) => item.id !== skillId)
      );

      if (editingId === skillId) {
        resetForm();
      }

      setMessage("Skill deleted successfully!");
    } catch (error) {
      setErrorMessage(error.message);
    }
  };

  useEffect(() => {
    const loadSkills = async () => {
      const accessToken = sessionStorage.getItem("accessToken");

      if (!accessToken) {
        setErrorMessage("Please log in to manage your skills.");
        setIsLoading(false);
        return;
      }

      try {
        const response = await fetch(
          "http://127.0.0.1:8000/api/skills/",
          {
            headers: {
              Authorization: `Bearer ${accessToken}`,
            },
          }
        );

        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.detail || JSON.stringify(data));
        }

        setSkills(data);
      } catch (error) {
        setErrorMessage(error.message);
      } finally {
        setIsLoading(false);
      }
    };

    loadSkills();
  }, []);

  const handleSubmit = async (event) => {
    event.preventDefault();

    setMessage("");
    setErrorMessage("");

    const accessToken = sessionStorage.getItem("accessToken");

    if (!accessToken) {
      setErrorMessage("Please log in before saving skills.");
      return;
    }

    if (!formData.name.trim()) {
      setErrorMessage("Please enter a skill name.");
      return;
    }

    setIsSaving(true);

    try {
      const payload = {
        name: formData.name.trim(),
        proficiency: formData.proficiency,
      };

      const url = editingId
        ? `http://127.0.0.1:8000/api/skills/${editingId}/`
        : "http://127.0.0.1:8000/api/skills/";

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
        setSkills((previousSkills) =>
          previousSkills.map((item) =>
            item.id === editingId ? data : item
          )
        );

        setMessage("Skill updated successfully!");
      } else {
        setSkills((previousSkills) => [...previousSkills, data]);
        setMessage("Skill added successfully!");
      }

      resetForm();
    } catch (error) {
      setErrorMessage(error.message);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <section className="skills-section">
      <div className="skills-container">
        <div className="skills-header">
          <h2>Skills</h2>
          <p>Add your professional and technical skills.</p>
        </div>

        {message && (
          <p className="form-message form-success">{message}</p>
        )}

        {errorMessage && (
          <p className="form-message form-error">{errorMessage}</p>
        )}

        <div className="skills-card">
          <h3>{editingId ? "Edit Skill" : "Add Skill"}</h3>

          <form className="skills-form" onSubmit={handleSubmit}>
            <div className="skills-field">
              <label>Skill Name</label>
              <input
                type="text"
                name="name"
                value={formData.name}
                onChange={handleChange}
                placeholder="Example: Python, React, SQL"
                maxLength={100}
                required
              />
            </div>

            <div className="skills-field">
              <label>Proficiency Level</label>
              <select
                name="proficiency"
                value={formData.proficiency}
                onChange={handleChange}
                required
              >
                <option value="BEGINNER">Beginner</option>
                <option value="INTERMEDIATE">Intermediate</option>
                <option value="ADVANCED">Advanced</option>
                <option value="EXPERT">Expert</option>
              </select>
            </div>

            <button
              type="submit"
              className="button button-primary"
              disabled={isSaving}
            >
              {isSaving
                ? "Saving..."
                : editingId
                  ? "Update Skill"
                  : "Add Skill"}
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

        <div className="skills-card">
          <h3>My Skills</h3>

          {isLoading ? (
            <p>Loading skills...</p>
          ) : skills.length === 0 ? (
            <p>No skills added yet.</p>
          ) : (
            <div className="skills-list">
              {skills.map((skill) => (
                <div className="skills-item" key={skill.id}>
                  <div>
                    <h4>{skill.name}</h4>
                    <p>
                      {skill.proficiency.charAt(0) +
                        skill.proficiency.slice(1).toLowerCase()}
                    </p>
                  </div>

                  <div className="skills-actions">
                    <button
                      type="button"
                      className="button button-primary"
                      onClick={() => handleEdit(skill)}
                    >
                      Edit
                    </button>

                    <button
                      type="button"
                      className="button button-danger"
                      onClick={() => handleDelete(skill.id)}
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

export default Skills;
