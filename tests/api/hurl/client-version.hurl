GET {{base_url}}/api/v1/app/manifest
HTTP 200

GET {{base_url}}/api/v1/app/manifest
X-Client-Api-Version: 1
HTTP 200

GET {{base_url}}/api/v1/app/manifest
X-Client-Api-Version: 0
HTTP 426
[Asserts]
header "Content-Type" contains "application/json"
jsonpath "$.code" == "client_update_required"
jsonpath "$.min_client_api_version" == 1

GET {{base_url}}/api/v1/app/manifest
X-Client-Api-Version: abc
HTTP 400
[Asserts]
jsonpath "$.code" == "bad_request"

GET {{base_url}}/api/v1/client-compatibility
X-Client-Api-Version: 0
HTTP 200
[Asserts]
jsonpath "$.min_client_api_version" == 1
