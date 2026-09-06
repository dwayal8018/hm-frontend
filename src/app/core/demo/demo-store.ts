// ─────────────────────────────────────────────────────────────────────────────
// In-memory demo data store, persisted to localStorage so changes survive
// navigation and refresh. Only used when environment.demoMode === true.
// Holds ALL mutation logic for the demo so the interceptor stays a thin router.
// ─────────────────────────────────────────────────────────────────────────────
import { DemoState, buildDemoState } from './demo-seed';
import { DiningTable, Order, OrderItem, AddItemRequest, BillRequest } from '../models/order.model';
import { MenuCategory, MenuItem } from '../models/menu.model';
import {
  DashboardSummary, SalesReport, RecentOrder, TopSellingItem, SalesByCategory, HourlySale, DailySale
} from '../models/dashboard.model';
import { FinanceSummary } from '../models/finance.model';

const STATE_KEY = 'hm_demo_state';

export class DemoStore {
  private state: DemoState;

  constructor() {
    this.state = this.load();
  }

  // ── Persistence ────────────────────────────────────────────────────────────
  private load(): DemoState {
    try {
      const raw = localStorage.getItem(STATE_KEY);
      if (raw) return JSON.parse(raw) as DemoState;
    } catch { /* fall through to fresh seed */ }
    const fresh = buildDemoState();
    this.persist(fresh);
    return fresh;
  }

  private persist(s: DemoState = this.state): void {
    try { localStorage.setItem(STATE_KEY, JSON.stringify(s)); } catch { /* ignore quota */ }
  }

  reset(): void {
    this.state = buildDemoState();
    this.persist();
  }

  private nextId(): number { return ++this.state.seq; }

  // ── Tables ───────────────────────────────────────────────────────────────
  getTables(): DiningTable[] { return this.state.tables; }
  getTable(id: number): DiningTable | undefined { return this.state.tables.find(t => t.id === id); }

  createTable(body: Partial<DiningTable>): DiningTable {
    const table: DiningTable = {
      id: this.nextId(),
      tableNumber: body.tableNumber ?? `T${this.state.tables.length + 1}`,
      capacity: body.capacity ?? 4,
      status: body.status ?? 'AVAILABLE',
      floor: body.floor,
      activeOrderId: body.activeOrderId
    };
    this.state.tables.push(table);
    this.persist();
    return table;
  }

  updateTable(id: number, body: Partial<DiningTable>): DiningTable | undefined {
    const t = this.getTable(id);
    if (!t) return undefined;
    Object.assign(t, body);
    this.persist();
    return t;
  }

  deleteTable(id: number): void {
    this.state.tables = this.state.tables.filter(t => t.id !== id);
    this.persist();
  }

  // ── Menu ───────────────────────────────────────────────────────────────────
  getCategories(): MenuCategory[] {
    return this.state.categories.map(c => ({
      ...c,
      itemCount: this.state.items.filter(i => i.categoryId === c.id).length
    }));
  }
  getItems(categoryId?: number): MenuItem[] {
    return categoryId ? this.state.items.filter(i => i.categoryId === categoryId) : this.state.items;
  }
  getItem(id: number): MenuItem | undefined { return this.state.items.find(i => i.id === id); }
  searchItems(q: string): MenuItem[] {
    const query = (q || '').toLowerCase();
    return this.state.items.filter(i => i.name.toLowerCase().includes(query));
  }
  createCategory(body: Partial<MenuCategory>): MenuCategory {
    const cat: MenuCategory = {
      id: this.nextId(),
      name: body.name ?? 'New Category',
      categoryType: body.categoryType ?? 'CUSTOM',
      displayOrder: body.displayOrder ?? this.state.categories.length + 1,
      active: body.active ?? true
    };
    this.state.categories.push(cat);
    this.persist();
    return cat;
  }
  updateCategory(id: number, body: Partial<MenuCategory>): MenuCategory | undefined {
    const c = this.state.categories.find(x => x.id === id);
    if (!c) return undefined;
    Object.assign(c, body);
    this.persist();
    return c;
  }
  deleteCategory(id: number): void {
    this.state.categories = this.state.categories.filter(c => c.id !== id);
    this.persist();
  }
  createItem(body: Partial<MenuItem>): MenuItem {
    const cat = this.state.categories.find(c => c.id === body.categoryId);
    const item: MenuItem = {
      id: this.nextId(),
      name: body.name ?? 'New Item',
      description: body.description,
      price: body.price ?? 0,
      foodType: body.foodType ?? 'VEG',
      categoryId: body.categoryId ?? this.state.categories[0]?.id ?? 1,
      categoryName: cat?.name,
      available: body.available ?? true,
      displayOrder: body.displayOrder ?? 99,
      preparationTimeMinutes: body.preparationTimeMinutes,
      tags: body.tags
    };
    this.state.items.push(item);
    this.persist();
    return item;
  }
  updateItem(id: number, body: Partial<MenuItem>): MenuItem | undefined {
    const it = this.getItem(id);
    if (!it) return undefined;
    Object.assign(it, body);
    if (body.categoryId) it.categoryName = this.state.categories.find(c => c.id === body.categoryId)?.name;
    this.persist();
    return it;
  }
  toggleAvailability(id: number, available: boolean): MenuItem | undefined {
    const it = this.getItem(id);
    if (!it) return undefined;
    it.available = available;
    this.persist();
    return it;
  }
  deleteItem(id: number): void {
    this.state.items = this.state.items.filter(i => i.id !== id);
    this.persist();
  }

