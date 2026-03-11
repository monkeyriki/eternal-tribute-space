export interface Memorial {
  id: string;
  type: "human" | "pet";
  firstName: string;
  lastName: string;
  birthDate: string;
  deathDate: string;
  location: string;
  photoUrl: string;
  bio: string;
  tags: string[];
  visibility: "public" | "unlisted" | "password";
  tributeCount: number;
  guestbookEntries: number;
  createdAt: string;
  updatedAt?: string;
}

export interface VirtualTribute {
  id: string;
  name: string;
  icon: string;
  price: number;
  category: string;
  animated: boolean;
  duration?: string;
}

export interface GuestbookEntry {
  id: string;
  authorName: string;
  message: string;
  createdAt: string;
  tribute?: VirtualTribute;
}
