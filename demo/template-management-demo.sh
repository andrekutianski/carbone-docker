#!/bin/sh

# Template Management Demo Script
# This demonstrates how to use the /template endpoints

URL=localhost:3030
USERNAME=demo
PASSWORD=demo

echo "=== Carbone Template Management Demo ==="
echo

# Upload a template
echo "1. Uploading template to Carbone..."
curl -u ${USERNAME}:${PASSWORD} \
  -F "template=@template.odt" \
  -F "fileId=my-invoice-template.odt" \
  ${URL}/template

echo
echo

# List all templates
echo "2. Listing all stored templates..."
curl -u ${USERNAME}:${PASSWORD} \
  ${URL}/template

echo
echo

# You can now use the stored template by referencing its fileId
# (Note: Current /render endpoint requires file upload, but templates are stored for future use)

echo "3. Template stored successfully!"
echo "   Templates are stored in Carbone's template directory and can be managed via the API."
echo

# To delete a template:
# curl -u ${USERNAME}:${PASSWORD} -X DELETE ${URL}/template/my-invoice-template.odt
