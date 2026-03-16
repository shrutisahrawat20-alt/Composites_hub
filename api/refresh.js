// HRC Composites Hub — api/refresh.js
// Sources: Direct RSS feeds from industry websites + OpenAI (if key set)

const RSS_FEEDS = [
  // ── AEROSPACE ──
  { url: 'https://www.aviationweek.com/rss.xml',                       source: 'Aviation Week',              region: 'global', sector: 'aerospace' },
  { url: 'https://www.ainonline.com/rss.xml',                          source: 'AIN Online',                 region: 'global', sector: 'aerospace' },
  { url: 'https://spacenews.com/feed/',                                source: 'Space News',                 region: 'global', sector: 'aerospace' },
  { url: 'https://www.aviationbusinessnews.com/feed/',                 source: 'Aviation Business News',     region: 'global', sector: 'aerospace' },
  { url: 'https://www.aerotime.aero/feed',                             source: 'Aerotime',                   region: 'global', sector: 'aerospace' },
  { url: 'https://www.space.com/feeds/all',                            source: 'Space.com',                  region: 'global', sector: 'aerospace' },
  { url: 'https://www.aero-mag.com/category/news/feed',                source: 'Aerospace Manufacturing',    region: 'eu',     sector: 'aerospace' },

  // ── AUTOMOTIVE ──
  { url: 'https://www.autonews.com/rss/rss_latest.rss',                source: 'Automotive News',            region: 'global', sector: 'motor' },
  { url: 'https://www.motortrend.com/feeds/all/',                      source: 'MotorTrend',                 region: 'usa',    sector: 'motor' },
  { url: 'https://www.automotivedive.com/feeds/news_rss/',             source: 'Automotive Dive',            region: 'usa',    sector: 'motor' },
  { url: 'https://www.motorauthority.com/rss/all.rss',                 source: 'Motor Authority',            region: 'usa',    sector: 'motor' },
  { url: 'https://www.automoblog.com/feed/',                           source: 'Automoblog',                 region: 'usa',    sector: 'motor' },
  { url: 'https://www.auto-motor-und-sport.de/feed/',                  source: 'Auto Motor Sport',           region: 'eu',     sector: 'motor' },
  { url: 'https://www.motort16.com/feed/',                             source: 'Motort16',                   region: 'eu',     sector: 'motor' },
  { url: 'https://www.auto-revista.com/feed/',                         source: 'Auto Revista',               region: 'eu',     sector: 'motor' },
  { url: 'https://ai-online.com/feed/',                                source: 'AI Online',                  region: 'global', sector: 'motor' },
  { url: 'https://futuretransport-news.com/feed/',                     source: 'Future Transport News',      region: 'eu',     sector: 'motor' },

  // ── COMPOSITES (primary sources) ──
  { url: 'https://www.compositesworld.com/rss/all',                    source: 'CompositesWorld',            region: 'global', sector: 'materials' },
  { url: 'https://www.composites.media/feed',                          source: 'Composites Media',           region: 'eu',     sector: 'materials' },
  { url: 'https://www.jeccomposites.com/feed/',                        source: 'JEC Group',                  region: 'eu',     sector: 'materials' },
  { url: 'https://www.compositestoday.com/feed/',                      source: 'Composites Today',           region: 'global', sector: 'materials' },
  { url: 'https://www.compositesweekly.com/feed/',                     source: 'Composites Weekly',          region: 'global', sector: 'materials' },
  { url: 'https://eucia.eu/category/news/feed',                        source: 'EuCIA',                      region: 'eu',     sector: 'recycling' },

  // ── UAV / DRONE ──
  { url: 'https://dronelife.com/feed/',                                source: 'DroneLife',                  region: 'global', sector: 'aerospace' },
  { url: 'https://dronedj.com/feed/',                                  source: 'DroneDJ',                    region: 'global', sector: 'aerospace' },
  { url: 'https://www.commercialuavnews.com/feed',                     source: 'Commercial UAV News',        region: 'global', sector: 'aerospace' },
  { url: 'https://evtolinsights.com/feed/',                            source: 'eVTOL Insights',             region: 'global', sector: 'aerospace' },
  { url: 'https://www.flyingmag.com/feed/',                            source: 'Flying Magazine',            region: 'usa',    sector: 'aerospace' },
  { url: 'https://evtol.news/feed/',                                   source: 'eVTOL News',                 region: 'global', sector: 'aerospace' },

  // ── ENERGY / WIND ──
  { url: 'https://www.energybusinessreview.com/feed/',                 source: 'Energy Business Review',     region: 'global', sector: 'construction' },
  { url: 'https://www.aitenergymag.com/feed/',                         source: 'AIT Energy',                 region: 'global', sector: 'construction' },
  { url: 'https://esingenieria.net/feed/',                             source: 'ES Ingenieria',              region: 'eu',     sector: 'construction' },
  { url: 'https://www.enr.com/rss/topics/652-news',                    source: 'ENR',                        region: 'usa',    sector: 'construction' },
  { url: 'https://www.engineerlive.com/rss.xml',                       source: 'Engineer Live',              region: 'eu',     sector: 'materials' },
  { url: 'https://interestingengineering.com/feed',                    source: 'Interesting Engineering',    region: 'global', sector: 'materials' },
  { url: 'https://www.emobility-engineering.com/feed/',                source: 'eMobility Engineering',      region: 'eu',     sector: 'motor' },
  { url: 'https://www.h2-view.com/news/all-news/feed/',                source: 'H2 View',                   region: 'global', sector: 'construction' },
  { url: 'https://www.hydrogeninsight.com/feed',                       source: 'Hydrogen Insight',           region: 'global', sector: 'construction' },
  { url: 'https://hydrogen-central.com/feed/',                         source: 'Hydrogen Central',           region: 'global', sector: 'construction' },

  // ── MATERIALS ──
  { url: 'https://www.azom.com/rss-feed.xml',                         source: 'AZO Materials',              region: 'global', sector: 'materials' },

  // ── RAIL ──
  { url: 'https://www.globalrailwayreview.com/feed/',                  source: 'Global Railway Review',      region: 'global', sector: 'construction' },
  { url: 'https://www.railnews.co.uk/feed/',                           source: 'Rail News',                  region: 'eu',     sector: 'construction' },
  { url: 'https://railmarket.com/feed/',                               source: 'Rail Market',                region: 'global', sector: 'construction' },
  { url: 'https://www.railbusinessdaily.com/feed/',                    source: 'Rail Business Daily',        region: 'eu',     sector: 'construction' },

  // ── WIND / ENERGY GLOBAL ──
  { url: 'https://www.windindustry.pl/en/news/feed',                   source: 'Wind Industry PL',          region: 'eu',     sector: 'construction' },
  { url: 'https://www.energyglobal.com/news/feed/',                    source: 'Energy Global',              region: 'global', sector: 'construction' },
];

