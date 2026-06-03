from rest_framework import serializers
from .models import Official


class OfficialSerializer(serializers.ModelSerializer):
    role_label = serializers.CharField(source="get_role_display", read_only=True)
    gender_label = serializers.CharField(source="get_gender_display", read_only=True)
    availability_label = serializers.CharField(source="get_availability_display", read_only=True)
    status_label = serializers.CharField(source="get_status_display", read_only=True)

    class Meta:
        model = Official
        fields = [
            "id",
            "full_name",
            "official_code",
            "role",
            "role_label",
            "sport",
            "gender",
            "gender_label",
            "phone",
            "email",
            "qualification",
            "experience_years",
            "city",
            "address",
            "availability",
            "availability_label",
            "status",
            "status_label",
            "notes",
            "created_at",
            "updated_at",
        ]
        read_only_fields = ["official_code", "created_at", "updated_at"]

    def validate_experience_years(self, value):
        if value < 0:
            raise serializers.ValidationError("Experience years cannot be negative.")
        return value