import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence, useScroll, useTransform } from "motion/react";
import {
  Phone, MapPin, MessageCircle, Flame, Clock, X, Menu as MenuIcon,
  ChevronDown, Star, Facebook, Instagram, Utensils, Leaf,
  IceCream, Coffee, Check, ArrowLeft, ShoppingBag, Plus, Minus,
} from "lucide-react";
import { CartProvider, useCart } from "./components/cart/store";
import { FloatingCartButton, CartDrawer, CheckoutDialog, OrderConfirmation } from "./components/cart/CartUI";
import { toArabicNumber } from "./components/cart/arabicNumbers";

// ── constants ─────────────────────────────────────────────────────────────────
const STORAGE_KEY = "yemeni_branch_id";
const EO: [number, number, number, number] = [0, 0, 0.2, 1];
const SP = { type: "spring" as const, stiffness: 340, damping: 26 };
const SPF = { type: "spring" as const, stiffness: 500, damping: 32 };

// ── types ─────────────────────────────────────────────────────────────────────
interface MenuItem { id: string; name: string; desc: string; price: string; badge?: string; img: string; }
interface SubCat { id: string; name: string; items: MenuItem[]; }
interface MenuCat { id: string; name: string; icon: React.ReactNode; items?: MenuItem[]; subcategories?: SubCat[]; }
interface Branch {
  id: string; name: string; shortDesc: string; address: string;
  phones: string[]; messenger: string; maps: string; hours: string;
  menu: MenuCat[];
}

// ── shared image bank ─────────────────────────────────────────────────────────
const IMG = {
  g1: "https://images.unsplash.com/photo-1759568558640-3c9239a6153e?w=600&h=400&fit=crop&auto=format",
  g2: "https://images.unsplash.com/photo-1621790404813-df280c2de418?w=600&h=400&fit=crop&auto=format",
  g3: "https://images.unsplash.com/photo-1558030154-d3605e91d892?w=600&h=400&fit=crop&auto=format",
  g4: "https://images.unsplash.com/photo-1588182657969-777d766e31ab?w=600&h=400&fit=crop&auto=format",
  g5: "https://images.unsplash.com/photo-1657048465421-087063313187?w=600&h=400&fit=crop&auto=format",
  s1: "https://images.unsplash.com/photo-1561954468-039c5f32644d?w=600&h=400&fit=crop&auto=format",
  s2: "https://images.unsplash.com/photo-1646487793655-bbf280273d2f?w=600&h=400&fit=crop&auto=format",
  s3: "https://images.unsplash.com/photo-1679744034792-705da160c109?w=600&h=400&fit=crop&auto=format",
  d1: "https://images.unsplash.com/photo-1598110750624-207050c4f28c?w=600&h=400&fit=crop&auto=format",
  d2: "https://images.unsplash.com/photo-1617806501553-d3a6a3a7b227?w=600&h=400&fit=crop&auto=format",
  d3: "https://images.unsplash.com/photo-1778447812923-88a9e3e6b567?w=600&h=400&fit=crop&auto=format",
  j1: "https://images.unsplash.com/photo-1774806245018-a2bdd2eb620b?w=600&h=400&fit=crop&auto=format",
  j2: "https://images.unsplash.com/photo-1748674752758-2054db1f8278?w=600&h=400&fit=crop&auto=format",
  j3: "https://images.unsplash.com/photo-1759006249055-8c4030a2d56a?w=600&h=400&fit=crop&auto=format",
};

// ── menu factory ──────────────────────────────────────────────────────────────
let _itemId = 0;
function nextId(): string { return `item-${++_itemId}`; }

function makeMenu(grillBonus = 0, exclusive?: Omit<MenuItem, 'id'>): MenuCat[] {
  const g = (p: number) => `${p + grillBonus} جنيه`;
  return [
    {
      id: "grills", name: "الشوايه", icon: <Flame size={15} />,
      items: [
        { id: nextId(), name: "دجاج شواية كامل", desc: "دجاجة كاملة بالخلطة اليمنية الأصيلة مع الأرز والسلطة والخبز", price: g(125), badge: "الأكثر طلباً", img: IMG.g1 },
        { id: nextId(), name: "نص دجاج شواية", desc: "نصف دجاجة مشوية بتتبيلة خليجية مع أرز وسلطة وخبز طازج", price: g(75), img: IMG.g2 },
        { id: nextId(), name: "ربع دجاج شواية", desc: "ربع دجاجة مشوية مثالية للفرد مع طبق جانبي من اختيارك", price: g(45), img: IMG.g3 },
        { id: nextId(), name: "ساندوتش شواية", desc: "خبز طازج محشو بدجاج مشوي وصوص الثوم اليمني والخضار", price: g(40), img: IMG.g5 },
        { id: nextId(), name: "وجبة عائلية", desc: "دجاجتين كاملتين مع أرز كبير وسلطات ومشروبات للعائلة", price: g(230), badge: "عائلي", img: IMG.g4 },
        ...(exclusive ? [{ ...exclusive, id: nextId() }] : []),
      ],
    },
    {
      id: "salads", name: "السلطات", icon: <Leaf size={15} />,
      items: [
        { id: nextId(), name: "سلطة خضراء", desc: "خس طازج مع طماطم وخيار وزيتون وصوص الليمون", price: "25 جنيه", img: IMG.s1 },
        { id: nextId(), name: "فتوش", desc: "خبز محمص مع خضروات طازجة وصوص الرمان اللبناني الأصيل", price: "30 جنيه", badge: "مميز", img: IMG.s2 },
        { id: nextId(), name: "تبولة", desc: "بقدونس طازج مع برغل وطماطم وعصير ليمون وزيت زيتون", price: "30 جنيه", img: IMG.s3 },
        { id: nextId(), name: "سلطة روسية", desc: "خضروات مسلوقة مع مايونيز خفيف — بسيطة ولذيذة", price: "20 جنيه", img: IMG.s1 },
      ],
    },
    {
      id: "desserts", name: "الحلويات", icon: <IceCream size={15} />,
      items: [
        { id: nextId(), name: "كنافة بالقشطة", desc: "كنافة ناعمة محشوة بالقشطة الطازجة ومغموسة بالقطر", price: "35 جنيه", badge: "الأشهر", img: IMG.d1 },
        { id: nextId(), name: "أم علي", desc: "حلوى مصرية أصيلة بالعجين والقشطة والمكسرات والكريمة", price: "40 جنيه", img: IMG.d2 },
        { id: nextId(), name: "بقلاوة", desc: "طبقات من العجين الهش مع المكسرات والعسل الطبيعي", price: "30 جنيه", img: IMG.d3 },
      ],
    },
    {
      id: "juices", name: "العصائر", icon: <Coffee size={15} />,
      subcategories: [
        {
          id: "mix", name: "مشروبات مكس",
          items: [
            { id: nextId(), name: "موهيتو ليمون", desc: "ليمون طازج مع نعناع وصودا وثلج — منعش ومميز", price: "35 جنيه", img: IMG.j1 },
            { id: nextId(), name: "بلو لاغون", desc: "مزيج مميز بالتوت الأزرق والليمون والصودا المثلجة", price: "40 جنيه", badge: "جديد", img: IMG.j2 },
            { id: nextId(), name: "ليمون بالنعناع", desc: "عصير ليمون طازج معصور مع نعناع طازج وثلج مجروش", price: "30 جنيه", img: IMG.j3 },
          ],
        },
        {
          id: "fruits", name: "مشروبات فواكه",
          items: [
            { id: nextId(), name: "عصير مانجو", desc: "مانجو طبيعية 100% بدون إضافات — حلاوة طبيعية خالصة", price: "35 جنيه", badge: "طبيعي", img: IMG.j1 },
            { id: nextId(), name: "عصير فراولة", desc: "فراولة طازجة ممزوجة مع قليل من السكر والثلج", price: "35 جنيه", img: IMG.j2 },
            { id: nextId(), name: "عصير برتقال", desc: "برتقال طازج معصور أمامك في الحال — فيتامين سي طبيعي", price: "30 جنيه", img: IMG.j3 },
          ],
        },
        {
          id: "special", name: "مشروبات مميزة",
          items: [
            { id: nextId(), name: "سموثي مانجو جوز هند", desc: "سموثي كريمي بالمانجو وجوز الهند والعسل الطبيعي", price: "45 جنيه", badge: "الأفضل", img: IMG.j3 },
            { id: nextId(), name: "كوكتيل فواكه", desc: "خمسة فواكه طازجة ممزوجة في كوب واحد مميز", price: "45 جنيه", img: IMG.j1 },
            { id: nextId(), name: "عصير خوخ وتوت", desc: "خوخ طبيعي ممزوج بالتوت الطازج وقليل من العسل", price: "40 جنيه", img: IMG.j2 },
          ],
        },
        {
          id: "cold", name: "مشروبات باردة",
          items: [
            { id: nextId(), name: "آيس تي ليمون", desc: "شاي مثلج بالليمون الطازج — مثالي مع الأكل", price: "25 جنيه", img: IMG.j2 },
            { id: nextId(), name: "كولا / بيبسي", desc: "مشروب غازي بارد من الثلاجة مباشرة", price: "20 جنيه", img: IMG.j3 },
            { id: nextId(), name: "مياه معدنية", desc: "مياه باردة معدنية أو عادية", price: "10 جنيه", img: IMG.j1 },
          ],
        },
      ],
    },
  ];
}

