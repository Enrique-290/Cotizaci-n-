import React, { useEffect, useMemo, useState } from 'react'

const money = (n)=> new Intl.NumberFormat('es-MX',{style:'currency',currency:'MXN'}).format(Number(n||0))
const todayISO = ()=> new Date().toISOString().slice(0,10)
const uid = ()=> Math.random().toString(36).slice(2,9)
const LS = { compras:'fact_demo_compras', facturas:'fact_demo_facturas', apiBase:'fact_api_base', token:'fact_token', tab:'fact_demo_tab' }

const useLocal = (key,initial)=>{
  const [state,set] = useState(()=>{ try{ const v=JSON.parse(localStorage.getItem(key)||'null'); return v??initial }catch{return initial}})
  useEffect(()=>{ localStorage.setItem(key, JSON.stringify(state)) }, [key,state])
  return [state,set]
}

function Sesion({apiBase,setApiBase,token,setToken}){
  const [email,setEmail]=useState('admin@demo.com')
  const [pass,setPass]=useState('x')
  const [msg,setMsg]=useState('')

  const base = useMemo(()=> (apiBase||'http://localhost:4000/api').replace(/\/$/,''), [apiBase])

  const seed = async()=>{
    setMsg('Creando usuario demo...')
    try{
      const r = await fetch(base+'/auth/seed',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({email, full_name:'Admin', role_name:'Admin'})})
      setMsg(r.ok ? 'Usuario demo creado (o ya existía).' : 'Seed error: '+await r.text())
    }catch(e){ setMsg('Seed error: '+e.message) }
  }
  const login = async()=>{
    setMsg('Iniciando sesión...')
    try{
      const r = await fetch(base+'/auth/login',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({email,password:pass})})
      if(!r.ok){ setMsg('Login error: '+await r.text()); return }
      const j = await r.json()
      setToken(j.token); setMsg('Login OK')
    }catch(e){ setMsg('Login error: '+e.message) }
  }

  return (
    <div className="card">
      <h2>🔐 Sesión</h2>
      <div className="row">
        <div className="col-6"><label>API Base</label><input value={apiBase} onChange={e=>setApiBase(e.target.value)} placeholder="http://localhost:4000/api"/></div>
        <div className="col-6"><label>Token</label><input value={token} onChange={e=>setToken(e.target.value)} placeholder="pegar token"/></div>
        <div className="col-6"><label>Email</label><input value={email} onChange={e=>setEmail(e.target.value)}/></div>
        <div className="col-6"><label>Contraseña</label><input type="password" value={pass} onChange={e=>setPass(e.target.value)}/></div>
        <div className="col-12 actions right">
          <button className="btn btn-outline" onClick={seed}>Crear usuario demo</button>
          <button className="btn btn-primary" onClick={login}>Iniciar sesión</button>
        </div>
        <div className="small">{msg}</div>
      </div>
    </div>
  )
}

