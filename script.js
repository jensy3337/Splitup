
const $=s=>document.querySelector(s);
const esc=s=>String(s).replace(/[&<>"'\\]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;','\\':'&#92;'}[c]));
const COL=['#5865f2','#3ba55d','#eb459e','#e67e22','#00a8d6','#9b59b6'];
const CH=[['chat','# team-chat'],['tasks','# task-board'],['contrib','# contributions'],['deadline','# deadlines'],['feedback','# peer-feedback'],['manage','Group settings']];
const day=n=>{const d=new Date();d.setDate(d.getDate()+n);const loc=new Date(d.getTime()-d.getTimezoneOffset()*6e4);return loc.toISOString().slice(0,10)};
const now=()=>new Date().toLocaleTimeString([],{hour:'2-digit',minute:'2-digit'});
let uid=100;
function mk(name,members,demo){
  const t={name,members,code:name.replace(/[^A-Za-z]/g,'').slice(0,4).toUpperCase()+'-'+Math.floor(100+Math.random()*900),deadline:day(10),tasks:[],msgs:[],fb:{}};
  if(demo){
    t.tasks=[
      {id:1,t:'Draw ER diagram',who:'Aisha',st:2,due:day(-2)},
      {id:2,t:'Write SQL schema',who:'Rohan',st:2,due:day(1)},
      {id:3,t:'Build login module',who:'Rohan',st:2,due:day(3)},
      {id:4,t:'Prepare report draft',who:'Meera',st:1,due:day(5)},
      {id:5,t:'Make presentation slides',who:'Aisha',st:0,due:day(8)},
      {id:6,t:'Test and fix bugs',who:'You',st:0,due:day(9)}];
    t.msgs=[
      {w:'Rohan',x:'I already did the schema and login. Who is doing the report?',t:'10:02'},
      {w:'Meera',x:'Started the draft, will share tonight.',t:'10:05'},
      {w:'Aisha',x:'Type /task Title @name to add work for someone.',t:'10:07'}];
  }
  return t;
}
let S=null;
try{S=JSON.parse(localStorage.getItem('splitup-v1'))}catch(e){}
if(!S||!S.teams){S={teams:[mk('DBMS Mini Project',['You','Aisha','Rohan','Meera'],true),mk('Marketing Case Study',['You','Dev','Sana'],false)],a:0,ch:'chat'};S.teams[1].tasks=[{id:7,t:'Pick a brand',who:'Dev',st:1,due:day(4)}]}
else uid=Math.max(100,...S.teams.flatMap(t=>t.tasks.map(x=>x.id)).concat([0]));
function save(){try{localStorage.setItem('splitup-v1',JSON.stringify(S))}catch(e){}}
const T=()=>S.teams[S.a];
const colorOf=(t,n)=>COL[Math.max(0,t.members.indexOf(n))%COL.length];
const av=(t,n,on)=>`<div class="av ${on?'on':''}" style="background:${colorOf(t,n)}">${esc(n[0]).toUpperCase()}</div>`;
const bot=(t,x)=>t.msgs.push({w:'Taskbot',x,t:now(),bot:1});

function go(c){S.ch=c;render()}
function pick(i){S.a=i;if(S.ch==='new')S.ch='chat';render()}
window.go=go;window.pick=pick;

function render(){
  if(!Array.isArray(S.teams))S.teams=[];
  if(!S.teams.length){
    S.a=0;S.ch='new';
    $('#rail').innerHTML=`<button class="on" onclick="go('new')" title="Create or join a team" aria-label="Create or join a team">+</button>`;
    $('#side').innerHTML='';
    $('#foot').innerHTML='';
    newTeam();save();return;
  }
  if(!Number.isInteger(S.a)||S.a<0||S.a>=S.teams.length)S.a=0;
  const t=T(),isNew=S.ch==='new';
  $('#rail').innerHTML=S.teams.map((x,i)=>`<button class="${i===S.a&&!isNew?'on':''}" onclick="pick(${i})" title="${esc(x.name)}">${esc(x.name.split(' ').map(w=>w[0]).join('').slice(0,3))}</button>`).join('')+`<button class="${isNew?'on':''}" onclick="go('new')" title="Create or join a team" aria-label="Create or join a team">+</button>`;
  $('#side').innerHTML=`<h2>${esc(t.name)}<br><small style="color:var(--mut);font-weight:400">SplitUp</small></h2>`+CH.map(([k,l])=>`<button class="ch ${S.ch===k?'on':''}" onclick="go('${k}')">${l}</button>`).join('')+
   `<div class="lbl">Members – ${t.members.length}</div>`+t.members.map(m=>`<div class="mem">${av(t,m,m!=='Meera')}<span>${esc(m)}</span></div>`).join('')+
   `<div class="code">Invite code<br><b>${esc(t.code)}</b></div>`;
  const v={chat,tasks,contrib,deadline,feedback,manage,new:newTeam}[S.ch]||chat;
  $('#foot').innerHTML='';
  v();save();
}
function head(a,b){$('#top').innerHTML=a+`<span>${b}</span>`}

function chat(){
  const t=T();head('# team-chat','Talk, and add work with /task');
  $('#body').innerHTML=t.msgs.map(m=>`<div class="msg">${av(t,m.w==='Taskbot'?'T':m.w)}<div><b>${esc(m.w)}</b>${m.bot?'<span class="bot">BOT</span>':''}<small>${m.t}</small><p>${esc(m.x)}</p></div></div>`).join('');
  $('#foot').innerHTML=`<div class="composer"><input id="mi" placeholder="Message # team-chat" aria-label="Message"><button class="btn" id="ms">Send</button></div><div class="hint">Try: /task Design poster @Aisha</div>`;
  const send=()=>{const i=$('#mi'),v=i.value.trim();if(!v)return;
    if(v.startsWith('/task ')){
      const mt=v.match(/@(\w+)\s*$/),who=mt&&t.members.find(m=>m.toLowerCase()===mt[1].toLowerCase())||'You';
      const title=v.slice(6).replace(/@\w+\s*$/,'').trim()||'Untitled task';
      t.tasks.push({id:++uid,t:title,who,st:0,due:day(7)});
      t.msgs.push({w:'You',x:v,t:now()});bot(t,`Added “${title}” for ${who}, due in 7 days.`);
    }else t.msgs.push({w:'You',x:v,t:now()});
    render();$('#mi').focus()};
  $('#ms').onclick=send;$('#mi').onkeydown=e=>{if(e.key==='Enter')send()};
  const b=$('#body');b.scrollTop=b.scrollHeight;
}

const ST=['To do','In progress','Done'];
function tasks(){
  const t=T();head('# task-board','Click a task’s button to move it forward');
  const cols=[0,1,2].map(s=>{
    const list=t.tasks.filter(x=>x.st===s);
    return `<div class="col"><h3>${ST[s]}<span>${list.length}</span></h3>`+list.map(x=>`<div class="card" style="border-color:${colorOf(t,x.who)}"><p>${esc(x.t)}</p><div class="meta"><span class="chip" style="background:${colorOf(t,x.who)}">${esc(x.who)}</span><span>Due ${x.due}</span></div><div class="task-actions">${s<2?`<button class="mv" onclick="mv(${x.id})">Move to ${ST[s+1]}</button>`:''}<button class="btn danger ghost small" onclick="deleteTask(${x.id})" aria-label="Delete task ${esc(x.t)}">Delete</button></div></div>`).join('')+(list.length?'':'<small style="color:var(--mut)">Nothing here yet.</small>')+`</div>`}).join('');
  $('#body').innerHTML=`<div class="add"><input type="text" id="nt" placeholder="New task title" aria-label="Task title"><select id="nw" aria-label="Assign to">${t.members.map(m=>`<option>${esc(m)}</option>`).join('')}</select><input type="date" id="nd" value="${day(7)}" aria-label="Due date"><button class="btn" onclick="addT()">Add task</button></div><div class="board">${cols}</div>`;
}
window.mv=id=>{const t=T(),x=t.tasks.find(k=>k.id===id);if(!x)return;x.st++;if(x.st===2)bot(t,`${x.who} finished “${x.t}”. Nice work!`);render()};
window.addT=()=>{const t=T(),v=$('#nt').value.trim();if(!v){$('#nt').focus();return}t.tasks.push({id:++uid,t:v,who:$('#nw').value,st:0,due:$('#nd').value||day(7)});bot(t,`New task “${v}” assigned to ${$('#nw').value}.`);render()};
window.deleteTask=id=>{
  const t=T(),i=t.tasks.findIndex(x=>x.id===id);
  if(i<0)return;
  if(!confirm(`Delete the task “${t.tasks[i].t}”?`))return;
  const [task]=t.tasks.splice(i,1);bot(t,`Task “${task.t}” was deleted.`);render();
};

function manage(){
  const t=T();head('Group settings','Manage teammates and group actions');
  $('#body').innerHTML=`<div class="panel"><h3 style="margin-top:0">Add a teammate</h3><p style="color:var(--mut)">Changes are saved in this browser’s workspace.</p><div class="add" style="margin-bottom:0"><input type="text" id="newMember" placeholder="Teammate name" aria-label="Teammate name"><button class="btn" id="addMember">Add member</button></div><p id="memberMsg" role="status" style="color:var(--mut);margin-bottom:0"></p></div>
  <div class="panel"><h3 style="margin-top:0">Members (${t.members.length})</h3>${t.members.map((m,i)=>`<div class="manage-member">${av(t,m,m!=='Meera')}<span class="member-name">${esc(m)}${m==='You'?' (you)':''}</span>${m==='You'?'<small style="color:var(--mut)">Current member</small>':`<button class="btn danger ghost small" onclick="removeMember(${i})" aria-label="Remove ${esc(m)}">Remove</button>`}</div>`).join('')}</div>
  <div class="panel"><h3 style="margin-top:0">Leave or delete this group</h3><p style="color:var(--mut)">Leaving removes the group from your workspace. Deleting removes its saved data from this browser.</p><div class="group-actions"><button class="btn danger ghost" onclick="leaveGroup()">Exit group</button><button class="btn danger" onclick="deleteGroup()">Delete group</button></div></div>`;
  const add=()=>addMember();
  $('#addMember').onclick=add;
  $('#newMember').onkeydown=e=>{if(e.key==='Enter')add()};
}
window.addMember=()=>{
  const t=T(),input=$('#newMember'),msg=$('#memberMsg'),name=input.value.trim();
  if(!name){msg.textContent='Enter a teammate name.';input.focus();return}
  if(t.members.some(m=>m.toLowerCase()===name.toLowerCase())){msg.textContent='That teammate is already in this group.';input.focus();return}
  t.members.push(name);bot(t,`${name} was added to the group.`);render();
};
window.removeMember=index=>{
  const t=T(),name=t.members[index];
  if(!name||name==='You')return;
  if(!confirm(`Remove ${name} from this group? Their tasks will be reassigned to You.`))return;
  t.members.splice(index,1);
  t.tasks.forEach(task=>{if(task.who===name)task.who='You'});
  delete t.fb[name];bot(t,`${name} was removed from the group.`);render();
};
function removeCurrentGroup(action){
  const t=T();
  if(!confirm(action==='leave'
    ?`Exit “${t.name}”? It will be removed from your workspace.`
    :`Delete “${t.name}” and its saved data from this browser?`))return;
  S.teams.splice(S.a,1);
  S.a=Math.min(S.a,S.teams.length-1);
  S.ch=S.teams.length?'chat':'new';
  render();
}
window.leaveGroup=()=>removeCurrentGroup('leave');
window.deleteGroup=()=>removeCurrentGroup('delete');

function contrib(){
  const t=T();head('# contributions','Who has finished what');
  const done=t.tasks.filter(x=>x.st===2),tot=done.length;
  const rows=t.members.map(m=>({m,d:done.filter(x=>x.who===m).length,a:t.tasks.filter(x=>x.who===m).length}));
  let h=rows.map(r=>{const p=tot?Math.round(r.d/tot*100):0;return `<div class="row">${av(t,r.m)}<div style="width:70px">${esc(r.m)}</div><div class="bar"><i style="width:${p}%;background:${colorOf(t,r.m)}"></i></div><div style="width:130px;text-align:right">${p}% <small style="color:var(--mut)">(${r.d} of ${r.a} tasks)</small></div></div>`}).join('');
  const fair=100/t.members.length,top=rows.slice().sort((a,b)=>b.d-a.d)[0],idle=rows.filter(r=>r.d===0&&r.a>0);
  if(tot>=3&&top.d/tot>fair/100+0.2)h+=`<div class="alert"><b>Uneven workload:</b> ${esc(top.m)} has finished ${Math.round(top.d/tot*100)}% of completed tasks. A fair share here is about ${Math.round(fair)}%. Consider moving open tasks to others.</div>`;
  idle.forEach(r=>h+=`<div class="alert"><b>${esc(r.m)}</b> has ${r.a} task(s) assigned and none finished yet.</div>`);
  $('#body').innerHTML=`<p class="big">${tot}<small style="font-size:16px;font-weight:400;color:var(--mut)"> of ${t.tasks.length} tasks done</small></p><br>`+h;
}

function deadline(){
  const t=T();head('# deadlines','Submission countdown and overdue work');
  const d=Math.ceil((new Date(t.deadline+'T23:59:59')-new Date())/864e5);
  const open=t.tasks.filter(x=>x.st<2).sort((a,b)=>a.due.localeCompare(b.due));
  $('#body').innerHTML=`<p class="big" style="color:${d<0?'var(--bad)':d<4?'var(--warn)':'var(--ok)'}">${d<0?Math.abs(d)+' days late':d+' days left'}</p><label>Submission date <input type="date" id="dd" value="${t.deadline}" style="margin-left:8px"></label><h3 style="margin-top:24px">Open tasks</h3>`+
   (open.map(x=>{const late=x.due<day(0);return `<div class="row">${av(t,x.who)}<div style="flex:1">${esc(x.t)}<br><small style="color:var(--mut)">${esc(x.who)} · due ${x.due}</small></div>${late?'<span class="tag">Overdue</span>':''}</div>`}).join('')||'<p>All tasks are done. Time to submit.</p>');
  $('#dd').onchange=e=>{t.deadline=e.target.value||t.deadline;render()};
}

function feedback(){
  const t=T();head('# peer-feedback','Private rating: did everyone contribute?');
  const others=t.members.filter(m=>m!=='You');
  $('#body').innerHTML=`<p style="color:var(--mut);max-width:560px">Rate each teammate’s contribution from 1 to 5. Ratings stay private and the teacher sees only the averages.</p>`+others.map(m=>{const r=t.fb[m]||0;return `<div class="row">${av(t,m)}<div style="width:80px">${esc(m)}</div><div class="stars" role="group" aria-label="Rate ${esc(m)}">${[1,2,3,4,5].map(n=>`<button class="${n<=r?'f':''}" onclick="rate('${esc(m)}',${n})" aria-label="${n} stars">★</button>`).join('')}</div></div>`}).join('')+
  (Object.keys(t.fb).length?`<div class="alert" style="border-color:var(--ok)">Teacher view: ${others.map(m=>`${esc(m)} ${t.fb[m]?t.fb[m].toFixed(1):'–'}`).join(' · ')}</div>`:'');
}
window.rate=(m,n)=>{T().fb[m]=n;render()};

function newTeam(){
  head('Create or join a team','Start a project space');
  $('#body').innerHTML=`<div class="panel"><h3 style="margin-top:0">Create a team</h3><label for="tn">Project name</label><input id="tn" placeholder="e.g. Physics Lab Report"><label for="tm">Teammates (comma separated)</label><input id="tm" placeholder="Aisha, Rohan, Meera"><br><br><button class="btn" id="tc">Create team</button></div>
  <div class="panel"><h3 style="margin-top:0">Join with a code</h3><label for="jc">Invite code</label><input id="jc" placeholder="e.g. DBMS-123"><br><br><button class="btn ghost" id="jb">Join team</button><p id="jm" style="color:var(--mut);margin-bottom:0"></p></div>`;
  $('#tc').onclick=()=>{const n=$('#tn').value.trim();if(!n){$('#tn').focus();return}
    const m=['You'].concat($('#tm').value.split(',').map(s=>s.trim()).filter(Boolean));
    const t=mk(n,m,false);bot(t,`Team created. Share code ${t.code} with your teammates.`);S.teams.push(t);S.a=S.teams.length-1;S.ch='chat';render()};
  $('#jb').onclick=()=>{const c=$('#jc').value.trim().toUpperCase(),i=S.teams.findIndex(x=>x.code===c);
    if(i>=0){S.a=i;S.ch='chat';render()}else $('#jm').textContent='No team found with that code. Check the code and try again.'};
}
render();
