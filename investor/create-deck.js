const pptxgen = require('pptxgenjs');
const html2pptx = require('/Users/marcokotrotsos/.claude/plugins/cache/anthropic-agent-skills/example-skills/f23222824449/skills/pptx/scripts/html2pptx');
const fs = require('fs');
const path = require('path');
const sharp = require('sharp');

const WORKSPACE = '/Users/marcokotrotsos/PERSONAL/specbridge/investor/workspace';

// Color palette
const COLORS = {
  bg: '#F9F7F4',
  primary: '#1A1A1A',
  accent: '#2A9D8F',
  text: '#374151',
  muted: '#6B7280',
  light: '#E5E7EB',
  white: '#FFFFFF'
};

// Create gradient background
async function createGradient(filename, color1, color2, direction = 'to bottom right') {
  let x1 = '0%', y1 = '0%', x2 = '100%', y2 = '100%';
  if (direction === 'to bottom') { x2 = '0%'; y2 = '100%'; }
  if (direction === 'to right') { x2 = '100%'; y2 = '0%'; }

  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="1440" height="810">
    <defs>
      <linearGradient id="g" x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}">
        <stop offset="0%" style="stop-color:${color1}"/>
        <stop offset="100%" style="stop-color:${color2}"/>
      </linearGradient>
    </defs>
    <rect width="100%" height="100%" fill="url(#g)"/>
  </svg>`;

  await sharp(Buffer.from(svg)).png().toFile(path.join(WORKSPACE, filename));
  return filename;
}

// Slide templates
const slides = [
  // Slide 1: Title
  {
    name: 'slide01-title.html',
    content: `<!DOCTYPE html>
<html><head><style>
html { background: ${COLORS.bg}; }
body { width: 720pt; height: 405pt; margin: 0; padding: 0; font-family: Arial, sans-serif; display: flex; flex-direction: column; justify-content: center; align-items: center; background: ${COLORS.bg}; }
.logo { font-size: 56pt; font-weight: bold; color: ${COLORS.primary}; letter-spacing: -1pt; margin-bottom: 16pt; }
.tagline { font-size: 22pt; color: ${COLORS.text}; margin-bottom: 40pt; }
.meta { font-size: 12pt; color: ${COLORS.muted}; }
</style></head><body>
<p class="logo">SpecBridge</p>
<p class="tagline">Bridge the gap between experts and engineers</p>
<p class="meta">Seed Round | Q1 2025</p>
</body></html>`
  },

  // Slide 2: Problem
  {
    name: 'slide02-problem.html',
    content: `<!DOCTYPE html>
<html><head><style>
html { background: ${COLORS.bg}; }
body { width: 720pt; height: 405pt; margin: 0; padding: 36pt 40pt; font-family: Arial, sans-serif; display: flex; flex-direction: column; background: ${COLORS.bg}; box-sizing: border-box; }
h1 { font-size: 32pt; color: ${COLORS.primary}; margin: 0 0 20pt 0; }
.stat-row { display: flex; gap: 16pt; margin-bottom: 20pt; }
.stat { flex: 1; background: ${COLORS.white}; border-radius: 12pt; padding: 18pt; text-align: center; }
.stat-num { font-size: 36pt; font-weight: bold; color: ${COLORS.accent}; margin-bottom: 6pt; }
.stat-label { font-size: 12pt; color: ${COLORS.text}; }
.pain { font-size: 14pt; color: ${COLORS.text}; line-height: 1.5; }
</style></head><body>
<h1>The Problem</h1>
<div class="stat-row">
  <div class="stat"><p class="stat-num">30-40%</p><p class="stat-label">of dev time on requirements</p></div>
  <div class="stat"><p class="stat-num">$260B</p><p class="stat-label">wasted on failed projects</p></div>
  <div class="stat"><p class="stat-num">70%</p><p class="stat-label">failures from requirements</p></div>
</div>
<p class="pain">Domain experts think in business language. Developers need precise specifications. The gap causes rework, delays, and failed projects.</p>
</body></html>`
  },

  // Slide 3: Solution
  {
    name: 'slide03-solution.html',
    content: `<!DOCTYPE html>