  // ── Orders ───────────────────────────────────────────────────────────────
  getActiveOrders(): Order[] { return this.state.orders.filter(o => o.status === 'OPEN'); }
  getOrder(id: number): Order | undefined { return this.state.orders.find(o => o.id === id); }
  getOpenOrderByTable(tableId: number): Order | undefined {
    return this.state.orders.find(o => o.tableId === tableId && o.status === 'OPEN');
  }

  private recalc(order: Order): void {
    order.subtotal = order.items.reduce((s, i) => s + i.totalPrice, 0);
    order.discountAmount = +(order.subtotal * (order.discountPercent || 0) / 100).toFixed(2);
    const taxable = order.subtotal - order.discountAmount;
    order.taxAmount = +(taxable * (order.taxPercent || 0) / 100).toFixed(2);
    order.totalAmount = +(taxable + order.taxAmount).toFixed(2);
    order.updatedAt = new Date().toISOString();
  }

  addItem(req: AddItemRequest): Order {
    let order = req.orderId ? this.getOrder(req.orderId) : this.getOpenOrderByTable(req.tableId);
    const table = this.getTable(req.tableId);

    // Create a new open order if none exists for this table
    if (!order) {
      order = {
        id: this.nextId(),
        tableId: req.tableId,
        tableNumber: table?.tableNumber ?? `T${req.tableId}`,
        status: 'OPEN',
        items: [],
        subtotal: 0, discountAmount: 0, discountPercent: 0,
        taxAmount: 0, taxPercent: 5, totalAmount: 0,
        guestCount: 2,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        servedBy: 'Demo Owner'
      };
      this.state.orders.push(order);
      if (table) {
        table.status = 'OCCUPIED';
        table.activeOrderId = order.id;
      }
    }

    const mi = this.getItem(req.menuItemId);
    if (mi) {
      // If an identical PENDING line exists, bump its quantity; else add new line
      const existing = order.items.find(i => i.menuItemId === mi.id && i.kitchenStatus === 'PENDING');
      if (existing) {
        existing.quantity += req.quantity;
        existing.totalPrice = existing.unitPrice * existing.quantity;
      } else {
        order.items.push({
          id: this.nextId(),
          menuItemId: mi.id,
          menuItemName: mi.name,
          quantity: req.quantity,
          unitPrice: mi.price,
          totalPrice: mi.price * req.quantity,
          foodType: mi.foodType,
          notes: req.notes,
          kitchenStatus: 'PENDING'
        });
      }
    }
    this.recalc(order);
    this.persist();
    return order;
  }

  removeItem(orderId: number, itemId: number): Order | undefined {
    const order = this.getOrder(orderId);
    if (!order) return undefined;
    order.items = order.items.filter(i => i.id !== itemId);
    this.recalc(order);
    this.persist();
    return order;
  }

