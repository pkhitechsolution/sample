from django.urls import path, include
from rest_framework.routers import DefaultRouter

from .views import (
    TournamentViewSet,
    tournaments_dashboard_summary,
    upload_tournament_excel,
    download_tournament_template,
    export_tournaments_excel,
    export_tournaments_pdf,
)

app_name = "tournaments"

router = DefaultRouter()
router.register(r"", TournamentViewSet, basename="tournaments")

urlpatterns = [
    path("dashboard-summary/", tournaments_dashboard_summary, name="tournaments-dashboard-summary"),
    path("upload-excel/", upload_tournament_excel, name="tournaments-upload-excel"),
    path("download-template/", download_tournament_template, name="tournaments-download-template"),
    path("export-excel/", export_tournaments_excel, name="tournaments-export-excel"),
    path("export-pdf/", export_tournaments_pdf, name="tournaments-export-pdf"),
    path("", include(router.urls)),
]