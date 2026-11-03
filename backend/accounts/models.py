
from django.contrib.auth.models import AbstractUser
from django.db import models


class User(AbstractUser):
    class Role(models.TextChoices):
        CANDIDATE = "CANDIDATE", "Candidate"
        RECRUITER = "RECRUITER", "Recruiter"
        ADMIN = "ADMIN", "Admin"

    email = models.EmailField(unique=True)
    role = models.CharField(
        max_length=20,
        choices=Role.choices,
        default=Role.CANDIDATE,
    )

    def __str__(self):
        return f"{self.username} ({self.role})"


class CandidateProfile(models.Model):
    user = models.OneToOneField(
        User,
        on_delete=models.CASCADE,
        related_name="candidate_profile",
    )

    full_name = models.CharField(max_length=150, blank=True)
    phone = models.CharField(max_length=20, blank=True)
    location = models.CharField(max_length=150, blank=True)
    professional_summary = models.TextField(blank=True)
    skills = models.TextField(blank=True)

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"{self.full_name or self.user.username}'s Profile"


class Education(models.Model):
    profile = models.ForeignKey(
        CandidateProfile,
        on_delete=models.CASCADE,
        related_name="educations",
    )

    degree = models.CharField(max_length=150)
    institution = models.CharField(max_length=200)
    field_of_study = models.CharField(max_length=150, blank=True)

    start_year = models.PositiveIntegerField()
    graduation_year = models.PositiveIntegerField()
    grade = models.CharField(max_length=50, blank=True)

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"{self.degree} - {self.institution}"


class WorkExperience(models.Model):
    class EmploymentType(models.TextChoices):
        FULL_TIME = "FULL_TIME", "Full-time"
        PART_TIME = "PART_TIME", "Part-time"
        INTERNSHIP = "INTERNSHIP", "Internship"
        CONTRACT = "CONTRACT", "Contract"
        FREELANCE = "FREELANCE", "Freelance"

    profile = models.ForeignKey(
        CandidateProfile,
        on_delete=models.CASCADE,
        related_name="work_experiences",
    )

    job_title = models.CharField(max_length=150)
    company = models.CharField(max_length=200)

    employment_type = models.CharField(
        max_length=20,
        choices=EmploymentType.choices,
        default=EmploymentType.FULL_TIME,
    )

    location = models.CharField(max_length=150, blank=True)

    start_date = models.DateField()
    end_date = models.DateField(null=True, blank=True)

    currently_working = models.BooleanField(default=False)

    description = models.TextField(blank=True)

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"{self.job_title} at {self.company}"


class Skill(models.Model):
    class Proficiency(models.TextChoices):
        BEGINNER = "BEGINNER", "Beginner"
        INTERMEDIATE = "INTERMEDIATE", "Intermediate"
        ADVANCED = "ADVANCED", "Advanced"
        EXPERT = "EXPERT", "Expert"

    profile = models.ForeignKey(
        CandidateProfile,
        on_delete=models.CASCADE,
        related_name="candidate_skills",
    )

    name = models.CharField(max_length=100)

    proficiency = models.CharField(
        max_length=20,
        choices=Proficiency.choices,
        default=Proficiency.BEGINNER,
    )

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        unique_together = ("profile", "name")
        ordering = ["name"]

    def __str__(self):
        return f"{self.name} ({self.proficiency})"
