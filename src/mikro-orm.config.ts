import { __prod__ } from "./constants";
import { Post } from "./entities/Post";
import { MikroORM } from "@mikro-orm/core";
import path from "path";
import { User } from "./entities/user";

export default {
  migrations: {
    // path.join joins the path to the current directory with the path to the migrations folder
    path: path.join(__dirname, "./migrations"), // path to the folder with migrations
  },
  entities: [Post, User],
  allowGlobalContext: true,
  dbName: "redditclone",
  type: "postgresql",
  debug: !__prod__,
} as Parameters<typeof MikroORM.init>[0]; // sets the type properly
