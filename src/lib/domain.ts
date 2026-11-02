export type Stay = {
  slug: string;
  name: string;
  location: string;
  region: string;
  distance: string;
  nightlyPrice: number;
  rating: number;
  reviewCount: number;
  category: string;
  bedrooms: number;
  beds: number;
  baths: number;
  maxGuests: number;
  instantBook: boolean;
  images: string[];
  hostName: string;
  hostSince: string;
  description: string;
  amenities: string[];
  latitude: number;
  longitude: number;
  cleaningFee: number;
};

export type StayFilters = {
  location?: string;
  category?: string;
  guests?: number;
  minPrice?: number;
  maxPrice?: number;
  minRating?: number;
  bedrooms?: number;
  instantBook?: boolean;
  amenities?: string[];
  sort?: "recommended" | "price-low" | "price-high" | "rating";
};

export type Booking = {
  id: string;
  staySlug: string;
  stayName: string;
  location: string;
  image: string;
  checkIn: string;
  checkOut: string;
  guests: number;
  nights: number;
  nightlyPrice: number;
  cleaningFee: number;
  serviceFee: number;
  taxes: number;
  total: number;
  status: string;
};

export type SessionUser = {
  id: number;
  name: string;
  email: string;
  role: "guest" | "admin";
};