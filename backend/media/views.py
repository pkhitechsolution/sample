import io

import pandas as pd
from django.db.models import Q
from django.http import FileResponse
from openpyxl import Workbook
from reportlab.lib import colors
from reportlab.lib.pagesizes import landscape, letter
from reportlab.platypus import SimpleDocTemplate, Table, TableStyle

from rest_framework import status, viewsets
from rest_framework.decorators import api_view
from rest_framework.parsers import MultiPartParser, FormParser
from rest_framework.response import Response

from .models import MediaCategory, MediaItem
from .serializers import MediaCategorySerializer, MediaItemSerializer


class MediaItemViewSet(viewsets.ModelViewSet):
    queryset = MediaItem.objects.select_related("category").all().order_by("-id")
    serializer_class = MediaItemSerializer
    parser_classes = [MultiPartParser, FormParser]

    def get_serializer_context(self):
        context = super().get_serializer_context()
        context["request"] = self.request
        return context

    def get_queryset(self):
        queryset = super().get_queryset()

        search = self.request.query_params.get("search", "").strip()
        media_type = self.request.query_params.get("media_type", "").strip()
        status_value = self.request.query_params.get("status", "").strip()
        visibility = self.request.query_params.get("visibility", "").strip()

        if search:
            queryset = queryset.filter(
                Q(title__icontains=search)
                | Q(event_name__icontains=search)
                | Q(sport_name__icontains=search)
                | Q(description__icontains=search)
                | Q(category__name__icontains=search)
            )

        if media_type:
            queryset = queryset.filter(media_type__iexact=media_type)

        if status_value:
            queryset = queryset.filter(status__iexact=status_value)

        if visibility:
            queryset = queryset.filter(visibility__iexact=visibility)

        return queryset


@api_view(["GET"])
def media_categories(request):
    categories = MediaCategory.objects.all().order_by("name")
    serializer = MediaCategorySerializer(categories, many=True)
    return Response(serializer.data)


@api_view(["GET"])
def media_dashboard_summary(request):
    queryset = MediaItem.objects.all()

    total_media = queryset.count()
    images = queryset.filter(media_type=MediaItem.TYPE_IMAGE).count()
    videos = queryset.filter(media_type=MediaItem.TYPE_VIDEO).count()
    published = queryset.filter(is_published=True).count()

    return Response(
        {
            "total_media": total_media,
            "images": images,
            "videos": videos,
            "published": published,
        }
    )


