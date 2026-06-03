from django.urls import include, path
from rest_framework.routers import DefaultRouter

from .views import (
    InventoryItemViewSet,
    inventory_categories,
    inventory_dashboard_summary,
    download_inventory_template,
    upload_inventory_excel,
    export_inventory_excel,
    export_inventory_pdf,
)

router = DefaultRouter()
router.register(r"", InventoryItemViewSet, basename="inventory")

urlpatterns = [
    path("categories/", inventory_categories, name="inventory-categories"),
    path("dashboard-summary/", inventory_dashboard_summary, name="inventory-dashboard-summary"),
    path("download-template/", download_inventory_template, name="inventory-download-template"),
    path("upload-excel/", upload_inventory_excel, name="inventory-upload-excel"),
    path("export-excel/", export_inventory_excel, name="inventory-export-excel"),
    path("export-pdf/", export_inventory_pdf, name="inventory-export-pdf"),
    path("", include(router.urls)),
]