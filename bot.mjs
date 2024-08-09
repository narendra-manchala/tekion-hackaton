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
async function SentryRun(p, callback) {
  const prompt = p || "Write a story about an AI and magic"
  const promptQuestion = `
  Convert the following data to the specified chart format without Explanation and remove Json from starting:
  
  Expected Format:
  {
    type: 'bar',
    data: {
      labels: ['TypeError', 'SyntaxError', 'NetworkError','Error: 403','Error: 500','Error: 404','Error: 401','Error: 504','UnknownError'],
      datasets: [
        {
          label: 'Occurrences',
          data: [405, 66, 292],
        },
      ],
    },
  }
  `;
  const result = await model.generateContent(`${promptQuestion}: ${prompt}`);
  
  const response = await result.response;
  const text = response.text();
  console.log(text);
  const encodedChart = encodeURIComponent(text);
 const chartUrl = `https://quickchart.io/chart?c=${encodedChart}`; 
  await callback(chartUrl);
   callback('Fetching Explaination....');

  run(p, callback)
 }

export default async function bot(channelId) {  
  // const channelId = "C06AVC60TEU";
  // const userId = "U0688TRQG4E";
  // const channelId = "C06DF2QSBD1";
  const userId =   "U06BW5ULQ6N";

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

    if (userMessages.length === 0 && channelId !=='C06DF2QSBD1') {
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
    if(channelId ==='C06DF2QSBD1') {
     //  allMessages as errors are not user based 
      const msg = formatMessagesWithLinks(allMessages);
      await SentryRun(msg, postMessageSentry);
      return msg; 
    }
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
  async function postMessageSentry (summary) {
    try {
      await app.client.chat.postMessage({
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
    context = await bot('C07DT9Y8754');
    chat = model.startChat({
      history: [
        {
          role: "user",
          parts: [{ text: context }],
        },
      ],
    });
    // let result = await chat.sendMessage(`${message.text}`);
    // await say(`Analysing data...`);
    // const result = await model.generateContent(`Summarize \n ${context}`);
    // console.log('context', context);
    // console.log('------------->', result.response.text());
    // await say(`${result.response.text()}`);
  } catch (e) {
    console.log(e);
  }
});
slackApp.message('Sentry analyze', async ({ message, say }) => {
  // say() sends a message to the channel where the event was triggered
 
  try {
    console.log('Called... ');
    console.log('-------------------');
    console.log(message);
    await say(`Analyzing Data...`);
    context = await bot('C06DF2QSBD1');
  } catch (e) {
    console.log(e);
  }
});

// interactive chat
slackApp.message('??', async ({ message, say }) => {
  // say() sends a message to the channel where the event was triggered
  try {
    context = await bot();
    chat = model.startChat({
      history: [
        {
          role: "user",
          parts: [{ text: context }],
        },
      ],
    });
    console.log(message);
    let result = await chat?.sendMessage(`what is the release branch for vehicle inventory?`);
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
