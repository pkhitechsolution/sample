import io
from decimal import Decimal, InvalidOperation

import pandas as pd
from django.db.models import Sum, Q
from django.http import FileResponse, HttpResponse
from openpyxl import Workbook
from reportlab.lib import colors
from reportlab.lib.pagesizes import landscape, letter
from reportlab.platypus import SimpleDocTemplate, Table, TableStyle

from rest_framework import status, viewsets
from rest_framework.decorators import api_view
from rest_framework.response import Response

from .models import InventoryCategory, InventoryItem
from .serializers import InventoryItemSerializer


class InventoryItemViewSet(viewsets.ModelViewSet):
    queryset = InventoryItem.objects.select_related("category").all().order_by("-id")
    serializer_class = InventoryItemSerializer

    def get_queryset(self):
        queryset = super().get_queryset()

        search = self.request.query_params.get("search", "").strip()
        category = self.request.query_params.get("category", "").strip()
        status_value = self.request.query_params.get("status", "").strip()

        if search:
            queryset = queryset.filter(
                Q(item_name__icontains=search)
                | Q(sku__icontains=search)
                | Q(brand__icontains=search)
                | Q(supplier__icontains=search)
                | Q(location__icontains=search)
                | Q(category__name__icontains=search)
            )

        if category:
            if category.isdigit():
                queryset = queryset.filter(category_id=int(category))
            else:
                queryset = queryset.filter(category__name__iexact=category)

        if status_value:
            queryset = queryset.filter(status__iexact=status_value)

        return queryset


@api_view(["GET"])
def inventory_categories(request):
    categories = InventoryCategory.objects.all().order_by("name").values("id", "name")
    return Response(list(categories))


@api_view(["GET"])
def inventory_dashboard_summary(request):
    queryset = InventoryItem.objects.all()

    total_items = queryset.count()
    total_quantity = queryset.aggregate(total=Sum("quantity"))["total"] or 0
    available = queryset.filter(quantity__gt=0).count()
    out_of_stock = queryset.filter(quantity__lte=0).count()

    return Response(
        {
            "total_items": total_items,
            "total_quantity": total_quantity,
            "available": available,
            "out_of_stock": out_of_stock,
        }
    )


