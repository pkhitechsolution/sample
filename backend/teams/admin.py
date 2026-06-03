from django.contrib import admin
from .models import Team


@admin.register(Team)
class TeamAdmin(admin.ModelAdmin):
    list_display = (
        "team_name",
        "sport_name",
        "age_group",
        "gender_category",
        "coach_name",
        "captain_name",
        "max_players",
        "current_players_count",
        "status",
    )
    search_fields = (
        "team_name",
        "sport_name",
        "coach_name",
        "captain_name",
        "vice_captain_name",
        "academic_year",
    )
    list_filter = (
        "sport_name",
        "gender_category",
        "status",
        "academic_year",
    )