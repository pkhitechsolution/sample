from rest_framework import serializers
from .models import Match


class MatchSerializer(serializers.ModelSerializer):
    match_code = serializers.ReadOnlyField()
    status_label = serializers.CharField(source="get_status_display", read_only=True)
    match_type_label = serializers.CharField(source="get_match_type_display", read_only=True)
    fixture = serializers.SerializerMethodField()
    score_line = serializers.SerializerMethodField()

    class Meta:
        model = Match
        fields = [
            "id",
            "match_code",
            "title",
            "tournament_name",
            "sport_name",
            "team_a",
            "team_b",
            "fixture",
            "venue",
            "match_date",
            "match_time",
            "match_type",
            "match_type_label",
            "status",
            "status_label",
            "round_name",
            "referee_name",
            "score_team_a",
            "score_team_b",
            "score_line",
            "winner",
            "notes",
            "created_at",
            "updated_at",
        ]

    def get_fixture(self, obj):
        return f"{obj.team_a} vs {obj.team_b}"

    def get_score_line(self, obj):
        return f"{obj.score_team_a} - {obj.score_team_b}"