from django.contrib import admin
from .models import Official


@admin.register(Official)
class OfficialAdmin(admin.ModelAdmin):
    list_display = (
        "official_code",
        "full_name",
        "role",
        "sport",
        "phone",
        "availability",
        "status",
        "experience_years",
        "created_at",
    )
    search_fields = (
        "official_code",
        "full_name",
        "sport",
        "phone",
        "email",
        "qualification",
        "city",
    )
    list_filter = ("role", "availability", "status", "sport", "gender")
    ordering = ("-id",)