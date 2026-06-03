from django.contrib import admin
from .models import Transaction


@admin.register(Transaction)
class TransactionAdmin(admin.ModelAdmin):
    list_display = (
        "id",
        "date",
        "transaction_type",
        "category",
        "amount",
        "payment_method",
        "status",
        "reference_no",
        "created_at",
    )
    list_filter = ("transaction_type", "status", "payment_method", "date")
    search_fields = ("category", "description", "reference_no")
    ordering = ("-date", "-id")