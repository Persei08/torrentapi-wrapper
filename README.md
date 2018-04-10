## This is a re-upload not the initial repo

### TorrentApi
Torrentapi.org wrapper for node using promises

_For documentation, read http://torrentapi.org/apidocs_v2.txt_

#### How to search:
```js
var tapi = require('torrentapi-js');
tapi.search('My Application', {     //useragent optionnal
    query:'chaplin',
    limit: 50,
    category:'movies'
}).then(function (results){
    console.log(results);           //array of objects
}).catch(function (err){
    console.error(err);
});
```

Possible parameters: 
- query | string: search by keywords
- imdb | tvdb | tmdb | themoviedb: search by id

#### How to list:
```js
var tapi = require('torrentapi-js');
tapi.list('My Application', {       //useragent optionnal
    limit: 100,
    category:'tv'
}).then(function (results){
    console.log(results);           //array of objects
}).catch(function (err){
    console.error(err);
});
```

### Other parameters?
Yes.

- category: movies/tv/anime/all (+porn): restrict to a specific category
- limit: from 25 to 100
- sort: by 'seeders', 'leechers' or 'last' uploaded
- min_seeders | min_leechers: restrict 
- rank | verified: set to false to get more results, but unverified by the community
