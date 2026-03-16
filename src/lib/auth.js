import { supabase } from "./supabase.js";

export async function signUp(email, password, name) {
  if (!supabase) return { user: null, error: "Supabase yapilandirilmamis" };
  var { data, error } = await supabase.auth.signUp({
    email: email,
    password: password,
    options: { data: { name: name || "" } },
  });
  if (error) return { user: null, error: error.message };
  return { user: data.user, error: null };
}

export async function signIn(email, password) {
  if (!supabase) return { user: null, error: "Supabase yapilandirilmamis" };
  var { data, error } = await supabase.auth.signInWithPassword({
    email: email,
    password: password,
  });
  if (error) return { user: null, error: error.message };
  return { user: data.user, error: null };
}

export async function signInWithGoogle() {
  if (!supabase) return { error: "Supabase yapilandirilmamis" };
  var { error } = await supabase.auth.signInWithOAuth({
    provider: "google",
    options: { redirectTo: window.location.origin },
  });
  if (error) return { error: error.message };
  return { error: null };
}

export async function signOut() {
  if (!supabase) return;
  await supabase.auth.signOut();
}

export async function getUser() {
  if (!supabase) return null;
  var {
    data: { user },
  } = await supabase.auth.getUser();
  return user;
}

export function onAuthChange(callback) {
  if (!supabase) return { data: { subscription: { unsubscribe: function () {} } } };
  return supabase.auth.onAuthStateChange(function (_event, session) {
    callback(session ? session.user : null);
  });
}
