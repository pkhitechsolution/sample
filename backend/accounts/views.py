from decimal import Decimal
from io import BytesIO
from pathlib import Path

import pandas as pd
from django.db.models import Count, Q, Sum
from django.http import HttpResponse
from django.contrib.auth import get_user_model
from rest_framework import viewsets
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import AllowAny
from rest_framework.response import Response
from rest_framework.authtoken.models import Token
from reportlab.lib import colors
from reportlab.lib.pagesizes import A4, landscape
from reportlab.lib.units import mm
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.platypus import (
    SimpleDocTemplate,
    Table,
    TableStyle,
    Paragraph,
    Spacer,
)

from .models import Transaction
from .serializers import TransactionSerializer


class TransactionViewSet(viewsets.ModelViewSet):
    queryset = Transaction.objects.all().order_by("-date", "-id")
    serializer_class = TransactionSerializer
    permission_classes = [AllowAny]


@api_view(["POST"])
@permission_classes([AllowAny])
def login_view(request):
    username = (request.data.get("username") or "").strip()
    password = request.data.get("password") or ""

    if not username or not password:
        return Response({"error": "Username and password required"}, status=400)

    User = get_user_model()

    try:
        user = User.objects.get(username=username)
    except User.DoesNotExist:
        return Response({"error": "Invalid credentials"}, status=401)

    if not user.check_password(password):
        return Response({"error": "Invalid credentials"}, status=401)

    if not user.is_active:
        return Response({"error": "User inactive"}, status=401)

    token, _ = Token.objects.get_or_create(user=user)

    return Response({
        "token": token.key,
        "user": {
            "id": user.id,
            "username": getattr(user, "username", ""),
            "email": getattr(user, "email", ""),
            "is_staff": getattr(user, "is_staff", False),
            "is_superuser": getattr(user, "is_superuser", False),
        }
    })


@api_view(["GET"])
@permission_classes([AllowAny])
def accounts_summary(request):
    income_data = Transaction.objects.filter(
        transaction_type="income",
        status="completed"
    ).aggregate(total=Sum("amount"))

    expense_data = Transaction.objects.filter(
        transaction_type="expense",
        status="completed"
    ).aggregate(total=Sum("amount"))

    counts = Transaction.objects.aggregate(
        total_entries=Count("id"),
        pending_count=Count("id", filter=Q(status="pending")),
        completed_count=Count("id", filter=Q(status="completed")),
        cancelled_count=Count("id", filter=Q(status="cancelled")),
    )

    total_income = income_data["total"] or Decimal("0.00")
    total_expense = expense_data["total"] or Decimal("0.00")
    balance = total_income - total_expense

    return Response({
        "total_entries": counts["total_entries"] or 0,
        "total_income": total_income,
        "total_expense": total_expense,
        "balance": balance,
        "pending_count": counts["pending_count"] or 0,
        "completed_count": counts["completed_count"] or 0,
        "cancelled_count": counts["cancelled_count"] or 0,
    })


