import { db } from "@src/db";
import { emailVerificationTokens, passwordResetTokens } from "@src/db/schema";
import { eq } from "drizzle-orm";
import { generateRandomString, isWithinExpiration } from "lucia/utils";

const EXPIRES_IN = 1000 * 60 * 60 * 2; // 2 hours

export const generateEmailVerificationToken = async (userId: string) => {
  const storedUserTokens = await db
    .select()
    .from(emailVerificationTokens)
    .where(eq(emailVerificationTokens.userId, userId));

  if (storedUserTokens.length > 0) {
    const reusableStoredToken = storedUserTokens.find((token) => {
      // check if expiration is within 1 hour
      // and reuse the token if true
      return isWithinExpiration(Number(token.expires) - EXPIRES_IN / 2);
    });
    if (reusableStoredToken) return reusableStoredToken.id;
  }
  const token = generateRandomString(63);

  await db.insert(emailVerificationTokens).values({
    id: token,
    expires: new Date().getTime() + EXPIRES_IN,
    userId: userId,
  });

  return token;
};

export const validateEmailVerificationToken = async (token: string) => {
  // const storedToken = await db.transaction().execute(async (trx) => {
  //   const storedToken = await trx
  //     .selectFrom("email_verification_token")
  //     .selectAll()
  //     .where("id", "=", token)
  //     .executeTakeFirst();
  //   if (!storedToken) throw new Error("Invalid token");
  //   await trx
  //     .deleteFrom("email_verification_token")
  //     .where("user_id", "=", storedToken.user_id)
  //     .executeTakeFirst();
  //   return storedToken;
  // });
  // const tokenExpires = Number(storedToken.expires); // bigint => number conversion
  // if (!isWithinExpiration(tokenExpires)) {
  //   throw new Error("Expired token");
  // }
  // return storedToken.user_id;
};

export const generatePasswordResetToken = async (userId: string) => {
  const storedUserTokens = await db
    .select()
    .from(passwordResetTokens)
    .where(eq(passwordResetTokens.userId, userId));

  if (storedUserTokens.length > 0) {
    const reusableStoredToken = storedUserTokens.find((token) => {
      // check if expiration is within 1 hour
      // and reuse the token if true
      return isWithinExpiration(Number(token.expires) - EXPIRES_IN / 2);
    });
    if (reusableStoredToken) return reusableStoredToken.id;
  }
  const token = generateRandomString(63);

  await db.insert(passwordResetTokens).values({
    id: token,
    expires: new Date().getTime() + EXPIRES_IN,
    userId: userId,
  });

  return token;
};

export const validatePasswordResetToken = async (token: string) => {
  // TODO: lookup how to do this with drizzle
//   const storedToken = await db.transaction().execute(async (trx) => {
//     const storedToken = await trx
//       .selectFrom("password_reset_token")
//       .selectAll()
//       .where("id", "=", token)
//       .executeTakeFirst();
//     if (!storedToken) throw new Error("Invalid token");
//     await trx
//       .deleteFrom("password_reset_token")
//       .where("id", "=", token)
//       .executeTakeFirst();
//     return storedToken;
//   });
//   const tokenExpires = Number(storedToken.expires); // bigint => number conversion
//   if (!isWithinExpiration(tokenExpires)) {
//     throw new Error("Expired token");
//   }
//   return storedToken.user_id;
// };

export const isValidPasswordResetToken = async (token: string) => {
  // const storedToken = await db
  //   .selectFrom("password_reset_token")
  //   .selectAll()
  //   .where("id", "=", token)
  //   .executeTakeFirst();


  // if (!storedToken) return false;
  // const tokenExpires = Number(storedToken.expires); // bigint => number conversion
  // if (!isWithinExpiration(tokenExpires)) {
  //   return false;
  // }
  // return true;
};
