//import fetch from 'node-fetch';
const fetch = require("node-fetch-npm");
const parser = require('cheerio');
const argv = require('optimist').argv;
const fs = require("fs");

if (!argv.url) {
    console.log(
`usage1: node generate-manifest.js --url=https://github.com
usage2: node generate-manifest.js --url=https://github.com #the url to fetch
             --res=img,css,js,html  #the resource type to cache in manifest file
             --appache=appache      #the manifestfile folder
             --html=html            #the fallback html folder
             --pageName=home        #the manifest/html file name
             --htmlPrefix=/html/manifest #fallback html folder
#usage2 will generate two files: appache/home.appache html/home.html\n
`);
    return;
}

if (argv.url.indexOf("http://") < 0 && argv.url.indexOf("https://") < 0) {
    console.log("\nError: url is illeage, which should begin with http:// or https://\n");
    return;
}

let util = {
    /*
     * @return {String} 当前时间的字符串形式
     */
    getDateStr () {
        return (new Date()).toLocaleString();
    },

    /*
     * @return {String} 当前页面名称
     */
    getPageName (){
        let url = require("url").parse(argv.url);
        let path = url.path.replace(/\/$/, "");
        // 首页
        if (!path) {
            return "home";
        } else {
        // 其它页面取最后一个/后的内容
            let pathArray = path.split("/");
            return pathArray[pathArray.length - 1]; 
        }
    },

    /*
     * 判断一个目录是否存在
     * @param {String} dirPath 目录的路径
     */
    dirExists (dirPath){
        try{
            return fs.statSync(dirPath).isDirectory();
        } catch (err) {
            return false;
        }
    },

    /*
     * 创建html/appcache的目录
     * @param {String} dirPath 目录的路径
     */
    createDir: function(dirPath) {
        if (!util.dirExists(dirPath)){
            fs.mkdirSync(dirPath);
        } 
    }
};

var config = {
    url: require("url").parse(argv.url), // 网址
    //out: argv.out,                       // 输出路径
    res: argv.res ? argv.res.split(",") : ["img", "css", "js", "html"], // 需要cache的类型
    appcachePath: argv.appcache || "appcache",   // appcache的路径
    htmlPath: argv.html || "html",               // fallback html的路径
    pageName: argv.pageName || util.getPageName(),  // 当前页面名称，用来拼接html/manifest名称
    htmlPrefix: argv.prefix || "/html/manifest"             // html访问路径前缀，用来拼接访问路径
};


let manifestHandler = {
    getImgPath ($) {
        let imgSrc = "";
        let $imgs = $("img");
        for (var i = 0; i < $imgs.length; i++) {
            let src = $imgs.eq(i).attr("src");
            if (src.indexOf(config.url.hostname) >= 0) {
                imgSrc += src + "\n";
            }
        } 
        return imgSrc;
    },
    getCSSPath ($) {
        let cssLink = "";
        let $css = $("link[rel=stylesheet]");
        for (var i = 0; i < $css.length; i++) {
            cssLink += $css.eq(i).attr("href") + "\n";
        }
        return cssLink;
    },
    getJSPath ($) {
        let jsLink = "";
        let $js = $("script[src]");
        for (var i = 0; i < $js.length; i++) {
            jsLink += $js.eq(i).attr("src") + "\n";
        }
        return jsLink;
    }
};


let writeWorker = {
    writeManifest ($) {
        let out = fs.createWriteStream(`${config.appcachePath}/${config.pageName}.appcache`, 
                    { encoding: "utf8" }); 
        out.write("CACHE MANIFEST\n");
        out.write(`#${util.getDateStr()}\n`);

        let resources = config.res;
        // html
        if (resources.indexOf("html") >= 0) {
            out.write("#html\n");
            out.write(config.url.href + "\n");
        }

        // img
        if (resources.indexOf("img") >= 0) {
            out.write("#img\n");
            let imgLink = manifestHandler.getImgPath($);
            out.write(imgLink);
        }

        // css
        if (resources.indexOf("css") >= 0) {
            out.write("#css\n");
            let cssLink = manifestHandler.getCSSPath($);
            out.write(cssLink);
        }
        
        // js
        if (resources.indexOf("js") >= 0) {
            out.write("#js\n");
            let jsLink = manifestHandler.getJSPath($);
            out.write(jsLink);
        }

        // network
        out.write("\nNETWORK:\n*\n");

        // fallback html
        if (resources.indexOf("html") >= 0) {
            out.write("\nFALLBACK\n");
            out.write(`${config.url.href} ${config.htmlPrefix}/${config.htmlPath}/${config.pageName}.html`);
        }

        out.end();
    },

    writeHtml (html) {
        let out = fs.createWriteStream(`${config.htmlPath}/${config.pageName}.html`,
                    { encoding: "utf8" }); 
        out.write(html);
        out.end();
    }
}

console.log(`fetch ${config.url.href}`);
fetch(config.url.href)
    .then(res => {
        if (res.status !== 200) {
            console.log(`ERROR ${res.status}: ${config.url.href}`);
            return null;
        } else {
            return res.text();
        }
    })
    .then(html => {
        // 加载失败
        if (html === null) {
            return;
        }
        console.log("begin to parse and generate manifest file");
        let $ = parser.load(html);
        util.createDir(config.appcachePath);
        writeWorker.writeManifest($);
        util.createDir(config.htmlPath);
        writeWorker.writeHtml(html);
        console.log("done");
        
    })
    .catch(function (err) {
        console.log(err);
    })

