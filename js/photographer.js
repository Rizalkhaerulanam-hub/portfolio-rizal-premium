/* 
  PROJECT FOTOGRAFER — Supabase client.
  GANTI dua nilai berikut dengan Project URL dan anon/publishable key Supabase Anda.
*/
const SUPABASE_URL = "PASTE_SUPABASE_URL";
const SUPABASE_ANON_KEY = "PASTE_SUPABASE_ANON_OR_PUBLISHABLE_KEY";

const sb = window.supabase?.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
const $ = (id) => document.getElementById(id);

const ROLE_LABEL = { FEMALE: "👩 Perempuan", MALE: "👨 Laki-laki", PUBLIC: "🌐 Umum", PENDING: "⏳ Menunggu verifikasi", NONE: "Belum memiliki izin" };

function status(el, text, kind="wait") {
  el.textContent = text;
  el.className = `status show ${kind}`;
}

function configured() {
  return sb && !SUPABASE_URL.startsWith("PASTE_") && !SUPABASE_ANON_KEY.startsWith("PASTE_");
}

async function getProfile(userId) {
  const { data, error } = await sb.from("profiles").select("id,full_name,access_role,status").eq("id", userId).maybeSingle();
  if (error) throw error;
  return data;
}

async function loadGallery(role) {
  const grid = $("galleryGrid");
  if (!role || role === "NONE" || role === "PENDING") {
    grid.innerHTML = '<div class="locked"><div><strong>🔒 Galeri terkunci</strong><p class="muted">Akses belum disetujui admin.</p></div></div>';
    return;
  }

  // RLS database hanya mengembalikan metadata foto yang sesuai role.
  const { data, error } = await sb.from("photos")
    .select("id,title,access_role,display_url")
    .eq("is_published", true)
    .in("access_role", role === "PUBLIC" ? ["PUBLIC"] : [role, "PUBLIC"])
    .order("created_at", { ascending: false });

  if (error) {
    grid.innerHTML = '<div class="locked"><div><strong>Gagal memuat galeri.</strong><p class="muted">Periksa konfigurasi Supabase.</p></div></div>';
    return;
  }

  if (!data?.length) {
    grid.innerHTML = '<div class="locked"><div><strong>Belum ada foto.</strong><p class="muted">Koleksi untuk akses ini belum dipublikasikan.</p></div></div>';
    return;
  }

  grid.innerHTML = data.map(p => `
    <figure class="gallery-item">
      <img src="${escapeHtml(p.display_url)}" alt="${escapeHtml(p.title || "Foto portfolio")}" loading="lazy">
    </figure>`).join("");
}

function escapeHtml(v="") {
  return String(v).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#039;'}[c]));
}

async function refreshAccount() {
  if (!configured()) return;
  const { data: { user } } = await sb.auth.getUser();
  if (!user) {
    $("loggedOut").style.display = "";
    $("accountPanel").classList.remove("show");
    return;
  }

  $("loggedOut").style.display = "none";
  $("accountPanel").classList.add("show");

  try {
    const p = await getProfile(user.id);
    $("welcomeName").textContent = p?.full_name || user.email || "Pengunjung";
    $("accountRole").textContent = `Status: ${p?.status || "PENDING"} · Akses: ${ROLE_LABEL[p?.access_role] || ROLE_LABEL.NONE}`;
    if (p?.status === "APPROVED") {
      status($("accountStatus"), "Akses Anda sudah disetujui. Role ini tersimpan pada akun dan tidak dapat diubah oleh pengunjung.", "ok");
      await loadGallery(p.access_role);
    } else if (p?.status === "REJECTED") {
      status($("accountStatus"), "Permintaan akses Anda ditolak oleh admin. Hubungi admin jika perlu mengajukan kembali.", "err");
      await loadGallery("NONE");
    } else {
      status($("accountStatus"), "Permintaan Anda masih menunggu verifikasi admin.", "wait");
      await loadGallery("PENDING");
    }
  } catch (e) {
    status($("accountStatus"), "Tidak dapat membaca status akun: " + e.message, "err");
  }
}

$("authForm").addEventListener("submit", async (e) => {
  e.preventDefault();
  if (!configured()) return status($("authStatus"), "Supabase belum dikonfigurasi. Isi SUPABASE_URL dan SUPABASE_ANON_KEY di js/photographer.js.", "err");
  const email = $("email").value.trim();
  const password = $("password").value;
  const { error } = await sb.auth.signInWithPassword({ email, password });
  if (error) return status($("authStatus"), error.message, "err");
  status($("authStatus"), "Berhasil masuk.", "ok");
  await refreshAccount();
});

$("registerBtn").addEventListener("click", async () => {
  if (!configured()) return status($("authStatus"), "Supabase belum dikonfigurasi.", "err");
  const email = $("email").value.trim();
  const password = $("password").value;
  if (!email || password.length < 6) return status($("authStatus"), "Isi email dan password minimal 6 karakter.", "err");
  const { error } = await sb.auth.signUp({ email, password });
  if (error) return status($("authStatus"), error.message, "err");
  status($("authStatus"), "Akun dibuat. Jika email confirmation aktif, cek email Anda lalu masuk.", "ok");
});

$("requestForm").addEventListener("submit", async (e) => {
  e.preventDefault();
  if (!configured()) return status($("requestStatus"), "Supabase belum dikonfigurasi.", "err");
  const { data: { user } } = await sb.auth.getUser();
  if (!user) return status($("requestStatus"), "Silakan masuk/daftar terlebih dahulu.", "err");

  const role = new FormData(e.currentTarget).get("role");
  const name = $("requestName").value.trim();
  if (!name || !role) return status($("requestStatus"), "Lengkapi nama dan kategori akses.", "err");

  const { data: profile } = await sb.from("profiles").select("status,access_role").eq("id", user.id).maybeSingle();
  if (profile?.status === "APPROVED") return status($("requestStatus"), "Akun Anda sudah memiliki izin. Role tidak dapat diganti oleh pengunjung.", "err");

  const { error } = await sb.from("access_requests").insert({ user_id: user.id, requested_role: role, applicant_name: name });
  if (error) return status($("requestStatus"), error.message, "err");

  await sb.from("profiles").update({ full_name: name, status: "PENDING", access_role: "NONE" }).eq("id", user.id);
  status($("requestStatus"), "Permintaan terkirim. Tunggu verifikasi admin.", "ok");
  await refreshAccount();
});

$("logoutBtn").addEventListener("click", async () => {
  await sb.auth.signOut();
  location.reload();
});
$("refreshBtn").addEventListener("click", refreshAccount);

if (configured()) refreshAccount();
