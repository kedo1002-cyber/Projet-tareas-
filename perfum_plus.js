
// ═══════════════════════════════════════════════════════════════
// 1. CONFIG — Constantes y configuración global
// ═══════════════════════════════════════════════════════════════
const PASS='1234';
const FDS=['Ingrid','Isabella'];
const CATS={ventas:'Ventas y atención',orden:'Orden y limpieza',redes:'Redes sociales',inventario:'Inventario'};
const SEMA={red:'Bajo rendimiento — requiere atención',yellow:'Rendimiento regular — puede mejorar',green:'Excelente rendimiento — sigue así'};
const MESES=['Enero','Febrero','Marzo','Abril','Mayo','Junio','Julio','Agosto','Septiembre','Octubre','Noviembre','Diciembre'];
const MESES_C=['ene','feb','mar','abr','may','jun','jul','ago','sep','oct','nov','dic'];
const HORAS_ALERTA=3;
const HORA_APERTURA=9;
const TODOS_EMP=['Marlon','Ingrid','Isabella'];


// ═══════════════════════════════════════════════════════════════
// 2. STATE — Estado, persistencia y API de acceso
// ═══════════════════════════════════════════════════════════════
const _TAREAS_DEFAULT=[
  {id:1,cat:'ventas',desc:'Atender a todos los clientes con amabilidad',autoAsignar:true,prioridad:'alta',frecuencia:'diaria'},
  {id:2,cat:'ventas',desc:'Ofrecer productos adicionales a cada cliente',autoAsignar:true,prioridad:'media',frecuencia:'diaria'},
  {id:3,cat:'orden',desc:'Mantener vitrinas limpias y ordenadas',autoAsignar:true,prioridad:'alta',frecuencia:'diaria'},
  {id:4,cat:'orden',desc:'Limpiar el local al inicio y cierre del turno',autoAsignar:true,prioridad:'alta',frecuencia:'diaria'},
  {id:5,cat:'redes',desc:'Tomar al menos 1 foto o video para contenido',autoAsignar:false,prioridad:'media',frecuencia:'diaria'},
  {id:6,cat:'inventario',desc:'Verificar stock de los perfumes más vendidos',autoAsignar:false,prioridad:'media',frecuencia:'semanal'},
  {id:7,cat:'inventario',desc:'Reportar productos agotados o por agotarse',autoAsignar:false,prioridad:'alta',frecuencia:'semanal'}
];
let S=JSON.parse(localStorage.getItem('pp_v5')||'null')||{};
// Sanitizar claves faltantes (compatibilidad con versiones anteriores del localStorage)
if(!Array.isArray(S.tareas)||!S.tareas.length)S.tareas=_TAREAS_DEFAULT.map(t=>({...t}));
// Migrar campos nuevos en tareas base existentes
S.tareas.forEach(t=>{
  if(t.autoAsignar===undefined) t.autoAsignar=false;
  if(!t.prioridad) t.prioridad='media';
  if(!t.frecuencia) t.frecuencia='diaria';
});
if(!S.rep||typeof S.rep!=='object')S.rep={};
if(!S.califs||typeof S.califs!=='object')S.califs={};
if(!S.turnos||typeof S.turnos!=='object')S.turnos={};
if(!S.tp||typeof S.tp!=='object')S.tp={};
// Plantillas inteligentes con días aplicables
const _PLANTILLAS_DEFAULT=[
  {nombre:'Turno apertura',dias_aplicables:['lunes','martes','miercoles','jueves','viernes'],
    tareas:[
      {texto:'Abrir local y verificar caja',categoria:'orden',urgente:true},
      {texto:'Limpiar vitrinas de entrada',categoria:'orden',hora:'09:30'},
      {texto:'Revisar stock del día',categoria:'inventario'}
    ]},
  {nombre:'Turno fin de semana',dias_aplicables:['sabado','domingo'],
    tareas:[
      {texto:'Preparar destacados de fin de semana',categoria:'ventas'},
      {texto:'Tomar contenido para redes sociales',categoria:'redes',hora:'12:00'},
      {texto:'Conteo de productos en vitrina',categoria:'inventario'}
    ]}
];
if(!Array.isArray(S.plantillas)||!S.plantillas.length)
  S.plantillas=_PLANTILLAS_DEFAULT.map(p=>({...p,tareas:[...p.tareas]}));
if(typeof S.nid!=='number'||isNaN(S.nid))S.nid=100;
if(typeof S._lastReaDate!=='string')S._lastReaDate='';
if(!Array.isArray(S.solicitudes))S.solicitudes=[];
if(!Array.isArray(S.tarCEO))S.tarCEO=[];
if(!Array.isArray(S.retos))S.retos=[];
if(!S.tmplDone||typeof S.tmplDone!=='object')S.tmplDone={};

// ════════════════════════════════════════════════════════════════
// MOTOR DE RETOS — constantes
// ════════════════════════════════════════════════════════════════
const _RETO_TIPOS={
  conversion: {ico:'🎯',lbl:'Conversión',   cls:'conversion'},
  ticket:     {ico:'💰',lbl:'Ticket',        cls:'ticket'},
  experiencia:{ico:'✨',lbl:'Experiencia',   cls:'experiencia'},
  tendencia:  {ico:'🔥',lbl:'Tendencia',     cls:'tendencia'},
  evento:     {ico:'🎉',lbl:'Evento',        cls:'evento'},
};

const _EVENTOS_ESPECIALES=[
  {nombre:'San Valentín',        fecha_anual:'02-14',dias_preparacion:10},
  {nombre:'Día de la Mujer',     fecha_anual:'03-08',dias_preparacion:7},
  {nombre:'Semana Santa',        fecha_anual:'04-10',dias_preparacion:7},
  {nombre:'Día de la Madre',     fecha_anual:'05-10',dias_preparacion:8},
  {nombre:'Día del Padre',       fecha_anual:'06-17',dias_preparacion:7},
  {nombre:'Día de la Amistad',   fecha_anual:'07-30',dias_preparacion:5},
  {nombre:'Regreso a Clases',    fecha_anual:'08-28',dias_preparacion:5},
  {nombre:'Halloween',           fecha_anual:'10-31',dias_preparacion:6},
  {nombre:'Día de los Muertos',  fecha_anual:'11-02',dias_preparacion:3},
  {nombre:'Temporada Navideña',  fecha_anual:'12-08',dias_preparacion:5},
  {nombre:'Navidad',             fecha_anual:'12-25',dias_preparacion:12},
  {nombre:'Año Nuevo',           fecha_anual:'01-01',dias_preparacion:7},
];

const _RETOS_TEMPLATES={
  conversion:[
    {desc:'Convierte 3 clientes en vitrina en compradores — usa técnica: fragancia + historia',obj:3,prio:'alta'},
    {desc:'Cierra 2 ventas de perfumes masculinos con presentación "huele y lleva"',obj:2,prio:'media'},
    {desc:'Transforma 4 consultas informales en ventas con demo rápida',obj:4,prio:'alta'},
    {desc:'Recupera 2 clientes indecisos con oferta del día antes de que salgan',obj:2,prio:'media'},
  ],
  ticket:[
    {desc:'Sube el ticket promedio ofreciendo 1 complemento por cada compra (loción, mini)',obj:1,prio:'media'},
    {desc:'Vende 2 kits o combos durante el turno — "precio especial hoy"',obj:2,prio:'alta'},
    {desc:'Ofrece loción o crema corporal como pareja a cada perfume vendido',obj:3,prio:'media'},
    {desc:'Presenta la opción de tamaño grande vs pequeño — sube al grande a 2 clientes',obj:2,prio:'baja'},
  ],
  experiencia:[
    {desc:'Invita a 5 clientes a vivir la "experiencia fragancia del día" — muestra y cuenta la historia',obj:5,prio:'media'},
    {desc:'Personaliza la recomendación según estilo de vida: trabajo, salida nocturna, casual',obj:3,prio:'alta'},
    {desc:'Cierra con storytelling: cuenta origen o inspiración de 3 fragancias vendidas',obj:3,prio:'media'},
    {desc:'Aplica técnica "capas de aroma": sugiere body wash + perfume a 2 clientes',obj:2,prio:'alta'},
  ],
  tendencia:[
    {desc:'Destaca y vende 3 fragancias nicho de la colección premium',obj:3,prio:'alta'},
    {desc:'Presenta colección unisex — 2 ventas de fragancias sin género definido',obj:2,prio:'media'},
    {desc:'Impulsa fragancias de hogar: vende 2 difusores o velas aromáticas',obj:2,prio:'media'},
    {desc:'Promueve fragancias acuáticas o verdes — tendencia frescura 2025',obj:2,prio:'baja'},
  ],
  evento:[
    {desc:'Prepara vitrina temática para el evento — 80% de productos del evento visibles',obj:1,prio:'alta'},
    {desc:'Ofrece mensaje de regalo personalizado en cada compra del evento',obj:5,prio:'alta'},
    {desc:'Vende 3 kits regalo temáticos — presenta la caja como "el regalo perfecto"',obj:3,prio:'alta'},
    {desc:'Menciona la promoción especial del evento a cada cliente que entra',obj:8,prio:'media'},
  ],
};

let CU=null, CR=null, CD=null, CS=null, PREV='hoy', DF=null;

function sv(){localStorage.setItem('pp_v5',JSON.stringify(S));}
let _svTimer=null;
function svDebounce(){clearTimeout(_svTimer);_svTimer=setTimeout(()=>sv(),400);}

/* Ordena tareas por prioridad: urgente (0) > reprogramada (1) > normal (2).
   Estable: dentro de cada nivel conserva el orden original. */
function _sortTareas(arr){
  const score=t=>t.urgente?0:t.reprogramada?1:2;
  return [...arr].sort((a,b)=>score(a)-score(b));
}

/* ── Rendimiento promedio de los últimos 7 días laborables con datos ──
   Devuelve un número 0-100, o null si no hay historial suficiente.      */
function rendimientoReciente(emp){
  const dias=last7().filter(d=>esLaborable(emp,d));
  let sum=0, n=0;
  dias.forEach(d=>{
    const ef=calcEficacia(emp,d);
    if(ef.total>0){sum+=ef.pct;n++;}
  });
  return n>0 ? Math.round(sum/n) : null;
}

/* Determina el modo de carga:
   'alivio' (<60%) | 'normal' (60-85%) | 'extra' (>85%) | 'normal' (sin datos) */
function modoAutoAsignar(pct){
  if(pct===null)  return 'normal';
  if(pct<60)      return 'alivio';
  if(pct>85)      return 'extra';
  return 'normal';
}

function limpiarDatosAntiguos(){
  const limite=new Date();
  limite.setDate(limite.getDate()-60);
  const limiteStr=limite.toISOString().slice(0,10);
  ['rep','califs','turnos','tp'].forEach(k=>{
    if(!S[k])return;
    Object.keys(S[k]).forEach(f=>{if(f<limiteStr)delete S[k][f];});
  });
  sv();
}

// ── API de acceso al estado ──
function ensureReporte(f,emp){
  if(!S.rep[f])S.rep[f]={};
  if(!S.rep[f][emp])S.rep[f][emp]={estados:{},notas:{}};
  return S.rep[f][emp];
}

function getReporte(f,emp){return S.rep[f]?.[emp]||{estados:{},notas:{}};}
function getEstados(f,emp){return getReporte(f,emp).estados||{};}
function getNotas(f,emp){return getReporte(f,emp).notas||{};}
function getTareasPers(f,emp){return S.tp[f]?.[emp]||[];}
function getCalif(f,emp){return S.califs[f]?.[emp]||null;}

function calcEficacia(emp,fecha){
  const est=getEstados(fecha,emp);
  const tp=getTareasPers(fecha,emp);
  const total=S.tareas.length+tp.length;
  const comp=Object.values(est).filter(e=>e==='green').length;
  const proc=Object.values(est).filter(e=>e==='yellow').length;
  const pct=total?Math.round(comp/total*100):0;
  return{comp,proc,total,pct,pend:total-comp-proc};
}

function nivelSema(pct){return pct>=75?'green':pct>=40?'yellow':'red';}


// ═══════════════════════════════════════════════════════════════
// 3. UTILS — Helpers de fecha, caché, UI general
// ═══════════════════════════════════════════════════════════════

// ── Fechas ──
function hoy(){return new Date().toISOString().slice(0,10);}
function mes(){return new Date().toISOString().slice(0,7);}
function fd(d){if(!d)return '';const[y,m,dd]=d.split('-');return `${dd} ${MESES_C[+m-1]} ${y}`;}
function fm(ym){const[y,m]=ym.split('-');return `${MESES[+m-1]} ${y}`;}
function diaSemana(d){return['Domingo','Lunes','Martes','Miércoles','Jueves','Viernes','Sábado'][new Date(d+'T12:00:00').getDay()];}
function finSemNum(d){const n=+d.split('-')[2];return n<=7?1:n<=14?2:n<=21?3:4;}

// ── Caché de fechas ──
let _cacheDay=null,_cacheLast7=null,_cacheMes=null,_cacheDiasMes=null;
function _checkCache(){
  const d=hoy(),m=mes();
  if(_cacheDay!==d){_cacheDay=d;_cacheLast7=null;_cacheDiasMes=null;}
  if(_cacheMes!==m){_cacheMes=m;_cacheDiasMes=null;}
}
function last7(){
  _checkCache();
  if(_cacheLast7)return _cacheLast7;
  const d=[];
  for(let i=6;i>=0;i--){const x=new Date();x.setDate(x.getDate()-i);d.push(x.toISOString().slice(0,10));}
  _cacheLast7=d;return d;
}
function diasDelMes(ym){
  _checkCache();
  if(_cacheDiasMes)return _cacheDiasMes;
  const[y,m]=ym.split('-').map(Number);
  const ultimo=new Date(y,m,0).getDate();
  const hoyD=new Date();const d=[];
  for(let i=1;i<=ultimo;i++){
    const f=`${y}-${String(m).padStart(2,'0')}-${String(i).padStart(2,'0')}`;
    if(new Date(f+'T12:00:00')<=hoyD)d.push(f);
  }
  _cacheDiasMes=d;return d;
}

// ── Helpers de colaboradores ──
function ini(n){return n.split(' ').map(w=>w[0]).join('').slice(0,2).toUpperCase();}
function esFDS(n){return FDS.includes(n);}
function esLaborable(emp,fecha){
  if(emp==='Marlon'){const dow=new Date(fecha+'T12:00:00').getDay();return dow>=1&&dow<=5;}
  if(esFDS(emp))return S.turnos[fecha]?.[emp]===true;
  return true;
}
function turnoOn(n){return esFDS(n)?!!(S.turnos[hoy()]?.[n]):true;}

// ── UI general ──
function toast(m,delay=2200){const t=document.getElementById('toast');t.textContent=m;t.classList.add('on');setTimeout(()=>t.classList.remove('on'),delay);}
function showS(id){
  ['s-login','s-colab','s-ceo'].forEach(s=>{
    const el=document.getElementById(s);
    el.classList.add('hidden');
    el.classList.remove('screen-fade-in');
  });
  const target=document.getElementById(id);
  target.classList.remove('hidden');
  target.classList.remove('screen-fade-in');
  void target.offsetWidth;
  target.classList.add('screen-fade-in');
}


// ═══════════════════════════════════════════════════════════════
// 4. TEMPLATES — Generadores de HTML reutilizables
// ═══════════════════════════════════════════════════════════════

const EST_BADGE={green:'b-green',yellow:'b-yellow',red:'b-red'};
const EST_LABEL={green:'Completada',yellow:'En proceso',red:'Pendiente'};

// ── Tarea item (colaborador) — unificada normal + urgente ──
function tareaItemHtml(id,desc,est,nota,opts){
  const urgente=opts?.urgente||false;
  const cbClass=est==='green'?'st-green':est==='yellow'?'st-yellow':'';
  const notaId='nota-'+id;
  const tieneNota=nota&&nota.trim().length>0;
  const svgProc=`<svg class="ic-proc" viewBox="0 0 24 24" fill="none" stroke="var(--yellow)" stroke-width="2.5" stroke-linecap="round"><circle cx="12" cy="12" r="9"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="15" x2="12.01" y2="15"/></svg>`;
  const svgDone=`<svg class="ic-done" viewBox="0 0 24 24" fill="none" stroke="var(--green)" stroke-width="2.8" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"/></svg>`;
  const badgeHtml=est?`<span class="badge ${EST_BADGE[est]||'b-gray'}" style="flex-shrink:0;font-size:.68rem"><span class="bdot"></span>${EST_LABEL[est]}</span>`:'';

  let metaInner='';
  if(urgente){
    metaInner=`<div style="display:flex;flex-direction:column;gap:3px;flex:1">
      <div style="display:flex;align-items:center;gap:6px">
        <span class="urgente-badge">⚡ Urgente</span>${badgeHtml}
      </div>
      <span class="tarea-desc${est==='green'?' done':''}">${desc}</span>
    </div>`;
  } else {
    const hora=opts?.hora||'';
    let dlHtml='';
    if(hora){
      const ahora=new Date();
      const hm=ahora.getHours()*60+ahora.getMinutes();
      const [hh,mm]=(hora||'').split(':').map(Number);
      const dl=hh*60+(mm||0);
      const diff=dl-hm;
      const dlCls=diff<0?'overdue':diff<=60?'warn':'ok';
      const dlLbl=diff<0?`⚠ Venció ${hora}`:diff<=60?`⏱ ${hora} (${diff}min)`:`⏰ Límite ${hora}`;
      dlHtml=est!=='green'?`<br><span class="dl-chip ${dlCls}">${dlLbl}</span>`:'';
    }
    const reprInline=opts?.reprogramada?`<span class="repr-badge">↩ Reprogramada</span>`:'';
    metaInner=`<span class="tarea-desc${est==='green'?' done':''}">${desc}${reprInline}</span>${hora?dlHtml:''}${badgeHtml}`;
  }

  const inst=opts?.inst||'';
  const instHtml=inst?`<div class="tarea-inst-box" id="inst-${id}" style="display:none">${inst}</div>`:'';
  const instBtn=inst?`<button class="tarea-inst-btn" onclick="toggleInstColab('${id}')" title="Ver instrucción">ℹ️</button>`:'';

  return `<div class="tarea-item${urgente?' urgente':''}" data-id="${id}">
    <button class="tarea-cb ${cbClass}" onmousedown="startLP('${id}')" onmouseup="endLP('${id}')" onmouseleave="endLP('${id}')" ontouchstart="startLP('${id}');event.preventDefault()" ontouchend="endLP('${id}');tapEst('${id}');event.preventDefault()" onclick="tapEst('${id}')" aria-label="Completar (mantén 0.5s para marcar En proceso)">${svgProc}${svgDone}</button>
    <div class="tarea-cb-inner">
      <div class="tarea-meta" style="align-items:flex-start">
        <div style="flex:1;min-width:0">${metaInner}</div>
        ${instBtn}
      </div>
      ${instHtml}
      <div class="tarea-nota-wrap">
        <button class="btn-nota" onclick="toggleNota('${notaId}')">
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
          ${tieneNota?'Ver nota':'Agregar nota'}
        </button>
        <div class="nota-open${tieneNota?' visible':''}" id="${notaId}">
          <textarea class="tarea-nota" rows="2" placeholder="Escribe una nota aquí..." oninput="setNota('${id}',this.value)">${nota}</textarea>
        </div>
      </div>
    </div>
  </div>`;
}

function toggleInstColab(id){
  const el=document.getElementById('inst-'+id);
  if(!el)return;
  const visible=el.style.display!=='none';
  el.style.display=visible?'none':'block';
  const btn=document.querySelector(`.tarea-item[data-id="${id}"] .tarea-inst-btn`);
  if(btn)btn.classList.toggle('active',!visible);
}

// ── Tarea en vista detalle CEO (solo lectura) ──
function tareaDetalleHtml(desc,est,nota,opts){
  const urgente=opts?.urgente||false;
  const lbl=est?EST_LABEL[est]:'Sin reportar';
  const badge=`<span class="badge b-${est||'gray'}" style="${!est?'opacity:.4':''}"><span class="bdot"></span>${lbl}</span>`;
  return `<div style="display:flex;align-items:flex-start;gap:8px;padding:.45rem 0;border-bottom:1px solid var(--g100)${urgente?';background:linear-gradient(to right,#fdf0ee,transparent);padding-left:8px;border-left:2.5px solid var(--red);border-radius:0 4px 4px 0':''}">
    <div style="flex:1;min-width:0">
      ${urgente?'<div style="margin-bottom:3px"><span class="urgente-badge">⚡ Urgente</span></div>':''}
      <div style="font-size:.85rem;color:var(--g800);margin-bottom:2px">${desc}</div>
      ${badge}
      ${nota?`<div style="font-size:.76rem;color:var(--g400);margin-top:3px;font-style:italic">${nota}</div>`:''}
    </div>
  </div>`;
}

// ── Card de colaborador en dashboard CEO ──
function cardColabHtml(emp,fecha){
  const presente=esLaborable(emp,fecha);
  if(!presente){
    const razon=emp==='Marlon'?'No trabaja los fines de semana':'No trabaja hoy';
    return `<div class="ccard ausente">
      <div class="cc-top">
        <div class="cc-av">${ini(emp)}</div>
        <div class="cc-info"><div class="cc-name">${emp}</div><div class="cc-sub">${razon}</div></div>
        <span class="badge b-gray"><span class="bdot"></span>Ausente</span>
      </div>
    </div>`;
  }
  const{comp,proc,pend,total,pct}=calcEficacia(emp,fecha);
  const sema=nivelSema(pct);
  const cal=getCalif(fecha,emp);
  return `<div class="ccard activo" onclick="verDetalle('${emp}','hoy')">
    <div class="cc-top">
      <div class="cc-av">${ini(emp)}</div>
      <div class="cc-info">
        <div class="cc-name">${emp}</div>
        <div class="cc-sub">${comp} completadas · ${proc} en proceso · ${pend} pendientes</div>
      </div>
      <div style="text-align:right;flex-shrink:0">
        <div class="cc-pct">${pct}%</div>
        <span class="badge b-${sema}"><span class="bdot"></span>${sema==='green'?'Bien':sema==='yellow'?'Regular':'Bajo'}</span>
        ${cal?.sema?'<div style="margin-top:3px"><span style="font-size:.68rem;color:var(--g400)">Calif. ✓</span></div>':''}
      </div>
    </div>
    <div class="prog-wrap"><div class="prog-bar" style="width:${pct}%"></div></div>
  </div>`;
}

// ── Alerta de inactividad ──
function alertaCardHtml(emp,horas,minutos,fecha){
  const{comp,total}=calcEficacia(emp,fecha);
  return `<div class="alerta-card">
    <div class="alerta-icon">⚠</div>
    <div class="alerta-body">
      <div class="alerta-nombre">${emp} — sin reporte</div>
      <div class="alerta-txt">Lleva más de ${horas}h${minutos>0?' '+minutos+'min':''} sin registrar progreso hoy. Tiene ${comp}/${total} tareas completadas.</div>
    </div>
  </div>`;
}

// ── Historial item (semana/mes) ──
function histItemHtml(emp,fecha,esCeo,origen){
  const{comp,total,pct}=calcEficacia(emp,fecha);
  const sema=nivelSema(pct);
  const cal=getCalif(fecha,emp);
  const calHtml=cal?.sema?`<div style="margin-top:3px"><span class="badge b-${cal.sema}"><span class="bdot"></span>${cal.sema==='green'?'Excelente':cal.sema==='yellow'?'Regular':'Bajo'}</span></div>`:'';
  const onclick=esCeo?`onclick="verDetalle('${emp}','${origen}','${fecha}')"`:''
  return `<div class="hist-item" ${onclick}>
    <div class="frow">
      <div><div class="hi-fecha">${diaSemana(fecha)} ${fd(fecha)}</div><div class="hi-sub">${comp}/${total} tareas completadas</div></div>
      <div style="text-align:right">
        <span class="badge b-${sema}"><span class="bdot"></span>${pct}%</span>
        ${calHtml}
      </div>
    </div>
  </div>`;
}

// ── Historial item mensual (con label "Fin de semana N") ──
function histItemMesHtml(emp,fecha,esCeo,origen){
  const{comp,total,pct}=calcEficacia(emp,fecha);
  const sema=nivelSema(pct);
  const cal=getCalif(fecha,emp);
  const calHtml=cal?.sema?`<div style="margin-top:3px"><span class="badge b-${cal.sema}"><span class="bdot"></span>${cal.sema==='green'?'Excelente':cal.sema==='yellow'?'Regular':'Bajo'}</span></div>`:'';
  const n=finSemNum(fecha);
  const onclick=esCeo?`onclick="verDetalle('${emp}','${origen}','${fecha}')"`:''
  return `<div class="hist-item" ${onclick}>
    <div class="frow">
      <div>
        <div class="hi-label">Fin de semana ${n}</div>
        <div class="hi-fecha">${diaSemana(fecha)} ${fd(fecha)}</div>
        <div class="hi-sub">${comp}/${total} tareas completadas</div>
      </div>
      <div style="text-align:right">
        <span class="badge b-${sema}"><span class="bdot"></span>${pct}%</span>
        ${calHtml}
      </div>
    </div>
  </div>`;
}

// ── Números resumen (3 boxes) ──
function numsRowHtml(n1,l1,n2,l2,n3,l3){
  return `<div class="num-box"><div class="num-n">${n1}</div><div class="num-l">${l1}</div></div>
    <div class="num-box"><div class="num-n">${n2}</div><div class="num-l">${l2}</div></div>
    <div class="num-box"><div class="num-n">${n3}</div><div class="num-l">${l3}</div></div>`;
}

// ── Calificaciones badges resumen ──
function califsBadgesHtml(semas){
  const g=semas.filter(s=>s==='green').length;
  const y=semas.filter(s=>s==='yellow').length;
  const r=semas.filter(s=>s==='red').length;
  let h='';
  if(g)h+=`<span class="badge b-green"><span class="bdot"></span>${g} Excelente</span>`;
  if(y)h+=`<span class="badge b-yellow"><span class="bdot"></span>${y} Regular</span>`;
  if(r)h+=`<span class="badge b-red"><span class="bdot"></span>${r} Bajo</span>`;
  if(!semas.length)h='<span class="txt-muted">Sin calificaciones aún</span>';
  return `<div style="display:flex;gap:6px;flex-wrap:wrap;margin-bottom:.75rem">${h}</div>`;
}


// ═══════════════════════════════════════════════════════════════
// 5. AUTH — Login, logout, sesión persistente
// ═══════════════════════════════════════════════════════════════

function guardarSesion(){localStorage.setItem('pp_sesion',JSON.stringify({user:CU,rol:CR,fecha:hoy()}));}
function limpiarSesion(){localStorage.removeItem('pp_sesion');}

function restaurarSesion(){
  try{
    const s=JSON.parse(localStorage.getItem('pp_sesion')||'null');
    if(!s)return false;
    if(s.fecha!==hoy()){limpiarSesion();return false;}
    CU=s.user;CR=s.rol;
    if(CR==='colab'){
      if(esFDS(CU)){const f=hoy();if(!S.turnos[f])S.turnos[f]={};S.turnos[f][CU]=true;sv();}
      renderColab();showS('s-colab');
    } else if(CR==='ceo'){
      renderCeo();showS('s-ceo');
    }
    return true;
  }catch(e){limpiarSesion();return false;}
}

function setRole(r,btn){
  document.querySelectorAll('.rtab').forEach(b=>b.classList.remove('on'));
  btn.classList.add('on');
  document.getElementById('l-colab').classList.toggle('hidden',r==='ceo');
  document.getElementById('l-ceo').classList.toggle('hidden',r==='colab');
}

function loginColab(){
  const n=document.getElementById('sel-nombre').value;
  if(!n){toast('Selecciona tu nombre');return;}
  CU=n;CR='colab';
  if(esFDS(n)){const f=hoy();if(!S.turnos[f])S.turnos[f]={};S.turnos[f][n]=true;sv();}
  guardarSesion();renderColab();showS('s-colab');
}

function loginCeo(){
  if(document.getElementById('inp-pass').value!==PASS){toast('Contraseña incorrecta');return;}
  CR='ceo';guardarSesion();renderCeo();showS('s-ceo');
}

function logout(){
  limpiarSesion();CU=null;CR=null;
  document.getElementById('inp-pass').value='';
  document.getElementById('sel-nombre').value='';
  showS('s-login');toast('Sesión cerrada');
}


// ═══════════════════════════════════════════════════════════════
// 6. COLAB — Vista colaborador
// ═══════════════════════════════════════════════════════════════

function renderColab(){
  document.getElementById('c-hname').textContent=CU;
  renderHeroYTareas();
}