@api_view(["GET"])
@permission_classes([AllowAny])
def download_accounts_template(request):
    columns = [
        "date",
        "transaction_type",
        "category",
        "description",
        "amount",
        "payment_method",
        "reference_no",
        "status",
    ]

    df = pd.DataFrame(columns=columns)
    buffer = BytesIO()

    with pd.ExcelWriter(buffer, engine="openpyxl") as writer:
        df.to_excel(writer, index=False, sheet_name="Accounts")

    buffer.seek(0)

    response = HttpResponse(
        buffer.getvalue(),
        content_type="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    )
    response["Content-Disposition"] = 'attachment; filename="accounts_template.xlsx"'
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
@permission_classes([AllowAny])
def upload_accounts_excel(request):
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

        required_columns = [
            "date",
            "transaction_type",
            "category",
            "description",
            "amount",
            "payment_method",
            "reference_no",
            "status",
        ]

        df.columns = [str(col).strip().lower() for col in df.columns]
        missing_columns = [col for col in required_columns if col not in df.columns]

        if missing_columns:
            return Response(
                {"detail": f"Missing columns: {', '.join(missing_columns)}"},
                status=400,
            )

        created_count = 0
        skipped_count = 0

        for _, row in df.iterrows():
            date_value = row.get("date")
            transaction_type = str(row.get("transaction_type", "")).strip().lower()
            category = str(row.get("category", "")).strip()

            description = row.get("description", "")
            if pd.isna(description):
                description = ""
            else:
                description = str(description).strip()

            amount = row.get("amount")

            payment_method = row.get("payment_method", "cash")
            payment_method = "" if pd.isna(payment_method) else str(payment_method).strip().lower()

            reference_no = row.get("reference_no", "")
            if pd.isna(reference_no):
                reference_no = ""
            else:
                reference_no = str(reference_no).strip()

            status = row.get("status", "completed")
            status = "" if pd.isna(status) else str(status).strip().lower()

            if pd.isna(date_value) or not category or pd.isna(amount):
                skipped_count += 1
                continue

            if transaction_type not in ["income", "expense"]:
                skipped_count += 1
                continue

            if payment_method not in ["cash", "upi", "bank", "card", "cheque"]:
                payment_method = "cash"

            if status not in ["completed", "pending", "cancelled"]:
                status = "completed"

            parsed_date = pd.to_datetime(date_value, errors="coerce")
            if pd.isna(parsed_date):
                skipped_count += 1
                continue

            Transaction.objects.create(
                date=parsed_date.date(),
                transaction_type=transaction_type,
                category=category,
                description=description,
                amount=amount,
                payment_method=payment_method,
                reference_no=reference_no or None,
                status=status,
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
@permission_classes([AllowAny])
def export_accounts_excel(request):
    queryset = Transaction.objects.all().order_by("-date", "-id")

    data = []
    for obj in queryset:
        data.append({
            "date": obj.date,
            "transaction_type": obj.transaction_type,
            "category": obj.category,
            "description": obj.description,
            "amount": obj.amount,
            "payment_method": obj.payment_method,
            "reference_no": obj.reference_no,
            "status": obj.status,
        })

    df = pd.DataFrame(data)
    buffer = BytesIO()

    with pd.ExcelWriter(buffer, engine="openpyxl") as writer:
        df.to_excel(writer, index=False, sheet_name="Accounts Export")

    buffer.seek(0)

    response = HttpResponse(
        buffer.getvalue(),
        content_type="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    )
    response["Content-Disposition"] = 'attachment; filename="accounts_export.xlsx"'
    return response


@api_view(["GET"])
@permission_classes([AllowAny])
def export_accounts_pdf(request):
    queryset = Transaction.objects.all().order_by("-date", "-id")

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
        spaceAfter=0,
        spaceBefore=0,
    )

    header_cell_style = ParagraphStyle(
        name="HeaderCellStyle",
        parent=styles["BodyText"],
        fontName="Helvetica-Bold",
        fontSize=8,
        leading=9,
        textColor=colors.white,
        wordWrap="CJK",
        alignment=0,
    )

    elements = []

    elements.append(Paragraph("Accounts Report", title_style))
    elements.append(Spacer(1, 6))

    total_income = sum(
        Decimal(str(obj.amount))
        for obj in queryset
        if obj.transaction_type == "income" and obj.status == "completed"
    )
    total_expense = sum(
        Decimal(str(obj.amount))
        for obj in queryset
        if obj.transaction_type == "expense" and obj.status == "completed"
    )
    balance = total_income - total_expense

    summary_text = (
        f"Total Transactions: {queryset.count()} &nbsp;&nbsp;&nbsp; "
        f"Total Income: ₹ {total_income} &nbsp;&nbsp;&nbsp; "
        f"Total Expense: ₹ {total_expense} &nbsp;&nbsp;&nbsp; "
        f"Balance: ₹ {balance}"
    )
    elements.append(Paragraph(summary_text, normal_style))
    elements.append(Spacer(1, 8))

    table_data = [[
        Paragraph("S.No", header_cell_style),
        Paragraph("Date", header_cell_style),
        Paragraph("Category", header_cell_style),
        Paragraph("Type", header_cell_style),
        Paragraph("Description", header_cell_style),
        Paragraph("Amount", header_cell_style),
        Paragraph("Payment Method", header_cell_style),
        Paragraph("Reference No", header_cell_style),
        Paragraph("Status", header_cell_style),
    ]]

    for index, obj in enumerate(queryset, start=1):
        table_data.append([
            Paragraph(str(index), cell_style),
            Paragraph(obj.date.strftime("%d %b %Y") if obj.date else "-", cell_style),
            Paragraph(obj.category or "-", cell_style),
            Paragraph(obj.transaction_type.title() if obj.transaction_type else "-", cell_style),
            Paragraph(obj.description or "-", cell_style),
            Paragraph(f"₹ {obj.amount}", cell_style),
            Paragraph(obj.payment_method.title() if obj.payment_method else "-", cell_style),
            Paragraph(obj.reference_no or "-", cell_style),
            Paragraph(obj.status.title() if obj.status else "-", cell_style),
        ])

    col_widths = [
        12 * mm,
        22 * mm,
        30 * mm,
        18 * mm,
        72 * mm,
        22 * mm,
        34 * mm,
        34 * mm,
        22 * mm,
    ]

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
    response["Content-Disposition"] = 'attachment; filename="accounts_report.pdf"'
    return response