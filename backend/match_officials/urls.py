from django.urls import path, include
from rest_framework.routers import DefaultRouter

from .views import (
    OfficialViewSet,
    officials_summary,
    upload_officials_excel,
    download_officials_template,
    export_officials_excel,
    export_officials_pdf,
)

router = DefaultRouter()
router.register(r"", OfficialViewSet, basename="officials")

urlpatterns = [
    path("summary/", officials_summary, name="officials-summary"),
    path("dashboard-summary/", officials_summary, name="officials-dashboard-summary"),
    path("upload-excel/", upload_officials_excel, name="officials-upload-excel"),
    path("download-template/", download_officials_template, name="officials-download-template"),
    path("upload-template/", download_officials_template, name="officials-upload-template"),
    path("export-excel/", export_officials_excel, name="officials-export-excel"),
    path("export-pdf/", export_officials_pdf, name="officials-export-pdf"),
    path("", include(router.urls)),
]