import express from "express";
import pkg from "@slack/bolt";
import "dotenv/config";

const { App: SlackBolt } = pkg;

const app = express();
const port = 3001;

app.get("/", (req, res) => {
  res.send("Welcome to my summarizer!!!");
});

export const slackApp = new SlackBolt({
  token: process.env.SLACK_BOT_TOKEN,
  socketMode: true,
  appToken: process.env.SLACK_APP_TOKEN,
});

app.listen(port, async () => {
  await slackApp.start();
  console.log(`Server is running on port ${port}`);
});