  updateItemQty(orderId: number, itemId: number, quantity: number): Order | undefined {
    const order = this.getOrder(orderId);
    if (!order) return undefined;
    const it = order.items.find(i => i.id === itemId);
    if (it) {
      it.quantity = quantity;
      it.totalPrice = it.unitPrice * quantity;
    }
    this.recalc(order);
    this.persist();
    return order;
  }

  cancelOrder(orderId: number): void {
    const order = this.getOrder(orderId);
    if (!order) return;
    order.status = 'CANCELLED';
    const table = this.getTable(order.tableId);
    if (table && table.activeOrderId === orderId) {
      table.status = 'AVAILABLE';
      table.activeOrderId = undefined;
    }
    this.persist();
  }

  // ── Billing ─────────────────────────────────────────────────────────────
  generateBill(req: BillRequest): Order | undefined {
    const order = this.getOrder(req.orderId);
    if (!order) return undefined;
    order.discountPercent = req.discountPercent ?? 0;
    order.taxPercent = req.taxPercent ?? order.taxPercent ?? 0;
    // Explicit discount amount overrides percent when provided
    if (req.discountAmount && req.discountAmount > 0) {
      order.discountAmount = req.discountAmount;
      order.subtotal = order.items.reduce((s, i) => s + i.totalPrice, 0);
      const taxable = order.subtotal - order.discountAmount;
      order.taxAmount = +(taxable * (order.taxPercent || 0) / 100).toFixed(2);
      order.totalAmount = +(taxable + order.taxAmount).toFixed(2);
    } else {
      this.recalc(order);
    }
    order.status = 'BILLED';
    order.billedAt = new Date().toISOString();
    order.paymentMethod = req.paymentMethod;
    if (req.customerName) order.customerName = req.customerName;
    if (req.customerPhone) order.customerPhone = req.customerPhone;
    order.billedBy = 'Demo Owner';
    const table = this.getTable(order.tableId);
    if (table) table.status = 'BILLED';
    this.persist();
    return order;
  }

  markPaid(orderId: number, paymentMethod: string): Order | undefined {
    const order = this.getOrder(orderId);
    if (!order) return undefined;
    order.status = 'PAID';
    order.paidAt = new Date().toISOString();
    order.paymentMethod = paymentMethod as Order['paymentMethod'];
    const table = this.getTable(order.tableId);
    if (table && table.activeOrderId === orderId) {
      table.status = 'AVAILABLE';
      table.activeOrderId = undefined;
    }
    this.persist();
    return order;
  }

  getBillHistory(page = 0, size = 20): { content: Order[]; totalElements: number; totalPages: number } {
    const all = this.state.orders
      .filter(o => o.status === 'PAID' || o.status === 'BILLED')
      .sort((a, b) => (b.billedAt || b.updatedAt).localeCompare(a.billedAt || a.updatedAt));
    const start = page * size;
    const content = all.slice(start, start + size);
    return { content, totalElements: all.length, totalPages: Math.max(1, Math.ceil(all.length / size)) };
  }

  // ── Kitchen ────────────────────────────────────────────────────────────────
  getKitchenOrders(): Order[] {
    // Orders with at least one item not yet READY
    return this.state.orders
      .filter(o => (o.status === 'OPEN' || o.status === 'BILLED') && o.items.some(i => i.kitchenStatus !== 'READY'))
      .sort((a, b) => a.createdAt.localeCompare(b.createdAt));
  }

  updateKitchenStatus(itemId: number, status: string): OrderItem | undefined {
    for (const order of this.state.orders) {
      const it = order.items.find(i => i.id === itemId);
      if (it) {
        it.kitchenStatus = status as OrderItem['kitchenStatus'];
        this.persist();
        return it;
      }
    }
    return undefined;
  }

  // ── Dashboard ────────────────────────────────────────────────────────────
  private isToday(isoStr?: string): boolean {
    if (!isoStr) return false;
    const d = new Date(isoStr); const n = new Date();
    return d.getFullYear() === n.getFullYear() && d.getMonth() === n.getMonth() && d.getDate() === n.getDate();
  }

