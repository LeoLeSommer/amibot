GET {{base_url}}/api/v1/app/manifest
HTTP 200
[Asserts]
header "Content-Type" contains "application/json"
header "Cache-Control" == "no-store"
jsonpath "$.api_version" == 1
jsonpath "$.core.version" exists
jsonpath "$.server.name" == "Amibot E2E"
jsonpath "$.compatibility.min_client_api_version" == 1
jsonpath "$.modules" count == 0
jsonpath "$.capabilities" count == 0
jsonpath "$.ui.slots" isEmpty