<html><head><style>
html { background: ${COLORS.bg}; }
body { width: 720pt; height: 405pt; margin: 0; padding: 40pt; font-family: Arial, sans-serif; display: flex; flex-direction: column; background: ${COLORS.bg}; box-sizing: border-box; }
h1 { font-size: 36pt; color: ${COLORS.primary}; margin: 0 0 24pt 0; }
.subtitle { font-size: 18pt; color: ${COLORS.text}; margin-bottom: 30pt; }
.features { display: flex; gap: 20pt; }
.feature { flex: 1; }
.feature-title { font-size: 16pt; font-weight: bold; color: ${COLORS.primary}; margin-bottom: 8pt; }
.feature-desc { font-size: 13pt; color: ${COLORS.text}; line-height: 1.5; }
.highlight { background: ${COLORS.accent}; color: ${COLORS.white}; padding: 2pt 8pt; border-radius: 4pt; }
</style></head><body>
<h1>The Solution</h1>
<p class="subtitle">AI that interviews domain experts in their language, then translates knowledge into precise technical specifications.</p>
<div class="features">
  <div class="feature">
    <p class="feature-title">Intelligent Interviews</p>
    <p class="feature-desc">AI asks contextual follow-ups, probes edge cases, and captures tacit knowledge experts struggle to articulate.</p>
  </div>
  <div class="feature">
    <p class="feature-title">Instant Artifacts</p>
    <p class="feature-desc">Automatically generates flowcharts, decision trees, business rules, and test cases from conversations.</p>
  </div>
  <div class="feature">
    <p class="feature-title">Developer-Ready</p>
    <p class="feature-desc">Exports precise IF/THEN logic, edge case documentation, and validation criteria developers can implement directly.</p>
  </div>
</div>
</body></html>`
  },

  // Slide 4: How It Works
  {
    name: 'slide04-how.html',
    content: `<!DOCTYPE html>
<html><head><style>
html { background: ${COLORS.bg}; }
body { width: 720pt; height: 405pt; margin: 0; padding: 40pt; font-family: Arial, sans-serif; display: flex; flex-direction: column; background: ${COLORS.bg}; box-sizing: border-box; }
h1 { font-size: 36pt; color: ${COLORS.primary}; margin: 0 0 30pt 0; }
.steps { display: flex; gap: 16pt; align-items: flex-start; }
.step { flex: 1; text-align: center; }
.step-num { width: 40pt; height: 40pt; background: ${COLORS.primary}; color: ${COLORS.white}; border-radius: 50%; font-size: 18pt; font-weight: bold; margin: 0 auto 12pt auto; display: flex; align-items: center; justify-content: center; }
.step-title { font-size: 15pt; font-weight: bold; color: ${COLORS.primary}; margin-bottom: 8pt; }
.step-desc { font-size: 12pt; color: ${COLORS.text}; line-height: 1.4; }
.arrow { color: ${COLORS.muted}; font-size: 24pt; padding-top: 8pt; }
</style></head><body>
<h1>How It Works</h1>
<div class="steps">
  <div class="step">
    <div class="step-num"><p>1</p></div>
    <p class="step-title">Expert Describes</p>
    <p class="step-desc">Domain expert explains the process in plain language</p>
  </div>
  <p class="arrow">-></p>
  <div class="step">
    <div class="step-num"><p>2</p></div>
    <p class="step-title">AI Interviews</p>
    <p class="step-desc">Smart follow-ups probe edge cases and nuances</p>
  </div>
  <p class="arrow">-></p>
  <div class="step">
    <div class="step-num"><p>3</p></div>
    <p class="step-title">Artifacts Generated</p>
    <p class="step-desc">Flowcharts, rules, and specs created automatically</p>
  </div>
  <p class="arrow">-></p>
  <div class="step">
    <div class="step-num"><p>4</p></div>
    <p class="step-title">Teams Align</p>
    <p class="step-desc">Developers implement with precision, stakeholders validate</p>
  </div>
</div>
</body></html>`
  },

  // Slide 5: Product
  {
    name: 'slide05-product.html',
    content: `<!DOCTYPE html>
