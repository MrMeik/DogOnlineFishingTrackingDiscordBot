import "dotenv/config";
import { formatFullSummary } from "./rendering.js";

export const COMMAND_NAME = "fish";

export async function DiscordRequest(endpoint, options) {
  // append endpoint to root API URL
  const url = "https://discord.com/api/v10/" + endpoint;
  // Stringify payloads
  if (options.body) options.body = JSON.stringify(options.body);
  // Use fetch to make requests
  const res = await fetch(url, {
    headers: {
      Authorization: `Bot ${process.env.DISCORD_TOKEN}`,
      "Content-Type": "application/json; charset=UTF-8",
      "User-Agent":
        "DiscordBot (https://github.com/MrMeik/DogOnlineFishingTrackingDiscordBot, 1.0.0)",
    },
    ...options,
  });
  // throw API errors
  if (!res.ok) {
    const data = await res.json();
    console.log(res.status);
    throw new Error(JSON.stringify(data));
  }
  // return original response
  return res;
}

export async function createCommand() {
  const appId = process.env.APP_ID;
  const serverId = process.env.SERVER_ID;

  const globalEndpoint = `applications/${appId}/guilds/${serverId}/commands`;
  const commandBody = {
    name: COMMAND_NAME,
    description: "Log caught fish to the tracking document",
    type: 1,
  };

  try {
    // Send HTTP request with bot token
    const res = await DiscordRequest(globalEndpoint, {
      method: "POST",
      body: commandBody,
    });

    // await DiscordRequest(`applications/${appId}/commands/${commandId}`, {
    //   method: "DELETE",
    // });
    console.log(await res.json());
  } catch (err) {
    console.error("Error installing commands: ", err);
  }
}

export async function postLogToChannel(channelId, s) {
  const res = await DiscordRequest(`channels/${channelId}/messages`, {
    method: "POST",
    body: {
      content: `<@${s.userId}> logged${formatFullSummary(s)}`,
      allowed_mentions: { parse: [] }, // prevents users from getting pinged (just used to render display name)
    },
  });
  if (!res.ok) {
    console.error("Failed to post log", res.status, await res.text());
    return null;
  }
  return (await res.json()).id;
}

export async function deleteLogFromChannel(channelId, messageId) {
  const res = await DiscordRequest(
    `channels/${channelId}/messages/${messageId}`,
    {
      method: "DELETE",
    },
  );
  if (!res.ok) {
    console.error("Failed to delete message", res.status, await res.text());
    return false;
  }
  return true;
}
