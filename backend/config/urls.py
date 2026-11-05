from django.conf import settings
from django.conf.urls.static import static
from django.contrib import admin
from django.urls import path
from rest_framework_simplejwt.views import TokenRefreshView

from accounts.views import (
    health_check,
    candidate_register,
    EmailTokenObtainPairView,
    user_profile,
    candidate_profile,
    education_list_create,
    education_detail,
    experience_list_create,
    experience_detail,
    skill_list_create,
    skill_detail,
    resume_list_create,
    resume_detail,
    job_list_create,
    job_detail,
    application_list_create,
    application_detail,
    application_timeline,
    application_ats_evaluation,
    notification_list,
    notification_detail,
    saved_job_list_create,
    saved_job_detail,
    company_profile,
)

from accounts.job_alert_views import (
    job_alert_list_create,
    job_alert_detail,
)

from accounts.public_company_views import (
    public_company_list,
    public_company_detail,
    public_job_detail,
)


urlpatterns = [
    path("admin/", admin.site.urls),
    path("api/health/", health_check, name="health-check"),
    path("api/auth/register/", candidate_register, name="candidate-register"),
    path("api/auth/login/", EmailTokenObtainPairView.as_view(), name="token-obtain-pair"),
    path("api/auth/token/refresh/", TokenRefreshView.as_view(), name="token-refresh"),
    path("api/auth/me/", user_profile, name="user-profile"),
    path("api/auth/profile/", candidate_profile, name="candidate-profile"),

    path("api/education/", education_list_create, name="education-list-create"),
    path("api/education/<int:pk>/", education_detail, name="education-detail"),

    path("api/experience/", experience_list_create, name="experience-list-create"),
    path("api/experience/<int:pk>/", experience_detail, name="experience-detail"),
    path("api/skills/", skill_list_create, name="skill-list-create"),
    path("api/skills/<int:pk>/", skill_detail, name="skill-detail"),

    path("api/resumes/", resume_list_create, name="resume-list-create"),
    path("api/resumes/<int:pk>/", resume_detail, name="resume-detail"),

    path("api/jobs/", job_list_create, name="job-list-create"),
    path("api/jobs/<int:pk>/", job_detail, name="job-detail"),

    path("api/applications/", application_list_create, name="application-list-create"),
    path("api/applications/<int:pk>/", application_detail, name="application-detail"),
    path("api/applications/<int:pk>/timeline/", application_timeline, name="application-timeline"),
    path("api/applications/<int:pk>/ats-evaluation/", application_ats_evaluation, name="application-ats-evaluation"),

    # Phase 11: Notification APIs
    path("api/notifications/", notification_list, name="notification-list"),
    path("api/notifications/<int:pk>/", notification_detail, name="notification-detail"),

    # Phase 12: Saved Jobs APIs
    path("api/saved-jobs/", saved_job_list_create, name="saved-job-list-create"),
    path("api/saved-jobs/<int:pk>/", saved_job_detail, name="saved-job-detail"),

    # Phase 19: Recruiter Company Profile API
    path("api/company-profile/", company_profile, name="company-profile"),

    # Phase 20: Public Company APIs
    path("api/companies/", public_company_list, name="public-company-list"),
    path("api/companies/<int:pk>/", public_company_detail, name="public-company-detail"),

    # Phase 21: Public Job Details API
    path("api/public-jobs/<int:pk>/", public_job_detail, name="public-job-detail"),

    # Phase 22: Job Alerts APIs
    path("api/job-alerts/", job_alert_list_create, name="job-alert-list-create"),
    path("api/job-alerts/<int:pk>/", job_alert_detail, name="job-alert-detail"),
]


if settings.DEBUG:
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)