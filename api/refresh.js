// HRC Composites Hub — api/refresh.js
// Improved version:
// - broader relevance logic
// - source diversity cap
// - source priority scoring
// - wider OEM / Tier-1 / market-context handling
// - stronger company extraction
// - keeps JEC as a source, not a company

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
  { url: 'https://www.jeccomposites.com/feed/',                        source: 'JEC Group',                  region: 'eu',     sector: 'materials' },
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
  { url: 'https://www.h2-view.com/news/all-news/feed/',                source: 'H2 View',                    region: 'global', sector: 'construction' },
  { url: 'https://www.hydrogeninsight.com/feed',                       source: 'Hydrogen Insight',           region: 'global', sector: 'construction' },
  { url: 'https://hydrogen-central.com/feed/',                         source: 'Hydrogen Central',           region: 'global', sector: 'construction' },

  // ── MATERIALS ──
  { url: 'https://www.azom.com/rss-feed.xml',                          source: 'AZO Materials',              region: 'global', sector: 'materials' },

  // ── RAIL ──
  { url: 'https://www.globalrailwayreview.com/feed/',                  source: 'Global Railway Review',      region: 'global', sector: 'construction' },
  { url: 'https://www.railnews.co.uk/feed/',                           source: 'Rail News',                  region: 'eu',     sector: 'construction' },
  { url: 'https://railmarket.com/feed/',                               source: 'Rail Market',                region: 'global', sector: 'construction' },
  { url: 'https://www.railbusinessdaily.com/feed/',                    source: 'Rail Business Daily',        region: 'eu',     sector: 'construction' },

  // ── WIND / ENERGY GLOBAL ──
  { url: 'https://www.windindustry.pl/en/news/feed',                   source: 'Wind Industry PL',           region: 'eu',     sector: 'construction' },
  { url: 'https://www.energyglobal.com/news/feed/',                    source: 'Energy Global',              region: 'global', sector: 'construction' },
];

const AI_PROMPTS = [
  {
    region: 'eu',
    prompt: 'Search for the latest composites industry news from Europe (EU, UK, Germany, France, Italy) in the last 7 days. Cover motor vehicles (CFRP cars, motorsport, Forvia, Magna, European OEMs, Europe automotive market), aerospace (Airbus, DAHER, drones), recycling (bio-composites, end-of-life), materials (JEC awards, manufacturing). Return ONLY a JSON array, no markdown, no code fences. Format: [{"title":"...","summary":"1-2 sentence factual summary","sector":"motor|aerospace|recycling|materials|construction","source":"publication name","url":"https://...","date":"YYYY-MM-DD"}]. Return 8 items.'
  },
  {
    region: 'china',
    prompt: 'Search for the latest composites industry news from China in the last 7 days. Cover motor vehicles (EV supercars, flying cars, major OEMs), aerospace (eVTOL, UAV), recycling (wind turbine blades), materials (Zhongfu Shenying, Jinggong, CFRP precursor). Return ONLY a JSON array, no markdown, no code fences. Format: [{"title":"...","summary":"1-2 sentence factual summary","sector":"motor|aerospace|recycling|materials|construction","source":"publication name","url":"https://...","date":"YYYY-MM-DD"}]. Return 8 items.'
  },
  {
    region: 'usa',
    prompt: 'Search for the latest composites industry news from USA and North America in the last 7 days. Cover motor vehicles (CFRP vehicles, lightweighting, Magna, major OEMs, US automotive market), aerospace (Boeing, Joby, NASA, eVTOL), recycling (carbon fiber recycling), materials (Hexcel, Cytec, new composites). Return ONLY a JSON array, no markdown, no code fences. Format: [{"title":"...","summary":"1-2 sentence factual summary","sector":"motor|aerospace|recycling|materials|construction","source":"publication name","url":"https://...","date":"YYYY-MM-DD"}]. Return 8 items.'
  },
  {
    region: 'global',
    prompt: 'Search for the latest global composites industry news in the last 7 days. Focus on key players (Toray, Hexcel, Solvay, Teijin, SGL Carbon, Forvia, Magna), automotive OEM activity, market trends, M&A, JEC/CompositesWorld coverage, wind energy composites, major innovation awards. Return ONLY a JSON array, no markdown, no code fences. Format: [{"title":"...","summary":"1-2 sentence factual summary","sector":"motor|aerospace|recycling|materials|construction","source":"publication name","url":"https://...","date":"YYYY-MM-DD"}]. Return 8 items.'
  },
];

