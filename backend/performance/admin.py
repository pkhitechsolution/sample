from django.contrib import admin
from .models import Performance


@admin.register(Performance)
class PerformanceAdmin(admin.ModelAdmin):
    list_display = (
        "student_name",
        "sport",
        "event_name",
        "performance_score",
        "performance_level",
        "performance_date",
        "coach_name",
    )
    search_fields = ("student_name", "sport", "event_name", "coach_name", "remarks")
    list_filter = ("performance_level", "sport", "performance_date")