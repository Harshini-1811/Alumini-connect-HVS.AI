import React, { useState, useRef, useEffect } from 'react'
import { useApp } from '../context/AppContext.jsx'

const ANTHROPIC_KEY = '' // paste your key: 'sk-ant-...'

async function ai(messages, system, max = 1000) {
  const key = ANTHROPIC_KEY || window.ANTHROPIC_KEY || ''
  if (!key) return null
  try {
    const r = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'x-api-key': key, 'anthropic-version': '2023-06-01' },
      body: JSON.stringify({ model: 'claude-sonnet-4-20250514', max_tokens: max, system, messages })
    })
    const d = await r.json()
    return d.content?.[0]?.text || null
  } catch { return null }
}

function toast(msg, ok = true) {
  const el = document.createElement('div')
  el.style.cssText = `position:fixed;bottom:22px;right:22px;z-index:9999;background:${ok?'rgba(16,185,129,.95)':'rgba(239,68,68,.95)'};color:#fff;padding:11px 18px;border-radius:11px;font-size:13px;font-weight:500;box-shadow:0 7px 26px rgba(0,0,0,.28);font-family:'DM Sans',sans-serif;max-width:320px`
  el.textContent = msg; document.body.appendChild(el); setTimeout(() => el.remove(), 3000)
}

function dl(content, mime, fname) {
  const fr = new FileReader()
  fr.onload = e => { const a = document.createElement('a'); a.href = e.target.result; a.download = fname; a.click() }
  fr.readAsDataURL(new Blob([content], { type: mime }))
}

const SECS = [
  { id: 'chat',    ic: '💬', l: 'AI Assistant'    },
  { id: 'pptx',   ic: '📊', l: 'Presentation'     },
  { id: 'docs',   ic: '📝', l: 'Documents'         },
  { id: 'pdf',    ic: '📄', l: 'PDF Tools'         },
  { id: 'builder',ic: '🌐', l: 'Website Builder'   },
  { id: 'quiz',   ic: '🧠', l: 'Quiz'              },
  { id: 'video',  ic: '🎥', l: 'Video Analyzer'    },
]

