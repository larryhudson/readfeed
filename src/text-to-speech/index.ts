import { encode } from "html-entities";
import pMap from "p-map";
import { Buffer } from "buffer";
import fs from "fs";
import fsPromises from "fs/promises";
import path from "path";
import { secsToMs, msToHHMMSS } from "../utils/time.js";
import { getAudioDurationInSeconds } from "get-audio-duration";
import md5 from "js-md5";
import { db } from "@src/db";
import {
  audioFiles as audioFilesTable,
  audioItems as audioItemsTable,
  contentParts as contentPartsTable,
} from "@src/db/schema";
import { eq } from "drizzle-orm";
import { getEnv } from "@src/env";

export function getCostEstimate(numChars) {
  const AUD_PER_CHARACTER = 0.000024241;
  const costUnrounded = numChars * AUD_PER_CHARACTER;
  const costRounded = Math.round(costUnrounded * 100) / 100;
  return costRounded;
}

export function getCostEstimateForText(text) {
  if (!text) return 0;
  const numChars = text.length;
  return getCostEstimate(numChars);
}

function splitTextIntoChunksByLines(text, chunkLength) {
  const lines = text.split("\n");
  const chunks = [];
  let currentChunk = "";
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    if (currentChunk.length + line.length > chunkLength) {
      chunks.push(currentChunk);
      currentChunk = "";
    }
    currentChunk += line + "\n";
  }
  if (currentChunk.length > 0) {
    chunks.push(currentChunk);
  }
  return chunks;
}

async function getAudioBufferForChunk(text) {
  console.log("getting audio for text");
  console.log(text);

  const AZURE_API_KEY = import.meta.env.AZURE_API_KEY;
  const AZURE_API_REGION = import.meta.env.AZURE_API_REGION;

  const voiceName = "en-AU-WilliamNeural";
  const ttsLang = "en-AU";

  const ttsUrl = `https://${AZURE_API_REGION}.tts.speech.microsoft.com/cognitiveservices/v1`;

  const response = await fetch(ttsUrl, {
    method: "POST",
    headers: {
      "Content-Type": "application/ssml+xml",
      "X-Microsoft-OutputFormat": "audio-16khz-64kbitrate-mono-mp3",
      "User-Agent": "astro",
      "Ocp-Apim-Subscription-Key": AZURE_API_KEY,
    },
    body: `<speak version="1.0" xmlns="http://www.w3.org/2001/10/synthesis" xml:lang="${ttsLang}"><voice name="${voiceName}">${encode(
      text,
    )}</voice></speak>`,
  });

  if (!response.ok) {
    throw new Error(
      `Error fetching audio from Azure TTS: ${response.status} ${response.statusText}`,
    );
  }

  const arrayBuffer = await response.arrayBuffer();

  return Buffer.from(arrayBuffer);
}

export async function getAudioBufferForText(text) {
  console.log(text);
  const chunks = splitTextIntoChunksByLines(text, 3000);

  const audioBuffers = await pMap(chunks, getAudioBufferForChunk, {
    concurrency: 2,
  });
  // use p-map with concurrency of 2

  const joinedBuffer = Buffer.concat(audioBuffers);

  const textHash = md5(text);

  // write the joined buffer to a temporary audio file

  const audioFolderPath = "./media/audio";

  const audioFolderExists = fs.existsSync(audioFolderPath);
  if (!audioFolderExists) {
    await fsPromises.mkdir(audioFolderPath, { recursive: true });
  }

  const audioPath = path.join(audioFolderPath, `${textHash}.mp3`);

  await fsPromises.writeFile(audioPath, joinedBuffer);

  const durationSecs = await getAudioDurationInSeconds(audioPath);
  const durationMs = secsToMs(durationSecs);

  return {
    audioBuffer: joinedBuffer,
    durationMs,
    filePath: audioPath,
  };
}

export async function getAudioForChapters(chapters) {
  const chaptersWithAudio = await pMap(
    chapters,
    async (chapter) => {
      const chapterText = chapter.text;
      const { audioBuffer, durationMs } =
        await getAudioBufferForText(chapterText);

      return {
        ...chapter,
        audioBuffer,
        durationMs,
      };
    },
    {
      concurrency: 1,
    },
  );

  return chaptersWithAudio;
}

async function createAudioFileInDb({ filePath, durationMs, durationStr }) {
  const createdAudioFiles = await db
    .insert(audioFilesTable)
    .values({
      filePath,
      durationMs,
      duration: durationStr,
    })
    .returning();

  return createdAudioFiles[0];
}

async function addAudioFileToContentPart(contentPartId, audioFileId) {
  const updatedContentParts = await db
    .update(contentPartsTable)
    .set({ audioFileId })
    .where(eq(contentPartsTable.id, contentPartId))
    .returning();

  return updatedContentParts[0];
}

async function addAudioFileToAudioItem(audioItemId, audioFileId) {
  const updatedAudioItems = await db
    .update(audioItemsTable)
    .set({ audioFileId })
    .where(eq(audioItemsTable.id, audioItemId))
    .returning();

  return updatedAudioItems[0];
}

export async function combineContentPartAudioFilesInAudioItem(audioItem) {
  const { contentParts } = audioItem;
  const audioPaths = contentParts.map((contentPart) => {
    return contentPart.audioFile.filePath;
  });

  const audioBuffers = audioPaths.map((audioPath) => {
    return fs.readFileSync(audioPath);
  });

  const joinedBuffer = Buffer.concat(audioBuffers);
  const textHash = md5(contentParts.map((cp) => cp.textContent).join("\n"));
  // write the joined buffer to a temporary audio file
  const audioFolderPath = "./media/audio";
  const audioFolderExists = fs.existsSync(audioFolderPath);
  if (!audioFolderExists) {
    await fsPromises.mkdir(audioFolderPath, { recursive: true });
  }
  const audioPath = path.join(audioFolderPath, `${textHash}.mp3`);
  await fsPromises.writeFile(audioPath, joinedBuffer);
  const durationSecs = await getAudioDurationInSeconds(audioPath);
  const durationMs = secsToMs(durationSecs);
  const durationStr = msToHHMMSS(durationMs);

  // create a new audio file in the database
  const createdAudioFile = await createAudioFileInDb({
    filePath: audioPath,
    durationMs,
    durationStr,
  });

  // link the audio item to the audio file
  const updatedAudioItem = await addAudioFileToAudioItem(
    audioItem.id,
    createdAudioFile.id,
  );

  return updatedAudioItem;
}

export async function fetchAudioForContentPart(contentPart: ContentPart) {
  // get the audio buffer for the content part
  const { durationMs, filePath } = await getAudioBufferForText(
    contentPart.textContent,
  );

  const durationStr = msToHHMMSS(durationMs);

  //  and create a new audio file in the database
  const createdAudioFile = await createAudioFileInDb({
    filePath,
    durationMs,
    durationStr,
  });

  // link the content part to the audio file
  const updatedContentPart = await addAudioFileToContentPart(
    contentPart.id,
    createdAudioFile.id,
  );

  return updatedContentPart;
}
