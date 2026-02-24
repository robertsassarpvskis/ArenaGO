// src/api/types.ts

// Lietotājs
export interface User {
  id: string;
  name: string;
  email: string;
  avatar?: string;
  bio?: string;
  phone_number?: string;
  birth_date?: string;
  country?: string;
  city?: string;
  createdAt?: string;
}

// Pasākums
export interface Event {
  id: string;
  name: string;
  details?: string;
  category?: string;
  image_event?: string;
  location?: string;
  starts_at?: number;
  createdAt?: string;
}

export interface EventFormData {
  title: string;
  details?: string;
  // interest_id: number;
  // max_participants?: number;
  // min_participants?: number;
  // location_name: string;
  duration_minutes?: number;
  // start_scheduled_to: Date;
  // end_scheduled_to?: Date;
}

// Dalībnieks
export interface Participant {
  id: string;
  userId: string;
  eventId: string;
  joinedAt?: string;
}
