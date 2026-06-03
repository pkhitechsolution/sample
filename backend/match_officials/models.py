from django.db import models


class Official(models.Model):
    ROLE_CHOICES = [
        ("referee", "Referee"),
        ("umpire", "Umpire"),
        ("judge", "Judge"),
        ("marshal", "Marshal"),
        ("scorer", "Scorer"),
        ("time_keeper", "Time Keeper"),
        ("coordinator", "Coordinator"),
        ("other", "Other"),
    ]

    GENDER_CHOICES = [
        ("male", "Male"),
        ("female", "Female"),
        ("other", "Other"),
    ]

    AVAILABILITY_CHOICES = [
        ("available", "Available"),
        ("busy", "Busy"),
        ("unavailable", "Unavailable"),
    ]

    STATUS_CHOICES = [
        ("active", "Active"),
        ("inactive", "Inactive"),
    ]

    full_name = models.CharField(max_length=150)
    official_code = models.CharField(max_length=30, unique=True, blank=True, null=True)
    role = models.CharField(max_length=30, choices=ROLE_CHOICES, default="referee")
    sport = models.CharField(max_length=100, blank=True, default="")
    gender = models.CharField(max_length=20, choices=GENDER_CHOICES, blank=True, default="")
    phone = models.CharField(max_length=20, blank=True, default="")
    email = models.EmailField(blank=True, null=True)
    qualification = models.CharField(max_length=200, blank=True, default="")
    experience_years = models.PositiveIntegerField(default=0)
    city = models.CharField(max_length=100, blank=True, default="")
    address = models.TextField(blank=True, default="")
    availability = models.CharField(
        max_length=20,
        choices=AVAILABILITY_CHOICES,
        default="available",
    )
    status = models.CharField(
        max_length=20,
        choices=STATUS_CHOICES,
        default="active",
    )
    notes = models.TextField(blank=True, default="")
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ["-id"]
        verbose_name = "Official"
        verbose_name_plural = "Officials"

    def __str__(self):
        return f"{self.full_name} ({self.official_code or 'No Code'})"

    def save(self, *args, **kwargs):
        is_new = self.pk is None
        super().save(*args, **kwargs)

        if (is_new or not self.official_code) and not self.official_code:
            prefix_map = {
                "referee": "REF",
                "umpire": "UMP",
                "judge": "JDG",
                "marshal": "MSH",
                "scorer": "SCR",
                "time_keeper": "TMK",
                "coordinator": "COR",
                "other": "OFF",
            }
            prefix = prefix_map.get(self.role, "OFF")
            self.official_code = f"{prefix}-{self.pk:04d}"
            super().save(update_fields=["official_code"])