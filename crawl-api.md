CRAWL API INFO:

Crawl multiple URLs based on options

curl --request POST \
  --url https://api.firecrawl.dev/v1/crawl \
  --header 'Authorization: Bearer <token>' \
  --header 'Content-Type: application/json' \
  --data '{
  "url": "<string>",
  "excludePaths": [
    "<string>"
  ],
  "includePaths": [
    "<string>"
  ],
  "maxDepth": 10,
  "maxDiscoveryDepth": 123,
  "ignoreSitemap": false,
  "ignoreQueryParameters": false,
  "limit": 10000,
  "allowBackwardLinks": false,
  "crawlEntireDomain": false,
  "allowExternalLinks": false,
  "allowSubdomains": false,
  "delay": 123,
  "maxConcurrency": 123,
  "webhook": {
    "url": "<string>",
    "headers": {},
    "metadata": {},
    "events": [
      "completed"
    ]
  },
  "scrapeOptions": {
    "onlyMainContent": true,
    "includeTags": [
      "<string>"
    ],
    "excludeTags": [
      "<string>"
    ],
    "maxAge": 0,
    "headers": {},
    "waitFor": 0,
    "mobile": false,
    "skipTlsVerification": false,
    "timeout": 30000,
    "parsePDF": true,
    "jsonOptions": {
      "schema": {},
      "systemPrompt": "<string>",
      "prompt": "<string>"
    },
    "actions": [
      {
        "type": "wait",
        "milliseconds": 2,
        "selector": "#my-element"
      }
    ],
    "location": {
      "country": "US",
      "languages": [
        "en-US"
      ]
    },
    "removeBase64Images": true,
    "blockAds": true,
    "proxy": "basic",
    "storeInCache": true,
    "formats": [
      "markdown"
    ],
    "changeTrackingOptions": {
      "modes": [
        "git-diff"
      ],
      "schema": {},
      "prompt": "<string>",
      "tag": null
    }
  },
  "zeroDataRetention": false
}'

200:

{
  "success": true,
  "id": "<string>",
  "url": "<string>"
}

429:

{
  "error": "Request rate limit exceeded. Please wait and try again later."
}

500:

{
  "error": "An unexpected error occurred on the server."
}

Get the status of a crawl job


curl --request GET \
  --url https://api.firecrawl.dev/v1/crawl/{id} \
  --header 'Authorization: Bearer <token>'

200:

{
  "status": "<string>",
  "total": 123,
  "completed": 123,
  "creditsUsed": 123,
  "expiresAt": "2023-11-07T05:31:56Z",
  "next": "<string>",
  "data": [
    {
      "markdown": "<string>",
      "html": "<string>",
      "rawHtml": "<string>",
      "links": [
        "<string>"
      ],
      "screenshot": "<string>",
      "metadata": {
        "title": "<string>",
        "description": "<string>",
        "language": "<string>",
        "sourceURL": "<string>",
        "<any other metadata> ": "<string>",
        "statusCode": 123,
        "error": "<string>"
      }
    }
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

Cancel a crawl job


curl --request DELETE \
  --url https://api.firecrawl.dev/v1/crawl/{id} \
  --header 'Authorization: Bearer <token>'


200:
{
  "status": "cancelled"
}

429:

{
  "error": "Request rate limit exceeded. Please wait and try again later."
}

500:

{
  "error": "An unexpected error occurred on the server."
}

Get the errors of a crawl job


curl --request GET \
  --url https://api.firecrawl.dev/v1/crawl/{id}/errors \
  --header 'Authorization: Bearer <token>'

200:

{
  "errors": [
    {
      "id": "<string>",
      "timestamp": "<string>",
      "url": "<string>",
      "error": "<string>"
    }
  ],
  "robotsBlocked": [
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

Get all active crawls for the authenticated team


curl --request GET \
  --url https://api.firecrawl.dev/v1/crawl/active \
  --header 'Authorization: Bearer <token>'

200:

{
  "success": true,
  "crawls": [
    {
      "id": "3c90c3cc-0d44-4b50-8888-8dd25736052a",
      "teamId": "<string>",
      "url": "<string>",
      "options": {
        "scrapeOptions": {
          "onlyMainContent": true,
          "includeTags": [
            "<string>"
          ],
          "excludeTags": [
            "<string>"
          ],
          "maxAge": 0,
          "headers": {},
          "waitFor": 0,
          "mobile": false,
          "skipTlsVerification": false,
          "timeout": 30000,
          "parsePDF": true,
          "jsonOptions": {
            "schema": {},
            "systemPrompt": "<string>",
            "prompt": "<string>"
          },
          "actions": [
            {
              "type": "wait",
              "milliseconds": 2,
              "selector": "#my-element"
            }
          ],
          "location": {
            "country": "US",
            "languages": [
              "en-US"
            ]
          },
          "removeBase64Images": true,
          "blockAds": true,
          "proxy": "basic",
          "storeInCache": true,
          "formats": [
            "markdown"
          ],
          "changeTrackingOptions": {
            "modes": [
              "git-diff"
            ],
            "schema": {},
            "prompt": "<string>",
            "tag": null
          }
        }
      }
    }
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