// ── branch data ───────────────────────────────────────────────────────────────
const BRANCHES: Branch[] = [
  {
    id: "faisal", name: "فرع فيصل", shortDesc: "الفرع الأول والأصيل في قلب العشرين",
    address: "٢ ش محمد عفيفي، العشرين، فيصل، الجيزة",
    phones: ["0223502288", "01222606500"], messenger: "https://m.me/BeitelShawaeyaYemeni",
    maps: "https://www.google.com/maps/search/2+محمد+عفيفي+العشرين+فيصل+الجيزة",
    hours: "يومياً من ١٢ ظهراً حتى ٢ فجراً",
    menu: makeMenu(0),
  },
  {
    id: "dokki", name: "فرع الدقي", shortDesc: "قلب الدقي — أمام عطارة درهم الشهيرة",
    address: "٨ ش إيران، الدقي، الجيزة",
    phones: ["0237615006", "01153334389"], messenger: "https://m.me/BeitelShawaeyaYemeni",
    maps: "https://www.google.com/maps/search/8+شارع+إيران+الدقي+الجيزة",
    hours: "يومياً من ١ ظهراً حتى ٣ فجراً",
    menu: makeMenu(5, {
      name: "كومبو الدقي المميز", badge: "حصري",
      desc: "خاص بفرع الدقي: ربعان مشويان + سلطتان + مشروبان",
      price: "110 جنيه", img: IMG.g4,
    }),
  },
  {
    id: "nasr", name: "فرع مدينة نصر", shortDesc: "قريب من كل حاجة في مدينة نصر",
    address: "٧٥ ش أبو داوود الظاهري، مدينة نصر، القاهرة",
    phones: ["01281922823", "01115551189"], messenger: "https://m.me/BeitelShawaeyaYemeni",
    maps: "https://www.google.com/maps/search/75+ابو+داوود+الظاهري+مدينة+نصر+القاهرة",
    hours: "يومياً من ١٢ ظهراً حتى ١ فجراً",
    menu: makeMenu(0),
  },
  {
    id: "mohandeseen", name: "فرع المهندسين", shortDesc: "في قلب ميت عقبة والعجوزة",
    address: "٢٠ الحجاز، ميت عقبة، العجوزة، الجيزة",
    phones: ["01114344413", "01110288823"], messenger: "https://m.me/BeitelShawaeyaYemeni",
    maps: "https://www.google.com/maps/search/20+الحجاز+ميت+عقبة+العجوزة+الجيزة",
    hours: "يومياً من ١ ظهراً حتى ٢ فجراً",
    menu: makeMenu(10, {
      name: "طبق المهندسين الملكي", badge: "حصري",
      desc: "خاص بالفرع: دجاجة كاملة + ٣ سلطات + مشروبان مميزان",
      price: "175 جنيه", img: IMG.g1,
    }),
  },
];

function messengerLink(url: string) {
  return url;
}

