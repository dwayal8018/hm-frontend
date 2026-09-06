// ─────────────────────────────────────────────────────────────────────────────
// Demo HTTP interceptor. Only registered when environment.demoMode === true
// (see app.config.ts). Transparently returns seeded responses for every /api
// call so the app runs with zero backend. Production/dev builds never load this.
// ─────────────────────────────────────────────────────────────────────────────
import { HttpInterceptorFn, HttpResponse } from '@angular/common/http';
import { Observable, of, throwError } from 'rxjs';
import { delay } from 'rxjs/operators';
import { getDemoStore } from './demo-store';
import { BillRequest } from '../models/order.model';
import {
  DEMO_TOKEN, DEMO_USER, DEMO_RESTAURANT, DEMO_SUBSCRIPTION
} from './demo-seed';

const ok = <T>(data: T) => new HttpResponse({ status: 200, body: { success: true, data } });

/** Extract the path after `/api`, plus a parsed query string. */
function parseUrl(url: string): { path: string; query: URLSearchParams } {
  // Strip protocol+host if present
  let rest = url;
  const apiIdx = url.indexOf('/api');
  if (apiIdx >= 0) rest = url.slice(apiIdx + 4); // drop leading "/api"
  const [pathPart, queryPart] = rest.split('?');
  return { path: pathPart || '/', query: new URLSearchParams(queryPart || '') };
}

function num(segment: string | undefined): number { return Number(segment); }

