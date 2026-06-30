import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { ShoppingBag, Plus, Minus, Trash2, X, Check, Copy, MessageCircle, User, Phone, MapPin, FileText } from "lucide-react";
import { useCart, type CartItem } from "./store";
import { toArabicNumber } from "./arabicNumbers";

const EO: [number, number, number, number] = [0, 0, 0.2, 1];
const SPF = { type: "spring" as const, stiffness: 500, damping: 32 };

function formatPrice(val: number) {
  return `${toArabicNumber(val)} ج`;
}

// ── Floating Cart Button ──────────────────────────────────────────────────
export function FloatingCartButton({ onClick }: { onClick: () => void }) {
  const { totalItems, subtotal } = useCart();
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (totalItems > 0) {
      const t = setTimeout(() => setVisible(true), 300);
      return () => clearTimeout(t);
    } else {
      setVisible(false);
    }
  }, [totalItems]);

  if (totalItems === 0 || !visible) return null;

  return (
    <motion.button
      initial={{ scale: 0, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      exit={{ scale: 0, opacity: 0 }}
      whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }} transition={SPF}
      onClick={onClick}
      style={{
        position: "fixed", bottom: 24, right: 24, zIndex: 600,
        display: "flex", alignItems: "center", gap: 10,
        background: "linear-gradient(135deg,#C8410A,#D4870A)",
        color: "#fff", border: "none", borderRadius: 16,
        padding: "12px 20px", cursor: "pointer",
        fontFamily: "Cairo, sans-serif", fontWeight: 700, fontSize: 13,
        boxShadow: "0 8px 30px rgba(200,65,10,0.45)",
        direction: "rtl",
      }}
    >
      <div style={{ position: "relative" }}>
        <ShoppingBag size={20} />
        <span style={{
          position: "absolute", top: -8, right: -8,
          background: "#F5C842", color: "#0F0500",
          fontSize: 10, fontWeight: 900,
          width: 20, height: 20, borderRadius: "50%",
          display: "flex", alignItems: "center", justifyContent: "center",
        }}>
          {toArabicNumber(totalItems)}
        </span>
      </div>
      <span style={{ whiteSpace: "nowrap" }}>
        {toArabicNumber(totalItems)} طلب — {formatPrice(subtotal)}
      </span>
    </motion.button>
  );
}

// ── Cart Drawer ────────────────────────────────────────────────────────────
interface DrawerProps {
  open: boolean;
  onClose: () => void;
  onCheckout: () => void;
}

