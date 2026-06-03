import React, { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import styles from "./AccountsFormPage.module.css";
import {
  createAccount,
  updateAccount,
  getAccount,
} from "../../api/accounts";

const initialForm = {
  date: "",
  transaction_type: "income",
  category: "",
  amount: "",
  payment_method: "cash",
  reference_no: "",
  description: "",
  status: "completed",
};

const todayValue = () => {
  const d = new Date();
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd}`;
};

export default function AccountsFormPage() {
  const navigate = useNavigate();
  const { id } = useParams();
  const isEdit = Boolean(id);

  const [form, setForm] = useState({
    ...initialForm,
    date: todayValue(),
  });
  const [loading, setLoading] = useState(isEdit);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!isEdit) return;

    const loadTransaction = async () => {
      try {
        setLoading(true);
        const response = await getAccount(id);
        const data = response?.data || {};

        setForm({
          date: data?.date || todayValue(),
          transaction_type: String(data?.transaction_type || "income").toLowerCase(),
          category: data?.category || "",
          amount: data?.amount ?? "",
          payment_method: data?.payment_method || "cash",
          reference_no: data?.reference_no || "",
          description: data?.description || "",
          status: String(data?.status || "completed").toLowerCase(),
        });
      } catch (error) {
        console.error("Failed to load transaction:", error);
        const message =
          error?.response?.data?.detail || "Failed to load transaction details.";
        alert(message);
      } finally {
        setLoading(false);
      }
    };

    loadTransaction();
  }, [id, isEdit]);

  const pageTitle = useMemo(
    () => (isEdit ? "Transaction Details" : "Transaction Details"),
    [isEdit]
  );

  const pageSubtitle = useMemo(
    () => "Fill in the required fields carefully and save the transaction.",
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
    if (!form.date) {
      alert("Date is required.");
      return false;
    }

    if (!form.transaction_type) {
      alert("Type is required.");
      return false;
    }

    if (!form.category.trim()) {
      alert("Category is required.");
      return false;
    }

    if (form.amount === "" || Number(form.amount) <= 0) {
      alert("Amount must be greater than 0.");
      return false;
    }

    if (!form.payment_method.trim()) {
      alert("Payment method is required.");
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
      date: form.date,
      transaction_type: form.transaction_type,
      category: form.category.trim(),
      amount: Number(form.amount),
      payment_method: form.payment_method.trim(),
      reference_no: form.reference_no.trim() || null,
      description: form.description.trim(),
      status: form.status.toLowerCase(),
    };

    try {
      setSaving(true);

      if (isEdit) {
        await updateAccount(id, payload);
        alert("Transaction updated successfully.");
      } else {
        await createAccount(payload);
        alert("Transaction created successfully.");
      }

      navigate("/accounts");
    } catch (error) {
      console.error("Save failed:", error);
      const data = error?.response?.data;

      if (data?.transaction_type?.[0]) {
        alert(`Transaction Type: ${data.transaction_type[0]}`);
      } else if (data?.amount?.[0]) {
        alert(`Amount: ${data.amount[0]}`);
      } else if (data?.category?.[0]) {
        alert(`Category: ${data.category[0]}`);
      } else if (data?.date?.[0]) {
        alert(`Date: ${data.date[0]}`);
      } else if (data?.payment_method?.[0]) {
        alert(`Payment Method: ${data.payment_method[0]}`);
      } else if (data?.description?.[0]) {
        alert(`Description: ${data.description[0]}`);
      } else if (data?.status?.[0]) {
        alert(`Status: ${data.status[0]}`);
      } else if (data?.detail) {
        alert(data.detail);
      } else {
        alert("Failed to save transaction.");
      }
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className={styles.page}>
        <div className={styles.formCard}>
          <div className={styles.loadingText}>Loading transaction details...</div>
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
              <label htmlFor="date">Date</label>
              <input
                id="date"
                type="date"
                name="date"
                value={form.date}
                onChange={handleChange}
              />
            </div>

            <div className={styles.formGroup}>
              <label htmlFor="transaction_type">Type</label>
              <select
                id="transaction_type"
                name="transaction_type"
                value={form.transaction_type}
                onChange={handleChange}
              >
                <option value="income">Income</option>
                <option value="expense">Expense</option>
              </select>
            </div>

            <div className={styles.formGroup}>
              <label htmlFor="category">Category</label>
              <input
                id="category"
                type="text"
                name="category"
                value={form.category}
                onChange={handleChange}
                placeholder="Enter category"
              />
            </div>

            <div className={styles.formGroup}>
              <label htmlFor="amount">Amount</label>
              <input
                id="amount"
                type="number"
                name="amount"
                value={form.amount}
                onChange={handleChange}
                placeholder="Enter amount"
                min="0"
                step="0.01"
              />
            </div>

            <div className={styles.formGroup}>
              <label htmlFor="payment_method">Payment Method</label>
              <select
                id="payment_method"
                name="payment_method"
                value={form.payment_method}
                onChange={handleChange}
              >
                <option value="cash">Cash</option>
                <option value="upi">UPI</option>
                <option value="bank">Bank Transfer</option>
                <option value="card">Card</option>
                <option value="cheque">Cheque</option>
              </select>
            </div>

            <div className={styles.formGroup}>
              <label htmlFor="reference_no">Reference No</label>
              <input
                id="reference_no"
                type="text"
                name="reference_no"
                value={form.reference_no}
                onChange={handleChange}
                placeholder="Enter reference number"
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
                <option value="completed">Completed</option>
                <option value="pending">Pending</option>
                <option value="cancelled">Cancelled</option>
              </select>
            </div>

            <div className={`${styles.formGroup} ${styles.fullWidth}`}>
              <label htmlFor="description">Description</label>
              <textarea
                id="description"
                name="description"
                value={form.description}
                onChange={handleChange}
                placeholder="Enter transaction description"
              />
            </div>
          </div>

          <div className={styles.actions}>
            <button
              type="button"
              className={styles.cancelBtn}
              onClick={() => navigate("/accounts")}
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
                ? "Update Transaction"
                : "Save Transaction"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}