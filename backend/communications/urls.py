from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import (
    CommunicationTemplateViewSet,
    CommunicationViewSet,
    communications_summary,
    download_communications_template,
    upload_communications_excel,
    export_communications_excel,
    export_communications_pdf,
)

router = DefaultRouter()
router.register(r"templates", CommunicationTemplateViewSet, basename="communication-template")
router.register(r"messages", CommunicationViewSet, basename="communication")

urlpatterns = [
    path("summary/", communications_summary, name="communications-summary"),
    path("template/download/", download_communications_template, name="communications-template-download"),
    path("upload/excel/", upload_communications_excel, name="communications-upload-excel"),
    path("export/excel/", export_communications_excel, name="communications-export-excel"),
    path("export/pdf/", export_communications_pdf, name="communications-export-pdf"),
    path("", include(router.urls)),
]