from decimal import Decimal
from io import BytesIO
from pathlib import Path

import pandas as pd
from django.db.models import Count
from django.http import HttpResponse
from django.utils import timezone
from reportlab.lib import colors
from reportlab.lib.pagesizes import A4, landscape
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.units import mm
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle
from rest_framework import status, viewsets
from rest_framework.decorators import action, api_view
from rest_framework.response import Response

from .models import CommunicationTemplate, Communication
from .serializers import CommunicationTemplateSerializer, CommunicationSerializer


class CommunicationTemplateViewSet(viewsets.ModelViewSet):
    queryset = CommunicationTemplate.objects.all().order_by("name")
    serializer_class = CommunicationTemplateSerializer


class CommunicationViewSet(viewsets.ModelViewSet):
    queryset = Communication.objects.all().order_by("-created_at", "-id")
    serializer_class = CommunicationSerializer

    def get_queryset(self):
        queryset = super().get_queryset()
        status_param = (self.request.query_params.get("status") or "").strip().lower()
        channel = (self.request.query_params.get("channel") or "").strip().lower()
        audience = (self.request.query_params.get("audience") or "").strip().lower()
        search = (self.request.query_params.get("search") or "").strip()

        if status_param:
            queryset = queryset.filter(status=status_param)

        if channel:
            queryset = queryset.filter(channel=channel)

        if audience:
            queryset = queryset.filter(audience=audience)

        if search:
            queryset = queryset.filter(title__icontains=search) | queryset.filter(message__icontains=search)

        return queryset.distinct()

    @action(detail=True, methods=["post"], url_path="send")
    def send_now(self, request, pk=None):
        obj = self.get_object()
        obj.status = "sent"
        obj.sent_at = timezone.now()

        if obj.recipients_count == 0:
            obj.recipients_count = 100

        obj.success_count = obj.recipients_count
        obj.failed_count = 0
        obj.save()

        return Response(
            {"message": "Communication marked as sent successfully."},
            status=status.HTTP_200_OK,
        )

    @action(detail=True, methods=["post"], url_path="save-as-draft")
    def save_as_draft(self, request, pk=None):
        obj = self.get_object()
        obj.status = "draft"
        obj.save(update_fields=["status", "updated_at"])

        return Response(
            {"message": "Communication saved as draft."},
            status=status.HTTP_200_OK,
        )


@api_view(["GET"])
def communications_summary(request):
    total = Communication.objects.count()
    draft = Communication.objects.filter(status="draft").count()
    scheduled = Communication.objects.filter(status="scheduled").count()
    sent = Communication.objects.filter(status="sent").count()
    failed = Communication.objects.filter(status="failed").count()

    channel_stats = (
        Communication.objects.values("channel")
        .annotate(count=Count("id"))
        .order_by("channel")
    )

    audience_stats = (
        Communication.objects.values("audience")
        .annotate(count=Count("id"))
        .order_by("audience")
    )

    return Response({
        "total": total,
        "draft": draft,
        "scheduled": scheduled,
        "sent": sent,
        "failed": failed,
        "channel_stats": list(channel_stats),
        "audience_stats": list(audience_stats),
    })


