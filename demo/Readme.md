# Demo Data for Carbone Rendering Server

## Randomly Generate Data

- requires Node.js
- creates sufficient amounts of random data to fill multiple pages of an invoice template
- run with `node create-test-data.js`
- creates two files with identical data:
  - _testdata.json_: human-readable, formatted JSON
  - _testdata.min.json_: compact data for submission with API requests

## Request Demo with cURL

- requires cURL CLI
- create test data beforehand
- run with `sh request-with-curl.sh`
- submits _testdata.min.json_ and _template.odt_ to a running API server
- creates _invoice.pdf_

## Template Management Demo

- requires cURL CLI
- run with `sh template-management-demo.sh`
- demonstrates uploading and listing templates via the `/template` API
- shows how to manage templates stored in Carbone
