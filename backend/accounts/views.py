
from rest_framework.decorators import api_view, permission_classes
from rest_framework.response import Response
from rest_framework import status
from rest_framework_simplejwt.views import TokenObtainPairView
from rest_framework.permissions import IsAuthenticated

from .serializers import (
    CandidateRegistrationSerializer,
    EmailTokenObtainPairSerializer,
    UserProfileSerializer,
    CandidateProfileSerializer,
    EducationSerializer,
    WorkExperienceSerializer,
    SkillSerializer,
    ResumeSerializer,
)


@api_view(["GET"])
def health_check(request):
    return Response({
        "status": "success",
        "message": "Job Portal & ATS API is running",
    })


@api_view(["POST"])
def candidate_register(request):
    serializer = CandidateRegistrationSerializer(data=request.data)

    if serializer.is_valid():
        user = serializer.save()

        return Response(
            {
                "message": "Candidate registered successfully",
                "user": {
                    "id": user.id,
                    "username": user.username,
                    "email": user.email,
                    "role": user.role,
                },
            },
            status=status.HTTP_201_CREATED,
        )

    return Response(
        serializer.errors,
        status=status.HTTP_400_BAD_REQUEST,
    )


class EmailTokenObtainPairView(TokenObtainPairView):
    serializer_class = EmailTokenObtainPairSerializer


@api_view(["GET"])
@permission_classes([IsAuthenticated])
def user_profile(request):
    serializer = UserProfileSerializer(request.user)
    return Response(serializer.data)


@api_view(["GET", "PUT", "PATCH"])
@permission_classes([IsAuthenticated])
def candidate_profile(request):
    from .models import CandidateProfile

    profile, created = CandidateProfile.objects.get_or_create(
        user=request.user
    )

    if request.method == "GET":
        serializer = CandidateProfileSerializer(profile)
        return Response(serializer.data)

    serializer = CandidateProfileSerializer(
        profile,
        data=request.data,
        partial=(request.method == "PATCH"),
    )

    if serializer.is_valid():
        serializer.save()
        return Response(serializer.data)

    return Response(
        serializer.errors,
        status=status.HTTP_400_BAD_REQUEST,
    )


@api_view(["GET", "POST"])
@permission_classes([IsAuthenticated])
def education_list_create(request):
    from .models import CandidateProfile, Education

    profile, created = CandidateProfile.objects.get_or_create(
        user=request.user
    )

    if request.method == "GET":
        educations = Education.objects.filter(
            profile=profile
        ).order_by("-start_year")

        serializer = EducationSerializer(educations, many=True)
        return Response(serializer.data)

    serializer = EducationSerializer(data=request.data)

    if serializer.is_valid():
        serializer.save(profile=profile)
        return Response(
            serializer.data,
            status=status.HTTP_201_CREATED,
        )

    return Response(
        serializer.errors,
        status=status.HTTP_400_BAD_REQUEST,
    )


@api_view(["PUT", "PATCH", "DELETE"])
@permission_classes([IsAuthenticated])
def education_detail(request, pk):
    from .models import CandidateProfile, Education

    try:
        profile = CandidateProfile.objects.get(user=request.user)
        education = Education.objects.get(
            pk=pk,
            profile=profile,
        )
    except (CandidateProfile.DoesNotExist, Education.DoesNotExist):
        return Response(
            {"detail": "Education record not found."},
            status=status.HTTP_404_NOT_FOUND,
        )

    if request.method == "DELETE":
        education.delete()
        return Response(
            {"message": "Education record deleted successfully."},
            status=status.HTTP_200_OK,
        )

    serializer = EducationSerializer(
        education,
        data=request.data,
        partial=(request.method == "PATCH"),
    )

    if serializer.is_valid():
        serializer.save()
        return Response(serializer.data)

    return Response(
        serializer.errors,
        status=status.HTTP_400_BAD_REQUEST,
    )


# Work Experience APIs

@api_view(["GET", "POST"])
@permission_classes([IsAuthenticated])
def experience_list_create(request):
    from .models import CandidateProfile, WorkExperience

    profile, created = CandidateProfile.objects.get_or_create(
        user=request.user
    )

    if request.method == "GET":
        experiences = WorkExperience.objects.filter(
            profile=profile
        ).order_by("-start_date")

        serializer = WorkExperienceSerializer(
            experiences,
            many=True,
        )
        return Response(serializer.data)

    serializer = WorkExperienceSerializer(data=request.data)

    if serializer.is_valid():
        serializer.save(profile=profile)
        return Response(
            serializer.data,
            status=status.HTTP_201_CREATED,
        )

    return Response(
        serializer.errors,
        status=status.HTTP_400_BAD_REQUEST,
    )