const SECTOR_RULES = [
  { sector: 'motor', words: [
    'automotive','vehicle','car','ev','electric vehicle','motorsport','formula',
    'bmw','ferrari','mercedes','audi','toyota','volkswagen','ford','gm','tesla',
    'stellantis','renault','porsche','mclaren','lamborghini','rivian','lucid',
    'byd','xpeng','nio','geely','forvia','magna','valeo','bosch','continental',
    'chassis','lightweighting','van','truck','body panel','battery enclosure',
    'cross-car beam','interior structure','seat structure','door module',
    'automotive market','vehicle production','oem','tier 1','tier-one supplier'
  ]},
  { sector: 'aerospace', words: [
    'aerospace','aircraft','airbus','boeing','aviation','satellite','uav','drone',
    'space','fuselage','wing','rocket','evtol','helicopter','propeller','nacelle',
    'easa','faa'
  ]},
  { sector: 'recycling', words: [
    'recycl','reclaim','end-of-life','circular','bio-based','sustainable',
    'degradation','reuse','reprocess','closed-loop','hemp','flax','natural fiber',
    'natural fibre','wind blade'
  ]},
  { sector: 'construction', words: [
    'construction','bridge','infrastructure','rebar','wind turbine','blade',
    'building','structural','concrete','civil','offshore','marine','pressure vessel',
    'pipeline','rail','railway','hydrogen','h2','energy'
  ]},
  { sector: 'materials', words: [
    'carbon fiber','carbon fibre','cfrp','prepreg','epoxy','resin','thermoplastic',
    'autoclave','infusion','pultrusion','filament winding','precursor','tensile',
    'modulus','composite material'
  ]},
];

const REGION_RULES = [
  { region: 'china', words: ['china','chinese','beijing','shanghai','guangzhou','shenzhen','zhongfu','jinggong','dreame','xpeng','govy','mingyang','zhihang','cgtn','sinopec'] },
  { region: 'eu',    words: ['europe','european','germany','german','france','french','italy','italian','uk','british','airbus','daher','bmw','volkswagen','audi','jec world','eucia'] },
  { region: 'usa',   words: ['usa','united states','american','boeing','joby','hexcel','cytec','nasa','lockheed','northrop','california','michigan','faa'] },
];

const COMPANY_RULES = [
  // Composites / materials
  'airbus', 'boeing', 'toray', 'hexcel', 'solvay', 'syensqo', 'teijin',
  'sgl carbon', 'mitsubishi chemical', 'owens corning', 'fairmat',
  'gen 2 carbon', 'carbon conversions', 'bcomp', 'safran', 'daher', 'gkn',
  'zhongfu shenying', 'jinggong', 'mingyang', 'catack-h', 'posco',

  // Tier 1 / suppliers
  'forvia', 'magna', 'plastic omnium', 'brose', 'adient', 'lear', 'aptiv',
  'valeo', 'bosch', 'continental', 'zf', 'zf friedrichshafen', 'faurecia',
  'yanfeng', 'denso', 'aisin',

  // Europe OEMs
  'bmw', 'mercedes', 'mercedes-benz', 'audi', 'volkswagen', 'vw',
  'porsche', 'lamborghini', 'ferrari', 'stellantis', 'renault',
  'peugeot', 'citroen', 'opel', 'seat', 'skoda', 'cupra',
  'jaguar land rover', 'jlr', 'aston martin', 'mclaren', 'volvo',

  // US OEMs
  'ford', 'general motors', 'gm', 'chevrolet', 'cadillac', 'gmc',
  'tesla', 'rivian', 'lucid', 'jeep', 'ram',

  // China / APAC OEMs
  'byd', 'xpeng', 'nio', 'geely', 'saic', 'chery', 'gac',
  'toyota', 'honda', 'nissan', 'mazda', 'subaru', 'hyundai', 'kia',

  // Aerospace / mobility
  'joby', 'volocopter', 'eviation', 'northrop', 'lockheed', 'nasa'
];

