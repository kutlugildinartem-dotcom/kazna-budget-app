import React, { useState, useEffect, useMemo, useRef } from 'react';
import {
  Plus, X, CreditCard, Wallet, Coins, Target,
  Utensils, Car, Home, Film, HeartPulse, ShoppingBag, Gift, Briefcase,
  MoreHorizontal, Trash2, Landmark, ArrowUpRight, ArrowDownRight,
  List, Gauge, BarChart3, Pencil, Settings, PiggyBank, Check, ShoppingCart, ChevronDown,
  Coffee, Plane, Dumbbell, Fuel, Phone, Music, Book, PawPrint, GraduationCap, Wrench, Tag,
  Calendar, ChevronLeft, ChevronRight, NotebookPen, Percent, Menu, Repeat, PencilLine, Power
} from 'lucide-react';
import {
  ResponsiveContainer, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip,
  BarChart, Bar, Cell
} from 'recharts';
import { Browser } from '@capacitor/browser';

const APP_VERSION = '1.0.0';
const UPDATE_REPO = 'kutlugildinartem-dotcom/kazna-budget-app';

function isVersionNewer(latest, current) {
  const a = latest.split('.').map(Number);
  const b = current.split('.').map(Number);
  for (let i = 0; i < Math.max(a.length, b.length); i++) {
    const x = a[i] || 0, y = b[i] || 0;
    if (x > y) return true;
    if (x < y) return false;
  }
  return false;
}

async function checkForUpdate() {
  try {
    const res = await fetch(`https://api.github.com/repos/${UPDATE_REPO}/releases/latest`);
    if (!res.ok) return null;
    const data = await res.json();
    const latest = (data.tag_name || '').replace(/^v/, '');
    const asset = (data.assets || []).find(a => a.name.endsWith('.apk'));
    if (!latest || !asset || !isVersionNewer(latest, APP_VERSION)) return null;
    return { version: latest, url: asset.browser_download_url };
  } catch {
    return null;
  }
}

async function storageGet(key) {
  try {
    const v = localStorage.getItem(key);
    return v !== null ? { value: v } : null;
  } catch {
    return null;
  }
}

async function storageSet(key, value) {
  try {
    localStorage.setItem(key, value);
    return true;
  } catch {
    return false;
  }
}

const THEME = {
  bg: '#04070f',
  bgGradientTop: '#0a1120',
  surface: '#0e1726',
  surface2: '#131f31',
  border: 'rgba(255,255,255,0.07)',
  borderStrong: 'rgba(255,255,255,0.14)',
  text: '#edf1f8',
  muted: '#7c8aa5',
  mutedDim: '#4d5b74',
  blue: '#3d7fff',
  blueSoft: '#5c93ff',
  cyan: '#22d3ee',
  green: '#34d399',
  red: '#fb7185',
  amber: '#fbbf24',
};

const ACCOUNT_TYPES = {
  card: { label: 'Карта', icon: CreditCard },
  cash: { label: 'Наличные', icon: Wallet },
  crypto: { label: 'Крипта', icon: Coins },
};

const EXPENSE_CATEGORIES = [
  { id: 'food', label: 'Еда', icon: Utensils, color: '#fb7185' },
  { id: 'transport', label: 'Транспорт', icon: Car, color: '#fbbf24' },
  { id: 'housing', label: 'Жильё', icon: Home, color: '#a78bfa' },
  { id: 'fun', label: 'Развлечения', icon: Film, color: '#f472b6' },
  { id: 'health', label: 'Здоровье', icon: HeartPulse, color: '#34d399' },
  { id: 'shopping', label: 'Покупки', icon: ShoppingBag, color: '#38bdf8' },
  { id: 'goal', label: 'Цель', icon: Target, color: '#5c93ff' },
  { id: 'other', label: 'Другое', icon: MoreHorizontal, color: '#7c8aa5' },
];

const INCOME_CATEGORIES = [
  { id: 'salary', label: 'Зарплата', icon: Briefcase, color: '#34d399' },
  { id: 'gift', label: 'Подарок', icon: Gift, color: '#22d3ee' },
  { id: 'freelance', label: 'Фриланс', icon: Landmark, color: '#60a5fa' },
  { id: 'other_income', label: 'Другое', icon: MoreHorizontal, color: '#7c8aa5' },
];

const CURRENCIES = [
  { code: 'RUB', symbol: '₽', label: 'Рубль' },
  { code: 'USD', symbol: '$', label: 'Доллар' },
  { code: 'EUR', symbol: '€', label: 'Евро' },
  { code: 'KZT', symbol: '₸', label: 'Тенге' },
  { code: 'UAH', symbol: '₴', label: 'Гривна' },
  { code: 'CNY', symbol: '¥', label: 'Юань' },
  { code: 'NONE', symbol: '', label: 'Без символа' },
];

const ACCENT_THEMES = [
  {
    id: 'blue', label: 'Синий',
    blue: '#3d7fff', blueSoft: '#5c93ff', cyan: '#22d3ee',
    bg: '#04070f', bgGradientTop: '#0a1120', surface: '#0e1726', surface2: '#131f31',
  },
  {
    id: 'khaki', label: 'Хаки',
    blue: '#2f6e42', blueSoft: '#4c9160', cyan: '#8fd9a8',
    bg: '#050c07', bgGradientTop: '#0a170d', surface: '#0e1e12', surface2: '#142a19',
  },
  {
    id: 'black', label: 'Чёрный',
    blue: '#6b7280', blueSoft: '#9aa4b2', cyan: '#d6dce3',
    bg: '#000000', bgGradientTop: '#0a0a0a', surface: '#0e0e0e', surface2: '#181818',
  },
  {
    id: 'jade', label: 'Нефритовый',
    blue: '#2f9e6e', blueSoft: '#4cba8c', cyan: '#7de8c4',
    bg: '#031412', bgGradientTop: '#06201c', surface: '#0a2622', surface2: '#0f322c',
  },
  {
    id: 'violet', label: 'Фиолетовый',
    blue: '#7c5cff', blueSoft: '#9b81ff', cyan: '#c4b5fd',
    bg: '#0a0714', bgGradientTop: '#150d24', surface: '#1a1130', surface2: '#231a3d',
  },
];

const LIMITABLE_CATEGORIES = EXPENSE_CATEGORIES.filter(c => c.id !== 'goal');
const ALL_CATEGORIES = [...EXPENSE_CATEGORIES, ...INCOME_CATEGORIES];
const findCategory = (id) => ALL_CATEGORIES.find(c => c.id === id) || ALL_CATEGORIES[ALL_CATEGORIES.length - 1];

const ICON_MAP = {
  utensils: Utensils, car: Car, home: Home, film: Film, heart: HeartPulse, shopping: ShoppingBag,
  briefcase: Briefcase, gift: Gift, landmark: Landmark, coffee: Coffee, plane: Plane, dumbbell: Dumbbell,
  fuel: Fuel, phone: Phone, music: Music, book: Book, paw: PawPrint, grad: GraduationCap, wrench: Wrench,
  tag: Tag, target: Target, cart: ShoppingCart, other: MoreHorizontal,
};
const ICON_OPTIONS = Object.entries(ICON_MAP).map(([key, icon]) => ({ key, icon }));
const CATEGORY_PALETTE = ['#fb7185', '#fbbf24', '#a78bfa', '#f472b6', '#34d399', '#38bdf8', '#60a5fa', '#22d3ee'];

const uid = () => (typeof crypto !== 'undefined' && crypto.randomUUID)
  ? crypto.randomUUID()
  : Date.now().toString(36) + Math.random().toString(36).slice(2, 8);

let _currencySymbol = '₽';
const fmt = (n) => {
  const base = new Intl.NumberFormat('ru-RU', { maximumFractionDigits: 2 }).format(n || 0);
  return _currencySymbol ? `${base} ${_currencySymbol}` : base;
};
const todayISO = () => new Date().toISOString().slice(0, 10);
const compactNum = (n) => {
  const abs = Math.abs(n);
  const sign = n < 0 ? '-' : '';
  if (abs >= 1000000) return sign + (abs / 1000000).toFixed(1).replace(/\.0$/, '') + 'M';
  if (abs >= 1000) return sign + (abs / 1000).toFixed(1).replace(/\.0$/, '') + 'k';
  return String(Math.round(n));
};

function daysInMonth(year, monthIdx) {
  return new Date(year, monthIdx + 1, 0).getDate();
}
function advanceMonthDate(dateStr, dayOfMonth) {
  const d = new Date(dateStr + 'T00:00:00');
  d.setMonth(d.getMonth() + 1, 1);
  const dim = daysInMonth(d.getFullYear(), d.getMonth());
  d.setDate(Math.min(dayOfMonth, dim));
  return d.toISOString().slice(0, 10);
}
function computeInitialNextDate(dayOfMonth) {
  const today = new Date();
  const dim = daysInMonth(today.getFullYear(), today.getMonth());
  const day = Math.min(dayOfMonth, dim);
  const candidate = new Date(today.getFullYear(), today.getMonth(), day);
  const todayMidnight = new Date(today.getFullYear(), today.getMonth(), today.getDate());
  if (candidate < todayMidnight) {
    return advanceMonthDate(candidate.toISOString().slice(0, 10), dayOfMonth);
  }
  return candidate.toISOString().slice(0, 10);
}
const STORAGE_KEY = 'budget_app_state_v4';

const TABS = [
  { id: 'home', label: 'Главная', icon: Home },
  { id: 'transactions', label: 'Операции', icon: List },
  { id: 'accounts', label: 'Счета', icon: Wallet },
  { id: 'goals', label: 'Цели', icon: PiggyBank },
  { id: 'limits', label: 'Лимиты', icon: Gauge },
  { id: 'analytics', label: 'Аналитика', icon: BarChart3 },
];

const MENU_ITEMS = [
  { id: 'calendar', label: 'Календарь', icon: Calendar, color: '#5c93ff' },
  { id: 'shopping', label: 'Список покупок', icon: NotebookPen, color: '#22d3ee' },
  { id: 'recurring', label: 'Регулярные платежи', icon: Repeat, color: '#fbbf24' },
  { id: 'categoryManage', label: 'Категории', icon: Tag, color: '#a78bfa' },
];

const ALL_NAV_SECTIONS = [
  ...TABS.filter(t => t.id !== 'home').map(t => ({ ...t, kind: 'tab' })),
  ...MENU_ITEMS.map(m => ({ ...m, kind: 'modal' })),
];
const DEFAULT_BAR_IDS = TABS.filter(t => t.id !== 'home').map(t => t.id);

function getFontStyle() {
  return `
  @import url('https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@500;600;700&family=Inter:wght@400;500;600;700&display=swap');
  .no-scrollbar::-webkit-scrollbar { display: none; }
  .no-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
  input:focus, select:focus { outline: none; border-color: ${THEME.blueSoft} !important; }
  select option { background: ${THEME.surface2}; color: ${THEME.text}; }
  *, *::before, *::after { box-sizing: border-box; }

  @keyframes fadeInUp { from { opacity: 0; transform: translateY(12px); } to { opacity: 1; transform: translateY(0); } }
  @keyframes popupIn { from { opacity: 0; transform: scale(0.86) translateY(10px); } to { opacity: 1; transform: scale(1) translateY(0); } }
  @keyframes sheetUp { from { opacity: 0; transform: translateY(30px); } to { opacity: 1; transform: translateY(0); } }
  @keyframes backdropIn { from { opacity: 0; } to { opacity: 1; } }
  @keyframes fabIn { from { opacity: 0; transform: scale(0.6) translateY(10px); } to { opacity: 1; transform: scale(1) translateY(0); } }
  @keyframes goalGlow {
    0% { box-shadow: 0 0 0 0 rgba(52,211,153,0); background-color: rgba(52,211,153,0); }
    30% { box-shadow: 0 0 0 2px rgba(52,211,153,0.7), 0 0 26px rgba(52,211,153,0.45); background-color: rgba(52,211,153,0.16); }
    100% { box-shadow: 0 0 0 0 rgba(52,211,153,0); background-color: rgba(52,211,153,0); }
  }
  .goal-glow { animation: goalGlow 1.6s ease forwards; }
  @keyframes confettiFall {
    0% { transform: translate(0, 0) rotate(0deg); opacity: 1; }
    100% { transform: translate(var(--dx), var(--dy)) rotate(var(--rot)); opacity: 0.96; }
  }
  @keyframes floaty { 0%, 100% { transform: translateY(0); } 50% { transform: translateY(-3px); } }

  .anim-in { animation: fadeInUp 0.5s cubic-bezier(.22,1,.36,1) both; }
  .popup-in { animation: popupIn 0.36s cubic-bezier(.34,1.56,.64,1) both; }
  .sheet-in { animation: sheetUp 0.38s cubic-bezier(.22,1,.36,1) both; }
  .backdrop-in { animation: backdropIn 0.22s ease both; }
  .fab-in { animation: fabIn 0.4s cubic-bezier(.34,1.56,.64,1) both; }
  .tap-scale { transition: transform 0.15s cubic-bezier(.34,1.56,.64,1), opacity 0.15s ease, box-shadow 0.2s ease; }
  .tap-scale:active { transform: scale(0.92); opacity: 0.92; }
  * { -webkit-tap-highlight-color: transparent; }
`;
}

function getStyles() {
  return {
    appOuter: {
      minHeight: '100vh',
      background: `radial-gradient(ellipse at top, ${THEME.bgGradientTop} 0%, ${THEME.bg} 60%)`,
      display: 'flex', justifyContent: 'center',
      fontFamily: 'Inter, sans-serif',
    },
    phone: {
      width: '100%', maxWidth: 430, height: '100vh', position: 'relative',
      background: THEME.surface, overflow: 'hidden',
      boxShadow: '0 0 60px rgba(0,0,0,0.6)',
    },
    glow: {
      position: 'absolute', top: -80, left: '50%', transform: 'translateX(-50%)',
      width: 320, height: 320, borderRadius: '50%',
      background: `radial-gradient(circle, ${THEME.blue}38 0%, ${THEME.blue}00 70%)`,
      pointerEvents: 'none',
    },
  };
}

const fieldLabel = () => ({ color: THEME.muted, fontSize: 12, fontFamily: 'Inter, sans-serif', marginBottom: 6, display: 'block' });
const inputStyle = () => ({
  width: '100%', boxSizing: 'border-box', background: THEME.surface2, border: `1px solid ${THEME.border}`,
  borderRadius: 12, padding: '11px 12px', color: THEME.text, fontSize: 14, fontFamily: 'Inter, sans-serif',
  transition: 'border-color 0.15s ease',
});
const submitBtn = () => ({
  width: '100%', marginTop: 18, padding: '13px', borderRadius: 14, border: 'none', cursor: 'pointer',
  background: `linear-gradient(135deg, ${THEME.blueSoft}, ${THEME.blue})`, color: '#fff',
  fontFamily: 'Space Grotesk, sans-serif', fontWeight: 600, fontSize: 14,
});

function glassStyle(color, opts = {}) {
  const { strength = 1 } = opts;
  return {
    background: `linear-gradient(155deg, ${color}${Math.round(38 * strength).toString(16).padStart(2, '0')}, ${color}0d)`,
    backdropFilter: 'blur(14px) saturate(180%)',
    WebkitBackdropFilter: 'blur(14px) saturate(180%)',
    border: `1px solid ${color}40`,
    boxShadow: `inset 0 1px 1px rgba(255,255,255,0.28), 0 4px 14px ${color}22`,
  };
}

function GlassIcon({ icon: Icon, color, size = 38, iconSize = 18, radius }) {
  return (
    <div style={{
      width: size, height: size, borderRadius: radius ?? size * 0.34, flexShrink: 0,
      display: 'grid', placeItems: 'center', padding: 0,
      ...glassStyle(color),
    }}>
      <Icon size={iconSize} color={color} strokeWidth={2} style={{ display: 'block' }} />
    </div>
  );
}

