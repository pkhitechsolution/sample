from django.db import models
from django.utils import timezone


class Report(models.Model):
    STATUS_CHOICES = [
        ("draft", "Draft"),
        ("published", "Published"),
        ("archived", "Archived"),
    ]

    TYPE_CHOICES = [
        ("performance", "Performance"),
        ("financial", "Financial"),
        ("attendance", "Attendance"),
        ("team", "Team"),
        ("player", "Player"),
        ("medical", "Medical"),
        ("other", "Other"),
    ]

    title = models.CharField(max_length=255)
    report_type = models.CharField(max_length=30, choices=TYPE_CHOICES, default="other")
    category = models.CharField(max_length=120, blank=True, default="")
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default="draft")
    summary = models.TextField(blank=True, default="")
    description = models.TextField(blank=True, default="")
    prepared_by = models.CharField(max_length=150, blank=True, default="")
    report_date = models.DateField(default=timezone.now)
    published_at = models.DateTimeField(null=True, blank=True)

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ["-report_date", "-created_at"]

    def __str__(self):
        return self.title

    def save(self, *args, **kwargs):
        if self.status == "published" and not self.published_at:
            self.published_at = timezone.now()
        elif self.status != "published":
            self.published_at = None
        super().save(*args, **kwargs)