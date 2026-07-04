import React, { useState, useEffect, useRef } from 'react'
import axios from 'axios'
import { useApp } from '../context/AppContext.jsx'

// ── Helpers ───────────────────────────────────────────────────────────────────
function av(name = '?', sz = 36) {
  const i = (name || '?').trim().split(' ').map(w => w[0]?.toUpperCase() || '').join('').slice(0, 2) || '?'
  return <div style={{ width: sz, height: sz, borderRadius: '50%', flexShrink: 0, background: 'linear-gradient(135deg,#6366f1,#8b5cf6)', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: sz * 0.36, color: '#fff' }}>{i}</div>
}

export function toast(msg, ok = true) {
  const el = document.createElement('div')
  el.style.cssText = `position:fixed;bottom:22px;right:22px;z-index:9999;background:${ok ? 'rgba(16,185,129,.95)' : 'rgba(239,68,68,.95)'};color:#fff;padding:11px 18px;border-radius:11px;font-size:13px;font-weight:500;box-shadow:0 7px 26px rgba(0,0,0,.28);font-family:'DM Sans',sans-serif;max-width:320px`
  el.textContent = msg; document.body.appendChild(el); setTimeout(() => el.remove(), 3200)
}

const Card = ({ children, style, onClick }) => <div className="card" style={style} onClick={onClick}>{children}</div>
const Tag = ({ children, type = 'p' }) => <span className={`tag t-${type}`}>{children}</span>
const Spin = () => <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 44 }}><div className="spinner" /></div>

// ── Cleanup registry — stops camera/mic/timers on page change ─────────────────
const _cleanups = {}
function regClean(key, fn) { _cleanups[key] = fn }
function runClean(key) { if (_cleanups[key]) { _cleanups[key](); delete _cleanups[key] } }
function runAllClean() { Object.keys(_cleanups).forEach(k => { _cleanups[k](); delete _cleanups[k] }) }

// ── Nav ───────────────────────────────────────────────────────────────────────
const SNAV = [
  { s: 'Main',          items: [{ id:'dash', ic:'📊', l:'Dashboard'     }, { id:'profile',     ic:'👤', l:'My Profile'     }] },
  { s: 'Mentorship',    items: [{ id:'mentors', ic:'🎓', l:'Find Mentors'}, { id:'connections', ic:'🤝', l:'Connections'    }, { id:'inbox',       ic:'📬', l:'Inbox'          }] },
  { s: 'Communication', items: [{ id:'messages', ic:'💬', l:'Messages'   }, { id:'aibot',       ic:'🤖', l:'AlumniBot'       }] },
  { s: 'Career',        items: [{ id:'resume', ic:'📄', l:'Resume Builder'}, { id:'jobs',       ic:'💼', l:'Jobs Board'      }, { id:'interview',   ic:'🎙️', l:'AI Interview'    }] },
  { s: 'Community',     items: [{ id:'events', ic:'📅', l:'Events'        }, { id:'forum',      ic:'💭', l:'Forum'           }] },
  { s: 'More',          items: [{ id:'analytics', ic:'📈', l:'Analytics'  }, { id:'quiz',       ic:'🧠', l:'Quiz'            }] },
]
const ANAV = [
  { s: 'Main',          items: [{ id:'dash', ic:'📊', l:'Dashboard' }, { id:'profile', ic:'👤', l:'My Profile' }] },
  { s: 'Mentorship',    items: [{ id:'inbox', ic:'📬', l:'Inbox'    }, { id:'connections', ic:'🤝', l:'My Mentees' }] },
  { s: 'Communication', items: [{ id:'messages', ic:'💬', l:'Messages' }, { id:'aibot', ic:'🤖', l:'AlumniBot' }] },
  { s: 'Community',     items: [{ id:'jobs', ic:'💼', l:'Post Jobs'  }, { id:'events', ic:'📅', l:'Events' }, { id:'forum', ic:'💭', l:'Forum' }] },
  { s: 'More',          items: [{ id:'analytics', ic:'📈', l:'Analytics' }, { id:'quiz', ic:'🧠', l:'Quiz' }] },
]
const TITLES = { dash:'Dashboard', profile:'My Profile', mentors:'Find Mentors', connections:'Connections', inbox:'Inbox', messages:'Messages', aibot:'AlumniBot AI', resume:'Resume Builder', jobs:'Jobs Board', interview:'AI Interview', events:'Events', forum:'Forum', analytics:'Analytics', quiz:'Weekly Quiz' }

// ── Shell ─────────────────────────────────────────────────────────────────────
export default function Dashboard() {
  const { user, setUser, mode, setMode, theme, setTheme, logout } = useApp()
  const [page, setPage] = useState('dash')
  const [col, setCol] = useState(false)
  const nav = user.role === 'alumni' ? ANAV : SNAV

  // FIX: stop camera/mic/timers before switching page
  function go(p) { runAllClean(); setPage(p) }
  function goHVS() { runAllClean(); setMode('hvs') }

  return (
    <div style={{ display: 'flex', height: '100vh', background: 'var(--bg)' }}>
      {/* Sidebar */}
      <div style={{ width: col ? 60 : 228, minWidth: col ? 60 : 228, background: 'var(--bg2)', borderRight: '1px solid var(--cb)', display: 'flex', flexDirection: 'column', overflow: 'hidden', transition: 'width .22s', flexShrink: 0 }}>
        <div style={{ padding: '14px 12px', borderBottom: '1px solid var(--cb)', display: 'flex', alignItems: 'center', gap: 9 }}>
          <div style={{ width: 32, height: 32, background: 'linear-gradient(135deg,#6366f1,#8b5cf6)', borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'Syne', fontWeight: 800, fontSize: 13, color: '#fff', flexShrink: 0 }}>A</div>
          {!col && <div><div style={{ fontFamily: 'Syne', fontWeight: 700, fontSize: 13 }}>AlumniConnect</div><div style={{ fontSize: 10, color: 'var(--t3)' }}>{user.role === 'alumni' ? 'Alumni Mentor' : 'Student'}</div></div>}
        </div>
        <div style={{ flex: 1, overflowY: 'auto', padding: '6px 0' }}>
          {nav.map(s => (
            <div key={s.s}>
              {!col && <div style={{ padding: '9px 10px 2px', fontSize: 10, fontWeight: 600, color: 'var(--t3)', textTransform: 'uppercase', letterSpacing: '.9px' }}>{s.s}</div>}
              {s.items.map(it => (
                <button key={it.id} onClick={() => go(it.id)} title={col ? it.l : ''}
                  style={{ display: 'flex', alignItems: 'center', gap: 9, padding: '8px 11px', margin: '1px 5px', borderRadius: 9, cursor: 'pointer', fontSize: 13, width: 'calc(100% - 10px)', textAlign: 'left', fontFamily: 'DM Sans', transition: 'all .15s', whiteSpace: 'nowrap', overflow: 'hidden',
                    // FIX: active state correctly uses React `page` state, always accurate
                    border: page === it.id ? '1px solid rgba(99,102,241,.25)' : '1px solid transparent',
                    background: page === it.id ? 'rgba(99,102,241,.12)' : 'transparent',
                    color: page === it.id ? 'var(--ac)' : 'var(--t2)',
                  }}>
                  <span style={{ fontSize: 15, flexShrink: 0 }}>{it.ic}</span>
                  {!col && <span>{it.l}</span>}
                </button>
              ))}
            </div>
          ))}
        </div>
        <div style={{ padding: 10, borderTop: '1px solid var(--cb)', display: 'flex', flexDirection: 'column', gap: 6 }}>
          <button onClick={goHVS} style={{ width: '100%', padding: 9, background: 'linear-gradient(135deg,rgba(30,27,75,.9),rgba(49,46,129,.9))', border: '1px solid rgba(99,102,241,.28)', borderRadius: 9, color: '#e2e8f0', fontSize: 12, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 7, fontFamily: 'Syne', fontWeight: 600 }}>
            <span>🚀</span>{!col && <div style={{ textAlign: 'left', flex: 1 }}><div style={{ fontSize: 9, opacity: .7 }}>Switch to</div><span style={{ background: 'linear-gradient(135deg,#6366f1,#8b5cf6)', padding: '1px 7px', borderRadius: 5, fontSize: 10 }}>HVS.Ai</span></div>}
          </button>
          <button onClick={logout} style={{ width: '100%', padding: 8, background: 'rgba(239,68,68,.09)', border: '1px solid rgba(239,68,68,.2)', borderRadius: 9, color: '#f87171', fontSize: 12, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 7, fontFamily: 'Syne', fontWeight: 600 }}>
            <span>🚪</span>{!col && <span>Logout</span>}
          </button>
        </div>
      </div>

      {/* Content */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden', minWidth: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 11, padding: '11px 22px', background: 'var(--bg2)', borderBottom: '1px solid var(--cb)', flexShrink: 0 }}>
          <button onClick={() => setCol(c => !c)} style={{ background: 'none', border: 'none', color: 'var(--t2)', fontSize: 18, cursor: 'pointer', padding: 2 }}>☰</button>
          <div style={{ fontFamily: 'Syne', fontWeight: 700, fontSize: 17 }}>{TITLES[page] || page}</div>
          <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 9 }}>
            <button onClick={() => setTheme(t => t === 'dark' ? 'light' : 'dark')} style={{ background: 'var(--card)', border: '1px solid var(--cb)', borderRadius: 8, padding: '6px 11px', cursor: 'pointer', fontSize: 13, color: 'var(--t)' }}>{theme === 'dark' ? '🌙' : '☀️'}</button>
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: 5, padding: '5px 13px', background: 'rgba(245,158,11,.15)', border: '1px solid rgba(245,158,11,.25)', borderRadius: 20, fontFamily: 'Syne', fontWeight: 700, color: 'var(--gold)', fontSize: 13 }}>⭐ {user.pts || 0}</div>
            {av(user.name, 34)}
          </div>
        </div>
        <div style={{ flex: 1, padding: 22, overflowY: 'auto' }}>
          <PageRouter page={page} go={go} user={user} setUser={setUser} />
        </div>
      </div>
    </div>
  )
}

