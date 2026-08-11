export type TableStatus  = 'AVAILABLE' | 'OCCUPIED' | 'BILLED';
export type OrderStatus  = 'OPEN' | 'BILLED' | 'PAID' | 'CANCELLED';
export type PaymentMethod = 'CASH' | 'UPI' | 'CARD' | 'OTHER';

export interface DiningTable {
  id: number;
  tableNumber: string;
  capacity: number;
  status: TableStatus;
  activeOrderId?: number;
  floor?: string;
}

export type KitchenStatus = 'PENDING' | 'COOKING' | 'READY';

export interface OrderItem {
  id?: number;
  menuItemId: number;
  menuItemName: string;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
  foodType: 'VEG' | 'NON_VEG' | 'EGG';
  notes?: string;
  kitchenStatus?: KitchenStatus;
}

export interface Order {
  id: number;
  tableId: number;
  tableNumber: string;
  status: OrderStatus;
  items: OrderItem[];
  subtotal: number;
  discountAmount: number;
  discountPercent: number;
  taxAmount: number;
  taxPercent: number;
  totalAmount: number;
  customerName?: string;
  customerPhone?: string;
  guestCount?: number;
  notes?: string;
  createdAt: string;
  updatedAt: string;
  billedAt?: string;
  paidAt?: string;
  paymentMethod?: PaymentMethod;
  servedBy?: string;
  billedBy?: string;
}

export interface AddItemRequest {
  orderId?: number;
  tableId: number;
  menuItemId: number;
  quantity: number;
  notes?: string;
}

export interface BillRequest {
  orderId: number;
  discountPercent?: number;
  discountAmount?: number;
  taxPercent?: number;
  paymentMethod: PaymentMethod;
  customerName?: string;
  customerPhone?: string;
}
