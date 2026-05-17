import { createBrowserClient } from "@supabase/ssr";

// Strip BOM (U+FEFF) and whitespace that PowerShell sometimes adds to env vars
const clean = (s: string | undefined) => (s ?? "").replace(/^﻿/, "").trim();

export const supabase = createBrowserClient(
  clean(process.env.NEXT_PUBLIC_SUPABASE_URL),
  clean(process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY)
);

export type QuoteStatus =
  | "received"
  | "approved"
  | "printing"
  | "quality_check"
  | "ready"
  | "shipped";

export type Quote = {
  id: string;
  created_at: string;
  name: string;
  email: string;
  model_url: string;
  quantity: number;
  color: string;
  material: string;
  nfc_chip: boolean;
  customizations: string | null;
  status: QuoteStatus;
  order_id: string;
  shipping_address: string | null;
  tracking_number: string | null;
  tracking_carrier: string | null;
  quoted_price: string | null;
  payment_status: string;
  paid_at: string | null;
};

export type TimeLapse = {
  id: string;
  title: string;
  caption: string | null;
  video_url: string;
  material_tag: string | null;
  color_tag: string | null;
  visible: boolean;
  sort_order: number;
};

export type AdminOption = {
  id: string;
  type: "color" | "material";
  label: string;
  value: string;
};