function PageRouter({ page, go, user, setUser }) {
  const p = { user, setUser, go }
  switch (page) {
    case 'dash':        return <DashPage {...p} />
    case 'profile':     return <ProfilePage {...p} />
    case 'mentors':     return <MentorsPage {...p} />
    case 'connections': return <ConnsPage {...p} />
    case 'inbox':       return <InboxPage {...p} />
    case 'messages':    return <MsgsPage {...p} />
    case 'aibot':       return <BotPage {...p} />
    case 'resume':      return <ResumePage {...p} />
    case 'jobs':        return <JobsPage {...p} />
    case 'interview':   return <InterviewPage {...p} />
    case 'events':      return <EventsPage {...p} />
    case 'forum':       return <ForumPage {...p} />
    case 'analytics':   return <AnalyticsPage {...p} />
    case 'quiz':        return <QuizPage {...p} />
    default:            return <DashPage {...p} />
  }
}

// ── Dashboard Page ────────────────────────────────────────────────────────────
function DashPage({ user, go }) {
  const [d, setD] = useState(null)
  useEffect(() => { axios.get(`/api/dashboard/${user.uid}`).then(r => setD(r.data)).catch(() => setD({})) }, [])
  if (!d) return <Spin />
  return (
    <div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 10, marginBottom: 18 }}>
        {[['Best Match', d.topM ? d.topM+'%':'—','var(--ac)'],['Connections',d.conns??0,'var(--green)'],['Pending',d.pending??0,'var(--gold)'],['Skills',d.skills??0,'#06b6d4']].map(([l,v,c])=>(
          <Card key={l}><div style={{fontSize:10,color:'var(--t3)',textTransform:'uppercase',letterSpacing:'.5px',marginBottom:7}}>{l}</div><div style={{fontFamily:'Syne',fontSize:26,fontWeight:800,color:c}}>{v}</div></Card>
        ))}
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
        <Card>
          <div style={{fontFamily:'Syne',fontWeight:700,marginBottom:13}}>🎯 Recommended Mentors</div>
          {!d.recs?.length
            ? <div style={{color:'var(--t3)',fontSize:13,textAlign:'center',padding:18}}>Sign up an alumni with the same college to see recommendations.</div>
            : d.recs.map(m=>(
              <div key={m.uid} onClick={()=>go('mentors')} style={{display:'flex',alignItems:'center',gap:9,padding:'8px 0',borderBottom:'1px solid var(--cb)',cursor:'pointer'}}>
                {av(m.name,32)}<div style={{flex:1,minWidth:0}}><div style={{fontSize:13,fontWeight:600,overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{m.name}</div><div style={{fontSize:11,color:'var(--t2)'}}>{m.currentRole||'Alumni'}</div></div>
                <span style={{padding:'2px 9px',background:'rgba(16,185,129,.1)',border:'1px solid rgba(16,185,129,.2)',borderRadius:20,fontSize:11,color:'var(--green)'}}>{m.ms}%</span>
              </div>
            ))}
        </Card>
        <Card>
          <div style={{fontFamily:'Syne',fontWeight:700,marginBottom:13}}>📅 Recent Events</div>
          {!d.events?.length
            ? <div style={{color:'var(--t3)',fontSize:13,textAlign:'center',padding:18}}>No events yet — host the first one!</div>
            : d.events.map(ev=><div key={ev.id} style={{padding:'8px 0',borderBottom:'1px solid var(--cb)'}}><div style={{fontWeight:600,fontSize:13}}>{ev.title}</div><div style={{fontSize:11,color:'var(--t2)'}}>{ev.type} · {ev.date||'TBD'}</div></div>)}
          <div style={{marginTop:11,padding:9,background:'var(--bg3)',borderRadius:9,fontSize:12,color:'var(--t2)'}}>
            Signed in as <strong>{user.name}</strong> ({user.role}) · {user.college}
          </div>
        </Card>
      </div>
    </div>
  )
}

// ── Profile ───────────────────────────────────────────────────────────────────
function ProfilePage({ user, setUser }) {
  const [f, setF] = useState({...user})
  const [skills, setSkills] = useState([])
  const [ns, setNs] = useState('')
  const isA = user.role === 'alumni'
  const s = k => e => setF(p=>({...p,[k]:e.target.value}))
  useEffect(()=>{ axios.get(`/api/users/${user.uid}/skills`).then(r=>setSkills(r.data)).catch(()=>{}) },[])
  async function save(){ try{ const r=await axios.put(`/api/users/${user.uid}/profile`,f); setUser(r.data); toast('Saved! ✓') }catch(e){ toast(e.response?.data?.detail||'Error',false) } }
  async function add(){ if(!ns.trim())return; try{ const r=await axios.post(`/api/users/${user.uid}/skills`,{name:ns.trim()}); setSkills(r.data); setNs('') }catch(e){ toast(e.response?.data?.detail||'Error',false) } }
  async function del(i){ try{ const r=await axios.delete(`/api/users/${user.uid}/skills/${i}`); setSkills(r.data) }catch{ toast('Error',false) } }
  return (
    <div>
      <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:18}}><h2 style={{fontFamily:'Syne'}}>My Profile</h2><button className="btn btn-p" onClick={save}>Save Changes</button></div>
      <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:14}}>
        <Card>
          <label className="lbl">Full Name</label><input value={f.name||''} onChange={s('name')} />
          <label className="lbl">Bio</label><textarea value={f.bio||''} onChange={s('bio')} rows={3} />
          <label className="lbl">College</label><input value={f.college||''} onChange={s('college')} />
          {!isA?<><label className="lbl">Degree</label><input value={f.degree||''} onChange={s('degree')} /><label className="lbl">Interests</label><input value={f.interests||''} onChange={s('interests')} /></>
            :<><label className="lbl">Company</label><input value={f.currentCompany||''} onChange={s('currentCompany')} /><label className="lbl">Role</label><input value={f.currentRole||''} onChange={s('currentRole')} /></>}
          <label className="lbl">LinkedIn</label><input value={f.linkedin||''} onChange={s('linkedin')} placeholder="linkedin.com/in/you" />
          <label className="lbl">GitHub</label><input value={f.github||''} onChange={s('github')} placeholder="github.com/you" />
        </Card>
        <Card>
          <div style={{fontFamily:'Syne',fontWeight:700,marginBottom:13}}>🏆 Skills</div>
          {!skills.length ? <div style={{color:'var(--t3)',fontSize:13,textAlign:'center',padding:16}}>No skills yet</div>
            : skills.map((sk,i)=><div key={i} style={{display:'flex',alignItems:'center',justifyContent:'space-between',padding:'7px 0',borderBottom:'1px solid var(--cb)'}}><span style={{fontSize:13}}>{sk.n}</span><button onClick={()=>del(i)} style={{background:'rgba(239,68,68,.1)',border:'1px solid rgba(239,68,68,.2)',borderRadius:6,padding:'2px 8px',fontSize:11,color:'#f87171',cursor:'pointer'}}>✕</button></div>)}
          <div style={{display:'flex',gap:7,marginTop:12}}><input placeholder="Add a skill..." value={ns} onChange={e=>setNs(e.target.value)} onKeyDown={e=>e.key==='Enter'&&add()} style={{flex:1}} /><button className="btn btn-p btn-sm" onClick={add}>Add</button></div>
        </Card>
      </div>
    </div>
  )
}

// ── Mentors ───────────────────────────────────────────────────────────────────
function MentorsPage({ user }) {
  const [mentors, setMentors] = useState([]); const [q, setQ] = useState(''); const [sel, setSel] = useState(null)
  useEffect(()=>{ load() },[q])
  function load(){ axios.get(`/api/users/${user.uid}/mentors`,{params:q?{q}:{}}).then(r=>setMentors(r.data)).catch(()=>{}) }
  async function req(to){ try{ await axios.post(`/api/users/${user.uid}/requests`,{to}); toast('Request sent! ✓'); setSel(null); load() }catch(e){ toast(e.response?.data?.detail||'Error',false) } }
  return (
    <div>
      <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:14}}><h2 style={{fontFamily:'Syne'}}>Find Mentors</h2><span style={{fontSize:12,color:'var(--t3)'}}>Same-college alumni only</span></div>
      <input placeholder="Search by name, role, company, skill..." value={q} onChange={e=>setQ(e.target.value)} style={{marginBottom:18}} />
      {!mentors.length ? <div style={{textAlign:'center',padding:48,color:'var(--t3)'}}><div style={{fontSize:40,marginBottom:11}}>🎓</div><div style={{fontWeight:600,color:'var(--t2)',fontSize:15}}>No alumni from your college yet</div><div style={{fontSize:12,marginTop:5}}>Sign up an alumni account with the same college to test</div></div>
        : <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fill,minmax(280px,1fr))',gap:14}}>
          {mentors.map(m=>(
            <div key={m.uid} className="card" style={{cursor:'pointer'}} onClick={()=>setSel(m)}>
              <div style={{background:'rgba(16,185,129,.08)',borderBottom:'1px solid rgba(16,185,129,.15)',padding:'4px 14px',margin:'-18px -18px 13px',fontSize:10,color:'#34d399',fontWeight:600}}>🎓 Same College</div>
              <div style={{display:'flex',gap:11,marginBottom:10}}>{av(m.name,44)}<div><div style={{fontWeight:700,fontSize:14}}>{m.name}</div><div style={{fontSize:11,color:'var(--t2)'}}>{m.currentRole||'Alumni'}{m.currentCompany?` @ ${m.currentCompany}`:''}</div><Tag type="g">{m.ms}% Match</Tag></div></div>
              <div style={{display:'flex',flexWrap:'wrap',gap:4,marginBottom:10}}>{(m.skills||[]).slice(0,3).map(sk=><Tag key={sk}>{sk}</Tag>)}</div>
              <button className="btn btn-p" style={{width:'100%',fontSize:12,padding:7}} onClick={e=>{e.stopPropagation();req(m.uid)}}>Connect</button>
            </div>
          ))}
        </div>}
      {sel && <div style={{position:'fixed',inset:0,background:'rgba(0,0,0,.72)',display:'flex',alignItems:'center',justifyContent:'center',zIndex:999}} onClick={()=>setSel(null)}>
        <div style={{background:'var(--bg2)',border:'1px solid var(--cb)',borderRadius:16,padding:28,width:'90%',maxWidth:480}} onClick={e=>e.stopPropagation()}>
          <div style={{display:'flex',gap:14,marginBottom:16}}>{av(sel.name,56)}<div><div style={{fontFamily:'Syne',fontWeight:700,fontSize:19}}>{sel.name}</div><div style={{color:'var(--t2)',fontSize:12}}>{sel.currentRole}{sel.currentCompany?` @ ${sel.currentCompany}`:''}</div></div></div>
          {sel.bio && <p style={{fontSize:13,color:'var(--t2)',lineHeight:1.65,marginBottom:14}}>{sel.bio}</p>}
          <div style={{display:'flex',gap:9}}><button className="btn btn-s" style={{flex:1}} onClick={()=>setSel(null)}>Close</button><button className="btn btn-p" style={{flex:1}} onClick={()=>req(sel.uid)}>Send Request</button></div>
        </div>
      </div>}
    </div>
  )
}