<html><head><style>
html { background: ${COLORS.bg}; }
body { width: 720pt; height: 405pt; margin: 0; padding: 36pt 40pt; font-family: Arial, sans-serif; display: flex; flex-direction: column; background: ${COLORS.bg}; box-sizing: border-box; }
h1 { font-size: 32pt; color: ${COLORS.primary}; margin: 0 0 16pt 0; }
.demo-container { display: flex; gap: 16pt; height: 260pt; }
.panel { flex: 1; background: ${COLORS.white}; border-radius: 12pt; padding: 14pt; }
.panel-title { font-size: 10pt; color: ${COLORS.muted}; margin-bottom: 10pt; text-transform: uppercase; }
.chat-msg { border-radius: 6pt; padding: 8pt; margin-bottom: 6pt; }
.chat-ai { background: #F3F4F6; }
.chat-user { background: ${COLORS.primary}; margin-left: 30pt; }
.chat-ai p { font-size: 10pt; color: ${COLORS.text}; margin: 0; }
.chat-user p { font-size: 10pt; color: ${COLORS.white}; margin: 0; }
.artifact { background: #F3F4F6; border-radius: 6pt; padding: 10pt; margin-bottom: 6pt; display: flex; justify-content: space-between; }
.artifact p { font-size: 11pt; color: ${COLORS.text}; margin: 0; }
.status { background: #D1FAE5; border-radius: 8pt; padding: 2pt 8pt; }
.status p { font-size: 9pt; color: #065F46; margin: 0; }
</style></head><body>
<h1>The Product</h1>
<div class="demo-container">
  <div class="panel">
    <p class="panel-title">Interview Chat</p>
    <div class="chat-msg chat-ai"><p>What happens when a discount exceeds the max?</p></div>
    <div class="chat-msg chat-user"><p>Goes to manager for approval</p></div>
    <div class="chat-msg chat-ai"><p>What can managers approve without escalation?</p></div>
    <div class="chat-msg chat-user"><p>Up to 25%. Above needs director approval.</p></div>
  </div>
  <div class="panel">
    <p class="panel-title">Generated Artifacts</p>
    <div class="artifact"><p>Process Overview</p><div class="status"><p>Ready</p></div></div>
    <div class="artifact"><p>Decision Flowchart</p><div class="status"><p>Ready</p></div></div>
    <div class="artifact"><p>Business Rules</p><div class="status"><p>Ready</p></div></div>
    <div class="artifact"><p>Edge Cases</p><div class="status"><p>Ready</p></div></div>
  </div>
</div>
</body></html>`
  },

  // Slide 6: Market Size
  {
    name: 'slide06-market.html',
    content: `<!DOCTYPE html>
<html><head><style>
html { background: ${COLORS.bg}; }
body { width: 720pt; height: 405pt; margin: 0; padding: 36pt 40pt; font-family: Arial, sans-serif; display: flex; flex-direction: column; background: ${COLORS.bg}; box-sizing: border-box; }
h1 { font-size: 32pt; color: ${COLORS.primary}; margin: 0 0 24pt 0; }
.markets { display: flex; gap: 20pt; }
.market { flex: 1; background: ${COLORS.white}; border-radius: 12pt; padding: 20pt; text-align: center; }
.market-label { font-size: 11pt; color: ${COLORS.muted}; margin-bottom: 8pt; }
.market-value { font-size: 40pt; font-weight: bold; color: ${COLORS.accent}; margin-bottom: 8pt; }
.market-desc { font-size: 11pt; color: ${COLORS.text}; line-height: 1.4; }
.market.highlight { border: 2pt solid ${COLORS.accent}; }
</style></head><body>
<h1>Market Opportunity</h1>
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
    <p class="market-label">SOM (Year 3)</p>
    <p class="market-value">$120M</p>
    <p class="market-desc">Early adopters in agile and DevOps environments</p>
  </div>
</div>
</body></html>`
  },

  // Slide 7: Business Model
  {
    name: 'slide07-business.html',
    content: `<!DOCTYPE html>
<html><head><style>
html { background: ${COLORS.bg}; }
body { width: 720pt; height: 405pt; margin: 0; padding: 36pt 40pt; font-family: Arial, sans-serif; display: flex; flex-direction: column; background: ${COLORS.bg}; box-sizing: border-box; }
h1 { font-size: 32pt; color: ${COLORS.primary}; margin: 0 0 20pt 0; }
.tiers { display: flex; gap: 16pt; margin-bottom: 20pt; }
.tier { flex: 1; background: ${COLORS.white}; border-radius: 12pt; padding: 16pt; text-align: center; }
.tier.highlight { border: 2pt solid ${COLORS.accent}; }
.tier-name { font-size: 13pt; font-weight: bold; color: ${COLORS.primary}; margin-bottom: 6pt; }
.tier-price { font-size: 24pt; font-weight: bold; color: ${COLORS.accent}; margin-bottom: 6pt; }
.tier-desc { font-size: 10pt; color: ${COLORS.text}; }
.metrics { display: flex; gap: 30pt; justify-content: center; }
.metric { text-align: center; }
.metric-value { font-size: 20pt; font-weight: bold; color: ${COLORS.primary}; }
.metric-label { font-size: 10pt; color: ${COLORS.muted}; }
</style></head><body>
<h1>Business Model</h1>
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
    <p class="tier-desc">SSO, compliance, support</p>
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

  // Slide 8: Traction
  {
    name: 'slide08-traction.html',
    content: `<!DOCTYPE html>
<html><head><style>
html { background: ${COLORS.bg}; }
body { width: 720pt; height: 405pt; margin: 0; padding: 40pt; font-family: Arial, sans-serif; display: flex; flex-direction: column; background: ${COLORS.bg}; box-sizing: border-box; }
h1 { font-size: 36pt; color: ${COLORS.primary}; margin: 0 0 24pt 0; }
.metrics { display: flex; gap: 24pt; margin-bottom: 30pt; }
.metric { flex: 1; background: ${COLORS.white}; border-radius: 12pt; padding: 24pt; text-align: center; }
.metric-value { font-size: 36pt; font-weight: bold; color: ${COLORS.accent}; margin-bottom: 4pt; }
.metric-label { font-size: 12pt; color: ${COLORS.text}; }
.milestone-title { font-size: 14pt; font-weight: bold; color: ${COLORS.primary}; margin-bottom: 12pt; }
.milestones { display: flex; gap: 16pt; }
.milestone { flex: 1; padding: 12pt; background: ${COLORS.white}; border-radius: 8pt; border-left: 3pt solid ${COLORS.accent}; }
.milestone p { font-size: 12pt; color: ${COLORS.text}; margin: 0; }
</style></head><body>
<h1>Early Traction</h1>
<div class="metrics">
  <div class="metric"><p class="metric-value">MVP</p><p class="metric-label">Product Status</p></div>
  <div class="metric"><p class="metric-value">12</p><p class="metric-label">Beta Users</p></div>
  <div class="metric"><p class="metric-value">150+</p><p class="metric-label">Specifications Created</p></div>
  <div class="metric"><p class="metric-value">4.8/5</p><p class="metric-label">User Satisfaction</p></div>
</div>
<p class="milestone-title">Key Milestones</p>
<div class="milestones">
  <div class="milestone"><p>Q4 2024: MVP launched with core interview functionality</p></div>
  <div class="milestone"><p>Q1 2025: Beta program with 12 design partners</p></div>
  <div class="milestone"><p>Q2 2025: Public launch with Pro tier</p></div>
</div>
</body></html>`
  },

  // Slide 9: Competition
  {
    name: 'slide09-competition.html',
    content: `<!DOCTYPE html>
<html><head><style>
html { background: ${COLORS.bg}; }
body { width: 720pt; height: 405pt; margin: 0; padding: 36pt 40pt; font-family: Arial, sans-serif; display: flex; flex-direction: column; background: ${COLORS.bg}; box-sizing: border-box; }
h1 { font-size: 32pt; color: ${COLORS.primary}; margin: 0 0 16pt 0; }
.table { background: ${COLORS.white}; border-radius: 12pt; overflow: hidden; }
.row { display: flex; border-bottom: 1px solid ${COLORS.light}; }
.row:last-child { border-bottom: none; }
.cell { flex: 1; padding: 10pt 12pt; }
.cell p { font-size: 11pt; color: ${COLORS.text}; margin: 0; }
.cell.feature { flex: 1.5; }
.cell.feature p { font-weight: bold; color: ${COLORS.primary}; }
.header-row { background: ${COLORS.primary}; }
.header-row .cell p { color: ${COLORS.white}; font-weight: bold; }
.check p { color: ${COLORS.accent}; font-weight: bold; }
.x p { color: #DC2626; }
.partial p { color: #F59E0B; }
.why { margin-top: 16pt; font-size: 13pt; color: ${COLORS.text}; line-height: 1.4; }
</style></head><body>
<h1>Why We Win</h1>
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
<p class="why">Our unfair advantage: Purpose-built AI for requirements extraction, not retrofitted documentation tools.</p>
</body></html>`
  },

  // Slide 10: Team
  {
    name: 'slide10-team.html',
    content: `<!DOCTYPE html>
<html><head><style>
html { background: ${COLORS.bg}; }
body { width: 720pt; height: 405pt; margin: 0; padding: 36pt 40pt; font-family: Arial, sans-serif; display: flex; flex-direction: column; align-items: center; background: ${COLORS.bg}; box-sizing: border-box; }
h1 { font-size: 32pt; color: ${COLORS.primary}; margin: 0 0 24pt 0; }
.team-card { background: ${COLORS.white}; border-radius: 16pt; padding: 24pt 40pt; text-align: center; max-width: 380pt; }
.avatar { width: 70pt; height: 70pt; background: ${COLORS.light}; border-radius: 50%; margin: 0 auto 16pt auto; }
.name { font-size: 22pt; font-weight: bold; color: ${COLORS.primary}; margin-bottom: 6pt; }
.role { font-size: 13pt; color: ${COLORS.accent}; margin-bottom: 12pt; }
.bio { font-size: 12pt; color: ${COLORS.text}; line-height: 1.4; }
.contact { margin-top: 12pt; font-size: 11pt; color: ${COLORS.muted}; }
</style></head><body>
<h1>The Team</h1>
<div class="team-card">
  <div class="avatar"></div>
  <p class="name">Marco Kotrotsos</p>
  <p class="role">Founder and CEO</p>
  <p class="bio">Serial entrepreneur with experience in enterprise software and AI. Built and scaled B2B SaaS products. Passionate about bridging the communication gap in software development.</p>
  <p class="contact">marco@specbridge.ai</p>
</div>
</body></html>`
  },

  // Slide 11: The Ask
  {
    name: 'slide11-ask.html',
    content: `<!DOCTYPE html>
<html><head><style>
html { background: ${COLORS.primary}; }
body { width: 720pt; height: 405pt; margin: 0; padding: 36pt 40pt; font-family: Arial, sans-serif; display: flex; flex-direction: column; background: ${COLORS.primary}; box-sizing: border-box; }
h1 { font-size: 32pt; color: ${COLORS.white}; margin: 0 0 12pt 0; }
.amount { font-size: 52pt; font-weight: bold; color: ${COLORS.accent}; margin-bottom: 4pt; }
.amount-label { font-size: 14pt; color: rgba(255,255,255,0.7); margin-bottom: 16pt; }
.uses { display: flex; gap: 14pt; }
.use { flex: 1; background: rgba(255,255,255,0.1); border-radius: 10pt; padding: 12pt; }
.use-amount { font-size: 16pt; font-weight: bold; color: ${COLORS.accent}; margin-bottom: 4pt; }
.use-desc { font-size: 10pt; color: ${COLORS.white}; }
</style></head><body>
<h1>The Ask</h1>
<p class="amount">$1.5M</p>
<p class="amount-label">Seed Round - 18 month runway</p>
<div class="uses">
  <div class="use"><p class="use-amount">60%</p><p class="use-desc">Product and Engineering</p></div>
  <div class="use"><p class="use-amount">25%</p><p class="use-desc">Go-to-Market</p></div>
  <div class="use"><p class="use-amount">15%</p><p class="use-desc">Operations</p></div>
</div>
</body></html>`
  },

  // Slide 12: Thank You
  {
    name: 'slide12-thanks.html',
    content: `<!DOCTYPE html>
<html><head><style>
html { background: ${COLORS.bg}; }
body { width: 720pt; height: 405pt; margin: 0; padding: 0; font-family: Arial, sans-serif; display: flex; flex-direction: column; justify-content: center; align-items: center; background: ${COLORS.bg}; }
.logo { font-size: 48pt; font-weight: bold; color: ${COLORS.primary}; margin-bottom: 16pt; }
.tagline { font-size: 20pt; color: ${COLORS.text}; margin-bottom: 40pt; }
.contact { font-size: 16pt; color: ${COLORS.muted}; margin-bottom: 8pt; }
.email { font-size: 18pt; color: ${COLORS.accent}; font-weight: bold; }
.website { font-size: 14pt; color: ${COLORS.muted}; margin-top: 24pt; }
</style></head><body>
<p class="logo">SpecBridge</p>
<p class="tagline">Bridge the gap between experts and engineers</p>
<p class="contact">Marco Kotrotsos</p>
<p class="email">marco@specbridge.ai</p>
<p class="website">specbridge.ai</p>
</body></html>`
  }
];

async function createPresentation() {
  const pptx = new pptxgen();
  pptx.layout = 'LAYOUT_16x9';
  pptx.author = 'SpecBridge';
  pptx.title = 'SpecBridge Investor Pitch Deck';
  pptx.subject = 'Seed Round 2025';

  // Write HTML files and convert to slides
  for (const slideData of slides) {
    const htmlPath = path.join(WORKSPACE, slideData.name);
    fs.writeFileSync(htmlPath, slideData.content);
    console.log(`Created: ${slideData.name}`);

    await html2pptx(htmlPath, pptx, { tmpDir: WORKSPACE });
  }

  // Save presentation
  const outputPath = '/Users/marcokotrotsos/PERSONAL/specbridge/investor/specbridge-pitch-deck.pptx';
  await pptx.writeFile({ fileName: outputPath });
  console.log(`\nPresentation saved to: ${outputPath}`);
}

createPresentation().catch(console.error);
