import React, { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import styles from "./Inventory.module.css";
import {
  createInventoryItem,
  getInventoryItem,
  updateInventoryItem,
  getInventoryCategories,
} from "../../api/inventory";

const initialForm = {
  item_name: "",
  category: "",
  sku: "",
  brand: "",
  quantity: "",
  unit_price: "",
  status: "available",
  supplier: "",
  location: "",
  description: "",
};

export default function InventoryFormPage() {
  const navigate = useNavigate();
  const { id } = useParams();
  const isEdit = Boolean(id);

  const [formData, setFormData] = useState(initialForm);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(isEdit);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const loadData = async () => {
      try {
        const categoriesResponse = await getInventoryCategories();
        const categoriesData = categoriesResponse?.data;

        if (Array.isArray(categoriesData)) {
          setCategories(categoriesData);
        } else if (Array.isArray(categoriesData?.results)) {
          setCategories(categoriesData.results);
        } else {
          setCategories([]);
        }

        if (!isEdit) return;

        setLoading(true);
        const response = await getInventoryItem(id);
        const data = response?.data || {};

        setFormData({
          item_name: data?.item_name || data?.name || "",
          category: data?.category || "",
          sku: data?.sku || "",
          brand: data?.brand || "",
          quantity: data?.quantity ?? "",
          unit_price: data?.unit_price ?? "",
          status: data?.status || "available",
          supplier: data?.supplier || "",
          location: data?.location || "",
          description: data?.description || data?.remarks || "",
        });
      } catch (error) {
        console.error("Load failed:", error);
        alert(
          error?.response?.data?.detail ||
            error?.response?.data?.message ||
            "Failed to load inventory record."
        );
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [id, isEdit]);

  const handleChange = (event) => {
    const { name, value } = event.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    if (!formData.item_name.trim()) {
      alert("Item name is required.");
      return;
    }

    try {
      setSaving(true);

      const payload = {
        ...formData,
        quantity: formData.quantity === "" ? 0 : Number(formData.quantity),
        unit_price: formData.unit_price === "" ? 0 : Number(formData.unit_price),
      };

      if (isEdit) {
        await updateInventoryItem(id, payload);
        alert("Inventory item updated successfully.");
      } else {
        await createInventoryItem(payload);
        alert("Inventory item created successfully.");
      }

      navigate("/inventory");
    } catch (error) {
      console.error("Save failed:", error);
      alert(
        error?.response?.data?.detail ||
          error?.response?.data?.message ||
          "Failed to save inventory record."
      );
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <div className={styles.page}>Loading inventory record...</div>;
  }

  const categoryOptions = categories
    .map((item) =>
      typeof item === "string" ? item : item?.name || item?.category || item?.title
    )
    .filter(Boolean);

  return (
    <div className={styles.page}>
      <div className={styles.formCard}>
        <div className={styles.formHeader}>
          <div className={styles.heroBadge}>SPORTS TALENT MANAGEMENT</div>
          <h1 className={styles.formTitle}>
            {isEdit ? "Edit Inventory" : "Add Inventory"}
          </h1>
          <p className={styles.formSubtitle}>
            Create, update, and maintain inventory details with the same professional layout.
          </p>
        </div>

        <form onSubmit={handleSubmit} className={styles.formGrid}>
          <div className={styles.fieldGroup}>
            <label className={styles.fieldLabel}>Item Name</label>
            <input
              type="text"
              name="item_name"
              value={formData.item_name}
              onChange={handleChange}
              className={styles.formInput}
              placeholder="Enter item name"
            />
          </div>

          <div className={styles.fieldGroup}>
            <label className={styles.fieldLabel}>Category</label>
            {categoryOptions.length > 0 ? (
              <select
                name="category"
                value={formData.category}
                onChange={handleChange}
                className={styles.formInput}
              >
                <option value="">Select category</option>
                {categoryOptions.map((item) => (
                  <option key={item} value={item}>
                    {item}
                  </option>
                ))}
              </select>
            ) : (
              <input
                type="text"
                name="category"
                value={formData.category}
                onChange={handleChange}
                className={styles.formInput}
                placeholder="Enter category"
              />
            )}
          </div>

          <div className={styles.fieldGroup}>
            <label className={styles.fieldLabel}>SKU</label>
            <input
              type="text"
              name="sku"
              value={formData.sku}
              onChange={handleChange}
              className={styles.formInput}
              placeholder="Enter SKU"
            />
          </div>

          <div className={styles.fieldGroup}>
            <label className={styles.fieldLabel}>Brand</label>
            <input
              type="text"
              name="brand"
              value={formData.brand}
              onChange={handleChange}
              className={styles.formInput}
              placeholder="Enter brand"
            />
          </div>

          <div className={styles.fieldGroup}>
            <label className={styles.fieldLabel}>Quantity</label>
            <input
              type="number"
              name="quantity"
              value={formData.quantity}
              onChange={handleChange}
              className={styles.formInput}
              placeholder="Enter quantity"
              min="0"
            />
          </div>

          <div className={styles.fieldGroup}>
            <label className={styles.fieldLabel}>Unit Price</label>
            <input
              type="number"
              name="unit_price"
              value={formData.unit_price}
              onChange={handleChange}
              className={styles.formInput}
              placeholder="Enter unit price"
              min="0"
              step="0.01"
            />
          </div>

          <div className={styles.fieldGroup}>
            <label className={styles.fieldLabel}>Status</label>
            <select
              name="status"
              value={formData.status}
              onChange={handleChange}
              className={styles.formInput}
            >
              <option value="available">Available</option>
              <option value="low_stock">Low Stock</option>
              <option value="out_of_stock">Out Of Stock</option>
            </select>
          </div>

          <div className={styles.fieldGroup}>
            <label className={styles.fieldLabel}>Supplier</label>
            <input
              type="text"
              name="supplier"
              value={formData.supplier}
              onChange={handleChange}
              className={styles.formInput}
              placeholder="Enter supplier"
            />
          </div>

          <div className={styles.fieldGroup}>
            <label className={styles.fieldLabel}>Location</label>
            <input
              type="text"
              name="location"
              value={formData.location}
              onChange={handleChange}
              className={styles.formInput}
              placeholder="Enter location"
            />
          </div>

          <div className={`${styles.fieldGroup} ${styles.fullWidth}`}>
            <label className={styles.fieldLabel}>Description</label>
            <textarea
              name="description"
              value={formData.description}
              onChange={handleChange}
              className={styles.formTextarea}
              placeholder="Enter description"
              rows={5}
            />
          </div>

          <div className={styles.formActions}>
            <button
              type="button"
              className={styles.secondaryBtn}
              onClick={() => navigate("/inventory")}
              disabled={saving}
            >
              Cancel
            </button>

            <button
              type="submit"
              className={styles.primaryBtn}
              disabled={saving}
            >
              {saving ? "Saving..." : isEdit ? "Update Inventory" : "Save Inventory"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}