// ─────────────────────────────────────────────────────────────────────────────
// Demo seed data. Only loaded/used when environment.demoMode === true.
// Produces a realistic-looking restaurant so the Netlify demo feels alive on
// first load: mixed table statuses, active orders, kitchen queue across all
// three statuses, a full menu, customers, and a few completed bills that feed
// the dashboard/finance numbers.
// ─────────────────────────────────────────────────────────────────────────────
import { DiningTable, Order, OrderItem } from '../models/order.model';
import { MenuCategory, MenuItem } from '../models/menu.model';
import { RestaurantInfo, SubscriptionInfo, User } from '../models/user.model';
import { ExpenseCategory, Expense, EmployeeSalary, OwnerWithdrawal } from '../models/finance.model';

export interface DemoState {
  tables: DiningTable[];
  categories: MenuCategory[];
  items: MenuItem[];
  orders: Order[];       // all orders — active (OPEN), BILLED, and PAID history
  customers: { id: number; name: string; phone: string; visits: number; lastVisit: string }[];
  expenseCategories: ExpenseCategory[];
  expenses: Expense[];
  employees: EmployeeSalary[];
  withdrawals: OwnerWithdrawal[];
  seq: number;           // id sequence for newly created entities
}

// ── Date helpers (relative to "now" so the demo always looks current) ────────
const now = () => new Date();
const iso = (d: Date) => d.toISOString();
const minutesAgo = (m: number) => iso(new Date(Date.now() - m * 60_000));
const hoursAgo   = (h: number) => iso(new Date(Date.now() - h * 3_600_000));
const daysAgo    = (d: number) => iso(new Date(Date.now() - d * 86_400_000));
const todayAt = (h: number, min = 0) => {
  const d = now(); d.setHours(h, min, 0, 0); return iso(d);
};

// ── Demo identity (skips login; makes all guards pass as OWNER) ──────────────
export const DEMO_USER: User = {
  id: 1,
  username: 'demo',
  fullName: 'Demo Owner',
  role: 'OWNER',
  restaurantId: 1,
  active: true
};

export const DEMO_RESTAURANT: RestaurantInfo = {
  id: 1,
  name: 'Spice Garden Restaurant',
  address: '42 MG Road, Bengaluru, Karnataka 560001',
  phone: '+91 98450 12345',
  upiId: '7391818018@yescred',
  gstNumber: '29ABCDE1234F1Z5',
  logoUrl: '',
  enabledRoles: ['OWNER', 'MANAGER', 'WAITER', 'CHEF']
};

export const DEMO_SUBSCRIPTION: SubscriptionInfo = {
  planType: 'YEARLY',
  startDate: daysAgo(120),
  expiryDate: daysAgo(-245),   // ~245 days remaining
  status: 'ACTIVE',
  daysRemaining: 245
};

// A syntactically valid JWT (header.payload.signature) with a far-future `exp`
// so AuthService.isAuthenticated() passes. Signature is a dummy — nothing
// verifies it in demo mode because no backend is contacted.
function buildDemoJwt(): string {
  const b64url = (obj: unknown) =>
    btoa(JSON.stringify(obj)).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
  const header  = { alg: 'HS256', typ: 'JWT' };
  const payload = {
    sub: 'demo',
    role: 'OWNER',
    // expires ~1 year out
    exp: Math.floor(Date.now() / 1000) + 365 * 24 * 60 * 60,
    iat: Math.floor(Date.now() / 1000)
  };
  return `${b64url(header)}.${b64url(payload)}.demo-signature-not-verified`;
}
export const DEMO_TOKEN = buildDemoJwt();

// ── Menu ─────────────────────────────────────────────────────────────────────
const categories: MenuCategory[] = [
  { id: 1, name: 'Starters',       categoryType: 'STARTERS',     displayOrder: 1, active: true },
  { id: 2, name: 'Main Course',    categoryType: 'MAINS',        displayOrder: 2, active: true },
  { id: 3, name: 'Breads',         categoryType: 'BREADS',       displayOrder: 3, active: true },
  { id: 4, name: 'Rice & Biryani', categoryType: 'RICE_BIRYANI', displayOrder: 4, active: true },
  { id: 5, name: 'Desserts',       categoryType: 'DESSERTS',     displayOrder: 5, active: true },
  { id: 6, name: 'Beverages',      categoryType: 'DRINKS',       displayOrder: 6, active: true }
];

