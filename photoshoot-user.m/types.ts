
export type OrderKind = 'shoot' | 'move' | 'mixed' | 'auto';
export type OrderStatus = 'تحت المتابعة' | 'مكتملة';
export type Role = 'الادارة' | 'اداري' | 'مدراء فروع';

export interface UserProfile {
  name: string;
  role: Role;
  locations: string[];
  email: string;
}

export interface OrderRowStep {
  at: any;
  byUid: string;
  byEmail: string;
  byName: string;
}

export interface OrderRow {
  vin: string;
  kind: 'shoot' | 'move';
  car: string;
  variant: string;
  extColor: string;
  intColor: string;
  modelYear: string;
  fromLocation: string;
  location: string;
  shootPlace?: string;
  toLocation?: string;
  note: string;
  steps: {
    received?: OrderRowStep;
    sent?: OrderRowStep;
    carReceived?: OrderRowStep;
  };
}

export interface Order {
  id: string;
  kind: OrderKind;
  status: OrderStatus;
  createdAt: any;
  updatedAt: any;
  createdByUid: string;
  createdByEmail: string;
  createdByName: string;
  total: number;
  finishedAt?: any;
}

export interface StockItem {
  vin: string;
  car: string;
  variant: string;
  extColor: string;
  intColor: string;
  modelYear: string;
  location: string;
}
