# XXE Enum
Enumerate and exfiltrate files via out of band XXE, for situations where resolved entity is not displayed in the response, and directory listing is not available.

You can give it a list of directories to enumerate, and it will use XXE to get those data back to your C2.

It can automatically base64 decode exfiltrated content

## Files
**server.js**

This is your C2 server. It serves additional external dtd (send.dtd) as well as receiving files exfiltrated from victim. By default, it runs on port 8000, but configurable in the file.

If the file exfiltrated is in base64 encoded format (e.g. via php://filter), it can base64 decode it as well. Indicate whether the expected exfil'd data would be in base64 via the is_base64 flag in the file.

**client.js**

This is the attack script. Configure a wordlist to use, the target URL, your C2 URL (where server.js is run), and base file path (e.g. php://filter or file:///) to get started.

Optional configuration include: proxy, the XML in a normal request

## TODO
- https proxy not working. Only http proxy atm