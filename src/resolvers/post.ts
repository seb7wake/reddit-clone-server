import { Post } from "../entities/Post";
import { Arg, Ctx, Int, Mutation, Query, Resolver } from "type-graphql";
import { MyContext } from "src/types";
import { RequiredEntityData } from "@mikro-orm/core";

@Resolver()
export class PostResolver {
    @Query(() => [Post])
    // @Ctx allows function to access the context of type MyContext (orm.em in this case)
    posts(@Ctx() context: MyContext): Promise<Post[]> {
        return context.em.find(Post, {})
    }

    @Query(() => Post, {nullable: true})
    post(
        // @Arg allows function to access the argument of type Int
        @Arg('id', () => Int) id: number,
        @Ctx() context: MyContext
        ): Promise<Post | null> {
        return context.em.findOne(Post, { id })
    }

    @Mutation(() => Post)
    async createPost(
        // @Arg allows function to access the argument of type Int
        @Arg('title') title: string,
        @Ctx() context: MyContext
        ): Promise<Post | null> {
        const post = context.em.create(Post, { title } as RequiredEntityData<Post>)
        await context.em.persistAndFlush(post)
        return post
    }

    @Mutation(() => Post)
    async updatePost(
        @Arg('id') id: number,
        @Arg('title', () => String, {nullable: true}) title: string,
        @Ctx() context: MyContext
        ): Promise<Post | null> {
        // may also be able to use context.em.nativeUpdate(Post, { id }, { title })
        const post = await context.em.findOne(Post, { id })
        if (!post) {
            return null
        } else if (typeof title !== "undefined") {
            post.title = title
            post.updatedAt = new Date()
            await context.em.persistAndFlush(post)
        }
        return post
    }
    
    @Mutation(() => Boolean)
    async deletePost(
        @Arg('id') id: number,
        @Ctx() context: MyContext
        ): Promise<boolean> {
        // does not error if id does not exist
        const post = context.em.nativeDelete(Post, { id } as RequiredEntityData<Post>)
        return true
    }

}