@api_view(["GET"])
def download_media_template(request):
    workbook = Workbook()
    worksheet = workbook.active
    worksheet.title = "Media Template"

    headers = [
        "title",
        "category",
        "media_type",
        "event_name",
        "sport_name",
        "visibility",
        "status",
        "is_published",
        "description",
    ]
    worksheet.append(headers)

    output = io.BytesIO()
    workbook.save(output)
    output.seek(0)

    return FileResponse(
        output,
        as_attachment=True,
        filename="media_template.xlsx",
        content_type="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    )


def _clean_text(value):
    if pd.isna(value):
        return ""
    return str(value).strip()


def _clean_bool(value):
    if pd.isna(value):
        return False
    return str(value).strip().lower() in {"yes", "true", "1", "published"}


def _normalize_media_type(value):
    raw = str(value or "").strip().lower()
    allowed = {"image", "video", "document", "audio"}
    return raw if raw in allowed else "image"


def _normalize_visibility(value):
    raw = str(value or "").strip().lower()
    allowed = {"public", "private", "team"}
    return raw if raw in allowed else "public"


def _normalize_status(value):
    raw = str(value or "").strip().lower()
    allowed = {"draft", "active", "archived"}
    return raw if raw in allowed else "active"


@api_view(["POST"])
def upload_media_excel(request):
    file = request.FILES.get("excel_file")

    if not file:
        return Response(
            {"message": "No file uploaded."},
            status=status.HTTP_400_BAD_REQUEST,
        )

    try:
        df = pd.read_excel(file)
    except Exception as exc:
        return Response(
            {"message": f"Failed to read Excel file: {exc}"},
            status=status.HTTP_400_BAD_REQUEST,
        )

    df.columns = [str(col).strip().lower() for col in df.columns]

    required_columns = {"title"}
    missing_columns = [col for col in required_columns if col not in df.columns]
    if missing_columns:
        return Response(
            {"message": f"Missing required columns: {', '.join(missing_columns)}"},
            status=status.HTTP_400_BAD_REQUEST,
        )

    created_count = 0
    updated_count = 0
    skipped_count = 0
    errors = []

    for index, row in df.iterrows():
        try:
            title = _clean_text(row.get("title"))
            category_name = _clean_text(row.get("category"))
            media_type = _normalize_media_type(row.get("media_type"))
            event_name = _clean_text(row.get("event_name"))
            sport_name = _clean_text(row.get("sport_name"))
            visibility = _normalize_visibility(row.get("visibility"))
            status_value = _normalize_status(row.get("status"))
            is_published = _clean_bool(row.get("is_published"))
            description = _clean_text(row.get("description"))

            if not title:
                skipped_count += 1
                errors.append(f"Row {index + 2}: title is required.")
                continue

            category_obj = None
            if category_name:
                category_obj, _ = MediaCategory.objects.get_or_create(name=category_name)

            item_obj = MediaItem.objects.filter(
                title__iexact=title,
                media_type=media_type,
                event_name__iexact=event_name,
                sport_name__iexact=sport_name,
            ).first()

            if item_obj:
                item_obj.category = category_obj
                item_obj.visibility = visibility
                item_obj.status = status_value
                item_obj.is_published = is_published
                item_obj.description = description
                item_obj.save()
                updated_count += 1
            else:
                MediaItem.objects.create(
                    title=title,
                    category=category_obj,
                    media_type=media_type,
                    event_name=event_name,
                    sport_name=sport_name,
                    visibility=visibility,
                    status=status_value,
                    is_published=is_published,
                    description=description,
                )
                created_count += 1

        except Exception as exc:
            skipped_count += 1
            errors.append(f"Row {index + 2}: {exc}")

    return Response(
        {
            "message": "Media Excel upload completed.",
            "created_count": created_count,
            "updated_count": updated_count,
            "skipped_count": skipped_count,
            "errors": errors[:20],
        }
    )


@api_view(["GET"])
def export_media_excel(request):
    workbook = Workbook()
    worksheet = workbook.active
    worksheet.title = "Media"

    headers = [
        "title",
        "category",
        "media_type",
        "event_name",
        "sport_name",
        "visibility",
        "status",
        "is_published",
        "description",
        "created_at",
    ]
    worksheet.append(headers)

    items = MediaItem.objects.select_related("category").all().order_by("-id")
    for item in items:
        worksheet.append(
            [
                item.title,
                item.category.name if item.category else "",
                item.media_type,
                item.event_name,
                item.sport_name,
                item.visibility,
                item.status,
                "Yes" if item.is_published else "No",
                item.description,
                item.created_at.strftime("%Y-%m-%d %H:%M:%S") if item.created_at else "",
            ]
        )

    output = io.BytesIO()
    workbook.save(output)
    output.seek(0)

    return FileResponse(
        output,
        as_attachment=True,
        filename="media_export.xlsx",
        content_type="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    )


@api_view(["GET"])
def export_media_pdf(request):
    buffer = io.BytesIO()
    doc = SimpleDocTemplate(buffer, pagesize=landscape(letter))

    data = [
        [
            "S.No",
            "Media",
            "Type",
            "Event",
            "Sport",
            "Visibility",
            "Status",
            "Published",
            "Created",
        ]
    ]

    items = MediaItem.objects.all().order_by("-id")
    for index, item in enumerate(items, start=1):
        data.append(
            [
                index,
                item.title or "",
                item.media_type or "",
                item.event_name or "",
                item.sport_name or "",
                item.visibility or "",
                item.status or "",
                "Yes" if item.is_published else "No",
                item.created_at.strftime("%Y-%m-%d") if item.created_at else "",
            ]
        )

    table = Table(data, repeatRows=1)
    table.setStyle(
        TableStyle(
            [
                ("BACKGROUND", (0, 0), (-1, 0), colors.HexColor("#1f4db8")),
                ("TEXTCOLOR", (0, 0), (-1, 0), colors.white),
                ("FONTNAME", (0, 0), (-1, 0), "Helvetica-Bold"),
                ("GRID", (0, 0), (-1, -1), 0.5, colors.grey),
                ("BACKGROUND", (0, 1), (-1, -1), colors.whitesmoke),
                ("FONTSIZE", (0, 0), (-1, -1), 8),
            ]
        )
    )

    doc.build([table])
    buffer.seek(0)

    return FileResponse(
        buffer,
        as_attachment=True,
        filename="media_report.pdf",
        content_type="application/pdf",
    )