@api_view(["GET"])
def download_communications_template(request):
    columns = [
        "title",
        "subject",
        "message",
        "channel",
        "audience",
        "status",
        "event_name",
        "scheduled_at",
        "recipients_count",
        "success_count",
        "failed_count",
        "created_by",
        "remarks",
    ]

    df = pd.DataFrame(columns=columns)
    buffer = BytesIO()

    with pd.ExcelWriter(buffer, engine="openpyxl") as writer:
        df.to_excel(writer, index=False, sheet_name="Communications")

    buffer.seek(0)

    response = HttpResponse(
        buffer.getvalue(),
        content_type="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    )
    response["Content-Disposition"] = 'attachment; filename="communications_template.xlsx"'
    return response


def _read_uploaded_excel(file):
    filename = getattr(file, "name", "") or ""
    extension = Path(filename).suffix.lower()

    if extension == ".xlsx":
        return pd.read_excel(file, engine="openpyxl")

    if extension == ".xls":
        return pd.read_excel(file, engine="xlrd")

    try:
        file.seek(0)
    except Exception:
        pass

    try:
        return pd.read_excel(file, engine="openpyxl")
    except Exception:
        try:
            file.seek(0)
        except Exception:
            pass
        return pd.read_excel(file, engine="xlrd")


@api_view(["POST"])
def upload_communications_excel(request):
    file = request.FILES.get("file") or request.FILES.get("excel_file")
    if not file:
        return Response({"detail": "No file uploaded."}, status=400)

    filename = getattr(file, "name", "") or ""
    extension = Path(filename).suffix.lower()

    if extension not in [".xlsx", ".xls"]:
        return Response(
            {"detail": "Please upload a valid Excel file (.xlsx or .xls)."},
            status=400,
        )

    try:
        df = _read_uploaded_excel(file)
        df.columns = [str(col).strip().lower() for col in df.columns]

        required_columns = ["title", "message", "channel", "audience", "status"]
        missing_columns = [col for col in required_columns if col not in df.columns]

        if missing_columns:
            return Response(
                {"detail": f"Missing columns: {', '.join(missing_columns)}"},
                status=400,
            )

        valid_channels = {"email", "sms", "whatsapp", "notice", "press_release"}
        valid_audiences = {"all", "students", "parents", "teams", "officials", "staff", "media"}
        valid_statuses = {"draft", "scheduled", "sent", "failed"}

        created_count = 0
        skipped_count = 0

        for _, row in df.iterrows():
            title = str(row.get("title", "")).strip()
            subject = str(row.get("subject", "")).strip() if not pd.isna(row.get("subject")) else ""
            message = str(row.get("message", "")).strip()
            channel = str(row.get("channel", "")).strip().lower()
            audience = str(row.get("audience", "")).strip().lower()
            status_value = str(row.get("status", "")).strip().lower()
            event_name = str(row.get("event_name", "")).strip() if not pd.isna(row.get("event_name")) else ""
            created_by = str(row.get("created_by", "")).strip() if not pd.isna(row.get("created_by")) else ""
            remarks = str(row.get("remarks", "")).strip() if not pd.isna(row.get("remarks")) else ""

            recipients_count = row.get("recipients_count", 0)
            success_count = row.get("success_count", 0)
            failed_count = row.get("failed_count", 0)

            scheduled_at = row.get("scheduled_at", None)

            if not title or not message:
                skipped_count += 1
                continue

            if channel not in valid_channels:
                channel = "notice"

            if audience not in valid_audiences:
                audience = "all"

            if status_value not in valid_statuses:
                status_value = "draft"

            parsed_scheduled_at = None
            if scheduled_at is not None and not pd.isna(scheduled_at):
                parsed = pd.to_datetime(scheduled_at, errors="coerce")
                if not pd.isna(parsed):
                    parsed_scheduled_at = parsed.to_pydatetime()

            try:
                recipients_count = int(0 if pd.isna(recipients_count) else recipients_count)
            except Exception:
                recipients_count = 0

            try:
                success_count = int(0 if pd.isna(success_count) else success_count)
            except Exception:
                success_count = 0

            try:
                failed_count = int(0 if pd.isna(failed_count) else failed_count)
            except Exception:
                failed_count = 0

            sent_at = timezone.now() if status_value == "sent" else None

            Communication.objects.create(
                title=title,
                subject=subject,
                message=message,
                channel=channel,
                audience=audience,
                status=status_value,
                event_name=event_name,
                scheduled_at=parsed_scheduled_at,
                sent_at=sent_at,
                recipients_count=recipients_count,
                success_count=success_count,
                failed_count=failed_count,
                created_by=created_by,
                remarks=remarks,
            )
            created_count += 1

        return Response({
            "detail": f"{created_count} records uploaded successfully.",
            "created_count": created_count,
            "skipped_count": skipped_count,
        })

    except ImportError:
        return Response(
            {"detail": "Required Excel libraries are missing. Install openpyxl and xlrd."},
            status=400,
        )
    except Exception as e:
        return Response({"detail": str(e)}, status=400)


@api_view(["GET"])
def export_communications_excel(request):
    queryset = Communication.objects.all().order_by("-created_at", "-id")

    data = []
    for obj in queryset:
        data.append({
            "title": obj.title,
            "subject": obj.subject,
            "message": obj.message,
            "channel": obj.channel,
            "audience": obj.audience,
            "status": obj.status,
            "event_name": obj.event_name,
            "scheduled_at": obj.scheduled_at,
            "sent_at": obj.sent_at,
            "recipients_count": obj.recipients_count,
            "success_count": obj.success_count,
            "failed_count": obj.failed_count,
            "created_by": obj.created_by,
            "remarks": obj.remarks,
            "created_at": obj.created_at,
        })

    df = pd.DataFrame(data)
    buffer = BytesIO()

    with pd.ExcelWriter(buffer, engine="openpyxl") as writer:
        df.to_excel(writer, index=False, sheet_name="Communications Export")

    buffer.seek(0)

    response = HttpResponse(
        buffer.getvalue(),
        content_type="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    )
    response["Content-Disposition"] = 'attachment; filename="communications_export.xlsx"'
    return response


@api_view(["GET"])
def export_communications_pdf(request):
    queryset = Communication.objects.all().order_by("-created_at", "-id")

    buffer = BytesIO()
    doc = SimpleDocTemplate(
        buffer,
        pagesize=landscape(A4),
        leftMargin=8 * mm,
        rightMargin=8 * mm,
        topMargin=10 * mm,
        bottomMargin=10 * mm,
    )

    styles = getSampleStyleSheet()
    title_style = styles["Title"]
    normal_style = styles["Normal"]

    cell_style = ParagraphStyle(
        name="CellStyle",
        parent=styles["BodyText"],
        fontName="Helvetica",
        fontSize=7.5,
        leading=9,
        wordWrap="CJK",
    )

    header_cell_style = ParagraphStyle(
        name="HeaderCellStyle",
        parent=styles["BodyText"],
        fontName="Helvetica-Bold",
        fontSize=8,
        leading=9,
        textColor=colors.white,
        wordWrap="CJK",
    )

    elements = []
    elements.append(Paragraph("Communications Report", title_style))
    elements.append(Spacer(1, 6))

    summary_text = (
        f"Total Communications: {queryset.count()} &nbsp;&nbsp;&nbsp; "
        f"Draft: {queryset.filter(status='draft').count()} &nbsp;&nbsp;&nbsp; "
        f"Scheduled: {queryset.filter(status='scheduled').count()} &nbsp;&nbsp;&nbsp; "
        f"Sent: {queryset.filter(status='sent').count()} &nbsp;&nbsp;&nbsp; "
        f"Failed: {queryset.filter(status='failed').count()}"
    )
    elements.append(Paragraph(summary_text, normal_style))
    elements.append(Spacer(1, 8))

    table_data = [[
        Paragraph("S.No", header_cell_style),
        Paragraph("Title", header_cell_style),
        Paragraph("Channel", header_cell_style),
        Paragraph("Audience", header_cell_style),
        Paragraph("Message", header_cell_style),
        Paragraph("Status", header_cell_style),
        Paragraph("Created On", header_cell_style),
    ]]

    for index, obj in enumerate(queryset, start=1):
        table_data.append([
            Paragraph(str(index), cell_style),
            Paragraph(obj.title or "-", cell_style),
            Paragraph(obj.get_channel_display() if obj.channel else "-", cell_style),
            Paragraph(obj.get_audience_display() if obj.audience else "-", cell_style),
            Paragraph(obj.message or "-", cell_style),
            Paragraph(obj.get_status_display() if obj.status else "-", cell_style),
            Paragraph(obj.created_at.strftime("%d %b %Y %I:%M %p") if obj.created_at else "-", cell_style),
        ])

    col_widths = [12 * mm, 45 * mm, 26 * mm, 28 * mm, 110 * mm, 22 * mm, 35 * mm]

    table = Table(table_data, colWidths=col_widths, repeatRows=1)
    table.setStyle(TableStyle([
        ("BACKGROUND", (0, 0), (-1, 0), colors.HexColor("#21489e")),
        ("TEXTCOLOR", (0, 0), (-1, 0), colors.white),
        ("ALIGN", (0, 0), (-1, -1), "LEFT"),
        ("VALIGN", (0, 0), (-1, -1), "TOP"),
        ("ROWBACKGROUNDS", (0, 1), (-1, -1), [colors.whitesmoke, colors.HexColor("#eef4ff")]),
        ("GRID", (0, 0), (-1, -1), 0.35, colors.HexColor("#c9d7f0")),
        ("LEFTPADDING", (0, 0), (-1, -1), 4),
        ("RIGHTPADDING", (0, 0), (-1, -1), 4),
        ("TOPPADDING", (0, 0), (-1, 0), 7),
        ("BOTTOMPADDING", (0, 0), (-1, 0), 7),
        ("TOPPADDING", (0, 1), (-1, -1), 5),
        ("BOTTOMPADDING", (0, 1), (-1, -1), 5),
    ]))

    elements.append(table)
    doc.build(elements)
    buffer.seek(0)

    response = HttpResponse(buffer.getvalue(), content_type="application/pdf")
    response["Content-Disposition"] = 'attachment; filename="communications_report.pdf"'
    return response