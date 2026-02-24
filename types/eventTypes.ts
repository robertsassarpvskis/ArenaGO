// ─── Shared Types ─────────────────────────────────────────────────────────────

export interface Participant {
  username: string;
  displayName: string;
  profilePhoto?: { id: string; url: string; contentType: string } | null;
}

export interface EventData {
  id: string;
  title: string;
  description?: string | null;
  image?: string | { url?: string } | null;
  category: string;
  time: number;
  location: string | { latitude: number; longitude: number };
  locationName?: string;
  distance?: string;
  attendees: number;
  spotsLeft?: number;
  maxParticipants?: number | null;
  author: { username: string } | null;
  participantsPreview?: Participant[] | null;
}

export interface EventModalProps {
  visible: boolean;
  event: EventData | null;
  onClose: () => void;
  onJoin: () => void;
  isSaved: boolean;
  onToggleSave: () => void;
  isLoading?: boolean;
  isUserEvent?: boolean;
  currentUser?: { accessToken?: string; userName?: string };
  accessToken?: string;
  onEventUpdated?: () => void;
  onCancelEvent?: (id: string) => Promise<void>;
  onDeleteEvent?: (id: string) => Promise<void>;
}
