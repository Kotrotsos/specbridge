const pptxgen = require('pptxgenjs');
const html2pptx = require('/Users/marcokotrotsos/.claude/plugins/cache/anthropic-agent-skills/document-skills/f23222824449/skills/pptx/scripts/html2pptx');
const fs = require('fs');
const path = require('path');
const sharp = require('sharp');

const WORKSPACE = '/Users/marcokotrotsos/PERSONAL/specbridge/investor/workspace';

// Refined color palette - professional with warmth
const C = {
  bg: '#FAFAF8',          // Warm off-white
  dark: '#0F172A',        // Deep navy-black
  primary: '#1E293B',     // Slate for headings
  accent: '#0D9488',      // Teal accent
  accentDark: '#0F766E',  // Darker teal
  text: '#334155',        // Slate text
  muted: '#64748B',       // Muted gray
  light: '#E2E8F0',       // Light gray
  white: '#FFFFFF',
  success: '#059669',     // Green
  warning: '#D97706',     // Amber
  cardBg: '#FFFFFF',
};

// Ensure workspace exists
if (!fs.existsSync(WORKSPACE)) {
  fs.mkdirSync(WORKSPACE, { recursive: true });
}

// Create gradient background as PNG
async function createGradient(filename, color1, color2, direction = 'to bottom right') {
  let x1 = '0%', y1 = '0%', x2 = '100%', y2 = '100%';
  if (direction === 'to bottom') { x2 = '0%'; y2 = '100%'; }
  if (direction === 'to right') { x2 = '100%'; y2 = '0%'; }
  if (direction === 'to top right') { x1 = '0%'; y1 = '100%'; x2 = '100%'; y2 = '0%'; }

  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="1440" height="810">
    <defs>
      <linearGradient id="g" x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}">
        <stop offset="0%" style="stop-color:${color1}"/>
        <stop offset="100%" style="stop-color:${color2}"/>
      </linearGradient>
    </defs>
    <rect width="100%" height="100%" fill="url(#g)"/>
  </svg>`;

  const filepath = path.join(WORKSPACE, filename);
  await sharp(Buffer.from(svg)).png().toFile(filepath);
  return filepath;
}

// Base styles shared across slides
const baseStyle = `
html { background: ${C.bg}; }
* { box-sizing: border-box; margin: 0; padding: 0; }
body { width: 720pt; height: 405pt; margin: 0; padding: 0; font-family: Arial, sans-serif; background: ${C.bg}; display: flex; flex-direction: column; }
`;

// Slide definitions
const slides = [
  // SLIDE 1: Title
  {
    name: 'slide01-title.html',
    content: `<!DOCTYPE html>
<html><head><style>
${baseStyle}
body { justify-content: center; align-items: center; padding: 40pt; }
.accent-bar { position: absolute; top: 0; left: 0; width: 6pt; height: 100%; background: ${C.accent}; }
.container { text-align: center; }
.logo { font-size: 64pt; font-weight: bold; color: ${C.dark}; letter-spacing: -2pt; margin-bottom: 12pt; }
.tagline { font-size: 22pt; color: ${C.text}; margin-bottom: 48pt; font-weight: 400; }
.meta { font-size: 13pt; color: ${C.muted}; letter-spacing: 2pt; text-transform: uppercase; }
</style></head><body>
<div class="accent-bar"></div>
<div class="container">
  <p class="logo">SpecBridge</p>
  <p class="tagline">Bridge the gap between experts and engineers</p>
  <p class="meta">Seed Round  |  2025</p>
</div>
</body></html>`
  },

  // SLIDE 2: Problem
  {
    name: 'slide02-problem.html',
    content: `<!DOCTYPE html>
<html><head><style>
${baseStyle}
body { padding: 36pt 44pt; }
.header { display: flex; align-items: center; margin-bottom: 24pt; }
.accent { width: 4pt; height: 28pt; background: ${C.accent}; margin-right: 14pt; border-radius: 2pt; }
h1 { font-size: 34pt; color: ${C.dark}; font-weight: bold; }
.stats { display: flex; gap: 18pt; margin-bottom: 24pt; }
.stat { flex: 1; background: ${C.white}; border-radius: 10pt; padding: 20pt 16pt; text-align: center; border: 1pt solid ${C.light}; }
.stat-num { font-size: 38pt; font-weight: bold; color: ${C.accent}; margin-bottom: 6pt; }
.stat-label { font-size: 11pt; color: ${C.text}; line-height: 1.3; }
.pain-container { background: ${C.dark}; border-radius: 10pt; padding: 20pt 24pt; }
.pain { font-size: 15pt; color: ${C.white}; line-height: 1.6; }
.pain-highlight { color: ${C.accent}; font-weight: bold; }
</style></head><body>
<div class="header">
  <div class="accent"></div>
  <h1>The Problem</h1>
