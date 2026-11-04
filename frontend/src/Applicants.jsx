
import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import "./Applicants.css";

const API_URL = "http://127.0.0.1:8000/api";

const statusOptions = [
  { value: "APPLIED", label: "Applied" },
  { value: "UNDER_REVIEW", label: "Under Review" },
  { value: "SHORTLISTED", label: "Shortlisted" },
  { value: "INTERVIEW", label: "Interview" },
  { value: "SELECTED", label: "Selected" },
  { value: "REJECTED", label: "Rejected" },
];

const atsScoreOptions = [
  { value: "ALL", label: "All Scores" },
  { value: "80-100", label: "80% - 100%" },
  { value: "60-79", label: "60% - 79%" },
  { value: "40-59", label: "40% - 59%" },
  { value: "0-39", label: "Below 40%" },
];

const skillOptions = [
  { value: "ALL", label: "All Skills" },
  { value: "Python", label: "Python" },
  { value: "Java", label: "Java" },
  { value: "Django", label: "Django" },
  { value: "React", label: "React" },
];

function Applicants() {
  const [applicants, setApplicants] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [updatingId, setUpdatingId] = useState(null);

  // Application filters
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [atsScoreFilter, setAtsScoreFilter] = useState("ALL");
  const [skillFilter, setSkillFilter] = useState("ALL");
  const [searchQuery, setSearchQuery] = useState("");

  // Phase 10: Applicant sorting
  const [sortOption, setSortOption] = useState("NEWEST");

  // Timeline states
  const [expandedTimelineId, setExpandedTimelineId] = useState(null);
  const [timelines, setTimelines] = useState({});
  const [timelineLoadingId, setTimelineLoadingId] = useState(null);
  const [timelineErrors, setTimelineErrors] = useState({});

  // ATS evaluation states
  const [atsResults, setAtsResults] = useState({});
  const [expandedAtsId, setExpandedAtsId] = useState(null);
  const [atsLoadingId, setAtsLoadingId] = useState(null);
  const [atsErrors, setAtsErrors] = useState({});

  const token = sessionStorage.getItem("accessToken");

  // Fetch applicants and their ATS evaluations
  const fetchApplicants = async () => {
    try {
      setLoading(true);
      setError("");

      const queryParams =
        statusFilter === "ALL"
          ? ""
          : `?status=${encodeURIComponent(statusFilter)}`;

      const response = await fetch(
        `${API_URL}/applications/${queryParams}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.detail || "Failed to load applicants.");
      }

      setApplicants(data);

      // Fetch ATS evaluation for each applicant
      const scoreResults = await Promise.all(
        data.map(async (applicant) => {
          try {
            const atsResponse = await fetch(
              `${API_URL}/applications/${applicant.id}/ats-evaluation/`,
              {
                headers: {
                  Authorization: `Bearer ${token}`,
                  "Content-Type": "application/json",
                },
              }
            );

            if (!atsResponse.ok) {
              return null;
            }

            const atsData = await atsResponse.json();

            return {
              applicationId: applicant.id,
              result: atsData,
            };
          } catch {
            return null;
          }
        })
      );

      const validResults = scoreResults.filter(Boolean);

      setAtsResults((previous) => ({
        ...previous,
        ...Object.fromEntries(
          validResults.map((item) => [
            item.applicationId,
            item.result,
          ])
        ),
      }));
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // Load applicants when status filter changes
  useEffect(() => {
    if (!token) {
      setError("Please log in to manage applicants.");
      setLoading(false);
      return;
    }

    fetchApplicants();
  }, [statusFilter]);

  // Update application status
  const handleStatusChange = async (applicationId, newStatus) => {
    setUpdatingId(applicationId);
    setError("");
    setMessage("");

    try {
      const response = await fetch(
        `${API_URL}/applications/${applicationId}/`,
        {
          method: "PATCH",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ status: newStatus }),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.detail || "Failed to update application status."
        );
      }

      setApplicants((previous) =>
        previous.map((applicant) =>
          applicant.id === applicationId
            ? { ...applicant, status: data.status }
            : applicant
        )
      );

      setMessage("Application status updated successfully.");

      if (expandedTimelineId === applicationId) {
        await handleViewTimeline(applicationId, true);
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setUpdatingId(null);
    }
  };

  // View application timeline
  const handleViewTimeline = async (
    applicationId,
    forceRefresh = false
  ) => {
    if (
      expandedTimelineId === applicationId &&
      !forceRefresh
    ) {
      setExpandedTimelineId(null);
      return;
    }

    setExpandedTimelineId(applicationId);

    setTimelineErrors((previous) => ({
      ...previous,
      [applicationId]: "",
    }));

    if (timelines[applicationId] && !forceRefresh) {
      return;
    }

    setTimelineLoadingId(applicationId);

    try {
      const response = await fetch(
        `${API_URL}/applications/${applicationId}/timeline/`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.detail || "Failed to load application timeline."
        );
      }

      setTimelines((previous) => ({
        ...previous,
        [applicationId]: data,
      }));
    } catch (err) {
      setTimelineErrors((previous) => ({
        ...previous,
        [applicationId]: err.message,
      }));
    } finally {
      setTimelineLoadingId(null);
    }
  };

  // Evaluate candidate resume
  const handleEvaluateResume = async (applicationId) => {
    if (
      expandedAtsId === applicationId &&
      atsResults[applicationId]
    ) {
      setExpandedAtsId(null);
      return;
    }

    setExpandedAtsId(applicationId);

    setAtsErrors((previous) => ({
      ...previous,
      [applicationId]: "",
    }));

    if (atsResults[applicationId]) {
      return;
    }

    setAtsLoadingId(applicationId);

    try {
      const response = await fetch(
        `${API_URL}/applications/${applicationId}/ats-evaluation/`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.detail ||
            "Failed to evaluate the candidate's resume."
        );
      }

      setAtsResults((previous) => ({
        ...previous,
        [applicationId]: data,
      }));
    } catch (err) {
      setAtsErrors((previous) => ({
        ...previous,
        [applicationId]: err.message,
      }));
    } finally {
      setAtsLoadingId(null);
    }
  };

  // Format date and time
  const formatDateTime = (date) => {
    return new Date(date).toLocaleString();
  };

  // Apply search and filters
  const filteredApplicants = applicants.filter((applicant) => {
    // Candidate name and email search
    if (searchQuery.trim() !== "") {
      const query = searchQuery.trim().toLowerCase();

      const candidateName = (
        applicant.candidate_name || ""
      ).toLowerCase();

      const candidateEmail = (
        applicant.candidate_email || ""
      ).toLowerCase();

      if (
        !candidateName.includes(query) &&
        !candidateEmail.includes(query)
      ) {
        return false;
      }
    }

    const evaluation = atsResults[applicant.id]?.evaluation;

    // ATS score filter
    if (atsScoreFilter !== "ALL") {
      const score = evaluation?.ats_score;

      if (score === undefined || score === null) {
        return false;
      }

      const [minimum, maximum] = atsScoreFilter
        .split("-")
        .map(Number);

      if (score < minimum || score > maximum) {
        return false;
      }
    }

    // Candidate skills filter
    if (skillFilter !== "ALL") {
      const candidateSkills = evaluation?.resume_skills || [];

      const hasSkill = candidateSkills.some(
        (skill) =>
          skill.toLowerCase() === skillFilter.toLowerCase()
      );

      if (!hasSkill) {
        return false;
      }
    }

    return true;
  });

  // Phase 10: Sort applicants after applying filters
  const sortedApplicants = [...filteredApplicants].sort((a, b) => {
    if (
      sortOption === "HIGHEST_SCORE" ||
      sortOption === "LOWEST_SCORE"
    ) {
      const scoreA = atsResults[a.id]?.evaluation?.ats_score;
      const scoreB = atsResults[b.id]?.evaluation?.ats_score;

      // Applicants without an ATS score stay at the bottom
      if (scoreA == null && scoreB == null) return 0;
      if (scoreA == null) return 1;
      if (scoreB == null) return -1;

      if (sortOption === "HIGHEST_SCORE") {
        return scoreB - scoreA;
      }

      return scoreA - scoreB;
    }

    const dateA = new Date(a.applied_at).getTime();
    const dateB = new Date(b.applied_at).getTime();

    if (sortOption === "OLDEST") {
      return dateA - dateB;
    }

    return dateB - dateA;
  });

  return (
    <div className="applicants-page">
      <nav className="applicants-navbar">
        <Link to="/dashboard" className="applicants-brand">
          Career<span>Hub</span>
        </Link>

        <Link to="/dashboard" className="applicants-back">
          Back to Dashboard
        </Link>
      </nav>

      <main className="applicants-container">
        {/* Candidate Name and Email Search */}
        <div className="applicants-filter">
          <label htmlFor="candidate-search">
            Search Candidate by Name or Email
          </label>

          <input
            id="candidate-search"
            type="text"
            placeholder="Enter candidate name or email..."
            value={searchQuery}
            onChange={(event) => setSearchQuery(event.target.value)}
          />
        </div>

        {/* Application Status Filter */}
        <div className="applicants-filter">
          <label htmlFor="status-filter">
            Filter by Application Status
          </label>

          <select
            id="status-filter"
            value={statusFilter}
            onChange={(event) =>
              setStatusFilter(event.target.value)
            }
          >
            <option value="ALL">All Applications</option>

            {statusOptions.map((option) => (
              <option
                key={option.value}
                value={option.value}
              >
                {option.label}
              </option>
            ))}
          </select>
        </div>

        {/* ATS Score Filter */}
        <div className="applicants-filter">
          <label htmlFor="ats-score-filter">
            Filter by ATS Score
          </label>

          <select
            id="ats-score-filter"
            value={atsScoreFilter}
            onChange={(event) =>
              setAtsScoreFilter(event.target.value)
            }
          >
            {atsScoreOptions.map((option) => (
              <option
                key={option.value}
                value={option.value}
              >
                {option.label}
              </option>
            ))}
          </select>
        </div>

        {/* Candidate Skills Filter */}
        <div className="applicants-filter">
          <label htmlFor="skill-filter">
            Filter by Candidate Skill
          </label>

          <select
            id="skill-filter"
            value={skillFilter}
            onChange={(event) =>
              setSkillFilter(event.target.value)
            }
          >
            {skillOptions.map((option) => (
              <option
                key={option.value}
                value={option.value}
              >
                {option.label}
              </option>
            ))}
          </select>
        </div>

        {/* Phase 10: Applicant Sorting */}
        <div className="applicants-filter">
          <label htmlFor="applicant-sort">
            Sort Applicants By
          </label>

          <select
            id="applicant-sort"
            value={sortOption}
            onChange={(event) =>
              setSortOption(event.target.value)
            }
          >
            <option value="NEWEST">Newest First</option>
            <option value="OLDEST">Oldest First</option>
            <option value="HIGHEST_SCORE">
              Highest ATS Score
            </option>
            <option value="LOWEST_SCORE">
              Lowest ATS Score
            </option>
          </select>
        </div>

        {message && (
          <div className="applicants-success">
            {message}
          </div>
        )}

        {error && (
          <div className="applicants-error">
            {error}
          </div>
        )}

        {loading ? (
          <p className="applicants-message">
            Loading applicants...
          </p>
        ) : sortedApplicants.length === 0 ? (
          <div className="applicants-empty">
            <h2>No Matching Applicants</h2>

            <p>
              No applicants match the selected status,
              ATS score, skills, or search.
              Try changing your filters to see more applicants.
            </p>

            <Link to="/jobs" className="applicants-button">
              Manage Jobs
            </Link>
          </div>
        ) : (
          <div className="applicants-list">
            {sortedApplicants.map((applicant) => {
              const atsResult = atsResults[applicant.id];
              const evaluation = atsResult?.evaluation;

              return (
                <article
                  className="applicant-card"
                  key={applicant.id}
                >
                  <div className="applicant-card-header">
                    <div>
                      <h2>{applicant.candidate_name}</h2>

                      <p>{applicant.job_title}</p>

                      <span className="applicant-company">
                        {applicant.company_name}
                      </span>
                    </div>

                    <span
                      className={`applicant-status status-${applicant.status
                        .toLowerCase()
                        .replaceAll("_", "-")}`}
                    >
                      {applicant.status.replaceAll("_", " ")}
                    </span>
                  </div>

                  <div className="applicant-details">
                    <p>
                      <strong>Application ID:</strong> #{applicant.id}
                    </p>

                    <p>
                      <strong>Applied On:</strong>{" "}
                      {new Date(
                        applicant.applied_at
                      ).toLocaleDateString()}
                    </p>
                  </div>

                  {/* Update Application Status */}
                  <div className="applicant-status-control">
                    <label htmlFor={`status-${applicant.id}`}>
                      Update Application Status
                    </label>

                    <select
                      id={`status-${applicant.id}`}
                      value={applicant.status}
                      onChange={(event) =>
                        handleStatusChange(
                          applicant.id,
                          event.target.value
                        )
                      }
                      disabled={updatingId === applicant.id}
                    >
                      {statusOptions.map((option) => (
                        <option
                          key={option.value}
                          value={option.value}
                        >
                          {option.label}
                        </option>
                      ))}
                    </select>

                    {updatingId === applicant.id && (
                      <span className="applicant-updating">
                        Updating...
                      </span>
                    )}
                  </div>

                  {/* ATS Resume Evaluation */}
                  <div className="applicant-ats-section">
                    <button
                      type="button"
                      className="applicant-ats-button"
                      onClick={() =>
                        handleEvaluateResume(applicant.id)
                      }
                      disabled={atsLoadingId === applicant.id}
                    >
                      {atsLoadingId === applicant.id
                        ? "Evaluating Resume..."
                        : expandedAtsId === applicant.id
                          ? "Hide ATS Evaluation"
                          : "Evaluate Resume"}
                    </button>

                    {atsErrors[applicant.id] && (
                      <p className="applicants-error">
                        {atsErrors[applicant.id]}
                      </p>
                    )}

                    {expandedAtsId === applicant.id && (
                      <div className="applicant-ats-results">
                        {atsLoadingId === applicant.id ? (
                          <p>
                            Analyzing resume and matching skills...
                          </p>
                        ) : evaluation ? (
                          <>
                            <div className="ats-result-header">
                              <div>
                                <h3>ATS Resume Evaluation</h3>

                                <p>
                                  Resume: {atsResult.resume_title}
                                </p>
                              </div>

                              <div className="ats-score">
                                <strong>
                                  {evaluation.ats_score}%
                                </strong>

                                <span>Skill Match</span>
                              </div>
                            </div>

                            <div className="ats-summary">
                              <div>
                                <strong>
                                  {evaluation.total_required_skills}
                                </strong>

                                <span>Required Skills</span>
                              </div>

                              <div>
                                <strong>
                                  {evaluation.matched_count}
                                </strong>

                                <span>Matched Skills</span>
                              </div>

                              <div>
                                <strong>
                                  {evaluation.missing_count}
                                </strong>

                                <span>Missing Skills</span>
                              </div>
                            </div>

                            <div className="ats-skill-groups">
                              <div className="ats-skill-group">
                                <h4>Matched Skills</h4>

                                {evaluation.matched_skills.length > 0 ? (
                                  <div className="ats-skill-list">
                                    {evaluation.matched_skills.map(
                                      (skill) => (
                                        <span
                                          className="ats-skill matched"
                                          key={skill}
                                        >
                                          {skill}
                                        </span>
                                      )
                                    )}
                                  </div>
                                ) : (
                                  <p>No matching skills found.</p>
                                )}
                              </div>

                              <div className="ats-skill-group">
                                <h4>Missing Skills</h4>

                                {evaluation.missing_skills.length > 0 ? (
                                  <div className="ats-skill-list">
                                    {evaluation.missing_skills.map(
                                      (skill) => (
                                        <span
                                          className="ats-skill missing"
                                          key={skill}
                                        >
                                          {skill}
                                        </span>
                                      )
                                    )}
                                  </div>
                                ) : (
                                  <p>No missing skills detected.</p>
                                )}
                              </div>
                            </div>

                            <p className="ats-disclaimer">
                              {atsResult.message}
                            </p>
                          </>
                        ) : null}
                      </div>
                    )}
                  </div>

                  {/* Application Timeline */}
                  <div className="applicant-timeline-section">
                    <button
                      type="button"
                      className="applicant-timeline-button"
                      onClick={() =>
                        handleViewTimeline(applicant.id)
                      }
                      disabled={
                        timelineLoadingId === applicant.id
                      }
                    >
                      {timelineLoadingId === applicant.id
                        ? "Loading Timeline..."
                        : expandedTimelineId === applicant.id
                          ? "Hide Timeline"
                          : "View Timeline"}
                    </button>

                    {expandedTimelineId === applicant.id && (
                      <div className="application-timeline">
                        <h3>Application Timeline</h3>

                        {timelineErrors[applicant.id] && (
                          <p className="applicants-error">
                            {timelineErrors[applicant.id]}
                          </p>
                        )}

                        {timelineLoadingId === applicant.id ? (
                          <p>Loading timeline...</p>
                        ) : timelines[applicant.id]?.length > 0 ? (
                          <div className="timeline-list">
                            {timelines[applicant.id].map((event) => (
                              <div
                                className="timeline-item"
                                key={event.id}
                              >
                                <div className="timeline-marker"></div>

                                <div className="timeline-content">
                                  <h4>
                                    {event.old_status
                                      ? `${event.old_status.replaceAll("_", " ")} → ${event.new_status.replaceAll("_", " ")}`
                                      : event.new_status.replaceAll("_", " ")}
                                  </h4>

                                  <p>
                                    <strong>Updated by:</strong>{" "}
                                    {event.changed_by_name || "System"}
                                  </p>

                                  <span>
                                    {formatDateTime(event.changed_at)}
                                  </span>
                                </div>
                              </div>
                            ))}
                          </div>
                        ) : !timelineErrors[applicant.id] ? (
                          <p>No timeline events found.</p>
                        ) : null}
                      </div>
                    )}
                  </div>
                </article>
              );
            })}
          </div>
        )}
      </main>
    </div>
  );
}

export default Applicants;
