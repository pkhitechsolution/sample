from django.urls import include, path
from rest_framework.routers import DefaultRouter
from .views import TalentProfileViewSet

router = DefaultRouter()
router.register(r"", TalentProfileViewSet, basename="talent-profile")

urlpatterns = [
    path("", include(router.urls)),
]