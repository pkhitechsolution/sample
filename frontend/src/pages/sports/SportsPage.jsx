import React, { useEffect, useState } from "react";
import SportForm from "./SportForm";
import SportTable from "./SportTable";
import {
  getSports,
  createSport,
  updateSport,
  deleteSport,
} from "../../services/sportsService";
import styles from "./SportsPage.module.css";

const initialForm = {
  name: "",
  category: "outdoor",
  description: "",
  min_players: 1,
  max_players: 1,
  is_active: true,
};

export default function SportsPage() {
  const [sports, setSports] = useState([]);
  const [formData, setFormData] = useState(initialForm);
  const [editingId, setEditingId] = useState(null);
  const [loading, setLoading] = useState(false);

  const normalizeData = (data) => {
    if (Array.isArray(data)) return data;
    if (data?.results) return data.results;
    return [];
  };

  const loadSports = async () => {
    try {
      setLoading(true);
      const data = await getSports();
      setSports(normalizeData(data));
    } catch (error) {
      console.error("Error loading sports:", error);
      alert("Failed to load sports");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadSports();
  }, []);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;

    setFormData((prev) => ({
      ...prev,
      [name]:
        type === "checkbox"
          ? checked
          : ["min_players", "max_players"].includes(name)
          ? Number(value)
          : value,
    }));
  };

  const resetForm = () => {
    setFormData(initialForm);
    setEditingId(null);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (formData.min_players > formData.max_players) {
      alert("Min players cannot be greater than max players");
      return;
    }

    try {
      if (editingId) {
        await updateSport(editingId, formData);
        alert("Sport updated successfully");
      } else {
        await createSport(formData);
        alert("Sport created successfully");
      }

      resetForm();
      loadSports();
    } catch (error) {
      console.error("Save error:", error);
      alert("Failed to save sport");
    }
  };

  const handleEdit = (sport) => {
    setEditingId(sport.id);
    setFormData({
      name: sport.name || "",
      category: sport.category || "outdoor",
      description: sport.description || "",
      min_players: sport.min_players ?? 1,
      max_players: sport.max_players ?? 1,
      is_active: sport.is_active ?? true,
    });
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleDelete = async (id) => {
    const confirmed = window.confirm("Are you sure you want to delete this sport?");
    if (!confirmed) return;

    try {
      await deleteSport(id);
      alert("Sport deleted successfully");
      loadSports();
    } catch (error) {
      console.error("Delete error:", error);
      alert("Failed to delete sport");
    }
  };

  return (
    <div className={styles.page}>
      <div className="page-head-block">
        <h2>Sports Management</h2>
        <p>Manage sports master records for the entire system.</p>
      </div>

      <div className={styles.card}>
        <SportForm
          formData={formData}
          editingId={editingId}
          onChange={handleChange}
          onSubmit={handleSubmit}
          onClear={resetForm}
        />
      </div>

      <div className={styles.card}>
        <SportTable
          sports={sports}
          loading={loading}
          onEdit={handleEdit}
          onDelete={handleDelete}
        />
      </div>
    </div>
  );
}