const SIGNAL_RULES = [
  { signal: 'capacity_expansion', words: ['new plant','capacity expansion','expands production','new facility','production line','mass production','ramp-up','manufacturing base','capacity increase'] },
  { signal: 'partnership',        words: ['partnership','collaboration','agreement','signed with','works with','joint development','alliance','cooperate','collaborate'] },
  { signal: 'new_product',        words: ['launches','introduced','introduces','unveils','new product','new material','new grade','debuts','showcases'] },
  { signal: 'recycling',          words: ['recycling','recycled carbon fiber','reclaimed','end-of-life','closed-loop','circular','recyclable','reuse','recovered carbon fiber'] },
  { signal: 'oem_adoption',       words: ['selected by','adopted by','supplies','nominated by','awarded contract','qualified by','chosen for','integrated into'] },
  { signal: 'investment',         words: ['invests','investment','funding','raises','backed by','venture','acquisition','merger','stake','capital injection'] },
  { signal: 'regulation',         words: ['certification','qualified','approved','regulation','compliance','standard','ce marking','certified','rule change'] },
  { signal: 'market_report',      words: ['market size','forecast','cagr','market report','industry report','analysis and forecast','market outlook','valued at usd'] },
  { signal: 'technology',         words: ['breakthrough','innovation','demonstrator','prototype','process development','thermoplastic composite','novel process','advanced manufacturing'] },
];

const HRC_PRIORITY_KEYWORDS = [
  'carbon fiber', 'carbon fibre', 'cfrp', 'recycled carbon fiber', 'recycled carbon fibre',
  'hydrogen tank', 'pressure vessel', 'automotive lightweighting', 'aerospace composite',
  'thermoplastic composite', 'battery enclosure', 'composite blade', 'pultrusion',
  'filament winding', 'prepreg', 'structural composite', 'rtm', 'resin transfer molding',
  'out-of-autoclave', 'autoclave', 'composite pressure vessel', 'carbon fiber recycling'
];

const MARKET_CONTEXT_KEYWORDS = [
  'europe automotive market',
  'european automotive market',
  'eu automotive market',
  'us automotive market',
  'u.s. automotive market',
  'north america automotive market',
  'auto market europe',
  'auto market us',
  'vehicle production europe',
  'vehicle production usa',
  'automotive demand europe',
  'automotive demand us',
  'lightweighting market',
  'automotive composites market',
  'composite body panels',
  'battery enclosure',
  'structural battery pack',
  'ev platform',
  'vehicle architecture'
];

const COMPOSITES_KEYWORDS = [
  'composite','carbon fiber','carbon fibre','cfrp','prepreg','epoxy resin',
  'glass fiber','glass fibre','gfrp','thermoplastic composite','thermoset',
  'resin transfer','filament winding','autoclave','pultrusion','infusion',
  'natural fiber composite','natural fibre composite','bio-composite',
  'hemp fiber','hemp fibre','flax fiber','flax fibre','basalt fiber','basalt fibre',
  'aramid','kevlar','carbon nanotube','nanocomposite','carbon reinforced',
  'fiber reinforced','fibre reinforced','sandwich panel','honeycomb core',
  'woven fabric','ud tape','unidirectional tape','dry fiber placement',
  'dry fibre placement','afp ','atl ','toray','hexcel','solvay','syensqo',
  'teijin','sgl carbon','cytec','chomarat','owens corning','jec world',
  'jeccomposites','compositesworld','eucia','acma','sampe','iacmi',
  'reinforced plastic','composite fuselage','composite wing',
  'composite aerostructure','composite blade','composite propeller',
  'cfrp aircraft','composite uav','cfrp chassis','carbon fiber car',
  'carbon fibre car','composite body panel','composite ev','wind turbine blade',
  'recyclable blade','wind blade','composite pressure vessel',
  'composite pipe','composite tank','hydrogen tank composite','frp rebar',
  'composite rebar','frp bridge','gfrp bridge','fiber reinforced concrete',
  'fibre reinforced concrete','frp profile','recycled carbon fiber',
  'recycled carbon fibre','carbon fiber recycl','carbon fibre recycl',
  'composite recycl','frp recycl','end-of-life composite','pyrolysis carbon',
  'composites market','carbon fiber market','carbon fibre market',
  'composite material','composites industry','composite manufacturer',
  'composite supplier','advanced material','lightweight material',
  'structural composite','matrix resin','fiber volume','fibre volume',
  'void content','delamination','out-of-autoclave','oa curing',
  'resin infusion','liquid molding','liquid moulding'
];