@api_view(["GET"])
def download_inventory_template(request):
    workbook = Workbook()
    worksheet = workbook.active
    worksheet.title = "Inventory Template"

    headers = [
        "item_name",
        "category",
        "sku",
        "brand",
        "quantity",
        "unit_price",
        "status",
        "supplier",
        "location",
    ]
    worksheet.append(headers)

    output = io.BytesIO()
    workbook.save(output)
    output.seek(0)

    return FileResponse(
        output,
        as_attachment=True,
        filename="inventory_template.xlsx",
        content_type="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    )


def _clean_text(value):
    if pd.isna(value):
        return ""
    return str(value).strip()


def _clean_int(value, default=0):
    if pd.isna(value) or value == "":
        return default
    try:
        return int(float(value))
    except (TypeError, ValueError):
        return default


def _clean_decimal(value, default="0"):
    if pd.isna(value) or value == "":
        return Decimal(default)
    try:
        return Decimal(str(value)).quantize(Decimal("0.01"))
    except (InvalidOperation, ValueError, TypeError):
        return Decimal(default)


@api_view(["POST"])
def upload_inventory_excel(request):
    file = request.FILES.get("excel_file")

    if not file:
        return Response({"message": "No file uploaded."}, status=status.HTTP_400_BAD_REQUEST)

    try:
        df = pd.read_excel(file)
    except Exception as exc:
        return Response(
            {"message": f"Failed to read Excel file: {exc}"},
            status=status.HTTP_400_BAD_REQUEST,
        )

    df.columns = [str(col).strip().lower() for col in df.columns]

    required_columns = {"item_name"}
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
            item_name = _clean_text(row.get("item_name"))
            category_name = _clean_text(row.get("category"))
            sku = _clean_text(row.get("sku"))
            brand = _clean_text(row.get("brand"))
            quantity = _clean_int(row.get("quantity"), 0)
            unit_price = _clean_decimal(row.get("unit_price"), "0")
            status_value = _clean_text(row.get("status")).lower() or "available"
            supplier = _clean_text(row.get("supplier"))
            location = _clean_text(row.get("location"))

            if not item_name:
                skipped_count += 1
                errors.append(f"Row {index + 2}: item_name is required.")
                continue

            category_obj = None
            if category_name:
                category_obj, _ = InventoryCategory.objects.get_or_create(name=category_name)

            lookup_queryset = InventoryItem.objects.all()
            item_obj = None

            if sku:
                item_obj = lookup_queryset.filter(sku=sku).first()

            if item_obj is None:
                item_obj = lookup_queryset.filter(item_name=item_name, category=category_obj).first()

            if item_obj:
                item_obj.item_name = item_name
                item_obj.category = category_obj
                item_obj.sku = sku
                item_obj.brand = brand
                item_obj.quantity = quantity
                item_obj.unit_price = unit_price
                item_obj.status = status_value
                item_obj.supplier = supplier
                item_obj.location = location
                item_obj.save()
                updated_count += 1
            else:
                InventoryItem.objects.create(
                    item_name=item_name,
                    category=category_obj,
                    sku=sku,
                    brand=brand,
                    quantity=quantity,
                    unit_price=unit_price,
                    status=status_value,
                    supplier=supplier,
                    location=location,
                )
                created_count += 1

        except Exception as exc:
            skipped_count += 1
            errors.append(f"Row {index + 2}: {exc}")

    return Response(
        {
            "message": "Inventory Excel upload completed.",
            "created_count": created_count,
            "updated_count": updated_count,
            "skipped_count": skipped_count,
            "errors": errors[:20],
        }
    )


@api_view(["GET"])
def export_inventory_excel(request):
    workbook = Workbook()
    worksheet = workbook.active
    worksheet.title = "Inventory"

    headers = [
        "item_name",
        "category",
        "sku",
        "brand",
        "quantity",
        "unit_price",
        "status",
        "supplier",
        "location",
    ]
    worksheet.append(headers)

    items = InventoryItem.objects.select_related("category").all().order_by("-id")
    for item in items:
        worksheet.append(
            [
                item.item_name,
                item.category.name if item.category else "",
                item.sku,
                item.brand,
                item.quantity,
                float(item.unit_price or 0),
                item.status,
                item.supplier,
                item.location,
            ]
        )

    output = io.BytesIO()
    workbook.save(output)
    output.seek(0)

    return FileResponse(
        output,
        as_attachment=True,
        filename="inventory_export.xlsx",
        content_type="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    )


@api_view(["GET"])
def export_inventory_pdf(request):
    buffer = io.BytesIO()

    doc = SimpleDocTemplate(buffer, pagesize=landscape(letter))
    data = [
        [
            "S.No",
            "Item Name",
            "Category",
            "SKU",
            "Brand",
            "Quantity",
            "Unit Price",
            "Status",
            "Supplier",
            "Location",
        ]
    ]

    items = InventoryItem.objects.select_related("category").all().order_by("-id")
    for index, item in enumerate(items, start=1):
        data.append(
            [
                index,
                item.item_name or "",
                item.category.name if item.category else "",
                item.sku or "",
                item.brand or "",
                item.quantity or 0,
                str(item.unit_price or 0),
                item.status or "",
                item.supplier or "",
                item.location or "",
            ]
        )

    table = Table(data)
    table.setStyle(
        TableStyle(
            [
                ("BACKGROUND", (0, 0), (-1, 0), colors.HexColor("#1f4db8")),
                ("TEXTCOLOR", (0, 0), (-1, 0), colors.white),
                ("FONTNAME", (0, 0), (-1, 0), "Helvetica-Bold"),
                ("GRID", (0, 0), (-1, -1), 0.5, colors.grey),
                ("FONTSIZE", (0, 0), (-1, -1), 8),
                ("BACKGROUND", (0, 1), (-1, -1), colors.whitesmoke),
            ]
        )
    )

    doc.build([table])
    buffer.seek(0)

    return HttpResponse(buffer, content_type="application/pdf", headers={
        "Content-Disposition": 'attachment; filename="inventory_report.pdf"'
    })