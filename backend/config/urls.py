from django.contrib import admin
from django.urls import path, include

urlpatterns = [
    # ===============================
    # ADMIN
    # ===============================
    path("admin/", admin.site.urls),

    # ===============================
    # CORE MODULES (API)
    # ===============================

    # Accounts (Authentication + Users)
    path("api/accounts/", include("accounts.urls")),

    # Talent Registry
    path("api/talents/", include("talents.urls")),

    # Teams
    path("api/teams/", include("teams.urls")),

    # Tournaments
    path("api/tournaments/", include("tournaments.urls")),

    # Matches
    path("api/matches/", include("matches.urls")),

    # Match Officials
    path("api/officials/", include("match_officials.urls")),

    # Performance
    path("api/performance/", include("performance.urls")),

    # Reports
    path("api/reports/", include("reports.urls")),

    # Inventory
    path("api/inventory/", include("inventory.urls")),

    # Communications
    path("api/communications/", include("communications.urls")),

    # Media
    path("api/media/", include("media.urls")),

    # Grants
    path("api/grants/", include("grants.urls")),
    
    path("api/inventory/", include("inventory.urls")),
]