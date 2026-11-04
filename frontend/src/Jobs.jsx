
import { useCallback, useEffect, useState } from "react";
import "./Jobs.css";

const API_URL = "http://127.0.0.1:8000/api";

const emptyForm = {
  title: "",
  company_name: "",
  description: "",
  requirements: "",
  location: "",
  job_type: "FULL_TIME",
  salary_min: "",
  salary_max: "",
  status: "DRAFT",
};

function Jobs() {
  const [user, setUser] = useState(null);
  const [jobs, setJobs] = useState([]);
  const [form, setForm] = useState(emptyForm);
  const [editingJobId, setEditingJobId] = useState(null);

  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  const [message, setMessage] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const [applyingJobId, setApplyingJobId] = useState(null);
const [appliedJobIds, setAppliedJobIds] = useState([]);

  const token = sessionStorage.getItem("accessToken");

  const fetchJobs = useCallback(async () => {
    const response = await fetch(`${API_URL}/jobs/`, {
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.detail || "Unable to load jobs.");
    }

    setJobs(data);
  }, [token]);

  useEffect(() => {
    const loadPage = async () => {
      if (!token) {
        setErrorMessage("Please log in to view jobs.");
        setIsLoading(false);
        return;
      }

      try {
        const profileResponse = await fetch(`${API_URL}/auth/me/`, {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        });

        const profileData = await profileResponse.json();

        if (!profileResponse.ok) {
          throw new Error(
            "Unable to load your account information."
          );
        }

        setUser(profileData);
        await fetchJobs();
      } catch (error) {
        setErrorMessage(error.message);
      } finally {
        setIsLoading(false);
      }
    };

    loadPage();
  }, [token, fetchJobs]);

  const handleChange = (event) => {
    const { name, value } = event.target;

    setForm((previousForm) => ({
      ...previousForm,
      [name]: value,
    }));
  };

  const resetForm = () => {
    setForm(emptyForm);
    setEditingJobId(null);
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    setMessage("");
    setErrorMessage("");

    if (!user || !["RECRUITER", "ADMIN"].includes(user.role)) {
      setErrorMessage(
        "You do not have permission to manage jobs."
      );
      return;
    }

    const payload = {
      ...form,
      salary_min:
        form.salary_min === "" ? null : Number(form.salary_min),
      salary_max:
        form.salary_max === "" ? null : Number(form.salary_max),
    };

    setIsSaving(true);

    try {
      const url = editingJobId
        ? `${API_URL}/jobs/${editingJobId}/`
        : `${API_URL}/jobs/`;

      const response = await fetch(url, {
        method: editingJobId ? "PUT" : "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          typeof data === "object"
            ? Object.values(data).flat().join(" ")
            : "Unable to save job."
        );
      }

      setMessage(
        editingJobId
          ? "Job updated successfully."
          : "Job created successfully."
      );

      resetForm();
      await fetchJobs();
    } catch (error) {
      setErrorMessage(error.message);
    } finally {
      setIsSaving(false);
    }
  };

  const handleEdit = (job) => {
    setForm({
      title: job.title || "",
      company_name: job.company_name || "",
      description: job.description || "",
      requirements: job.requirements || "",
      location: job.location || "",
      job_type: job.job_type || "FULL_TIME",
      salary_min: job.salary_min ?? "",
      salary_max: job.salary_max ?? "",
      status: job.status || "DRAFT",
    });

    setEditingJobId(job.id);
    setMessage("");
    setErrorMessage("");

    window.scrollTo({
      top: 0,
      behavior: "smooth",
    });
  };

  const handleDelete = async (jobId) => {
    const confirmed = window.confirm(
      "Are you sure you want to delete this job?"
    );

    if (!confirmed) {
      return;
    }

    setMessage("");
    setErrorMessage("");

    try {
      const response = await fetch(
        `${API_URL}/jobs/${jobId}/`,
        {
          method: "DELETE",
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.detail || "Unable to delete job."
        );
      }

      setMessage("Job deleted successfully.");

      if (editingJobId === jobId) {
        resetForm();
      }

      await fetchJobs();
    } catch (error) {
      setErrorMessage(error.message);
    }
  };

  const handleApply = async (jobId) => {
  setMessage("");
  setErrorMessage("");
  setApplyingJobId(jobId);

  try {
    const response = await fetch(`${API_URL}/applications/`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ job: jobId }),
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(
        data.detail || "Unable to apply for this job."
      );
    }

    setAppliedJobIds((previous) => [...previous, jobId]);
    setMessage("Your application was submitted successfully.");
  } catch (error) {
    setErrorMessage(error.message);
  } finally {
    setApplyingJobId(null);
  }
};

  const handleStatusChange = async (job, newStatus) => {
    setMessage("");
    setErrorMessage("");

    try {
      const response = await fetch(
        `${API_URL}/jobs/${job.id}/`,
        {
          method: "PATCH",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            status: newStatus,
          }),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.detail || "Unable to update job status."
        );
      }

      setMessage(
        `Job status changed to ${newStatus.toLowerCase()}.`
      );

      await fetchJobs();
    } catch (error) {
      setErrorMessage(error.message);
    }
  };

  const canManageJob = (job) => {
    return (
      user?.role === "ADMIN" ||
      (user?.role === "RECRUITER" &&
        job.recruiter === user.id)
    );
  };

  const formatSalary = (job) => {
    if (
      job.salary_min === null &&
      job.salary_max === null
    ) {
      return "Salary not specified";
    }

    const minimum =
      job.salary_min !== null
        ? `₹${Number(job.salary_min).toLocaleString("en-IN")}`
        : null;

    const maximum =
      job.salary_max !== null
        ? `₹${Number(job.salary_max).toLocaleString("en-IN")}`
        : null;

    if (minimum && maximum) {
      return `${minimum} - ${maximum}`;
    }

    return minimum || maximum;
  };

  const formatJobType = (jobType) => {
    const labels = {
      FULL_TIME: "Full-time",
      PART_TIME: "Part-time",
      INTERNSHIP: "Internship",
      CONTRACT: "Contract",
      REMOTE: "Remote",
    };

    return labels[jobType] || jobType;
  };

  if (isLoading) {
    return (
      <section className="jobs-section">
        <div className="jobs-container">
          <p>Loading jobs...</p>
        </div>
      </section>
    );
  }

  return (
    <section className="jobs-section">
      <div className="jobs-container">
        <div className="jobs-header">
          <span className="eyebrow">CAREERHUB</span>
          <h1>Job Management</h1>
          <p>
            Create, manage, and explore job opportunities.
          </p>
        </div>

        {message && (
          <div className="success-message">
            {message}
          </div>
        )}

        {errorMessage && (
          <div className="error-message">
            {errorMessage}
          </div>
        )}

        {user &&
          ["RECRUITER", "ADMIN"].includes(user.role) && (
            <div className="job-form-card">
              <h2>
                {editingJobId ? "Edit Job" : "Create a New Job"}
              </h2>

              <form onSubmit={handleSubmit}>
                <div className="form-grid">
                  <div className="form-group">
                    <label htmlFor="title">Job Title</label>
                    <input
                      id="title"
                      name="title"
                      type="text"
                      value={form.title}
                      onChange={handleChange}
                      placeholder="Example: Software Developer"
                      required
                    />
                  </div>

                  <div className="form-group">
                    <label htmlFor="company_name">
                      Company Name
                    </label>
                    <input
                      id="company_name"
                      name="company_name"
                      type="text"
                      value={form.company_name}
                      onChange={handleChange}
                      placeholder="Enter company name"
                      required
                    />
                  </div>

                  <div className="form-group">
                    <label htmlFor="location">Location</label>
                    <input
                      id="location"
                      name="location"
                      type="text"
                      value={form.location}
                      onChange={handleChange}
                      placeholder="Example: Pune or Remote"
                      required
                    />
                  </div>

                  <div className="form-group">
                    <label htmlFor="job_type">Job Type</label>
                    <select
                      id="job_type"
                      name="job_type"
                      value={form.job_type}
                      onChange={handleChange}
                      required
                    >
                      <option value="FULL_TIME">Full-time</option>
                      <option value="PART_TIME">Part-time</option>
                      <option value="INTERNSHIP">Internship</option>
                      <option value="CONTRACT">Contract</option>
                      <option value="REMOTE">Remote</option>
                    </select>
                  </div>

                  <div className="form-group">
                    <label htmlFor="salary_min">
                      Minimum Salary (₹)
                    </label>
                    <input
                      id="salary_min"
                      name="salary_min"
                      type="number"
                      min="0"
                      value={form.salary_min}
                      onChange={handleChange}
                      placeholder="Example: 300000"
                    />
                  </div>

                  <div className="form-group">
                    <label htmlFor="salary_max">
                      Maximum Salary (₹)
                    </label>
                    <input
                      id="salary_max"
                      name="salary_max"
                      type="number"
                      min="0"
                      value={form.salary_max}
                      onChange={handleChange}
                      placeholder="Example: 600000"
                    />
                  </div>

                  <div className="form-group">
                    <label htmlFor="status">Job Status</label>
                    <select
                      id="status"
                      name="status"
                      value={form.status}
                      onChange={handleChange}
                      required
                    >
                      <option value="DRAFT">Draft</option>
                      <option value="PUBLISHED">Published</option>
                      <option value="CLOSED">Closed</option>
                    </select>
                  </div>
                </div>

                <div className="form-group">
                  <label htmlFor="description">
                    Job Description
                  </label>
                  <textarea
                    id="description"
                    name="description"
                    value={form.description}
                    onChange={handleChange}
                    placeholder="Describe the job role and responsibilities..."
                    rows="5"
                    required
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="requirements">
                    Job Requirements
                  </label>
                  <textarea
                    id="requirements"
                    name="requirements"
                    value={form.requirements}
                    onChange={handleChange}
                    placeholder="List the skills, qualifications, and experience required..."
                    rows="5"
                    required
                  />
                </div>

                <div className="form-actions">
                  <button
                    className="button button-primary"
                    type="submit"
                    disabled={isSaving}
                  >
                    {isSaving
                      ? "Saving..."
                      : editingJobId
                        ? "Update Job"
                        : "Create Job"}
                  </button>

                  {editingJobId && (
                    <button
                      className="button button-outline"
                      type="button"
                      onClick={resetForm}
                    >
                      Cancel Editing
                    </button>
                  )}
                </div>
              </form>
            </div>
          )}

        <div className="jobs-list-header">
          <div>
            <h2>
              {user?.role === "CANDIDATE"
                ? "Available Jobs"
                : "Job Listings"}
            </h2>
            <p>
              {jobs.length}{" "}
              {jobs.length === 1 ? "job" : "jobs"} found
            </p>
          </div>
        </div>

        {jobs.length === 0 ? (
          <div className="empty-jobs">
            <h3>No jobs found</h3>
            <p>
              There are currently no jobs available to display.
            </p>
          </div>
        ) : (
          <div className="managed-jobs-grid">
            {jobs.map((job) => (
              <article className="managed-job-card" key={job.id}>
                <div className="managed-job-top">
                  <div>
                    <span className="job-company">
                      {job.company_name}
                    </span>
                    <h3>{job.title}</h3>
                  </div>

                  <span
                    className={`job-status status-${job.status.toLowerCase()}`}
                  >
                    {job.status}
                  </span>
                </div>

                <div className="job-details">
                  <span>{job.location}</span>
                  <span>{formatJobType(job.job_type)}</span>
                  <span>{formatSalary(job)}</span>
                </div>

                <div className="job-description">
                  <h4>Description</h4>
                  <p>{job.description}</p>

                  <h4>Requirements</h4>
                  <p>{job.requirements}</p>
                </div>

                <div className="job-card-footer">
                  <span className="job-recruiter">
                    Posted by: {job.recruiter_name}
                  </span>

                  {user.role === "CANDIDATE" && job.status === "PUBLISHED" && (
  <div className="job-actions">
    <button
      className="button button-primary"
      type="button"
      onClick={() => handleApply(job.id)}
      disabled={
        applyingJobId === job.id ||
        appliedJobIds.includes(job.id)
      }
    >
      {applyingJobId === job.id
        ? "Applying..."
        : appliedJobIds.includes(job.id)
          ? "Applied"
          : "Apply Now"}
    </button>
  </div>
)}

                  {canManageJob(job) && (
                    <div className="job-actions">
                      <button
                        className="button button-outline"
                        type="button"
                        onClick={() => handleEdit(job)}
                      >
                        Edit
                      </button>

                      {job.status !== "PUBLISHED" && (
                        <button
                          className="button button-primary"
                          type="button"
                          onClick={() =>
                            handleStatusChange(
                              job,
                              "PUBLISHED"
                            )
                          }
                        >
                          Publish
                        </button>
                      )}

                      {job.status === "PUBLISHED" && (
                        <button
                          className="button button-outline"
                          type="button"
                          onClick={() =>
                            handleStatusChange(job, "CLOSED")
                          }
                        >
                          Close Job
                        </button>
                      )}

                      <button
                        className="button button-danger"
                        type="button"
                        onClick={() => handleDelete(job.id)}
                      >
                        Delete
                      </button>
                    </div>
                  )}
                </div>
              </article>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}

export default Jobs;
