const memwatch = require('memwatch-next');
const Agenda = require('agenda');
const stopAgenda = require('stop-agenda');

Agenda.prototype.configure = function(config) {
  this.config = Object.assign(
    {
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
    },
    config
  );
};

Agenda.prototype._start = Agenda.prototype.start;
Agenda.prototype.start = function() {
  this.on('ready', () => {
    // Pending PR #501
    // <https://github.com/agenda/agenda/pull/501>
    this._isReady = true;

    // output debug info
    this.config.logger.info('agenda ready');

    // we cancel jobs here so we don't create duplicates
    // on every time the server restarts, or mongoose reconnects
    // (even though `agenda.every` uses single, just to be safe)
    //
    // note that the core reason we have this is because
    // during development we may remove recurring jobs
    // and define new ones, therefore we don't want the old ones to run
    this.cancel(this.config.stopAgenda.cancelQuery, (err, numRemoved) => {
      // if there was an error then log it and stop agenda
      if (err) {
        this.config.logger.error(err);
        stopAgenda(this, this.config.stopAgenda)
          .then()
          .catch(err => {
            if (err) return this.config.logger.error(err);
            this.config.logger.debug(
              'stopped agenda due to issue with agenda cancel'
            );
          });
        return;
      }

      this.config.logger.debug(`cancelled ${numRemoved} jobs`);

      // Define all of our jobs
      this.config.agendaJobDefinitions.forEach(_job => {
        this.define(..._job);
      });

      // Schedule recurring jobs
      this.config.agendaRecurringJobs.forEach(every => {
        this.every(...every);
      });

      // Start jobs needed to run now
      this.config.agendaBootJobs.forEach(job => {
        this.now(job);
      });

      this._start();
    });
  });

  // Handle events emitted
  this.on('start', job =>
    this.config.logger.debug(`job "${job.attrs.name}" started`)
  );

  this.on('complete', job => {
    this.config.logger.debug(`job "${job.attrs.name}" completed`);
    // Manually handle garbage collection
    // <https://github.com/rschmukler/agenda/issues/129#issuecomment-108057837>
    memwatch.gc();
  });

  this.on('success', job => {
    this.config.logger.debug(`job "${job.attrs.name}" succeeded`);
  });

  this.on('fail', (err, job) => {
    err.message = `job "${job.attrs.name}" failed: ${err.message}`;
    this.config.logger.error(err, { job });
  });

  this.on('error', this.config.logger.error);
};

module.exports = Agenda;
