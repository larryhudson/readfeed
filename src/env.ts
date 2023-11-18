export function getEnv() {
  // If in a browser/Vite environment
  if (typeof import.meta !== "undefined" && import.meta.env) {
    return import.meta.env;
  }
  // If in a Node.js environment
  if (typeof process !== "undefined" && process.env) {
    return process.env;
  }
  // Default case
  return {
    apiUrl: "http://default.example",
  };
}
