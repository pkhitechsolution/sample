from django.contrib import admin
from .models import Report


@admin.register(Report)
class ReportAdmin(admin.ModelAdmin):
    list_display = (
        "title",
        "report_type",
        "category",
        "status",
        "prepared_by",
        "report_date",
        "created_at",
    )
    search_fields = ("title", "category", "prepared_by", "summary", "description")
    list_filter = ("status", "report_type", "report_date")