@api_view(["PUT", "PATCH", "DELETE"])
@permission_classes([IsAuthenticated])
def experience_detail(request, pk):
    from .models import CandidateProfile, WorkExperience

    try:
        profile = CandidateProfile.objects.get(user=request.user)

        experience = WorkExperience.objects.get(
            pk=pk,
            profile=profile,
        )

    except (CandidateProfile.DoesNotExist, WorkExperience.DoesNotExist):
        return Response(
            {"detail": "Work experience record not found."},
            status=status.HTTP_404_NOT_FOUND,
        )

    if request.method == "DELETE":
        experience.delete()

        return Response(
            {"message": "Work experience record deleted successfully."},
            status=status.HTTP_200_OK,
        )

    serializer = WorkExperienceSerializer(
        experience,
        data=request.data,
        partial=(request.method == "PATCH"),
    )

    if serializer.is_valid():
        serializer.save()
        return Response(serializer.data)

    return Response(
        serializer.errors,
        status=status.HTTP_400_BAD_REQUEST,
    )
    
# Skills APIs

@api_view(["GET", "POST"])
@permission_classes([IsAuthenticated])
def skill_list_create(request):
    from .models import CandidateProfile, Skill

    profile, created = CandidateProfile.objects.get_or_create(
        user=request.user
    )

    if request.method == "GET":
        skills = Skill.objects.filter(
            profile=profile
        )

        serializer = SkillSerializer(skills, many=True)
        return Response(serializer.data)

    serializer = SkillSerializer(data=request.data)

    if serializer.is_valid():
        try:
            serializer.save(profile=profile)
        except Exception:
            return Response(
                {"name": ["You have already added this skill."]},
                status=status.HTTP_400_BAD_REQUEST,
            )

        return Response(
            serializer.data,
            status=status.HTTP_201_CREATED,
        )

    return Response(
        serializer.errors,
        status=status.HTTP_400_BAD_REQUEST,
    )


@api_view(["PUT", "PATCH", "DELETE"])
@permission_classes([IsAuthenticated])
def skill_detail(request, pk):
    from .models import CandidateProfile, Skill

    try:
        profile = CandidateProfile.objects.get(user=request.user)

        skill = Skill.objects.get(
            pk=pk,
            profile=profile,
        )

    except (CandidateProfile.DoesNotExist, Skill.DoesNotExist):
        return Response(
            {"detail": "Skill not found."},
            status=status.HTTP_404_NOT_FOUND,
        )

    if request.method == "DELETE":
        skill.delete()

        return Response(
            {"message": "Skill deleted successfully."},
            status=status.HTTP_200_OK,
        )

    serializer = SkillSerializer(
        skill,
        data=request.data,
        partial=(request.method == "PATCH"),
    )

    if serializer.is_valid():
        serializer.save()
        return Response(serializer.data)

    return Response(
        serializer.errors,
        status=status.HTTP_400_BAD_REQUEST,
    )
# Resume APIs

@api_view(["GET", "POST"])
@permission_classes([IsAuthenticated])
def resume_list_create(request):
    from .models import CandidateProfile, Resume

    profile, created = CandidateProfile.objects.get_or_create(
        user=request.user
    )

    if request.method == "GET":
        resumes = Resume.objects.filter(
            profile=profile
        ).order_by("-created_at")

        serializer = ResumeSerializer(
            resumes,
            many=True,
            context={"request": request},
        )
        return Response(serializer.data)

    uploaded_file = request.FILES.get("file")

    if not uploaded_file:
        return Response(
            {"file": ["Please upload a resume file."]},
            status=status.HTTP_400_BAD_REQUEST,
        )

    allowed_extensions = [".pdf", ".docx"]
    file_name = uploaded_file.name.lower()

    if not any(file_name.endswith(ext) for ext in allowed_extensions):
        return Response(
            {"file": ["Only PDF and DOCX files are allowed."]},
            status=status.HTTP_400_BAD_REQUEST,
        )

    if uploaded_file.size > 5 * 1024 * 1024:
        return Response(
            {"file": ["File size must not exceed 5 MB."]},
            status=status.HTTP_400_BAD_REQUEST,
        )

    title = request.data.get("title", "").strip()

    if not title:
        return Response(
            {"title": ["Resume title is required."]},
            status=status.HTTP_400_BAD_REQUEST,
        )

    is_primary = request.data.get("is_primary", "false").lower() == "true"

    if is_primary:
        Resume.objects.filter(
            profile=profile,
            is_primary=True,
        ).update(is_primary=False)

    resume = Resume.objects.create(
        profile=profile,
        title=title,
        file=uploaded_file,
        is_primary=is_primary,
    )

    serializer = ResumeSerializer(
        resume,
        context={"request": request},
    )

    return Response(
        serializer.data,
        status=status.HTTP_201_CREATED,
    )


@api_view(["DELETE"])
@permission_classes([IsAuthenticated])
def resume_detail(request, pk):
    from .models import CandidateProfile, Resume

    try:
        profile = CandidateProfile.objects.get(user=request.user)

        resume = Resume.objects.get(
            pk=pk,
            profile=profile,
        )

    except (CandidateProfile.DoesNotExist, Resume.DoesNotExist):
        return Response(
            {"detail": "Resume not found."},
            status=status.HTTP_404_NOT_FOUND,
        )

        resume.file.delete(save=False)
    resume.delete()

    return Response(
        {"message": "Resume deleted successfully."},
        status=status.HTTP_200_OK,
    )