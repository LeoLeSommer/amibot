GET {{base_url}}/api/v1/chat/models
HTTP 200
[Asserts]
header "Content-Type" contains "application/json"
header "Cache-Control" == "no-store"
jsonpath "$.models" count == 2
jsonpath "$.models[0].id" == "glm-5.3-flash"
jsonpath "$.models[1].id" == "glm-5.3"
jsonpath "$.default_model" == "glm-5.3-flash"

POST {{base_url}}/api/v1/chat
{}
HTTP 400
[Asserts]
header "Content-Type" contains "application/json"
jsonpath "$.code" == "bad_request"

POST {{base_url}}/api/v1/chat
{
  "messages": [{ "role": "user", "content": "hello" }]
}
HTTP 503
[Asserts]
header "Content-Type" contains "application/json"
jsonpath "$.code" == "chat_not_configured"
