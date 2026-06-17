export type UserRole = "donatur" | "penerima" | "admin";
export type PublicUserRole = Exclude<UserRole, "admin">;

export type Profile = {
  id: string;
  email: string;
  name: string;
  phone?: string;
  role: UserRole;
  address?: string;
  organization?: string;
  beneficiaries?: number;
  avatar_url?: string;
  created_at?: string;
};

export type NutritionEstimate = {
  calories_estimate?: string | number;
  calories?: string | number;
  protein?: string | number;
  carbohydrate?: string | number;
  carbs?: string | number;
  fat?: string | number;
  fiber?: string | number;
  sodium?: string | number;
  ingredients_detected?: string[];
  seasonings_detected?: string[];
  allergens?: string[];
  nutrition_note?: string;
  recommendation?: string;
  provider?: string;
  confidence?: number;
  assessed_at?: string;
  [key: string]: unknown;
};

export type ExpiryAssessment = {
  risk_level?: string;
  safe_hours?: number;
  recommended_consume_before?: string;
  storage_recommendation?: string;
  food_safety_warnings?: string[];
  expiry_reason?: string;
};

export type AiAssessment = {
  provider: string;
  nutrition: NutritionEstimate;
  allergens: string[];
  expiry_risk: string;
  recommendation: string;
  confidence?: number;
  assessed_at: string;
  expiry?: ExpiryAssessment;
};

export type DonationStatus = "draft" | "active" | "pending_verification" | "reserved" | "picked_up" | "completed" | "expired" | "rejected";

export type Donation = {
  id: string;
  donor_id: string;
  food_name: string;
  category: string;
  halal: boolean;
  description?: string;
  portions: number;
  location: string;
  pickup_deadline: string;
  production_time?: string;
  storage_method?: string;
  status: DonationStatus;
  nutrition?: NutritionEstimate | null;
  expiry_risk?: string | null;
  expiry?: ExpiryAssessment | null;
  image_url?: string | null;
  created_at: string;
};

export type RequestStatus = "pending" | "approved" | "rejected" | "completed" | "cancelled";

export type FoodRequest = {
  id: string;
  donation_id?: string;
  recipient_id: string;
  donor_id?: string;
  food_name: string;
  portions: number;
  pickup_method: "pickup";
  note?: string;
  status: RequestStatus;
  created_at: string;
};

export type Notification = {
  id: string;
  user_id: string;
  title: string;
  message: string;
  type: "info" | "success" | "warning" | "system";
  link?: string;
  is_read: boolean;
  created_at: string;
};


export type Complaint = {
  id: string;
  user_id: string;
  role: UserRole;
  subject: string;
  message: string;
  status: "open" | "in_review" | "resolved";
  created_at: string;
};

export type Preferences = {
  halal: boolean;
  vegetarian: boolean;
  maxDistanceKm: number;
  preferredCategories: string[];
  notificationEmail: boolean;
  notificationPush: boolean;
};

export type RoleScopedData = {
  profiles: Profile[];
  donations: Donation[];
  requests: FoodRequest[];
  notifications: Notification[];
  complaints: Complaint[];
  preferences: Preferences;
};
