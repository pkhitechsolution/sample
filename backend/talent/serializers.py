from rest_framework import serializers
from .models import TalentProfile


class TalentProfileSerializer(serializers.ModelSerializer):
    age = serializers.IntegerField(read_only=True)
    gender_display = serializers.CharField(source="get_gender_display", read_only=True)
    talent_level_display = serializers.CharField(source="get_talent_level_display", read_only=True)
    status_display = serializers.CharField(source="get_status_display", read_only=True)

    class Meta:
        model = TalentProfile
        fields = [
            "id",
            "registration_no",
            "student_name",
            "gender",
            "gender_display",
            "date_of_birth",
            "age",
            "class_name",
            "section",
            "sport",
            "event_or_position",
            "talent_level",
            "talent_level_display",
            "phone",
            "email",
            "address",
            "guardian_name",
            "guardian_phone",
            "height_cm",
            "weight_kg",
            "blood_group",
            "medical_notes",
            "previous_achievements",
            "notes",
            "status",
            "status_display",
            "created_at",
            "updated_at",
        ]
        read_only_fields = [
            "registration_no",
            "age",
            "gender_display",
            "talent_level_display",
            "status_display",
            "created_at",
            "updated_at",
        ]

    def validate_student_name(self, value):
        value = (value or "").strip()
        if not value:
            raise serializers.ValidationError("Student name is required.")
        return value

    def validate_sport(self, value):
        value = (value or "").strip()
        if not value:
            raise serializers.ValidationError("Sport is required.")
        return value