from django.urls import path, include
from rest_framework.routers import DefaultRouter

from .views import (
    MatchViewSet,
    matches_dashboard_summary,
    download_matches_template,
    upload_matches_excel,
    export_matches_excel,
    export_matches_pdf,
)

router = DefaultRouter()
router.register(r"", MatchViewSet, basename="matches")

urlpatterns = [
    path("dashboard-summary/", matches_dashboard_summary, name="matches-dashboard-summary"),
    path("download-template/", download_matches_template, name="matches-download-template"),
    path("upload-excel/", upload_matches_excel, name="matches-upload-excel"),
    path("export-excel/", export_matches_excel, name="matches-export-excel"),
    path("export-pdf/", export_matches_pdf, name="matches-export-pdf"),
    path("", include(router.urls)),
]