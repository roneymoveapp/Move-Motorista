
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
  from_location: string; // Legacy/Fallback: JSON string
  to_location: string; // Legacy/Fallback: JSON string
  
  // New explicit coordinate columns for direct GPS usage
  origin_latitude?: number;
  origin_longitude?: number;
  destination_latitude?: number;
  destination_longitude?: number;

  estimated_price: number;
  final_price?: number;
  status: RideStatus;
  driver_id?: string;
  created_at: string;
  vehicle_type: string;
  payment_status?: string; // e.g., 'PENDING', 'COMPLETED'
  current_stop_order: number; 
  profiles: Profile | null;
  ride_stops: RideStop[];
}

// Represents the `drivers` table data
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
  balance: number;
  fees_owed: number;
  average_rating?: number;
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
    driver_id: string | null;
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
    start_time: string;
    end_time: string;
    min_fare: number;
    per_km: number;
    per_min: number;
}