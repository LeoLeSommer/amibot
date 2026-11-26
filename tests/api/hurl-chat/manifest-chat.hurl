GET {{base_url}}/api/v1/app/manifest
HTTP 200
[Asserts]
header "Content-Type" contains "application/json"
header "Cache-Control" == "no-store"
jsonpath "$.api_version" == 1
jsonpath "$.server.name" == "Amibot E2E"
jsonpath "$.modules" count == 1
jsonpath "$.modules[0].id" == "amibot_chat"
jsonpath "$.modules[0].name" == "Chat"
jsonpath "$.capabilities" count == 1
jsonpath "$.capabilities[0].id" == "chat.messages"
jsonpath "$.ui.slots['app.main'][0].component" == "ChatPanel"