const items: MenuItem[] = [
  // Starters
  { id: 101, name: 'Paneer Tikka',        description: 'Char-grilled cottage cheese, mint chutney', price: 260, foodType: 'VEG',     categoryId: 1, categoryName: 'Starters', available: true, displayOrder: 1, preparationTimeMinutes: 15 },
  { id: 102, name: 'Chicken 65',          description: 'Spicy deep-fried chicken bites',            price: 290, foodType: 'NON_VEG', categoryId: 1, categoryName: 'Starters', available: true, displayOrder: 2, preparationTimeMinutes: 15 },
  { id: 103, name: 'Veg Spring Rolls',    description: 'Crispy rolls with sweet chilli dip',        price: 190, foodType: 'VEG',     categoryId: 1, categoryName: 'Starters', available: true, displayOrder: 3, preparationTimeMinutes: 12 },
  { id: 104, name: 'Chilli Gobi',         description: 'Cauliflower tossed in Indo-Chinese sauce',  price: 220, foodType: 'VEG',     categoryId: 1, categoryName: 'Starters', available: true, displayOrder: 4, preparationTimeMinutes: 14 },
  // Main Course
  { id: 201, name: 'Butter Chicken',      description: 'Creamy tomato gravy, tandoori chicken',     price: 340, foodType: 'NON_VEG', categoryId: 2, categoryName: 'Main Course', available: true, displayOrder: 1, preparationTimeMinutes: 20 },
  { id: 202, name: 'Paneer Butter Masala',description: 'Rich makhani gravy with paneer',            price: 300, foodType: 'VEG',     categoryId: 2, categoryName: 'Main Course', available: true, displayOrder: 2, preparationTimeMinutes: 18 },
  { id: 203, name: 'Dal Makhani',         description: 'Slow-cooked black lentils',                 price: 240, foodType: 'VEG',     categoryId: 2, categoryName: 'Main Course', available: true, displayOrder: 3, preparationTimeMinutes: 16 },
  { id: 204, name: 'Mutton Rogan Josh',   description: 'Kashmiri-style slow-cooked mutton',         price: 420, foodType: 'NON_VEG', categoryId: 2, categoryName: 'Main Course', available: true, displayOrder: 4, preparationTimeMinutes: 25 },
  // Breads
  { id: 301, name: 'Butter Naan',         description: 'Soft tandoor naan with butter',             price: 60,  foodType: 'VEG',     categoryId: 3, categoryName: 'Breads', available: true, displayOrder: 1, preparationTimeMinutes: 6 },
  { id: 302, name: 'Garlic Naan',         description: 'Naan topped with garlic & coriander',       price: 75,  foodType: 'VEG',     categoryId: 3, categoryName: 'Breads', available: true, displayOrder: 2, preparationTimeMinutes: 6 },
  { id: 303, name: 'Tandoori Roti',       description: 'Whole wheat tandoor roti',                  price: 40,  foodType: 'VEG',     categoryId: 3, categoryName: 'Breads', available: true, displayOrder: 3, preparationTimeMinutes: 5 },
  // Rice & Biryani
  { id: 401, name: 'Chicken Biryani',     description: 'Hyderabadi dum biryani, raita',             price: 320, foodType: 'NON_VEG', categoryId: 4, categoryName: 'Rice & Biryani', available: true, displayOrder: 1, preparationTimeMinutes: 22 },
  { id: 402, name: 'Veg Biryani',         description: 'Fragrant basmati with vegetables',          price: 260, foodType: 'VEG',     categoryId: 4, categoryName: 'Rice & Biryani', available: true, displayOrder: 2, preparationTimeMinutes: 20 },
  { id: 403, name: 'Jeera Rice',          description: 'Basmati tempered with cumin',               price: 160, foodType: 'VEG',     categoryId: 4, categoryName: 'Rice & Biryani', available: true, displayOrder: 3, preparationTimeMinutes: 10 },
  // Desserts
  { id: 501, name: 'Gulab Jamun',         description: 'Two pieces, warm sugar syrup',              price: 110, foodType: 'VEG',     categoryId: 5, categoryName: 'Desserts', available: true, displayOrder: 1, preparationTimeMinutes: 5 },
  { id: 502, name: 'Gajar Ka Halwa',      description: 'Slow-cooked carrot pudding',                price: 140, foodType: 'VEG',     categoryId: 5, categoryName: 'Desserts', available: true, displayOrder: 2, preparationTimeMinutes: 5 },
  // Beverages
  { id: 601, name: 'Masala Chai',         description: 'Spiced Indian tea',                         price: 40,  foodType: 'VEG',     categoryId: 6, categoryName: 'Beverages', available: true, displayOrder: 1, preparationTimeMinutes: 5 },
  { id: 602, name: 'Sweet Lassi',         description: 'Chilled yogurt drink',                      price: 90,  foodType: 'VEG',     categoryId: 6, categoryName: 'Beverages', available: true, displayOrder: 2, preparationTimeMinutes: 4 },
  { id: 603, name: 'Fresh Lime Soda',     description: 'Sweet & salted, sparkling',                 price: 70,  foodType: 'VEG',     categoryId: 6, categoryName: 'Beverages', available: true, displayOrder: 3, preparationTimeMinutes: 3 }
];

