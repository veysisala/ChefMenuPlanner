import { supabase } from "./supabase.js";

// Kullanici ID'si — login varsa supabase uid, yoksa null
var _userId = null;

export function setStorageUser(uid) {
  _userId = uid;
}

export function getStorageUser() {
  return _userId;
}

// ── localStorage helpers ──
function lsGet(key) {
  try {
    var v = localStorage.getItem(key);
    return v ? JSON.parse(v) : null;
  } catch (e) {
    return null;
  }
}

function lsSet(key, value) {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch (e) {}
}

// ── Supabase KV store (user_data tablosu) ──
async function sbGet(userId, key) {
  if (!supabase || !userId) return null;
  try {
    var { data, error } = await supabase
      .from("user_data")
      .select("value")
      .eq("user_id", userId)
      .eq("key", key)
      .maybeSingle();
    if (error || !data) return null;
    return data.value;
  } catch (e) {
    return null;
  }
}

async function sbSet(userId, key, value) {
  if (!supabase || !userId) return;
  try {
    await supabase.from("user_data").upsert(
      { user_id: userId, key: key, value: value, updated_at: new Date().toISOString() },
      { onConflict: "user_id,key" }
    );
  } catch (e) {}
}

// ── Public API (mevcut stGet/stSet uyumlu) ──
export async function stGet(key) {
  if (_userId && supabase) {
    var val = await sbGet(_userId, key);
    if (val !== null) return val;
    // Supabase'de yoksa localStorage'dan migration dene
    var local = lsGet(key);
    if (local !== null) {
      await sbSet(_userId, key, local);
      return local;
    }
    return null;
  }
  return lsGet(key);
}

export async function stSet(key, value) {
  // Her zaman localStorage'a da yaz (offline fallback)
  lsSet(key, value);
  if (_userId && supabase) {
    await sbSet(_userId, key, value);
  }
}

// Supabase SQL Schema (manual olarak Supabase Dashboard'da calistirilacak):
//
// create table if not exists user_data (
//   id uuid default gen_random_uuid() primary key,
//   user_id uuid references auth.users(id) on delete cascade not null,
//   key text not null,
//   value jsonb,
//   updated_at timestamptz default now(),
//   unique(user_id, key)
// );
//
// alter table user_data enable row level security;
//
// create policy "Users can read own data"
//   on user_data for select using (auth.uid() = user_id);
//
// create policy "Users can insert own data"
//   on user_data for insert with check (auth.uid() = user_id);
//
// create policy "Users can update own data"
//   on user_data for update using (auth.uid() = user_id);
//
// create policy "Users can delete own data"
//   on user_data for delete using (auth.uid() = user_id);
