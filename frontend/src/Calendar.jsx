
import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import "./Calendar.css";

const API_URL = "http://127.0.0.1:8000/api";

const dateKey = (date) => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
};

function Calendar() {
  const today = new Date();

  const [interviews, setInterviews] = useState([]);
  const [currentMonth, setCurrentMonth] = useState(
    new Date(today.getFullYear(), today.getMonth(), 1)
  );
  const [selectedDate, setSelectedDate] = useState(dateKey(today));
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const loadInterviews = async () => {
      const token = sessionStorage.getItem("accessToken");

      if (!token) {
        setError("Please log in to view your interview calendar.");
        setLoading(false);
        return;
      }

      try {
        const response = await fetch(`${API_URL}/interviews/`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.detail || "Unable to load interviews.");
        }

        setInterviews(Array.isArray(data) ? data : []);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    loadInterviews();
  }, []);

  const calendarDays = useMemo(() => {
    const year = currentMonth.getFullYear();
    const month = currentMonth.getMonth();

    const firstDay = new Date(year, month, 1);
    const startDay = firstDay.getDay();
    const daysInMonth = new Date(year, month + 1, 0).getDate();

    const totalCells = Math.ceil((startDay + daysInMonth) / 7) * 7;

    return Array.from({ length: totalCells }, (_, index) => {
      const dayNumber = index - startDay + 1;
      return new Date(year, month, dayNumber);
    });
  }, [currentMonth]);

  const interviewsByDate = useMemo(() => {
    return interviews.reduce((groups, interview) => {
      const key = dateKey(new Date(interview.scheduled_at));

      if (!groups[key]) {
        groups[key] = [];
      }

      groups[key].push(interview);
      return groups;
    }, {});
  }, [interviews]);

  const selectedInterviews = interviewsByDate[selectedDate] || [];

  const changeMonth = (amount) => {
    setCurrentMonth(
      (previous) =>
        new Date(
          previous.getFullYear(),
          previous.getMonth() + amount,
          1
        )
    );
  };

  const goToToday = () => {
    const now = new Date();
    setCurrentMonth(new Date(now.getFullYear(), now.getMonth(), 1));
    setSelectedDate(dateKey(now));
  };

  const formatTime = (dateString) =>
    new Date(dateString).toLocaleTimeString([], {
      hour: "2-digit",
      minute: "2-digit",
    });

  const formatSelectedDate = () =>
    new Date(`${selectedDate}T00:00:00`).toLocaleDateString([], {
      weekday: "long",
      day: "numeric",
      month: "long",
      year: "numeric",
    });

  return (
    <div className="calendar-page">
      <nav className="navbar">
        <Link to="/" className="brand">
          Career<span>Hub</span>
        </Link>

        <div className="calendar-nav-actions">
          <Link to="/interviews" className="button button-outline">
            Interview Management
          </Link>
          <Link to="/dashboard" className="button button-outline">
            Dashboard
          </Link>
        </div>
      </nav>

      <main className="calendar-content">
        <header className="calendar-heading">
          <span className="eyebrow">INTERVIEW SCHEDULE</span>
          <h1>Interview Calendar</h1>
          <p>View your interviews by date and keep track of your schedule.</p>
        </header>

        {error && <div className="calendar-error">{error}</div>}

        {loading ? (
          <p className="calendar-message">Loading your calendar...</p>
        ) : (
          <>
            <section className="calendar-panel">
              <div className="calendar-toolbar">
                <div>
                  <h2>
                    {currentMonth.toLocaleDateString([], {
                      month: "long",
                      year: "numeric",
                    })}
                  </h2>
                  <p>{interviews.length} total interviews</p>
                </div>

                <div className="calendar-controls">
                  <button type="button" onClick={goToToday}>
                    Today
                  </button>
                  <button
                    type="button"
                    aria-label="Previous month"
                    onClick={() => changeMonth(-1)}
                  >
                    ‹
                  </button>
                  <button
                    type="button"
                    aria-label="Next month"
                    onClick={() => changeMonth(1)}
                  >
                    ›
                  </button>
                </div>
              </div>

              <div className="calendar-grid">
                {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map(
                  (day) => (
                    <div className="calendar-weekday" key={day}>
                      {day}
                    </div>
                  )
                )}

                {calendarDays.map((date, index) => {
                  const key = dateKey(date);
                  const inCurrentMonth =
                    date.getMonth() === currentMonth.getMonth();
                  const dayInterviews = interviewsByDate[key] || [];
                  const isSelected = selectedDate === key;
                  const isToday = key === dateKey(today);

                  return (
                    <button
                      type="button"
                      key={`${key}-${index}`}
                      className={[
                        "calendar-day",
                        !inCurrentMonth ? "outside-month" : "",
                        isSelected ? "selected-day" : "",
                        isToday ? "today" : "",
                      ]
                        .filter(Boolean)
                        .join(" ")}
                      onClick={() => setSelectedDate(key)}
                      aria-pressed={isSelected}
                    >
                      <span className="calendar-day-number">
                        {date.getDate()}
                      </span>

                      {dayInterviews.length > 0 && (
                        <span className="calendar-day-events">
                          <span className="calendar-event-dot" />
                          <span>
                            {dayInterviews.length}{" "}
                            {dayInterviews.length === 1 ? "interview" : "interviews"}
                          </span>
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>
            </section>

            <section className="calendar-agenda">
              <div className="calendar-agenda-heading">
                <div>
                  <span className="eyebrow">DAILY SCHEDULE</span>
                  <h2>{formatSelectedDate()}</h2>
                </div>
                <span className="calendar-agenda-count">
                  {selectedInterviews.length}{" "}
                  {selectedInterviews.length === 1 ? "interview" : "interviews"}
                </span>
              </div>

              {selectedInterviews.length === 0 ? (
                <div className="calendar-empty">
                  <div className="calendar-empty-icon">📅</div>
                  <h3>No interviews on this date</h3>
                  <p>Select another date to view its interviews.</p>
                </div>
              ) : (
                <div className="calendar-agenda-list">
                  {[...selectedInterviews]
                    .sort(
                      (a, b) =>
                        new Date(a.scheduled_at) - new Date(b.scheduled_at)
                    )
                    .map((interview) => (
                      <article
                        className="calendar-interview-card"
                        key={interview.id}
                      >
                        <div className="calendar-interview-time">
                          {formatTime(interview.scheduled_at)}
                          <span>{interview.duration_minutes} min</span>
                        </div>

                        <div className="calendar-interview-info">
                          <h3>{interview.title}</h3>
                          <p>
                            {interview.job_title}
                            {interview.company_name
                              ? ` · ${interview.company_name}`
                              : ""}
                          </p>
                          <p>
                            Candidate: {interview.candidate_name || "Not specified"}
                          </p>
                          <p>
                            {interview.interview_type?.replace("_", " ")}
                          </p>
                        </div>

                        <span
                          className={`calendar-status ${interview.status?.toLowerCase()}`}
                        >
                          {interview.status?.replace("_", " ")}
                        </span>
                      </article>
                    ))}
                </div>
              )}
            </section>
          </>
        )}
      </main>
    </div>
  );
}

export default Calendar;