// ── Connections ───────────────────────────────────────────────────────────────
function ConnsPage({ user }) {
  const [conns,setConns]=useState([]); const [sent,setSent]=useState([]); const [tab,setTab]=useState('active')
  useEffect(()=>{ axios.get(`/api/users/${user.uid}/connections`).then(r=>setConns(r.data)).catch(()=>{}); axios.get(`/api/users/${user.uid}/sent`).then(r=>setSent(r.data.filter(x=>x.status==='pending'))).catch(()=>{}) },[])
  async function cancel(id){ await axios.delete(`/api/requests/${id}`,{params:{uid:user.uid}}); setSent(s=>s.filter(r=>r.id!==id)); toast('Cancelled') }
  return (
    <div>
      <div style={{display:'flex',gap:4,background:'var(--bg3)',borderRadius:9,padding:4,maxWidth:280,marginBottom:16}}>
        {[['active',`Active (${conns.length})`],['pending',`Pending (${sent.length})`]].map(([t,l])=>(
          <button key={t} onClick={()=>setTab(t)} style={{flex:1,padding:7,borderRadius:7,fontSize:13,fontWeight:500,border:'none',cursor:'pointer',background:tab===t?'var(--ac)':'none',color:tab===t?'#fff':'var(--t2)',fontFamily:'DM Sans'}}>{l}</button>
        ))}
      </div>
      {tab==='active' && (!conns.length ? <div style={{textAlign:'center',padding:48,color:'var(--t3)'}}>No active connections yet</div>
        : conns.map(u=><Card key={u.uid} style={{marginBottom:10,display:'flex',alignItems:'center',gap:13}}>{av(u.name,40)}<div style={{flex:1}}><div style={{fontWeight:600}}>{u.name}</div><div style={{fontSize:12,color:'var(--t2)'}}>{u.currentRole||u.role}</div></div><Tag type="g">Active</Tag></Card>))}
      {tab==='pending' && (!sent.length ? <div style={{textAlign:'center',padding:48,color:'var(--t3)'}}>No pending requests</div>
        : sent.map(r=><Card key={r.id} style={{marginBottom:10,display:'flex',alignItems:'center',gap:13}}>{av(r.toUser?.name,40)}<div style={{flex:1}}><div style={{fontWeight:600}}>{r.toUser?.name||'?'}</div></div><Tag type="gold">Pending</Tag><button className="btn btn-r btn-sm" onClick={()=>cancel(r.id)}>Cancel</button></Card>))}
    </div>
  )
}

// ── Inbox ─────────────────────────────────────────────────────────────────────
function InboxPage({ user }) {
  const [inbox,setInbox]=useState([])
  useEffect(()=>{ load() },[])
  function load(){ axios.get(`/api/users/${user.uid}/inbox`).then(r=>setInbox(r.data)).catch(()=>{}) }
  async function handle(id,action){ try{ if(action==='accept') await axios.put(`/api/requests/${id}/accept`,null,{params:{uid:user.uid}}); else await axios.put(`/api/requests/${id}/decline`,null,{params:{uid:user.uid}}); toast(action==='accept'?'Connection accepted! 🎉':'Declined'); load() }catch{ toast('Error',false) } }
  return (
    <div>
      <h2 style={{fontFamily:'Syne',marginBottom:16}}>Inbox</h2>
      {!inbox.length ? <div style={{textAlign:'center',padding:48,color:'var(--t3)'}}><div style={{fontSize:36}}>📬</div><div style={{marginTop:9,color:'var(--t2)'}}>No pending requests</div></div>
        : inbox.map(r=>(
          <Card key={r.id} style={{marginBottom:11}}>
            <div style={{display:'flex',alignItems:'center',gap:11,marginBottom:r.status==='pending'?10:0}}>{av(r.fromUser?.name,38)}<div style={{flex:1}}><div style={{fontWeight:600}}>{r.fromUser?.name}</div><div style={{fontSize:11,color:'var(--t2)'}}>🎓 {r.fromUser?.college} · {r.date}</div></div><Tag type={r.status==='accepted'?'g':r.status==='pending'?'gold':'r'}>{r.status}</Tag></div>
            {r.status==='pending' && <div style={{display:'flex',gap:7}}><button className="btn btn-g btn-sm" onClick={()=>handle(r.id,'accept')}>✓ Accept</button><button className="btn btn-r btn-sm" onClick={()=>handle(r.id,'decline')}>✗ Decline</button></div>}
          </Card>
        ))}
    </div>
  )
}

// ── Messages ──────────────────────────────────────────────────────────────────
function MsgsPage({ user }) {
  const [conns,setConns]=useState([]); const [cw,setCw]=useState(null); const [msgs,setMsgs]=useState([]); const [txt,setTxt]=useState('')
  const endRef=useRef(null)
  useEffect(()=>{ axios.get(`/api/users/${user.uid}/connections`).then(r=>setConns(r.data)).catch(()=>{}) },[])
  useEffect(()=>{ if(cw) load() },[cw])
  useEffect(()=>{ endRef.current?.scrollIntoView({behavior:'smooth'}) },[msgs])
  function load(){ axios.get(`/api/messages/${user.uid}/${cw.uid}`).then(r=>setMsgs(r.data)).catch(()=>{}) }
  async function send(){ if(!txt.trim()||!cw)return; try{ await axios.post(`/api/messages/${user.uid}/${cw.uid}`,{text:txt.trim()}); setTxt(''); load() }catch(e){ toast(e.response?.data?.detail||'Error',false) } }
  return (
    <div style={{display:'grid',gridTemplateColumns:'220px 1fr',gap:14,height:'calc(100vh - 160px)'}}>
      <Card style={{padding:0,display:'flex',flexDirection:'column',overflow:'hidden'}}>
        <div style={{padding:'12px 15px',borderBottom:'1px solid var(--cb)',fontFamily:'Syne',fontWeight:700,fontSize:14}}>Conversations</div>
        <div style={{flex:1,overflowY:'auto'}}>
          {!conns.length ? <div style={{padding:18,textAlign:'center',color:'var(--t3)',fontSize:13}}>No connections yet</div>
            : conns.map(u=><div key={u.uid} onClick={()=>setCw(u)} style={{display:'flex',alignItems:'center',gap:9,padding:'11px 15px',cursor:'pointer',borderBottom:'1px solid var(--cb)',background:cw?.uid===u.uid?'rgba(99,102,241,.09)':'transparent'}}>{av(u.name,34)}<div><div style={{fontSize:13,fontWeight:600}}>{u.name}</div><div style={{fontSize:11,color:'var(--t3)'}}>{u.currentRole||u.role}</div></div></div>)}
        </div>
      </Card>
      <Card style={{padding:0,display:'flex',flexDirection:'column',overflow:'hidden'}}>
        <div style={{padding:'12px 15px',borderBottom:'1px solid var(--cb)',display:'flex',alignItems:'center',gap:11,flexShrink:0}}>
          {cw ? <>{av(cw.name,32)}<span style={{fontWeight:600,fontSize:13}}>{cw.name}</span></> : <span style={{color:'var(--t3)',fontSize:13}}>Select a conversation</span>}
        </div>
        <div style={{flex:1,overflowY:'auto',padding:14,display:'flex',flexDirection:'column',gap:9}}>
          {!cw && <div style={{textAlign:'center',color:'var(--t3)',fontSize:13,marginTop:40}}>Choose someone from the left to start chatting</div>}
          {msgs.map((m,i)=><div key={i} style={{maxWidth:'76%',padding:'11px 15px',borderRadius:m.from===user.uid?'14px 14px 3px 14px':'14px 14px 14px 3px',fontSize:13,lineHeight:1.55,wordBreak:'break-word',alignSelf:m.from===user.uid?'flex-end':'flex-start',background:m.from===user.uid?'linear-gradient(135deg,#6366f1,#8b5cf6)':'var(--bg3)',color:m.from===user.uid?'#fff':'var(--t)',border:m.from!==user.uid?'1px solid var(--cb)':'none'}}>{m.text}</div>)}
          <div ref={endRef} />
        </div>
        <div style={{padding:11,borderTop:'1px solid var(--cb)',display:'flex',gap:7,flexShrink:0}}>
          <input placeholder="Type a message..." value={txt} onChange={e=>setTxt(e.target.value)} onKeyDown={e=>e.key==='Enter'&&send()} style={{flex:1}} />
          <button className="btn btn-p btn-sm" onClick={send}>Send ↗</button>
        </div>
      </Card>
    </div>
  )
}

