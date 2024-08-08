const { App } = require("@slack/bolt");
const axios = require("axios");
const OpenAIApi = require("openai");
require("dotenv").config();

const huggingfaceToken = process.env.HUGGINGFACE_TOKEN;
const apiUrl =
  "https://api-inference.huggingface.co/models/sshleifer/distilbart-cnn-12-6";
const headers = { Authorization: `Bearer ${huggingfaceToken}` };

// const configuration = new Configuration({
//     apiKey: process.env.OPENAI_API_KEY,
//     });

const openai = new OpenAIApi();

async function query(payload) {
  try {
    const response = await axios.post(apiUrl, payload, { headers });
    return response.data;
  } catch (error) {
    console.error("Error querying Huggingface API:", error);
    throw error;
  }
}

const app = new App({
  token: process.env.SLACK_BOT_TOKEN,
  socketMode: true,
  appToken: process.env.SLACK_APP_TOKEN,
});

async function getThreadMessages(channelId, threadTs) {
  try {
    const response = await app.client.conversations.replies({
      channel: channelId,
      ts: threadTs,
    });
    return response.messages.map((msg) => msg.text).join("\n");
  } catch (error) {
    console.error("Error fetching thread messages:", error);
    throw error;
  }
}

function filterMessagesByUser(messages, userId) {
  return messages.filter((message) => message.user === userId);
}

async function getChannelHistory(channelId) {
  let conversationHistory = [];
  let hasMoreMessages = true;
  let nextCursor;

  while (hasMoreMessages) {
    try {
      const result = await app.client.conversations.history({
        channel: channelId,
        cursor: nextCursor,
      });

      conversationHistory = conversationHistory.concat(result.messages);
      nextCursor = result.response_metadata.next_cursor;
      hasMoreMessages = !!nextCursor;
    } catch (error) {
      console.error("Error fetching channel history:", error);
      throw error;
    }
  }
  return conversationHistory;
}

app.shortcut("summarize-text", async ({ ack, body, client, logger }) => {
  await ack();
  try {
    const { text: messageText, thread_ts: threadTs } = body.message;
    const channelId = body.channel.id;

    let textToSummarize = messageText;
    if (threadTs) {
      textToSummarize = await getThreadMessages(channelId, threadTs);
    }

    logger.debug(textToSummarize);
    const output = await query({ inputs: textToSummarize });
    const summary = output[0]?.summary_text;
    console.log(summary);

    await client.chat.postEphemeral({
      channel: channelId,
      user: body.user.id,
      text: "Here is your summary",
      blocks: [
        {
          type: "section",
          text: {
            type: "mrkdwn",
            text: summary,
          },
        },
      ],
    });
  } catch (error) {
    logger.error("Error handling shortcut:", error);
  }
});

(async () => {
  await app.start();
  console.log("⚡️ Bolt app is running!");

  const channelId = "C06AVC60TEU";
  const userId = "U0688TRQG4E";

  try {
    const allMessages = await getChannelHistory(channelId);
    // console.log("allMessages", allMessages)
    const userMessages = filterMessagesByUser(allMessages, userId);

    if (userMessages.length === 0) {
      console.log("No messages found for user:", userId);
      return;
    }

    console.log("User messages", userMessages);

    const formatMessagesWithLinks = (messages) => {
      return messages
        .map((msg) => {
          const messageLink = `https://tekion.slack.com/archives/${channelId}/p${msg.ts.replace(
            ".",
            ""
          )}`;
          return `• < ${messageLink}  |  ${msg.text} >`;
        })
        .join("\n");
    };

    const msg = formatMessagesWithLinks(userMessages);
    console.log("msg", msg);

    //   const completion = await openai.createCompletion({
    //     model: "text-davinci-003",
    //     prompt: `${userMessages}Give me a summary of text message from above object `,
    //     max_tokens:200
    //   });
    const completion = await openai.chat.completions.create({
      messages: [{ role: "system", content: "what is ai" }],
      model: "text-davinci-003",
    });

    console.log("completion", completion);
    // const msg = userMessages.map((msg) => `• ${msg.text}`).join('\n');
    const generateChunks = (msg, limit) => {
      const numOfChunks = Math.round(msg.length / limit);
      const chunks = [];
      for (let i = 0; i < numOfChunks; i++) {
        chunks.push(msg.slice(i, limit));
      }
      return chunks;
    };
    console.log("Generating Chunks:", generateChunks(msg, 1000).length);
    const chunks = generateChunks(msg, 1000);

    await app.client.chat.postEphemeral({
      channel: channelId,
      user: userId,
      text: completion,
      //   blocks: chunks.map(chunk => ([
      //     {
      //       type: "section",
      //       text: {
      //         type: "plain_text",
      //         text: chunk || "No messages found.",
      //       },
      //     },
      //   ])),
    });
  } catch (error) {
    console.error("Error fetching channel history:", error);
  }
})();
