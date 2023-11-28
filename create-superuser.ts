import { createSuperuser } from "@src/auth/create-superuser";
import "dotenv/config";

async function main() {
  console.log("Creating superuser");
  await createSuperuser();
}

main();