// ════════════════════════════════════════════════════════════════
// MOTOR DE RETOS — funciones core
// ════════════════════════════════════════════════════════════════

/**
 * Detecta si hay un evento especial cercano a la fecha dada.
 * Retorna {nombre, diasRestantes} o null.
 */
function _eventoCercano(fecha){
  const d0=new Date(fecha+'T12:00:00');
  const anio=d0.getFullYear();
  let closest=null, minDiff=Infinity;
  _EVENTOS_ESPECIALES.forEach(ev=>{
    // Probar año actual y siguiente (para eventos de fin de año)
    [anio,anio+1].forEach(y=>{
      const evFecha=`${y}-${ev.fecha_anual}`;
      const dEv=new Date(evFecha+'T12:00:00');
      const diff=Math.round((dEv-d0)/(1000*60*60*24));
      if(diff>=0&&diff<=ev.dias_preparacion&&diff<minDiff){
        minDiff=diff;
        closest={nombre:ev.nombre,diasRestantes:diff,fecha:evFecha};
      }
    });
  });
  return closest;
}

/**
 * Genera retos sugeridos para (fecha, emp).
 * Solo genera una vez por fecha+colaborador (idempotente).
 */
function generarRetos(fecha, emp){
  if(!S.retos) S.retos=[];
  // Idempotente: si ya existen retos del sistema para esta fecha+emp, salir
  const yaExisten=S.retos.filter(r=>r.fecha===fecha&&r.colaborador===emp&&r.sugerido_por_sistema);
  if(yaExisten.length) return;

  const dow=new Date(fecha+'T12:00:00').getDay(); // 0=dom…6=sab
  const esFinDeSemana=(dow===0||dow===6);
  // Índice determinista basado en día para elegir templates sin aleatoriedad pura
  const idx=dow; // 0-6 → selección rotativa

  const rend=rendimientoReciente(emp);
  const modo=modoAutoAsignar(rend);
  const evCercano=_eventoCercano(fecha);

  const seleccionados=[];

  // 1) Evento especial cercano → 1-2 retos de evento
  if(evCercano){
    const tmpl=_RETOS_TEMPLATES.evento;
    seleccionados.push({...tmpl[idx%tmpl.length],tipo:'evento',_ev:evCercano.nombre});
    if(evCercano.diasRestantes<=2)
      seleccionados.push({...tmpl[(idx+1)%tmpl.length],tipo:'evento',_ev:evCercano.nombre});
  }

  // 2) Según rendimiento y día
  if(modo==='alivio'){
    // Carga ligera: solo alta prioridad de experiencia
    const e=_RETOS_TEMPLATES.experiencia;
    seleccionados.push({...e[idx%e.length],tipo:'experiencia'});
    const c=_RETOS_TEMPLATES.conversion.filter(r=>r.prio!=='alta');
    if(c.length) seleccionados.push({...c[idx%c.length],tipo:'conversion'});
  } else if(modo==='extra'){
    // Alto rendimiento: exigir más
    const t=_RETOS_TEMPLATES.ticket;
    const tr=_RETOS_TEMPLATES.tendencia;
    const cv=_RETOS_TEMPLATES.conversion;
    seleccionados.push({...t[idx%t.length],tipo:'ticket'});
    seleccionados.push({...tr[idx%tr.length],tipo:'tendencia'});
    if(!evCercano) seleccionados.push({...cv[idx%cv.length],tipo:'conversion'});
  } else {
    // Normal
    if(esFinDeSemana){
      const t=_RETOS_TEMPLATES.ticket;
      const tr=_RETOS_TEMPLATES.tendencia;
      seleccionados.push({...t[idx%t.length],tipo:'ticket'});
      seleccionados.push({...tr[(idx+1)%tr.length],tipo:'tendencia'});
    } else {
      const cv=_RETOS_TEMPLATES.conversion;
      const e=_RETOS_TEMPLATES.experiencia;
      seleccionados.push({...cv[idx%cv.length],tipo:'conversion'});
      seleccionados.push({...e[(idx+1)%e.length],tipo:'experiencia'});
    }
  }

  // Deduplicar por descripción y limitar a 5
  const seen=new Set();
  const final=seleccionados.filter(r=>{
    if(!r.desc||seen.has(r.desc)) return false;
    seen.add(r.desc); return true;
  }).slice(0,5);

  if(!final.length) return;

  final.forEach(r=>{
    S.retos.push({
      id:S.nid++,
      tipo:r.tipo,
      descripcion:r.desc,
      objetivo_numerico:r.obj||1,
      prioridad:r.prio||'media',
      fecha,
      colaborador:emp,
      sugerido_por_sistema:true,
      hecho:false,
      fecha_completado:null,
      evento_nombre:r._ev||null,
    });
  });
  sv();
}

/** Marcar/desmarcar reto como completado */
function marcarReto(id){
  const r=(S.retos||[]).find(x=>x.id===id);
  if(!r) return;
  r.hecho=!r.hecho;
  r.fecha_completado=r.hecho?hoy():null;
  sv();
  _edaHash=''; // invalidar cache EDA
  _renderRetosColab();
}

function _renderRetosColab(){
  const el=document.getElementById('c-retos-wrap');
  if(!el) return;
  const f=hoy();
  const retosHoy=(S.retos||[]).filter(r=>r.fecha===f&&r.colaborador===CU&&r.sugerido_por_sistema);

  if(!retosHoy.length){
    el.classList.add('hidden');
    return;
  }
  el.classList.remove('hidden');

  const evCercano=_eventoCercano(f);
  const evTag=evCercano?`<span class="reto-evento-tag">🎉 ${evCercano.nombre} en ${evCercano.diasRestantes}d</span>`:'';

  const rend=rendimientoReciente(CU);
  const modo=modoAutoAsignar(rend);
  const modoInfo={alivio:'🟡 Modo alivio',normal:'',extra:'🟢 Alto rendimiento'}[modo]||'';

  let h=`<div class="retos-header">
    <div>
      <div class="retos-title">🏆 Retos del día${evTag}</div>
      <div class="retos-sub">Desafíos personalizados para maximizar ventas${modoInfo?' · '+modoInfo:''}</div>
    </div>
    <span class="retos-ia-chip">IA</span>
  </div>
  <div class="reto-lista">`;

  retosHoy.forEach(r=>{
    const tipo=_RETO_TIPOS[r.tipo]||{ico:'•',lbl:r.tipo,cls:r.tipo};
    const prioColor={alta:'var(--red)',media:'var(--yellow)',baja:'#60a5fa'}[r.prioridad]||'var(--g300)';
    const checkIco=r.hecho?'✓':'';
    h+=`<div class="reto-card${r.hecho?' done':''}">
      <button class="reto-check-btn${r.hecho?' done':''}" onclick="marcarReto(${r.id})"
        title="${r.hecho?'Marcar como pendiente':'Marcar como completado'}">${checkIco}</button>
      <div class="reto-prio-dot" style="background:${r.hecho?'var(--g200)':prioColor}"></div>
      <div class="reto-body">
        <span class="reto-tipo-chip reto-tipo-${tipo.cls}">${tipo.ico} ${tipo.lbl}</span>
        <span class="reto-desc">${r.descripcion}</span>
        <div class="reto-obj">🎯 Objetivo: ${r.objetivo_numerico} ${r.objetivo_numerico===1?'acción':'acciones'}
          ${r.evento_nombre?` · 🎉 ${r.evento_nombre}`:''}</div>
      </div>
    </div>`;
  });

  h+=`</div>`;
  el.innerHTML=h;
}

function renderHeroYTareas(){
  const f=hoy();
  const est=getEstados(f,CU);
  const notas=getNotas(f,CU);
  const tp=getTareasPers(f,CU);
  const{comp,total,pct}=calcEficacia(CU,f);
  const dia=diaSemana(f);

  // ── Hero ──
  document.getElementById('c-hero').innerHTML=`
    <div class="ph-greeting">Hola, ${CU}</div>
    <div class="ph-date">${dia} ${fd(f)}</div>
    <div class="ph-lbl">Tareas completadas hoy</div>
    <div class="ph-nums">
      <span class="ph-big">${comp}</span>
      <span class="ph-of">de ${total}</span>
      <span class="badge b-${nivelSema(pct)}" style="margin-left:6px"><span class="bdot"></span>${pct}%</span>
    </div>
    <div class="prog-wrap-hero"><div class="prog-bar-hero" style="width:${pct}%"></div></div>`;

  // ── Celebración 100% ──
  if(pct===100&&total>0){
    const flagKey='celeb_'+hoy()+'_'+CU;
    if(!sessionStorage.getItem(flagKey)){sessionStorage.setItem(flagKey,'1');setTimeout(mostrarCelebracion,450);}
  }

  // ── Tareas personalizadas del CEO ──
  const tpWrap=document.getElementById('c-tp-wrap');
  if(tp.length){
    tpWrap.classList.remove('hidden');
    const tpSorted=_sortTareas(tp);
    const urgentes=tpSorted.filter(t=>t.urgente);
    const normales=tpSorted.filter(t=>!t.urgente);
    const cardHeader=document.querySelector('#c-tp-card .frow');
    if(cardHeader){
      cardHeader.innerHTML=urgentes.length
        ?`<span class="card-t">Del Ceo</span><span class="urgente-badge" style="animation:urgente-pulse 1.5s ease-in-out infinite">⚡ ${urgentes.length} urgente${urgentes.length>1?'s':''}</span>`
        :`<span class="card-t">Del Ceo</span><span class="badge b-gold"><span class="bdot"></span>Personalizadas</span>`;
    }
    let h='';
    urgentes.forEach(t=>{
      const k='p_'+t.id;
      h+=tareaItemHtml(k,t.desc,est[k]||'',notas[k]||'',{urgente:true,hora:t.hora||'',reprogramada:t.reprogramada||false});
    });
    if(urgentes.length&&normales.length) h+='<div class="divider" style="margin:.4rem 0"></div>';
    normales.forEach(t=>{
      const k='p_'+t.id;
      h+=tareaItemHtml(k,t.desc,est[k]||'',notas[k]||'',{hora:t.hora||'',reprogramada:t.reprogramada||false});
    });
    document.getElementById('c-tp-lista').innerHTML=h;
  } else {
    tpWrap.classList.add('hidden');
  }

  // ── Tareas base agrupadas ──
  const grupos={};
  S.tareas.forEach(t=>{if(!grupos[t.cat])grupos[t.cat]=[];grupos[t.cat].push(t);});
  let hb='';
  Object.keys(grupos).forEach(cat=>{
    hb+=`<div class="card"><div class="cat-lbl">${CATS[cat]}</div>`;
    grupos[cat].forEach(t=>{
      hb+=tareaItemHtml(t.id,t.desc,est[t.id]||'',notas[t.id]||'',{inst:t.inst||''});
    });
    hb+=`</div>`;
  });
  document.getElementById('c-tareas-base').innerHTML=hb;

  // ── Retos del día ── generarRetos es idempotente
  generarRetos(f, CU);
  _renderRetosColab();

  // ── Evaluación del CEO ──
  const cal=getCalif(f,CU);
  const msgEl=document.getElementById('c-msg');
  if(msgEl){
    if(cal?.sema){
      msgEl.classList.remove('hidden');
      const cfg={
        green:{bg:'var(--green-bg)',border:'var(--green)',dot:'var(--green)',title:'Excelente rendimiento',sub:'El CEO calificó tu turno de hoy'},
        yellow:{bg:'var(--yellow-bg)',border:'var(--yellow)',dot:'var(--yellow)',title:'Rendimiento regular',sub:'El CEO calificó tu turno de hoy'},
        red:{bg:'var(--red-bg)',border:'var(--red)',dot:'var(--red)',title:'Requiere atención',sub:'El CEO calificó tu turno de hoy'}
      }[cal.sema]||{};
      msgEl.style.background=cfg.bg||'var(--cream)';
      msgEl.style.borderColor=cfg.border||'var(--g200)';
      const msgHtml=cal.mensaje
        ?`<div class="feedback-msg" style="background:${cfg.border}18;color:var(--g800)">“${cal.mensaje}”</div>`
        :'';
      msgEl.innerHTML=`<div class="feedback-card-hd">
        <div class="feedback-dot" style="background:${cfg.dot}"></div>
        <div><div class="feedback-title" style="color:var(--g800)">${cfg.title}</div>
        <div class="feedback-sub">${cfg.sub}</div></div>
      </div>${msgHtml}`;
    } else {
      msgEl.classList.add('hidden');
      msgEl.innerHTML='';
    }
  }
}

// ── Interacciones de tareas ──
// ── Autosave indicator ──
function mostrarAutosave(){
  const el=document.getElementById('autosave-ind');
  if(!el)return;
  el.classList.add('on');
  clearTimeout(el._t);
  el._t=setTimeout(()=>el.classList.remove('on'),1800);
}

// ── Long-press helpers (tap=completar, mantén=en proceso) ──
let _lpTimer=null,_lpTriggered=false;
function startLP(id){
  _lpTriggered=false;
  clearTimeout(_lpTimer);
  const btn=document.querySelector(`.tarea-item[data-id="${id}"] .tarea-cb`);
  if(btn)btn.classList.add('lp-holding');
  _lpTimer=setTimeout(()=>{
    _lpTriggered=true;
    if(btn)btn.classList.remove('lp-holding');
    ciclarEnProceso(id);
  },480);
}
function endLP(id){
  clearTimeout(_lpTimer);
  const btn=document.querySelector(`.tarea-item[data-id="${id}"] .tarea-cb`);
  if(btn)btn.classList.remove('lp-holding');
}
function tapEst(id){
  if(_lpTriggered){_lpTriggered=false;return;}
  ciclarEst(id);
}
function ciclarEnProceso(id){
  const f=hoy();
  const rep=ensureReporte(f,CU);
  const actual=rep.estados?.[id]||'';
  const siguiente=actual==='yellow'?'':'yellow';
  if(siguiente==='') delete rep.estados[id]; else rep.estados[id]=siguiente;
  sv();mostrarAutosave();renderHeroYTareas();
  if(navigator.vibrate)navigator.vibrate(25);
}

// ── ciclarEst: binario (pendiente ↔ completada) ──
function ciclarEst(id){
  const f=hoy();
  const rep=ensureReporte(f,CU);
  const actual=rep.estados?.[id]||'';
  const siguiente=actual==='green'?'':'green';
  const esNueva=siguiente==='green';
  if(siguiente==='') delete rep.estados[id]; else rep.estados[id]=siguiente;
  sv();mostrarAutosave();renderHeroYTareas();
  if(esNueva) animarCompletada(id);
}

function setEst(id,color){
  const f=hoy();
  const rep=ensureReporte(f,CU);
  const prev=rep.estados?.[id];
  const esNueva=color==='green'&&prev!=='green';
  rep.estados[id]=color;
  sv();mostrarAutosave();renderHeroYTareas();
  if(esNueva) animarCompletada(id);
}

function setNota(id,val){
  const rep=ensureReporte(hoy(),CU);
  rep.notas[id]=val;svDebounce();
}

function toggleNota(notaId){
  const el=document.getElementById(notaId);
  if(el){el.classList.toggle('visible');if(el.classList.contains('visible'))el.querySelector('textarea')?.focus();}
}

function animarCompletada(id){
  setTimeout(()=>{
    const item=document.querySelector(`.tarea-item[data-id="${id}"]`);
    if(item){item.classList.remove('flash-green');void item.offsetWidth;item.classList.add('flash-green');setTimeout(()=>item.classList.remove('flash-green'),600);}
    const heroBadge=document.querySelector('.prog-hero .badge');
    if(heroBadge){heroBadge.classList.remove('badge-bounce');void heroBadge.offsetWidth;heroBadge.classList.add('badge-bounce');setTimeout(()=>heroBadge.classList.remove('badge-bounce'),450);}
  },30);
}

// guardarReporte eliminado: autoguardado en ciclarEst

// ── Toggle semana/mes ──
function cToggle(){
  const v1=document.getElementById('c-view-hoy');
  const v2=document.getElementById('c-view-periodo');
  const enHoy=!v1.classList.contains('hidden');
  v1.classList.toggle('hidden',enHoy);
  v2.classList.toggle('hidden',!enHoy);
  if(enHoy)renderPeriodoColab();
  document.querySelector('.ah-right .btn-sm').textContent=enHoy?'Volver a hoy':(esFDS(CU)?'Mi mes':'Mi semana');
}

function renderPeriodoColab(){
  const fds=esFDS(CU);
  document.getElementById('c-per-titulo').textContent=fds?'Mi mes':'Mi semana';
  document.getElementById('c-per-sub').textContent=fds?fm(mes()):'Últimos 7 días';
  if(fds) calcMesUI(CU,'c-per-nums','c-per-prog','c-per-hist',false);
  else calcSemanaUI(CU,'c-per-nums','c-per-prog','c-per-hist',false);
}

// ── Celebración ──
function mostrarCelebracion(){
  const modal=document.getElementById('modal-celebracion');
  document.getElementById('celeb-nombre').textContent=`Excelente trabajo, ${CU}. Hoy lo diste todo.`;
  modal.classList.remove('hidden');
  modal.querySelector('.celeb-card').classList.remove('celeb-out');
}
function cerrarCelebracion(){
  const modal=document.getElementById('modal-celebracion');
  const card=modal.querySelector('.celeb-card');
  card.classList.add('celeb-out');
  setTimeout(()=>modal.classList.add('hidden'),300);
}


// ═══════════════════════════════════════════════════════════════
// 7. CEO — Vista CEO
// ═══════════════════════════════════════════════════════════════

// ── 7a. Dashboard (Hoy) ──
function renderCeo(){
  _actualizarSolBadge();
  document.getElementById('ceo-hoy-fecha').textContent=`${diaSemana(hoy())} ${fd(hoy())}`;
  document.getElementById('m-fecha').value=hoy();
  renderCardsHoy();
}

function calcularAlertasHoy(){
  const f=hoy();
  const ahora=new Date();
  const horaActual=ahora.getHours()+ahora.getMinutes()/60;
  const alertas=[];
  TODOS_EMP.forEach(emp=>{
    if(!esLaborable(emp,f))return;
    const estados=getEstados(f,emp);
    const tieneReporte=Object.keys(estados).length>0;
    const horasSinReporte=horaActual-HORA_APERTURA;
    if(!tieneReporte&&horasSinReporte>=HORAS_ALERTA){
      alertas.push({emp,horas:Math.floor(horasSinReporte),minutos:Math.round((horasSinReporte%1)*60)});
    }
  });
  return alertas;
}

function renderAlertas(){
  const alertas=calcularAlertasHoy();
  const el=document.getElementById('ceo-alertas');
  if(!el)return;
  if(!alertas.length){el.innerHTML='';return;}
  el.innerHTML=alertas.map(a=>alertaCardHtml(a.emp,a.horas,a.minutos,hoy())).join('');
}

function renderCardsHoy(){
  renderAlertas();
  document.getElementById('ceo-cards').innerHTML=TODOS_EMP.map(emp=>cardColabHtml(emp,hoy())).join('');
}


// ── 7b. Detalle colaborador ──
function verDetalle(emp,origen,fecha){
  CD=emp;CS=null;PREV=origen||'hoy';DF=fecha||hoy();
  // ── Hero: avatar, eficacia del día ──
  const color=EQ_COLORES[emp]||'#b8943a';
  const avEl=document.getElementById('det-av');
  if(avEl){avEl.textContent=ini(emp);avEl.style.background=color+'20';avEl.style.color=color;}
  document.getElementById('det-nombre').textContent=emp;
  document.getElementById('det-fecha').textContent=`${diaSemana(DF)} ${fd(DF)}`;
  const{pct:dpct,comp:dc,total:dt}=calcEficacia(emp,DF);
  const barCol=dpct>=75?'var(--green)':dpct>=50?'var(--yellow)':'var(--red)';
  const barEl=document.getElementById('det-bar');
  if(barEl){barEl.style.width=dpct+'%';barEl.style.background=barCol;}
  const pctEl=document.getElementById('det-pct');
  if(pctEl)pctEl.innerHTML=`<div style="font-family:var(--ff);font-size:1.3rem;font-weight:700;line-height:1;color:${barCol}">${dpct}%</div><div style="font-size:.62rem;color:var(--g400);text-transform:uppercase;letter-spacing:.06em;margin-top:2px">${dc}/${dt} tareas</div>`;

  const est=getEstados(DF,emp);
  const notas=getNotas(DF,emp);
  const cal=getCalif(DF,emp);
  const tp=getTareasPers(DF,emp);

  let h='';
  // Tareas personalizadas al tope
  if(tp.length){
    const tpSortedD=_sortTareas(tp);
    const tpUrg=tpSortedD.filter(t=>t.urgente);
    const tpNorm=tpSortedD.filter(t=>!t.urgente);
    h+=`<div style="margin-bottom:8px">
      <div class="cat-lbl" style="display:flex;align-items:center;gap:5px;margin-bottom:4px">
        Del Ceo <span class="badge b-gold" style="font-size:.65rem">personalizada</span>
        ${tpUrg.length?`<span class="urgente-badge">⚡ ${tpUrg.length} urgente${tpUrg.length>1?'s':''}</span>`:''}
      </div>
      ${tpUrg.map(t=>tareaDetalleHtml(t.desc,est['p_'+t.id]||'',notas['p_'+t.id]||'',{urgente:true})).join('')}
      ${tpNorm.map(t=>tareaDetalleHtml(t.desc,est['p_'+t.id]||'',notas['p_'+t.id]||'',{reprogramada:t.reprogramada||false})).join('')}
    </div><div class="divider"></div>`;
  }

  // Tareas base agrupadas
  const grupos={};
  S.tareas.forEach(t=>{if(!grupos[t.cat])grupos[t.cat]=[];grupos[t.cat].push(t);});
  Object.keys(grupos).forEach(cat=>{
    h+=`<div class="cat-lbl">${CATS[cat]}</div>`;
    grupos[cat].forEach(t=>{
      h+=tareaDetalleHtml(t.desc,est[t.id]||'',notas[t.id]||'');
    });
    h+='<div style="height:6px"></div>';
  });
  document.getElementById('det-tareas').innerHTML=h;

  // ── Restaurar rating previo ──
  _clearRatingOpts();
  if(cal?.sema){CS=cal.sema;_applyRatingOpt(cal.sema);}
  else CS=null;
  document.getElementById('ceo-msg').value=cal?.mensaje||'';
  const savedEl=document.getElementById('rating-saved');if(savedEl)savedEl.classList.remove('on');

  ['hoy','tareas','equipo','analisis','config'].forEach(t=>{const el=document.getElementById('ct-'+t);if(el)el.classList.add('hidden');});
  document.getElementById('ct-detalle').classList.remove('hidden');
  document.getElementById('fab-btn')?.classList.add('hidden');
}

function volverCeo(){
  document.getElementById('ct-detalle').classList.add('hidden');
  const esEquipo=PREV==='marlon'||PREV==='ingrid'||PREV==='isabella';
  const tabTarget=esEquipo?'ct-equipo':(PREV==='hoy'?'ct-hoy':('ct-'+PREV));
  document.getElementById(tabTarget||'ct-hoy').classList.remove('hidden');
  // FAB solo visible en Hoy
  document.getElementById('fab-btn')?.classList.toggle('hidden',PREV!=='hoy');
  // Resaltar el tab activo
  document.querySelectorAll('.ctab').forEach(b=>{
    b.classList.remove('on');
    const tabName=esEquipo?'equipo':PREV;
    if((b.getAttribute('onclick')||'').includes("'"+tabName+"'"))b.classList.add('on');
  });
  if(PREV==='hoy')renderCardsHoy();
  if(esEquipo){
    _equipoEmp=PREV.charAt(0).toUpperCase()+PREV.slice(1);
    renderEquipo(_equipoEmp);
  }
  if(PREV==='tareas')renderTareas();
}

// ── Rating cards: helpers ──
const _RATING_STYLES={
  green:{border:'var(--green)',bg:'var(--green-bg)'},
  yellow:{border:'var(--yellow)',bg:'var(--yellow-bg)'},
  red:{border:'var(--red)',bg:'var(--red-bg)'}
};
function _clearRatingOpts(){
  ['green','yellow','red'].forEach(c=>{
    const el=document.getElementById('ro-'+c);
    if(!el)return;
    el.classList.remove('on');
    el.style.borderColor='';el.style.background='';
  });
}
function _applyRatingOpt(color){
  const el=document.getElementById('ro-'+color);
  if(!el)return;
  el.classList.add('on');
  el.style.borderColor=_RATING_STYLES[color]?.border||'';
  el.style.background=_RATING_STYLES[color]?.bg||'';
}
function _saveCalif(){
  if(!CS)return;
  if(!S.califs[DF])S.califs[DF]={};
  S.califs[DF][CD]={sema:CS,mensaje:document.getElementById('ceo-msg')?.value.trim()||''};
  sv();
  const el=document.getElementById('rating-saved');
  if(!el)return;
  el.classList.add('on');
  clearTimeout(el._t);
  el._t=setTimeout(()=>el.classList.remove('on'),2200);
}
function setSema(color){
  CS=color;
  _clearRatingOpts();
  _applyRatingOpt(color);
  _saveCalif();
}
function guardarMsg(){
  _saveCalif();
}
function setQuickMsg(msg){
  const el=document.getElementById('ceo-msg');
  if(el){el.value=msg;el.focus();}
  _saveCalif();
}
function guardarCalif(){_saveCalif();}

// ── 7c. Tabs CEO ──
function ceoTab(tab,btn){
  document.querySelectorAll('.ctab').forEach(b=>b.classList.remove('on'));
  if(btn)btn.classList.add('on');
  ['hoy','gestion','equipo','analisis','detalle','solicitudes'].forEach(t=>{
    const el=document.getElementById('ct-'+t);if(el)el.classList.toggle('hidden',t!==tab);
  });
  const fab=document.getElementById('fab-btn');
  if(fab)fab.classList.toggle('hidden',tab!=='hoy');
  if(tab==='hoy')renderCardsHoy();
  if(tab==='gestion')renderGestion();
  if(tab==='equipo')renderEquipo(_equipoEmp);
  if(tab==='analisis')renderAnalisis();
  if(tab==='solicitudes')renderSolicitudes();
}

// ══════════════════════════════════════════════════════════════
// 7c-2. GESTIÓN — Plantilla Base + Asignación Individual
// ══════════════════════════════════════════════════════════════
let _gtColab='';
let _gtTmplOpen=false;

function renderGestion(){
  const body=document.getElementById('gt-tmpl-body');
  const arrow=document.getElementById('gt-tmpl-arrow');
  if(body) body.classList.toggle('hidden',!_gtTmplOpen);
  if(arrow) arrow.textContent=_gtTmplOpen?'∧':'∨';
  _gtRenderTemplate();
  if(_gtColab) _gtRenderColab();
}

function gtToggleTmpl(){
  _gtTmplOpen=!_gtTmplOpen;
  const body=document.getElementById('gt-tmpl-body');
  const arrow=document.getElementById('gt-tmpl-arrow');
  if(body) body.classList.toggle('hidden',!_gtTmplOpen);
  if(arrow) arrow.textContent=_gtTmplOpen?'∧':'∨';
}

function _gtRenderTemplate(){
  const list=document.getElementById('gt-tmpl-list');
  const count=document.getElementById('gt-tmpl-count');
  if(!list) return;
  if(count) count.textContent=S.tareas.length+(S.tareas.length===1?' tarea':' tareas');
  if(!S.tareas.length){
    list.innerHTML='<div class="gt-empty-sm">Sin tareas — agregá la primera abajo</div>';
    return;
  }
  list.innerHTML=S.tareas.map(t=>{
    const safe=t.desc.replace(/&/g,'&amp;').replace(/</g,'&lt;');
    return `<div class="gt-tmpl-row">
      <span class="gt-tmpl-row-txt">${safe}</span>
      <button class="gt-row-del" onclick="gtDelTemplate(${t.id})" title="Eliminar">×</button>
    </div>`;
  }).join('');
}

function gtAddTemplate(){
  const inp=document.getElementById('gt-tmpl-inp');
  if(!inp) return;
  const desc=inp.value.trim();
  if(!desc) return;
  S.tareas.push({id:S.nid++,cat:'ventas',desc,autoAsignar:true,prioridad:'media',frecuencia:'diaria'});
  sv();
  inp.value='';
  _gtRenderTemplate();
}

function gtDelTemplate(id){
  S.tareas=S.tareas.filter(t=>t.id!==id);
  sv();
  _gtRenderTemplate();
  if(_gtColab) _gtRenderColab();
}

function gtSelColab(emp){
  _gtColab=emp;
  const panel=document.getElementById('gt-colab-panel');
  if(!emp){if(panel)panel.classList.add('hidden');return;}
  _gtRenderColab();
}

