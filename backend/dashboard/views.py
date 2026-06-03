from rest_framework.decorators import api_view
from rest_framework.response import Response


@api_view(["GET"])
def dashboard_home(request):
    return Response({
        "message": "Dashboard API working successfully"
    })