import React, { useState } from 'react'
import axios from 'axios'
import { useApp } from '../context/AppContext.jsx'

export default function Auth() {
  const { setUser } = useApp()
  const [tab, setTab] = useState('login')
  const [err, setErr] = useState('')
  const [ok, setOk] = useState('')
  const [loading, setLoading] = useState(false)

  const [lEmail, setLEmail] = useState('')
  const [lPass, setLPass]   = useState('')
  const [sName, setSName]   = useState('')
  const [sEmail, setSEmail] = useState('')
  const [sPass, setSPass]   = useState('')
  const [sRole, setSRole]   = useState('student')
  const [sCollege, setSCollege] = useState('')
  const [sDeg, setSDeg]     = useState('')
  const [sGrad, setSGrad]   = useState('')
  const [sMajor, setSMajor] = useState('')
  const [sCompany, setSCompany] = useState('')
  const [sRoleT, setSRoleT] = useState('')
  const [sExp, setSExp]     = useState('')

  const emailOk = (e) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test((e||'').trim())

  function getErrMsg(ex) {
    if (!ex) return 'Something went wrong. Please try again.'
    if (!ex.response || ex.code === 'ERR_NETWORK')
      return 'Cannot reach the server. Make sure the backend is running:\n  cd backend\n  uvicorn main:app --reload --port 8000'
    const d = ex.response?.data
    if (typeof d?.detail === 'string') return d.detail
    if (Array.isArray(d?.detail)) return d.detail.map(e => e.msg || JSON.stringify(e)).join('. ')
    if (typeof d === 'string') return d
    return `Server error (${ex.response?.status}). Please try again.`
  }

  async function doLogin(e) {
    e?.preventDefault()
    setErr(''); setOk('')
    const email = lEmail.trim()
    if (!email)          return setErr('Please enter your email address.')
    if (!emailOk(email)) return setErr('Please enter a valid email (e.g. name@gmail.com).')
    if (!lPass)          return setErr('Please enter your password.')
    setLoading(true)
    try {
      const r = await axios.post('/api/auth/login', { email, password: lPass })
      setUser(r.data)
    } catch (ex) {
      setErr(getErrMsg(ex))
    } finally { setLoading(false) }
  }

  async function doSignup(e) {
    e?.preventDefault()
    setErr(''); setOk('')
    const name = sName.trim(), email = sEmail.trim(), college = sCollege.trim()
    if (!name)           return setErr('Please enter your full name.')
    if (!email)          return setErr('Please enter your email address.')
    if (!emailOk(email)) return setErr('Please enter a valid email (e.g. name@gmail.com).')
    if (!college)        return setErr('Please enter your college / university name.')
    if (!sPass)          return setErr('Please create a password.')
    if (sPass.length < 6) return setErr('Password must be at least 6 characters.')
    setLoading(true)
    try {
      const r = await axios.post('/api/auth/signup', {
        name, email, password: sPass, role: sRole, college,
        degree: sDeg, gradYear: sGrad, major: sMajor,
        currentCompany: sCompany, currentRole: sRoleT, experience: sExp,
      })
      setOk(`Welcome, ${r.data.name}! 🎉 Account created successfully.`)
      setTimeout(() => setUser(r.data), 900)
    } catch (ex) {
      setErr(getErrMsg(ex))
    } finally { setLoading(false) }
  }

  const sw = (t) => { setTab(t); setErr(''); setOk('') }

  return (
    <div style={{ minHeight:'100vh', display:'flex', alignItems:'center', justifyContent:'center', background:'var(--bg)', padding:20, overflowY:'auto' }}>
      <div style={{ width:'100%', maxWidth:460 }}>

        <div style={{ textAlign:'center', marginBottom:24 }}>
          <div style={{ width:52, height:52, background:'linear-gradient(135deg,#6366f1,#8b5cf6)', borderRadius:14, display:'inline-flex', alignItems:'center', justifyContent:'center', fontFamily:'Syne', fontWeight:800, fontSize:22, color:'#fff', marginBottom:11 }}>A</div>
          <div style={{ fontFamily:'Syne', fontWeight:800, fontSize:22, color:'var(--t)' }}>AlumniConnect + HVS.Ai</div>
          <div style={{ color:'var(--t2)', fontSize:13, marginTop:4 }}>Connect with alumni from your college</div>
        </div>

        <div className="card">
          <div style={{ display:'flex', gap:4, background:'var(--bg3)', borderRadius:10, padding:4, marginBottom:20 }}>
            {[['login','Sign In'],['signup','Sign Up']].map(([t,l]) => (
              <button key={t} onClick={() => sw(t)} style={{ flex:1, padding:'9px 0', borderRadius:8, fontSize:13, fontWeight:600, border:'none', cursor:'pointer', fontFamily:'DM Sans', background:tab===t?'var(--ac)':'transparent', color:tab===t?'#fff':'var(--t2)', transition:'all .15s' }}>{l}</button>
            ))}
          </div>

          {err && <div style={{ background:'rgba(239,68,68,.1)', border:'1px solid rgba(239,68,68,.3)', borderRadius:9, padding:'11px 14px', fontSize:13, color:'#f87171', marginBottom:14, lineHeight:1.6, whiteSpace:'pre-line' }}>{err}</div>}
          {ok  && <div style={{ background:'rgba(16,185,129,.1)', border:'1px solid rgba(16,185,129,.3)', borderRadius:9, padding:'11px 14px', fontSize:13, color:'#34d399', marginBottom:14 }}>{ok}</div>}

          {tab === 'login' && (
            <form onSubmit={doLogin} noValidate>
              <label className="lbl">Email Address</label>
              <input type="email" value={lEmail} placeholder="e.g. name@gmail.com" onChange={e => setLEmail(e.target.value)} onKeyDown={e => e.key==='Enter' && doLogin(e)} autoComplete="email" />
              <label className="lbl">Password</label>
              <input type="password" value={lPass} placeholder="your password" onChange={e => setLPass(e.target.value)} onKeyDown={e => e.key==='Enter' && doLogin(e)} autoComplete="current-password" />
              <button type="submit" className="btn btn-p" style={{ width:'100%', marginTop:18, padding:11 }} disabled={loading}>
                {loading ? 'Signing in…' : 'Sign In →'}
              </button>
              <p style={{ textAlign:'center', fontSize:12, color:'var(--t3)', marginTop:13 }}>
                No account yet? <strong style={{ color:'var(--ac)', cursor:'pointer' }} onClick={() => sw('signup')}>Create one free →</strong>
              </p>
            </form>
          )}

          {tab === 'signup' && (
            <form onSubmit={doSignup} noValidate>
              <label className="lbl">Full Name *</label>
              <input value={sName} placeholder="Your full name" onChange={e => setSName(e.target.value)} />
              <label className="lbl">Email Address *</label>
              <input type="email" value={sEmail} placeholder="e.g. name@gmail.com" onChange={e => setSEmail(e.target.value)} autoComplete="email" />
              <label className="lbl">I am a…</label>
              <select value={sRole} onChange={e => setSRole(e.target.value)}>
                <option value="student">Student — looking for mentors</option>
                <option value="alumni">Alumni / Mentor — giving back</option>
              </select>
              <label className="lbl">College / University *</label>
              <input value={sCollege} placeholder="e.g. IIT Bombay, MIT, Harvard" onChange={e => setSCollege(e.target.value)} />

              {sRole === 'student' ? (<>
                <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:10, marginTop:12 }}>
                  <div><label className="lbl" style={{ marginTop:0 }}>Degree</label><input value={sDeg} placeholder="e.g. B.Tech CS" onChange={e => setSDeg(e.target.value)} /></div>
                  <div><label className="lbl" style={{ marginTop:0 }}>Grad Year</label><input value={sGrad} placeholder="2026" onChange={e => setSGrad(e.target.value)} /></div>
                </div>
                <label className="lbl">Major / Field</label>
                <input value={sMajor} placeholder="e.g. Computer Science" onChange={e => setSMajor(e.target.value)} />
              </>) : (<>
                <label className="lbl">Current Company</label>
                <input value={sCompany} placeholder="e.g. Google, TCS" onChange={e => setSCompany(e.target.value)} />
                <label className="lbl">Current Role</label>
                <input value={sRoleT} placeholder="e.g. Senior Software Engineer" onChange={e => setSRoleT(e.target.value)} />
                <label className="lbl">Years of Experience</label>
                <input value={sExp} placeholder="e.g. 6 years" onChange={e => setSExp(e.target.value)} />
              </>)}

              <label className="lbl">Password * (min 6 characters)</label>
              <input type="password" value={sPass} placeholder="create a strong password" onChange={e => setSPass(e.target.value)} autoComplete="new-password" />
              {sPass.length > 0 && sPass.length < 6 && <div style={{ fontSize:11, color:'var(--red)', marginTop:4 }}>Too short ({sPass.length}/6 chars)</div>}
              {sPass.length >= 6 && <div style={{ fontSize:11, color:'var(--green)', marginTop:4 }}>✓ Password looks good</div>}

              <button type="submit" className="btn btn-p" style={{ width:'100%', marginTop:18, padding:11 }} disabled={loading}>
                {loading ? 'Creating account…' : 'Create Account →'}
              </button>
              <p style={{ textAlign:'center', fontSize:12, color:'var(--t3)', marginTop:13 }}>
                Already have an account? <strong style={{ color:'var(--ac)', cursor:'pointer' }} onClick={() => sw('login')}>Sign in →</strong>
              </p>
            </form>
          )}
        </div>

        <div style={{ marginTop:14, padding:'10px 14px', background:'rgba(99,102,241,.08)', border:'1px solid rgba(99,102,241,.18)', borderRadius:9, fontSize:12, color:'var(--t2)', textAlign:'center', lineHeight:1.6 }}>
          💡 To test connections: sign up <strong>two accounts</strong> with the <strong>exact same college name</strong> — one as Student, one as Alumni
        </div>
      </div>
    </div>
  )
}
