import fp from 'fastify-plugin';
import _ from 'lodash';
import { NotFound } from 'http-errors';
import { match } from 'path-to-regexp';

const getMethod = _.flow(_.get, _.toLower);

const fastifyMethodOverride = (fastify, opts, next) => {
  const allowMethods = new Set(['head', 'put', 'delete', 'options', 'patch']);
  const routeMatchers = {};

  fastify.addHook('onRoute', (routeOptions) => {
    const { url, handler } = routeOptions;
    const method = getMethod(routeOptions, 'method');

    if (allowMethods.has(method)) {
      _.update(routeMatchers, _.toLower(method), (methodHandlers = []) => methodHandlers.concat({
        check: match(url),
        handler,
      }));
    }
  });

  fastify.addHook('preHandler', async (req, reply) => {
    const url = _.get(req, 'raw.url');
    const originalMethod = getMethod(req, 'raw.method');
    const method = getMethod(req, 'body._method');

    if (originalMethod === 'post' && allowMethods.has(method)) {
      const { handler } = _.get(routeMatchers, method).find(({ check }) => check(url)) || {};

      if (!handler) {
        const message = `Route ${_.toUpper(method)}:${url} not found`;
        throw new NotFound(message);
      }

      _.set(req, 'raw.method', _.toUpper(method));
      await handler(req, reply);
    }
  });

  next();
};

export default fp(fastifyMethodOverride, {
  fastify: '>=2.0.0',
  name: 'fastify-method-override',
});
