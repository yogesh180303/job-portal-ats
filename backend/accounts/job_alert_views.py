from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework import status

from .models import JobAlert
from .serializers import JobAlertSerializer


@api_view(["GET", "POST"])
@permission_classes([IsAuthenticated])
def job_alert_list_create(request):
    if request.user.role != "CANDIDATE":
        return Response(
            {"detail": "Only candidates can manage job alerts."},
            status=status.HTTP_403_FORBIDDEN,
        )

    if request.method == "GET":
        alerts = JobAlert.objects.filter(
            candidate=request.user
        )

        serializer = JobAlertSerializer(
            alerts,
            many=True,
        )

        return Response(serializer.data)

    serializer = JobAlertSerializer(data=request.data)

    if serializer.is_valid():
        serializer.save(candidate=request.user)

        return Response(
            serializer.data,
            status=status.HTTP_201_CREATED,
        )

    return Response(
        serializer.errors,
        status=status.HTTP_400_BAD_REQUEST,
    )


@api_view(["GET", "PUT", "PATCH", "DELETE"])
@permission_classes([IsAuthenticated])
def job_alert_detail(request, pk):
    if request.user.role != "CANDIDATE":
        return Response(
            {"detail": "Only candidates can manage job alerts."},
            status=status.HTTP_403_FORBIDDEN,
        )

    try:
        alert = JobAlert.objects.get(
            pk=pk,
            candidate=request.user,
        )
    except JobAlert.DoesNotExist:
        return Response(
            {"detail": "Job alert not found."},
            status=status.HTTP_404_NOT_FOUND,
        )

    if request.method == "GET":
        serializer = JobAlertSerializer(alert)
        return Response(serializer.data)

    if request.method in ["PUT", "PATCH"]:
        serializer = JobAlertSerializer(
            alert,
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

    if request.method == "DELETE":
        alert.delete()

        return Response(
            {"message": "Job alert deleted successfully."},
            status=status.HTTP_200_OK,
        )