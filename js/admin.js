const SUPABASE_URL = "https://ekbpgriafhiqvzwdywoc.supabase.co";
const SUPABASE_ANON_KEY = "sb_publishable_ITJL59-5AGNuhNPHBO59og_GOzCPBI6";
const sb = window.supabase?.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
const $ = (id) => document.getElementById(id);
const roleLabel = {
  FEMALE: "👩 Perempuan",
  MALE: "👨 Laki-laki",
  PUBLIC: "🌐 Umum",
};

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
function msg(text, kind = "wait") {
  $("loginStatus").textContent = text;
  $("loginStatus").className = "status " + kind;
}

async function isAdmin() {
  const {
    data: { user },
  } = await sb.auth.getUser();
  if (!user) return false;
  const { data, error } = await sb
    .from("profiles")
    .select("is_admin")
    .eq("id", user.id)
    .maybeSingle();
  return !error && data?.is_admin === true;
}
async function load() {
  if (!(await isAdmin()))
    return msg("Akun ini bukan admin atau belum login.", "err");
  $("loginPanel").style.display = "none";
  $("dashboard").style.display = "";
  const { data, error } = await sb
    .from("access_requests")
    .select(
      "id,user_id,applicant_name,requested_role,wa_number,status,created_at",
    )
    .eq("status", "PENDING")
    .order("created_at", { ascending: false });
  if (error) {
    $("requests").textContent = error.message;
    return;
  }
  $("count").textContent = `${data.length} permintaan`;
  $("requests").innerHTML = data.length
    ? data
        .map(
          (r) => `
    <article class="request">
      <div class="request-head"><strong>${escapeHtml(r.applicant_name || "Tanpa nama")}</strong><span>${roleLabel[r.requested_role] || r.requested_role}</span></div>
      <p class="muted">Diajukan: ${new Date(r.created_at).toLocaleString("id-ID")}</p>
      <p class="muted">WhatsApp: ${escapeHtml(r.wa_number || "-")}</p>
      <div style="display:flex;gap:8px;flex-wrap:wrap">
        <button class="btn btn-primary" type="button" data-action="approve" data-request-id="${escapeHtml(r.id)}" data-user-id="${escapeHtml(r.user_id)}" data-role="${escapeHtml(r.requested_role)}">✅ Terima</button>
        <button class="btn btn-secondary" type="button" data-action="reject" data-request-id="${escapeHtml(r.id)}" data-user-id="${escapeHtml(r.user_id)}" data-role="${escapeHtml(r.requested_role)}">❌ Tolak</button>
      </div>
    </article>`,
        )
        .join("")
    : '<p class="muted">Belum ada permintaan baru.</p>';
}
async function decide(requestId, userId, role, decision) {
  if (
    !["APPROVED", "REJECTED"].includes(decision) ||
    !["FEMALE", "MALE", "PUBLIC"].includes(role)
  )
    return;

  const { data: requestData, error: requestError } = await sb
    .from("access_requests")
    .select("wa_number")
    .eq("id", requestId)
    .maybeSingle();
  if (requestError) return alert(requestError.message);

  const { error: e1 } = await sb
    .from("access_requests")
    .update({ status: decision, reviewed_at: new Date().toISOString() })
    .eq("id", requestId)
    .eq("status", "PENDING");
  if (e1) return alert(e1.message);
  const payload =
    decision === "APPROVED"
      ? { status: "APPROVED", access_role: role }
      : { status: "REJECTED", access_role: "NONE" };
  const { error: e2 } = await sb
    .from("profiles")
    .update(payload)
    .eq("id", userId);
  if (e2) return alert(e2.message);

  if (decision === "APPROVED") {
    openWhatsAppMessage(
      requestData?.wa_number,
      "Akun Anda sudah diberikan izin.",
    );
  } else {
    openWhatsAppMessage(
      requestData?.wa_number,
      "Permintaan izin Anda ditolak. Silakan hubungi admin di Instagram @_khaeruull.",
    );
  }

  await load();
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

$("adminLogin").addEventListener("submit", async (e) => {
  e.preventDefault();
  if (!configured())
    return msg("Konfigurasi Supabase belum diisi di js/admin.js.", "err");
  const { error } = await sb.auth.signInWithPassword({
    email: $("adminEmail").value.trim(),
    password: $("adminPassword").value,
  });
  if (error) return msg(error.message, "err");
  await load();
});
$("requests").addEventListener("click", async (event) => {
  const button = event.target.closest("button[data-action]");
  if (!button) return;
  const decision =
    button.dataset.action === "approve" ? "APPROVED" : "REJECTED";
  button.disabled = true;
  try {
    await decide(
      button.dataset.requestId,
      button.dataset.userId,
      button.dataset.role,
      decision,
    );
  } finally {
    if (button.isConnected) button.disabled = false;
  }
});
$("refresh").addEventListener("click", load);
$("logout").addEventListener("click", async () => {
  if (sb) await sb.auth.signOut();
  location.reload();
});
if (configured()) load();
