from django.conf import settings
from django.core.mail import send_mail
from django.db import IntegrityError, transaction
from django.db.models.signals import post_save
from django.dispatch import receiver

from .models import Job, JobAlert, JobAlertMatch, Notification


def job_matches_alert(job, alert):
    # Match keywords against the job title, description and requirements.
    if alert.keywords:
        searchable_text = " ".join(
            [
                job.title,
                job.description,
                job.requirements,
            ]
        ).lower()

        keywords = alert.keywords.lower().split()

        if not any(keyword in searchable_text for keyword in keywords):
            return False

    # Match location.
    if alert.location:
        if alert.location.lower() not in job.location.lower():
            return False

    # Match employment type.
    if alert.job_type and alert.job_type != job.job_type:
        return False

    # Match minimum salary.
    if alert.minimum_salary is not None:
        available_salary = (
            job.salary_max
            if job.salary_max is not None
            else job.salary_min
        )

        if available_salary is None:
            return False

        if available_salary < alert.minimum_salary:
            return False

    return True


def process_job_alerts(job):
    if job.status != Job.Status.PUBLISHED:
        return

    alerts = JobAlert.objects.filter(
        is_active=True,
        candidate__role="CANDIDATE",
    ).select_related("candidate")

    for alert in alerts:
        if not job_matches_alert(job, alert):
            continue

        try:
            with transaction.atomic():
                match = JobAlertMatch.objects.create(
                    alert=alert,
                    job=job,
                )

                Notification.objects.create(
                    recipient=alert.candidate,
                    notification_type=(
                        Notification.NotificationType.JOB_ALERT
                    ),
                    title="New job matching your alert",
                    message=(
                        f"A new job matches your alert: "
                        f"{job.title} at {job.company_name}. "
                        f"Location: {job.location}. "
                        f"Job ID: {job.id}."
                    ),
                )

                # Record successful in-app notification creation.
                match.notification_sent = True
                match.save(update_fields=["notification_sent"])

        except IntegrityError:
            # This alert has already been processed for this job.
            continue

        # Send email only when the candidate has enabled it.
        if alert.email_notifications and alert.candidate.email:
            email_subject = f"New Job Alert: {job.title}"

            email_message = (
                f"Hello {alert.candidate.username},\n\n"
                f"A new job matches your job alert!\n\n"
                f"Job Title: {job.title}\n"
                f"Company: {job.company_name}\n"
                f"Location: {job.location}\n"
                f"Job Type: {job.get_job_type_display()}\n"
                f"Salary: {job.salary_min or 'Not specified'}"
                f" - {job.salary_max or 'Not specified'}\n\n"
                f"Description:\n{job.description}\n\n"
                f"Job ID: {job.id}\n\n"
                f"Visit CareerHub to view the job and apply.\n\n"
                f"Regards,\nCareerHub Team"
            )

            try:
                sent_count = send_mail(
                    subject=email_subject,
                    message=email_message,
                    from_email=settings.DEFAULT_FROM_EMAIL,
                    recipient_list=[alert.candidate.email],
                    fail_silently=False,
                )

                if sent_count:
                    JobAlertMatch.objects.filter(
                        pk=match.pk
                    ).update(email_sent=True)

            except Exception:
                # Email failure must not interrupt job publishing.
                pass


@receiver(post_save, sender=Job)
def trigger_job_alerts(sender, instance, **kwargs):
    if instance.status == Job.Status.PUBLISHED:
        process_job_alerts(instance)