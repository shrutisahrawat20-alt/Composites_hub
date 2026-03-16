// Uses Google News RSS — reliable, server-friendly, no blocking, always up-to-date

const FEEDS = [
  {
    url: 'https://news.google.com/rss/search?q=carbon+fiber+composites&hl=en-US&gl=US&ceid=US:en',
    source: 'Google News', defaultCat: 'carbon'
  },
  {
    url: 'https://news.google.com/rss/search?q=carbon+fibre+CFRP+prepreg&hl=en-US&gl=US&ceid=US:en',
    source: 'Google News', defaultCat: 'carbon'
  },
  {
    url: 'https://news.google.com/rss/search?q=aerospace+carbon+fiber+composite&hl=en-US&gl=US&ceid=US:en',
    source: 'Google News', defaultCat: 'aerospace'
  },
  {
    url: 'https://news.google.com/rss/search?q=automotive+carbon+fiber+lightweight+composite&hl=en-US&gl=US&ceid=US:en',
    source: 'Google News', defaultCat: 'automotive'
  },
  {
    url: 'https://news.google.com/rss/search?q=construction+composite+material+FRP+rebar&hl=en-US&gl=US&ceid=US:en',
    source: 'Google News', defaultCat: 'construction'
  },
  {
    url: 'https://news.google.com/rss/search?q=wind+turbine+blade+composite+material&hl=en-US&gl=US&ceid=US:en',
    source: 'Google News', defaultCat: 'construction'
  },
  {
    url: 'https://news.google.com/rss/search?q=Toray+Hexcel+Solvay+Teijin+composites&hl=en-US&gl=US&ceid=US:en',
    source: 'Google News', defaultCat: 'market'
  },
  {
    url: 'https://news.google.com/rss/search?q=SGL+carbon+Owens+Corning+composites+market&hl=en-US&gl=US&ceid=US:en',
    source: 'Google News', defaultCat: 'market'
  },
  {
    url: 'https://news.google.com/rss/search?q=CompositesWorld+JEC+composites+industry&hl=en-US&gl=US&ceid=US:en',
    source: 'Google News', defaultCat: 'carbon'
  },
  {
    url: 'https://news.google.com/rss/search?q=thermoplastic+composite+manufacturing+aerospace&hl=en-US&gl=US&ceid=US:en',
    source: 'Google News', defaultCat: 'aerospace'
  },
];

const CATEGORY_RULES = [
  { cat: 'aerospace',    words: ['aerospace','aircraft','airbus','boeing','aviation','satellite','uav','drone','space','fuselage','wing','nacelle','aerostructure','helicopter','rocket','evtol'] },
  { cat: 'automotive',   words: ['automotive','vehicle','car','electric vehicle','motorsport','formula 1','f1','bmw','ferrari','lamborghini','chassis','lightweighting','oem','sedan','suv','truck'] },
  { cat: 'construction', words: ['construction','bridge','infrastructure','rebar','wind turbine','blade','building','structural','concrete','civil','offshore','marine','pressure vessel','pipeline'] },
  { cat: 'market',       words: ['toray','hexcel','sgl','solvay','teijin','cytec','owens corning','chomarat','mitsubishi chemical','acquisition','merger','revenue','earnings','investment','appoints','ceo','capacity','plant','facility'] },
  { cat: 'carbon',       words: ['carbon fiber','carbon fibre','cfrp','prepreg','epoxy','resin','thermoplastic','filament winding','autoclave','infusion','rtm','pultrusion','recycl','carbon composite'] },
];

function categorise(title, desc) {
  const text = (title + ' ' + (desc || '')).toLowerCase();
  for (const rule of CATEGORY_RULES) {
    if (rule.words.some(w => text.includes(w))) return rule.cat;
  }
  return null;
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
    const title = get('title').replace(/&amp;/g,'&').replace(/&lt;/g,'<').replace(/&gt;/g,'>').replace(/&#?\w+;/g,'').trim();
    const link  = get('link') || (b.match(/<link>([^<]+)/) || [])[1] || '';
    const desc  = get('description').replace(/<[^>]+>/g,' ').replace(/&[a-z]+;/gi,' ').replace(/\s+/g,' ').trim().slice(0, 280);
    const date  = get('pubDate') || get('dc:date') || '';
    // Google News wraps the real URL — extract source name from title if present
    const srcMatch = title.match(/ - ([^-]+)$/);
    const cleanTitle = srcMatch ? title.replace(/ - [^-]+$/, '').trim() : title;
    const source = srcMatch ? srcMatch[1].trim() : '';
    if (cleanTitle && link) items.push({ title: cleanTitle, desc, link, date, source });
  }
  return items;
}

async function fetchFeed(feed) {
  try {
    const res = await fetch(feed.url, {
      headers: { 'User-Agent': 'Mozilla/5.0 (compatible; CompositesHub/1.0)' }
    });
    if (!res.ok) return [];
    const xml = await res.text();
    return parseRSS(xml).map(item => ({
      title:    item.title,
      summary:  item.desc,
      category: categorise(item.title, item.desc) || feed.defaultCat,
      source:   item.source || feed.source,
      url:      item.link,
      date:     item.date ? new Date(item.date).toISOString() : new Date().toISOString(),
      relevance: 70,
    }));
  } catch (e) {
    return [];
  }
}

module.exports = async function handler(req, res) {
  try {
    const results = await Promise.all(FEEDS.map(fetchFeed));
    let articles  = results.flat();

    // Deduplicate by title
    const seen = new Set();
    articles = articles.filter(a => {
      const key = a.title.toLowerCase().slice(0, 60);
      if (seen.has(key)) return false;
      seen.add(key); return true;
    });

    // Sort newest first, cap at 60
    articles.sort((a, b) => new Date(b.date) - new Date(a.date));
    articles = articles.slice(0, 60);

    res.setHeader('Content-Type', 'application/json');
    res.setHeader('Cache-Control', 's-maxage=3600, stale-while-revalidate=86400');
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.status(200).json({ articles, fetchedAt: new Date().toISOString(), count: articles.length });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