function _gtRenderColab(){
  const emp=_gtColab;
  if(!emp) return;
  const panel=document.getElementById('gt-colab-panel');
  if(panel) panel.classList.remove('hidden');
  const nameEl=document.getElementById('gt-colab-name');
  const dateEl=document.getElementById('gt-colab-date');
  if(nameEl) nameEl.textContent=emp;
  const fecha=hoy();
  if(dateEl){
    const d=new Date(fecha+'T00:00:00');
    dateEl.textContent=d.toLocaleDateString('es-AR',{weekday:'long',day:'numeric',month:'long'});
  }
  const tmplDone=(S.tmplDone[fecha]&&S.tmplDone[fecha][emp])||[];
  const indiv=(S.tp[fecha]&&S.tp[fecha][emp])||[];
  let html='';
  if(S.tareas.length){
    html+='<div class="gt-sec-lbl">Plantilla</div>';
    html+=S.tareas.map(t=>{
      const done=tmplDone.includes(t.id);
      const safe=t.desc.replace(/&/g,'&amp;').replace(/</g,'&lt;');
      return `<div class="gt-task-row${done?' gt-done':''}" onclick="gtToggleTmplTask(${t.id})">
        <div class="gt-chk${done?' on':''}"></div>
        <span class="gt-task-txt">${safe}</span>
        <span class="gt-badge-p">P</span>
      </div>`;
    }).join('');
  }
  if(indiv.length){
    html+='<div class="gt-sec-lbl">Individual</div>';
    html+=indiv.map(t=>{
      const done=t.hecho;
      const safe=t.desc.replace(/&/g,'&amp;').replace(/</g,'&lt;');
      return `<div class="gt-task-row${done?' gt-done':''}${t.urgente?' gt-urgent':''}" onclick="gtToggleIndiv(${t.id})">
        <div class="gt-chk${done?' on':''}"></div>
        <span class="gt-task-txt">${safe}</span>
        <button class="gt-row-del" onclick="event.stopPropagation();gtDelIndiv(${t.id})">×</button>
      </div>`;
    }).join('');
  }
  if(!S.tareas.length&&!indiv.length){
    html='<div class="gt-empty">Sin tareas para hoy. Agregá tareas a la plantilla o una individual abajo.</div>';
  }
  const list=document.getElementById('gt-task-list');
  if(list) list.innerHTML=html;
}

function gtToggleTmplTask(id){
  const fecha=hoy();
  const emp=_gtColab;
  if(!S.tmplDone[fecha])S.tmplDone[fecha]={};
  if(!S.tmplDone[fecha][emp])S.tmplDone[fecha][emp]=[];
  const arr=S.tmplDone[fecha][emp];
  const idx=arr.indexOf(id);
  if(idx===-1)arr.push(id);else arr.splice(idx,1);
  sv();
  _gtRenderColab();
}

function gtToggleIndiv(id){
  const fecha=hoy();
  const emp=_gtColab;
  const tasks=S.tp[fecha]&&S.tp[fecha][emp];
  if(!tasks) return;
  const task=tasks.find(t=>t.id===id);
  if(task){task.hecho=!task.hecho;sv();_gtRenderColab();}
}

function gtDelIndiv(id){
  const fecha=hoy();
  const emp=_gtColab;
  if(S.tp[fecha]&&S.tp[fecha][emp]){
    S.tp[fecha][emp]=S.tp[fecha][emp].filter(t=>t.id!==id);
    sv();_gtRenderColab();
  }
}

function gtAddIndiv(){
  const inp=document.getElementById('gt-indiv-inp');
  if(!inp||!_gtColab) return;
  const raw=inp.value.trim();
  if(!raw) return;
  const urgente=raw.startsWith('!');
  const desc=urgente?raw.slice(1).trim():raw;
  if(!desc) return;
  const fecha=hoy();
  if(!S.tp[fecha])S.tp[fecha]={};
  if(!S.tp[fecha][_gtColab])S.tp[fecha][_gtColab]=[];
  S.tp[fecha][_gtColab].push({id:S.nid++,desc,urgente,hecho:false});
  sv();
  inp.value='';
  _gtRenderColab();
}

// ══════════════════════════════════════════════════════════════
// 7c-3. TAB TAREAS (legacy — mantenido para compatibilidad)
// ══════════════════════════════════════════════════════════════
let _tarColab='Marlon';
let _tarMesOff=0;      // 0=mes actual, -1=anterior, +1=siguiente
let _tarDiaSel=null;   // fecha seleccionada 'YYYY-MM-DD'
let _agendaStripOff=0;  // offset de la ventana semanal en el strip
let _tarQCat='ventas'; // categoría activa en quick-assign
let _cfgTab='base';    // sub-tab activo en Config (fix: era undefined)

function renderTareas(){ renderAgenda(); }

/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
   AGENDA — Strip semanal + input inteligente
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */
function renderAgenda(){
  _tarDiaSel = _tarDiaSel || hoy();
  _agendaStripOff = 0;
  _renderAgendaStrip();
  _renderAgendaTasks();
}

/* Construye el strip de 7 días comenzando desde hoy+_agendaStripOff días */
function _renderAgendaStrip(){
  const wrap = document.getElementById('agenda-strip');
  if(!wrap) return;
  const emp  = _tarColab;
  const hoyS = hoy();
  // Día base = hoy + offset
  const base = new Date(hoyS+'T12:00:00');
  base.setDate(base.getDate() + _agendaStripOff);

  let html = '<div class="agenda-strip-row">';
  // flecha izquierda
  html += `<button class="agenda-nav-btn" onclick="agendaNavStrip(-7)" title="Semana anterior">‹</button>`;

  for(let i=0;i<7;i++){
    const d = new Date(base); d.setDate(d.getDate()+i);
    const ds = d.toISOString().split('T')[0];
    const isHoy = ds===hoyS;
    const isSel = ds===_tarDiaSel;
    const isPast = ds<hoyS;
    const dow = d.toLocaleDateString('es-CO',{weekday:'short'}).replace('.','').toUpperCase();
    const dom = d.getDate();

    // Determinar dot
    const ef = calcEficacia(emp, ds);
    const tpLen = (S.tp[ds]?.[emp]||[]).length;
    let dotCls = '';
    if(ef.total>0){
      const pct = ef.total?Math.round(ef.comp/ef.total*100):0;
      dotCls = pct>=75?'green': pct>=30?'yellow':'red';
    } else if(tpLen>0){
      dotCls = 'blue';
    }

    let btnCls = 'agenda-day-btn';
    if(isHoy) btnCls += ' agenda-today';
    if(isSel) btnCls += ' agenda-sel';
    if(isPast&&!isHoy) btnCls += ' agenda-past';

    html += `<button class="${btnCls}" onclick="agendaSelDay('${ds}')">
      <span class="agenda-day-name">${dow}</span>
      <span class="agenda-day-num">${dom}</span>
      ${dotCls?`<span class="agenda-dot agenda-dot-${dotCls}"></span>`:'<span class="agenda-dot agenda-dot-none"></span>'}
    </button>`;
  }

  // flecha derecha
  html += `<button class="agenda-nav-btn" onclick="agendaNavStrip(7)" title="Semana siguiente">›</button>`;
  html += '</div>';

  // Etiqueta del período
  const inicio = base;
  const fin = new Date(base); fin.setDate(fin.getDate()+6);
  const mesI = inicio.toLocaleDateString('es-CO',{month:'short'});
  const mesF = fin.toLocaleDateString('es-CO',{month:'short'});
  const periodo = mesI===mesF
    ? `${inicio.getDate()}–${fin.getDate()} ${mesI}`
    : `${inicio.getDate()} ${mesI} – ${fin.getDate()} ${mesF}`;
  html += `<div class="agenda-periodo">${periodo}</div>`;

  wrap.innerHTML = html;
}

/* Lista de tareas para el día seleccionado */
function _renderAgendaTasks(){
  const wrap = document.getElementById('agenda-tasks');
  if(!wrap) return;
  const emp  = _tarColab;
  const fecha = _tarDiaSel || hoy();
  const hoyS  = hoy();
  const isPast = fecha < hoyS;
  const asignadas = S.tp[fecha]?.[emp] || [];
  const base = S.tareas || [];
  const ef = calcEficacia(emp, fecha);

  // ── Cabecera del día ──
  const dObj = new Date(fecha+'T12:00:00');
  const dLbl = dObj.toLocaleDateString('es-CO',{weekday:'long',day:'numeric',month:'long'});
  const dCap = dLbl.charAt(0).toUpperCase()+dLbl.slice(1);

  let pctBar = '';
  if(ef.total>0){
    const pct = ef.total?Math.round(ef.comp/ef.total*100):0;
    const col = pct>=75?'var(--green)':pct>=40?'var(--yellow)':'var(--red)';
    pctBar = `<div style="margin-top:.35rem;height:5px;background:var(--g100);border-radius:3px;overflow:hidden">
      <div style="height:100%;width:${pct}%;background:${col};border-radius:3px;transition:width .4s"></div>
    </div>
    <div style="font-size:.72rem;color:var(--g500);margin-top:.2rem">${ef.comp}/${ef.total} completadas · ${pct}%</div>`;
  }

  let html = `<div class="agenda-day-hd">
    <div class="agenda-day-hd-date">${dCap}</div>
    ${pctBar}
  </div>`;

  // ── Tareas asignadas ──
  const est = getEstados(fecha, emp);
  if(asignadas.length){
    asignadas.forEach(t=>{
      const done = est['p_'+t.id]==='green';
      const urgBadge = t.urgente?'<span class="agenda-badge-urg">!</span>':'';
      const horaBadge = t.hora?`<span class="agenda-badge-hora">${t.hora}</span>`:'';
      html += `<div class="agenda-task${done?' agenda-task-done':''}">
        <label class="agenda-task-check" onclick="tarToggleHecho('${fecha}','${emp}',${t.id})">
          <span class="agenda-chk${done?' chk-on':''}"></span>
        </label>
        <div class="agenda-task-body">
          <span class="agenda-task-desc">${urgBadge}${horaBadge}${t.desc}</span>
        </div>
        <button class="agenda-task-del" onclick="agendaDelTask('${fecha}',${t.id})" title="Eliminar">×</button>
      </div>`;
    });
  } else {
    html += `<div class="agenda-empty-state">
      <div class="agenda-empty-ico">📋</div>
      <div>Sin tareas asignadas${isPast?' (día pasado)':''}</div>
      <div style="font-size:.75rem;color:var(--g400);margin-top:.25rem">Escribe una tarea arriba o usa ⚡</div>
    </div>`;
  }

  // ── Tareas base (colapsables) ──
  if(base.length){
    const baseHechas = base.filter(t=> est[t.id]==='green');
    html += `<div class="agenda-base-toggle" onclick="agendaToggleBase()">
      <span>Tareas base <span class="agenda-base-cnt">${baseHechas.length}/${base.length}</span></span>
      <span class="agenda-base-arrow" id="agenda-base-arrow">▾</span>
    </div>
    <div id="agenda-base-items" class="hidden">`;
    base.forEach(t=>{
      const done = est[t.id]==='green';
      html += `<div class="agenda-base-item${done?' done':''}">
        <label class="agenda-task-check" onclick="toggleRep('${fecha}','${emp}',${t.id})">
          <span class="agenda-chk${done?' chk-on':''}"></span>
        </label>
        <span style="flex:1;font-size:.85rem">${t.desc}</span>
      </div>`;
    });
    html += '</div>';
  }

  wrap.innerHTML = html;
}

function agendaSelDay(fecha){
  _tarDiaSel = fecha;
  const actionsEl = document.getElementById('agenda-actions');
  const actBtn = document.getElementById('agenda-act-btn');
  if(actionsEl) actionsEl.classList.add('hidden');
  if(actBtn) actBtn.classList.remove('on');
  _renderAgendaStrip();
  _renderAgendaTasks();
}

function agendaNavStrip(dir){
  _agendaStripOff += dir;
  // Ajustar día seleccionado si queda fuera de la ventana visible
  const base = new Date(hoy()+'T12:00:00');
  base.setDate(base.getDate() + _agendaStripOff);
  const fin = new Date(base); fin.setDate(fin.getDate()+6);
  const baseS = base.toISOString().split('T')[0];
  const finS  = fin.toISOString().split('T')[0];
  if(!_tarDiaSel || _tarDiaSel < baseS || _tarDiaSel > finS){
    _tarDiaSel = baseS;
  }
  _renderAgendaStrip();
  _renderAgendaTasks();
}

function agendaSubmitTask(){
  const inp = document.getElementById('agenda-inp');
  if(!inp) return;
  const raw = inp.value.trim();
  if(!raw) { inp.focus(); return; }
  const urgente = raw.startsWith('!');
  const desc = urgente ? raw.slice(1).trim() : raw;
  if(!desc) { inp.focus(); return; }
  const fecha = _tarDiaSel || hoy();
  const emp   = _tarColab;
  if(!S.tp[fecha]) S.tp[fecha]={};
  if(!S.tp[fecha][emp]) S.tp[fecha][emp]=[];
  S.tp[fecha][emp].push({id:S.nid++, desc, urgente});
  sv();
  inp.value='';
  inp.focus();
  _renderAgendaStrip();
  _renderAgendaTasks();
  if(!document.getElementById('ct-hoy')?.classList.contains('hidden')) renderCardsHoy();
}

function agendaToggleActions(){
  const el = document.getElementById('agenda-actions');
  const btn = document.getElementById('agenda-act-btn');
  if(!el) return;
  const isHidden = el.classList.contains('hidden');
  el.classList.toggle('hidden', !isHidden);
  btn?.classList.toggle('on', isHidden);
}

function agendaSmartAction(type){
  const fecha = _tarDiaSel || hoy();
  // cerrar acciones
  document.getElementById('agenda-actions')?.classList.add('hidden');
  document.getElementById('agenda-act-btn')?.classList.remove('on');

  if(type==='auto'){
    tarAutoAsignar(fecha);
  } else if(type==='ayer'){
    tarDuplicarDiaAnterior(fecha);
  } else if(type==='tmpl'){
    tarAplicarPlantilla(fecha);
  } else if(type==='semana'){
    planificarSemana();
  }
  _renderAgendaStrip();
  _renderAgendaTasks();
}

function agendaDelTask(fecha, id){
  if(!S.tp[fecha]?.[_tarColab]) return;
  S.tp[fecha][_tarColab] = S.tp[fecha][_tarColab].filter(t=>t.id!==id);
  if(!S.tp[fecha][_tarColab].length) delete S.tp[fecha][_tarColab];
  sv();
  _renderAgendaStrip();
  _renderAgendaTasks();
}

function agendaToggleBase(){
  const items = document.getElementById('agenda-base-items');
  const arrow = document.getElementById('agenda-base-arrow');
  if(!items) return;
  const isHidden = items.classList.contains('hidden');
  items.classList.toggle('hidden', !isHidden);
  if(arrow) arrow.style.transform = isHidden ? 'rotate(180deg)' : '';
}

/* Toggle tarea personalizada (S.tp) via estados['p_'+id] */
function tarToggleHecho(fecha, emp, id){
  const rep = ensureReporte(fecha, emp);
  const key = 'p_'+id;
  const actual = rep.estados?.[key] || '';
  const siguiente = actual==='green' ? '' : 'green';
  if(siguiente==='') delete rep.estados[key]; else rep.estados[key]=siguiente;
  sv(); mostrarAutosave();
  _renderAgendaStrip();
  _renderAgendaTasks();
}

/* Toggle tarea base (S.tareas) via estados[id] — usado desde agenda CEO view */
function toggleRep(fecha, emp, id){
  const rep = ensureReporte(fecha, emp);
  const actual = rep.estados?.[id] || '';
  const siguiente = actual==='green' ? '' : 'green';
  if(siguiente==='') delete rep.estados[id]; else rep.estados[id]=siguiente;
  sv(); mostrarAutosave();
  _renderAgendaStrip();
  _renderAgendaTasks();
}

function tarSelColab(emp){
  _tarColab=emp;
  _tarDiaSel=hoy();
  _agendaStripOff=0;
  document.querySelectorAll('.tar-pill').forEach(b=>b.classList.remove('on'));
  document.getElementById('tarcol-'+emp)?.classList.add('on');
  _renderAgendaStrip();
  _renderAgendaTasks();
}

function tarNavMes(dir){
  _tarMesOff+=dir;
  _tarDiaSel=null;
  _renderTarCal();
  document.getElementById('tar-dia-panel').innerHTML='';
}

function _renderTarCal(){
  const emp=_tarColab;
  const color=EQ_COLORES[emp]||'#b8943a';
  const base=new Date();base.setDate(1);base.setMonth(base.getMonth()+_tarMesOff);
  const yr=base.getFullYear(),mn=base.getMonth();
  const ms=(mn+1).toString().padStart(2,'0');
  const mid=`${yr}-${ms}`;
  const hoyStr=hoy();
  const p1=new Date(yr,mn,1),pN=new Date(yr,mn+1,0);
  let sd=p1.getDay()-1;if(sd<0)sd=6;
  const rows=Math.ceil((sd+pN.getDate())/7);
  const mNom=p1.toLocaleDateString('es-CO',{month:'long',year:'numeric'});

  // Stats del mes — cache calcEficacia para reusar en el grid (evita doble cómputo)
  const _efCache=new Map();
  let mComp=0,mTot=0,mTp=0;
  for(let d=1;d<=pN.getDate();d++){
    const ds=`${mid}-${d.toString().padStart(2,'0')}`;
    const ef=calcEficacia(emp,ds);_efCache.set(ds,ef);
    mTot+=ef.total;mComp+=ef.comp;
    mTp+=(S.tp[ds]?.[emp]||[]).length;
  }
  const mPct=mTot>0?Math.round(mComp/mTot*100):null;

  // Sub text
  let subTxt=mPct!==null?`${mPct}% completado este mes`:'Sin datos este mes';
  if(mTp>0)subTxt+=` · ${mTp} tarea${mTp>1?'s':''} asignada${mTp>1?'s':''}`;

  let h=`<div class="cal-wrap">
    <div class="cal-hdr">
      <div class="cal-hdr-left">
        <span class="cal-mes-lbl">${mNom}</span>
        <span class="cal-mes-sub">${subTxt}</span>
      </div>
      <div class="cal-nav-btns">
        <button class="cal-nav-btn" onclick="tarNavMes(-1)">‹</button>
        <button class="cal-nav-btn" onclick="tarNavMes(1)">›</button>
      </div>
    </div>
    <div class="cal-grid">
      <div class="cal-dow">L</div><div class="cal-dow">M</div><div class="cal-dow">X</div>
      <div class="cal-dow">J</div><div class="cal-dow">V</div>
      <div class="cal-dow cal-dow-fin">S</div><div class="cal-dow cal-dow-fin">D</div>`;

  for(let i=0;i<rows*7;i++){
    const d=i-sd+1;
    if(d<1||d>pN.getDate()){h+=`<div class="cal-cell cal-off"></div>`;continue;}
    const ds=`${mid}-${d.toString().padStart(2,'0')}`;
    const isHoy=ds===hoyStr,isSel=ds===_tarDiaSel,isPast=ds<hoyStr,isFut=ds>hoyStr;
    const dow=new Date(yr,mn,d).getDay();
    const isFin=dow===0||dow===6;
    let works=true;
    if(esFDS(emp)){works=!!(S.turnos[ds]?.[emp]===true)&&isFin;}else{works=!isFin;}

    const tp=(S.tp[ds]?.[emp])||[];
    let pcls='',dots='';

    if(works){
      if(isPast){
        const ef=_efCache.get(ds)||calcEficacia(emp,ds); // use cache
        if(ef.total>0){const p=Math.round(ef.comp/ef.total*100);pcls=p>=75?'cp-good':p>=40?'cp-mid':'cp-bad';}
        else pcls='cp-empty';
      }
      if(tp.length>0){
        dots=isFut?`<span class="cal-badge">${tp.length}</span>`:`<div class="cal-dot" style="background:${color}"></div>`;
      }
    }

    const cls=[pcls,!works?'cal-no-work':'',isHoy?'cal-hoy':'',isSel?'cal-sel':''].filter(Boolean).join(' ');
    h+=`<div class="cal-cell ${cls}" onclick="tarSelDia('${ds}')">
      <div class="cal-num">${d}</div>
      <div class="cal-dots">${dots}</div>
    </div>`;
  }
  h+=`</div></div>`;

  // Leyenda
  h+=`<div class="cal-legend">
    <span class="cal-leg-item"><span class="cal-leg-box" style="background:#eaf7ef"></span>Bien</span>
    <span class="cal-leg-item"><span class="cal-leg-box" style="background:#fef9e4"></span>Regular</span>
    <span class="cal-leg-item"><span class="cal-leg-box" style="background:#fdecea"></span>Bajo</span>
    <span class="cal-leg-item"><span class="cal-badge" style="font-size:.55rem">2</span>Asignadas</span>
  </div>`;

  document.getElementById('tar-cal').innerHTML=h;
}

function tarSelDia(fecha){
  _tarDiaSel=fecha;
  _renderTarCal();
  _renderTarDiaPanel(fecha);
  // Scroll al panel
  setTimeout(()=>document.getElementById('tar-dia-panel')?.scrollIntoView({behavior:'smooth',block:'nearest'}),80);
}

function _renderTarDiaPanel(fecha){
  const emp  = _tarColab;
  const color= EQ_COLORES[emp]||'#b8943a';
  const hoy0 = hoy();
  const isPast = fecha < hoy0;
  const isHoy  = fecha === hoy0;
  const isFut  = fecha > hoy0;
  const fLbl   = `${diaSemana(fecha)} ${fd(fecha)}`;

  /* estados y tareas */
  const ef  = calcEficacia(emp, fecha);
  const pct = ef.total > 0 ? Math.round(ef.comp/ef.total*100) : null;
  const pCol= pct===null?'var(--g300)': pct>=75?'var(--green)': pct>=40?'var(--yellow)':'var(--red)';
  const tp  = (S.tp[fecha]?.[emp]) || [];
  const est = getEstados(fecha, emp);

  /* grupos de tareas base */
  const grp = {};
  S.tareas.forEach(t=>{ if(!grp[t.cat]) grp[t.cat]=[]; grp[t.cat].push(t); });
  const ORD = ['ventas','orden','redes','inventario'];

  /* deadline chip */
  const now   = new Date();
  const nowMin= now.getHours()*60 + now.getMinutes();
  function dlC(hr){
    if(!hr) return '';
    const [hh,mm]=(hr||'').split(':').map(Number);
    const dl=hh*60+(mm||0), df=dl-nowMin;
    if(isPast) return `<span class="dl-chip ok">⏰ ${hr}</span>`;
    if(df<0)   return `<span class="dl-chip overdue">⚠ Venció ${hr}</span>`;
    if(df<=60) return `<span class="dl-chip warn">⏱ ${hr} · ${df}min</span>`;
    return `<span class="dl-chip ok">⏰ hasta ${hr}</span>`;
  }

  /* ─ header ─ */
  let sub = isFut
    ? (tp.length ? `${tp.length} tarea${tp.length>1?'s':''} asignada${tp.length>1?'s':''}` : 'Toca + para asignar')
    : (ef.total>0 ? `${ef.comp} de ${ef.total} completadas` : 'Sin registro de tareas');

  let h = `<div class="dia-panel">
  <div class="dia-hd">
    <div class="dia-hd-left">
      <span class="dia-hd-fecha">${fLbl}</span>
      <span class="dia-hd-sub">${sub}</span>
    </div>
    <div class="dia-hd-pct">`;
  if(pct!==null) h+=`<div style="text-align:center">
    <div class="dia-pct-num" style="color:${pCol}">${pct}%</div>
    <div class="dia-pct-lbl">hecho</div>
  </div>`;
  h+=`<button class="dia-close" onclick="tarCerrarDia()">✕</button>
    </div>
  </div>`;

  /* progress bar */
  if(pct!==null) h+=`<div class="dia-pbar"><div class="dia-pbar-fill" style="width:${pct}%;background:${pCol}"></div></div>`;

  /* ── BARRA DE ACCIONES RÁPIDAS (solo CEO) ── */
  if(S.rol==='ceo'){
    const _rend=rendimientoReciente(emp);
    const _modo=modoAutoAsignar(_rend);
    const _rendChipCls={alivio:'rc-alivio',normal:'rc-normal',extra:'rc-extra'}[_modo]||'rc-nodata';
    const _rendChipTxt=_rend!==null
      ?({alivio:`🟡 ${_rend}% · Carga ligera`,normal:`📊 ${_rend}% · Normal`,extra:`🟢 ${_rend}% · Carga extra`})[_modo]
      :'📊 Sin historial';
    h+=`<div class="dia-quick-bar">
      <div style="display:flex;align-items:center;gap:4px;flex-wrap:wrap;width:100%;margin-bottom:.35rem">
        <span class="dia-quick-lbl">Acciones</span>
        <span class="dia-rend-chip ${_rendChipCls}" title="Rendimiento promedio últimos 7 días">${_rendChipTxt}</span>
      </div>
      <button class="dia-qbtn dia-qbtn-dupl" onclick="tarDuplicarDiaAnterior('${fecha}')" title="Copia las tareas del día anterior a este día">
        📋 Duplicar día anterior
      </button>
      <button class="dia-qbtn dia-qbtn-auto" onclick="tarAutoAsignar('${fecha}')" title="Auto-asigna tareas base marcadas con ⚡">
        ⚡ Auto asignar
      </button>
      <button class="dia-qbtn dia-qbtn-tmpl" onclick="tarAplicarPlantilla('${fecha}')" title="Aplicar una plantilla de tareas guardada">
        📐 Aplicar plantilla
      </button>
    </div>`;
    /* ── SUGERENCIA DE PLANTILLA (solo días futuros/hoy) ── */
    if(isHoy||isFut){
      const _sug=_tmplSugerida(fecha);
      if(_sug){
        const _sidx=(S.plantillas||[]).indexOf(_sug);
        const _diasChips=(_sug.dias_aplicables||[]).slice(0,4)
          .map(d=>`<span class="dia-suggest-dia">${d}</span>`).join('');
        h+=`<div class="dia-suggest-banner">
          <div class="dia-suggest-content">
            <span class="dia-suggest-ico">💡</span>
            <div style="min-width:0">
              <div class="dia-suggest-ttl">Plantilla sugerida</div>
              <div class="dia-suggest-nm">${_sug.nombre}</div>
              <div class="dia-suggest-dias">${_diasChips}</div>
            </div>
          </div>
          <button class="dia-qbtn dia-qbtn-tmpl" style="padding:.28rem .65rem;font-size:.7rem;flex-shrink:0"
            onclick="_tmplAplicar('${fecha}',${_sidx})">Aplicar</button>
        </div>`;
      }
    }
  }

  /* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
     DÍAS FUTUROS / HOY
     Flujo: form primero → personalizadas → base colapsada
  ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */
  if(!isPast){
    /* FORMULARIO DE ASIGNACIÓN — primero y prominente */
    h+=`<div class="dia-assign">
      <div style="font-size:.62rem;font-weight:700;letter-spacing:.1em;text-transform:uppercase;color:var(--g400);margin-bottom:.45rem">
        + Asignar tarea a ${emp}
      </div>
      <div class="dia-assign-row">
        <input class="dia-assign-inp" id="tar-assign-inp" type="text"
          placeholder="Descripción de la tarea…" maxlength="80"
          onkeydown="if(event.key==='Enter')tarAsignar('${fecha}')">
        <button class="dia-assign-btn" onclick="tarAsignar('${fecha}')">Asignar</button>
      </div>
      <div class="dia-opts">
        <label class="dia-opt-time" title="Hora límite opcional">
          <span style="font-size:.8rem">⏰</span>
          <input type="time" id="tar-hora-inp">
          <span style="font-size:.72rem;color:var(--g400)">Hora límite</span>
        </label>
        <label class="dia-opt-urg">
          <input type="checkbox" id="tar-urg-chk">
          <span>⚡ Urgente</span>
        </label>
      </div>`;

    /* chips de grupo */
    const hayG = ORD.some(c=>(grp[c]||[]).length>0);
    if(hayG){
      h+=`<div style="display:flex;gap:5px;flex-wrap:wrap;margin-top:.45rem;padding-top:.45rem;border-top:1px solid var(--g200)">
        <span style="font-size:.68rem;color:var(--g400);align-self:center;font-weight:600">Grupo rápido:</span>`;
      ORD.forEach(c=>{
        if(!(grp[c]||[]).length) return;
        const m=CFG_CAT_META[c]||{ico:'•',nm:c};
        h+=`<button class="dia-grupo-chip" onclick="tarAsignarGrupo('${fecha}','${c}')">${m.ico} ${m.nm}</button>`;
      });
      h+=`</div>`;
    }
    h+=`</div>`;

    /* TAREAS PERSONALIZADAS YA ASIGNADAS */
    if(tp.length){
      const tpSortedF=_sortTareas(tp);
      const urg=tpSortedF.filter(t=>t.urgente), norm=tpSortedF.filter(t=>!t.urgente);
      h+=`<div class="dia-sec"><span class="dia-sec-lbl">📌 Asignadas (${tp.length})</span>`;
      tpSortedF.forEach(t=>{
        const k='p_'+t.id, e=est[k]||'', dn=e==='green';
        const dc=dn?'var(--green)':e==='yellow'?'var(--yellow)':'var(--g200)';
        const reprBadge=t.reprogramada
          ?`<span class="repr-badge">Reprogramada${t.reprogramadaDe?' · '+fd(t.reprogramadaDe):''}</span>`:'';
        h+=`<div class="dia-task">
          <div class="dia-task-dot" style="background:${dc}${t.urgente?';box-shadow:0 0 0 2px #ff6b6b40':''}"></div>
          <div class="dia-task-body">
            ${t.urgente?'<span class="urgente-badge" style="font-size:.62rem;display:inline-flex;margin-bottom:2px">⚡ Urgente</span><br>':''}
            <div class="dia-task-txt${dn?' done':''}">${t.desc}${reprBadge}</div>
            ${dlC(t.hora||'')}
          </div>
          <button class="dia-task-del" onclick="tarElimTP('${fecha}',${t.id})">✕</button>
        </div>`;
      });
      h+=`</div>`;
    }

    /* TAREAS BASE — colapsadas como referencia */
    const baseTot = S.tareas.length;
    if(baseTot>0){
      const panelId='dbase-'+fecha.replace(/-/g,'');
      h+=`<div class="dia-sec">
        <button onclick="tarToggleBase('${panelId}')" id="dbase-btn-${panelId}"
          style="display:flex;align-items:center;justify-content:space-between;width:100%;background:none;border:none;
                 cursor:pointer;padding:.55rem 1rem .45rem;font-family:var(--fb)">
          <span class="dia-sec-lbl" style="padding:0;margin:0;font-size:.63rem">📋 Tareas base (${baseTot})</span>
          <span id="dbase-ico-${panelId}" style="font-size:.7rem;color:var(--g400);transition:transform .2s">▼</span>
        </button>
        <div id="${panelId}" style="display:none">`;
      ORD.forEach(cat=>{
        const ls=grp[cat]||[]; if(!ls.length) return;
        const m=CFG_CAT_META[cat]||{ico:'•',nm:cat};
        h+=`<div class="dia-cat-hd">${m.ico} ${m.nm}</div>`;
        ls.forEach(t=>{
          const instH = t.inst
            ? `<button class="dia-inst-btn" onclick="tarToggleInst('${t.id}')" id="dpib-${t.id}">ℹ️ ¿Cómo hacerlo?</button>
               <div class="dia-inst-box" id="dpi-${t.id}" style="display:none">${t.inst}</div>`
            : '';
          h+=`<div class="dia-task">
            <div class="dia-task-dot" style="background:var(--g200)"></div>
            <div class="dia-task-body">
              <div class="dia-task-txt" style="color:var(--g500)">${t.desc}</div>${instH}
            </div>
          </div>`;
        });
      });
      h+=`</div></div>`;
    }
  }

  /* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
     DÍAS PASADOS / HOY CON DATOS
     Flujo: personalizadas → base con estado
  ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */
  if(isPast||(isHoy&&ef.total>0)){

    /* TAREAS PERSONALIZADAS */
    if(tp.length){
      const tpSortedP=_sortTareas(tp);
      const urg=tpSortedP.filter(t=>t.urgente), norm=tpSortedP.filter(t=>!t.urgente);
      h+=`<div class="dia-sec"><span class="dia-sec-lbl">📌 Del CEO (${tp.length})</span>`;
      tpSortedP.forEach(t=>{
        const k='p_'+t.id, e=est[k]||'', dn=e==='green';
        const dc=dn?'var(--green)':e==='yellow'?'var(--yellow)':'var(--g200)';
        const delBtn=!isPast?`<button class="dia-task-del" onclick="tarElimTP('${fecha}',${t.id})">✕</button>`:'';
        const reprBadge2=t.reprogramada
          ?`<span class="repr-badge">Reprogramada${t.reprogramadaDe?' · '+fd(t.reprogramadaDe):''}</span>`:'';
        h+=`<div class="dia-task">
          <div class="dia-task-dot" style="background:${dc}${t.urgente?';box-shadow:0 0 0 2px #ff6b6b40':''}"></div>
          <div class="dia-task-body">
            ${t.urgente?'<span class="urgente-badge" style="font-size:.62rem;display:inline-flex;margin-bottom:2px">⚡ Urgente</span><br>':''}
            <div class="dia-task-txt${dn?' done':''}">${t.desc}${reprBadge2}</div>
            ${dlC(t.hora||'')}
          </div>${delBtn}
        </div>`;
      });
      h+=`</div>`;
    }

    /* TAREAS BASE CON ESTADO */
    if(S.tareas.length){
      h+=`<div class="dia-sec"><span class="dia-sec-lbl">📋 Tareas base</span>`;
      ORD.forEach(cat=>{
        const ls=grp[cat]||[]; if(!ls.length) return;
        const m=CFG_CAT_META[cat]||{ico:'•',nm:cat};
        h+=`<div class="dia-cat-hd">${m.ico} ${m.nm}</div>`;
        ls.forEach(t=>{
          const e=est[t.id]||'', dn=e==='green';
          const dc=dn?'var(--green)':e==='yellow'?'var(--yellow)':'var(--g200)';
          const instH = t.inst
            ? `<button class="dia-inst-btn" onclick="tarToggleInst('${t.id}')" id="dpib-${t.id}">ℹ️ ¿Cómo hacerlo?</button>
               <div class="dia-inst-box" id="dpi-${t.id}" style="display:none">${t.inst}</div>`
            : '';
          h+=`<div class="dia-task">
            <div class="dia-task-dot" style="background:${dc}"></div>
            <div class="dia-task-body">
              <div class="dia-task-txt${dn?' done':''}">${t.desc}</div>${instH}
            </div>
          </div>`;
        });
      });
      h+=`</div>`;
    }
  }

  h+=`</div>`;
  document.getElementById('tar-dia-panel').innerHTML=h;
}