  getDashboardSummary(): DashboardSummary {
    const paidToday = this.state.orders.filter(o => o.status === 'PAID' && this.isToday(o.paidAt));
    const todaySales = paidToday.reduce((s, o) => s + o.totalAmount, 0);
    const todayOrders = paidToday.length;
    const activeTableCount = this.state.tables.filter(t => t.status !== 'AVAILABLE').length;
    const totalTableCount = this.state.tables.length;
    const averageOrderValue = todayOrders ? +(todaySales / todayOrders).toFixed(2) : 0;

    // Top selling items (from today's paid orders)
    const itemMap = new Map<number, TopSellingItem>();
    for (const o of paidToday) {
      for (const it of o.items) {
        const cur = itemMap.get(it.menuItemId) ?? {
          menuItemId: it.menuItemId, menuItemName: it.menuItemName,
          quantitySold: 0, revenue: 0, foodType: it.foodType
        };
        cur.quantitySold += it.quantity;
        cur.revenue += it.totalPrice;
        itemMap.set(it.menuItemId, cur);
      }
    }
    const topSellingItems = [...itemMap.values()].sort((a, b) => b.quantitySold - a.quantitySold).slice(0, 5);

    const recentOrders: RecentOrder[] = [...this.state.orders]
      .filter(o => o.status === 'PAID' || o.status === 'BILLED' || o.status === 'OPEN')
      .sort((a, b) => b.updatedAt.localeCompare(a.updatedAt))
      .slice(0, 6)
      .map(o => ({
        orderId: o.id, tableNumber: o.tableNumber, totalAmount: o.totalAmount,
        status: o.status, createdAt: o.createdAt,
        itemCount: o.items.reduce((s, i) => s + i.quantity, 0)
      }));

    // Sales by category (today)
    const catMap = new Map<string, number>();
    for (const o of paidToday) {
      for (const it of o.items) {
        const mi = this.getItem(it.menuItemId);
        const cat = this.state.categories.find(c => c.id === mi?.categoryId)?.name ?? 'Other';
        catMap.set(cat, (catMap.get(cat) ?? 0) + it.totalPrice);
      }
    }
    const catTotal = [...catMap.values()].reduce((s, v) => s + v, 0) || 1;
    const salesByCategory: SalesByCategory[] = [...catMap.entries()]
      .map(([categoryName, revenue]) => ({ categoryName, revenue, percentage: +(revenue / catTotal * 100).toFixed(1) }))
      .sort((a, b) => b.revenue - a.revenue);

    // Hourly sales (today)
    const hourMap = new Map<number, { revenue: number; orderCount: number }>();
    for (const o of paidToday) {
      const h = new Date(o.paidAt!).getHours();
      const cur = hourMap.get(h) ?? { revenue: 0, orderCount: 0 };
      cur.revenue += o.totalAmount; cur.orderCount += 1;
      hourMap.set(h, cur);
    }
    const hourlySales: HourlySale[] = [...hourMap.entries()]
      .map(([hour, v]) => ({ hour, revenue: v.revenue, orderCount: v.orderCount }))
      .sort((a, b) => a.hour - b.hour);

    return {
      todaySales, todayOrders, activeTableCount, totalTableCount, averageOrderValue,
      topSellingItems, recentOrders, salesByCategory, hourlySales
    };
  }

  getSalesReport(period: string): SalesReport {
    const days = period === 'TODAY' ? 1 : period === 'WEEK' ? 7 : 30;
    const cutoff = Date.now() - days * 86_400_000;
    const paid = this.state.orders.filter(o => o.status === 'PAID' && o.paidAt && new Date(o.paidAt).getTime() >= cutoff);
    const totalRevenue = paid.reduce((s, o) => s + o.totalAmount, 0);
    const totalOrders = paid.length;
    const avgOrderValue = totalOrders ? +(totalRevenue / totalOrders).toFixed(2) : 0;

    const dayMap = new Map<string, { revenue: number; orderCount: number }>();
    for (const o of paid) {
      const key = new Date(o.paidAt!).toISOString().slice(0, 10);
      const cur = dayMap.get(key) ?? { revenue: 0, orderCount: 0 };
      cur.revenue += o.totalAmount; cur.orderCount += 1;
      dayMap.set(key, cur);
    }
    const dailyBreakdown: DailySale[] = [...dayMap.entries()]
      .map(([date, v]) => ({ date, revenue: v.revenue, orderCount: v.orderCount }))
      .sort((a, b) => a.date.localeCompare(b.date));

    const nowIso = new Date().toISOString().slice(0, 10);
    const startIso = new Date(cutoff).toISOString().slice(0, 10);
    return {
      period: period as SalesReport['period'],
      startDate: startIso, endDate: nowIso,
      totalRevenue, totalOrders, avgOrderValue, dailyBreakdown
    };
  }

