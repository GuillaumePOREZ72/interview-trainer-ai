const http = require("http");
const server = http.createServer((req, res) => {
  res.writeHead(200, { "Content-Type": "text/plain" });
  res.end(
    "Node.js is working correctly on o2switch!\nNode Version: " +
      process.version +
      "\nCWD: " +
      process.cwd(),
  );
});
const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log("Test server running...");
});