// ── AlumniBot ─────────────────────────────────────────────────────────────────
function BotPage({ user }) {
  const firstName = user.name ? user.name.split(' ')[0] : 'there'
  const [msgs,setMsgs]=useState([{r:'bot',t:`Hi ${firstName}! 👋 I'm AlumniBot, your AI career guide.\n\nI can help you with:\n• Finding mentors from your college\n• Building a great resume\n• AI interview preparation\n• Jobs, events & the forum\n• Quiz & points system\n\nWhat would you like help with?`}])
  const [inp,setInp]=useState('')
  const [typing,setTyping]=useState(false)
  const endRef=useRef(null)
  useEffect(()=>{ endRef.current?.scrollIntoView({behavior:'smooth'}) },[msgs])

  function reply(m){
    const l = m.toLowerCase()
    // Greetings
    if(/^(hi|hello|hey|sup|yo|howdy|good morning|good evening)/i.test(m.trim()))
      return `Hey ${firstName}! 😊 Great to see you. What can I help you with today?\n\nTry asking about: mentors, resume, interview, jobs, events, quiz, or how to earn points!`
    // Mentor related
    if(l.includes('mentor')||l.includes('connect')||l.includes('alumni')||l.includes('network'))
      return `🎓 **Finding Mentors**\n\nGo to **Find Mentors** in the sidebar. AlumniConnect shows only alumni from YOUR same college — so every connection is relevant.\n\nHow it works:\n1. Browse alumni cards with match scores\n2. Click a card to see their full profile\n3. Hit **Connect** to send a request\n4. Once they accept in their Inbox, you're connected!\n\nYou can then message each other in the **Messages** section. 💬`
    // Resume
    if(l.includes('resume')||l.includes('cv')||l.includes('curriculum'))
      return `📄 **Resume Builder**\n\nGo to **Resume Builder** in the sidebar — it's a 4-step wizard:\n\nStep 1: Personal info (name, email, phone, LinkedIn)\nStep 2: Education (university, degree, GPA)\nStep 3: Experience (job title, company, achievements)\nStep 4: Skills & professional summary\n\nWhen done, click **Download Resume** → it saves as HTML → open in Chrome → press **Ctrl+P** → Save as PDF. Professional quality! 🎯`
    // Interview
    if(l.includes('interview')||l.includes('intervi')||l.includes('practice')||l.includes('prepare'))
      return `🎙️ **AI Interview Simulator**\n\nGo to **AI Interview** in the sidebar. Here's what happens:\n\n• Choose your target role (SWE, PM, Data Scientist)\n• Your camera opens automatically (optional)\n• AI speaks each question aloud using voice synthesis\n• Click **🎤** to answer by voice (Chrome/Edge), or just type\n• Use the **STAR method**: Situation → Task → Action → Result\n• Get scored out of 100 per question!\n\nTip: The longer and more structured your answer, the higher your score. 💪`
    // Jobs
    if(l.includes('job')||l.includes('career')||l.includes('hiring')||l.includes('work')||l.includes('opportunit'))
      return `💼 **Jobs Board**\n\nGo to **Jobs Board** in the sidebar.\n\n• **Students**: Browse and apply to jobs posted by alumni\n• **Alumni**: Use the **+ Post Job** button to share opportunities\n\nYou can filter by: Full-time, Internship, or Part-time.\n\nAlumni posting jobs is a great way to give back to your college community! 🤝`
    // Events
    if(l.includes('event')||l.includes('workshop')||l.includes('webinar')||l.includes('seminar'))
      return `📅 **Events**\n\nGo to **Events** in the sidebar.\n\n• Anyone can **host an event** — workshops, webinars, networking sessions, bootcamps\n• Click **+ Host Event**, fill in the details, hit Create\n• Others can register with one click\n\nGreat for building your college community! 🎉`
    // Forum
    if(l.includes('forum')||l.includes('post')||l.includes('discuss')||l.includes('community')||l.includes('question'))
      return `💭 **Community Forum**\n\nGo to **Forum** in the sidebar.\n\n• Post questions, share experiences, or start discussions\n• Add tags to help others find your post (e.g. "career", "ML", "internship")\n• Like posts you find helpful\n• Great for getting advice from your college network! 🌟`
    // Quiz / points
    if(l.includes('quiz')||l.includes('point')||l.includes('score')||l.includes('earn')||l.includes('reward'))
      return `🧠 **Quiz & Points System**\n\nGo to **Quiz** in the sidebar.\n\n• 10 tech questions • 5-minute timer\n• Score **50–74** → earn **+10 points** ⭐\n• Score **75** → earn **+20 points** ⭐⭐\n• Score **76+** → earn **+30 points** 🏆\n\nYour total points show in the top bar. Challenge yourself every week to climb the leaderboard!`
    // Messages / chat
    if(l.includes('message')||l.includes('chat')||l.includes('talk')||l.includes('dm'))
      return `💬 **Messages**\n\nOnce you're connected with an alumni, go to **Messages** in the sidebar.\n\n• Select a conversation from the left panel\n• Type your message and press Enter or click Send\n• Only same-college connections can message each other (privacy feature)\n\nPro tip: Introduce yourself, share your goals, and ask specific questions to get the best advice! 📬`
    // Profile
    if(l.includes('profile')||l.includes('skill')||l.includes('bio')||l.includes('edit'))
      return `👤 **Your Profile**\n\nGo to **My Profile** in the sidebar.\n\n• Update your name, bio, college, degree, interests\n• Add skills (they show on your profile card when mentors view you)\n• Add LinkedIn and GitHub links\n• Click **Save Changes** when done\n\nA complete profile gets higher match scores from mentors! 💯`
    // HVS
    if(l.includes('hvs')||l.includes('website')||l.includes('presentation')||l.includes('document')||l.includes('pdf')||l.includes('slide'))
      return `🚀 **HVS.Ai Tools**\n\nClick **Switch to HVS.Ai** at the bottom of the sidebar to access 7 AI-powered tools:\n\n💬 AI Chat — Conversational AI assistant\n📊 Presentation — Generate slides, download as HTML\n📝 Documents — AI writing, download as .doc or PDF\n📄 PDF Tools — Merge and download PDFs\n🌐 Website Builder — Describe → live preview → download\n🧠 Quiz — Tech quiz with points\n🎥 Video Analyzer — Camera-based communication scoring\n\nAll tools work with an Anthropic API key for full AI power!`
    // Greeting for thanks
    if(l.includes('thank')||l.includes('thanks')||l.includes('great')||l.includes('awesome')||l.includes('helpful'))
      return `You're welcome, ${firstName}! 😊 Happy to help. Feel free to ask me anything else — I'm always here! 🤖`
    // Default
    return `I'm not sure about that specific topic, but here's what I can help with:\n\n🎓 Mentors — finding and connecting with alumni\n📄 Resume — building and downloading your CV\n🎙️ Interview — AI interview practice with scoring\n💼 Jobs — browsing and posting opportunities\n📅 Events — hosting and registering\n💭 Forum — community discussions\n🧠 Quiz — earning points\n🚀 HVS.Ai — website, docs, presentations\n\nJust ask about any of these topics! 😊`
  }

  function send(directText){
    const t=(directText||inp).trim(); if(!t)return; setInp('')
    setMsgs(m=>[...m,{r:'user',t}])
    setTyping(true)
    setTimeout(()=>{ setTyping(false); setMsgs(m=>[...m,{r:'bot',t:reply(t)}]) }, 600)
  }
  return (
    <div>
      <h2 style={{fontFamily:'Syne',marginBottom:14}}>🤖 AlumniBot AI</h2>
      <Card style={{padding:0}}>
        <div style={{padding:'12px 18px',background:'rgba(99,102,241,.08)',borderBottom:'1px solid var(--cb)',display:'flex',alignItems:'center',gap:11}}>
          <div style={{width:34,height:34,background:'linear-gradient(135deg,#6366f1,#8b5cf6)',borderRadius:'50%',display:'flex',alignItems:'center',justifyContent:'center',fontSize:15}}>🤖</div>
          <div><div style={{fontWeight:600,fontSize:13}}>AlumniBot</div><div style={{fontSize:11,color:'var(--green)'}}>● Ready</div></div>
        </div>
        <div style={{minHeight:280,maxHeight:380,overflowY:'auto',padding:18,display:'flex',flexDirection:'column',gap:11}}>
          {msgs.map((m,i)=><div key={i} style={{maxWidth:'87%',padding:'11px 15px',borderRadius:m.r==='user'?'14px 14px 3px 14px':'14px 14px 14px 3px',fontSize:13,lineHeight:1.6,alignSelf:m.r==='user'?'flex-end':'flex-start',background:m.r==='user'?'linear-gradient(135deg,#6366f1,#8b5cf6)':'var(--bg3)',color:m.r==='user'?'#fff':'var(--t)',border:m.r!=='user'?'1px solid var(--cb)':'none',whiteSpace:'pre-wrap'}}>{m.t}</div>)}
          {typing && <div style={{alignSelf:'flex-start',padding:'10px 14px',background:'var(--bg3)',border:'1px solid var(--cb)',borderRadius:'14px 14px 14px 3px',fontSize:13,color:'var(--t3)',fontStyle:'italic'}}>AlumniBot is typing…</div>}
          <div ref={endRef} />
        </div>
        <div style={{padding:14,borderTop:'1px solid var(--cb)',display:'flex',gap:9}}>
          <input placeholder="Ask me anything about AlumniConnect..." value={inp} onChange={e=>setInp(e.target.value)} onKeyDown={e=>e.key==='Enter'&&send()} style={{flex:1}} />
          <button className="btn btn-p btn-sm" onClick={send}>Send ↗</button>
        </div>
      </Card>
      <div style={{marginTop:10,display:'flex',gap:7,flexWrap:'wrap'}}>
        {['How do I find mentors?','Help me build my resume','How does AI Interview work?','How to earn points?','Tell me about Jobs Board','What is HVS.Ai?'].map(q=><button key={q} className="btn btn-s btn-sm" style={{fontSize:11}} onClick={()=>send(q)}>{q}</button>)}
      </div>
    </div>
  )
}

