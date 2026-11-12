
from django.utils import timezone
from rest_framework import serializers

from .models import Interview


class InterviewSerializer(serializers.ModelSerializer):
    candidate_name = serializers.SerializerMethodField()
    candidate_email = serializers.EmailField(
        source="application.candidate.email",
        read_only=True,
    )
    job_title = serializers.CharField(
        source="application.job.title",
        read_only=True,
    )
    company_name = serializers.CharField(
        source="application.job.company_name",
        read_only=True,
    )
    recruiter_name = serializers.SerializerMethodField()
    scheduled_by_name = serializers.SerializerMethodField()

    class Meta:
        model = Interview
        fields = [
            "id",
            "application",
            "candidate_name",
            "candidate_email",
            "job_title",
            "company_name",
            "recruiter_name",
            "scheduled_by",
            "scheduled_by_name",
            "title",
            "interview_type",
            "scheduled_at",
            "duration_minutes",
            "meeting_link",
            "location",
            "notes",
            "status",
            "created_at",
            "updated_at",
        ]
        read_only_fields = [
            "id",
            "application",
            "scheduled_by",
            "created_at",
            "updated_at",
        ]

    def get_candidate_name(self, obj):
        candidate = obj.application.candidate
        return candidate.get_full_name() or candidate.username

    def get_recruiter_name(self, obj):
        recruiter = obj.application.job.recruiter

        if recruiter:
            return recruiter.get_full_name() or recruiter.username

        return ""

    def get_scheduled_by_name(self, obj):
        if obj.scheduled_by:
            return (
                obj.scheduled_by.get_full_name()
                or obj.scheduled_by.username
            )

        return ""

    def validate_duration_minutes(self, value):
        if value < 15 or value > 480:
            raise serializers.ValidationError(
                "Interview duration must be between 15 and 480 minutes."
            )

        return value

    def validate(self, attrs):
        interview_type = attrs.get(
            "interview_type",
            getattr(
                self.instance,
                "interview_type",
                Interview.InterviewType.ONLINE,
            ),
        )

        meeting_link = attrs.get(
            "meeting_link",
            getattr(self.instance, "meeting_link", ""),
        )

        location = attrs.get(
            "location",
            getattr(self.instance, "location", ""),
        )

        if interview_type == Interview.InterviewType.ONLINE:
            if not meeting_link:
                raise serializers.ValidationError({
                    "meeting_link": (
                        "A meeting link is required for online interviews."
                    )
                })

        elif interview_type == Interview.InterviewType.IN_PERSON:
            if not location:
                raise serializers.ValidationError({
                    "location": (
                        "A location is required for in-person interviews."
                    )
                })

        scheduled_at = attrs.get("scheduled_at")

        if scheduled_at and scheduled_at <= timezone.now():
            raise serializers.ValidationError({
                "scheduled_at": (
                    "The interview must be scheduled for a future date and time."
                )
            })

        return attrs
