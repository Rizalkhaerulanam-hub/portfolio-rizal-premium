/* ==========================================================
   admin.js — Dashboard Admin Studio Fotografi
   Fitur:
   1. Autentikasi Admin & Deteksi Sesi Otomatis
   2. Manajemen Permintaan Akses (Approve, Reject, Hapus, Filter)
   3. Otomasi Pesan WhatsApp ke Pemohon
   4. Manajemen Pengguna (Ubah Role, Status, Hak Admin)
   5. Manajemen Galeri Foto (Tambah, Hapus, Toggle Publikasi)
   6. Statistik & Metrik Dashboard Realtime
   ========================================================== */

const SUPABASE_URL = "https://ekbpgriafhiqvzwdywoc.supabase.co";
const SUPABASE_ANON_KEY = "sb_publishable_ITJL59-5AGNuhNPHBO59og_GOzCPBI6";
const sb = window.supabase?.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

const $ = (id) => document.getElementById(id);

const ROLE_LABEL = {
  FEMALE: "👩 Perempuan",
  MALE: "👨 Laki-laki",
  PUBLIC: "🌐 Umum",
  NONE: "⛔ Belum Memiliki Izin",
};

// State lokal
let currentFilter = "PENDING";
let allRequestsCache = [];
let allUsersCache = [];
let allPhotosCache = [];

/* ----------------------------------------------------------
   UTILITY & TOAST NOTIFICATION
   ---------------------------------------------------------- */
function showToast(message, kind = "ok") {
  const toast = $("adminToast");
  const icon = $("toastIcon");
  const msg = $("toastMsg");
  if (!toast) return;

  icon.textContent = kind === "ok" ? "✅" : "⚠️";
  msg.textContent = message;
  toast.className = `toast show ${kind}`;

  setTimeout(() => {
    toast.className = "toast";
  }, 3200);
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
      })[c]
  );
}

function openWhatsAppMessage(phoneNumber, message) {
  const cleaned = String(phoneNumber || "").replace(/\D/g, "");
  if (!cleaned) return;
  const finalUrl = `https://wa.me/${cleaned}?text=${encodeURIComponent(message)}`;
  window.open(finalUrl, "_blank", "noopener,noreferrer");
}

function configured() {
  return (
    sb &&
    !SUPABASE_URL.startsWith("PASTE_") &&
    !SUPABASE_ANON_KEY.startsWith("PASTE_")
  );
}

/* ----------------------------------------------------------
   PASSWORD TOGGLE VIEW
   ---------------------------------------------------------- */
document.querySelectorAll(".password-toggle").forEach((button) => {
  button.type = "button";
  button.addEventListener("click", () => {
    const input = document.getElementById(button.dataset.target);
    if (!input) return;
    const isVisible = input.type === "text";
    input.type = isVisible ? "password" : "text";
    button.textContent = isVisible ? "👁️" : "🙈";
  });
});

/* ----------------------------------------------------------
   TAB NAVIGATION
   ---------------------------------------------------------- */
document.querySelectorAll(".tab-btn").forEach((btn) => {
  btn.addEventListener("click", () => {
    document.querySelectorAll(".tab-btn").forEach((b) => b.classList.remove("active"));
    document.querySelectorAll(".tab-pane").forEach((p) => p.classList.remove("active"));

    btn.classList.add("active");
    const target = $(btn.dataset.tab);
    if (target) target.classList.add("active");
  });
});

/* ----------------------------------------------------------
   DETEKSI SESI & AUTENTIKASI ADMIN
   ---------------------------------------------------------- */
async function checkCurrentSession() {
  if (!configured()) return;

  const {
    data: { user },
  } = await sb.auth.getUser();

  if (!user) {
    // Belum login
    $("loginPanel").style.display = "block";
    $("nonAdminNotice").style.display = "none";
    $("dashboardPanel").style.display = "none";
    $("logoutBtn").style.display = "none";
    return;
  }

  // Cek apakah user adalah admin di profiles
  const { data: profile, error } = await sb
    .from("profiles")
    .select("is_admin,full_name")
    .eq("id", user.id)
    .maybeSingle();

  if (error || !profile?.is_admin) {
    // User login tapi bukan admin
    $("loginPanel").style.display = "none";
    $("nonAdminNotice").style.display = "block";
    $("loggedUserEmail").textContent = user.email || user.id;
    $("dashboardPanel").style.display = "none";
    $("logoutBtn").style.display = "inline-flex";
    return;
  }

  // User adalah Admin
  $("loginPanel").style.display = "none";
  $("nonAdminNotice").style.display = "none";
  $("dashboardPanel").style.display = "block";
  $("logoutBtn").style.display = "inline-flex";
  $("adminBadgeEmail").textContent = user.email || "Admin";

  await refreshAllData();
}

