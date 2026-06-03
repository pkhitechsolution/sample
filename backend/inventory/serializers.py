from rest_framework import serializers
from .models import InventoryItem, InventoryCategory


class InventoryCategorySerializer(serializers.ModelSerializer):
    class Meta:
        model = InventoryCategory
        fields = ["id", "name"]


class InventoryItemSerializer(serializers.ModelSerializer):
    category_name = serializers.CharField(source="category.name", read_only=True)

    class Meta:
        model = InventoryItem
        fields = [
            "id",
            "item_name",
            "category",
            "category_name",
            "sku",
            "brand",
            "quantity",
            "unit_price",
            "status",
            "supplier",
            "location",
            "updated_at",
        ]