  // ── Finance ────────────────────────────────────────────────────────────────
  getExpenseCategories() { return this.state.expenseCategories; }
  getExpenses() { return this.state.expenses; }
  getEmployees() { return this.state.employees; }
  getWithdrawals() { return this.state.withdrawals; }

  createExpense(body: any) {
    const cat = this.state.expenseCategories.find(c => c.id === body.categoryId);
    const exp = {
      id: this.nextId(),
      categoryId: body.categoryId,
      categoryName: cat?.name ?? 'Other',
      categoryIcon: cat?.icon ?? 'receipt',
      amount: body.amount ?? 0,
      description: body.description,
      paymentMethod: body.paymentMethod ?? 'CASH',
      expenseDate: body.expenseDate ?? new Date().toISOString(),
      recordedBy: 'Demo Owner',
      createdAt: new Date().toISOString()
    };
    this.state.expenses.unshift(exp);
    this.persist();
    return exp;
  }
  deleteExpense(id: number) {
    this.state.expenses = this.state.expenses.filter(e => e.id !== id);
    this.persist();
  }
  createWithdrawal(body: any) {
    const w = {
      id: this.nextId(),
      amount: body.amount ?? 0,
      reason: body.reason,
      withdrawalDate: body.withdrawalDate ?? new Date().toISOString(),
      paymentMethod: body.paymentMethod ?? 'CASH',
      recordedBy: 'Demo Owner',
      createdAt: new Date().toISOString()
    };
    this.state.withdrawals.unshift(w);
    this.persist();
    return w;
  }
  deleteWithdrawal(id: number) {
    this.state.withdrawals = this.state.withdrawals.filter(w => w.id !== id);
    this.persist();
  }

  getFinanceSummary(period = 'MONTH'): FinanceSummary {
    const days = period === 'TODAY' ? 1 : period === 'WEEK' ? 7 : period === 'YEAR' ? 365 : 30;
    const cutoff = Date.now() - days * 86_400_000;

    const paid = this.state.orders.filter(o => o.status === 'PAID' && o.paidAt && new Date(o.paidAt).getTime() >= cutoff);
    const totalRevenue = paid.reduce((s, o) => s + o.totalAmount, 0);

    const periodExpenses = this.state.expenses.filter(e => new Date(e.expenseDate).getTime() >= cutoff);
    const totalExpenses = periodExpenses.reduce((s, e) => s + e.amount, 0);
    const totalSalaries = this.state.employees.filter(e => e.paidThisMonth).reduce((s, e) => s + (e.paidThisMonthAmount ?? e.baseSalary), 0);
    const totalWithdrawals = this.state.withdrawals
      .filter(w => new Date(w.withdrawalDate).getTime() >= cutoff)
      .reduce((s, w) => s + w.amount, 0);
    const netProfit = +(totalRevenue - totalExpenses - totalSalaries - totalWithdrawals).toFixed(2);

    const catMap = new Map<string, number>();
    for (const e of periodExpenses) catMap.set(e.categoryName, (catMap.get(e.categoryName) ?? 0) + e.amount);
    const expenseByCategory = [...catMap.entries()].map(([category, amount]) => ({ category, amount }));

    const dayMap = new Map<string, number>();
    for (const o of paid) {
      const key = new Date(o.paidAt!).toISOString().slice(0, 10);
      dayMap.set(key, (dayMap.get(key) ?? 0) + o.totalAmount);
    }
    const revenueByDay = [...dayMap.entries()]
      .map(([date, revenue]) => ({ date, revenue }))
      .sort((a, b) => a.date.localeCompare(b.date));

    return { period, totalRevenue, totalExpenses, totalSalaries, totalWithdrawals, netProfit, expenseByCategory, revenueByDay };
  }
}

// Single shared instance for the app session
let singleton: DemoStore | null = null;
export function getDemoStore(): DemoStore {
  if (!singleton) singleton = new DemoStore();
  return singleton;
}
