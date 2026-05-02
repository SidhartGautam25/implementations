Problems

1. right now we are assuming the entire request comes in one data event , but it is not 
   guaranteed
2. multiple chunks may arrive ( like in post request where we have body also )
3. or we recieve partial request 

Ex : let say our request is 

POST /user HTTP/1.1
Content-Length: 18

{"name":"John"}

but tcp might give it us in multiple chunk 

chunk 1 -> "POST /user HTTP/1.1\r\nContent-Len"
chunk 2 -> "gth: 18\r\n\r\n{\"name\":\"Jo"
chunk 3 -> "hn\"}"  

and so we cant start parsing once we recieve chunk 1
we have to wait for other chunk also 

=> other major problem is tcp might do like this also 

"GET /a HTTP/1.1\r\n\r\nGET /b HTTP/1.1\r\n\r\n"

we have two request in one buffer here 
and currently our code will only work for first request or single request only 


since tcp is a stream protocol , we need to handle it like that

-> first we made three variables => headersParsed , req and  buffer 
-> req is for req object , buffer is to store the data we are getting in tcp connection
-> third one is interesting , headersParsed is to know that our headers is parsed or not
-> see , we have two parts now coming from client => header and body 
-> so if the header part of the data is parsed , then we will make  that variable true
-> now lets see the first part of the code 

-----------------------------------------------------------------------------------------

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

--------------------------------------------------------------------------------------------

-> this part is parsing our header we will only execute this part if headersParsed is false 
-> also \r\n\r\n separate header part from body , so if buffer includes it , that means
   our header part is now complete and we are ready to parse it 
-> and then in the code we have parsed it exactly like how we did in the oth version





-> now comes the second part of the code which deals with body part of the data and res object
-> but we can only move to that part when we are sure our header is parsed and hence our req object 
   ready , it is so because we need one detail stored in req object to proceed ahead
   and that is field => content-length , which gives us information about the size of body 
   
-> so this line 

if (headersParsed && req) {

is making sure our header is parsed and second req is ready
-> then we are storing the size of body contentLength variable
-> then we are making sure our buffer size is more than that 
-> one question may arise why checking size equal or more than and not just equal to
-> but the body may contain \r\n like things in end which can may increase its total size

-> after checking all these things , we are ready to work 
-> and the first thhing we did is storing the body thing in req.body
-> also if content-type is application/json ,then we are storing the parsed json of the body

-> after that , we go ahead to prepare our res object , which this time is more powerful now than before
-> as we are adding three function to it -> write , end , setHeader , writeHead
-> write function is doing one simple thing , whatever we are giving it as arg , it is writing it to socket 
-> end is doing same thing , but after writing , it also is ending the request
-> setHeader is also simple , as it is first making a headers object in res , and then attaching key value
   pairs to it whatever user is providing it as arguments 
-> 