function tarCerrarDia(){
  _tarDiaSel=null;
  _renderTarCal();
  document.getElementById('tar-dia-panel').innerHTML='';
}

function tarToggleBase(panelId){
  const el=document.getElementById(panelId);
  const ico=document.getElementById('dbase-ico-'+panelId);
  if(!el) return;
  const open=el.style.display!=='none';
  el.style.display=open?'none':'block';
  if(ico) ico.style.transform=open?'':'rotate(180deg)';
}

function tarSetCat(cat){
  _tarQCat=cat;
  if(_tarDiaSel) _renderTarDiaPanel(_tarDiaSel);
}

function tarAsignar(fecha){
  const inp=document.getElementById('tar-assign-inp');
  if(!inp) return;
  const desc=inp.value.trim();
  if(!desc){ inp.focus(); return; }
  const hora=(document.getElementById('tar-hora-inp')?.value||'').trim()||null;
  const urgente=document.getElementById('tar-urg-chk')?.checked||false;
  if(!S.tp[fecha]) S.tp[fecha]={};
  if(!S.tp[fecha][_tarColab]) S.tp[fecha][_tarColab]=[];
  const task={id:S.nid++, desc, urgente};
  if(hora) task.hora=hora;
  S.tp[fecha][_tarColab].push(task);
  sv();
  toast(`✓ Asignada a ${_tarColab}`);
  _renderTarDiaPanel(fecha);
  _renderTarCal();
  if(!document.getElementById('ct-hoy')?.classList.contains('hidden')) renderCardsHoy();
}

function tarAsignarGrupo(fecha,cat){
  const lista=S.tareas.filter(t=>t.cat===cat);
  if(!lista.length){ toast('Sin tareas en esta categoría'); return; }
  if(!S.tp[fecha]) S.tp[fecha]={};
  if(!S.tp[fecha][_tarColab]) S.tp[fecha][_tarColab]=[];
  lista.forEach(t=>S.tp[fecha][_tarColab].push({id:S.nid++,desc:t.desc,urgente:false}));
  sv();
  toast(`✓ ${lista.length} tareas asignadas a ${_tarColab}`);
  _renderTarDiaPanel(fecha);
  _renderTarCal();
}

function tarElimTP(fecha,id){
  if(!S.tp[fecha]?.[_tarColab]) return;
  S.tp[fecha][_tarColab]=S.tp[fecha][_tarColab].filter(t=>t.id!==id);
  if(!S.tp[fecha][_tarColab].length) delete S.tp[fecha][_tarColab];
  sv(); toast('Tarea eliminada');
  _renderTarDiaPanel(fecha);
  _renderTarCal();
}

/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
   ACCIONES RÁPIDAS – HOOKS CEO
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */

/* Duplica todas las tareas personalizadas del día anterior al día dado */
function tarDuplicarDiaAnterior(fecha){
  const emp = _tarColab;
  // calcular día anterior (calendar day -1)
  const d = new Date(fecha + 'T00:00:00');
  d.setDate(d.getDate() - 1);
  const prev = d.toISOString().slice(0,10);
  const srcTasks = (S.tp[prev]?.[emp]) || [];
  if(!srcTasks.length){
    toast('⚠ El día anterior no tiene tareas para duplicar');
    return;
  }
  if(!S.tp[fecha]) S.tp[fecha] = {};
  if(!S.tp[fecha][emp]) S.tp[fecha][emp] = [];
  // clonar cada tarea con nuevo id (sin preservar estado)
  const clonadas = srcTasks.map(t => {
    const nt = { id: S.nid++, desc: t.desc };
    if(t.hora) nt.hora = t.hora;
    if(t.urgente) nt.urgente = true;
    return nt;
  });
  S.tp[fecha][emp].push(...clonadas);
  sv();
  toast(`📋 ${clonadas.length} tarea${clonadas.length>1?'s':''} duplicada${clonadas.length>1?'s':''} desde ${fd(prev)}`);
  _renderTarDiaPanel(fecha);
  _renderTarCal();
}

/* Auto-asigna tareas según rendimiento reciente del colaborador.
   Modo alivio (<60%) → solo alta prioridad.
   Modo normal (60-85%) → todas las tareas marcadas con autoAsignar.
   Modo extra (>85%) → autoAsignar + tareas alta prioridad adicionales. */
function tarAutoAsignar(fecha){
  const emp=_tarColab;

  // ── Calcular rendimiento y determinar modo ──
  const rend=rendimientoReciente(emp);
  const modo=modoAutoAsignar(rend);

  // ── Seleccionar candidatas según modo ──
  let candidatas;
  if(modo==='alivio'){
    // Carga reducida: solo autoAsignar de alta prioridad
    candidatas=S.tareas.filter(t=>t.autoAsignar&&t.prioridad==='alta');
    if(!candidatas.length)
      candidatas=S.tareas.filter(t=>t.autoAsignar).slice(0,2); // fallback: máx 2
  } else if(modo==='extra'){
    // Carga ampliada: autoAsignar + extras de alta prioridad
    const base=S.tareas.filter(t=>t.autoAsignar===true);
    const extras=S.tareas.filter(t=>!t.autoAsignar&&t.prioridad==='alta');
    candidatas=[...base,...extras];
  } else {
    candidatas=S.tareas.filter(t=>t.autoAsignar===true);
  }

  if(!candidatas.length){
    toast('⚠ Activa "⚡ Auto" en alguna tarea base desde Configuración');
    return;
  }

  if(!S.tp[fecha]) S.tp[fecha]={};
  if(!S.tp[fecha][emp]) S.tp[fecha][emp]=[];
  const existing=new Set(S.tp[fecha][emp].map(t=>t.desc.toLowerCase().trim()));

  const nuevas=candidatas
    .filter(t=>!existing.has(t.desc.toLowerCase().trim()))
    .map(t=>({id:S.nid++,desc:t.desc}));

  if(!nuevas.length){
    toast('✓ Las tareas automáticas ya están asignadas');
    return;
  }

  S.tp[fecha][emp].push(...nuevas);
  sv();

  // ── Toast con contexto de modo ──
  const modoEmoji={alivio:'🟡',normal:'⚡',extra:'🟢'};
  const modoLbl={alivio:'Modo alivio',normal:'Auto asignar',extra:'Modo extra'};
  const rendStr=rend!==null?` · ${rend}% rend`:'';
  toast(`${modoEmoji[modo]} ${modoLbl[modo]}${rendStr} — ${nuevas.length} tarea${nuevas.length>1?'s':''}`);
  _renderTarDiaPanel(fecha);
  _renderTarCal();
}

/* Abre modal de selección de plantillas guardadas */
function tarAplicarPlantilla(fecha){
  const emp = _tarColab;
  const plantillas = S.plantillas || [];
  let body = '';
  if(!plantillas.length){
    body = `<div class="tmpl-empty">Aún no hay plantillas guardadas.<br>
      <span style="font-size:.74rem;color:var(--g400)">Próximamente podrás guardar conjuntos de tareas como plantillas.</span>
    </div>`;
  } else {
    body = plantillas.map((p,i)=>{
      const diasStr=(p.dias_aplicables||[]).slice(0,4).join(', ')+(p.dias_aplicables?.length>4?'…':'');
      const tarN=p.tareas?.length||0;
      const sub=[tarN+' tarea'+(tarN!==1?'s':''), diasStr].filter(Boolean).join(' · ');
      return `
      <div style="display:flex;align-items:center;justify-content:space-between;
        padding:.65rem .9rem;border-radius:var(--rs);background:var(--cream);
        margin-bottom:.4rem;cursor:pointer;transition:background .12s"
        onclick="_tmplAplicar('${fecha}',${i});cerrarModal()">
        <div>
          <div style="font-size:.84rem;font-weight:600;color:var(--g800)">${p.nombre}</div>
          <div style="font-size:.72rem;color:var(--g400);margin-top:2px">${sub}</div>
        </div>
        <span style="font-size:1rem">▶</span>
      </div>`;
    }).join('');
  }
  const modal = document.createElement('div');
  modal.className = 'tmpl-modal-overlay';
  modal.id = 'tmpl-modal-overlay';
  modal.innerHTML = `
    <div class="tmpl-modal">
      <div class="tmpl-modal-title">
        📐 Seleccionar plantilla
        <button class="tmpl-modal-close" onclick="cerrarModal()">✕</button>
      </div>
      ${body}
    </div>`;
  modal.addEventListener('click', e => { if(e.target===modal) cerrarModal(); });
  document.body.appendChild(modal);
}

function cerrarModal(){
  // Cierra cualquier modal dinámico y el apply-sheet estático
  ['tmpl-modal-overlay','plan-modal-overlay','sol-modal-overlay'].forEach(id=>{
    document.getElementById(id)?.remove();
  });
  document.getElementById('modal')?.classList.add('hidden');
}

/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
   PLANIFICAR SEMANA AUTOMÁTICA
   1. Construye preview por día laborable
   2. Muestra modal de confirmación
   3. Aplica el plan aprobado
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */
function planificarSemana(){
  const emp  = _tarColab;
  const hoyStr = hoy();

  // ── Calcular lunes de la semana actual ──
  const hoyD = new Date(hoyStr+'T12:00:00');
  const dow   = hoyD.getDay();             // 0=dom, 1=lun … 6=sab
  const diffLun = dow===0 ? -6 : 1-dow;   // días hasta lunes (negativo=pasado)
  const lunes = new Date(hoyD);
  lunes.setDate(hoyD.getDate() + diffLun);

  // ── 7 días: lunes → domingo ──
  const semana = [];
  for(let i=0;i<7;i++){
    const d=new Date(lunes);
    d.setDate(lunes.getDate()+i);
    semana.push(d.toISOString().slice(0,10));
  }

  // ── Filtrar días laborables para este colaborador ──
  const diasLab = semana.filter(f=>esLaborable(emp,f));

  if(!diasLab.length){
    toast('⚠ No hay días laborables en la semana para '+emp);
    return;
  }

  // ── Tareas auto-asignar ──
  const rend  = rendimientoReciente(emp);
  const modo  = modoAutoAsignar(rend);
  let autoPool;
  if(modo==='alivio'){
    autoPool=S.tareas.filter(t=>t.autoAsignar&&t.prioridad==='alta');
    if(!autoPool.length) autoPool=S.tareas.filter(t=>t.autoAsignar).slice(0,2);
  } else if(modo==='extra'){
    const base=S.tareas.filter(t=>t.autoAsignar);
    const extras=S.tareas.filter(t=>!t.autoAsignar&&t.prioridad==='alta');
    autoPool=[...base,...extras];
  } else {
    autoPool=S.tareas.filter(t=>t.autoAsignar);
  }

  // ── Construir preview ──
  const plan = diasLab.map(f=>{
    const yaExiste = !!(S.tp[f]?.[emp]?.length);
    const sug      = _tmplSugerida(f);
    const tieneAuto= autoPool.length>0;
    return {fecha:f, skip:yaExiste, sug, tieneAuto,
            totalTmpl: sug?.tareas?.length||0,
            totalAuto: autoPool.length};
  });

  const aDias  = plan.filter(p=>!p.skip).length;
  const sSaltan= plan.filter(p=>p.skip).length;

  // ── Modal preview ──
  let rowsH='';
  plan.forEach(p=>{
    const lbl=`${diaSemana(p.fecha)} ${fd(p.fecha)}`;
    if(p.skip){
      rowsH+=`<div class="plan-day-row skip">
        <div class="plan-day-lbl">${lbl}</div>
        <div class="plan-day-sub"><span class="plan-day-chip skip-lbl">✓ Ya tiene tareas — se omitirá</span></div>
      </div>`;
    } else if(!p.sug && !p.tieneAuto){
      rowsH+=`<div class="plan-day-row empty">
        <div class="plan-day-lbl">${lbl}</div>
        <div class="plan-day-sub" style="color:var(--g400)">Sin plantilla ni tareas auto configuradas</div>
      </div>`;
    } else {
      const chips=[];
      if(p.sug) chips.push(`<span class="plan-day-chip tmpl">📐 ${p.sug.nombre}</span>`);
      if(p.tieneAuto) chips.push(`<span class="plan-day-chip auto">⚡ ${p.totalAuto} tarea${p.totalAuto!==1?'s':''} auto</span>`);
      rowsH+=`<div class="plan-day-row apply">
        <div class="plan-day-lbl">${lbl}</div>
        <div class="plan-day-sub">${chips.join('')}</div>
      </div>`;
    }
  });

  const resumen= aDias>0
    ? `Se planificarán <strong>${aDias} día${aDias!==1?'s':''}</strong>${sSaltan>0?` · ${sSaltan} omitido${sSaltan!==1?'s':''} (ya tienen tareas)`:''}`
    : `Todos los días ya tienen tareas — nada que planificar`;

  const overlay=document.createElement('div');
  overlay.className='tmpl-modal-overlay';
  overlay.id='plan-modal-overlay';
  overlay.innerHTML=`
    <div class="plan-modal">
      <div class="plan-modal-title">
        <span class="plan-modal-ttl">📅 Vista previa — Semana de ${emp}</span>
        <button class="tmpl-modal-close" onclick="cerrarModal()">✕</button>
      </div>
      <div style="font-size:.74rem;color:var(--g500);margin-bottom:.85rem">${resumen}</div>
      ${rowsH}
      <div class="plan-footer">
        <button class="plan-footer-btn cancel" onclick="cerrarModal()">Cancelar</button>
        ${aDias>0?`<button class="plan-footer-btn apply" onclick="_aplicarPlanSemana()">Aplicar semana</button>`:''}
      </div>
    </div>`;
  overlay.addEventListener('click',e=>{if(e.target===overlay)cerrarModal();});
  // Guardar plan en closure via data attr
  overlay.dataset.plan=JSON.stringify(plan);
  document.body.appendChild(overlay);
}

/* Aplica el plan construido en planificarSemana */
function _aplicarPlanSemana(){
  const overlay=document.getElementById('plan-modal-overlay');
  if(!overlay) return;
  const plan=JSON.parse(overlay.dataset.plan||'[]');
  const emp=_tarColab;

  const rend=rendimientoReciente(emp);
  const modo=modoAutoAsignar(rend);
  let autoPool;
  if(modo==='alivio'){
    autoPool=S.tareas.filter(t=>t.autoAsignar&&t.prioridad==='alta');
    if(!autoPool.length) autoPool=S.tareas.filter(t=>t.autoAsignar).slice(0,2);
  } else if(modo==='extra'){
    const base=S.tareas.filter(t=>t.autoAsignar);
    const extras=S.tareas.filter(t=>!t.autoAsignar&&t.prioridad==='alta');
    autoPool=[...base,...extras];
  } else {
    autoPool=S.tareas.filter(t=>t.autoAsignar);
  }

  let diasPlanificados=0;
  plan.filter(p=>!p.skip).forEach(p=>{
    const f=p.fecha;
    if(!S.tp[f]) S.tp[f]={};
    if(!S.tp[f][emp]) S.tp[f][emp]=[];
    const existing=new Set(S.tp[f][emp].map(t=>t.desc.toLowerCase().trim()));

    // 1. Aplicar plantilla sugerida
    if(p.sug){
      (p.sug.tareas||[]).forEach(t=>{
        const txt=(t.texto||t.desc||'').trim();
        if(!txt||existing.has(txt.toLowerCase())) return;
        const nt={id:S.nid++,desc:txt};
        if(t.hora) nt.hora=t.hora;
        if(t.urgente) nt.urgente=true;
        S.tp[f][emp].push(nt);
        existing.add(txt.toLowerCase());
      });
    }
    // 2. Agregar tareas auto-asignar
    autoPool.forEach(t=>{
      if(existing.has(t.desc.toLowerCase().trim())) return;
      S.tp[f][emp].push({id:S.nid++,desc:t.desc});
      existing.add(t.desc.toLowerCase().trim());
    });

    if(S.tp[f][emp].length) diasPlanificados++;
  });

  sv();
  cerrarModal();
  _renderAgendaStrip();
  _renderAgendaTasks();
  toast(`📅 Semana planificada — ${diasPlanificados} día${diasPlanificados!==1?'s':''}`, 3000);
}

/* Aplica una plantilla guardada a la fecha/empleado dado — soporta texto y desc */
function _tmplAplicar(fecha, idx){
  const emp=_tarColab;
  const p=(S.plantillas||[])[idx];
  if(!p) return;
  if(!S.tp[fecha]) S.tp[fecha]={};
  if(!S.tp[fecha][emp]) S.tp[fecha][emp]=[];
  const existing=new Set(S.tp[fecha][emp].map(t=>t.desc.toLowerCase().trim()));
  const nuevas=(p.tareas||[])
    .map(t=>({_txt:(t.texto||t.desc||'').trim(),hora:t.hora,urgente:t.urgente}))
    .filter(t=>t._txt && !existing.has(t._txt.toLowerCase()))
    .map(t=>{
      const nt={id:S.nid++,desc:t._txt};
      if(t.hora) nt.hora=t.hora;
      if(t.urgente) nt.urgente=true;
      return nt;
    });
  if(!nuevas.length){
    toast('✓ Las tareas de esta plantilla ya están asignadas');
    cerrarModal();
    return;
  }
  S.tp[fecha][emp].push(...nuevas);
  sv();
  toast(`📐 "${p.nombre}" — ${nuevas.length} tarea${nuevas.length>1?'s':''} aplicada${nuevas.length>1?'s':''}`);
  _renderAgendaStrip();
  _renderAgendaTasks();
}

function tarToggleInst(id){
  const box=document.getElementById('dpi-'+id);
  const btn=document.getElementById('dpib-'+id);
  if(!box) return;
  const vis=box.style.display!=='none';
  box.style.display=vis?'none':'block';
  if(btn) btn.textContent=vis?'ℹ️ ¿Cómo hacerlo?':'ℹ️ Ocultar instrucción';
}


// ── 7d. Reportes semana / mes ──
// ── renderMarlonSemana/renderMesIndividual conservadas como utilidades internas ──
function renderMarlonSemana(){calcSemanaUI('Marlon','m-nums','m-prog','m-hist',true);}
function renderMesIndividual(emp,numsId,progId,histId){calcMesUI(emp,numsId,progId,histId,true);}

/// ── Tab EQUIPO: selector visual + perfil ──
const EQ_COLORES={Marlon:'#b8943a',Ingrid:'#2a7a4a',Isabella:'#2060a0'};
let _equipoEmp='Marlon';

function _empQuickStat(emp){
  const fds=esFDS(emp);
  const dias=fds
    ? diasDelMes(mes()).filter(d=>S.turnos[d]?.[emp]===true)
    : last7().filter(d=>esLaborable(emp,d));
  let c=0,t=0;
  dias.forEach(d=>{const ef=calcEficacia(emp,d);c+=ef.comp;t+=ef.total;});
  return{pct:t?Math.round(c/t*100):0,total:t};
}

function _empCardHtml(emp,isOn){
  const color=EQ_COLORES[emp];
  const fds=esFDS(emp);
  const{pct,total}=_empQuickStat(emp);
  const sema=nivelSema(pct);
  const border=isOn?`border-color:${color};background:${color}0d`:'' ;
  const statHtml=total>0
    ?`<span class="badge b-${sema}" style="font-size:.64rem"><span class="bdot"></span>${pct}%</span>`
    :`<span style="font-size:.66rem;color:var(--g400)">Sin datos</span>`;
  return `<div class="eq-emp-card${isOn?' on':''}" style="${border}" onclick="equipoSel('${emp}')">
    <div class="eq-emp-av" style="background:${color}20;color:${color}">${ini(emp)}</div>
    <div class="eq-emp-name">${emp}</div>
    <div class="eq-emp-role">${fds?'Fin de semana':'Lun – Vie'}</div>
    ${statHtml}
  </div>`;
}

function _empProfileHtml(emp,pct,comp,activos,periodo){
  const color=EQ_COLORES[emp];
  const pctCol=pct>=75?'var(--green)':pct>=50?'var(--yellow)':'var(--red)';
  return `<div class="eq-profile-card" style="border-left:3px solid ${color}">
    <div class="eq-prof-top">
      <div class="eq-prof-av" style="background:${color}20;color:${color}">${ini(emp)}</div>
      <div style="flex:1;min-width:0">
        <div style="font-family:var(--ff);font-size:1.15rem;font-weight:700;color:var(--g800)">${emp}</div>
        <div class="txt-muted" style="font-size:.73rem;margin-top:1px">${periodo}</div>
      </div>
      <div style="text-align:right;flex-shrink:0">
        <div class="eq-prof-pct" style="color:${pctCol}">${pct}%</div>
        <div class="eq-prof-pct-lbl">Eficacia</div>
      </div>
    </div>
    <div style="height:7px;background:var(--g100);border-radius:6px;overflow:hidden">
      <div style="height:100%;width:${Math.max(pct,0)}%;background:${color};border-radius:6px;transition:width .55s cubic-bezier(.4,0,.2,1)"></div>
    </div>
    <div class="eq-prof-stats">
      <div class="eq-prof-stat">
        <div class="eq-prof-stat-n">${comp}</div>
        <div class="eq-prof-stat-l">Completadas</div>
      </div>
      <div class="eq-prof-stat">
        <div class="eq-prof-stat-n">${activos}</div>
        <div class="eq-prof-stat-l">Días activos</div>
      </div>
    </div>
  </div>`;
}

