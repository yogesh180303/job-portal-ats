from django.shortcuts import get_object_or_404

from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework import status

from .models import CandidateProfile, Resume
from .resume_parser import parse_resume


@api_view(["POST"])
@permission_classes([IsAuthenticated])
def parse_resume_api(request, pk):
    """
    Parse the authenticated candidate's uploaded resume.

    Returns structured information without modifying
    the candidate's existing profile or database records.
    """

    try:
        profile = CandidateProfile.objects.get(
            user=request.user
        )

    except CandidateProfile.DoesNotExist:
        return Response(
            {
                "detail": "Candidate profile not found."
            },
            status=status.HTTP_404_NOT_FOUND,
        )

    resume = get_object_or_404(
        Resume,
        pk=pk,
        profile=profile,
    )

    try:
        parsed_data = parse_resume(resume.file)

    except ValueError as error:
        return Response(
            {
                "detail": str(error)
            },
            status=status.HTTP_400_BAD_REQUEST,
        )

    return Response(
        {
            "message": "Resume parsed successfully.",
            "resume_id": resume.id,
            "parsed_data": parsed_data,
        },
        status=status.HTTP_200_OK,
    )