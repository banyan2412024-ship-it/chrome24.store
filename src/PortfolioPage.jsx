import MatrixRain from './MatrixRain'

// ─── Edit your info here ──────────────────────────────────────────────────────
const ME = {
  name: 'SASCHA KUCHAR',
  title: 'Your Title Here',
  location: 'Your Location',
  available: true,
  bio: [
    'Short intro about yourself — what you do and what drives you.',
    'Second line — what you\'re currently working on or focused on.',
  ],
  experience: [
    {
      role: 'Your Role',
      company: 'Company Name',
      period: '202X — Present',
      points: ['What you built or achieved here.', 'Another key contribution.'],
    },
    {
      role: 'Previous Role',
      company: 'Previous Company',
      period: '201X — 202X',
      points: ['Description of your work.'],
    },
  ],
  skills: [
    { label: 'FRONTEND', items: ['React', 'JavaScript', 'HTML/CSS'] },
    { label: 'BACKEND', items: ['Node.js', 'Express', 'REST APIs'] },
    { label: 'TOOLS', items: ['Git', 'Notion', 'VS Code'] },
    { label: 'OTHER', items: ['Add your skills here'] },
  ],
  links: {
    linkedin: 'https://www.linkedin.com/in/sascha-kuchar-6b04373b7/',
    github: '',
    email: '',
  },
  appUrl: 'https://app.chrome24.store',
}
// ─────────────────────────────────────────────────────────────────────────────

