import { Entity, Property, PrimaryKey } from "@mikro-orm/core";
import { Field, Int, ObjectType } from "type-graphql";

@ObjectType() // tells type-graphql that this is an object type so that we can use itin resolvers
@Entity()
export class Post {
  // don't necessarily need type in Field decorator, but it's good practice
  @Field(() => Int) // tells type-graphql that this is a field so that we can use it in resolvers (exposes field to graphql)
  @PrimaryKey()
  id!: number;

  @Field(() => String)
  // decroates this as just a regular column
  @Property({type: 'date'})
  createdAt = new Date();

  @Field(() => String)
  @Property({type: 'date', onUpdate: () => new Date()})
  updatedAt = new Date();

  @Field(() => String)
  @Property({type: 'text'})
  title!: string;
}