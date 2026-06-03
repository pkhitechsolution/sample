from django.contrib import admin
from .models import TalentProfile


@admin.register(TalentProfile)
class TalentProfileAdmin(admin.ModelAdmin):
    list_display = (
        "registration_no",
        "student_name",
        "gender",
        "class_name",
        "section",
        "sport",
        "talent_level",
        "status",
        "created_at",
    )
    search_fields = (
        "registration_no",
        "student_name",
        "class_name",
        "section",
        "sport",
        "phone",
        "email",
    )
    list_filter = ("gender", "talent_level", "status", "sport", "class_name", "section")