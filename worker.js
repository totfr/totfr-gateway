const K='sk-69e5260b8bd34aa0a3bc2e9a3d745cb2',M='deepseek-chat',U='https://api.deepseek.com/v1/chat/completions'
const C={'Access-Control-Allow-Origin':'*','Access-Control-Allow-Headers':'*','Access-Control-Allow-Methods':'GET,POST,OPTIONS','Access-Control-Max-Age':'86400'}
const P1='你是起草者。给出完整具体的回答，不客套，不确定的地方标明。'
const P2='你是严格审阅者。找出草稿的事实错误、逻辑漏洞、遗漏要点。分条列出问题和改法。没问题就说：没有实质问题。'
const P3='你是定稿者。结合审阅意见输出最终答案。只给答案，不要提初稿或审阅。'
async function ask(s,u,m){try{const r=await fetch(U,{method:'POST',headers:{'Content-Type':'application/json',Authorization:'Bearer '+K},body:JSON.stringify({model:M,messages:[{role:'system',content:s},{role:'user',content:u}],max_tokens:m})});const d=await r.json();return(d.choices&&d.choices[0].message.content)||''}catch(e){return ''}}
function rep(t){return new Response(JSON.stringify({id:'cmpl',object:'chat.completion',created:0,model:M,choices:[{index:0,message:{role:'assistant',content:t},finish_reason:'stop'}],usage:{prompt_tokens:0,completion_tokens:0,total_tokens:0}}),{headers:{...C,'Content-Type':'application/json; charset=utf-8'}})}
export default{async fetch(q){
if(q.method==='OPTIONS')return new Response(null,{status:204,headers:C})
const u=new URL(q.url)
if(q.method==='GET'){
if(u.pathname.includes('models'))return new Response(JSON.stringify({object:'list',data:[{id:M,object:'model',owned_by:'totfrcat'}]}),{headers:{...C,'Content-Type':'application/json'}})
const s=u.searchParams.get('q')
if(!s)return new Response(JSON.stringify({ok:true,service:'TotfrCat v5',tip:'?q=问题'}),{headers:{...C,'Content-Type':'application/json'}})
const d=await ask(P1,s,1024),c=await ask(P2,'【问题】'+s+'\n【草稿】'+d,700),f=await ask(P3,'【问题】'+s+'\n【初稿】'+d+'\n【审阅】'+c,1400)
return new Response(JSON.stringify({ok:true,draft:d,critique:c,final:f}),{headers:{...C,'Content-Type':'application/json'}})}
let b={};try{b=await q.json()}catch(e){return rep('网关已就绪')}
const ms=b.messages||[];let s=''
for(let i=ms.length-1;i>=0;i--){if(ms[i].role!=='user')continue;const c=ms[i].content;s=typeof c==='string'?c:Array.isArray(c)?c.map(x=>x&&x.text||'').join(''):'';if(s)break}
s=s||String(b.question||b.q||b.prompt||'')
if(!s)return rep('TotfrCat 网关已就绪，请发送问题')
const d=await ask(P1,s,1024),c=await ask(P2,'【问题】'+s+'\n【草稿】'+d,700),t=(await ask(P3,'【问题】'+s+'\n【初稿】'+d+'\n【审阅】'+c,1400))||d
if(b.stream!==true)return rep(t)
const e=new TextEncoder(),n={id:'cmpl',object:'chat.completion.chunk',created:0,model:M}
const st=new ReadableStream({start(o){const k=x=>o.enqueue(e.encode('data: '+JSON.stringify(x)+'\n\n'));k({...n,choices:[{index:0,delta:{role:'assistant'},finish_reason:null}]});k({...n,choices:[{index:0,delta:{content:t},finish_reason:null}]});k({...n,choices:[{index:0,delta:{},finish_reason:'stop'}]});o.enqueue(e.encode('data: [DONE]\n\n'));o.close()}})
return new Response(st,{headers:{...C,'Content-Type':'text/event-stream; charset=utf-8','Cache-Control':'no-cache'}})}}
