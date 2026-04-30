import { type ClientSchema, a, defineData } from '@aws-amplify/backend';

const schema = a.schema({
  MovieActivity: a
    .model({
      userId: a.string().required(),
      username: a.string().required(),
      movieId: a.integer().required(),
      movieTitle: a.string(),
      posterPath: a.string(),
      rating: a.float(),
      review: a.string(),
    })
    .authorization((allow) => [
      allow.owner(), 
      allow.authenticated().to(['read'])
    ]),

  UserProfile: a
    .model({
      userId: a.string().required(),
      username: a.string().required(),
      name: a.string(),
      surname: a.string(),
      age: a.integer(),
      bio: a.string(),
    })
    .identifier(['userId'])
    .authorization((allow) => [
      allow.owner(),
      allow.authenticated().to(['read'])
    ]),

  Connection: a
    .model({
      followerId: a.string().required(),
      followingId: a.string().required(),
      followingUsername: a.string(),
      followingName: a.string(),
    })
    .authorization((allow) => [
      allow.owner(), 
      allow.authenticated().to(['read'])
    ]),
});

export type Schema = ClientSchema<typeof schema>;

export const data = defineData({
  schema,
  authorizationModes: {
    defaultAuthorizationMode: 'userPool',
  },
});