// ── BranchSelectorModal ───────────────────────────────────────────────────────
function BranchSelectorModal({ onSelect }: {
  onSelect: (b: Branch) => void;
}) {
  return (
    <motion.div
      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      transition={{ duration: 0.28, ease: EO }}
      className="modal-scroll"
      style={{
        position: "fixed", inset: 0, zIndex: 1000,
        background: "rgba(8,2,0,0.93)", backdropFilter: "blur(14px)",
        display: "flex", alignItems: "center", justifyContent: "center",
        padding: "clamp(60px,10vh,100px) clamp(12px,3vw,40px) 24px", overflowY: "auto", direction: "rtl",
      }}
    >
      <motion.div
        initial={{ opacity: 0, y: 28, scale: 0.97 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: 16, scale: 0.98 }}
        transition={{ ease: EO, duration: 0.4, delay: 0.06 }}
        style={{ width: "100%", maxWidth: 920 }}
      >
        {/* Header */}
        <div style={{ textAlign: "center", marginBottom: "clamp(20px,3.5vw,36px)" }}>
          <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 6, marginBottom: 14 }}>
            <Flame size={28} style={{ color: "#C8410A" }} />
            <h2 style={{ fontFamily: "Cairo, sans-serif", fontWeight: 900, fontSize: "clamp(22px,4.5vw,34px)", color: "#F5C842", lineHeight: 1.2 }}>
              بيت الشواية اليمني
            </h2>
            <span style={{ fontFamily: "Cairo, sans-serif", fontWeight: 700, fontSize: "clamp(15px,3vw,20px)", color: "#F9F3E8" }}>
              اختر فرعك
            </span>
          </div>
          <p style={{ fontFamily: "Tajawal, sans-serif", fontSize: "clamp(13px,2vw,15px)", color: "#A07850" }}>
            اختار الفرع الأقرب ليك وهنوصلك في أسرع وقت
          </p>
        </div>

        {/* Cards - responsive grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 md:gap-4">
          {BRANCHES.map((b, i) => (
            <motion.div
              key={b.id}
              initial={{ opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }}
              transition={{ ease: EO, duration: 0.38, delay: 0.12 + i * 0.07 }}
              whileHover={{ y: -5, boxShadow: "0 18px 50px rgba(200,65,10,0.28)" }}
              style={{
                background: "#1E0C02", border: "0.5px solid rgba(245,200,66,0.2)",
                borderRadius: 16, overflow: "hidden",
                transition: "box-shadow 0.3s ease, border-color 0.3s ease",
                display: "flex", flexDirection: "column",
              }}
              onMouseEnter={e => { e.currentTarget.style.borderColor = "rgba(245,200,66,0.45)"; }}
              onMouseLeave={e => { e.currentTarget.style.borderColor = "rgba(245,200,66,0.2)"; }}
            >
              <div style={{ height: 3, background: "linear-gradient(to left,#C8410A,#F5C842)", flexShrink: 0 }} />
              <div style={{ padding: "clamp(16px,2.5vw,22px)", display: "flex", flexDirection: "column", flex: 1 }}>
                <h3 style={{ fontFamily: "Cairo, sans-serif", fontWeight: 800, fontSize: "clamp(16px,2vw,18px)", color: "#F5C842", marginBottom: 12 }}>
                  {b.name}
                </h3>
                <div style={{ display: "flex", alignItems: "flex-start", gap: 7, marginBottom: 10 }}>
                  <MapPin size={14} style={{ color: "#D4870A", flexShrink: 0, marginTop: 3 }} />
                  <span style={{ fontFamily: "Tajawal, sans-serif", fontSize: "clamp(12px,1.5vw,13px)", color: "#F9F3E8", lineHeight: 1.65 }}>{b.address}</span>
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: 7, marginBottom: "auto" }}>
                  <Clock size={13} style={{ color: "#D4870A", flexShrink: 0 }} />
                  <span style={{ fontFamily: "Tajawal, sans-serif", fontSize: "clamp(12px,1.5vw,13px)", color: "#A07850" }}>{b.hours}</span>
                </div>
                <div style={{ marginTop: 16 }}>
                  <motion.button
                    whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }} transition={SPF}
                    onClick={() => onSelect(b)}
                    style={{
                      width: "100%", padding: "clamp(10px,1.5vw,12px) 0",
                      background: "linear-gradient(135deg,#C8410A,#D4870A)",
                      color: "#fff", border: "none", borderRadius: 10,
                      cursor: "pointer", fontFamily: "Cairo, sans-serif",
                      fontWeight: 700, fontSize: "clamp(13px,1.5vw,15px)",
                      display: "flex", alignItems: "center", justifyContent: "center", gap: 7,
                      boxShadow: "0 4px 16px rgba(200,65,10,0.3)",
                    }}
                  >
                    <Check size={16} /> اختيار الفرع
                  </motion.button>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </motion.div>
    </motion.div>
  );
}

// ── Navbar ────────────────────────────────────────────────────────────────────
function Navbar({ branch, scrolled, onChangeBranch }: {
  branch: Branch; scrolled: boolean; onChangeBranch: () => void;
}) {
  const [open, setOpen] = useState(false);
  const links = [{ label: "المنيو", href: "#menu" }, { label: "الفروع", href: "#branches" }, { label: "اتصل بنا", href: "#cta" }];

  return (
    <>
      <motion.nav
        animate={{ background: scrolled ? "rgba(15,5,0,0.95)" : "rgba(15,5,0,0)", backdropFilter: scrolled ? "blur(14px)" : "blur(0px)" }}
        transition={{ duration: 0.3, ease: EO }}
        style={{ position: "fixed", top: 0, left: 0, right: 0, zIndex: 500, height: 66, display: "flex", alignItems: "center", justifyContent: "space-between", padding: "0 clamp(16px,4vw,40px)", borderBottom: scrolled ? "1px solid rgba(245,200,66,0.1)" : "none", direction: "rtl" }}
      >
        {/* Logo */}
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <Flame size={20} style={{ color: "#C8410A" }} />
          <div>
            <div style={{ fontFamily: "Cairo, sans-serif", fontWeight: 900, fontSize: 15, color: "#F5C842", lineHeight: 1.2 }}>بيت الشواية اليمني</div>
            <div style={{ fontFamily: "Tajawal, sans-serif", fontSize: 10, color: "#A07850" }}>{branch.name}</div>
          </div>
        </div>

        {/* Desktop nav */}
        <div className="hidden md:flex" style={{ gap: 26, alignItems: "center" }}>
          {links.map(l => (
            <a key={l.label} href={l.href} style={{ fontFamily: "Tajawal, sans-serif", fontSize: 14, color: "#F9F3E8", textDecoration: "none" }}
              onMouseEnter={e => (e.currentTarget.style.color = "#F5C842")}
              onMouseLeave={e => (e.currentTarget.style.color = "#F9F3E8")}
            >{l.label}</a>
          ))}
        </div>

        {/* Desktop actions */}
        <div className="hidden md:flex" style={{ gap: 9, alignItems: "center" }}>
          <motion.button whileHover={{ scale: 1.04, borderColor: "#F5C842" }} whileTap={{ scale: 0.96 }} transition={SPF}
            onClick={onChangeBranch}
            style={{ border: "1px solid rgba(245,200,66,0.45)", color: "#F5C842", background: "rgba(15,5,0,0)", borderRadius: 9, padding: "7px 15px", cursor: "pointer", fontFamily: "Tajawal, sans-serif", fontWeight: 600, fontSize: 13, whiteSpace: "nowrap" }}>
            تغيير الفرع
          </motion.button>
          <motion.a href={messengerLink(branch.messenger)} target="_blank" rel="noreferrer"
            whileHover={{ scale: 1.04, boxShadow: "0 6px 20px rgba(0,120,255,0.38)" }} whileTap={{ scale: 0.97 }} transition={SPF}
            style={{ background: "#0078FF", color: "#fff", borderRadius: 9, padding: "7px 15px", textDecoration: "none", fontFamily: "Cairo, sans-serif", fontWeight: 700, fontSize: 13, display: "flex", alignItems: "center", gap: 6, whiteSpace: "nowrap" }}>
            <MessageCircle size={14} /> اطلب الآن
          </motion.a>
        </div>

        {/* Mobile hamburger */}
        <button className="md:hidden" onClick={() => setOpen(!open)}
          style={{ background: "none", border: "none", color: "#F5C842", cursor: "pointer", padding: 4 }}>
          {open ? <X size={22} /> : <MenuIcon size={22} />}
        </button>
      </motion.nav>

      {/* Mobile drawer */}
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }}
            transition={{ ease: EO, duration: 0.2 }}
            style={{ position: "fixed", top: 66, left: 0, right: 0, zIndex: 499, background: "rgba(12,4,0,0.98)", backdropFilter: "blur(16px)", padding: "18px 24px 24px", borderBottom: "1px solid rgba(245,200,66,0.1)", direction: "rtl" }}
          >
            {links.map(l => (
              <a key={l.label} href={l.href} onClick={() => setOpen(false)}
                style={{ display: "block", fontFamily: "Tajawal, sans-serif", fontSize: 17, color: "#F9F3E8", textDecoration: "none", padding: "10px 0", borderBottom: "1px solid rgba(245,200,66,0.07)" }}>
                {l.label}
              </a>
            ))}
            <div style={{ display: "flex", gap: 9, marginTop: 16 }}>
              <button onClick={() => { setOpen(false); onChangeBranch(); }}
                style={{ flex: 1, border: "1px solid rgba(245,200,66,0.45)", color: "#F5C842", background: "rgba(15,5,0,0)", borderRadius: 9, padding: "10px 0", cursor: "pointer", fontFamily: "Tajawal, sans-serif", fontWeight: 600, fontSize: 13, whiteSpace: "nowrap" }}>
                تغيير الفرع
              </button>
              <a href={messengerLink(branch.messenger)} target="_blank" rel="noreferrer" onClick={() => setOpen(false)}
                style={{ flex: 1, background: "#0078FF", color: "#fff", borderRadius: 9, padding: "10px 0", textDecoration: "none", fontFamily: "Cairo, sans-serif", fontWeight: 700, fontSize: 13, display: "flex", alignItems: "center", justifyContent: "center", gap: 6, whiteSpace: "nowrap" }}>
                <MessageCircle size={14} /> اطلب الآن
              </a>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}

