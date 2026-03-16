const FEEDS = [
  { url: 'https://www.compositesworld.com/rss/all',            source: 'CompositesWorld',         defaultCat: 'carbon' },
  { url: 'https://www.reinforcedplastics.com/rss/',            source: 'Reinforced Plastics',     defaultCat: 'carbon' },
  { url: 'https://www.jeccomposites.com/feed/',                source: 'JEC Group',               defaultCat: 'market' },
  { url: 'https://www.azom.com/rss-feed-composites.xml',       source: 'AZO Materials',           defaultCat: 'carbon' },
  { url: 'https://aviationweek.com/rss.xml',                   source: 'Aviation Week',           defaultCat: 'aerospace' },
  { url: 'https://www.aero-mag.com/feed',                      source: 'Aerospace Manufacturing', defaultCat: 'aerospace' },
  { url: 'https://www.automotiveworld.com/feed/',              source: 'Automotive World',        defaultCat: 'automotive' },
  { url: 'https://www.constructionnews.co.uk/feed/',           source: 'Construction News',       defaultCat: 'construction' },
  { url: 'https://www.materialstoday.com/feed/',               source: 'Materials Today',         defaultCat: 'carbon' },
  { url: 'https://www.windpowermonthly.com/rss',               source: 'Windpower Monthly',       defaultCat: 'construction' },
];

const CATEGORY_RULES = [
  { cat: 'aerospace',    words: ['aerospace','aircraft','airbus','boeing','aviation','satellite','uav','drone','space','fuselage','wing','nacelle','aerostructure','helicopter','rocket'] },
  { cat: 'automotive',   words: ['automotive','vehicle','car','electric vehicle','motorsport','formula 1','f1','bmw','ferrari','lamborghini','chassis','lightweighting','oem'] },
  { cat: 'construction', words: ['construction','bridge','infrastructure','rebar','wind turbine','blade','building','structural','concrete','civil','offshore','marine','pressure vessel'] },
  { cat: 'market',       words: ['toray','hexcel','sgl','solvay','teijin','cytec','owens corning','chomarat','mitsubishi chemical','acquisition','merger','revenue','earnings','investment','appoints','ceo','capacity'] },
  { cat: 'carbon',       words: ['carbon fiber','carbon fibre','cfrp','prepreg','epoxy','resin','thermoplastic','filament winding','autoclave','infusion','rtm','pultrusion','recycl'] },
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
    const desc  = get('description').replace(/<[^>]+>/g,' ').replace(/&[a-z]+;/gi,' ').replace(/\s+/g,' ').trim().slice(0,280);
    const date  = get('pubDate') || get('dc:date') || '';
    if (title && link) items.push({ title, desc, link, date });
  }
  return items;
}

const REL_WORDS = ['composite','carbon fiber','carbon fibre','cfrp','prepreg','fiber reinforced','fibre reinforced','thermoplastic','autoclave','infusion','pultrusion','advanced material'];

async function fetchFeed(feed) {
  try {
    const res = await fetch(feed.url, { headers: { 'User-Agent': 'CompositesHub/1.0' } });
    if (!res.ok) return [];
    const xml = await res.text();
    return parseRSS(xml).map(item => ({
      title:    item.title,
      summary:  item.desc,
      category: categorise(item.title, item.desc) || feed.defaultCat,
      source:   feed.source,
      url:      item.link,
      date:     item.date ? new Date(item.date).toISOString() : new Date().toISOString(),
      relevance: REL_WORDS.some(w => (item.title + item.desc).toLowerCase().includes(w)) ? 80 : 40,
    }));
  } catch (e) {
    return [];
  }
}

module.exports = async function handler(req, res) {
  try {
    const results = await Promise.all(FEEDS.map(fetchFeed));
    let articles  = results.flat();

    const seen = new Set();
    articles = articles.filter(a => {
      const key = a.title.toLowerCase().slice(0, 60);
      if (seen.has(key)) return false;
      seen.add(key); return true;
    });

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