const SOURCE_PRIORITY = {
  'JEC Group': 3,
  'CompositesWorld': 3,
  'EuCIA': 3,
  'Aviation Week': 2,
  'AIN Online': 2,
  'Aerospace Manufacturing': 2,
  'Automotive News': 2,
  'Automotive Dive': 2,
  'AZO Materials': 2,
  'Aviation Business News': 2,
  'eMobility Engineering': 2,
  'Energy Global': 2,
  'H2 View': 2,
  'Hydrogen Insight': 2,
  'Interesting Engineering': 1,
  'MotorTrend': 1,
  'Motor Authority': 1,
  'Automoblog': 1,
  'Space.com': 1,
  'Flying Magazine': 1,
  'OpenAI Search': 2
};

const SOURCE_CAP = 6;
const FINAL_LIMIT = 200;

function categSector(title, desc) {
  const t = (title + ' ' + (desc || '')).toLowerCase();
  for (const r of SECTOR_RULES) {
    if (r.words.some(w => t.includes(w))) return r.sector;
  }
  return 'materials';
}

function categRegion(title, desc, fallback) {
  const t = (title + ' ' + (desc || '')).toLowerCase();
  for (const r of REGION_RULES) {
    if (r.words.some(w => t.includes(w))) return r.region;
  }
  return fallback;
}

