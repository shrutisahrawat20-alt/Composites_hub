// HRC Composites Hub — api/refresh.js
// Dual source: Google News RSS (always runs) + OpenAI web search (if OPENAI_API_KEY is set)
// Results are merged, deduplicated and returned as one unified feed.

const RSS_FEEDS = [
  // EU
  { url: 'https://news.google.com/rss/search?q=Europe+carbon+fiber+composite+automotive&hl=en-US&gl=US&ceid=US:en', region: 'eu', sector: 'motor' },
  { url: 'https://news.google.com/rss/search?q=Europe+aerospace+carbon+fiber+composite+Airbus&hl=en-US&gl=US&ceid=US:en', region: 'eu', sector: 'aerospace' },
  { url: 'https://news.google.com/rss/search?q=Europe+carbon+fiber+recycling+composite+sustainability&hl=en-US&gl=US&ceid=US:en', region: 'eu', sector: 'recycling' },
  { url: 'https://news.google.com/rss/search?q=JEC+composites+Europe+materials+innovation&hl=en-US&gl=US&ceid=US:en', region: 'eu', sector: 'materials' },
  // China
  { url: 'https://news.google.com/rss/search?q=China+carbon+fiber+composite+automotive+EV&hl=en-US&gl=US&ceid=US:en', region: 'china', sector: 'motor' },
  { url: 'https://news.google.com/rss/search?q=China+eVTOL+flying+car+carbon+fiber+aerospace&hl=en-US&gl=US&ceid=US:en', region: 'china', sector: 'aerospace' },
  { url: 'https://news.google.com/rss/search?q=China+carbon+fiber+wind+turbine+blade+recycling&hl=en-US&gl=US&ceid=US:en', region: 'china', sector: 'recycling' },
  { url: 'https://news.google.com/rss/search?q=China+CFRP+carbon+fiber+precursor+manufacturing&hl=en-US&gl=US&ceid=US:en', region: 'china', sector: 'materials' },
  // USA
  { url: 'https://news.google.com/rss/search?q=USA+carbon+fiber+composite+automotive+lightweight&hl=en-US&gl=US&ceid=US:en', region: 'usa', sector: 'motor' },
  { url: 'https://news.google.com/rss/search?q=USA+aerospace+carbon+fiber+Boeing+composite&hl=en-US&gl=US&ceid=US:en', region: 'usa', sector: 'aerospace' },
  { url: 'https://news.google.com/rss/search?q=USA+carbon+fiber+recycling+composite+sustainability&hl=en-US&gl=US&ceid=US:en', region: 'usa', sector: 'recycling' },
  { url: 'https://news.google.com/rss/search?q=North+America+composites+Hexcel+Cytec+materials&hl=en-US&gl=US&ceid=US:en', region: 'usa', sector: 'materials' },
  // Global
  { url: 'https://news.google.com/rss/search?q=Toray+Hexcel+Solvay+Teijin+SGL+composites&hl=en-US&gl=US&ceid=US:en', region: 'global', sector: 'materials' },
  { url: 'https://news.google.com/rss/search?q=global+carbon+fiber+composite+market+2026&hl=en-US&gl=US&ceid=US:en', region: 'global', sector: 'materials' },
  { url: 'https://news.google.com/rss/search?q=carbon+fiber+recycling+circular+economy+global&hl=en-US&gl=US&ceid=US:en', region: 'global', sector: 'recycling' },
  { url: 'https://news.google.com/rss/search?q=global+aerospace+composite+carbon+fiber+aircraft&hl=en-US&gl=US&ceid=US:en', region: 'global', sector: 'aerospace' },
];

