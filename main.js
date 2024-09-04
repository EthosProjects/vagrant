//TODO: import { Server } from 'http';
import express from 'express';
import fs from 'fs/promises';
const app = express();
const port = 80;

app.use(express.json());
// Add headers before the routes are defined
app.use(function (req, res, next) {
	// Website you wish to allow to connect
	res.setHeader('Access-Control-Allow-Origin', 'chrome-extension://cgichbhedjclincodgaifebkchahlhph');

	// Request methods you wish to allow
	res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS, PUT, PATCH, DELETE');

	// Request headers you wish to allow
	res.setHeader('Access-Control-Allow-Headers', 'X-Requested-With,content-type');

	// Set to true if you need the website to include cookies in the requests sent
	// to the API (e.g. in case you use sessions)
	res.setHeader('Access-Control-Allow-Credentials', true);

	// Pass to next layer of middleware
	next();
});
class BookmarkURL extends URL {
    constructor() {
        super(...arguments);
        if (this.hostname == "www.google.com") {
            const toDelete = [];
            //TODO Refactor this to be a single line
            this.searchParams.forEach((value, key) => {
                if (key == "ie") return toDelete.push(key);
                if (key == "oq") return toDelete.push(key);
                if (key == "gs_lcrp") return toDelete.push(key);
                if (key == "sourceid") return toDelete.push(key);
                if (key == "q") return
                //console.log(key, value)
            })
            toDelete.forEach(key => this.searchParams.delete(key));
        }
        if (this.pathname.endsWith("/")) this.pathname = this.pathname.slice(0, -1);
    }
}
class Bookmark {
	constructor({ title = 'Pending!', tags, url, dateCreated = Date.now(), dateModified } = {}) {
		this._title = title;
        this._tags = [...new Set(tags.flat(Infinity).map((tag) => tag.toLowerCase()))]; 
		this._url = new BookmarkURL(url);
        this._dateCreated = dateCreated;
		this._dateModified = dateModified;
	}
	set title(t_title) {
		this._title = t_title;
		if (this._title != t_title) this._dateModified = Date.now();
	}
    get title() { return this._title; }
	set tags(t_tags) {
		//TODO: check if the tags have changed by trying to match them 1 to 1
		// If the tags have changed, then modify the date dateModified
		this._tags = [...new Set(t_tags.map((tag) => tag.toLowerCase()))];
		this._dateModified = Date.now();
	}
    get tags() { return this._tags; }
	set url(t_url) {
        const parsedBookmarkURL = new BookmarkURL(t_url);
		if (this._url.href != parsedBookmarkURL.href) this._dateModified = Date.now();
        this._url = parsedBookmarkURL;
	}
    get url() { return this._url.href; }
	toJSON() {
		return {
			title: this._title,
			tags: this._tags,
			url: this._url.href,
			dateCreated: this._dateCreated,
			dateModified: this._dateModified
		};
	}
}
app.get('/', async (req, res) => {
	const url = new BookmarkURL(decodeURIComponent(req.query.url)).href;
	const sites = JSON.parse(await fs.readFile('sites.json', { encoding: 'utf-8' }));
	const existingIndex = sites.findIndex((site) => site.url == url);
    console.log(url, sites.length, sites[10848 - 2])
	if (existingIndex != -1) {
		res.statusCode = 200;
		res.setHeader('Content-Type', 'application/json');
		res.send(JSON.stringify(sites[existingIndex]));
	} else {
		res.statusCode = 404;
		res.send(JSON.stringify({}));
	}
});
app.post('/', async (req, res) => {
	const sites = JSON.parse(await fs.readFile('sites.json', { encoding: 'utf-8' }));
	const existingIndex = sites.findIndex((site) => site.url == new BookmarkURL(req.body.url).href);
	if (existingIndex != -1) {
		const bookmark = new Bookmark(sites[existingIndex]);
        console.log(bookmark);
		bookmark.tags = req.body.tags;
		bookmark.title = req.body.title;
		sites[existingIndex] = bookmark.toJSON();
	} else {
		sites.push(new Bookmark(req.body).toJSON());
        console.log(new Bookmark(sites.at(-1)))
	}
	fs.writeFile('sites.json', JSON.stringify(sites, null, 4));
	res.end();
});
app.listen(port, () => {
	console.log(`vagrant listening on port ${port}`);
});
const sites = JSON.parse(await fs.readFile('sites.json', { encoding: 'utf-8' }));
import { URL } from "url"
