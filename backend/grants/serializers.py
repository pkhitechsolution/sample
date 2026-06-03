from rest_framework import serializers
from .models import Grant


class GrantSerializer(serializers.ModelSerializer):
    class Meta:
        model = Grant
        fields = [
            "id",
            "grant_name",
            "grant_type",
            "funding_agency",
            "amount_requested",
            "amount_approved",
            "status",
            "applied_date",
            "approval_date",
            "purpose",
            "remarks",
            "created_at",
            "updated_at",
        ]
        read_only_fields = ["id", "created_at", "updated_at"]

    def validate(self, attrs):
        amount_requested = attrs.get("amount_requested")
        amount_approved = attrs.get("amount_approved")

        if amount_requested is not None and amount_requested < 0:
            raise serializers.ValidationError(
                {"amount_requested": "Amount requested cannot be negative."}
            )

        if amount_approved is not None and amount_approved < 0:
            raise serializers.ValidationError(
                {"amount_approved": "Amount approved cannot be negative."}
            )

        return attrs