/* eslint-disable no-console */
import fastify from 'fastify';

import fastifyMethodOverride from '../src';

describe('fastifyMethodOverride', () => {
  const methods = ['GET', 'POST', 'HEAD', 'PUT', 'DELETE', 'OPTIONS', 'PATCH'];
  let app;

  beforeAll(() => {
    app = fastify();
    app.register(fastifyMethodOverride);

    methods.forEach((method) => {
      app.route({
        method,
        url: '/',
        handler: (req, reply) => {
          reply.send({ method });
        },
      });
    });
  });

  describe('#should be override', () => {
    test.each([
      ['POST', 'HEAD'],
      ['POST', 'PUT'],
      ['POST', 'DELETE'],
      ['POST', 'OPTIONS'],
      ['POST', 'PATCH'],
    ])('#test from %s to %s', async (methodFrom, methodTo) => {
      const res = await app.inject({
        method: methodFrom,
        url: '/',
        payload: { _method: methodTo },
      });

      const actual = JSON.parse(res.body);
      const expected = { method: methodTo };

      expect(res.statusCode).toBe(200);
      expect(actual).toEqual(expected);
    });

    test('#throw error if route not find', async () => {
      const methodFrom = 'POST';
      const methodTo = 'PATCH';
      const url = '/url';

      const res = await app.inject({
        method: methodFrom,
        url,
        payload: { _method: methodTo },
      });

      const { message } = JSON.parse(res.body);
      const expected = `Route ${methodTo}:${url} not found`;

      expect(res.statusCode).toBe(404);
      expect(message).toEqual(expected);
    });
  });

  describe('#should not be override', () => {
    test.each([
      ['PATCH', 'HEAD'],
      ['HEAD', 'PUT'],
      ['PUT', 'DELETE'],
      ['DELETE', 'OPTIONS'],
      ['OPTIONS', 'PATCH'],
      ['GET', 'PATCH'],
      ['GET', 'POST'],
      ['POST', 'ERRORMETHOD'],
    ])('#test from %s to %s', async (methodFrom, methodTo) => {
      const res = await app.inject({
        method: methodFrom,
        url: '/',
        payload: { _method: methodTo },
      });

      const actual = JSON.parse(res.body);
      const expected = { method: methodFrom };

      expect(res.statusCode).toBe(200);
      expect(actual).toEqual(expected);
    });
  });

  afterAll(() => {
    app.close();
  });
});
