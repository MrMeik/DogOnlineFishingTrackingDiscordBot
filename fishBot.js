import "dotenv/config";
import express from "express";
import {
  InteractionType,
  InteractionResponseType,
  verifyKeyMiddleware,
  InteractionResponseFlags,
} from "discord-interactions";
import {
  LOCATIONS,
  TIMES,
  WEATHER,
  MAX_CATCH,
  ENUM_FISH,
  ENUM_MISC,
} from "./bot/consts.js";
import { appendFishingLogs, revokeFishingLogs } from "./bot/google-calls.js";
import {
  createCommand,
  COMMAND_NAME,
  postLogToChannel,
  deleteLogFromChannel,
} from "./bot/discord-calls.js";
import {
  baitOptionsFor,
  renderConditionSelection,
  renderEndCard,
  renderFishLogging,
  conditionsComplete,
} from "./bot/rendering.js";

import {
  ACT_LOCATION,
  ACT_BAIT,
  ACT_TIME,
  ACT_WEATHER,
  ACT_NEXT,
  ACT_BACK,
  ACT_FISH,
  ACT_UNDO,
  ACT_SUBMIT,
  ACT_CANCEL,
  ACT_DELETE,
  ACT_MISC,
} from "./bot/actions.js";

import {
  createNewSession,
  getSession,
  getTotalCaught,
  deleteSession,
} from "./bot/session-data.js";

const app = express();
const PORT = process.env.PORT || 3000;

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------
const getUserId = (i) => i.member?.user?.id ?? i.user?.id;
const getUserName = (i) => i.member?.user?.username ?? i.user?.username;

const ephemeralMessage = (content) => ({
  type: InteractionResponseType.CHANNEL_MESSAGE_WITH_SOURCE,
  data: { content, flags: InteractionResponseFlags.EPHEMERAL },
});

const updateMessage = (data) => ({
  type: InteractionResponseType.UPDATE_MESSAGE,
  data,
});

async function saveCatch(sid, session) {
  console.log("Saving catch...", {
    userId: session.userId,
    userName: session.userName,
    location: session.location,
    bait: session.bait,
    time: session.time,
    weather: session.weather,
  });

  await appendFishingLogs(sid, session);
}

async function deleteCatch(sessionId) {
  console.log("Delete Catch", {
    sessionId,
  });

  return await revokeFishingLogs(sessionId);
}

