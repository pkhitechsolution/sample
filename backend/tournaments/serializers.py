from rest_framework import serializers
from .models import Tournament


class TournamentSerializer(serializers.ModelSerializer):
    vacancies = serializers.SerializerMethodField()
    fill_percentage = serializers.SerializerMethodField()
    duration_days = serializers.SerializerMethodField()

    class Meta:
        model = Tournament
        fields = [
            "id",
            "name",
            "sport",
            "format",
            "age_group",
            "gender_category",
            "venue",
            "organizer",
            "contact_person",
            "contact_phone",
            "start_date",
            "end_date",
            "registration_last_date",
            "max_teams",
            "teams_count",
            "matches_count",
            "status",
            "description",
            "rules",
            "notes",
            "vacancies",
            "fill_percentage",
            "duration_days",
        ]

    def get_vacancies(self, obj):
        max_teams = obj.max_teams or 0
        teams_count = obj.teams_count or 0
        return max(max_teams - teams_count, 0)

    def get_fill_percentage(self, obj):
        max_teams = obj.max_teams or 0
        teams_count = obj.teams_count or 0
        if max_teams <= 0:
            return 0
        return round((teams_count / max_teams) * 100, 2)

    def get_duration_days(self, obj):
        if obj.start_date and obj.end_date:
            return (obj.end_date - obj.start_date).days + 1
        return 0

    def validate(self, attrs):
        start_date = attrs.get(
            "start_date",
            getattr(self.instance, "start_date", None) if self.instance else None,
        )
        end_date = attrs.get(
            "end_date",
            getattr(self.instance, "end_date", None) if self.instance else None,
        )
        max_teams = attrs.get(
            "max_teams",
            getattr(self.instance, "max_teams", 0) if self.instance else 0,
        )
        teams_count = attrs.get(
            "teams_count",
            getattr(self.instance, "teams_count", 0) if self.instance else 0,
        )
        matches_count = attrs.get(
            "matches_count",
            getattr(self.instance, "matches_count", 0) if self.instance else 0,
        )

        if start_date and end_date and end_date < start_date:
            raise serializers.ValidationError(
                {"end_date": "End date cannot be earlier than start date."}
            )

        if max_teams is not None and max_teams < 0:
            raise serializers.ValidationError(
                {"max_teams": "Max teams cannot be negative."}
            )

        if teams_count is not None and teams_count < 0:
            raise serializers.ValidationError(
                {"teams_count": "Teams count cannot be negative."}
            )

        if matches_count is not None and matches_count < 0:
            raise serializers.ValidationError(
                {"matches_count": "Matches count cannot be negative."}
            )

        if (
            max_teams is not None
            and teams_count is not None
            and max_teams > 0
            and teams_count > max_teams
        ):
            raise serializers.ValidationError(
                {"teams_count": "Teams count cannot exceed max teams."}
            )

        return attrs