import { getAudioItemById, updateAudioItem } from "@src/audio-items";
import { fetchAudioForContentPart } from "@src/text-to-speech";
import pMap from "p-map";

export async function fetchAudioForAudioItem(job) {
  const { audioItemId } = job.data;

  const audioItem = await getAudioItemById(audioItemId);

  // add the job id to the audio item
  await updateAudioItem(audioItemId, {
    jobId: job.id,
  });

  const contentPartsWithoutAudio = audioItem.contentParts.filter(
    (contentPart) => contentPart.audioFileId === null,
  );

  let currentProgress = 0;

  await pMap(
    contentPartsWithoutAudio,
    async (contentPart) => {
      console.log("waiting a few seconds");
      await new Promise((resolve) => setTimeout(resolve, 5000));
      console.log("fetching audio for content part", contentPart.id);
      await fetchAudioForContentPart(contentPart);
      currentProgress += 1;
      console.log(
        "updating progress",
        currentProgress / contentPartsWithoutAudio.length,
      );
      await job.updateProgress(
        currentProgress / contentPartsWithoutAudio.length,
      );
    },
    {
      concurrency: 1,
    },
  );
}
