from django.conf import settings
from django.core.mail import send_mail
from django.db import IntegrityError, transaction
from django.db.models.signals import post_save, pre_save
from django.dispatch import receiver

from .models import (
    Application,
    Job,
    JobAlert,
    JobAlertMatch,
    Notification,
)


# --------------------------------------------------
# JOB ALERT MATCHING
# --------------------------------------------------

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


# --------------------------------------------------
# APPLICATION EMAIL HELPERS
# --------------------------------------------------

def send_new_application_email(application_id):
    try:
        application = (
            Application.objects
            .select_related(
                "candidate",
                "job",
                "job__recruiter",
            )
            .get(pk=application_id)
        )

        recruiter = application.job.recruiter

        if not recruiter.email:
            return

        subject = (
            f"New Application Received: {application.job.title}"
        )

        message = (
            f"Hello {recruiter.username},\n\n"
            f"You have received a new application for your job.\n\n"
            f"Job Title: {application.job.title}\n"
            f"Company: {application.job.company_name}\n"
            f"Candidate: {application.candidate.username}\n"
            f"Candidate Email: {application.candidate.email}\n"
            f"Application ID: {application.id}\n"
            f"Applied At: {application.applied_at}\n\n"
            f"Log in to CareerHub to review the application.\n\n"
            f"Regards,\nCareerHub Team"
        )

        send_mail(
            subject=subject,
            message=message,
            from_email=settings.DEFAULT_FROM_EMAIL,
            recipient_list=[recruiter.email],
            fail_silently=False,
        )

    except Exception:
        # Email failure must not interrupt application creation.
        pass


def send_application_status_email(
    application_id,
    old_status,
    new_status,
):
    try:
        application = (
            Application.objects
            .select_related(
                "candidate",
                "job",
            )
            .get(pk=application_id)
        )

        candidate = application.candidate

        if not candidate.email:
            return

        old_status_display = (
            Application.Status(old_status).label
            if old_status
            else "Not available"
        )

        new_status_display = (
            Application.Status(new_status).label
        )

        subject = (
            f"Application Update: {application.job.title}"
        )

        message = (
            f"Hello {candidate.username},\n\n"
            f"Your job application has been updated.\n\n"
            f"Job Title: {application.job.title}\n"
            f"Company: {application.job.company_name}\n"
            f"Previous Status: {old_status_display}\n"
            f"New Status: {new_status_display}\n"
            f"Application ID: {application.id}\n\n"
            f"Log in to CareerHub to view your application details.\n\n"
            f"Regards,\nCareerHub Team"
        )

        send_mail(
            subject=subject,
            message=message,
            from_email=settings.DEFAULT_FROM_EMAIL,
            recipient_list=[candidate.email],
            fail_silently=False,
        )

    except Exception:
        # Email failure must not interrupt status updates.
        pass


# --------------------------------------------------
# APPLICATION STATUS CHANGE DETECTION
# --------------------------------------------------

@receiver(pre_save, sender=Application)
def remember_previous_application_status(
    sender,
    instance,
    **kwargs,
):
    if not instance.pk:
        instance._previous_status = None
        return

    try:
        previous_application = Application.objects.only(
            "status"
        ).get(pk=instance.pk)

        instance._previous_status = previous_application.status

    except Application.DoesNotExist:
        instance._previous_status = None


# --------------------------------------------------
# APPLICATION NOTIFICATIONS
# --------------------------------------------------

@receiver(post_save, sender=Application)
def handle_application_notifications(
    sender,
    instance,
    created,
    **kwargs,
):
    # A new application has been submitted.
    if created:
        recruiter = instance.job.recruiter

        Notification.objects.create(
            recipient=recruiter,
            notification_type=(
                Notification.NotificationType.NEW_APPLICATION
            ),
            title="New Job Application Received",
            message=(
                f"{instance.candidate.username} has applied "
                f"for your job: {instance.job.title}. "
                f"Application ID: {instance.id}."
            ),
            application=instance,
        )

        # Send the recruiter's email after the database commits.
        transaction.on_commit(
            lambda application_id=instance.pk: (
                send_new_application_email(application_id)
            )
        )

        return

    # An existing application's status has changed.
    old_status = getattr(
        instance,
        "_previous_status",
        None,
    )

    new_status = instance.status

    if old_status and old_status != new_status:
        # The existing application view already creates the
        # candidate's in-app status notification.

        # Send the status update email after the database commits.
        transaction.on_commit(
            lambda application_id=instance.pk,
            previous=old_status,
            current=new_status: (
                send_application_status_email(
                    application_id,
                    previous,
                    current,
                )
            )
        )