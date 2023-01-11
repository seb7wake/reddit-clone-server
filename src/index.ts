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
