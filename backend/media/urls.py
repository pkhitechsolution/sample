from django.urls import include, path
from rest_framework.routers import DefaultRouter

from .views import (
    MediaItemViewSet,
    media_categories,
    media_dashboard_summary,
    download_media_template,
    upload_media_excel,
    export_media_excel,
    export_media_pdf,
)

router = DefaultRouter()
router.register(r"", MediaItemViewSet, basename="media")

urlpatterns = [
    path("categories/", media_categories, name="media-categories"),
    path("dashboard-summary/", media_dashboard_summary, name="media-dashboard-summary"),
    path("download-template/", download_media_template, name="media-download-template"),
    path("upload-excel/", upload_media_excel, name="media-upload-excel"),
    path("export-excel/", export_media_excel, name="media-export-excel"),
    path("export-pdf/", export_media_pdf, name="media-export-pdf"),
    path("", include(router.urls)),
]