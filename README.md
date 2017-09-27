一个用来生成manifest文件的工具，根据url抓取的html里的img/css/js资源放到manifest文件的cache里面

使用方法：
```bash
usage1: node generate-manifest.js --url=https://github.com
```

--url 后面带上想要cached的网页地址

然后就会生成两个文件：
* manifest文件 appcache/home.appcahe
* FALLBACK的html文件 html/home.html

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