// Form Login Admin & Pengguna
$("adminLoginForm")?.addEventListener("submit", async (e) => {
  e.preventDefault();
  if (!configured()) {
    return showToast("Konfigurasi Supabase belum terpasang.", "err");
  }

  const email = $("loginEmail").value.trim();
  const password = $("loginPassword").value;
  const submitBtn = $("submitLoginBtn");
  const feedback = $("loginFeedback");

  submitBtn.disabled = true;
  submitBtn.textContent = "Memverifikasi...";
  feedback.style.display = "none";

  try {
    const { data, error } = await sb.auth.signInWithPassword({ email, password });
    if (error) {
      feedback.textContent = "Gagal masuk: " + error.message;
      feedback.className = "status err";
      feedback.style.display = "block";
      return;
    }

    showToast("Berhasil masuk!", "ok");
    await checkCurrentSession();
  } catch (err) {
    feedback.textContent = "Error: " + err.message;
    feedback.className = "status err";
    feedback.style.display = "block";
  } finally {
    submitBtn.disabled = false;
    submitBtn.textContent = "Masuk Sekarang ↗";
  }
});

// Ganti Akun / Logout
$("switchAccountBtn")?.addEventListener("click", async () => {
  if (sb) await sb.auth.signOut();
  location.reload();
});

$("logoutBtn")?.addEventListener("click", async () => {
  if (sb) await sb.auth.signOut();
  showToast("Anda telah keluar.", "ok");
  setTimeout(() => location.reload(), 600);
});

/* ----------------------------------------------------------
   REFRESH SEMUA DATA DASHBOARD
   ---------------------------------------------------------- */
async function refreshAllData() {
  await Promise.all([
    loadRequests(),
    loadUsers(),
    loadPhotos(),
  ]);
  updateMetrics();
}

function updateMetrics() {
  const pendingCount = allRequestsCache.filter((r) => r.status === "PENDING").length;
  $("statPending").textContent = pendingCount;
  $("requestsCountBadge").textContent = pendingCount;
  $("statUsers").textContent = allUsersCache.length;
  $("statPhotos").textContent = allPhotosCache.length;
}

/* ----------------------------------------------------------
   TAB 1: PERMINTAAN AKSES (ACCESS REQUESTS)
   ---------------------------------------------------------- */
async function loadRequests() {
  const container = $("requestsListContainer");
  container.innerHTML = '<p class="muted">Memuat data permintaan...</p>';

  const { data, error } = await sb
    .from("access_requests")
    .select("id,user_id,applicant_name,requested_role,wa_number,status,created_at,reviewed_at")
    .order("created_at", { ascending: false });

  if (error) {
    container.innerHTML = `<p class="status err">Gagal memuat: ${error.message}</p>`;
    return;
  }

  allRequestsCache = data || [];
  renderRequests();
}