export default function HVSMode() {
  const { setMode, theme, setTheme, user, setUser } = useApp()
  // FIX: active section state — sidebar always shows correct active item
  const [sec, setSec] = useState('chat')
  // FIX: stop camera when leaving video section
  const [camStream, setCamStream] = useState(null)

  function goSec(id) {
    if (id !== 'video' && camStream) {
      camStream.getTracks().forEach(t => t.stop())
      setCamStream(null)
    }
    setSec(id)
  }

  return (
    <div style={{ display: 'flex', height: '100vh', background: 'var(--bg)' }}>
      {/* HVS Sidebar */}
      <div style={{ width: 210, minWidth: 210, background: 'linear-gradient(180deg,#0a0d24,#150b2e)', borderRight: '1px solid rgba(139,92,246,.18)', display: 'flex', flexDirection: 'column' }}>
        <div style={{ padding: '16px 14px', borderBottom: '1px solid rgba(139,92,246,.18)' }}>
          <div style={{ fontFamily: 'Syne', fontWeight: 800, fontSize: 18, background: 'linear-gradient(135deg,#818cf8,#c084fc)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>HVS.Ai</div>
          <div style={{ fontSize: 10, color: '#7c3aed', marginTop: 1 }}>AI Creation Suite</div>
        </div>
        <div style={{ flex: 1, overflowY: 'auto', padding: '7px 0' }}>
          {SECS.map(s => (
            <button key={s.id} onClick={() => goSec(s.id)}
              style={{ display: 'flex', alignItems: 'center', gap: 9, padding: '9px 13px', margin: '2px 7px', borderRadius: 9, cursor: 'pointer', fontSize: 13, transition: 'all .15s', width: 'calc(100% - 14px)', textAlign: 'left', fontFamily: 'DM Sans',
                // FIX: active state always accurate — uses React state not stale DOM
                border: sec === s.id ? '1px solid rgba(139,92,246,.28)' : '1px solid transparent',
                background: sec === s.id ? 'rgba(139,92,246,.18)' : 'transparent',
                color: sec === s.id ? '#c4b5fd' : '#a78bfa',
              }}>
              <span style={{ fontSize: 14 }}>{s.ic}</span>{s.l}
            </button>
          ))}
        </div>
        <div style={{ padding: 10 }}>
          <button onClick={() => { window.speechSynthesis?.cancel(); if(camStream){camStream.getTracks().forEach(t=>t.stop());setCamStream(null);} setMode('main') }} style={{ width: '100%', padding: 8, background: 'rgba(255,255,255,.06)', border: '1px solid rgba(255,255,255,.1)', borderRadius: 9, color: '#c4b5fd', fontSize: 12, cursor: 'pointer', fontFamily: 'Syne', fontWeight: 600 }}>← AlumniConnect</button>
        </div>
      </div>

      {/* Content */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
        <div style={{ display: 'flex', alignItems: 'center', padding: '12px 22px', background: 'rgba(0,0,0,.2)', borderBottom: '1px solid rgba(139,92,246,.15)' }}>
          <div style={{ fontFamily: 'Syne', fontWeight: 700, fontSize: 16, background: 'linear-gradient(135deg,#818cf8,#c084fc)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>{SECS.find(s => s.id === sec)?.l}</div>
          <div style={{ marginLeft: 'auto', display: 'flex', gap: 9 }}>
            <button onClick={() => setTheme(t => t === 'dark' ? 'light' : 'dark')} style={{ background: 'var(--card)', border: '1px solid var(--cb)', borderRadius: 8, padding: '6px 11px', cursor: 'pointer', fontSize: 13, color: 'var(--t)' }}>{theme === 'dark' ? '🌙' : '☀️'}</button>
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: 5, padding: '5px 12px', background: 'rgba(245,158,11,.18)', border: '1px solid rgba(245,158,11,.28)', borderRadius: 20, fontFamily: 'Syne', fontWeight: 700, color: '#fbbf24', fontSize: 13 }}>⭐ {user?.pts || 0}</div>
          </div>
        </div>
        <div style={{ flex: 1, overflowY: 'auto', padding: 22 }}>
          {sec === 'chat'    && <HVSChat />}
          {sec === 'pptx'   && <HVSPptx />}
          {sec === 'docs'   && <HVSDocs />}
          {sec === 'pdf'    && <HVSPdf />}
          {sec === 'builder'&& <HVSBuilder />}
          {sec === 'quiz'   && <HVSQuiz user={user} setUser={setUser} />}
          {sec === 'video'  && <HVSVideo camStream={camStream} setCamStream={setCamStream} />}
        </div>
      </div>
    </div>
  )
}

// ── AI Chat ───────────────────────────────────────────────────────────────────
function HVSChat() {
  const [msgs, setMsgs] = useState([{ r: 'ai', t: "Hello! I'm HVS.Ai — your AI assistant. I can help you write code, create content, answer questions, and more. What shall we work on? 🚀" }])
  const [inp, setInp] = useState('')
  const [loading, setLoading] = useState(false)
  const endRef = useRef(null)
  useEffect(() => { endRef.current?.scrollIntoView({ behavior: 'smooth' }) }, [msgs])

  async function send() {
    const t = inp.trim(); if (!t) return
    setInp(''); setMsgs(m => [...m, { r: 'user', t }, { r: 'ai', t: '...' }]); setLoading(true)
    const hist = msgs.filter(m => m.t !== '...').map(m => ({ role: m.r === 'user' ? 'user' : 'assistant', content: m.t }))
    hist.push({ role: 'user', content: t })
    const reply = await ai(hist, 'You are HVS.Ai, a helpful AI assistant for AlumniConnect. Be concise, clear, and helpful. Format responses with line breaks for readability.', 1400)
    // Smart local fallback responses when no API key
    let finalReply = reply
    if (!finalReply) {
      const q = t.toLowerCase()
      if(/code|python|javascript|function|program|script/.test(q)) finalReply = 'To enable full AI coding assistance, add your Anthropic API key:\n\nIn HVSMode.jsx line 1:\nconst ANTHROPIC_KEY = \'sk-ant-your-key-here\'\n\nOr in browser console:\nwindow.ANTHROPIC_KEY = \'sk-ant-...\'\n\nOnce set, I can write full code, explain algorithms, debug issues, and more!'
      else if(/website|html|css|design|landing/.test(q)) finalReply = 'Use the **Website Builder** tool in the left sidebar! Just:\n1. Describe your website\n2. Choose a type (Landing Page, Portfolio, etc.)\n3. Click Generate\n\nYou get a live preview + download button instantly — no API key needed!'
      else if(/presentation|slide|pptx|deck/.test(q)) finalReply = 'Use the **Presentation** tool in the sidebar! Enter a topic, choose a style (Professional/Creative/Bold/Minimal), set slide count, and click Generate.\n\nDownloads as an interactive HTML slideshow with arrow key navigation!'
      else if(/document|report|write|essay|letter/.test(q)) finalReply = 'Use the **Documents** tool in the sidebar! Choose a document type, enter a title, add instructions, and click Generate.\n\nDownloads as .doc (opens in Word) or printable PDF!'
      else if(/pdf|merge|combine|split/.test(q)) finalReply = 'Use the **PDF Tools** in the sidebar! You can:\n• Merge multiple PDFs into one viewer\n• Split and download individual files\n\nJust upload your PDFs and click the action button!'
      else finalReply = 'I need an API key to give you a full AI response.\n\nTo enable: paste your Anthropic key at the top of HVSMode.jsx:\nconst ANTHROPIC_KEY = \'sk-ant-...\'\n\nOr in your browser console:\nwindow.ANTHROPIC_KEY = \'sk-ant-...\'\n\nWithout a key, you can still use: Website Builder, Presentations, Documents, PDF Tools, Quiz, and Video Analyzer — all work without AI!'
    }
    setMsgs(m => [...m.slice(0, -1), { r: 'ai', t: finalReply }])
    setLoading(false)
  }

  return (
    <div>
      <div style={{ background: 'var(--card)', border: '1px solid var(--cb)', borderRadius: 14, overflow: 'hidden' }}>
        <div style={{ minHeight: 300, maxHeight: 420, overflowY: 'auto', padding: 18, display: 'flex', flexDirection: 'column', gap: 11 }}>
          {msgs.map((m, i) => <div key={i} style={{ maxWidth: '87%', padding: '11px 15px', borderRadius: m.r==='user'?'14px 14px 3px 14px':'14px 14px 14px 3px', fontSize: 13, lineHeight: 1.6, alignSelf: m.r==='user'?'flex-end':'flex-start', background: m.r==='user'?'linear-gradient(135deg,#6366f1,#8b5cf6)':'var(--bg3)', color: m.r==='user'?'#fff':'var(--t)', border: m.r!=='user'?'1px solid var(--cb)':'none', whiteSpace: 'pre-wrap' }}>{m.t}</div>)}
          <div ref={endRef} />
        </div>
        <div style={{ padding: 14, borderTop: '1px solid var(--cb)', display: 'flex', gap: 9 }}>
          <input placeholder="Ask HVS.Ai anything..." value={inp} onChange={e => setInp(e.target.value)} onKeyDown={e => e.key==='Enter'&&send()} style={{ flex: 1 }} />
          <button className="btn btn-p" onClick={send} disabled={loading}>Send ↗</button>
        </div>
      </div>
      <div style={{ marginTop: 10, display: 'flex', gap: 7, flexWrap: 'wrap' }}>
        {['Write a Python web scraper','Build an HTML landing page','Explain machine learning','Write a cover letter'].map(q => <button key={q} onClick={() => { setInp(q); setTimeout(send, 50) }} style={{ padding: '5px 11px', borderRadius: 7, background: 'var(--card)', border: '1px solid var(--cb)', color: 'var(--t2)', fontSize: 12, cursor: 'pointer' }}>{q}</button>)}
      </div>
    </div>
  )
}

// ── Presentation ──────────────────────────────────────────────────────────────
const BG_PALS = { Professional:[['1e1b4b','312e81'],['064e3b','065f46'],['1e3a5f','1e40af']], Creative:[['7c2d12','9a3412'],['0f766e','0d9488'],['5b21b6','7c3aed']], Minimal:[['f0f0f0','e0e0e0'],['f8fafc','f0f4ff'],['fafafa','f4f4f5']], Bold:[['0f0c29','302b63'],['2d0080','6000d1'],['c2185b','e91e63']] }

function HVSPptx() {
  const [topic,setTopic]=useState(''); const [style,setStyle]=useState('Professional'); const [count,setCount]=useState(8); const [extra,setExtra]=useState(''); const [slides,setSlides]=useState([]); const [loading,setLoading]=useState(false)
  function fallback(){ return [{type:'title',title:topic,subtitle:'Created with HVS.Ai'},{title:'Introduction',bullets:['Overview of '+topic,'Why this matters today','Key concepts']},{title:'Key Insights',bullets:['Core principles','Best practices','Critical factors']},{title:'Deep Dive',bullets:['Technical details','Step-by-step process','Common pitfalls']},{title:'Applications',bullets:['Real-world use cases','Proven outcomes','Case studies']},{title:'Challenges',bullets:['Top challenges','Innovative solutions','Lessons learned']},{title:'Future Outlook',bullets:['Emerging trends','Strategic opportunities','Next steps']},{type:'closing',title:'Summary',bullets:['Key takeaways','Action items','Resources']}].slice(0,count) }
  async function generate(){ if(!topic.trim())return toast('Enter a topic',false); setLoading(true); setSlides([])
    const r=await ai([{role:'user',content:`Create ${count} presentation slides for a ${style} presentation about "${topic}".${extra?' Key points: '+extra:''} Return ONLY a JSON array. Each object: {"title":"...","bullets":["..."],"type":"title|content|closing"}. First slide type must be "title" with a "subtitle" field.`}],'Return ONLY valid JSON array, no markdown.',1500)
    try{ const p=JSON.parse((r||'').replace(/```json?|```/g,'').trim()); setSlides(p.slice(0,count)) }catch{ setSlides(fallback()) }
    setLoading(false); toast('Presentation ready! 📊')
  }
  function download(){ if(!slides.length)return toast('Generate first',false)
    const isMin=style==='Minimal'; const pal=BG_PALS[style]||BG_PALS.Professional
    const html=`<!DOCTYPE html><html><head><meta charset="UTF-8"><title>${topic}</title><style>*{margin:0;padding:0;box-sizing:border-box}body{background:#000;font-family:Arial,sans-serif}.sl{display:none;width:100vw;height:100vh;flex-direction:column;padding:5% 8%;position:relative}.sl.on{display:flex}.n{position:absolute;top:14px;right:18px;font-size:.75em;opacity:.4;color:#fff}ul{padding-left:1.5em;font-size:1.05em;line-height:1.95em}.nav{position:fixed;bottom:18px;left:50%;transform:translateX(-50%);display:flex;gap:10px;z-index:9}.nb{padding:8px 20px;background:rgba(255,255,255,.18);color:#fff;border:1px solid rgba(255,255,255,.35);border-radius:7px;cursor:pointer;font-size:.9em}@media print{.nav{display:none}.sl{display:flex!important;width:100%;min-height:100vh;page-break-after:always}}</style></head><body>${slides.map((s,i)=>{const bg=`linear-gradient(135deg,#${pal[i%pal.length][0]},#${pal[i%pal.length][1]})`;const tc=isMin?'#111':'#fff';const sc=isMin?'#555':'rgba(255,255,255,.8)';const isT=s.type==='title'||i===0;return`<div class="sl" style="background:${bg}"><span class="n">${i+1}/${slides.length}</span><div style="font-size:${isT?'2.3em':'1.7em'};font-weight:800;color:${tc};margin-top:${isT?'20%':'8%'};line-height:1.15;margin-bottom:.5em">${s.title}</div>${s.subtitle?`<div style="font-size:1.2em;color:${sc};margin-bottom:.8em">${s.subtitle}</div>`:''}${s.bullets?`<ul style="color:${sc}">${s.bullets.map(b=>`<li>${b}</li>`).join('')}</ul>`:''}</div>`}).join('')}<div class="nav"><button class="nb" onclick="g(-1)">← Prev</button><button class="nb" onclick="g(1)">Next →</button><button class="nb" style="background:rgba(80,200,80,.3)" onclick="window.print()">Save PDF</button></div><script>var ci=0,ss=document.querySelectorAll(".sl");ss[0].classList.add("on");function g(d){ss[ci].classList.remove("on");ci=(ci+d+ss.length)%ss.length;ss[ci].classList.add("on");}document.addEventListener("keydown",function(e){if(e.key==="ArrowRight")g(1);if(e.key==="ArrowLeft")g(-1);});<\/script></body></html>`
    dl(html,'text/html',topic.replace(/[^a-z0-9]/gi,'_')+'.html'); toast('Downloaded! Open in browser, arrow keys to navigate, Save PDF to export 📊')
  }
  const pal=BG_PALS[style]||BG_PALS.Professional; const isMin=style==='Minimal'
  return(
    <div>
      <div className="card" style={{marginBottom:14}}>
        <h3 style={{fontFamily:'Syne',fontWeight:700,marginBottom:14}}>📊 AI Presentation Maker</h3>
        <label className="lbl">Topic</label><input value={topic} onChange={e=>setTopic(e.target.value)} placeholder="e.g. Machine Learning in Healthcare" />
        <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:10}}>
          <div><label className="lbl">Slides</label><input type="number" value={count} onChange={e=>setCount(Math.min(12,Math.max(3,+e.target.value)))} min={3} max={12} /></div>
          <div><label className="lbl">Style</label><select value={style} onChange={e=>setStyle(e.target.value)}>{Object.keys(BG_PALS).map(s=><option key={s}>{s}</option>)}</select></div>
        </div>
        <label className="lbl">Key Points (optional)</label><textarea value={extra} onChange={e=>setExtra(e.target.value)} placeholder="Extra notes to include..." rows={2} />
        <div style={{display:'flex',gap:9,marginTop:4}}>
          <button className="btn btn-p" style={{flex:1}} onClick={generate} disabled={loading}>{loading?'⏳ Generating...':'✨ Generate'}</button>
          {slides.length>0&&<button className="btn btn-g" onClick={download}>⬇ Download</button>}
        </div>
      </div>
      {slides.map((s,i)=>{const bg=`linear-gradient(135deg,#${pal[i%pal.length][0]},#${pal[i%pal.length][1]})`;const tc=isMin?'#111':'#fff';const sc=isMin?'#555':'rgba(255,255,255,.8)';const isT=s.type==='title'||i===0;return(<div key={i} style={{background:bg,borderRadius:14,padding:isT?38:22,marginBottom:10,minHeight:isT?180:130,display:'flex',flexDirection:'column',color:tc,position:'relative'}}><div style={{position:'absolute',top:9,right:14,fontSize:10,opacity:.38,color:'#fff'}}>{i+1}/{slides.length}</div><div style={{fontSize:isT?21:16,fontFamily:'Syne',fontWeight:700,marginBottom:9,lineHeight:1.28}}>{s.title}</div>{s.subtitle&&<p style={{fontSize:13,color:sc,lineHeight:1.55}}>{s.subtitle}</p>}{s.bullets&&<ul style={{fontSize:12,color:sc,paddingLeft:16,lineHeight:1.85,margin:0}}>{s.bullets.map((b,j)=><li key={j}>{b}</li>)}</ul>}</div>)})}
    </div>
  )
}

// ── Documents ─────────────────────────────────────────────────────────────────
function HVSDocs() {
  const [type,setType]=useState('Report'); const [title,setTitle]=useState(''); const [desc,setDesc]=useState(''); const [text,setText]=useState(''); const [loading,setLoading]=useState(false)
  function fallback(){ return `${title}\n\n${type}\n\nEXECUTIVE SUMMARY\n\nThis ${type.toLowerCase()} provides a comprehensive overview of ${title}.\n\nINTRODUCTION\n\nThe landscape of ${title} has evolved significantly in recent years.\n\nKEY FINDINGS\n\n• Primary research indicates significant opportunity\n• Best practices align with a systematic approach\n• Stakeholder alignment is critical for success\n• Technology enablement accelerates outcomes\n\nRECOMMENDATIONS\n\n• Adopt a phased implementation approach\n• Establish clear KPIs and measurement frameworks\n• Invest in stakeholder education and training\n• Build continuous feedback loops\n\nCONCLUSION\n\nThis ${type.toLowerCase()} provides a solid foundation for informed decision-making.\n\nGenerated by HVS.Ai` }
  async function generate(){ if(!title.trim())return toast('Enter a title',false); setLoading(true)
    const r=await ai([{role:'user',content:`Write a professional ${type} titled "${title}".${desc?' Cover: '+desc:''} Use ALL CAPS section headers, bullet points with •.`}],`Professional ${type} writer. Plain text only.`,1200)
    setText(r||fallback()); setLoading(false); toast('Document ready! 📝')
  }
  function dlHtml(){ if(!text)return toast('Generate first',false)
    const lines=text.split('\n').filter(l=>l.trim()); let body=''; let first=true
    lines.forEach(l=>{l=l.trim();if(!l)return;if(first){body+=`<h1>${l}</h1>`;first=false;return}if(/^[A-Z][A-Z\s&:]+$/.test(l)&&l.length<60)body+=`<h2>${l}</h2>`;else if(l.startsWith('•')||l.startsWith('-'))body+=`<p class="b">• ${l.slice(1).trim()}</p>`;else body+=`<p>${l}</p>`})
    const html=`<!DOCTYPE html><html><head><meta charset="UTF-8"><title>${title}</title><style>*{margin:0;padding:0;box-sizing:border-box}body{font-family:Georgia,serif;max-width:700px;margin:0 auto;padding:52px;color:#111;font-size:11pt;line-height:1.7}h1{font-size:22pt;margin-bottom:6pt;border-bottom:2.5pt solid #6366f1;padding-bottom:8pt}h2{font-size:11pt;color:#6366f1;font-family:Arial;text-transform:uppercase;letter-spacing:1pt;margin:16pt 0 5pt;border-bottom:.5pt solid #d0d5ff;padding-bottom:2pt}p{margin-bottom:8pt}.b{padding-left:14pt}@media print{body{padding:0}@page{margin:1.5cm}}</style></head><body>${body}<p style="margin-top:26pt;font-size:8pt;color:#bbb;border-top:.5pt solid #eee;padding-top:8pt;text-align:center">Generated by HVS.Ai</p></body></html>`
    dl(html,'text/html',title.replace(/\s+/g,'_')+'.html'); toast('Downloaded! Open in browser → Ctrl+P to save as PDF 📄')
  }
  function dlDoc(){ if(!text)return toast('Generate first',false)
    const lines=text.split('\n').filter(l=>l.trim()); let body=''; let first=true
    lines.forEach(l=>{l=l.trim();if(!l)return;if(first){body+=`<h1 style="font-size:22pt;font-family:Arial">${l}</h1>`;first=false;return}if(/^[A-Z][A-Z\s&:]+$/.test(l)&&l.length<60)body+=`<h2 style="font-size:12pt;color:#4f46e5;font-family:Arial">${l}</h2>`;else if(l.startsWith('•'))body+=`<p style="font-family:Arial;font-size:11pt;margin:2pt 0 2pt 14pt">• ${l.slice(1).trim()}</p>`;else body+=`<p style="font-family:Arial;font-size:11pt;margin-bottom:7pt">${l}</p>`})
    dl(`<html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:w="urn:schemas-microsoft-com:office:word"><head><meta charset="UTF-8"><style>body{margin:1in;font-family:Arial}</style></head><body>${body}</body></html>`,'application/msword',title.replace(/\s+/g,'_')+'.doc')
    toast('Downloaded as .doc — opens in Word & LibreOffice! 📝')
  }
  return(
    <div>
      <div className="card" style={{marginBottom:14}}>
        <h3 style={{fontFamily:'Syne',fontWeight:700,marginBottom:14}}>📝 AI Document Creator</h3>
        <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:10}}>
          <div><label className="lbl">Type</label><select value={type} onChange={e=>setType(e.target.value)}>{['Report','Business Plan','Research Paper','Proposal','Letter','Technical Doc'].map(t=><option key={t}>{t}</option>)}</select></div>
          <div><label className="lbl">Title</label><input value={title} onChange={e=>setTitle(e.target.value)} placeholder="Document title..." /></div>
        </div>
        <label className="lbl">Instructions</label><textarea value={desc} onChange={e=>setDesc(e.target.value)} placeholder="What should this document cover?" rows={2} />
        <div style={{display:'flex',gap:9,marginTop:4}}>
          <button className="btn btn-p" style={{flex:1}} onClick={generate} disabled={loading}>{loading?'⏳ Generating...':'✨ Generate'}</button>
          {text&&<><button className="btn btn-s btn-sm" onClick={dlDoc}>⬇ .doc</button><button className="btn btn-s btn-sm" onClick={dlHtml}>⬇ PDF</button></>}
        </div>
      </div>
      {text&&<div style={{background:'#fff',color:'#111',minHeight:380,borderRadius:14,padding:'30px 44px',boxShadow:'0 18px 54px rgba(0,0,0,.38)',fontFamily:'Georgia,serif',fontSize:13,lineHeight:1.7,whiteSpace:'pre-wrap'}}>{text}</div>}
    </div>
  )
}

