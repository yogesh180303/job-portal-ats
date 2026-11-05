import tempfile
from io import BytesIO
from datetime import date
from types import SimpleNamespace

from django.core.files.uploadedfile import SimpleUploadedFile
from django.test import override_settings, SimpleTestCase

from docx import Document

from rest_framework import status
from rest_framework.test import APITestCase

from .models import User, CandidateProfile, Resume
from .ats_evaluator import (
    evaluate_resume,
    calculate_experience_years,
    calculate_education_relevance,
)


class ResumeParsingAPITests(APITestCase):
    def setUp(self):
        self.temp_media = tempfile.TemporaryDirectory()

        self.media_settings = override_settings(
            MEDIA_ROOT=self.temp_media.name
        )
        self.media_settings.enable()

        self.addCleanup(self.media_settings.disable)
        self.addCleanup(self.temp_media.cleanup)

        self.candidate = User.objects.create_user(
            username="resume_candidate",
            email="resume_candidate@example.com",
            password="TestPassword123!",
            role=User.Role.CANDIDATE,
        )

        self.profile = CandidateProfile.objects.create(
            user=self.candidate,
            full_name="Test Candidate",
        )

        self.other_candidate = User.objects.create_user(
            username="other_candidate",
            email="other_candidate@example.com",
            password="TestPassword123!",
            role=User.Role.CANDIDATE,
        )

        self.other_profile = CandidateProfile.objects.create(
            user=self.other_candidate,
            full_name="Other Candidate",
        )

        self.resume = self.create_resume(
            self.profile,
            "test_resume.docx",
            self.create_valid_docx(),
        )

    def create_valid_docx(self):
        """Create a sample DOCX resume in memory."""

        document = Document()

        document.add_paragraph("Rahul Sharma")
        document.add_paragraph("Full Stack Developer")
        document.add_paragraph(
            "9876543210 rahul@example.com Pune, India"
        )

        document.add_paragraph("PROFESSIONAL SUMMARY")
        document.add_paragraph(
            "Full Stack Developer skilled in Python and Django."
        )

        document.add_paragraph("EDUCATION")
        document.add_paragraph(
            "Master of Computer Applications - Test University"
        )

        document.add_paragraph("SKILLS")
        document.add_paragraph(
            "Python, Django, React, JavaScript"
        )

        document.add_paragraph("PROJECTS")
        document.add_paragraph(
            "Career Portal - Developed a job application platform."
        )

        file_buffer = BytesIO()
        document.save(file_buffer)
        file_buffer.seek(0)

        return file_buffer.read()

    def create_resume(self, profile, filename, content):
        """Create a resume attached to a candidate profile."""

        uploaded_file = SimpleUploadedFile(
            filename,
            content,
            content_type=(
                "application/vnd.openxmlformats-officedocument."
                "wordprocessingml.document"
                if filename.endswith(".docx")
                else "text/plain"
            ),
        )

        return Resume.objects.create(
            profile=profile,
            title="Test Resume",
            file=uploaded_file,
        )

    def test_authenticated_candidate_can_parse_own_resume(self):
        self.client.force_authenticate(user=self.candidate)

        response = self.client.post(
            f"/api/resumes/{self.resume.id}/parse/",
            {},
            format="json",
        )

        self.assertEqual(
            response.status_code,
            status.HTTP_200_OK,
        )

        parsed_data = response.data["parsed_data"]

        self.assertEqual(
            parsed_data["candidate"]["full_name"],
            "Rahul Sharma",
        )

        self.assertEqual(
            parsed_data["candidate"]["email"],
            "rahul@example.com",
        )

        self.assertEqual(
            parsed_data["candidate"]["location"],
            "Pune, India",
        )

        self.assertIn("Python", parsed_data["skills"])
        self.assertIn("Django", parsed_data["skills"])

        self.assertTrue(parsed_data["education"])
        self.assertTrue(parsed_data["projects"])
        self.assertTrue(parsed_data["summary"])

    def test_unauthenticated_user_cannot_parse_resume(self):
        response = self.client.post(
            f"/api/resumes/{self.resume.id}/parse/",
            {},
            format="json",
        )

        self.assertEqual(
            response.status_code,
            status.HTTP_401_UNAUTHORIZED,
        )

    def test_candidate_cannot_parse_another_candidates_resume(self):
        self.client.force_authenticate(
            user=self.other_candidate
        )

        response = self.client.post(
            f"/api/resumes/{self.resume.id}/parse/",
            {},
            format="json",
        )

        self.assertEqual(
            response.status_code,
            status.HTTP_404_NOT_FOUND,
        )

    def test_invalid_resume_file_returns_bad_request(self):
        invalid_resume = self.create_resume(
            self.profile,
            "invalid_resume.txt",
            b"This is not a supported resume file.",
        )

        self.client.force_authenticate(user=self.candidate)

        response = self.client.post(
            f"/api/resumes/{invalid_resume.id}/parse/",
            {},
            format="json",
        )

        self.assertEqual(
            response.status_code,
            status.HTTP_400_BAD_REQUEST,
        )

        self.assertIn("detail", response.data)

    def test_candidate_without_profile_cannot_parse_resume(self):
        user_without_profile = User.objects.create_user(
            username="no_profile_candidate",
            email="no_profile@example.com",
            password="TestPassword123!",
            role=User.Role.CANDIDATE,
        )

        self.client.force_authenticate(
            user=user_without_profile
        )

        response = self.client.post(
            f"/api/resumes/{self.resume.id}/parse/",
            {},
            format="json",
        )

        self.assertEqual(
            response.status_code,
            status.HTTP_404_NOT_FOUND,
        )