export function CartDrawer({ open, onClose, onCheckout }: DrawerProps) {
  const { items, totalItems, subtotal, addItem, updateQuantity, removeItem } = useCart();
  const [removingId, setRemovingId] = useState<string | null>(null);

  const handleRemove = (id: string) => {
    setRemovingId(id);
    setTimeout(() => { removeItem(id); setRemovingId(null); }, 250);
  };

  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            onClick={onClose}
            style={{ position: "fixed", inset: 0, zIndex: 900, background: "rgba(8,2,0,0.7)" }}
          />
          <motion.div
            initial={{ x: "100%" }} animate={{ x: 0 }} exit={{ x: "100%" }}
            transition={{ ease: EO, duration: 0.3 }}
            style={{
              position: "fixed", top: 0, right: 0, bottom: 0, zIndex: 901,
              width: "100%", maxWidth: 420,
              background: "#120600", borderLeft: "1px solid rgba(245,200,66,0.1)",
              display: "flex", flexDirection: "column",
              direction: "rtl",
            }}
          >
            {/* Header */}
            <div style={{
              display: "flex", alignItems: "center", justifyContent: "space-between",
              padding: "16px 20px", borderBottom: "1px solid rgba(245,200,66,0.08)",
              flexShrink: 0,
            }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <h3 style={{ fontFamily: "Cairo, sans-serif", fontWeight: 900, fontSize: 18, color: "#F9F3E8" }}>
                  طلبك
                </h3>
                {totalItems > 0 && (
                  <span style={{
                    background: "rgba(200,65,10,0.15)", border: "1px solid rgba(200,65,10,0.3)",
                    color: "#C8410A", fontSize: 11, fontWeight: 700,
                    fontFamily: "Tajawal, sans-serif",
                    padding: "2px 10px", borderRadius: 999,
                  }}>
                    {toArabicNumber(totalItems)} أصناف
                  </span>
                )}
              </div>
              <button onClick={onClose} style={{
                background: "none", border: "none", color: "#A07850",
                cursor: "pointer", padding: 4,
              }}>
                <X size={20} />
              </button>
            </div>

            {/* Items */}
            <div style={{ flex: 1, overflowY: "auto", padding: "16px 20px" }}>
              {items.length === 0 ? (
                <div style={{
                  display: "flex", flexDirection: "column", alignItems: "center",
                  justifyContent: "center", paddingTop: 60, textAlign: "center",
                }}>
                  <div style={{
                    width: 80, height: 80, borderRadius: 16,
                    background: "#1E0C02", border: "1px solid rgba(245,200,66,0.1)",
                    display: "flex", alignItems: "center", justifyContent: "center",
                    marginBottom: 16,
                  }}>
                    <ShoppingBag size={32} style={{ color: "rgba(160,120,80,0.3)" }} />
                  </div>
                  <p style={{ fontFamily: "Cairo, sans-serif", fontWeight: 700, fontSize: 16, color: "#F9F3E8", marginBottom: 6 }}>
                    سلة الطلبات فاضية
                  </p>
                  <p style={{ fontFamily: "Tajawal, sans-serif", fontSize: 12, color: "#A07850" }}>
                    أضف أصناف من القائمة
                  </p>
                </div>
              ) : (
                <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                  {items.map((item) => (
                    <motion.div
                      key={item.id}
                      animate={{ opacity: removingId === item.id ? 0 : 1, scale: removingId === item.id ? 0.95 : 1 }}
                      transition={{ duration: 0.2 }}
                      style={{
                        background: "#1E0C02", borderRadius: 12,
                        border: "0.5px solid rgba(245,200,66,0.1)", overflow: "hidden",
                      }}
                    >
                      <div style={{ display: "flex", gap: 12, padding: "12px" }}>
                        <div style={{
                          width: 64, height: 64, borderRadius: 10, overflow: "hidden",
                          background: "#0F0500", flexShrink: 0,
                        }}>
                          <img src={item.img} alt={item.name} style={{ width: "100%", height: "100%", objectFit: "cover" }} loading="lazy" />
                        </div>
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <h4 style={{ fontFamily: "Cairo, sans-serif", fontWeight: 700, fontSize: 13, color: "#F9F3E8", marginBottom: 2 }}>
                            {item.name}
                          </h4>
                          <span style={{ fontFamily: "Cairo, sans-serif", fontWeight: 700, fontSize: 14, color: "#D4870A" }}>
                            {formatPrice(item.priceValue)}
                          </span>
                        </div>
                        <button onClick={() => handleRemove(item.id)} style={{
                          background: "none", border: "none", color: "rgba(160,120,80,0.4)",
                          cursor: "pointer", padding: 4, flexShrink: 0, alignSelf: "flex-start",
                        }}>
                          <Trash2 size={14} />
                        </button>
                      </div>
                      <div style={{
                        display: "flex", alignItems: "center", justifyContent: "space-between",
                        padding: "8px 12px 12px", borderTop: "1px solid rgba(245,200,66,0.06)",
                      }}>
                        <div style={{
                          display: "flex", alignItems: "center", gap: 3,
                          background: "#0F0500", borderRadius: 9,
                          border: "1px solid rgba(245,200,66,0.1)", padding: 2,
                        }}>
                          <button onClick={() => updateQuantity(item.id, item.quantity - 1)} style={{
                            width: 30, height: 30, borderRadius: 7,
                            background: "#C8410A", color: "#fff", border: "none",
                            cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center",
                          }}>
                            <Minus size={12} />
                          </button>
                          <span style={{
                            width: 32, textAlign: "center",
                            fontFamily: "Cairo, sans-serif", fontWeight: 700, fontSize: 13, color: "#F9F3E8",
                          }}>
                            {toArabicNumber(item.quantity)}
                          </span>
                          <button onClick={() => addItem(item)} style={{
                            width: 30, height: 30, borderRadius: 7,
                            background: "#C8410A", color: "#fff", border: "none",
                            cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center",
                          }}>
                            <Plus size={12} />
                          </button>
                        </div>
                        <span style={{ fontFamily: "Cairo, sans-serif", fontWeight: 700, fontSize: 13, color: "rgba(249,243,232,0.6)" }}>
                          {formatPrice(item.priceValue * item.quantity)}
                        </span>
                      </div>
                    </motion.div>
                  ))}
                </div>
              )}
            </div>

            {/* Footer */}
            {items.length > 0 && (
              <div style={{
                padding: "16px 20px", borderTop: "1px solid rgba(245,200,66,0.08)",
                flexShrink: 0,
              }}>
                <div style={{
                  display: "flex", justifyContent: "space-between", alignItems: "center",
                  marginBottom: 14,
                }}>
                  <span style={{ fontFamily: "Cairo, sans-serif", fontWeight: 700, fontSize: 14, color: "#F9F3E8" }}>
                    الإجمالي
                  </span>
                  <span style={{ fontFamily: "Cairo, sans-serif", fontWeight: 900, fontSize: 18, color: "#F5C842" }}>
                    {formatPrice(subtotal)}
                  </span>
                </div>
                <motion.button
                  whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} transition={SPF}
                  onClick={onCheckout}
                  style={{
                    width: "100%", padding: "14px 0",
                    background: "linear-gradient(135deg,#C8410A,#D4870A)",
                    color: "#fff", border: "none", borderRadius: 12,
                    cursor: "pointer", fontFamily: "Cairo, sans-serif",
                    fontWeight: 700, fontSize: 15,
                    boxShadow: "0 4px 20px rgba(200,65,10,0.35)",
                  }}
                >
                  تأكيد الطلب
                </motion.button>
              </div>
            )}
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}

