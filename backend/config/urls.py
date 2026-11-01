from django.contrib import admin
from django.urls import path
from rest_framework_simplejwt.views import TokenRefreshView

from accounts.views import (
    health_check,
    candidate_register,
    EmailTokenObtainPairView,
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
]