// ── Helpers for building order items with correct totals ─────────────────────
function line(itemId: number, qty: number, oiId: number, kitchen: OrderItem['kitchenStatus'] = 'PENDING'): OrderItem {
  const mi = items.find(i => i.id === itemId)!;
  return {
    id: oiId,
    menuItemId: mi.id,
    menuItemName: mi.name,
    quantity: qty,
    unitPrice: mi.price,
    totalPrice: mi.price * qty,
    foodType: mi.foodType,
    kitchenStatus: kitchen
  };
}

function totals(orderItems: OrderItem[], discountPercent = 0, taxPercent = 5) {
  const subtotal = orderItems.reduce((s, i) => s + i.totalPrice, 0);
  const discountAmount = +(subtotal * discountPercent / 100).toFixed(2);
  const taxable = subtotal - discountAmount;
  const taxAmount = +(taxable * taxPercent / 100).toFixed(2);
  const totalAmount = +(taxable + taxAmount).toFixed(2);
  return { subtotal, discountAmount, taxAmount, totalAmount };
}

// ── Tables (10, mixed statuses) ──────────────────────────────────────────────
const tables: DiningTable[] = [
  { id: 1,  tableNumber: 'T1',  capacity: 2, status: 'OCCUPIED',  activeOrderId: 1001, floor: 'Ground' },
  { id: 2,  tableNumber: 'T2',  capacity: 4, status: 'OCCUPIED',  activeOrderId: 1002, floor: 'Ground' },
  { id: 3,  tableNumber: 'T3',  capacity: 4, status: 'AVAILABLE', floor: 'Ground' },
  { id: 4,  tableNumber: 'T4',  capacity: 6, status: 'OCCUPIED',  activeOrderId: 1003, floor: 'Ground' },
  { id: 5,  tableNumber: 'T5',  capacity: 2, status: 'AVAILABLE', floor: 'Ground' },
  { id: 6,  tableNumber: 'T6',  capacity: 4, status: 'BILLED',    activeOrderId: 1004, floor: 'First' },
  { id: 7,  tableNumber: 'T7',  capacity: 8, status: 'OCCUPIED',  activeOrderId: 1005, floor: 'First' },
  { id: 8,  tableNumber: 'T8',  capacity: 4, status: 'AVAILABLE', floor: 'First' },
  { id: 9,  tableNumber: 'T9',  capacity: 2, status: 'AVAILABLE', floor: 'First' },
  { id: 10, tableNumber: 'T10', capacity: 4, status: 'AVAILABLE', floor: 'First' }
];

