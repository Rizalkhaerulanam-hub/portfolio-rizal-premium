/* 
  PROJECT FOTOGRAFER — Supabase client.
  GANTI dua nilai berikut dengan Project URL dan anon/publishable key Supabase Anda.
*/
const SUPABASE_URL = "https://ekbpgriafhiqvzwdywoc.supabase.co";
const SUPABASE_ANON_KEY = "sb_publishable_ITJL59-5AGNuhNPHBO59og_GOzCPBI6";
const GOOGLE_DRIVE_API_KEY = "AIzaSyBKdYKIk-fY3PwK_dvx8olTD2knXHTPwAA";

const sb = window.supabase?.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
const $ = (id) => document.getElementById(id);

function openWhatsAppMessage(phoneNumber, message) {
  const cleaned = String(phoneNumber || "").replace(/\D/g, "");
  if (!cleaned) return;

  const baseUrl = `https://wa.me/${cleaned}`;
  const finalUrl = `${baseUrl}?text=${encodeURIComponent(message)}`;
  window.open(finalUrl, "_blank", "noopener,noreferrer");
}

const ROLE_LABEL = {
  FEMALE: "👩 Perempuan",
  MALE: "👨 Laki-laki",
  PUBLIC: "🌐 Umum",
  PENDING: "⏳ Menunggu verifikasi",
  NONE: "Belum memiliki izin",
};

const DRIVE_FOLDERS = {
  umum: "ID_FOLDER_UMUM_DI_GOOGLE_DRIVE",
  putra: "ID_FOLDER_PUTRA_DI_GOOGLE_DRIVE",
  putri: "ID_FOLDER_PUTRI_DI_GOOGLE_DRIVE",
};

function getAllowedDriveFoldersFromRole(role) {
  const normalized = String(role || "")
    .trim()
    .toLowerCase();

  if (normalized === "umum" || normalized === "public") {
    return [DRIVE_FOLDERS.umum, DRIVE_FOLDERS.putra, DRIVE_FOLDERS.putri];
  }

  if (normalized === "putra" || normalized === "male") {
    return [DRIVE_FOLDERS.umum, DRIVE_FOLDERS.putra];
  }

  if (normalized === "putri" || normalized === "female") {
    return [DRIVE_FOLDERS.umum, DRIVE_FOLDERS.putri];
  }

  return [DRIVE_FOLDERS.umum];
}

function driveConfigReady() {
  const hasApiKey =
    !!GOOGLE_DRIVE_API_KEY && !GOOGLE_DRIVE_API_KEY.startsWith("PASTE_");
  const hasFolderIds = Object.values(DRIVE_FOLDERS).every(
    (id) => !!id && !id.startsWith("ID_FOLDER_"),
  );
  return hasApiKey && hasFolderIds;
}

async function dapatkanAksesFolder(role = "") {
  if (role) return getAllowedDriveFoldersFromRole(role);

  if (!configured()) return [DRIVE_FOLDERS.umum];

  try {
    const {
      data: { user },
      error,
    } = await sb.auth.getUser();
    if (error || !user) return [DRIVE_FOLDERS.umum];

    const profileRole =
      user.user_metadata?.role || user.app_metadata?.role || "NONE";

    return getAllowedDriveFoldersFromRole(profileRole);
  } catch (e) {
    return [DRIVE_FOLDERS.umum];
  }
}

function status(el, text, kind = "wait") {
  el.textContent = text;
  el.className = `status show ${kind}`;
}

function configured() {
  return (
    sb &&
    !SUPABASE_URL.startsWith("PASTE_") &&
    !SUPABASE_ANON_KEY.startsWith("PASTE_")
  );
}

async function getProfile(userId) {
  const { data, error } = await sb
    .from("profiles")
    .select("id,full_name,access_role,status")
    .eq("id", userId)
    .maybeSingle();
  if (error) throw error;
  return data;
}

