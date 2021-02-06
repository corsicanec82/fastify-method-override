# fastify-method-override

[![github action status](https://github.com/corsicanec82/fastify-method-override/workflows/Node%20CI/badge.svg)](https://github.com/corsicanec82/fastify-method-override/actions)
[![Codacy Badge](https://api.codacy.com/project/badge/Grade/c0c97dff8bda4e288123f08b3bd45fe7)](https://www.codacy.com/manual/corsicanec82/fastify-method-override?utm_source=github.com&amp;utm_medium=referral&amp;utm_content=corsicanec82/fastify-method-override&amp;utm_campaign=Badge_Grade)
[![test coverage](https://codecov.io/gh/corsicanec82/fastify-method-override/branch/master/graph/badge.svg)](https://codecov.io/gh/corsicanec82/fastify-method-override)
[![npm version](https://badge.fury.io/js/fastify-method-override.svg)](https://badge.fury.io/js/fastify-method-override)

Plugin for [Fastify](http://fastify.io/), which allows use HTTP verbs, such as DELETE, PATCH, HEAD, PUT, OPTIONS in case the client doesn't support them. Supports Fastify versions `>=2.0.0`.

## Install

```sh
$ npm install fastify-method-override
```

## Usage

``` javascript
import fastify from 'fastify';
import fastifyMethodOverride from 'fastify-method-override';

const app = fastify();

app.register(fastifyMethodOverride);
```

To override the HTTP method, use the HTML form with the hidden _method field and the value of the target method:

```html
<form method="POST" action="/url">
  <input type="hidden" name="_method" value="DELETE">
  <input type="submit" value="Submit">
</form>
```

### Note

If you use setNotFoundHandler, the plugin may not work correctly. In order to override the standard 404 error handler, you must use setErrorHandler.

If you are having trouble using the plugin, you can use the [`fastify-method-override-wrapper`](https://github.com/corsicanec82/fastify-method-override-wrapper) library.
