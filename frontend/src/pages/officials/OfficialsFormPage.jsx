import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import {
  createOfficial,
  getOfficialById,
  updateOfficial,
} from "../../api/officials";
import styles from "./OfficialsFormPage.module.css";

const initialForm = {
  full_name: "",
  role: "referee",
  sport: "",
  gender: "",
  phone: "",
  email: "",
  qualification: "",
  experience_years: 0,
  city: "",
  address: "",
  availability: "available",
  status: "active",
  notes: "",
};

export default function OfficialsFormPage() {
  const navigate = useNavigate();
  const { id } = useParams();
  const isEdit = Boolean(id);

  const [formData, setFormData] = useState(initialForm);
  const [saving, setSaving] = useState(false);
  const [pageLoading, setPageLoading] = useState(isEdit);

  const pageTitle = useMemo(
    () => (isEdit ? "Edit Official Details" : "Official Details"),
    [isEdit]
  );

  const pageSubtitle = useMemo(
    () =>
      isEdit
        ? "Update the required fields carefully and save the official profile."
        : "Fill in the required fields carefully and save the official profile.",
    [isEdit]
  );

  useEffect(() => {
    if (!isEdit) return;

    const loadOfficial = async () => {
      try {
        setPageLoading(true);
        const data = await getOfficialById(id);

        setFormData({
          full_name: data?.full_name || "",
          role: data?.role || "referee",
          sport: data?.sport || "",
          gender: data?.gender || "",
          phone: data?.phone || "",
          email: data?.email || "",
          qualification: data?.qualification || "",
          experience_years: data?.experience_years ?? 0,
          city: data?.city || "",
          address: data?.address || "",
          availability: data?.availability || "available",
          status: data?.status || "active",
          notes: data?.notes || "",
        });
      } catch (error) {
        console.error("Failed to load official:", error);
        const message =
          error?.response?.data?.detail || "Failed to load official details.";
        alert(message);
      } finally {
        setPageLoading(false);
      }
    };

    loadOfficial();
  }, [id, isEdit]);

  const handleChange = (e) => {
    const { name, value } = e.target;

    setFormData((prev) => ({
      ...prev,
      [name]: name === "experience_years" ? (value === "" ? "" : Number(value)) : value,
    }));
  };

  const validateForm = () => {
    if (!formData.full_name.trim()) {
      alert("Full name is required.");
      return false;
    }

    if (!formData.sport.trim()) {
      alert("Sport is required.");
      return false;
    }

    if (!formData.phone.trim()) {
      alert("Phone number is required.");
      return false;
    }

    return true;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validateForm()) return;

    const payload = {
      full_name: formData.full_name.trim(),
      role: formData.role,
      sport: formData.sport.trim(),
      gender: formData.gender,
      phone: formData.phone.trim(),
      email: formData.email.trim() || null,
      qualification: formData.qualification.trim(),
      experience_years: Number(formData.experience_years || 0),
      city: formData.city.trim(),
      address: formData.address.trim(),
      availability: formData.availability,
      status: formData.status,
      notes: formData.notes.trim(),
    };

    try {
      setSaving(true);

      if (isEdit) {
        await updateOfficial(id, payload);
        alert("Official updated successfully.");
      } else {
        await createOfficial(payload);
        alert("Official created successfully.");
      }

      navigate("/officials");
    } catch (error) {
      console.error("Save failed:", error);

      const data = error?.response?.data;

      if (data?.full_name?.[0]) {
        alert(`Full Name: ${data.full_name[0]}`);
      } else if (data?.sport?.[0]) {
        alert(`Sport: ${data.sport[0]}`);
      } else if (data?.phone?.[0]) {
        alert(`Phone: ${data.phone[0]}`);
      } else if (data?.email?.[0]) {
        alert(`Email: ${data.email[0]}`);
      } else if (data?.role?.[0]) {
        alert(`Role: ${data.role[0]}`);
      } else if (data?.availability?.[0]) {
        alert(`Availability: ${data.availability[0]}`);
      } else if (data?.status?.[0]) {
        alert(`Status: ${data.status[0]}`);
      } else if (data?.detail) {
        alert(data.detail);
      } else {
        alert("Failed to save official.");
      }
    } finally {
      setSaving(false);
    }
  };

  if (pageLoading) {
    return (
      <div className={styles.page}>
        <div className={styles.loadingCard}>Loading official details...</div>
      </div>
    );
  }

  return (
    <div className={styles.page}>
      <div className={styles.formShell}>
        <form className={styles.formCard} onSubmit={handleSubmit}>
          <div className={styles.formHeader}>
            <h1 className={styles.formTitle}>{pageTitle}</h1>
            <p className={styles.formText}>{pageSubtitle}</p>
          </div>

          <div className={styles.formGrid}>
            <div className={styles.formGroup}>
              <label htmlFor="full_name">Full Name</label>
              <input
                id="full_name"
                type="text"
                name="full_name"
                value={formData.full_name}
                onChange={handleChange}
                placeholder="Enter full name"
              />
            </div>

            <div className={styles.formGroup}>
              <label htmlFor="role">Role</label>
              <select
                id="role"
                name="role"
                value={formData.role}
                onChange={handleChange}
              >
                <option value="referee">Referee</option>
                <option value="umpire">Umpire</option>
                <option value="judge">Judge</option>
                <option value="marshal">Marshal</option>
                <option value="scorer">Scorer</option>
                <option value="time_keeper">Time Keeper</option>
                <option value="coordinator">Coordinator</option>
                <option value="other">Other</option>
              </select>
            </div>

            <div className={styles.formGroup}>
              <label htmlFor="sport">Sport</label>
              <input
                id="sport"
                type="text"
                name="sport"
                value={formData.sport}
                onChange={handleChange}
                placeholder="Enter sport"
              />
            </div>

            <div className={styles.formGroup}>
              <label htmlFor="gender">Gender</label>
              <select
                id="gender"
                name="gender"
                value={formData.gender}
                onChange={handleChange}
              >
                <option value="">Select gender</option>
                <option value="male">Male</option>
                <option value="female">Female</option>
                <option value="other">Other</option>
              </select>
            </div>

            <div className={styles.formGroup}>
              <label htmlFor="phone">Phone</label>
              <input
                id="phone"
                type="text"
                name="phone"
                value={formData.phone}
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
                value={formData.email}
                onChange={handleChange}
                placeholder="Enter email"
              />
            </div>

            <div className={styles.formGroup}>
              <label htmlFor="qualification">Qualification</label>
              <input
                id="qualification"
                type="text"
                name="qualification"
                value={formData.qualification}
                onChange={handleChange}
                placeholder="Enter qualification"
              />
            </div>

            <div className={styles.formGroup}>
              <label htmlFor="experience_years">Experience (Years)</label>
              <input
                id="experience_years"
                type="number"
                min="0"
                name="experience_years"
                value={formData.experience_years}
                onChange={handleChange}
                placeholder="Enter experience years"
              />
            </div>

            <div className={styles.formGroup}>
              <label htmlFor="city">City</label>
              <input
                id="city"
                type="text"
                name="city"
                value={formData.city}
                onChange={handleChange}
                placeholder="Enter city"
              />
            </div>

            <div className={styles.formGroup}>
              <label htmlFor="address">Address</label>
              <input
                id="address"
                type="text"
                name="address"
                value={formData.address}
                onChange={handleChange}
                placeholder="Enter address"
              />
            </div>

            <div className={styles.formGroup}>
              <label htmlFor="availability">Availability</label>
              <select
                id="availability"
                name="availability"
                value={formData.availability}
                onChange={handleChange}
              >
                <option value="available">Available</option>
                <option value="busy">Busy</option>
                <option value="unavailable">Unavailable</option>
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
                <option value="inactive">Inactive</option>
              </select>
            </div>

            <div className={`${styles.formGroup} ${styles.fullWidth}`}>
              <label htmlFor="notes">Notes</label>
              <textarea
                id="notes"
                name="notes"
                value={formData.notes}
                onChange={handleChange}
                placeholder="Enter additional notes"
              />
            </div>
          </div>

          <div className={styles.actions}>
            <button
              type="button"
              className={styles.cancelBtn}
              onClick={() => navigate("/officials")}
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
                ? "Update Official"
                : "Save Official"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}