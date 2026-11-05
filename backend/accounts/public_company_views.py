from django.shortcuts import get_object_or_404

from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import AllowAny
from rest_framework.response import Response

from .models import CompanyProfile, Job
from .serializers import CompanyProfileSerializer, JobSerializer


@api_view(["GET"])
@permission_classes([AllowAny])
def public_company_list(request):
    """
    Return company profiles that have at least one published job.
    This endpoint is publicly accessible.
    """
    profiles = CompanyProfile.objects.select_related("recruiter").all()

    companies = []

    for profile in profiles:
        published_jobs = Job.objects.filter(
            recruiter=profile.recruiter,
            status=Job.Status.PUBLISHED,
        )

        job_count = published_jobs.count()

        if job_count == 0:
            continue

        company_data = dict(CompanyProfileSerializer(profile).data)
        company_data["published_job_count"] = job_count

        companies.append(company_data)

    return Response(companies)


@api_view(["GET"])
@permission_classes([AllowAny])
def public_company_detail(request, pk):
    """
    Return a public company profile and its published jobs.
    This endpoint is publicly accessible.
    """
    profile = get_object_or_404(
        CompanyProfile.objects.select_related("recruiter"),
        pk=pk,
    )

    published_jobs = Job.objects.filter(
        recruiter=profile.recruiter,
        status=Job.Status.PUBLISHED,
    ).order_by("-created_at")

    company_data = dict(CompanyProfileSerializer(profile).data)
    company_data["published_job_count"] = published_jobs.count()
    company_data["jobs"] = JobSerializer(
        published_jobs,
        many=True,
    ).data

    return Response(company_data)


@api_view(["GET"])
@permission_classes([AllowAny])
def public_job_detail(request, pk):
    """
    Return details of a published job.
    This endpoint is publicly accessible.
    """
    job = get_object_or_404(
        Job.objects.select_related("recruiter"),
        pk=pk,
        status=Job.Status.PUBLISHED,
    )

    serializer = JobSerializer(job)
    return Response(serializer.data)
