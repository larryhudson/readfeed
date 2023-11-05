import { auth } from "@src/auth/lucia";

export async function createSuperuser() {
  const ADMIN_NAME = import.meta.env.ADMIN_NAME as string;
  const ADMIN_EMAIL = import.meta.env.ADMIN_EMAIL as string;
  const ADMIN_PASSWORD = import.meta.env.ADMIN_PASSWORD as string;
  console.log("Creating user with email", ADMIN_EMAIL);

  const user = await auth.createUser({
    key: {
      providerId: "email", // auth method
      providerUserId: ADMIN_EMAIL.toLowerCase(), // unique id when using "email" auth method
      password: ADMIN_PASSWORD, // hashed by Lucia
    },
    attributes: {
      name: ADMIN_NAME,
      email: ADMIN_EMAIL,
      is_admin: 1,
    },
  });

  return user;
}
