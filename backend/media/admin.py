from django.contrib import admin
from .models import MediaCategory, MediaItem


@admin.register(MediaCategory)
class MediaCategoryAdmin(admin.ModelAdmin):
    list_display = ("id", "name")
    search_fields = ("name",)
    ordering = ("name",)


@admin.register(MediaItem)
class MediaItemAdmin(admin.ModelAdmin):
    list_display = (
        "id",
        "title",
        "media_type",
        "event_name",
        "sport_name",
        "visibility",
        "status",
        "is_published",
        "created_at",
    )
    search_fields = (
        "title",
        "event_name",
        "sport_name",
        "description",
        "category__name",
    )
    list_filter = ("media_type", "visibility", "status", "is_published", "created_at")
    ordering = ("-id",)