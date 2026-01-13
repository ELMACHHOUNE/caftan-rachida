// DEPRECATED: serverless wrapper removed.
// This file previously wrapped the Express app for serverless deployments.
// Keep a tiny fallback handler that returns a clear 410 response so that
// accidental calls to the old function endpoint surface a helpful message.

module.exports = (req, res) => {
  res.status(410).json({
    status: "error",
    message:
      "Legacy serverless wrapper removed. Deploy the `server/` application separately and point your frontend to its base URL (set NEXT_PUBLIC_API_URL).",
    docs: "https://your-repo/README.md#deployment",
  });
};