export const demoInterceptor: HttpInterceptorFn = (req, next) => {
  const url = req.url;
  // Only intercept API traffic; let assets/other requests pass through untouched.
  if (!url.includes('/api')) return next(req);

  const store = getDemoStore();
  const { path, query } = parseUrl(url);
  const seg = path.split('/').filter(Boolean); // e.g. ['orders','table','2']
  const method = req.method.toUpperCase();
  const body: any = req.body ?? {};

  const respond = (obs: Observable<HttpResponse<unknown>>) =>
    obs.pipe(delay(120)); // small latency so spinners/animations feel real

  try {
    // ── AUTH (cloud) ─────────────────────────────────────────────────────────
    if (seg[0] === 'auth' && seg[1] === 'login' && method === 'POST') {
      return respond(of(ok({
        token: DEMO_TOKEN, user: DEMO_USER,
        restaurant: DEMO_RESTAURANT, subscription: DEMO_SUBSCRIPTION
      })));
    }
    if (seg[0] === 'restaurants' && seg[1] === 'register' && method === 'POST') {
      return respond(of(new HttpResponse({ status: 200, body: {
        status: 'PENDING', message: 'Demo registration received', data: 'REST-DEMO01'
      }})));
    }
    if (seg[0] === 'subscription' && seg[1] === 'status') {
      return respond(of(ok(DEMO_SUBSCRIPTION)));
    }
    if (seg[0] === 'subscription' && seg[1] === 'renew' && method === 'POST') {
      return respond(of(ok({ ...DEMO_SUBSCRIPTION, status: 'ACTIVE', daysRemaining: 365 })));
    }

    // ── RESTAURANT PROFILE / USERS (cloud) ─────────────────────────────────────
    if (seg[0] === 'restaurants' && seg[1] === 'profile') {
      if (method === 'GET') {
        return respond(of(ok({
          id: 1, restaurantCode: 'REST-DEMO01',
          restaurantName: DEMO_RESTAURANT.name, address: DEMO_RESTAURANT.address,
          phone: DEMO_RESTAURANT.phone, upiId: DEMO_RESTAURANT.upiId,
          gstNumber: DEMO_RESTAURANT.gstNumber ?? '', logoUrl: '',
          ownerName: DEMO_USER.fullName, ownerEmail: 'demo@spicegarden.test',
          enabledRoles: DEMO_RESTAURANT.enabledRoles
        })));
      }
      if (method === 'PUT') {
        return respond(of(ok({
          id: 1, restaurantCode: 'REST-DEMO01',
          restaurantName: body.restaurantName ?? DEMO_RESTAURANT.name,
          address: body.address ?? DEMO_RESTAURANT.address,
          phone: body.phone ?? DEMO_RESTAURANT.phone,
          upiId: body.upiId ?? DEMO_RESTAURANT.upiId,
          gstNumber: body.gstNumber ?? '', logoUrl: body.logoUrl ?? '',
          ownerName: DEMO_USER.fullName, ownerEmail: 'demo@spicegarden.test',
          enabledRoles: body.enabledRoles ?? DEMO_RESTAURANT.enabledRoles
        })));
      }
    }
    if (seg[0] === 'restaurants' && seg[1] === 'users') {
      const demoUsers = [
        { id: 1, username: 'demo',    fullName: 'Demo Owner',      role: 'OWNER',   active: true },
        { id: 2, username: 'kavya',   fullName: 'Kavya (Manager)', role: 'MANAGER', active: true },
        { id: 3, username: 'suresh',  fullName: 'Suresh (Chef)',   role: 'CHEF',    active: true },
        { id: 4, username: 'ramesh',  fullName: 'Ramesh (Waiter)', role: 'WAITER',  active: true }
      ];
      if (method === 'GET')  return respond(of(ok(demoUsers)));
      if (method === 'POST') return respond(of(ok({ id: 99, username: body.username, fullName: body.fullName, role: body.role, active: true })));
      if (method === 'PATCH') return respond(of(ok({ id: num(seg[2]), username: 'user', fullName: 'User', role: 'WAITER', active: false })));
      if (method === 'DELETE') return respond(of(ok(null)));
    }

    // ── TABLES ─────────────────────────────────────────────────────────────
    if (seg[0] === 'tables') {
      if (seg.length === 1) {
        if (method === 'GET')  return respond(of(ok(store.getTables())));
        if (method === 'POST') return respond(of(ok(store.createTable(body))));
      }
      if (seg.length === 2) {
        const id = num(seg[1]);
        if (method === 'GET')    return respond(of(ok(store.getTable(id))));
        if (method === 'PUT')    return respond(of(ok(store.updateTable(id, body))));
        if (method === 'DELETE') { store.deleteTable(id); return respond(of(ok(null))); }
      }
    }

    // ── ORDERS ─────────────────────────────────────────────────────────────
    if (seg[0] === 'orders') {
      if (seg.length === 1 && method === 'GET') {
        return respond(of(ok(store.getActiveOrders())));
      }
      if (seg[1] === 'table' && method === 'GET') {
        return respond(of(ok(store.getOpenOrderByTable(num(seg[2])) ?? null)));
      }
      if (seg[1] === 'add-item' && method === 'POST') {
        return respond(of(ok(store.addItem(body))));
      }
      // /orders/:id ...
      const orderId = num(seg[1]);
      if (seg.length === 2 && method === 'GET') {
        return respond(of(ok(store.getOrder(orderId) ?? null)));
      }
      if (seg[2] === 'cancel' && method === 'PATCH') {
        store.cancelOrder(orderId); return respond(of(ok(null)));
      }
      if (seg[2] === 'items' && seg[3]) {
        const itemId = num(seg[3]);
        if (method === 'DELETE') return respond(of(ok(store.removeItem(orderId, itemId))));
        if (method === 'PATCH')  return respond(of(ok(store.updateItemQty(orderId, itemId, body.quantity))));
      }
    }

    // ── BILLING ────────────────────────────────────────────────────────────
    if (seg[0] === 'billing') {
      if (seg[1] === 'generate' && method === 'POST') {
        return respond(of(ok(store.generateBill(body as BillRequest))));
      }
      if (seg[1] === 'history' && method === 'GET') {
        const page = Number(query.get('page') ?? 0);
        const size = Number(query.get('size') ?? 20);
        return respond(of(ok(store.getBillHistory(page, size))));
      }
      if (seg[2] === 'paid' && method === 'PATCH') {
        return respond(of(ok(store.markPaid(num(seg[1]), body.paymentMethod))));
      }
    }

    // ── KITCHEN ────────────────────────────────────────────────────────────
    if (seg[0] === 'kitchen') {
      if (seg[1] === 'orders' && method === 'GET') {
        return respond(of(ok(store.getKitchenOrders())));
      }
      if (seg[1] === 'items' && seg[3] === 'status' && method === 'PATCH') {
        return respond(of(ok(store.updateKitchenStatus(num(seg[2]), body.status))));
      }
    }

    // ── MENU ───────────────────────────────────────────────────────────────
    if (seg[0] === 'menu') {
      if (seg[1] === 'categories') {
        if (seg.length === 2) {
          if (method === 'GET')  return respond(of(ok(store.getCategories())));
          if (method === 'POST') return respond(of(ok(store.createCategory(body))));
        }
        if (seg.length === 3) {
          const id = num(seg[2]);
          if (method === 'PUT')    return respond(of(ok(store.updateCategory(id, body))));
          if (method === 'DELETE') { store.deleteCategory(id); return respond(of(ok(null))); }
        }
      }
      if (seg[1] === 'items') {
        if (seg.length === 2 && method === 'GET') {
          const catId = query.get('categoryId');
          return respond(of(ok(store.getItems(catId ? Number(catId) : undefined))));
        }
        if (seg.length === 2 && method === 'POST') return respond(of(ok(store.createItem(body))));
        if (seg[2] === 'search' && method === 'GET') {
          return respond(of(ok(store.searchItems(query.get('q') ?? ''))));
        }
        if (seg.length === 3) {
          const id = num(seg[2]);
          if (method === 'GET')    return respond(of(ok(store.getItem(id))));
          if (method === 'PUT')    return respond(of(ok(store.updateItem(id, body))));
          if (method === 'DELETE') { store.deleteItem(id); return respond(of(ok(null))); }
        }
        if (seg[3] === 'availability' && method === 'PATCH') {
          return respond(of(ok(store.toggleAvailability(num(seg[2]), body.available))));
        }
      }
    }

    // ── DASHBOARD ────────────────────────────────────────────────────────────
    if (seg[0] === 'dashboard') {
      if (seg[1] === 'summary') return respond(of(ok(store.getDashboardSummary())));
      if (seg[1] === 'sales')   return respond(of(ok(store.getSalesReport(query.get('period') ?? 'TODAY'))));
    }

    // ── FINANCE ────────────────────────────────────────────────────────────
    if (seg[0] === 'finance') {
      if (seg[1] === 'summary')    return respond(of(ok(store.getFinanceSummary(query.get('period') ?? 'MONTH'))));
      if (seg[1] === 'categories') {
        if (method === 'GET')    return respond(of(ok(store.getExpenseCategories())));
        if (method === 'POST')   return respond(of(ok(store.createCategory({ name: body.name }))));
        if (method === 'DELETE') return respond(of(ok(null)));
      }
      if (seg[1] === 'expenses') {
        if (method === 'GET')    return respond(of(ok(store.getExpenses())));
        if (method === 'POST')   return respond(of(ok(store.createExpense(body))));
        if (method === 'DELETE') { store.deleteExpense(num(seg[2])); return respond(of(ok(null))); }
      }
      if (seg[1] === 'employees') {
        if (seg.length === 2 && method === 'GET')  return respond(of(ok(store.getEmployees())));
        if (seg.length === 2 && method === 'POST') return respond(of(ok(store.getEmployees()[0])));
        if (seg[3] === 'pay' && method === 'POST') {
          return respond(of(ok({ id: 999, employeeId: num(seg[2]), employeeName: 'Employee', role: 'STAFF',
            paymentMonth: new Date().toISOString().slice(0, 7), paidAmount: body.amount ?? 0,
            paymentMethod: body.paymentMethod ?? 'CASH', paidBy: 'Demo Owner', paidAt: new Date().toISOString() })));
        }
        if (seg[3] === 'payments' && method === 'GET') return respond(of(ok([])));
      }
      if (seg[1] === 'withdrawals') {
        if (method === 'GET')    return respond(of(ok(store.getWithdrawals())));
        if (method === 'POST')   return respond(of(ok(store.createWithdrawal(body))));
        if (method === 'DELETE') { store.deleteWithdrawal(num(seg[2])); return respond(of(ok(null))); }
      }
    }

    // ── SETTINGS / BACKUP ──────────────────────────────────────────────────
    if (seg[0] === 'settings' && seg[1] === 'billing-defaults') {
      const defaults = { defaultTaxPercent: 5, defaultDiscountType: 'percent', defaultDiscountValue: 0 };
      if (method === 'GET') return respond(of(ok(defaults)));
      if (method === 'PUT') return respond(of(ok(body)));
    }
    if (seg[0] === 'backup') {
      if (seg[1] === 'now')    return respond(of(ok({ savedTo: 'demo (in-browser)', message: 'Demo mode — no real backup performed' })));
      if (seg[1] === 'status') return respond(of(ok({ level: 'OK', message: 'Demo mode', dbSizeMb: 2.4,
        warnThresholdMb: 100, archiveThresholdMb: 500, backupCount: 3, backupsTotalMb: 7.2, dbPath: 'demo://in-memory' })));
    }
  } catch (e) {
    return throwError(() => e);
  }

  // Unknown demo endpoint — return an empty success so the UI degrades gracefully
  return respond(of(ok(null)));
};
