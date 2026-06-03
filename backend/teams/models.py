from django.db import models


class Team(models.Model):
    team_name = models.CharField(max_length=255)
    sport_name = models.CharField(max_length=255)
    age_group = models.CharField(max_length=100, blank=True)
    gender_category = models.CharField(max_length=50, default="Mixed", blank=True)
    coach_name = models.CharField(max_length=255, blank=True)
    captain_name = models.CharField(max_length=255, blank=True)
    vice_captain_name = models.CharField(max_length=255, blank=True)
    max_players = models.PositiveIntegerField(default=11)
    current_players_count = models.PositiveIntegerField(default=0)
    academic_year = models.CharField(max_length=50, blank=True)
    status = models.CharField(max_length=50, default="Active")
    achievements = models.TextField(blank=True)
    notes = models.TextField(blank=True)

    def __str__(self):
        return f"{self.team_name} - {self.sport_name}"