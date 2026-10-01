const SUPABASE_URL = "PASTE_SUPABASE_URL";
const SUPABASE_ANON_KEY = "PASTE_SUPABASE_ANON_OR_PUBLISHABLE_KEY";
const sb = window.supabase?.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
const $=id=>document.getElementById(id);
const roleLabel={FEMALE:"👩 Perempuan",MALE:"👨 Laki-laki",PUBLIC:"🌐 Umum"};

function configured(){return sb && !SUPABASE_URL.startsWith("PASTE_") && !SUPABASE_ANON_KEY.startsWith("PASTE_");}
function msg(text,kind="wait"){ $("loginStatus").textContent=text; $("loginStatus").className="status "+kind; }

async function isAdmin(){
  const {data:{user}}=await sb.auth.getUser();
  if(!user)return false;
  const {data,error}=await sb.from("profiles").select("is_admin").eq("id",user.id).maybeSingle();
  return !error && data?.is_admin===true;
}
async function load(){
  if(!await isAdmin()) return msg("Akun ini bukan admin atau belum login.","err");
  $("loginPanel").style.display="none"; $("dashboard").style.display="";
  const {data,error}=await sb.from("access_requests").select("id,user_id,applicant_name,requested_role,status,created_at").eq("status","PENDING").order("created_at",{ascending:false});
  if(error){$("requests").textContent=error.message;return;}
  $("count").textContent=`${data.length} permintaan`;
  $("requests").innerHTML=data.length?data.map(r=>`
    <article class="request">
      <div class="request-head"><strong>${escapeHtml(r.applicant_name||"Tanpa nama")}</strong><span>${roleLabel[r.requested_role]||r.requested_role}</span></div>
      <p class="muted">Diajukan: ${new Date(r.created_at).toLocaleString("id-ID")}</p>
      <div style="display:flex;gap:8px;flex-wrap:wrap">
        <button class="btn btn-primary" onclick="decide('${r.id}','${r.user_id}','${r.requested_role}','APPROVED')">✅ Terima</button>
        <button class="btn btn-secondary" onclick="decide('${r.id}','${r.user_id}','${r.requested_role}','REJECTED')">❌ Tolak</button>
      </div>
    </article>`).join(""):'<p class="muted">Belum ada permintaan baru.</p>';
}
async function decide(requestId,userId,role,decision){
  const {error:e1}=await sb.from("access_requests").update({status:decision,reviewed_at:new Date().toISOString()}).eq("id",requestId).eq("status","PENDING");
  if(e1)return alert(e1.message);
  const payload=decision==="APPROVED"?{status:"APPROVED",access_role:role}:{status:"REJECTED",access_role:"NONE"};
  const {error:e2}=await sb.from("profiles").update(payload).eq("id",userId);
  if(e2)return alert(e2.message);
  await load();
}
function escapeHtml(v=""){return String(v).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#039;'}[c]));}

$("adminLogin").addEventListener("submit",async e=>{
 e.preventDefault();
 if(!configured())return msg("Konfigurasi Supabase belum diisi di js/admin.js.","err");
 const {error}=await sb.auth.signInWithPassword({email:$("adminEmail").value.trim(),password:$("adminPassword").value});
 if(error)return msg(error.message,"err"); await load();
});
$("refresh").addEventListener("click",load);
$("logout").addEventListener("click",async()=>{await sb.auth.signOut();location.reload();});
if(configured())load();
