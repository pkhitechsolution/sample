from rest_framework import serializers
from .models import MediaCategory, MediaItem


class MediaCategorySerializer(serializers.ModelSerializer):
    class Meta:
        model = MediaCategory
        fields = ["id", "name"]


class MediaItemSerializer(serializers.ModelSerializer):
    category_name = serializers.CharField(source="category.name", read_only=True)
    file_url = serializers.SerializerMethodField()
    thumbnail_url = serializers.SerializerMethodField()

    class Meta:
        model = MediaItem
        fields = [
            "id",
            "title",
            "category",
            "category_name",
            "media_type",
            "event_name",
            "sport_name",
            "visibility",
            "status",
            "is_published",
            "file",
            "file_url",
            "thumbnail",
            "thumbnail_url",
            "description",
            "created_at",
            "updated_at",
        ]

    def get_file_url(self, obj):
        request = self.context.get("request")
        if obj.file and hasattr(obj.file, "url"):
            return request.build_absolute_uri(obj.file.url) if request else obj.file.url
        return ""

    def get_thumbnail_url(self, obj):
        request = self.context.get("request")
        if obj.thumbnail and hasattr(obj.thumbnail, "url"):
            return request.build_absolute_uri(obj.thumbnail.url) if request else obj.thumbnail.url
        return ""