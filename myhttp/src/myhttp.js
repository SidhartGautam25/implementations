import net from "net";

const myHttp = {
  createServer: (requestListener) => {
    return net.createServer((socket) => {
      let buffer = "";
      let headersParsed = false;
      let req = null;

      socket.on("data", (chunk) => {
        buffer += chunk.toString();

        // Step 1: Parse headers only once
        if (!headersParsed && buffer.includes("\r\n\r\n")) {
          const [headerPart, rest] = buffer.split("\r\n\r\n");

          const lines = headerPart.split("\r\n");
          const [method, path, version] = lines[0].split(" ");

          const headers = lines.slice(1).reduce((acc, line) => {
            const [key, value] = line.split(": ");
            if (key) acc[key.toLowerCase()] = value;
            return acc;
          }, {});

          req = {
            method,
            url: path, // closer to Node.js naming
            httpVersion: version.replace("HTTP/", ""),
            headers,
            body: "",
          };

          buffer = rest; // remaining data is body
          headersParsed = true;
        }

        // Step 2: If headers parsed, collect body
        if (headersParsed && req) {
          const contentLength = parseInt(req.headers["content-length"] || "0");

          // Wait until full body is received
          if (buffer.length >= contentLength) {
            req.body = buffer.slice(0, contentLength);

            // Optional: JSON parsing (still low-level enough)
            if (req.headers["content-type"] === "application/json") {
              try {
                req.body = JSON.parse(req.body);
              } catch {
                // keep raw if parsing fails
              }
            }

            const res = {
              write: (chunk) => socket.write(chunk),
              end: (data = "") => {
                if (data) socket.write(data);
                socket.end();
              },
              setHeader: (key, value) => {
                res.headers = res.headers || {};
                res.headers[key] = value;
              },
              writeHead: (statusCode, headers = {}) => {
                const statusMessage = "OK"; // simplified
                let response = `HTTP/1.1 ${statusCode} ${statusMessage}\r\n`;

                const finalHeaders = { ...(res.headers || {}), ...headers };

                for (const key in finalHeaders) {
                  response += `${key}: ${finalHeaders[key]}\r\n`;
                }

                response += "\r\n";
                socket.write(response);
              },
            };

            requestListener(req, res);

            // Reset for next request (basic, no keep-alive handling yet)
            buffer = "";
            headersParsed = false;
            req = null;
          }
        }
      });
    });
  },
};

export default myHttp;
