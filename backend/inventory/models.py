from django.db import models


class InventoryCategory(models.Model):
    name = models.CharField(max_length=150, unique=True)

    class Meta:
        ordering = ["name"]
        verbose_name_plural = "Inventory Categories"

    def __str__(self):
        return self.name


class InventoryItem(models.Model):
    STATUS_AVAILABLE = "available"
    STATUS_LOW_STOCK = "low_stock"
    STATUS_OUT_OF_STOCK = "out_of_stock"

    STATUS_CHOICES = [
        (STATUS_AVAILABLE, "Available"),
        (STATUS_LOW_STOCK, "Low Stock"),
        (STATUS_OUT_OF_STOCK, "Out Of Stock"),
    ]

    item_name = models.CharField(max_length=200)
    category = models.ForeignKey(
        InventoryCategory,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="items",
    )
    sku = models.CharField(max_length=100, unique=True)
    brand = models.CharField(max_length=150, blank=True, default="")
    quantity = models.PositiveIntegerField(default=0)
    unit_price = models.DecimalField(max_digits=12, decimal_places=2, default=0)
    status = models.CharField(
        max_length=30,
        choices=STATUS_CHOICES,
        default=STATUS_AVAILABLE,
    )
    supplier = models.CharField(max_length=200, blank=True, default="")
    location = models.CharField(max_length=200, blank=True, default="")
    description = models.TextField(blank=True, default="")
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ["-id"]

    def __str__(self):
        return f"{self.item_name} ({self.sku})"