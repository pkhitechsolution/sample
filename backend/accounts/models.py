from django.db import models


class Transaction(models.Model):
    TRANSACTION_TYPES = (
        ("income", "Income"),
        ("expense", "Expense"),
    )

    PAYMENT_METHOD_CHOICES = (
        ("cash", "Cash"),
        ("upi", "UPI"),
        ("bank", "Bank Transfer"),
        ("card", "Card"),
        ("cheque", "Cheque"),
    )

    STATUS_CHOICES = (
        ("completed", "Completed"),
        ("pending", "Pending"),
        ("cancelled", "Cancelled"),
    )

    date = models.DateField()
    transaction_type = models.CharField(max_length=20, choices=TRANSACTION_TYPES)
    category = models.CharField(max_length=100)
    description = models.TextField(blank=True, null=True)
    amount = models.DecimalField(max_digits=12, decimal_places=2)

    payment_method = models.CharField(
        max_length=20,
        choices=PAYMENT_METHOD_CHOICES,
        default="cash",
        blank=True,
        null=True,
    )

    reference_no = models.CharField(
        max_length=100,
        blank=True,
        null=True,
    )

    status = models.CharField(
        max_length=20,
        choices=STATUS_CHOICES,
        default="completed",
    )

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ["-date", "-id"]

    def __str__(self):
        return f"{self.transaction_type} - {self.category} - {self.amount}"

    def save(self, *args, **kwargs):
        creating = self.pk is None
        super().save(*args, **kwargs)

        if creating and not self.reference_no:
            prefix = "INC" if self.transaction_type == "income" else "EXP"
            self.reference_no = f"{prefix}-{self.id:05d}"
            super().save(update_fields=["reference_no"])