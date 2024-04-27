const http = require("http");
const receive = require("./receiver");
const sender = require("./sender");

//If you're reading this, the frontend is unstyled. I am sorry.

const server = http.createServer((req, res) => {
  if (req.method === "POST" && req.url === "/upload") {
    // Call the receive function to handle file upload
    receive(req, (err, result) => {
      if (err) {
        res.writeHead(500, { "Content-Type": "application/json" });
        res.end(JSON.stringify(err));
      } else {
        sender(result.result.fileName, (statusCode, responseData) => {
          if (statusCode === 200) {
            res.writeHead(200, { "Content-Type": "application/json" });
            res.end(JSON.stringify({ message: "File upload success" }));
          } else {
            res.writeHead(statusCode, { "Content-Type": "application/json" });
            // res.end(JSON.stringify(responseData));
          }
        });
      }
    });
  } else {
    res.writeHead(404, { "Content-Type": "application/json" });
    res.end(JSON.stringify({ error: "Not found" }));
  }
});
const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});
