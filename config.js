// Supabase connection. The anon key is public by design — row-level security
// on public.days is what protects the data, not this string.
window.CONFIG = {
  url: "https://jsafvekjzibpenfkoqmn.supabase.co",
  anonKey: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImpzYWZ2ZWtqemlicGVuZmtvcW1uIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODg2MTIwMjUsImV4cCI6MjEwNDE4ODAyNX0.z93dlJNiWCSg24uWO3s5UXoTOPGBFmVjy-rihOJbVAE",
  // Renumbers the weeks only. It CANNOT hide history — the app reads back to a
  // hardcoded horizon regardless, so moving this to start a new block is safe.
  blockStart: "2026-09-07",
  // Sign-in is email-only by choice. The app derives the account key from
  // the email plus this salt, so the table still sits behind row-level
  // security and cannot be dumped by anyone who does not know the address.
  salt: "36f04996c8190a3f1d901f8967c5f91d"
};
