import type { Session, User } from "better-auth";

export type Organization = {
  id: string;
  name: string;
  slug: string;
  logo: string | null;
  metadata: any | null;
  createdAt: string;
};

export type Doctor = {
  id: string;
  user_id: string;

  description: string | null;
  specialized: string | null;

  slot_duration_mins: number | null;

  slug: string;
};

// API response shape
export type OrgListResponse = {
  data: Organization[];
  error: any;
};

export type AuthState = {
  isPending: boolean;
  session: Session | null;
  user: User | null;
  token: string | null;

  // single active org (UI-friendly)
  organization: Organization | null;

  // optional: keep all orgs (future-proof)
  organizations: Organization[];

  doctor: Doctor | null;
};