function renderRequests() {
  const container = $("requestsListContainer");
  const searchQuery = ($("searchRequests")?.value || "").toLowerCase().trim();

  let filtered = allRequestsCache;

  // Filter Status
  if (currentFilter !== "ALL") {
    filtered = filtered.filter((r) => r.status === currentFilter);
  }

  // Filter Search
  if (searchQuery) {
    filtered = filtered.filter(
      (r) =>
        (r.applicant_name || "").toLowerCase().includes(searchQuery) ||
        (r.wa_number || "").includes(searchQuery)
    );
  }

  if (!filtered.length) {
    container.innerHTML = `
      <div style="text-align: center; padding: 40px 20px;" class="muted">
        <p style="font-size: 1.1rem; margin: 0 0 6px;">Tidak ada permintaan (${currentFilter.toLowerCase()}).</p>
        <small>Coba ganti filter atau segarkan data.</small>
      </div>`;
    return;
  }

  container.innerHTML = filtered
    .map((r) => {
      const isPending = r.status === "PENDING";
      const badgeClass =
        r.status === "APPROVED"
          ? "badge-approved"
          : r.status === "REJECTED"
            ? "badge-rejected"
            : "badge-pending";

      return `
      <article class="request-item">
        <div class="request-details">
          <strong>
            ${escapeHtml(r.applicant_name || "Tanpa Nama")}
            <span class="badge ${badgeClass}">${r.status}</span>
          </strong>
          <div class="request-meta">
            <span>Role Diminta: <b>${ROLE_LABEL[r.requested_role] || r.requested_role}</b></span>
            <span>Diajukan: ${new Date(r.created_at).toLocaleDateString("id-ID", {
              day: "numeric",
              month: "short",
              year: "numeric",
              hour: "2-digit",
              minute: "2-digit",
            })}</span>
            <span>
              WA: <a href="https://wa.me/${String(r.wa_number).replace(/\D/g, "")}" target="_blank" rel="noopener noreferrer">
                💬 ${escapeHtml(r.wa_number || "-")}
              </a>
            </span>
          </div>
        </div>

        <div class="request-actions">
          ${
            isPending
              ? `
              <select class="role-select" id="roleSelect_${r.id}">
                <option value="${r.requested_role}" selected>Setujui: ${ROLE_LABEL[r.requested_role] || r.requested_role}</option>
                <option value="PUBLIC">Ubah ke: 🌐 Umum</option>
                <option value="MALE">Ubah ke: 👨 Laki-laki</option>
                <option value="FEMALE">Ubah ke: 👩 Perempuan</option>
              </select>
              <button class="btn btn-primary" style="padding: 8px 16px; font-size: 0.84rem;" onclick="handleDecide('${r.id}', '${r.user_id}', 'APPROVED')">
                ✅ Terima
              </button>
              <button class="btn btn-secondary" style="padding: 8px 16px; font-size: 0.84rem;" onclick="handleDecide('${r.id}', '${r.user_id}', 'REJECTED')">
                ❌ Tolak
              </button>
            `
              : `
              <button class="btn btn-secondary" style="padding: 6px 12px; font-size: 0.8rem;" onclick="deleteRequest('${r.id}')">
                🗑️ Hapus
              </button>
            `
          }
        </div>
      </article>`;
    })
    .join("");
}

// Filter Buttons
document.querySelectorAll(".filter-chip").forEach((chip) => {
  chip.addEventListener("click", () => {
    document.querySelectorAll(".filter-chip").forEach((c) => c.classList.remove("active"));
    chip.classList.add("active");
    currentFilter = chip.dataset.filter;
    renderRequests();
  });
});

$("searchRequests")?.addEventListener("input", renderRequests);
$("refreshRequestsBtn")?.addEventListener("click", loadRequests);

// Keputusan Terima / Tolak
window.handleDecide = async function (requestId, userId, decision) {
  const req = allRequestsCache.find((r) => String(r.id) === String(requestId));
  if (!req) return;

  const selectEl = $(`roleSelect_${requestId}`);
  const approvedRole = selectEl?.value || req.requested_role || "PUBLIC";

  try {
    // 1. Update status di access_requests
    const { error: e1 } = await sb
      .from("access_requests")
      .update({
        status: decision,
        reviewed_at: new Date().toISOString(),
      })
      .eq("id", requestId);

    if (e1) throw e1;

    // 2. Update status & role di profiles pengguna
    const payload =
      decision === "APPROVED"
        ? { status: "APPROVED", access_role: approvedRole }
        : { status: "REJECTED", access_role: "NONE" };

    const { error: e2 } = await sb
      .from("profiles")
      .update(payload)
      .eq("id", userId);

    if (e2) throw e2;

    showToast(
      decision === "APPROVED"
        ? `Permintaan disetujui (${ROLE_LABEL[approvedRole] || approvedRole})`
        : "Permintaan ditolak.",
      "ok"
    );

    // 3. Buka WhatsApp konfirmasi otomatis
    if (decision === "APPROVED") {
      openWhatsAppMessage(
        req.wa_number,
        `Halo ${req.applicant_name}! Permintaan akses galeri foto Anda telah disetujui dengan kategori [${ROLE_LABEL[approvedRole] || approvedRole}]. Silakan masuk kembali di web portofolio.`
      );
    } else {
      openWhatsAppMessage(
        req.wa_number,
        `Halo ${req.applicant_name}, mohon maaf permintaan akses galeri foto Anda belum dapat disetujui saat ini. Silakan hubungi admin jika ada pertanyaan.`
      );
    }

    await refreshAllData();
  } catch (err) {
    showToast("Gagal memproses: " + err.message, "err");
  }
};

window.deleteRequest = async function (requestId) {
  if (!confirm("Hapus catatan riwayat permintaan ini?")) return;

  try {
    const { error } = await sb.from("access_requests").delete().eq("id", requestId);
    if (error) throw error;
    showToast("Riwayat permintaan dihapus.", "ok");
    await loadRequests();
    updateMetrics();
  } catch (err) {
    showToast("Gagal menghapus: " + err.message, "err");
  }
};

/* ----------------------------------------------------------
   TAB 2: MANAJEMEN PENGGUNA (USER MANAGEMENT)
   ---------------------------------------------------------- */
