
from rest_framework_simplejwt.serializers import TokenObtainPairSerializer
from django.contrib.auth import get_user_model
from rest_framework import serializers

from .models import (
    CandidateProfile,
    Education,
    WorkExperience,
    Skill,
    Resume,
    Job,
    Application,
    ApplicationStatusHistory,
    Notification,
    SavedJob,
    CompanyProfile,
)


User = get_user_model()


class CandidateRegistrationSerializer(serializers.ModelSerializer):
    password = serializers.CharField(
        write_only=True,
        min_length=8,
        style={"input_type": "password"},
    )

    class Meta:
        model = User
        fields = ["id", "username", "email", "password"]
        read_only_fields = ["id"]

    def create(self, validated_data):
        user = User.objects.create_user(
            username=validated_data["username"],
            email=validated_data["email"],
            password=validated_data["password"],
            role=User.Role.CANDIDATE,
        )
        return user


class EmailTokenObtainPairSerializer(TokenObtainPairSerializer):
    username_field = "email"

    def validate(self, attrs):
        email = attrs.get("email")
        password = attrs.get("password")

        try:
            user = User.objects.get(email__iexact=email)
        except User.DoesNotExist:
            raise serializers.ValidationError(
                {"detail": "Invalid email or password."}
            )

        if not user.check_password(password):
            raise serializers.ValidationError(
                {"detail": "Invalid email or password."}
            )

        if not user.is_active:
            raise serializers.ValidationError(
                {"detail": "This account is inactive."}
            )

        refresh = self.get_token(user)

        return {
            "refresh": str(refresh),
            "access": str(refresh.access_token),
        }


class UserProfileSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ["id", "username", "email", "role"]


class CandidateProfileSerializer(serializers.ModelSerializer):
    class Meta:
        model = CandidateProfile
        fields = [
            "id",
            "full_name",
            "phone",
            "location",
            "professional_summary",
            "skills",
            "created_at",
            "updated_at",
        ]
        read_only_fields = ["id", "created_at", "updated_at"]


class EducationSerializer(serializers.ModelSerializer):
    class Meta:
        model = Education
        fields = [
            "id",
            "degree",
            "institution",
            "field_of_study",
            "start_year",
            "graduation_year",
            "grade",
            "created_at",
            "updated_at",
        ]
        read_only_fields = ["id", "created_at", "updated_at"]


class WorkExperienceSerializer(serializers.ModelSerializer):
    class Meta:
        model = WorkExperience
        fields = [
            "id",
            "job_title",
            "company",
            "employment_type",
            "location",
            "start_date",
            "end_date",
            "currently_working",
            "description",
            "created_at",
            "updated_at",
        ]
        read_only_fields = ["id", "created_at", "updated_at"]


class SkillSerializer(serializers.ModelSerializer):
    class Meta:
        model = Skill
        fields = [
            "id",
            "name",
            "proficiency",
            "created_at",
            "updated_at",
        ]
        read_only_fields = ["id", "created_at", "updated_at"]

    def validate_name(self, value):
        return value.strip()


class ResumeSerializer(serializers.ModelSerializer):
    class Meta:
        model = Resume
        fields = [
            "id",
            "title",
            "file",
            "is_primary",
            "created_at",
            "updated_at",
        ]
        read_only_fields = ["id", "created_at", "updated_at"]


class JobSerializer(serializers.ModelSerializer):
    recruiter_name = serializers.CharField(
        source="recruiter.username",
        read_only=True,
    )

    class Meta:
        model = Job
        fields = [
            "id",
            "recruiter",
            "recruiter_name",
            "title",
            "company_name",
            "description",
            "requirements",
            "location",
            "job_type",
            "salary_min",
            "salary_max",
            "status",
            "created_at",
            "updated_at",
        ]
        read_only_fields = [
            "id",
            "recruiter",
            "recruiter_name",
            "created_at",
            "updated_at",
        ]

    def validate(self, data):
        salary_min = data.get(
            "salary_min",
            getattr(self.instance, "salary_min", None),
        )
        salary_max = data.get(
            "salary_max",
            getattr(self.instance, "salary_max", None),
        )

        if (
            salary_min is not None
            and salary_max is not None
            and salary_min > salary_max
        ):
            raise serializers.ValidationError(
                "Minimum salary cannot be greater than maximum salary."
            )

        return data


class ApplicationSerializer(serializers.ModelSerializer):
    candidate_name = serializers.CharField(
        source="candidate.username",
        read_only=True,
    )

    job_title = serializers.CharField(
        source="job.title",
        read_only=True,
    )

    company_name = serializers.CharField(
        source="job.company_name",
        read_only=True,
    )

    class Meta:
        model = Application
        fields = [
            "id",
            "candidate",
            "candidate_name",
            "job",
            "job_title",
            "company_name",
            "status",
            "applied_at",
            "updated_at",
        ]

        read_only_fields = [
            "id",
            "candidate",
            "candidate_name",
            "job_title",
            "company_name",
            "status",
            "applied_at",
            "updated_at",
        ]


class ApplicationStatusHistorySerializer(serializers.ModelSerializer):
    changed_by_name = serializers.CharField(
        source="changed_by.username",
        read_only=True,
        allow_null=True,
    )

    class Meta:
        model = ApplicationStatusHistory
        fields = [
            "id",
            "old_status",
            "new_status",
            "changed_by",
            "changed_by_name",
            "changed_at",
        ]
        read_only_fields = fields


class NotificationSerializer(serializers.ModelSerializer):
    application_id = serializers.IntegerField(
        source="application.id",
        read_only=True,
        allow_null=True,
    )

    class Meta:
        model = Notification
        fields = [
            "id",
            "notification_type",
            "title",
            "message",
            "application",
            "application_id",
            "is_read",
            "created_at",
        ]

        read_only_fields = [
            "id",
            "notification_type",
            "title",
            "message",
            "application",
            "application_id",
            "created_at",
        ]


class SavedJobSerializer(serializers.ModelSerializer):
    job_details = JobSerializer(
        source="job",
        read_only=True,
    )

    class Meta:
        model = SavedJob
        fields = [
            "id",
            "job",
            "job_details",
            "saved_at",
        ]
        read_only_fields = [
            "id",
            "job_details",
            "saved_at",
        ]


class CompanyProfileSerializer(serializers.ModelSerializer):
    class Meta:
        model = CompanyProfile
        fields = [
            "id",
            "company_name",
            "logo_url",
            "website",
            "industry",
            "company_size",
            "location",
            "description",
            "linkedin_url",
            "created_at",
            "updated_at",
        ]
        read_only_fields = [
            "id",
            "created_at",
            "updated_at",
        ]
