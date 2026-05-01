-> myHttp is an object which we are exporting
-> currently this object is returning only one function -> createServer
-> this createServer is taking requestHandler function as its only argument 
-> this function is returning net.createServer()
-> on getting some data , we are doing few things
-> creating req and res object 
-> then calling requestHandler and passing req and res object
-> this req object is just key value pairs of info which comes in rawBuffer
-> first we are converting that rawBuffer into string
-> after that we know each line of rawBuffer is separted by \r\n , 
-> so we are making a array named lines which has all the line now 
-> first line in that array is special as it has method , path and version information
-> remaing line we are converting in key value pairs and putting them in a object named header

-> res object is also important 
-> we are making a send property which is a function which is just writing to the socket and ending
   the request