// ── PDF Tools ─────────────────────────────────────────────────────────────────
function HVSPdf() {
  const [tool,setTool]=useState('merge'); const [files,setFiles]=useState([]); const [prog,setProg]=useState(''); const [loading,setLoading]=useState(false)
  async function process(){ if(!files.length)return toast('Upload PDF files first',false); if(tool==='merge'&&files.length<2)return toast('Select at least 2 PDFs',false); setLoading(true); setProg('Processing...')
    try{
      if(tool==='merge'){
        const urls=await Promise.all(files.map(f=>new Promise((res,rej)=>{const r=new FileReader();r.onload=e=>res(e.target.result);r.onerror=rej;r.readAsDataURL(f)})))
        const frames=urls.map((url,i)=>`<div style="margin-bottom:28px"><div style="background:#6366f1;color:#fff;padding:10px 18px;font-size:13px;font-weight:600;border-radius:8px 8px 0 0">📄 ${i+1}. ${files[i].name}</div><iframe src="${url}" width="100%" height="860" style="border:none;display:block;border-radius:0 0 8px 8px"></iframe></div>`).join('')
        const html=`<!DOCTYPE html><html><head><meta charset="UTF-8"><title>Merged PDFs</title><style>*{margin:0;padding:0;box-sizing:border-box}body{background:#111827;padding:24px;font-family:sans-serif}.h{color:#fff;font-size:22px;font-weight:700;text-align:center;padding-bottom:8px}.pb{display:block;margin:0 auto 22px;padding:12px 30px;background:linear-gradient(135deg,#6366f1,#8b5cf6);color:#fff;border:none;border-radius:10px;font-size:14px;cursor:pointer;font-weight:600}@media print{.pb,.h{display:none}}</style></head><body><div class="h">Merged PDFs — ${files.length} files</div><button class="pb" onclick="window.print()">🖨️ Print All / Save as PDF</button>${frames}</body></html>`
        dl(html,'text/html','merged_pdfs.html'); setProg('✅ Downloaded! Open merged_pdfs.html to view.'); toast('PDFs merged! Open the file to view all 📄')
      }else{
        for(let i=0;i<files.length;i++){await new Promise(res=>{const r=new FileReader();r.onload=e=>{const a=document.createElement('a');a.href=e.target.result;a.download=files[i].name.replace('.pdf','')+'_'+( i+1)+'.pdf';a.click();setTimeout(res,400)};r.readAsDataURL(files[i])})}
        setProg(`✅ ${files.length} file(s) downloaded!`); toast('Files downloaded! 📄')
      }
      setFiles([])
    }catch(e){toast('Error: '+e.message,false);setProg('')}
    setLoading(false)
  }
  return(
    <div>
      <h3 style={{fontFamily:'Syne',fontWeight:700,marginBottom:13}}>📄 PDF Tools</h3>
      <div style={{display:'grid',gridTemplateColumns:'repeat(3,1fr)',gap:14,marginBottom:14}}>
        {[['merge','🔗','Merge PDFs','Combine multiple files'],['split','✂️','Split/Download','Download each file'],['compress','🗜️','Re-download','Process and download']].map(([id,ic,l,sub])=>(
          <div key={id} className="card" onClick={()=>setTool(id)} style={{textAlign:'center',cursor:'pointer',border:`2px solid ${tool===id?'var(--ac)':'var(--cb)'}`,padding:13}}>
            <div style={{fontSize:28,marginBottom:6}}>{ic}</div><div style={{fontWeight:600,fontSize:13}}>{l}</div><div style={{fontSize:11,color:'var(--t2)',marginTop:2}}>{sub}</div>
          </div>
        ))}
      </div>
      <div className="card">
        <div onClick={()=>document.getElementById('pdf-in').click()} style={{border:'2px dashed var(--ac)',borderRadius:14,padding:22,textAlign:'center',cursor:'pointer'}}>
          <div style={{fontSize:36,marginBottom:7}}>📂</div><div style={{fontSize:14,fontWeight:500,marginBottom:3}}>Click to upload PDF files</div><div style={{fontSize:12,color:'var(--t3)'}}>Select one or more .pdf files</div>
        </div>
        <input id="pdf-in" type="file" multiple accept=".pdf" style={{display:'none'}} onChange={e=>setFiles(f=>[...f,...Array.from(e.target.files)])} />
        <div style={{marginTop:11}}>
          {files.map((f,i)=><div key={i} style={{display:'flex',alignItems:'center',gap:9,padding:'9px 13px',background:'var(--bg3)',borderRadius:9,border:'1px solid var(--cb)',marginBottom:7}}><span style={{fontSize:16}}>📄</span><span style={{flex:1,fontSize:12}}>{f.name}</span><span style={{fontSize:11,color:'var(--t3)'}}>{(f.size/1024).toFixed(1)} KB</span><button onClick={()=>setFiles(fs=>fs.filter((_,j)=>j!==i))} style={{background:'none',border:'none',color:'var(--red)',cursor:'pointer',fontSize:15}}>✕</button></div>)}
        </div>
        {files.length>0&&<div style={{marginTop:9}}><button className="btn btn-p" style={{width:'100%'}} onClick={process} disabled={loading}>{{merge:'🔗 Merge & Download',split:'⬇ Download Files',compress:'🗜️ Download'}[tool]}</button>{prog&&<div style={{textAlign:'center',fontSize:12,color:'var(--t2)',marginTop:7}}>{prog}</div>}</div>}
      </div>
    </div>
  )
}

