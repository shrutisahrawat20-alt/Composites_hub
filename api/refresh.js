// HRC Composites Hub — api/refresh.js
// Sources: RSS + Reddit + Google Custom Search + Bing News + OpenAI web search
//
// Environment variables required in Vercel:
//   OPENAI_API_KEY   — OpenAI key (AI-curated search per region)
//   GOOGLE_API_KEY   — Google Cloud API key
//   GOOGLE_CSE_ID    — Google Custom Search Engine ID (create at cse.google.com)
//   BING_API_KEY     — Azure Cognitive Services key (Bing News Search)
//
// All keys are optional — degrades gracefully if missing.

const RSS_FEEDS = [
  { url: 'https://www.compositesworld.com/rss/all',              source: 'CompositesWorld',         region: 'global', sector: 'materials' },
  { url: 'https://www.jeccomposites.com/feed/',                  source: 'JEC Group',               region: 'eu',     sector: 'materials' },
  { url: 'https://eucia.eu/category/news/feed',                  source: 'EuCIA',                   region: 'eu',     sector: 'recycling' },
  { url: 'https://www.aviationweek.com/rss.xml',                 source: 'Aviation Week',           region: 'global', sector: 'aerospace' },
  { url: 'https://www.ainonline.com/rss.xml',                    source: 'AIN Online',              region: 'global', sector: 'aerospace' },
  { url: 'https://www.aero-mag.com/category/news/feed',          source: 'Aerospace Manufacturing', region: 'eu',     sector: 'aerospace' },
  { url: 'https://evtolinsights.com/feed/',                      source: 'eVTOL Insights',          region: 'global', sector: 'aerospace' },
  { url: 'https://evtol.news/feed/',                             source: 'eVTOL News',              region: 'global', sector: 'aerospace' },
  { url: 'https://dronelife.com/feed/',                          source: 'DroneLife',               region: 'global', sector: 'aerospace' },
  { url: 'https://www.autonews.com/rss/rss_latest.rss',          source: 'Automotive News',         region: 'global', sector: 'motor' },
  { url: 'https://www.automotivedive.com/feeds/news_rss/',       source: 'Automotive Dive',         region: 'usa',    sector: 'motor' },
  { url: 'https://www.emobility-engineering.com/feed/',          source: 'eMobility Engineering',   region: 'eu',     sector: 'motor' },
  { url: 'https://futuretransport-news.com/feed/',               source: 'Future Transport News',   region: 'eu',     sector: 'motor' },
  { url: 'https://www.azom.com/rss-feed.xml',                   source: 'AZO Materials',           region: 'global', sector: 'materials' },
  { url: 'https://interestingengineering.com/feed',              source: 'Interesting Engineering', region: 'global', sector: 'materials' },
  { url: 'https://www.globalrailwayreview.com/feed/',            source: 'Global Railway Review',   region: 'global', sector: 'construction' },
  { url: 'https://www.energyglobal.com/news/feed/',              source: 'Energy Global',           region: 'global', sector: 'construction' },
  { url: 'https://www.h2-view.com/news/all-news/feed/',          source: 'H2 View',                region: 'global', sector: 'construction' },
];

const REDDIT_SEARCHES = [
  { subreddit: 'compositesmanufacturing', region: 'global', sector: 'materials' },
  { subreddit: 'CarbonFiber',             region: 'global', sector: 'materials' },
  { subreddit: 'aerospace',               region: 'global', sector: 'aerospace', query: 'composite OR carbon fiber OR CFRP' },
  { subreddit: 'materials',               region: 'global', sector: 'materials', query: 'carbon fiber OR composite OR CFRP prepreg' },
  { subreddit: 'engineering',             region: 'global', sector: 'materials', query: 'carbon fiber composite manufacturing' },
  { subreddit: 'Additive_Manufacturing',  region: 'global', sector: 'materials', query: 'composite OR carbon fiber' },
  { subreddit: 'electricvehicles',        region: 'global', sector: 'motor',     query: 'carbon fiber composite lightweight' },
  { subreddit: 'windpower',               region: 'global', sector: 'construction', query: 'blade composite' },
];

