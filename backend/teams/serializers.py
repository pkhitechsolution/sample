from rest_framework import serializers
from .models import Team


class TeamSerializer(serializers.ModelSerializer):
    vacancies = serializers.SerializerMethodField()
    fill_percentage = serializers.SerializerMethodField()

    class Meta:
        model = Team
        fields = [
            "id",
            "team_name",
            "sport_name",
            "age_group",
            "gender_category",
            "coach_name",
            "captain_name",
            "vice_captain_name",
            "max_players",
            "current_players_count",
            "academic_year",
            "status",
            "achievements",
            "notes",
            "vacancies",
            "fill_percentage",
        ]

    def get_vacancies(self, obj):
        max_players = obj.max_players or 0
        current_players = obj.current_players_count or 0
        return max(max_players - current_players, 0)

    def get_fill_percentage(self, obj):
        max_players = obj.max_players or 0
        current_players = obj.current_players_count or 0
        if max_players <= 0:
            return 0
        return round((current_players / max_players) * 100, 2)

    def validate(self, attrs):
        max_players = attrs.get(
            "max_players",
            getattr(self.instance, "max_players", 0) if self.instance else 0,
        )
        current_players_count = attrs.get(
            "current_players_count",
            getattr(self.instance, "current_players_count", 0) if self.instance else 0,
        )

        if max_players is not None and max_players <= 0:
            raise serializers.ValidationError(
                {"max_players": "Max players must be greater than 0."}
            )

        if current_players_count is not None and current_players_count < 0:
            raise serializers.ValidationError(
                {"current_players_count": "Current players count cannot be negative."}
            )

        if (
            max_players is not None
            and current_players_count is not None
            and current_players_count > max_players
        ):
            raise serializers.ValidationError(
                {
                    "current_players_count": "Current players count cannot exceed max players."
                }
            )

        return attrs