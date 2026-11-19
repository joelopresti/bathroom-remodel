// Itemized remodel cost estimate for the currently selected options.
// Ranges are installed costs in USD, 2026 US national averages, compiled Nov 2026 from
// This Old House, Angi, Homewyse, Inch Calculator, Block Renovation and similar guides.
// They are planning numbers, not quotes: labor varies a lot by region and contractor.
import { DIM } from './helpers.js';
import { roomPoly, SHOWER } from './shell.js';
import { TILES, FLOORS, TUBS, SHOWERS, TOILETS, VANITIES, VANITY_STYLES, ALCOVE } from './remodel.js';

export const REGIONS = {
  'US national average': 1.0,
  'Lower-cost area': 0.85,
  'Higher-cost metro': 1.25,
  'Very high-cost (SF, NYC)': 1.45,
};

// Tile material $/sq ft (low, high) and a labor premium for patterns/handmade tile.
const TILE_COST = {
  'White subway': [3, 8, 0],
  'White vertical stack': [3, 8, 1],
  'Navy subway': [4, 10, 0],
  'Black subway, white grout': [4, 10, 0],
  'Greige stacked': [4, 10, 1],
  'White herringbone': [5, 12, 5],
  'Sage herringbone': [6, 14, 5],
  'Sage zellige': [15, 30, 4],
  'White zellige': [15, 30, 4],
  'Blush zellige': [15, 30, 4],
  'Ocean blue zellige': [15, 30, 4],
  'Marble hex mosaic': [12, 25, 4],
  'Carrara marble slab': [25, 60, 8],
  'Terrazzo': [15, 35, 3],
};
const FLOOR_COST = {
  'Warm gray porcelain': [4, 10],
  'Light concrete porcelain': [4, 10],
  'Natural oak plank': [6, 12],      // engineered or wood-look, rated for baths
  'Walnut plank': [7, 14],
  'Marble hex': [12, 28],
  'Black & white hex': [8, 20],
  'Light terrazzo': [15, 35],
  'Charcoal slate': [6, 15],
};
const TILE_LABOR = [10, 20];   // $/sq ft, standard wall tile set
const FLOOR_LABOR = [8, 15];   // $/sq ft incl. underlayment

const area = (pts) => Math.abs(pts.reduce((s, [x, z], i) => { const [x2, z2] = pts[(i + 1) % pts.length]; return s + x * z2 - x2 * z; }, 0) / 2);
const r = (a, b) => [a, b];

