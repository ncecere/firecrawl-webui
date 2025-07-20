SCRAPE API INFO:

Scrape a single URL and optionally extract information using an LLM

curl --request POST \
  --url https://api.firecrawl.dev/v1/scrape \
  --header 'Authorization: Bearer <token>' \
  --header 'Content-Type: application/json' \
  --data '{
  "url": "<string>",
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
  },
  "zeroDataRetention": false
}'

200
{
  "success": true,
  "data": {
    "markdown": "<string>",
    "html": "<string>",
    "rawHtml": "<string>",
    "screenshot": "<string>",
    "links": [
      "<string>"
    ],
    "actions": {
      "screenshots": [
        "<string>"
      ],
      "scrapes": [
        {
          "url": "<string>",
          "html": "<string>"
        }
      ],
      "javascriptReturns": [
        {
          "type": "<string>",
          "value": "<any>"
        }
      ],
      "pdfs": [
        "<string>"
      ]
    },
    "metadata": {
      "title": "<string>",
      "description": "<string>",
      "language": "<string>",
      "sourceURL": "<string>",
      "<any other metadata> ": "<string>",
      "statusCode": 123,
      "error": "<string>"
    },
    "llm_extraction": {},
    "warning": "<string>",
    "changeTracking": {
      "previousScrapeAt": "2023-11-07T05:31:56Z",
      "changeStatus": "new",
      "visibility": "visible",
      "diff": "<string>",
      "json": {}
    }
  }
}

429:
{
  "error": "Request rate limit exceeded. Please wait and try again later."
}

500:

{
  "error": "An unexpected error occurred on the server."
}

Scrape multiple URLs and optionally extract information using an LLM


curl --request POST \
  --url https://api.firecrawl.dev/v1/batch/scrape \
  --header 'Authorization: Bearer <token>' \
  --header 'Content-Type: application/json' \
  --data '{
  "urls": [
    "<string>"
  ],
  "webhook": {
    "url": "<string>",
    "headers": {},
    "metadata": {},
    "events": [
      "completed"
    ]
  },
  "maxConcurrency": 123,
  "ignoreInvalidURLs": false,
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
  },
  "zeroDataRetention": false
}'

200:

{
  "success": true,
  "id": "<string>",
  "url": "<string>",
  "invalidURLs": [
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

Get the status of a batch scrape job


curl --request GET \
  --url https://api.firecrawl.dev/v1/batch/scrape/{id} \
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

Cancel a batch scrape job


curl --request DELETE \
  --url https://api.firecrawl.dev/v1/batch/scrape/{id} \
  --header 'Authorization: Bearer <token>'


200:
{
  "success": true,
  "message": "Batch scrape job successfully cancelled."
}

429:

{
  "error": "Request rate limit exceeded. Please wait and try again later."
}

500:

{
  "error": "An unexpected error occurred on the server."
}

Get the errors of a batch scrape job


curl --request GET \
  --url https://api.firecrawl.dev/v1/batch/scrape/{id}/errors \
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