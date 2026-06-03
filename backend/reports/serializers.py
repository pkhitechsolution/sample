from rest_framework import serializers
from .models import Report


class ReportSerializer(serializers.ModelSerializer):
    status_display = serializers.CharField(source="get_status_display", read_only=True)
    report_type_display = serializers.CharField(source="get_report_type_display", read_only=True)

    class Meta:
        model = Report
        fields = [
            "id",
            "title",
            "report_type",
            "report_type_display",
            "category",
            "status",
            "status_display",
            "summary",
            "description",
            "prepared_by",
            "report_date",
            "published_at",
            "created_at",
            "updated_at",
        ]