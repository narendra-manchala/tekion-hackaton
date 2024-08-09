import slackApp from "./slackApp.mjs";
import axios from "axios";
import { GoogleGenerativeAI } from "@google/generative-ai";
import { fetchJira } from "./jira.mjs";

let genAI;
let model;
const app = slackApp;
let context;

function geminiInit() {
  genAI = new GoogleGenerativeAI(process.env.GEMINI_KEY);
  model = genAI.getGenerativeModel({ model: "gemini-1.5-flash"});
}
geminiInit();

// Run prompts
async function run(p, callback) {
 const prompt = p || "Write a story about an AI and magic"

 const result = await model.generateContent(`Summarize \n ${prompt}`);
 const response = await result.response;
 const text = response.text();
 console.log(text);
 callback(text);
}

export default async function bot() {  
  // const channelId = "C06AVC60TEU";
  // const userId = "U0688TRQG4E";
  const channelId = "C07DT9Y8754";
  const userId =   "U0688SKTD2S";

  // call hugging face
  // const huggingfaceRes = await axios.post(apiUrl, payload, { headers });


  function filterMessagesByUser(messages, userId) {
    return messages.filter((message) => message.user === userId);
  }

  // fetch channel history
  async function getChannelHistory(channelId) {
    let conversationHistory = [];
    let hasMoreMessages = true;
    let nextCursor;

    while (hasMoreMessages) {
      try {
        const result = await slackApp.client.conversations.history({
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

  try {
    function filterMessagesByUser(messages, userId) {
      const mentionPattern = new RegExp(`<@${userId}>`, 'i');
      return messages.filter((message) => mentionPattern.test(message.text));
    }
    const allMessages = await getChannelHistory(channelId);
    const userMessages = filterMessagesByUser(allMessages, userId);

    if (userMessages.length === 0) {
      console.log("No messages found for user:", userId);
      return;
    }

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
    await run(msg, postMessage);
    return msg; 
    // TODO: Not working, no limit available
    // const completion = await openai.chat.completions.create({
    //   messages: [{ role: "system", content: "what is ai" }],
    //   model: "text-davinci-003",
    // });

    // console.log("completion", completion);

    /*     
    await app.client.chat.postEphemeral({
      channel: channelId,
      user: userId,
      text: summary,
    });
    return "Posted data successfully.";
    */
    
  } catch (error) {
    console.error("Error fetching channel history:", error); 
  }


  async function postMessage (summary) {
    try {
      await app.client.chat.postEphemeral({
        channel: channelId,
        user: userId,
        text: summary,
      });
      return "Posted data successfully.";
    } catch (error) {
      console.error("Error posting message", error);
    }
  }
}

let chat;
  // Message listener
// Listens to incoming messages that contain "hello"
slackApp.message('hello', async ({ message, say }) => {
  // say() sends a message to the channel where the event was triggered
  try {
    console.log('Called... ');
    console.log('-------------------');
    console.log(message);
    context = await bot();
    chat = model.startChat({
      history: [
        {
          role: "user",
          parts: [{ text: context }],
        },
      ],
    });
    let result = await chat.sendMessage(`${message.text}`);

    console.log('context', context);
    console.log('------------->', result.response.text());
    await say(`${result.response.text()}`);
  } catch (e) {
    console.log(e);
  }
});

// interactive chat
slackApp.message('siri', async ({ message, say }) => {
  // say() sends a message to the channel where the event was triggered
  try {
    console.log('Interactivity... ');
    console.log('-------------------');
    
    console.log(message);
    let result = await chat?.sendMessage(`${message.text}`);
    console.log('context', context);
    console.log('------------->', result.response.text());
    await say(`${result.response.text()}`);
  } catch (e) {
    console.log(e);
  }
});

// 
slackApp.message('jira', async ({ message, say }) => {
  // say() sends a message to the channel where the event was triggered
  try {
    console.log('Called... ');
    console.log('-------------------');
    console.log(message);
    context = await fetchJira();
    console.log('===>', JSON.stringify(context));
    chat = model.startChat({
      history: [
        {
          role: "user",
          parts: [{ text: JSON.stringify(context) }],
        },
      ],
    });
    let result = await chat.sendMessage(`${message.text}`);

    console.log('context', context);
    console.log('------------->', result.response.text());
    await say(`${result.response.text()}`);
  } catch (e) {
    console.log(e);
  }
});