function renderEquipo(emp){
  emp=emp||_equipoEmp;
  _equipoEmp=emp;
  const fds=esFDS(emp);

  // 1. Renderizar las 3 tarjetas de selección con stats actuales
  const cardsEl=document.getElementById('eq-cards-grid');
  if(cardsEl) cardsEl.innerHTML=TODOS_EMP.map(e=>_empCardHtml(e,e===emp)).join('');

  // 2. Calcular stats y construir historial
  let comp=0,total=0,activos=0,semas=[],h='',periodo;

  if(!fds){
    periodo=`Lun–Vie · ${fd(last7()[0])} al ${fd(last7()[6])}`;
    last7().forEach(d=>{
      if(!esLaborable(emp,d)){
        h+=`<div class="hist-item" style="opacity:.35;cursor:default;pointer-events:none">
          <div class="frow"><div><div class="hi-fecha">${diaSemana(d)} ${fd(d)}</div>
          <div class="hi-sub" style="font-style:italic">No laborable</div></div></div></div>`;
        return;
      }
      const ef=calcEficacia(emp,d);
      if(Object.keys(getEstados(d,emp)).length)activos++;
      comp+=ef.comp;total+=ef.total;
      const cal=getCalif(d,emp);
      if(cal?.sema)semas.push(cal.sema);
      h+=histItemHtml(emp,d,true,emp.toLowerCase());
    });
  } else {
    const m=mes();
    periodo=`Fin de semana · ${fm(m)}`;
    const diasActivos=diasDelMes(m).filter(d=>S.turnos[d]?.[emp]===true);
    activos=diasActivos.length;
    if(diasActivos.length){
      diasActivos.forEach(d=>{
        const ef=calcEficacia(emp,d);
        comp+=ef.comp;total+=ef.total;
        const cal=getCalif(d,emp);
        if(cal?.sema)semas.push(cal.sema);
        h+=histItemMesHtml(emp,d,true,emp.toLowerCase());
      });
    } else {
      h='<div style="text-align:center;padding:1.5rem 0;color:var(--g400);font-size:.82rem">Aún no hay turnos registrados este mes.</div>';
    }
  }

  const pct=total?Math.round(comp/total*100):0;

  // 3. Tarjeta de perfil activo
  const profileEl=document.getElementById('eq-profile-card');
  if(profileEl) profileEl.innerHTML=_empProfileHtml(emp,pct,comp,activos,periodo);

  // 4. Sección de historial con header y badges de calificación
  const histEl=document.getElementById('eq-hist');
  if(histEl){
    const {g,y,r}={
      g:semas.filter(s=>s==='green').length,
      y:semas.filter(s=>s==='yellow').length,
      r:semas.filter(s=>s==='red').length
    };
    let badgesHtml='';
    if(g)badgesHtml+=`<span class="badge b-green"><span class="bdot"></span>${g}</span>`;
    if(y)badgesHtml+=`<span class="badge b-yellow"><span class="bdot"></span>${y}</span>`;
    if(r)badgesHtml+=`<span class="badge b-red"><span class="bdot"></span>${r}</span>`;
    histEl.innerHTML=h?`<div class="eq-hist-hd">
      <span class="eq-hist-lbl">Historial</span>
      <div style="display:flex;gap:5px">${badgesHtml}</div>
    </div>${h}`:'';
  }

  // 5. Próximas tareas
  renderProximas(emp,'eq-proximas');
}

function equipoSel(emp){
  _equipoEmp=emp;
  renderEquipo(emp);
}

function calcSemanaUI(emp,numsId,progId,histId,esCeo){
  const dias=last7();
  let comp=0,total=0,activos=0,semas=[],h='';
  dias.forEach(d=>{
    if(!esLaborable(emp,d)){
      if(esCeo){
        h+=`<div class="hist-item" style="opacity:.4;cursor:default;pointer-events:none">
          <div class="frow">
            <div><div class="hi-fecha">${diaSemana(d)} ${fd(d)}</div><div class="hi-sub" style="font-style:italic">No laborable</div></div>
            <span class="badge b-gray"><span class="bdot"></span>Libre</span>
          </div>
        </div>`;
      }
      return;
    }
    const ef=calcEficacia(emp,d);
    const est=getEstados(d,emp);
    if(Object.keys(est).length)activos++;
    comp+=ef.comp;total+=ef.total;
    const cal=getCalif(d,emp);
    if(cal?.sema)semas.push(cal.sema);
    h+=histItemHtml(emp,d,esCeo,emp.toLowerCase());
  });
  const pct=total?Math.round(comp/total*100):0;
  document.getElementById(numsId).innerHTML=numsRowHtml(comp,'Completadas',pct+'%','Eficacia',activos,'Días activos');
  document.getElementById(progId).style.width=pct+'%';
  document.getElementById(histId).innerHTML=califsBadgesHtml(semas)+h;
}

function calcMesUI(emp,numsId,progId,histId,esCeo){
  const m=mes();
  const diasM=diasDelMes(m);
  const activos=diasM.filter(d=>S.turnos[d]?.[emp]===true);
  let comp=0,total=0,semas=[],h='';
  activos.forEach(d=>{
    const ef=calcEficacia(emp,d);
    comp+=ef.comp;total+=ef.total;
    const cal=getCalif(d,emp);
    if(cal?.sema)semas.push(cal.sema);
    h+=histItemMesHtml(emp,d,esCeo,emp.toLowerCase());
  });
  const pct=total?Math.round(comp/total*100):0;
  document.getElementById(numsId).innerHTML=numsRowHtml(comp,'Completadas',activos.length?pct+'%':'—','Eficacia',activos.length,'Días trabajados');
  document.getElementById(progId).style.width=pct+'%';
  document.getElementById(histId).innerHTML=activos.length
    ?califsBadgesHtml(semas)+h
    :'<div class="card" style="text-align:center;padding:1.5rem"><div class="txt-muted">Aún no ha trabajado este mes</div></div>';
}


// ── 7e. Análisis EDA ──
let chartTendM=null,chartTendFDS=null,chartCats=null;
let _edaHash=null;
let _edaPeriodo='semana'; // 'semana' | 'mes' | '30d'
let _edaEmpSel='todos';   // 'todos' | emp name
function _getEdaHash(){
  const _periodKey=_edaPeriodo||'semana';
  // (period is injected below)
  let repHash=0;
  Object.keys(S.rep).forEach(d=>{Object.keys(S.rep[d]||{}).forEach(emp=>{const r=(S.rep[d]||{})[emp];if(r&&r.estados)repHash+=Object.values(r.estados).filter(v=>v).length;});});
  const _tarDone=(S.tarCEO||[]).filter(t=>t.hecho).length;
  const _retDone=(S.retos||[]).filter(r=>r.hecho).length;
  return hoy()+'_'+repHash+'_'+Object.keys(S.turnos).length+'_'+mes()+'_'+(S.solicitudes?.length||0)+'_'+(S.tarCEO?.length||0)+'_'+_tarDone+'_'+(S.retos?.length||0)+'_'+_retDone+'_'+(_edaPeriodo||'semana');
}

function _lineOpts(showLegend){
  const fontFam="'DM Sans',sans-serif";
  return{responsive:true,maintainAspectRatio:false,
    plugins:{
      legend:{display:showLegend,labels:{color:'#5c5549',font:{size:11,family:fontFam},boxWidth:12,padding:12}},
      tooltip:{callbacks:{label:c=>`${c.parsed.y}%`},backgroundColor:'#0c0c0b',titleColor:'#eddeb0',bodyColor:'#faf9f6',padding:10,cornerRadius:8}
    },
    scales:{
      y:{min:0,max:100,ticks:{callback:v=>v+'%',color:'#9a9186',font:{size:11,family:fontFam}},grid:{color:'rgba(154,145,134,.15)'},border:{display:false}},
      x:{ticks:{color:'#5c5549',font:{size:11,family:fontFam}},grid:{display:false},border:{display:false}}
    }};
}

function _getPctDia(emp,d){
  const{pct,total}=calcEficacia(emp,d);
  return total?pct:null;
}

function _refLine75(len){
  return{label:'Objetivo 75%',data:Array(len).fill(75),borderColor:'rgba(42,122,74,.4)',backgroundColor:'transparent',borderWidth:1.5,borderDash:[5,4],pointRadius:0,fill:false,order:0,tension:0};
}

function _calcRacha(emp){
  let racha=0;
  const diasOrd=emp==='Marlon'
    ? last7().filter(d=>esLaborable(emp,d)).slice().reverse()
    : diasDelMes(mes()).filter(d=>S.turnos[d]?.[emp]===true).slice().sort().reverse();
  for(const d of diasOrd){if(Object.keys(getEstados(d,emp)).length>0)racha++;else break;}
  return racha;
}

function _renderKPIs(){
  const row=document.getElementById('eda-kpi-row');
  if(!row)return;

  // ── Eficiencia global actual ──
  let cA=0,tA=0,cP=0,tP=0;
  TODOS_EMP.forEach(emp=>{
    _getEdaDias(emp).forEach(d=>{const ef=calcEficacia(emp,d);cA+=ef.comp;tA+=ef.total;});
    _getEdaDiasPrev(emp).forEach(d=>{const ef=calcEficacia(emp,d);cP+=ef.comp;tP+=ef.total;});
  });
  const efGlobal=tA?Math.round(cA/tA*100):0;
  const efPrev=tP?Math.round(cP/tP*100):0;

  // ── Líder del período ──
  const ranks=TODOS_EMP.map(emp=>{
    const v=_avgEficacia(emp,_getEdaDias(emp));
    return{emp,pct:v??0};
  }).sort((a,b)=>b.pct-a.pct);
  const lider=ranks[0];
  const liderPrev=TODOS_EMP.map(emp=>{
    const v=_avgEficacia(emp,_getEdaDiasPrev(emp));
    return{emp,pct:v??0};
  }).sort((a,b)=>b.pct-a.pct)[0];

  // ── Completadas hoy ──
  let complHoy=0;
  TODOS_EMP.forEach(emp=>{if(!esLaborable(emp,hoy()))return;complHoy+=calcEficacia(emp,hoy()).comp;});
  let complAyer=0;
  const ayerStr=(()=>{const d=new Date(hoy()+'T12:00:00');d.setDate(d.getDate()-1);return d.toISOString().split('T')[0];})();
  TODOS_EMP.forEach(emp=>{if(!esLaborable(emp,ayerStr))return;complAyer+=calcEficacia(emp,ayerStr).comp;});

  // ── Días al 100% ──
  const dias100=_getEdaDias('Marlon').filter(d=>{const ef=calcEficacia('Marlon',d);return ef.total>0&&ef.pct===100;}).length;
  const dias100Prev=_getEdaDiasPrev('Marlon').filter(d=>{const ef=calcEficacia('Marlon',d);return ef.total>0&&ef.pct===100;}).length;

  // ── Helper de flecha + delta ──
  function _trend(curr,prev,isCount){
    if(prev===null||prev===undefined||prev===0&&curr===0) return '';
    const delta=curr-prev;
    if(Math.abs(delta)<(isCount?1:2)) return '<span class="eda-trend eda-trend-flat">→ igual</span>';
    const up=delta>0;
    const sign=up?'+':'';
    const cls=up?'eda-trend-up':'eda-trend-dn';
    const arrow=up?'↑':'↓';
    return `<span class="eda-trend ${cls}">${arrow} ${sign}${delta}${isCount?'':' pp'}</span>`;
  }

  const efCol=efGlobal>=75?'#15803d':efGlobal>=50?'#b45309':'#b91c1c';
  const efBg =efGlobal>=75?'#dcfce7':efGlobal>=50?'#fef9c3':'#fee2e2';
  const periodoLbl={semana:'Esta semana',mes:'Este mes','30d':'Últimos 30d'}[_edaPeriodo]||'';

  const icoEf=`<svg viewBox="0 0 24 24" fill="none" stroke="${efCol}" stroke-width="2.2" stroke-linecap="round"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>`;
  const icoLider=`<svg viewBox="0 0 24 24" fill="none" stroke="#b8943a" stroke-width="2.2" stroke-linecap="round"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>`;
  const icoHoy=`<svg viewBox="0 0 24 24" fill="none" stroke="#2563eb" stroke-width="2.2" stroke-linecap="round"><polyline points="9 11 12 14 22 4"/><path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"/></svg>`;
  const ico100=`<svg viewBox="0 0 24 24" fill="none" stroke="#7c3aed" stroke-width="2.2" stroke-linecap="round"><path d="M3 3v18h18"/><polyline points="18.5 8 13 13.5 8.5 9 3 15"/></svg>`;

  row.innerHTML=`
    <div class="eda-kpi" style="--kpi-accent:${efCol};--kpi-ico-bg:${efBg}">
      <div class="eda-kpi-ico">${icoEf}</div>
      <div class="eda-kpi-row-inner">
        <div class="eda-kpi-val" style="color:${efCol}">${efGlobal}%</div>
        ${_trend(efGlobal,efPrev,false)}
      </div>
      <div class="eda-kpi-lbl">Eficiencia del equipo</div>
      <div class="eda-kpi-sub">${periodoLbl}</div>
    </div>
    <div class="eda-kpi" style="--kpi-accent:#b8943a;--kpi-ico-bg:#fffbeb">
      <div class="eda-kpi-ico">${icoLider}</div>
      <div class="eda-kpi-row-inner">
        <div class="eda-kpi-name eda-kpi-val" style="color:#92701a">${lider.emp}</div>
        ${liderPrev&&liderPrev.emp===lider.emp?'<span class="eda-trend eda-trend-up">↑ líder</span>':''}
      </div>
      <div class="eda-kpi-lbl">Líder del período</div>
      <div class="eda-kpi-sub">${lider.pct}% eficacia</div>
    </div>
    <div class="eda-kpi" style="--kpi-accent:#2563eb;--kpi-ico-bg:#eff6ff">
      <div class="eda-kpi-ico">${icoHoy}</div>
      <div class="eda-kpi-row-inner">
        <div class="eda-kpi-val">${complHoy}</div>
        ${_trend(complHoy,complAyer,true)}
      </div>
      <div class="eda-kpi-lbl">Completadas hoy</div>
      <div class="eda-kpi-sub">vs ayer · todo el equipo</div>
    </div>
    <div class="eda-kpi" style="--kpi-accent:#7c3aed;--kpi-ico-bg:#f5f3ff">
      <div class="eda-kpi-ico">${ico100}</div>
      <div class="eda-kpi-row-inner">
        <div class="eda-kpi-val">${dias100}</div>
        ${_trend(dias100,dias100Prev,true)}
      </div>
      <div class="eda-kpi-lbl">Días al 100%</div>
      <div class="eda-kpi-sub">Marlon · ${periodoLbl.toLowerCase()}</div>
    </div>`;
}

/* ────────────────────────────────────────────────────
   EDA — Helpers de período y cambio de vista
──────────────────────────────────────────────────── */
function edaCambiarPeriodo(p){
  _edaPeriodo=p;
  document.querySelectorAll('.eda-periodo-btn').forEach(b=>b.classList.toggle('on',b.dataset.p===p));
  _edaHash=''; // forzar re-render completo
  renderAnalisis();
}

function edaFiltrarEmp(emp){
  _edaEmpSel=emp;
  document.querySelectorAll('.eda-emp-pill').forEach(b=>b.classList.toggle('on',b.dataset.e===emp));
  _renderTendenciaEquipo();
}

/* Días trabajados por empleado en el período actual */
function _getEdaDias(emp){
  const hoyS=hoy();
  const isFDS=(emp!=='Marlon');
  const esTrabajado=d=>isFDS?S.turnos[d]?.[emp]===true:esLaborable(emp,d);
  if(_edaPeriodo==='semana') return last7().filter(d=>esTrabajado(d));
  if(_edaPeriodo==='mes') return diasDelMes(mes()).filter(d=>esTrabajado(d));
  // '30d'
  const dias=[];
  for(let i=29;i>=0;i--){
    const d=new Date(hoyS+'T12:00:00');d.setDate(d.getDate()-i);
    dias.push(d.toISOString().split('T')[0]);
  }
  return dias.filter(d=>esTrabajado(d));
}

/* Período previo (para cálculo de tendencia) */
function _getEdaDiasPrev(emp){
  const hoyS=hoy();
  const isFDS=(emp!=='Marlon');
  const esTrabajado=d=>isFDS?S.turnos[d]?.[emp]===true:esLaborable(emp,d);
  if(_edaPeriodo==='semana'){
    const dias=[];
    for(let i=7;i<14;i++){
      const d=new Date(hoyS+'T12:00:00');d.setDate(d.getDate()-i);
      dias.push(d.toISOString().split('T')[0]);
    }
    return dias.filter(d=>esTrabajado(d));
  }
  if(_edaPeriodo==='mes'){
    const [y,m]=mes().split('-').map(Number);
    const prevMes=m===1?`${y-1}-12`:`${y}-${String(m-1).padStart(2,'0')}`;
    return diasDelMes(prevMes).filter(d=>esTrabajado(d));
  }
  // '30d' → prev 30d
  const dias=[];
  for(let i=30;i<60;i++){
    const d=new Date(hoyS+'T12:00:00');d.setDate(d.getDate()-i);
    dias.push(d.toISOString().split('T')[0]);
  }
  return dias.filter(d=>esTrabajado(d));
}

/* Eficacia promedio de un empleado en un conjunto de días */
function _avgEficacia(emp, dias){
  let c=0,t=0;
  dias.forEach(d=>{const ef=calcEficacia(emp,d);c+=ef.comp;t+=ef.total;});
  return t?Math.round(c/t*100):null;
}

/* Label del período actual */
function _edaPeriodoLabel(){
  if(_edaPeriodo==='semana') return `${fd(last7()[0])} — ${fd(last7()[6])}`;
  if(_edaPeriodo==='mes') return fm(mes());
  return 'Últimos 30 días';
}

function renderAnalisis(){
  const hash=_getEdaHash();
  if(hash===_edaHash)return;
  _edaHash=hash;
  _renderKPIsRetos();
  _renderKPIsOperativos();
  const subEl=document.getElementById('eda-sub');
  if(subEl) subEl.textContent=_edaPeriodoLabel()+' · '+fm(mes());
  _renderKPIs();
  _renderScorecards();
  _renderTendenciaEquipo();
  _renderTendenciaFDS();
  _renderCategorias();
  _renderConsistencia();
  _renderResumen();
}

function _renderTendenciaMarlon(){ _renderTendenciaEquipo(); }

function _renderTendenciaEquipo(){
  const ctx=document.getElementById('chart-tendencia-m');
  if(chartTendM){chartTendM.destroy();chartTendM=null;}
  if(!ctx)return;

  const EMP_COLORS={Marlon:'#b8943a',Ingrid:'#2a7a4a',Isabella:'#2060a0'};
  const emps=_edaEmpSel==='todos'?TODOS_EMP:[_edaEmpSel];

  // Construir eje X unificado con todos los días de todos los empleados
  const allDays=new Set();
  emps.forEach(emp=>_getEdaDias(emp).forEach(d=>allDays.add(d)));
  const labels=[...allDays].sort();
  const labelsFmt=labels.map(d=>diaSemana(d).slice(0,3)+' '+parseInt(d.slice(8)));

  const datasets=emps.map(emp=>{
    const color=EMP_COLORS[emp]||'#888';
    const data=labels.map(d=>{
      const diasEmp=_getEdaDias(emp);
      if(!diasEmp.includes(d)) return null;
      const{pct,total}=calcEficacia(emp,d);
      return total?pct:0;
    });
    return{
      label:emp,data,
      borderColor:color,
      backgroundColor:color+'18',
      borderWidth:2.2,
      pointBackgroundColor:color,
      pointRadius:data.map(v=>v!==null?4:0),
      pointHoverRadius:6,
      tension:.3,
      fill:emps.length===1,
      spanGaps:false,
      order:1
    };
  });

  // Pills de empleado
  const pillsEl=document.getElementById('eda-emp-pills');
  if(pillsEl){
    const empOpts=['todos',...TODOS_EMP];
    pillsEl.innerHTML=empOpts.map(e=>{
      const lbl=e==='todos'?'Todos':ini(e);
      return `<button class="eda-emp-pill${_edaEmpSel===e?' on':''}" data-e="${e}" onclick="edaFiltrarEmp('${e}')" title="${e}">${lbl}</button>`;
    }).join('');
  }

  // Avg del primer empleado
  const subEl=document.getElementById('eda-comp-sub');
  if(subEl){
    const avgStrs=emps.map(emp=>{
      const v=_avgEficacia(emp,_getEdaDias(emp));
      return v!==null?`${emp} ${v}%`:'';
    }).filter(Boolean);
    subEl.textContent=avgStrs.join(' · ')||'Sin datos suficientes';
  }

  datasets.push(_refLine75(labels.length));
  chartTendM=new Chart(ctx,{
    type:'line',
    data:{labels:labelsFmt,datasets},
    options:{
      ..._lineOpts(false),
      plugins:{
        ..._lineOpts(false).plugins,
        legend:{
          display:emps.length>1,
          position:'top',
          labels:{color:'#5c5549',font:{size:11,family:"'DM Sans',sans-serif"},
            boxWidth:12,padding:12}
        }
      }
    }
  });
}

function _renderTendenciaFDS(){
  const m=mes();
  const diasMes=diasDelMes(m);
  if(chartTendFDS){chartTendFDS.destroy();chartTendFDS=null;}

  const colores={Ingrid:'#2a7a4a',Isabella:'#2060a0'};
  const empleados=[
    {emp:'Ingrid',dias:diasMes.filter(d=>S.turnos[d]?.['Ingrid']===true)},
    {emp:'Isabella',dias:diasMes.filter(d=>S.turnos[d]?.['Isabella']===true)}
  ];

  const container=document.getElementById('fds-turnos-list');
  const badgesEl=document.getElementById('eda-fds-badges');
  const subEl=document.getElementById('eda-fds-sub');
  if(!container)return;

  const totalDias=empleados.reduce((a,e)=>a+e.dias.length,0);
  if(!totalDias){
    if(badgesEl)badgesEl.innerHTML='';
    if(subEl)subEl.textContent='Sin turnos registrados este mes';
    container.innerHTML=`<div style="text-align:center;padding:1.2rem 0;color:var(--g400);font-size:.82rem">Aún no hay turnos de fin de semana configurados para este mes.<br>Ve a Configuración de turnos para asignarlos.</div>`;
    return;
  }

  // Subtítulo con mes actual
  if(subEl)subEl.textContent=fm(m);

  // Badges de promedio por empleado en el header
  let badgesHtml='';
  empleados.forEach(({emp,dias})=>{
    if(!dias.length)return;
    let c=0,t=0;
    dias.forEach(d=>{const ef=calcEficacia(emp,d);c+=ef.comp;t+=ef.total;});
    const avg=t?Math.round(c/t*100):0;
    const sema=nivelSema(avg);
    badgesHtml+=`<div style="text-align:center">
      <div style="font-family:var(--ff);font-size:1.05rem;font-weight:700;color:${colores[emp]}">${avg}%</div>
      <div style="font-size:.6rem;color:var(--g400);letter-spacing:.07em;text-transform:uppercase">${emp}</div>
    </div>`;
  });
  if(badgesEl)badgesEl.innerHTML=badgesHtml;

  // Construir lista de turnos por empleado
  let h='';
  empleados.forEach(({emp,dias},idx)=>{
    if(!dias.length)return;
    const color=colores[emp];
    const isLast=idx===empleados.length-1||empleados.slice(idx+1).every(e=>!e.dias.length);

    // Filas de días
    const filas=dias.map(d=>{
      const{pct,comp,total}=calcEficacia(emp,d);
      const sema=nivelSema(pct);
      const hayDatos=total>0;
      const barW=hayDatos?Math.max(pct,2):0;
      const diaNom=diaSemana(d).slice(0,3);
      const diaN=parseInt(d.slice(8));
      return `<div style="display:flex;align-items:center;gap:.65rem;padding:.3rem 0;border-bottom:1px solid var(--g100)">
        <div style="width:58px;flex-shrink:0;font-size:.74rem;color:var(--g600)">${diaNom} ${diaN}</div>
        <div style="flex:1;height:7px;background:var(--g100);border-radius:6px;overflow:hidden">
          <div style="height:100%;width:${barW}%;background:${color};border-radius:6px;transition:width .5s"></div>
        </div>
        ${hayDatos
          ? `<span class="badge b-${sema}" style="min-width:44px;justify-content:center;font-size:.66rem"><span class="bdot"></span>${pct}%</span>`
          : `<span class="badge b-gray" style="min-width:44px;justify-content:center;font-size:.66rem"><span class="bdot"></span>—</span>`
        }
      </div>`;
    }).join('');

    // Separador entre empleados
    const sep=!isLast?`<div style="height:1px;background:var(--g100);margin:.7rem 0"></div>`:'';

    h+=`<div>
      <div style="display:flex;align-items:center;gap:7px;margin-bottom:.4rem">
        <div style="width:24px;height:24px;border-radius:50%;background:${color}22;display:flex;align-items:center;justify-content:center;font-family:var(--ff);font-size:.75rem;font-weight:700;color:${color};flex-shrink:0">${ini(emp)}</div>
        <span style="font-size:.82rem;font-weight:600;color:var(--g800)">${emp}</span>
        <span class="txt-muted" style="font-size:.72rem">· ${dias.length} turno${dias.length!==1?'s':''}</span>
      </div>
      ${filas}
    </div>${sep}`;
  });
  container.innerHTML=h;
}

/* ════════════════════════════════════════════════
   SCORECARDS por empleado
════════════════════════════════════════════════ */
function _renderScorecards(){
  const wrap=document.getElementById('eda-scorecards');
  if(!wrap) return;
  const EMP_COLORS={Marlon:'#b8943a',Ingrid:'#2a7a4a',Isabella:'#2060a0'};

  // Calcular rankings primero
  const rankings=TODOS_EMP.map(emp=>{
    const dias=_getEdaDias(emp);
    return{emp,pct:_avgEficacia(emp,dias)??0};
  }).sort((a,b)=>b.pct-a.pct);
  const rankMap={};
  rankings.forEach((r,i)=>rankMap[r.emp]=i+1);

  let h='<div class="eda-scorecards-row">';
  TODOS_EMP.forEach(emp=>{
    const color=EMP_COLORS[emp]||'#888';
    const dias=_getEdaDias(emp);
    const diasPrev=_getEdaDiasPrev(emp);
    const pct=_avgEficacia(emp,dias);
    const pctPrev=_avgEficacia(emp,diasPrev);
    const delta=pct!==null&&pctPrev!==null?pct-pctPrev:null;
    const racha=_calcRacha(emp);
    const efHoy=calcEficacia(emp,hoy());
    const hayHoy=esLaborable(emp,hoy())||(S.turnos[hoy()]?.[emp]===true);
    const pctHoy=hayHoy&&efHoy.total>0?efHoy.pct:null;
    const rank=rankMap[emp]||3;

    // Estado del día con SVG dots
    let estadoHoy='';
    if(!hayHoy)          estadoHoy=`<span class="sc-estado libre">Libre hoy</span>`;
    else if(pctHoy===null) estadoHoy=`<span class="sc-estado sin-datos">Sin registro</span>`;
    else if(pctHoy>=75)  estadoHoy=`<span class="sc-estado bien"><span style="width:6px;height:6px;border-radius:50%;background:#15803d;display:inline-block"></span> En meta</span>`;
    else if(pctHoy>=40)  estadoHoy=`<span class="sc-estado medio"><span style="width:6px;height:6px;border-radius:50%;background:#d97706;display:inline-block"></span> En progreso</span>`;
    else                 estadoHoy=`<span class="sc-estado bajo"><span style="width:6px;height:6px;border-radius:50%;background:#dc2626;display:inline-block"></span> Necesita foco</span>`;

    // Trend badge
    let trendBadge='';
    if(delta!==null){
      if(delta>=5)       trendBadge=`<span class="sc-trend up">↑ +${delta}pp</span>`;
      else if(delta<=-5) trendBadge=`<span class="sc-trend dn">↓ ${delta}pp</span>`;
      else               trendBadge=`<span class="sc-trend flat">→ estable</span>`;
    }

    // Rank badge
    const rankLabel=rank===1?'🥇 #1':rank===2?'🥈 #2':'🥉 #3';
    const rankCls=rank===1?'gold':'';

    let totalComp=0;
    dias.forEach(d=>{ totalComp+=calcEficacia(emp,d).comp; });
    const pctDisp=pct!==null?pct+'%':'—';
    const pctColor=pct===null?'#94a3b8':pct>=75?'#15803d':pct>=40?'#b45309':'#b91c1c';

    h+=`<div class="eda-sc-card" style="--sc-color:${color}">
      <div class="eda-sc-rank ${rankCls}">${rankLabel}</div>
      <div class="eda-sc-top">
        <div class="eda-sc-av" style="background:${color}18;color:${color};border-color:${color}44">${ini(emp)}</div>
        <div class="eda-sc-info">
          <div class="eda-sc-name">${emp}</div>
          ${estadoHoy}
        </div>
      </div>
      <div class="eda-sc-pct-row">
        <div class="eda-sc-pct" style="color:${pctColor}">${pctDisp}</div>
        <div class="eda-sc-pct-lbl">eficacia</div>
        ${trendBadge}
      </div>
      <div class="eda-sc-bar-wrap">
        <div class="eda-sc-bar" style="width:${pct||0}%;background:linear-gradient(90deg,${color}99,${color})"></div>
      </div>
      <div class="eda-sc-footer" style="margin-top:.5rem">
        ${racha>=2?`<span class="eda-sc-stat">🔥 ${racha}d</span>`:''}
        <span class="eda-sc-stat">✓ ${totalComp}</span>
        <span class="eda-sc-stat">${dias.length}d</span>
      </div>
    </div>`;
  });
  h+='</div>';
  wrap.innerHTML=h;
}