// ── Resume ────────────────────────────────────────────────────────────────────
function ResumePage({ user }) {
  const [step,setStep]=useState(0)
  const [d,setD]=useState({name:user.name||'',email:user.email||'',phone:'',linkedin:user.linkedin||'',github:'',uni:user.college||'',deg:user.degree||'',grad:user.gradYear||'',gpa:'',jt:user.currentRole||'',co:user.currentCompany||'',dur:'',ach:'',skills:(user.skills||[]).join(', '),summary:user.bio||''})
  const steps=['Personal Info','Education','Experience','Skills & Summary']
  const s=k=>e=>setD(p=>({...p,[k]:e.target.value}))
  function dl(){
    if(!d.name&&!d.email){toast('Fill in Step 1 first',false);return}
    const ach=d.ach?'<ul>'+d.ach.split('\n').filter(Boolean).map(a=>`<li>${a.trim()}</li>`).join('')+'</ul>':''
    const html=`<!DOCTYPE html><html><head><meta charset="UTF-8"><title>${d.name} Resume</title><style>*{margin:0;padding:0;box-sizing:border-box}body{font-family:Georgia,serif;max-width:720px;margin:0 auto;padding:48px;color:#111;font-size:11pt;line-height:1.6}.nm{font-size:22pt;font-weight:bold;margin-bottom:4px}.ct{font-size:9.5pt;color:#555;border-bottom:2px solid #6366f1;padding-bottom:8px;margin-bottom:14px}.sh{font-size:10pt;font-weight:bold;color:#6366f1;text-transform:uppercase;letter-spacing:1px;margin:16px 0 4px;border-bottom:.5px solid #d0d5ff;padding-bottom:2px}.et{font-weight:bold}.es{color:#444;font-size:10pt}ul{margin:4px 0 0 16px}li{margin-bottom:2px;font-size:10.5pt}@media print{body{padding:0}@page{margin:1.5cm}}</style></head><body><div class="nm">${d.name}</div><div class="ct">${[d.email,d.phone,d.linkedin,d.github].filter(Boolean).join(' • ')}</div><div class="sh">Education</div><div class="et">${d.uni}</div><div class="es">${[d.deg,d.grad?`(${d.grad})`:'',d.gpa?`GPA: ${d.gpa}`:''].filter(Boolean).join(' | ')}</div>${d.jt||d.co?`<div class="sh">Experience</div><div class="et">${[d.jt,d.co?`@ ${d.co}`:'',d.dur?`— ${d.dur}`:''].filter(Boolean).join(' ')}</div>${ach}`:'' }${d.skills?`<div class="sh">Skills</div><div>${d.skills}</div>`:''}${d.summary?`<div class="sh">Summary</div><div>${d.summary}</div>`:''}<div style="margin-top:28px;font-size:8pt;color:#ccc;text-align:center">Generated by AlumniConnect</div></body></html>`
    const fr=new FileReader(); fr.onload=e=>{const a=document.createElement('a');a.href=e.target.result;a.download=`${d.name.replace(/\s+/g,'_')}_Resume.html`;a.click()}; fr.readAsDataURL(new Blob([html],{type:'text/html'}))
    toast('Downloaded! Open in browser → Ctrl+P to save as PDF 📄')
  }
  return (
    <div>
      <h2 style={{fontFamily:'Syne',marginBottom:18}}>📄 Resume Builder</h2>
      <div style={{display:'flex',alignItems:'center',gap:0,marginBottom:22}}>
        {steps.map((st,i)=><React.Fragment key={i}>{i>0&&<div style={{height:2,width:40,background:i<=step?'var(--green)':'var(--bg3)'}} />}<div onClick={()=>setStep(i)} style={{width:30,height:30,borderRadius:'50%',display:'flex',alignItems:'center',justifyContent:'center',fontSize:12,fontWeight:700,cursor:'pointer',background:i<step?'var(--green)':i===step?'var(--ac)':'var(--bg3)',color:i<=step?'#fff':'var(--t3)'}}>{i<step?'✓':i+1}</div></React.Fragment>)}
        <div style={{marginLeft:12,fontSize:13,color:'var(--t2)'}}>{steps[step]}</div>
      </div>
      <Card>
        {step===0&&<><label className="lbl">Full Name</label><input value={d.name} onChange={s('name')} /><label className="lbl">Email</label><input type="email" value={d.email} onChange={s('email')} /><label className="lbl">Phone</label><input value={d.phone} onChange={s('phone')} /><label className="lbl">LinkedIn</label><input value={d.linkedin} onChange={s('linkedin')} /><label className="lbl">GitHub</label><input value={d.github} onChange={s('github')} /></>}
        {step===1&&<><label className="lbl">University</label><input value={d.uni} onChange={s('uni')} /><div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:10,marginTop:12}}><div><label className="lbl" style={{marginTop:0}}>Degree</label><input value={d.deg} onChange={s('deg')} /></div><div><label className="lbl" style={{marginTop:0}}>Grad Year</label><input value={d.grad} onChange={s('grad')} /></div></div><label className="lbl">GPA</label><input value={d.gpa} onChange={s('gpa')} /></>}
        {step===2&&<><label className="lbl">Job Title</label><input value={d.jt} onChange={s('jt')} /><label className="lbl">Company</label><input value={d.co} onChange={s('co')} /><label className="lbl">Duration</label><input value={d.dur} onChange={s('dur')} placeholder="Jun 2023 – Present" /><label className="lbl">Achievements (one per line)</label><textarea value={d.ach} onChange={s('ach')} rows={4} /></>}
        {step===3&&<><label className="lbl">Skills (comma separated)</label><input value={d.skills} onChange={s('skills')} /><label className="lbl">Professional Summary</label><textarea value={d.summary} onChange={s('summary')} rows={4} /></>}
        <div style={{display:'flex',gap:9,justifyContent:'flex-end',marginTop:16}}>
          {step>0&&<button className="btn btn-s btn-sm" onClick={()=>setStep(p=>p-1)}>← Back</button>}
          {step<3?<button className="btn btn-p btn-sm" onClick={()=>setStep(p=>p+1)}>Next →</button>:<button className="btn btn-g" onClick={dl}>⬇ Download Resume</button>}
        </div>
      </Card>
    </div>
  )
}

// ── Jobs ──────────────────────────────────────────────────────────────────────
function JobsPage({ user }) {
  const [jobs,setJobs]=useState([]); const [q,setQ]=useState(''); const [type,setType]=useState('All'); const [show,setShow]=useState(false)
  const [f,setF]=useState({title:'',company:'',jobType:'Full-time',salary:'',location:''})
  useEffect(()=>{ load() },[q,type])
  function load(){ axios.get('/api/jobs',{params:{q:q||undefined,type:type!=='All'?type:undefined}}).then(r=>setJobs(r.data)).catch(()=>{}) }
  async function post(){ if(!f.title||!f.company)return toast('Title and company required',false); await axios.post('/api/jobs',f,{params:{uid:user.uid}}); setShow(false); setF({title:'',company:'',jobType:'Full-time',salary:'',location:''}); load(); toast('Job posted! ✓') }
  const sf=k=>e=>setF(p=>({...p,[k]:e.target.value}))
  return (
    <div>
      <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:14}}><h2 style={{fontFamily:'Syne'}}>💼 Jobs Board</h2>{user.role==='alumni'&&<button className="btn btn-p btn-sm" onClick={()=>setShow(true)}>+ Post Job</button>}</div>
      <div style={{display:'flex',gap:9,marginBottom:16}}><input placeholder="Search..." value={q} onChange={e=>setQ(e.target.value)} style={{flex:1}} /><select value={type} onChange={e=>setType(e.target.value)} style={{width:130}}>{['All','Full-time','Internship','Part-time'].map(t=><option key={t}>{t}</option>)}</select></div>
      {!jobs.length?<div style={{textAlign:'center',padding:48,color:'var(--t3)'}}><div style={{fontSize:38}}>💼</div><div style={{marginTop:9,color:'var(--t2)'}}>No jobs yet</div></div>
        :jobs.map(j=><div key={j.id} style={{display:'flex',gap:13,padding:14,marginBottom:9,background:'var(--card)',border:'1px solid var(--cb)',borderRadius:14}}>
          <div style={{width:44,height:44,borderRadius:10,background:'linear-gradient(135deg,#6366f1,#8b5cf6)',display:'flex',alignItems:'center',justifyContent:'center',fontWeight:800,fontSize:13,color:'#fff',flexShrink:0}}>{(j.company||'?').slice(0,2).toUpperCase()}</div>
          <div style={{flex:1}}><div style={{fontWeight:700,fontSize:14}}>{j.title}</div><div style={{fontSize:12,color:'var(--t2)',marginBottom:5}}>{j.company}{j.location?` · ${j.location}`:''}</div><div style={{display:'flex',gap:7,alignItems:'center'}}><Tag type="g">{j.jobType}</Tag>{j.salary&&<span style={{fontSize:11,color:'var(--t2)'}}>{j.salary}</span>}<span style={{fontSize:11,color:'var(--t3)'}}>by {j.byName}</span></div></div>
          <button className="btn btn-p btn-sm" onClick={()=>toast('Applied! ✓')}>Apply</button>
        </div>)}
      {show&&<div style={{position:'fixed',inset:0,background:'rgba(0,0,0,.72)',display:'flex',alignItems:'center',justifyContent:'center',zIndex:999}}>
        <Card style={{width:'90%',maxWidth:460}}>
          <div style={{display:'flex',justifyContent:'space-between',marginBottom:16}}><h3>Post a Job</h3><button onClick={()=>setShow(false)} style={{background:'none',border:'none',fontSize:20,cursor:'pointer',color:'var(--t2)'}}>✕</button></div>
          <label className="lbl">Job Title *</label><input value={f.title} onChange={sf('title')} />
          <label className="lbl">Company *</label><input value={f.company} onChange={sf('company')} />
          <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:10,marginTop:12}}><div><label className="lbl" style={{marginTop:0}}>Type</label><select value={f.jobType} onChange={sf('jobType')}>{['Full-time','Internship','Part-time'].map(t=><option key={t}>{t}</option>)}</select></div><div><label className="lbl" style={{marginTop:0}}>Salary</label><input value={f.salary} onChange={sf('salary')} placeholder="e.g. ₹8 LPA" /></div></div>
          <label className="lbl">Location</label><input value={f.location} onChange={sf('location')} placeholder="Remote / City" />
          <button className="btn btn-p" style={{width:'100%',marginTop:12}} onClick={post}>Post Job</button>
        </Card>
      </div>}
    </div>
  )
}

