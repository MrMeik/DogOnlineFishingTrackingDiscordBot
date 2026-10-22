import {
  BAIT_SETS,
  LOCATIONS,
  TIMES,
  WEATHER,
  LOCATION_OPTIONS,
  MAX_CATCH,
} from "./consts.js";
import {
  ACT_LOCATION,
  ACT_BAIT,
  ACT_TIME,
  ACT_WEATHER,
  ACT_NEXT,
  ACT_BACK,
  ACT_PICK,
  ACT_UNDO,
  ACT_SUBMIT,
  ACT_CANCEL,
  ACT_DELETE,
} from "./actions.js";
import { MessageComponentTypes } from "discord-interactions";

const { ACTION_ROW, BUTTON, STRING_SELECT } = MessageComponentTypes;

const labelOf = (list, value) => list.find((o) => o.value === value)?.label;

function getTotal(catches) {
  const counts = {};
  for (const v of catches) counts[v] = (counts[v] ?? 0) + 1;
  return counts;
}

function formatTotal(session) {
  const fishList = LOCATIONS[session.location].fish;
  return Object.entries(getTotal(session.catches))
    .map(([value, n]) => `• ${labelOf(fishList, value)} ×${n}`)
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

export function formatFullSummary(s) {
  const logged = s.catches.length;
  const summary = logged
    ? formatTotal(s)
    : "_Nothing logged yet — pick your first catch below._";

  return (
    `_ _\n${conditionsSummary(s)}\n\n` + `**Catches (${logged}):**\n${summary}`
  );
}

export const baitOptionsFor = (locationKey) =>
  locationKey ? BAIT_SETS[LOCATIONS[locationKey].baitSet] : BAIT_SETS.standard;

// Marks the currently selected option so the select shows it after an update
const withDefault = (options, selected) =>
  options.map((o) => ({ ...o, default: o.value === selected }));

export const conditionsComplete = (s) =>
  s.location && s.bait && s.time && s.weather;

// ==== UI rendeing ====

// Used to render the first stage of the bot's questions (to determine place, bait, time of day and weather)
export function renderConditionSelection(sid, s) {
  return {
    components: [
      {
        type: ACTION_ROW,
        components: [
          {
            type: STRING_SELECT,
            custom_id: `${ACT_LOCATION}:${sid}`,
            placeholder: "Where were you fishing?",
            options: withDefault(LOCATION_OPTIONS, s.location),
          },
        ],
      },
      {
        type: ACTION_ROW,
        components: [
          {
            type: STRING_SELECT,
            custom_id: `${ACT_BAIT}:${sid}`,
            placeholder: s.location
              ? "What bait did you use?"
              : "Pick a location first...",
            options: withDefault(baitOptionsFor(s.location), s.bait),
            disabled: !s.location,
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
            options: withDefault(TIMES, s.time),
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
            options: withDefault(WEATHER, s.weather),
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
            disabled: !conditionsComplete(s),
          },
        ],
      },
    ],
  };
}

// Used to render second stage where user inputs fish caught during process
export function renderFishLogging(sid, s) {
  const logged = s.catches.length;
  const full = logged >= MAX_CATCH;

  return {
    content: formatFullSummary(s),
    components: [
      {
        type: ACTION_ROW,
        components: [
          {
            type: STRING_SELECT,
            custom_id: `${ACT_PICK}:${sid}`,
            placeholder: full ? "Catch limit reached" : "Add a catch...",
            options: LOCATIONS[s.location].fish, // no defaults, so it resets after each pick
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
