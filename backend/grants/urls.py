from rest_framework.routers import DefaultRouter
from .views import GrantViewSet

router = DefaultRouter()
router.register(r"", GrantViewSet, basename="grant")

urlpatterns = router.urls