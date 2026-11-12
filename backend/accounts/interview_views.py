from django.shortcuts import get_object_or_404
from django.utils import timezone

from rest_framework import status
from rest_framework.decorators import (
    api_view,
    permission_classes,
)
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response

from .models import (
    Application,
    Interview,
    Notification,
)
from .interview_serializers import InterviewSerializer


def can_access_interview(user, interview):
    application = interview.application

    return (
        user.role == "ADMIN"
        or (
            user.role == "CANDIDATE"
            and application.candidate_id == user.id
        )
        or (
            user.role == "RECRUITER"
            and application.job.recruiter_id == user.id
        )
    )


def can_manage_interview(user, interview):
    return (
        user.role == "ADMIN"
        or (
            user.role == "RECRUITER"
            and interview.application.job.recruiter_id == user.id
        )
    )


def send_interview_notification(interview, action):
    application = interview.application

    if action == "scheduled":
        title = "Interview Scheduled"
        message = (
            f"An interview for {application.job.title} "
            f"at {application.job.company_name} "
            f"has been scheduled for "
            f"{timezone.localtime(interview.scheduled_at).strftime('%d %b %Y, %I:%M %p')}."
        )

    elif action == "rescheduled":
        title = "Interview Rescheduled"
        message = (
            f"Your interview for {application.job.title} "
            f"at {application.job.company_name} "
            f"has been rescheduled to "
            f"{timezone.localtime(interview.scheduled_at).strftime('%d %b %Y, %I:%M %p')}."
        )

    elif action == "cancelled":
        title = "Interview Cancelled"
        message = (
            f"Your interview for {application.job.title} "
            f"at {application.job.company_name} has been cancelled."
        )

    elif action == "completed":
        title = "Interview Completed"
        message = (
            f"Your interview for {application.job.title} "
            f"at {application.job.company_name} has been marked as completed."
        )

    else:
        return

    Notification.objects.create(
        recipient=application.candidate,
        notification_type=(
            Notification.NotificationType.INTERVIEW_UPDATE
        ),
        title=title,
        message=message,
        application=application,
    )


@api_view(["GET", "POST"])
@permission_classes([IsAuthenticated])
def interview_list_create(request):

    if request.method == "GET":

        interviews = Interview.objects.select_related(
            "application",
            "application__candidate",
            "application__job",
            "application__job__recruiter",
            "scheduled_by",
        )

        if request.user.role == "CANDIDATE":
            interviews = interviews.filter(
                application__candidate=request.user
            )

        elif request.user.role == "RECRUITER":
            interviews = interviews.filter(
                application__job__recruiter=request.user
            )

        elif request.user.role != "ADMIN":
            return Response(
                {"detail": "You do not have permission to view interviews."},
                status=status.HTTP_403_FORBIDDEN,
            )

        serializer = InterviewSerializer(
            interviews,
            many=True,
        )

        return Response(serializer.data)

    if request.user.role not in ["RECRUITER", "ADMIN"]:
        return Response(
            {"detail": "Only recruiters and admins can schedule interviews."},
            status=status.HTTP_403_FORBIDDEN,
        )

    application_id = request.data.get("application")

    if not application_id:
        return Response(
            {"application": ["Application ID is required."]},
            status=status.HTTP_400_BAD_REQUEST,
        )

    application = get_object_or_404(
        Application.objects.select_related(
            "candidate",
            "job",
            "job__recruiter",
        ),
        pk=application_id,
    )

    if (
        request.user.role == "RECRUITER"
        and application.job.recruiter_id != request.user.id
    ):
        return Response(
            {"detail": "You cannot schedule interviews for this application."},
            status=status.HTTP_403_FORBIDDEN,
        )

    serializer = InterviewSerializer(data=request.data)

    if serializer.is_valid():
        interview = serializer.save(
            application=application,
            scheduled_by=request.user,
        )

        send_interview_notification(interview, "scheduled")

        return Response(
            InterviewSerializer(interview).data,
            status=status.HTTP_201_CREATED,
        )

    return Response(
        serializer.errors,
        status=status.HTTP_400_BAD_REQUEST,
    )


@api_view(["GET", "PATCH", "PUT", "DELETE"])
@permission_classes([IsAuthenticated])
def interview_detail(request, pk):

    interview = get_object_or_404(
        Interview.objects.select_related(
            "application",
            "application__candidate",
            "application__job",
            "application__job__recruiter",
            "scheduled_by",
        ),
        pk=pk,
    )

    if request.method == "GET":

        if not can_access_interview(request.user, interview):
            return Response(
                {"detail": "Interview not found."},
                status=status.HTTP_404_NOT_FOUND,
            )

        serializer = InterviewSerializer(interview)

        return Response(serializer.data)

    if not can_manage_interview(request.user, interview):
        return Response(
            {"detail": "You cannot manage this interview."},
            status=status.HTTP_403_FORBIDDEN,
        )

    if request.method == "DELETE":

        if interview.status != Interview.Status.CANCELLED:
            interview.status = Interview.Status.CANCELLED
            interview.save(update_fields=["status", "updated_at"])

            send_interview_notification(interview, "cancelled")

        return Response(
            {"message": "Interview cancelled successfully."},
            status=status.HTTP_200_OK,
        )

    old_scheduled_at = interview.scheduled_at
    old_status = interview.status

    serializer = InterviewSerializer(
        interview,
        data=request.data,
        partial=(request.method == "PATCH"),
    )

    if serializer.is_valid():

        updated_interview = serializer.save()

        if updated_interview.status == Interview.Status.CANCELLED:
            if old_status != Interview.Status.CANCELLED:
                send_interview_notification(
                    updated_interview,
                    "cancelled",
                )

        elif updated_interview.status == Interview.Status.COMPLETED:
            if old_status != Interview.Status.COMPLETED:
                send_interview_notification(
                    updated_interview,
                    "completed",
                )

        elif updated_interview.scheduled_at != old_scheduled_at:
            send_interview_notification(
                updated_interview,
                "rescheduled",
            )

        return Response(
            InterviewSerializer(updated_interview).data,
            status=status.HTTP_200_OK,
        )

    return Response(
        serializer.errors,
        status=status.HTTP_400_BAD_REQUEST,
    )