// ── Hero ──────────────────────────────────────────────────────────────────────
function Hero({ branch }: { branch: Branch }) {
  const ref = useRef<HTMLElement>(null);
  const { scrollY } = useScroll();
  const bgY = useTransform(scrollY, [0, 600], [0, 150]);
  const txtY = useTransform(scrollY, [0, 600], [0, 38]);
  const pts = Array.from({ length: 5 }, (_, i) => ({ left: `${13 + i * 16}%`, delay: `${i * 0.75}s`, dur: `${3 + i * 0.45}s`, sz: i % 2 ? 5 : 4 }));

  return (
    <section ref={ref} style={{ position: "relative", height: "100vh", minHeight: 560, overflow: "hidden", display: "flex", alignItems: "center", justifyContent: "center" }}>
      <motion.div style={{ position: "absolute", inset: "-8%", backgroundImage: `url(${IMG.g4})`, backgroundSize: "cover", backgroundPosition: "center", animation: "kenBurns 10s ease-in-out infinite alternate", y: bgY }} />
      <div style={{ position: "absolute", inset: 0, background: "rgba(15,5,0,0.72)" }} />
      <div style={{ position: "absolute", bottom: 0, left: 0, right: 0, height: 280, background: "linear-gradient(to top,#0F0500,rgba(15,5,0,0))" }} />
      <div style={{ position: "absolute", bottom: 0, left: 0, right: 0, height: 180, background: "rgba(200,65,10,0.12)", animation: "glowPulse 3s ease-in-out infinite" }} />
      {pts.map((p, i) => <div key={i} style={{ position: "absolute", bottom: "22%", left: p.left, width: p.sz, height: p.sz, borderRadius: "50%", background: "radial-gradient(circle,#F5C842,#C8410A)", boxShadow: "0 0 8px #F5C842", animation: `floatUp ${p.dur} ${p.delay} infinite ease-in-out`, zIndex: 2 }} />)}

      <motion.div style={{ position: "relative", zIndex: 3, textAlign: "center", padding: "0 20px", maxWidth: 800, direction: "rtl", y: txtY }}>
        <motion.div initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ ease: EO, duration: 0.55, delay: 0.2 }}
          style={{ display: "inline-flex", alignItems: "center", gap: 7, border: "1px solid rgba(245,200,66,0.32)", borderRadius: 999, padding: "5px 15px", marginBottom: 22, color: "#F5C842", fontFamily: "Tajawal, sans-serif", fontSize: 12 }}>
          <MapPin size={12} /> {branch.address}
        </motion.div>
        <h1 style={{ fontFamily: "Cairo, sans-serif", fontWeight: 900, lineHeight: 1.15, marginBottom: 10 }}>
          <motion.span initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ ease: EO, duration: 0.55, delay: 0.36 }}
            style={{ display: "block", fontSize: "clamp(40px,7.5vw,76px)", color: "#fff" }}>الطعم الحقيقي</motion.span>
          <motion.span initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ ease: EO, duration: 0.55, delay: 0.58 }}
            style={{ display: "block", fontSize: "clamp(40px,7.5vw,76px)", color: "#F5C842" }}>من الخليج</motion.span>
        </h1>
        <motion.p initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ ease: EO, duration: 0.5, delay: 0.82 }}
          style={{ fontFamily: "Tajawal, sans-serif", fontSize: "clamp(13px,2vw,17px)", color: "rgba(249,243,232,0.78)", lineHeight: 1.78, marginBottom: 36 }}>
          دجاج شواية يمني بالخلطة الخليجية الأصيلة — {branch.name}
        </motion.p>
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ ease: EO, duration: 0.5, delay: 1.0 }}
          style={{ display: "flex", gap: 12, justifyContent: "center", flexWrap: "wrap" }}>
          <motion.a href={messengerLink(branch.messenger)} target="_blank" rel="noreferrer"
            whileHover={{ scale: 1.05, boxShadow: "0 10px 28px rgba(0,120,255,0.4)" }} whileTap={{ scale: 0.97 }} transition={SP}
            style={{ display: "flex", alignItems: "center", gap: 9, background: "#0078FF", color: "#fff", borderRadius: 11, padding: "12px 26px", textDecoration: "none", fontFamily: "Cairo, sans-serif", fontWeight: 700, fontSize: 15, whiteSpace: "nowrap" }}>
            <MessageCircle size={17} /> اطلب عبر ماسنجر
          </motion.a>
          <motion.a href="#menu"
            whileHover={{ scale: 1.04, backgroundColor: "rgba(245,200,66,0.08)" }} whileTap={{ scale: 0.97 }} transition={SP}
            style={{ display: "flex", alignItems: "center", gap: 9, border: "2px solid rgba(245,200,66,0.6)", color: "#F5C842", background: "rgba(15,5,0,0)", borderRadius: 11, padding: "12px 26px", textDecoration: "none", fontFamily: "Cairo, sans-serif", fontWeight: 700, fontSize: 15, whiteSpace: "nowrap" }}>
            <Utensils size={17} /> شاهد المنيو
          </motion.a>
        </motion.div>
      </motion.div>
      <motion.div style={{ position: "absolute", bottom: 26, left: "50%", x: "-50%", zIndex: 4, animation: "bounceArrow 1.6s infinite" }}>
        <ChevronDown size={24} style={{ color: "rgba(245,200,66,0.5)" }} />
      </motion.div>
    </section>
  );
}

