# fastify-method-override

[![Maintainability](https://api.codeclimate.com/v1/badges/21cf5772520dd80e1f7a/maintainability)](https://codeclimate.com/github/corsicanec82/fastify-method-override/maintainability)
[![Test Coverage](https://api.codeclimate.com/v1/badges/21cf5772520dd80e1f7a/test_coverage)](https://codeclimate.com/github/corsicanec82/fastify-method-override/test_coverage)
[![Build Status](https://travis-ci.org/corsicanec82/fastify-method-override.svg?branch=master)](https://travis-ci.org/corsicanec82/fastify-method-override)
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

To override the HTTP method, use the HTML form with the hidden _metod field and the value of the target method:

```html
<form method="POST" action="/url">
  <input type="hidden" name="_method" value="DELETE">
  <button type="submit">Submit</button>
</form>
```
