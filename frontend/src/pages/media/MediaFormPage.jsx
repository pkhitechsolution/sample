import React, { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import styles from "./MediaFormPage.module.css";
import {
  createMediaItem,
  getMediaItem,
  updateMediaItem,
  getMediaCategories,
} from "../../api/media";

const initialForm = {
  title: "",
  category: "",
  media_type: "image",
  event_name: "",
  sport_name: "",
  visibility: "public",
  status: "active",
  is_published: false,
  description: "",
  file: null,
  thumbnail: null,
};

export default function MediaFormPage() {
  const navigate = useNavigate();
  const { id } = useParams();
  const isEdit = Boolean(id);

  const [formData, setFormData] = useState(initialForm);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(isEdit);
  const [saving, setSaving] = useState(false);
  const [errorText, setErrorText] = useState("");

  useEffect(() => {
    const loadData = async () => {
      try {
        setErrorText("");

        const categoriesResponse = await getMediaCategories();
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
        const response = await getMediaItem(id);
        const data = response?.data || {};

        setFormData({
          title: data?.title || "",
          category: data?.category || "",
          media_type: data?.media_type || "image",
          event_name: data?.event_name || "",
          sport_name: data?.sport_name || "",
          visibility: data?.visibility || "public",
          status: data?.status || "active",
          is_published: Boolean(data?.is_published),
          description: data?.description || "",
          file: null,
          thumbnail: null,
        });
      } catch (error) {
        setErrorText(
          error?.response?.data?.detail ||
            error?.response?.data?.message ||
            "Failed to load media record."
        );
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [id, isEdit]);

  const handleChange = (event) => {
    const { name, value, type, checked, files } = event.target;

    if (type === "checkbox") {
      setFormData((prev) => ({
        ...prev,
        [name]: checked,
      }));
      return;
    }

    if (type === "file") {
      setFormData((prev) => ({
        ...prev,
        [name]: files?.[0] || null,
      }));
      return;
    }

    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    if (!formData.title.trim()) {
      setErrorText("Media title is required.");
      return;
    }

    try {
      setSaving(true);
      setErrorText("");

      const payload = new FormData();
      payload.append("title", formData.title);
      payload.append("category", formData.category || "");
      payload.append("media_type", formData.media_type);
      payload.append("event_name", formData.event_name || "");
      payload.append("sport_name", formData.sport_name || "");
      payload.append("visibility", formData.visibility);
      payload.append("status", formData.status);
      payload.append("is_published", formData.is_published ? "true" : "false");
      payload.append("description", formData.description || "");

      if (formData.file) payload.append("file", formData.file);
      if (formData.thumbnail) payload.append("thumbnail", formData.thumbnail);

      if (isEdit) {
        await updateMediaItem(id, payload);
        alert("Media item updated successfully.");
      } else {
        await createMediaItem(payload);
        alert("Media item created successfully.");
      }

      navigate("/media");
    } catch (error) {
      setErrorText(
        error?.response?.data?.detail ||
          error?.response?.data?.message ||
          "Failed to save media record."
      );
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className={styles.page}>
        <div className={styles.formCard}>
          <div className={styles.loadingText}>Loading media record...</div>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.page}>
      <div className={styles.formCard}>
        <div className={styles.formHeader}>
          <h2 className={styles.formTitle}>
            {isEdit ? "Media Details" : "Media Details"}
          </h2>
          <p className={styles.formText}>
            Fill in the required fields carefully and save the media record.
          </p>
        </div>

        {errorText ? <div className={styles.errorText}>{errorText}</div> : null}

        <form onSubmit={handleSubmit}>
          <div className={styles.formGrid}>
            <div className={styles.formGroup}>
              <label htmlFor="title">Media Title</label>
              <input
                id="title"
                type="text"
                name="title"
                value={formData.title}
                onChange={handleChange}
                placeholder="Enter media title"
              />
            </div>

            <div className={styles.formGroup}>
              <label htmlFor="category">Category</label>
              <select
                id="category"
                name="category"
                value={formData.category}
                onChange={handleChange}
              >
                <option value="">Select category</option>
                {categories.map((item) => (
                  <option key={item.id} value={item.id}>
                    {item.name}
                  </option>
                ))}
              </select>
            </div>

            <div className={styles.formGroup}>
              <label htmlFor="media_type">Media Type</label>
              <select
                id="media_type"
                name="media_type"
                value={formData.media_type}
                onChange={handleChange}
              >
                <option value="image">Image</option>
                <option value="video">Video</option>
                <option value="document">Document</option>
                <option value="audio">Audio</option>
              </select>
            </div>

            <div className={styles.formGroup}>
              <label htmlFor="event_name">Event Name</label>
              <input
                id="event_name"
                type="text"
                name="event_name"
                value={formData.event_name}
                onChange={handleChange}
                placeholder="Enter event name"
              />
            </div>

            <div className={styles.formGroup}>
              <label htmlFor="sport_name">Sport Name</label>
              <input
                id="sport_name"
                type="text"
                name="sport_name"
                value={formData.sport_name}
                onChange={handleChange}
                placeholder="Enter sport name"
              />
            </div>

            <div className={styles.formGroup}>
              <label htmlFor="visibility">Visibility</label>
              <select
                id="visibility"
                name="visibility"
                value={formData.visibility}
                onChange={handleChange}
              >
                <option value="public">Public</option>
                <option value="private">Private</option>
                <option value="team">Team</option>
              </select>
            </div>

            <div className={styles.formGroup}>
              <label htmlFor="status">Status</label>
              <select
                id="status"
                name="status"
                value={formData.status}
                onChange={handleChange}
              >
                <option value="active">Active</option>
                <option value="draft">Draft</option>
                <option value="archived">Archived</option>
              </select>
            </div>

            <div className={styles.formGroup}>
              <label htmlFor="file">Media File</label>
              <input
                id="file"
                type="file"
                name="file"
                onChange={handleChange}
              />
            </div>

            <div className={styles.formGroup}>
              <label htmlFor="thumbnail">Thumbnail</label>
              <input
                id="thumbnail"
                type="file"
                name="thumbnail"
                accept="image/*"
                onChange={handleChange}
              />
            </div>

            <div className={`${styles.formGroup} ${styles.fullWidth}`}>
              <label htmlFor="description">Description</label>
              <textarea
                id="description"
                name="description"
                value={formData.description}
                onChange={handleChange}
                placeholder="Enter media description"
              />
            </div>

            <div className={`${styles.formGroup} ${styles.fullWidth}`}>
              <label className={styles.checkboxLabel}>
                <input
                  type="checkbox"
                  name="is_published"
                  checked={formData.is_published}
                  onChange={handleChange}
                />
                <span>Mark as published</span>
              </label>
            </div>
          </div>

          <div className={styles.actions}>
            <button
              type="button"
              className={styles.cancelBtn}
              onClick={() => navigate("/media")}
              disabled={saving}
            >
              Cancel
            </button>

            <button
              type="submit"
              className={styles.saveBtn}
              disabled={saving}
            >
              {saving
                ? isEdit
                  ? "Updating..."
                  : "Saving..."
                : isEdit
                ? "Update Media"
                : "Save Media"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}