// ── Events ────────────────────────────────────────────────────────────────────
function EventsPage({ user }) {
  const [events,setEvents]=useState([]); const [show,setShow]=useState(false)
  const [f,setF]=useState({title:'',date:'',type:'Workshop',desc:''})
  useEffect(()=>{ load() },[])
  function load(){ axios.get('/api/events').then(r=>setEvents(r.data)).catch(()=>{}) }
  async function create(){ if(!f.title)return toast('Enter a title',false); await axios.post('/api/events',f,{params:{uid:user.uid}}); setShow(false); load(); toast('Event created! ✓') }
  return (
    <div>
      <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:14}}><h2 style={{fontFamily:'Syne'}}>📅 Events</h2><button className="btn btn-p btn-sm" onClick={()=>setShow(true)}>+ Host Event</button></div>
      {!events.length?<div style={{textAlign:'center',padding:48,color:'var(--t3)'}}><div style={{fontSize:38}}>📅</div><div style={{marginTop:9,color:'var(--t2)'}}>No events yet</div></div>
        :events.map(ev=><div key={ev.id} style={{padding:14,marginBottom:9,background:'var(--card)',border:'1px solid var(--cb)',borderRadius:14,borderLeft:'3px solid var(--ac)',paddingLeft:18}}>
          <div style={{display:'flex',justifyContent:'space-between',alignItems:'flex-start'}}><div><div style={{fontWeight:700,fontSize:14,marginBottom:3}}>{ev.title}</div><div style={{fontSize:11,color:'var(--t2)',marginBottom:6}}>by {ev.byName} · {ev.date||'TBD'}</div>{ev.desc&&<div style={{fontSize:12,color:'var(--t3)',marginBottom:7}}>{ev.desc}</div>}<Tag>{ev.type}</Tag></div><button className="btn btn-p btn-sm" onClick={()=>toast('Registered! ✓')}>Register</button></div>
        </div>)}
      {show&&<div style={{position:'fixed',inset:0,background:'rgba(0,0,0,.72)',display:'flex',alignItems:'center',justifyContent:'center',zIndex:999}}>
        <Card style={{width:'90%',maxWidth:440}}>
          <div style={{display:'flex',justifyContent:'space-between',marginBottom:16}}><h3>Host an Event</h3><button onClick={()=>setShow(false)} style={{background:'none',border:'none',fontSize:20,cursor:'pointer',color:'var(--t2)'}}>✕</button></div>
          <label className="lbl">Title *</label><input value={f.title} onChange={e=>setF(p=>({...p,title:e.target.value}))} />
          <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:10,marginTop:12}}><div><label className="lbl" style={{marginTop:0}}>Date</label><input type="date" value={f.date} onChange={e=>setF(p=>({...p,date:e.target.value}))} /></div><div><label className="lbl" style={{marginTop:0}}>Type</label><select value={f.type} onChange={e=>setF(p=>({...p,type:e.target.value}))}>{['Workshop','Webinar','Networking','Bootcamp','Summit'].map(t=><option key={t}>{t}</option>)}</select></div></div>
          <label className="lbl">Description</label><textarea value={f.desc} onChange={e=>setF(p=>({...p,desc:e.target.value}))} rows={3} />
          <button className="btn btn-p" style={{width:'100%',marginTop:12}} onClick={create}>Create Event</button>
        </Card>
      </div>}
    </div>
  )
}

// ── Forum ─────────────────────────────────────────────────────────────────────
function ForumPage({ user }) {
  const [posts,setPosts]=useState([]); const [show,setShow]=useState(false)
  const [f,setF]=useState({title:'',content:'',tags:''})
  useEffect(()=>{ load() },[])
  function load(){ axios.get('/api/forum').then(r=>setPosts(r.data)).catch(()=>{}) }
  async function create(){ if(!f.title||!f.content)return toast('Fill title and content',false); await axios.post('/api/forum',{...f,tags:f.tags.split(',').map(t=>t.trim()).filter(Boolean)},{params:{uid:user.uid}}); setShow(false); load(); toast('Post published! ✓') }
  async function like(id){ await axios.post(`/api/forum/${id}/like`); load() }
  return (
    <div>
      <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:14}}><h2 style={{fontFamily:'Syne'}}>💭 Forum</h2><button className="btn btn-p btn-sm" onClick={()=>setShow(true)}>+ New Post</button></div>
      {!posts.length?<div style={{textAlign:'center',padding:48,color:'var(--t3)'}}><div style={{fontSize:38}}>💭</div><div style={{marginTop:9,color:'var(--t2)'}}>Be the first to post!</div></div>
        :posts.map(p=><div key={p.id} style={{padding:14,marginBottom:9,background:'var(--card)',border:'1px solid var(--cb)',borderRadius:14}}>
          <div style={{display:'flex',alignItems:'center',gap:9,marginBottom:9}}>{av(p.byName,32)}<div><div style={{fontWeight:600,fontSize:12}}>{p.byName}</div><div style={{fontSize:10,color:'var(--t3)'}}>{p.date}</div></div></div>
          <div style={{fontWeight:600,fontSize:13,marginBottom:5}}>{p.title}</div>
          <div style={{fontSize:12,color:'var(--t2)',marginBottom:11,lineHeight:1.6}}>{p.content}</div>
          <div style={{display:'flex',alignItems:'center',gap:7,flexWrap:'wrap'}}>{(p.tags||[]).map(t=><Tag key={t} type="c">#{t}</Tag>)}<div style={{marginLeft:'auto',display:'flex',gap:11,fontSize:12,color:'var(--t2)'}}><span style={{cursor:'pointer'}} onClick={()=>like(p.id)}>❤️ {p.likes}</span><span>💬 {p.replies}</span></div></div>
        </div>)}
      {show&&<div style={{position:'fixed',inset:0,background:'rgba(0,0,0,.72)',display:'flex',alignItems:'center',justifyContent:'center',zIndex:999}}>
        <Card style={{width:'90%',maxWidth:500}}>
          <div style={{display:'flex',justifyContent:'space-between',marginBottom:16}}><h3>New Post</h3><button onClick={()=>setShow(false)} style={{background:'none',border:'none',fontSize:20,cursor:'pointer',color:'var(--t2)'}}>✕</button></div>
          <label className="lbl">Title *</label><input value={f.title} onChange={e=>setF(p=>({...p,title:e.target.value}))} />
          <label className="lbl">Content *</label><textarea value={f.content} onChange={e=>setF(p=>({...p,content:e.target.value}))} rows={4} />
          <label className="lbl">Tags (comma separated)</label><input value={f.tags} onChange={e=>setF(p=>({...p,tags:e.target.value}))} placeholder="career, advice, ML..." />
          <button className="btn btn-p" style={{width:'100%',marginTop:12}} onClick={create}>Publish Post</button>
        </Card>
      </div>}
    </div>
  )
}

// ── Analytics ─────────────────────────────────────────────────────────────────
function AnalyticsPage({ user }) {
  const [d,setD]=useState(null)
  useEffect(()=>{ axios.get(`/api/dashboard/${user.uid}`).then(r=>setD(r.data)).catch(()=>setD({})) },[])
  if(!d)return <Spin />
  return (
    <div>
      <h2 style={{fontFamily:'Syne',marginBottom:16}}>📈 Analytics</h2>
      <div style={{display:'grid',gridTemplateColumns:'repeat(4,1fr)',gap:10,marginBottom:18}}>
        {[['Connections',d.conns??0,'var(--ac)'],['Skills',d.skills??0,'#06b6d4'],['Points',(user.pts||0)+' ⭐','var(--gold)'],['Top Match',d.topM?d.topM+'%':'—','var(--green)']].map(([l,v,c])=>(
          <Card key={l}><div style={{fontSize:10,color:'var(--t3)',textTransform:'uppercase',letterSpacing:'.5px',marginBottom:7}}>{l}</div><div style={{fontFamily:'Syne',fontSize:24,fontWeight:800,color:c}}>{v}</div></Card>
        ))}
      </div>
      <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:14}}>
        <Card>
          <div style={{fontFamily:'Syne',fontWeight:700,marginBottom:13}}>⭐ Points & Rewards</div>
          <div style={{textAlign:'center',padding:'9px 0',marginBottom:11}}><div style={{display:'inline-flex',alignItems:'center',gap:5,padding:'11px 22px',background:'rgba(245,158,11,.18)',border:'1px solid rgba(245,158,11,.28)',borderRadius:20,fontFamily:'Syne',fontWeight:700,color:'var(--gold)',fontSize:17}}>⭐ {user.pts||0} Points</div></div>
          <div style={{background:'var(--bg3)',borderRadius:9,padding:13,fontSize:12,color:'var(--t2)'}}>
            <div style={{marginBottom:5}}>🎯 Score 50–74 → <span style={{color:'var(--gold)'}}>+10 pts</span></div>
            <div style={{marginBottom:5}}>🎯 Score 75 → <span style={{color:'var(--gold)'}}>+20 pts</span></div>
            <div>🏆 Score 76+ → <span style={{color:'var(--green)'}}>+30 pts</span></div>
          </div>
        </Card>
        <Card>
          <div style={{fontFamily:'Syne',fontWeight:700,marginBottom:13}}>Activity Summary</div>
          {[['Active Connections',d.conns??0],['Top Match Score',d.topM?d.topM+'%':'—'],['Total Points',(user.pts||0)+' ⭐'],['Skills Added',d.skills??0]].map(([k,v])=>(
            <div key={k} style={{display:'flex',justifyContent:'space-between',padding:'8px 0',borderBottom:'1px solid var(--cb)',fontSize:13}}><span style={{color:'var(--t2)'}}>{k}</span><span style={{fontWeight:600}}>{v}</span></div>
          ))}
        </Card>
      </div>
    </div>
  )
}