const AI_PROMPTS = [
  {
    region: 'eu',
    prompt: 'Search for the latest composites industry news from Europe (EU, UK, Germany, France, Italy) published in the last 7 days. Cover: motor vehicles (CFRP cars, motorsport), aerospace (Airbus, DAHER, drones), recycling (bio-composites, end-of-life), materials (JEC awards, manufacturing). Return ONLY a JSON array, no markdown, no code fences. Format: [{"title":"...","summary":"1-2 sentence factual summary","sector":"motor|aerospace|recycling|materials","source":"publication name","url":"https://...","date":"YYYY-MM-DD"}]. Return 8 items.'
  },
  {
    region: 'china',
    prompt: 'Search for the latest composites industry news from China published in the last 7 days. Cover: motor vehicles (EV supercars, flying cars), aerospace (eVTOL, UAV), recycling (wind turbine blades), materials (Zhongfu Shenying, Jinggong, CFRP precursor). Return ONLY a JSON array, no markdown, no code fences. Format: [{"title":"...","summary":"1-2 sentence factual summary","sector":"motor|aerospace|recycling|materials","source":"publication name","url":"https://...","date":"YYYY-MM-DD"}]. Return 8 items.'
  },
  {
    region: 'usa',
    prompt: 'Search for the latest composites industry news from USA and North America published in the last 7 days. Cover: motor vehicles (CFRP vehicles, lightweighting), aerospace (Boeing, Joby, NASA, eVTOL), recycling (carbon fiber recycling), materials (Hexcel, Cytec, new composites). Return ONLY a JSON array, no markdown, no code fences. Format: [{"title":"...","summary":"1-2 sentence factual summary","sector":"motor|aerospace|recycling|materials","source":"publication name","url":"https://...","date":"YYYY-MM-DD"}]. Return 8 items.'
  },
  {
    region: 'global',
    prompt: 'Search for the latest global composites industry news published in the last 7 days. Focus on key players (Toray, Hexcel, Solvay, Teijin, SGL Carbon), market trends, M&A activity, JEC/CompositesWorld coverage, wind energy composites, major innovation awards. Return ONLY a JSON array, no markdown, no code fences. Format: [{"title":"...","summary":"1-2 sentence factual summary","sector":"motor|aerospace|recycling|materials","source":"publication name","url":"https://...","date":"YYYY-MM-DD"}]. Return 8 items.'
  },
];

const SECTOR_RULES = [
  { sector: 'motor',     words: ['automotive','vehicle','car','ev','electric vehicle','motorsport','formula','bmw','ferrari','mercedes','audi','toyota','volkswagen','supercar','flying car','chassis','lightweighting','van','truck'] },
  { sector: 'aerospace', words: ['aerospace','aircraft','airbus','boeing','aviation','satellite','uav','drone','space','fuselage','wing','rocket','evtol','helicopter','propeller','nacelle'] },
  { sector: 'recycling', words: ['recycl','reclaim','end-of-life','circular','bio-based','sustainable','degradation','reuse','reprocess','closed-loop','hemp','flax','natural fiber','natural fibre'] },
  { sector: 'materials', words: ['carbon fiber','carbon fibre','cfrp','prepreg','epoxy','resin','thermoplastic','autoclave','infusion','pultrusion','filament winding','precursor','tensile strength','modulus'] },
];
const REGION_RULES = [
  { region: 'china', words: ['china','chinese','beijing','shanghai','guangzhou','shenzhen','zhongfu','jinggong','dreame','xpeng','govy','mingyang','zhihang'] },
  { region: 'eu',    words: ['europe','european','germany','german','france','french','italy','italian','uk','british','airbus','daher','bmw','volkswagen','audi','jec world'] },
  { region: 'usa',   words: ['usa','united states','american','boeing','joby','hexcel','cytec','nasa','lockheed','northrop','california','michigan'] },
];

function categSector(title, desc) {
  const t = (title + ' ' + (desc || '')).toLowerCase();
  for (const r of SECTOR_RULES) { if (r.words.some(w => t.includes(w))) return r.sector; }
  return 'materials';
}
function categRegion(title, desc, fallback) {
  const t = (title + ' ' + (desc || '')).toLowerCase();
  for (const r of REGION_RULES) { if (r.words.some(w => t.includes(w))) return r.region; }
  return fallback;
}

