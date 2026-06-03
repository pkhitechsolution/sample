from datetime import timedelta
from django.db import transaction

from .models import TournamentMatch


class FixtureGenerator:
    def __init__(self, tournament):
        self.tournament = tournament
        self.entries = list(
            tournament.tournament_teams.select_related("team").order_by("seed_no", "id")
        )
        self.teams = [entry.team for entry in self.entries]

    def generate_knockout(self):
        fixtures = []
        teams = self.teams[:]

        if len(teams) < 2:
            return fixtures

        if len(teams) % 2 != 0:
            teams.append(None)

        match_no = 1
        current_date = self.tournament.start_date

        for i in range(0, len(teams), 2):
            team_a = teams[i]
            team_b = teams[i + 1]

            fixtures.append(
                {
                    "match_no": match_no,
                    "round_name": "Round 1",
                    "team_a": team_a,
                    "team_b": team_b,
                    "match_date": current_date,
                    "venue": self.tournament.venue,
                    "status": "SCHEDULED" if team_a and team_b else "PENDING",
                }
            )
            match_no += 1
            current_date += timedelta(days=1)

        return fixtures

    def generate_league(self):
        fixtures = []
        if len(self.teams) < 2:
            return fixtures

        match_no = 1
        current_date = self.tournament.start_date

        for i in range(len(self.teams)):
            for j in range(i + 1, len(self.teams)):
                fixtures.append(
                    {
                        "match_no": match_no,
                        "round_name": "League",
                        "team_a": self.teams[i],
                        "team_b": self.teams[j],
                        "match_date": current_date,
                        "venue": self.tournament.venue,
                        "status": "SCHEDULED",
                    }
                )
                match_no += 1
                current_date += timedelta(days=1)

        return fixtures

    def get_fixtures(self):
        if self.tournament.format == "LEAGUE":
            return self.generate_league()

        if self.tournament.format == "GROUP_KNOCKOUT":
            return self.generate_league()

        return self.generate_knockout()

    @transaction.atomic
    def save_fixtures(self, clear_existing=True):
        if clear_existing:
            self.tournament.matches.all().delete()

        fixtures = self.get_fixtures()
        created = []

        for item in fixtures:
            created.append(
                TournamentMatch.objects.create(
                    tournament=self.tournament,
                    match_no=item["match_no"],
                    round_name=item["round_name"],
                    team_a=item["team_a"],
                    team_b=item["team_b"],
                    match_date=item.get("match_date"),
                    venue=item.get("venue", ""),
                    status=item.get("status", "PENDING"),
                )
            )

        if created:
            self.tournament.status = "SCHEDULED"
            self.tournament.save(update_fields=["status", "updated_at"])

        return created