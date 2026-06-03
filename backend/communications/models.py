from django.db import models
from django.utils import timezone


class CommunicationTemplate(models.Model):
    TEMPLATE_TYPE_CHOICES = [
        ("email", "Email"),
        ("sms", "SMS"),
        ("whatsapp", "WhatsApp"),
        ("notice", "Notice"),
        ("press_release", "Press Release"),
    ]

    name = models.CharField(max_length=150, unique=True)
    template_type = models.CharField(max_length=20, choices=TEMPLATE_TYPE_CHOICES)
    subject = models.CharField(max_length=255, blank=True)
    body = models.TextField()
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ["name"]

    def __str__(self):
        return f"{self.name} ({self.template_type})"


class Communication(models.Model):
    STATUS_CHOICES = [
        ("draft", "Draft"),
        ("scheduled", "Scheduled"),
        ("sent", "Sent"),
        ("failed", "Failed"),
    ]

    CHANNEL_CHOICES = [
        ("email", "Email"),
        ("sms", "SMS"),
        ("whatsapp", "WhatsApp"),
        ("notice", "Notice"),
        ("press_release", "Press Release"),
    ]

    AUDIENCE_CHOICES = [
        ("all", "All"),
        ("students", "Students"),
        ("parents", "Parents"),
        ("teams", "Teams"),
        ("officials", "Officials"),
        ("staff", "Staff"),
        ("media", "Media"),
    ]

    title = models.CharField(max_length=200)
    subject = models.CharField(max_length=255, blank=True)
    message = models.TextField()
    channel = models.CharField(max_length=20, choices=CHANNEL_CHOICES, default="notice")
    audience = models.CharField(max_length=20, choices=AUDIENCE_CHOICES, default="all")
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default="draft")

    template = models.ForeignKey(
        CommunicationTemplate,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="communications"
    )

    event_name = models.CharField(max_length=255, blank=True)
    scheduled_at = models.DateTimeField(null=True, blank=True)
    sent_at = models.DateTimeField(null=True, blank=True)

    recipients_count = models.PositiveIntegerField(default=0)
    success_count = models.PositiveIntegerField(default=0)
    failed_count = models.PositiveIntegerField(default=0)

    created_by = models.CharField(max_length=150, blank=True)
    remarks = models.TextField(blank=True)

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ["-created_at"]

    def __str__(self):
        return self.title

    def mark_sent(self):
        self.status = "sent"
        self.sent_at = timezone.now()
        self.save(update_fields=["status", "sent_at", "updated_at"])