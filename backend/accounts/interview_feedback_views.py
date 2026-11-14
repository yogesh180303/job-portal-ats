
from django.shortcuts import get_object_or_404
from rest_framework import status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response

from .models import Interview, InterviewFeedback
from .interview_feedback_serializers import InterviewFeedbackSerializer


def can_view_feedback(user, feedback):
    interview = feedback.interview
    application = interview.application

    return (
        user.role == "ADMIN"
        or (
            user.role == "RECRUITER"
            and application.job.recruiter_id == user.id
        )
        or (
            user.role == "CANDIDATE"
            and application.candidate_id == user.id
            and feedback.is_shared_with_candidate
        )
    )


def can_manage_feedback(user, interview):
    return (
        user.role == "ADMIN"
        or (
            user.role == "RECRUITER"
            and interview.application.job.recruiter_id == user.id
        )
    )


@api_view(["GET", "POST"])
@permission_classes([IsAuthenticated])
def interview_feedback_list_create(request):

    if request.method == "GET":
        feedback = InterviewFeedback.objects.select_related(
            "interview",
            "interview__application",
            "interview__application__candidate",
            "interview__application__job",
            "submitted_by",
        )

        if request.user.role == "CANDIDATE":
            feedback = feedback.filter(
                interview__application__candidate=request.user,
                is_shared_with_candidate=True,
            )

        elif request.user.role == "RECRUITER":
            feedback = feedback.filter(
                interview__application__job__recruiter=request.user
            )

        elif request.user.role != "ADMIN":
            return Response(
                {"detail": "You do not have permission to view feedback."},
                status=status.HTTP_403_FORBIDDEN,
            )

        serializer = InterviewFeedbackSerializer(feedback, many=True)
        return Response(serializer.data)

    # POST: Only recruiters and admins can submit feedback.
    if request.user.role not in ["RECRUITER", "ADMIN"]:
        return Response(
            {"detail": "Only recruiters and admins can submit feedback."},
            status=status.HTTP_403_FORBIDDEN,
        )

    interview_id = request.data.get("interview")

    if not interview_id:
        return Response(
            {"interview": ["Interview ID is required."]},
            status=status.HTTP_400_BAD_REQUEST,
        )

    interview = get_object_or_404(
        Interview.objects.select_related(
            "application__job",
            "application__candidate",
        ),
        pk=interview_id,
    )

    if not can_manage_feedback(request.user, interview):
        return Response(
            {"detail": "You cannot submit feedback for this interview."},
            status=status.HTTP_403_FORBIDDEN,
        )

    if interview.status != Interview.Status.COMPLETED:
        return Response(
            {
                "detail": (
                    "Feedback can only be submitted for completed interviews."
                )
            },
            status=status.HTTP_400_BAD_REQUEST,
        )

    if InterviewFeedback.objects.filter(interview=interview).exists():
        return Response(
            {"detail": "Feedback already exists for this interview."},
            status=status.HTTP_400_BAD_REQUEST,
        )

    serializer = InterviewFeedbackSerializer(data=request.data)

    if serializer.is_valid():
        feedback = serializer.save(
            interview=interview,
            submitted_by=request.user,
        )

        return Response(
            InterviewFeedbackSerializer(feedback).data,
            status=status.HTTP_201_CREATED,
        )

    return Response(
        serializer.errors,
        status=status.HTTP_400_BAD_REQUEST,
    )


@api_view(["GET", "PATCH"])
@permission_classes([IsAuthenticated])
def interview_feedback_detail(request, pk):

    feedback = get_object_or_404(
        InterviewFeedback.objects.select_related(
            "interview__application__job",
            "interview__application__candidate",
            "submitted_by",
        ),
        pk=pk,
    )

    if request.method == "GET":
        if not can_view_feedback(request.user, feedback):
            return Response(
                {"detail": "Feedback not found."},
                status=status.HTTP_404_NOT_FOUND,
            )

        return Response(InterviewFeedbackSerializer(feedback).data)

    # PATCH: Only the owning recruiter or an admin can edit feedback.
    if not can_manage_feedback(request.user, feedback.interview):
        return Response(
            {"detail": "You cannot edit this feedback."},
            status=status.HTTP_403_FORBIDDEN,
        )

    serializer = InterviewFeedbackSerializer(
        feedback,
        data=request.data,
        partial=True,
    )

    if serializer.is_valid():
        serializer.save()
        return Response(serializer.data)

    return Response(
        serializer.errors,
        status=status.HTTP_400_BAD_REQUEST,
    )
