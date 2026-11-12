const $ = (s) => document.querySelector(s);
const $$ = (s) => [...document.querySelectorAll(s)];
let faults = [];

const translations = {
  ar:{nav_home:"الرئيسية",nav_diagnose:"تشخيص عطل",nav_database:"قاعدة الأعطال",nav_machines:"المعدات",nav_library:"المراجع الفنية",local_demo:"وضع تجريبي محلي",title_dashboard:"مركز التشخيص الذكي",title_diagnose:"تشخيص عطل",title_database:"قاعدة الأعطال",title_machines:"المعدات",title_library:"المراجع الفنية"},
  en:{nav_home:"Dashboard",nav_diagnose:"Diagnose",nav_database:"Fault database",nav_machines:"Machines",nav_library:"Technical library",local_demo:"Local demo mode",title_dashboard:"Diagnostic workspace",title_diagnose:"Fault diagnosis",title_database:"Fault database",title_machines:"Machines",title_library:"Technical library"},
  fr:{nav_home:"Accueil",nav_diagnose:"Diagnostic",nav_database:"Base de pannes",nav_machines:"Machines",nav_library:"Documentation",local_demo:"Mode démo local",title_dashboard:"Espace de diagnostic",title_diagnose:"Diagnostic de panne",title_database:"Base de pannes",title_machines:"Machines",title_library:"Documentation technique"}
};

function showView(id){
  $$(".view").forEach(v=>v.classList.toggle("active",v.id===id));
  $$(".nav-link").forEach(b=>b.classList.toggle("active",b.dataset.view===id));
  const key={dashboard:"title_dashboard",diagnose:"title_diagnose",database:"title_database",machines:"title_machines",library:"title_library"}[id];
  $("#pageTitle").textContent=translations[$("#language").value][key];
  $("#sidebar").classList.remove("open");
  window.scrollTo({top:0,behavior:"smooth"});
}
$$(".nav-link").forEach(b=>b.addEventListener("click",()=>showView(b.dataset.view)));
$$("[data-go]").forEach(b=>b.addEventListener("click",()=>showView(b.dataset.go)));
$("#menuBtn").addEventListener("click",()=>$("#sidebar").classList.toggle("open"));

$("#language").addEventListener("change",e=>{
  const lang=e.target.value;
  document.documentElement.lang=lang;
  document.body.dir=lang==="ar"?"rtl":"ltr";
  $$("[data-i18n]").forEach(el=>{const k=el.dataset.i18n;if(translations[lang][k])el.textContent=translations[lang][k]});
  const active=$(".view.active")?.id||"dashboard";showView(active);
});

function escapeHtml(s=""){return String(s).replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));}
function renderFaults(query=""){
  const q=query.trim().toLowerCase();
  const filtered=faults.filter(f=>[f.id,f.code,f.title_ar,f.system,f.manufacturer,...f.symptoms,...f.possible_causes].join(" ").toLowerCase().includes(q));
  $("#faultCount").textContent=`${filtered.length} نتيجة`;
  $("#faultList").innerHTML=filtered.map(f=>`<article class="fault-item"><div class="fault-code">${escapeHtml(f.code)}</div><div><h3>${escapeHtml(f.title_ar)}</h3><p><b>${escapeHtml(f.system)}</b> · ${escapeHtml(f.manufacturer)}</p><p>الأعراض: ${f.symptoms.map(escapeHtml).join("، ")}</p><p>أسباب محتملة: ${f.possible_causes.map(escapeHtml).join("؛ ")}</p><span class="fault-tag">درجة الانتباه: ${escapeHtml(f.severity)}</span></div></article>`).join("")||'<div class="panel">لا توجد نتائج مطابقة.</div>';
}
$("#searchFaults").addEventListener("input",e=>renderFaults(e.target.value));

function matchFaults(type,text){
  const terms=text.toLowerCase();
  return faults.filter(f=>(f.machine_types.includes(type)||f.machine_types.includes("all")) &&
    f.symptoms.some(s=>terms.includes(s.toLowerCase())||s.toLowerCase().split(" ").some(w=>w.length>3&&terms.includes(w))));
}
$("#diagnosisForm").addEventListener("submit",e=>{
  e.preventDefault();
  const type=$("#machineType").value;
  const symptoms=$("#symptoms").value.trim();
  const code=$("#faultCode").value.trim();
  const matches=matchFaults(type,symptoms);
  const machine=$("#machineType").selectedOptions[0].textContent;
  const result=$("#diagnosisResult");
  const matchHtml=matches.length?matches.map(f=>`<section><h4>${escapeHtml(f.title_ar)} · ${escapeHtml(f.system)}</h4><p><b>أسباب محتملة:</b> ${f.possible_causes.map(escapeHtml).join("؛ ")}</p><p><b>خطوات تحقق أولية:</b></p><ol>${f.checks.map(c=>`<li>${escapeHtml(c)}</li>`).join("")}</ol></section>`).join(""):`<p>لم نعثر على تطابق مباشر في قاعدة البيانات التجريبية. لا يعني ذلك عدم وجود عطل.</p><p>سجّل الأعراض بدقة، وأضف موديل المعدة ورقمها التسلسلي ورموز وحدة التحكم، ثم طابقها مع دليل المصنع.</p>`;
  result.innerHTML=`<h3>نتيجة التحليل الأولي</h3><p><b>المعدة:</b> ${escapeHtml(machine)} · <b>الشركة:</b> ${escapeHtml($("#manufacturer").value||"غير محددة")} · <b>الموديل:</b> ${escapeHtml($("#model").value||"غير محدد")}</p><p><b>سنة الصنع:</b> ${escapeHtml($("#year").value||"غير محددة")} · <b>الرمز المدخل:</b> ${escapeHtml(code||"لا يوجد")}</p><h4>المسارات المحتملة للفحص</h4>${matchHtml}<div class="disclaimer"><b>تنبيه:</b> هذا محرك مطابقة تجريبي قائم على كلمات مفتاحية، وليس ذكاءً اصطناعياً متصلاً بوحدة التحكم. لا تعتبر النتائج تشخيصاً مؤكداً ولا تنفذ إصلاحاً قبل الرجوع إلى دليل المصنع وفني مؤهل.</div>`;
  result.classList.remove("hidden");
  result.scrollIntoView({behavior:"smooth",block:"start"});
});

fetch("data/faults.json").then(r=>{if(!r.ok)throw new Error("Could not load database");return r.json()}).then(data=>{faults=data;renderFaults()}).catch(err=>{$("#faultList").innerHTML='<div class="panel">تعذر تحميل قاعدة البيانات. شغّل المشروع عبر خادم محلي بدلاً من فتح الملف مباشرة.</div>';console.error(err)});
