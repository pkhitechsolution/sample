from django.db import models


class Match(models.Model):
    MATCH_TYPE_CHOICES = [
        ("league", "League"),
        ("knockout", "Knockout"),
        ("friendly", "Friendly"),
        ("practice", "Practice"),
    ]

    STATUS_CHOICES = [
        ("scheduled", "Scheduled"),
        ("live", "Live"),
        ("ongoing", "Ongoing"),
        ("completed", "Completed"),
        ("postponed", "Postponed"),
        ("cancelled", "Cancelled"),
    ]

    title = models.CharField(max_length=255)
    tournament_name = models.CharField(max_length=255, blank=True)
    sport_name = models.CharField(max_length=120)
    team_a = models.CharField(max_length=150)
    team_b = models.CharField(max_length=150)
    venue = models.CharField(max_length=255, blank=True)
    match_date = models.DateField()
    match_time = models.TimeField(null=True, blank=True)
    match_type = models.CharField(
        max_length=20,
        choices=MATCH_TYPE_CHOICES,
        default="league",
    )
    status = models.CharField(
        max_length=20,
        choices=STATUS_CHOICES,
        default="scheduled",
    )
    round_name = models.CharField(max_length=120, blank=True)
    referee_name = models.CharField(max_length=150, blank=True)
    score_team_a = models.PositiveIntegerField(default=0)
    score_team_b = models.PositiveIntegerField(default=0)
    winner = models.CharField(max_length=150, blank=True)
    notes = models.TextField(blank=True)

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ["-match_date", "-created_at"]

    def __str__(self):
        return f"{self.title} - {self.team_a} vs {self.team_b}"

    @property
    def match_code(self):
        return f"MCH-{self.pk:04d}" if self.pk else "MCH-NEW"