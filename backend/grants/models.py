from django.db import models


class Grant(models.Model):
    STATUS_CHOICES = [
        ("pending", "Pending"),
        ("approved", "Approved"),
        ("rejected", "Rejected"),
        ("draft", "Draft"),
    ]

    GRANT_TYPE_CHOICES = [
        ("sports", "Sports"),
        ("education", "Education"),
        ("medical", "Medical"),
        ("infrastructure", "Infrastructure"),
        ("equipment", "Equipment"),
        ("training", "Training"),
        ("other", "Other"),
    ]

    grant_name = models.CharField(max_length=255)
    grant_type = models.CharField(max_length=50, choices=GRANT_TYPE_CHOICES, default="sports")
    funding_agency = models.CharField(max_length=255, blank=True, default="")
    amount_requested = models.DecimalField(max_digits=12, decimal_places=2, default=0)
    amount_approved = models.DecimalField(max_digits=12, decimal_places=2, default=0)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default="pending")
    applied_date = models.DateField(null=True, blank=True)
    approval_date = models.DateField(null=True, blank=True)
    purpose = models.TextField(blank=True, default="")
    remarks = models.TextField(blank=True, default="")
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ["-applied_date", "-id"]

    def __str__(self):
        return self.grant_name