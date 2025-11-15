export enum DriverStatus {
  ONLINE = 'online',
  OFFLINE = 'offline',
  BUSY = 'busy',
}

export enum RideStatus {
  REQUESTED = 'REQUESTED',
  ACCEPTED_PICKUP = 'ACCEPTED_PICKUP',
  IN_PROGRESS = 'IN_PROGRESS',
  COMPLETED = 'COMPLETED',
  CANCELLED = 'CANCELLED',
}

// Represents the `profiles` table data
export interface Profile {
    full_name: string;
    phone?: string;
    fcm_token?: string;
    email?: string;
}

// Represents a single stop from the `ride_stops` table
export interface RideStop {
    id: number;
    location: string; // JSON string with lat, lng, address
    stop_order: number;
}

export interface Ride {
  id: string;
  user_id: string;
  from_location: string; // Should be parsed JSON or a specific type
  to_location: string; // e.g., { lat: number, lng: number, address: string }
  estimated_price: number;
  final_price?: number;
  status: RideStatus;
  driver_id?: string;
  created_at: string;
  vehicle_type: string;
  payment_status?: string; // e.g., 'PENDING', 'COMPLETED'
  current_stop_order: number; // New field to track ride progress
  // This will hold the related passenger data from the `profiles` table
  profiles: Profile | null;
  // This will hold related stops
  ride_stops: RideStop[];
}

// Represents the `drivers` table data, now including vehicle details and related profile
export interface DriverProfile {
  id: string;
  is_active: boolean;
  status: DriverStatus;
  current_latitude?: number;
  current_longitude?: number;
  vehicle_model: string;
  vehicle_color: string;
  license_plate: string;
  driver_license_number: string;
  cpf: string;
  balance: number; // Saldo do motorista
  average_rating?: number; // Avaliação média do motorista
  // This will hold the related data from the `profiles` table
  profiles?: { full_name: string };
}

export interface LatLng {
  lat: number;
  lng: number;
}

export interface ChatMessage {
    id: number;
    ride_id: string;
    sender_id: string;
    receiver_id: string;
    message_content: string;
    created_at: string;
}

export interface ScheduledRide {
    id: number;
    user_id: string;
    from_location: string;
    to_location: string;
    vehicle_type: string;
    scheduled_for: string;
    status: string;
    driver_id: string | null; // New field for the assigned driver
    profiles: { full_name: string } | null;
}

export interface DriverPayoutDetails {
    driver_id: string;
    account_holder_name?: string;
    cpf?: string;
    pix_key_type?: string;
    pix_key?: string;
    card_last_four?: string;
    card_expiry_date?: string;
}

export interface Tariff {
    id: number;
    name: string;
    start_time: string; // "HH:mm:ss"
    end_time: string; // "HH:mm:ss"
    min_fare: number;
    per_km: number;
    per_min: number;
}