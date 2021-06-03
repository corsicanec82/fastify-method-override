/* eslint no-restricted-syntax: ["off", "ForOfStatement"] */

import fp from 'fastify-plugin';
import _ from 'lodash';
import { NotFound } from 'http-errors';
import { match } from 'path-to-regexp';
import path from 'path';

const getMethod = _.flow(_.get, _.toLower);

const getHooks = (routeOptions, hookName) => {
  const hook = _.get(routeOptions, hookName, []);
  return _.isArray(hook) ? hook : [hook];
};

const hooksTable = ['preValidation', 'preHandler'];

const getAllHooks = (routeOptions) => _.flatMap(
  hooksTable,
  (hookName) => getHooks(routeOptions, hookName),
);

const fastifyMethodOverride = async (fastify, opts, next) => {
  const allowMethods = new Set(['head', 'put', 'delete', 'options', 'patch']);
  const routeMatchers = {};

  const handleRedirect = async (req, reply) => {
    const url = _.get(req, 'raw.url');
    const originalMethod = getMethod(req, 'raw.method');
    const method = getMethod(req, 'body._method');

    if (originalMethod === 'post' && allowMethods.has(method)) {
      const route = _.get(routeMatchers, method).find(({ check }) => check(url));
      const {
        handler, check, hooks, config,
      } = route || {};

      _.set(reply, 'context.config', config);

      if (!handler) {
        const message = `Route ${_.toUpper(method)}:${url} not found`;
        throw new NotFound(message);
      }

      const { params } = check(url);
      const baseParams = _.has(params, 'unnamedParams')
        ? { '*': params.unnamedParams.join(path.sep) }
        : {};
      _.set(req, 'params', { ...baseParams, ..._.omit(params, 'unnamedParams') });
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
        if (reply.sent) {
          return;
        }
      }

      await handler(req, reply);
    }
  };

  fastify.addHook('onRoute', (routeOptions) => {
    const { url, handler, config } = routeOptions;
    const method = getMethod(routeOptions, 'method');

    if (allowMethods.has(method)) {
      const hooks = getAllHooks(routeOptions);
      _.update(routeMatchers, _.toLower(method), (methodHandlers = []) => methodHandlers.concat({
        check: match(url.replace(/\*.*/, ':unnamedParams*')),
        handler,
        hooks,
        config,
      }));
    }

    if (_.toLower(routeOptions.method) === 'post') {
      const preHandlers = getHooks(routeOptions, 'preHandler');
      _.set(routeOptions, 'preHandler', [handleRedirect, ...preHandlers]);
    }
  });

  fastify.setNotFoundHandler({
    preHandler: async (req, reply) => {
      await handleRedirect(req, reply);
    },
  });

  next();
};

export default fp(fastifyMethodOverride, {
  fastify: '>=2.0.0',
  name: 'fastify-method-override',
});
