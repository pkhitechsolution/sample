from django.contrib import admin
from .models import InventoryCategory, InventoryItem


@admin.register(InventoryCategory)
class InventoryCategoryAdmin(admin.ModelAdmin):
    list_display = ("id", "name")
    search_fields = ("name",)
    ordering = ("name",)


@admin.register(InventoryItem)
class InventoryItemAdmin(admin.ModelAdmin):
    list_display = (
        "id",
        "item_name",
        "category",
        "sku",
        "brand",
        "quantity",
        "unit_price",
        "status",
        "supplier",
        "location",
    )
    search_fields = (
        "item_name",
        "sku",
        "brand",
        "supplier",
        "location",
    )
    list_filter = ("category", "status")
    ordering = ("-id",)