import React, { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import styles from "./TalentRegistryFormPage.module.css";
import {
  createTalentProfile,
  getTalentProfile,
  updateTalentProfile,
} from "../../api/talentRegistry";

const initialForm = {
  student_name: "",
  gender: "M",
  date_of_birth: "",
  class_name: "",
  section: "",
  sport: "",
  event_or_position: "",
  talent_level: "beginner",
  phone: "",
  email: "",
  address: "",
  guardian_name: "",
  guardian_phone: "",
  height_cm: "",
  weight_kg: "",
  blood_group: "",
  medical_notes: "",
  previous_achievements: "",
  notes: "",
  status: "active",
};

export default function TalentRegistryFormPage() {
  const navigate = useNavigate();
  const { id } = useParams();
  const isEdit = Boolean(id);

  const [form, setForm] = useState(initialForm);
  const [loading, setLoading] = useState(isEdit);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!isEdit) return;

    const loadTalentProfile = async () => {
      try {
        setLoading(true);
        const response = await getTalentProfile(id);
        const data = response?.data || {};

        setForm({
          student_name: data?.student_name || "",
          gender: data?.gender || "M",
          date_of_birth: data?.date_of_birth || "",
          class_name: data?.class_name || "",
          section: data?.section || "",
          sport: data?.sport || "",
          event_or_position: data?.event_or_position || "",
          talent_level: String(data?.talent_level || "beginner").toLowerCase(),
          phone: data?.phone || "",
          email: data?.email || "",
          address: data?.address || "",
          guardian_name: data?.guardian_name || "",
          guardian_phone: data?.guardian_phone || "",
          height_cm: data?.height_cm ?? "",
          weight_kg: data?.weight_kg ?? "",
          blood_group: data?.blood_group || "",
          medical_notes: data?.medical_notes || "",
          previous_achievements: data?.previous_achievements || "",
          notes: data?.notes || "",
          status: String(data?.status || "active").toLowerCase(),
        });
      } catch (error) {
        console.error("Failed to load talent profile:", error);
        const message =
          error?.response?.data?.detail || "Failed to load talent profile details.";
        alert(message);
      } finally {
        setLoading(false);
      }
    };

    loadTalentProfile();
  }, [id, isEdit]);

  const pageTitle = useMemo(
    () => (isEdit ? "Talent Profile Details" : "Talent Profile Details"),
    [isEdit]
  );

  const pageSubtitle = useMemo(
    () => "Fill in the required talent details carefully and save the profile.",
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
    if (!form.student_name.trim()) {
      alert("Student name is required.");
      return false;
    }

    if (!form.gender) {
      alert("Gender is required.");
      return false;
    }

    if (!form.sport.trim()) {
      alert("Sport is required.");
      return false;
    }

    if (!form.talent_level) {
      alert("Talent level is required.");
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
      student_name: form.student_name.trim(),
      gender: form.gender,
      date_of_birth: form.date_of_birth || null,
      class_name: form.class_name.trim(),
      section: form.section.trim(),
      sport: form.sport.trim(),
      event_or_position: form.event_or_position.trim(),
      talent_level: form.talent_level,
      phone: form.phone.trim(),
      email: form.email.trim(),
      address: form.address.trim(),
      guardian_name: form.guardian_name.trim(),
      guardian_phone: form.guardian_phone.trim(),
      height_cm: form.height_cm === "" ? null : Number(form.height_cm),
      weight_kg: form.weight_kg === "" ? null : Number(form.weight_kg),
      blood_group: form.blood_group.trim(),
      medical_notes: form.medical_notes.trim(),
      previous_achievements: form.previous_achievements.trim(),
      notes: form.notes.trim(),
      status: form.status.toLowerCase(),
    };

    try {
      setSaving(true);

      if (isEdit) {
        await updateTalentProfile(id, payload);
        alert("Talent profile updated successfully.");
      } else {
        await createTalentProfile(payload);
        alert("Talent profile created successfully.");
      }

      navigate("/talent-registry");
    } catch (error) {
      console.error("Save failed:", error);
      const data = error?.response?.data;

      if (data?.student_name?.[0]) {
        alert(`Student Name: ${data.student_name[0]}`);
      } else if (data?.gender?.[0]) {
        alert(`Gender: ${data.gender[0]}`);
      } else if (data?.date_of_birth?.[0]) {
        alert(`Date of Birth: ${data.date_of_birth[0]}`);
      } else if (data?.class_name?.[0]) {
        alert(`Class: ${data.class_name[0]}`);
      } else if (data?.section?.[0]) {
        alert(`Section: ${data.section[0]}`);
      } else if (data?.sport?.[0]) {
        alert(`Sport: ${data.sport[0]}`);
      } else if (data?.event_or_position?.[0]) {
        alert(`Event / Position: ${data.event_or_position[0]}`);
      } else if (data?.talent_level?.[0]) {
        alert(`Talent Level: ${data.talent_level[0]}`);
      } else if (data?.phone?.[0]) {
        alert(`Phone: ${data.phone[0]}`);
      } else if (data?.email?.[0]) {
        alert(`Email: ${data.email[0]}`);
      } else if (data?.guardian_name?.[0]) {
        alert(`Guardian Name: ${data.guardian_name[0]}`);
      } else if (data?.guardian_phone?.[0]) {
        alert(`Guardian Phone: ${data.guardian_phone[0]}`);
      } else if (data?.height_cm?.[0]) {
        alert(`Height: ${data.height_cm[0]}`);
      } else if (data?.weight_kg?.[0]) {
        alert(`Weight: ${data.weight_kg[0]}`);
      } else if (data?.blood_group?.[0]) {
        alert(`Blood Group: ${data.blood_group[0]}`);
      } else if (data?.address?.[0]) {
        alert(`Address: ${data.address[0]}`);
      } else if (data?.medical_notes?.[0]) {
        alert(`Medical Notes: ${data.medical_notes[0]}`);
      } else if (data?.previous_achievements?.[0]) {
        alert(`Previous Achievements: ${data.previous_achievements[0]}`);
      } else if (data?.notes?.[0]) {
        alert(`Notes: ${data.notes[0]}`);
      } else if (data?.status?.[0]) {
        alert(`Status: ${data.status[0]}`);
      } else if (data?.detail) {
        alert(data.detail);
      } else {
        alert("Failed to save talent profile.");
      }
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className={styles.page}>
        <div className={styles.formCard}>
          <div className={styles.loadingText}>Loading talent profile details...</div>
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
              <label htmlFor="student_name">Student Name</label>
              <input
                id="student_name"
                type="text"
                name="student_name"
                value={form.student_name}
                onChange={handleChange}
                placeholder="Enter student name"
              />
            </div>

            <div className={styles.formGroup}>
              <label htmlFor="gender">Gender</label>
              <select
                id="gender"
                name="gender"
                value={form.gender}
                onChange={handleChange}
              >
                <option value="M">Male</option>
                <option value="F">Female</option>
              </select>
            </div>

            <div className={styles.formGroup}>
              <label htmlFor="date_of_birth">Date of Birth</label>
              <input
                id="date_of_birth"
                type="date"
                name="date_of_birth"
                value={form.date_of_birth}
                onChange={handleChange}
              />
            </div>

            <div className={styles.formGroup}>
              <label htmlFor="class_name">Class</label>
              <input
                id="class_name"
                type="text"
                name="class_name"
                value={form.class_name}
                onChange={handleChange}
                placeholder="Enter class"
              />
            </div>

            <div className={styles.formGroup}>
              <label htmlFor="section">Section</label>
              <input
                id="section"
                type="text"
                name="section"
                value={form.section}
                onChange={handleChange}
                placeholder="Enter section"
              />
            </div>

            <div className={styles.formGroup}>
              <label htmlFor="sport">Sport</label>
              <input
                id="sport"
                type="text"
                name="sport"
                value={form.sport}
                onChange={handleChange}
                placeholder="Enter sport"
              />
            </div>

            <div className={styles.formGroup}>
              <label htmlFor="event_or_position">Event / Position</label>
              <input
                id="event_or_position"
                type="text"
                name="event_or_position"
                value={form.event_or_position}
                onChange={handleChange}
                placeholder="Enter event or position"
              />
            </div>

            <div className={styles.formGroup}>
              <label htmlFor="talent_level">Talent Level</label>
              <select
                id="talent_level"
                name="talent_level"
                value={form.talent_level}
                onChange={handleChange}
              >
                <option value="beginner">Beginner</option>
                <option value="intermediate">Intermediate</option>
                <option value="advanced">Advanced</option>
                <option value="elite">Elite</option>
              </select>
            </div>

            <div className={styles.formGroup}>
              <label htmlFor="phone">Phone</label>
              <input
                id="phone"
                type="text"
                name="phone"
                value={form.phone}
                onChange={handleChange}
                placeholder="Enter phone number"
              />
            </div>

            <div className={styles.formGroup}>
              <label htmlFor="email">Email</label>
              <input
                id="email"
                type="email"
                name="email"
                value={form.email}
                onChange={handleChange}
                placeholder="Enter email address"
              />
            </div>

            <div className={styles.formGroup}>
              <label htmlFor="guardian_name">Guardian Name</label>
              <input
                id="guardian_name"
                type="text"
                name="guardian_name"
                value={form.guardian_name}
                onChange={handleChange}
                placeholder="Enter guardian name"
              />
            </div>

            <div className={styles.formGroup}>
              <label htmlFor="guardian_phone">Guardian Phone</label>
              <input
                id="guardian_phone"
                type="text"
                name="guardian_phone"
                value={form.guardian_phone}
                onChange={handleChange}
                placeholder="Enter guardian phone"
              />
            </div>

            <div className={styles.formGroup}>
              <label htmlFor="height_cm">Height (cm)</label>
              <input
                id="height_cm"
                type="number"
                name="height_cm"
                value={form.height_cm}
                onChange={handleChange}
                placeholder="Enter height"
                min="0"
                step="0.01"
              />
            </div>

            <div className={styles.formGroup}>
              <label htmlFor="weight_kg">Weight (kg)</label>
              <input
                id="weight_kg"
                type="number"
                name="weight_kg"
                value={form.weight_kg}
                onChange={handleChange}
                placeholder="Enter weight"
                min="0"
                step="0.01"
              />
            </div>

            <div className={styles.formGroup}>
              <label htmlFor="blood_group">Blood Group</label>
              <input
                id="blood_group"
                type="text"
                name="blood_group"
                value={form.blood_group}
                onChange={handleChange}
                placeholder="Enter blood group"
              />
            </div>

            <div className={styles.formGroup}>
              <label htmlFor="status">Status</label>
              <select
                id="status"
                name="status"
                value={form.status}
                onChange={handleChange}
              >
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
                <option value="selected">Selected</option>
                <option value="rejected">Rejected</option>
              </select>
            </div>

            <div className={`${styles.formGroup} ${styles.fullWidth}`}>
              <label htmlFor="address">Address</label>
              <textarea
                id="address"
                name="address"
                value={form.address}
                onChange={handleChange}
                placeholder="Enter address"
              />
            </div>

            <div className={`${styles.formGroup} ${styles.fullWidth}`}>
              <label htmlFor="medical_notes">Medical Notes</label>
              <textarea
                id="medical_notes"
                name="medical_notes"
                value={form.medical_notes}
                onChange={handleChange}
                placeholder="Enter medical notes"
              />
            </div>

            <div className={`${styles.formGroup} ${styles.fullWidth}`}>
              <label htmlFor="previous_achievements">Previous Achievements</label>
              <textarea
                id="previous_achievements"
                name="previous_achievements"
                value={form.previous_achievements}
                onChange={handleChange}
                placeholder="Enter previous achievements"
              />
            </div>

            <div className={`${styles.formGroup} ${styles.fullWidth}`}>
              <label htmlFor="notes">Notes</label>
              <textarea
                id="notes"
                name="notes"
                value={form.notes}
                onChange={handleChange}
                placeholder="Enter notes"
              />
            </div>
          </div>

          <div className={styles.actions}>
            <button
              type="button"
              className={styles.cancelBtn}
              onClick={() => navigate("/talent-registry")}
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
                ? "Update Talent Profile"
                : "Save Talent Profile"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}