const AI_PROMPTS = [
  { region: 'eu',     prompt: 'Search for the latest composites industry news from Europe (EU, UK, Germany, France, Italy) in the last 7 days. Cover motor vehicles (CFRP cars, motorsport), aerospace (Airbus, DAHER, drones), recycling (bio-composites, end-of-life), materials (JEC awards, manufacturing). Return ONLY a JSON array, no markdown, no code fences. Format: [{"title":"...","summary":"1-2 sentence factual summary","sector":"motor|aerospace|recycling|materials","source":"publication name","url":"https://...","date":"YYYY-MM-DD"}]. Return 8 items.' },
  { region: 'china',  prompt: 'Search for the latest composites industry news from China in the last 7 days. Cover motor vehicles (EV supercars, flying cars), aerospace (eVTOL, UAV), recycling (wind turbine blades), materials (Zhongfu Shenying, Jinggong, CFRP precursor). Return ONLY a JSON array, no markdown, no code fences. Format: [{"title":"...","summary":"1-2 sentence factual summary","sector":"motor|aerospace|recycling|materials","source":"publication name","url":"https://...","date":"YYYY-MM-DD"}]. Return 8 items.' },
  { region: 'usa',    prompt: 'Search for the latest composites industry news from USA and North America in the last 7 days. Cover motor vehicles (CFRP vehicles, lightweighting), aerospace (Boeing, Joby, NASA, eVTOL), recycling (carbon fiber recycling), materials (Hexcel, Cytec, new composites). Return ONLY a JSON array, no markdown, no code fences. Format: [{"title":"...","summary":"1-2 sentence factual summary","sector":"motor|aerospace|recycling|materials","source":"publication name","url":"https://...","date":"YYYY-MM-DD"}]. Return 8 items.' },
  { region: 'global', prompt: 'Search for the latest global composites industry news in the last 7 days. Focus on key players (Toray, Hexcel, Solvay, Teijin, SGL Carbon), market trends, M&A, JEC/CompositesWorld coverage, wind energy composites, major innovation awards. Return ONLY a JSON array, no markdown, no code fences. Format: [{"title":"...","summary":"1-2 sentence factual summary","sector":"motor|aerospace|recycling|materials","source":"publication name","url":"https://...","date":"YYYY-MM-DD"}]. Return 8 items.' },
];

