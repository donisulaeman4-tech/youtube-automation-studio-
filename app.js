const $ = (s, root=document) => root.querySelector(s);
const $$ = (s, root=document) => [...root.querySelectorAll(s)];
const STORE_KEY = "creatorflow_assets_v1";
const SETTINGS_KEY = "creatorflow_settings_v1";
let assets = loadAssets(), lastOutputs = {};
let activeFilter = "all";

function loadAssets(){ try{return JSON.parse(localStorage.getItem(STORE_KEY)||"[]")}catch{return []} }
function persist(){localStorage.setItem(STORE_KEY,JSON.stringify(assets)); updateStats(); renderBank()}
function settings(){try{return JSON.parse(localStorage.getItem(SETTINGS_KEY)||"{}")}catch{return {}}}
function saveSettings(v){localStorage.setItem(SETTINGS_KEY,JSON.stringify({...settings(),...v}))}
function toast(msg){const el=$("#toast");el.textContent=msg;el.classList.add("show");setTimeout(()=>el.classList.remove("show"),2600)}
function updateStats(){
  $("#bank-count").textContent=assets.length;$("#stat-assets").textContent=assets.length;
  $("#stat-scripts").textContent=assets.filter(a=>a.type==="script").length;
  $("#stat-boards").textContent=assets.filter(a=>a.type==="storyboard").length;
  const connected=!!settings().workerUrl;$("#stat-ai").textContent=connected?"SET":"—";$("#stat-ai-note").textContent=connected?"Worker URL configured":"Configure your Worker";
}
function showView(name){
  $$(".view").forEach(v=>v.classList.toggle("active",v.id==="view-"+name));
  $$(".nav-item[data-view]").forEach(b=>b.classList.toggle("active",b.dataset.view===name));
  const labels={dashboard:"Dashboard",niche:"Niche Finder",ideas:"Idea Lab",script:"Script Writer",storyboard:"Storyboard",thumbnail:"Thumbnail Studio",seo:"SEO & Publishing",bank:"Content Bank",settings:"Settings"};
  $("#page-title").textContent=labels[name]||"Dashboard";
  $("#page-eyebrow").textContent=name==="dashboard"?"YOUR CREATOR WORKSPACE":"CREATORFLOW / "+labels[name].toUpperCase();
  $("#sidebar").classList.remove("open");window.scrollTo({top:0,behavior:"smooth"});
}
$$("[data-view]").forEach(b=>b.addEventListener("click",()=>showView(b.dataset.view)));
$$("[data-go]").forEach(b=>b.addEventListener("click",()=>showView(b.dataset.go)));
$("#mobile-menu").addEventListener("click",()=>$("#sidebar").classList.toggle("open"));

