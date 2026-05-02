in this version we will turn our req object into a readable stream
-> so currently our req is an object , which is not a good thing , we will 
   see why it is so and why converting it into an stream will make our http
   a good package 

-> first lets understand this special code 


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

which is just an implementation of stream and even ( or majorly event )
-> so if we write something like 

 req = createRequestStream({
            method,
            url: path,
            httpVersion: version.replace("HTTP/", ""),
            headers,
          });

-> then apart from things we assign or attach to req , it get two more function 
         => on and emit 

-> so instead of creating req as an object we are defining it like the code which we shown
-> now lets understand the code which is diffrent from the previous version 


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

-> so actually we are doing very simple thing , so whenever tcp shares a chunk with us , we are sharing it to
   the user at that very moment using data event , means we are not first storing them in buffer until all the 
   body get stored and then sharing it to users by attaching it to req.body , but now we are sharing it using 
   data event at the moment tcp shares a chunk with us .

-> now lets understand how it makes our http module better 
-> to explain this we will discuss 2 good examples

example 1

-> let say client send a 500mb of file in body 
-> now then our req.body has that file and so that variable becomes heavy 
-> now all these variables are in ram ( it will make the system slow and takes too much of space )
-> now if we make it a stream at each moment we have a small chnk of 500mb , and so variables never 
   become heavy


example 2

-> that is early rejection
-> lets say we want to reject any operation on body whose size is greater than 100mb
-> then if req is an object , and let say we get the file in req.body whose size is 500mb
-> if req is an object then that 500mb file first get stored and then we are rejecting it 

-> but if req is an stream , then the moment all chunk combined size goes beyonf 100mb,
   then at that very moment only we can reject it .