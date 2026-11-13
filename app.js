(() => {
  const $ = id => document.getElementById(id);
  const money = n => new Intl.NumberFormat('es-MX',{style:'currency',currency:'MXN'}).format(n);
  const dateTime = n => new Intl.DateTimeFormat('es-MX',{dateStyle:'medium',timeStyle:'short'}).format(new Date(n));
  const dateOnly = n => new Intl.DateTimeFormat('es-MX',{dateStyle:'full'}).format(new Date(n));
  const duration = ms => { const m=Math.max(0,Math.floor(ms/60000)); return `${String(Math.floor(m/60)).padStart(2,'0')} h ${String(m%60).padStart(2,'0')} min`; };
  let shifts = JSON.parse(localStorage.getItem('mj_shifts') || '[]');
  let rate = Number(localStorage.getItem('mj_rate') || 100);
  $('rate').value = rate;

  function save(){ localStorage.setItem('mj_shifts',JSON.stringify(shifts)); }
  function completed(s){ return s.end !== null && Number.isFinite(s.end); }
  function total(list){ return list.filter(completed).reduce((sum,s)=>sum+Math.max(0,s.end-s.start),0); }
  function hours(ms){ return (ms/3600000).toFixed(2); }

  function render(){
    const active = shifts.find(s=>!completed(s));
    $('workState').textContent = active ? 'Jornada en curso' : 'No hay ninguna jornada activa';
    $('workState').style.color = active ? 'var(--mint)' : 'var(--muted)';
    $('elapsed').textContent = active ? duration(Date.now()-active.start) : '00 h 00 min';
    $('startInfo').textContent = active ? `Entrada: ${dateTime(active.start)}` : 'Marca tu entrada cuando comiences a trabajar.';
    $('clockBtn').textContent = active ? 'MARCAR SALIDA' : 'MARCAR ENTRADA';
    const now = new Date(), ym = `${now.getFullYear()}-${String(now.getMonth()+1).padStart(2,'0')}`;
    const thisMonth = shifts.filter(s=>completed(s) && (()=>{const d=new Date(s.start);return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}`===ym})());
    const monthMs = total(thisMonth), allMs=total(shifts);
    $('monthHours').textContent = `${hours(monthMs)} h`; $('monthMoney').textContent = money(monthMs/3600000*rate);
    $('totalHours').textContent = `${hours(allMs)} h`; $('totalMoney').textContent = money(allMs/3600000*rate);
    const history = $('history');
    if(!shifts.length){history.className='empty';history.textContent='Todavía no tienes jornadas registradas.';return;}
    history.className='';
    history.innerHTML = [...shifts].sort((a,b)=>b.start-a.start).map(s=>{
      const done=completed(s), ms=done?Math.max(0,s.end-s.start):0;
      return `<article class="shift"><div class="shifthead"><div class="shiftdate">${dateOnly(s.start)}</div><button class="delete" data-delete="${s.id}" aria-label="Eliminar jornada">Eliminar</button></div>
      <div class="muted">Entrada: ${dateTime(s.start)}<br>Salida: ${done?dateTime(s.end):'En curso'}</div>
      ${done?`<div class="money">${duration(ms)} · ${money(ms/3600000*rate)}</div>`:'<div class="status">Turno todavía abierto</div>'}</article>`;
    }).join('');
  }

  $('clockBtn').addEventListener('click',()=>{
    const active=shifts.find(s=>!completed(s));
    if(active) active.end=Date.now();
    else shifts.push({id:Date.now(),start:Date.now(),end:null});
    save();render();
  });
  $('saveRate').addEventListener('click',()=>{
    const v=Number($('rate').value);
    if(!Number.isFinite(v)||v<0){alert('Escribe una tarifa válida.');return;}
    rate=v;localStorage.setItem('mj_rate',String(rate));render();
  });
  $('history').addEventListener('click',e=>{
    const id=e.target?.dataset?.delete;if(!id)return;
    if(confirm('¿Quieres eliminar este registro?')){shifts=shifts.filter(s=>String(s.id)!==id);save();render();}
  });
  render();setInterval(render,30000);
  if('serviceWorker' in navigator) window.addEventListener('load',()=>navigator.serviceWorker.register('./sw.js').catch(()=>{}));
})();
