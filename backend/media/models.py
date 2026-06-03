from django.db import models


class MediaCategory(models.Model):
    name = models.CharField(max_length=150, unique=True)

    class Meta:
        ordering = ["name"]
        verbose_name_plural = "Media Categories"

    def __str__(self):
        return self.name


class MediaItem(models.Model):
    TYPE_IMAGE = "image"
    TYPE_VIDEO = "video"
    TYPE_DOCUMENT = "document"
    TYPE_AUDIO = "audio"

    TYPE_CHOICES = [
        (TYPE_IMAGE, "Image"),
        (TYPE_VIDEO, "Video"),
        (TYPE_DOCUMENT, "Document"),
        (TYPE_AUDIO, "Audio"),
    ]

    VISIBILITY_PUBLIC = "public"
    VISIBILITY_PRIVATE = "private"
    VISIBILITY_TEAM = "team"

    VISIBILITY_CHOICES = [
        (VISIBILITY_PUBLIC, "Public"),
        (VISIBILITY_PRIVATE, "Private"),
        (VISIBILITY_TEAM, "Team"),
    ]

    STATUS_DRAFT = "draft"
    STATUS_ACTIVE = "active"
    STATUS_ARCHIVED = "archived"

    STATUS_CHOICES = [
        (STATUS_DRAFT, "Draft"),
        (STATUS_ACTIVE, "Active"),
        (STATUS_ARCHIVED, "Archived"),
    ]

    title = models.CharField(max_length=220)
    category = models.ForeignKey(
        MediaCategory,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="media_items",
    )
    media_type = models.CharField(max_length=30, choices=TYPE_CHOICES, default=TYPE_IMAGE)
    event_name = models.CharField(max_length=200, blank=True, default="")
    sport_name = models.CharField(max_length=150, blank=True, default="")
    visibility = models.CharField(
        max_length=30,
        choices=VISIBILITY_CHOICES,
        default=VISIBILITY_PUBLIC,
    )
    status = models.CharField(
        max_length=30,
        choices=STATUS_CHOICES,
        default=STATUS_ACTIVE,
    )
    is_published = models.BooleanField(default=False)
    file = models.FileField(upload_to="media_items/", null=True, blank=True)
    thumbnail = models.ImageField(upload_to="media_thumbnails/", null=True, blank=True)
    description = models.TextField(blank=True, default="")
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ["-id"]

    def __str__(self):
        return self.title