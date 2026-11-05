import { mkdirSync } from "node:fs";
import { join } from "node:path";
import { DatabaseSync, type SQLInputValue } from "node:sqlite";
import type { Stay, StayFilters } from "@/lib/domain";

const image = (id: string, width = 1100) =>
  `https://images.unsplash.com/${id}?auto=format&fit=crop&w=${width}&q=82`;

const seedStays: Omit<Stay, "reviewCount">[] = [
  {
    slug: "glasshouse-in-the-coffee-hills",
    name: "Glasshouse in the coffee hills",
    location: "Chikmagalur, India",
    region: "Karnataka",
    distance: "286 km away",
    nightlyPrice: 9200,
    rating: 4.96,
    category: "Cabins",
    bedrooms: 2,
    beds: 3,
    baths: 2,
    maxGuests: 4,
    instantBook: true,
    images: [
      image("photo-1449158743715-0a90ebb6d2d8"),
      image("photo-1449844908441-8829872d2607"),
      image("photo-1510798831971-661eb04b3739"),
      image("photo-1518780664697-55e3ad937233"),
    ],
    hostName: "Mira",
    hostSince: "2019",
    description: "Wake to mist moving through a working coffee estate. This light-filled glasshouse pairs slow mornings, forest paths and long views of the Western Ghats.",
    amenities: ["Mountain view", "Wifi", "Kitchen", "Free parking", "Workspace", "Breakfast"],
    latitude: 13.3161,
    longitude: 75.772,
    cleaningFee: 850,
  },
  {
    slug: "sea-facing-home-in-goa",
    name: "Sea-facing home with a quiet courtyard",
    location: "Assagao, India",
    region: "Goa",
    distance: "2 km from Anjuna Beach",
    nightlyPrice: 11800,
    rating: 4.91,
    category: "Beachfront",
    bedrooms: 3,
    beds: 3,
    baths: 3,
    maxGuests: 6,
    instantBook: true,
    images: [
      image("photo-1600607687939-ce8a6c25118c"),
      image("photo-1600607687920-4e2a09cf159d"),
      image("photo-1600607687644-c7171b42498f"),
      image("photo-1600607687920-4e2a09cf159d"),
    ],
    hostName: "Dev",
    hostSince: "2021",
    description: "A relaxed, design-led home tucked into a leafy lane. Spend afternoons by the pool, then wander to the village for dinner.",
    amenities: ["Pool", "Wifi", "Kitchen", "Air conditioning", "Free parking", "Garden"],
    latitude: 15.5873,
    longitude: 73.8077,
    cleaningFee: 1200,
  },
  {
    slug: "a-frame-above-the-clouds",
    name: "A-frame above the clouds",
    location: "Nainital, India",
    region: "Uttarakhand",
    distance: "8 km from the lake",
    nightlyPrice: 7400,
    rating: 4.89,
    category: "Amazing views",
    bedrooms: 2,
    beds: 2,
    baths: 1,
    maxGuests: 4,
    instantBook: false,
    images: [
      image("photo-1510798831971-661eb04b3739"),
      image("photo-1449158743715-0a90ebb6d2d8"),
      image("photo-1518780664697-55e3ad937233"),
      image("photo-1449844908441-8829872d2607"),
    ],
    hostName: "Ananya",
    hostSince: "2020",
    description: "A cedar-lined hideaway with a wide deck and a view that changes with the weather. Ideal for a quiet weekend in the hills.",
    amenities: ["Mountain view", "Wifi", "Kitchen", "Fireplace", "Workspace"],
    latitude: 29.3919,
    longitude: 79.4542,
    cleaningFee: 650,
  },
  {
    slug: "pondicherry-courtyard-retreat",
    name: "Restored courtyard home in the old quarter",
    location: "Puducherry, India",
    region: "Puducherry",
    distance: "900 m from the promenade",
    nightlyPrice: 6800,
    rating: 4.94,
    category: "Trending",
    bedrooms: 2,
    beds: 2,
    baths: 2,
    maxGuests: 4,
    instantBook: true,
    images: [
      image("photo-1600210492486-724fe5c67fb0"),
      image("photo-1600607687920-4e2a09cf159d"),
      image("photo-1616486338812-3dadae4b4ace"),
      image("photo-1600607687939-ce8a6c25118c"),
    ],
    hostName: "Arun",
    hostSince: "2018",
    description: "A carefully restored home built around a calm courtyard. Colourful streets, bakeries and the promenade are an easy walk away.",
    amenities: ["Wifi", "Kitchen", "Air conditioning", "Courtyard", "Washer"],
    latitude: 11.9416,
    longitude: 79.8083,
    cleaningFee: 500,
  },
  {
    slug: "private-pool-in-jaipur",
    name: "A quiet haveli with a private plunge pool",
    location: "Jaipur, India",
    region: "Rajasthan",
    distance: "5 km from the old city",
    nightlyPrice: 10400,
    rating: 4.88,
    category: "Amazing pools",
    bedrooms: 2,
    beds: 3,
    baths: 2,
    maxGuests: 5,
    instantBook: true,
    images: [
      image("photo-1613490493576-7fde63acd811"),
      image("photo-1600607687939-ce8a6c25118c"),
      image("photo-1600566753086-00f18fb6b3ea"),
      image("photo-1600607687644-c7171b42498f"),
    ],
    hostName: "Sana",
    hostSince: "2022",
    description: "Hand-painted details, a shaded terrace and a small private pool make this a restful base for exploring Jaipur.",
    amenities: ["Pool", "Wifi", "Kitchen", "Air conditioning", "Breakfast", "Free parking"],
    latitude: 26.9124,
    longitude: 75.7873,
    cleaningFee: 900,
  },
  {
    slug: "minimal-home-in-the-aravallis",
    name: "Minimal home with long Aravalli views",
    location: "Udaipur, India",
    region: "Rajasthan",
    distance: "4 km from the city centre",
    nightlyPrice: 8900,
    rating: 4.97,
    category: "Amazing views",
    bedrooms: 2,
    beds: 2,
    baths: 2,
    maxGuests: 4,
    instantBook: false,
    images: [
      image("photo-1600607687920-4e2a09cf159d"),
      image("photo-1600607687939-ce8a6c25118c"),
      image("photo-1616486338812-3dadae4b4ace"),
      image("photo-1600566753086-00f18fb6b3ea"),
    ],
    hostName: "Kabir",
    hostSince: "2017",
    description: "A quiet home above the city, with a terrace for sunset and space to settle in between days out.",
    amenities: ["Mountain view", "Wifi", "Kitchen", "Workspace", "Free parking"],
    latitude: 24.5854,
    longitude: 73.7125,
    cleaningFee: 700,
  },
  {
    slug: "bamboo-cabin-in-wayanad",
    name: "Bamboo cabin beside a pepper garden",
    location: "Wayanad, India",
    region: "Kerala",
    distance: "12 km from the wildlife sanctuary",
    nightlyPrice: 5600,
    rating: 4.9,
    category: "Cabins",
    bedrooms: 1,
    beds: 2,
    baths: 1,
    maxGuests: 3,
    instantBook: true,
    images: [
      image("photo-1518780664697-55e3ad937233"),
      image("photo-1449158743715-0a90ebb6d2d8"),
      image("photo-1510798831971-661eb04b3739"),
      image("photo-1449844908441-8829872d2607"),
    ],
    hostName: "Leela",
    hostSince: "2020",
    description: "A small timber-and-bamboo stay surrounded by pepper vines, birdsong and forest air.",
    amenities: ["Garden view", "Wifi", "Breakfast", "Free parking", "Outdoor shower"],
    latitude: 11.6854,
    longitude: 76.132,
    cleaningFee: 350,
  },
  {
    slug: "lake-house-in-kumarakom",
    name: "Lake house with a private verandah",
    location: "Kumarakom, India",
    region: "Kerala",
    distance: "On the backwaters",
    nightlyPrice: 13200,
    rating: 4.95,
    category: "Beachfront",
    bedrooms: 3,
    beds: 4,
    baths: 3,
    maxGuests: 6,
    instantBook: true,
    images: [
      image("photo-1600607687644-c7171b42498f"),
      image("photo-1600607687939-ce8a6c25118c"),
      image("photo-1600607687920-4e2a09cf159d"),
      image("photo-1600566753086-00f18fb6b3ea"),
    ],
    hostName: "Thomas",
    hostSince: "2016",
    description: "Watch the water from a wide wooden verandah, with canoe rides and local meals arranged by your host.",
    amenities: ["Lake view", "Wifi", "Kitchen", "Air conditioning", "Breakfast", "Boat access"],
    latitude: 9.6175,
    longitude: 76.4304,
    cleaningFee: 1250,
  },
  {
    slug: "farmstay-near-pune",
    name: "A little farmstay in the Sahyadris",
    location: "Mulshi, India",
    region: "Maharashtra",
    distance: "48 km from Pune",
    nightlyPrice: 6200,
    rating: 4.86,
    category: "Farms",
    bedrooms: 2,
    beds: 3,
    baths: 2,
    maxGuests: 5,
    instantBook: false,
    images: [
      image("photo-1449158743715-0a90ebb6d2d8"),
      image("photo-1518780664697-55e3ad937233"),
      image("photo-1510798831971-661eb04b3739"),
      image("photo-1600607687920-4e2a09cf159d"),
    ],
    hostName: "Rohan",
    hostSince: "2019",
    description: "A working farm with open lawns, home-style seasonal meals and an easy rhythm for a weekend away.",
    amenities: ["Garden view", "Kitchen", "Breakfast", "Free parking", "Outdoor dining"],
    latitude: 18.514,
    longitude: 73.5112,
    cleaningFee: 450,
  },
  {
    slug: "design-loft-in-bengaluru",
    name: "Sunlit design loft near the gardens",
    location: "Bengaluru, India",
    region: "Karnataka",
    distance: "1 km from Lalbagh Botanical Garden",
    nightlyPrice: 5100,
    rating: 4.92,
    category: "Trending",
    bedrooms: 1,
    beds: 1,
    baths: 1,
    maxGuests: 2,
    instantBook: true,
    images: [
      image("photo-1600210492486-724fe5c67fb0"),
      image("photo-1600607687920-4e2a09cf159d"),
      image("photo-1616486338812-3dadae4b4ace"),
      image("photo-1600607687939-ce8a6c25118c"),
    ],
    hostName: "Ishita",
    hostSince: "2023",
    description: "A warm, design-forward loft in a walkable neighbourhood, with thoughtful details for short and longer stays.",
    amenities: ["Wifi", "Kitchen", "Air conditioning", "Workspace", "Washer"],
    latitude: 12.9716,
    longitude: 77.5946,
    cleaningFee: 300,
  },
  {
    slug: "mountain-cottage-in-kasauli",
    name: "Stone cottage with a cedar deck",
    location: "Kasauli, India",
    region: "Himachal Pradesh",
    distance: "3 km from the heritage market",
    nightlyPrice: 8100,
    rating: 4.93,
    category: "Mountains",
    bedrooms: 2,
    beds: 3,
    baths: 2,
    maxGuests: 4,
    instantBook: true,
    images: [
      image("photo-1510798831971-661eb04b3739"),
      image("photo-1449158743715-0a90ebb6d2d8"),
      image("photo-1518780664697-55e3ad937233"),
      image("photo-1449844908441-8829872d2607"),
    ],
    hostName: "Vikram",
    hostSince: "2018",
    description: "A stone-and-cedar cottage with a sheltered deck, a fireplace and pine-scented trails just outside the door.",
    amenities: ["Mountain view", "Wifi", "Kitchen", "Fireplace", "Free parking"],
    latitude: 30.8988,
    longitude: 76.965,
    cleaningFee: 600,
  },
];

