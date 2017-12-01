# [**@ladjs/agenda**](https://github.com/ladjs/agenda)

[![build status](https://img.shields.io/travis/ladjs/agenda.svg)](https://travis-ci.org/ladjs/agenda)
[![code coverage](https://img.shields.io/codecov/c/github/ladjs/agenda.svg)](https://codecov.io/gh/ladjs/agenda)
[![code style](https://img.shields.io/badge/code_style-XO-5ed9c7.svg)](https://github.com/sindresorhus/xo)
[![styled with prettier](https://img.shields.io/badge/styled_with-prettier-ff69b4.svg)](https://github.com/prettier/prettier)
[![made with lass](https://img.shields.io/badge/made_with-lass-95CC28.svg)](https://lass.js.org)
[![license](https://img.shields.io/github/license/ladjs/agenda.svg)](LICENSE)

> Agenda for Lad


## Table of Contents

* [Install](#install)
* [Usage](#usage)
* [Contributors](#contributors)
* [License](#license)


## Install

[npm][]:

```sh
npm install @ladjs/agenda
```

[yarn][]:

```sh
yarn add @ladjs/agenda
```


## Usage

This package serves as a drop-in replacement for a normal Agenda `require()` call. It carries the same exact API and returns the same Agenda instance that it normally would (except it adds some extra glue on top, such as built-in integration of [stop-agenda][]).

> Default options are shown below:

```js
#!/usr/bin/env node
const Agenda = require('@ladjs/agenda');
const mongoose = require('@ladjs/mongoose');
const Graceful = require('@ladjs/graceful');

const jobs = require('./jobs');
const { logger } = require('./helpers');
const config = require('./config');

const agenda = new Agenda();
agenda.configure({
  logger: console,
  // these are options passed directly to `stop-agenda`
  // <https://github.com/ladjs/stop-agenda>
  stopAgenda: {
    cancelQuery: {
      repeatInterval: {
        $exists: true,
        $ne: null
      }
    }
  },
  // these are jobs defined via `config.jobs`
  // e.g. `agendaJobDefinitions: [ [name, agendaOptions, fn], ... ]`
  agendaJobDefinitions: [],
  // these get automatically invoked to `agenda.every`
  // e.g. `agenda.every('5 minutes', 'locales')`
  // and you define them as [ interval, job name ]
  // you need to define them here for graceful handling
  // e.g. `agendaRecurringJobs: [ ['5 minutes', 'locales' ], ... ]`
  agendaRecurringJobs: [],
  // these get automatically invoked when process starts
  // e.g. `agenda.now('locales');`
  // and you define them as Strings in the array
  // e.g. `config.now: ['locales','ping','pong','beep', ... ]`
  agendaBootJobs: []
});

mongoose.configure({
  ...config.mongoose,
  logger,
  agenda
});

mongoose
  .connect()
  .then(() => {
    agenda.start();
  })
  .catch(logger.error);

const graceful = new Graceful({
  mongoose,
  agenda,
  logger
});

graceful.listen();
```


## Contributors

| Name           | Website                    |
| -------------- | -------------------------- |
| **Nick Baugh** | <http://niftylettuce.com/> |


## License

[MIT](LICENSE) © [Nick Baugh](http://niftylettuce.com/)


## 

[npm]: https://www.npmjs.com/

[yarn]: https://yarnpkg.com/

[stop-agenda]: https://github.com/ladjs/stop-agenda