// ── Active orders (feed Tables + Kitchen) ────────────────────────────────────
function buildActiveOrders(): Order[] {
  const list: Order[] = [];

  // Order 1001 — T1, all PENDING (fresh, just sent to kitchen)
  {
    const its = [line(201, 2, 1), line(301, 4, 2), line(602, 2, 3)];
    const t = totals(its);
    list.push({
      id: 1001, tableId: 1, tableNumber: 'T1', status: 'OPEN', items: its,
      ...t, discountPercent: 0, taxPercent: 5,
      customerName: 'Rahul Sharma', guestCount: 2,
      createdAt: minutesAgo(8), updatedAt: minutesAgo(8), servedBy: 'Demo Owner'
    });
  }
  // Order 1002 — T2, mix of COOKING + PENDING
  {
    const its = [line(401, 2, 4, 'COOKING'), line(102, 1, 5, 'COOKING'), line(603, 3, 6, 'PENDING')];
    const t = totals(its);
    list.push({
      id: 1002, tableId: 2, tableNumber: 'T2', status: 'OPEN', items: its,
      ...t, discountPercent: 0, taxPercent: 5,
      customerName: 'Priya Nair', guestCount: 4,
      createdAt: minutesAgo(18), updatedAt: minutesAgo(6), servedBy: 'Demo Owner'
    });
  }
  // Order 1003 — T4, some READY (ready to serve)
  {
    const its = [line(202, 2, 7, 'READY'), line(302, 3, 8, 'READY'), line(203, 1, 9, 'COOKING'), line(501, 2, 10, 'PENDING')];
    const t = totals(its);
    list.push({
      id: 1003, tableId: 4, tableNumber: 'T4', status: 'OPEN', items: its,
      ...t, discountPercent: 0, taxPercent: 5,
      customerName: 'Anil Kumar', guestCount: 5,
      createdAt: minutesAgo(32), updatedAt: minutesAgo(4), servedBy: 'Demo Owner'
    });
  }
  // Order 1005 — T7, large party, mixed
  {
    const its = [line(204, 2, 11, 'COOKING'), line(401, 3, 12, 'PENDING'), line(301, 6, 13, 'PENDING'), line(602, 4, 14, 'READY')];
    const t = totals(its);
    list.push({
      id: 1005, tableId: 7, tableNumber: 'T7', status: 'OPEN', items: its,
      ...t, discountPercent: 0, taxPercent: 5,
      customerName: 'Farhan Qureshi', guestCount: 8,
      createdAt: minutesAgo(25), updatedAt: minutesAgo(3), servedBy: 'Demo Owner'
    });
  }

  // Order 1004 — T6, already BILLED (awaiting payment) so the flow's tail is visible
  {
    const its = [line(201, 1, 15, 'READY'), line(402, 1, 16, 'READY'), line(302, 2, 17, 'READY'), line(501, 2, 18, 'READY')];
    const t = totals(its, 5, 5);
    list.push({
      id: 1004, tableId: 6, tableNumber: 'T6', status: 'BILLED', items: its,
      ...t, discountPercent: 5, taxPercent: 5,
      customerName: 'Sneha Reddy', customerPhone: '9845098450', guestCount: 3,
      createdAt: hoursAgo(1), updatedAt: minutesAgo(10), billedAt: minutesAgo(10),
      paymentMethod: 'UPI', servedBy: 'Demo Owner', billedBy: 'Demo Owner'
    });
  }

  return list;
}

// ── Completed/paid bills (feed dashboard + billing history + finance) ────────
function buildPaidHistory(): Order[] {
  const paid: Order[] = [];
  let oiId = 2000;
  const push = (
    id: number, tableId: number, tableNumber: string,
    lines: [number, number][], method: Order['paymentMethod'],
    createdAtIso: string, paidAtIso: string, name?: string
  ) => {
    const its = lines.map(([mi, q]) => line(mi, q, ++oiId, 'READY'));
    const t = totals(its, 0, 5);
    paid.push({
      id, tableId, tableNumber, status: 'PAID', items: its,
      ...t, discountPercent: 0, taxPercent: 5,
      customerName: name, guestCount: 2,
      createdAt: createdAtIso, updatedAt: paidAtIso, billedAt: paidAtIso, paidAt: paidAtIso,
      paymentMethod: method, servedBy: 'Demo Owner', billedBy: 'Demo Owner'
    });
  };

  // Today's completed bills (drive todaySales / todayOrders)
  push(900, 3, 'T3', [[201, 2], [301, 4], [602, 2]], 'CASH', todayAt(12, 10), todayAt(12, 55), 'Walk-in');
  push(901, 5, 'T5', [[401, 1], [603, 2], [501, 2]], 'UPI',  todayAt(13, 5),  todayAt(13, 40), 'Vikram S');
  push(902, 8, 'T8', [[202, 2], [203, 1], [302, 4], [601, 2]], 'CARD', todayAt(13, 30), todayAt(14, 20), 'Meera J');
  push(903, 9, 'T9', [[102, 1], [104, 1], [602, 2]], 'UPI',  todayAt(14, 0),  todayAt(14, 35), 'Walk-in');
  push(904, 1, 'T1', [[401, 2], [301, 4], [501, 2], [602, 3]], 'CASH', todayAt(11, 15), todayAt(12, 5), 'Ravi Teja');

  // A couple from earlier days (billing history depth)
  push(890, 4, 'T4', [[204, 2], [401, 2], [302, 4]], 'UPI',  daysAgo(1), daysAgo(1), 'Deepak M');
  push(891, 7, 'T7', [[201, 3], [202, 2], [603, 4], [501, 4]], 'CARD', daysAgo(2), daysAgo(2), 'Corporate');

  return paid;
}