type DatabaseGlobal = typeof globalThis & { __roamDatabase?: DatabaseSync };
const databaseGlobal = globalThis as DatabaseGlobal;

function initializeDatabase() {
  const directory = join(process.cwd(), "data");
  mkdirSync(directory, { recursive: true });
  const database = new DatabaseSync(join(directory, "roam.sqlite"));

  database.exec(`
    PRAGMA journal_mode = WAL;
    PRAGMA busy_timeout = 10000;
    PRAGMA foreign_keys = ON;
    CREATE TABLE IF NOT EXISTS categories (
      slug TEXT PRIMARY KEY,
      label TEXT NOT NULL,
      sort_order INTEGER NOT NULL
    );
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      email TEXT NOT NULL UNIQUE,
      password_hash TEXT NOT NULL,
      role TEXT NOT NULL DEFAULT 'guest',
      created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
    );
    CREATE TABLE IF NOT EXISTS properties (
      slug TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      location TEXT NOT NULL,
      region TEXT NOT NULL,
      distance TEXT NOT NULL,
      nightly_price INTEGER NOT NULL,
      rating REAL NOT NULL,
      category TEXT NOT NULL,
      bedrooms INTEGER NOT NULL,
      beds INTEGER NOT NULL,
      baths INTEGER NOT NULL,
      max_guests INTEGER NOT NULL,
      instant_book INTEGER NOT NULL,
      images TEXT NOT NULL,
      host_name TEXT NOT NULL,
      host_since TEXT NOT NULL,
      description TEXT NOT NULL,
      amenities TEXT NOT NULL,
      latitude REAL NOT NULL,
      longitude REAL NOT NULL,
      cleaning_fee INTEGER NOT NULL,
      status TEXT NOT NULL DEFAULT 'active',
      created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
    );
    CREATE TABLE IF NOT EXISTS bookings (
      id TEXT PRIMARY KEY,
      user_id INTEGER NOT NULL REFERENCES users(id),
      property_slug TEXT NOT NULL REFERENCES properties(slug),
      check_in TEXT NOT NULL,
      check_out TEXT NOT NULL,
      guests INTEGER NOT NULL,
      nights INTEGER NOT NULL,
      nightly_price INTEGER NOT NULL,
      cleaning_fee INTEGER NOT NULL,
      service_fee INTEGER NOT NULL,
      taxes INTEGER NOT NULL,
      total INTEGER NOT NULL,
      status TEXT NOT NULL DEFAULT 'pending_payment',
      created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
    );
    CREATE INDEX IF NOT EXISTS bookings_dates ON bookings(property_slug, check_in, check_out, status);
    CREATE TABLE IF NOT EXISTS wishlists (
      user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      property_slug TEXT NOT NULL REFERENCES properties(slug) ON DELETE CASCADE,
      created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
      PRIMARY KEY (user_id, property_slug)
    );
    CREATE TABLE IF NOT EXISTS reviews (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER REFERENCES users(id),
      property_slug TEXT NOT NULL REFERENCES properties(slug),
      user_name TEXT NOT NULL,
      rating INTEGER NOT NULL CHECK (rating BETWEEN 1 AND 5),
      comment TEXT NOT NULL,
      status TEXT NOT NULL DEFAULT 'approved',
      created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
    );
    CREATE TABLE IF NOT EXISTS payments (
      id TEXT PRIMARY KEY,
      booking_id TEXT NOT NULL REFERENCES bookings(id),
      amount INTEGER NOT NULL,
      provider TEXT NOT NULL,
      provider_reference TEXT,
      status TEXT NOT NULL,
      created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
    );
  `);

  const userColumns = database.prepare("PRAGMA table_info(users)").all() as { name: string }[];
  if (!userColumns.some((column) => column.name === "phone")) {
    database.exec("ALTER TABLE users ADD COLUMN phone TEXT");
  }

  const categories = [
    ["views", "Amazing views"],
    ["cabins", "Cabins"],
    ["beachfront", "Beachfront"],
    ["farms", "Farms"],
    ["mountains", "Mountains"],
    ["pools", "Amazing pools"],
    ["luxury", "Luxury stays"],
    ["trending", "Trending"],
  ];
  const categoryCount = Number(database.prepare("SELECT COUNT(*) AS count FROM categories").get()?.count ?? 0);

  if (categoryCount === 0) {
    const insertCategory = database.prepare("INSERT INTO categories (slug, label, sort_order) VALUES (?, ?, ?)");
    categories.forEach(([slug, label], index) => insertCategory.run(slug, label, index));
  }

  const propertyCount = Number(database.prepare("SELECT COUNT(*) AS count FROM properties").get()?.count ?? 0);

  if (propertyCount === 0) {
    const insertStay = database.prepare(`
      INSERT INTO properties (
        slug, name, location, region, distance, nightly_price, rating, category,
        bedrooms, beds, baths, max_guests, instant_book, images, host_name,
        host_since, description, amenities, latitude, longitude, cleaning_fee
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    for (const stay of seedStays) {
      insertStay.run(
        stay.slug,
        stay.name,
        stay.location,
        stay.region,
        stay.distance,
        stay.nightlyPrice,
        stay.rating,
        stay.category,
        stay.bedrooms,
        stay.beds,
        stay.baths,
        stay.maxGuests,
        stay.instantBook ? 1 : 0,
        JSON.stringify(stay.images),
        stay.hostName,
        stay.hostSince,
        stay.description,
        JSON.stringify(stay.amenities),
        stay.latitude,
        stay.longitude,
        stay.cleaningFee,
      );
    }

    const insertReview = database.prepare(`
      INSERT INTO reviews (property_slug, user_name, rating, comment)
      VALUES (?, ?, ?, ?)
    `);
    insertReview.run(seedStays[0].slug, "Aarav", 5, "The morning light over the estate was unreal. We slowed right down and loved every minute.");
    insertReview.run(seedStays[1].slug, "Nisha", 5, "A beautiful, calm home with thoughtful details. The courtyard became our favourite place.");
    insertReview.run(seedStays[2].slug, "Ritu", 5, "Exactly the kind of hill escape we needed. Clear directions, kind hosting and a spectacular view.");
  }

  return database;
}

export const db = databaseGlobal.__roamDatabase ?? initializeDatabase();
databaseGlobal.__roamDatabase = db;

function toStay(row: Record<string, unknown>): Stay {
  return {
    slug: String(row.slug),
    name: String(row.name),
    location: String(row.location),
    region: String(row.region),
    distance: String(row.distance),
    nightlyPrice: Number(row.nightly_price),
    rating: Number(row.rating),
    reviewCount: Number(row.review_count ?? 0),
    category: String(row.category),
    bedrooms: Number(row.bedrooms),
    beds: Number(row.beds),
    baths: Number(row.baths),
    maxGuests: Number(row.max_guests),
    instantBook: Boolean(row.instant_book),
    images: JSON.parse(String(row.images)) as string[],
    hostName: String(row.host_name),
    hostSince: String(row.host_since),
    description: String(row.description),
    amenities: JSON.parse(String(row.amenities)) as string[],
    latitude: Number(row.latitude),
    longitude: Number(row.longitude),
    cleaningFee: Number(row.cleaning_fee),
  };
}

const staySelect = `
  SELECT properties.*,
    (SELECT COUNT(*) FROM reviews WHERE reviews.property_slug = properties.slug AND reviews.status = 'approved') AS review_count
  FROM properties
`;

export function getStays(filters: StayFilters = {}) {
  const clauses = ["status = 'active'"];
  const values: SQLInputValue[] = [];

  if (filters.location?.trim()) {
    clauses.push("(location LIKE ? OR region LIKE ? OR name LIKE ?)");
    const query = `%${filters.location.trim()}%`;
    values.push(query, query, query);
  }

  if (filters.category) {
    clauses.push("category = ?");
    values.push(filters.category);
  }

  if (filters.checkIn && filters.checkOut && filters.checkOut > filters.checkIn) {
    clauses.push(`NOT EXISTS (
      SELECT 1 FROM bookings
      WHERE bookings.property_slug = properties.slug
        AND bookings.status IN ('pending_payment', 'confirmed')
        AND bookings.check_in < ? AND bookings.check_out > ?
    )`);
    values.push(filters.checkOut, filters.checkIn);
  }

  if (filters.guests && filters.guests > 0) {
    clauses.push("max_guests >= ?");
    values.push(filters.guests);
  }

  if (filters.minPrice !== undefined && Number.isFinite(filters.minPrice)) {
    clauses.push("nightly_price >= ?");
    values.push(filters.minPrice);
  }

  if (filters.maxPrice !== undefined && Number.isFinite(filters.maxPrice)) {
    clauses.push("nightly_price <= ?");
    values.push(filters.maxPrice);
  }

  if (filters.minRating && Number.isFinite(filters.minRating)) {
    clauses.push("rating >= ?");
    values.push(filters.minRating);
  }

  if (filters.bedrooms && filters.bedrooms > 0) {
    clauses.push("bedrooms >= ?");
    values.push(filters.bedrooms);
  }

  if (filters.instantBook) {
    clauses.push("instant_book = 1");
  }

  if (filters.amenities?.length) {
    filters.amenities.slice(0, 10).forEach((amenity) => {
      clauses.push("EXISTS (SELECT 1 FROM json_each(properties.amenities) WHERE json_each.value = ?)");
      values.push(amenity);
    });
  }

  const sort = {
    recommended: "rating DESC, review_count DESC",
    "price-low": "nightly_price ASC",
    "price-high": "nightly_price DESC",
    rating: "rating DESC",
  }[filters.sort ?? "recommended"];

  const rows = db.prepare(`${staySelect} WHERE ${clauses.join(" AND ")} ORDER BY ${sort}`).all(...values);

  return rows.map(toStay);
}

export function getAdminStays() {
  return db.prepare(`${staySelect} ORDER BY properties.created_at DESC`).all().map((row) => ({
    ...toStay(row),
    status: String(row.status),
  }));
}

export function getStay(slug: string): Stay | null {
  const row = db.prepare(`${staySelect} WHERE properties.slug = ? AND properties.status = 'active'`).get(slug);
  return row ? toStay(row) : null;
}

export function getCategories() {
  return db.prepare("SELECT slug, label FROM categories ORDER BY sort_order").all()
    .map((row) => ({ slug: String(row.slug), label: String(row.label) }));
}

export function getStayReviews(slug: string) {
  return db.prepare(`
    SELECT user_name AS name, rating, comment, created_at AS createdAt
    FROM reviews WHERE property_slug = ? AND status = 'approved'
    ORDER BY created_at DESC LIMIT 20
  `).all(slug).map((row) => ({
    name: String(row.name),
    rating: Number(row.rating),
    comment: String(row.comment),
    createdAt: String(row.createdAt),
  }));
}

export function getWishlist(userId: number) {
  return db.prepare(`${staySelect} JOIN wishlists ON wishlists.property_slug = properties.slug WHERE wishlists.user_id = ? ORDER BY wishlists.created_at DESC`).all(userId).map(toStay);
}

export function toggleWishlist(userId: number, slug: string) {
  const existing = db.prepare("SELECT 1 FROM wishlists WHERE user_id = ? AND property_slug = ?").get(userId, slug);
  if (existing) {
    db.prepare("DELETE FROM wishlists WHERE user_id = ? AND property_slug = ?").run(userId, slug);
    return false;
  }

  db.prepare("INSERT OR IGNORE INTO wishlists (user_id, property_slug) VALUES (?, ?)").run(userId, slug);
  return true;
}