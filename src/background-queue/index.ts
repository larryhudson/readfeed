import { Queue } from "bullmq";

export const taskQueue = new Queue("taskQueue", {
  connection: {
    host: "127.0.0.1",
    port: 6379,
  },
});

export async function addTaskToQueue({
  taskName,
  taskData,
}: {
  taskName: string;
  taskData: any;
}) {
  console.log("Adding task to queue", { taskName, taskData });
  const job = await taskQueue.add(taskName, taskData);
  return job;
}
