from rest_framework import serializers
from .models import CommunicationTemplate, Communication


class CommunicationTemplateSerializer(serializers.ModelSerializer):
    class Meta:
        model = CommunicationTemplate
        fields = "__all__"


class CommunicationSerializer(serializers.ModelSerializer):
    channel_label = serializers.CharField(source="get_channel_display", read_only=True)
    audience_label = serializers.CharField(source="get_audience_display", read_only=True)
    status_label = serializers.CharField(source="get_status_display", read_only=True)
    template_name = serializers.CharField(source="template.name", read_only=True)

    class Meta:
        model = Communication
        fields = [
            "id",
            "title",
            "subject",
            "message",
            "channel",
            "channel_label",
            "audience",
            "audience_label",
            "status",
            "status_label",
            "template",
            "template_name",
            "event_name",
            "scheduled_at",
            "sent_at",
            "recipients_count",
            "success_count",
            "failed_count",
            "created_by",
            "remarks",
            "created_at",
            "updated_at",
        ]