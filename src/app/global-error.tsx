'use client';

export default function GlobalError({
  error: _error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <html>
      <body style={{ fontFamily: 'sans-serif', padding: 40 }}>
        <h2>Something went wrong.</h2>
        <button onClick={reset}>Try again</button>
      </body>
    </html>
  );
}