/** Returns { items: [{ group, item, low, high, note }], low, high } for the remodel options. */
export function estimate(o, region = 'US national average') {
  const k = REGIONS[region] ?? 1;
  const items = [];
  const add = (group, item, [low, high], note = '') => items.push({ group, item, low: low * k, high: high * k, note });
  const tile = TILE_COST[o.tile] || [4, 10, 0];
  const tileSqft = ([lo, hi]) => r((lo + tile[0] + tile[2]), (hi + tile[1] + tile[2]));
  const H = DIM.H;

  // ---- Demolition & prep
  add('Demolition & prep', 'Demo: tub, shower stall, vanity, floor, haul-away', r(1200, 2800));
  add('Demolition & prep', 'Permits & inspections', r(300, 1500));

  // ---- Shower
  const shower = SHOWERS[o.shower];
  const sw = shower === 'walkin' ? D_minus(ALCOVE.z0) : SHOWER.front, sd = shower === 'walkin' ? ALCOVE.depth : SHOWER.depth;
  const wallSqft = Math.round((sw + 2 * sd) * H), panSqft = Math.round(sw * sd);
  if (shower === 'walkin') add('Shower', 'Reframe corner into bigger walk-in (moves walls), drywall patch', r(2500, 6000));
  add('Shower', `Waterproofing + backer board (${wallSqft} sq ft)`, r(wallSqft * 3, wallSqft * 6));
  const [tlo, thi] = tileSqft(TILE_LABOR);
  add('Shower', `Wall tile: ${o.tile} (${wallSqft} sq ft installed)`, r(wallSqft * tlo, wallSqft * thi), tile[2] ? 'includes pattern/handmade labor premium' : '');
  add('Shower', `Mortar-bed pan + mosaic floor (${panSqft} sq ft), low curb`, r(1500, 3000));
  add('Shower', 'Tiled bench + niche', r(500, 1400));
  add('Shower', 'Frameless glass: fixed panel + 24" door', shower === 'walkin' ? r(1800, 4000) : r(1500, 3500));
  add('Shower', 'Valve, rain head, slide-bar handheld (fixtures + plumbing)', r(1100, 3000));

  // ---- Tub area
  const tub = TUBS[o.tub];
  const splash = (sq) => r(sq * tlo, sq * thi);
  if (tub === 'oval') {
    add('Tub area', 'Freestanding oval tub (acrylic)', r(1200, 3500));
    add('Tub area', 'Floor-mount tub filler', r(400, 1200));
    add('Tub area', 'Install, new supply + drain through floor', r(1500, 4000));
  } else if (tub === 'clawfoot') {
    add('Tub area', 'Clawfoot roll-top tub (acrylic or cast iron)', r(1800, 5000));
    add('Tub area', 'Floor-mount tub filler', r(400, 1200));
    add('Tub area', 'Install, new supply + drain through floor, floor reinforcement check', r(1800, 4500));
  } else if (tub === 'builtin') {
    add('Tub area', 'Drop-in soaker tub', r(600, 1800));
    add('Tub area', 'Platform framing + quartz deck', r(1300, 3000));
    add('Tub area', `Tile: apron + backsplash (~30 sq ft, ${o.tile})`, splash(30));
    add('Tub area', 'Deck-mount faucet + install/plumbing', r(1100, 3000));
  } else if (tub === 'corner') {
    add('Tub area', 'New corner soaker tub (non-jetted)', r(900, 2500));
    add('Tub area', 'Quartz deck', r(800, 1800));
    add('Tub area', `Tile: apron + backsplash (~38 sq ft, ${o.tile})`, splash(38));
    add('Tub area', 'Deck-mount faucet + install/plumbing', r(1100, 3000));
  } else {
    add('Tub area', 'Built-in window seat with drawers + cushion', r(1500, 4000));
    add('Tub area', 'Floor-to-ceiling linen cabinet', r(1200, 3500));
    add('Tub area', 'Cap tub supply + drain', r(300, 800));
  }

  // ---- Toilet
  const toilet = TOILETS[o.toilet];
  add('Toilet', 'New toilet + install', r(500, 1300));
  if (toilet === 'towelwall') {
    add('Toilet', 'Move drain + vent ~4-5 ft (joist direction matters; slab costs more)', r(1500, 4500));
    add('Toilet', 'New supply line + relocate floor register', r(400, 1000));
    add('Toilet', 'Shelf above toilet', r(100, 300));
    add('Toilet', 'Linen chest in the nook', r(300, 1200));
  } else if (toilet === 'shelves') {
    add('Toilet', 'Open shelves above toilet', r(150, 500));
  } else {
    add('Toilet', 'Storage cabinet above toilet', r(300, 900));
  }
  add('Toilet', 'Half wall: oak cap refresh', r(250, 600));

  // ---- Vanity
  const vdef = VANITIES[o.vanity];
  const tower = VANITY_STYLES[o.vstyle]?.tower;
  add('Vanity', `62" floor-standing double vanity (${o.vanity}${vdef?.kind === 'wood' ? ', wood' : ', painted'})`, vdef?.kind === 'wood' ? r(2200, 5500) : r(1500, 4500));
  if (tower) add('Vanity', 'Center linen tower on counter', r(800, 2000));
  add('Vanity', 'Quartz/marble top with two undermount sinks', r(1200, 3000));
  add('Vanity', 'Two wall-mount faucets + in-wall rough-in', r(1000, 2600));
  add('Vanity', 'Install + plumbing hookup', r(400, 900));
  add('Vanity', 'Two round mirrors' + (tower ? '' : ' + slim sconce'), tower ? r(300, 900) : r(500, 1500));

  // ---- Floor, walls, electrical, accessories
  const floorSqft = Math.round(area(roomPoly()));
  const fc = FLOOR_COST[o.floor] || [5, 12];
  add('Floor & walls', `Floor: ${o.floor} (${floorSqft} sq ft installed)`, r(floorSqft * (fc[0] + FLOOR_LABOR[0]), floorSqft * (fc[1] + FLOOR_LABOR[1])));
  add('Floor & walls', `Paint walls + ceiling (${o.wall})`, r(500, 1200));
  add('Floor & walls', 'Trim + baseboard', r(300, 800));
  add('Electrical & lighting', 'Recessed lights (5) + dimmer', r(900, 2000));
  add('Electrical & lighting', 'Exhaust fan replacement', r(300, 700));
  add('Electrical & lighting', 'GFCI outlets + wiring updates', r(300, 900));
  if (toilet !== 'towelwall') add('Accessories', 'Heated towel ladder (hardwired)', r(500, 1400));
  add('Accessories', `Towel hooks, paper holder, misc hardware (${o.hardware})`, r(150, 500));

  // ---- Contingency
  const sub = items.reduce((s, i) => [s[0] + i.low, s[1] + i.high], [0, 0]);
  add('Contingency', 'Contingency (10-15%) for surprises behind walls/floors', [sub[0] * 0.10 / k, sub[1] * 0.15 / k]);
  const total = items.reduce((s, i) => [s[0] + i.low, s[1] + i.high], [0, 0]);
  return { items, low: total[0], high: total[1] };
}

function D_minus(z0) { return DIM.D - z0; }
