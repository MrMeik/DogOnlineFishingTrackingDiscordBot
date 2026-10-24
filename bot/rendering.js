import {
  BAIT_SETS,
  LOCATIONS,
  TIMES,
  WEATHER,
  LOCATION_OPTIONS,
  MAX_CATCH,
  MISC_ITEMS,
  ENUM_FISH,
} from "./consts.js";
import {
  ACT_LOCATION,
  ACT_BAIT,
  ACT_TIME,
  ACT_WEATHER,
  ACT_NEXT,
  ACT_BACK,
  ACT_FISH,
  ACT_MISC,
  ACT_UNDO,
  ACT_SUBMIT,
  ACT_CANCEL,
  ACT_DELETE,
} from "./actions.js";
import { MessageComponentTypes } from "discord-interactions";
import { getTotalCaught } from "./session-data.js";

const { ACTION_ROW, BUTTON, STRING_SELECT } = MessageComponentTypes;

const labelOf = (list, value) => list.find((o) => o.value === value)?.label;

function aggregateCaughtList(catches) {
  const counts = {};
  for (const c of catches) counts[c.value] = (counts[c.value] ?? 0) + 1;
  return counts;
}

function formatCaughtList(session) {
  const fishList = LOCATIONS[session.location].fish;

  // There are multiple types of things that can be caught [fish, misc]
  const aggrList = [...fishList, ...MISC_ITEMS];

  return Object.entries(aggregateCaughtList(session.catches))
    .map(([c, n]) => `• ${labelOf(aggrList, c)} ×${n}`)
    .join("\n");
}

function conditionsSummary(s) {
  const bait = s.bait ? labelOf(baitOptionsFor(s.location), s.bait) : "—";
  return [
    `**Location:** ${s.location ? LOCATIONS[s.location].label : "—"}`,
    `**Bait:** ${bait}`,
    `**Time of day:** ${s.time ? labelOf(TIMES, s.time) : "—"}`,
    `**Weather:** ${s.weather ? labelOf(WEATHER, s.weather) : "—"}`,
  ].join("\n");
}

export function formatFullSummary(session) {
  const logged = getTotalCaught(session);
  const summary = logged
    ? formatCaughtList(session)
    : "_Nothing logged yet — pick your first catch below._";

  return (
    `_ _\n${conditionsSummary(session)}\n\n` +
    `**Catches (${logged}):**\n${summary}`
  );
}

export const baitOptionsFor = (locationKey) =>
  locationKey ? BAIT_SETS[LOCATIONS[locationKey].baitSet] : BAIT_SETS.standard;

// Marks the currently selected option so the select shows it after an update
const withDefault = (options, selected) =>
  options.map((o) => ({ ...o, default: o.value === selected }));

export const conditionsComplete = (session) =>
  session.location && session.bait && session.time && session.weather;

// ==== UI rendeing ====

// Used to render the first stage of the bot's questions (to determine place, bait, time of day and weather)
export function renderConditionSelection(sid, session) {
  return {
    components: [
      {
        type: ACTION_ROW,
        components: [
          {
            type: STRING_SELECT,
            custom_id: `${ACT_LOCATION}:${sid}`,
            placeholder: "Where were you fishing?",
            options: withDefault(LOCATION_OPTIONS, session.location),
          },
        ],
      },
      {
        type: ACTION_ROW,
        components: [
          {
            type: STRING_SELECT,
            custom_id: `${ACT_BAIT}:${sid}`,
            placeholder: session.location
              ? "What bait did you use?"
              : "Pick a location first...",
            options: withDefault(
              baitOptionsFor(session.location),
              session.bait,
            ),
            disabled: !session.location,
          },
        ],
      },
      {
        type: ACTION_ROW,
        components: [
          {
            type: STRING_SELECT,
            custom_id: `${ACT_TIME}:${sid}`,
            placeholder: "Time of day?",
            options: withDefault(TIMES, session.time),
          },
        ],
      },
      {
        type: ACTION_ROW,
        components: [
          {
            type: STRING_SELECT,
            custom_id: `${ACT_WEATHER}:${sid}`,
            placeholder: "Weather?",
            options: withDefault(WEATHER, session.weather),
          },
        ],
      },
      {
        type: ACTION_ROW,
        components: [
          {
            type: BUTTON,
            custom_id: `${ACT_CANCEL}:${sid}`,
            style: 4,
            label: "Cancel",
          },
          {
            type: BUTTON,
            custom_id: `${ACT_NEXT}:${sid}`,
            style: 1,
            label: "Next: log catches",
            disabled: !conditionsComplete(session),
          },
        ],
      },
    ],
  };
}

// Used to render second stage where user inputs fish caught during process
export function renderFishLogging(sid, session) {
  const logged = getTotalCaught(session);
  const full = logged >= MAX_CATCH;

  return {
    content: formatFullSummary(session),
    components: [
      {
        // Pick a fish
        type: ACTION_ROW,
        components: [
          {
            type: STRING_SELECT,
            custom_id: `${ACT_FISH}:${sid}`,
            placeholder: full ? "Catch limit reached" : "Add a fish...",
            options: LOCATIONS[session.location].fish, // no defaults, so it resets after each pick
            disabled: full,
          },
        ],
      },
      {
        // Pick a misc. item
        type: ACTION_ROW,
        components: [
          {
            type: STRING_SELECT,
            custom_id: `${ACT_MISC}:${sid}`,
            placeholder: full ? "Catch limit reached" : "Add a non fish...",
            options: MISC_ITEMS, // no defaults, so it resets after each pick
            disabled: full,
          },
        ],
      },
      {
        type: ACTION_ROW,
        components: [
          {
            type: BUTTON,
            custom_id: `${ACT_BACK}:${sid}`,
            style: 2,
            label: "Edit details",
          },
          {
            type: BUTTON,
            custom_id: `${ACT_UNDO}:${sid}`,
            style: 2,
            label: "Undo last",
            disabled: logged === 0,
          },
          {
            type: BUTTON,
            custom_id: `${ACT_CANCEL}:${sid}`,
            style: 4,
            label: "Cancel",
          },
          {
            type: BUTTON,
            custom_id: `${ACT_SUBMIT}:${sid}`,
            style: 3,
            label: "Submit",
            disabled: logged < 1, // at least one fish required
          },
        ],
      },
    ],
  };
}

export function renderEndCard(sid, publicMessageId) {
  return {
    content: "Thanks for submitting logs!",
    components: [
      {
        type: ACTION_ROW,
        components: [
          {
            type: BUTTON,
            custom_id: `${ACT_DELETE}:${sid}:${publicMessageId}`,
            style: 4,
            label: "Remove Logs",
          },
        ],
      },
    ],
  };
}