// ── Quiz ───────────────────────────────────────────────────────────────────────
const QS = [
  {q:'What does API stand for?',o:['Application Programming Interface','Advanced Program Interaction','Automated Protocol Instance','App Programming Interface'],c:0},
  {q:'Which data structure follows LIFO?',o:['Queue','Tree','Stack','Graph'],c:2},
  {q:'Time complexity of binary search?',o:['O(n)','O(log n)','O(n²)','O(1)'],c:1},
  {q:'What does CSS stand for?',o:['Creative Style Sheets','Computer Style Sheets','Cascading Style Sheets','Colorful Styling Sheets'],c:2},
  {q:'Which language runs natively in browsers?',o:['Python','Java','C++','JavaScript'],c:3},
  {q:'Purpose of a foreign key in SQL?',o:['Encrypts data','Links two tables','Speeds queries','Stores images'],c:1},
  {q:'Responsive design means?',o:['Fast loading','Adapts to screen sizes','Has animations','Uses dark mode'],c:1},
  {q:'Best average-case sort complexity?',o:['Bubble O(n²)','Insertion O(n²)','Merge O(n log n)','Selection O(n²)'],c:2},
  {q:'Purpose of Git?',o:['Web hosting','Version control','DB management','Compilation'],c:1},
  {q:'ML stands for?',o:['Markup Language','Machine Learning','Module Library','Memory Load'],c:1},
]

function QuizPage({ user, setUser }) {
  const [state,setState]=useState('idle'); const [step,setStep]=useState(0); const [ans,setAns]=useState({}); const [time,setTime]=useState(300); const [res,setRes]=useState(null)
  const timerRef=useRef(null)
  // FIX: cleanup timer on unmount
  useEffect(()=>{ regClean('quiz',()=>{ if(timerRef.current)clearInterval(timerRef.current) }); return ()=>runClean('quiz') },[])
  function start(){ setState('running'); setStep(0); setAns({}); setTime(300); timerRef.current=setInterval(()=>setTime(t=>{ if(t<=1){clearInterval(timerRef.current);submit({});return 0} return t-1 }),1000) }
  async function submit(extra={}){ clearInterval(timerRef.current); const merged={...ans,...extra}; const arr=QS.map((_,i)=>merged[i]??-1); try{ const r=await axios.post(`/api/quiz/${user.uid}`,{answers:arr}); setRes(r.data); setState('done'); setUser(u=>({...u,pts:r.data.pts})); if(r.data.earned>0)toast(`+${r.data.earned} points! ⭐`) }catch{ setState('done'); setRes({score:0,correct:0,total:QS.length,earned:0,pts:user.pts||0}) } }
  const m=Math.floor(time/60),s=time%60
  if(state==='idle')return(<div><h2 style={{fontFamily:'Syne',marginBottom:14}}>🧠 Weekly Quiz</h2><Card style={{textAlign:'center',padding:40}}><div style={{fontSize:50,marginBottom:14}}>🧠</div><h2 style={{fontFamily:'Syne',fontSize:22,marginBottom:8}}>Weekly Tech Quiz</h2><p style={{color:'var(--t2)',marginBottom:22}}>Test your knowledge and earn points!</p><div style={{background:'var(--bg3)',borderRadius:9,padding:14,maxWidth:260,margin:'0 auto 22px',fontSize:13,color:'var(--t2)'}}><div>📝 {QS.length} questions • 5 minute timer</div><div style={{marginTop:5}}>🏆 50-74=10pts | 75=20pts | 76+=30pts</div></div><button className="btn btn-p" style={{padding:'11px 30px'}} onClick={start}>Start Quiz →</button></Card></div>)
  if(state==='done'&&res)return(<div><h2 style={{fontFamily:'Syne',marginBottom:14}}>🧠 Results</h2><Card style={{textAlign:'center',padding:28}}><div style={{fontSize:50,marginBottom:12}}>{res.score>=80?'🏆':res.score>=60?'🎯':'💪'}</div><h2 style={{fontFamily:'Syne',fontSize:26}}>Score: {res.score}/100</h2><div style={{fontSize:13,color:'var(--t2)',marginBottom:14}}>{res.correct}/{res.total} correct</div>{res.earned>0&&<div style={{display:'inline-flex',gap:5,padding:'9px 20px',background:'rgba(245,158,11,.18)',border:'1px solid rgba(245,158,11,.28)',borderRadius:20,fontFamily:'Syne',fontWeight:700,color:'var(--gold)',fontSize:16,marginBottom:14}}>⭐ +{res.earned} points!</div>}<br /><button className="btn btn-p" style={{marginTop:14}} onClick={()=>setState('idle')}>Try Again</button></Card></div>)
  const q=QS[step]
  return(<div><div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:14}}><h2 style={{fontFamily:'Syne'}}>Q {step+1}/{QS.length}</h2><div style={{fontFamily:'Syne',fontSize:28,fontWeight:800,color:time<60?'var(--red)':'var(--gold)'}}>{m}:{s<10?'0':''}{s}</div></div><Card><div style={{background:'var(--bg3)',borderRadius:9,padding:16,marginBottom:16,fontSize:14,fontWeight:500,lineHeight:1.6}}>{q.q}</div>{q.o.map((o,i)=><div key={i} onClick={()=>setAns(a=>({...a,[step]:i}))} style={{padding:'12px 16px',borderRadius:9,cursor:'pointer',marginBottom:9,fontSize:14,transition:'all .15s',border:`2px solid ${ans[step]===i?'var(--ac)':'var(--cb)'}`,background:ans[step]===i?'rgba(99,102,241,.1)':'var(--bg3)',color:'var(--t)'}}>{String.fromCharCode(65+i)}. {o}</div>)}<div style={{display:'flex',justifyContent:'space-between',marginTop:12}}><button className="btn btn-s btn-sm" onClick={()=>setStep(p=>Math.max(0,p-1))} disabled={step===0}>← Prev</button>{step<QS.length-1?<button className="btn btn-p btn-sm" onClick={()=>setStep(p=>p+1)}>Next →</button>:<button className="btn btn-g" onClick={()=>submit()}>Submit ✓</button>}</div></Card></div>)
}

// ── AI Interview ───────────────────────────────────────────────────────────────
const IVW_QS = {
  'Software Engineer': ['Tell me about yourself and your technical background.','Describe a challenging bug you debugged and how you solved it.','How do you handle tight deadlines and competing priorities?','Tell me about a time you learned a new technology quickly.','Where do you see yourself in 5 years?'],
  'Product Manager': ['Why do you want to be a Product Manager?','Describe a product you admire and what you would improve.','How do you prioritize features with limited resources?','Describe a time you made a data-driven product decision.','How do you handle disagreements with engineering teams?'],
  'Data Scientist': ['Walk me through your machine learning experience.','How would you approach a prediction problem with limited data?','Explain the bias-variance tradeoff simply.','Describe an end-to-end data science project you worked on.','How do you communicate findings to non-technical stakeholders?'],
}
function scoreAns(a){ if(!a||a.length<30)return Math.floor(Math.random()*15)+5; const kw=['situation','task','action','result','achieved','improved','led','built','delivered']; let s=20; const l=a.toLowerCase(); kw.forEach(k=>{if(l.includes(k))s+=7}); if(a.length>200)s+=14; if(a.length>400)s+=10; return Math.min(100,s+Math.floor(Math.random()*8)) }