// ── Menu Item Card ────────────────────────────────────────────────────────────
function ItemCard({ item, delay }: { item: MenuItem; delay: number; }) {
  const [hov, setHov] = useState(false);
  const { addItem, getItemQuantity, updateQuantity } = useCart();
  const qty = getItemQuantity(item.id);
  const [showSuccess, setShowSuccess] = useState(false);

  const handleAdd = () => {
    addItem(item);
    setShowSuccess(true);
    setTimeout(() => setShowSuccess(false), 900);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 18, scale: 0.97 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: -10, scale: 0.97 }}
      transition={{ ease: EO, duration: 0.35, delay }}
      whileHover={{ y: -5, boxShadow: "0 16px 48px rgba(200,65,10,0.26)" }}
      onHoverStart={() => setHov(true)} onHoverEnd={() => setHov(false)}
      style={{ background: "#1E0C02", border: hov ? "1px solid #F5C842" : "0.5px solid rgba(245,200,66,0.18)", borderRadius: 13, overflow: "hidden", transition: "border-color 0.22s ease", direction: "rtl" }}
    >
      <div style={{ position: "relative", height: 172, overflow: "hidden", background: "#0F0500" }}>
        <motion.img src={item.img} alt={item.name} animate={{ scale: hov ? 1.07 : 1 }} transition={SP}
          style={{ width: "100%", height: "100%", objectFit: "cover" }} />
        <div style={{ position: "absolute", inset: 0, background: "linear-gradient(to bottom,rgba(15,5,0,0) 40%,#1E0C02)" }} />
        {item.badge && <span style={{ position: "absolute", top: 10, right: 10, background: "#C8410A", color: "#fff", fontSize: 10, fontFamily: "Tajawal, sans-serif", fontWeight: 700, padding: "3px 9px", borderRadius: 999 }}>{item.badge}</span>}
      </div>
      <div style={{ padding: "13px 15px 15px" }}>
        <h4 style={{ fontFamily: "Cairo, sans-serif", fontWeight: 700, fontSize: 15, color: "#F9F3E8", marginBottom: 4 }}>{item.name}</h4>
        <p style={{ fontFamily: "Tajawal, sans-serif", fontSize: 11, color: "#A07850", lineHeight: 1.6, marginBottom: 10 }}>{item.desc}</p>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 8 }}>
          <span style={{ fontFamily: "Cairo, sans-serif", fontWeight: 700, fontSize: 16, color: "#D4870A" }}>{item.price}</span>
          {qty > 0 ? (
            <div style={{ display: "flex", alignItems: "center", gap: 2, background: "#0F0500", borderRadius: 9, border: "1px solid rgba(245,200,66,0.15)", padding: 2 }}>
              <motion.button whileTap={{ scale: 0.9 }} transition={SPF}
                onClick={() => updateQuantity(item.id, qty - 1)}
                style={{ width: 28, height: 28, borderRadius: 6, background: "#C8410A", color: "#fff", border: "none", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}>
                <Minus size={11} />
              </motion.button>
              <span style={{ width: 28, textAlign: "center", fontFamily: "Cairo, sans-serif", fontWeight: 700, fontSize: 12, color: "#F9F3E8" }}>{qty}</span>
              <motion.button whileTap={{ scale: 0.9 }} transition={SPF}
                onClick={() => addItem(item)}
                style={{ width: 28, height: 28, borderRadius: 6, background: "#C8410A", color: "#fff", border: "none", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}>
                <Plus size={11} />
              </motion.button>
            </div>
          ) : (
            <motion.button
              whileHover={{ scale: 1.06 }} whileTap={{ scale: 0.95 }} transition={SPF}
              onClick={handleAdd}
              style={{
                display: "flex", alignItems: "center", gap: 5,
                background: showSuccess ? "#1a5c2e" : "#C8410A",
                color: "#fff", border: "none", borderRadius: 8,
                padding: "7px 12px", cursor: "pointer",
                fontFamily: "Tajawal, sans-serif", fontWeight: 700, fontSize: 11,
                whiteSpace: "nowrap",
              }}
            >
              {showSuccess ? <Check size={12} /> : <ShoppingBag size={12} />}
              {showSuccess ? "تمت الإضافة" : "أضف للطلب"}
            </motion.button>
          )}
        </div>
      </div>
    </motion.div>
  );
}

// ── Menu Section ──────────────────────────────────────────────────────────────
function MenuSection({ branch }: { branch: Branch }) {
  const [cat, setCat] = useState(branch.menu[0].id);
  const [sub, setSub] = useState("mix");

  useEffect(() => { setCat(branch.menu[0].id); }, [branch.id]);

  const activeCat = branch.menu.find(c => c.id === cat)!;
  const items: MenuItem[] = activeCat.subcategories
    ? activeCat.subcategories.find(s => s.id === sub)?.items ?? []
    : activeCat.items ?? [];

  return (
    <section id="menu" style={{ padding: "80px 0 64px", background: "#0F0500" }}>
      <div style={{ maxWidth: 1120, margin: "0 auto", padding: "0 clamp(16px,4vw,40px)" }}>
        {/* Title */}
        <motion.div initial={{ opacity: 0, y: 18 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ ease: EO, duration: 0.5 }}
          style={{ textAlign: "center", marginBottom: 38 }}>
          <h2 style={{ fontFamily: "Cairo, sans-serif", fontWeight: 900, fontSize: "clamp(26px,5vw,44px)", color: "#F9F3E8", marginBottom: 8 }}>قائمة الطعام</h2>
          <p style={{ fontFamily: "Tajawal, sans-serif", fontSize: 14, color: "#A07850" }}>{branch.name} — اختار اللي يعجبك</p>
          <div style={{ width: 60, height: 3, background: "linear-gradient(to left,#C8410A,#F5C842)", margin: "12px auto 0", borderRadius: 2 }} />
        </motion.div>

        {/* Category tabs */}
        <div style={{ overflowX: "auto", marginBottom: 18, paddingBottom: 2, direction: "rtl" }} className="scroll-hidden">
          <div style={{ display: "flex", gap: 9, minWidth: "max-content" }}>
            {branch.menu.map(c => {
              const active = cat === c.id;
              return (
                <motion.button key={c.id} onClick={() => setCat(c.id)}
                  whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }} transition={SPF}
                  style={{ display: "flex", alignItems: "center", gap: 7, padding: "9px 20px", background: active ? "#C8410A" : "#1E0C02", border: active ? "1px solid #C8410A" : "0.5px solid rgba(245,200,66,0.2)", borderRadius: 11, cursor: "pointer", fontFamily: "Cairo, sans-serif", fontWeight: 700, fontSize: 14, color: active ? "#fff" : "#A07850", whiteSpace: "nowrap", transition: "background 0.2s,color 0.2s,border-color 0.2s", boxShadow: active ? "0 5px 18px rgba(200,65,10,0.28)" : "none" }}>
                  {c.icon} {c.name}
                </motion.button>
              );
            })}
          </div>
        </div>

        {/* Subcategory pills — only for العصائر */}
        <AnimatePresence>
          {activeCat.subcategories && (
            <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }}
              transition={{ ease: EO, duration: 0.25 }} style={{ overflow: "hidden", marginBottom: 22 }}>
              <div style={{ overflowX: "auto", paddingBottom: 2, direction: "rtl" }} className="scroll-hidden">
                <div style={{ display: "flex", gap: 7, minWidth: "max-content" }}>
                  {activeCat.subcategories.map(s => {
                    const active = sub === s.id;
                    return (
                      <button key={s.id} onClick={() => setSub(s.id)}
                        style={{ padding: "6px 15px", borderRadius: 999, cursor: "pointer", fontFamily: "Tajawal, sans-serif", fontWeight: 600, fontSize: 12, background: active ? "rgba(245,200,66,0.13)" : "rgba(15,5,0,0)", border: active ? "1px solid #F5C842" : "1px solid rgba(245,200,66,0.18)", color: active ? "#F5C842" : "#A07850", whiteSpace: "nowrap", transition: "all 0.18s ease" }}>
                        {s.name}
                      </button>
                    );
                  })}
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Item grid */}
        <AnimatePresence mode="wait">
          <motion.div key={cat + sub} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            transition={{ ease: EO, duration: 0.2 }}
            style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(240px,1fr))", gap: 18 }}>
            {items.map((item, i) => <ItemCard key={item.id} item={item} delay={i * 0.055} />)}
          </motion.div>
        </AnimatePresence>
      </div>
    </section>
  );
}

