from django.contrib import admin
from .models import Grant


@admin.register(Grant)
class GrantAdmin(admin.ModelAdmin):
    list_display = (
        "grant_name",
        "grant_type",
        "funding_agency",
        "amount_requested",
        "amount_approved",
        "status",
        "applied_date",
    )
    search_fields = ("grant_name", "funding_agency", "purpose", "remarks")
    list_filter = ("status", "grant_type")