const GOOGLE_QUERIES = [
  { q: 'carbon fiber composite news Europe 2026',             region: 'eu',     sector: 'materials' },
  { q: 'CFRP aerospace composite manufacturing news 2026',    region: 'global', sector: 'aerospace' },
  { q: 'carbon fiber automotive lightweighting EV 2026',      region: 'global', sector: 'motor' },
  { q: 'wind turbine blade composite recycling news 2026',    region: 'global', sector: 'construction' },
  { q: 'China carbon fiber CFRP manufacturing news 2026',     region: 'china',  sector: 'materials' },
  { q: 'Toray Hexcel Solvay Teijin composites news 2026',     region: 'global', sector: 'materials' },
  { q: 'JEC composites innovation 2026',                      region: 'eu',     sector: 'materials' },
  { q: 'recyclable carbon fiber composite sustainability 2026',region: 'global', sector: 'recycling' },
];

const BING_QUERIES = [
  { q: 'carbon fiber composite industry news',    region: 'global', sector: 'materials' },
  { q: 'CFRP aerospace composite manufacturing',  region: 'global', sector: 'aerospace' },
  { q: 'carbon fiber automotive EV lightweight',  region: 'global', sector: 'motor' },
  { q: 'composites recycling sustainability',     region: 'global', sector: 'recycling' },
  { q: 'wind blade composite wind energy',        region: 'global', sector: 'construction' },
  { q: 'Toray Hexcel SGL composites market',      region: 'global', sector: 'materials' },
  { q: 'carbon fiber China manufacturing 2026',   region: 'china',  sector: 'materials' },
  { q: 'JEC composites Europe innovation award',  region: 'eu',     sector: 'materials' },
];

const AI_PROMPTS = [
  { region: 'eu',     prompt: 'Search for the latest composites industry news from Europe published in the last 7 days. Cover CFRP automotive, aerospace composites, recycling, JEC World, manufacturing innovation. Return ONLY a JSON array, no markdown. Format: [{"title":"...","summary":"2 sentence factual summary","sector":"motor|aerospace|recycling|materials|construction","source":"publication name","url":"https://...","date":"YYYY-MM-DD"}]. Return 10 items.' },
  { region: 'china',  prompt: 'Search for the latest composites and carbon fiber industry news from China published in the last 7 days. Cover CFRP EV cars, eVTOL, wind turbine blades, T1100/T1200 fiber, Chinese aerospace composites, manufacturers like Zhongfu Shenying and Jinggong. Return ONLY a JSON array, no markdown. Format: [{"title":"...","summary":"2 sentence factual summary","sector":"motor|aerospace|recycling|materials|construction","source":"publication name","url":"https://...","date":"YYYY-MM-DD"}]. Return 10 items.' },
  { region: 'usa',    prompt: 'Search for the latest composites and carbon fiber industry news from USA published in the last 7 days. Cover Boeing, Joby eVTOL, Hexcel, Cytec, NASA composites, carbon fiber recycling, automotive CFRP. Return ONLY a JSON array, no markdown. Format: [{"title":"...","summary":"2 sentence factual summary","sector":"motor|aerospace|recycling|materials|construction","source":"publication name","url":"https://...","date":"YYYY-MM-DD"}]. Return 10 items.' },
  { region: 'global', prompt: 'Search for the latest global composites industry news published in the last 7 days. Focus on Toray, Hexcel, Solvay, Teijin, SGL Carbon, market reports, M&A, CompositesWorld, JEC Group, wind energy composites, hydrogen pressure vessels, recycled carbon fiber. Return ONLY a JSON array, no markdown. Format: [{"title":"...","summary":"2 sentence factual summary","sector":"motor|aerospace|recycling|materials|construction","source":"publication name","url":"https://...","date":"YYYY-MM-DD"}]. Return 10 items.' },
];

