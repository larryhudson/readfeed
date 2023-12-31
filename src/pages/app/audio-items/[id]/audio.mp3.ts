import fs from "fs";
import { getAudioItemById } from "@src/audio-items";

export async function GET(context) {
  const audioItemIdStr = context.params.id;
  const audioItemId = parseInt(audioItemIdStr, 10);

  const session = await context.locals.auth.validate();
  const userId = session.user.userId;

  // TODO: think about when this mp3 is linked from a podcast feed
  // we won't have the session cookie. instead, we'll have a password on the query string

  const audioItem = await getAudioItemById(audioItemId);
  if (audioItem.feed.userId !== userId) {
    return new Response("Unauthorized", { status: 401 });
  }

  const audioFilePath = audioItem.audioFile.filePath;

  const audioBuffer = fs.readFileSync(audioFilePath);

  return new Response(audioBuffer, {
    headers: {
      "Content-Type": "audio/mpeg",
    },
  });
}