/* ════════════════════════════════════════════════
   RESUMEN EJECUTIVO — Tarjetas de insight
════════════════════════════════════════════════ */
function _renderResumen(){
  const diasM=_getEdaDias('Marlon');
  const mid=Math.floor(diasM.length/2);
  function avgM(arr){let c=0,t=0;arr.forEach(d=>{const ef=calcEficacia('Marlon',d);c+=ef.comp;t+=ef.total;});return t?Math.round(c/t*100):0;}
  const tend=avgM(diasM.slice(mid))-avgM(diasM.slice(0,mid));

  const catVals=Object.keys(CATS).map(cat=>{
    let comp=0,total=0;
    _getEdaDias('Marlon').concat(_getEdaDias('Ingrid')).concat(_getEdaDias('Isabella')).forEach(d=>{
      TODOS_EMP.forEach(emp=>{
        if(!_getEdaDias(emp).includes(d)) return;
        const est=getEstados(d,emp);
        S.tareas.filter(t=>t.cat===cat).forEach(t=>{total++;if(est[t.id]==='green')comp++;});
      });
    });
    return{cat,pct:total?Math.round(comp/total*100):0,label:CATS[cat],total};
  }).filter(c=>c.total>0).sort((a,b)=>a.pct-b.pct);

  const eficacias=TODOS_EMP.map(emp=>{
    const dias=_getEdaDias(emp);
    const pct=_avgEficacia(emp,dias);
    return{emp,pct:pct??0,dias:dias.length,total:dias.reduce((a,d)=>{return a+calcEficacia(emp,d).total;},0)};
  });
  const totalDatos=eficacias.reduce((a,e)=>a+e.total,0);

  const INSIGHT_TIPOS={
    alerta:  {ico:'🚨',lbl:'Alerta',   bg:'#fef2f2',border:'#fca5a5',txtColor:'#991b1b'},
    logro:   {ico:'🏆',lbl:'Logro',    bg:'#f0fdf4',border:'#86efac',txtColor:'#166534'},
    oport:   {ico:'📈',lbl:'Oportunidad',bg:'#fef3c7',border:'#fcd34d',txtColor:'#92400e'},
    obs:     {ico:'💡',lbl:'Insight',  bg:'#eff6ff',border:'#93c5fd',txtColor:'#1d4ed8'},
  };

  const insights=[];

  if(totalDatos===0){
    insights.push({tipo:'obs',text:'Sin datos suficientes todavía. Pide a los colaboradores que registren sus avances del día.'});
  } else {
    if(tend>8)       insights.push({tipo:'logro',text:`Marlon mejora ${tend} puntos respecto al inicio del período — tendencia positiva.`});
    else if(tend<-8) insights.push({tipo:'alerta',text:`Marlon baja ${Math.abs(tend)} puntos en la segunda mitad del período — revisar causas.`});
    else if(diasM.length>=3) insights.push({tipo:'obs',text:`Marlon mantiene ritmo estable durante el período, sin variaciones significativas.`});

    const conDatos=eficacias.filter(e=>e.total>0);
    if(conDatos.length>1){
      const bajo=conDatos.sort((a,b)=>a.pct-b.pct)[0];
      if(bajo.pct<50)      insights.push({tipo:'alerta',text:`${bajo.emp} está por debajo del 50% — puede necesitar apoyo o seguimiento del líder.`});
      else if(bajo.pct<70) insights.push({tipo:'oport',text:`${bajo.emp} está al ${bajo.pct}% — hay margen de mejora para alcanzar la meta del equipo.`});
      const top=conDatos.sort((a,b)=>b.pct-a.pct)[0];
      if(top.pct>=90) insights.push({tipo:'logro',text:`${top.emp} lidera con ${top.pct}% de eficacia — referente del equipo este período.`});
    }

    if(catVals.length>0&&catVals[0].pct<65)
      insights.push({tipo:'alerta',text:`"${catVals[0].label}" es el área más débil con ${catVals[0].pct}% — requiere foco en la próxima planificación.`});
    if(catVals.length>0&&catVals[catVals.length-1].pct>=88)
      insights.push({tipo:'logro',text:`"${catVals[catVals.length-1].label}" destaca con ${catVals[catVals.length-1].pct}% — buen estándar para replicar.`});

    // Solicitudes sin resolver
    const solPend=(S.solicitudes||[]).filter(s=>s.estado!=='resuelta').length;
    if(solPend>=3) insights.push({tipo:'alerta',text:`Hay ${solPend} solicitudes del equipo sin resolver — esto puede afectar el estado de ánimo del equipo.`});

    // Retos
    const retosHoy=(S.retos||[]).filter(r=>r.fecha===hoy());
    if(retosHoy.length>0){
      const retoDone=retosHoy.filter(r=>r.hecho).length;
      const retoPct=Math.round(retoDone/retosHoy.length*100);
      if(retoPct>=75) insights.push({tipo:'logro',text:`El equipo completó el ${retoPct}% de los retos de hoy — excelente momentum.`});
    }
  }

  const wrap=document.getElementById('eda-resumen-wrap');
  if(!wrap) return;

  const IC_STYLES={
    alerta:{accent:'#ef4444',icoBg:'#fee2e2',ico:'🚨',lbl:'Alerta'},
    logro: {accent:'#16a34a',icoBg:'#dcfce7',ico:'🏆',lbl:'Logro'},
    oport: {accent:'#d97706',icoBg:'#fef9c3',ico:'📈',lbl:'Oportunidad'},
    obs:   {accent:'#2563eb',icoBg:'#dbeafe',ico:'💡',lbl:'Insight'},
  };

  let h=`<div class="eda-resumen-header">
    <div class="eda-sec-hd" style="border:none;padding:0;margin-bottom:0">
      <div class="eda-sec-hd-ico"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg></div>
      <span class="eda-sec-hd-txt">Análisis ejecutivo</span>
    </div>
    <span class="eda-sec-hd-count">${insights.length} insight${insights.length!==1?'s':''}</span>
  </div>
  <div class="eda-insights-grid" style="margin-top:.55rem">`;

  insights.slice(0,6).forEach(ins=>{
    const st=IC_STYLES[ins.tipo]||IC_STYLES.obs;
    h+=`<div class="eda-insight-card" style="--ic-accent:${st.accent};--ic-ico-bg:${st.icoBg};--ic-txt-color:${st.accent}">
      <div class="eda-ic-head">
        <div class="eda-ic-ico-wrap">${st.ico}</div>
        <span class="eda-ic-lbl">${st.lbl}</span>
      </div>
      <div class="eda-ic-txt">${ins.text}</div>
    </div>`;
  });
  h+='</div>';
  wrap.innerHTML=h;
}

function _renderCategorias(){
  const dias=last7();
  const cats=Object.keys(CATS);
  const vals=cats.map(cat=>{
    let comp=0,total=0;
    dias.forEach(d=>{
      TODOS_EMP.forEach(emp=>{
        if(!esLaborable(emp,d))return;
        const est=getEstados(d,emp);
        S.tareas.filter(t=>t.cat===cat).forEach(t=>{total++;if(est[t.id]==='green')comp++;});
      });
    });
    return total?Math.round(comp/total*100):0;
  });
  const coloresCat=['#b8943a','#b07a10','#2a7a4a','#2060a0'];
  if(chartCats){chartCats.destroy();chartCats=null;}
  const ctx=document.getElementById('chart-cats');
  if(!ctx)return;
  chartCats=new Chart(ctx,{type:'bar',data:{labels:cats.map(k=>CATS[k]),datasets:[{data:vals,backgroundColor:coloresCat.map(c=>c+'28'),borderColor:coloresCat,borderWidth:2,borderRadius:6,borderSkipped:false}]},
    options:{indexAxis:'y',responsive:true,maintainAspectRatio:false,
      plugins:{legend:{display:false},tooltip:{callbacks:{label:c=>`${c.parsed.x}%`},backgroundColor:'#0c0c0b',titleColor:'#eddeb0',bodyColor:'#faf9f6',padding:10,cornerRadius:8}},
      scales:{x:{min:0,max:100,ticks:{callback:v=>v+'%',color:'#9a9186',font:{size:11,family:"'DM Sans',sans-serif"}},grid:{color:'rgba(154,145,134,.15)'},border:{display:false}},y:{ticks:{color:'#5c5549',font:{size:11,family:"'DM Sans',sans-serif"}},grid:{display:false},border:{display:false}}}}});
}

function _renderConsistencia(){
  const colores={Marlon:'#b8943a',Ingrid:'#2a7a4a',Isabella:'#2060a0'};
  let h='';
  TODOS_EMP.forEach(emp=>{
    let diasLab,diasRep,etiqueta;
    if(emp==='Marlon'){
      diasLab=last7().filter(d=>esLaborable(emp,d)).length;
      diasRep=last7().filter(d=>esLaborable(emp,d)&&Object.keys(getEstados(d,emp)).length>0).length;
      etiqueta='esta semana';
    } else {
      diasLab=diasDelMes(mes()).filter(d=>S.turnos[d]?.[emp]===true).length;
      diasRep=diasDelMes(mes()).filter(d=>S.turnos[d]?.[emp]===true&&Object.keys(getEstados(d,emp)).length>0).length;
      etiqueta='este mes';
    }
    const pct=diasLab?Math.round(diasRep/diasLab*100):0;
    const sema=nivelSema(pct);
    const racha=_calcRacha(emp);
    const rachaBadge=racha>=2?`<span class="streak-badge">🔥 ${racha} días</span>`:'';
    h+=`<div style="margin-bottom:.85rem">
      <div class="frow" style="margin-bottom:.35rem">
        <div style="display:flex;align-items:center;gap:8px">
          <div style="width:32px;height:32px;border-radius:50%;background:${colores[emp]}22;display:flex;align-items:center;justify-content:center;font-family:var(--ff);font-size:.85rem;font-weight:700;color:${colores[emp]}">${ini(emp)}</div>
          <div><div style="font-weight:600;font-size:.88rem;color:var(--g800)">${emp}${rachaBadge}</div><div class="txt-muted">${diasRep} de ${diasLab} días reportados ${etiqueta}</div></div>
        </div>
        <span class="badge b-${sema}"><span class="bdot"></span>${pct}%</span>
      </div>
      <div class="prog-wrap"><div class="prog-bar" style="width:${pct}%;background:${colores[emp]}"></div></div>
    </div>`;
  });
  document.getElementById('eda-consistencia').innerHTML=h;
}

function _renderResumen_OLD_REPLACED(){
  const diasM=last7().filter(d=>esLaborable('Marlon',d));
  const mid=Math.floor(diasM.length/2);
  function avgM(arr){let c=0,t=0;arr.forEach(d=>{const ef=calcEficacia('Marlon',d);c+=ef.comp;t+=ef.total;});return t?Math.round(c/t*100):0;}
  const tend=avgM(diasM.slice(mid))-avgM(diasM.slice(0,mid));

  // Categorías ordenadas de menor a mayor
  const catVals=Object.keys(CATS).map(cat=>{
    let comp=0,total=0;
    last7().forEach(d=>{
      TODOS_EMP.forEach(emp=>{
        if(!esLaborable(emp,d))return;
        const est=getEstados(d,emp);
        S.tareas.filter(t=>t.cat===cat).forEach(t=>{total++;if(est[t.id]==='green')comp++;});
      });
    });
    return{cat,pct:total?Math.round(comp/total*100):0,label:CATS[cat],total};
  }).filter(c=>c.total>0).sort((a,b)=>a.pct-b.pct);

  // Empleados con datos esta semana/mes
  const eficacias=TODOS_EMP.map(emp=>{
    let dias;
    if(emp==='Marlon') dias=last7().filter(d=>esLaborable(emp,d));
    else dias=diasDelMes(mes()).filter(d=>S.turnos[d]?.[emp]===true);
    let comp=0,total=0;
    dias.forEach(d=>{const ef=calcEficacia(emp,d);comp+=ef.comp;total+=ef.total;});
    return{emp,pct:total?Math.round(comp/total*100):0,dias:dias.length,total};
  });

  // Total de datos disponibles
  const totalDatos=eficacias.reduce((a,e)=>a+e.total,0);

  const insights=[];

  if(totalDatos===0){
    insights.push({color:'#9a9186',text:'Sin datos suficientes todavía. Pide a los colaboradores que registren sus avances del día.'});
  } else {
    // Tendencia de Marlon
    if(tend>8) insights.push({color:'#2a7a4a',text:`Marlon mejora ${tend} puntos respecto al inicio de semana — tendencia positiva.`});
    else if(tend<-8) insights.push({color:'#b83232',text:`Marlon baja ${Math.abs(tend)} puntos esta semana — revisar causas de la caída.`});
    else if(diasM.length>=3) insights.push({color:'#9a9186',text:`Marlon mantiene ritmo estable esta semana, sin variaciones significativas.`});

    // Empleado que necesita atención
    const conDatos=eficacias.filter(e=>e.total>0);
    if(conDatos.length>1){
      const bajo=conDatos.sort((a,b)=>a.pct-b.pct)[0];
      if(bajo.pct<50) insights.push({color:'#b83232',text:`${bajo.emp} está por debajo del 50% — puede necesitar apoyo o seguimiento.`});
      else if(bajo.pct<70) insights.push({color:'#b07a10',text:`${bajo.emp} está al ${bajo.pct}% — hay margen de mejora para alcanzar el objetivo.`});
    }

    // Categoría más débil
    if(catVals.length>0&&catVals[0].pct<65){
      insights.push({color:'#b07a10',text:`"${catVals[0].label}" es el área más débil con ${catVals[0].pct}% — priorizar en la próxima reunión.`});
    }
    // Categoría más fuerte
    if(catVals.length>0&&catVals[catVals.length-1].pct>=85){
      insights.push({color:'#2060a0',text:`"${catVals[catVals.length-1].label}" destaca con ${catVals[catVals.length-1].pct}% — buen estándar para replicar.`});
    }

    // FDS participación este mes
    const fdsConTurnos=eficacias.filter(e=>FDS.includes(e.emp)&&e.dias>0);
    if(fdsConTurnos.length){
      const nombres=fdsConTurnos.map(e=>e.emp).join(' e ');
      const promFDS=Math.round(fdsConTurnos.reduce((a,e)=>a+e.pct,0)/fdsConTurnos.length);
      insights.push({color:'#2060a0',text:`${nombres} ${fdsConTurnos.length>1?'acumulan':'acumula'} ${fdsConTurnos.reduce((a,e)=>a+e.dias,0)} turnos este mes con ${promFDS}% de eficacia promedio.`});
    }
  }

  const el=document.getElementById('eda-resumen');
  if(el) el.innerHTML=insights.length
    ? insights.map(ins=>`<div class="eda-insight"><div class="eda-idot" style="background:${ins.color}"></div><span>${ins.text}</span></div>`).join('')
    : '<div class="eda-insight"><div class="eda-idot" style="background:#9a9186"></div><span>Sin datos suficientes para generar insights.</span></div>';
}


// ── 7f. Config tareas base — panel de dos pestañas ──
const CFG_CAT_META={
  ventas:{ico:'🛍️',nm:'Ventas y atención'},
  orden:{ico:'✨',nm:'Orden y limpieza'},
  redes:{ico:'📸',nm:'Redes y contenido'},
  inventario:{ico:'📦',nm:'Inventario'}
};

let _cfgOpenCats={ventas:true,orden:true,redes:true,inventario:true};
let _quickCat='ventas';

function renderConfig(){
  _renderCfgBase();
  _renderCfgProg();
}

/* ─────────────────────────────────────────────
   SECCIÓN 1 — TAREAS BASE
───────────────────────────────────────────── */
function _renderCfgBase(){
  const ORDEN=['ventas','orden','redes','inventario'];
  const grp={};
  S.tareas.forEach(t=>{if(!grp[t.cat])grp[t.cat]=[];grp[t.cat].push(t);});
  const total=S.tareas.length;

  let h=`<div class="cfg-sec">
    <div class="cfg-sec-hd">
      <span class="cfg-sec-ttl">📋 Tareas base</span>
      <span class="cfg-sec-cnt">${total} tarea${total!==1?'s':''}</span>
    </div>
    <!-- Pills de categoría -->
    <div class="cfg-cat-pills">`;
  ORDEN.forEach(cat=>{
    const m=CFG_CAT_META[cat]||{ico:'•',nm:cat};
    h+=`<button class="cfg-cat-pill${_quickCat===cat?' on':''}" onclick="cfgSetCat('${cat}')">${m.ico} ${m.nm}</button>`;
  });
  h+=`</div>
    <!-- Input rápido -->
    <div class="cfg-qadd">
      <input class="cfg-qadd-inp" id="qadd-inp" type="text"
        placeholder="Nueva tarea en ${(CFG_CAT_META[_quickCat]||{nm:_quickCat}).nm}…" maxlength="80"
        onkeydown="if(event.key==='Enter')quickAddTarea()">
      <button class="cfg-qadd-btn" onclick="quickAddTarea()">+ Agregar</button>
    </div>`;

  /* Categorías */
  ORDEN.forEach(cat=>{
    const lista=grp[cat]||[];
    const m=CFG_CAT_META[cat]||{ico:'•',nm:cat};
    const open=_cfgOpenCats[cat]!==false;
    h+=`<div class="cfg-cat-sec" id="cfgcat-${cat}">
      <button class="cfg-cat-toggle" onclick="cfgToggleCat('${cat}')">
        <span class="cfg-cat-ico">${m.ico}</span>
        <span class="cfg-cat-nm">${m.nm}</span>
        <span class="cfg-cat-cnt">${lista.length}</span>
        <span class="cfg-cat-arr" id="cfarr-${cat}" style="transform:${open?'rotate(180deg)':'rotate(0deg)'}"">▼</span>
      </button>`;
    if(open){
      h+=`<div>`;
      if(lista.length){
        lista.forEach(t=>{
          const hasInst=!!(t.inst&&t.inst.trim());
          const autoCls=t.autoAsignar?'on':'off';
          const autoLbl=t.autoAsignar?'⚡ Auto':'⚡ Off';
          h+=`<div class="cfg-task-row" id="cfgtask-${t.id}">
            <span class="cfg-task-txt">${t.desc}</span>
            <button class="cfg-auto-tog ${autoCls}" onclick="cfgToggleAuto(${t.id})"
              title="Marcar para auto-asignación">${autoLbl}</button>
            <button class="cfg-inst-btn" onclick="cfgToggleInst(${t.id})"
              id="cfgib-${t.id}">${hasInst?'ℹ️':'+ nota'}</button>
            <button class="cfg-task-del" onclick="elimBase(${t.id})" title="Eliminar">✕</button>
          </div>
          <div id="cfginst-${t.id}" style="display:${hasInst?'block':'none'}">
            <div class="cfg-inst-wrap">
              <textarea class="cfg-inst-inp" rows="2"
                placeholder="Instrucción para el colaborador (¿cómo hacerlo?)…" maxlength="200"
                onblur="guardarInstBase(${t.id},this.value)">${t.inst||''}</textarea>
            </div>
          </div>`;
        });
      } else {
        h+=`<div style="padding:.55rem 1rem 1rem 2.6rem;font-size:.8rem;color:var(--g400)">Sin tareas — escribe arriba y presiona Enter</div>`;
      }
      h+=`</div>`;
    }
    h+=`</div>`;
  });

  h+=`</div>`;
  const el=document.getElementById('cfg-panel-base');
  if(el) el.innerHTML=h;
}

function cfgSetCat(cat){
  _quickCat=cat;
  _renderCfgBase();
  setTimeout(()=>{ const inp=document.getElementById('qadd-inp'); if(inp)inp.focus(); },40);
}

function cfgToggleCat(cat){
  _cfgOpenCats[cat]=!(_cfgOpenCats[cat]!==false);
  _renderCfgBase();
}

function quickAddTarea(){
  const inp=document.getElementById('qadd-inp');
  if(!inp)return;
  const desc=inp.value.trim();
  if(!desc){inp.focus();return;}
  S.tareas.push({id:S.nid++,cat:_quickCat,desc});
  inp.value='';
  sv();_renderCfgBase();
  toast('✓ Tarea agregada');
  setTimeout(()=>document.getElementById('qadd-inp')?.focus(),50);
}

function elimBase(id){
  S.tareas=S.tareas.filter(t=>t.id!==id);
  sv();_renderCfgBase();toast('Tarea eliminada');
}

function cfgToggleInst(id){
  const wrap=document.getElementById('cfginst-'+id);
  if(!wrap)return;
  const vis=wrap.style.display!=='none';
  wrap.style.display=vis?'none':'block';
  const btn=document.getElementById('cfgib-'+id);
  if(btn)btn.textContent=vis?'+ nota':'ℹ️';
  if(!vis) wrap.querySelector('textarea')?.focus();
}

function toggleCfgInst(id){ cfgToggleInst(id); }

function guardarInstBase(id,val){
  const t=S.tareas.find(t=>t.id===id);
  if(!t)return;
  t.inst=val.trim();svDebounce();
  const btn=document.getElementById('cfgib-'+id);
  if(btn)btn.textContent=t.inst?'ℹ️':'+ nota';
}

function setQuickCat(cat){ cfgSetCat(cat); }

/* Activa/desactiva auto-asignación en una tarea base */
function cfgToggleAuto(id){
  const t=S.tareas.find(t=>t.id===id);
  if(!t) return;
  t.autoAsignar=!t.autoAsignar;
  sv(); _renderCfgBase();
  toast(t.autoAsignar?'⚡ Auto-asignar activado':'Auto-asignar desactivado');
}

/* Devuelve la primera plantilla cuyo dias_aplicables incluye el día de 'fecha' */
function _tmplSugerida(fecha){
  const NORM={'domingo':'domingo','lunes':'lunes','martes':'martes',
    'miércoles':'miercoles','jueves':'jueves','viernes':'viernes','sábado':'sabado'};
  const dia=NORM[diaSemana(fecha).toLowerCase()]||diaSemana(fecha).toLowerCase();
  return (S.plantillas||[]).find(p=>
    Array.isArray(p.dias_aplicables)&&
    p.dias_aplicables.map(d=>d.toLowerCase()).includes(dia)
  )||null;
}

/* ─────────────────────────────────────────────
   SECCIÓN 2 — PRÓXIMAS ASIGNACIONES
   Timeline por fecha (hoy + 14 días)
───────────────────────────────────────────── */
function _renderCfgProg(){
  const hoyStr=hoy();
  const fechasRel=Object.keys(S.tp||{}).filter(f=>f>=hoyStr).sort().slice(0,30);
  const emps=['Marlon','Ingrid','Isabella'];

  /* Construir timeline: [{fecha, emp, task}] */
  const items=[];
  fechasRel.forEach(f=>{
    emps.forEach(emp=>{
      const lista=(S.tp[f]?.[emp])||[];
      lista.forEach(t=>items.push({f,emp,t}));
    });
  });

  let h=`<div class="cfg-sec">
    <div class="cfg-sec-hd">
      <span class="cfg-sec-ttl">📅 Próximas asignaciones</span>
      <span class="cfg-sec-cnt">${items.length} tarea${items.length!==1?'s':''}</span>
    </div>`;

  if(!items.length){
    h+=`<div class="cfg-prox-empty">Sin tareas programadas.<br>
      <span style="font-size:.75rem">Usa la pestaña <strong>Tareas</strong> para asignar.</span>
    </div>`;
  } else {
    /* Agrupar por fecha */
    const porFecha={};
    items.forEach(it=>{
      if(!porFecha[it.f]) porFecha[it.f]=[];
      porFecha[it.f].push(it);
    });
    Object.keys(porFecha).sort().forEach(f=>{
      const list=porFecha[f];
      const lbl=f===hoyStr?`Hoy — ${fd(f)}`:`${diaSemana(f)} ${fd(f)}`;
      h+=`<div class="cfg-prox-date">
        <span class="cfg-prox-date-lbl">${lbl}</span>
        <span style="font-size:.69rem;color:var(--g400)">${list.length} tarea${list.length!==1?'s':''}</span>
      </div>`;
      list.forEach(({emp,t})=>{
        const color=EQ_COLORES[emp]||'#b8943a';
        const horaChip=t.hora?`<span class="cfg-prox-hora">⏰ ${t.hora}</span>`:'';
        h+=`<div class="cfg-prox-task">
          <div class="cfg-prox-av" style="background:${color}20;color:${color}">${ini(emp)}</div>
          <span class="cfg-prox-txt">${t.urgente?'⚡ ':''}${t.desc}</span>
          ${horaChip}
          <button class="cfg-prox-del" onclick="elimCfgTP('${emp}','${f}',${t.id})" title="Eliminar">✕</button>
        </div>`;
      });
    });
  }
  h+=`</div>`;
  const el=document.getElementById('cfg-panel-prog');
  if(el) el.innerHTML=h;
}

function cfgTab(tab){ renderConfig(); }

function elimCfgTP(emp,fecha,id){
  if(!S.tp[fecha]?.[emp])return;
  S.tp[fecha][emp]=S.tp[fecha][emp].filter(t=>t.id!==id);
  if(!S.tp[fecha][emp].length)delete S.tp[fecha][emp];
  sv();_renderCfgProg();toast('Tarea eliminada');
}

// ── Apply sheet (items dinámicos: por categoría o todo) ──
let _applyItems=[];   // [{cat,desc}] a asignar
let _applyLabel='';   // título del sheet
let _applyColab='';
let _applyFechaMode='hoy';

function abrirApplyItems(cat, label){
  // cat===null → todas las tareas; cat==='ventas'→solo esa categoría
  _applyItems = cat
    ? S.tareas.filter(t=>t.cat===cat).map(t=>({cat:t.cat,desc:t.desc}))
    : S.tareas.map(t=>({cat:t.cat,desc:t.desc}));
  if(!_applyItems.length){toast('No hay tareas en esta categoría');return;}
  _applyLabel=label||'Asignar tareas';
  _applyColab='';
  _applyFechaMode='hoy';
  const titleEl=document.getElementById('apply-title');
  if(titleEl)titleEl.textContent=`${_applyLabel} (${_applyItems.length})`;
  ['Marlon','Ingrid','Isabella'].forEach(e=>document.getElementById('apav-'+e)?.classList.remove('on'));
  ['hoy','man','pick'].forEach(m=>document.getElementById('apfc-'+m)?.classList.toggle('on',m==='hoy'));
  const fi=document.getElementById('ap-fecha');
  if(fi){fi.value=hoy();fi.style.display='none';}
  document.getElementById('apply-overlay').classList.remove('hidden');
}

function cerrarApply(){document.getElementById('apply-overlay').classList.add('hidden');}

function selApplyColab(emp){
  _applyColab=emp;
  ['Marlon','Ingrid','Isabella'].forEach(e=>document.getElementById('apav-'+e)?.classList.toggle('on',e===emp));
}

function selApplyFecha(mode){
  _applyFechaMode=mode;
  ['hoy','man','pick'].forEach(m=>document.getElementById('apfc-'+m)?.classList.toggle('on',m===mode));
  const fi=document.getElementById('ap-fecha');
  if(!fi)return;
  if(mode==='pick'){
    fi.style.display='block';
    if(!fi.value)fi.value=hoy();
    fi.focus();
  } else {
    fi.style.display='none';
    const d=new Date();
    if(mode==='man')d.setDate(d.getDate()+1);
    fi.value=d.toISOString().slice(0,10);
  }
}

function confirmarApply(){
  if(!_applyColab){toast('Elige un colaborador');return;}
  if(!_applyItems.length){cerrarApply();return;}
  const fecha=document.getElementById('ap-fecha')?.value||hoy();
  if(!S.tp[fecha])S.tp[fecha]={};
  if(!S.tp[fecha][_applyColab])S.tp[fecha][_applyColab]=[];
  _applyItems.forEach(it=>{
    S.tp[fecha][_applyColab].push({id:S.nid++,desc:it.desc,urgente:false});
  });
  sv();cerrarApply();
  toast(`${_applyItems.length} tarea${_applyItems.length!==1?'s':''} asignada${_applyItems.length!==1?'s':''} a ${_applyColab} ✓`);
  if(document.getElementById('ct-hoy')&&!document.getElementById('ct-hoy').classList.contains('hidden'))renderCardsHoy();
  if(_cfgTab==='prog')_renderCfgProg();
}

// ── 7g. Modal tarea rápida (FAB) ──
let _prioActual='normal';
let _modalColab='';
let _modalFechaMode='hoy'; // 'hoy'|'man'|'pick'