const SECTOR_RULES = [
  { sector: 'motor',        words: ['automotive','vehicle','car','electric vehicle','motorsport','formula','bmw','ferrari','mercedes','audi','toyota','volkswagen','supercar','flying car','chassis','lightweighting','van','truck'] },
  { sector: 'aerospace',    words: ['aerospace','aircraft','airbus','boeing','aviation','satellite','uav','drone','space','fuselage','wing','rocket','evtol','helicopter','propeller','nacelle','easa','faa'] },
  { sector: 'recycling',    words: ['recycl','reclaim','end-of-life','circular','bio-based','sustainable','degradation','reuse','reprocess','closed-loop','hemp fiber','flax fiber','natural fiber','natural fibre'] },
  { sector: 'construction', words: ['construction','bridge','infrastructure','rebar','wind turbine','blade','building','structural','concrete','civil','offshore','marine','pressure vessel','pipeline','rail','railway','hydrogen tank','h2 storage'] },
  { sector: 'materials',    words: ['carbon fiber','carbon fibre','cfrp','prepreg','epoxy','resin','thermoplastic','autoclave','infusion','pultrusion','filament winding','precursor','tensile','modulus','composite material','fiber reinforced','fibre reinforced'] },
];
const REGION_RULES = [
  { region: 'china', words: ['china','chinese','beijing','shanghai','guangzhou','shenzhen','zhongfu','jinggong','dreame','xpeng','govy','mingyang','zhihang','cgtn','sinopec','avic'] },
  { region: 'eu',    words: ['europe','european','germany','german','france','french','italy','italian','uk','british','airbus','daher','bmw','volkswagen','audi','jec world','eucia','spain','netherlands','sweden'] },
  { region: 'usa',   words: ['usa','united states','american','boeing','joby','hexcel','cytec','nasa','lockheed','northrop','california','michigan','ohio','texas','faa'] },
];

