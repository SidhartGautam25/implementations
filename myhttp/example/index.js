import myHttp from "../src/myhttp.js";

const server = myHttp.createServer((req, res) => {
  let body = "";

  req.on("data", (chunk) => {
    body += chunk;
  });

  req.on("end", () => {
    res.writeHead(200, { "Content-Type": "application/json" });
    res.end(JSON.stringify({ received: body }));
  });
});

server.listen(3000, () => {
  console.log("DIY Server listening on port 3000");
});
