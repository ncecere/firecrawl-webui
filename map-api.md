MAP API Info:

Map multiple URLs based on options


curl --request POST \
  --url https://api.firecrawl.dev/v1/map \
  --header 'Authorization: Bearer <token>' \
  --header 'Content-Type: application/json' \
  --data '{
  "url": "<string>",
  "search": "<string>",
  "ignoreSitemap": true,
  "sitemapOnly": false,
  "includeSubdomains": true,
  "limit": 5000,
  "timeout": 123
}'

200:

{
  "success": true,
  "links": [
    "<string>"
  ]
}

429:
{
  "error": "Request rate limit exceeded. Please wait and try again later."
}

500:
{
  "error": "An unexpected error occurred on the server."
}