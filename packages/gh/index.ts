import { config } from "dotenv";
import { Octokit } from "octokit";

config({ path: __dirname + "/.env" });

export const gh = new Octokit({
  auth: process.env.GH_TOKEN,
});
