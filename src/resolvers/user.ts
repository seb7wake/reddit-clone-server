import { User } from "../entities/User";
import {
  Arg,
  Ctx,
  Field,
  InputType,
  Int,
  Mutation,
  ObjectType,
  Query,
  Resolver,
} from "type-graphql";
import { MyContext } from "src/types";
import argon2 from "argon2";

// an alternative way to the @Arg() decorator to pass arguments into resolvers (see registerUser function)
@InputType()
class UsernamePasswordInput {
  @Field()
  username: string;
  @Field()
  password: string;
}

@ObjectType()
class FieldError {
  @Field()
  field: string;
  @Field()
  message: string;
}

// use objectType for outputs and InputType for inputs
// outputting errors in this case so use ObjectType
@ObjectType()
class UserResponse {
  // return error if error exists in async call
  @Field(() => [FieldError], { nullable: true })
  errors?: FieldError[];
  // return user if it works properly
  @Field(() => User, { nullable: true })
  user?: User;
}

@Resolver()
export class UserResolver {
  @Query(() => User, { nullable: true })
  async me(@Ctx() context: MyContext) {
    // not logged in
    if (!context.req.session.userId) {
      return null;
    }
    // logged in
    const user = await context.em.findOne(User, {
      id: context.req.session.userId,
    });
    console.log(context.req.session);
    return user;
  }

  @Query(() => [User])
  // @Ctx allows function to access the context of type MyContext (orm.em in this case)
  users(@Ctx() context: MyContext): Promise<User[]> {
    return context.em.find(User, {});
  }

  @Query(() => User, { nullable: true })
  user(
    // @Arg allows function to access the argument of type Int
    @Arg("id", () => Int) id: number,
    @Ctx() context: MyContext
  ): Promise<User | null> {
    return context.em.findOne(User, { id });
  }

  @Mutation(() => UserResponse)
  async registerUser(
    @Arg("username") username: string,
    @Arg("password") password: string,
    // could alternatively do it like this:
    // @Arg('options': () => UsernamePasswordInput) options: UsernamePasswordInput,
    @Ctx() context: MyContext
  ): Promise<UserResponse> {
    const userExists = await context.em.findOne(User, { username });
    if (userExists) {
      return {
        errors: [
          {
            field: "username",
            message: "A user with this username already exists",
          },
        ],
      };
    } else if (username.length <= 2) {
      return {
        errors: [
          {
            field: "username",
            message: "Username must be longer than 2 characters",
          },
        ],
      };
    } else if (password.length <= 2) {
      return {
        errors: [
          {
            field: "password",
            message: "Password must be longer than 3 characters",
          },
        ],
      };
    }
    const hashedPassowrd = await argon2.hash(password);
    const user = context.em.create(User, {
      username,
      password: hashedPassowrd,
    } as User);
    // hash password using argon2 so that it is secure
    await context.em.persistAndFlush(user);
    // adding session for user (logs them in)
    context.req.session.userId = user.id;

    return { user };
  }

  @Mutation(() => UserResponse)
  async login(
    @Arg("username") username: string,
    @Arg("password") password: string,
    @Ctx() context: MyContext
  ): Promise<UserResponse> {
    const user = await context.em.findOne(User, { username });
    if (!user) {
      return {
        errors: [{ field: "username", message: "that username doesn't exist" }],
      };
    }
    const valid = await argon2.verify(user.password, password);
    if (!valid) {
      return {
        errors: [{ field: "username", message: "Incorrect Password" }],
      };
    }

    // adding session for user
    // this is how we store the session in redis
    // redis key-value store looks something like: { session: hbchiwbehve -> {userId: 1} }
    context.req.session.userId = user.id;

    return { user };
  }
}