function abrirModal(){
  _modalColab='';_prioActual='normal';_modalFechaMode='hoy';
  document.getElementById('m-desc').value='';
  // Fecha: hoy por defecto, ocultar input manual
  const fechaInp=document.getElementById('m-fecha');
  if(fechaInp){fechaInp.value=hoy();fechaInp.style.display='none';}
  // Reset avatares
  ['Marlon','Ingrid','Isabella'].forEach(e=>document.getElementById('mav-'+e)?.classList.remove('on'));
  // Reset fecha chips
  _applyModalFechaChip('hoy');
  // Reset prio chips
  document.getElementById('mp-normal')?.classList.add('on');
  document.getElementById('mp-urgente')?.classList.remove('on');
  document.getElementById('mp-urgente')?.classList.remove('on-red');
  document.getElementById('modal').classList.remove('hidden');
}

/* cerrarModal — see unified version above */

function selModalColab(emp){
  _modalColab=emp;
  ['Marlon','Ingrid','Isabella'].forEach(e=>{
    document.getElementById('mav-'+e)?.classList.toggle('on',e===emp);
  });
}

function selModalFecha(mode){
  _modalFechaMode=mode;
  _applyModalFechaChip(mode);
  const inp=document.getElementById('m-fecha');
  if(mode==='pick'){
    inp.style.display='block';
    if(!inp.value)inp.value=hoy();
    inp.focus();
  } else {
    inp.style.display='none';
    const d=new Date();
    if(mode==='man')d.setDate(d.getDate()+1);
    inp.value=d.toISOString().slice(0,10);
  }
}

function _applyModalFechaChip(mode){
  ['hoy','man','pick'].forEach(m=>{
    document.getElementById('mfc-'+m)?.classList.toggle('on',m===mode);
  });
}

function _syncFechaManual(){
  // Cuando el usuario elige una fecha custom ya se guarda en el input
}

function setPrio(p){
  _prioActual=p;
  const norm=document.getElementById('mp-normal');
  const urg=document.getElementById('mp-urgente');
  if(!norm||!urg)return;
  norm.className='modal-chip'+(p==='normal'?' on':'');
  urg.className='modal-chip'+(p==='urgente'?' on-red':'');
}

function guardarTareaRapida(){
  const colab=_modalColab;
  const fecha=document.getElementById('m-fecha').value||hoy();
  const desc=document.getElementById('m-desc').value.trim();
  if(!colab){toast('Elige un colaborador');return;}
  if(!desc){toast('Escribe la tarea');return;}
  if(!S.tp[fecha])S.tp[fecha]={};
  if(!S.tp[fecha][colab])S.tp[fecha][colab]=[];
  S.tp[fecha][colab].push({id:S.nid++,desc,urgente:_prioActual==='urgente'});
  sv();cerrarModal();
  toast(`Tarea ${_prioActual==='urgente'?'urgente ':''}asignada a ${colab}`);
  if(document.getElementById('ct-hoy')&&!document.getElementById('ct-hoy').classList.contains('hidden'))renderCardsHoy();
  if(_cfgTab==='prog'&&document.getElementById('ct-config')&&!document.getElementById('ct-config').classList.contains('hidden'))_renderCfgProg();
}

// ── 7h. Próximas tareas programadas ──
function renderProximas(emp,containerId){
  const manana=new Date();manana.setDate(manana.getDate()+1);
  const mananaStr=manana.toISOString().slice(0,10);
  const fechasFuturas=Object.keys(S.tp||{}).filter(f=>f>=mananaStr&&S.tp[f]?.[emp]?.length).sort();
  const el=document.getElementById(containerId);
  if(!el)return;
  if(!fechasFuturas.length){el.innerHTML='';return;}
  const totalPend=fechasFuturas.reduce((a,f)=>a+(S.tp[f][emp]?.length||0),0);
  let h=`<div class="card" style="margin-top:.85rem">
    <div class="frow" style="margin-bottom:.75rem">
      <span class="card-t">Próximas tareas programadas</span>
      <span class="badge b-blue"><span class="bdot"></span>${totalPend} pendientes</span>
    </div>`;
  fechasFuturas.forEach(f=>{
    const tareas=S.tp[f][emp];
    const tareasSorted=_sortTareas(tareas);
    const urgentes=tareasSorted.filter(t=>t.urgente);
    h+=`<div style="margin-bottom:.6rem"><div class="cat-lbl">${diaSemana(f)} ${fd(f)}</div>`;
    tareasSorted.forEach(t=>{
      h+=`<div class="frow" style="padding:.4rem 0;border-bottom:1px solid var(--g100);${t.urgente?'background:var(--red-bg);border-left:3px solid var(--red);border-radius:0 var(--rs) var(--rs) 0;padding-left:.6rem;margin-left:-.1rem':''}">
        <div style="flex:1;padding-right:8px">
          ${t.urgente?'<div style="margin-bottom:2px"><span class="urgente-badge">⚡ Urgente</span></div>':''}
          <span style="font-size:.85rem;color:var(--g800)">${t.desc}</span>
        </div>
        <button onclick="eliminarTP('${emp}','${f}',${t.id},'${containerId}')" style="background:none;border:none;color:var(--red);font-size:.78rem;cursor:pointer;font-family:var(--fb);padding:2px 6px;flex-shrink:0">✕</button>
      </div>`;
    });
    h+='</div>';
  });
  h+='</div>';
  el.innerHTML=h;
}

function eliminarTP(emp,fecha,id,containerId){
  if(!S.tp[fecha]?.[emp])return;
  S.tp[fecha][emp]=S.tp[fecha][emp].filter(t=>t.id!==id);
  if(!S.tp[fecha][emp].length)delete S.tp[fecha][emp];
  sv();renderProximas(emp,containerId);toast('Tarea eliminada');
}


// ═══════════════════════════════════════════════════════════════
// 9. SOLICITUDES DEL EQUIPO — sistema completo
// ═══════════════════════════════════════════════════════════════

const SOL_TIPOS={
  insumo:{ico:'📦',lbl:'Insumo',color:'#c2410c'},
  mejora:{ico:'✨',lbl:'Mejora',color:'#166534'},
  bloqueo:{ico:'🚫',lbl:'Bloqueo',color:'#dc2626'},
  apoyo:{ico:'🤝',lbl:'Apoyo',color:'#7c3aed'}
};
let _solTipoSel='insumo';  // tipo activo en modal colaborador
let _solFiltro='todas';    // filtro activo en vista CEO

/* ── Auto-calcular prioridad básica ── */
function _solPrioridad(texto, tipo){
  const t=texto.toLowerCase();
  if(tipo==='bloqueo') return 'alta';
  if(tipo==='apoyo') return 'media';
  if(/urgent|inmediato|ya|ahora|hoy/.test(t)) return 'alta';
  if(/falta|no hay|agotado|roto|dañado/.test(t)) return 'alta';
  if(/podría|mejorar|sería|sugerencia|idea/.test(t)) return 'baja';
  return 'media';
}

/* ── Transformar texto libre → tarea accionable para CEO ── */
function transformarSolicitud(texto, tipo){
  const t=texto.trim();
  const tl=t.toLowerCase();
  // Reglas de prefijo según tipo
  if(tipo==='insumo'){
    if(/no hay|falta|faltan|agotad/.test(tl)){
      // "no hay bolsas" → "Gestionar compra de bolsas"
      const obj=tl.replace(/^(no hay|faltan|falta|se acabaron?|agotad[ao]s?)\s*/,'').trim();
      return 'Gestionar compra de '+obj;
    }
    return 'Conseguir: '+t;
  }
  if(tipo==='mejora'){
    if(/sería bueno|podría|deberíamos|hay que/.test(tl)){
      const obj=tl.replace(/^(sería bueno|podría|deberíamos|hay que)\s*/,'').trim();
      return 'Evaluar e implementar: '+obj;
    }
    return 'Mejora pendiente: '+t;
  }
  if(tipo==='bloqueo'){
    if(/no funciona|está roto|dañado|no sirve/.test(tl)){
      const obj=tl.replace(/^(el |la |los |las )?(.*?)\s*(no funciona|está roto|dañado|no sirve).*$/,'$2').trim()||t;
      return 'Resolver problema: '+obj;
    }
    return 'Atender urgente: '+t;
  }
  if(tipo==='apoyo'){
    return 'Dar apoyo/feedback a: '+t;
  }
  return 'Acción pendiente: '+t;
}

/* ── Modal colaborador: abrir ── */
function abrirSolicitudModal(){
  _solTipoSel='insumo';
  const overlay=document.createElement('div');
  overlay.className='tmpl-modal-overlay';
  overlay.id='sol-modal-overlay';
  overlay.innerHTML=`
    <div class="plan-modal" style="max-height:70vh">
      <div class="plan-modal-title">
        <span class="plan-modal-ttl">📣 Reportar necesidad</span>
        <button class="tmpl-modal-close" onclick="cerrarSolModal()">✕</button>
      </div>
      <div class="sol-modal-body">
        <div style="font-size:.72rem;color:var(--g500);margin-bottom:.6rem;font-weight:600">
          Tipo de necesidad
        </div>
        <div class="sol-tipo-grid" style="grid-template-columns:repeat(4,1fr)">
          <button class="sol-tipo-btn on" data-tipo="insumo" onclick="solSelTipo('insumo')">
            📦<br>Insumo
          </button>
          <button class="sol-tipo-btn" data-tipo="mejora" onclick="solSelTipo('mejora')">
            ✨<br>Mejora
          </button>
          <button class="sol-tipo-btn" data-tipo="bloqueo" onclick="solSelTipo('bloqueo')">
            🚫<br>Bloqueo
          </button>
          <button class="sol-tipo-btn" data-tipo="apoyo" onclick="solSelTipo('apoyo')">
            🤝<br>Apoyo
          </button>
        </div>
        <div style="font-size:.72rem;color:var(--g500);margin-bottom:.5rem;font-weight:600">
          Describí la situación
        </div>
        <textarea class="sol-inp" id="sol-txt-inp" rows="3"
          placeholder="Ej: no hay bolsas para los pedidos, la impresora no funciona…"
          maxlength="200"></textarea>
        <div class="plan-footer" style="margin-top:.75rem">
          <button class="plan-footer-btn cancel" onclick="cerrarSolModal()">Cancelar</button>
          <button class="plan-footer-btn apply" onclick="enviarSolicitud()">Enviar al CEO</button>
        </div>
      </div>
    </div>`;
  overlay.addEventListener('click',e=>{if(e.target===overlay)cerrarSolModal();});
  document.body.appendChild(overlay);
  setTimeout(()=>document.getElementById('sol-txt-inp')?.focus(),80);
}

function cerrarSolModal(){
  document.getElementById('sol-modal-overlay')?.remove();
}

function solSelTipo(tipo){
  _solTipoSel=tipo;
  document.querySelectorAll('.sol-tipo-btn').forEach(b=>{
    b.classList.toggle('on',b.dataset.tipo===tipo);
  });
}

function enviarSolicitud(){
  const txt=(document.getElementById('sol-txt-inp')?.value||'').trim();
  if(!txt){document.getElementById('sol-txt-inp')?.focus();return;}
  const tipo=_solTipoSel;
  const prio=_solPrioridad(txt, tipo);
  const tarea=transformarSolicitud(txt, tipo);
  const sol={
    id: S.nid++,
    colaborador: CU||'?',
    texto: txt,
    tipo,
    prioridad: prio,
    estado: 'pendiente',
    fecha_creacion: hoy(),
    tarea_sugerida: tarea,
    convertida_en_tarea: false
  };
  S.solicitudes.push(sol);
  // Auto-convertir en tarCEO
  S.tarCEO.push({id:S.nid++, desc:tarea, solicitud_id:sol.id, hecho:false,
    fecha_creacion:hoy(), prio:prio});
  sol.convertida_en_tarea=true;
  sol.estado='convertida';
  sv();
  cerrarSolModal();
  _actualizarSolBadge();
  toast('📣 Solicitud enviada al CEO');
}

/* ── Badge en tab Solicitudes ── */
function _actualizarSolBadge(){
  const pend=(S.solicitudes||[]).filter(s=>s.estado==='pendiente'||s.estado==='convertida').length;
  const badge=document.getElementById('sol-badge');
  if(!badge) return;
  if(pend>0){badge.textContent=pend>9?'9+':pend;badge.classList.remove('hidden');}
  else badge.classList.add('hidden');
}

/* ═══════════════════════════════════════════════════════════════
   PULSO DEL EQUIPO — Motor de sugerencias de liderazgo IA
═══════════════════════════════════════════════════════════════ */

const _LIDER_TIPS={
  checkin:   {ico:'📊', cat:'Seguimiento', color:'#3b82f6', bg:'#eff6ff'},
  reconocer: {ico:'🏆', cat:'Reconocimiento', color:'#f59e0b', bg:'#fffbeb'},
  urgente:   {ico:'⚠️', cat:'Atención urgente', color:'#dc2626', bg:'#fef2f2'},
  solicitud: {ico:'📋', cat:'Gestión', color:'#7c3aed', bg:'#f5f3ff'},
  formacion: {ico:'📚', cat:'Formación', color:'#059669', bg:'#f0fdf4'},
  equipo:    {ico:'🤝', cat:'Comunicación', color:'#0891b2', bg:'#ecfeff'},
  planif:    {ico:'🗓️', cat:'Planificación', color:'#6b7280', bg:'#f9fafb'},
};

/* Motor principal: genera sugerencias basadas en datos reales */
function _generarSugerenciasLiderazgo(){
  const sugs=[];
  const hoyS=hoy();
  const dow=new Date(hoyS+'T12:00:00').getDay(); // 0=dom, 1=lun ... 6=sab
  const emps=Object.keys(EQ_COLORES)||['Marlon','Ingrid','Isabella'];

  // ── 1. Análisis de rendimiento por colaborador ────────────────────────────
  emps.forEach(emp=>{
    const dias7=[];
    for(let i=1;i<=7;i++){
      const d=new Date(hoyS+'T12:00:00'); d.setDate(d.getDate()-i);
      dias7.push(d.toISOString().split('T')[0]);
    }
    const pcts=dias7.map(d=>{
      const ef=calcEficacia(emp,d);
      return ef.total>0?Math.round(ef.comp/ef.total*100):null;
    }).filter(p=>p!==null);
    if(!pcts.length) return;
    const pctProm=Math.round(pcts.reduce((a,b)=>a+b,0)/pcts.length);
    const pctHoy=calcEficacia(emp,hoyS);

    // Rendimiento bajo sostenido (últimos 3+ días con <40%)
    const bajos=pcts.slice(0,3).filter(p=>p<40);
    if(bajos.length>=3){
      sugs.push({
        tipo:'checkin', emp,
        titulo:`Check-in con ${emp}`,
        desc:`Lleva ${bajos.length} días consecutivos con rendimiento bajo (prom. ${Math.round(bajos.reduce((a,b)=>a+b,0)/bajos.length)}%). Puede necesitar apoyo o claridad en sus tareas.`,
        accion:`Hacer check-in con ${emp} y revisar obstáculos`,
        prio:'alta'
      });
    }
    // Rendimiento excelente → reconocimiento
    else if(pctProm>=85&&pcts.length>=3){
      sugs.push({
        tipo:'reconocer', emp,
        titulo:`Reconocer a ${emp}`,
        desc:`Semana con rendimiento sobresaliente (prom. ${pctProm}%). El reconocimiento refuerza el desempeño y motiva al resto del equipo.`,
        accion:`Reconocer el desempeño de ${emp} esta semana`,
        prio:'media'
      });
    }
    // Sin tareas asignadas hoy (y es día hábil)
    if(dow>0&&dow<6){
      const tpHoy=(S.tp[hoyS]?.[emp]||[]).length;
      const efHoy=calcEficacia(emp,hoyS);
      if(tpHoy===0&&efHoy.total===0){
        sugs.push({
          tipo:'planif', emp,
          titulo:`${emp} sin tareas hoy`,
          desc:`No tiene tareas asignadas para hoy. Asignarle tareas mejora su enfoque y la productividad del equipo.`,
          accion:`Asignar tareas del día a ${emp}`,
          prio:'media'
        });
      }
    }
  });

  // ── 2. Solicitudes pendientes antiguas ────────────────────────────────────
  const solPend=(S.solicitudes||[]).filter(s=>s.estado!=='resuelta');
  const solAntiguas=solPend.filter(s=>_diasDesde2(s.fecha_creacion)>=3);
  if(solAntiguas.length>0){
    sugs.push({
      tipo:'solicitud',
      titulo:`${solAntiguas.length} solicitud${solAntiguas.length>1?'es':''} sin resolver (${solAntiguas.length>1?'+3 días cada una':'más de 3 días'})`,
      desc:`Solicitudes pendientes por mucho tiempo generan frustración en el equipo. Revisar y resolver o comunicar estado.`,
      accion:`Revisar y resolver las ${solAntiguas.length} solicitudes antiguas`,
      prio:'alta'
    });
  }
  // Solicitudes de bloqueo sin resolver (siempre urgente)
  const bloqueos=solPend.filter(s=>s.tipo==='bloqueo');
  if(bloqueos.length>0){
    sugs.push({
      tipo:'urgente',
      titulo:`🚫 ${bloqueos.length} bloqueo${bloqueos.length>1?'s':''} activo${bloqueos.length>1?'s':''}`,
      desc:`${bloqueos.map(s=>`"${s.texto.slice(0,40)}${s.texto.length>40?'…':''}" (${s.colaborador})`).join(', ')} — los bloqueos afectan directamente la productividad.`,
      accion:`Resolver bloqueo${bloqueos.length>1?'s':''} del equipo hoy`,
      prio:'alta'
    });
  }

  // ── 3. Comunicación y alineación del equipo ───────────────────────────────
  // Lunes → reunión semanal
  if(dow===1){
    sugs.push({
      tipo:'equipo',
      titulo:'Alineación del equipo — inicio de semana',
      desc:'Lunes es el momento ideal para comunicar los objetivos de la semana, ajustar prioridades y motivar al equipo.',
      accion:'Hacer briefing de apertura semanal con el equipo',
      prio:'media'
    });
  }
  // Viernes → feedback y cierre
  if(dow===5){
    sugs.push({
      tipo:'reconocer',
      titulo:'Cierre y reconocimiento semanal',
      desc:'Viernes es el momento perfecto para revisar resultados de la semana, celebrar logros y dar feedback constructivo.',
      accion:'Hacer cierre de semana con reconocimientos al equipo',
      prio:'media'
    });
  }

  // ── 4. Backlog CEO muy cargado ────────────────────────────────────────────
  const tarPend=(S.tarCEO||[]).filter(t=>!t.hecho).length;
  if(tarPend>=6){
    sugs.push({
      tipo:'solicitud',
      titulo:`Backlog cargado — ${tarPend} tareas pendientes`,
      desc:`Con ${tarPend} tareas pendientes es momento de priorizar: decidir cuáles delegar, cuáles posponer y cuáles atender hoy.`,
      accion:`Revisar y priorizar las ${tarPend} tareas CEO pendientes`,
      prio:'alta'
    });
  }

  // ── 5. Formación y desarrollo ─────────────────────────────────────────────
  // Miércoles → mid-week coaching
  if(dow===3&&emps.length>0){
    sugs.push({
      tipo:'formacion',
      titulo:'Momento de coaching de mitad de semana',
      desc:'Los miércoles son ideales para dar retroalimentación informal, revisar avances y ajustar el rumbo antes del cierre.',
      accion:'Dar feedback individual de mitad de semana al equipo',
      prio:'baja'
    });
  }

  // ── 6. Retos: análisis de completación ───────────────────────────────────
  emps.forEach(emp=>{
    const retosEmp=(S.retos||[]).filter(r=>r.colaborador===emp&&r.fecha===hoyS);
    if(retosEmp.length>0){
      const retoDone=retosEmp.filter(r=>r.hecho).length;
      if(retoDone===retosEmp.length&&retosEmp.length>=2){
        sugs.push({
          tipo:'reconocer', emp,
          titulo:`${emp} completó todos sus retos del día`,
          desc:`Completó ${retoDone}/${retosEmp.length} retos asignados hoy. Un reconocimiento en el momento refuerza ese comportamiento.`,
          accion:`Felicitar a ${emp} por completar sus retos`,
          prio:'baja'
        });
      }
    }
  });

  // Limitar a 6 sugerencias, priorizando por prio
  const orden={alta:0,media:1,baja:2};
  return sugs.sort((a,b)=>(orden[a.prio]||2)-(orden[b.prio]||2)).slice(0,6);
}

/* Agregar sugerencia como tarea CEO directamente */
function liderAgregarTarea(accion){
  const desc=accion;
  S.tarCEO=S.tarCEO||[];
  // Evitar duplicados
  if(S.tarCEO.some(t=>t.desc.toLowerCase()===desc.toLowerCase())){
    toast('✓ Esta sugerencia ya está en tus tareas');
    return;
  }
  S.tarCEO.push({id:S.nid++,desc,hecho:false,fecha_creacion:hoy(),prio:'media'});
  sv(); _renderCEOBacklog(); _renderPulsoEquipo();
  toast('✅ Agregada a pendientes estratégicos');
}

function _renderPulsoEquipo(){
  const el=document.getElementById('sol-panel-liderazgo');
  if(!el) return;
  const sugs=_generarSugerenciasLiderazgo();
  const hoyS=hoy();
  const dLbl=new Date(hoyS+'T12:00:00').toLocaleDateString('es-CO',{weekday:'long',day:'numeric',month:'short'});

  if(!sugs.length){
    el.innerHTML=`<div class="pulso-card">
      <div class="pulso-hd">
        <span class="pulso-ttl">💡 Pulso del equipo</span>
        <span class="pulso-fecha">${dLbl}</span>
      </div>
      <div style="padding:.85rem 1rem;text-align:center">
        <div style="font-size:1.6rem;margin-bottom:.4rem">🌟</div>
        <div style="font-size:.83rem;color:var(--g600);font-weight:500">Todo en orden</div>
        <div style="font-size:.74rem;color:var(--g400);margin-top:.2rem">No hay sugerencias de liderazgo para hoy</div>
      </div>
    </div>`;
    return;
  }

  let h=`<div class="pulso-card">
    <div class="pulso-hd">
      <span class="pulso-ttl">💡 Pulso del equipo</span>
      <span class="pulso-fecha">${dLbl}</span>
    </div>
    <div class="pulso-sub">${sugs.length} sugerencia${sugs.length!==1?'s':''} para ser mejor líder hoy</div>`;

  sugs.forEach((sg,i)=>{
    const tip=_LIDER_TIPS[sg.tipo]||{ico:'💡',cat:'Sugerencia',color:'#6b7280',bg:'#f9fafb'};
    const prioLbl={alta:'Urgente',media:'Importante',baja:'Sugerido'}[sg.prio]||sg.prio;
    const prioCls={alta:'pulso-prio-alta',media:'pulso-prio-media',baja:'pulso-prio-baja'}[sg.prio]||'';
    h+=`<div class="pulso-item" style="border-left-color:${tip.color}">
      <div class="pulso-item-top">
        <span class="pulso-item-ico" style="background:${tip.bg};color:${tip.color}">${tip.ico}</span>
        <div class="pulso-item-info">
          <span class="pulso-item-cat" style="color:${tip.color}">${tip.cat}</span>
          <span class="pulso-prio-chip ${prioCls}">${prioLbl}</span>
        </div>
      </div>
      <div class="pulso-item-titulo">${sg.titulo}</div>
      <div class="pulso-item-desc">${sg.desc}</div>
      <div style="display:flex;gap:7px;flex-wrap:wrap">
        <button class="pulso-add-btn" onclick="liderAgregarTarea('${sg.accion.replace(/'/g,"\'")}')">
          + Agregar a mis tareas
        </button>
      </div>
    </div>`;
  });

  h+=`</div>`;
  el.innerHTML=h;
}

/* ══ CEO: renderizar solicitudes ══ */
function renderSolicitudes(){
  _renderPulsoEquipo();
  _renderSolList();
  _renderCEOBacklog();
}

/* Helper: días desde fecha */
function _diasDesde(fecha){
  if(!fecha) return 0;
  const d1=new Date(fecha+'T12:00:00'), d2=new Date(hoy()+'T12:00:00');
  return Math.max(0,Math.round((d2-d1)/(1000*60*60*24)));
}

function solFiltrar(f){
  _solFiltro=f;
  document.querySelectorAll('.sol-fil-btn').forEach(b=>b.classList.toggle('on',b.dataset.f===f));
  _renderSolListCards(document.getElementById('sol-cards-wrap'),
    (S.solicitudes||[]).slice().reverse());
}

function _renderSolList(){
  const el=document.getElementById('sol-panel-solicitudes');
  if(!el) return;
  const lista=(S.solicitudes||[]).slice().reverse();
  const pendN=lista.filter(s=>s.estado!=='resuelta').length;
  const altaN=lista.filter(s=>s.prioridad==='alta'&&s.estado!=='resuelta').length;
  // Calcular tiempo promedio de resolución
  const resueltas=lista.filter(s=>s.estado==='resuelta'&&s.fecha_resolucion&&s.fecha_creacion);
  const avgRes=resueltas.length
    ? Math.round(resueltas.reduce((acc,s)=>acc+_diasDesde2(s.fecha_creacion,s.fecha_resolucion),0)/resueltas.length)
    : null;
  // Top tipo
  const tipoCnt={};lista.filter(s=>s.estado!=='resuelta').forEach(s=>{tipoCnt[s.tipo]=(tipoCnt[s.tipo]||0)+1;});
  const topTipo=Object.entries(tipoCnt).sort((a,b)=>b[1]-a[1])[0];

  let h=`<div class="sol-header-card">
    <div class="sol-header-top">
      <div>
        <div class="sol-header-title">Solicitudes del equipo</div>
        <div class="sol-header-sub">${lista.length} total · ${pendN} pendiente${pendN!==1?'s':''}</div>
      </div>
      ${altaN>0?`<div class="sol-urgent-badge">🔴 ${altaN} urgente${altaN!==1?'s':''}</div>`:''}
    </div>
    <div class="sol-stats-row">
      <div class="sol-stat-box">
        <div class="sol-stat-n">${pendN}</div>
        <div class="sol-stat-lbl">Pendientes</div>
      </div>
      <div class="sol-stat-box">
        <div class="sol-stat-n">${resueltas.length}</div>
        <div class="sol-stat-lbl">Resueltas</div>
      </div>
      <div class="sol-stat-box">
        <div class="sol-stat-n">${avgRes!==null?avgRes+'d':'—'}</div>
        <div class="sol-stat-lbl">T. resolución</div>
      </div>
      <div class="sol-stat-box">
        <div class="sol-stat-n">${topTipo?SOL_TIPOS[topTipo[0]]?.ico||'•':'—'}</div>
        <div class="sol-stat-lbl">${topTipo?SOL_TIPOS[topTipo[0]]?.lbl||topTipo[0]:'Sin datos'}</div>
      </div>
    </div>
    <!-- Filtros -->
    <div class="sol-filtros-row">
      ${['todas','pendiente','insumo','mejora','bloqueo','apoyo'].map(f=>{
        const lbl={todas:'Todas',pendiente:'⏳ Pend.',insumo:'📦',mejora:'✨',bloqueo:'🚫',apoyo:'🤝'}[f]||f;
        return `<button class="sol-fil-btn${_solFiltro===f?' on':''}" data-f="${f}" onclick="solFiltrar('${f}')">${lbl}</button>`;
      }).join('')}
    </div>
  </div>
  <div id="sol-cards-wrap"></div>`;

  el.innerHTML=h;
  _renderSolListCards(document.getElementById('sol-cards-wrap'), lista);
}

/* Días entre dos fechas */
function _diasDesde2(f1, f2){
  const d1=new Date(f1+'T12:00:00'), d2=new Date((f2||hoy())+'T12:00:00');
  return Math.max(0,Math.round((d2-d1)/(1000*60*60*24)));
}

