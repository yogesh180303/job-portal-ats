import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import "./Notifications.css";

const API_URL = "http://127.0.0.1:8000/api";

function Notifications() {
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [totalCount, setTotalCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [updatingId, setUpdatingId] = useState(null);

  const token = sessionStorage.getItem("accessToken");

  const fetchNotifications = async () => {
    try {
      setLoading(true);
      setError("");

      const response = await fetch(`${API_URL}/notifications/`, {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.detail || "Failed to load notifications.");
      }

      setNotifications(data.notifications || []);
      setUnreadCount(data.unread_count || 0);
      setTotalCount(data.total_count || 0);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!token) {
      setError("Please log in to view your notifications.");
      setLoading(false);
      return;
    }

    fetchNotifications();
  }, []);

  const handleMarkAsRead = async (notificationId) => {
    try {
      setUpdatingId(notificationId);
      setError("");

      const response = await fetch(
        `${API_URL}/notifications/${notificationId}/`,
        {
          method: "PATCH",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.detail || "Failed to update notification.");
      }

      setNotifications((previous) =>
        previous.map((notification) =>
          notification.id === notificationId
            ? { ...notification, is_read: true }
            : notification
        )
      );

      setUnreadCount((previous) => Math.max(0, previous - 1));
    } catch (err) {
      setError(err.message);
    } finally {
      setUpdatingId(null);
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleString();
  };

  return (
    <div className="notifications-page">
      <nav className="navbar">
        <Link to="/" className="brand">
          Career<span>Hub</span>
        </Link>

        <Link to="/dashboard" className="button button-outline">
          Back to Dashboard
        </Link>
      </nav>

      <main className="notifications-content">
        <section className="notifications-heading">
          <span className="eyebrow">YOUR ACTIVITY</span>
          <h1>Notifications</h1>
          <p>
            Stay updated about changes to your job applications.
          </p>
        </section>

        <section className="notification-summary">
          <article className="notification-stat">
            <span>Unread</span>
            <strong>{unreadCount}</strong>
          </article>

          <article className="notification-stat">
            <span>Total Notifications</span>
            <strong>{totalCount}</strong>
          </article>
        </section>

        {error && (
          <div className="notification-error">
            {error}
          </div>
        )}

        {loading ? (
          <p className="notification-message">
            Loading your notifications...
          </p>
        ) : notifications.length === 0 ? (
          <section className="notification-empty">
            <div className="notification-empty-icon">🔔</div>
            <h2>No notifications yet</h2>
            <p>
              Updates about your job applications will appear here.
            </p>
          </section>
        ) : (
          <section className="notification-list">
            {notifications.map((notification) => (
              <article
                className={`notification-card ${
                  notification.is_read ? "read" : "unread"
                }`}
                key={notification.id}
              >
                <div className="notification-card-top">
                  <div>
                    <span className="notification-type">
                      Application Update
                    </span>
                    <h2>{notification.title}</h2>
                  </div>

                  {!notification.is_read && (
                    <span className="notification-unread-label">
                      New
                    </span>
                  )}
                </div>

                <p className="notification-body">
                  {notification.message}
                </p>

                <div className="notification-card-bottom">
                  <span className="notification-date">
                    {formatDate(notification.created_at)}
                  </span>

                  {!notification.is_read && (
                    <button
                      type="button"
                      className="button button-primary"
                      onClick={() => handleMarkAsRead(notification.id)}
                      disabled={updatingId === notification.id}
                    >
                      {updatingId === notification.id
                        ? "Updating..."
                        : "Mark as Read"}
                    </button>
                  )}

                  {notification.is_read && (
                    <span className="notification-read-label">
                      ✓ Read
                    </span>
                  )}
                </div>
              </article>
            ))}
          </section>
        )}
      </main>
    </div>
  );
}

export default Notifications;
