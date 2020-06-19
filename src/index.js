/* eslint no-restricted-syntax: ["off", "ForOfStatement"] */

import fp from 'fastify-plugin';
import _ from 'lodash';
import { NotFound } from 'http-errors';
import { match } from 'path-to-regexp';
import async from 'async';

const getMethod = _.flow(_.get, _.toLower);

const getPreHandlers = (routeOptions) => {
  const preHandler = _.get(routeOptions, 'preHandler', []);
  const preHandlers = _.isArray(preHandler) ? preHandler : [preHandler];
  return preHandlers;
};

const fastifyMethodOverride = (fastify, opts, next) => {
  const allowMethods = new Set(['head', 'put', 'delete', 'options', 'patch']);
  const routeMatchers = {};

  const handleRedirect = async (req, reply, done) => {
    const url = _.get(req, 'raw.url');
    const originalMethod = getMethod(req, 'raw.method');
    const method = getMethod(req, 'body._method');

    if (originalMethod === 'post' && allowMethods.has(method)) {
      const route = _.get(routeMatchers, method).find(({ check }) => check(url));
      const { handler, check, preHandlers } = route || {};

      if (!handler) {
        const message = `Route ${_.toUpper(method)}:${url} not found`;
        throw new NotFound(message);
      }

      const { params } = check(url);
      _.set(req, 'params', { ...params });
      _.set(req, 'raw.method', _.toUpper(method));

      await async.each(preHandlers, async (preHandler) => {
        await preHandler(req, reply, done);
      });

      await handler(req, reply);
    }
  };

  fastify.addHook('onRoute', (routeOptions) => {
    const { url, handler } = routeOptions;
    const method = getMethod(routeOptions, 'method');
    const preHandlers = getPreHandlers(routeOptions);

    if (allowMethods.has(method)) {
      _.update(routeMatchers, _.toLower(method), (methodHandlers = []) => methodHandlers.concat({
        check: match(url),
        handler,
        preHandlers,
      }));
    }

    if (_.toLower(routeOptions.method) === 'post') {
      _.set(routeOptions, 'preHandler', [handleRedirect, ...preHandlers]);
    }
  });

  fastify.setNotFoundHandler(handleRedirect);

  next();
};

export default fp(fastifyMethodOverride, {
  fastify: '>=2.0.0',
  name: 'fastify-method-override',
});
