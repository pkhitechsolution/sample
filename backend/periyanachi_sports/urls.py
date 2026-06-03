from django.contrib import admin
from django.urls import path, include
from django.conf import settings
from django.conf.urls.static import static

urlpatterns = [
    path("admin/", admin.site.urls),

    path("api/accounts/", include("accounts.urls")),
    path("api/talent/", include("talent.urls")),
    path("api/teams/", include("teams.urls")),
    path("api/tournaments/", include("tournaments.urls")),
    path("api/matches/", include("matches.urls")),

    # ✅ Officials module uses match_officials app
    path("api/officials/", include("match_officials.urls")),

    path("api/communications/", include("communications.urls")),
    path("api/media/", include("media.urls")),
    path("api/inventory/", include("inventory.urls")),
    path("api/performance/", include("performance.urls")),
    path("api/grants/", include("grants.urls")),
    path("api/reports/", include("reports.urls")),
    path("api/", include("rest_framework.urls")),
]

if settings.DEBUG:
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)