import "dotenv/config";
import { Octokit, App } from "octokit";

export const gh = new Octokit({
  auth: process.env.GH_TOKEN,
});