async function loadUsers() {
  const tbody = $("usersTableBody");
  tbody.innerHTML = '<tr><td colspan="5" class="muted">Memuat data pengguna...</td></tr>';

  const { data, error } = await sb
    .from("profiles")
    .select("id,full_name,access_role,status,is_admin,created_at")
    .order("created_at", { ascending: false });

  if (error) {
    tbody.innerHTML = `<tr><td colspan="5" class="status err">${error.message}</td></tr>`;
    return;
  }

  allUsersCache = data || [];
  renderUsers();
}

function renderUsers() {
  const tbody = $("usersTableBody");
  if (!allUsersCache.length) {
    tbody.innerHTML = '<tr><td colspan="5" class="muted">Belum ada pengguna terdaftar.</td></tr>';
    return;
  }

  tbody.innerHTML = allUsersCache
    .map((u) => {
      const isMe = u.id === sb.auth.user?.()?.id;
      return `
      <tr>
        <td>
          <strong>${escapeHtml(u.full_name || "Tanpa Nama")}</strong>
          <small class="muted" style="display: block; font-size: 0.76rem; font-family: monospace;">
            ${escapeHtml(u.id.substring(0, 18))}...
          </small>
        </td>
        <td>
          <select class="role-select" onchange="changeUserRole('${u.id}', this.value)">
            <option value="NONE" ${u.access_role === "NONE" ? "selected" : ""}>⛔ NONE</option>
            <option value="PUBLIC" ${u.access_role === "PUBLIC" ? "selected" : ""}>🌐 PUBLIC</option>
            <option value="MALE" ${u.access_role === "MALE" ? "selected" : ""}>👨 MALE</option>
            <option value="FEMALE" ${u.access_role === "FEMALE" ? "selected" : ""}>👩 FEMALE</option>
          </select>
        </td>
        <td>
          <select class="role-select" onchange="changeUserStatus('${u.id}', this.value)">
            <option value="APPROVED" ${u.status === "APPROVED" ? "selected" : ""}>🟢 APPROVED</option>
            <option value="PENDING" ${u.status === "PENDING" ? "selected" : ""}>🟡 PENDING</option>
            <option value="REJECTED" ${u.status === "REJECTED" ? "selected" : ""}>🔴 REJECTED</option>
            <option value="REVOKED" ${u.status === "REVOKED" ? "selected" : ""}>⚪ REVOKED</option>
          </select>
        </td>
        <td>
          ${
            u.is_admin
              ? '<span class="badge badge-role">👑 Admin</span>'
              : '<span class="muted" style="font-size: 0.8rem;">Pengguna</span>'
          }
        </td>
        <td>
          <button class="btn btn-secondary" style="padding: 5px 10px; font-size: 0.78rem;" onclick="toggleUserAdmin('${u.id}', ${!u.is_admin})">
            ${u.is_admin ? "Cabut Admin" : "Jadikan Admin"}
          </button>
        </td>
      </tr>`;
    })
    .join("");
}

$("refreshUsersBtn")?.addEventListener("click", loadUsers);

window.changeUserRole = async function (userId, newRole) {
  try {
    const { error } = await sb.from("profiles").update({ access_role: newRole }).eq("id", userId);
    if (error) throw error;
    showToast(`Role pengguna diperbarui ke ${newRole}`, "ok");
  } catch (err) {
    showToast("Gagal update role: " + err.message, "err");
  }
};

window.changeUserStatus = async function (userId, newStatus) {
  try {
    const { error } = await sb.from("profiles").update({ status: newStatus }).eq("id", userId);
    if (error) throw error;
    showToast(`Status pengguna diperbarui ke ${newStatus}`, "ok");
  } catch (err) {
    showToast("Gagal update status: " + err.message, "err");
  }
};

window.toggleUserAdmin = async function (userId, makeAdmin) {
  const confirmMsg = makeAdmin
    ? "Berikan hak akses Admin penuh ke pengguna ini?"
    : "Cabut hak akses Admin dari pengguna ini?";
  if (!confirm(confirmMsg)) return;

  try {
    const { error } = await sb.from("profiles").update({ is_admin: makeAdmin }).eq("id", userId);
    if (error) throw error;
    showToast(makeAdmin ? "Hak Admin berhasil diberikan." : "Hak Admin dicabut.", "ok");
    await loadUsers();
  } catch (err) {
    showToast("Gagal mengubah status admin: " + err.message, "err");
  }
};

/* ----------------------------------------------------------
   TAB 3: MANAJEMEN FOTO GALERI (PHOTO MANAGER)
   ---------------------------------------------------------- */
