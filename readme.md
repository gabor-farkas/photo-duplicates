# Remove Google Photos duplicates
It's a long story but it happened to me that I moved some of my photo folders and they were re-uploaded by Google Photos, resulting in many photos being duplicated. On my local machine I had a downsized version of many of my photos, so I clearly wanted to keep only the higher resolution (original) ones on Google Photos.

## The quest
No worries, I'm a developer, I can fix this. Google Photos even has an API! Well, I was mistaken just like some PMs and CEOs do: though it indeed has an API, it's functionality is very limited - you cannot actually change anything.

## How this works.
This solution uses the Google Photos API to list photos and analyze them to check for duplicates, and then uses a chrome extension and the Google Photos web interface to click on 'delete' on the selected photos.

To set things up, you need a GCP project, create and API Key and a Web Credential. Create `./apikey.js` with

```js
app = {}
app.apiKey = "<<API KEY>>"
app.clientId = "<<CLIENT ID>>"
```

In the client credential, specify `http://localhost:8000` or 8080 as an authorized origin and callback url. This is required for the API authentication to work.

In `index.html` you can specify `dateFilter`.

You need to install the './extension' as an unpacked extension in chrome.

You then open up a local web server, open up `http://localhost:8080`. It will list the photos it identifies as removable duplicates. You can manuall check them to verify. Once you're comfortable, you can click 'Start'. This will redirect the page to Google Photos and will keep iterating on your photos, deleting the files identified in the first step. It might sometimes stop, you can just reload localhost and start over.

Make sure to disable/uninstall the extension once done.

Caveats: the evaluation logic that you can find in `processResponse` can easily be problematic. For example it just compares the widths, but if the image is rotated for example it can easily consider the larger picture to be the smaller one. Also note that I personally used a `*_small.jpg` naming pattern for resized images stored on my computer and these variants are also identified as duplicates.

`./extension/content.js` hardcodes the element identifiers for the 'Trash' buttons, it might need to be updated as the Google Photos frontend evolves.