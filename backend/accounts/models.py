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


class Resume(models.Model):
    profile = models.ForeignKey(
        CandidateProfile,
        on_delete=models.CASCADE,
        related_name="resumes",
    )

    title = models.CharField(max_length=200)
    file = models.FileField(upload_to="resumes/")
    is_primary = models.BooleanField(default=False)

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return self.title


class Job(models.Model):
    class JobType(models.TextChoices):
        FULL_TIME = "FULL_TIME", "Full-time"
        PART_TIME = "PART_TIME", "Part-time"
        INTERNSHIP = "INTERNSHIP", "Internship"
        CONTRACT = "CONTRACT", "Contract"
        REMOTE = "REMOTE", "Remote"

    class Status(models.TextChoices):
        DRAFT = "DRAFT", "Draft"
        PUBLISHED = "PUBLISHED", "Published"
        CLOSED = "CLOSED", "Closed"

    recruiter = models.ForeignKey(
        User,
        on_delete=models.CASCADE,
        related_name="posted_jobs",
    )

    title = models.CharField(max_length=200)
    company_name = models.CharField(max_length=200)
    description = models.TextField()
    requirements = models.TextField()
    location = models.CharField(max_length=200)

    job_type = models.CharField(
        max_length=20,
        choices=JobType.choices,
        default=JobType.FULL_TIME,
    )

    salary_min = models.PositiveIntegerField(null=True, blank=True)
    salary_max = models.PositiveIntegerField(null=True, blank=True)

    status = models.CharField(
        max_length=20,
        choices=Status.choices,
        default=Status.DRAFT,
    )

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ["-created_at"]

    def __str__(self):
        return f"{self.title} at {self.company_name}"


class Application(models.Model):
    class Status(models.TextChoices):
        APPLIED = "APPLIED", "Applied"
        UNDER_REVIEW = "UNDER_REVIEW", "Under Review"
        SHORTLISTED = "SHORTLISTED", "Shortlisted"
        INTERVIEW = "INTERVIEW", "Interview"
        SELECTED = "SELECTED", "Selected"
        REJECTED = "REJECTED", "Rejected"

    candidate = models.ForeignKey(
        User,
        on_delete=models.CASCADE,
        related_name="job_applications",
    )

    job = models.ForeignKey(
        Job,
        on_delete=models.CASCADE,
        related_name="applications",
    )

    status = models.CharField(
        max_length=20,
        choices=Status.choices,
        default=Status.APPLIED,
    )

    applied_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ["-applied_at"]
        constraints = [
            models.UniqueConstraint(
                fields=["candidate", "job"],
                name="unique_candidate_job_application",
            )
        ]

    def __str__(self):
        return f"{self.candidate.username} - {self.job.title}"


class ApplicationStatusHistory(models.Model):
    application = models.ForeignKey(
        Application,
        on_delete=models.CASCADE,
        related_name="status_history",
    )

    old_status = models.CharField(
        max_length=20,
        choices=Application.Status.choices,
        blank=True,
    )

    new_status = models.CharField(
        max_length=20,
        choices=Application.Status.choices,
    )

    changed_by = models.ForeignKey(
        User,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="application_status_changes",
    )

    changed_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["changed_at"]

    def __str__(self):
        return (
            f"Application #{self.application.id}: "
            f"{self.old_status} -> {self.new_status}"
        )


class Notification(models.Model):
    class NotificationType(models.TextChoices):
        APPLICATION_STATUS = (
            "APPLICATION_STATUS",
            "Application Status Update",
        )
        NEW_APPLICATION = (
            "NEW_APPLICATION",
            "New Job Application",
        )
        JOB_ALERT = (
            "JOB_ALERT",
            "New Job Alert",
        )

    recipient = models.ForeignKey(
        User,
        on_delete=models.CASCADE,
        related_name="notifications",
    )

    notification_type = models.CharField(
        max_length=30,
        choices=NotificationType.choices,
        default=NotificationType.APPLICATION_STATUS,
    )

    title = models.CharField(max_length=200)
    message = models.TextField()

    application = models.ForeignKey(
        Application,
        on_delete=models.CASCADE,
        null=True,
        blank=True,
        related_name="notifications",
    )

    is_read = models.BooleanField(default=False)

    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["-created_at"]

    def __str__(self):
        return f"{self.recipient.username} - {self.title}"


class SavedJob(models.Model):
    candidate = models.ForeignKey(
        User,
        on_delete=models.CASCADE,
        related_name="saved_jobs",
    )

    job = models.ForeignKey(
        Job,
        on_delete=models.CASCADE,
        related_name="saved_by_candidates",
    )

    saved_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["-saved_at"]
        constraints = [
            models.UniqueConstraint(
                fields=["candidate", "job"],
                name="unique_candidate_saved_job",
            )
        ]

    def __str__(self):
        return f"{self.candidate.username} saved {self.job.title}"


class CompanyProfile(models.Model):
    class CompanySize(models.TextChoices):
        SIZE_1_10 = "1-10", "1-10 employees"
        SIZE_11_50 = "11-50", "11-50 employees"
        SIZE_51_200 = "51-200", "51-200 employees"
        SIZE_201_500 = "201-500", "201-500 employees"
        SIZE_501_1000 = "501-1000", "501-1000 employees"
        SIZE_1000_PLUS = "1000+", "1000+ employees"

    recruiter = models.OneToOneField(
        User,
        on_delete=models.CASCADE,
        related_name="company_profile",
    )

    company_name = models.CharField(max_length=200)
    logo_url = models.URLField(blank=True)
    website = models.URLField(blank=True)
    industry = models.CharField(max_length=150, blank=True)
    company_size = models.CharField(
        max_length=20,
        choices=CompanySize.choices,
        blank=True,
    )
    location = models.CharField(max_length=200, blank=True)
    description = models.TextField(blank=True)
    linkedin_url = models.URLField(blank=True)

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return self.company_name


class JobAlert(models.Model):
    candidate = models.ForeignKey(
        User,
        on_delete=models.CASCADE,
        related_name="job_alerts",
    )

    keywords = models.CharField(
        max_length=200,
        blank=True,
        help_text="Job title or keywords to match.",
    )

    location = models.CharField(max_length=200, blank=True)

    job_type = models.CharField(
        max_length=20,
        choices=Job.JobType.choices,
        blank=True,
    )

    minimum_salary = models.PositiveIntegerField(
        null=True,
        blank=True,
    )

    email_notifications = models.BooleanField(default=True)
    is_active = models.BooleanField(default=True)

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ["-created_at"]

    def __str__(self):
        return f"Job alert for {self.candidate.username}"


class JobAlertMatch(models.Model):
    alert = models.ForeignKey(
        JobAlert,
        on_delete=models.CASCADE,
        related_name="matches",
    )

    job = models.ForeignKey(
        Job,
        on_delete=models.CASCADE,
        related_name="job_alert_matches",
    )

    notification_sent = models.BooleanField(default=False)
    email_sent = models.BooleanField(default=False)

    matched_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["-matched_at"]
        constraints = [
            models.UniqueConstraint(
                fields=["alert", "job"],
                name="unique_job_alert_match",
            )
        ]

    def __str__(self):
        return f"Alert #{self.alert_id} matched Job #{self.job_id}"