// ── Checkout Dialog ────────────────────────────────────────────────────────
interface CheckoutProps {
  open: boolean;
  onClose: () => void;
  onSubmit: (data: { name: string; phone: string; address: string; notes: string }) => void;
}

export function CheckoutDialog({ open, onClose, onSubmit }: CheckoutProps) {
  const { items, subtotal, totalItems } = useCart();
  const [form, setForm] = useState({ name: "", phone: "", address: "", notes: "" });
  const [errors, setErrors] = useState<{ name?: string; phone?: string; address?: string }>({});

  useEffect(() => {
    if (!open) { setForm({ name: "", phone: "", address: "", notes: "" }); setErrors({}); }
  }, [open]);

  const validate = () => {
    const errs: typeof errors = {};
    if (!form.name.trim()) errs.name = "يرجى إدخال الاسم";
    if (!form.phone.trim()) errs.phone = "يرجى إدخال رقم الهاتف";
    else if (!/^[\d\+\-\s]{7,15}$/.test(form.phone.trim())) errs.phone = "رقم هاتف غير صحيح";
    if (!form.address.trim()) errs.address = "يرجى إدخال العنوان";
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;
    onSubmit({ name: form.name.trim(), phone: form.phone.trim(), address: form.address.trim(), notes: form.notes.trim() });
  };

  const updateField = (field: string, value: string) => setForm((prev) => ({ ...prev, [field]: value }));

  const inputStyle = {
    width: "100%", background: "#1E0C02", border: "1px solid rgba(245,200,66,0.12)",
    borderRadius: 10, padding: "12px 14px", color: "#F9F3E8",
    fontFamily: "Tajawal, sans-serif", fontSize: 13, fontWeight: 600,
    outline: "none", transition: "border-color 0.2s",
  };

  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            onClick={onClose}
            style={{ position: "fixed", inset: 0, zIndex: 950, background: "rgba(8,2,0,0.8)" }}
          />
          <motion.div
            initial={{ opacity: 0, y: 30, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.97 }}
            transition={{ ease: EO, duration: 0.3 }}
            onClick={onClose}
            style={{
              position: "fixed", inset: 0, zIndex: 951,
              display: "flex", alignItems: "center", justifyContent: "center",
              padding: 16, pointerEvents: "none",
            }}
          >
            <motion.div
              onClick={(e) => e.stopPropagation()}
              style={{
                width: "100%", maxWidth: 480,
                maxHeight: "calc(100vh - 32px)",
                background: "#120600", border: "1px solid rgba(245,200,66,0.12)",
                borderRadius: 20, overflow: "hidden",
                display: "flex", flexDirection: "column",
                direction: "rtl", pointerEvents: "auto",
              }}
            >
              {/* Header */}
              <div style={{
                display: "flex", alignItems: "center", justifyContent: "space-between",
                padding: "clamp(14px,2.5vw,18px) clamp(16px,3vw,20px)",
                borderBottom: "1px solid rgba(245,200,66,0.08)", flexShrink: 0,
              }}>
                <h3 style={{ fontFamily: "Cairo, sans-serif", fontWeight: 900, fontSize: "clamp(15px,2.5vw,17px)", color: "#F9F3E8" }}>
                  معلومات التوصيل
                </h3>
                <button onClick={onClose} style={{ background: "none", border: "none", color: "#A07850", cursor: "pointer", padding: 4 }}>
                  <X size={18} />
                </button>
              </div>

              {/* Scrollable content */}
              <div style={{ overflowY: "auto", padding: "clamp(14px,2.5vw,20px)" }}>
                {/* Order summary */}
                <div style={{
                  background: "#1E0C02", borderRadius: 12,
                  border: "1px solid rgba(245,200,66,0.08)", padding: "clamp(12px,2vw,14px)", marginBottom: "clamp(14px,3vw,20px)",
                }}>
                  <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 10 }}>
                    <span style={{ fontFamily: "Tajawal, sans-serif", fontSize: 12, color: "rgba(160,120,80,0.6)", fontWeight: 600 }}>
                      طلبك
                    </span>
                    <span style={{ fontFamily: "Tajawal, sans-serif", fontSize: 12, color: "rgba(160,120,80,0.5)", fontWeight: 600 }}>
                      {toArabicNumber(totalItems)} صنف
                    </span>
                  </div>
                  <div style={{ display: "flex", flexDirection: "column", gap: 6, marginBottom: 10 }}>
                    {items.map((item) => (
                      <div key={item.id} style={{ display: "flex", justifyContent: "space-between", fontSize: 12 }}>
                        <span style={{ fontFamily: "Tajawal, sans-serif", color: "rgba(249,243,232,0.7)", fontWeight: 600 }}>
                          {item.name} <span style={{ color: "rgba(160,120,80,0.5)" }}>×{toArabicNumber(item.quantity)}</span>
                        </span>
                        <span style={{ fontFamily: "Cairo, sans-serif", color: "rgba(249,243,232,0.5)", fontWeight: 700 }}>
                          {formatPrice(item.priceValue * item.quantity)}
                        </span>
                      </div>
                    ))}
                  </div>
                  <div style={{ height: 1, background: "rgba(245,200,66,0.08)", margin: "8px 0" }} />
                  <div style={{ display: "flex", justifyContent: "space-between" }}>
                    <span style={{ fontFamily: "Cairo, sans-serif", fontWeight: 700, fontSize: 13, color: "#F9F3E8" }}>الإجمالي</span>
                    <span style={{ fontFamily: "Cairo, sans-serif", fontWeight: 900, fontSize: 15, color: "#F5C842" }}>{formatPrice(subtotal)}</span>
                  </div>
                </div>

                {/* Form */}
                <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: 14 }}>
                  <div>
                    <label style={{ display: "flex", alignItems: "center", gap: 6, fontFamily: "Tajawal, sans-serif", fontSize: 12, color: "rgba(160,120,80,0.7)", fontWeight: 700, marginBottom: 6 }}>
                      <User size={13} style={{ color: "#C8410A" }} /> الاسم كامل
                    </label>
                    <input
                      style={inputStyle}
                      value={form.name}
                      onChange={(e) => updateField("name", e.target.value)}
                      placeholder="مثلاً: أحمد محمد"
                      onFocus={(e) => e.target.style.borderColor = "rgba(245,200,66,0.4)"}
                      onBlur={(e) => e.target.style.borderColor = "rgba(245,200,66,0.12)"}
                    />
                    {errors.name && <p style={{ fontFamily: "Tajawal, sans-serif", color: "#C8410A", fontSize: 11, fontWeight: 600, marginTop: 4, marginRight: 2 }}>{errors.name}</p>}
                  </div>
                  <div>
                    <label style={{ display: "flex", alignItems: "center", gap: 6, fontFamily: "Tajawal, sans-serif", fontSize: 12, color: "rgba(160,120,80,0.7)", fontWeight: 700, marginBottom: 6 }}>
                      <Phone size={13} style={{ color: "#C8410A" }} /> رقم الهاتف
                    </label>
                    <input
                      type="tel"
                      style={inputStyle}
                      value={form.phone}
                      onChange={(e) => updateField("phone", e.target.value)}
                      placeholder="مثلاً: 01000000001"
                      onFocus={(e) => e.target.style.borderColor = "rgba(245,200,66,0.4)"}
                      onBlur={(e) => e.target.style.borderColor = "rgba(245,200,66,0.12)"}
                    />
                    {errors.phone && <p style={{ fontFamily: "Tajawal, sans-serif", color: "#C8410A", fontSize: 11, fontWeight: 600, marginTop: 4, marginRight: 2 }}>{errors.phone}</p>}
                  </div>
                  <div>
                    <label style={{ display: "flex", alignItems: "center", gap: 6, fontFamily: "Tajawal, sans-serif", fontSize: 12, color: "rgba(160,120,80,0.7)", fontWeight: 700, marginBottom: 6 }}>
                      <MapPin size={13} style={{ color: "#C8410A" }} /> العنوان
                    </label>
                    <input
                      style={inputStyle}
                      value={form.address}
                      onChange={(e) => updateField("address", e.target.value)}
                      placeholder="الشارع، المنطقة، المدينة"
                      onFocus={(e) => e.target.style.borderColor = "rgba(245,200,66,0.4)"}
                      onBlur={(e) => e.target.style.borderColor = "rgba(245,200,66,0.12)"}
                    />
                    {errors.address && <p style={{ fontFamily: "Tajawal, sans-serif", color: "#C8410A", fontSize: 11, fontWeight: 600, marginTop: 4, marginRight: 2 }}>{errors.address}</p>}
                  </div>
                  <div>
                    <label style={{ display: "flex", alignItems: "center", gap: 6, fontFamily: "Tajawal, sans-serif", fontSize: 12, color: "rgba(160,120,80,0.7)", fontWeight: 700, marginBottom: 6 }}>
                      <FileText size={13} style={{ color: "#C8410A" }} /> ملاحظات (اختياري)
                    </label>
                    <textarea
                      style={{ ...inputStyle, resize: "none", minHeight: 64 }}
                      value={form.notes}
                      onChange={(e) => updateField("notes", e.target.value)}
                      placeholder="أي ملاحظات إضافية..."
                      rows={2}
                      onFocus={(e) => e.target.style.borderColor = "rgba(245,200,66,0.4)"}
                      onBlur={(e) => e.target.style.borderColor = "rgba(245,200,66,0.12)"}
                    />
                  </div>

                  <motion.button
                    type="submit"
                    whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} transition={SPF}
                    style={{
                      width: "100%", padding: "14px 0", marginTop: 6,
                      background: "linear-gradient(135deg,#C8410A,#D4870A)",
                      color: "#fff", border: "none", borderRadius: 12,
                      cursor: "pointer", fontFamily: "Cairo, sans-serif",
                      fontWeight: 700, fontSize: 15,
                      boxShadow: "0 4px 20px rgba(200,65,10,0.35)",
                    }}
                  >
                    إرسال الطلب
                  </motion.button>
                </form>
              </div>
            </motion.div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}

