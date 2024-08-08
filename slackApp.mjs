import pkg from "@slack/bolt";
const { App: SlackBolt } = pkg;
import "dotenv/config";

const slackApp = new SlackBolt({
  token: process.env.SLACK_BOT_TOKEN,
  socketMode: true,
  appToken: process.env.SLACK_APP_TOKEN,
});

export default slackApp;
