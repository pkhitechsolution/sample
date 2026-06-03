from django.contrib import admin
from .models import Match


@admin.register(Match)
class MatchAdmin(admin.ModelAdmin):
    list_display = (
        "title",
        "sport_name",
        "team_a",
        "team_b",
        "match_date",
        "match_time",
        "match_type",
        "status",
        "winner",
    )
    list_filter = ("sport_name", "match_type", "status", "match_date")
    search_fields = (
        "title",
        "tournament_name",
        "sport_name",
        "team_a",
        "team_b",
        "venue",
        "round_name",
        "referee_name",
        "winner",
    )