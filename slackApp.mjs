import pkg from "@slack/bolt";
import "dotenv/config";
const { App: SlackBolt } = pkg;

const slackApp = new SlackBolt({
  token: process.env.SLACK_BOT_TOKEN,
  socketMode: true,
  appToken: process.env.SLACK_APP_TOKEN,
});

export default slackApp;
