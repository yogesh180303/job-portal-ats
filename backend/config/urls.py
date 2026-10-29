from django.contrib import admin
from django.urls import path

from accounts.views import health_check, candidate_register


urlpatterns = [
    path("admin/", admin.site.urls),
    path("api/health/", health_check, name="health-check"),
    path(
        "api/auth/register/",
        candidate_register,
        name="candidate-register",
    ),
]