function stripHtml(str) {
  return (str || '')
    .replace(/<[^>]+>/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&nbsp;/g, ' ')
    .replace(/&#?\w+;/g, '')
    .replace(/\s+/g, ' ')
    .trim();
}

function extractCompanies(title, summary) {
  const text = (title + ' ' + (summary || '')).toLowerCase();
  const found = COMPANY_RULES.filter(name => text.includes(name));

  const normalized = found.map(name => {
    const map = {
      'gm': 'GM',
      'vw': 'Volkswagen',
      'jlr': 'JLR',
      'zf': 'ZF',
      'syensqo': 'Syensqo',
      'sgl carbon': 'SGL Carbon',
      'owens corning': 'Owens Corning',
      'general motors': 'General Motors',
      'mercedes-benz': 'Mercedes-Benz',
      'jaguar land rover': 'JLR',
      'forvia': 'Forvia',
      'magna': 'Magna',
      'plastic omnium': 'Plastic Omnium',
      'continental': 'Continental',
      'bosch': 'Bosch',
      'valeo': 'Valeo',
      'stellantis': 'Stellantis',
      'renault': 'Renault',
      'tesla': 'Tesla',
      'ford': 'Ford',
      'bmw': 'BMW',
      'audi': 'Audi',
      'porsche': 'Porsche',
      'airbus': 'Airbus',
      'boeing': 'Boeing',
      'hexcel': 'Hexcel',
      'toray': 'Toray',
      'solvay': 'Solvay',
      'teijin': 'Teijin',
      'fairmat': 'Fairmat',
      'byd': 'BYD',
      'xpeng': 'XPeng',
      'nio': 'NIO',
      'geely': 'Geely',
      'gkn': 'GKN',
      'nasa': 'NASA'
    };
    return map[name] || name.replace(/\b\w/g, c => c.toUpperCase());
  });

  return [...new Set(normalized)];
}

function detectSignal(title, summary) {
  const text = (title + ' ' + (summary || '')).toLowerCase();
  for (const rule of SIGNAL_RULES) {
    if (rule.words.some(w => text.includes(w))) return rule.signal;
  }
  return 'general';
}

function isMarketReportSpam(title, summary) {
  const text = (title + ' ' + (summary || '')).toLowerCase();
  const rule = SIGNAL_RULES.find(r => r.signal === 'market_report');
  return !!rule && rule.words.some(w => text.includes(w));
}

function extractKeywords(title, summary) {
  const text = (title + ' ' + (summary || '')).toLowerCase();
  return [...HRC_PRIORITY_KEYWORDS, ...MARKET_CONTEXT_KEYWORDS]
    .filter(k => text.includes(k))
    .slice(0, 8);
}

function isCompositeRelevant(title, summary) {
  const text = (title + ' ' + (summary || '')).toLowerCase();

  const hasCompositeKeyword = COMPOSITES_KEYWORDS.some(kw => text.includes(kw));
  const hasPriorityKeyword = [...HRC_PRIORITY_KEYWORDS, ...MARKET_CONTEXT_KEYWORDS].some(kw => text.includes(kw));
  const hasImportantCompany = COMPANY_RULES.some(name => text.includes(name));
  const hasApplicationContext =
    text.includes('lightweight') ||
    text.includes('lightweighting') ||
    text.includes('battery enclosure') ||
    text.includes('body panel') ||
    text.includes('hydrogen tank') ||
    text.includes('pressure vessel') ||
    text.includes('structural component') ||
    text.includes('interior structure') ||
    text.includes('aerostructure') ||
    text.includes('cross-car beam') ||
    text.includes('door module') ||
    text.includes('seat structure');

  return hasCompositeKeyword || hasPriorityKeyword || (hasImportantCompany && hasApplicationContext);
}

function scoreHRCRelevance(article) {
  let score = 0;
  const text = (article.title + ' ' + (article.summary || '')).toLowerCase();
  const companiesText = (article.companies || []).join(' ').toLowerCase();

  if (article.sector === 'motor' || article.sector === 'aerospace') score += 2;
  if (article.sector === 'recycling') score += 2;
  if (article.sector === 'construction') score += 1;
  if (article.companies.length) score += 2;

  if (
    companiesText.includes('forvia') ||
    companiesText.includes('magna') ||
    companiesText.includes('bmw') ||
    companiesText.includes('mercedes') ||
    companiesText.includes('audi') ||
    companiesText.includes('volkswagen') ||
    companiesText.includes('ford') ||
    companiesText.includes('general motors') ||
    companiesText.includes('tesla') ||
    companiesText.includes('stellantis') ||
    companiesText.includes('renault') ||
    companiesText.includes('byd')
  ) score += 2;

  if (
    article.signal === 'partnership' ||
    article.signal === 'capacity_expansion' ||
    article.signal === 'oem_adoption'
  ) score += 2;

  if (
    article.signal === 'technology' ||
    article.signal === 'investment' ||
    article.signal === 'recycling'
  ) score += 1;

  if (HRC_PRIORITY_KEYWORDS.some(k => text.includes(k))) score += 2;
  if (MARKET_CONTEXT_KEYWORDS.some(k => text.includes(k))) score += 1;
  if (isMarketReportSpam(article.title, article.summary)) score -= 3;

  if (score >= 7) return 'high';
  if (score >= 4) return 'medium';
  return 'low';
}

function buildWhyItMatters(article) {
  const parts = [];
  const text = (article.title + ' ' + (article.summary || '')).toLowerCase();

  if (article.signal === 'partnership') {
    parts.push('Signals active collaboration in the composites value chain.');
  }
  if (article.signal === 'capacity_expansion') {
    parts.push('Suggests supply-side growth or stronger regional demand.');
  }
  if (article.signal === 'oem_adoption') {
    parts.push('Indicates real downstream adoption rather than only technical interest.');
  }
  if (article.signal === 'recycling') {
    parts.push('Supports the growing importance of circular composites and rCF ecosystems.');
  }
  if (article.signal === 'technology') {
    parts.push('Highlights technical progress that may affect future performance or manufacturing benchmarks.');
  }

  if (article.sector === 'motor') {
    parts.push('Relevant to lightweighting, EV platforms, and automotive composite applications.');
  }
  if (article.sector === 'aerospace') {
    parts.push('Relevant to high-performance structural composites demand.');
  }
  if (article.sector === 'construction') {
    parts.push('Relevant to infrastructure, energy, or pressure-vessel composite applications.');
  }

  if (
    text.includes('automotive market') ||
    text.includes('vehicle production') ||
    text.includes('europe automotive market') ||
    text.includes('us automotive market') ||
    text.includes('north america automotive market')
  ) {
    parts.push('Useful as a macro demand signal for future automotive composites adoption.');
  }

  if (!parts.length) {
    parts.push('Relevant as a sector activity signal within the composites market.');
  }

  return parts.join(' ');
}

function buildImplication(article) {
  if (article.hrcRelevance === 'high' && article.signal === 'partnership') {
    return 'Potential partnership or competitive positioning signal for HRC.';
  }
  if (article.hrcRelevance === 'high' && article.signal === 'capacity_expansion') {
    return 'Possible indicator of future pricing, supply, or competitive pressure.';
  }
  if (article.signal === 'recycling') {
    return 'Important for HRC sustainability and recycled carbon fiber positioning.';
  }
  if (article.sector === 'aerospace') {
    return 'Useful benchmark for aerospace composites demand and qualification direction.';
  }
  if (article.sector === 'motor') {
    return 'Useful benchmark for automotive lightweighting, Tier 1 activity, and OEM application trends.';
  }
  if (article.sector === 'construction') {
    return 'Useful for monitoring composite infrastructure, hydrogen, and energy application trends.';
  }
  return 'General market monitoring value.';
}

function enrichArticle(article) {
  const enriched = { ...article };
  enriched.companies = extractCompanies(enriched.title, enriched.summary);
  enriched.signal = detectSignal(enriched.title, enriched.summary);
  enriched.keywords = extractKeywords(enriched.title, enriched.summary);
  enriched.isMarketReportSpam = isMarketReportSpam(enriched.title, enriched.summary);
  enriched.hrcRelevance = scoreHRCRelevance(enriched);
  enriched.whyItMatters = buildWhyItMatters(enriched);
  enriched.implication = buildImplication(enriched);
  return enriched;
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

    const link = foundLink
      .replace(/[?#].*$/, '')
      .replace(/\/?(news_type|end_use_application|tax_product|exceptionaltags)=.*$/i, '')
      .replace(/\/+$/, '');

    const desc = stripHtml(get('description') || get('content') || get('summary')).slice(0, 300);
    const date = get('pubDate') || get('dc:date') || get('published') || get('updated') || '';
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

    return parseRSS(xml, feed.source).map(item => {
      const article = {
        title: item.title,
        summary: item.desc,
        region: categRegion(item.title, item.desc, feed.region),
        sector: categSector(item.title, item.desc) || feed.sector,
        source: item.source,
        url: item.link,
        date: item.date ? new Date(item.date).toISOString() : new Date().toISOString(),
        via: 'rss',
      };

      return enrichArticle(article);
    });
  } catch {
    return [];
  }
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

    return JSON.parse(match[0]).map(a => {
      const article = {
        title: a.title || '',
        summary: a.summary || '',
        region: categRegion(a.title || '', a.summary || '', regionPrompt.region),
        sector: ['motor', 'aerospace', 'recycling', 'materials', 'construction'].includes(a.sector)
          ? a.sector
          : categSector(a.title || '', a.summary || ''),
        source: a.source || 'OpenAI Search',
        url: a.url || '',
        date: a.date ? new Date(a.date).toISOString() : new Date().toISOString(),
        via: 'ai',
      };

      return enrichArticle(article);
    });
  } catch {
    return [];
  }
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

    // Keep composites-relevant content only.
    // Remove low-value market-report spam unless relevance is medium/high.
    articles = articles.filter(a =>
      isCompositeRelevant(a.title, a.summary) &&
      !(a.isMarketReportSpam && a.hrcRelevance === 'low')
    );

    const beforeDedup = articles.length;

    // Deduplicate by full URL, slug, and normalized title
    const seenUrls = new Set();
    const seenSlugs = new Set();
    const seenTitles = new Set();

    articles = articles.filter(a => {
      const cleanUrl = (a.url || '')
        .replace(/[?#].*$/, '')
        .replace(/\/?(news_type|end_use_application|tax_product|exceptionaltags)=.*$/i, '')
        .replace(/\/+$/, '')
        .toLowerCase()
        .trim();

      const parts = cleanUrl.split('/').filter(Boolean);
      const slug = parts[parts.length - 1] || cleanUrl;
      const normTitle = a.title
        .toLowerCase()
        .replace(/[^a-z0-9 ]/g, ' ')
        .replace(/\s+/g, ' ')
        .trim()
        .slice(0, 60);

      if (cleanUrl && seenUrls.has(cleanUrl)) return false;
      if (slug.length > 8 && seenSlugs.has(slug)) return false;
      if (seenTitles.has(normTitle)) return false;

      if (cleanUrl) seenUrls.add(cleanUrl);
      if (slug.length > 8) seenSlugs.add(slug);
      seenTitles.add(normTitle);

      return true;
    });

    // Sort by relevance, then source quality, then recency
    articles.sort((a, b) => {
      const rel = { high: 3, medium: 2, low: 1 };
      const sa = SOURCE_PRIORITY[a.source] || 1;
      const sb = SOURCE_PRIORITY[b.source] || 1;

      return (rel[b.hrcRelevance] || 0) - (rel[a.hrcRelevance] || 0)
        || sb - sa
        || new Date(b.date) - new Date(a.date);
    });

    // Cap per source to prevent one publisher dominating
    const perSource = {};
    articles = articles.filter(a => {
      const s = a.source || 'Unknown';
      perSource[s] = (perSource[s] || 0) + 1;
      return perSource[s] <= SOURCE_CAP;
    });

    console.log(`[HRC] Before dedup: ${beforeDedup}, after dedup/source-cap: ${articles.length}, removed: ${beforeDedup - articles.length}`);

    articles = articles.slice(0, FINAL_LIMIT);

    const highRelevanceCount = articles.filter(a => a.hrcRelevance === 'high').length;

    const signalCounts = articles.reduce((acc, a) => {
      acc[a.signal] = (acc[a.signal] || 0) + 1;
      return acc;
    }, {});

    const companyCounts = articles
      .flatMap(a => a.companies || [])
      .reduce((acc, c) => {
        acc[c] = (acc[c] || 0) + 1;
        return acc;
      }, {});

    const regionCounts = articles.reduce((acc, a) => {
      acc[a.region] = (acc[a.region] || 0) + 1;
      return acc;
    }, {});

    const sectorCounts = articles.reduce((acc, a) => {
      acc[a.sector] = (acc[a.sector] || 0) + 1;
      return acc;
    }, {});

    const sourceCounts = articles.reduce((acc, a) => {
      acc[a.source] = (acc[a.source] || 0) + 1;
      return acc;
    }, {});

    res.setHeader('Content-Type', 'application/json');
    res.setHeader('Cache-Control', 'no-store');
    res.setHeader('Access-Control-Allow-Origin', '*');

    res.status(200).json({
      articles,
      fetchedAt: new Date().toISOString(),
      count: articles.length,
      sources: {
        rss: rssResults.flat().length,
        ai: aiResults.flat().length,
      },
      insights: {
        highRelevanceCount,
        signalCounts,
        companyCounts,
        regionCounts,
        sectorCounts,
        sourceCounts,
      },
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
