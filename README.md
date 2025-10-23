# Carbone Docker

Embedded Carbone in a Docker image with simple REST API.

## Authentication

Requests require HTTP Basic Authentication. Username and password must be passed to the server process via the USERNAME and PASSWORD environment variables, otherwise it will exit immedately with a non-zero exit code and, thus, stop the container.

## E-Mail deployment

Generated reports can be sent via E-Mail if the request has a _email_ field with a JSON object. The object can contain the following properties:

- _to: string[]_ - an Array of strings containing email addresses to which the mail is sent. If left out, empty or invalid, no emails will be sent.
- _subject: string_ - used as a subject line on all sent mails
- _text: string_ - used as the plaintext message body on all sent mails

The SMTP client connection can be configured by a set of environment variables:

- _SMTP_HOST_, _SMTP_PORT_ - host and port to connect to
- _SMTP_USER_ - username for SMTP authentication and as sender in messages' _FROM_ field
- _SMTP_PASSWORD_ - password for SMTP authentication
- _SMTP_UNSAFE_: if left undefined or empty (default), will attempt to use TLS encryption.

You can execute `npm run smtp-dummy` to launch a local dummy SMTP server that will log all received mails to standard output.

Executing `local-run.sh` will setup all environment variables to connect to it and launch the API server.

## File Storage

By default, generated files are sent directly to the client. Set the _STORAGE_PATH_ environment variable to a writable location and they will be stored there.

- each file will be content-hashed
- generated files it will be stored as `<STORAGE_PATH>/<hash>/result.pdf`
- files will be retrievable via HTTP GET (authenticated) on `/files/<hash>`
- requests to `/render` will not get the file in the response body. Instead, they will be redirected to the above location (status code 301).

## How to consume exposed API ?

~~The simpliest way to use this image is to use `node` and install [`carbone-connect` package](https://npmjs.org/carbone-connect).~~ We extended the API with authentication, so this doesn't work anymore. :(

## Version Information

This project has been updated to use:
- **Carbone v3.5.6** (upgraded from v2.1.0)
- **Node.js v20** (upgraded from v12)
- **LibreOffice v7.3.7.2** (upgraded from v6.3.3.1)

All custom code has been tested and verified to be compatible with Carbone v3. The API remains backward compatible with existing integrations.

### Dependencies Updated

For security and compatibility, the following dependencies have been updated:
- body-parser, express, lodash, multer, nodemailer, telejson, and supporting libraries

All custom formatter patterns and render operations continue to work as expected.

## From carbone.io website

_Fast, Simple and Powerful report generator in any format PDF, DOCX, XLSX, ODT, PPTX, ODS [, ...]_

_... using your JSON data as input._

See [carbone.io website](https://carbone.io) for full **Carbone** documentation.