</div>
<div class="stats">
  <div class="stat">
    <p class="stat-num">30-40%</p>
    <p class="stat-label">of dev time spent on requirements clarification</p>
  </div>
  <div class="stat">
    <p class="stat-num">$260B</p>
    <p class="stat-label">wasted annually on failed software projects</p>
  </div>
  <div class="stat">
    <p class="stat-num">70%</p>
    <p class="stat-label">of failures traced to poor requirements</p>
  </div>
</div>
<div class="pain-container">
  <p class="pain">Domain experts think in <span class="pain-highlight">business language</span>. Developers need <span class="pain-highlight">precise specifications</span>. The gap causes rework, delays, and failed projects.</p>
</div>
</body></html>`
  },

  // SLIDE 3: Solution
  {
    name: 'slide03-solution.html',
    content: `<!DOCTYPE html>
<html><head><style>
${baseStyle}
body { padding: 36pt 44pt; }
.header { display: flex; align-items: center; margin-bottom: 16pt; }
.accent { width: 4pt; height: 28pt; background: ${C.accent}; margin-right: 14pt; border-radius: 2pt; }
h1 { font-size: 34pt; color: ${C.dark}; font-weight: bold; }
.subtitle { font-size: 16pt; color: ${C.text}; margin-bottom: 28pt; line-height: 1.5; max-width: 580pt; }
.features { display: flex; gap: 18pt; }
.feature { flex: 1; background: ${C.white}; border-radius: 10pt; padding: 20pt; border-left: 4pt solid ${C.accent}; }
.feature-num { font-size: 11pt; color: ${C.accent}; font-weight: bold; margin-bottom: 8pt; letter-spacing: 1pt; }
.feature-title { font-size: 16pt; font-weight: bold; color: ${C.dark}; margin-bottom: 10pt; }
.feature-desc { font-size: 12pt; color: ${C.text}; line-height: 1.5; }
</style></head><body>
<div class="header">
  <div class="accent"></div>
  <h1>The Solution</h1>
</div>
<p class="subtitle">AI that interviews domain experts in their language, then translates knowledge into precise technical specifications.</p>
<div class="features">
  <div class="feature">
    <p class="feature-num">01</p>
    <p class="feature-title">Intelligent Interviews</p>
    <p class="feature-desc">AI asks contextual follow-ups, probes edge cases, and captures tacit knowledge experts struggle to articulate.</p>
  </div>
  <div class="feature">
    <p class="feature-num">02</p>
    <p class="feature-title">Instant Artifacts</p>
    <p class="feature-desc">Automatically generates flowcharts, decision trees, business rules, and test cases from conversations.</p>
  </div>
  <div class="feature">
    <p class="feature-num">03</p>
    <p class="feature-title">Developer-Ready Output</p>
    <p class="feature-desc">Exports precise IF/THEN logic, edge case documentation, and validation criteria developers can implement directly.</p>
  </div>
</div>
</body></html>`
  },

  // SLIDE 4: How It Works
  {
    name: 'slide04-how.html',
    content: `<!DOCTYPE html>
<html><head><style>
${baseStyle}
body { padding: 36pt 44pt; }
.header { display: flex; align-items: center; margin-bottom: 32pt; }
.accent { width: 4pt; height: 28pt; background: ${C.accent}; margin-right: 14pt; border-radius: 2pt; }
h1 { font-size: 34pt; color: ${C.dark}; font-weight: bold; }
.steps { display: flex; gap: 12pt; align-items: stretch; }
.step { flex: 1; text-align: center; display: flex; flex-direction: column; align-items: center; }
.step-circle { width: 48pt; height: 48pt; background: ${C.dark}; color: ${C.white}; border-radius: 50%; display: flex; align-items: center; justify-content: center; margin-bottom: 14pt; }
.step-circle p { font-size: 20pt; font-weight: bold; }
.step-title { font-size: 14pt; font-weight: bold; color: ${C.dark}; margin-bottom: 8pt; }
.step-desc { font-size: 11pt; color: ${C.text}; line-height: 1.4; padding: 0 4pt; }
.arrow { display: flex; align-items: center; padding-top: 16pt; }
.arrow p { font-size: 22pt; color: ${C.accent}; font-weight: bold; }
</style></head><body>
<div class="header">
  <div class="accent"></div>
  <h1>How It Works</h1>
