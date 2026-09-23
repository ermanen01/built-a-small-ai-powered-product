const input = document.querySelector('#feedback-input');
const countLabel = document.querySelector('#comment-count');
const results = document.querySelector('#results');
const toast = document.querySelector('#toast');

const SAMPLE = [
  'The dashboard takes forever to load, especially first thing in the morning.',
  'I love the product, but pages are really slow once our workspace gets big.',
  'The app froze twice while I was exporting a report. I had to start over.',
  'I wish I could invite my team without upgrading to the expensive plan.',
  'Adding a teammate is confusing — I can never find where to manage seats.',
  'We need more seats on the basic plan. The jump to Pro is too steep for us.',
  'It took me a while to figure out how to set up my first project.',
  'The onboarding was confusing. I almost gave up before I connected my first data source.',
  'There should be a quick start guide. I got stuck before I even started.',
  'I love the reports, but there is no way to send them straight to Slack.',
  'Please add a Slack integration so we can share updates with the team.',
  'I keep exporting CSVs because we can’t connect our analytics tool.',
  'The mobile app crashes every time I try to open a saved report.',
  'I can’t approve requests from my phone — the mobile experience is pretty limited.',
  'Support took four days to respond when our team was blocked.',
  'It would be nice to get a reply from support sooner when something breaks.'
].join('\n');

// Transparent, local-first categorization: shared product vocabulary is used to
// group evidence. Matching stays deliberately conservative and quote-backed.
const TAXONOMY = [
  { id:'performance', title:'Speed & reliability', icon:'◷', desc:'Performance, stability, and trust in core workflows.', terms:['slow','speed','load','loading','lag','laggy','freeze','frozen','crash','crashes','crashed','bug','bugs','error','errors','reliable','reliability','down','timeout'], opportunity:'Prioritize the slow or unstable workflow customers depend on most, then make its performance measurable.', label:'Improve reliability' },
  { id:'pricing', title:'Pricing & team access', icon:'◇', desc:'Plan limits, seats, upgrades, and perceived value.', terms:['price','pricing','expensive','cost','plan','upgrade','upgrading','seat','seats','billing','bill','pay','paid','free','afford','subscription','tier'], opportunity:'Test a more gradual path for team growth, with clearer seat limits and a right-sized middle tier.', label:'Revisit packaging' },
  { id:'onboarding', title:'Getting started', icon:'↗', desc:'Setup, onboarding, and finding the first useful step.', terms:['onboard','onboarding','setup','set up','quick start','getting started','stuck','learn','learning','guide','tutorial','documentation','docs','where do i','figure out'], opportunity:'Guide new users through one successful first task with a focused checklist and contextual help.', label:'Smooth onboarding' },
  { id:'integrations', title:'Integrations & sharing', icon:'⤴', desc:'Connecting the product to the tools and people around it.', terms:['integration','integrations','integrate','connect','connection','slack','export','csv','share','sharing','send','sync','synchronize','api','connectors'], opportunity:'Close the handoff gap with the most requested integration and a simpler sharing workflow.', label:'Connect the workflow' },
  { id:'mobile', title:'Mobile experience', icon:'▯', desc:'Mobile access, usability, and completing work on the go.', terms:['mobile','phone','iphone','android','crashes','screen','device','on the go'], opportunity:'Make the most important mobile task reliable and easy to finish on a small screen.', label:'Improve mobile' },
  { id:'support', title:'Customer support', icon:'♡', desc:'How quickly customers can get help and get unblocked.', terms:['support','respond','response','reply','replied','help','ticket','service','blocked','days to respond','wait'], opportunity:'Set clearer response expectations and surface a self-serve path for common blockers.', label:'Shorten time to help' },
  { id:'flexibility', title:'Workflow flexibility', icon:'⌘', desc:'Control, customization, and fit with different ways of working.', terms:['custom','customize','customise','flexible','flexibility','workflow','automate','automation','settings','filter','filters','template','templates','bulk','repetitive'], opportunity:'Let customers adapt the workflow with a small set of high-impact controls or reusable templates.', label:'Add flexibility' }
];
const PAIN_WORDS = ['hate','frustrated','frustrating','frustration','annoyed','annoying','broken','crash','crashes','crashed','freeze','frozen','slow','forever','blocked','stuck','can’t','cannot','cant','never','failed','fail','error','expensive','confusing','confused','give up','gave up','no way','too steep','almost gave up'];
const REQUEST_WORDS = ['wish','need','should','please','would like','want'];
const NEGATION_WORDS = ['not','no','never','without','hardly'];
const POSITIVE_WORDS = ['love','great','easy','helpful','useful','amazing','fast','simple','intuitive','excellent'];