// ---------------------------------------------------------------------------
// Interaction endpoint
// ---------------------------------------------------------------------------
app.post(
  "/interactions",
  verifyKeyMiddleware(process.env.PUBLIC_KEY),
  async (req, res) => {
    const interaction = req.body;

    try {
      // Used to tell discord client app is listening
      if (interaction.type === InteractionType.PING) {
        return res.send({ type: InteractionResponseType.PONG });
      }

      // Start of application command
      if (interaction.type === InteractionType.APPLICATION_COMMAND) {
        if (interaction.data.name === COMMAND_NAME) {
          const sid = interaction.id;
          const session = createNewSession(
            sid,
            getUserId(interaction),
            getUserName(interaction),
          );
          return res.send({
            type: InteractionResponseType.CHANNEL_MESSAGE_WITH_SOURCE,
            data: {
              ...renderConditionSelection(sid, session),
              flags: InteractionResponseFlags.EPHEMERAL,
            },
          });
        }
      }

      // Once user starts interacting will come in as this interaction type
      if (interaction.type === InteractionType.MESSAGE_COMPONENT) {
        const [action, sid, publicMessageId = null] =
          interaction.data.custom_id.split(":");

        if (action == ACT_DELETE) {
          // Remove logs associated with the catch
          const count = await deleteCatch(sid);

          const channelId = interaction.channel_id ?? interaction.channel?.id;
          if (publicMessageId !== null) {
            await deleteLogFromChannel(channelId, publicMessageId);
          }

          return res.send(
            updateMessage({
              content: `Removed logs: [Count: ${count}]`,
              components: [],
            }),
          );
        }

        const session = getSession(sid);

        if (!session) {
          return res.send(
            updateMessage({
              content: `That session expired. Run \`/${COMMAND_NAME}\` again.`,
              components: [],
            }),
          );
        }

        if (session.userId !== getUserId(interaction)) {
          return res.send(ephemeralMessage("This isn't your fishing log."));
        }

        // Whatever the selection value was (it depends on the action)
        const value = interaction.data.values?.[0];

        switch (action) {
          case ACT_LOCATION: {
            if (!LOCATIONS[value]) break;
            session.location = value;
            // Bait depends on location; drop it if it isn't valid for the new one
            if (!baitOptionsFor(value).some((b) => b.value === session.bait)) {
              session.bait = null;
            }
            // Fish are per-location, so any logged catches no longer apply
            session.catches = [];
            return res.send(
              updateMessage(renderConditionSelection(sid, session)),
            );
          }
          case ACT_BAIT: {
            if (
              baitOptionsFor(session.location).some((b) => b.value === value)
            ) {
              session.bait = value;
            }
            return res.send(
              updateMessage(renderConditionSelection(sid, session)),
            );
          }
          case ACT_TIME: {
            if (TIMES.some((t) => t.value === value)) session.time = value;
            return res.send(
              updateMessage(renderConditionSelection(sid, session)),
            );
          }
          case ACT_WEATHER: {
            if (WEATHER.some((w) => w.value === value)) session.weather = value;
            return res.send(
              updateMessage(renderConditionSelection(sid, session)),
            );
          }
          case ACT_NEXT: {
            // Start inputtinng fish
            if (!conditionsComplete(session)) {
              return res.send(
                updateMessage(renderConditionSelection(sid, session)),
              );
            }

            console.log("Conditions selected for session: ", {
              ...session,
            });

            return res.send(updateMessage(renderFishLogging(sid, session)));
          }
          case ACT_BACK: {
            // Go back to condition selection menu
            return res.send(
              updateMessage(renderConditionSelection(sid, session)),
            );
          }
          case ACT_FISH: {
            // Selecting a fish
            const valid = LOCATIONS[session.location].fish.some(
              (f) => f.value === value,
            );
            if (valid && getTotalCaught(session) < MAX_CATCH)
              session.catches.push({ type: ENUM_FISH, value: value });
            return res.send(updateMessage(renderFishLogging(sid, session)));
          }
          case ACT_MISC: {
            // Selecting a misc item
            if (getTotalCaught(session) < MAX_CATCH) {
              session.catches.push({ type: ENUM_MISC, value: value });
            }

            return res.send(updateMessage(renderFishLogging(sid, session)));
          }
          case ACT_UNDO: {
            // Undo more recent fish
            session.catches.pop();
            return res.send(updateMessage(renderFishLogging(sid, session)));
          }
          case ACT_SUBMIT: {
            if (session.catches.length < 1 || !conditionsComplete(session)) {
              return res.send(updateMessage(renderFishLogging(sid, session)));
            }
            await saveCatch(sid, session);

            const channelId = interaction.channel_id ?? interaction.channel?.id;
            const publicMessageId = await postLogToChannel(channelId, session);

            deleteSession(sid);

            return res.send(updateMessage(renderEndCard(sid, publicMessageId)));
          }
          case ACT_CANCEL: {
            deleteSession(sid);

            console.log("Cancelling session: ", {
              ...session,
            });

            return res.send(
              updateMessage({ content: "Cancelled.", components: [] }),
            );
          }
        }
      }

      // Never leave an interaction unanswered
      return res.status(400).send({ error: "Unhandled interaction" });
    } catch (err) {
      console.error(err);
      return res.status(500).send({ error: "Internal error" });
    }
  },
);

app.listen(PORT, () => {
  console.log(`Interaction server listening on port ${PORT}`);
  createCommand();
});