function _renderSolListCards(wrap, lista){
  if(!wrap) return;
  // Aplicar filtro
  let filtrada=lista;
  if(_solFiltro==='pendiente') filtrada=lista.filter(s=>s.estado!=='resuelta');
  else if(['insumo','mejora','bloqueo','apoyo'].includes(_solFiltro)) filtrada=lista.filter(s=>s.tipo===_solFiltro);

  if(!filtrada.length){
    wrap.innerHTML=`<div class="sol-empty">
      <div style="font-size:2rem;margin-bottom:.5rem">📬</div>
      <div style="font-size:.84rem;color:var(--g500)">Sin solicitudes${_solFiltro!=='todas'?' en esta categoría':' todavía'}.</div>
    </div>`;
    return;
  }

  const prioMap={alta:'🔴 Alta',media:'🟡 Media',baja:'🔵 Baja'};
  const estMap={pendiente:'⏳ Pendiente',convertida:'⚙ En proceso',resuelta:'✅ Resuelta'};
  let h='';
  filtrada.forEach(s=>{
    const tipo=SOL_TIPOS[s.tipo]||{ico:'•',lbl:s.tipo};
    const dias=_diasDesde2(s.fecha_creacion);
    const diasLbl=dias===0?'hoy':dias===1?'hace 1 día':`hace ${dias} días`;
    const diasCls=dias>=5?'sol-dias-alert':dias>=2?'sol-dias-warn':'sol-dias-ok';
    const resuelta=s.estado==='resuelta';
    const resolverBtn=!resuelta
      ?`<button class="sol-act-btn resolve" onclick="solResolverConNota(${s.id})">✅ Resolver</button>`:'';
    const convertBtn=!s.convertida_en_tarea
      ?`<button class="sol-act-btn convert" onclick="convertirSolicitud(${s.id})">⚙ A tarea CEO</button>`:'';
    const delBtn=`<button class="sol-act-btn del" onclick="eliminarSolicitud(${s.id})" title="Eliminar">✕</button>`;
    const notaCEO=s.nota_ceo?`<div class="sol-nota-ceo">💬 CEO: ${s.nota_ceo}</div>`:'';

    h+=`<div class="sol-card" data-tipo="${s.tipo}" style="${resuelta?'opacity:.55':''}">
      <div class="sol-card-body">
        <div class="sol-card-top">
          <span class="sol-card-emp">${ini(s.colaborador)} ${s.colaborador}</span>
          <span class="sol-tipo-chip ${s.tipo}">${tipo.ico} ${tipo.lbl}</span>
          <span class="sol-prio-chip ${s.prioridad}">${prioMap[s.prioridad]||s.prioridad}</span>
          <span class="sol-dias-badge ${diasCls}">${diasLbl}</span>
          <span style="font-size:.65rem;color:var(--g400);margin-left:auto">${estMap[s.estado]||s.estado}</span>
        </div>
        <div class="sol-card-txt">${s.texto}</div>
        ${s.tarea_sugerida?`<div class="sol-card-tarea">→ ${s.tarea_sugerida}</div>`:''}
        ${notaCEO}
      </div>
      <div class="sol-card-actions">${convertBtn}${resolverBtn}${delBtn}</div>
    </div>`;
  });
  wrap.innerHTML=h;
}

/* Resolver con nota opcional */
function solResolverConNota(id){
  const s=(S.solicitudes||[]).find(s=>s.id===id);
  if(!s) return;
  const overlay=document.createElement('div');
  overlay.className='tmpl-modal-overlay';
  overlay.id='sol-resolve-overlay';
  overlay.innerHTML=`
    <div class="plan-modal" style="max-width:420px">
      <div class="plan-modal-title">
        <span class="plan-modal-ttl">✅ Resolver solicitud</span>
        <button class="tmpl-modal-close" onclick="document.getElementById('sol-resolve-overlay')?.remove()">✕</button>
      </div>
      <div style="padding:.85rem 1rem 0">
        <div style="font-size:.82rem;color:var(--g700);background:var(--cream);
          border-radius:var(--rs);padding:.55rem .8rem;margin-bottom:.75rem">
          "${s.texto}"
        </div>
        <div style="font-size:.72rem;color:var(--g500);margin-bottom:.4rem;font-weight:600">
          Nota para el colaborador (opcional)
        </div>
        <textarea class="sol-inp" id="sol-nota-inp" rows="2"
          placeholder="Ej: Ya lo solicitamos al proveedor, llegará el lunes…"
          maxlength="160"></textarea>
        <div class="plan-footer" style="margin-top:.75rem">
          <button class="plan-footer-btn cancel"
            onclick="document.getElementById('sol-resolve-overlay')?.remove()">Cancelar</button>
          <button class="plan-footer-btn apply"
            onclick="confirmarResolver(${id})">✅ Confirmar resolución</button>
        </div>
      </div>
    </div>`;
  overlay.addEventListener('click',e=>{if(e.target===overlay)overlay.remove();});
  document.body.appendChild(overlay);
  setTimeout(()=>document.getElementById('sol-nota-inp')?.focus(),80);
}

function confirmarResolver(id){
  const s=(S.solicitudes||[]).find(s=>s.id===id);
  if(!s) return;
  const nota=(document.getElementById('sol-nota-inp')?.value||'').trim();
  s.estado='resuelta';
  s.fecha_resolucion=hoy();
  if(nota) s.nota_ceo=nota;
  sv(); document.getElementById('sol-resolve-overlay')?.remove();
  _renderSolList(); _actualizarSolBadge();
  toast('✅ Solicitud resuelta');
}

function convertirSolicitud(id){
  const s=(S.solicitudes||[]).find(s=>s.id===id);
  if(!s||s.convertida_en_tarea) return;
  S.tarCEO.push({id:S.nid++,desc:s.tarea_sugerida||s.texto,solicitud_id:s.id,
    hecho:false,fecha_creacion:hoy(),prio:s.prioridad});
  s.convertida_en_tarea=true;
  s.estado='convertida';
  sv(); _renderSolList(); _renderCEOBacklog(); _actualizarSolBadge();
  toast('⚙ Convertida en tarea CEO');
}

function resolverSolicitud(id){ solResolverConNota(id); }

function eliminarSolicitud(id){
  S.solicitudes=(S.solicitudes||[]).filter(s=>s.id!==id);
  sv(); _renderSolList(); _actualizarSolBadge();
}

/* ══ CEO Backlog — Pendientes estratégicos ══ */
function _renderCEOBacklog(){
  const el=document.getElementById('sol-panel-backlog');
  if(!el) return;
  const lista=S.tarCEO||[];
  const pend=lista.filter(t=>!t.hecho).length;

  let h=`<div class="ceo-bl-sec">
    <div class="ceo-bl-hd">
      <span class="ceo-bl-ttl">⚡ Pendientes estratégicos</span>
      <div style="display:flex;align-items:center;gap:6px">
        <span class="ceo-bl-cnt">${pend} pendiente${pend!==1?'s':''}</span>
        ${lista.length-pend>0?`<span style="font-size:.65rem;color:var(--green);font-weight:600">${lista.length-pend} completada${lista.length-pend!==1?'s':''}</span>`:''}
      </div>
    </div>`;

  if(!lista.length){
    h+=`<div class="ceo-bl-empty">
      <span style="font-size:1.4rem">📭</span>
      <div>Sin tareas pendientes</div>
      <div style="font-size:.72rem;color:var(--g400);margin-top:2px">Las solicitudes del equipo aparecerán aquí</div>
    </div>`;
  } else {
    // Progreso global — barra
    const pct = lista.length ? Math.round((lista.length-pend)/lista.length*100) : 0;
    const barColor = pct>=75?'var(--green)':pct>=40?'var(--yellow)':'var(--gold)';
    h+=`<div class="ceo-bl-progress">
      <div class="ceo-bl-progress-bar" style="width:${pct}%;background:${barColor}"></div>
    </div>`;

    const pendItems=[...lista].filter(t=>!t.hecho);
    const doneItems=[...lista].filter(t=>t.hecho);
    [...pendItems,...doneItems].forEach(t=>{
      const prioColor={alta:'var(--red)',media:'var(--yellow)',baja:'#60a5fa'}[t.prio]||'var(--g300)';
      const prioLbl={alta:'Alta',media:'Media',baja:'Baja'}[t.prio]||'';
      const prioCls={alta:'ceo-prio-alta',media:'ceo-prio-media',baja:'ceo-prio-baja'}[t.prio]||'';
      const metaParts=[];
      if(t.solicitud_id){
        const sol=(S.solicitudes||[]).find(s=>s.id===t.solicitud_id);
        if(sol) metaParts.push(`📣 ${sol.colaborador}`);
      }
      if(t.hecho&&t.fecha_resolucion) metaParts.push(`Completada ${fd(t.fecha_resolucion)}`);
      else if(t.fecha_creacion) metaParts.push(`Creada ${fd(t.fecha_creacion)}`);
      const metaStr=metaParts.join(' · ');
      // SVG checkmark
      const svgCheck=`<svg class="ceo-chk-svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"/></svg>`;
      h+=`<div class="ceo-bl-item${t.hecho?' ceo-bl-done':''}" data-ceo-id="${t.id}">
        <button class="ceo-bl-check${t.hecho?' done':''}"
          onclick="toggleTarCEO(${t.id})"
          ontouchstart="this.classList.add('pressing')" ontouchend="this.classList.remove('pressing')"
          title="${t.hecho?'Marcar como pendiente':'Marcar como completada'}">${svgCheck}</button>
        <div class="ceo-bl-dot" style="background:${t.hecho?'var(--g200)':prioColor}"></div>
        <div class="ceo-bl-body">
          <span class="ceo-bl-txt">${t.desc}</span>
          <div class="ceo-bl-badges">
            ${prioLbl?`<span class="ceo-bl-prio-chip ${prioCls}">${prioLbl}</span>`:''}
            ${metaStr?`<span class="ceo-bl-meta">${metaStr}</span>`:''}
          </div>
        </div>
        <button class="ceo-bl-del" onclick="elimTarCEO(${t.id})" title="Eliminar">✕</button>
      </div>`;
    });
  }
  h+=`<div class="ceo-bl-add">
    <input class="ceo-bl-inp" id="ceo-bl-inp" type="text"
      placeholder="Nueva tarea estratégica… (Enter para agregar)"
      maxlength="120"
      onkeydown="if(event.key==='Enter')agregarTarCEO()">
    <button class="ceo-bl-add-btn" onclick="agregarTarCEO()">+</button>
  </div>`;
  h+=`</div>`;
  el.innerHTML=h;
}

function toggleTarCEO(id){
  const t=(S.tarCEO||[]).find(x=>x.id===id);
  if(!t) return;
  t.hecho=!t.hecho;
  if(t.hecho) t.fecha_resolucion=hoy();
  else delete t.fecha_resolucion;
  sv();
  _edaHash='';

  // ── Actualizar DOM in-place (sin re-render = sin auto-foco) ──
  const item=document.querySelector(`.ceo-bl-item[data-ceo-id="${id}"]`);
  const btn=item?.querySelector('.ceo-bl-check');
  const dot=item?.querySelector('.ceo-bl-dot');
  const txt=item?.querySelector('.ceo-bl-txt');

  if(item&&btn&&dot&&txt){
    if(t.hecho){
      // Animación: checkmark → flash verde → mover abajo
      btn.classList.add('done');
      item.classList.add('ceo-bl-done');
      // Flash verde en la fila
      item.classList.remove('ceo-bl-flash');
      void item.offsetWidth;
      item.classList.add('ceo-bl-flash');
      setTimeout(()=>item.classList.remove('ceo-bl-flash'),600);
      // Bounce en el botón
      btn.classList.add('ceo-chk-bounce');
      setTimeout(()=>btn.classList.remove('ceo-chk-bounce'),400);
      // Actualizar dot
      dot.style.background='var(--g200)';
      // Actualizar badge meta
      const badges=item.querySelector('.ceo-bl-badges');
      if(badges){
        const meta=badges.querySelector('.ceo-bl-meta');
        if(meta) meta.textContent='Completada '+fd(hoy());
        else badges.insertAdjacentHTML('beforeend',`<span class="ceo-bl-meta">Completada ${fd(hoy())}</span>`);
      }
      // Reordenar: mover al final tras animación
      setTimeout(()=>{
        // Re-render completo para reordenar, pero sin foco en ningún elemento
        const activeEl=document.activeElement;
        _renderCEOBacklog();
        // Asegurarse que no se enfoque nada
        if(activeEl&&activeEl!==document.body)activeEl.blur();
        // Actualizar barra progreso y header
      },550);
    } else {
      // Deshacer: quitar done
      btn.classList.remove('done');
      item.classList.remove('ceo-bl-done');
      dot.style.background=({alta:'var(--red)',media:'var(--yellow)',baja:'#60a5fa'}[t.prio]||'var(--g300)');
      // Actualizar meta
      const badges=item.querySelector('.ceo-bl-badges');
      if(badges){
        const meta=badges.querySelector('.ceo-bl-meta');
        if(meta) meta.textContent=t.fecha_creacion?'Creada '+fd(t.fecha_creacion):'';
      }
      setTimeout(()=>{
        const activeEl=document.activeElement;
        _renderCEOBacklog();
        if(activeEl&&activeEl!==document.body)activeEl.blur();
      },100);
    }
    // Actualizar header count inmediatamente
    const pend=(S.tarCEO||[]).filter(x=>!x.hecho).length;
    const cntEl=document.querySelector('.ceo-bl-cnt');
    if(cntEl) cntEl.textContent=`${pend} pendiente${pend!==1?'s':''}`;
    // Actualizar barra de progreso
    const total=(S.tarCEO||[]).length;
    const pct=total?Math.round((total-pend)/total*100):0;
    const barColor=pct>=75?'var(--green)':pct>=40?'var(--yellow)':'var(--gold)';
    const bar=document.querySelector('.ceo-bl-progress-bar');
    if(bar){bar.style.width=pct+'%';bar.style.background=barColor;}
    // Celebración si todas completadas
    if(pend===0&&total>0) _ceoBacklogCelebracion(total);
  } else {
    _renderCEOBacklog();
  }
}

/* Mini celebración cuando el CEO completa TODAS las tareas */
function _ceoBacklogCelebracion(total){
  setTimeout(()=>{
    const overlay=document.createElement('div');
    overlay.className='ceo-celeb-overlay';
    overlay.innerHTML=`
      <div class="ceo-celeb-card" onclick="this.parentElement.remove()">
        <div class="ceo-celeb-ico">⚡</div>
        <div class="ceo-celeb-ttl">¡Backlog limpio!</div>
        <div class="ceo-celeb-sub">${total} tarea${total!==1?'s':''} completada${total!==1?'s':''} · Excelente liderazgo</div>
        <div class="ceo-celeb-hint">Toca para cerrar</div>
      </div>`;
    overlay.addEventListener('click',()=>overlay.remove());
    document.body.appendChild(overlay);
    setTimeout(()=>overlay.remove(),3500);
  },200);
}

function elimTarCEO(id){
  S.tarCEO=(S.tarCEO||[]).filter(t=>t.id!==id);
  sv(); _renderCEOBacklog();
}

function agregarTarCEO(){
  const inp=document.getElementById('ceo-bl-inp');
  if(!inp) return;
  const desc=inp.value.trim();
  if(!desc){inp.focus();return;}
  // Soporte prefijo ! = alta prioridad
  const urgente=desc.startsWith('!');
  const descFinal=urgente?desc.slice(1).trim():desc;
  if(!descFinal){inp.focus();return;}
  const prio=urgente?'alta':'media';
  const newId=S.nid++;
  S.tarCEO.push({id:newId,desc:descFinal,hecho:false,fecha_creacion:hoy(),prio});
  inp.value='';
  sv(); _renderCEOBacklog();
  // Animación entrada en el nuevo item
  setTimeout(()=>{
    const newItem=document.querySelector(`.ceo-bl-item[data-ceo-id="${newId}"]`);
    if(newItem){
      newItem.classList.add('ceo-bl-entrada');
      setTimeout(()=>newItem.classList.remove('ceo-bl-entrada'),500);
    }
    inp.focus();
  },50);
}

/* ══ Analytics: KPIs Motor de Retos ══ */
function _renderKPIsRetos(){
  const el=document.getElementById('eda-kpi-retos');
  if(!el) return;
  const todos=S.retos||[];
  if(!todos.length){
    el.innerHTML=`<div style="font-family:var(--ff);font-size:.88rem;font-weight:600;
      color:var(--g800);margin-bottom:.5rem">Motor de Retos</div>
      <div style="font-size:.8rem;color:var(--g400);padding:.5rem 0">Sin retos registrados aún.</div>`;
    return;
  }

  const total=todos.length;
  const completados=todos.filter(r=>r.hecho).length;
  const pct=total?Math.round(completados/total*100):0;
  const barColor=pct>=75?'var(--green)':pct>=40?'var(--yellow)':'var(--red)';

  // % por tipo
  const porTipo={};
  Object.keys(_RETO_TIPOS).forEach(k=>{porTipo[k]={total:0,comp:0};});
  todos.forEach(r=>{
    if(!porTipo[r.tipo]) porTipo[r.tipo]={total:0,comp:0};
    porTipo[r.tipo].total++;
    if(r.hecho) porTipo[r.tipo].comp++;
  });
  const tipoRows=Object.entries(porTipo)
    .filter(([,v])=>v.total>0)
    .sort((a,b)=>b[1].comp-a[1].comp)
    .map(([tipo,v])=>{
      const t=_RETO_TIPOS[tipo]||{ico:'•',lbl:tipo};
      const p=v.total?Math.round(v.comp/v.total*100):0;
      const c=p>=75?'var(--green)':p>=40?'var(--yellow)':'var(--red)';
      return `<div style="display:flex;align-items:center;gap:.5rem;
          padding:.3rem 0;border-bottom:1px solid var(--g100);font-size:.76rem">
        <span style="width:52px;flex-shrink:0">${t.ico} ${t.lbl}</span>
        <div style="flex:1;height:5px;background:var(--g100);border-radius:3px;overflow:hidden">
          <div style="height:100%;width:${p}%;background:${c};border-radius:3px"></div>
        </div>
        <span style="font-weight:700;color:${c};width:32px;text-align:right">${p}%</span>
        <span style="color:var(--g400);font-size:.65rem">${v.comp}/${v.total}</span>
      </div>`;
    }).join('');

  // Top colaborador
  const porColab={};
  todos.forEach(r=>{
    if(!porColab[r.colaborador]) porColab[r.colaborador]={total:0,comp:0};
    porColab[r.colaborador].total++;
    if(r.hecho) porColab[r.colaborador].comp++;
  });
  const topColab=Object.entries(porColab).sort((a,b)=>b[1].comp-a[1].comp)[0];
  const topColabStr=topColab
    ?`${ini(topColab[0])} ${topColab[0]} · ${topColab[1].comp} reto${topColab[1].comp!==1?'s':''} completado${topColab[1].comp!==1?'s':''}`
    :'—';

  // Eventos más exigidos
  const retosEvento=todos.filter(r=>r.tipo==='evento'&&r.hecho).length;

  el.innerHTML=`
    <div style="font-family:var(--ff);font-size:1rem;font-weight:600;color:var(--g800);
      margin-bottom:.65rem">🏆 Motor de Retos</div>
    <!-- Barra global -->
    <div style="background:var(--white);border-radius:var(--rs);box-shadow:var(--sh);
      padding:.7rem .9rem;margin-bottom:.55rem">
      <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:.45rem">
        <span style="font-size:.78rem;font-weight:600;color:var(--g700)">Progreso global de retos</span>
        <span style="font-size:.72rem;font-weight:700;color:${barColor}">${completados}/${total} · ${pct}%</span>
      </div>
      <div style="height:7px;background:var(--g100);border-radius:4px;overflow:hidden">
        <div style="height:100%;width:${pct}%;background:${barColor};border-radius:4px;transition:width .4s"></div>
      </div>
    </div>
    <!-- KPI boxes -->
    <div class="kpi-op-row" style="margin-bottom:.55rem">
      <div class="kpi-op-box">
        <div class="kpi-op-n">${completados}</div>
        <div class="kpi-op-lbl">Retos completados</div>
      </div>
      <div class="kpi-op-box">
        <div class="kpi-op-n" style="color:${barColor}">${pct}%</div>
        <div class="kpi-op-lbl">Tasa de éxito</div>
      </div>
      <div class="kpi-op-box">
        <div class="kpi-op-n" style="font-size:1rem;padding-top:.2rem">${topColab?ini(topColab[0]):'—'}</div>
        <div class="kpi-op-lbl">Líder en retos</div>
      </div>
      <div class="kpi-op-box">
        <div class="kpi-op-n">${retosEvento}</div>
        <div class="kpi-op-lbl">Retos evento</div>
      </div>
    </div>
    <!-- Por tipo -->
    <div class="card" style="padding:.7rem .9rem">
      <div style="font-size:.72rem;font-weight:700;color:var(--g500);letter-spacing:.08em;
        text-transform:uppercase;margin-bottom:.5rem">Efectividad por tipo de reto</div>
      ${tipoRows||'<div style="color:var(--g400);font-size:.78rem">Sin datos aún</div>'}
    </div>`;
}

/* ══ Analytics: KPIs de gestión operativa CEO ══ */
function _renderKPIsOperativos(){
  const el=document.getElementById('eda-kpi-op');
  if(!el) return;
  const sols=S.solicitudes||[];
  const total=sols.length;
  const resueltas=sols.filter(s=>s.estado==='resuelta');
  const pendientes=sols.filter(s=>s.estado!=='resuelta').length;

  // Tiempo promedio resolución (días)
  let tiempoPromedio='—';
  if(resueltas.length){
    const tiempos=resueltas.filter(s=>s.fecha_resolucion).map(s=>{
      const d1=new Date(s.fecha_creacion+'T00:00:00');
      const d2=new Date(s.fecha_resolucion+'T00:00:00');
      return Math.max(0,Math.round((d2-d1)/(1000*60*60*24)));
    });
    if(tiempos.length)
      tiempoPromedio=Math.round(tiempos.reduce((a,b)=>a+b,0)/tiempos.length)+'d';
  }

  // Tipo más frecuente
  const contTipo={insumo:0,mejora:0,bloqueo:0};
  sols.forEach(s=>{if(contTipo[s.tipo]!==undefined)contTipo[s.tipo]++;});
  const topTipo=Object.entries(contTipo).sort((a,b)=>b[1]-a[1])[0];
  const topTipoLbl=topTipo&&topTipo[1]>0
    ?(SOL_TIPOS[topTipo[0]]?.ico||'•')+' '+topTipo[0]:'—';

  // Por colaborador
  const porColab={};
  sols.forEach(s=>{porColab[s.colaborador]=(porColab[s.colaborador]||0)+1;});
  const colabRows=Object.entries(porColab).sort((a,b)=>b[1]-a[1])
    .map(([emp,n])=>`<div style="display:flex;justify-content:space-between;
      padding:.35rem 0;border-bottom:1px solid var(--g100);font-size:.78rem">
      <span style="color:var(--g700)">${ini(emp)} ${emp}</span>
      <span style="font-weight:600;color:var(--g800)">${n}</span>
    </div>`).join('')||'<div style="color:var(--g400);font-size:.78rem;padding:.5rem 0">Sin datos aún</div>';

  // ── tarCEO progress ──
  const tarCEOList=S.tarCEO||[];
  const tarTot=tarCEOList.length;
  const tarDone=tarCEOList.filter(t=>t.hecho).length;
  const tarPend=tarTot-tarDone;
  const tarPct=tarTot?Math.round(tarDone/tarTot*100):0;
  const tarBarColor=tarPct>=75?'var(--green)':tarPct>=40?'var(--yellow)':'var(--red)';
  const tarProgressHtml=`<div style="background:var(--white);border-radius:var(--rs);box-shadow:var(--sh);
      padding:.7rem .9rem;margin-bottom:.55rem">
    <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:.45rem">
      <span style="font-size:.78rem;font-weight:600;color:var(--g700)">⚡ Tareas estratégicas CEO</span>
      <span style="font-size:.72rem;font-weight:700;color:${tarBarColor}">${tarDone}/${tarTot} · ${tarPct}%</span>
    </div>
    <div style="height:7px;background:var(--g100);border-radius:4px;overflow:hidden">
      <div style="height:100%;width:${tarPct}%;background:${tarBarColor};border-radius:4px;transition:width .4s"></div>
    </div>
    ${tarPend>0?`<div style="font-size:.68rem;color:var(--g400);margin-top:.4rem">${tarPend} tarea${tarPend!==1?'s':''} pendiente${tarPend!==1?'s':''}</div>`
      :(tarTot>0?'<div style="font-size:.68rem;color:var(--green);margin-top:.4rem">✓ Todas completadas</div>':'<div style="font-size:.68rem;color:var(--g400);margin-top:.4rem">Sin tareas registradas</div>')}
  </div>`;

  el.innerHTML=`
    <div style="font-family:var(--ff);font-size:1rem;font-weight:600;color:var(--g800);
      margin-bottom:.65rem">Gestión operativa del CEO</div>
    ${tarProgressHtml}
    <div class="kpi-op-row">
      <div class="kpi-op-box">
        <div class="kpi-op-n">${total}</div>
        <div class="kpi-op-lbl">Total solicitudes</div>
      </div>
      <div class="kpi-op-box">
        <div class="kpi-op-n" style="color:${pendientes>3?'var(--red)':'var(--g800)'}">${pendientes}</div>
        <div class="kpi-op-lbl">Sin resolver</div>
      </div>
      <div class="kpi-op-box">
        <div class="kpi-op-n">${tiempoPromedio}</div>
        <div class="kpi-op-lbl">Tiempo prom. resolución</div>
      </div>
      <div class="kpi-op-box">
        <div class="kpi-op-n" style="font-size:1rem">${topTipoLbl}</div>
        <div class="kpi-op-lbl">Tipo más frecuente</div>
      </div>
    </div>
    <div class="card" style="padding:.7rem .9rem">
      <div style="font-size:.72rem;font-weight:700;color:var(--g500);letter-spacing:.08em;
        text-transform:uppercase;margin-bottom:.5rem">Solicitudes por colaborador</div>
      ${colabRows}
    </div>`;
}

// ═══════════════════════════════════════════════════════════════
// 8b. REASIGNACIÓN AUTOMÁTICA — tareas incompletas del día anterior
// ═══════════════════════════════════════════════════════════════

/**
 * Busca las tareas personalizadas del día anterior que NO fueron completadas
 * y las copia al día de hoy marcándolas como "reprogramada".
 * Se ejecuta una sola vez por día (se guarda S._lastReaDate).
 */
function chequearReasignacion(){
  const hoyStr=hoy();
  // Solo una vez por día-calendario
  if(S._lastReaDate===hoyStr) return;

  const d=new Date(hoyStr+'T00:00:00');
  d.setDate(d.getDate()-1);
  const ayer=d.toISOString().slice(0,10);

  const EMPS=['Marlon','Ingrid','Isabella'];
  let totalMov=0;

  EMPS.forEach(emp=>{
    const tareasAyer=(S.tp[ayer]?.[emp])||[];
    if(!tareasAyer.length) return;

    const estAyer=getEstados(ayer,emp);
    const incompletas=tareasAyer.filter(t=>{
      const e=estAyer['p_'+t.id]||'';
      return e!=='green';  // no completada
    });
    if(!incompletas.length) return;

    if(!S.tp[hoyStr]) S.tp[hoyStr]={};
    if(!S.tp[hoyStr][emp]) S.tp[hoyStr][emp]=[];

    // Dedup por descripción (minúsculas)
    const existentes=new Set(S.tp[hoyStr][emp].map(t=>t.desc.toLowerCase().trim()));

    incompletas.forEach(t=>{
      if(existentes.has(t.desc.toLowerCase().trim())) return;
      const nueva={id:S.nid++, desc:t.desc, reprogramada:true, reprogramadaDe:ayer};
      if(t.hora)    nueva.hora=t.hora;
      if(t.urgente) nueva.urgente=true;
      S.tp[hoyStr][emp].push(nueva);
      existentes.add(t.desc.toLowerCase().trim());
      totalMov++;
    });
  });

  S._lastReaDate=hoyStr;
  if(totalMov>0) sv();
}

// ═══════════════════════════════════════════════════════════════
// 8. INIT — Arranque de la aplicación
// ═══════════════════════════════════════════════════════════════
(function(){
  limpiarDatosAntiguos();
  chequearReasignacion();  // mover incompletas de ayer a hoy
  if(!restaurarSesion()){
    showS('s-login');
  }
  // Auto-refresco del dashboard CEO cada 60 s
  setInterval(()=>{
    if(CR!=='ceo')return;
    const hoyEl=document.getElementById('ct-hoy');
    if(hoyEl&&!hoyEl.classList.contains('hidden'))renderCardsHoy();
  },60000);
  // Sincronizar S cuando otro tab/ventana guarda datos
  window.addEventListener('storage',e=>{
    if(e.key!=='pp_v5'||!e.newValue)return;
    try{
      const nuevo=JSON.parse(e.newValue);
      if(!nuevo)return;
      // Fusionar sólo datos de reporte y turnos para no perder estado local
      if(nuevo.rep)S.rep=nuevo.rep;
      if(nuevo.turnos)S.turnos=nuevo.turnos;
      if(nuevo.califs)S.califs=nuevo.califs;
      if(nuevo.tp)S.tp=nuevo.tp;
      if(CR==='ceo'){
        const hoyEl=document.getElementById('ct-hoy');
        if(hoyEl&&!hoyEl.classList.contains('hidden'))renderCardsHoy();
      }
    }catch(err){}
  });
})();

