from datetime import timedelta

from django.core.management.base import BaseCommand
from django.utils import timezone

from accounts.models import Interview, Notification


class Command(BaseCommand):
    help = "Send 24-hour and 1-hour reminders for upcoming interviews."

    def handle(self, *args, **options):
        now = timezone.now()
        reminders = [
            {
                "field": "reminder_24h_sent",
                "start": now + timedelta(hours=23),
                "end": now + timedelta(hours=24),
                "label": "24-hour",
            },
            {
                "field": "reminder_1h_sent",
                "start": now,
                "end": now + timedelta(hours=1),
                "label": "1-hour",
            },
        ]

        sent_count = 0

        for reminder in reminders:
            interviews = Interview.objects.filter(
                status="SCHEDULED",
                scheduled_at__gte=reminder["start"],
                scheduled_at__lt=reminder["end"],
                **{reminder["field"]: False},
            ).select_related(
                "application__candidate",
                "application__job",
            )

            for interview in interviews:
                candidate = interview.application.candidate
                interview_time = timezone.localtime(
                    interview.scheduled_at
                ).strftime("%d %b %Y, %I:%M %p")

                Notification.objects.create(
                    recipient=candidate,
                    notification_type="INTERVIEW_UPDATE",
                    title=f"Interview reminder: {reminder['label']} before",
                    message=(
                        f"Reminder: Your interview for "
                        f"{interview.application.job.title} is scheduled "
                        f"for {interview_time}."
                    ),
                    application=interview.application,
                )

                setattr(interview, reminder["field"], True)
                interview.save(update_fields=[reminder["field"]])

                sent_count += 1
                self.stdout.write(
                    self.style.SUCCESS(
                        f"Sent {reminder['label']} reminder "
                        f"for interview #{interview.id}"
                    )
                )

        self.stdout.write(
            self.style.SUCCESS(
                f"Finished. Total reminders sent: {sent_count}"
            )
        )