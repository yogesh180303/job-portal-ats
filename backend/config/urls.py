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
)



urlpatterns = [
    path("admin/", admin.site.urls),

    path(
        "api/health/",
        health_check,
        name="health-check",
    ),

    path(
        "api/auth/register/",
        candidate_register,
        name="candidate-register",
    ),

    path(
        "api/auth/login/",
        EmailTokenObtainPairView.as_view(),
        name="token-obtain-pair",
    ),

    path(
        "api/auth/token/refresh/",
        TokenRefreshView.as_view(),
        name="token-refresh",
    ),

    path(
        "api/auth/me/",
        user_profile,
        name="user-profile",
    ),

    path(
        "api/auth/profile/",
        candidate_profile,
        name="candidate-profile",
    ),

    path(
        "api/education/",
        education_list_create,
        name="education-list-create",
    ),

    path(
        "api/education/<int:pk>/",
        education_detail,
        name="education-detail",
    ),

    path(
        "api/experience/",
        experience_list_create,
        name="experience-list-create",
    ),

    path(
        "api/experience/<int:pk>/",
        experience_detail,
        name="experience-detail",
    ),

    path(
        "api/skills/",
        skill_list_create,
        name="skill-list-create",
    ),

    path(
        "api/skills/<int:pk>/",
        skill_detail,
        name="skill-detail",
    ),

    path(
        "api/resumes/",
        resume_list_create,
        name="resume-list-create",
    ),

    path(
        "api/resumes/<int:pk>/",
        resume_detail,
        name="resume-detail",
    ),
    path(
        "api/jobs/",
        job_list_create,
        name="job-list-create",
    ),

    path(
        "api/jobs/<int:pk>/",
        job_detail,
        name="job-detail",
    ),

]

if settings.DEBUG:
    urlpatterns += static(
        settings.MEDIA_URL,
        document_root=settings.MEDIA_ROOT,
    )