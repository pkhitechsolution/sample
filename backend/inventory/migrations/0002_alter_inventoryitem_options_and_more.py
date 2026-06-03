from django.db import migrations, models


def sync_inventory_schema(apps, schema_editor):
    connection = schema_editor.connection
    vendor = connection.vendor

    if vendor != "mysql":
        # This repair migration is written for MySQL drift.
        return

    item_table = "inventory_inventoryitem"
    category_table = "inventory_inventorycategory"
    movement_table = "inventory_inventorymovement"

    def table_exists(table_name):
        with connection.cursor() as cursor:
            cursor.execute(
                """
                SELECT COUNT(*)
                FROM information_schema.tables
                WHERE table_schema = DATABASE() AND table_name = %s
                """,
                [table_name],
            )
            return cursor.fetchone()[0] > 0

    def get_columns(table_name):
        with connection.cursor() as cursor:
            cursor.execute(
                """
                SELECT column_name
                FROM information_schema.columns
                WHERE table_schema = DATABASE() AND table_name = %s
                """,
                [table_name],
            )
            return {row[0] for row in cursor.fetchall()}

    def execute(sql):
        with connection.cursor() as cursor:
            cursor.execute(sql)

    if table_exists(item_table):
        columns = get_columns(item_table)

        old_columns = [
            "last_movement_type",
            "minimum_quantity",
            "notes",
            "sku_code",
            "unit",
        ]

        for column_name in old_columns:
            if column_name in columns:
                execute(f"ALTER TABLE `{item_table}` DROP COLUMN `{column_name}`")

        columns = get_columns(item_table)

        if "brand" not in columns:
            execute(
                f"ALTER TABLE `{item_table}` "
                "ADD COLUMN `brand` VARCHAR(120) NOT NULL DEFAULT ''"
            )

        if "description" not in columns:
            execute(
                f"ALTER TABLE `{item_table}` "
                "ADD COLUMN `description` LONGTEXT NULL"
            )

        if "purchase_date" not in columns:
            execute(
                f"ALTER TABLE `{item_table}` "
                "ADD COLUMN `purchase_date` DATE NULL"
            )

        if "sku" not in columns:
            execute(
                f"ALTER TABLE `{item_table}` "
                "ADD COLUMN `sku` VARCHAR(100) NOT NULL DEFAULT ''"
            )

        if "status" not in columns:
            execute(
                f"ALTER TABLE `{item_table}` "
                "ADD COLUMN `status` VARCHAR(30) NOT NULL DEFAULT 'available'"
            )

        if "supplier" not in columns:
            execute(
                f"ALTER TABLE `{item_table}` "
                "ADD COLUMN `supplier` VARCHAR(150) NOT NULL DEFAULT ''"
            )

        if "unit_price" not in columns:
            execute(
                f"ALTER TABLE `{item_table}` "
                "ADD COLUMN `unit_price` DECIMAL(10,2) NOT NULL DEFAULT 0.00"
            )

    if table_exists(category_table):
        category_columns = get_columns(category_table)

        if "created_at" not in category_columns:
            execute(
                f"ALTER TABLE `{category_table}` "
                "ADD COLUMN `created_at` DATETIME(6) NULL DEFAULT CURRENT_TIMESTAMP(6)"
            )

        if "is_active" not in category_columns:
            execute(
                f"ALTER TABLE `{category_table}` "
                "ADD COLUMN `is_active` TINYINT(1) NOT NULL DEFAULT 1"
            )

    if table_exists(movement_table):
        execute(f"DROP TABLE `{movement_table}`")


class Migration(migrations.Migration):

    dependencies = [
        ("inventory", "0001_initial"),
    ]

    operations = [
        migrations.SeparateDatabaseAndState(
            database_operations=[
                migrations.RunPython(sync_inventory_schema, migrations.RunPython.noop),
            ],
            state_operations=[
                migrations.RemoveField(
                    model_name="inventoryitem",
                    name="last_movement_type",
                ),
                migrations.RemoveField(
                    model_name="inventoryitem",
                    name="minimum_quantity",
                ),
                migrations.RemoveField(
                    model_name="inventoryitem",
                    name="notes",
                ),
                migrations.RemoveField(
                    model_name="inventoryitem",
                    name="sku_code",
                ),
                migrations.RemoveField(
                    model_name="inventoryitem",
                    name="unit",
                ),
                migrations.AddField(
                    model_name="inventorycategory",
                    name="created_at",
                    field=models.DateTimeField(auto_now_add=True, null=True, blank=True),
                ),
                migrations.AddField(
                    model_name="inventorycategory",
                    name="is_active",
                    field=models.BooleanField(default=True),
                ),
                migrations.AddField(
                    model_name="inventoryitem",
                    name="brand",
                    field=models.CharField(max_length=120, blank=True, default=""),
                ),
                migrations.AddField(
                    model_name="inventoryitem",
                    name="description",
                    field=models.TextField(blank=True, default=""),
                ),
                migrations.AddField(
                    model_name="inventoryitem",
                    name="purchase_date",
                    field=models.DateField(null=True, blank=True),
                ),
                migrations.AddField(
                    model_name="inventoryitem",
                    name="sku",
                    field=models.CharField(max_length=100, blank=True, default=""),
                ),
                migrations.AddField(
                    model_name="inventoryitem",
                    name="status",
                    field=models.CharField(max_length=30, default="available"),
                ),
                migrations.AddField(
                    model_name="inventoryitem",
                    name="supplier",
                    field=models.CharField(max_length=150, blank=True, default=""),
                ),
                migrations.AddField(
                    model_name="inventoryitem",
                    name="unit_price",
                    field=models.DecimalField(max_digits=10, decimal_places=2, default=0),
                ),
                migrations.DeleteModel(
                    name="InventoryMovement",
                ),
            ],
        ),
    ]