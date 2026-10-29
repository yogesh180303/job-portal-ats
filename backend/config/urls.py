
from django.contrib import admin
from django.urls import path
from rest_framework_simplejwt.views import (
    TokenObtainPairView,
    TokenRefreshView,
)

from accounts.views import health_check, candidate_register


urlpatterns = [
    path("admin/", admin.site.urls),

    # Health check
    path("api/health/", health_check, name="health-check"),

    # Candidate registration
    path(
        "api/auth/register/",
        candidate_register,
        name="candidate-register",
    ),

    # Login: obtain access and refresh tokens
    path(
        "api/auth/login/",
        TokenObtainPairView.as_view(),
        name="token-obtain-pair",
    ),

    # Refresh an access token
    path(
        "api/auth/token/refresh/",
        TokenRefreshView.as_view(),
        name="token-refresh",
    ),
]
