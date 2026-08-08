const KEY = 'afrisafe_notif_items';

function getItems(){try{return JSON.parse(localStorage.getItem(KEY)||'[]')}catch{return[]}}
function saveItems(items){localStorage.setItem(KEY,JSON.stringify(items))}
function escapeHtml(v){return String(v??'').replaceAll('&','&amp;').replaceAll('<','&lt;').replaceAll('>','&gt;').replaceAll('"','&quot;').replaceAll("'",'&#39;')}
function formatTime(v){const d=new Date(v);return Number.isNaN(d.getTime())?'':d.toLocaleString(undefined,{dateStyle:'medium',timeStyle:'short'})}
function render(){
  const list=document.getElementById('notificationList'); if(!list)return;
  const items=getItems(); const unread=items.filter(x=>!x.read).length;
  const count=document.getElementById('notificationCount'); if(count)count.textContent=`${items.length} notification${items.length===1?'':'s'} · ${unread} unread`;
  if(!items.length){list.innerHTML='<div class="empty-state"><div class="icon">🔔</div><div>No notifications yet.</div></div>';return}
  list.innerHTML='';
  items.forEach(item=>{
    const card=document.createElement('article'); card.className=`notification-card ${item.read?'':'unread'}`;
    card.innerHTML=`<div class="notification-icon">${item.type==='symptom'?'🩺':item.type==='tip'?'🛡️':'🔔'}</div><div class="notification-content"><div class="notification-title">${escapeHtml(item.title)}</div><div class="notification-message">${escapeHtml(item.body)}</div><div class="notification-meta"><span class="notification-time">${formatTime(item.timestamp)}</span><span class="notification-type">${escapeHtml(item.type||'alert')}</span></div>${item.read?'':'<div class="notification-actions"><button class="mark-read-btn" type="button">Mark as read</button></div>'}</div>`;
    card.querySelector('.mark-read-btn')?.addEventListener('click',e=>{e.stopPropagation();const all=getItems();const found=all.find(x=>x.id===item.id);if(found)found.read=true;saveItems(all);render()});
    card.addEventListener('click',()=>{const all=getItems();const found=all.find(x=>x.id===item.id);if(found)found.read=true;saveItems(all);if(item.link)window.location.href=item.link;else render()});
    list.appendChild(card);
  });
}

document.addEventListener('DOMContentLoaded',()=>{
  render();
  document.getElementById('markAllRead')?.addEventListener('click',()=>{const items=getItems();items.forEach(x=>x.read=true);saveItems(items);render()});
  document.getElementById('clearNotifications')?.addEventListener('click',()=>{if(confirm('Clear all notifications?')){saveItems([]);render()}});
});
window.addEventListener('storage',render);