const s = {
  page: {
    minHeight: '100vh',
    background: 'var(--bg-base)',
    color: 'var(--text)',
    fontFamily: 'var(--font-mono)',
    position: 'relative',
    overflowX: 'hidden',
  },
  container: {
    maxWidth: '860px',
    margin: '0 auto',
    padding: '48px 24px 80px',
    position: 'relative',
    zIndex: 1,
  },
  panel: {
    background: 'var(--bg-surface)',
    border: '1px solid var(--border-mid)',
    marginBottom: '16px',
  },
  titleBar: {
    background: 'linear-gradient(90deg, var(--bg-elevated), var(--bg-base))',
    borderBottom: '1px solid var(--border-bright)',
    padding: '4px 10px',
    fontSize: '10px',
    color: 'var(--text-dim)',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  body: { padding: '20px 24px' },
  label: { fontSize: '10px', color: 'var(--text-ghost)', marginBottom: '4px', letterSpacing: '1px' },
  value: { fontSize: '13px', color: 'var(--text)', lineHeight: 1.6 },
  neon: { color: 'var(--text-bright)' },
  cyan: { color: 'var(--cyan)' },
  dim: { color: 'var(--text-dim)' },
  tag: {
    display: 'inline-block',
    padding: '2px 8px',
    fontSize: '10px',
    border: '1px solid var(--border-mid)',
    color: 'var(--text-dim)',
    marginRight: '6px',
    marginBottom: '6px',
    background: 'var(--bg-base)',
  },
}

function Panel({ title, right, children }) {
  return (
    <div style={s.panel}>
      <div style={s.titleBar}>
        <span>■ {title}</span>
        {right && <span>{right}</span>}
      </div>
      <div style={s.body}>{children}</div>
    </div>
  )
}

export default function PortfolioPage() {
  return (
    <div style={s.page}>
      <MatrixRain />
      <div style={s.container}>

        {/* Header */}
        <div style={{ marginBottom: '32px' }}>
          <div style={{ fontSize: '10px', color: 'var(--text-ghost)', marginBottom: '8px', letterSpacing: '2px' }}>
            &gt; PORTFOLIO_v1.0 — SYSTEM READY
          </div>
          <h1 style={{
            fontSize: 'clamp(16px, 3vw, 22px)',
            margin: '0 0 6px',
            color: 'var(--text-dim)',
            letterSpacing: '3px',
            fontWeight: 400,
          }}>
            {ME.name}
          </h1>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '12px', alignItems: 'center' }}>
            <span style={{ ...s.cyan, fontSize: '13px' }}>{ME.title}</span>
            <span style={{ color: 'var(--border-bright)' }}>│</span>
            <span style={{ ...s.dim, fontSize: '12px' }}>◎ {ME.location}</span>
            {ME.available && (
              <span style={{
                fontSize: '10px',
                padding: '2px 8px',
                border: '1px solid var(--text-bright)',
                color: 'var(--text-bright)',
                background: 'rgba(0,255,65,0.05)',
              }}>
                ● OPEN TO OPPORTUNITIES
              </span>
            )}
          </div>
        </div>

        {/* About */}
        <Panel title="ABOUT.txt">
          {ME.bio.map((line, i) => (
            <p key={i} style={{ ...s.value, margin: '0 0 8px' }}>
              <span style={s.dim}>&gt; </span>{line}
            </p>
          ))}
        </Panel>

        {/* Experience */}
        <Panel title="EXPERIENCE.log" right={`${ME.experience.length} entries`}>
          {ME.experience.map((job, i) => (
            <div key={i} style={{
              borderLeft: '2px solid var(--border-bright)',
              paddingLeft: '16px',
              marginBottom: i < ME.experience.length - 1 ? '24px' : 0,
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap', gap: '4px', marginBottom: '6px' }}>
                <div>
                  <span style={{ ...s.neon, fontSize: '13px', fontWeight: 700 }}>{job.role}</span>
                  <span style={{ ...s.dim, fontSize: '12px' }}> @ {job.company}</span>
                </div>
                <span style={{ fontSize: '10px', color: 'var(--text-ghost)', letterSpacing: '1px' }}>{job.period}</span>
              </div>
              {job.points.map((pt, j) => (
                <p key={j} style={{ ...s.value, fontSize: '12px', margin: '2px 0', color: 'var(--text-dim)' }}>
                  › {pt}
                </p>
              ))}
            </div>
          ))}
        </Panel>

        {/* Skills */}
        <Panel title="SKILLS.json">
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: '16px' }}>
            {ME.skills.map(cat => (
              <div key={cat.label}>
                <div style={{ ...s.label, marginBottom: '8px' }}>{cat.label}</div>
                <div>
                  {cat.items.map(sk => (
                    <span key={sk} style={s.tag}>{sk}</span>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </Panel>

        {/* Contact */}
        <Panel title="CONTACT.sh">
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px' }}>
            {ME.links.linkedin && (
              <a href={ME.links.linkedin} target="_blank" rel="noreferrer" style={{
                ...s.tag, textDecoration: 'none', cursor: 'pointer', border: '1px solid var(--cyan-dim)', color: 'var(--cyan)',
              }}>
                ↗ LINKEDIN
              </a>
            )}
            {ME.links.github && (
              <a href={ME.links.github} target="_blank" rel="noreferrer" style={{
                ...s.tag, textDecoration: 'none', cursor: 'pointer',
              }}>
                ↗ GITHUB
              </a>
            )}
            {ME.links.email && (
              <a href={ME.links.email} style={{
                ...s.tag, textDecoration: 'none', cursor: 'pointer',
              }}>
                ↗ EMAIL
              </a>
            )}
          </div>
        </Panel>

        {/* Footer — private system link */}
        <div style={{ textAlign: 'center', marginTop: '48px' }}>
          <div style={{ color: 'var(--text-ghost)', fontSize: '10px', marginBottom: '16px', letterSpacing: '1px' }}>
            ─────────────────────────────
          </div>
          <a
            href={ME.appUrl}
            style={{
              display: 'inline-block',
              background: 'transparent',
              border: '1px solid var(--border-mid)',
              color: 'var(--text-ghost)',
              fontSize: '10px',
              letterSpacing: '2px',
              padding: '6px 20px',
              cursor: 'pointer',
              textDecoration: 'none',
            }}
            onMouseEnter={e => {
              e.currentTarget.style.color = 'var(--text-bright)'
              e.currentTarget.style.borderColor = 'var(--border-bright)'
              e.currentTarget.style.boxShadow = 'var(--glow-green)'
            }}
            onMouseLeave={e => {
              e.currentTarget.style.color = 'var(--text-ghost)'
              e.currentTarget.style.borderColor = 'var(--border-mid)'
              e.currentTarget.style.boxShadow = 'none'
            }}
          >
            [ &gt; ENTER SYSTEM ]
          </a>
        </div>

      </div>
    </div>
  )
}
