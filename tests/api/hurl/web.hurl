GET {{base_url}}/
HTTP 200
[Asserts]
header "Content-Type" contains "text/html"
body contains "id=\"root\""

GET {{base_url}}/settings
HTTP 200
[Asserts]
header "Content-Type" contains "text/html"
body contains "id=\"root\""

GET {{base_url}}/api/v1/unknown
HTTP 404
[Asserts]
header "Content-Type" contains "application/json"
jsonpath "$.error" == "not found"
body not contains "<html"

GET {{base_url}}/api/v2/app/manifest
HTTP 404
[Asserts]
header "Content-Type" contains "application/json"
jsonpath "$.error" == "not found"
