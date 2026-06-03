import React, { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import styles from "./CommunicationsFormPage.module.css";
import {
  createCommunication,
  updateCommunication,
  getCommunication,
} from "../../api/communications";

const initialForm = {
  title: "",
  subject: "",
  message: "",
  channel: "notice",
  audience: "all",
  status: "draft",
  event_name: "",
  scheduled_at: "",
  recipients_count: 0,
  created_by: "",
  remarks: "",
};

function toInputDateTime(value) {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  const hours = String(date.getHours()).padStart(2, "0");
  const minutes = String(date.getMinutes()).padStart(2, "0");
  return `${year}-${month}-${day}T${hours}:${minutes}`;
}

export default function CommunicationsFormPage() {
  const navigate = useNavigate();
  const { id } = useParams();
  const isEdit = Boolean(id);

  const [form, setForm] = useState(initialForm);
  const [loading, setLoading] = useState(isEdit);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!isEdit) return;

    const loadCommunication = async () => {
      try {
        setLoading(true);
        const response = await getCommunication(id);
        const data = response?.data || {};

        setForm({
          title: data?.title || "",
          subject: data?.subject || "",
          message: data?.message || "",
          channel: String(data?.channel || "notice").toLowerCase(),
          audience: String(data?.audience || "all").toLowerCase(),
          status: String(data?.status || "draft").toLowerCase(),
          event_name: data?.event_name || "",
          scheduled_at: toInputDateTime(data?.scheduled_at),
          recipients_count: data?.recipients_count ?? 0,
          created_by: data?.created_by || "",
          remarks: data?.remarks || "",
        });
      } catch (error) {
        console.error("Failed to load communication:", error);
        const message =
          error?.response?.data?.detail || "Failed to load communication details.";
        alert(message);
      } finally {
        setLoading(false);
      }
    };

    loadCommunication();
  }, [id, isEdit]);

  const pageTitle = useMemo(
    () => (isEdit ? "Communication Details" : "Communication Details"),
    [isEdit]
  );

  const pageSubtitle = useMemo(
    () => "Fill in the required fields carefully and save the communication record.",
    []
  );

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const validateForm = () => {
    if (!form.title.trim()) {
      alert("Title is required.");
      return false;
    }

    if (!form.message.trim()) {
      alert("Message is required.");
      return false;
    }

    if (!form.channel) {
      alert("Channel is required.");
      return false;
    }

    if (!form.audience) {
      alert("Audience is required.");
      return false;
    }

    if (!form.status) {
      alert("Status is required.");
      return false;
    }

    return true;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validateForm()) return;

    const payload = {
      title: form.title.trim(),
      subject: form.subject.trim(),
      message: form.message.trim(),
      channel: form.channel,
      audience: form.audience,
      status: form.status,
      event_name: form.event_name.trim(),
      scheduled_at: form.scheduled_at || null,
      recipients_count: Number(form.recipients_count || 0),
      created_by: form.created_by.trim(),
      remarks: form.remarks.trim(),
    };

    try {
      setSaving(true);

      if (isEdit) {
        await updateCommunication(id, payload);
        alert("Communication updated successfully.");
      } else {
        await createCommunication(payload);
        alert("Communication created successfully.");
      }

      navigate("/communications");
    } catch (error) {
      console.error("Save failed:", error);
      const data = error?.response?.data;

      if (data?.title?.[0]) {
        alert(`Title: ${data.title[0]}`);
      } else if (data?.message?.[0]) {
        alert(`Message: ${data.message[0]}`);
      } else if (data?.channel?.[0]) {
        alert(`Channel: ${data.channel[0]}`);
      } else if (data?.audience?.[0]) {
        alert(`Audience: ${data.audience[0]}`);
      } else if (data?.status?.[0]) {
        alert(`Status: ${data.status[0]}`);
      } else if (data?.scheduled_at?.[0]) {
        alert(`Scheduled At: ${data.scheduled_at[0]}`);
      } else if (data?.detail) {
        alert(data.detail);
      } else {
        alert("Failed to save communication.");
      }
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className={styles.page}>
        <div className={styles.formCard}>
          <div className={styles.loadingText}>Loading communication details...</div>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.page}>
      <div className={styles.formCard}>
        <div className={styles.formHeader}>
          <h2 className={styles.formTitle}>{pageTitle}</h2>
          <p className={styles.formText}>{pageSubtitle}</p>
        </div>

        <form onSubmit={handleSubmit}>
          <div className={styles.formGrid}>
            <div className={styles.formGroup}>
              <label htmlFor="title">Title</label>
              <input
                id="title"
                type="text"
                name="title"
                value={form.title}
                onChange={handleChange}
                placeholder="Enter communication title"
              />
            </div>

            <div className={styles.formGroup}>
              <label htmlFor="subject">Subject</label>
              <input
                id="subject"
                type="text"
                name="subject"
                value={form.subject}
                onChange={handleChange}
                placeholder="Enter subject"
              />
            </div>

            <div className={styles.formGroup}>
              <label htmlFor="channel">Channel</label>
              <select
                id="channel"
                name="channel"
                value={form.channel}
                onChange={handleChange}
              >
                <option value="notice">Notice</option>
                <option value="email">Email</option>
                <option value="sms">SMS</option>
                <option value="whatsapp">WhatsApp</option>
                <option value="press_release">Press Release</option>
              </select>
            </div>

            <div className={styles.formGroup}>
              <label htmlFor="audience">Audience</label>
              <select
                id="audience"
                name="audience"
                value={form.audience}
                onChange={handleChange}
              >
                <option value="all">All</option>
                <option value="students">Students</option>
                <option value="parents">Parents</option>
                <option value="teams">Teams</option>
                <option value="officials">Officials</option>
                <option value="staff">Staff</option>
                <option value="media">Media</option>
              </select>
            </div>

            <div className={styles.formGroup}>
              <label htmlFor="status">Status</label>
              <select
                id="status"
                name="status"
                value={form.status}
                onChange={handleChange}
              >
                <option value="draft">Draft</option>
                <option value="scheduled">Scheduled</option>
                <option value="sent">Sent</option>
                <option value="failed">Failed</option>
              </select>
            </div>

            <div className={styles.formGroup}>
              <label htmlFor="scheduled_at">Scheduled At</label>
              <input
                id="scheduled_at"
                type="datetime-local"
                name="scheduled_at"
                value={form.scheduled_at}
                onChange={handleChange}
              />
            </div>

            <div className={styles.formGroup}>
              <label htmlFor="event_name">Event Name</label>
              <input
                id="event_name"
                type="text"
                name="event_name"
                value={form.event_name}
                onChange={handleChange}
                placeholder="Enter event name"
              />
            </div>

            <div className={styles.formGroup}>
              <label htmlFor="recipients_count">Recipients Count</label>
              <input
                id="recipients_count"
                type="number"
                name="recipients_count"
                value={form.recipients_count}
                onChange={handleChange}
                placeholder="Enter recipients count"
                min="0"
              />
            </div>

            <div className={styles.formGroup}>
              <label htmlFor="created_by">Created By</label>
              <input
                id="created_by"
                type="text"
                name="created_by"
                value={form.created_by}
                onChange={handleChange}
                placeholder="Enter creator name"
              />
            </div>

            <div className={`${styles.formGroup} ${styles.fullWidth}`}>
              <label htmlFor="message">Message</label>
              <textarea
                id="message"
                name="message"
                value={form.message}
                onChange={handleChange}
                placeholder="Enter communication message"
              />
            </div>

            <div className={`${styles.formGroup} ${styles.fullWidth}`}>
              <label htmlFor="remarks">Remarks</label>
              <textarea
                id="remarks"
                name="remarks"
                value={form.remarks}
                onChange={handleChange}
                placeholder="Enter remarks"
              />
            </div>
          </div>

          <div className={styles.actions}>
            <button
              type="button"
              className={styles.cancelBtn}
              onClick={() => navigate("/communications")}
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
                ? "Update Communication"
                : "Save Communication"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}