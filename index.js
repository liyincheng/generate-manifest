#! /usr/bin/env node

//import fetch from 'node-fetch';
const fetch = require("node-fetch-npm");
const parser = require('cheerio');
const argv = require('optimist').argv;
const fs = require("fs");
const urlParser = require("url");

if (!argv.url) {
    console.log(
`usage1: node generate-manifest.js --url=https://github.com
usage2: node generate-manifest.js --url=https://github.com #the url to fetch
             --res=img,css,js,html  # the resource type to cache in manifest file
             --appcache=appcache    # the manifestfile folder
             --html=html            # the fallback html folder
             --pageName=home        # the manifest/html file name
             --htmlPrefix=/html/manifest            # fallback html folder
             --disableDomain=test1.com,test2.com    # not cache domain which not support CROS
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
     * 获取url的hostname
     */
    getHostName (urlAddr) {
        let url = urlParser.parse(urlAddr);
        return url.hostname || config.url.hostname;
    },

    /*
     * @return {String} 当前页面名称
     */
    getPageName (){
        let url = urlParser.parse(argv.url);
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
    createDir (dirPath) {
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
    htmlPrefix: argv.prefix || "/html/manifest",                // html访问路径前缀，用来拼接访问路径
    disableDomain: argv.disableDomain ? argv.disableDomain.split(",") : []  // 对那些不支持CROS的不能使用manifest
};


let manifestHandler = {
    getResource ($, resType) {
        let selectors = {
            "img": "img",
            "css": "link[rel=stylesheet]",
            "js": "script[src]"
        };
        if (!selectors[resType]) {
            console.error("Not support resource type: " + resType);
            return;
        }
        let $res = $(selectors[resType]);
        let resLinks = "#" + resType + "\n";
        for (var i = 0; i < $res.length; i++) {
            let link = resType === "css" ? $res.eq(i).attr("href") : $res.eq(i).attr("src")
            if (config.disableDomain.indexOf(util.getHostName(link)) < 0 ) {
                resLinks += link + "\n";
            }
        }
        return resLinks;
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
   
        let links = "";
        for (let i = 0; i < resources.length; i++) {
            if (resources[i] !== "html") {
                links += manifestHandler.getResource($, resources[i]);
            }
        }

        out.write(links);

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

