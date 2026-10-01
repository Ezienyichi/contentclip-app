import * as Sentry from '@sentry/nextjs';

Sentry.init({
  dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,
  tracesSampleRate: 0.1,
  environment: process.env.NODE_ENV,
  beforeSend(event) {
    if (event.request) {
      delete event.request.cookies;
      delete event.request.query_string;
      const h = event.request.headers;
      if (h) {
        delete h['authorization'];
        delete h['cookie'];
        delete h['set-cookie'];
      }
    }
    return event;
  },
});