const SECTOR_RULES = [
  { sector: 'motor',        words: ['automotive','vehicle','car','ev','electric vehicle','motorsport','formula','bmw','ferrari','mercedes','audi','toyota','volkswagen','supercar','flying car','chassis','lightweighting','van','truck','motort'] },
  { sector: 'aerospace',    words: ['aerospace','aircraft','airbus','boeing','aviation','satellite','uav','drone','space','fuselage','wing','rocket','evtol','helicopter','propeller','nacelle','easa','faa'] },
  { sector: 'recycling',    words: ['recycl','reclaim','end-of-life','circular','bio-based','sustainable','degradation','reuse','reprocess','closed-loop','hemp','flax','natural fiber','natural fibre','wind blade'] },
  { sector: 'construction', words: ['construction','bridge','infrastructure','rebar','wind turbine','blade','building','structural','concrete','civil','offshore','marine','pressure vessel','pipeline','rail','railway','hydrogen','h2','energy'] },
  { sector: 'materials',    words: ['carbon fiber','carbon fibre','cfrp','prepreg','epoxy','resin','thermoplastic','autoclave','infusion','pultrusion','filament winding','precursor','tensile','modulus','composite material'] },
];
const REGION_RULES = [
  { region: 'china', words: ['china','chinese','beijing','shanghai','guangzhou','shenzhen','zhongfu','jinggong','dreame','xpeng','govy','mingyang','zhihang','cgtn','sinopec'] },
  { region: 'eu',    words: ['europe','european','germany','german','france','french','italy','italian','uk','british','airbus','daher','bmw','volkswagen','audi','jec world','eucia'] },
  { region: 'usa',   words: ['usa','united states','american','boeing','joby','hexcel','cytec','nasa','lockheed','northrop','california','michigan','faa'] },
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
function stripHtml(str) {
  return (str || '')
    .replace(/<[^>]+>/g, ' ')
    .replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>')
    .replace(/&nbsp;/g, ' ').replace(/&#?\w+;/g, '')
    .replace(/\s+/g, ' ').trim();
}

function parseRSS(xml, feedSource) {
  const items = [];
  const rx = /<(?:item|entry)[^>]*>([\s\S]*?)<\/(?:item|entry)>/gi;
  let m;
  while ((m = rx.exec(xml)) !== null) {
    const b = m[1];
    const get = tag => {
      const r = b.match(new RegExp('<' + tag + '(?:[^>]*)>(?:<!\\[CDATA\\[)?([\\s\\S]*?)(?:\\]\\]>)?<\\/' + tag + '>', 'i'));
      return r ? r[1] : '';
    };
    const title = stripHtml(get('title')).trim();
    if (!title || title.length < 8) continue;
    const rawLink = stripHtml(get('link')).trim();
    const foundLink = rawLink.startsWith('http')
      ? rawLink
      : (b.match(/href="(https?:\/\/[^"]+)"/) || [])[1]
      || (b.match(/<link[^>]*>(https?:\/\/[^<]+)<\/link>/) || [])[1]
      || '';
    if (!foundLink || foundLink.includes('news.google.com')) continue;
    // Strip tracking/filter params (JEC appends them directly to the URL path)
    const link = foundLink
      .replace(/[?&]news_type.*$/i, '').replace(/[?&]end_use.*$/i, '')
      .replace(/[?&]tax_product.*$/i, '').replace(/[?&]exceptional.*$/i, '')
      .replace(/news_type=.*$/i, '').replace(/end_use_application=.*$/i, '')
      .replace(/[?#].*$/, '').replace(/\/+$/, '');
    const desc   = stripHtml(get('description') || get('content') || get('summary')).slice(0, 300);
    const date   = get('pubDate') || get('dc:date') || get('published') || get('updated') || '';
    const source = stripHtml(get('dc:creator') || get('author') || '').trim() || feedSource;
    items.push({ title, desc, link, date, source });
  }
  return items;
}

async function fetchRSS(feed) {
  try {
    const res = await fetch(feed.url, {
      headers: { 'User-Agent': 'Mozilla/5.0 (compatible; HRC-Hub/1.0)' },
      signal: AbortSignal.timeout(8000),
    });
    if (!res.ok) return [];
    const xml = await res.text();
    return parseRSS(xml, feed.source).map(item => ({
      title:   item.title,
      summary: item.desc,
      region:  categRegion(item.title, item.desc, feed.region),
      sector:  categSector(item.title, item.desc) || feed.sector,
      source:  item.source,
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
      headers: { 'Content-Type': 'application/json', 'Authorization': 'Bearer ' + apiKey },
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
    const [rssResults, aiResults] = await Promise.all([
      Promise.all(RSS_FEEDS.map(fetchRSS)),
      openaiKey ? Promise.all(AI_PROMPTS.map(p => fetchOpenAI(openaiKey, p))) : Promise.resolve([]),
    ]);

    let articles = [...rssResults.flat(), ...aiResults.flat()];
    articles = articles.filter(a => a.url && a.title && a.title.length > 10);

    // ── COMPOSITES RELEVANCE FILTER ───────────────────────────────────────────
    // Only keep articles genuinely about composites, carbon fiber, or directly
    // related materials/applications. Rejects unrelated general news.
    const COMPOSITES_KEYWORDS = [
      'composite','carbon fiber','carbon fibre','cfrp','prepreg','epoxy resin',
      'glass fiber','glass fibre','gfrp','thermoplastic composite','thermoset',
      'resin transfer','filament winding','autoclave','pultrusion','infusion',
      'natural fiber composite','natural fibre composite','bio-composite',
      'hemp fiber','flax fiber','basalt fiber','aramid','kevlar',
      'carbon nanotube','nanocomposite','carbon reinforced','fiber reinforced',
      'fibre reinforced','sandwich panel','honeycomb core','woven fabric',
      'ud tape','unidirectional tape','dry fiber placement','afp ','atl ',
      'toray','hexcel','solvay','teijin','sgl carbon','cytec','chomarat',
      'owens corning','jec world','jeccomposites','compositesworld',
      'eucia','acma','sampe','iacmi','reinforced plastic',
      'composite fuselage','composite wing','composite aerostructure',
      'composite blade','composite propeller','cfrp aircraft','composite uav',
      'cfrp chassis','carbon fiber car','composite body panel','composite ev',
      'wind turbine blade','recyclable blade','wind blade',
      'composite pressure vessel','composite pipe','composite tank',
      'hydrogen tank composite','frp rebar','composite rebar','frp bridge',
      'gfrp bridge','fiber reinforced concrete','frp profile',
      'recycled carbon fiber','carbon fiber recycl','composite recycl',
      'frp recycl','end-of-life composite','pyrolysis carbon',
      'composites market','carbon fiber market','composite material',
      'composites industry','composite manufacturer','composite supplier',
      'advanced material','lightweight material','structural composite',
      'matrix resin','fiber volume','void content','delamination',
      'out-of-autoclave','oa curing','resin infusion','liquid molding',
    ];

    function isCompositeRelevant(title, summary) {
      const text = (title + ' ' + (summary || '')).toLowerCase();
      return COMPOSITES_KEYWORDS.some(kw => text.includes(kw));
    }

    articles = articles.filter(a => isCompositeRelevant(a.title, a.summary));
    // ─────────────────────────────────────────────────────────────────────────

    // Deduplicate — three independent checks, any match = duplicate
    const seenUrls   = new Set();
    const seenSlugs  = new Set();
    const seenTitles = new Set();
    articles = articles.filter(a => {
      // Full cleaned URL (most reliable — catches exact same URL from two feeds)
      const cleanUrl  = (a.url || '').replace(/[?#].*$/, '').replace(/\/+$/, '').toLowerCase();
      // Last path segment (catches same article URL from different domains republishing)
      const parts     = cleanUrl.split('/').filter(Boolean);
      const slug      = parts[parts.length - 1] || cleanUrl;
      // Normalised title (catches same story with slightly different titles)
      const normTitle = a.title.toLowerCase().replace(/[^a-z0-9 ]/g,' ').replace(/\s+/g,' ').trim().slice(0, 60);

      if (cleanUrl  && seenUrls.has(cleanUrl))         return false;
      if (slug.length > 8  && seenSlugs.has(slug))     return false;
      if (seenTitles.has(normTitle))                   return false;

      if (cleanUrl)        seenUrls.add(cleanUrl);
      if (slug.length > 8) seenSlugs.add(slug);
      seenTitles.add(normTitle);
      return true;
    });

    articles.sort((a, b) => new Date(b.date) - new Date(a.date));
    articles = articles.slice(0, 120);

    res.setHeader('Content-Type', 'application/json');
    res.setHeader('Cache-Control', 's-maxage=3600, stale-while-revalidate=86400');
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.status(200).json({
      articles,
      fetchedAt: new Date().toISOString(),
      count: articles.length,
      sources: { rss: rssResults.flat().length, ai: aiResults.flat().length },
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
