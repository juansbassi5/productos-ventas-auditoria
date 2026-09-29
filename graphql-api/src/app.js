import { ApolloServer } from '@apollo/server';
import { ApolloServerPluginLandingPageLocalDefault } from '@apollo/server/plugin/landingPage/default';
import { expressMiddleware } from '@as-integrations/express5';
import cors from 'cors';
import express from 'express';
import { typeDefs } from './graphql/typeDefs.js';
import { resolvers } from './graphql/resolvers.js';

export async function createApp() {
  const app = express();
  const apollo = new ApolloServer({
    typeDefs,
    resolvers,
    introspection: true,
    plugins: [ApolloServerPluginLandingPageLocalDefault({ embed: true })],
  });

  await apollo.start();

  app.get('/health', (_request, response) => {
    response.json({ status: 'ok' });
  });

  app.use('/graphql', cors(), express.json(), expressMiddleware(apollo));

  return { app, apollo };
}
