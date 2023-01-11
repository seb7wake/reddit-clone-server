import "reflect-metadata";
import { MikroORM, RequiredEntityData } from "@mikro-orm/core";
import { __prod__ } from "./constants";
import { Post } from "./entities/Post";
import mikroOrmConfig from "./mikro-orm.config";
import express from "express";
import { ApolloServer } from "apollo-server-express";
import { buildSchema } from "type-graphql";
import { HelloResolver } from "./resolvers/hello";
import { PostResolver } from "./resolvers/post";
import { UserResolver } from "./resolvers/user";
import session from "express-session";
import connectRedis from "connect-redis";
import { createClient } from "redis"; // redis@v4

const RedisStore = connectRedis(session);
const redisClient = createClient({ legacyMode: true });
redisClient.connect().catch(console.error);

const main = async () => {
  const orm = await MikroORM.init(mikroOrmConfig);
  orm.getMigrator().up(); // runs the migrations
  //below is how you create a post, add it ot db, and query it
  // const post = orm.em.create(Post, {
  //     title: 'my first post'
  // } as RequiredEntityData<Post>)
  // // inserts into db
  // await orm.em.persistAndFlush(post)
  // const post = await orm.em.find(Post, {})

  const app = express();

  // use redis as session store (step 4)
  app.use(
    session({
      name: "qid", // cookie name
      store: new RedisStore({
        client: redisClient,
        // disable updating the session in redis (session lasts forever)
        disableTouch: true,
      }),
      cookie: {
        maxAge: 1000 * 60 * 60 * 24 * 365 * 10, // 10 years
        httpOnly: true, // cookie can only be accessed by the server
        // often times set to false until you get it working to avoid issues
        secure: __prod__, // cookie only works in https (only if using https in prod)
        sameSite: "lax", // csrf
      },
      saveUninitialized: false,
      secret: "hkvdcgyiwvkceerv", // use some random string
      resave: false,
    })
  );

  // creates apollo server with whatever we need
  const apolloServer = new ApolloServer({
    schema: await buildSchema({
      resolvers: [HelloResolver, PostResolver, UserResolver],
      validate: false,
    }),
    // special context accessible by all resolvers
    // will use orm.em to find posts
    context: () => ({ em: orm.em }),
  });

  await apolloServer.start();

  apolloServer.applyMiddleware({ app });

  app.listen(4000, () => {
    console.log("server started on localhost:4000");
  });
};
main().catch((err) => {
  console.log(err);
});