// ── Finance seed ─────────────────────────────────────────────────────────────
const expenseCategories: ExpenseCategory[] = [
  { id: 1, name: 'Groceries',   icon: 'shopping_cart', predefined: true, active: true },
  { id: 2, name: 'Vegetables',  icon: 'eco',           predefined: true, active: true },
  { id: 3, name: 'Gas & Fuel',  icon: 'local_fire_department', predefined: true, active: true },
  { id: 4, name: 'Electricity', icon: 'bolt',          predefined: true, active: true },
  { id: 5, name: 'Maintenance', icon: 'build',         predefined: true, active: true }
];

const expenses: Expense[] = [
  { id: 1, categoryId: 1, categoryName: 'Groceries',   categoryIcon: 'shopping_cart', amount: 4200, description: 'Weekly grocery restock', paymentMethod: 'CASH', expenseDate: daysAgo(1), recordedBy: 'Demo Owner', createdAt: daysAgo(1) },
  { id: 2, categoryId: 2, categoryName: 'Vegetables',  categoryIcon: 'eco',           amount: 1850, description: 'Daily vegetables',        paymentMethod: 'CASH', expenseDate: daysAgo(0), recordedBy: 'Demo Owner', createdAt: daysAgo(0) },
  { id: 3, categoryId: 3, categoryName: 'Gas & Fuel',  categoryIcon: 'local_fire_department', amount: 2400, description: 'LPG cylinders x2', paymentMethod: 'UPI', expenseDate: daysAgo(3), recordedBy: 'Demo Owner', createdAt: daysAgo(3) },
  { id: 4, categoryId: 4, categoryName: 'Electricity', categoryIcon: 'bolt',          amount: 6800, description: 'Monthly bill',            paymentMethod: 'UPI',  expenseDate: daysAgo(6), recordedBy: 'Demo Owner', createdAt: daysAgo(6) }
];

const employees: EmployeeSalary[] = [
  { id: 1, cloudUserId: 11, employeeName: 'Suresh (Head Chef)', role: 'CHEF',    baseSalary: 28000, effectiveFrom: daysAgo(200), active: true, paidThisMonth: true,  paidThisMonthAmount: 28000 },
  { id: 2, cloudUserId: 12, employeeName: 'Kavya (Manager)',    role: 'MANAGER', baseSalary: 32000, effectiveFrom: daysAgo(200), active: true, paidThisMonth: true,  paidThisMonthAmount: 32000 },
  { id: 3, cloudUserId: 13, employeeName: 'Ramesh (Waiter)',    role: 'WAITER',  baseSalary: 18000, effectiveFrom: daysAgo(90),  active: true, paidThisMonth: false }
];

const withdrawals: OwnerWithdrawal[] = [
  { id: 1, amount: 15000, reason: 'Personal draw', withdrawalDate: daysAgo(10), paymentMethod: 'UPI', recordedBy: 'Demo Owner', createdAt: daysAgo(10) }
];

const customers = [
  { id: 1, name: 'Rahul Sharma',  phone: '9845011111', visits: 12, lastVisit: daysAgo(0) },
  { id: 2, name: 'Priya Nair',    phone: '9845022222', visits: 8,  lastVisit: daysAgo(0) },
  { id: 3, name: 'Anil Kumar',    phone: '9845033333', visits: 21, lastVisit: daysAgo(0) },
  { id: 4, name: 'Sneha Reddy',   phone: '9845098450', visits: 5,  lastVisit: daysAgo(1) },
  { id: 5, name: 'Farhan Qureshi',phone: '9845044444', visits: 3,  lastVisit: daysAgo(0) },
  { id: 6, name: 'Deepak M',      phone: '9845055555', visits: 15, lastVisit: daysAgo(1) }
];

export function buildDemoState(): DemoState {
  const active = buildActiveOrders();
  const paid   = buildPaidHistory();
  return {
    tables: JSON.parse(JSON.stringify(tables)),
    categories: JSON.parse(JSON.stringify(categories)),
    items: JSON.parse(JSON.stringify(items)),
    orders: [...active, ...paid],
    customers: JSON.parse(JSON.stringify(customers)),
    expenseCategories: JSON.parse(JSON.stringify(expenseCategories)),
    expenses: JSON.parse(JSON.stringify(expenses)),
    employees: JSON.parse(JSON.stringify(employees)),
    withdrawals: JSON.parse(JSON.stringify(withdrawals)),
    seq: 5000
  };
}
