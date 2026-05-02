import net from "net";

function createRequestStream(meta) {
  const listeners = {};

  return {
    ...meta,

    on(event, handler) {
      listeners[event] = listeners[event] || [];
      listeners[event].push(handler);
    },

    emit(event, data) {
      (listeners[event] || []).forEach((fn) => fn(data));
    },
  };
}

const myHttp = {
  createServer: (requestListener) => {
    return net.createServer((socket) => {
      let buffer = "";
      let headersParsed = false;
      let req = null;
      let contentLength = 0;
      let receivedLength = 0;

      socket.on("data", (chunk) => {
        buffer += chunk.toString();

        // 🔹 Step 1: Parse headers
        if (!headersParsed && buffer.includes("\r\n\r\n")) {
          const [headerPart, rest] = buffer.split("\r\n\r\n");

          const lines = headerPart.split("\r\n");
          const [method, path, version] = lines[0].split(" ");

          const headers = lines.slice(1).reduce((acc, line) => {
            const [key, value] = line.split(": ");
            if (key) acc[key.toLowerCase()] = value;
            return acc;
          }, {});

          contentLength = parseInt(headers["content-length"] || "0");

          req = createRequestStream({
            method,
            url: path,
            httpVersion: version.replace("HTTP/", ""),
            headers,
          });

          buffer = rest;
          headersParsed = true;

          // 🔹 Create response
          const res = {
            write: (chunk) => socket.write(chunk),
            end: (data = "") => {
              if (data) socket.write(data);
              socket.end();
            },
            writeHead: (statusCode, headers = {}) => {
              let response = `HTTP/1.1 ${statusCode} OK\r\n`;
              for (const key in headers) {
                response += `${key}: ${headers[key]}\r\n`;
              }
              response += "\r\n";
              socket.write(response);
            },
          };

          requestListener(req, res);
        }

        // 🔹 Step 2: Stream body
        if (headersParsed && req) {
          while (buffer.length > 0 && receivedLength < contentLength) {
            const remaining = contentLength - receivedLength;
            const chunkToSend = buffer.slice(0, remaining);

            req.emit("data", chunkToSend);

            receivedLength += chunkToSend.length;
            buffer = buffer.slice(chunkToSend.length);
          }

          // 🔹 Step 3: End event
          if (receivedLength >= contentLength) {
            req.emit("end");

            // Reset for next request (basic)
            buffer = "";
            headersParsed = false;
            req = null;
            contentLength = 0;
            receivedLength = 0;
          }
        }
      });
    });
  },
};

export default myHttp;
