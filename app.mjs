import express from "express";
import bot from "./bot.mjs";
import "dotenv/config";
import slackApp from "./slackApp.mjs";

const app = express();
const port = 3001;

app.get("/", (req, res) => {
  bot();
  res.send("Welcome to my summarizer!!!");
});

app.listen(port, async () => {
  await slackApp.start();
  console.log(`Server is running on port ${port}`);
});
