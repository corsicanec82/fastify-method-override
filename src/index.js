/* eslint no-restricted-syntax: ["off", "ForOfStatement"] */

import fp from 'fastify-plugin';
import _ from 'lodash';
import { NotFound } from 'http-errors';
import { match } from 'path-to-regexp';

const getMethod = _.flow(_.get, _.toLower);

const getHooks = (routeOptions, hookName) => {
  const hook = _.get(routeOptions, hookName, []);
  return _.isArray(hook) ? hook : [hook];
};

const hooksTable = ['preValidation', 'preHandler'];

const getAllHooks = (routeOptions) => hooksTable.reduce((acc, hookName) => {
  const hooks = getHooks(routeOptions, hookName);
  return [...acc, ...hooks];
}, []);

const fastifyMethodOverride = async (fastify, opts, next) => {
  const allowMethods = new Set(['head', 'put', 'delete', 'options', 'patch']);
  const routeMatchers = {};

  const handleRedirect = async (req, reply) => {
    const url = _.get(req, 'raw.url');
    const originalMethod = getMethod(req, 'raw.method');
    const method = getMethod(req, 'body._method');

    if (originalMethod === 'post' && allowMethods.has(method)) {
      const route = _.get(routeMatchers, method).find(({ check }) => check(url));
      const { handler, check, hooks } = route || {};

      if (!handler) {
        const message = `Route ${_.toUpper(method)}:${url} not found`;
        throw new NotFound(message);
      }

      const { params } = check(url);
      _.set(req, 'params', { ...params });
      _.set(req, 'raw.method', _.toUpper(method));

      for (const hook of hooks) {
        // eslint-disable-next-line
        await new Promise((resolve, reject) => {
          const maybePromise = hook(req, reply, (err) => {
            if (err) {
              reject(err);
            } else {
              resolve();
            }
          });
          if (_.get(maybePromise, 'constructor.name') === 'Promise') {
            maybePromise
              .then(() => {
                resolve();
              })
              .catch((err) => {
                reject(err);
              });
          }
        });
      }

      await handler(req, reply);
    }
  };

  fastify.addHook('onRoute', (routeOptions) => {
    const { url, handler } = routeOptions;
    const method = getMethod(routeOptions, 'method');

    if (allowMethods.has(method)) {
      const hooks = getAllHooks(routeOptions);
      _.update(routeMatchers, _.toLower(method), (methodHandlers = []) => methodHandlers.concat({
        check: match(url),
        handler,
        hooks,
      }));
    }

    if (_.toLower(routeOptions.method) === 'post') {
      const preHandlers = getHooks(routeOptions, 'preHandler');
      _.set(routeOptions, 'preHandler', [handleRedirect, ...preHandlers]);
    }
  });

  fastify.setNotFoundHandler({
    preHandler: async (req, reply, done) => {
      await handleRedirect(req, reply, done);
    },
  });

  next();
};

export default fp(fastifyMethodOverride, {
  fastify: '>=2.0.0',
  name: 'fastify-method-override',
});
