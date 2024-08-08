/* GET home page. */
export default async function bot() {
  const huggingfaceToken = process.env.HUGGINGFACE_TOKEN;
  const apiUrl =
    "https://api-inference.huggingface.co/models/sshleifer/distilbart-cnn-12-6";
  const headers = { Authorization: `Bearer ${huggingfaceToken}` };

  const channelId = "C06AVC60TEU";
  const userId = "U0688TRQG4E";

  // call hugging face
  const huggingfaceRes = await axios.post(apiUrl, payload, { headers });

  // fetch channel history
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

  try {
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

    // TODO: Not working, no limit available
    // const completion = await openai.chat.completions.create({
    //   messages: [{ role: "system", content: "what is ai" }],
    //   model: "text-davinci-003",
    // });

    // console.log("completion", completion);

    await app.client.chat.postEphemeral({
      channel: channelId,
      user: userId,
      text: msg,
    });
    return "Posted data successfully.";
  } catch (error) {
    console.error("Error fetching channel history:", error);
  }
}
