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

      app.route({
        method,
        url: '/url/:id',
        handler: (req, reply) => {
          const { params } = req;
          reply.send({ method, params });
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

  describe('#should be override with params', () => {
    test.each([
      ['POST', 'HEAD'],
      ['POST', 'PUT'],
      ['POST', 'DELETE'],
      ['POST', 'OPTIONS'],
      ['POST', 'PATCH'],
    ])('#test from %s to %s', async (methodFrom, methodTo) => {
      const res = await app.inject({
        method: methodFrom,
        url: '/url/id',
        payload: { _method: methodTo },
      });

      const actual = JSON.parse(res.body);
      const expected = { method: methodTo, params: { id: 'id' } };

      expect(res.statusCode).toBe(200);
      expect(actual).toEqual(expected);
    });
  });

  describe('test setNotFoundHandler', () => {
    it('GET 200', async () => {
      const res = await app.inject({
        method: 'GET',
        url: '/',
      });

      expect(res.statusCode).toBe(200);
    });

    it('GET 200 override', async () => {
      const res = await app.inject({
        method: 'POST',
        url: '/',
        payload: { _method: 'DELETE' },
      });

      expect(res.statusCode).toBe(200);
    });

    it('GET 200 not override', async () => {
      const res = await app.inject({
        method: 'POST',
        url: '/',
        payload: { _method: 'ERRORMETHOD' },
      });

      expect(res.statusCode).toBe(200);
    });

    it('GET 404', async () => {
      const res = await app.inject({
        method: 'GET',
        url: '/wrong-path',
      });

      expect(res.statusCode).toBe(404);
    });

    it('GET 404 override', async () => {
      const res = await app.inject({
        method: 'POST',
        url: '/wrong-path',
        payload: { _method: 'DELETE' },
      });

      expect(res.statusCode).toBe(404);
    });
  });

  afterAll(() => {
    app.close();
  });
});
