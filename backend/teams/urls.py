from django.urls import path, include
from rest_framework.routers import DefaultRouter

from .views import (
    TeamViewSet,
    teams_summary,
    upload_teams_excel,
    download_teams_template,
    export_teams_excel,
    export_teams_pdf,
)

app_name = "teams"

router = DefaultRouter()
router.register(r"", TeamViewSet, basename="teams")

urlpatterns = [
    path("summary/", teams_summary, name="teams-summary"),
    path("upload-excel/", upload_teams_excel, name="teams-upload-excel"),
    path("download-template/", download_teams_template, name="teams-download-template"),
    path("export-excel/", export_teams_excel, name="teams-export-excel"),
    path("export-pdf/", export_teams_pdf, name="teams-export-pdf"),
    path("", include(router.urls)),
]