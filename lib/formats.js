const jade = require("jade")
const merge = require("merge")
const pathToRegexp = require("path-to-regexp")
const pathTool = require("path")
const yaml = require("js-yaml")

const PROJECT_DEFAULTS = {
	// do not enable the Skira accelerator unless its explicitly defined
	app: false,
	default: {
		// select the first locale, alphabetically
		locale: 0,
	},
	builds: {
		styles: "build/styles.css",
		scripts: "build/scripts.js",
		app: "build/app.js",
		site: "build/site.js",
	},
	// where to store files for a production environment
	// the proxy respects these values and serves appropiate files
	// absolute paths (starting with a slash) root in public/
	output: {
		styles: "/styles.css",
		scripts: "/scripts.js",
		app: "/app.js",
	},
	// how to behave on static files
	files: {
		path: "public",
		gzip: true,
		index: false,
		cors: true,
		dot: false,
	},
}

module.exports.yaml = {
	extension: "yaml",
	parser: function yamlParser(content, path) {
		return yaml.safeLoad(content, { filename: path })
	},
}

module.exports.skira = {
	extension: "skira",
	parser: function projectParser(content, path) {
		var obj = yaml.safeLoad(content, { filename: path })

		// fill in the blanks and make sure to clone it
		// not to modify the defaults
		return merge.recursive(true, PROJECT_DEFAULTS, obj)
	},
}

module.exports.page = {
	extension: "yaml",
	parser: function pageParser(content, path) {
		var page = yaml.safeLoad(content, { filename: path })

		// parse Express-style routes to regex (uses path-to-regexp)
		if (page.routes) {
			page._routes = []

			for (var i in page.routes) {
				var pathStr = page.routes[i]

				try {
					var out = { keys: [] }
					out.regex = pathToRegexp(pathStr, out.keys, { end: false })
					page._routes[i] = out
				} catch (err) {
					throw new Error(`Invalid route ${pathStr}`)
				}
			}
		}

		return page
	},
}

module.exports.jade = {
	extension: "jade",
	parser: function jadeParser(file, path) {
		var fnStr = jade.compileClient(file, { filename: path })
		return new Function(`return ${fnStr}`)()
	},
}
