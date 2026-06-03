from rest_framework import serializers
from .models import Performance


class PerformanceSerializer(serializers.ModelSerializer):
    class Meta:
        model = Performance
        fields = [
            "id",
            "student_name",
            "sport",
            "event_name",
            "performance_score",
            "performance_level",
            "performance_date",
            "coach_name",
            "remarks",
            "created_at",
            "updated_at",
        ]
        read_only_fields = ["id", "created_at", "updated_at"]

    def validate_performance_score(self, value):
        if value is None:
            return value
        if value < 0:
            raise serializers.ValidationError("Performance score cannot be negative.")
        return value