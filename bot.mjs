import slackApp from "./slackApp.mjs";
import axios from "axios";
import { GoogleGenerativeAI } from "@google/generative-ai";

export default async function bot() {

  const app = slackApp;
  const channelId = "C06AVC60TEU";
  // const userId = "U0688TRQG4E";
  // const channelId = "C07FXUT4BJS";
  const userId =   "U0688SKTD2S";

  // call hugging face
  // const huggingfaceRes = await axios.post(apiUrl, payload, { headers });


  function geminiInit() {
    const genAI = new GoogleGenerativeAI(process.env.GEMINI_KEY);
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash"});
  }
  geminiInit();

  // Run prompts
  async function run(p) {
    const prompt = p || "Write a story about an AI and magic"
  
    const result = await model.generateContent(`Summarize \n ${prompt}`);
    const response = await result.response;
    const text = response.text();
    console.log(text);
    postMessage(text);
  }

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
    await run(msg);
    
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

