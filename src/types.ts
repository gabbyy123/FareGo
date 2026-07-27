export interface User {
  id: number;
  firstName: string;
  lastName: string;
  email: string;
  role: 'passenger' | 'driver' | 'admin';
  gender?: 'male' | 'female' | 'other' | 'prefer_not_to_say';
}

export interface RideRequest {
  id: number;
  passengerId: number;
  pickupLat: number;
  pickupLng: number;
  pickupAddress: string;
  dropoffLat: number;
  dropoffLng: number;
  dropoffAddress: string;
  proposedFare: number;
  status: 'pending' | 'negotiating' | 'accepted' | 'in_progress' | 'completed' | 'cancelled';
  isFemaleOnly: boolean;
  isEcoFriendly: boolean;
  isPool: boolean;
  createdAt: string;
}

export interface Bid {
  id: number;
  rideRequestId: number;
  driverId: number;
  bidAmount: number;
  status: 'pending' | 'accepted' | 'rejected';
  createdAt: string;
}
