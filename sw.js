const V='mb-v1';
const SHELL=['./','./index.html'];

self.addEventListener('install',e=>{
  e.waitUntil(caches.open(V).then(c=>c.addAll(SHELL)).then(()=>self.skipWaiting()));
});

self.addEventListener('activate',e=>{
  e.waitUntil(
    caches.keys()
      .then(k=>Promise.all(k.filter(x=>x!==V).map(x=>caches.delete(x))))
      .then(()=>self.clients.claim())
  );
});

self.addEventListener('fetch',e=>{
  const r=e.request;
  if(r.method!=='GET')return;
  const u=new URL(r.url);

  // Fichiers de l'appli : internet d'abord (toujours la dernière version), sinon copie en mémoire
  if(u.origin===location.origin){
    e.respondWith(
      fetch(r).then(res=>{
        if(res.ok){const cp=res.clone();caches.open(V).then(c=>c.put(r,cp))}
        return res;
      }).catch(()=>caches.match(r,{ignoreSearch:true}).then(m=>m||caches.match('./index.html')))
    );
  }
  // Bibliothèques Firebase : copie en mémoire d'abord, pour ouvrir l'appli sans internet
  else if(u.hostname==='www.gstatic.com'){
    e.respondWith(
      caches.match(r).then(m=>m||fetch(r).then(res=>{
        if(res.ok){const cp=res.clone();caches.open(V).then(c=>c.put(r,cp))}
        return res;
      }))
    );
  }
});
