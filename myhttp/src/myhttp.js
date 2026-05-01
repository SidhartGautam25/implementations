import net from "net";

const myHttp = {
  createServer: (requestHandler) => {
    // 1. Create a raw TCP Server
    return net.createServer((socket) => {
      socket.on("data", (rawBuffer) => {
        console.log("Received raw data from client:");
        console.log(rawBuffer);
        console.log("----");
        const rawRequest = rawBuffer.toString();
        console.log("Raw Request:\n", rawRequest);
        console.log("----");

        // 2. THE PARSER: Convert raw string to a 'req' object
        // HTTP format: "METHOD PATH VERSION" followed by headers
        const lines = rawRequest.split("\r\n");
        console.log("Parsed Lines:\n", lines);
        console.log("----");
        const [method, path, version] = lines[0].split(" ");
        console.log(
          `Parsed Request Line: Method=${method}, Path=${path}, Version=${version}`,
        );

        const req = {
          method,
          path,
          version,
          headers: lines.slice(1).reduce((acc, line) => {
            const [key, value] = line.split(": ");
            if (key) acc[key.toLowerCase()] = value;
            return acc;
          }, {}),
        };

        // 3. THE RESPONSE ABSTRACTION: Helper to format the output
        const res = {
          send: (body, status = 200) => {
            const response =
              `HTTP/1.1 ${status} OK\r\n` +
              `Content-Type: text/plain\r\n` +
              `Content-Length: ${body.length}\r\n` +
              `Connection: close\r\n` + // Tell the browser to close the TCP socket
              `\r\n` +
              `${body}`;

            socket.write(response);
            socket.end(); // Close the TCP connection
          },
        };

        // 4. Pass our custom objects to the user's function
        requestHandler(req, res);
      });
    });
  },
};

export default myHttp;