function Compras({compras,setCompras,enviarAFacturar}){
  const [q,setQ]=useState('')
  const xs = compras.filter(c=>[c.proveedor,c.orden,c.concepto,c.socio].some(v=>(v||'').toLowerCase().includes(q.toLowerCase())))
  const guardarCompra = (e)=>{
    e.preventDefault()
    const fd = new FormData(e.target)
    const c = { id:uid(), proveedor:fd.get('proveedor')?.trim(), orden:fd.get('orden')?.trim(), fecha:fd.get('fecha')||todayISO(), costo:Number(fd.get('costo')||0),
      formaPago:fd.get('formaPago'), ult4:fd.get('ult4')?.trim(), socio:fd.get('socio')?.trim(), concepto:fd.get('concepto')?.trim(),
      facturado:false, cancelada:false }
    setCompras([c, ...compras]); e.target.reset(); alert('Compra guardada')
  }
  const eliminar = id => { if(!confirm('¿Eliminar compra?'))return; setCompras(compras.filter(x=>x.id!==id)) }
  const toggle = id => { setCompras(compras.map(x=> x.id===id ? {...x,facturado:!x.facturado}:x)) }

  return (
    <div className="split">
      <form className="card" onSubmit={guardarCompra}>
        <h2>🧾 Registrar compra de servicio</h2>
        <div className="row">
          <div className="col-6"><label>Proveedor</label><input name="proveedor" required/></div>
          <div className="col-3"><label>Nº de orden</label><input name="orden"/></div>
          <div className="col-3"><label>Fecha</label><input type="date" name="fecha" required/></div>
          <div className="col-4"><label>Costo</label><input name="costo" type="number" step="0.01" required/></div>
          <div className="col-4"><label>Forma de pago</label><select name="formaPago"><option>Tarjeta</option><option>Transferencia</option><option>Efectivo</option></select></div>
          <div className="col-4"><label>Últimos 4</label><input name="ult4" maxLength="4"/></div>
          <div className="col-6"><label>Socio</label><input name="socio"/></div>
          <div className="col-6"><label>Concepto</label><input name="concepto"/></div>
          <div className="col-12 actions right">
            <button className="btn btn-outline" type="reset">Limpiar</button>
            <button className="btn btn-primary" type="submit">Guardar compra</button>
          </div>
        </div>
      </form>

      <div className="card">
        <h3 style={{margin:0}}>📚 Compras registradas</h3>
        <div className="row">
          <div className="col-6"><label>Buscar</label><input value={q} onChange={e=>setQ(e.target.value)} placeholder="Proveedor, orden..."/></div>
        </div>
        <div style={{overflow:'auto'}}>
          <table className="table" id="tablaCompras">
            <thead><tr><th>Fecha</th><th>Proveedor</th><th>Orden</th><th>Concepto</th><th>Costo</th><th>Pago</th><th>Socio</th><th>Estado</th><th style={{width:260}}></th></tr></thead>
            <tbody>
              {xs.map(c=>(
                <tr key={c.id}>
                  <td>{c.fecha}</td><td>{c.proveedor}</td><td>{c.orden||''}</td><td>{c.concepto||''}</td>
                  <td>{money(c.costo)}</td><td>{c.formaPago}{c.ult4?` • ${c.ult4}`:''}</td><td>{c.socio||''}</td>
                  <td>{c.cancelada? <span className="chip chip-cancel">Cancelada</span> : (c.facturado? <span className="chip chip-ok">Facturado</span> : <span className="chip chip-warn">Pendiente</span>)}</td>
                  <td>
                    <div className="actions">
                      <button className="btn btn-outline btn-sm" onClick={()=>enviarAFacturar(c.id)}>Facturar</button>
                      <button className="btn btn-outline btn-sm" onClick={()=>toggle(c.id)}>{c.facturado?'Marcar pendiente':'Marcar facturado'}</button>
                      <button className="btn btn-outline btn-sm" onClick={()=>eliminar(c.id)}>Eliminar</button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}

function Facturacion({compras,facturas,setFacturas,selectCompra,setTab,apiBase,token}){
  const [form,setForm]=useState({concepto:'',costo:'',margen:20,precioFinal:'',fechaEmision:todayISO(),rfc:'',razon:'',usoCFDI:'G03',metodoPago:'PUE',formaPago:'03',emailCliente:'',notas:''})
  useEffect(()=>{ if(selectCompra){ const c=compras.find(x=>x.id===selectCompra); if(c){ setForm(f=>({...f, concepto:c.concepto||`Servicio de ${c.proveedor}`, costo:c.costo||0, margen:20, fechaEmision:todayISO()})) } } },[selectCompra,compras])
  const calcular=()=>{ const precio = Number(form.costo||0) * (1+ Number(form.margen||0)/100); setForm({...form, precioFinal:precio.toFixed(2)}) }
  const guardar=(e)=>{
    e.preventDefault()
    const fac = { id:uid(), compraId:selectCompra||null, concepto:form.concepto?.trim(), costo:Number(form.costo||0), margen:Number(form.margen||0),
      precioFinal:Number(form.precioFinal||0), fechaEmision:form.fechaEmision||todayISO(), rfc:(form.rfc||'').toUpperCase(), razon:form.razon?.trim(),
      usoCFDI:form.usoCFDI, metodoPago:form.metodoPago, formaPago:form.formaPago, emailCliente:form.emailCliente||'', notas:form.notas||'',
      pagoEstado:'pendiente', cancelada:false, uuid:null }
    setFacturas([fac, ...facturas])
    alert('Factura guardada (demo).')
  }
  const subirCFDI = async()=>{
    const xml = document.getElementById('xmlFile').files[0]; const pdf=document.getElementById('pdfFile').files[0];
    if(!xml){ alert('Selecciona un XML'); return }
    const fd=new FormData(); fd.append('xml',xml); if(pdf) fd.append('pdf',pdf);
    try{
      const r=await fetch((apiBase||'http://localhost:4000/api').replace(/\/$/,'')+'/facturas/cargar',{method:'POST',headers: token?{'Authorization':'Bearer '+token}:{}, body:fd})
      if(!r.ok){ alert('Error: '+ await r.text()); return }
      const data=await r.json()
      const fac = { id:data.id||uid(), compraId:null, concepto:(data.conceptos?.[0]?.descripcion)||'SERVICIO', costo:data.totales?.subtotal||0, margen:0, precioFinal:data.totales?.total||0,
        fechaEmision:data.fecha||todayISO(), rfc:data.emisor?.rfc||'', razon:data.receptor?.nombre||'', usoCFDI:'G03', metodoPago:'PUE', formaPago:'03',
        pagoEstado:'pendiente', cancelada:false, uuid:data.uuid||null }
      setFacturas([fac, ...facturas])
      const box=document.getElementById('cfdiPreview')
      box.style.display='block'
      box.innerHTML = `<h4 style="margin-top:0">CFDI importado</h4>
        <p><b>UUID:</b> ${data.uuid||'(s/n)'} • <b>Fecha:</b> ${data.fecha||''}</p>
        <p><b>Emisor:</b> ${data.emisor?.nombre||''} (${data.emisor?.rfc||''})</p>
        <p><b>Receptor:</b> ${data.receptor?.nombre||''} (${data.receptor?.rfc||''})</p>
        <p><b>Totales:</b> ${money(data.totales?.subtotal||0)} → ${money(data.totales?.total||0)}</p>`
    }catch(e){ alert('No se pudo conectar: '+e.message) }
  }

  return (
    <div className="split">
      <form className="card" onSubmit={guardar}>
        <h2>🧮 Emitir factura al cliente</h2>
        <div className="row">
          <div className="col-6"><label>Tomar datos desde compra</label>
            <select value={selectCompra||''} onChange={e=>setTab('facturacion', e.target.value)}>
              <option value="">— Selecciona una compra —</option>
              {compras.map(c=><option key={c.id} value={c.id}>{c.fecha} • {c.proveedor} • {c.concepto||''}</option>)}
            </select>
          </div>
          <div className="col-6"><label>Concepto</label><input value={form.concepto} onChange={e=>setForm({...form,concepto:e.target.value})} required/></div>
          <div className="col-3"><label>Costo (MXN)</label><input type="number" step="0.01" value={form.costo} onChange={e=>setForm({...form,costo:e.target.value})}/></div>
          <div className="col-3"><label>Margen (%)</label><input type="number" step="0.01" value={form.margen} onChange={e=>setForm({...form,margen:e.target.value})}/></div>
          <div className="col-3"><label>Precio final (MXN)</label><input type="number" step="0.01" value={form.precioFinal} onChange={e=>setForm({...form,precioFinal:e.target.value})}/></div>
          <div className="col-3"><label>Fecha de emisión</label><input type="date" value={form.fechaEmision} onChange={e=>setForm({...form,fechaEmision:e.target.value})}/></div>

          <div className="col-4"><label>RFC</label><input value={form.rfc} onChange={e=>setForm({...form,rfc:e.target.value.toUpperCase()})} placeholder="XAXX010101000"/></div>
          <div className="col-8"><label>Razón social</label><input value={form.razon} onChange={e=>setForm({...form,razon:e.target.value})} placeholder="Nombre del cliente / empresa"/></div>

          <div className="col-4"><label>Uso CFDI</label>
            <select value={form.usoCFDI} onChange={e=>setForm({...form,usoCFDI:e.target.value})}>
              <option value="G03">G03 - Gastos en general</option>
              <option value="P01">P01 - Por definir</option>
              <option value="D01">D01 - Honorarios médicos</option>
            </select>
          </div>
          <div className="col-4"><label>Método de pago</label>
            <select value={form.metodoPago} onChange={e=>setForm({...form,metodoPago:e.target.value})}>
              <option value="PUE">PUE - Pago en una sola exhibición</option>
              <option value="PPD">PPD - Pago en parcialidades o diferido</option>
            </select>
          </div>
          <div className="col-4"><label>Forma de pago</label>
            <select value={form.formaPago} onChange={e=>setForm({...form,formaPago:e.target.value})}>
              <option value="03">03 - Transferencia</option>
              <option value="01">01 - Efectivo</option>
              <option value="04">04 - Tarjeta de crédito</option>
              <option value="28">28 - Tarjeta de débito</option>
            </select>
          </div>

          <div className="col-6"><label>Email del cliente</label><input value={form.emailCliente} onChange={e=>setForm({...form,emailCliente:e.target.value})} placeholder="cliente@dominio.com"/></div>
          <div className="col-6"><label>Notas / Observaciones</label><input value={form.notas} onChange={e=>setForm({...form,notas:e.target.value})} placeholder="Observaciones"/></div>

          <div className="col-12 actions right">
            <button className="btn btn-outline" type="button" onClick={calcular}>Calcular precio final</button>
            <button className="btn btn-primary" type="submit">Guardar factura (demo)</button>
          </div>
        </div>
      </form>

      <div className="card">
        <h3 style={{margin:0}}>📤 Importar CFDI (XML+PDF) → Crear factura</h3>
        <div className="row">
          <div className="col-6"><label>XML</label><input id="xmlFile" type="file" accept=".xml"/></div>
          <div className="col-6"><label>PDF (opcional)</label><input id="pdfFile" type="file" accept=".pdf"/></div>
          <div className="col-12 actions right"><button className="btn btn-primary" type="button" onClick={subirCFDI}>Subir CFDI e integrar</button></div>
        </div>
        <div id="cfdiPreview" className="card" style={{display:'none'}}></div>
      </div>
    </div>

    <Facturas facturas={facturas} setFacturas={setFacturas} />
  )
}

function Facturas({facturas,setFacturas}){
  const [q,setQ]=useState('')
  const xs = facturas.filter(x=>[x.rfc,x.razon,x.concepto,x.uuid].some(v=>(v||'').toLowerCase().includes(q.toLowerCase())))
  const togglePago = id => setFacturas(facturas.map(f=> f.id===id ? {...f, pagoEstado: f.pagoEstado==='pagada'?'pendiente':'pagada'} : f))
  const cancelar = id => { if(!confirm('¿Cancelar en SAT? (demo)'))return; setFacturas(facturas.map(f=> f.id===id ? {...f, cancelada:true} : f)) }
  const eliminar = id => { if(!confirm('¿Eliminar factura?'))return; setFacturas(facturas.filter(f=>f.id!==id)) }

  return (
    <div className="card">
      <h3>🗂️ Facturas emitidas</h3>
      <div className="row">
        <div className="col-6"><label>Buscar</label><input value={q} onChange={e=>setQ(e.target.value)} placeholder="RFC, razón, concepto..."/></div>
      </div>
      <div style={{overflow:'auto'}}>
        <table className="table">
          <thead><tr><th>Fecha</th><th>RFC</th><th>Cliente</th><th>Concepto</th><th>Subtotal</th><th>Total</th><th>Pago</th><th>SAT</th><th style={{width:260}}></th></tr></thead>
          <tbody>
            {xs.map(f=>(
              <tr key={f.id}>
                <td>{f.fechaEmision||''}</td><td>{f.rfc||''}</td><td>{f.razon||''}</td><td>{f.concepto||''}</td>
                <td>{money(f.costo)}</td><td>{money(f.precioFinal)}</td>
                <td>{f.pagoEstado==='pagada'?<span className="chip chip-ok">Pagada</span>:<span className="chip chip-warn">Pendiente</span>}</td>
                <td>{f.cancelada?<span className="chip chip-cancel">Cancelada</span>:<span className="chip chip-ok">Vigente</span>}</td>
                <td>
                  <div className="actions">
                    <button className="btn btn-outline btn-sm" onClick={()=>togglePago(f.id)}>{f.pagoEstado==='pagada'?'Marcar pendiente':'Marcar pagada'}</button>
                    <button className="btn btn-danger btn-sm" disabled={!!f.cancelada} onClick={()=>cancelar(f.id)}>Cancelar en SAT (demo)</button>
                    <button className="btn btn-outline btn-sm" onClick={()=>eliminar(f.id)}>Eliminar</button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}

function Reportes({compras,facturas}){
  const [desde,setDesde]=useState(todayISO())
  const [hasta,setHasta]=useState(todayISO())

  const filtCompras = compras.filter(c=>{const d=new Date(c.fecha); const a=new Date(desde); const b=new Date(hasta); b.setHours(23,59,59,999); return d>=a && d<=b})
  const filtFacturas = facturas.filter(f=>{const d=new Date(f.fechaEmision||new Date()); const a=new Date(desde); const b=new Date(hasta); b.setHours(23,59,59,999); return d>=a && d<=b})

  const totalComprado = filtCompras.reduce((a,b)=>a+Number(b.costo||0),0)
  const totalFacturado = filtFacturas.reduce((a,b)=>a+Number(b.precioFinal||0),0)
  const margen  = filtFacturas.reduce((a,b)=>a+(Number(b.precioFinal||0)-Number(b.costo||0)),0)
  const pendientes = filtCompras.filter(c=>!c.facturado).length

  const rows = filtCompras.map(c=>{
    const relacionadas = filtFacturas.filter(f=>f.compraId===c.id)
    const totalFac = relacionadas.reduce((a,b)=>a+Number(b.precioFinal||0),0)
    const totalMarg= relacionadas.reduce((a,b)=>a+(Number(b.precioFinal||0)-Number(b.costo||0)),0)
    return {fecha:c.fecha, proveedor:c.proveedor, orden:c.orden||'', concepto:c.concepto||'', costo:c.costo, facturado:totalFac, margen:totalMarg, estado:c.cancelada?'Cancelada':(c.facturado?'Facturado':'Pendiente')}
  })

  return (
    <div className="card">
      <h2>📈 Reporte y conciliación</h2>
      <div className="row">
        <div className="col-4"><label>Desde</label><input type="date" value={desde} onChange={e=>setDesde(e.target.value)}/></div>
        <div className="col-4"><label>Hasta</label><input type="date" value={hasta} onChange={e=>setHasta(e.target.value)}/></div>
      </div>
      <div className="row" style={{margin:'12px 0'}}>
        <div className="col-3 card"><div className="small">Total comprado</div><div style={{fontWeight:800,fontSize:22}}>{money(totalComprado)}</div></div>
        <div className="col-3 card"><div className="small">Total facturado</div><div style={{fontWeight:800,fontSize:22}}>{money(totalFacturado)}</div></div>
        <div className="col-3 card"><div className="small">Margen</div><div style={{fontWeight:800,fontSize:22}}>{money(margen)}</div></div>
        <div className="col-3 card"><div className="small">Pendientes</div><div style={{fontWeight:800,fontSize:22}}>{pendientes}</div></div>
      </div>

      <div style={{overflow:'auto'}}>
        <table className="table" id="tablaReporte">
          <thead><tr><th>Fecha</th><th>Proveedor</th><th>Orden</th><th>Concepto</th><th>Costo</th><th>Facturado</th><th>Margen</th><th>Estado</th></tr></thead>
          <tbody>
            {rows.map((r,i)=>(
              <tr key={i}><td>{r.fecha}</td><td>{r.proveedor}</td><td>{r.orden}</td><td>{r.concepto}</td><td>{money(r.costo)}</td><td>{money(r.facturado)}</td><td>{money(r.margen)}</td><td>{r.estado}</td></tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}

export default function App(){
  const [tab,setTabState] = useState(()=> localStorage.getItem(LS.tab) || 'compra')
  const setTab = (t, compraId)=>{ setTabState(t); localStorage.setItem(LS.tab,t); if(compraId) setSelectCompra(compraId) }

  const [compras,setCompras]   = useLocal(LS.compras, [])
  const [facturas,setFacturas] = useLocal(LS.facturas, [])
  const [apiBase,setApiBase]   = useState( localStorage.getItem(LS.apiBase)||'' )
  const [token,setToken]       = useState( localStorage.getItem(LS.token)||'' )
  const [selectCompra,setSelectCompra] = useState('')

  useEffect(()=>{ localStorage.setItem(LS.apiBase, apiBase||'') }, [apiBase])
  useEffect(()=>{ localStorage.setItem(LS.token, token||'') }, [token])

  useEffect(()=>{ document.title = 'Facturación – UI v3 (demo SAT)' }, [])

  return (
    <div>
      <style>{`
        :root{ --primary:#e11; --muted:#f6f7fb; --border:#e5e7eb }
        *{box-sizing:border-box;font-family:Inter,system-ui,-apple-system,"Segoe UI",Roboto,Arial,sans-serif}
        body{margin:0;background:var(--muted);color:#222}
        header{position:sticky;top:0;background:#fff;border-bottom:1px solid var(--border);z-index:10}
        .bar{max-width:1200px;margin:auto;display:flex;align-items:center;gap:12px;padding:12px 16px}
        h1{font-size:20px;margin:0;font-weight:800;color:#1f2937}
        nav{margin-left:auto;display:flex;gap:8px;flex-wrap:wrap}
        nav button{border:1px solid var(--border);background:#fff;padding:10px 14px;border-radius:12px;cursor:pointer;font-weight:800}
        nav button.active{background:var(--primary);color:#fff;border-color:var(--primary)}
        main{max-width:1200px;margin:20px auto;padding:0 16px}
        .card{background:#fff;border:1px solid var(--border);border-radius:18px;padding:18px;margin:12px 0;box-shadow:0 2px 10px rgba(17,17,17,.06)}
        .row{display:grid;grid-template-columns:repeat(12,1fr);gap:12px}
        .col-6{grid-column:span 6}.col-4{grid-column:span 4}.col-3{grid-column:span 3}.col-8{grid-column:span 8}.col-12{grid-column:span 12}
        label{font-size:12px;font-weight:800;color:#374151;margin-bottom:6px;display:block}
        input,select,textarea{width:100%;padding:12px;border:1px solid var(--border);border-radius:12px;background:#fff;font-size:14px}
        .actions{display:flex;gap:10px;flex-wrap:wrap}
        .btn{border:0;border-radius:12px;padding:10px 14px;font-weight:800;cursor:pointer}
        .btn-sm{padding:8px 12px}.btn-danger{background:#b91c1c;color:#fff}
        .btn-primary{background:var(--primary);color:#fff}.btn-outline{background:#fff;border:1px solid var(--border)}
        .table{width:100%;border-collapse:collapse}.table th,.table td{padding:10px;border-bottom:1px solid #eee;text-align:left;font-size:14px;vertical-align:middle}
        .chip{padding:4px 8px;border-radius:999px;font-size:12px;font-weight:800;display:inline-block}
        .chip-ok{background:#e6ffed;color:#067d2e;border:1px solid #b8f7c8}
        .chip-warn{background:#fff7e6;color:#8a5800;border:1px solid #ffe1a8}
        .chip-cancel{background:#fee2e2;color:#991b1b;border:1px solid #fecaca}
        .split{display:grid;grid-template-columns:1.2fr .8fr;gap:16px}
        @media (max-width:980px){.row{grid-template-columns:repeat(6,1fr)}.col-6{grid-column:span 6}.col-4{grid-column:span 6}.col-3{grid-column:span 3}.split{grid-template-columns:1fr}}
        .small{font-size:12px;color:#666}
      `}</style>

      <header><div className="bar">
        <h1>💼 Facturación (UI + CFDI) v3</h1>
        <nav>
          <button className={tab==='compra'?'active':''} onClick={()=>setTab('compra')}>Compra</button>
          <button className={tab==='facturacion'?'active':''} onClick={()=>setTab('facturacion')}>Facturación</button>
          <button className={tab==='reportes'?'active':''} onClick={()=>setTab('reportes')}>Reportes</button>
          <button className={tab==='sesion'?'active':''} onClick={()=>setTab('sesion')}>Sesión</button>
        </nav>
      </div></header>

      <main>
        {tab==='sesion' && <Sesion apiBase={apiBase} setApiBase={setApiBase} token={token} setToken={setToken} />}
        {tab==='compra' && <Compras compras={compras} setCompras={setCompras} enviarAFacturar={(id)=>{setSelectCompra(id); setTab('facturacion')}} />}
        {tab==='facturacion' && <Facturacion compras={compras} facturas={facturas} setFacturas={setFacturas} selectCompra={selectCompra} setTab={setTab} apiBase={apiBase} token={token} />}
        {tab==='reportes' && <Reportes compras={compras} facturas={facturas} />}
      </main>
    </div>
  )
}
