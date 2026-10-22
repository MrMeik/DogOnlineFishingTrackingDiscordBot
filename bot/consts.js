// String Helpers
const slug = (s) => s.toLowerCase().replace(/\W+/g, "_");
const opts = (...names) => names.map((n) => ({ label: n, value: slug(n) }));

// safety cap so the message never outgrows Discord's limits on display
export const MAX_CATCH = 100;

export const TIMES = opts("Morning", "Afternoon", "Evening", "Night");
export const WEATHER = opts("Clear Skies", "Rainy", "Stormy", "Snowy");

export const BAIT_SETS = {
  standard: opts(
    "Bucket of Worms",
    "Mound of Minnows",
    "Cup of Crickets",
    "Pouch of Prawns",
  ),
  sky: opts("Balloon Hook", "Wicked Skymetal Hook", "Sky Tackle"),
};

const OLD_TOWN_FISH = opts(
  "Minnow",
  "Guppy",
  "Barracuda",
  "Octojelly",
  "Snifflet",
  "Funny Duck",
  "Salmon",
  "Crayfish",
  "Freshwater Eel",
  "Largemouth Bass",
  "Rainbow Trout",
  "Handfish",
  "Gleepfish",
);

const DESERT_FISH = opts(
  "Cactus Pufferfish",
  "Lungfish",
  "Gothfish",
  "Camel Fish",
  "Fossil Fish",
  "Hourglass Fish",
  "Hot N Spicy Fish",
  "Craw's Dad",
  "Rattleray",
  "Sizzling Shad",
  "Batfish",
  "Scorpion Fish",
  "Eye of Horus Fish",
  "Sunfish",
  "Moonfish",
);

const ICE_FISH = opts(
  "Polar Prawn",
  "Arctic Cod",
  "Coldfish",
  "Capelin",
  "Sabretooth Tigerfish",
  "Mammothfish",
  "Ice Cream Sharkwich",
  "Strawberry Ice Cream Sharkwich",
  "Chocolate Ice Cream Sharkwich",
  "Hotdogtopus",
);

const OCEAN_FISH = opts(
  "Minnow",
  "Sea Star",
  "Mussel",
  "Deepsea Fangly Fish",
  "Gummy Shark",
  "Comb Jelly",
  "Crimson Crawler",
  "Lobster",
  "Leafy Sheepdog",
  "Blue Lobster",
  "Sea Angel",
  "Shooting Starfish",
);

const SKY_FISH = opts(
  "Flying Fish",
  "Cloudfish",
  "Thundering Cloudfish",
  "Steamfish",
  "Red Balloonfish",
  "Blue Balloonfish",
  "Plane-Mimicking Fish",
  "Rainbow Trout (sky)",
  "Very Lost Fish",
  "Starwhale",
  "Aurora Eel",
  "Skyfish",
  "Extraterrestrial Octopus",
  "Jellyfish...?",
);

export const LOCATIONS = {
  old_fishing_hole: {
    label: "Old Fishin' Hole",
    baitSet: "standard",
    fish: OLD_TOWN_FISH,
  },
  desert_oasis: {
    label: "Desert Oasis",
    baitSet: "standard",
    fish: DESERT_FISH,
  },
  ice_fishing_hole: {
    label: "Ice Fishing Hole",
    baitSet: "standard",
    fish: ICE_FISH,
  },
  ocean_fishing_cruiser: {
    label: "Ocean Fishing Cruiser",
    baitSet: "standard",
    fish: OCEAN_FISH,
  },
  fly_fishing_ship: {
    label: "Fly Fishing Ship",
    baitSet: "sky",
    fish: SKY_FISH,
  },
};

export const LOCATION_OPTIONS = Object.entries(LOCATIONS).map(([value, l]) => ({
  label: l.label,
  value,
}));