async function fetchGoogleDriveFiles(folderId) {
  const url = `https://www.googleapis.com/drive/v3/files?q=${encodeURIComponent(`'${folderId}' in parents and trashed = false`)}&fields=files(id,name,mimeType,webViewLink,thumbnailLink)&key=${GOOGLE_DRIVE_API_KEY}`;

  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`Gagal memuat folder Drive: ${response.status}`);
  }

  const json = await response.json();
  return (json.files || []).filter((file) =>
    file.mimeType?.startsWith("image/"),
  );
}

function renderDriveGallery(files) {
  const grid = $("galleryGrid");

  if (!files.length) {
    grid.innerHTML =
      '<div class="locked"><div><strong>Belum ada foto.</strong><p class="muted">Koleksi untuk akses ini belum dipublikasikan.</p></div></div>';
    return;
  }

  grid.innerHTML = files
    .map(
      (file) => `
      <figure class="gallery-item">
        <img src="https://drive.google.com/uc?export=view&id=${file.id}" alt="${escapeHtml(file.name || "Foto portfolio")}" loading="lazy">
      </figure>`,
    )
    .join("");
}

async function loadDriveGallery(role) {
  const grid = $("galleryGrid");
  if (!role || role === "NONE" || role === "PENDING") {
    grid.innerHTML =
      '<div class="locked"><div><strong>🔒 Galeri terkunci</strong><p class="muted">Akses belum disetujui admin.</p></div></div>';
    return;
  }

  const folderIds = getAllowedDriveFoldersFromRole(role);
  const allFiles = [];

  for (const folderId of folderIds) {
    if (!folderId) continue;
    try {
      const files = await fetchGoogleDriveFiles(folderId);
      allFiles.push(...files);
    } catch (err) {
      console.error("Drive gallery fetch failed:", err);
    }
  }

  renderDriveGallery(allFiles);
}

async function loadGallery(role) {
  const grid = $("galleryGrid");

  if (!role || role === "NONE" || role === "PENDING") {
    grid.innerHTML =
      '<div class="locked"><div><strong>🔒 Galeri terkunci</strong><p class="muted">Akses belum disetujui admin.</p></div></div>';
    return;
  }

  if (driveConfigReady()) {
    await loadDriveGallery(role);
    return;
  }

  const allowedRoles =
    role === "PUBLIC"
      ? ["PUBLIC", "MALE", "FEMALE"]
      : role === "MALE"
        ? ["MALE", "PUBLIC"]
        : role === "FEMALE"
          ? ["FEMALE", "PUBLIC"]
          : [];

  if (!allowedRoles.length) {
    grid.innerHTML =
      '<div class="locked"><div><strong>🔒 Galeri terkunci</strong><p class="muted">Akses belum disetujui admin.</p></div></div>';
    return;
  }

  const { data, error } = await sb
    .from("photos")
    .select("id,title,access_role,display_url")
    .eq("is_published", true)
    .in("access_role", allowedRoles)
    .order("created_at", { ascending: false });

  if (error) {
    grid.innerHTML =
      '<div class="locked"><div><strong>Gagal memuat galeri.</strong><p class="muted">Periksa konfigurasi Supabase.</p></div></div>';
    return;
  }

  if (!data?.length) {
    grid.innerHTML =
      '<div class="locked"><div><strong>Belum ada foto.</strong><p class="muted">Koleksi untuk akses ini belum dipublikasikan.</p></div></div>';
    return;
  }

  grid.innerHTML = data
    .map(
      (p) => `
    <figure class="gallery-item">
      <img src="${escapeHtml(p.display_url)}" alt="${escapeHtml(p.title || "Foto portfolio")}" loading="lazy">
    </figure>`,
    )
    .join("");
}

