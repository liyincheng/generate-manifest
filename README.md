A tool to generate manifest file from a given url. It will crawl the img/css/js resource link from the html.
一个用来生成manifest文件的工具，根据url抓取的html里的img/css/js资源放到manifest文件的cache里面

Usage:
使用方法：
```shell
npm install -g generate-manifest
generate-manifest --url=https://github.com
```

--url with the url to process
--url 后面带上想要cached的网页地址

It will then generate two files:
然后就会生成两个文件：
* manifest文件 appcache/home.appcahe
* FALLBACK的html文件 html/home.html

The cache file structure:
生成的appcache文件结构：
```
CACHE MANIFEST
#9/27/2017, 3:04:25 PM
#html
https://github.com/
#img
https://assets-cdn.github.com/images/modules/site/universe-octoshop.png
https://assets-cdn.github.com/images/modules/site/universe-wordmark.png
#css
https://assets-cdn.github.com/assets/frameworks-bedfc518345498ab3204d330c1727cde7e733526a09cd7df6867f6a231565091.css
#js
https://assets-cdn.github.com/assets/compat-91f98c37fc84eac24836eec2567e9912742094369a04c4eba6e3cd1fa18902d9.js
NETWORK:
*

FALLBACK
https://github.com/ /html/manifest/html/home.html
``` 

More arguments to customize:
可以支持定制参数：
```
generate-manifest --url=https://github.com #the url to fetch
     --res=img,css,js,html   # the resource type to cache in manifest file
     --appcache=appache      # the manifestfile folder
     --html=html             # the fallback html folder
     --pageName=home         # the manifest/html file name
     --htmlPrefix=/html/manifest #fallback html folder
     --disableDomain=test1.com,test2.com    # not cache domain which not support CROS
```
res指定需要cache的资源，默认是四种img,css,js,html，--appcache --html指定生成文件的存放目录，--pageName指定文件名称，--htmlPrefix指定FALLBACK里面html的访问路径，默认首页是使用home，其它页面使用路径/最后一个内容。 --disableDomain表示不进行缓存的域名，有些域名的资源不支持CORS，不能写在manifest里面



