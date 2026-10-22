# Overview

This is a discord bot that provides a user interface to upload their DogOnline fishing session results with. The recorded data is formatted into a nice message and posted to discord as well as uploaded to google sheets automatically. The interface is built using discords component library and is only shown the user calling user until it is submitted. In the case of a mistake, the user has the option to revoke their log which removes the logging messages and flags the logs in the google sheet

## Running the project

### Set up credentials

Update .env.example file with the values listed in the template and then rename to `.env`

Fetching the discord credentials is mostly covered in the [getting started guide](https://discord.com/developers/docs/getting-started).

The discord bot will need the following permissions:

- `applications.commands`
- `bot` (with Send Messages enabled)

You will need to make a Google service account to get API credentials for that. It needs to be invited to edit the tracking sheet that will be targeted

### Run the app

After your credentials are added, go ahead and run the app:

```
npm install
```

Then run:

```
node fishBot.js
```

or

```
npm run start
```

### Set up interactivity (Copied form discord bot starting guide)

The project needs a public endpoint where Discord can send requests. To develop and test locally, you can use something like [`ngrok`](https://ngrok.com/) to tunnel HTTP traffic.

Install ngrok if you haven't already, then start listening on port `3000`:

```
ngrok http 3000
```

You should see your connection open:

```
Tunnel Status                 online
Version                       2.0/2.0
Web Interface                 http://127.0.0.1:4040
Forwarding                    https://1234-someurl.ngrok.io -> localhost:3000

Connections                  ttl     opn     rt1     rt5     p50     p90
                              0       0       0.00    0.00    0.00    0.00
```

Copy the forwarding address that starts with `https`, in this case `https://1234-someurl.ngrok.io`, then go to your [app's settings](https://discord.com/developers/applications).

On the **General Information** tab, there will be an **Interactions Endpoint URL**. Paste your ngrok address there, and append `/interactions` to it (`https://1234-someurl.ngrok.io/interactions` in the example).

Click **Save Changes**, and your app should be ready to run
