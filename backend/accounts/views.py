
from rest_framework.decorators import api_view
from rest_framework.response import Response
from rest_framework import status
from rest_framework_simplejwt.views import TokenObtainPairView
from rest_framework.permissions import IsAuthenticated
from rest_framework.decorators import permission_classes
from .serializers import (
    CandidateRegistrationSerializer,
    EmailTokenObtainPairSerializer,
    UserProfileSerializer,
    CandidateProfileSerializer,
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