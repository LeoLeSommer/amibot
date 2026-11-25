GET {{base_url}}/health
Origin: http://localhost:8081
HTTP 200
[Asserts]
header "Access-Control-Allow-Origin" == "http://localhost:8081"
header "Access-Control-Allow-Credentials" == "true"

OPTIONS {{base_url}}/api/v1/app/manifest
Origin: http://localhost:8081
Access-Control-Request-Method: GET
Access-Control-Request-Headers: x-client-api-version
HTTP 200
[Asserts]
header "Access-Control-Allow-Origin" == "http://localhost:8081"
header "Access-Control-Allow-Credentials" == "true"
header "Access-Control-Allow-Methods" contains "GET"
header "Access-Control-Allow-Headers" contains "x-client-api-version"