// ── Order Confirmation ─────────────────────────────────────────────────────
interface ConfirmProps {
  open: boolean;
  customer: { name: string; phone: string; address: string; notes: string } | null;
  messenger: string;
  onDone: () => void;
}

function buildOrderMessage(
  items: { name: string; quantity: number; price: number }[],
  subtotal: number,
  customer: { name: string; phone: string; address: string; notes: string },
): string {
  const lines = ["*طلب جديد من بيت الشواية اليمني!*", ""];
  lines.push("▬▬▬▬▬▬▬▬▬▬▬▬");
  lines.push("");
  items.forEach((item) => {
    const total = item.price * item.quantity;
    lines.push(`• ${item.name}  ×${item.quantity}  = ${total} ج`);
  });
  lines.push("");
  lines.push("▬▬▬▬▬▬▬▬▬▬▬▬");
  lines.push(` *الإجمالي:* ${subtotal} ج`);
  lines.push("");
  lines.push("━━━ *معلومات العميل* ━━━");
  lines.push(` ${customer.name}`);
  lines.push(` ${customer.phone}`);
  lines.push(` ${customer.address}`);
  if (customer.notes.trim()) lines.push(` ${customer.notes}`);
  lines.push("");
  lines.push("شكراً لطلبك من بيت الشواية اليمني!");
  return lines.join("\n");
}

