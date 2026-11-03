
import { useState, useEffect } from "react";
import "./Resumes.css";

function Resumes() {
  const [resumes, setResumes] = useState([]);
  const [title, setTitle] = useState("");
  const [selectedFile, setSelectedFile] = useState(null);
  const [isPrimary, setIsPrimary] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isUploading, setIsUploading] = useState(false);
  const [message, setMessage] = useState("");
  const [errorMessage, setErrorMessage] = useState("");

  const API_URL = "http://127.0.0.1:8000/api/resumes/";

  const getToken = () => sessionStorage.getItem("accessToken");

  // Load existing resumes when the page opens
  useEffect(() => {
    const fetchResumes = async () => {
      const token = getToken();

      if (!token) {
        setErrorMessage("Please log in to manage your resumes.");
        setIsLoading(false);
        return;
      }

      try {
        const response = await fetch(API_URL, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.detail || JSON.stringify(data));
        }

        setResumes(data);
      } catch (error) {
        setErrorMessage(error.message);
      } finally {
        setIsLoading(false);
      }
    };

    fetchResumes();
  }, []);

  // Validate selected resume file
  const handleFileChange = (event) => {
    const file = event.target.files[0];

    setErrorMessage("");
    setMessage("");

    if (!file) {
      setSelectedFile(null);
      return;
    }

    const allowedExtensions = [".pdf", ".docx"];
    const fileName = file.name.toLowerCase();

    const isAllowed = allowedExtensions.some((extension) =>
      fileName.endsWith(extension)
    );

    if (!isAllowed) {
      setSelectedFile(null);
      event.target.value = "";
      setErrorMessage("Only PDF and DOCX files are allowed.");
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      setSelectedFile(null);
      event.target.value = "";
      setErrorMessage("File size must not exceed 5 MB.");
      return;
    }

    setSelectedFile(file);
  };

  // Upload a new resume
  const handleUpload = async (event) => {
    event.preventDefault();

    setMessage("");
    setErrorMessage("");

    const token = getToken();

    if (!token) {
      setErrorMessage("Please log in before uploading a resume.");
      return;
    }

    if (!title.trim()) {
      setErrorMessage("Please enter a resume title.");
      return;
    }

    if (!selectedFile) {
      setErrorMessage("Please select a PDF or DOCX file.");
      return;
    }

    const formData = new FormData();

    formData.append("title", title.trim());
    formData.append("file", selectedFile);
    formData.append("is_primary", String(isPrimary));

    setIsUploading(true);

    try {
      const response = await fetch(API_URL, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
        },
        body: formData,
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(JSON.stringify(data));
      }

      setResumes((previousResumes) => [
        data,
        ...previousResumes.map((resume) => ({
          ...resume,
          is_primary: isPrimary ? false : resume.is_primary,
        })),
      ]);

      setTitle("");
      setSelectedFile(null);
      setIsPrimary(false);
      event.target.reset();

      setMessage("Resume uploaded successfully!");
    } catch (error) {
      setErrorMessage(error.message);
    } finally {
      setIsUploading(false);
    }
  };

  // Delete a resume
  const handleDelete = async (resumeId) => {
    const confirmDelete = window.confirm(
      "Are you sure you want to delete this resume?"
    );

    if (!confirmDelete) {
      return;
    }

    const token = getToken();

    if (!token) {
      setErrorMessage("Please log in before deleting a resume.");
      return;
    }

    setMessage("");
    setErrorMessage("");

    try {
      const response = await fetch(`${API_URL}${resumeId}/`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.detail || JSON.stringify(data));
      }

      setResumes((previousResumes) =>
        previousResumes.filter((resume) => resume.id !== resumeId)
      );

      setMessage("Resume deleted successfully!");
    } catch (error) {
      setErrorMessage(error.message);
    }
  };

  return (
    <section className="resumes-section">
      <div className="resumes-container">

        <div className="resumes-header">
          <h2>My Resumes</h2>
          <p>Upload and manage your professional resumes.</p>
        </div>

        {message && (
          <p className="resume-message resume-success">{message}</p>
        )}

        {errorMessage && (
          <p className="resume-message resume-error">{errorMessage}</p>
        )}

        {/* Upload Resume Form */}
        <div className="resumes-card">
          <h3>Upload New Resume</h3>

          <form className="resumes-form" onSubmit={handleUpload}>

            <div className="resumes-field">
              <label htmlFor="resume-title">Resume Title</label>

              <input
                id="resume-title"
                type="text"
                value={title}
                onChange={(event) => setTitle(event.target.value)}
                placeholder="Example: Software Developer Resume"
                maxLength={200}
                required
              />
            </div>

            <div className="resumes-field">
              <label htmlFor="resume-file">Resume File</label>

              <input
                id="resume-file"
                type="file"
                accept=".pdf,.docx"
                onChange={handleFileChange}
                required
              />

              <small>
                Accepted formats: PDF, DOCX. Maximum size: 5 MB.
              </small>

              {selectedFile && (
                <small>Selected: {selectedFile.name}</small>
              )}
            </div>

            <label className="resume-primary-option">
              <input
                type="checkbox"
                checked={isPrimary}
                onChange={(event) => setIsPrimary(event.target.checked)}
              />

              Set as my primary resume
            </label>

            <button
              type="submit"
              className="button button-primary"
              disabled={isUploading}
            >
              {isUploading ? "Uploading..." : "Upload Resume"}
            </button>

          </form>
        </div>

        {/* Uploaded Resumes List */}
        <div className="resumes-card">
          <h3>Uploaded Resumes</h3>

          {isLoading ? (
            <p>Loading resumes...</p>
          ) : resumes.length === 0 ? (
            <p>No resumes uploaded yet.</p>
          ) : (
            <div className="resumes-list">

              {resumes.map((resume) => (
                <div className="resume-item" key={resume.id}>

                  <div className="resume-info">
                    <h4>{resume.title}</h4>

                    {resume.is_primary && (
                      <span className="primary-badge">
                        Primary Resume
                      </span>
                    )}

                    <p>
                      Uploaded:{" "}
                      {new Date(resume.created_at).toLocaleDateString()}
                    </p>
                  </div>

                  <div className="resume-actions">
                    <a
                      href={resume.file}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="button button-primary"
                    >
                      View / Download
                    </a>

                    <button
                      type="button"
                      className="button button-danger"
                      onClick={() => handleDelete(resume.id)}
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

export default Resumes;
