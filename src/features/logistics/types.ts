export type LogisticsAccessLevel = 'admin' | 'opsAdmin' | 'manager' | 'driver' | null;

export type VehicleStatus = 'active' | 'maintenance' | 'inactive';

export interface VehicleType {
  _id: string;
  name: string;
  isActive: boolean;
}

export interface Vehicle {
  _id: string;
  make: string;
  model: string;
  licensePlate: string;
  vin: string | null;
  vehicleType: string | null;
  driverId: string | null;
  driverName?: string | null;
  status: VehicleStatus;
  currentLocation: string | null;
  locationUpdatedAt?: string | null;
  odometer: number;
  fuelType: string | null;
  department: string | null;
  createdAt: string;
}

export type WorkOrderType = 'scheduled' | 'unscheduled';
export type WorkOrderStatus = 'open' | 'in_progress' | 'completed';

export interface WorkOrderPart {
  itemId: string;
  itemName: string;
  sku: string;
  locationId: string;
  quantity: number;
  unitCost: number;
}

export interface WorkOrder {
  _id: string;
  vehicleId: string;
  type: WorkOrderType;
  description: string;
  status: WorkOrderStatus;
  scheduledDate: string | null;
  completedDate: string | null;
  partsUsed: WorkOrderPart[];
  laborCost: number;
  otherCost: number;
  totalCost: number;
  postedToAccounting: boolean;
  createdAt: string;
}

export type StopStatus = 'pending' | 'delivered' | 'failed' | 'rescheduled';
export type RouteStatus = 'planned' | 'in_progress' | 'completed';

export interface RouteStop {
  id: string;
  address: string;
  lat: number | null;
  lng: number | null;
  sequence: number;
  timeWindowStart: string | null;
  timeWindowEnd: string | null;
  shipmentId: string | null;
  status: StopStatus;
  proofOfDeliveryUrl: string | null;
  signatureUrl: string | null;
  notes: string | null;
  completedAt: string | null;
}

export interface Route {
  _id: string;
  vehicleId: string;
  driverId: string;
  date: string;
  stops: RouteStop[];
  status: RouteStatus;
  department: string | null;
  createdAt: string;
}

export type ShipmentSourceType = 'pos_sale' | 'inventory_transfer' | 'standalone';
export type ShipmentStatus = 'pending' | 'picked_up' | 'in_transit' | 'out_for_delivery' | 'delivered' | 'exception';

export interface Shipment {
  _id: string;
  sourceType: ShipmentSourceType;
  sourceId: string | null;
  status: ShipmentStatus;
  routeId: string | null;
  stopId: string | null;
  expectedDeliveryDate: string | null;
  actualDeliveryDate: string | null;
  exceptionReason: string | null;
  exceptionResolution: string | null;
  exceptionResolvedAt: string | null;
  department: string | null;
  createdAt: string;
}

export interface FleetUtilization {
  totalVehicles: number;
  byStatus: Record<VehicleStatus, number>;
  assignedCount: number;
  unassignedCount: number;
  totalOdometer: number;
  avgOdometer: number;
}

export interface DeliveryPerformance {
  totalShipments: number;
  delivered: number;
  onTimeCount: number;
  onTimeRate: number;
  exceptionCount: number;
  exceptionRate: number;
  avgDelayHours: number;
}
