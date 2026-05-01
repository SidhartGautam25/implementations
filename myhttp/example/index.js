import myHttp from "../src/myhttp.js";

const server = myHttp.createServer((req, res) => {
  console.log(`Received a ${req.method} request for ${req.path}`);

  if (req.path === "/") {
    res.send("Welcome to my DIY HTTP Server!");
  } else if (req.path === "/about") {
    res.send("This server is running on raw TCP sockets.");
  } else {
    res.send("404 Not Found", 404);
  }
});

server.listen(3000, () => {
  console.log("DIY Server listening on port 3000");
});
