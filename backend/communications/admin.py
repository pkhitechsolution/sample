from django.contrib import admin
from .models import CommunicationTemplate, Communication


@admin.register(CommunicationTemplate)
class CommunicationTemplateAdmin(admin.ModelAdmin):
    list_display = ("name", "template_type", "subject", "is_active", "created_at")
    list_filter = ("template_type", "is_active", "created_at")
    search_fields = ("name", "subject", "body")
    ordering = ("name",)


@admin.register(Communication)
class CommunicationAdmin(admin.ModelAdmin):
    list_display = (
        "id",
        "title",
        "channel",
        "audience",
        "status",
        "event_name",
        "scheduled_at",
        "sent_at",
        "recipients_count",
        "success_count",
        "failed_count",
        "created_by",
        "created_at",
    )
    list_filter = (
        "channel",
        "audience",
        "status",
        "created_at",
        "scheduled_at",
        "sent_at",
    )
    search_fields = (
        "title",
        "subject",
        "message",
        "event_name",
        "created_by",
        "remarks",
    )
    ordering = ("-created_at",)
    readonly_fields = ("created_at", "updated_at", "sent_at")

    fieldsets = (
        ("Basic Information", {
            "fields": ("title", "subject", "message", "template")
        }),
        ("Communication Details", {
            "fields": ("channel", "audience", "status", "event_name")
        }),
        ("Schedule / Delivery", {
            "fields": ("scheduled_at", "sent_at")
        }),
        ("Delivery Statistics", {
            "fields": ("recipients_count", "success_count", "failed_count")
        }),
        ("Other Details", {
            "fields": ("created_by", "remarks")
        }),
        ("Timestamps", {
            "fields": ("created_at", "updated_at")
        }),
    )