export function OrderConfirmation({ open, customer, messenger, onDone }: ConfirmProps) {
  const { items, subtotal, totalItems, clearCart } = useCart();
  const [copied, setCopied] = useState(false);
  const [sent, setSent] = useState(false);

  const handleSend = () => {
    if (!customer) return;
    const orderText = buildOrderMessage(
      items.map((i) => ({ name: i.name, quantity: i.quantity, price: i.priceValue })),
      subtotal, customer,
    );
    navigator.clipboard.writeText(orderText).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
    window.open(messenger, "_blank");
    setSent(true);
  };

  const handleDone = () => {
    clearCart();
    localStorage.removeItem("yemeni-checkout");
    onDone();
  };

  if (!customer) return null;

  const formatPriceVal = (val: number) => `${val} ج`;

  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            style={{ position: "fixed", inset: 0, zIndex: 970, background: "rgba(8,2,0,0.85)" }}
          />
          <motion.div
            initial={{ opacity: 0, y: 30, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.97 }}
            transition={{ ease: EO, duration: 0.3 }}
            style={{
              position: "fixed", top: "50%", left: "50%", zIndex: 971,
              transform: "translate(-50%,-50%)",
              width: "calc(100% - 32px)", maxWidth: 480, maxHeight: "85vh",
              background: "#120600", border: "1px solid rgba(245,200,66,0.12)",
              borderRadius: 20, overflow: "hidden",
              display: "flex", flexDirection: "column",
              direction: "rtl",
            }}
          >
            <div style={{ overflowY: "auto", padding: "24px 20px" }}>
              {/* Success badge */}
              <div style={{
                display: "flex", alignItems: "center", gap: 12,
                background: "rgba(26,92,46,0.15)", border: "1px solid rgba(26,92,46,0.25)",
                borderRadius: 14, padding: "14px 16px", marginBottom: 20,
              }}>
                <div style={{
                  width: 40, height: 40, borderRadius: "50%",
                  background: "#1a5c2e", display: "flex",
                  alignItems: "center", justifyContent: "center", flexShrink: 0,
                }}>
                  <Check size={20} style={{ color: "#fff" }} />
                </div>
                <div>
                  <div style={{ fontFamily: "Cairo, sans-serif", fontWeight: 700, fontSize: 14, color: "#F9F3E8" }}>
                    طلبك جاهز للإرسال
                  </div>
                  <p style={{ fontFamily: "Tajawal, sans-serif", fontSize: 11, color: "rgba(160,120,80,0.6)", fontWeight: 600, marginTop: 2 }}>
                    راجع الطلب واضغط على زر الإرسال
                  </p>
                </div>
              </div>

              {/* Order items */}
              <div style={{
                background: "#1E0C02", borderRadius: 14,
                border: "1px solid rgba(245,200,66,0.08)", overflow: "hidden", marginBottom: 14,
              }}>
                <div style={{
                  display: "flex", justifyContent: "space-between",
                  padding: "14px 16px", borderBottom: "1px solid rgba(245,200,66,0.06)",
                }}>
                  <span style={{ fontFamily: "Cairo, sans-serif", fontWeight: 700, fontSize: 13, color: "#F9F3E8" }}>الطلبات</span>
                  <span style={{ fontFamily: "Tajawal, sans-serif", fontSize: 11, color: "rgba(160,120,80,0.5)", fontWeight: 600 }}>
                    {totalItems} صنف
                  </span>
                </div>
                <div style={{ padding: "12px 16px", display: "flex", flexDirection: "column", gap: 10 }}>
                  {items.map((item) => (
                    <div key={item.id} style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                        <div style={{
                          width: 44, height: 44, borderRadius: 10, overflow: "hidden",
                          background: "#0F0500", flexShrink: 0,
                        }}>
                          <img src={item.img} alt={item.name} style={{ width: "100%", height: "100%", objectFit: "cover" }} loading="lazy" />
                        </div>
                        <div>
                          <div style={{ fontFamily: "Cairo, sans-serif", fontWeight: 700, fontSize: 12, color: "#F9F3E8" }}>{item.name}</div>
                          <div style={{ fontFamily: "Tajawal, sans-serif", fontSize: 11, color: "rgba(160,120,80,0.5)", fontWeight: 600 }}>
                            ×{item.quantity}
                          </div>
                        </div>
                      </div>
                      <span style={{ fontFamily: "Cairo, sans-serif", fontWeight: 700, fontSize: 13, color: "#D4870A" }}>
                        {formatPriceVal(item.priceValue * item.quantity)}
                      </span>
                    </div>
                  ))}
                </div>
                <div style={{ height: 1, background: "rgba(245,200,66,0.06)", margin: "0 16px" }} />
                <div style={{ padding: "12px 16px", display: "flex", justifyContent: "space-between" }}>
                  <span style={{ fontFamily: "Cairo, sans-serif", fontWeight: 700, fontSize: 13, color: "#F9F3E8" }}>الإجمالي</span>
                  <span style={{ fontFamily: "Cairo, sans-serif", fontWeight: 900, fontSize: 16, color: "#F5C842" }}>{formatPriceVal(subtotal)}</span>
                </div>
              </div>

              {/* Customer info */}
              <div style={{
                background: "#1E0C02", borderRadius: 14,
                border: "1px solid rgba(245,200,66,0.08)", padding: "14px 16px", marginBottom: 20,
              }}>
                <h4 style={{ fontFamily: "Cairo, sans-serif", fontWeight: 700, fontSize: 13, color: "#F9F3E8", marginBottom: 12 }}>
                  معلومات العميل
                </h4>
                <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                  {[
                    { icon: "👤", label: "الاسم", value: customer.name },
                    { icon: "📞", label: "الهاتف", value: customer.phone },
                    { icon: "📍", label: "العنوان", value: customer.address },
                    ...(customer.notes.trim() ? [{ icon: "📝", label: "ملاحظات", value: customer.notes }] : []),
                  ].map(({ icon, label, value }) => (
                    <div key={label} style={{ display: "flex", alignItems: "flex-start", gap: 10 }}>
                      <span style={{ fontSize: 14, flexShrink: 0 }}>{icon}</span>
                      <div>
                        <div style={{ fontFamily: "Tajawal, sans-serif", fontSize: 10, color: "rgba(160,120,80,0.4)", fontWeight: 700, marginBottom: 1 }}>
                          {label}
                        </div>
                        <div style={{ fontFamily: "Tajawal, sans-serif", fontSize: 13, color: "rgba(249,243,232,0.8)", fontWeight: 600 }}>
                          {value}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Actions */}
              <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                <motion.button
                  whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} transition={SPF}
                  onClick={handleSend}
                  style={{
                    width: "100%", padding: "15px 0",
                    background: "linear-gradient(135deg,#0078FF,#0055CC)",
                    color: "#fff", border: "none", borderRadius: 14,
                    cursor: "pointer", fontFamily: "Cairo, sans-serif",
                    fontWeight: 700, fontSize: 15,
                    display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
                    boxShadow: "0 6px 24px rgba(0,120,255,0.35)",
                  }}
                >
                  {copied ? (
                    <><Check size={18} /> تم النسخ!</>
                  ) : (
                    <><Copy size={18} /> نسخ الطلب وفتح ماسنجر</>
                  )}
                </motion.button>

                {sent && (
                  <motion.button
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} transition={SPF}
                    onClick={handleDone}
                    style={{
                      width: "100%", padding: "12px 0",
                      background: "transparent",
                      color: "#A07850", border: "1px solid rgba(245,200,66,0.2)",
                      borderRadius: 12, cursor: "pointer",
                      fontFamily: "Cairo, sans-serif", fontWeight: 700, fontSize: 14,
                    }}
                  >
                    تم — العودة للقائمة
                  </motion.button>
                )}
              </div>

              {sent && !copied && (
                <p style={{
                  textAlign: "center", fontFamily: "Tajawal, sans-serif",
                  fontSize: 11, color: "rgba(160,120,80,0.4)", fontWeight: 600, marginTop: 12,
                }}>
                  تم نسخ الطلب — الصقه في ماسنجر وأرسله
                </p>
              )}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
