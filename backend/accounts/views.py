
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
    JobSerializer,
    ApplicationSerializer,
    NotificationSerializer,
    SavedJobSerializer,
)

from .models import Notification, SavedJob
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


# Education APIs

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
        skills = Skill.objects.filter(profile=profile)

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


# Job Management APIs

@api_view(["GET", "POST"])
@permission_classes([IsAuthenticated])
def job_list_create(request):
    from .models import Job

    if request.method == "GET":
        if request.user.role == "ADMIN":
            jobs = Job.objects.all()

        elif request.user.role == "RECRUITER":
            from django.db.models import Q

            jobs = Job.objects.filter(
                Q(status=Job.Status.PUBLISHED)
                | Q(recruiter=request.user)
            )

        else:
            jobs = Job.objects.filter(
                status=Job.Status.PUBLISHED
            )

        serializer = JobSerializer(jobs, many=True)
        return Response(serializer.data)

    if request.user.role not in ["RECRUITER", "ADMIN"]:
        return Response(
            {"detail": "Only recruiters and admins can create jobs."},
            status=status.HTTP_403_FORBIDDEN,
        )

    serializer = JobSerializer(data=request.data)

    if serializer.is_valid():
        serializer.save(recruiter=request.user)
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
def job_detail(request, pk):
    from .models import Job

    try:
        job = Job.objects.get(pk=pk)
    except Job.DoesNotExist:
        return Response(
            {"detail": "Job not found."},
            status=status.HTTP_404_NOT_FOUND,
        )

    is_admin = request.user.role == "ADMIN"
    is_owner = job.recruiter_id == request.user.id

    if not is_admin and not is_owner:
        if (
            request.user.role != "CANDIDATE"
            or job.status != Job.Status.PUBLISHED
        ):
            return Response(
                {"detail": "Job not found."},
                status=status.HTTP_404_NOT_FOUND,
            )

    if request.method == "GET":
        serializer = JobSerializer(job)
        return Response(serializer.data)

    if not is_admin and not is_owner:
        return Response(
            {"detail": "You cannot modify this job."},
            status=status.HTTP_403_FORBIDDEN,
        )

    if request.method in ["PUT", "PATCH"]:
        serializer = JobSerializer(
            job,
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
        job.delete()
        return Response(
            {"message": "Job deleted successfully."},
            status=status.HTTP_200_OK,
        )


# Job Application APIs

@api_view(["GET", "POST"])
@permission_classes([IsAuthenticated])
def application_list_create(request):
    from .models import Application, ApplicationStatusHistory, Job

    if request.method == "GET":
        if request.user.role == "CANDIDATE":
            applications = Application.objects.filter(
                candidate=request.user
            )

        elif request.user.role == "RECRUITER":
            applications = Application.objects.filter(
                job__recruiter=request.user
            )

            # Phase 10: Filter recruiter applications by status.
            application_status = request.query_params.get("status")

            if application_status:
                valid_statuses = [
                    choice[0]
                    for choice in Application.Status.choices
                ]

                if application_status not in valid_statuses:
                    return Response(
                        {
                            "detail": "Invalid application status.",
                            "valid_statuses": valid_statuses,
                        },
                        status=status.HTTP_400_BAD_REQUEST,
                    )

                applications = applications.filter(
                    status=application_status
                )

        elif request.user.role == "ADMIN":
            applications = Application.objects.all()

        else:
            return Response(
                {"detail": "You do not have permission."},
                status=status.HTTP_403_FORBIDDEN,
            )

        serializer = ApplicationSerializer(
            applications,
            many=True,
        )
        return Response(serializer.data)

    # Only candidates can apply for jobs.
    if request.user.role != "CANDIDATE":
        return Response(
            {"detail": "Only candidates can apply for jobs."},
            status=status.HTTP_403_FORBIDDEN,
        )

    job_id = request.data.get("job")

    if not job_id:
        return Response(
            {"job": ["Job ID is required."]},
            status=status.HTTP_400_BAD_REQUEST,
        )

    try:
        job = Job.objects.get(
            pk=job_id,
            status=Job.Status.PUBLISHED,
        )
    except (Job.DoesNotExist, ValueError, TypeError):
        return Response(
            {"detail": "Published job not found."},
            status=status.HTTP_404_NOT_FOUND,
        )

    application, created = Application.objects.get_or_create(
        candidate=request.user,
        job=job,
    )

    if not created:
        return Response(
            {"detail": "You have already applied for this job."},
            status=status.HTTP_400_BAD_REQUEST,
        )

    ApplicationStatusHistory.objects.create(
        application=application,
        old_status="",
        new_status=application.status,
        changed_by=request.user,
    )

    serializer = ApplicationSerializer(application)

    return Response(
        serializer.data,
        status=status.HTTP_201_CREATED,
    )



@api_view(["GET", "PATCH", "DELETE"])
@permission_classes([IsAuthenticated])
def application_detail(request, pk):
    from .models import (
        Application,
        ApplicationStatusHistory,
        Notification,
    )

    try:
        application = Application.objects.get(pk=pk)
    except Application.DoesNotExist:
        return Response(
            {"detail": "Application not found."},
            status=status.HTTP_404_NOT_FOUND,
        )

    is_candidate = (
        request.user.role == "CANDIDATE"
        and application.candidate_id == request.user.id
    )

    is_recruiter = (
        request.user.role == "RECRUITER"
        and application.job.recruiter_id == request.user.id
    )

    is_admin = request.user.role == "ADMIN"

    if request.method == "GET":
        if not (is_candidate or is_recruiter or is_admin):
            return Response(
                {"detail": "Application not found."},
                status=status.HTTP_404_NOT_FOUND,
            )

        serializer = ApplicationSerializer(application)
        return Response(serializer.data)

    if request.method == "DELETE":
        if not is_candidate:
            return Response(
                {"detail": "You cannot withdraw this application."},
                status=status.HTTP_403_FORBIDDEN,
            )

        application.delete()

        return Response(
            {"message": "Application withdrawn successfully."},
            status=status.HTTP_200_OK,
        )

    if not (is_recruiter or is_admin):
        return Response(
            {"detail": "You cannot update this application."},
            status=status.HTTP_403_FORBIDDEN,
        )

    new_status = request.data.get("status")

    valid_statuses = [
        choice[0]
        for choice in Application.Status.choices
    ]

    if new_status not in valid_statuses:
        return Response(
            {"status": ["Invalid application status."]},
            status=status.HTTP_400_BAD_REQUEST,
        )

    old_status = application.status

    if old_status != new_status:
        ApplicationStatusHistory.objects.create(
            application=application,
            old_status=old_status,
            new_status=new_status,
            changed_by=request.user,
        )

        application.status = new_status
        application.save(update_fields=["status", "updated_at"])

        status_display = application.get_status_display()

        Notification.objects.create(
            recipient=application.candidate,
            notification_type=(
                Notification.NotificationType.APPLICATION_STATUS
            ),
            title="Application Status Updated",
            message=(
                f"Your application for "
                f"{application.job.title} at "
                f"{application.job.company_name} "
                f"has been updated to {status_display}."
            ),
            application=application,
        )

    serializer = ApplicationSerializer(application)

    return Response(serializer.data)



# Application Timeline API

@api_view(["GET"])
@permission_classes([IsAuthenticated])
def application_timeline(request, pk):
    from .models import Application, ApplicationStatusHistory
    from .serializers import ApplicationStatusHistorySerializer

    try:
        application = Application.objects.get(pk=pk)
    except Application.DoesNotExist:
        return Response(
            {"detail": "Application not found."},
            status=status.HTTP_404_NOT_FOUND,
        )

    is_candidate = (
        request.user.role == "CANDIDATE"
        and application.candidate_id == request.user.id
    )

    is_recruiter = (
        request.user.role == "RECRUITER"
        and application.job.recruiter_id == request.user.id
    )

    is_admin = request.user.role == "ADMIN"

    if not (is_candidate or is_recruiter or is_admin):
        return Response(
            {"detail": "Application not found."},
            status=status.HTTP_404_NOT_FOUND,
        )

    history = ApplicationStatusHistory.objects.filter(
        application=application
    ).select_related("changed_by")

    serializer = ApplicationStatusHistorySerializer(
        history,
        many=True,
    )

    return Response(serializer.data)


# ATS Resume Evaluation API

@api_view(["GET"])
@permission_classes([IsAuthenticated])
def application_ats_evaluation(request, pk):
    from .models import Application, Resume
    from .resume_parser import extract_resume_text
    from .ats_evaluator import evaluate_resume

    if request.user.role not in ["RECRUITER", "ADMIN"]:
        return Response(
            {"detail": "Only recruiters and admins can evaluate resumes."},
            status=status.HTTP_403_FORBIDDEN,
        )

    try:
        application = Application.objects.select_related(
            "candidate",
            "job",
        ).get(pk=pk)

    except Application.DoesNotExist:
        return Response(
            {"detail": "Application not found."},
            status=status.HTTP_404_NOT_FOUND,
        )

    if (
        request.user.role == "RECRUITER"
        and application.job.recruiter_id != request.user.id
    ):
        return Response(
            {"detail": "Application not found."},
            status=status.HTTP_404_NOT_FOUND,
        )

    resume = Resume.objects.filter(
        profile__user=application.candidate,
        is_primary=True,
    ).first()

    if not resume:
        resume = Resume.objects.filter(
            profile__user=application.candidate,
        ).order_by("-created_at").first()

    if not resume:
        return Response(
            {"detail": "The candidate has not uploaded a resume."},
            status=status.HTTP_404_NOT_FOUND,
        )

    try:
        resume_text = extract_resume_text(resume.file)

        evaluation = evaluate_resume(
            resume_text,
            application.job,
        )

    except ValueError as error:
        return Response(
            {"detail": str(error)},
            status=status.HTTP_400_BAD_REQUEST,
        )

    return Response({
        "application_id": application.id,
        "candidate_username": application.candidate.username,
        "job_title": application.job.title,
        "company_name": application.job.company_name,
        "resume_title": resume.title,
        "evaluation": evaluation,
        "message": (
            "This score represents technical skill matching only. "
            "It is not an automatic hiring decision."
        ),
    })


# Phase 11: Notification APIs

@api_view(["GET"])
@permission_classes([IsAuthenticated])
def notification_list(request):
    # Only candidates can access their notifications.
    if request.user.role != "CANDIDATE":
        return Response(
            {"detail": "Only candidates can access notifications."},
            status=status.HTTP_403_FORBIDDEN,
        )

    notifications = Notification.objects.filter(
        recipient=request.user
    )

    serializer = NotificationSerializer(
        notifications,
        many=True,
    )

    unread_count = notifications.filter(
        is_read=False
    ).count()

    return Response({
        "unread_count": unread_count,
        "total_count": notifications.count(),
        "notifications": serializer.data,
    })


@api_view(["PATCH"])
@permission_classes([IsAuthenticated])
def notification_detail(request, pk):
    # Only candidates can mark notifications as read.
    if request.user.role != "CANDIDATE":
        return Response(
            {"detail": "Only candidates can update notifications."},
            status=status.HTTP_403_FORBIDDEN,
        )

    try:
        notification = Notification.objects.get(
            pk=pk,
            recipient=request.user,
        )
    except Notification.DoesNotExist:
        return Response(
            {"detail": "Notification not found."},
            status=status.HTTP_404_NOT_FOUND,
        )

    notification.is_read = True
    notification.save(update_fields=["is_read"])

    serializer = NotificationSerializer(notification)

    return Response({
        "message": "Notification marked as read.",
        "notification": serializer.data,
    })
    
    
# Phase 12: Saved Jobs APIs

@api_view(["GET", "POST"])
@permission_classes([IsAuthenticated])
def saved_job_list_create(request):
    # Only candidates can manage saved jobs.
    if request.user.role != "CANDIDATE":
        return Response(
            {"detail": "Only candidates can manage saved jobs."},
            status=status.HTTP_403_FORBIDDEN,
        )

    if request.method == "GET":
        saved_jobs = SavedJob.objects.filter(
            candidate=request.user
        ).select_related("job", "job__recruiter")

        serializer = SavedJobSerializer(
            saved_jobs,
            many=True,
        )

        return Response(serializer.data)

    # POST: Save a job.
    job_id = request.data.get("job")

    if not job_id:
        return Response(
            {"job": ["Job ID is required."]},
            status=status.HTTP_400_BAD_REQUEST,
        )

    from .models import Job

    try:
        job = Job.objects.get(
            pk=job_id,
            status=Job.Status.PUBLISHED,
        )
    except (Job.DoesNotExist, ValueError, TypeError):
        return Response(
            {"detail": "Published job not found."},
            status=status.HTTP_404_NOT_FOUND,
        )

    saved_job, created = SavedJob.objects.get_or_create(
        candidate=request.user,
        job=job,
    )

    if not created:
        return Response(
            {"detail": "You have already saved this job."},
            status=status.HTTP_400_BAD_REQUEST,
        )

    serializer = SavedJobSerializer(saved_job)

    return Response(
        {
            "message": "Job saved successfully.",
            "saved_job": serializer.data,
        },
        status=status.HTTP_201_CREATED,
    )


@api_view(["DELETE"])
@permission_classes([IsAuthenticated])
def saved_job_detail(request, pk):
    # Only candidates can remove saved jobs.
    if request.user.role != "CANDIDATE":
        return Response(
            {"detail": "Only candidates can remove saved jobs."},
            status=status.HTTP_403_FORBIDDEN,
        )

    try:
        saved_job = SavedJob.objects.get(
            pk=pk,
            candidate=request.user,
        )
    except SavedJob.DoesNotExist:
        return Response(
            {"detail": "Saved job not found."},
            status=status.HTTP_404_NOT_FOUND,
        )

    saved_job.delete()

    return Response(
        {"message": "Saved job removed successfully."},
        status=status.HTTP_200_OK,
    )


