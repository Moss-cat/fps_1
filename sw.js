// 缓存的名字，以后更新游戏时可以改这个版本号
const CACHE_NAME = '末日战场-v1';

// 需要缓存的资源列表（第一次安装时就缓存这些）
const urlsToCache = [
  './',  // 这是你的 index.html
  './index.html',
  './manifest.json',
  // 把你的主要CSS/JS文件路径也加进来，比如：
  // './main.js',
  // './style.css',
  // 注意：Three.js 之类的库文件建议不要缓存，因为它们可能经常更新
];

// 安装阶段：缓存上面列出的资源
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => {
        console.log('Service Worker: 缓存核心文件');
        return cache.addAll(urlsToCache);
      })
  );
});

// 激活阶段：清理旧缓存
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.map(cache => {
          if (cache !== CACHE_NAME) {
            console.log('Service Worker: 清理旧缓存', cache);
            return caches.delete(cache);
          }
        })
      );
    })
  );
});

// 拦截请求：优先从缓存返回，没有就请求网络
self.addEventListener('fetch', event => {
  // 只缓存同源的 GET 请求
  if (event.request.url.startsWith(self.location.origin) && event.request.method === 'GET') {
    event.respondWith(
      caches.match(event.request)
        .then(cachedResponse => {
          // 如果有缓存，直接返回
          if (cachedResponse) {
            return cachedResponse;
          }
          
          // 否则请求网络
          return fetch(event.request)
            .then(response => {
              // 检查响应是否有效
              if (!response || response.status !== 200 || response.type !== 'basic') {
                return response;
              }
              
              // 克隆响应（因为响应只能被读取一次）
              const responseToCache = response.clone();
              
              // 缓存新获取的资源
              caches.open(CACHE_NAME)
                .then(cache => {
                  cache.put(event.request, responseToCache);
                });
              
              return response;
            })
            .catch(() => {
              // 如果连网络也失败了，这里可以返回一个自定义的离线页面
              // 但你的游戏是纯JS，所以这里简单返回错误
              return new Response('网络不可用，游戏需要联网加载初始资源。');
            });
        })
    );
  }
});