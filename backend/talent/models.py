from datetime import date
from django.db import models


class TalentProfile(models.Model):
    GENDER_CHOICES = (
        ("M", "Male"),
        ("F", "Female"),
    )

    TALENT_LEVEL_CHOICES = (
        ("beginner", "Beginner"),
        ("intermediate", "Intermediate"),
        ("advanced", "Advanced"),
        ("elite", "Elite"),
    )

    STATUS_CHOICES = (
        ("active", "Active"),
        ("inactive", "Inactive"),
        ("selected", "Selected"),
        ("rejected", "Rejected"),
    )

    registration_no = models.CharField(max_length=50, unique=True, blank=True)
    student_name = models.CharField(max_length=255)
    gender = models.CharField(max_length=1, choices=GENDER_CHOICES)
    date_of_birth = models.DateField(null=True, blank=True)

    class_name = models.CharField(max_length=50, blank=True)
    section = models.CharField(max_length=20, blank=True)

    sport = models.CharField(max_length=100)
    event_or_position = models.CharField(max_length=150, blank=True)

    talent_level = models.CharField(
        max_length=20,
        choices=TALENT_LEVEL_CHOICES,
        default="beginner",
    )

    phone = models.CharField(max_length=20, blank=True)
    email = models.EmailField(blank=True)
    address = models.TextField(blank=True)

    guardian_name = models.CharField(max_length=255, blank=True)
    guardian_phone = models.CharField(max_length=20, blank=True)

    height_cm = models.DecimalField(max_digits=5, decimal_places=2, null=True, blank=True)
    weight_kg = models.DecimalField(max_digits=5, decimal_places=2, null=True, blank=True)
    blood_group = models.CharField(max_length=10, blank=True)
    medical_notes = models.TextField(blank=True)
    previous_achievements = models.TextField(blank=True)
    notes = models.TextField(blank=True)

    status = models.CharField(
        max_length=20,
        choices=STATUS_CHOICES,
        default="active",
    )

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ["-created_at", "-id"]
        verbose_name = "Talent Profile"
        verbose_name_plural = "Talent Profiles"

    def __str__(self):
        return f"{self.registration_no or 'TR'} - {self.student_name}"

    @property
    def age(self):
        if not self.date_of_birth:
            return None
        today = date.today()
        return (
            today.year
            - self.date_of_birth.year
            - (
                (today.month, today.day)
                < (self.date_of_birth.month, self.date_of_birth.day)
            )
        )

    def save(self, *args, **kwargs):
        is_new = self.pk is None
        super().save(*args, **kwargs)

        if is_new and not self.registration_no:
            self.registration_no = f"TR{self.id:05d}"
            super().save(update_fields=["registration_no"])