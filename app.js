// Phusion Passenger entry point for Next.js on cPanel "Setup Node.js App".
// Passenger sets process.env.PORT and process.env.PASSENGER_BASE_URI.
// Make sure you've run `npm run build` before starting this process.

const { createServer } = require("http");
const next = require("next");

const port = parseInt(process.env.PORT, 10) || 3000;
const hostname = process.env.HOSTNAME || "127.0.0.1";

const app = next({ dev: false, hostname, port });
const handle = app.getRequestHandler();

app
  .prepare()
  .then(() => {
    createServer((req, res) => handle(req, res)).listen(port, () => {
      // eslint-disable-next-line no-console
      console.log(`Next.js ready on http://${hostname}:${port}`);
    });
  })
  .catch((err) => {
    // eslint-disable-next-line no-console
    console.error("Failed to start Next.js:", err);
    process.exit(1);
  });