function parseRSS(xml) {
  const items = [];
  const rx = /<item[^>]*>([\s\S]*?)<\/item>/gi;
  let m;
  while ((m = rx.exec(xml)) !== null) {
    const b = m[1];
    const get = tag => {
      const r = b.match(new RegExp('<' + tag + '(?:[^>]*)>(?:<!\\[CDATA\\[)?([\\s\\S]*?)(?:\\]\\]>)?<\\/' + tag + '>', 'i'));
      return r ? r[1].trim() : '';
    };
    const raw  = get('title').replace(/&amp;/g,'&').replace(/&lt;/g,'<').replace(/&gt;/g,'>').replace(/&#?\w+;/g,'').trim();
    const link = get('link') || (b.match(/<link>([^<]+)/) || [])[1] || '';
    const desc = get('description').replace(/<[^>]+>/g,' ').replace(/&[a-z]+;/gi,' ').replace(/\s+/g,' ').trim().slice(0,300);
    const date = get('pubDate') || get('dc:date') || '';
    const sm   = raw.match(/ - ([^-]{3,50})$/);
    const title = sm ? raw.replace(/ - [^-]+$/, '').trim() : raw;
    const src   = sm ? sm[1].trim() : 'Google News';
    if (title && link) items.push({ title, desc, link, date, src });
  }
  return items;
}

async function fetchRSS(feed) {
  try {
    const res = await fetch(feed.url, { headers: { 'User-Agent': 'Mozilla/5.0 (compatible; HRC-Hub/1.0)' } });
    if (!res.ok) return [];
    const xml = await res.text();
    return parseRSS(xml).map(item => ({
      title:   item.title,
      summary: item.desc,
      region:  categRegion(item.title, item.desc, feed.region),
      sector:  categSector(item.title, item.desc) || feed.sector,
      source:  item.src,
      url:     item.link,
      date:    item.date ? new Date(item.date).toISOString() : new Date().toISOString(),
      via:     'rss',
    }));
  } catch { return []; }
}

async function fetchOpenAI(apiKey, regionPrompt) {
  try {
    const res = await fetch('https://api.openai.com/v1/responses', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer ' + apiKey,
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        tools: [{ type: 'web_search_preview' }],
        input: regionPrompt.prompt,
      }),
    });
    if (!res.ok) return [];
    const data = await res.json();
    const text = (data.output || [])
      .filter(b => b.type === 'message')
      .flatMap(b => b.content || [])
      .filter(c => c.type === 'output_text')
      .map(c => c.text)
      .join('');
    const clean = text.replace(/```json|```/g, '').trim();
    const match = clean.match(/\[[\s\S]*\]/);
    if (!match) return [];
    const articles = JSON.parse(match[0]);
    return articles.map(a => ({
      title:   a.title || '',
      summary: a.summary || '',
      region:  categRegion(a.title, a.summary, regionPrompt.region),
      sector:  ['motor','aerospace','recycling','materials'].includes(a.sector) ? a.sector : categSector(a.title, a.summary),
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

    const [rssResults, aiResults] = await Promise.all([
      Promise.all(RSS_FEEDS.map(fetchRSS)),
      openaiKey ? Promise.all(AI_PROMPTS.map(p => fetchOpenAI(openaiKey, p))) : Promise.resolve([]),
    ]);

    let articles = [...rssResults.flat(), ...aiResults.flat()];

    // Deduplicate by normalised title
    const seen = new Set();
    articles = articles.filter(a => {
      const key = a.title.toLowerCase().replace(/[^a-z0-9]/g, '').slice(0, 55);
      if (seen.has(key)) return false;
      seen.add(key); return true;
    });

    articles.sort((a, b) => new Date(b.date) - new Date(a.date));
    articles = articles.slice(0, 100);

    res.setHeader('Content-Type', 'application/json');
    res.setHeader('Cache-Control', 's-maxage=3600, stale-while-revalidate=86400');
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.status(200).json({
      articles,
      fetchedAt: new Date().toISOString(),
      count: articles.length,
      sources: {
        rss: rssResults.flat().length,
        ai:  aiResults.flat().length,
      },
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
