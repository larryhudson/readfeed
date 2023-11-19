import { Worker } from "bullmq";
import type { Job } from "bullmq";
import { notifyAdminAboutNewWaitlistUser } from "./background-tasks/notify-admin-new-waitlist-user.js";
import { sendInvitationEmail } from "./background-tasks/send-invitation.js";
import { fetchAudioForAudioItem } from "./background-tasks/fetch-audio-for-audio-item.js";
import "dotenv/config";

const handlers = {
  notifyAdminAboutNewWaitlistUser,
  sendInvitationEmail,
  fetchAudioForAudioItem,
};

function handleJob(job: Job) {
  const handler = handlers[job.name];

  if (!handler) {
    throw new Error(`No handler for job ${job.name}`);
  }

  console.log({ jobData: job.data });

  return handler(job);
}

const redisOptions = {
  connection: {
    host: "127.0.0.1",
    port: 6379,
  },
};

const worker = new Worker("taskQueue", handleJob, redisOptions);

worker.on("ready", () => {
  console.log("Worker is ready");
});

worker.on("active", (job) => {
  console.log(`${job.id} has started!`);
});

worker.on("completed", (job) => {
  console.log(`${job.id} has completed!`);
});

worker.on("failed", (job, err) => {
  console.log(`${job.id} has failed with ${err.message}`);
});
