// This serverless function was intentionally disabled.

// Reason: the backend lives in `server/` and should be deployed as a standalone
// service (recommended). Keeping an Express wrapper under `client/api` is
// fragile in a client-only Vercel project because the sibling `server/` folder
// may not be included in the build, which leads to missing routes, 404s, and
// CORS errors from the browser. To avoid accidental invocation, this file now
// returns a clear 410 response explaining how to use the backend.

module.exports = (req, res) => {
  res.status(410).json({
    status: "disabled",
    message:
      "This serverless wrapper was disabled. Deploy the server/ app separately and set NEXT_PUBLIC_API_URL in the frontend.",
  });
};
