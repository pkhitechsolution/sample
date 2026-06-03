from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import (
    TransactionViewSet,
    accounts_summary,
    download_accounts_template,
    upload_accounts_excel,
    export_accounts_excel,
    export_accounts_pdf,
    login_view,
)

router = DefaultRouter()
router.register(r"", TransactionViewSet, basename="accounts")

urlpatterns = [
    path("summary/", accounts_summary, name="accounts-summary"),
    path("download-template/", download_accounts_template, name="accounts-download-template"),
    path("upload-excel/", upload_accounts_excel, name="accounts-upload-excel"),
    path("export-excel/", export_accounts_excel, name="accounts-export-excel"),
    path("export-pdf/", export_accounts_pdf, name="accounts-export-pdf"),
    path("login/", login_view, name="login"),
    path("", include(router.urls)),
]