export default function BudgetApp() {
  const [accounts, setAccounts] = useState([]);
  const [transactions, setTransactions] = useState([]);
  const [goals, setGoals] = useState([]);
  const [limits, setLimits] = useState({});
  const [customCategories, setCustomCategories] = useState([]);
  const [shoppingItems, setShoppingItems] = useState([]);
  const [recurringPayments, setRecurringPayments] = useState([]);
  const [currency, setCurrency] = useState('₽');
  const [accentId, setAccentId] = useState('blue');
  const [barItemIds, setBarItemIds] = useState(DEFAULT_BAR_IDS);
  const [homeSections, setHomeSections] = useState({ goals: true, transactions: true });
  const [editTxId, setEditTxId] = useState(null);
  const [editAccountId, setEditAccountId] = useState(null);
  const [loaded, setLoaded] = useState(false);
  const [saveError, setSaveError] = useState(false);
  const [updateInfo, setUpdateInfo] = useState(null);
  const [tab, setTab] = useState('home');
  const [modal, setModal] = useState(null);
  const [limitModalCat, setLimitModalCat] = useState(null);
  const [contributeGoalId, setContributeGoalId] = useState(null);
  const [justCompletedId, setJustCompletedId] = useState(null);
  const [strikeId, setStrikeId] = useState(null);
  const [confettiKey, setConfettiKey] = useState(null);
  const prevGoalsRef = useRef({});

  function fireConfetti() {
    setConfettiKey(Date.now() + Math.random());
  }

  _currencySymbol = currency;
  const accent = ACCENT_THEMES.find(a => a.id === accentId) || ACCENT_THEMES[0];
  THEME.blue = accent.blue;
  THEME.blueSoft = accent.blueSoft;
  THEME.cyan = accent.cyan;
  THEME.bg = accent.bg;
  THEME.bgGradientTop = accent.bgGradientTop;
  THEME.surface = accent.surface;
  THEME.surface2 = accent.surface2;
  const styles = getStyles();

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await storageGet(STORAGE_KEY);
        if (!cancelled && res && res.value) {
          const parsed = JSON.parse(res.value);
          setAccounts(parsed.accounts || []);
          setTransactions(parsed.transactions || []);
          setGoals(parsed.goals || []);
          setLimits(parsed.limits || {});
          setCustomCategories(parsed.customCategories || []);
          setShoppingItems(parsed.shoppingItems || []);
          setRecurringPayments(parsed.recurringPayments || []);
          setCurrency(parsed.currency ?? '₽');
          setAccentId(parsed.accentId || 'blue');
          if (parsed.barItemIds) {
            setBarItemIds(parsed.barItemIds);
          } else {
            const legacyHiddenTabs = parsed.hiddenTabs || [];
            setBarItemIds(DEFAULT_BAR_IDS.filter(id => !legacyHiddenTabs.includes(id)));
          }
          setHomeSections(parsed.homeSections || { goals: true, transactions: true });
        }
      } catch (e) { /* nothing saved yet */ }
      if (!cancelled) setLoaded(true);
    })();
    return () => { cancelled = true; };
  }, []);

  useEffect(() => {
    if (!loaded) return;
    checkForUpdate().then(info => { if (info) setUpdateInfo(info); });
  }, [loaded]);

  function openUpdate() {
    if (updateInfo) Browser.open({ url: updateInfo.url });
  }

  useEffect(() => {
    if (!loaded) return;
    (async () => {
      try {
        const res = await storageSet(STORAGE_KEY, JSON.stringify({
          accounts, transactions, goals, limits, customCategories, shoppingItems, recurringPayments,
          currency, accentId, barItemIds, homeSections,
        }));
        setSaveError(!res);
      } catch (e) { setSaveError(true); }
    })();
  }, [accounts, transactions, goals, limits, customCategories, shoppingItems, recurringPayments, currency, accentId, barItemIds, homeSections, loaded]);

  useEffect(() => {
    const prev = prevGoalsRef.current;
    goals.forEach(g => {
      const p = prev[g.id];
      const wasCompleted = p ? (p.target > 0 && p.current >= p.target) : false;
      const isNowCompleted = g.target > 0 && g.current >= g.target;
      if (!wasCompleted && isNowCompleted) {
        setJustCompletedId(g.id);
        fireConfetti();
        const t1 = setTimeout(() => setStrikeId(g.id), 900);
        const t2 = setTimeout(() => { setJustCompletedId(null); setStrikeId(null); }, 1700);
        return () => { clearTimeout(t1); clearTimeout(t2); };
      }
    });
    const map = {};
    goals.forEach(g => { map[g.id] = { current: g.current, target: g.target }; });
    prevGoalsRef.current = map;
  }, [goals]);

  const recurringProcessedRef = useRef(false);
  useEffect(() => {
    if (!loaded || recurringProcessedRef.current) return;
    recurringProcessedRef.current = true;
    const today = todayISO();
    const accDelta = {};
    const newTx = [];
    let changed = false;
    const updated = recurringPayments.map(rp => {
      if (!rp.active) return rp;
      let next = rp.nextDate;
      let guard = 0;
      while (next <= today && guard < 36) {
        newTx.push({
          id: uid(), accountId: rp.accountId, type: 'expense', category: rp.categoryId || 'other',
          amount: rp.amount, note: rp.name, date: next, createdAt: Date.now(), recurringId: rp.id,
        });
        accDelta[rp.accountId] = (accDelta[rp.accountId] || 0) - rp.amount;
        next = advanceMonthDate(next, rp.dayOfMonth);
        changed = true;
        guard++;
      }
      return next === rp.nextDate ? rp : { ...rp, nextDate: next };
    });
    if (changed) {
      setAccounts(prev => prev.map(a => accDelta[a.id] ? { ...a, balance: a.balance + accDelta[a.id] } : a));
      setTransactions(prev => [...prev, ...newTx]);
      setRecurringPayments(updated);
    }
  }, [loaded]);

  const isGoalCompleted = (g) => g.target > 0 && g.current >= g.target;
  const activeGoals = useMemo(() => goals.filter(g => !isGoalCompleted(g) || g.id === justCompletedId), [goals, justCompletedId]);
  const completedGoals = useMemo(() => goals.filter(g => isGoalCompleted(g) && g.id !== justCompletedId), [goals, justCompletedId]);

  const totalBalance = useMemo(() => accounts.reduce((s, a) => s + a.balance, 0), [accounts]);
  const monthKey = todayISO().slice(0, 7);

  const resolvedCustomCategories = useMemo(() => customCategories.map(c => ({
    id: c.id, label: c.label, type: c.type, color: c.color, icon: ICON_MAP[c.iconKey] || Tag,
  })), [customCategories]);
  const customExpenseCategories = useMemo(() => resolvedCustomCategories.filter(c => c.type === 'expense'), [resolvedCustomCategories]);
  const customIncomeCategories = useMemo(() => resolvedCustomCategories.filter(c => c.type === 'income'), [resolvedCustomCategories]);
  const allExpenseCategories = useMemo(() => [...EXPENSE_CATEGORIES.filter(c => c.id !== 'goal'), ...customExpenseCategories], [customExpenseCategories]);
  const allIncomeCategories = useMemo(() => [...INCOME_CATEGORIES, ...customIncomeCategories], [customIncomeCategories]);
  const limitableCategories = useMemo(() => [...LIMITABLE_CATEGORIES, ...customExpenseCategories], [customExpenseCategories]);
  const allCategoriesFull = useMemo(
    () => [...EXPENSE_CATEGORIES, ...INCOME_CATEGORIES, ...resolvedCustomCategories],
    [resolvedCustomCategories]
  );
  const resolveCategory = (id) => allCategoriesFull.find(c => c.id === id) || findCategory(id);

  function addCustomCategory({ label, iconKey, type }) {
    const trimmed = label.trim();
    const pool = type === 'income' ? allIncomeCategories : allExpenseCategories;
    const existing = pool.find(c => c.label.trim().toLowerCase() === trimmed.toLowerCase());
    if (existing) return existing.id;
    const id = 'custom_' + uid();
    const color = CATEGORY_PALETTE[customCategories.length % CATEGORY_PALETTE.length];
    setCustomCategories(prev => [...prev, { id, label: trimmed, iconKey, type, color }]);
    return id;
  }

  const spentByCategory = useMemo(() => {
    const map = {};
    transactions.filter(t => t.type === 'expense' && t.date.slice(0, 7) === monthKey).forEach(t => {
      map[t.category] = (map[t.category] || 0) + t.amount;
    });
    return map;
  }, [transactions, monthKey]);

  const anyOverLimit = useMemo(
    () => Object.entries(limits).some(([catId, lim]) => lim > 0 && (spentByCategory[catId] || 0) > lim),
    [limits, spentByCategory]
  );

  const flowData = useMemo(() => {
    if (transactions.length === 0) return [];
    const sorted = [...transactions].sort((a, b) => a.date.localeCompare(b.date));
    let running = 0;
    return sorted.map(t => {
      running += t.type === 'income' ? t.amount : -t.amount;
      return {
        label: new Date(t.date).toLocaleDateString('ru-RU', { day: 'numeric', month: 'short' }),
        value: Math.round(running * 100) / 100,
      };
    });
  }, [transactions]);

  const categoryData = useMemo(() => {
    const map = {};
    transactions.filter(t => t.type === 'expense').forEach(t => {
      const cat = resolveCategory(t.category);
      if (!map[cat.id]) map[cat.id] = { label: cat.label, value: 0, color: cat.color };
      map[cat.id].value += t.amount;
    });
    return Object.values(map).sort((a, b) => b.value - a.value).slice(0, 6);
  }, [transactions, allCategoriesFull]);

  const groupedTransactions = useMemo(() => {
    const sorted = [...transactions].sort((a, b) => b.date.localeCompare(a.date) || b.createdAt - a.createdAt);
    const groups = [];
    let lastKey = null;
    sorted.forEach(t => {
      if (t.date !== lastKey) { groups.push({ date: t.date, items: [] }); lastKey = t.date; }
      groups[groups.length - 1].items.push(t);
    });
    return groups;
  }, [transactions]);

  function addAccount({ name, type, balance }) {
    setAccounts(prev => [...prev, { id: uid(), name, type, balance: Number(balance) || 0 }]);
  }
  function deleteAccount(id) {
    setAccounts(prev => prev.filter(a => a.id !== id));
    setTransactions(prev => prev.filter(t => t.accountId !== id));
  }
  function addGoal({ name, target, iconKey }) {
    setGoals(prev => [...prev, { id: uid(), name, target: Number(target) || 0, current: 0, iconKey: iconKey || 'target' }]);
  }
  function deleteGoal(id) { setGoals(prev => prev.filter(g => g.id !== id)); }

  function addTransaction({ kind, accountId, category, amount, note, date }) {
    const amt = Number(amount);
    if (!amt || amt <= 0 || !accountId) return;
    setAccounts(prev => prev.map(a => a.id === accountId ? { ...a, balance: a.balance + (kind === 'income' ? amt : -amt) } : a));
    setTransactions(prev => [...prev, {
      id: uid(), accountId, type: kind, category, amount: amt,
      note: note || '', date: date || todayISO(), createdAt: Date.now(),
    }]);
  }

  function deleteTransaction(tx) {
    setTransactions(prev => prev.filter(t => t.id !== tx.id));
    setAccounts(prev => prev.map(a => a.id === tx.accountId ? { ...a, balance: a.balance + (tx.type === 'income' ? -tx.amount : tx.amount) } : a));
    if (tx.goalId) {
      setGoals(prev => prev.map(g => g.id === tx.goalId ? { ...g, current: Math.max(0, g.current - tx.amount) } : g));
    }
  }

  function contributeToGoal({ goalId, accountId, amount }) {
    const amt = Number(amount);
    if (!amt || amt <= 0 || !goalId || !accountId) return;
    const goal = goals.find(g => g.id === goalId);
    setAccounts(prev => prev.map(a => a.id === accountId ? { ...a, balance: a.balance - amt } : a));
    setGoals(prev => prev.map(g => g.id === goalId ? { ...g, current: g.current + amt } : g));
    setTransactions(prev => [...prev, {
      id: uid(), accountId, type: 'expense', category: 'goal', amount: amt,
      note: goal ? `→ ${goal.name}` : '', date: todayISO(), createdAt: Date.now(), goalId,
    }]);
  }

  function splitIncomeAcrossAccounts({ amount, category, pcts }) {
    const total = Number(amount) || 0;
    if (!total) return;
    Object.entries(pcts).forEach(([accId, pctStr]) => {
      const pct = Number(pctStr);
      if (pct > 0) {
        addTransaction({ kind: 'income', accountId: accId, category, amount: Math.round(total * pct / 100), note: 'Разделение дохода', date: todayISO() });
      }
    });
  }

  function addRecurringPayment({ name, amount, accountId, categoryId, dayOfMonth }) {
    const dom = Math.min(31, Math.max(1, Number(dayOfMonth) || 1));
    setRecurringPayments(prev => [...prev, {
      id: uid(), name, amount: Number(amount) || 0, accountId, categoryId: categoryId || null,
      dayOfMonth: dom, nextDate: computeInitialNextDate(dom), active: true,
    }]);
  }
  function updateRecurringPayment(id, patch) {
    setRecurringPayments(prev => prev.map(rp => {
      if (rp.id !== id) return rp;
      const next = { ...rp, ...patch };
      if (patch.dayOfMonth) next.nextDate = computeInitialNextDate(next.dayOfMonth);
      return next;
    }));
  }
  function toggleRecurringActive(id) {
    setRecurringPayments(prev => prev.map(rp => rp.id === id ? { ...rp, active: !rp.active } : rp));
  }
  function deleteRecurringPayment(id) {
    setRecurringPayments(prev => prev.filter(rp => rp.id !== id));
  }

  function updateAccount(id, patch) {
    setAccounts(prev => prev.map(a => a.id === id ? { ...a, ...patch, balance: patch.balance !== undefined ? Number(patch.balance) || 0 : a.balance } : a));
  }

  function updateTransaction(txId, patch) {
    setTransactions(prev => {
      const old = prev.find(t => t.id === txId);
      if (!old) return prev;
      const merged = { ...old, ...patch, amount: Number(patch.amount ?? old.amount) || old.amount };
      // reverse old effect, apply new effect on account balances
      setAccounts(accs => accs.map(a => {
        let bal = a.balance;
        if (a.id === old.accountId) bal += (old.type === 'income' ? -old.amount : old.amount);
        if (a.id === merged.accountId) bal += (merged.type === 'income' ? merged.amount : -merged.amount);
        return bal !== a.balance ? { ...a, balance: bal } : a;
      }));
      return prev.map(t => t.id === txId ? merged : t);
    });
  }

  function renameCustomCategory(id, patch) {
    setCustomCategories(prev => prev.map(c => c.id === id ? { ...c, ...patch } : c));
  }
  function deleteCustomCategory(id) {
    setCustomCategories(prev => prev.filter(c => c.id !== id));
  }

  function setLimit(categoryId, amount) {
    setLimits(prev => ({ ...prev, [categoryId]: amount }));
  }
  function clearLimit(categoryId) {
    setLimits(prev => { const next = { ...prev }; delete next[categoryId]; return next; });
  }

  function addShoppingItem({ name, cost, categoryId, description, urgency }) {
    setShoppingItems(prev => [...prev, {
      id: uid(), name, cost: cost ? Number(cost) : null, categoryId: categoryId || null,
      description: description || '', urgency: urgency || 'normal', done: false,
      accountId: null, completedAt: null, createdAt: Date.now(),
    }]);
  }
  function deleteShoppingItem(id) {
    setShoppingItems(prev => prev.filter(it => it.id !== id));
  }
  function completeShoppingItem({ id, cost, accountId }) {
    const item = shoppingItems.find(it => it.id === id);
    const amt = Number(cost);
    if (!item || !amt || amt <= 0 || !accountId) return;
    addTransaction({ kind: 'expense', accountId, category: item.categoryId || 'other', amount: amt, note: item.name, date: todayISO() });
    setShoppingItems(prev => prev.map(it => it.id === id ? { ...it, done: true, cost: amt, accountId, completedAt: Date.now() } : it));
    fireConfetti();
  }

  function handleFabClick() {
    if (tab === 'accounts') { setModal('account'); return; }
    if (tab === 'goals') { setModal('goal'); return; }
    setModal('choose');
  }

  function handleChooseAction(kind) {
    if (accounts.length === 0) { setModal('account'); return; }
    setModal(kind);
  }

  const homeTab = TABS.find(t => t.id === 'home');
  const visibleTabsForEffect = [homeTab, ...ALL_NAV_SECTIONS.filter(s => s.kind === 'tab' && barItemIds.includes(s.id))];
  useEffect(() => {
    if (loaded && !visibleTabsForEffect.some(t => t.id === tab)) setTab('home');
  }, [barItemIds, loaded]);

  if (!loaded) {
    return (
      <div style={styles.appOuter}>
        <style>{getFontStyle()}</style>
        <div style={{ ...styles.phone, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div style={{ color: THEME.muted, fontFamily: 'Inter, sans-serif' }}>Загрузка…</div>
        </div>
      </div>
    );
  }

  const visibleTabs = [homeTab, ...ALL_NAV_SECTIONS.filter(s => barItemIds.includes(s.id))];
  const activeIndex = Math.max(0, visibleTabs.findIndex(t => t.id === tab));

  return (
    <div style={styles.appOuter}>
      <style>{getFontStyle()}</style>
      <div style={styles.phone}>

        <div className="no-scrollbar" style={{ position: 'absolute', inset: 0, overflowY: 'auto', overflowX: 'hidden', paddingBottom: 150 }}>
          <div style={styles.glow} />

          {tab === 'home' && (
            <div key="home" className="anim-in">
              <div style={{ padding: '26px 20px 4px', textAlign: 'center', position: 'relative' }}>
                <button
                  className="tap-scale"
                  onClick={() => setModal('menu')}
                  style={{
                    position: 'absolute', top: 22, left: 16, width: 38, height: 38, borderRadius: 13, cursor: 'pointer',
                    display: 'grid', placeItems: 'center', ...glassStyle(THEME.muted),
                  }}
                >
                  <Menu size={17} color={THEME.text} />
                </button>
                <button
                  className="tap-scale"
                  onClick={() => setModal('settings')}
                  style={{
                    position: 'absolute', top: 22, right: 16, width: 38, height: 38, borderRadius: 13, cursor: 'pointer',
                    display: 'grid', placeItems: 'center', ...glassStyle(THEME.muted),
                  }}
                >
                  <Settings size={17} color={THEME.text} />
                </button>
                <div style={{ color: THEME.muted, fontSize: 12, fontFamily: 'Inter, sans-serif', letterSpacing: 0.3 }}>Общий баланс</div>
                <div style={{ fontFamily: 'Space Grotesk, sans-serif', fontWeight: 700, fontSize: 30, color: THEME.text, marginTop: 4, letterSpacing: -0.3 }}>
                  {fmt(totalBalance)}
                </div>
                {saveError && (
                  <div style={{ color: THEME.red, fontSize: 12, marginTop: 4, fontFamily: 'Inter, sans-serif' }}>Не удалось сохранить изменения</div>
                )}
              </div>

              {updateInfo && (
                <div
                  className="anim-in tap-scale"
                  onClick={openUpdate}
                  style={{
                    margin: '10px 20px 0', padding: '11px 14px', borderRadius: 14, cursor: 'pointer',
                    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                    background: 'rgba(52,211,153,0.15)', border: '1px solid rgba(52,211,153,0.4)',
                    color: THEME.green, fontSize: 12.5, fontFamily: 'Inter, sans-serif', fontWeight: 600,
                  }}
                >
                  Доступна версия {updateInfo.version} — нажмите, чтобы обновить
                </div>
              )}

              {homeSections.goals && (
                <Section title="Цели" collapsible defaultOpen>
                  <div style={{ padding: '4px 20px 8px' }}>
                    {activeGoals.length === 0 ? (
                      <EmptyRow text="Пока нет целей — добавьте первую" onClick={() => setModal('goal')} />
                    ) : (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                        {activeGoals.map((g, i) => (
                          <GoalWidgetCard
                            key={g.id} goal={g} delay={i * 40} onClick={() => setContributeGoalId(g.id)}
                            justCompleted={g.id === justCompletedId} struck={g.id === strikeId}
                          />
                        ))}
                      </div>
                    )}
                  </div>
                </Section>
              )}

              {homeSections.transactions && transactions.length > 0 && (
                <Section title="Последние операции" collapsible defaultOpen last>
                  <div style={{ padding: '4px 20px 8px' }}>
                    {groupedTransactions[0].items.slice(0, 4).map((t, i) => (
                      <TransactionRow key={t.id} tx={t} category={resolveCategory(t.category)} delay={i * 30} account={accounts.find(a => a.id === t.accountId)} onDelete={() => deleteTransaction(t)} onEdit={t.category === 'goal' ? undefined : () => setEditTxId(t.id)} />
                    ))}
                  </div>
                </Section>
              )}
            </div>
          )}

          {tab === 'transactions' && (
            <div key="transactions" className="anim-in">
              <TabHeader title="Операции" />
              {groupedTransactions.length === 0 ? (
                <EmptyRow text='Пока нет операций — нажмите "+", чтобы добавить' />
              ) : (
                <div style={{ padding: '4px 20px 8px' }}>
                  {groupedTransactions.map(group => (
                    <div key={group.date} style={{ marginBottom: 14 }}>
                      <div style={{ color: THEME.mutedDim, fontSize: 11, fontFamily: 'Inter, sans-serif', textTransform: 'uppercase', letterSpacing: 0.5, margin: '6px 0' }}>
                        {new Date(group.date).toLocaleDateString('ru-RU', { day: 'numeric', month: 'long' })}
                      </div>
                      {group.items.map((t, i) => (
                        <TransactionRow key={t.id} tx={t} category={resolveCategory(t.category)} delay={i * 30} account={accounts.find(a => a.id === t.accountId)} onDelete={() => deleteTransaction(t)} onEdit={t.category === 'goal' ? undefined : () => setEditTxId(t.id)} />
                      ))}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {tab === 'accounts' && (
            <div key="accounts" className="anim-in">
              <TabHeader title="Счета" />
              <AccountsShareBar accounts={accounts} />
              {accounts.length > 1 && (
                <div style={{ padding: '0 20px 8px' }}>
                  <button className="tap-scale" onClick={() => setModal('incomeSplit')} style={{
                    width: '100%', display: 'flex', alignItems: 'center', gap: 10, padding: '11px 14px', borderRadius: 14,
                    cursor: 'pointer', border: `1px solid ${THEME.border}`, background: `linear-gradient(160deg, ${THEME.surface2}, ${THEME.surface})`,
                  }}>
                    <GlassIcon icon={Percent} color={THEME.blueSoft} size={32} iconSize={15} />
                    <span style={{ color: THEME.text, fontFamily: 'Inter, sans-serif', fontWeight: 500, fontSize: 13 }}>Разделить доход по счетам</span>
                  </button>
                </div>
              )}
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12, padding: '4px 20px 8px' }}>
                {accounts.map((a, i) => <AccountCard key={a.id} account={a} delay={i * 40} onDelete={() => deleteAccount(a.id)} onEdit={() => setEditAccountId(a.id)} />)}
                <AddTile label="Новый счёт" full onClick={() => setModal('account')} />
              </div>
            </div>
          )}

          {tab === 'goals' && (
            <div key="goals" className="anim-in">
              <TabHeader title="Цели" subtitle="Копите на что угодно, шаг за шагом" />
              {activeGoals.length === 0 && completedGoals.length === 0 ? (
                <EmptyRow text="Пока нет целей — добавьте первую" onClick={() => setModal('goal')} />
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 10, padding: '4px 20px 8px' }}>
                  {activeGoals.map((g, i) => (
                    <GoalRow
                      key={g.id} goal={g} delay={i * 40}
                      onDelete={() => deleteGoal(g.id)}
                      onContribute={() => setContributeGoalId(g.id)}
                      justCompleted={g.id === justCompletedId} struck={g.id === strikeId}
                    />
                  ))}
                  <AddTile label="Новая цель" full onClick={() => setModal('goal')} />
                </div>
              )}

              {completedGoals.length > 0 && (
                <Section title={`Выполненные цели (${completedGoals.length})`} collapsible defaultOpen={false} last>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 10, padding: '4px 20px 8px' }}>
                    {completedGoals.map((g, i) => (
                      <GoalRow key={g.id} goal={g} delay={i * 30} onDelete={() => deleteGoal(g.id)} completed />
                    ))}
                  </div>
                </Section>
              )}
            </div>
          )}

          {tab === 'limits' && (
            <div key="limits" className="anim-in">
              <TabHeader title="Лимиты по категориям" subtitle={`За ${new Date(monthKey + '-01').toLocaleDateString('ru-RU', { month: 'long' })}`} />
              <div style={{ padding: '0 20px 8px' }}>
                <button className="tap-scale" onClick={() => setModal('salaryAlloc')} style={{
                  width: '100%', display: 'flex', alignItems: 'center', gap: 10, padding: '11px 14px', borderRadius: 14,
                  cursor: 'pointer', border: `1px solid ${THEME.border}`, background: `linear-gradient(160deg, ${THEME.surface2}, ${THEME.surface})`,
                  marginBottom: 4,
                }}>
                  <GlassIcon icon={Percent} color={THEME.blueSoft} size={32} iconSize={15} />
                  <span style={{ color: THEME.text, fontFamily: 'Inter, sans-serif', fontWeight: 500, fontSize: 13 }}>Распределить зарплату по лимитам</span>
                </button>
              </div>
              <div style={{ padding: '4px 20px 8px' }}>
                {limitableCategories.map((cat, i) => (
                  <LimitRow
                    key={cat.id} category={cat} delay={i * 40}
                    spent={spentByCategory[cat.id] || 0}
                    limit={limits[cat.id] || 0}
                    onEdit={() => setLimitModalCat(cat.id)}
                  />
                ))}
                <AddTile label="Новая категория" full onClick={() => setModal('newCategory')} />
              </div>
            </div>
          )}

          {tab === 'analytics' && (
            <div key="analytics" className="anim-in">
              <TabHeader title="Аналитика" />
              {transactions.length === 0 ? (
                <EmptyRow text="Появится, как только будут операции" />
              ) : (
                <div style={{ padding: '4px 20px 8px' }}>
                  <ChartCard title="Динамика операций">
                    <ResponsiveContainer width="100%" height={140}>
                      <LineChart data={flowData} margin={{ top: 8, right: 8, left: -18, bottom: 0 }}>
                        <CartesianGrid stroke={THEME.border} vertical={false} />
                        <XAxis dataKey="label" tick={{ fill: THEME.mutedDim, fontSize: 10 }} axisLine={{ stroke: THEME.border }} tickLine={false} />
                        <YAxis tick={{ fill: THEME.mutedDim, fontSize: 10 }} axisLine={false} tickLine={false} width={46} />
                        <Tooltip contentStyle={{ background: THEME.surface2, border: `1px solid ${THEME.border}`, borderRadius: 10, fontSize: 12 }} labelStyle={{ color: THEME.muted }} itemStyle={{ color: THEME.text }} formatter={(v) => [fmt(v), '']} />
                        <Line type="monotone" dataKey="value" stroke={THEME.blueSoft} strokeWidth={2.5} dot={false} animationDuration={700} animationEasing="ease-out" />
                      </LineChart>
                    </ResponsiveContainer>
                  </ChartCard>

                  {categoryData.length > 0 && (
                    <ChartCard title="Расходы по категориям">
                      <ResponsiveContainer width="100%" height={Math.max(120, categoryData.length * 34)}>
                        <BarChart data={categoryData} layout="vertical" margin={{ top: 0, right: 16, left: 0, bottom: 0 }}>
                          <XAxis type="number" hide />
                          <YAxis dataKey="label" type="category" tick={{ fill: THEME.muted, fontSize: 12 }} axisLine={false} tickLine={false} width={90} />
                          <Tooltip contentStyle={{ background: THEME.surface2, border: `1px solid ${THEME.border}`, borderRadius: 10, fontSize: 12 }} labelStyle={{ color: THEME.muted }} itemStyle={{ color: THEME.text }} cursor={{ fill: 'rgba(255,255,255,0.03)' }} formatter={(v) => [fmt(v), '']} />
                          <Bar dataKey="value" radius={[0, 6, 6, 0]} barSize={14} animationDuration={700} animationEasing="ease-out">
                            {categoryData.map((c, i) => <Cell key={i} fill={c.color} />)}
                          </Bar>
                        </BarChart>
                      </ResponsiveContainer>
                    </ChartCard>
                  )}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Floating action button, above the nav */}
        <button
          className="tap-scale fab-in"
          onClick={handleFabClick}
          style={{
            position: 'absolute', right: 18, bottom: 82, zIndex: 26, width: 56, height: 56, borderRadius: 999,
            border: 'none', cursor: 'pointer', overflow: 'hidden',
            background: `linear-gradient(150deg, ${THEME.blueSoft}, ${THEME.blue})`,
            boxShadow: '0 10px 26px rgba(61,127,255,0.55), inset 0 1px 1px rgba(255,255,255,0.4)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}
        >
          <span style={{
            position: 'absolute', top: -14, left: -10, width: '75%', height: '75%', borderRadius: '50%',
            background: 'radial-gradient(circle, rgba(255,255,255,0.4), rgba(255,255,255,0) 70%)', pointerEvents: 'none',
          }} />
          <Plus size={26} color="#fff" strokeWidth={2.5} />
        </button>

        {/* Bottom glass tab bar */}
        <div style={{
          position: 'absolute', left: 0, right: 0, bottom: 0, zIndex: 25,
          background: `linear-gradient(180deg, ${THEME.surface}66, ${THEME.bg}e0)`,
          backdropFilter: 'blur(22px) saturate(180%)', WebkitBackdropFilter: 'blur(22px) saturate(180%)',
          borderTop: '1px solid rgba(255,255,255,0.08)',
          paddingBottom: 'env(safe-area-inset-bottom)',
        }}>
          <div style={{ position: 'relative', display: 'flex', height: 64 }}>
            <div style={{
              position: 'absolute', top: 9, bottom: 9, left: `calc(${activeIndex} * (100% / ${visibleTabs.length}))`,
              width: `calc(100% / ${visibleTabs.length})`, transition: 'left 0.42s cubic-bezier(.34,1.56,.64,1)',
              display: 'flex', alignItems: 'center', justifyContent: 'center', pointerEvents: 'none', zIndex: 0,
            }}>
              <div style={{ width: 46, height: 46, borderRadius: 15, ...glassStyle(THEME.blueSoft, { strength: 1.3 }) }} />
            </div>
            {visibleTabs.map((t, i) => (
              <NavTab
                key={t.id} icon={t.icon} label={t.label} active={tab === t.id}
                onClick={() => { if (t.kind === 'modal') { setModal(t.id); } else { setTab(t.id); } }}
                badge={t.id === 'limits' && anyOverLimit}
              />
            ))}
          </div>
        </div>

        {modal === 'choose' && (
          <ActionChoiceModal onClose={() => setModal(null)} onChoose={handleChooseAction} />
        )}
        {modal === 'account' && <AccountModal onClose={() => setModal(null)} onSubmit={addAccount} />}
        {modal === 'goal' && <GoalModal onClose={() => setModal(null)} onSubmit={addGoal} />}
        {(modal === 'income' || modal === 'expense') && (
          <TxModal
            kind={modal} accounts={accounts}
            categories={modal === 'income' ? allIncomeCategories : allExpenseCategories}
            onCreateCategory={(data) => addCustomCategory({ ...data, type: modal })}
            onClose={() => setModal(null)}
            onSubmit={(data) => addTransaction({ ...data, kind: modal })}
          />
        )}
        {modal === 'settings' && (
          <SettingsModal
            currency={currency} accentId={accentId} barItemIds={barItemIds} homeSections={homeSections}
            onClose={() => setModal(null)}
            onSave={({ currency: c, accentId: a, homeSections: hs, barItemIds: b }) => {
              setCurrency(c); setAccentId(a); setHomeSections(hs); setBarItemIds(b);
            }}
          />
        )}
        {modal === 'menu' && (
          <MenuModal
            barItemIds={barItemIds}
            onClose={() => setModal(null)}
            onNavigate={(target) => {
              if (TABS.some(t => t.id === target)) {
                setTab(target);
                setModal(null);
              } else {
                setModal(target);
              }
            }}
          />
        )}
        {modal === 'calendar' && (
          <CalendarModal
            transactions={transactions} goals={goals} totalBalance={totalBalance} accounts={accounts}
            resolveCategory={resolveCategory} onClose={() => setModal(null)}
          />
        )}
        {modal === 'shopping' && (
          <ShoppingListModal
            items={shoppingItems} accounts={accounts} categories={allExpenseCategories}
            onAdd={addShoppingItem} onComplete={completeShoppingItem} onDelete={deleteShoppingItem}
            onClose={() => setModal(null)}
          />
        )}
        {modal === 'salaryAlloc' && (
          <SalaryAllocationModal
            categories={limitableCategories} onSetLimit={setLimit} onClose={() => setModal(null)}
          />
        )}
        {modal === 'incomeSplit' && (
          <IncomeSplitModal
            accounts={accounts} categories={allIncomeCategories}
            onSplit={splitIncomeAcrossAccounts} onClose={() => setModal(null)}
          />
        )}
        {modal === 'recurring' && (
          <RecurringPaymentsModal
            payments={recurringPayments} accounts={accounts} categories={allExpenseCategories}
            onAdd={addRecurringPayment} onUpdate={updateRecurringPayment}
            onToggle={toggleRecurringActive} onDelete={deleteRecurringPayment}
            onClose={() => setModal(null)}
          />
        )}
        {modal === 'categoryManage' && (
          <CategoryManageModal
            expenseCategories={allExpenseCategories} incomeCategories={allIncomeCategories}
            customCategories={customCategories}
            onRename={renameCustomCategory} onDelete={deleteCustomCategory}
            onClose={() => setModal(null)}
          />
        )}
        {editAccountId && (
          <EditAccountModal
            account={accounts.find(a => a.id === editAccountId)}
            onClose={() => setEditAccountId(null)}
            onSave={(patch) => updateAccount(editAccountId, patch)}
          />
        )}
        {editTxId && (
          <EditTransactionModal
            tx={transactions.find(t => t.id === editTxId)}
            accounts={accounts}
            categories={transactions.find(t => t.id === editTxId)?.type === 'income' ? allIncomeCategories : allExpenseCategories}
            onClose={() => setEditTxId(null)}
            onSave={(patch) => updateTransaction(editTxId, patch)}
          />
        )}
        {modal === 'newCategory' && (
          <NewCategoryModal
            onClose={() => setModal(null)}
            onSubmit={({ label, iconKey }) => {
              const id = addCustomCategory({ label, iconKey, type: 'expense' });
              setModal(null);
              setLimitModalCat(id);
            }}
          />
        )}
        {limitModalCat && (
          <LimitModal
            category={resolveCategory(limitModalCat)}
            currentLimit={limits[limitModalCat] || 0}
            accounts={accounts}
            onClose={() => setLimitModalCat(null)}
            onSave={(amt) => setLimit(limitModalCat, amt)}
            onClear={() => clearLimit(limitModalCat)}
          />
        )}
        {contributeGoalId && (
          <ContributeModal
            goals={goals} accounts={accounts} initialGoalId={contributeGoalId}
            onClose={() => setContributeGoalId(null)}
            onSubmit={contributeToGoal}
          />
        )}
        {confettiKey && <ConfettiBurst key={confettiKey} onDone={() => setConfettiKey(null)} />}
      </div>
    </div>
  );
}

function TabHeader({ title, subtitle }) {
  return (
    <div style={{ padding: '24px 20px 8px' }}>
      <div style={{ color: THEME.text, fontFamily: 'Space Grotesk, sans-serif', fontWeight: 700, fontSize: 20 }}>{title}</div>
      {subtitle && <div style={{ color: THEME.mutedDim, fontSize: 12, fontFamily: 'Inter, sans-serif', marginTop: 2 }}>{subtitle}</div>}
    </div>
  );
}

function QuickStat({ icon: Icon, color, label, value, onClick }) {
  return (
    <button className="tap-scale" onClick={onClick} style={{
      flex: 1, display: 'flex', alignItems: 'center', gap: 10, padding: '12px 14px', borderRadius: 16,
      cursor: 'pointer', textAlign: 'left', background: `linear-gradient(160deg, ${THEME.surface2}, ${THEME.surface})`,
      border: `1px solid ${THEME.border}`,
    }}>
      <GlassIcon icon={Icon} color={color} size={36} iconSize={17} />
      <div>
        <div style={{ color: THEME.text, fontFamily: 'Space Grotesk, sans-serif', fontWeight: 700, fontSize: 16 }}>{value}</div>
        <div style={{ color: THEME.muted, fontSize: 11, fontFamily: 'Inter, sans-serif' }}>{label}</div>
      </div>
    </button>
  );
}

function GoalWidgetCard({ goal, onClick, delay = 0, justCompleted, struck }) {
  const pct = goal.target > 0 ? Math.min(100, (goal.current / goal.target) * 100) : 0;
  const grayed = struck;
  const GoalIcon = ICON_MAP[goal.iconKey] || Target;
  return (
    <button
      className={`anim-in tap-scale${justCompleted ? ' goal-glow' : ''}`}
      onClick={onClick}
      style={{
        display: 'block', width: '100%', textAlign: 'left', cursor: 'pointer', border: `1px solid ${THEME.border}`,
        borderRadius: 16, padding: 14, animationDelay: `${delay}ms`,
        background: `linear-gradient(160deg, ${THEME.surface2}, ${THEME.surface})`,
        opacity: grayed ? 0.6 : 1, transition: 'opacity 0.7s ease',
      }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, minWidth: 0 }}>
          <GlassIcon icon={grayed ? Check : GoalIcon} color={grayed ? THEME.mutedDim : THEME.cyan} size={34} iconSize={15} />
          <span style={{
            color: grayed ? THEME.mutedDim : THEME.text, fontFamily: 'Inter, sans-serif', fontWeight: 600, fontSize: 13.5,
            overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
            textDecoration: grayed ? 'line-through' : 'none', transition: 'color 0.7s ease',
          }}>{goal.name}</span>
        </div>
        <span style={{ color: THEME.muted, fontSize: 12, fontFamily: 'Inter, sans-serif', flexShrink: 0, marginLeft: 8 }}>{Math.round(pct)}%</span>
      </div>
      <div style={{ height: 8, borderRadius: 999, background: THEME.border, overflow: 'hidden' }}>
        <div style={{ height: '100%', width: `${pct}%`, borderRadius: 999, background: grayed ? THEME.mutedDim : `linear-gradient(90deg, ${THEME.blueSoft}, ${THEME.cyan})`, transition: 'width 0.6s cubic-bezier(.22,1,.36,1), background 0.7s ease' }} />
      </div>
      <div style={{ marginTop: 7, color: THEME.muted, fontSize: 11.5, fontFamily: 'Inter, sans-serif' }}>{fmt(goal.current)} / {fmt(goal.target)}</div>
    </button>
  );
}

function ShoppingListModal({ items, accounts, categories, onAdd, onComplete, onDelete, onClose }) {
  const [view, setView] = useState('list');
  const [completingId, setCompletingId] = useState(null);

  const urgent = items.filter(it => !it.done && it.urgency === 'urgent');
  const normal = items.filter(it => !it.done && it.urgency === 'normal');
  const done = items.filter(it => it.done).sort((a, b) => (b.completedAt || 0) - (a.completedAt || 0));

  if (view === 'add') {
    return (
      <ModalShell title="Новая покупка" onClose={onClose}>
        <BackLink onClick={() => setView('list')} />
        <ShoppingItemForm
          categories={categories}
          onSubmit={(data) => { onAdd(data); setView('list'); }}
        />
      </ModalShell>
    );
  }

  if (view === 'complete') {
    const item = items.find(it => it.id === completingId);
    if (!item) { setView('list'); return null; }
    return (
      <ModalShell title="Покупка завершена?" onClose={onClose}>
        <BackLink onClick={() => setView('list')} />
        <CompletePurchaseForm
          item={item} accounts={accounts}
          onSubmit={(data) => { onComplete({ id: item.id, ...data }); setView('list'); }}
        />
      </ModalShell>
    );
  }

  return (
    <ModalShell title="Список покупок" onClose={onClose}>
      <AddTile label="Добавить покупку" full onClick={() => setView('add')} />

      <div style={{ marginTop: 16 }}>
        <ShoppingGroup
          title="Срочные" items={urgent} categories={categories} accentColor={THEME.red}
          onBuy={(id) => { setCompletingId(id); setView('complete'); }}
          onDelete={onDelete}
        />
        <ShoppingGroup
          title="Не срочные" items={normal} categories={categories} accentColor={THEME.blueSoft}
          onBuy={(id) => { setCompletingId(id); setView('complete'); }}
          onDelete={onDelete}
        />
        {done.length > 0 && (
          <CollapsibleBlock title={`Уже куплено (${done.length})`} defaultOpen>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {done.map((it, i) => (
                <PurchasedRow key={it.id} item={it} accounts={accounts} categories={categories} delay={i * 30} onDelete={() => onDelete(it.id)} />
              ))}
            </div>
          </CollapsibleBlock>
        )}
        {items.length === 0 && <EmptyRow text="Список пуст — добавьте первую покупку" />}
      </div>
    </ModalShell>
  );
}

function BackLink({ onClick }) {
  return (
    <button
      className="tap-scale" onClick={onClick} type="button"
      style={{ background: 'none', border: 'none', cursor: 'pointer', color: THEME.blueSoft, display: 'flex', alignItems: 'center', gap: 4, fontSize: 13, fontFamily: 'Inter, sans-serif', marginBottom: 14, padding: 0 }}
    >
      <ChevronLeft size={16} /> К списку
    </button>
  );
}

function CollapsibleBlock({ title, children, defaultOpen = true }) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div style={{ marginBottom: 16 }}>
      <button
        className="tap-scale" onClick={() => setOpen(v => !v)} type="button"
        style={{ background: 'none', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%', padding: '0 0 8px' }}
      >
        <span style={{ color: THEME.muted, fontSize: 12.5, fontFamily: 'Inter, sans-serif', fontWeight: 600 }}>{title}</span>
        <ChevronDown size={15} color={THEME.mutedDim} style={{ transform: open ? 'rotate(0deg)' : 'rotate(-90deg)', transition: 'transform 0.3s cubic-bezier(.34,1.56,.64,1)' }} />
      </button>
      <div style={{ display: 'grid', gridTemplateRows: open ? '1fr' : '0fr', transition: 'grid-template-rows 0.35s cubic-bezier(.22,1,.36,1)' }}>
        <div style={{ overflow: 'hidden', minHeight: 0 }}>{children}</div>
      </div>
    </div>
  );
}

function ShoppingGroup({ title, items, categories, accentColor, onBuy, onDelete }) {
  if (items.length === 0) return null;
  return (
    <CollapsibleBlock title={`${title} (${items.length})`}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        {items.map((it, i) => (
          <ShoppingItemCard key={it.id} item={it} categories={categories} accentColor={accentColor} delay={i * 30} onBuy={() => onBuy(it.id)} onDelete={() => onDelete(it.id)} />
        ))}
      </div>
    </CollapsibleBlock>
  );
}

function ShoppingItemCard({ item, categories, accentColor, delay = 0, onBuy, onDelete }) {
  const [confirming, setConfirming] = useState(false);
  const cat = item.categoryId ? categories.find(c => c.id === item.categoryId) : null;
  const Icon = cat ? cat.icon : ShoppingCart;
  return (
    <div className="anim-in" style={{
      display: 'flex', alignItems: 'center', gap: 12, padding: 12, borderRadius: 16, animationDelay: `${delay}ms`,
      background: `linear-gradient(160deg, ${THEME.surface2}, ${THEME.surface})`, border: `1px solid ${THEME.border}`,
    }}>
      <button className="tap-scale" onClick={onBuy} type="button" style={{ background: 'none', border: 'none', padding: 0, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 12, flex: 1, minWidth: 0, textAlign: 'left' }}>
        <GlassIcon icon={Icon} color={cat ? cat.color : accentColor} size={38} iconSize={17} />
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ color: THEME.text, fontSize: 13.5, fontFamily: 'Inter, sans-serif', fontWeight: 500, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{item.name}</div>
          <div style={{ color: THEME.mutedDim, fontSize: 11.5, fontFamily: 'Inter, sans-serif', marginTop: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {item.description || (item.cost ? fmt(item.cost) : 'Цена не указана')}
          </div>
        </div>
        {item.cost != null && (
          <div style={{ color: THEME.text, fontFamily: 'Space Grotesk, sans-serif', fontWeight: 600, fontSize: 13, whiteSpace: 'nowrap', flexShrink: 0 }}>{fmt(item.cost)}</div>
        )}
      </button>
      <button
        className="tap-scale"
        onClick={() => confirming ? onDelete() : setConfirming(true)}
        onBlur={() => setConfirming(false)}
        style={{ background: 'none', border: 'none', cursor: 'pointer', color: confirming ? THEME.red : THEME.mutedDim, padding: 2, flexShrink: 0 }}
      >
        <Trash2 size={14} />
      </button>
    </div>
  );
}

function PurchasedRow({ item, accounts, categories, delay = 0, onDelete }) {
  const [confirming, setConfirming] = useState(false);
  const cat = item.categoryId ? categories.find(c => c.id === item.categoryId) : null;
  const Icon = cat ? cat.icon : ShoppingCart;
  const account = accounts.find(a => a.id === item.accountId);
  return (
    <div className="anim-in" style={{
      display: 'flex', alignItems: 'center', gap: 12, padding: 12, borderRadius: 16, animationDelay: `${delay}ms`,
      background: `linear-gradient(160deg, ${THEME.surface2}, ${THEME.surface})`, border: `1px solid ${THEME.border}`, opacity: 0.6,
    }}>
      <GlassIcon icon={Check} color={THEME.mutedDim} size={38} iconSize={17} />
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ color: THEME.mutedDim, fontSize: 13.5, fontFamily: 'Inter, sans-serif', fontWeight: 500, textDecoration: 'line-through', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{item.name}</div>
        <div style={{ color: THEME.mutedDim, fontSize: 11.5, fontFamily: 'Inter, sans-serif', marginTop: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
          {account ? account.name : 'Счёт удалён'}
        </div>
      </div>
      <div style={{ color: THEME.mutedDim, fontFamily: 'Space Grotesk, sans-serif', fontWeight: 600, fontSize: 13, whiteSpace: 'nowrap' }}>{fmt(item.cost)}</div>
      <button
        className="tap-scale"
        onClick={() => confirming ? onDelete() : setConfirming(true)}
        onBlur={() => setConfirming(false)}
        style={{ background: 'none', border: 'none', cursor: 'pointer', color: confirming ? THEME.red : THEME.mutedDim, padding: 2, flexShrink: 0 }}
      >
        <Trash2 size={13} />
      </button>
    </div>
  );
}

function ShoppingItemForm({ categories, onSubmit }) {
  const [name, setName] = useState('');
  const [cost, setCost] = useState('');
  const [categoryId, setCategoryId] = useState('');
  const [description, setDescription] = useState('');
  const [urgency, setUrgency] = useState('normal');

  const submit = () => {
    if (!name.trim()) return;
    onSubmit({ name: name.trim(), cost: cost || null, categoryId: categoryId || null, description: description.trim(), urgency });
  };

  return (
    <div>
      <label style={fieldLabel()}>Название</label>
      <input style={inputStyle()} value={name} onChange={e => setName(e.target.value)} placeholder="Например, Наушники" />

      <label style={{ ...fieldLabel(), marginTop: 14 }}>Стоимость (необязательно)</label>
      <input style={inputStyle()} type="number" inputMode="decimal" value={cost} onChange={e => setCost(e.target.value)} placeholder="0" />

      <label style={{ ...fieldLabel(), marginTop: 14 }}>Срочность</label>
      <div style={{ display: 'flex', gap: 8 }}>
        {[{ id: 'urgent', label: 'Срочно', color: THEME.red }, { id: 'normal', label: 'Не срочно', color: THEME.blueSoft }].map(u => {
          const active = urgency === u.id;
          return (
            <button key={u.id} className="tap-scale" type="button" onClick={() => setUrgency(u.id)} style={{
              flex: 1, padding: '10px 0', borderRadius: 12, cursor: 'pointer',
              border: `1px solid ${active ? u.color : THEME.border}`,
              background: active ? `${u.color}22` : THEME.surface2,
              color: active ? THEME.text : THEME.muted, fontSize: 13, fontFamily: 'Inter, sans-serif', fontWeight: 500,
            }}>
              {u.label}
            </button>
          );
        })}
      </div>

      <label style={{ ...fieldLabel(), marginTop: 14 }}>Категория (необязательно)</label>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
        <button className="tap-scale" type="button" onClick={() => setCategoryId('')} style={{
          padding: '7px 12px', borderRadius: 999, cursor: 'pointer',
          border: `1px solid ${!categoryId ? THEME.blueSoft : THEME.border}`,
          background: !categoryId ? 'rgba(61,127,255,0.15)' : THEME.surface2,
          color: !categoryId ? THEME.text : THEME.muted, fontSize: 12.5, fontFamily: 'Inter, sans-serif',
        }}>Без категории</button>
        {categories.map(c => {
          const active = categoryId === c.id;
          const Icon = c.icon;
          return (
            <button key={c.id} className="tap-scale" type="button" onClick={() => setCategoryId(c.id)} style={{
              padding: '7px 12px', borderRadius: 999, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6,
              border: `1px solid ${active ? c.color : THEME.border}`,
              background: active ? `${c.color}22` : THEME.surface2,
              color: active ? THEME.text : THEME.muted, fontSize: 12.5, fontFamily: 'Inter, sans-serif',
            }}>
              <Icon size={13} color={c.color} /> {c.label}
            </button>
          );
        })}
      </div>

      <label style={{ ...fieldLabel(), marginTop: 14 }}>Описание (необязательно)</label>
      <input style={inputStyle()} value={description} onChange={e => setDescription(e.target.value)} placeholder="Комментарий, детали" />

      <button className="tap-scale" style={submitBtn()} onClick={submit} type="button">Добавить в список</button>
    </div>
  );
}

function CompletePurchaseForm({ item, accounts, onSubmit }) {
  const [cost, setCost] = useState(item.cost != null ? String(item.cost) : '');
  const [accountId, setAccountId] = useState(accounts[0]?.id || '');

  const submit = () => { if (!Number(cost) || !accountId) return; onSubmit({ cost, accountId }); };

  if (accounts.length === 0) {
    return <div style={{ color: THEME.muted, fontSize: 13, fontFamily: 'Inter, sans-serif' }}>Сначала добавьте хотя бы один счёт.</div>;
  }

  return (
    <div>
      <div style={{ color: THEME.text, fontFamily: 'Space Grotesk, sans-serif', fontWeight: 700, fontSize: 16, marginBottom: 2 }}>{item.name}</div>
      {item.description && <div style={{ color: THEME.muted, fontSize: 12.5, fontFamily: 'Inter, sans-serif', marginBottom: 14 }}>{item.description}</div>}

      <label style={{ ...fieldLabel(), marginTop: item.description ? 0 : 14 }}>Итоговая стоимость</label>
      <input style={inputStyle()} type="number" inputMode="decimal" value={cost} onChange={e => setCost(e.target.value)} placeholder="0" />

      <label style={{ ...fieldLabel(), marginTop: 14 }}>Списать со счёта</label>
      <select style={inputStyle()} value={accountId} onChange={e => setAccountId(e.target.value)}>
        {accounts.map(a => <option key={a.id} value={a.id}>{a.name}</option>)}
      </select>

      <button className="tap-scale" style={submitBtn()} onClick={submit} type="button">Отметить купленным</button>
    </div>
  );
}
function NavTab({ icon: Icon, label, active, onClick, badge }) {
  return (
    <button onClick={onClick} style={{
      background: 'none', border: 'none', cursor: 'pointer', display: 'flex', flexDirection: 'column',
      alignItems: 'center', justifyContent: 'center', gap: 3, color: active ? '#fff' : THEME.mutedDim,
      flex: 1, minWidth: 0, height: '100%', position: 'relative', zIndex: 1, padding: 0, margin: 0,
      transition: 'color 0.25s ease',
    }}>
      <div style={{
        position: 'relative', width: 26, height: 26, flexShrink: 0, display: 'grid', placeItems: 'center',
        transform: active ? 'scale(1.1)' : 'scale(1)', transition: 'transform 0.35s cubic-bezier(.34,1.56,.64,1)',
      }}>
        <Icon size={21} strokeWidth={active ? 2.3 : 1.9} style={{ display: 'block' }} />
        {badge && <span style={{ position: 'absolute', top: -2, right: -3, width: 7, height: 7, borderRadius: 999, background: THEME.red, boxShadow: `0 0 0 2px ${THEME.surface}` }} />}
      </div>
      <span style={{
        display: 'block', width: '100%', textAlign: 'center', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
        fontSize: 9.5, fontFamily: 'Inter, sans-serif', fontWeight: active ? 600 : 400,
        height: 12, lineHeight: '12px', opacity: active ? 1 : 0,
        transition: 'opacity 0.25s ease',
      }}>{label}</span>
    </button>
  );
}

function Section({ title, children, last, collapsible = false, defaultOpen = true }) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div style={{ marginTop: 18, marginBottom: last ? 0 : 4 }}>
      <div style={{ padding: '0 20px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ color: THEME.text, fontFamily: 'Space Grotesk, sans-serif', fontWeight: 600, fontSize: 15, letterSpacing: 0.2 }}>
          {title}
        </div>
        {collapsible && (
          <button
            className="tap-scale"
            onClick={() => setOpen(v => !v)}
            style={{
              background: 'none', border: 'none', cursor: 'pointer', color: THEME.mutedDim,
              padding: 4, display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}
          >
            <ChevronDown size={17} style={{ transform: open ? 'rotate(0deg)' : 'rotate(-90deg)', transition: 'transform 0.3s cubic-bezier(.34,1.56,.64,1)' }} />
          </button>
        )}
      </div>
      <div style={{ display: 'grid', gridTemplateRows: open ? '1fr' : '0fr', transition: 'grid-template-rows 0.38s cubic-bezier(.22,1,.36,1)' }}>
        <div style={{ overflow: 'hidden', minHeight: 0 }}>
          {children}
        </div>
      </div>
    </div>
  );
}

const SHARE_PALETTE = ['#5c93ff', '#22d3ee', '#f472b6', '#fbbf24', '#a78bfa', '#34d399', '#fb7185', '#60a5fa'];

function AccountsShareBar({ accounts }) {
  const total = accounts.reduce((s, a) => s + Math.max(0, a.balance), 0);
  if (accounts.length === 0 || total <= 0) return null;
  const segments = accounts.map((a, i) => ({
    id: a.id, name: a.name,
    pct: (Math.max(0, a.balance) / total) * 100,
    color: SHARE_PALETTE[i % SHARE_PALETTE.length],
  }));
  return (
    <div className="anim-in" style={{ padding: '0 20px 16px' }}>
      <div style={{ color: THEME.mutedDim, fontSize: 11.5, fontFamily: 'Inter, sans-serif', marginBottom: 8 }}>Доля каждого счёта в общем балансе</div>
      <div style={{ display: 'flex', height: 14, borderRadius: 999, overflow: 'hidden', border: `1px solid ${THEME.border}` }}>
        {segments.map(s => (
          <div key={s.id} style={{ width: `${s.pct}%`, background: s.color, transition: 'width 0.6s cubic-bezier(.22,1,.36,1)' }} />
        ))}
      </div>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 12, marginTop: 10 }}>
        {segments.map(s => (
          <div key={s.id} style={{ display: 'flex', alignItems: 'center', gap: 6, maxWidth: '100%' }}>
            <span style={{ width: 8, height: 8, borderRadius: 999, background: s.color, flexShrink: 0 }} />
            <span style={{ color: THEME.muted, fontSize: 11.5, fontFamily: 'Inter, sans-serif', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {s.name} · {Math.round(s.pct)}%
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

function AccountCard({ account, onDelete, onEdit, delay = 0 }) {
  const meta = ACCOUNT_TYPES[account.type];
  const [confirming, setConfirming] = useState(false);
  return (
    <div className="anim-in" style={{
      display: 'flex', alignItems: 'center', gap: 14, borderRadius: 18, padding: 16, animationDelay: `${delay}ms`,
      background: `linear-gradient(160deg, ${THEME.surface2}, ${THEME.surface})`,
      border: `1px solid ${THEME.border}`,
    }}>
      <GlassIcon icon={meta.icon} color={THEME.blueSoft} size={48} iconSize={21} />
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ color: THEME.muted, fontSize: 11.5, fontFamily: 'Inter, sans-serif' }}>{meta.label}</div>
        <div style={{ color: THEME.text, fontFamily: 'Space Grotesk, sans-serif', fontWeight: 600, fontSize: 15, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{account.name}</div>
      </div>
      <div style={{ textAlign: 'right' }}>
        <div style={{ color: THEME.text, fontFamily: 'Space Grotesk, sans-serif', fontWeight: 700, fontSize: 17 }}>{fmt(account.balance)}</div>
      </div>
      <button className="tap-scale" onClick={onEdit} style={{ background: 'none', border: 'none', cursor: 'pointer', color: THEME.mutedDim, padding: 4 }}>
        <PencilLine size={15} />
      </button>
      <button
        className="tap-scale"
        onClick={() => confirming ? onDelete() : setConfirming(true)}
        onBlur={() => setConfirming(false)}
        style={{ background: 'none', border: 'none', cursor: 'pointer', color: confirming ? THEME.red : THEME.mutedDim, padding: 4 }}
      >
        <Trash2 size={15} />
      </button>
    </div>
  );
}

function AddTile({ label, onClick, full }) {
  return (
    <button className="tap-scale" onClick={onClick} style={{
      minWidth: full ? '100%' : 110, height: full ? 54 : 'auto', minHeight: full ? 54 : 148, flexShrink: 0,
      borderRadius: 18, border: `1.5px dashed ${THEME.borderStrong}`, background: 'transparent',
      color: THEME.muted, display: 'flex', flexDirection: full ? 'row' : 'column', alignItems: 'center', justifyContent: 'center', gap: 6,
      cursor: 'pointer', fontFamily: 'Inter, sans-serif', fontSize: 13,
    }}>
      <Plus size={16} />{label}
    </button>
  );
}

function EmptyRow({ text, onClick }) {
  return (
    <div onClick={onClick} className="anim-in tap-scale" style={{
      margin: '4px 20px 12px', padding: '18px 16px', borderRadius: 16,
      border: `1px dashed ${THEME.border}`, color: THEME.mutedDim, fontSize: 13,
      fontFamily: 'Inter, sans-serif', textAlign: 'center', cursor: onClick ? 'pointer' : 'default',
    }}>
      {text}
    </div>
  );
}

function GoalRow({ goal, onDelete, onContribute, delay = 0, justCompleted, struck, completed }) {
  const [confirming, setConfirming] = useState(false);
  const pct = goal.target > 0 ? Math.min(100, (goal.current / goal.target) * 100) : 0;
  const r = 26, c = 2 * Math.PI * r;
  const offset = c - (pct / 100) * c;
  const gradId = `goal-grad-${goal.id}`;
  const grayed = completed || struck;
  return (
    <div
      className={`anim-in${justCompleted ? ' goal-glow' : ''}`}
      style={{
        display: 'flex', alignItems: 'center', gap: 12, padding: 14, borderRadius: 18,
        background: `linear-gradient(160deg, ${THEME.surface2}, ${THEME.surface})`,
        border: `1px solid ${THEME.border}`, animationDelay: `${delay}ms`,
        opacity: grayed ? 0.6 : 1, transition: 'opacity 0.7s ease',
      }}
    >
      <div style={{ position: 'relative', width: 60, height: 60, flexShrink: 0 }}>
        <svg width={60} height={60} style={{ transform: 'rotate(-90deg)' }}>
          <defs>
            <linearGradient id={gradId} x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor={grayed ? THEME.mutedDim : THEME.blueSoft} />
              <stop offset="100%" stopColor={grayed ? THEME.mutedDim : THEME.cyan} />
            </linearGradient>
          </defs>
          <circle cx={30} cy={30} r={r} fill="none" stroke={THEME.border} strokeWidth={6} />
          <circle
            cx={30} cy={30} r={r} fill="none" stroke={`url(#${gradId})`} strokeWidth={6}
            strokeDasharray={c} strokeDashoffset={offset} strokeLinecap="round"
            style={{ filter: grayed ? 'none' : 'drop-shadow(0 0 4px rgba(34,211,238,0.5))', transition: 'stroke-dashoffset 0.6s cubic-bezier(.22,1,.36,1), filter 0.7s ease' }}
          />
        </svg>
        <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', color: grayed ? THEME.mutedDim : THEME.text, fontFamily: 'Space Grotesk, sans-serif', fontWeight: 700, fontSize: 12.5, transition: 'color 0.7s ease' }}>
          {completed ? <Check size={18} /> : `${Math.round(pct)}%`}
        </div>
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{
          color: grayed ? THEME.mutedDim : THEME.text, fontFamily: 'Space Grotesk, sans-serif', fontWeight: 600, fontSize: 14,
          overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
          textDecoration: grayed ? 'line-through' : 'none', transition: 'color 0.7s ease',
        }}>{goal.name}</div>
        <div style={{ color: THEME.mutedDim, fontSize: 12, fontFamily: 'Inter, sans-serif', marginTop: 2 }}>
          {fmt(goal.current)} / {fmt(goal.target)}
        </div>
      </div>
      {!completed && (
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6 }}>
          {onContribute && (
            <button className="tap-scale" onClick={onContribute} style={{
              background: 'rgba(61,127,255,0.15)', border: `1px solid ${THEME.blueSoft}55`, borderRadius: 999,
              padding: '6px 10px', cursor: 'pointer', color: THEME.blueSoft, fontSize: 11.5, fontFamily: 'Inter, sans-serif', fontWeight: 600,
            }}>
              Пополнить
            </button>
          )}
          <button
            className="tap-scale"
            onClick={() => confirming ? onDelete() : setConfirming(true)}
            onBlur={() => setConfirming(false)}
            style={{ background: 'none', border: 'none', cursor: 'pointer', color: confirming ? THEME.red : THEME.mutedDim, padding: 2 }}
          >
            <Trash2 size={13} />
          </button>
        </div>
      )}
      {completed && (
        <button
          className="tap-scale"
          onClick={() => confirming ? onDelete() : setConfirming(true)}
          onBlur={() => setConfirming(false)}
          style={{ background: 'none', border: 'none', cursor: 'pointer', color: confirming ? THEME.red : THEME.mutedDim, padding: 2 }}
        >
          <Trash2 size={13} />
        </button>
      )}
    </div>
  );
}

function LimitRow({ category, spent, limit, onEdit, delay = 0 }) {
  const hasLimit = limit > 0;
  const pct = hasLimit ? Math.min(100, (spent / limit) * 100) : 0;
  const over = hasLimit && spent > limit;
  const near = hasLimit && !over && pct >= 80;
  const barColor = over ? THEME.red : near ? THEME.amber : THEME.blueSoft;
  return (
    <div className="anim-in" style={{
      padding: 14, borderRadius: 16, marginBottom: 10, animationDelay: `${delay}ms`,
      background: `linear-gradient(160deg, ${THEME.surface2}, ${THEME.surface})`,
      border: `1px solid ${over ? 'rgba(251,113,133,0.4)' : THEME.border}`,
    }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <GlassIcon icon={category.icon} color={category.color} size={36} iconSize={16} />
          <span style={{ color: THEME.text, fontFamily: 'Inter, sans-serif', fontWeight: 500, fontSize: 13.5 }}>{category.label}</span>
        </div>
        <button className="tap-scale" onClick={onEdit} style={{ background: THEME.surface2, border: `1px solid ${THEME.border}`, borderRadius: 999, width: 28, height: 28, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: THEME.muted }}>
          <Pencil size={12} />
        </button>
      </div>
      <div style={{ marginTop: 10 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, fontFamily: 'Inter, sans-serif', color: THEME.muted, marginBottom: 5 }}>
          <span>{fmt(spent)}{hasLimit ? ` / ${fmt(limit)}` : ''}</span>
          {hasLimit && <span style={{ color: over ? THEME.red : THEME.muted }}>{Math.round(pct)}%</span>}
        </div>
        {hasLimit ? (
          <div style={{ height: 6, borderRadius: 999, background: THEME.border, overflow: 'hidden' }}>
            <div style={{ height: '100%', width: `${pct}%`, background: barColor, borderRadius: 999, transition: 'width 0.6s cubic-bezier(.22,1,.36,1)' }} />
          </div>
        ) : (
          <div style={{ fontSize: 12, fontFamily: 'Inter, sans-serif', color: THEME.mutedDim }}>Лимит не задан</div>
        )}
      </div>
    </div>
  );
}

function ChartCard({ title, children }) {
  return (
    <div className="anim-in" style={{
      borderRadius: 18, padding: '14px 12px 6px', marginBottom: 12,
      background: `linear-gradient(160deg, ${THEME.surface2}, ${THEME.surface})`,
      border: `1px solid ${THEME.border}`,
    }}>
      <div style={{ color: THEME.muted, fontSize: 12, fontFamily: 'Inter, sans-serif', marginLeft: 6, marginBottom: 4 }}>{title}</div>
      {children}
    </div>
  );
}

function TransactionRow({ tx, category, account, onDelete, onEdit, delay = 0 }) {
  const cat = category || findCategory(tx.category);
  const [confirming, setConfirming] = useState(false);
  const isIncome = tx.type === 'income';
  return (
    <div className="anim-in" style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '10px 0', animationDelay: `${delay}ms` }}>
      <button
        className="tap-scale" onClick={onEdit} type="button" disabled={!onEdit}
        style={{ background: 'none', border: 'none', padding: 0, cursor: onEdit ? 'pointer' : 'default', display: 'flex', alignItems: 'center', gap: 12, flex: 1, minWidth: 0, textAlign: 'left' }}
      >
        <GlassIcon icon={cat.icon} color={cat.color} size={42} iconSize={18} />
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ color: THEME.text, fontSize: 13.5, fontFamily: 'Inter, sans-serif', fontWeight: 500, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {cat.label}{tx.note ? ` · ${tx.note}` : ''}
          </div>
          <div style={{ color: THEME.mutedDim, fontSize: 11.5, fontFamily: 'Inter, sans-serif', marginTop: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {account ? account.name : 'Счёт удалён'}
          </div>
        </div>
        <div style={{ fontFamily: 'Space Grotesk, sans-serif', fontWeight: 600, fontSize: 14, color: isIncome ? THEME.green : THEME.red, whiteSpace: 'nowrap' }}>
          {isIncome ? '+' : '−'}{fmt(tx.amount)}
        </div>
      </button>
      <button
        className="tap-scale"
        onClick={() => confirming ? onDelete() : setConfirming(true)}
        onBlur={() => setConfirming(false)}
        style={{ background: 'none', border: 'none', cursor: 'pointer', color: confirming ? THEME.red : THEME.mutedDim, padding: 2, marginLeft: 2 }}
      >
        <Trash2 size={13} />
      </button>
    </div>
  );
}

function ModalShell({ title, onClose, children }) {
  return (
    <div style={{ position: 'absolute', inset: 0, zIndex: 40, display: 'flex', alignItems: 'flex-end' }}>
      <div onClick={onClose} className="backdrop-in" style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.55)' }} />
      <div className="sheet-in" style={{
        position: 'relative', width: '100%', background: THEME.surface,
        borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: '18px 20px 26px',
        border: `1px solid ${THEME.borderStrong}`, borderBottom: 'none',
        maxHeight: '85%', overflowY: 'auto', boxSizing: 'border-box',
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
          <div style={{ color: THEME.text, fontFamily: 'Space Grotesk, sans-serif', fontWeight: 700, fontSize: 17 }}>{title}</div>
          <button className="tap-scale" onClick={onClose} style={{ background: THEME.surface2, border: 'none', borderRadius: 999, width: 30, height: 30, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}>
            <X size={15} color={THEME.muted} />
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}

function PopupShell({ onClose, children }) {
  return (
    <div style={{ position: 'absolute', inset: 0, zIndex: 40, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '0 28px' }}>
      <div onClick={onClose} className="backdrop-in" style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.6)' }} />
      <div className="popup-in" style={{
        position: 'relative', width: '100%', maxWidth: 320, borderRadius: 24,
        padding: 22, boxSizing: 'border-box',
        background: 'linear-gradient(160deg, rgba(24,34,52,0.92), rgba(14,23,38,0.96))',
        backdropFilter: 'blur(20px) saturate(180%)', WebkitBackdropFilter: 'blur(20px) saturate(180%)',
        border: '1px solid rgba(255,255,255,0.12)', boxShadow: '0 24px 70px rgba(0,0,0,0.55), inset 0 1px 1px rgba(255,255,255,0.08)',
      }}>
        {children}
      </div>
    </div>
  );
}

function ActionChoiceModal({ onClose, onChoose }) {
  return (
    <PopupShell onClose={onClose}>
      <div style={{ textAlign: 'center', color: THEME.text, fontFamily: 'Space Grotesk, sans-serif', fontWeight: 700, fontSize: 17, marginBottom: 4 }}>Новая операция</div>
      <div style={{ textAlign: 'center', color: THEME.mutedDim, fontSize: 12, fontFamily: 'Inter, sans-serif', marginBottom: 18 }}>Выберите тип</div>
      <div style={{ display: 'flex', gap: 12 }}>
        <ChoiceTile icon={ArrowUpRight} label="Доход" color={THEME.green} onClick={() => onChoose('income')} />
        <ChoiceTile icon={ArrowDownRight} label="Расход" color={THEME.red} onClick={() => onChoose('expense')} />
      </div>
    </PopupShell>
  );
}

function ChoiceTile({ icon: Icon, label, color, onClick }) {
  return (
    <button className="tap-scale" onClick={onClick} style={{
      flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 10, padding: '22px 10px',
      borderRadius: 18, border: `1px solid ${color}33`, background: `${color}14`, cursor: 'pointer',
    }}>
      <GlassIcon icon={Icon} color={color} size={52} iconSize={24} />
      <span style={{ color: THEME.text, fontFamily: 'Inter, sans-serif', fontWeight: 600, fontSize: 13 }}>{label}</span>
    </button>
  );
}

function AccountModal({ onClose, onSubmit }) {
  const [name, setName] = useState('');
  const [type, setType] = useState('card');
  const [balance, setBalance] = useState('');
  const submit = () => { if (!name.trim()) return; onSubmit({ name: name.trim(), type, balance }); onClose(); };
  return (
    <ModalShell title="Новый счёт" onClose={onClose}>
      <label style={fieldLabel()}>Название</label>
      <input style={inputStyle()} value={name} onChange={e => setName(e.target.value)} placeholder="Например, Основная карта" />
      <label style={{ ...fieldLabel(), marginTop: 14 }}>Тип</label>
      <div style={{ display: 'flex', gap: 8 }}>
        {Object.entries(ACCOUNT_TYPES).map(([key, meta]) => {
          const active = type === key;
          return (
            <button key={key} className="tap-scale" onClick={() => setType(key)} style={{
              flex: 1, padding: '12px 0', borderRadius: 14, cursor: 'pointer',
              border: `1px solid ${active ? THEME.blueSoft : THEME.border}`,
              background: active ? 'rgba(61,127,255,0.15)' : THEME.surface2,
              display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6,
              color: active ? THEME.text : THEME.muted,
            }}>
              <GlassIcon icon={meta.icon} color={active ? THEME.blueSoft : THEME.muted} size={34} iconSize={15} />
              <span style={{ fontSize: 11, fontFamily: 'Inter, sans-serif' }}>{meta.label}</span>
            </button>
          );
        })}
      </div>
      <label style={{ ...fieldLabel(), marginTop: 14 }}>Начальный баланс</label>
      <input style={inputStyle()} type="number" inputMode="decimal" value={balance} onChange={e => setBalance(e.target.value)} placeholder="0" />
      <button className="tap-scale" style={submitBtn()} onClick={submit}>Добавить счёт</button>
    </ModalShell>
  );
}

function GoalModal({ onClose, onSubmit }) {
  const [name, setName] = useState('');
  const [target, setTarget] = useState('');
  const [iconKey, setIconKey] = useState('target');
  const submit = () => { if (!name.trim() || !Number(target)) return; onSubmit({ name: name.trim(), target, iconKey }); onClose(); };
  return (
    <ModalShell title="Новая цель" onClose={onClose}>
      <label style={fieldLabel()}>Название</label>
      <input style={inputStyle()} value={name} onChange={e => setName(e.target.value)} placeholder="Например, Отпуск" />
      <label style={{ ...fieldLabel(), marginTop: 14 }}>Сумма цели</label>
      <input style={inputStyle()} type="number" inputMode="decimal" value={target} onChange={e => setTarget(e.target.value)} placeholder="0" />
      <label style={{ ...fieldLabel(), marginTop: 14 }}>Иконка</label>
      <IconPicker value={iconKey} onChange={setIconKey} />
      <button className="tap-scale" style={submitBtn()} onClick={submit}>Создать цель</button>
    </ModalShell>
  );
}

function NewCategoryModal({ onClose, onSubmit }) {
  const [label, setLabel] = useState('');
  const [iconKey, setIconKey] = useState('tag');
  const submit = () => { if (!label.trim()) return; onSubmit({ label: label.trim(), iconKey }); };
  return (
    <ModalShell title="Новая категория расходов" onClose={onClose}>
      <label style={fieldLabel()}>Название</label>
      <input style={inputStyle()} value={label} onChange={e => setLabel(e.target.value)} placeholder="Например, Подписки" />
      <label style={{ ...fieldLabel(), marginTop: 14 }}>Иконка</label>
      <IconPicker value={iconKey} onChange={setIconKey} />
      <button className="tap-scale" style={submitBtn()} onClick={submit}>Создать и задать лимит</button>
    </ModalShell>
  );
}

function IconPicker({ value, onChange, color = THEME.blueSoft }) {
  return (
    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
      {ICON_OPTIONS.map(opt => {
        const Icon = opt.icon;
        const active = value === opt.key;
        return (
          <button key={opt.key} className="tap-scale" onClick={() => onChange(opt.key)} type="button" style={{
            width: 38, height: 38, borderRadius: 12, cursor: 'pointer', display: 'grid', placeItems: 'center',
            border: `1px solid ${active ? color : THEME.border}`,
            background: active ? `${color}22` : THEME.surface2,
            color: active ? color : THEME.muted,
          }}>
            <Icon size={16} />
          </button>
        );
      })}
    </div>
  );
}

function TxModal({ kind, accounts, categories, onCreateCategory, onClose, onSubmit }) {
  const [accountId, setAccountId] = useState(accounts[0]?.id || '');
  const [category, setCategory] = useState(categories[0]?.id || '');
  const [amount, setAmount] = useState('');
  const [note, setNote] = useState('');
  const [date, setDate] = useState(todayISO());
  const [creating, setCreating] = useState(false);
  const [newLabel, setNewLabel] = useState('');
  const [newIconKey, setNewIconKey] = useState('tag');

  const submit = () => { if (!Number(amount) || !accountId) return; onSubmit({ accountId, category, amount, note, date }); onClose(); };

  const submitNewCategory = () => {
    if (!newLabel.trim()) return;
    const newId = onCreateCategory({ label: newLabel.trim(), iconKey: newIconKey });
    setCategory(newId);
    setCreating(false); setNewLabel(''); setNewIconKey('tag');
  };

  return (
    <ModalShell title={kind === 'income' ? 'Новый доход' : 'Новый расход'} onClose={onClose}>
      <label style={fieldLabel()}>Счёт</label>
      <select style={inputStyle()} value={accountId} onChange={e => setAccountId(e.target.value)}>
        {accounts.map(a => <option key={a.id} value={a.id}>{a.name}</option>)}
      </select>
      <label style={{ ...fieldLabel(), marginTop: 14 }}>Категория</label>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
        {categories.map(c => {
          const active = category === c.id;
          const Icon = c.icon;
          return (
            <button key={c.id} className="tap-scale" onClick={() => setCategory(c.id)} type="button" style={{
              padding: '7px 12px', borderRadius: 999, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6,
              border: `1px solid ${active ? c.color : THEME.border}`,
              background: active ? `${c.color}22` : THEME.surface2,
              color: active ? THEME.text : THEME.muted, fontSize: 12.5, fontFamily: 'Inter, sans-serif',
            }}>
              <Icon size={13} color={c.color} /> {c.label}
            </button>
          );
        })}
        <button className="tap-scale" onClick={() => setCreating(v => !v)} type="button" style={{
          padding: '7px 12px', borderRadius: 999, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6,
          border: `1px dashed ${THEME.borderStrong}`, background: 'transparent', color: THEME.muted,
          fontSize: 12.5, fontFamily: 'Inter, sans-serif',
        }}>
          <Plus size={13} /> Своя
        </button>
      </div>

      {creating && (
        <div className="anim-in" style={{ marginTop: 10, padding: 12, borderRadius: 14, background: THEME.surface2, border: `1px solid ${THEME.border}` }}>
          <label style={fieldLabel()}>Название категории</label>
          <input style={inputStyle()} value={newLabel} onChange={e => setNewLabel(e.target.value)} placeholder="Например, Подписки" />
          <label style={{ ...fieldLabel(), marginTop: 10 }}>Иконка</label>
          <IconPicker value={newIconKey} onChange={setNewIconKey} />
          <button className="tap-scale" onClick={submitNewCategory} type="button" style={{ ...submitBtn(), marginTop: 12, padding: '10px' }}>Добавить категорию</button>
        </div>
      )}

      <label style={{ ...fieldLabel(), marginTop: 14 }}>Сумма</label>
      <input style={inputStyle()} type="number" inputMode="decimal" value={amount} onChange={e => setAmount(e.target.value)} placeholder="0" />
      <label style={{ ...fieldLabel(), marginTop: 14 }}>Дата</label>
      <input style={inputStyle()} type="date" value={date} onChange={e => setDate(e.target.value)} />
      <label style={{ ...fieldLabel(), marginTop: 14 }}>Заметка (необязательно)</label>
      <input style={inputStyle()} value={note} onChange={e => setNote(e.target.value)} placeholder="Комментарий" />
      <button className="tap-scale" style={submitBtn()} onClick={submit}>{kind === 'income' ? 'Добавить доход' : 'Добавить расход'}</button>
    </ModalShell>
  );
}

function ContributeModal({ goals, accounts, initialGoalId, onClose, onSubmit }) {
  const [goalId, setGoalId] = useState(initialGoalId || goals[0]?.id || '');
  const [accountId, setAccountId] = useState(accounts[0]?.id || '');
  const [amount, setAmount] = useState('');
  const submit = () => { if (!Number(amount) || !goalId || !accountId) return; onSubmit({ goalId, accountId, amount }); onClose(); };
  if (accounts.length === 0) {
    return (
      <ModalShell title="Пополнить цель" onClose={onClose}>
        <div style={{ color: THEME.muted, fontSize: 13, fontFamily: 'Inter, sans-serif' }}>Сначала добавьте хотя бы один счёт.</div>
      </ModalShell>
    );
  }
  return (
    <ModalShell title="Пополнить цель" onClose={onClose}>
      <label style={fieldLabel()}>Цель</label>
      <select style={inputStyle()} value={goalId} onChange={e => setGoalId(e.target.value)}>
        {goals.map(g => <option key={g.id} value={g.id}>{g.name}</option>)}
      </select>
      <label style={{ ...fieldLabel(), marginTop: 14 }}>Списать со счёта</label>
      <select style={inputStyle()} value={accountId} onChange={e => setAccountId(e.target.value)}>
        {accounts.map(a => <option key={a.id} value={a.id}>{a.name}</option>)}
      </select>
      <label style={{ ...fieldLabel(), marginTop: 14 }}>Сумма</label>
      <input style={inputStyle()} type="number" inputMode="decimal" value={amount} onChange={e => setAmount(e.target.value)} placeholder="0" />
      <button className="tap-scale" style={submitBtn()} onClick={submit}>Пополнить</button>
    </ModalShell>
  );
}

function LimitModal({ category, currentLimit, accounts, onClose, onSave, onClear }) {
  const [amount, setAmount] = useState(currentLimit > 0 ? String(currentLimit) : '');
  const [accountId, setAccountId] = useState(accounts[0]?.id || '');
  const [pct, setPct] = useState(0);

  const selectedAccount = accounts.find(a => a.id === accountId);
  const balance = selectedAccount ? selectedAccount.balance : 0;

  const applyPct = (value) => {
    setPct(value);
    if (selectedAccount) setAmount(String(Math.round(balance * value / 100)));
  };

  const changeAccount = (id) => {
    setAccountId(id);
    const acc = accounts.find(a => a.id === id);
    if (acc) setAmount(String(Math.round(acc.balance * pct / 100)));
  };

  const submit = () => { onSave(Number(amount) || 0); onClose(); };

  return (
    <ModalShell title={`Лимит: ${category.label}`} onClose={onClose}>
      <label style={fieldLabel()}>Лимит в месяц</label>
      <input style={inputStyle()} type="number" inputMode="decimal" value={amount} onChange={e => setAmount(e.target.value)} placeholder="0" />

      {accounts.length > 0 && (
        <>
          <label style={{ ...fieldLabel(), marginTop: 16 }}>Или задать как % от счёта</label>
          <select style={inputStyle()} value={accountId} onChange={e => changeAccount(e.target.value)}>
            {accounts.map(a => <option key={a.id} value={a.id}>{a.name} · {fmt(a.balance)}</option>)}
          </select>

          <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginTop: 14 }}>
            <input
              type="range" min="0" max="100" step="1" value={pct}
              onChange={e => applyPct(Number(e.target.value))}
              style={{ flex: 1, accentColor: THEME.blueSoft, height: 20 }}
            />
            <span style={{ color: THEME.text, fontFamily: 'Space Grotesk, sans-serif', fontWeight: 700, fontSize: 14, width: 44, textAlign: 'right', flexShrink: 0 }}>{pct}%</span>
          </div>
          <div style={{ color: THEME.mutedDim, fontSize: 11.5, fontFamily: 'Inter, sans-serif', marginTop: 6 }}>
            {pct}% от «{selectedAccount ? selectedAccount.name : '—'}» = {fmt(Math.round(balance * pct / 100))}
          </div>
        </>
      )}

      <button className="tap-scale" style={submitBtn()} onClick={submit}>Сохранить</button>
      {currentLimit > 0 && (
        <button
          className="tap-scale"
          onClick={() => { onClear(); onClose(); }}
          style={{ ...submitBtn(), marginTop: 10, background: 'transparent', border: `1px solid ${THEME.border}`, color: THEME.red }}
        >
          Убрать лимит
        </button>
      )}
    </ModalShell>
  );
}

function SettingsModal({ currency, accentId, barItemIds, homeSections, onClose, onSave }) {
  const [selectedCurrency, setSelectedCurrency] = useState(currency);
  const [selectedAccent, setSelectedAccent] = useState(accentId);
  const [barIds, setBarIds] = useState(barItemIds);
  const [sections, setSections] = useState(homeSections);

  const submit = () => {
    onSave({ currency: selectedCurrency, accentId: selectedAccent, homeSections: sections, barItemIds: barIds });
    onClose();
  };

  const toggleBar = (id) => setBarIds(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);
  const toggleSection = (key) => setSections(prev => ({ ...prev, [key]: !prev[key] }));

  return (
    <ModalShell title="Настройки" onClose={onClose}>
      <label style={fieldLabel()}>Валюта</label>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
        {CURRENCIES.map(c => {
          const active = selectedCurrency === c.symbol;
          return (
            <button key={c.code} className="tap-scale" onClick={() => setSelectedCurrency(c.symbol)} style={{
              padding: '9px 14px', borderRadius: 999, cursor: 'pointer',
              border: `1px solid ${active ? THEME.blueSoft : THEME.border}`,
              background: active ? 'rgba(61,127,255,0.15)' : THEME.surface2,
              color: active ? THEME.text : THEME.muted, fontSize: 13, fontFamily: 'Inter, sans-serif',
              display: 'flex', alignItems: 'center', gap: 6,
            }}>
              <span style={{ fontFamily: 'Space Grotesk, sans-serif', fontWeight: 700 }}>{c.symbol || '—'}</span> {c.label}
            </button>
          );
        })}
      </div>

      <label style={{ ...fieldLabel(), marginTop: 18 }}>Цветовая тема</label>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 14 }}>
        {ACCENT_THEMES.map(a => {
          const active = selectedAccent === a.id;
          return (
            <button
              key={a.id} className="tap-scale" onClick={() => setSelectedAccent(a.id)} type="button"
              style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6, cursor: 'pointer', background: 'none', border: 'none', padding: 0, width: 58 }}
            >
              <span style={{
                width: 42, height: 42, borderRadius: 999, display: 'block',
                background: `linear-gradient(135deg, ${a.blueSoft}, ${a.blue})`,
                boxShadow: active ? `0 0 0 2px ${THEME.surface}, 0 0 0 4px ${a.blueSoft}` : `inset 0 1px 1px rgba(255,255,255,0.3)`,
                transition: 'box-shadow 0.2s ease',
              }} />
              <span style={{
                fontSize: 10.5, fontFamily: 'Inter, sans-serif', textAlign: 'center',
                color: active ? THEME.text : THEME.muted, fontWeight: active ? 600 : 400,
                overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: '100%',
              }}>{a.label}</span>
            </button>
          );
        })}
      </div>

      <label style={{ ...fieldLabel(), marginTop: 18 }}>Разделы на главном экране</label>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
        <ToggleChip label="Цели" active={sections.goals} onClick={() => toggleSection('goals')} />
        <ToggleChip label="Последние операции" active={sections.transactions} onClick={() => toggleSection('transactions')} />
      </div>

      <label style={{ ...fieldLabel(), marginTop: 18 }}>Вкладки и разделы</label>
      <div style={{ color: THEME.mutedDim, fontSize: 11, fontFamily: 'Inter, sans-serif', marginBottom: 8 }}>
        Отмеченные — на нижней панели. Остальные — в меню (☰). Главная всегда на панели.
      </div>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
        {ALL_NAV_SECTIONS.map(s => (
          <ToggleChip key={s.id} label={s.label} active={barIds.includes(s.id)} onClick={() => toggleBar(s.id)} />
        ))}
      </div>

      <button className="tap-scale" style={submitBtn()} onClick={submit}>Сохранить</button>
    </ModalShell>
  );
}

function ToggleChip({ label, active, onClick }) {
  return (
    <button className="tap-scale" onClick={onClick} type="button" style={{
      padding: '8px 13px', borderRadius: 999, cursor: 'pointer',
      border: `1px solid ${active ? THEME.blueSoft : THEME.border}`,
      background: active ? 'rgba(61,127,255,0.15)' : THEME.surface2,
      color: active ? THEME.text : THEME.mutedDim, fontSize: 12.5, fontFamily: 'Inter, sans-serif',
      display: 'flex', alignItems: 'center', gap: 6,
    }}>
      {active ? <Check size={13} color={THEME.blueSoft} /> : <X size={13} color={THEME.mutedDim} />}
      {label}
    </button>
  );
}

function CalendarModal({ transactions, goals, totalBalance, accounts, resolveCategory, onClose }) {
  const [viewDate, setViewDate] = useState(() => { const d = new Date(); d.setDate(1); return d; });
  const [selectedDate, setSelectedDate] = useState(null);

  const totalInitial = useMemo(() => {
    const netAll = transactions.reduce((s, t) => s + (t.type === 'income' ? t.amount : -t.amount), 0);
    return totalBalance - netAll;
  }, [transactions, totalBalance]);

  const dailyTotals = useMemo(() => {
    const map = {};
    transactions.forEach(t => {
      const net = t.type === 'income' ? t.amount : -t.amount;
      map[t.date] = (map[t.date] || 0) + net;
    });
    return map;
  }, [transactions]);

  function balanceAsOf(dateStr) {
    let sum = totalInitial;
    transactions.forEach(t => {
      if (t.date <= dateStr) sum += (t.type === 'income' ? t.amount : -t.amount);
    });
    return sum;
  }

  function goalsAsOf(dateStr) {
    return goals.map(g => {
      const collected = transactions.filter(t => t.goalId === g.id && t.date <= dateStr).reduce((s, t) => s + t.amount, 0);
      const pct = g.target > 0 ? Math.min(100, (collected / g.target) * 100) : 0;
      return { ...g, collectedAsOf: collected, pctAsOf: pct };
    }).filter(g => g.collectedAsOf > 0);
  }

  const year = viewDate.getFullYear();
  const month = viewDate.getMonth();
  const startWeekday = (new Date(year, month, 1).getDay() + 6) % 7;
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const monthLabel = viewDate.toLocaleDateString('ru-RU', { month: 'long', year: 'numeric' });
  const todayStr = todayISO();

  const cells = [];
  for (let i = 0; i < startWeekday; i++) cells.push(null);
  for (let d = 1; d <= daysInMonth; d++) cells.push(d);

  function changeMonth(delta) {
    setViewDate(prev => { const nd = new Date(prev); nd.setMonth(nd.getMonth() + delta); nd.setDate(1); return nd; });
  }

  function dateStrFor(d) {
    return `${year}-${String(month + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
  }

  if (selectedDate) {
    const dayTx = transactions.filter(t => t.date === selectedDate).sort((a, b) => b.createdAt - a.createdAt);
    const bal = balanceAsOf(selectedDate);
    const gList = goalsAsOf(selectedDate);
    const label = new Date(selectedDate + 'T00:00:00').toLocaleDateString('ru-RU', { day: 'numeric', month: 'long', year: 'numeric' });
    return (
      <ModalShell title={label} onClose={onClose}>
        <button
          className="tap-scale"
          onClick={() => setSelectedDate(null)}
          style={{ background: 'none', border: 'none', cursor: 'pointer', color: THEME.blueSoft, display: 'flex', alignItems: 'center', gap: 4, fontSize: 13, fontFamily: 'Inter, sans-serif', marginBottom: 14, padding: 0 }}
        >
          <ChevronLeft size={16} /> К календарю
        </button>

        <div style={{ padding: '12px 14px', borderRadius: 14, background: THEME.surface2, border: `1px solid ${THEME.border}`, marginBottom: 14 }}>
          <div style={{ color: THEME.muted, fontSize: 11.5, fontFamily: 'Inter, sans-serif' }}>Баланс на конец дня</div>
          <div style={{ color: THEME.text, fontFamily: 'Space Grotesk, sans-serif', fontWeight: 700, fontSize: 20, marginTop: 2 }}>{fmt(bal)}</div>
        </div>

        {gList.length > 0 && (
          <div style={{ marginBottom: 14 }}>
            <div style={{ color: THEME.muted, fontSize: 12, fontFamily: 'Inter, sans-serif', marginBottom: 8 }}>Цели на этот день</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {gList.map(g => (
                <div key={g.id} style={{ padding: '10px 12px', borderRadius: 12, background: THEME.surface2, border: `1px solid ${THEME.border}` }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12.5, fontFamily: 'Inter, sans-serif', color: THEME.text, marginBottom: 6 }}>
                    <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', minWidth: 0 }}>{g.name}</span>
                    <span style={{ color: THEME.muted, flexShrink: 0, marginLeft: 8 }}>{Math.round(g.pctAsOf)}%</span>
                  </div>
                  <div style={{ height: 6, borderRadius: 999, background: THEME.border, overflow: 'hidden' }}>
                    <div style={{ height: '100%', width: `${g.pctAsOf}%`, background: `linear-gradient(90deg, ${THEME.blueSoft}, ${THEME.cyan})`, borderRadius: 999 }} />
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        <div style={{ color: THEME.muted, fontSize: 12, fontFamily: 'Inter, sans-serif', marginBottom: 8 }}>Операции за день</div>
        {dayTx.length === 0 ? (
          <div style={{ color: THEME.mutedDim, fontSize: 13, fontFamily: 'Inter, sans-serif', textAlign: 'center', padding: '16px 0' }}>Операций не было</div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            {dayTx.map(t => (
              <TransactionRow key={t.id} tx={t} category={resolveCategory(t.category)} account={accounts.find(a => a.id === t.accountId)} onDelete={() => {}} />
            ))}
          </div>
        )}
      </ModalShell>
    );
  }

  return (
    <ModalShell title="Календарь" onClose={onClose}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
        <button className="tap-scale" onClick={() => changeMonth(-1)} style={{ width: 34, height: 34, borderRadius: 11, border: `1px solid ${THEME.border}`, background: THEME.surface2, display: 'grid', placeItems: 'center', cursor: 'pointer', color: THEME.muted }}>
          <ChevronLeft size={16} />
        </button>
        <div style={{ color: THEME.text, fontFamily: 'Space Grotesk, sans-serif', fontWeight: 700, fontSize: 15, textTransform: 'capitalize' }}>{monthLabel}</div>
        <button className="tap-scale" onClick={() => changeMonth(1)} style={{ width: 34, height: 34, borderRadius: 11, border: `1px solid ${THEME.border}`, background: THEME.surface2, display: 'grid', placeItems: 'center', cursor: 'pointer', color: THEME.muted }}>
          <ChevronRight size={16} />
        </button>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 4, marginBottom: 6 }}>
        {['Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб', 'Вс'].map(w => (
          <div key={w} style={{ textAlign: 'center', color: THEME.mutedDim, fontSize: 10.5, fontFamily: 'Inter, sans-serif', padding: '2px 0' }}>{w}</div>
        ))}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 4 }}>
        {cells.map((d, i) => {
          if (d === null) return <div key={'empty' + i} />;
          const ds = dateStrFor(d);
          const net = dailyTotals[ds];
          const isToday = ds === todayStr;
          return (
            <button
              key={ds} className="tap-scale" onClick={() => setSelectedDate(ds)}
              style={{
                aspectRatio: '1', borderRadius: 11, cursor: 'pointer', padding: 2, minWidth: 0,
                display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 2,
                border: isToday ? `1px solid ${THEME.blueSoft}` : `1px solid ${THEME.border}`,
                background: isToday ? 'rgba(61,127,255,0.14)' : THEME.surface2,
              }}
            >
              <span style={{ color: THEME.text, fontSize: 11.5, fontFamily: 'Inter, sans-serif', fontWeight: isToday ? 700 : 500 }}>{d}</span>
              {net !== undefined && net !== 0 && (
                <span style={{
                  fontSize: 8.5, fontFamily: 'Space Grotesk, sans-serif', fontWeight: 600, whiteSpace: 'nowrap',
                  color: net > 0 ? THEME.green : THEME.red,
                }}>{net > 0 ? '+' : ''}{compactNum(net)}</span>
              )}
            </button>
          );
        })}
      </div>
    </ModalShell>
  );
}

function SalaryAllocationModal({ categories, onSetLimit, onClose }) {
  const [salary, setSalary] = useState('');
  const [pcts, setPcts] = useState({});

  const sal = Number(salary) || 0;
  const totalPct = Object.values(pcts).reduce((s, v) => s + (Number(v) || 0), 0);
  const over = totalPct > 100;

  const submit = () => {
    if (!sal) return;
    Object.entries(pcts).forEach(([catId, pctStr]) => {
      const pct = Number(pctStr);
      if (pct > 0) onSetLimit(catId, Math.round(sal * pct / 100));
    });
    onClose();
  };

  return (
    <ModalShell title="Распределение зарплаты" onClose={onClose}>
      <label style={fieldLabel()}>Сумма зарплаты</label>
      <div style={{ position: 'relative' }}>
        <input
          style={{ ...inputStyle(), paddingRight: _currencySymbol ? 40 : 12 }}
          type="number" inputMode="decimal" value={salary} onChange={e => setSalary(e.target.value)} placeholder="0"
        />
        {_currencySymbol && (
          <span style={{
            position: 'absolute', right: 14, top: '50%', transform: 'translateY(-50%)',
            color: THEME.mutedDim, fontSize: 14, fontFamily: 'Space Grotesk, sans-serif', fontWeight: 600, pointerEvents: 'none',
          }}>{_currencySymbol}</span>
        )}
      </div>

      <label style={{ ...fieldLabel(), marginTop: 16 }}>Процент по категориям</label>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        {categories.map(cat => {
          const Icon = cat.icon;
          const pct = Number(pcts[cat.id]) || 0;
          const amount = sal * pct / 100;
          return (
            <div key={cat.id} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px 10px', borderRadius: 12, background: THEME.surface2, border: `1px solid ${THEME.border}` }}>
              <GlassIcon icon={Icon} color={cat.color} size={30} iconSize={14} />
              <span style={{ flex: 1, minWidth: 0, color: THEME.text, fontSize: 12.5, fontFamily: 'Inter, sans-serif', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{cat.label}</span>
              {pct > 0 && sal > 0 && (
                <span style={{ color: THEME.mutedDim, fontSize: 11, fontFamily: 'Inter, sans-serif', flexShrink: 0 }}>{fmt(amount)}</span>
              )}
              <input
                type="number" inputMode="decimal" value={pcts[cat.id] || ''} placeholder="0"
                onChange={e => setPcts(prev => ({ ...prev, [cat.id]: e.target.value }))}
                style={{
                  width: 52, flexShrink: 0, boxSizing: 'border-box', background: THEME.surface, border: `1px solid ${THEME.border}`,
                  borderRadius: 9, padding: '6px 8px', color: THEME.text, fontSize: 12.5, fontFamily: 'Inter, sans-serif', textAlign: 'right',
                }}
              />
              <span style={{ color: THEME.mutedDim, fontSize: 12, fontFamily: 'Inter, sans-serif', flexShrink: 0 }}>%</span>
            </div>
          );
        })}
      </div>

      <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 12, fontSize: 12.5, fontFamily: 'Inter, sans-serif' }}>
        <span style={{ color: THEME.muted }}>Распределено</span>
        <span style={{ color: over ? THEME.red : THEME.text, fontWeight: 600 }}>
          {totalPct}%{sal > 0 ? ` · ${fmt(sal * totalPct / 100)}` : ''}
        </span>
      </div>

      <button className="tap-scale" style={submitBtn()} onClick={submit}>Применить лимиты</button>
    </ModalShell>
  );
}

const CONFETTI_COLORS = ['#fb7185', '#fbbf24', '#34d399', '#38bdf8', '#a78bfa', '#f472b6', '#22d3ee', '#ffffff'];

function makeConfettiPieces(count) {
  const pieces = [];
  for (let i = 0; i < count; i++) {
    const originRoll = Math.random();
    let left, top, dx, dyVh;
    if (originRoll < 0.45) {
      // from the top edge — falls the full height plus margin, in viewport-height units
      // so it always clears the bottom regardless of actual device height
      left = Math.random() * 100;
      top = -8 - Math.random() * 8;
      dx = (Math.random() - 0.5) * 90;
      dyVh = 135 + Math.random() * 25;
    } else if (originRoll < 0.72) {
      // from the left edge
      left = -8 - Math.random() * 6;
      top = Math.random() * 35;
      dx = 140 + Math.random() * 200;
      dyVh = 110 + Math.random() * 30;
    } else {
      // from the right edge
      left = 108 + Math.random() * 6;
      top = Math.random() * 35;
      dx = -(140 + Math.random() * 200);
      dyVh = 110 + Math.random() * 30;
    }
    const size = 6 + Math.random() * 7;
    pieces.push({
      id: i,
      color: CONFETTI_COLORS[i % CONFETTI_COLORS.length],
      left, top, dx, dy: `${dyVh}vh`,
      rot: (360 * (2 + Math.random() * 4)) * (Math.random() < 0.5 ? -1 : 1),
      duration: 2400 + Math.random() * 1600,
      delay: Math.random() * 400,
      size,
      shape: Math.random() < 0.5 ? 'circle' : 'rect',
    });
  }
  return pieces;
}

function ConfettiBurst({ onDone }) {
  const [pieces] = useState(() => makeConfettiPieces(70));

  useEffect(() => {
    const maxTime = pieces.reduce((m, p) => Math.max(m, p.delay + p.duration), 0) + 150;
    const t = setTimeout(() => { if (onDone) onDone(); }, maxTime);
    return () => clearTimeout(t);
  }, []);

  return (
    <div style={{ position: 'absolute', inset: 0, overflow: 'hidden', pointerEvents: 'none', zIndex: 90 }}>
      {pieces.map(p => (
        <span
          key={p.id}
          style={{
            position: 'absolute',
            left: `${p.left}%`,
            top: `${p.top}%`,
            width: p.shape === 'circle' ? p.size : p.size * 0.6,
            height: p.size,
            borderRadius: p.shape === 'circle' ? '50%' : 2,
            background: p.color,
            opacity: 0,
            '--dx': `${p.dx}px`,
            '--dy': p.dy,
            '--rot': `${p.rot}deg`,
            animation: `confettiFall ${p.duration}ms cubic-bezier(.25,.46,.45,.94) ${p.delay}ms forwards`,
            boxShadow: '0 0 3px rgba(0,0,0,0.15)',
          }}
        />
      ))}
    </div>
  );
}

function IncomeSplitModal({ accounts, categories, onSplit, onClose }) {
  const [amount, setAmount] = useState('');
  const [category, setCategory] = useState(categories[0]?.id || '');
  const [pcts, setPcts] = useState({});

  const total = Number(amount) || 0;
  const totalPct = Object.values(pcts).reduce((s, v) => s + (Number(v) || 0), 0);
  const over = totalPct > 100;

  const submit = () => {
    if (!total) return;
    onSplit({ amount, category, pcts });
    onClose();
  };

  if (accounts.length === 0) {
    return (
      <ModalShell title="Разделить доход по счетам" onClose={onClose}>
        <div style={{ color: THEME.muted, fontSize: 13, fontFamily: 'Inter, sans-serif' }}>Сначала добавьте хотя бы один счёт.</div>
      </ModalShell>
    );
  }

  return (
    <ModalShell title="Разделить доход по счетам" onClose={onClose}>
      <label style={fieldLabel()}>Сумма дохода</label>
      <div style={{ position: 'relative' }}>
        <input
          style={{ ...inputStyle(), paddingRight: _currencySymbol ? 40 : 12 }}
          type="number" inputMode="decimal" value={amount} onChange={e => setAmount(e.target.value)} placeholder="0"
        />
        {_currencySymbol && (
          <span style={{
            position: 'absolute', right: 14, top: '50%', transform: 'translateY(-50%)',
            color: THEME.mutedDim, fontSize: 14, fontFamily: 'Space Grotesk, sans-serif', fontWeight: 600, pointerEvents: 'none',
          }}>{_currencySymbol}</span>
        )}
      </div>

      <label style={{ ...fieldLabel(), marginTop: 14 }}>Категория дохода</label>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
        {categories.map(c => {
          const active = category === c.id;
          const Icon = c.icon;
          return (
            <button key={c.id} className="tap-scale" type="button" onClick={() => setCategory(c.id)} style={{
              padding: '7px 12px', borderRadius: 999, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6,
              border: `1px solid ${active ? c.color : THEME.border}`,
              background: active ? `${c.color}22` : THEME.surface2,
              color: active ? THEME.text : THEME.muted, fontSize: 12.5, fontFamily: 'Inter, sans-serif',
            }}>
              <Icon size={13} color={c.color} /> {c.label}
            </button>
          );
        })}
      </div>

      <label style={{ ...fieldLabel(), marginTop: 16 }}>Процент по счетам</label>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        {accounts.map(a => {
          const meta = ACCOUNT_TYPES[a.type];
          const pct = Number(pcts[a.id]) || 0;
          const amt = total * pct / 100;
          return (
            <div key={a.id} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px 10px', borderRadius: 12, background: THEME.surface2, border: `1px solid ${THEME.border}` }}>
              <GlassIcon icon={meta.icon} color={THEME.blueSoft} size={30} iconSize={14} />
              <span style={{ flex: 1, minWidth: 0, color: THEME.text, fontSize: 12.5, fontFamily: 'Inter, sans-serif', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{a.name}</span>
              {pct > 0 && total > 0 && (
                <span style={{ color: THEME.mutedDim, fontSize: 11, fontFamily: 'Inter, sans-serif', flexShrink: 0 }}>{fmt(amt)}</span>
              )}
              <input
                type="number" inputMode="decimal" value={pcts[a.id] || ''} placeholder="0"
                onChange={e => setPcts(prev => ({ ...prev, [a.id]: e.target.value }))}
                style={{
                  width: 52, flexShrink: 0, boxSizing: 'border-box', background: THEME.surface, border: `1px solid ${THEME.border}`,
                  borderRadius: 9, padding: '6px 8px', color: THEME.text, fontSize: 12.5, fontFamily: 'Inter, sans-serif', textAlign: 'right',
                }}
              />
              <span style={{ color: THEME.mutedDim, fontSize: 12, fontFamily: 'Inter, sans-serif', flexShrink: 0 }}>%</span>
            </div>
          );
        })}
      </div>

      <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 12, fontSize: 12.5, fontFamily: 'Inter, sans-serif' }}>
        <span style={{ color: THEME.muted }}>Распределено</span>
        <span style={{ color: over ? THEME.red : THEME.text, fontWeight: 600 }}>
          {totalPct}%{total > 0 ? ` · ${fmt(total * totalPct / 100)}` : ''}
        </span>
      </div>

      <button className="tap-scale" style={submitBtn()} onClick={submit}>Разделить и зачислить</button>
    </ModalShell>
  );
}

function MenuModal({ barItemIds, onClose, onNavigate }) {
  const items = ALL_NAV_SECTIONS.filter(s => !barItemIds.includes(s.id));

  return (
    <ModalShell title="Меню" onClose={onClose}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        {items.length === 0 && <EmptyRow text="Всё уже отображается на нижней панели" />}
        {items.map(it => (
          <button key={it.id} className="tap-scale" onClick={() => onNavigate(it.id)} type="button" style={{
            display: 'flex', alignItems: 'center', gap: 12, padding: '12px 14px', borderRadius: 16, cursor: 'pointer',
            border: `1px solid ${THEME.border}`, background: `linear-gradient(160deg, ${THEME.surface2}, ${THEME.surface})`, width: '100%', textAlign: 'left',
          }}>
            <GlassIcon icon={it.icon} color={it.color || THEME.blueSoft} size={38} iconSize={17} />
            <span style={{ flex: 1, color: THEME.text, fontFamily: 'Inter, sans-serif', fontWeight: 500, fontSize: 14 }}>{it.label}</span>
            <ChevronRight size={16} color={THEME.mutedDim} />
          </button>
        ))}
      </div>
    </ModalShell>
  );
}

function RecurringPaymentsModal({ payments, accounts, categories, onAdd, onUpdate, onToggle, onDelete, onClose }) {
  const [view, setView] = useState('list');
  const [editId, setEditId] = useState(null);

  if (view === 'form') {
    const editing = editId ? payments.find(p => p.id === editId) : null;
    return (
      <ModalShell title={editing ? 'Изменить платёж' : 'Новый регулярный платёж'} onClose={onClose}>
        <BackLink onClick={() => { setView('list'); setEditId(null); }} />
        <RecurringForm
          accounts={accounts} categories={categories} initial={editing}
          onSubmit={(data) => {
            if (editing) onUpdate(editing.id, data); else onAdd(data);
            setView('list'); setEditId(null);
          }}
        />
      </ModalShell>
    );
  }

  return (
    <ModalShell title="Регулярные платежи" onClose={onClose}>
      <AddTile label="Новый платёж" full onClick={() => { setEditId(null); setView('form'); }} />
      <div style={{ marginTop: 14, display: 'flex', flexDirection: 'column', gap: 8 }}>
        {payments.length === 0 && <EmptyRow text="Пока нет регулярных платежей" />}
        {payments.map((p, i) => (
          <RecurringRow
            key={p.id} payment={p} accounts={accounts} categories={categories} delay={i * 30}
            onEdit={() => { setEditId(p.id); setView('form'); }}
            onToggle={() => onToggle(p.id)}
            onDelete={() => onDelete(p.id)}
          />
        ))}
      </div>
    </ModalShell>
  );
}

function RecurringRow({ payment, accounts, categories, delay = 0, onEdit, onToggle, onDelete }) {
  const [confirming, setConfirming] = useState(false);
  const account = accounts.find(a => a.id === payment.accountId);
  const cat = payment.categoryId ? categories.find(c => c.id === payment.categoryId) : null;
  const Icon = cat ? cat.icon : Repeat;
  return (
    <div className="anim-in" style={{
      display: 'flex', alignItems: 'center', gap: 12, padding: 12, borderRadius: 16, animationDelay: `${delay}ms`,
      background: `linear-gradient(160deg, ${THEME.surface2}, ${THEME.surface})`, border: `1px solid ${THEME.border}`,
      opacity: payment.active ? 1 : 0.5,
    }}>
      <button className="tap-scale" onClick={onEdit} type="button" style={{ background: 'none', border: 'none', padding: 0, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 12, flex: 1, minWidth: 0, textAlign: 'left' }}>
        <GlassIcon icon={Icon} color={cat ? cat.color : THEME.blueSoft} size={38} iconSize={17} />
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ color: THEME.text, fontSize: 13.5, fontFamily: 'Inter, sans-serif', fontWeight: 500, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{payment.name}</div>
          <div style={{ color: THEME.mutedDim, fontSize: 11.5, fontFamily: 'Inter, sans-serif', marginTop: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {account ? account.name : 'Счёт удалён'} · {payment.dayOfMonth} числа
          </div>
        </div>
        <div style={{ color: THEME.text, fontFamily: 'Space Grotesk, sans-serif', fontWeight: 600, fontSize: 13, whiteSpace: 'nowrap' }}>{fmt(payment.amount)}</div>
      </button>
      <button className="tap-scale" onClick={onToggle} style={{ background: 'none', border: 'none', cursor: 'pointer', color: payment.active ? THEME.green : THEME.mutedDim, padding: 2 }}>
        <Power size={14} />
      </button>
      <button
        className="tap-scale"
        onClick={() => confirming ? onDelete() : setConfirming(true)}
        onBlur={() => setConfirming(false)}
        style={{ background: 'none', border: 'none', cursor: 'pointer', color: confirming ? THEME.red : THEME.mutedDim, padding: 2 }}
      >
        <Trash2 size={14} />
      </button>
    </div>
  );
}

function RecurringForm({ accounts, categories, initial, onSubmit }) {
  const [name, setName] = useState(initial?.name || '');
  const [amount, setAmount] = useState(initial ? String(initial.amount) : '');
  const [accountId, setAccountId] = useState(initial?.accountId || accounts[0]?.id || '');
  const [categoryId, setCategoryId] = useState(initial?.categoryId || '');
  const [dayOfMonth, setDayOfMonth] = useState(initial ? String(initial.dayOfMonth) : '1');

  const submit = () => {
    if (!name.trim() || !Number(amount) || !accountId) return;
    onSubmit({ name: name.trim(), amount, accountId, categoryId: categoryId || null, dayOfMonth });
  };

  if (accounts.length === 0) {
    return <div style={{ color: THEME.muted, fontSize: 13, fontFamily: 'Inter, sans-serif' }}>Сначала добавьте хотя бы один счёт.</div>;
  }

  return (
    <div>
      <label style={fieldLabel()}>Название</label>
      <input style={inputStyle()} value={name} onChange={e => setName(e.target.value)} placeholder="Например, Подписка Netflix" />

      <label style={{ ...fieldLabel(), marginTop: 14 }}>Сумма</label>
      <input style={inputStyle()} type="number" inputMode="decimal" value={amount} onChange={e => setAmount(e.target.value)} placeholder="0" />

      <label style={{ ...fieldLabel(), marginTop: 14 }}>Списывать со счёта</label>
      <select style={inputStyle()} value={accountId} onChange={e => setAccountId(e.target.value)}>
        {accounts.map(a => <option key={a.id} value={a.id}>{a.name}</option>)}
      </select>

      <label style={{ ...fieldLabel(), marginTop: 14 }}>День списания (число месяца)</label>
      <input style={inputStyle()} type="number" min="1" max="31" value={dayOfMonth} onChange={e => setDayOfMonth(e.target.value)} placeholder="1" />

      <label style={{ ...fieldLabel(), marginTop: 14 }}>Категория (необязательно)</label>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
        <button className="tap-scale" type="button" onClick={() => setCategoryId('')} style={{
          padding: '7px 12px', borderRadius: 999, cursor: 'pointer',
          border: `1px solid ${!categoryId ? THEME.blueSoft : THEME.border}`,
          background: !categoryId ? 'rgba(61,127,255,0.15)' : THEME.surface2,
          color: !categoryId ? THEME.text : THEME.muted, fontSize: 12.5, fontFamily: 'Inter, sans-serif',
        }}>Без категории</button>
        {categories.map(c => {
          const active = categoryId === c.id;
          const Icon = c.icon;
          return (
            <button key={c.id} className="tap-scale" type="button" onClick={() => setCategoryId(c.id)} style={{
              padding: '7px 12px', borderRadius: 999, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6,
              border: `1px solid ${active ? c.color : THEME.border}`,
              background: active ? `${c.color}22` : THEME.surface2,
              color: active ? THEME.text : THEME.muted, fontSize: 12.5, fontFamily: 'Inter, sans-serif',
            }}>
              <Icon size={13} color={c.color} /> {c.label}
            </button>
          );
        })}
      </div>

      <button className="tap-scale" style={submitBtn()} onClick={submit} type="button">{initial ? 'Сохранить' : 'Добавить платёж'}</button>
    </div>
  );
}

function EditAccountModal({ account, onClose, onSave }) {
  const [name, setName] = useState(account ? account.name : '');
  const [type, setType] = useState(account ? account.type : 'card');
  const [balance, setBalance] = useState(account ? String(account.balance) : '');
  if (!account) return null;
  const submit = () => { if (!name.trim()) return; onSave({ name: name.trim(), type, balance }); onClose(); };
  return (
    <ModalShell title="Изменить счёт" onClose={onClose}>
      <label style={fieldLabel()}>Название</label>
      <input style={inputStyle()} value={name} onChange={e => setName(e.target.value)} />
      <label style={{ ...fieldLabel(), marginTop: 14 }}>Тип</label>
      <div style={{ display: 'flex', gap: 8 }}>
        {Object.entries(ACCOUNT_TYPES).map(([key, meta]) => {
          const active = type === key;
          return (
            <button key={key} className="tap-scale" type="button" onClick={() => setType(key)} style={{
              flex: 1, padding: '12px 0', borderRadius: 14, cursor: 'pointer',
              border: `1px solid ${active ? THEME.blueSoft : THEME.border}`,
              background: active ? 'rgba(61,127,255,0.15)' : THEME.surface2,
              display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6,
              color: active ? THEME.text : THEME.muted,
            }}>
              <GlassIcon icon={meta.icon} color={active ? THEME.blueSoft : THEME.muted} size={30} iconSize={14} />
              <span style={{ fontSize: 11, fontFamily: 'Inter, sans-serif' }}>{meta.label}</span>
            </button>
          );
        })}
      </div>
      <label style={{ ...fieldLabel(), marginTop: 14 }}>Баланс</label>
      <input style={inputStyle()} type="number" inputMode="decimal" value={balance} onChange={e => setBalance(e.target.value)} />
      <button className="tap-scale" style={submitBtn()} onClick={submit}>Сохранить</button>
    </ModalShell>
  );
}

function EditTransactionModal({ tx, accounts, categories, onClose, onSave }) {
  const [accountId, setAccountId] = useState(tx ? tx.accountId : '');
  const [category, setCategory] = useState(tx ? tx.category : '');
  const [amount, setAmount] = useState(tx ? String(tx.amount) : '');
  const [note, setNote] = useState(tx && tx.note ? tx.note : '');
  const [date, setDate] = useState(tx ? tx.date : todayISO());
  if (!tx) return null;

  const submit = () => {
    if (!Number(amount) || !accountId) return;
    onSave({ accountId, category, amount, note, date });
    onClose();
  };

  return (
    <ModalShell title={tx.type === 'income' ? 'Изменить доход' : 'Изменить расход'} onClose={onClose}>
      <label style={fieldLabel()}>Счёт</label>
      <select style={inputStyle()} value={accountId} onChange={e => setAccountId(e.target.value)}>
        {accounts.map(a => <option key={a.id} value={a.id}>{a.name}</option>)}
      </select>
      <label style={{ ...fieldLabel(), marginTop: 14 }}>Категория</label>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
        {categories.map(c => {
          const active = category === c.id;
          const Icon = c.icon;
          return (
            <button key={c.id} className="tap-scale" type="button" onClick={() => setCategory(c.id)} style={{
              padding: '7px 12px', borderRadius: 999, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6,
              border: `1px solid ${active ? c.color : THEME.border}`,
              background: active ? `${c.color}22` : THEME.surface2,
              color: active ? THEME.text : THEME.muted, fontSize: 12.5, fontFamily: 'Inter, sans-serif',
            }}>
              <Icon size={13} color={c.color} /> {c.label}
            </button>
          );
        })}
      </div>
      <label style={{ ...fieldLabel(), marginTop: 14 }}>Сумма</label>
      <input style={inputStyle()} type="number" inputMode="decimal" value={amount} onChange={e => setAmount(e.target.value)} />
      <label style={{ ...fieldLabel(), marginTop: 14 }}>Дата</label>
      <input style={inputStyle()} type="date" value={date} onChange={e => setDate(e.target.value)} />
      <label style={{ ...fieldLabel(), marginTop: 14 }}>Заметка</label>
      <input style={inputStyle()} value={note} onChange={e => setNote(e.target.value)} />
      <button className="tap-scale" style={submitBtn()} onClick={submit}>Сохранить</button>
    </ModalShell>
  );
}

function CategoryManageModal({ expenseCategories, incomeCategories, customCategories, onRename, onDelete, onClose }) {
  const [editing, setEditing] = useState(null);
  const customIds = new Set(customCategories.map(c => c.id));

  if (editing) {
    return (
      <ModalShell title="Изменить категорию" onClose={onClose}>
        <BackLink onClick={() => setEditing(null)} />
        <CategoryEditForm
          category={editing}
          onSubmit={(data) => { onRename(editing.id, data); setEditing(null); }}
        />
      </ModalShell>
    );
  }

  return (
    <ModalShell title="Категории" onClose={onClose}>
      <label style={fieldLabel()}>Расходы</label>
      <CategoryList categories={expenseCategories} customIds={customIds} onEdit={setEditing} onDelete={onDelete} />
      <label style={{ ...fieldLabel(), marginTop: 18 }}>Доходы</label>
      <CategoryList categories={incomeCategories} customIds={customIds} onEdit={setEditing} onDelete={onDelete} />
    </ModalShell>
  );
}

function CategoryList({ categories, customIds, onEdit, onDelete }) {
  const [confirmId, setConfirmId] = useState(null);
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 6, marginBottom: 4 }}>
      {categories.filter(c => c.id !== 'goal').map(c => {
        const editable = customIds.has(c.id);
        const Icon = c.icon;
        return (
          <div key={c.id} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px 10px', borderRadius: 12, background: THEME.surface2, border: `1px solid ${THEME.border}` }}>
            <GlassIcon icon={Icon} color={c.color} size={30} iconSize={14} />
            <span style={{ flex: 1, minWidth: 0, color: THEME.text, fontSize: 12.5, fontFamily: 'Inter, sans-serif', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{c.label}</span>
            {editable ? (
              <>
                <button className="tap-scale" onClick={() => onEdit(c)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: THEME.mutedDim, padding: 2 }}>
                  <Pencil size={13} />
                </button>
                <button
                  className="tap-scale"
                  onClick={() => confirmId === c.id ? onDelete(c.id) : setConfirmId(c.id)}
                  onBlur={() => setConfirmId(null)}
                  style={{ background: 'none', border: 'none', cursor: 'pointer', color: confirmId === c.id ? THEME.red : THEME.mutedDim, padding: 2 }}
                >
                  <Trash2 size={13} />
                </button>
              </>
            ) : (
              <span style={{ color: THEME.mutedDim, fontSize: 10.5, fontFamily: 'Inter, sans-serif' }}>встроенная</span>
            )}
          </div>
        );
      })}
    </div>
  );
}

function CategoryEditForm({ category, onSubmit }) {
  const [label, setLabel] = useState(category.label);
  const foundKey = Object.entries(ICON_MAP).find(([, icon]) => icon === category.icon);
  const [iconKey, setIconKey] = useState(foundKey ? foundKey[0] : 'tag');
  const submit = () => { if (!label.trim()) return; onSubmit({ label: label.trim(), iconKey }); };
  return (
    <div>
      <label style={fieldLabel()}>Название</label>
      <input style={inputStyle()} value={label} onChange={e => setLabel(e.target.value)} />
      <label style={{ ...fieldLabel(), marginTop: 14 }}>Иконка</label>
      <IconPicker value={iconKey} onChange={setIconKey} />
      <button className="tap-scale" style={submitBtn()} onClick={submit} type="button">Сохранить</button>
    </div>
  );
}