function InterviewPage({ user }) {
  const [phase,setPhase]=useState('setup'); const [role,setRole]=useState('Software Engineer'); const [qi,setQi]=useState(0); const [answers,setAnswers]=useState([]); const [scores,setScores]=useState([]); const [answer,setAnswer]=useState(''); const [aiSpk,setAiSpk]=useState(false); const [cam,setCam]=useState(null); const [micOn,setMicOn]=useState(false); const [micSt,setMicSt]=useState('')
  const vidRef=useRef(null); const srRef=useRef(null); const qs=IVW_QS[role]
  // FIX: cleanup camera, mic, speech on unmount / page change
  useEffect(()=>{ regClean('interview',()=>{ window.speechSynthesis?.cancel(); if(cam)cam.getTracks().forEach(t=>t.stop()); if(srRef.current)try{srRef.current.stop()}catch(e){} }); return ()=>runClean('interview') },[cam])
  useEffect(()=>{ if(cam&&vidRef.current){vidRef.current.srcObject=cam;vidRef.current.play().catch(()=>{})} },[cam,phase])
  async function start(){ let s=null; if(navigator.mediaDevices?.getUserMedia){try{s=await navigator.mediaDevices.getUserMedia({video:true,audio:false})}catch(e){}} setCam(s); setPhase('call'); setQi(0); setAnswers([]); setScores([]); setAnswer(''); setTimeout(()=>speak(qs[0]),500) }
  function speak(t){ if(!window.speechSynthesis)return; window.speechSynthesis.cancel(); const u=new SpeechSynthesisUtterance(t); u.rate=0.88; u.pitch=1.05; const v=window.speechSynthesis.getVoices().find(v=>v.lang.startsWith('en')&&!v.name.toLowerCase().includes('zira')); if(v)u.voice=v; u.onstart=()=>setAiSpk(true); u.onend=u.onerror=()=>setAiSpk(false); window.speechSynthesis.speak(u) }
  function toggleMic(){ const SRC=window.SpeechRecognition||window.webkitSpeechRecognition; if(!SRC){setMicSt('Voice recognition requires Chrome or Edge. Please type your answer.');return} if(micOn){if(srRef.current)try{srRef.current.stop()}catch(e){}; setMicOn(false); setMicSt('Stopped. Review your answer and click ↗ to submit.'); return} const sr=new SRC(); sr.continuous=true; sr.interimResults=true; sr.lang='en-US'; sr.onstart=()=>{setMicOn(true);setMicSt('● Recording... speak clearly')}; sr.onresult=e=>{let t='';for(let i=0;i<e.results.length;i++)t+=e.results[i][0].transcript+(e.results[i].isFinal?' ':'');setAnswer(t)}; sr.onerror=e=>{setMicOn(false);setMicSt(e.error==='not-allowed'?'Mic denied. Click 🔒 in address bar → allow microphone.':e.error==='no-speech'?'No speech detected. Try again.':'Mic error: '+e.error)}; sr.onend=()=>{setMicOn(false);setMicSt(p=>p.includes('Recording')?'Done! Click ↗ to submit.':p)}; srRef.current=sr; try{sr.start()}catch(e){setMicSt('Cannot start: '+e.message)} }
  function sub(){ if(micOn&&srRef.current)try{srRef.current.stop()}catch(e){}; setMicOn(false); const na=[...answers,answer]; const ns=[...scores,scoreAns(answer)]; setAnswers(na); setScores(ns); setAnswer(''); if(qi+1>=qs.length){end(na,ns);return} const n=qi+1; setQi(n); setTimeout(()=>speak(qs[n]),300) }
  function end(a=answers,s=scores){ window.speechSynthesis?.cancel(); if(cam)cam.getTracks().forEach(t=>t.stop()); setCam(null); setPhase('done') }

  if(phase==='setup')return(<div><h2 style={{fontFamily:'Syne',marginBottom:14}}>🎙️ AI Interview</h2><Card style={{textAlign:'center',padding:40}}><div style={{fontSize:52,marginBottom:14}}>🎙️</div><h2 style={{fontFamily:'Syne',fontSize:22,marginBottom:8}}>AI Interview Simulator</h2><p style={{color:'var(--t2)',maxWidth:480,margin:'0 auto 18px',lineHeight:1.65}}>AI speaks each question aloud. Use 🎤 to answer by voice, or type. Camera opens automatically (optional).</p><div style={{background:'rgba(99,102,241,.07)',border:'1px solid rgba(99,102,241,.15)',borderRadius:9,padding:12,maxWidth:280,margin:'0 auto 20px',fontSize:12,color:'var(--t2)',textAlign:'left'}}>🎥 Camera optional<br />🔊 AI speaks each question<br />🎤 Voice or type answer<br />📊 STAR method scoring</div><div style={{maxWidth:260,margin:'0 auto'}}><label className="lbl">Target Role</label><select value={role} onChange={e=>setRole(e.target.value)} style={{marginBottom:16}}>{Object.keys(IVW_QS).map(r=><option key={r}>{r}</option>)}</select><button className="btn btn-p" style={{width:'100%',padding:12}} onClick={start}>Start AI Interview →</button></div></Card></div>)

  if(phase==='call'){const q=qs[qi]; return(<div style={{maxWidth:700,margin:'0 auto'}}>
    <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:12}}><h2 style={{fontFamily:'Syne',fontSize:18}}>🎙️ {role}</h2><div style={{display:'flex',gap:5}}>{qs.map((_,i)=><div key={i} style={{width:9,height:9,borderRadius:'50%',background:i<qi?'var(--green)':i===qi?'var(--ac)':'rgba(255,255,255,.2)'}} />)}</div></div>
    <div style={{background:'linear-gradient(135deg,#1e1b4b,#312e81)',borderRadius:14,padding:22,marginBottom:11,display:'flex',flexDirection:'column',alignItems:'center',gap:9,minHeight:170,position:'relative'}}>
      <div style={{width:72,height:72,background:aiSpk?'linear-gradient(135deg,#6366f1,#8b5cf6)':'rgba(99,102,241,.5)',borderRadius:'50%',display:'flex',alignItems:'center',justifyContent:'center',fontSize:28,border:`3px solid ${aiSpk?'#a78bfa':'rgba(139,92,246,.4)'}`,boxShadow:aiSpk?'0 0 0 8px rgba(99,102,241,.22)':'none',transition:'all .3s'}}>🤖</div>
      <div style={{fontSize:12,color:'#c4b5fd',fontWeight:600}}>{aiSpk?'🔊 Speaking...':'AI Interviewer'}</div>
      <div style={{position:'absolute',top:12,left:14,fontSize:11,color:'rgba(196,181,253,.55)'}}>Q {qi+1} / {qs.length}</div>
      {cam?<video ref={vidRef} muted playsInline style={{position:'absolute',bottom:10,right:10,width:110,height:78,borderRadius:9,objectFit:'cover',border:'2px solid rgba(255,255,255,.25)',background:'#000'}} />:<div style={{position:'absolute',bottom:10,right:10,width:110,height:78,borderRadius:9,background:'rgba(0,0,0,.4)',border:'1px solid rgba(255,255,255,.1)',display:'flex',flexDirection:'column',alignItems:'center',justifyContent:'center',fontSize:10,color:'rgba(255,255,255,.3)',gap:2}}><span style={{fontSize:18}}>📷</span>No Camera</div>}
    </div>
    <div style={{background:'var(--bg3)',border:'1px solid var(--cb)',borderRadius:12,padding:'14px 16px',marginBottom:10}}><div style={{fontSize:10,color:'var(--t3)',letterSpacing:'.5px',marginBottom:7}}>AI ASKS:</div><div style={{fontSize:14,lineHeight:1.6,fontWeight:500}}>{q}</div></div>
    <div style={{background:'var(--bg3)',border:'1px solid var(--cb)',borderRadius:12,padding:13}}>
      <div style={{fontSize:10,color:'var(--t3)',letterSpacing:'.5px',marginBottom:9,textAlign:'center'}}>YOUR ANSWER — SPEAK OR TYPE</div>
      <div style={{display:'flex',gap:9,alignItems:'flex-end'}}>
        <textarea value={answer} onChange={e=>setAnswer(e.target.value)} rows={4} placeholder="🎤 Click mic or type using STAR (Situation → Task → Action → Result)..." style={{flex:1,background:'var(--bg2)',border:'1px solid var(--cb)',color:'var(--t)',borderRadius:10,fontSize:12.5,resize:'none',padding:'11px 13px',fontFamily:'DM Sans',lineHeight:1.55}} />
        <div style={{display:'flex',flexDirection:'column',gap:8}}>
          <button onClick={toggleMic} style={{width:48,height:48,borderRadius:'50%',background:micOn?'linear-gradient(135deg,#dc2626,#b91c1c)':'linear-gradient(135deg,#4f46e5,#7c3aed)',border:micOn?'2px solid #ef4444':'2px solid rgba(139,92,246,.5)',color:'#fff',fontSize:22,cursor:'pointer',boxShadow:micOn?'0 0 0 5px rgba(239,68,68,.22)':'none',display:'flex',alignItems:'center',justifyContent:'center'}}>{micOn?'⏹':'🎤'}</button>
          <button onClick={sub} style={{width:48,height:48,borderRadius:'50%',background:'linear-gradient(135deg,var(--green),#059669)',border:'none',color:'#fff',fontSize:18,cursor:'pointer',fontWeight:700,display:'flex',alignItems:'center',justifyContent:'center'}}>↗</button>
        </div>
      </div>
      {micSt&&<div style={{fontSize:11,color:micOn?'#4ade80':'var(--t3)',marginTop:7,textAlign:'center',fontWeight:micOn?600:400}}>{micSt}</div>}
    </div>
    <div style={{display:'flex',gap:9,justifyContent:'center',paddingTop:11}}>
      <button onClick={()=>speak(q)} className="btn btn-s btn-sm">🔊 Replay</button>
      <button onClick={sub} className="btn btn-s btn-sm" style={{color:'var(--t3)'}}>Skip →</button>
      <button onClick={()=>end()} style={{padding:'7px 16px',borderRadius:9,background:'rgba(239,68,68,.14)',border:'1px solid rgba(239,68,68,.24)',color:'#f87171',cursor:'pointer',fontSize:12,fontFamily:'DM Sans'}}>📞 End</button>
    </div>
  </div>)}

  const total=scores.length?Math.round(scores.reduce((a,b)=>a+b,0)/qs.length):0
  return(<div><h2 style={{fontFamily:'Syne',marginBottom:14}}>🎙️ Interview Results</h2><Card><div style={{textAlign:'center',padding:'18px 0 22px'}}><div style={{fontSize:48,marginBottom:11}}>{total>=80?'🏆':total>=60?'🎯':'💪'}</div><div style={{fontFamily:'Syne',fontSize:26,fontWeight:800}}>Score: {total}/100</div><span style={{display:'inline-block',marginTop:8,padding:'6px 16px',borderRadius:20,fontSize:13,background:total>=80?'rgba(16,185,129,.14)':total>=60?'rgba(245,158,11,.14)':'rgba(239,68,68,.14)',color:total>=80?'#34d399':total>=60?'#fbbf24':'#f87171'}}>{total>=80?'Excellent':total>=60?'Good':'Needs Practice'}</span></div>
  {qs.map((q,i)=><div key={i} style={{padding:'11px 0',borderBottom:'1px solid var(--cb)'}}><div style={{display:'flex',justifyContent:'space-between',marginBottom:4}}><div style={{fontSize:12,fontWeight:500,flex:1,paddingRight:11}}>{q}</div><span style={{padding:'2px 8px',borderRadius:20,fontSize:11,background:(scores[i]||0)>=70?'rgba(16,185,129,.14)':'rgba(245,158,11,.14)',color:(scores[i]||0)>=70?'#34d399':'#fbbf24',whiteSpace:'nowrap'}}>{scores[i]||0}/100</span></div><div style={{fontSize:11,color:'var(--t3)'}}>{(scores[i]||0)>=80?'✅ Excellent STAR structure!':(scores[i]||0)>=60?'📝 Add specific metrics and results.':'⚠️ Use STAR: Situation → Task → Action → Result.'}</div></div>)}
  <button className="btn btn-p" style={{width:'100%',marginTop:16}} onClick={()=>setPhase('setup')}>Start New Interview</button></Card></div>)
}
