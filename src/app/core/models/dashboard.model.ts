export interface DashboardSummary {
  todaySales: number;
  todayOrders: number;
  activeTableCount: number;
  totalTableCount: number;
  averageOrderValue: number;
  topSellingItems: TopSellingItem[];
  recentOrders: RecentOrder[];
  salesByCategory: SalesByCategory[];
  hourlySales: HourlySale[];
}

export interface TopSellingItem {
  menuItemId: number;
  menuItemName: string;
  quantitySold: number;
  revenue: number;
  foodType: 'VEG' | 'NON_VEG' | 'EGG';
}

export interface RecentOrder {
  orderId: number;
  tableNumber: string;
  totalAmount: number;
  status: string;
  createdAt: string;
  itemCount: number;
}

export interface SalesByCategory {
  categoryName: string;
  revenue: number;
  percentage: number;
}

export interface HourlySale {
  hour: number;
  revenue: number;
  orderCount: number;
}

export interface SalesReport {
  period: 'TODAY' | 'WEEK' | 'MONTH' | 'CUSTOM';
  startDate: string;
  endDate: string;
  totalRevenue: number;
  totalOrders: number;
  avgOrderValue: number;
  dailyBreakdown: DailySale[];
}

export interface DailySale {
  date: string;
  revenue: number;
  orderCount: number;
}