function parseComments(text) {
  const lines = text.split(/\r?\n/).map(line => line.trim()).filter(Boolean);
  if (!lines.length) return [];
  const parseCsvRow = line => {
    const cells=[]; let cell='', quoted=false;
    for (let i=0;i<line.length;i++) {
      const char=line[i];
      if (char==='"' && quoted && line[i+1]==='"') { cell+='"'; i++; }
      else if (char==='"') quoted=!quoted;
      else if (char===',' && !quoted) { cells.push(cell.trim()); cell=''; }
      else cell+=char;
    }
    cells.push(cell.trim());
    return cells;
  };
  const header = parseCsvRow(lines[0]).map(cell=>cell.toLowerCase().replace(/^"|"$/g,'').trim());
  const commentColumn = header.findIndex(cell=>/^(feedback|comment|comments|response|message|text|verbatim|customer feedback)$/.test(cell));
  const hasHeader = commentColumn >= 0 && header.length > 1;
  const rows = hasHeader ? lines.slice(1).map(parseCsvRow).map(row=>row[commentColumn] || '') : lines;
  return rows.map(line=>line.trim().replace(/^"|"$/g,'')).filter(comment=>comment.length>2);
}
function normalize(text) { return text.toLowerCase().replace(/[’]/g,"'").replace(/[^\p{L}\p{N}'\s-]/gu,' ').replace(/\s+/g,' ').trim(); }
function termMatches(text, term) {
  const escaped = term.replace(/[.*+?^${}()|[\]\\]/g,'\\$&').replace(/\s+/g,'\\s+');
  return new RegExp(`(^|[^\\p{L}\\p{N}])${escaped}(?=$|[^\\p{L}\\p{N}])`,'iu').test(text);
}
function includesAny(text, terms) { return terms.some(term => termMatches(text, term)); }
function classify(comment) {
  const text = normalize(comment);
  const matched = TAXONOMY.filter(theme => theme.terms.some(term => termMatches(text, term)));
  const painTerms = PAIN_WORDS.filter(term => termMatches(text, term));
  const requestTerms = REQUEST_WORDS.filter(term => termMatches(text, term));
  const negatedPositive = POSITIVE_WORDS.some(word => {
    const pattern = new RegExp(`\\b(?:${NEGATION_WORDS.join('|')})\\s+(?:\\w+\\s+){0,2}${word}\\b`,'i');
    return pattern.test(text);
  });
  const positive = !negatedPositive && includesAny(text, POSITIVE_WORDS);
  const frustration = painTerms.length > 0;
  const frictionTerms = [...painTerms, ...requestTerms];
  return { comment, text, themes: matched.map(t => t.id), painTerms, frictionTerms, sentiment: frustration ? 'frustrated' : positive ? 'positive' : 'neutral', impact: Math.min(3, frictionTerms.length + (/(every time|can't|cannot|cant|never|crash|blocked|give up|gave up|forever)/i.test(text) ? 1 : 0)) };
}
function analyze(comments) {
  const analyzed = comments.map(classify);
  const total = analyzed.length;
  const themes = TAXONOMY.map(def => {
    const matches = analyzed.filter(item => item.themes.includes(def.id));
    if (!matches.length) return null;
    const painCount = matches.filter(item => item.frictionTerms.length > 0).length;
    const score = matches.reduce((sum,item) => sum + item.impact,0);
    return { ...def, matches, count:matches.length, painCount, score, share:matches.length/Math.max(total,1), severity: painCount >= 3 && matches.length >= 4 ? 'High' : painCount >= 2 ? 'Medium' : painCount > 0 ? 'Emerging' : 'Watch' };
  }).filter(Boolean).sort((a,b) => b.count-a.count || b.score-a.score);
  const opportunities = themes.filter(theme => theme.painCount > 0).sort((a,b) => (b.count + b.painCount * 0.4)-(a.count+a.painCount*0.4)).slice(0,3);
  const frustrated = analyzed.filter(item => item.frictionTerms.length > 0).length;
  const themeCoverage = analyzed.filter(item => item.themes.length > 0).length;
  return { analyzed, themes, opportunities, total, frustrated, themeCoverage };
}
function escapeHTML(value) { return value.replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c])); }
function quoteClip(text) { return text.length > 125 ? text.slice(0,122).trimEnd()+'…' : text; }
function render(data) {
  const { analyzed, themes, opportunities, total, frustrated, themeCoverage } = data;
  document.querySelector('#analysis-summary').textContent = `A first pass through ${total} ${total===1?'comment':'comments'}; ${themeCoverage} ${themeCoverage===1?'comment has':'comments have'} a recognizable product signal.`;
  const stats = [
    {label:'Comments reviewed',value:total,detail:'Customer voices in this batch',icon:'↘'},
    {label:'Recurring themes',value:themes.length,detail:'Product areas with matching language',icon:'✳'},
    {label:'Friction signals',value:frustrated,detail:total ? `${Math.round(frustrated/total*100)}% include a friction cue` : 'No friction cues detected',icon:'⌁'}
  ];
  document.querySelector('#stats-grid').innerHTML = stats.map(s=>`<article class="stat-card"><span class="stat-mark">${s.icon}</span><div class="stat-label">${s.label}</div><div class="stat-value">${s.value}</div><div class="stat-detail">${s.detail}</div></article>`).join('');
  const themeHost = document.querySelector('#theme-list');
  themeHost.innerHTML = themes.length ? themes.map(theme => {
    const severityClass = theme.severity === 'High' ? 'pain-high' : theme.severity === 'Medium' ? 'pain-medium' : '';
    const evidence = theme.matches.slice(0,2).map((m,i)=>`<blockquote class="quote">“${escapeHTML(quoteClip(m.comment))}”<small>Customer comment ${analyzed.indexOf(m)+1}</small></blockquote>`).join('');
    const supporting = theme.count > 2 ? `<span class="tag">+${theme.count-2} more</span>` : '';
    return `<article class="theme-card"><div class="theme-card-top"><div class="theme-title-wrap"><span class="theme-glyph">${theme.icon}</span><div><div class="theme-name">${theme.title}</div><div class="theme-subtitle">${theme.desc}</div></div></div><div class="theme-count">${theme.count}<span>${theme.count===1?'comment':'comments'}</span></div></div><div class="theme-meter"><span style="width:${Math.max(12,theme.share*100)}%"></span></div><div class="quotes">${evidence}</div><div class="theme-tags"><span class="tag ${severityClass}">${theme.severity==='Emerging'?'Emerging friction':theme.severity+' priority'}</span><span class="tag">${theme.painCount} pain ${theme.painCount===1?'signal':'signals'}</span>${supporting}</div></article>`;
  }).join('') : `<div class="empty-themes"><strong>No recurring product theme emerged yet.</strong><br>Try adding more specific feedback, or look for wording that names a workflow, feature, or obstacle.</div>`;
  const oppHost = document.querySelector('#opportunity-list');
  oppHost.innerHTML = opportunities.length ? opportunities.map((theme,i)=>`<article class="opportunity-item"><div class="opp-top"><span class="opp-number">0${i+1}</span><span class="opp-title">${theme.label}</span><span class="opp-priority">${theme.severity}</span></div><p>${theme.opportunity}</p><div class="opp-evidence">↳ ${theme.count} related ${theme.count===1?'comment':'comments'} · ${theme.painCount} friction signals</div></article>`).join('') : `<div class="opportunity-item"><p>No clear pain-led opportunity yet. The comments may describe preferences, or there may not be enough evidence to suggest a next move.</p></div>`;
  results.hidden = false;
  results.scrollIntoView({behavior:'smooth',block:'start'});
}
function showToast(message) { toast.textContent=message; toast.classList.add('show'); clearTimeout(showToast.timer); showToast.timer=setTimeout(()=>toast.classList.remove('show'),2300); }
function runAnalysis() {
  const comments = parseComments(input.value);
  if (!comments.length) { results.hidden = true; input.focus(); showToast('Add at least one customer comment to get started.'); return; }
  render(analyze(comments));
}
input.addEventListener('input',()=>{ countLabel.textContent=`${parseComments(input.value).length} comments`; });
document.querySelector('#load-sample').addEventListener('click',()=>{input.value=SAMPLE;countLabel.textContent=`${parseComments(input.value).length} comments`;runAnalysis();});
document.querySelector('#analyze-button').addEventListener('click',runAnalysis);
document.querySelector('#copy-summary').addEventListener('click',async()=>{
  const comments=parseComments(input.value), data=analyze(comments);
  const lines=[`Feedback analysis — ${data.total} comments`,`\nRECURRING THEMES`,...data.themes.map(t=>`• ${t.title}: ${t.count} comments, ${t.painCount} friction signals\n  Evidence: “${t.matches[0].comment}”`),`\nPRODUCT OPPORTUNITIES`,...data.opportunities.map((t,i)=>`${i+1}. ${t.label}: ${t.opportunity}`)];
  try { await navigator.clipboard.writeText(lines.join('\n')); showToast('Summary copied to clipboard.'); } catch { showToast('Clipboard access is unavailable in this browser.'); }
});
document.querySelector('.help-button').addEventListener('click',()=>showToast('Signal Garden is a private, local-first feedback analysis prototype.'));
