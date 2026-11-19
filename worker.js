// Cloudflare Worker: cầu nối an toàn giữa trang web của bạn và Claude API.
// Cách bật: tạo Worker trên Cloudflare, dán file này vào, thêm biến bí mật ANTHROPIC_API_KEY,
// (tùy chọn) ALLOWED_ORIGIN = địa chỉ web của bạn, rồi dán link Worker vào AI_ENDPOINT đầu file script.js.
// Không bao giờ để API key trong script.js vì ai cũng xem được.
const SYS='Bạn là trợ lý của website tìm phòng gym ở Hà Nội. Trả lời bằng tiếng Việt, ngắn gọn, dễ hiểu, về tập luyện, bài tập (kể cả máy Smith), dinh dưỡng và nấu ăn. Không chẩn đoán bệnh hay thay thế bác sĩ; nếu có triệu chứng đáng lo hoặc bệnh nền, khuyên đi khám. Không bịa giá hay thông tin phòng gym cụ thể.';
export default{async fetch(req,env){
  const cors={'Access-Control-Allow-Origin':env.ALLOWED_ORIGIN||'*','Access-Control-Allow-Methods':'POST,OPTIONS','Access-Control-Allow-Headers':'Content-Type'};
  const out=(o,s=200)=>new Response(JSON.stringify(o),{status:s,headers:{...cors,'content-type':'application/json'}});
  if(req.method==='OPTIONS')return new Response(null,{headers:cors});
  if(req.method!=='POST')return out({error:'POST only'},405);
  let b;try{b=await req.json()}catch{return out({error:'bad json'},400)}
  const messages=(b.messages||[]).slice(-8).filter(m=>(m.role==='user'||m.role==='assistant')&&typeof m.content==='string').map(m=>({role:m.role,content:m.content.slice(0,1500)}));
  if(!messages.length||messages[messages.length-1].role!=='user')return out({error:'no question'},400);
  const r=await fetch('https://api.anthropic.com/v1/messages',{method:'POST',headers:{'content-type':'application/json','x-api-key':env.ANTHROPIC_API_KEY,'anthropic-version':'2023-06-01'},body:JSON.stringify({model:env.MODEL||'claude-sonnet-5-5',max_tokens:700,system:SYS,messages})});
  if(!r.ok)return out({error:'upstream'},502);
  const d=await r.json();
  return out({reply:(d.content||[]).filter(c=>c.type==='text').map(c=>c.text).join('\n')||'Xin lỗi, hiện chưa trả lời được.'});
}};
