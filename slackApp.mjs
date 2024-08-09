import pkg from "@slack/bolt";
import axios from "axios";
const { App: SlackBolt } = pkg;
import "dotenv/config";

const huggingfaceToken = process.env.HUGGINGFACE_TOKEN;
const apiUrl =
  "https://api-inference.huggingface.co/models/sshleifer/distilbart-cnn-12-6";
const headers = { Authorization: `Bearer ${huggingfaceToken}` };

const slackApp = new SlackBolt({
  token: process.env.SLACK_BOT_TOKEN,
  socketMode: true,
  appToken: process.env.SLACK_APP_TOKEN,
  signingSecret: process.env.SIGNING_SECRET,
  port: process.env.PORT || 3001
});

  //shortcut feature
  // slackApp.shortcut("summarize-text", async ({ ack, body, client, logger }) => {
  //   await ack();
  //   try {
  //     const { text: messageText, thread_ts: threadTs } = body.message;
  //     const channelId = body.channel.id;
  
  //     let textToSummarize = messageText;
  //     if (threadTs) {
  //       textToSummarize = await getThreadMessages(channelId, threadTs);
  //     }
  
  //     logger.debug(textToSummarize);
  //     // const output = await query({ inputs: textToSummarize });

  //       // call hugging face
  //     const huggingfaceRes = await axios.post(apiUrl, textToSummarize, { headers });
  //     console.log("huggingfaceRes", huggingfaceRes)
  //     const summary = huggingfaceRes.data[0]?.summary_text;
  //     console.log(summary);
  
  //     await client.chat.postEphemeral({
  //       channel: channelId,
  //       user: body.user.id,
  //       text: "Here is your summary",
  //       blocks: [
  //         {
  //           type: "section",
  //           text: {
  //             type: "mrkdwn",
  //             text: summary,
  //           },
  //         },
  //       ],
  //     });
  //   } catch (error) {
  //     logger.error("Error handling shortcut:", error);
  //   }
  // });
  
export default slackApp;
