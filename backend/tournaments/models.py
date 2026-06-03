from django.db import models


class Tournament(models.Model):
    FORMAT_CHOICES = [
        ("LEAGUE", "League"),
        ("KNOCKOUT", "Knockout"),
        ("ROUND_ROBIN", "Round Robin"),
        ("GROUP_STAGE", "Group Stage"),
    ]

    STATUS_CHOICES = [
        ("Draft", "Draft"),
        ("Open", "Open"),
        ("Scheduled", "Scheduled"),
        ("Ongoing", "Ongoing"),
        ("Completed", "Completed"),
        ("Cancelled", "Cancelled"),
    ]

    name = models.CharField(max_length=255)
    sport = models.CharField(max_length=255)
    format = models.CharField(max_length=50, choices=FORMAT_CHOICES, default="LEAGUE")
    age_group = models.CharField(max_length=100, blank=True)
    gender_category = models.CharField(max_length=50, default="Mixed", blank=True)

    venue = models.CharField(max_length=255, blank=True)
    organizer = models.CharField(max_length=255, blank=True)
    contact_person = models.CharField(max_length=255, blank=True)
    contact_phone = models.CharField(max_length=30, blank=True)

    start_date = models.DateField()
    end_date = models.DateField()
    registration_last_date = models.DateField(null=True, blank=True)

    max_teams = models.PositiveIntegerField(default=0)
    teams_count = models.PositiveIntegerField(default=0)
    matches_count = models.PositiveIntegerField(default=0)

    status = models.CharField(max_length=50, choices=STATUS_CHOICES, default="Draft")

    description = models.TextField(blank=True)
    rules = models.TextField(blank=True)
    notes = models.TextField(blank=True)

    class Meta:
        ordering = ["-id"]

    def __str__(self):
        return f"{self.name} - {self.sport}"