</div>
<div class="steps">
  <div class="step">
    <div class="step-circle"><p>1</p></div>
    <p class="step-title">Expert Describes</p>
    <p class="step-desc">Domain expert explains the process in plain language</p>
  </div>
  <div class="arrow"><p>></p></div>
  <div class="step">
    <div class="step-circle"><p>2</p></div>
    <p class="step-title">AI Interviews</p>
    <p class="step-desc">Smart follow-ups probe edge cases and nuances</p>
  </div>
  <div class="arrow"><p>></p></div>
  <div class="step">
    <div class="step-circle"><p>3</p></div>
    <p class="step-title">Artifacts Generated</p>
    <p class="step-desc">Flowcharts, rules, and specs created automatically</p>
  </div>
  <div class="arrow"><p>></p></div>
  <div class="step">
    <div class="step-circle"><p>4</p></div>
    <p class="step-title">Teams Align</p>
    <p class="step-desc">Developers implement with precision</p>
  </div>
</div>
</body></html>`
  },

  // SLIDE 5: Product Demo
  {
    name: 'slide05-product.html',
    content: `<!DOCTYPE html>
<html><head><style>
${baseStyle}
body { padding: 32pt 44pt; }
.header { display: flex; align-items: center; margin-bottom: 18pt; }
.accent { width: 4pt; height: 28pt; background: ${C.accent}; margin-right: 14pt; border-radius: 2pt; }
h1 { font-size: 34pt; color: ${C.dark}; font-weight: bold; }
.demo { display: flex; gap: 18pt; height: 270pt; }
.panel { flex: 1; background: ${C.white}; border-radius: 10pt; padding: 16pt; border: 1pt solid ${C.light}; display: flex; flex-direction: column; }
.panel-header { font-size: 10pt; color: ${C.muted}; text-transform: uppercase; letter-spacing: 1pt; margin-bottom: 14pt; font-weight: bold; }
.chat { flex: 1; display: flex; flex-direction: column; gap: 8pt; }
.msg { border-radius: 8pt; padding: 10pt 12pt; }
.msg-ai { background: #F1F5F9; }
.msg-user { background: ${C.dark}; margin-left: 24pt; }
.msg-ai p { font-size: 11pt; color: ${C.text}; }
.msg-user p { font-size: 11pt; color: ${C.white}; }
.artifacts { flex: 1; display: flex; flex-direction: column; gap: 8pt; }
.artifact { background: #F8FAFC; border-radius: 8pt; padding: 12pt 14pt; display: flex; justify-content: space-between; align-items: center; border: 1pt solid ${C.light}; }
.artifact p { font-size: 12pt; color: ${C.text}; }
.status { background: #D1FAE5; border-radius: 12pt; padding: 4pt 10pt; }
.status p { font-size: 10pt; color: #047857; font-weight: bold; }
</style></head><body>
<div class="header">
  <div class="accent"></div>
  <h1>The Product</h1>
</div>
<div class="demo">
  <div class="panel">
    <p class="panel-header">Interview Chat</p>
    <div class="chat">
      <div class="msg msg-ai"><p>What happens when a discount exceeds the max?</p></div>
      <div class="msg msg-user"><p>Goes to manager for approval</p></div>
      <div class="msg msg-ai"><p>What can managers approve without escalation?</p></div>
      <div class="msg msg-user"><p>Up to 25%. Above needs director approval.</p></div>
    </div>
  </div>
  <div class="panel">
    <p class="panel-header">Generated Artifacts</p>
    <div class="artifacts">
      <div class="artifact"><p>Process Overview</p><div class="status"><p>Ready</p></div></div>
      <div class="artifact"><p>Decision Flowchart</p><div class="status"><p>Ready</p></div></div>
      <div class="artifact"><p>Business Rules</p><div class="status"><p>Ready</p></div></div>
      <div class="artifact"><p>Edge Cases</p><div class="status"><p>Ready</p></div></div>
    </div>
  </div>
</div>
</body></html>`
  },

  // SLIDE 6: Market Size
  {
    name: 'slide06-market.html',
    content: `<!DOCTYPE html>
<html><head><style>
${baseStyle}
body { padding: 36pt 44pt; }
.header { display: flex; align-items: center; margin-bottom: 28pt; }
.accent { width: 4pt; height: 28pt; background: ${C.accent}; margin-right: 14pt; border-radius: 2pt; }
h1 { font-size: 34pt; color: ${C.dark}; font-weight: bold; }
.markets { display: flex; gap: 20pt; }
.market { flex: 1; background: ${C.white}; border-radius: 10pt; padding: 24pt 20pt; text-align: center; border: 1pt solid ${C.light}; }
.market.highlight { border: 2pt solid ${C.accent}; background: #F0FDFA; }
.market-label { font-size: 12pt; color: ${C.muted}; margin-bottom: 10pt; font-weight: bold; letter-spacing: 1pt; }
.market-value { font-size: 44pt; font-weight: bold; color: ${C.accent}; margin-bottom: 10pt; }
.market-desc { font-size: 12pt; color: ${C.text}; line-height: 1.4; }
</style></head><body>
<div class="header">
  <div class="accent"></div>
  <h1>Market Opportunity</h1>
</div>
<div class="markets">
  <div class="market">
    <p class="market-label">TAM</p>
    <p class="market-value">$45B</p>
    <p class="market-desc">Global requirements management and business analysis tools</p>
  </div>
  <div class="market">
    <p class="market-label">SAM</p>
    <p class="market-value">$8B</p>
    <p class="market-desc">Mid-market and enterprise software development teams</p>
  </div>
  <div class="market highlight">
    <p class="market-label">SOM (YEAR 3)</p>
    <p class="market-value">$120M</p>
    <p class="market-desc">Early adopters in agile and DevOps environments</p>
  </div>
</div>
</body></html>`
  },

  // SLIDE 7: Business Model
  {
    name: 'slide07-business.html',
    content: `<!DOCTYPE html>
<html><head><style>
${baseStyle}
body { padding: 36pt 44pt; }
.header { display: flex; align-items: center; margin-bottom: 22pt; }
.accent { width: 4pt; height: 28pt; background: ${C.accent}; margin-right: 14pt; border-radius: 2pt; }
h1 { font-size: 34pt; color: ${C.dark}; font-weight: bold; }
.tiers { display: flex; gap: 16pt; margin-bottom: 24pt; }
.tier { flex: 1; background: ${C.white}; border-radius: 10pt; padding: 18pt 16pt; text-align: center; border: 1pt solid ${C.light}; }
.tier.highlight { border: 2pt solid ${C.accent}; position: relative; }
.tier.highlight::before { content: ''; position: absolute; top: 0; left: 0; right: 0; height: 4pt; background: ${C.accent}; border-radius: 8pt 8pt 0 0; }
.tier-name { font-size: 14pt; font-weight: bold; color: ${C.dark}; margin-bottom: 8pt; }
.tier-price { font-size: 28pt; font-weight: bold; color: ${C.accent}; margin-bottom: 8pt; }
.tier-desc { font-size: 11pt; color: ${C.text}; }
.metrics { display: flex; gap: 24pt; justify-content: center; background: ${C.dark}; border-radius: 10pt; padding: 20pt 30pt; }
.metric { text-align: center; }
.metric-value { font-size: 24pt; font-weight: bold; color: ${C.accent}; margin-bottom: 4pt; }
.metric-label { font-size: 11pt; color: rgba(255,255,255,0.7); }
</style></head><body>
<div class="header">
  <div class="accent"></div>
  <h1>Business Model</h1>
</div>
<div class="tiers">
  <div class="tier">
    <p class="tier-name">Free</p>
    <p class="tier-price">$0</p>
    <p class="tier-desc">3 projects, basic exports</p>
  </div>
  <div class="tier highlight">
    <p class="tier-name">Pro</p>
    <p class="tier-price">$19/mo</p>
    <p class="tier-desc">Unlimited projects, all formats</p>
  </div>
  <div class="tier">
    <p class="tier-name">Enterprise</p>
    <p class="tier-price">Custom</p>
    <p class="tier-desc">SSO, compliance, dedicated support</p>
  </div>
</div>
<div class="metrics">
  <div class="metric"><p class="metric-value">85%</p><p class="metric-label">Gross Margin</p></div>
  <div class="metric"><p class="metric-value">$2,400</p><p class="metric-label">Target LTV</p></div>
  <div class="metric"><p class="metric-value">$50</p><p class="metric-label">Target CAC</p></div>
  <div class="metric"><p class="metric-value">48:1</p><p class="metric-label">LTV:CAC</p></div>
</div>
</body></html>`
  },

  // SLIDE 8: Traction
  {
    name: 'slide08-traction.html',
    content: `<!DOCTYPE html>
<html><head><style>
${baseStyle}
body { padding: 36pt 44pt; }
.header { display: flex; align-items: center; margin-bottom: 24pt; }
.accent { width: 4pt; height: 28pt; background: ${C.accent}; margin-right: 14pt; border-radius: 2pt; }
h1 { font-size: 34pt; color: ${C.dark}; font-weight: bold; }
.metrics { display: flex; gap: 16pt; margin-bottom: 24pt; }
.metric { flex: 1; background: ${C.white}; border-radius: 10pt; padding: 22pt 16pt; text-align: center; border: 1pt solid ${C.light}; }
.metric-value { font-size: 36pt; font-weight: bold; color: ${C.accent}; margin-bottom: 6pt; }
.metric-label { font-size: 11pt; color: ${C.text}; }
.milestones-header { font-size: 13pt; font-weight: bold; color: ${C.dark}; margin-bottom: 14pt; letter-spacing: 1pt; }
.milestones { display: flex; gap: 14pt; }
.milestone { flex: 1; padding: 14pt 16pt; background: ${C.white}; border-radius: 8pt; border-left: 3pt solid ${C.accent}; }
.milestone-date { font-size: 10pt; color: ${C.accent}; font-weight: bold; margin-bottom: 4pt; }
.milestone p { font-size: 12pt; color: ${C.text}; line-height: 1.4; }
</style></head><body>
<div class="header">
  <div class="accent"></div>
  <h1>Early Traction</h1>
</div>
<div class="metrics">
  <div class="metric"><p class="metric-value">MVP</p><p class="metric-label">Product Status</p></div>
  <div class="metric"><p class="metric-value">12</p><p class="metric-label">Beta Users</p></div>
  <div class="metric"><p class="metric-value">150+</p><p class="metric-label">Specs Created</p></div>
  <div class="metric"><p class="metric-value">4.8/5</p><p class="metric-label">User Satisfaction</p></div>
</div>
<p class="milestones-header">KEY MILESTONES</p>
<div class="milestones">
  <div class="milestone">
    <p class="milestone-date">Q4 2024</p>
    <p>MVP launched with core interview functionality</p>
  </div>
  <div class="milestone">
    <p class="milestone-date">Q1 2025</p>
    <p>Beta program with 12 design partners</p>
  </div>
  <div class="milestone">
    <p class="milestone-date">Q2 2025</p>
    <p>Public launch with Pro tier</p>
  </div>
</div>
</body></html>`
  },

  // SLIDE 9: Competition
  {
    name: 'slide09-competition.html',
    content: `<!DOCTYPE html>
<html><head><style>
${baseStyle}
body { padding: 36pt 44pt; }
.header { display: flex; align-items: center; margin-bottom: 20pt; }
.accent { width: 4pt; height: 28pt; background: ${C.accent}; margin-right: 14pt; border-radius: 2pt; }
h1 { font-size: 34pt; color: ${C.dark}; font-weight: bold; }
.table { background: ${C.white}; border-radius: 10pt; overflow: hidden; border: 1pt solid ${C.light}; }
.row { display: flex; border-bottom: 1pt solid ${C.light}; }
.row:last-child { border-bottom: none; }
.cell { flex: 1; padding: 12pt 14pt; display: flex; align-items: center; justify-content: center; }
.cell p { font-size: 12pt; color: ${C.text}; text-align: center; }
.cell.feature { flex: 1.6; justify-content: flex-start; }
.cell.feature p { font-weight: 600; color: ${C.dark}; text-align: left; }
.header-row { background: ${C.dark}; }
.header-row .cell p { color: ${C.white}; font-weight: bold; font-size: 11pt; }
.check p { color: ${C.accent}; font-weight: bold; }
.x p { color: #DC2626; }
.partial p { color: #D97706; }
.why { margin-top: 18pt; background: #F0FDFA; border-radius: 8pt; padding: 14pt 18pt; border-left: 4pt solid ${C.accent}; }
.why p { font-size: 13pt; color: ${C.text}; line-height: 1.5; }
.why-label { font-weight: bold; color: ${C.dark}; }
</style></head><body>
<div class="header">
  <div class="accent"></div>
  <h1>Why We Win</h1>
</div>
<div class="table">
  <div class="row header-row">
    <div class="cell feature"><p>Feature</p></div>
    <div class="cell"><p>SpecBridge</p></div>
    <div class="cell"><p>Jira/Confluence</p></div>
    <div class="cell"><p>Traditional BA</p></div>
  </div>
  <div class="row">
    <div class="cell feature"><p>AI-powered interviews</p></div>
    <div class="cell check"><p>Yes</p></div>
    <div class="cell x"><p>No</p></div>
    <div class="cell x"><p>No</p></div>
  </div>
  <div class="row">
    <div class="cell feature"><p>Auto-generated artifacts</p></div>
    <div class="cell check"><p>Yes</p></div>
    <div class="cell x"><p>No</p></div>
    <div class="cell partial"><p>Manual</p></div>
  </div>
  <div class="row">
    <div class="cell feature"><p>Edge case discovery</p></div>
    <div class="cell check"><p>Systematic</p></div>
    <div class="cell x"><p>None</p></div>
    <div class="cell partial"><p>Hit or miss</p></div>
  </div>
  <div class="row">
    <div class="cell feature"><p>Time to spec</p></div>
    <div class="cell check"><p>Minutes</p></div>
    <div class="cell partial"><p>Hours</p></div>
    <div class="cell x"><p>Days/Weeks</p></div>
  </div>
</div>
<div class="why">
  <p><span class="why-label">Unfair advantage:</span> Purpose-built AI for requirements extraction, not retrofitted documentation tools.</p>
</div>
</body></html>`
  },

  // SLIDE 10: Team
  {
    name: 'slide10-team.html',
    content: `<!DOCTYPE html>
<html><head><style>
${baseStyle}
body { padding: 32pt 44pt; justify-content: flex-start; align-items: center; }
.header { display: flex; align-items: center; margin-bottom: 20pt; width: 100%; }
.accent { width: 4pt; height: 28pt; background: ${C.accent}; margin-right: 14pt; border-radius: 2pt; }
h1 { font-size: 34pt; color: ${C.dark}; font-weight: bold; }
.team-card { background: ${C.white}; border-radius: 14pt; padding: 24pt 40pt; text-align: center; max-width: 400pt; border: 1pt solid ${C.light}; }
.avatar { width: 64pt; height: 64pt; background: ${C.light}; border-radius: 50%; margin: 0 auto 14pt auto; border: 3pt solid ${C.accent}; }
.name { font-size: 22pt; font-weight: bold; color: ${C.dark}; margin-bottom: 4pt; }
.role { font-size: 13pt; color: ${C.accent}; margin-bottom: 12pt; font-weight: 600; }
.bio { font-size: 12pt; color: ${C.text}; line-height: 1.4; margin-bottom: 12pt; }
.contact { font-size: 12pt; color: ${C.muted}; }
</style></head><body>
<div class="header">
  <div class="accent"></div>
  <h1>The Team</h1>
</div>
<div class="team-card">
  <div class="avatar"></div>
  <p class="name">Marco Kotrotsos</p>
  <p class="role">Founder and CEO</p>
  <p class="bio">Serial entrepreneur with enterprise software and AI experience. Built and scaled B2B SaaS products. Passionate about bridging the communication gap in software development.</p>
  <p class="contact">marco@specbridge.ai</p>
</div>
</body></html>`
  },

  // SLIDE 11: The Ask
  {
    name: 'slide11-ask.html',
    bgGradient: true,
    content: `<!DOCTYPE html>
<html><head><style>
html { background: ${C.dark}; }
* { box-sizing: border-box; margin: 0; padding: 0; }
body { width: 720pt; height: 405pt; margin: 0; padding: 40pt 48pt; font-family: Arial, sans-serif; background: ${C.dark}; display: flex; flex-direction: column; }
.header { display: flex; align-items: center; margin-bottom: 20pt; }
.accent { width: 4pt; height: 28pt; background: ${C.accent}; margin-right: 14pt; border-radius: 2pt; }
h1 { font-size: 34pt; color: ${C.white}; font-weight: bold; }
.amount { font-size: 64pt; font-weight: bold; color: ${C.accent}; margin-bottom: 4pt; }
.amount-label { font-size: 15pt; color: rgba(255,255,255,0.6); margin-bottom: 28pt; }
.uses { display: flex; gap: 16pt; }
.use { flex: 1; background: rgba(255,255,255,0.08); border-radius: 10pt; padding: 18pt; border: 1pt solid rgba(255,255,255,0.1); }
.use-amount { font-size: 28pt; font-weight: bold; color: ${C.accent}; margin-bottom: 6pt; }
.use-desc { font-size: 13pt; color: ${C.white}; }
</style></head><body>
<div class="header">
  <div class="accent"></div>
  <h1>The Ask</h1>
</div>
<p class="amount">$1.5M</p>
<p class="amount-label">Seed Round  |  18 month runway</p>
<div class="uses">
  <div class="use"><p class="use-amount">60%</p><p class="use-desc">Product and Engineering</p></div>
  <div class="use"><p class="use-amount">25%</p><p class="use-desc">Go-to-Market</p></div>
  <div class="use"><p class="use-amount">15%</p><p class="use-desc">Operations</p></div>
</div>
</body></html>`
  },

  // SLIDE 12: Thank You / Contact
  {
    name: 'slide12-thanks.html',
    content: `<!DOCTYPE html>
<html><head><style>
${baseStyle}
body { justify-content: center; align-items: center; padding: 40pt; }
.accent-bar { position: absolute; bottom: 0; left: 0; width: 100%; height: 6pt; background: ${C.accent}; }
.container { text-align: center; }
.logo { font-size: 56pt; font-weight: bold; color: ${C.dark}; letter-spacing: -2pt; margin-bottom: 10pt; }
.tagline { font-size: 20pt; color: ${C.text}; margin-bottom: 40pt; }
.contact-name { font-size: 16pt; color: ${C.muted}; margin-bottom: 6pt; }
.contact-email { font-size: 20pt; color: ${C.accent}; font-weight: bold; margin-bottom: 24pt; }
.website { font-size: 14pt; color: ${C.muted}; }
</style></head><body>
<div class="accent-bar"></div>
<div class="container">
  <p class="logo">SpecBridge</p>
  <p class="tagline">Bridge the gap between experts and engineers</p>
  <p class="contact-name">Marco Kotrotsos</p>
  <p class="contact-email">marco@specbridge.ai</p>
  <p class="website">specbridge.ai</p>
</div>
</body></html>`
  }
];

async function createPresentation() {
  console.log('Creating SpecBridge Pitch Deck...\n');

  const pptx = new pptxgen();
  pptx.layout = 'LAYOUT_16x9';
  pptx.author = 'SpecBridge';
  pptx.title = 'SpecBridge Investor Pitch Deck';
  pptx.subject = 'Seed Round 2025';

  // Process each slide
  for (let i = 0; i < slides.length; i++) {
    const slideData = slides[i];
    const htmlPath = path.join(WORKSPACE, slideData.name);
    fs.writeFileSync(htmlPath, slideData.content);
    console.log(`Processing: Slide ${i + 1} - ${slideData.name}`);

    await html2pptx(htmlPath, pptx, { tmpDir: WORKSPACE });
  }

  // Save presentation
  const outputPath = '/Users/marcokotrotsos/PERSONAL/specbridge/investor/specbridge-pitch-deck.pptx';
  await pptx.writeFile({ fileName: outputPath });
  console.log(`\nPresentation saved: ${outputPath}`);
  console.log('Done!');
}

createPresentation().catch(console.error);