function categSector(title, desc) {
  const t = (title + ' ' + (desc || '')).toLowerCase();
  for (const r of SECTOR_RULES) if (r.words.some(w => t.includes(w))) return r.sector;
  return 'materials';
}
function categRegion(title, desc, fallback) {
  const t = (title + ' ' + (desc || '')).toLowerCase();
  for (const r of REGION_RULES) if (r.words.some(w => t.includes(w))) return r.region;
  return fallback;
}
function stripHtml(str) {
  return (str || '').replace(/<[^>]+>/g,' ').replace(/&amp;/g,'&').replace(/&lt;/g,'<').replace(/&gt;/g,'>').replace(/&nbsp;/g,' ').replace(/&#?\w+;/g,'').replace(/\s+/g,' ').trim();
}
function cleanUrl(raw) {
  return (raw || '').replace(/[?#].*$/,'').replace(/\/?(news_type|end_use_application|tax_product|exceptionaltags)=.*$/i,'').replace(/\/+$/,'').toLowerCase().trim();
}

const COMPOSITES_KEYWORDS = [
  'composite','carbon fiber','carbon fibre','cfrp','prepreg','epoxy resin',
  'glass fiber','glass fibre','gfrp','thermoplastic composite','thermoset',
  'resin transfer','filament winding','autoclave','pultrusion','resin infusion',
  'natural fiber composite','bio-composite','aramid','kevlar','fiber reinforced',
  'fibre reinforced','sandwich panel','honeycomb core','ud tape',
  'toray','hexcel','solvay','teijin','sgl carbon','cytec','chomarat',
  'owens corning','jec world','jeccomposites','compositesworld','eucia',
  'composite fuselage','composite wing','composite blade','cfrp aircraft',
  'wind turbine blade','recyclable blade','frp rebar','composite rebar',
  'frp bridge','fiber reinforced concrete','composite pressure vessel',
  'recycled carbon fiber','carbon fiber recycl','composite recycl',
  'composites market','carbon fiber market','composite material',
  'composites industry','composite manufacturer','advanced composite',
  'structural composite','matrix resin','delamination','carbon composite',
];
function isRelevant(title, summary) {
  const t = (title + ' ' + (summary || '')).toLowerCase();
  return COMPOSITES_KEYWORDS.some(kw => t.includes(kw));
}

function parseRSS(xml, feedSource) {
  const items = [];
  const rx = /<(?:item|entry)[^>]*>([\s\S]*?)<\/(?:item|entry)>/gi;
  let m;
  while ((m = rx.exec(xml)) !== null) {
    const b = m[1];
    const get = tag => { const r = b.match(new RegExp('<'+tag+'(?:[^>]*)>(?:<!\\[CDATA\\[)?([\\s\\S]*?)(?:\\]\\]>)?</'+tag+'>','i')); return r ? r[1] : ''; };
    const title = stripHtml(get('title')).trim();
    if (!title || title.length < 8) continue;
    const rawLink = stripHtml(get('link')).trim();
    const foundLink = rawLink.startsWith('http') ? rawLink : (b.match(/href="(https?:\/\/[^"]+)"/) || [])[1] || (b.match(/<link[^>]*>(https?:\/\/[^<]+)<\/link>/) || [])[1] || '';
    if (!foundLink) continue;
    const link = foundLink.replace(/[?#].*$/,'').replace(/\/?(news_type|end_use_application|tax_product|exceptionaltags)=.*$/i,'').replace(/\/+$/,'');
    const desc = stripHtml(get('description') || get('content') || get('summary')).slice(0, 300);
    const date = get('pubDate') || get('dc:date') || get('published') || get('updated') || '';
    const source = stripHtml(get('dc:creator') || get('author') || '').trim() || feedSource;
    items.push({ title, desc, link, date, source });
  }
  return items;
}

async function fetchRSS(feed) {
  try {
    const res = await fetch(feed.url, { headers: { 'User-Agent': 'Mozilla/5.0 (compatible; HRC-Hub/1.0)' }, signal: AbortSignal.timeout(8000) });
    if (!res.ok) return [];
    const xml = await res.text();
    return parseRSS(xml, feed.source).map(item => ({
      title: item.title, summary: item.desc,
      region: categRegion(item.title, item.desc, feed.region),
      sector: categSector(item.title, item.desc) || feed.sector,
      source: item.source, url: item.link,
      date: item.date ? new Date(item.date).toISOString() : new Date().toISOString(),
      via: 'rss',
    }));
  } catch { return []; }
}

async function fetchReddit(sub) {
  try {
    const url = sub.query
      ? `https://www.reddit.com/r/${sub.subreddit}/search.json?q=${encodeURIComponent(sub.query)}&sort=new&limit=10&restrict_sr=1&t=week`
      : `https://www.reddit.com/r/${sub.subreddit}/new.json?limit=15`;
    const res = await fetch(url, { headers: { 'User-Agent': 'HRC-CompositesHub/1.0' }, signal: AbortSignal.timeout(8000) });
    if (!res.ok) return [];
    const data = await res.json();
    return (data?.data?.children || [])
      .filter(p => p?.data?.title && p?.data?.url && p.data.score > 0)
      .map(p => {
        const d = p.data;
        return {
          title:   stripHtml(d.title),
          summary: d.selftext ? stripHtml(d.selftext).slice(0, 280) : `r/${sub.subreddit} · ${d.score} upvotes · ${d.num_comments} comments`,
          region:  categRegion(d.title, d.selftext, sub.region),
          sector:  categSector(d.title, d.selftext) || sub.sector,
          source:  `Reddit · r/${sub.subreddit}`,
          url:     d.url.startsWith('http') ? d.url : `https://reddit.com${d.permalink}`,
          date:    new Date(d.created_utc * 1000).toISOString(),
          via:     'reddit',
        };
      });
  } catch { return []; }
}

async function fetchGoogle(query, apiKey, cseId) {
  try {
    const url = `https://www.googleapis.com/customsearch/v1?key=${apiKey}&cx=${cseId}&q=${encodeURIComponent(query.q)}&num=5&dateRestrict=w1&sort=date`;
    const res = await fetch(url, { signal: AbortSignal.timeout(10000) });
    if (!res.ok) return [];
    const data = await res.json();
    return (data.items || []).map(item => ({
      title:   stripHtml(item.title || ''),
      summary: stripHtml(item.snippet || '').slice(0, 280),
      region:  categRegion(item.title, item.snippet, query.region),
      sector:  categSector(item.title, item.snippet) || query.sector,
      source:  item.displayLink || 'Google Search',
      url:     item.link || '',
      date:    item.pagemap?.metatags?.[0]?.['article:published_time'] || new Date().toISOString(),
      via:     'google',
    }));
  } catch { return []; }
}

async function fetchBing(query, apiKey) {
  try {
    const url = `https://api.bing.microsoft.com/v7.0/news/search?q=${encodeURIComponent(query.q)}&freshness=Week&count=5&mkt=en-US&sortBy=Date`;
    const res = await fetch(url, { headers: { 'Ocp-Apim-Subscription-Key': apiKey }, signal: AbortSignal.timeout(10000) });
    if (!res.ok) return [];
    const data = await res.json();
    return (data.value || []).map(item => ({
      title:   stripHtml(item.name || ''),
      summary: stripHtml(item.description || '').slice(0, 280),
      region:  categRegion(item.name, item.description, query.region),
      sector:  categSector(item.name, item.description) || query.sector,
      source:  item.provider?.[0]?.name || 'Bing News',
      url:     item.url || '',
      date:    item.datePublished || new Date().toISOString(),
      via:     'bing',
    }));
  } catch { return []; }
}

async function fetchOpenAI(apiKey, regionPrompt) {
  try {
    const res = await fetch('https://api.openai.com/v1/responses', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': 'Bearer ' + apiKey },
      body: JSON.stringify({ model: 'gpt-4o-mini', tools: [{ type: 'web_search_preview' }], input: regionPrompt.prompt }),
    });
    if (!res.ok) return [];
    const data = await res.json();
    const text = (data.output || []).filter(b => b.type === 'message').flatMap(b => b.content || []).filter(c => c.type === 'output_text').map(c => c.text).join('');
    const match = text.replace(/```json|```/g,'').trim().match(/\[[\s\S]*\]/);
    if (!match) return [];
    return JSON.parse(match[0]).map(a => ({
      title:   a.title || '',
      summary: a.summary || '',
      region:  categRegion(a.title, a.summary, regionPrompt.region),
      sector:  ['motor','aerospace','recycling','materials','construction'].includes(a.sector) ? a.sector : categSector(a.title, a.summary),
      source:  a.source || 'OpenAI Search',
      url:     a.url || '',
      date:    a.date ? new Date(a.date).toISOString() : new Date().toISOString(),
      via:     'ai',
    }));
  } catch { return []; }
}

module.exports = async function handler(req, res) {
  try {
    const openaiKey = process.env.OPENAI_API_KEY;
    const googleKey = process.env.GOOGLE_API_KEY;
    const googleCse = process.env.GOOGLE_CSE_ID;
    const bingKey   = process.env.BING_API_KEY;

    const [rssR, redditR, googleR, bingR, aiR] = await Promise.all([
      Promise.all(RSS_FEEDS.map(fetchRSS)),
      Promise.all(REDDIT_SEARCHES.map(fetchReddit)),
      (googleKey && googleCse) ? Promise.all(GOOGLE_QUERIES.map(q => fetchGoogle(q, googleKey, googleCse))) : Promise.resolve([]),
      bingKey   ? Promise.all(BING_QUERIES.map(q  => fetchBing(q, bingKey))) : Promise.resolve([]),
      openaiKey ? Promise.all(AI_PROMPTS.map(p    => fetchOpenAI(openaiKey, p))) : Promise.resolve([]),
    ]);

    let articles = [...rssR.flat(), ...redditR.flat(), ...googleR.flat(), ...bingR.flat(), ...aiR.flat()];

    articles = articles.filter(a => a.url && a.title && a.title.length > 10);
    articles = articles.filter(a => isRelevant(a.title, a.summary));

    const seenUrls = new Set(), seenSlugs = new Set(), seenTitles = new Set();
    articles = articles.filter(a => {
      const cu   = cleanUrl(a.url);
      const slug = cu.split('/').filter(Boolean).pop() || cu;
      const nt   = a.title.toLowerCase().replace(/[^a-z0-9 ]/g,' ').replace(/\s+/g,' ').trim().slice(0, 60);
      if (cu && seenUrls.has(cu))                return false;
      if (slug.length > 8 && seenSlugs.has(slug)) return false;
      if (seenTitles.has(nt))                    return false;
      if (cu) seenUrls.add(cu);
      if (slug.length > 8) seenSlugs.add(slug);
      seenTitles.add(nt);
      return true;
    });

    articles.sort((a, b) => new Date(b.date) - new Date(a.date));
    articles = articles.slice(0, 150);

    const sources = { rss: rssR.flat().length, reddit: redditR.flat().length, google: googleR.flat().length, bing: bingR.flat().length, ai: aiR.flat().length };
    console.log(`[HRC] RSS=${sources.rss} Reddit=${sources.reddit} Google=${sources.google} Bing=${sources.bing} AI=${sources.ai} → final: ${articles.length}`);

    res.setHeader('Content-Type', 'application/json');
    res.setHeader('Cache-Control', 'no-store');
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.status(200).json({ articles, fetchedAt: new Date().toISOString(), count: articles.length, sources });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
