
from rest_framework import serializers

from .models import InterviewFeedback


class InterviewFeedbackSerializer(serializers.ModelSerializer):
    submitted_by_name = serializers.SerializerMethodField()
    candidate_name = serializers.CharField(
        source="interview.application.candidate.username",
        read_only=True,
    )
    job_title = serializers.CharField(
        source="interview.application.job.title",
        read_only=True,
    )

    class Meta:
        model = InterviewFeedback
        fields = [
            "id",
            "interview",
            "candidate_name",
            "job_title",
            "submitted_by",
            "submitted_by_name",
            "technical_skills",
            "communication",
            "problem_solving",
            "overall_rating",
            "strengths",
            "weaknesses",
            "comments",
            "recommendation",
            "created_at",
            "updated_at",
        ]
        read_only_fields = [
            "id",
            "interview",
            "submitted_by",
            "submitted_by_name",
            "created_at",
            "updated_at",
        ]

    def get_submitted_by_name(self, obj):
        if obj.submitted_by:
            return (
                obj.submitted_by.get_full_name()
                or obj.submitted_by.username
            )
        return ""

    def validate(self, attrs):
        rating_fields = [
            "technical_skills",
            "communication",
            "problem_solving",
            "overall_rating",
        ]

        for field in rating_fields:
            value = attrs.get(
                field,
                getattr(self.instance, field, None),
            )

            if value is not None and not 1 <= value <= 5:
                raise serializers.ValidationError({
                    field: "Rating must be between 1 and 5."
                })

        return attrs