function escapeHTML(s){return String(s).replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]))}
function markdownToHTML(md){
  let s=escapeHTML(md||"");
  s=s.replace(/```([\s\S]*?)```/g,"<pre>$1</pre>");
  s=s.replace(/^### (.*)$/gm,"<h3>$1</h3>").replace(/^## (.*)$/gm,"<h2>$1</h2>").replace(/^# (.*)$/gm,"<h1>$1</h1>");
  s=s.replace(/\*\*(.*?)\*\*/g,"<strong>$1</strong>").replace(/\*(.*?)\*/g,"<em>$1</em>");
  s=s.replace(/`([^`]+)`/g,"<code>$1</code>");
  s=s.replace(/^\s*[-*] (.*)$/gm,"<li>$1</li>");
  s=s.replace(/(?:<li>.*<\/li>\n?)+/g,m=>"<ul>"+m+"</ul>");
  s=s.split(/\n{2,}/).map(p=>/^<(h[1-3]|ul|pre)/.test(p)?p:"<p>"+p.replace(/\n/g,"<br>")+"</p>").join("");
  return s;
}
function showResult(id, text){
  const el=$("#"+id);el.innerHTML=`<div class="result-content">${markdownToHTML(text)}</div>`;
}
function currentWorker(){return ($("#worker-url").value||settings().workerUrl||"").trim()}
async function callAI(task,input){
  const url=currentWorker();if(!url)throw new Error("Add your Cloudflare Worker URL in Settings first.");
  const response=await fetch(url,{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({task,input,language:$("#default-language")?.value||"English",audience:$("#default-audience")?.value||"Global English-speaking audience"})});
  const raw=await response.text();let data;try{data=JSON.parse(raw)}catch{data={result:raw}};
  if(!response.ok)throw new Error(data.error||data.message||`Worker returned HTTP ${response.status}`);
  if(data.success===false)throw new Error(data.error||data.message||"AI request failed");
  const result=data.result??data.output??data.response??data.content??data;
  if(typeof result==="string")return result;
  return "```json\n"+JSON.stringify(result,null,2)+"\n```";
}
function formObject(form){return Object.fromEntries(new FormData(form).entries())}
async function runForm(formId,task,resultId,saveType,saveButtonId){
  const form=$("#"+formId),btn=$("button[type=submit]",form),original=btn.innerHTML;
  form.addEventListener("submit",async e=>{
    e.preventDefault();const input=formObject(form);btn.disabled=true;btn.textContent="Generating…";
    const target=$("#"+resultId);target.innerHTML='<div class="empty-state"><span class="empty-symbol">✦</span><strong>Creating your draft…</strong><p>The AI engine is working on your request.</p></div>';
    try{const output=await callAI(task,input);lastOutputs[saveType]={title:input.topic||input.title||input.niche||"Untitled "+saveType,content:output,input};showResult(resultId,output);if(saveButtonId)$("#"+saveButtonId).disabled=false;toast("AI draft generated.");}
    catch(err){target.innerHTML=`<div class="empty-state"><span class="empty-symbol">!</span><strong>Could not generate output</strong><p>${escapeHTML(err.message)}<br><br>Check Settings and confirm your Worker supports this task and browser CORS.</p></div>`;toast("AI request failed.");}
    finally{btn.disabled=false;btn.innerHTML=original;}
  },{once:false});
}
runForm("niche-form","niche_research","niche-result","niche",null);
runForm("ideas-form","video_ideas","ideas-result","idea","save-current-ideas");
runForm("script-form","script_writer","script-result","script","save-current-script");
runForm("storyboard-form","storyboard","storyboard-result","storyboard","save-current-board");
runForm("thumbnail-form","thumbnail_brief","thumbnail-result","thumbnail","save-current-thumbnail");
runForm("seo-form","seo_package","seo-result","seo","save-current-seo");

function saveOutput(type){const item=lastOutputs[type];if(!item)return;assets.unshift({id:crypto.randomUUID?crypto.randomUUID():String(Date.now()),type,title:item.title,content:item.content,createdAt:new Date().toISOString()});persist();toast("Saved to Content Bank.");}
$("#save-current-ideas").onclick=()=>saveOutput("idea");
$("#save-current-script").onclick=()=>saveOutput("script");
$("#save-current-board").onclick=()=>saveOutput("storyboard");
$("#save-current-thumbnail").onclick=()=>saveOutput("thumbnail");
$("#save-current-seo").onclick=()=>saveOutput("seo");

function renderBank(){
  const filtered=activeFilter==="all"?assets:assets.filter(a=>a.type===activeFilter);
  const el=$("#bank-list");
  if(!filtered.length){el.innerHTML='<div class="bank-empty">No saved content yet. Generate an asset and save it here.</div>';return}
  el.innerHTML=filtered.map(a=>`<article class="bank-item"><div style="min-width:0"><strong>${escapeHTML(a.title)}</strong><p>${escapeHTML(a.content.slice(0,180).replace(/\s+/g," "))}</p><small style="color:#aaa;font-size:9px">${new Date(a.createdAt).toLocaleString()}</small></div><div class="bank-actions"><span class="bank-type">${escapeHTML(a.type)}</span><button data-open="${a.id}">Open</button><button data-delete="${a.id}">Delete</button></div></article>`).join("");
  $$("[data-open]",el).forEach(b=>b.onclick=()=>{const a=assets.find(x=>x.id===b.dataset.open);if(!a)return;const w=window.open("","_blank");w.document.write(`<title>${escapeHTML(a.title)}</title><pre style="white-space:pre-wrap;font:14px/1.6 sans-serif;padding:24px">${escapeHTML(a.content)}</pre>`);});
  $$("[data-delete]",el).forEach(b=>b.onclick=()=>{assets=assets.filter(a=>a.id!==b.dataset.delete);persist();toast("Asset deleted.")});
}
$$(".filter-btn").forEach(b=>b.onclick=()=>{$$(".filter-btn").forEach(x=>x.classList.remove("active"));b.classList.add("active");activeFilter=b.dataset.filter;renderBank()});
$("#export-bank").onclick=()=>{const blob=new Blob([JSON.stringify({version:1,assets},null,2)],{type:"application/json"});downloadBlob(blob,"creatorflow-content-backup.json")};
$("#import-bank").onclick=()=>$("#import-file").click();
$("#import-file").onchange=async e=>{const file=e.target.files[0];if(!file)return;try{const data=JSON.parse(await file.text());const incoming=Array.isArray(data)?data:data.assets;if(!Array.isArray(incoming))throw new Error("Invalid backup");assets=[...incoming,...assets];persist();toast("Backup imported.");}catch(err){toast("Could not import that file.");}e.target.value=""};
function downloadBlob(blob,name){const a=document.createElement("a");a.href=URL.createObjectURL(blob);a.download=name;a.click();URL.revokeObjectURL(a.href)}

$("#settings-form").addEventListener("submit",e=>{e.preventDefault();const url=$("#worker-url").value.trim();saveSettings({workerUrl:url});updateStats();$("#connection-result").textContent="Worker endpoint saved on this device.";toast("Endpoint saved.")});
$("#test-connection").onclick=async()=>{const url=currentWorker();if(!url){$("#connection-result").textContent="Enter and save your Worker URL first.";return}$("#connection-result").textContent="Testing connection…";try{const result=await callAI("connection_test",{});$("#connection-result").textContent="Connected. Worker response: "+result.slice(0,500);$("#connection-label").textContent="Connection test successful";$("#stat-ai").textContent="OK";toast("AI connection successful.");}catch(err){$("#connection-result").textContent="Connection failed: "+err.message;$("#connection-label").textContent="Connection needs attention";toast("Connection test failed.")}};
const saved=settings();if(saved.workerUrl)$("#worker-url").value=saved.workerUrl;
updateStats();renderBank();