$("toggleAddPhotoBtn")?.addEventListener("click", () => {
  const wrap = $("addPhotoFormWrap");
  const isHidden = wrap.style.display === "none";
  wrap.style.display = isHidden ? "block" : "none";
});

$("cancelPhotoBtn")?.addEventListener("click", () => {
  $("addPhotoFormWrap").style.display = "none";
});

$("newPhotoForm")?.addEventListener("submit", async (e) => {
  e.preventDefault();
  const title = $("photoTitle").value.trim();
  const access_role = $("photoRole").value;
  const display_url = $("photoUrl").value.trim();
  const is_published = $("photoPublished").checked;

  if (!title || !display_url) {
    return showToast("Lengkapi judul dan URL foto.", "err");
  }

  try {
    const { error } = await sb.from("photos").insert({
      title,
      access_role,
      display_url,
      is_published,
    });

    if (error) throw error;

    showToast("Foto berhasil ditambahkan ke galeri!", "ok");
    $("newPhotoForm").reset();
    $("addPhotoFormWrap").style.display = "none";
    await loadPhotos();
    updateMetrics();
  } catch (err) {
    showToast("Gagal menyimpan foto: " + err.message, "err");
  }
});

async function loadPhotos() {
  const grid = $("photosListGrid");
  grid.innerHTML = '<p class="muted">Memuat galeri foto...</p>';

  const { data, error } = await sb
    .from("photos")
    .select("id,title,access_role,display_url,is_published,created_at")
    .order("created_at", { ascending: false });

  if (error) {
    grid.innerHTML = `<p class="status err">${error.message}</p>`;
    return;
  }

  allPhotosCache = data || [];
  renderPhotos();
}

function renderPhotos() {
  const grid = $("photosListGrid");
  if (!allPhotosCache.length) {
    grid.innerHTML = `
      <div style="grid-column: 1 / -1; text-align: center; padding: 40px;" class="muted">
        <p style="font-size: 1.1rem; margin-bottom: 8px;">Belum ada foto yang ditambahkan ke database.</p>
        <small>Klik tombol "+ Tambah Foto Baru" di atas untuk menambahkan koleksi.</small>
      </div>`;
    return;
  }

  grid.innerHTML = allPhotosCache
    .map(
      (p) => `
    <article class="photo-admin-card">
      <div class="photo-thumb-wrap">
        <img src="${escapeHtml(p.display_url)}" alt="${escapeHtml(p.title)}" loading="lazy" onerror="this.src='assets/Project/comingsoon-480.webp'">
        <span class="badge badge-role" style="position: absolute; top: 10px; left: 10px;">
          ${ROLE_LABEL[p.access_role] || p.access_role}
        </span>
      </div>
      <div class="photo-card-body">
        <h4>${escapeHtml(p.title)}</h4>
        <small class="muted" style="font-size: 0.78rem;">
          ${p.is_published ? "🟢 Dipublikasikan" : "⚪ Disembunyikan"}
        </small>
        <div class="photo-card-actions">
          <button class="btn btn-secondary" style="padding: 4px 10px; font-size: 0.76rem;" onclick="togglePublishPhoto('${p.id}', ${!p.is_published})">
            ${p.is_published ? "Sembunyikan" : "Publikasikan"}
          </button>
          <button class="btn btn-secondary" style="padding: 4px 10px; font-size: 0.76rem; border-color: rgba(239,68,68,0.5); color: #ef4444;" onclick="deletePhoto('${p.id}')">
            🗑️ Hapus
          </button>
        </div>
      </div>
    </article>`
    )
    .join("");
}

window.togglePublishPhoto = async function (photoId, makePublished) {
  try {
    const { error } = await sb.from("photos").update({ is_published: makePublished }).eq("id", photoId);
    if (error) throw error;
    showToast(makePublished ? "Foto dipublikasikan." : "Foto disembunyikan.", "ok");
    await loadPhotos();
  } catch (err) {
    showToast("Gagal update foto: " + err.message, "err");
  }
};

window.deletePhoto = async function (photoId) {
  if (!confirm("Hapus foto ini secara permanen dari galeri?")) return;

  try {
    const { error } = await sb.from("photos").delete().eq("id", photoId);
    if (error) throw error;
    showToast("Foto berhasil dihapus.", "ok");
    await loadPhotos();
    updateMetrics();
  } catch (err) {
    showToast("Gagal menghapus foto: " + err.message, "err");
  }
};

/* ----------------------------------------------------------
   STARTUP
   ---------------------------------------------------------- */
if (configured()) {
  checkCurrentSession();
}
