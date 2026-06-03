from django.core.management.base import BaseCommand
from accounts.models import Role


class Command(BaseCommand):
    help = "Seed default roles"

    def handle(self, *args, **kwargs):
        roles = [
            {"name": "Admin", "code": "ADMIN"},
            {"name": "Coach", "code": "COACH"},
            {"name": "Manager", "code": "MANAGER"},
            {"name": "Accountant", "code": "ACCOUNTANT"},
            {"name": "Staff", "code": "STAFF"},
        ]

        for role_data in roles:
            role, created = Role.objects.get_or_create(
                code=role_data["code"],
                defaults={"name": role_data["name"]},
            )
            if created:
                self.stdout.write(self.style.SUCCESS(f"Created role: {role.name}"))
            else:
                self.stdout.write(f"Already exists: {role.name}")