function escapeHtml(v = "") {
  return String(v).replace(
    /[&<>"']/g,
    (c) =>
      ({
        "&": "&amp;",
        "<": "&lt;",
        ">": "&gt;",
        '"': "&quot;",
        "'": "&#039;",
      })[c],
  );
}

async function refreshAccount() {
  const requestAccessPanel = $("requestAccessPanel");
  const toggleRequestAccessBtn = $("toggleRequestAccessBtn");
  const adminPortalBtn = $("adminPortalBtn");
  const topbarAdminBtn = $("topbarAdminBtn");

  if (!configured()) return;
  const {
    data: { user },
  } = await sb.auth.getUser();
  if (!user) {
    $("loggedOut").style.display = "";
    $("accountPanel").classList.remove("show");
    if (requestAccessPanel) requestAccessPanel.style.display = "none";
    if (toggleRequestAccessBtn) toggleRequestAccessBtn.style.display = "none";
    if (adminPortalBtn) adminPortalBtn.style.display = "none";
    if (topbarAdminBtn) topbarAdminBtn.style.display = "none";
    return;
  }

  $("loggedOut").style.display = "none";
  $("accountPanel").classList.add("show");

  try {
    const p = await getProfile(user.id);
    const isAdmin = Boolean(p?.is_admin);
    $("welcomeName").textContent = p?.full_name || user.email || "Pengunjung";

    if (isAdmin) {
      $("accountRole").textContent =
        "Status: Admin · Akses: Semua kategori galeri";
      status(
        $("accountStatus"),
        "Anda masuk sebagai admin. Semua galeri tersedia dan Anda dapat mengelola izin user dari dashboard.",
        "ok",
      );
      if (adminPortalBtn) adminPortalBtn.style.display = "inline-flex";
      if (topbarAdminBtn) topbarAdminBtn.style.display = "inline-flex";
      if (toggleRequestAccessBtn) toggleRequestAccessBtn.style.display = "none";
      if (requestAccessPanel) requestAccessPanel.style.display = "none";
      await loadGallery("PUBLIC");
      return;
    }

    $("accountRole").textContent =
      `Status: ${p?.status || "PENDING"} · Akses: ${ROLE_LABEL[p?.access_role] || ROLE_LABEL.NONE}`;
    if (adminPortalBtn) adminPortalBtn.style.display = "none";
    if (topbarAdminBtn) topbarAdminBtn.style.display = "none";

    if (p?.status === "APPROVED") {
      if (requestAccessPanel) requestAccessPanel.style.display = "none";
      if (toggleRequestAccessBtn) toggleRequestAccessBtn.style.display = "none";
      status(
        $("accountStatus"),
        "Akses Anda sudah disetujui. Role ini tersimpan pada akun dan tidak dapat diubah oleh pengunjung.",
        "ok",
      );
      await loadGallery(p.access_role);
    } else if (p?.status === "REJECTED") {
      if (requestAccessPanel) requestAccessPanel.style.display = "block";
      if (toggleRequestAccessBtn)
        toggleRequestAccessBtn.style.display = "inline-flex";
      status(
        $("accountStatus"),
        "Permintaan akses Anda ditolak oleh admin. Silakan ajukan kembali dengan kategori yang sesuai.",
        "err",
      );
      await loadGallery("NONE");
    } else {
      if (requestAccessPanel) requestAccessPanel.style.display = "block";
      if (toggleRequestAccessBtn)
        toggleRequestAccessBtn.style.display = "inline-flex";
      status(
        $("accountStatus"),
        "Permintaan Anda masih menunggu verifikasi admin.",
        "wait",
      );
      await loadGallery("PENDING");
    }
  } catch (e) {
    if (requestAccessPanel) requestAccessPanel.style.display = "none";
    if (toggleRequestAccessBtn) toggleRequestAccessBtn.style.display = "none";
    status(
      $("accountStatus"),
      "Tidak dapat membaca status akun: " + e.message,
      "err",
    );
  }
}

$("authForm").addEventListener("submit", async (e) => {
  e.preventDefault();
  if (!configured())
    return status(
      $("authStatus"),
      "Supabase belum dikonfigurasi. Isi SUPABASE_URL dan SUPABASE_ANON_KEY di js/photographer.js.",
      "err",
    );
  const email = $("email").value.trim();
  const password = $("password").value;
  const { error } = await sb.auth.signInWithPassword({ email, password });
  if (error) return status($("authStatus"), error.message, "err");
  status($("authStatus"), "Berhasil masuk.", "ok");
  await refreshAccount();
});

function renderPasswordToggle(button, isVisible) {
  const eyeSvg = `
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path d="M2 12s3.5-6 10-6 10 6 10 6-3.5 6-10 6S2 12 2 12Z"></path>
      <circle cx="12" cy="12" r="3"></circle>
    </svg>
  `;
  const eyeOffSvg = `
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path d="M3 3l18 18"></path>
      <path d="M10.6 10.6A2 2 0 0 0 13.4 13.4"></path>
      <path d="M9.1 5.5A11 11 0 0 1 12 5c6.5 0 10 7 10 7a16.8 16.8 0 0 1-4.3 5.2"></path>
      <path d="M6.2 6.2A16.7 16.7 0 0 0 2 12s3.5 7 10 7a11.3 11.3 0 0 0 5.5-1.5"></path>
    </svg>
  `;

  button.innerHTML = isVisible ? eyeOffSvg : eyeSvg;
  button.setAttribute(
    "aria-label",
    isVisible ? "Sembunyikan password" : "Tampilkan password",
  );
  button.title = isVisible ? "Sembunyikan password" : "Tampilkan password";
}

document.querySelectorAll(".password-toggle").forEach((button) => {
  button.type = "button";

  const input = document.getElementById(button.dataset.target);
  const isVisible = input?.type === "text";
  renderPasswordToggle(button, isVisible);

  button.addEventListener("click", () => {
    const targetInput = document.getElementById(button.dataset.target);
    if (!targetInput) return;

    const nextVisible = targetInput.type === "password";
    targetInput.type = nextVisible ? "text" : "password";
    renderPasswordToggle(button, nextVisible);
  });
});

$("registerBtn").addEventListener("click", async () => {
  if (!configured())
    return status($("authStatus"), "Supabase belum dikonfigurasi.", "err");
  const email = $("email").value.trim();
  const password = $("password").value;
  if (!email || password.length < 6)
    return status(
      $("authStatus"),
      "Isi email dan password minimal 6 karakter.",
      "err",
    );
  const { error } = await sb.auth.signUp({ email, password });
  if (error) return status($("authStatus"), error.message, "err");
  status(
    $("authStatus"),
    "Akun dibuat. Jika email confirmation aktif, cek email Anda lalu masuk.",
    "ok",
  );
});

$("toggleRequestAccessBtn")?.addEventListener("click", () => {
  const panel = $("requestAccessPanel");
  if (!panel) return;
  panel.style.display = panel.style.display === "none" ? "block" : "none";
});

$("requestForm").addEventListener("submit", async (e) => {
  e.preventDefault();
  if (!configured())
    return status($("requestStatus"), "Supabase belum dikonfigurasi.", "err");
  const {
    data: { user },
  } = await sb.auth.getUser();
  if (!user)
    return status(
      $("requestStatus"),
      "Silakan login terlebih dahulu untuk mengajukan izin galeri.",
      "err",
    );

  const role = new FormData(e.currentTarget).get("role");
  const name = $("requestName").value.trim();
  const waNumber = $("requestWa").value.trim();
  if (!name || !role || !waNumber)
    return status(
      $("requestStatus"),
      "Lengkapi nama, nomor WhatsApp, dan kategori akses.",
      "err",
    );

  const { data: profile } = await sb
    .from("profiles")
    .select("status,access_role")
    .eq("id", user.id)
    .maybeSingle();
  if (profile?.status === "APPROVED")
    return status(
      $("requestStatus"),
      "Akun Anda sudah memiliki izin. Role tidak dapat diganti oleh pengunjung.",
      "err",
    );

  const { error } = await sb.from("access_requests").insert({
    user_id: user.id,
    requested_role: role,
    applicant_name: name,
    wa_number: waNumber,
  });
  if (error) return status($("requestStatus"), error.message, "err");

  await sb
    .from("profiles")
    .update({ full_name: name, status: "PENDING", access_role: "NONE" })
    .eq("id", user.id);

  status(
    $("requestStatus"),
    "Permintaan terkirim. Admin akan memproses dan menghubungi Anda via WhatsApp.",
    "ok",
  );
  await refreshAccount();
});

$("logoutBtn").addEventListener("click", async () => {
  await sb.auth.signOut();
  location.reload();
});
$("refreshBtn").addEventListener("click", refreshAccount);

if (configured()) refreshAccount();
