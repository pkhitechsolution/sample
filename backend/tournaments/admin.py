from django.contrib import admin
from .models import Tournament


@admin.register(Tournament)
class TournamentAdmin(admin.ModelAdmin):
    list_display = (
        "name",
        "sport",
        "format",
        "age_group",
        "gender_category",
        "venue",
        "start_date",
        "end_date",
        "max_teams",
        "teams_count",
        "matches_count",
        "status",
    )
    search_fields = (
        "name",
        "sport",
        "venue",
        "organizer",
        "contact_person",
        "contact_phone",
    )
    list_filter = (
        "sport",
        "format",
        "status",
        "gender_category",
    )