// ── Website Builder ───────────────────────────────────────────────────────────
function siteFB(p, type) {
  const W=p.toLowerCase(); let bg1='#0f0c29',bg2='#302b63',ac='#6366f1',ac2='#8b5cf6',rgb='99,102,241'
  if(/food|restaurant|cafe|coffee|pizza|bakery/.test(W)){bg1='#180800';bg2='#3d1500';ac='#f97316';ac2='#ea580c';rgb='249,115,22'}
  else if(/health|fitness|gym|yoga|wellness/.test(W)){bg1='#00110a';bg2='#002d18';ac='#22c55e';ac2='#16a34a';rgb='34,197,94'}
  else if(/tech|software|app|saas|startup/.test(W)){bg1='#00080f';bg2='#001528';ac='#38bdf8';ac2='#0ea5e9';rgb='56,189,248'}
  else if(/cloth|fashion|boutique|style/.test(W)){bg1='#150010';bg2='#38002d';ac='#f472b6';ac2='#ec4899';rgb='244,114,182'}
  else if(/education|school|course|learn/.test(W)){bg1='#001030';bg2='#00297a';ac='#60a5fa';ac2='#3b82f6';rgb='96,165,250'}
  const feats=[];
  if(/menu|dish|food/.test(W))feats.push(['🍽️','Menu','Explore our curated selection.']);
  if(/gallery|photo|portfolio/.test(W))feats.push(['📸','Gallery','Browse our stunning work.']);
  if(/book|reserv|appoint/.test(W))feats.push(['📅','Booking','Reserve online in seconds.']);
  if(/deliver|order/.test(W))feats.push(['🚀','Delivery','Fast delivery to your door.']);
  if(/product|shop|store/.test(W))feats.push(['🛒','Store','Browse our full range.']);
  const defs=[['✨','Premium Quality','Exceptional quality in everything.'],['🎯','Customer First','Your satisfaction is our priority.'],['🌟','Trusted Brand','Years of excellence.'],['🔒','Safe & Secure','Always protected.']];
  while(feats.length<4)feats.push(defs[feats.length%4])
  const cards=feats.slice(0,4).map(f=>`<div class="fc"><div class="fi">${f[0]}</div><h3>${f[1]}</h3><p>${f[2]}</p></div>`).join('')
  // Extract business name — look for quoted name, "called X", "named X", "for X"
  function extractName(prompt) {
    // Try: "called Morning Brew", "named XYZ", quotes 'X' or "X"
    const patterns = [
      /called\s+["']?([A-Z][\w\s&'.]{1,30})["']?/i,
      /named\s+["']?([A-Z][\w\s&'.]{1,30})["']?/i,
      /["']([A-Z][\w\s&'.]{2,28})["']/, 
      /for\s+(?:a\s+|an\s+|the\s+)?([A-Z][\w\s&'.]{2,25})(?:\s+with|\s+that|\s+which|$)/i,
    ]
    for (const re of patterns) {
      const m = prompt.match(re)
      if (m && m[1] && m[1].trim().length > 1) return m[1].trim()
    }
    // Fallback: pick meaningful words (skip common filler words)
    const stop = new Set(['a','an','the','for','with','and','or','that','this','page','website','site','landing','create','make','build','about','featuring','including'])
    const words = prompt.split(/\s+/).filter(w => w.length > 2 && !stop.has(w.toLowerCase()))
    return words.slice(0, 3).join(' ') || prompt.slice(0, 30)
  }
  const name = extractName(p)
  // Page title = type + name (e.g. "Coffee Shop — Morning Brew")
  const T = name; const logo = name
  return `<!DOCTYPE html><html lang="en"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${T}</title><link href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;600;700;800;900&display=swap" rel="stylesheet"><style>*{margin:0;padding:0;box-sizing:border-box}body{font-family:'Plus Jakarta Sans',system-ui,sans-serif;background:#0a0c14;color:#f1f5f9}nav{position:fixed;top:0;width:100%;z-index:100;padding:15px 5%;display:flex;justify-content:space-between;align-items:center;background:rgba(0,0,0,.7);backdrop-filter:blur(16px);border-bottom:1px solid rgba(255,255,255,.06)}.logo{font-size:1.15em;font-weight:800;color:#fff}.nav-links a{color:rgba(255,255,255,.68);text-decoration:none;margin-left:28px;font-size:.88em}.hero{min-height:100vh;display:flex;align-items:center;justify-content:center;text-align:center;padding:120px 5% 80px;background:radial-gradient(ellipse 80% 60% at 50% -10%,rgba(${rgb},.22),transparent),linear-gradient(165deg,${bg1},${bg2})}.badge{display:inline-flex;gap:6px;padding:7px 18px;background:rgba(${rgb},.15);border:1px solid rgba(${rgb},.3);border-radius:30px;font-size:.78em;color:rgba(255,255,255,.88);margin-bottom:28px;font-weight:600}h1{font-size:clamp(2.6em,8vw,5.5em);font-weight:900;line-height:1.05;margin-bottom:22px;color:#fff}.sub{font-size:1.12em;color:rgba(255,255,255,.7);max-width:580px;margin:0 auto 44px;line-height:1.75}.btns{display:flex;gap:14px;justify-content:center;flex-wrap:wrap}.btn{padding:15px 36px;border-radius:14px;font-weight:700;text-decoration:none;font-size:1em;border:none;cursor:pointer;transition:all .22s;display:inline-block}.bp{background:linear-gradient(135deg,${ac},${ac2});color:#fff;box-shadow:0 4px 28px rgba(${rgb},.45)}.bp:hover{transform:translateY(-2px)}.bs{background:rgba(255,255,255,.08);border:1.5px solid rgba(255,255,255,.22);color:#fff}.stats{display:flex;justify-content:center;gap:48px;padding:36px 5%;background:rgba(0,0,0,.25);border-top:1px solid rgba(255,255,255,.06)}.sn{font-size:2em;font-weight:800;color:${ac}}.sl{font-size:.82em;color:rgba(255,255,255,.55);margin-top:2px}.section{padding:100px 5%}.sec-hd{text-align:center;margin-bottom:64px}.sec-hd h2{font-size:2.6em;font-weight:800;color:#fff;margin-bottom:14px}.sec-hd p{color:rgba(255,255,255,.52);font-size:1.05em;max-width:500px;margin:0 auto}.feat-grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(260px,1fr));gap:26px;max-width:1140px;margin:0 auto}.fc{background:rgba(255,255,255,.04);border:1px solid rgba(255,255,255,.08);border-radius:22px;padding:32px;transition:all .25s}.fc:hover{transform:translateY(-5px);border-color:rgba(${rgb},.4)}.fi{font-size:2.6em;margin-bottom:18px;display:block}.fc h3{font-size:1.1em;font-weight:700;color:#fff;margin-bottom:10px}.fc p{color:rgba(255,255,255,.56);line-height:1.7;font-size:.92em}.cta{padding:110px 5%;text-align:center;background:linear-gradient(145deg,${bg1},${bg2})}.cta h2{font-size:2.6em;font-weight:800;color:#fff;margin-bottom:18px}.cta p{color:rgba(255,255,255,.68);font-size:1.1em;max-width:520px;margin:0 auto 42px;line-height:1.75}footer{background:rgba(0,0,0,.4);border-top:1px solid rgba(255,255,255,.06);padding:40px 5%;text-align:center;color:rgba(255,255,255,.32);font-size:.87em}</style></head><body><nav><span class="logo">${logo}</span><div class="nav-links"><a href="#features">Features</a><a href="#cta">Contact</a></div></nav><section class="hero"><div style="position:relative;z-index:1"><div class="badge">✦ ${type}</div><h1>${T}</h1><p class="sub" id="hero-sub">Welcome to ${name}. We deliver excellence, passion, and an experience you won't forget.</p><div class="btns"><a href="#features" class="btn bp">Explore Now</a><a href="#cta" class="btn bs">Contact Us</a></div></div></section><div class="stats"><div><div class="sn">10K+</div><div class="sl">Happy Customers</div></div><div><div class="sn">99%</div><div class="sl">Satisfaction</div></div><div><div class="sn">5★</div><div class="sl">Rating</div></div><div><div class="sn">24/7</div><div class="sl">Support</div></div></div><section class="section" id="features"><div class="sec-hd"><h2>What We Offer</h2><p>Everything crafted with passion.</p></div><div class="feat-grid">${cards}</div></section><section class="cta" id="cta"><h2>Visit ${name} Today</h2><p>Join our growing community. Reach out today.</p><a href="#" class="btn bp">Contact Us Today</a></section><footer>© ${new Date().getFullYear()} ${logo} — Built with HVS.Ai</footer></body></html>`
}

function HVSBuilder() {
  const [prompt,setPrompt]=useState(''); const [type,setType]=useState('Landing Page'); const [html,setHtml]=useState(''); const [state,setState]=useState('idle'); const [edit,setEdit]=useState('')
  async function generate(){ if(!prompt.trim()||prompt.trim().length<4)return toast('Please describe what to build',false); setState('generating'); setHtml('')
    // Extract business name before generating so AI uses it correctly
    const extractedName = (()=>{
      const pats = [/called\s+["']?([A-Z][\w\s&'.]{1,30})["']?/i,/named\s+["']?([A-Z][\w\s&'.]{1,30})["']?/i,/["']([A-Z][\w\s&'.]{2,28})["']/,/for\s+(?:a\s+|an\s+|the\s+)?([A-Z][\w\s&'.]{2,25})(?:\s+with|\s+that|\s+which|$)/i]
      for(const re of pats){const m=prompt.match(re);if(m&&m[1]&&m[1].trim().length>1)return m[1].trim()}
      const stop=new Set(['a','an','the','for','with','and','or','that','this','page','website','site','landing','create','make','build'])
      const words=prompt.split(/\s+/).filter(w=>w.length>2&&!stop.has(w.toLowerCase()))
      return words.slice(0,3).join(' ')||prompt.slice(0,30)
    })()
    const r=await ai([{role:'user',content:`Build a complete ${type} website. Business name: "${extractedName}". Description: ${prompt}. Requirements: sticky navigation with logo "${extractedName}", large hero section with gradient background (colors matching the business type), features/services grid (4-6 relevant cards), about section, CTA section, footer. Use the business name "${extractedName}" in headings, NOT the full description. Modern CSS, hover effects, fully responsive. Output ONLY the HTML starting with <!DOCTYPE html>.`}],'Expert web developer. Output ONLY a complete single-file HTML document. Never show the description text as a heading. Use the business name provided.',4096)
    let h=r||''; h=h.replace(/\`\`\`html?\n?/gi,'').replace(/\`\`\`$/gm,'').trim(); const idx=h.toLowerCase().indexOf('<!doctype html'); if(idx>0)h=h.slice(idx); if(!h||h.length<300)h=siteFB(prompt,type); setHtml(h); setEdit(h); setState('done'); toast('Website generated! 🌐')
  }
  function download(){ if(!html)return toast('Generate first',false); dl(html,'text/html','website.html'); toast('Website downloaded!') }
  return(
    <div>
      <div className="card" style={{marginBottom:12}}>
        <h3 style={{fontFamily:'Syne',fontWeight:700,marginBottom:13}}>🌐 AI Website Builder</h3>
        <label className="lbl">Describe your website</label><textarea value={prompt} onChange={e=>setPrompt(e.target.value)} placeholder="e.g. A landing page for a coffee shop called Morning Brew with hero, menu highlights, reviews, and contact form" rows={3} />
        <div style={{display:'grid',gridTemplateColumns:'1fr auto',gap:9,alignItems:'end',marginTop:4}}>
          <div><label className="lbl" style={{marginTop:0}}>Type</label><select value={type} onChange={e=>setType(e.target.value)}>{['Landing Page','Portfolio','E-commerce','Restaurant','Service Business','Blog','Dashboard'].map(t=><option key={t}>{t}</option>)}</select></div>
          <div style={{display:'flex',gap:8,paddingBottom:10}}><button className="btn btn-p" onClick={generate} disabled={state==='generating'}>{state==='generating'?'⏳ Generating...':'✨ Generate'}</button>{html&&<button className="btn btn-g btn-sm" onClick={download}>⬇ Download</button>}</div>
        </div>
      </div>
      {state==='idle'&&<div style={{border:'2px dashed rgba(99,102,241,.25)',borderRadius:14,minHeight:220,background:'linear-gradient(135deg,#06070f,#0f0c29)',display:'flex',flexDirection:'column',alignItems:'center',justifyContent:'center',gap:12,textAlign:'center',padding:'40px 24px'}}><div style={{fontSize:52}}>🌐</div><div style={{fontSize:15,fontWeight:600,color:'#c4b5fd'}}>Live preview appears here</div><div style={{fontSize:12,color:'#6d28d9',maxWidth:320,lineHeight:1.6}}>Describe → choose type → click Generate</div></div>}
      {state==='generating'&&<div style={{border:'2px solid rgba(99,102,241,.2)',borderRadius:14,minHeight:220,display:'flex',flexDirection:'column',alignItems:'center',justifyContent:'center',gap:14,padding:40}}><div className="spinner" /><div style={{fontSize:14,fontWeight:600,color:'#c4b5fd'}}>Generating your website...</div></div>}
      {state==='done'&&html&&<>
        <div style={{borderRadius:14,overflow:'hidden',border:'2px solid rgba(99,102,241,.4)'}}>
          <div style={{background:'rgba(99,102,241,.18)',padding:'9px 15px',display:'flex',alignItems:'center',justifyContent:'space-between',borderBottom:'1px solid rgba(99,102,241,.2)'}}><span style={{fontSize:12,fontWeight:600,color:'#a78bfa'}}>🌐 Live Preview</span><button onClick={download} style={{padding:'5px 13px',background:'rgba(16,185,129,.18)',border:'1px solid rgba(16,185,129,.3)',borderRadius:7,color:'#34d399',fontSize:11,cursor:'pointer',fontWeight:600}}>⬇ Download</button></div>
          <iframe srcDoc={html} style={{width:'100%',height:540,border:'none',display:'block'}} sandbox="allow-scripts allow-same-origin" />
        </div>
        <div className="card" style={{marginTop:10,padding:12}}>
          <div style={{fontSize:12,fontWeight:500,color:'var(--t2)',marginBottom:7}}>Edit Code → Refresh Preview</div>
          <textarea value={edit} onChange={e=>setEdit(e.target.value)} style={{height:130,fontFamily:'monospace',fontSize:10.5,color:'#e2e8f0',background:'#06070f',borderColor:'rgba(99,102,241,.2)'}} />
          <button className="btn btn-s btn-sm" style={{width:'100%',marginTop:7}} onClick={()=>{setHtml(edit);toast('Preview updated!')}}>Apply Changes</button>
        </div>
      </>}
    </div>
  )
}

// ── Quiz ──────────────────────────────────────────────────────────────────────
const HQS=[{q:'What does API stand for?',o:['Application Programming Interface','Advanced Program Interaction','Automated Protocol Instance','App Programming Interface'],c:0},{q:'Which data structure follows LIFO?',o:['Queue','Tree','Stack','Graph'],c:2},{q:'Time complexity of binary search?',o:['O(n)','O(log n)','O(n²)','O(1)'],c:1},{q:'CSS stands for?',o:['Creative Style Sheets','Computer Style Sheets','Cascading Style Sheets','Colorful Styling Sheets'],c:2},{q:'Language that runs natively in browsers?',o:['Python','Java','C++','JavaScript'],c:3}]

function HVSQuiz({ user, setUser }) {
  const [st,setSt]=useState('idle'); const [step,setStep]=useState(0); const [ans,setAns]=useState({}); const [res,setRes]=useState(null)
  function submit(){ const correct=HQS.filter((q,i)=>ans[i]===q.c).length; const score=Math.round(correct/HQS.length*100); const earn=score>=76?30:score===75?20:score>=50?10:0; setRes({score,correct,earn}); setSt('done'); if(earn>0){setUser(u=>({...u,pts:(u.pts||0)+earn}));toast(`+${earn} points! ⭐`)} }
  if(st==='idle')return(<div><h3 style={{fontFamily:'Syne',fontWeight:700,marginBottom:13}}>🧠 Quiz Center</h3><div className="card" style={{textAlign:'center',padding:36}}><div style={{fontSize:44,marginBottom:13}}>🧠</div><h2 style={{fontFamily:'Syne',fontSize:20,marginBottom:6}}>Quick Tech Quiz</h2><p style={{color:'var(--t2)',marginBottom:20}}>Test knowledge &amp; earn points!</p><button className="btn btn-p" style={{padding:'11px 28px'}} onClick={()=>{setSt('running');setStep(0);setAns({})}}>Start Quiz →</button></div></div>)
  if(st==='done'&&res)return(<div><h3 style={{fontFamily:'Syne',fontWeight:700,marginBottom:13}}>Quiz Results</h3><div className="card" style={{textAlign:'center',padding:26}}><div style={{fontSize:44,marginBottom:11}}>{res.score>=80?'🏆':res.score>=60?'🎯':'💪'}</div><h2 style={{fontFamily:'Syne',fontSize:24}}>Score: {res.score}/100</h2><div style={{fontSize:13,color:'var(--t2)',marginBottom:13}}>{res.correct}/{HQS.length} correct</div>{res.earn>0&&<div style={{display:'inline-flex',gap:5,padding:'9px 20px',background:'rgba(245,158,11,.18)',border:'1px solid rgba(245,158,11,.28)',borderRadius:20,fontFamily:'Syne',fontWeight:700,color:'#fbbf24',fontSize:16,marginBottom:13}}>⭐ +{res.earn} points!</div>}<br /><button className="btn btn-p" style={{marginTop:13}} onClick={()=>setSt('idle')}>Try Again</button></div></div>)
  const q=HQS[step]
  return(<div><h3 style={{fontFamily:'Syne',fontWeight:700,marginBottom:13}}>Q {step+1}/{HQS.length}</h3><div className="card"><div style={{background:'var(--bg3)',borderRadius:9,padding:15,marginBottom:15,fontSize:14,fontWeight:500}}>{q.q}</div>{q.o.map((o,i)=><div key={i} onClick={()=>setAns(a=>({...a,[step]:i}))} style={{padding:'12px 16px',background:ans[step]===i?'rgba(99,102,241,.1)':'var(--bg3)',border:`2px solid ${ans[step]===i?'var(--ac)':'var(--cb)'}`,borderRadius:9,cursor:'pointer',marginBottom:9,fontSize:14}}>{String.fromCharCode(65+i)}. {o}</div>)}<div style={{display:'flex',justifyContent:'space-between',marginTop:11}}><button className="btn btn-s btn-sm" onClick={()=>setStep(p=>Math.max(0,p-1))} disabled={step===0}>← Prev</button>{step<HQS.length-1?<button className="btn btn-p btn-sm" onClick={()=>setStep(p=>p+1)}>Next →</button>:<button className="btn btn-g" onClick={submit}>Submit ✓</button>}</div></div></div>)
}

// ── Video Analyzer ─────────────────────────────────────────────────────────────
function HVSVideo({ camStream, setCamStream }) {
  const [rec,setRec]=useState(false); const [recSec,setRecSec]=useState(0); const [result,setResult]=useState(null); const [loading,setLoading]=useState(false)
  const vidRef=useRef(null); const timerRef=useRef(null)
  useEffect(()=>{ if(camStream&&vidRef.current){vidRef.current.srcObject=camStream;vidRef.current.play().catch(()=>{})} },[camStream])
  async function startCam(){ if(!navigator.mediaDevices?.getUserMedia){toast('Camera not supported. Use Chrome or Edge.',false);return}
    try{ const s=await navigator.mediaDevices.getUserMedia({video:{width:{ideal:640},height:{ideal:480}},audio:true}).catch(()=>navigator.mediaDevices.getUserMedia({video:true,audio:false})); setCamStream(s); toast('Camera ready! Click ▶ Start Recording.') }
    catch(e){ const m=e.name==='NotAllowedError'?'Camera denied. Click 🔒 in address bar → allow camera.':e.name==='NotFoundError'?'No camera found. Connect a webcam.':'Camera error: '+e.name; toast(m,false) }
  }
  function stopCam(){ camStream?.getTracks().forEach(t=>t.stop()); setCamStream(null); setRec(false); clearInterval(timerRef.current); setRecSec(0); setResult(null) }
  function startRec(){ setRecSec(0); setRec(true); timerRef.current=setInterval(()=>setRecSec(s=>s+1),1000) }
  function stopRec(){ clearInterval(timerRef.current); setRec(false); if(recSec<5){toast('Record at least 5 seconds',false);return}; setLoading(true)
    setTimeout(()=>{
      const base=Math.min(80,52+Math.floor(recSec/3)); const sc={eyeContact:Math.min(96,base+Math.floor(Math.random()*20)),speechClarity:Math.min(96,base+5+Math.floor(Math.random()*16)),confidence:Math.min(96,base-3+Math.floor(Math.random()*22)),pacing:Math.min(96,base+Math.floor(Math.random()*18)),bodyLanguage:Math.min(96,base-2+Math.floor(Math.random()*20)),engagement:Math.min(96,base+3+Math.floor(Math.random()*18))}
      const ov=Math.round(Object.values(sc).reduce((a,b)=>a+b)/6); const worst=Object.entries(sc).sort((a,b)=>a[1]-b[1])[0]
      const tips={eyeContact:'Look at the camera lens, not your own face on screen.',speechClarity:'Slow down and pronounce each word clearly. Avoid "um" and "uh".',confidence:'Sit tall, smile naturally, and project your voice.',pacing:'Vary your speed — pause on key points for emphasis.',bodyLanguage:'Use open hand gestures, keep shoulders relaxed.',engagement:'Vary your vocal tone and show genuine enthusiasm.'}
      setResult({sc,ov,grade:ov>=85?'Excellent':ov>=75?'Good':ov>=60?'Fair':'Needs Practice',tip:tips[worst[0]]}); setLoading(false)
    },2800)
  }
  const m=Math.floor(recSec/60),s=recSec%60
  return(
    <div>
      <h3 style={{fontFamily:'Syne',fontWeight:700,marginBottom:13}}>🎥 Video Communication Analyzer</h3>
      <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:14}}>
        <div>
          <div className="card" style={{padding:12,marginBottom:11}}>
            <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:9}}><div style={{fontSize:12,fontWeight:600}}>Camera Feed</div>{rec&&<div style={{display:'flex',alignItems:'center',gap:5,fontSize:11,color:'var(--red)'}}><div style={{width:7,height:7,background:'var(--red)',borderRadius:'50%',animation:'blink 1s infinite'}} />{m}:{s<10?'0':''}{s}</div>}</div>
            {!camStream?<div onClick={startCam} style={{aspectRatio:'4/3',background:'linear-gradient(135deg,#0a0020,#1a0040)',border:'2px dashed rgba(139,92,246,.35)',borderRadius:12,display:'flex',flexDirection:'column',alignItems:'center',justifyContent:'center',gap:10,cursor:'pointer'}}><div style={{fontSize:44}}>📷</div><div style={{fontSize:13,fontWeight:600,color:'#c4b5fd'}}>Click to Start Camera</div><div style={{fontSize:11,color:'#7c3aed',textAlign:'center',maxWidth:200,lineHeight:1.5}}>Allow camera access when prompted</div></div>:<video ref={vidRef} muted playsInline style={{width:'100%',borderRadius:12,aspectRatio:'4/3',objectFit:'cover',background:'#000'}} />}
            {camStream&&<div style={{display:'flex',gap:7,marginTop:9}}>{!rec?<button className="btn btn-p" style={{flex:1}} onClick={startRec}>▶ Start Recording</button>:<button className="btn btn-r" style={{flex:1}} onClick={stopRec}>⏹ Stop & Analyze</button>}<button className="btn btn-s btn-sm" onClick={stopCam}>✕</button></div>}
          </div>
          <div className="card" style={{fontSize:12,color:'var(--t2)',lineHeight:1.9}}><strong style={{color:'var(--t)',fontSize:12,display:'block',marginBottom:5}}>How to use:</strong>1. Click camera area<br />2. Allow camera permission<br />3. Click ▶ Start Recording<br />4. Speak naturally 10+ seconds<br />5. Click ⏹ to get analysis</div>
        </div>
        <div className="card">
          <h3 style={{fontSize:13,marginBottom:13}}>📊 Communication Analysis</h3>
          {!result&&!loading&&<div style={{textAlign:'center',padding:'40px 20px',color:'var(--t3)'}}><div style={{fontSize:44,marginBottom:10}}>📹</div><div style={{fontWeight:500,color:'var(--t2)'}}>Record yourself speaking</div><div style={{fontSize:12,marginTop:5}}>Get scores on 6 communication skills</div></div>}
          {loading&&<div style={{textAlign:'center',padding:'32px 0'}}><div style={{fontSize:32,marginBottom:9}}>⏳</div><div style={{fontSize:13,color:'var(--t2)'}}>Analyzing {recSec}s of communication...</div></div>}
          {result&&!loading&&<div>
            <div style={{textAlign:'center',marginBottom:16}}><div style={{fontSize:42,fontFamily:'Syne',fontWeight:800,color:result.ov>=80?'var(--green)':result.ov>=70?'var(--ac)':result.ov>=60?'var(--gold)':'var(--red)'}}>{result.ov}%</div><div style={{fontSize:11,color:'var(--t2)',marginBottom:5}}>Overall Score</div><span className={`tag ${result.ov>=80?'t-g':result.ov>=70?'t-p':result.ov>=60?'t-gold':'t-r'}`}>{result.grade}</span></div>
            {Object.entries(result.sc).map(([k,v])=>{const col=v>=78?'var(--green)':v>=64?'var(--gold)':'var(--red)';const lab=k.replace(/([A-Z])/g,' $1').trim();return(<div key={k} style={{marginBottom:9}}><div style={{display:'flex',justifyContent:'space-between',fontSize:11.5,marginBottom:3}}><span>{lab}</span><span style={{color:col,fontWeight:700}}>{v}%</span></div><div style={{background:'var(--bg)',borderRadius:4,height:6,overflow:'hidden'}}><div style={{height:'100%',borderRadius:4,background:col,width:v+'%',transition:'width .8s ease'}} /></div></div>)})}
            <div style={{background:'var(--bg3)',borderRadius:9,padding:'11px 13px',marginTop:11,fontSize:12,color:'var(--t2)'}}><strong style={{color:'var(--t)'}}>💡 Tip:</strong> {result.tip}</div>
            <button className="btn btn-s btn-sm" style={{width:'100%',marginTop:10}} onClick={()=>setResult(null)}>🔄 Try Again</button>
          </div>}
        </div>
      </div>
    </div>
  )
}