class FakeRelatedManager:
    """Provide a simple replacement for a Django related manager."""

    def __init__(self, items=None):
        self.items = items or []

    def all(self):
        return self.items


class ATSScoringTests(SimpleTestCase):
    def setUp(self):
        self.job = SimpleNamespace(
            title="Python Developer",
            description="Develop applications using Python and Django.",
            requirements="Python, Django and REST APIs required.",
        )

    def create_profile(
        self,
        experiences=None,
        educations=None,
        skills=None,
    ):
        return SimpleNamespace(
            work_experiences=FakeRelatedManager(experiences),
            educations=FakeRelatedManager(educations),
            candidate_skills=FakeRelatedManager(skills),
            skills="",
            professional_summary="",
        )

    def test_skill_matching_and_legacy_response_fields(self):
        result = evaluate_resume(
            "Python developer with Django and REST APIs experience.",
            self.job,
        )

        self.assertIn("Python", result["resume_skills"])
        self.assertIn("Django", result["resume_skills"])

        self.assertIn("Python", result["matched_skills"])
        self.assertIn("Django", result["matched_skills"])

        self.assertEqual(
            result["total_required_skills"],
            len(result["required_skills"]),
        )

        self.assertEqual(
            result["matched_count"],
            len(result["matched_skills"]),
        )

        self.assertEqual(
            result["missing_count"],
            len(result["missing_skills"]),
        )

        self.assertIn("ats_score", result)
        self.assertIn("score_breakdown", result)

    def test_education_is_not_scored_without_job_requirement(self):
        education = SimpleNamespace(
            degree="Master of Computer Applications",
            field_of_study="Computer Science",
        )

        result = calculate_education_relevance(
            self.job,
            [education],
        )

        self.assertIsNone(result)

    def test_relevant_education_matches_explicit_requirement(self):
        education_job = SimpleNamespace(
            title="Software Developer",
            description=(
                "We are looking for a developer."
            ),
            requirements=(
                "Bachelor's degree in Computer Science required."
            ),
        )

        education = SimpleNamespace(
            degree="Bachelor's Degree",
            field_of_study="Computer Science",
        )

        result = calculate_education_relevance(
            education_job,
            [education],
        )

        self.assertEqual(result, 100.0)

    def test_overlapping_experience_periods_are_not_double_counted(self):
        experiences = [
            SimpleNamespace(
                start_date=date(2020, 1, 1),
                end_date=date(2021, 1, 1),
                currently_working=False,
            ),
            SimpleNamespace(
                start_date=date(2020, 6, 1),
                end_date=date(2022, 1, 1),
                currently_working=False,
            ),
        ]

        result = calculate_experience_years(experiences)

        self.assertEqual(result, 2.0)

    def test_weighted_score_excludes_unavailable_categories(self):
        profile = self.create_profile()

        result = evaluate_resume(
            "Python developer with Django experience.",
            self.job,
            profile,
        )

        breakdown = result["score_breakdown"]

        self.assertTrue(
            breakdown["technical_skills"]["available"]
        )

        self.assertTrue(
            breakdown["keyword_matching"]["available"]
        )

        self.assertFalse(
            breakdown["work_experience"]["available"]
        )

        self.assertFalse(
            breakdown["education"]["available"]
        )

        available_categories = [
            category
            for category in breakdown.values()
            if category["available"]
        ]

        total_weight = sum(
            category["weight"]
            for category in available_categories
        )

        expected_score = round(
            sum(
                category["weight"] * category["score"]
                for category in available_categories
            ) / total_weight,
            2,
        )

        self.assertEqual(
            result["ats_score"],
            expected_score,
        )