// ── Branch Info ───────────────────────────────────────────────────────────────
function BranchInfo({ branch }: { branch: Branch }) {
  return (
    <section style={{ padding: "68px clamp(16px,4vw,40px)", background: "#1E0C02", direction: "rtl" }}>
      <div style={{ maxWidth: 1120, margin: "0 auto" }}>
        <motion.h2 initial={{ opacity: 0, y: 16 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ ease: EO, duration: 0.5 }}
          style={{ fontFamily: "Cairo, sans-serif", fontWeight: 900, fontSize: "clamp(22px,4vw,38px)", color: "#F9F3E8", marginBottom: 6, textAlign: "center" }}>
          معلومات الفرع
        </motion.h2>
        <p style={{ textAlign: "center", fontFamily: "Tajawal, sans-serif", color: "#A07850", fontSize: 14, marginBottom: 32 }}>{branch.name}</p>
        <motion.div initial={{ opacity: 0, y: 18 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ ease: EO, duration: 0.48, delay: 0.1 }}
          style={{ background: "#120600", border: "0.5px solid rgba(245,200,66,0.18)", borderRadius: 14, overflow: "hidden" }}>
          <div style={{ height: 3, background: "linear-gradient(to left,#C8410A,#F5C842)" }} />
          <div style={{ padding: "26px", display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(200px,1fr))", gap: 26 }}>
            {/* Address */}
            <div>
              <div style={{ display: "flex", alignItems: "center", gap: 7, marginBottom: 9 }}>
                <MapPin size={15} style={{ color: "#D4870A" }} />
                <span style={{ fontFamily: "Cairo, sans-serif", fontWeight: 700, fontSize: 14, color: "#F5C842" }}>العنوان</span>
              </div>
              <p style={{ fontFamily: "Tajawal, sans-serif", fontSize: 13, color: "#F9F3E8", lineHeight: 1.7, marginBottom: 12 }}>{branch.address}</p>
              <motion.a href={branch.maps} target="_blank" rel="noreferrer"
                whileHover={{ scale: 1.04 }} whileTap={{ scale: 0.97 }} transition={SPF}
                style={{ display: "inline-flex", alignItems: "center", gap: 6, border: "1px solid #D4A017", color: "#D4A017", background: "rgba(15,5,0,0)", borderRadius: 8, padding: "7px 13px", textDecoration: "none", fontFamily: "Tajawal, sans-serif", fontWeight: 600, fontSize: 12, whiteSpace: "nowrap" }}>
                📍 عرض الموقع
              </motion.a>
            </div>
            {/* Phones */}
            <div>
              <div style={{ display: "flex", alignItems: "center", gap: 7, marginBottom: 9 }}>
                <Phone size={15} style={{ color: "#D4870A" }} />
                <span style={{ fontFamily: "Cairo, sans-serif", fontWeight: 700, fontSize: 14, color: "#F5C842" }}>التليفون</span>
              </div>
              {branch.phones.map(p => (
                <a key={p} href={`tel:${p}`} style={{ display: "block", fontFamily: "Tajawal, sans-serif", fontSize: 13, color: "#F9F3E8", textDecoration: "none", marginBottom: 5, direction: "ltr", textAlign: "right" }}>{p}</a>
              ))}
              <motion.a href={messengerLink(branch.messenger)} target="_blank" rel="noreferrer"
                whileHover={{ scale: 1.04, boxShadow: "0 4px 14px rgba(0,120,255,0.3)" }} whileTap={{ scale: 0.97 }} transition={SPF}
                style={{ display: "inline-flex", alignItems: "center", gap: 6, marginTop: 10, background: "#0078FF", color: "#fff", borderRadius: 8, padding: "7px 13px", textDecoration: "none", fontFamily: "Tajawal, sans-serif", fontWeight: 700, fontSize: 12, whiteSpace: "nowrap" }}>
                <MessageCircle size={13} /> ماسنجر
              </motion.a>
            </div>
            {/* Hours */}
            <div>
              <div style={{ display: "flex", alignItems: "center", gap: 7, marginBottom: 9 }}>
                <Clock size={15} style={{ color: "#D4870A" }} />
                <span style={{ fontFamily: "Cairo, sans-serif", fontWeight: 700, fontSize: 14, color: "#F5C842" }}>ساعات العمل</span>
              </div>
              <p style={{ fontFamily: "Tajawal, sans-serif", fontSize: 13, color: "#F9F3E8", lineHeight: 1.7 }}>{branch.hours}</p>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}

// ── All Branches ──────────────────────────────────────────────────────────────
function AllBranches({ currentId, onSwitch }: { currentId: string; onSwitch: (b: Branch) => void }) {
  return (
    <section id="branches" style={{ padding: "clamp(48px,6vw,72px) clamp(16px,4vw,40px)", background: "#0A0300", direction: "rtl" }}>
      <div style={{ maxWidth: 1120, margin: "0 auto" }}>
        <motion.h2 initial={{ opacity: 0, y: 16 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ ease: EO, duration: 0.5 }}
          style={{ fontFamily: "Cairo, sans-serif", fontWeight: 900, fontSize: "clamp(24px,4vw,38px)", color: "#F9F3E8", marginBottom: 6, textAlign: "center" }}>
          فروعنا في القاهرة
        </motion.h2>
        <p style={{ textAlign: "center", fontFamily: "Tajawal, sans-serif", color: "#A07850", fontSize: "clamp(12px,1.5vw,14px)", marginBottom: "clamp(20px,3vw,32px)" }}>اختار أقرب فرع ليك</p>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 md:gap-4">
          {BRANCHES.map((b, i) => {
            const cur = b.id === currentId;
            return (
              <motion.div key={b.id}
                initial={{ opacity: 0, y: 14 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ ease: EO, duration: 0.38, delay: i * 0.07 }}
                whileHover={{ y: -4, boxShadow: cur ? "0 12px 36px rgba(200,65,10,0.24)" : "0 12px 36px rgba(200,65,10,0.12)" }}
                style={{
                  background: cur ? "rgba(200,65,10,0.1)" : "#1E0C02",
                  border: cur ? "1px solid rgba(200,65,10,0.6)" : "0.5px solid rgba(245,200,66,0.17)",
                  borderRadius: 14, overflow: "hidden",
                  transition: "box-shadow 0.3s ease, border-color 0.3s ease",
                  display: "flex", flexDirection: "column",
                }}>
                <div style={{ height: 3, background: cur ? "#C8410A" : "linear-gradient(to left,rgba(245,200,66,0.3),rgba(200,65,10,0.3))", flexShrink: 0 }} />
                <div style={{ padding: "clamp(14px,2vw,20px)", display: "flex", flexDirection: "column", flex: 1 }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
                    <span style={{ fontFamily: "Cairo, sans-serif", fontWeight: 700, fontSize: "clamp(14px,1.5vw,16px)", color: cur ? "#F5C842" : "#F9F3E8" }}>{b.name}</span>
                    {cur && <span style={{ fontSize: 10, background: "#C8410A", color: "#fff", borderRadius: 999, padding: "3px 10px", fontFamily: "Tajawal, sans-serif", fontWeight: 700 }}>الحالي</span>}
                  </div>
                  <div style={{ display: "flex", alignItems: "flex-start", gap: 6, marginBottom: "auto" }}>
                    <MapPin size={12} style={{ color: "#D4870A", flexShrink: 0, marginTop: 3 }} />
                    <p style={{ fontFamily: "Tajawal, sans-serif", fontSize: "clamp(11px,1.2vw,13px)", color: "#A07850", lineHeight: 1.6 }}>{b.address}</p>
                  </div>
                  <div style={{ display: "flex", gap: 8, marginTop: 14 }}>
                    {!cur && (
                      <motion.button whileHover={{ scale: 1.04 }} whileTap={{ scale: 0.96 }} transition={SPF}
                        onClick={() => onSwitch(b)}
                        style={{
                          flex: 1, background: "#C8410A", color: "#fff", border: "none",
                          borderRadius: 9, padding: "clamp(7px,1vw,9px) 0",
                          cursor: "pointer", fontFamily: "Tajawal, sans-serif",
                          fontWeight: 700, fontSize: "clamp(11px,1.2vw,13px)",
                          whiteSpace: "nowrap", boxShadow: "0 3px 10px rgba(200,65,10,0.25)",
                        }}>
                        اختيار الفرع
                      </motion.button>
                    )}
                    <motion.a href={b.maps} target="_blank" rel="noreferrer" whileHover={{ scale: 1.04 }} whileTap={{ scale: 0.96 }} transition={SPF}
                      style={{
                        flex: 1, display: "flex", alignItems: "center", justifyContent: "center", gap: 5,
                        border: "1px solid #D4A017", color: "#D4A017",
                        background: cur ? "rgba(200,65,10,0.05)" : "rgba(15,5,0,0)",
                        borderRadius: 9, padding: "clamp(7px,1vw,9px) 0",
                        textDecoration: "none", fontFamily: "Tajawal, sans-serif",
                        fontWeight: 600, fontSize: "clamp(11px,1.2vw,13px)", whiteSpace: "nowrap",
                      }}>
                      <MapPin size={12} /> الموقع
                    </motion.a>
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>
      </div>
    </section>
  );
}

// ── CTA ───────────────────────────────────────────────────────────────────────
function CTA({ branch }: { branch: Branch }) {
  return (
    <section id="cta" style={{ padding: "90px clamp(16px,4vw,40px)", textAlign: "center", background: "linear-gradient(135deg,#C8410A,#D4870A,#F5C842,#D4870A,#C8410A)", backgroundSize: "300% 300%", animation: "fireGrad 4s ease infinite", direction: "rtl" }}>
      <motion.h2 initial={{ opacity: 0, y: 18 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ ease: EO, duration: 0.5 }}
        style={{ fontFamily: "Cairo, sans-serif", fontWeight: 900, fontSize: "clamp(30px,6vw,58px)", color: "#fff", marginBottom: 12, textShadow: "0 4px 14px rgba(0,0,0,0.22)" }}>
        جاهز تطلب؟
      </motion.h2>
      <motion.p initial={{ opacity: 0 }} whileInView={{ opacity: 1 }} viewport={{ once: true }} transition={{ ease: EO, duration: 0.45, delay: 0.14 }}
        style={{ fontFamily: "Tajawal, sans-serif", fontSize: "clamp(13px,2vw,18px)", color: "rgba(255,255,255,0.9)", marginBottom: 42 }}>
        اطلب دلوقتي وهيوصلك طازج من الشواية 🔥 — {branch.name}
      </motion.p>
      <motion.a href={messengerLink(branch.messenger)} target="_blank" rel="noreferrer"
        initial={{ opacity: 0, scale: 0.93 }} whileInView={{ opacity: 1, scale: 1 }} viewport={{ once: true }} transition={{ ease: EO, duration: 0.42, delay: 0.26 }}
        whileHover={{ scale: 1.06, boxShadow: "0 0 0 12px rgba(0,120,255,0.2),0 14px 40px rgba(0,0,0,0.28)" }} whileTap={{ scale: 0.98 }}
        style={{ display: "inline-flex", alignItems: "center", gap: 12, background: "#0078FF", color: "#fff", borderRadius: 13, padding: "15px 46px", textDecoration: "none", fontFamily: "Cairo, sans-serif", fontWeight: 900, fontSize: "clamp(15px,2.2vw,21px)", boxShadow: "0 0 0 8px rgba(0,120,255,0.16),0 10px 32px rgba(0,0,0,0.22)" }}>
        <MessageCircle size={24} /> اطلب على ماسنجر الآن
      </motion.a>
    </section>
  );
}

// ── Footer ────────────────────────────────────────────────────────────────────
function Footer({ branch }: { branch: Branch }) {
  return (
    <footer style={{ background: "#070100", padding: "50px clamp(16px,4vw,40px) 0", direction: "rtl" }}>
      <div style={{ maxWidth: 1120, margin: "0 auto", display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(190px,1fr))", gap: 36, paddingBottom: 40 }}>
        <div>
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 12 }}>
            <Flame size={18} style={{ color: "#C8410A" }} />
            <span style={{ fontFamily: "Cairo, sans-serif", fontWeight: 900, fontSize: 16, color: "#F5C842" }}>بيت الشواية اليمني</span>
          </div>
          <p style={{ fontFamily: "Tajawal, sans-serif", fontSize: 12, color: "#A07850", lineHeight: 1.85 }}>
            دجاج الشواية 🔥 من الخليج إلى مصر<br />خلطة يمنية أصيلة — ٤ فروع في القاهرة
          </p>
        </div>
        <div>
          <h4 style={{ fontFamily: "Cairo, sans-serif", fontWeight: 700, color: "#F5C842", marginBottom: 12, fontSize: 14 }}>الفرع الحالي</h4>
          <p style={{ fontFamily: "Tajawal, sans-serif", fontSize: 13, color: "#F9F3E8", marginBottom: 4 }}>{branch.name}</p>
          <p style={{ fontFamily: "Tajawal, sans-serif", fontSize: 12, color: "#A07850", lineHeight: 1.6 }}>{branch.address}</p>
          <p style={{ fontFamily: "Tajawal, sans-serif", fontSize: 12, color: "#A07850", marginTop: 5 }}>{branch.hours}</p>
        </div>
        <div>
          <h4 style={{ fontFamily: "Cairo, sans-serif", fontWeight: 700, color: "#F5C842", marginBottom: 12, fontSize: 14 }}>تابعنا</h4>
          <div style={{ display: "flex", gap: 10 }}>
            {[{ icon: <Facebook size={17} />, color: "#1877F2", label: "Facebook" }, { icon: <Instagram size={17} />, color: "#E1306C", label: "Instagram" }, { icon: <MessageCircle size={17} />, color: "#0078FF", label: "Messenger" }].map(({ icon, color, label }) => (
              <motion.a key={label} href="#" aria-label={label}
                whileHover={{ scale: 1.18, color }} whileTap={{ scale: 0.92 }} transition={SPF}
                style={{ width: 38, height: 38, borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", background: "rgba(255,255,255,0.05)", border: "1px solid rgba(245,200,66,0.12)", color: "#A07850", textDecoration: "none" }}>
                {icon}
              </motion.a>
            ))}
          </div>
        </div>
      </div>
      <div style={{ borderTop: "1px solid rgba(245,200,66,0.09)", padding: "16px 0", textAlign: "center" }}>
        <p style={{ fontFamily: "Tajawal, sans-serif", fontSize: 11, color: "#3A1A08" }}>
          © {new Date().getFullYear()} بيت الشواية اليمني — جميع الحقوق محفوظة
        </p>
      </div>
    </footer>
  );
}

// ── Floating WhatsApp ─────────────────────────────────────────────────────────
function FloatingWA({ branch, show }: { branch: Branch; show: boolean }) {
  return (
    <motion.div initial={{ scale: 0, opacity: 0 }} animate={show ? { scale: 1, opacity: 1 } : { scale: 0, opacity: 0 }}
      transition={{ type: "spring", stiffness: 360, damping: 22 }}
      style={{ position: "fixed", bottom: 24, left: 24, zIndex: 600 }}>
      <div style={{ position: "absolute", inset: -5, borderRadius: "50%", background: "rgba(0,120,255,0.2)", animation: "waPulse 2s infinite" }} />
      <div style={{ position: "absolute", inset: -5, borderRadius: "50%", background: "rgba(0,120,255,0.1)", animation: "waPulse 2s 0.5s infinite" }} />
      <motion.a href={messengerLink(branch.messenger)} target="_blank" rel="noreferrer"
        whileHover={{ scale: 1.12, rotate: 6 }} whileTap={{ scale: 0.95 }} transition={SPF}
        style={{ position: "relative", display: "flex", alignItems: "center", justifyContent: "center", width: 56, height: 56, borderRadius: "50%", background: "#0078FF", color: "#fff", textDecoration: "none", boxShadow: "0 7px 26px rgba(0,120,255,0.38)" }}>
        <MessageCircle size={25} />
      </motion.a>
    </motion.div>
  );
}

// ── App ───────────────────────────────────────────────────────────────────────
export default function App() {
  const [branch, setBranch] = useState<Branch | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [firstVisit, setFirstVisit] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [showWA, setShowWA] = useState(false);
  const [showCart, setShowCart] = useState(false);
  const [showCheckout, setShowCheckout] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [customerInfo, setCustomerInfo] = useState<{ name: string; phone: string; address: string; notes: string } | null>(null);

  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      const found = BRANCHES.find(b => b.id === saved);
      if (found) { setBranch(found); }
    } else {
      setFirstVisit(true);
    }
    setShowModal(true);
  }, []);

  useEffect(() => {
    const fn = () => setScrolled(window.scrollY > 52);
    window.addEventListener("scroll", fn, { passive: true });
    return () => window.removeEventListener("scroll", fn);
  }, []);

  useEffect(() => {
    const t = setTimeout(() => setShowWA(true), 3000);
    return () => clearTimeout(t);
  }, []);

  useEffect(() => {
    const anyOpen = showModal || showCart || showCheckout || showConfirm;
    document.body.style.overflow = anyOpen ? "hidden" : "";
    return () => { document.body.style.overflow = ""; };
  }, [showModal, showCart, showCheckout, showConfirm]);

  const selectBranch = (b: Branch) => {
    setBranch(b);
    localStorage.setItem(STORAGE_KEY, b.id);
    setShowModal(false);
    setFirstVisit(false);
  };

  const switchBranch = (b: Branch) => {
    selectBranch(b);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleCheckout = (data: { name: string; phone: string; address: string; notes: string }) => {
    setCustomerInfo(data);
    setShowCart(false);
    setShowCheckout(false);
    setShowConfirm(true);
  };

  const handleOrderDone = () => {
    setShowConfirm(false);
    setCustomerInfo(null);
  };

  return (
    <div style={{ background: "#0F0500", color: "#F9F3E8", overflowX: "hidden" }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Cairo:wght@400;600;700;900&family=Tajawal:wght@400;500;700&display=swap');
        @keyframes kenBurns { 0%{transform:scale(1)} 100%{transform:scale(1.09)} }
        @keyframes floatUp { 0%{transform:translateY(0) translateX(0);opacity:0} 20%{opacity:.7} 80%{opacity:.3} 100%{transform:translateY(-115px) translateX(15px);opacity:0} }
        @keyframes glowPulse { 0%,100%{opacity:.1} 50%{opacity:.26} }
        @keyframes bounceArrow { 0%,100%{transform:translateY(0)} 50%{transform:translateY(8px)} }
        @keyframes waPulse { 0%{transform:scale(1);opacity:.5} 100%{transform:scale(2.3);opacity:0} }
        @keyframes fireGrad { 0%{background-position:0% 50%} 50%{background-position:100% 50%} 100%{background-position:0% 50%} }
        .scroll-hidden{scrollbar-width:none} .scroll-hidden::-webkit-scrollbar{display:none}
        *{box-sizing:border-box}
        .modal-scroll{scrollbar-width:thin;scrollbar-color:rgba(200,65,10,0.4) transparent}
        .modal-scroll::-webkit-scrollbar{width:5px}
        .modal-scroll::-webkit-scrollbar-track{background:transparent}
        .modal-scroll::-webkit-scrollbar-thumb{background:rgba(200,65,10,0.4);border-radius:10px}
        @media(max-width:480px){.branch-btn{font-size:13px!important}}
      `}</style>

      <CartProvider>
        <AnimatePresence>
          {showModal && (
            <BranchSelectorModal
              onSelect={selectBranch}
            />
          )}
        </AnimatePresence>

        <AnimatePresence>
          {branch && (
            <motion.div key={branch.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ ease: EO, duration: 0.4 }}>
              <Navbar branch={branch} scrolled={scrolled} onChangeBranch={() => { setFirstVisit(false); setShowModal(true); }} />
              <Hero branch={branch} />
              <MenuSection branch={branch} />
              <BranchInfo branch={branch} />
              <AllBranches currentId={branch.id} onSwitch={switchBranch} />
              <CTA branch={branch} />
              <Footer branch={branch} />
              <FloatingWA branch={branch} show={showWA} />
              {branch && <FloatingCartButton onClick={() => setShowCart(true)} />}
            </motion.div>
          )}
        </AnimatePresence>

        <CartDrawer
          open={showCart}
          onClose={() => setShowCart(false)}
          onCheckout={() => { setShowCheckout(true); }}
        />

        <CheckoutDialog
          open={showCheckout}
          onClose={() => setShowCheckout(false)}
          onSubmit={handleCheckout}
        />

        {branch && (
          <OrderConfirmation
            open={showConfirm}
            customer={customerInfo}
            messenger={branch.messenger}
            onDone={handleOrderDone}
          />
        )}
      </CartProvider>
    </div>
  );
}
