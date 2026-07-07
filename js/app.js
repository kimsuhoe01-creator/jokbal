const tax8 = n => Math.round(n * 1.08);
const tax10 = n => Math.round(n * 1.10);
const fmt = n => Number(n).toLocaleString('vi-VN') + '₫';

const I18N = {
  ko:{storeName:'족발신선생 박닌점',call:'전화 주문',delivery:'DeliveryK 배달',priceNote:'가격은 VND 기준이며 POS/영수증 가격과 동일합니다.',detail:'자세히 보기',close:'접기',hall:'홀 식사',hallBenefit:'쟁반국수 또는 고르곤졸라 + 짬뽕순두부 + 계란찜',takeaway:'배달 · 포장',takeBenefit:'족발볶음밥 + 막국수 서비스',people:'추천인원',photoReady:'사진 준비중',recommend:'추천',main:'메인',half:'반반',solo:'1인',side:'사이드',meal:'식사·탕',drink:'주류·음료',single:'가격',s:'소',m:'중',l:'대'},
  vi:{storeName:'Jokbal Sin Seon Saeng Bắc Ninh',call:'Gọi đặt món',delivery:'Đặt DeliveryK',priceNote:'Giá tính bằng VND và trùng với giá POS/hóa đơn.',detail:'Xem thêm',close:'Thu gọn',hall:'Ăn tại quán',hallBenefit:'Tặng mỳ khay hoặc pizza Gorgonzola + súp đậu hũ hải sản + trứng hấp',takeaway:'Giao hàng · Mang về',takeBenefit:'Tặng cơm rang chân giò + mỳ trộn',people:'Khẩu phần gợi ý',photoReady:'Đang chuẩn bị ảnh',recommend:'Gợi ý',main:'Món chính',half:'2 món',solo:'1 người',side:'Món phụ',meal:'Cơm · Canh',drink:'Đồ uống',single:'Giá',s:'Nhỏ',m:'Vừa',l:'Lớn'},
  en:{storeName:'Jokbal Sin Seon Saeng Bac Ninh',call:'Call',delivery:'DeliveryK',priceNote:'Prices are in VND and match POS/receipt prices.',detail:'More details',close:'Close',hall:'Dine-in',hallBenefit:'Noodle platter or Gorgonzola pizza + spicy seafood tofu soup + steamed egg included',takeaway:'Delivery · Takeaway',takeBenefit:'Jokbal fried rice + spicy noodles included',people:'Recommended serving',photoReady:'Photo coming soon',recommend:'Recommended',main:'Mains',half:'Half & Half',solo:'For One',side:'Sides',meal:'Meals · Soups',drink:'Drinks',single:'Price',s:'S',m:'M',l:'L'},
  zh:{storeName:'猪蹄新先生 北宁店',call:'电话订餐',delivery:'DeliveryK 外卖',priceNote:'价格单位为VND，与POS/小票价格一致。',detail:'查看详情',close:'收起',hall:'堂食',hallBenefit:'赠送拌面拼盘或戈贡佐拉披萨 + 海鲜嫩豆腐汤 + 蒸蛋',takeaway:'外卖 · 打包',takeBenefit:'赠送猪蹄炒饭 + 拌面',people:'建议人数',photoReady:'照片准备中',recommend:'推荐',main:'主菜',half:'双拼',solo:'单人餐',side:'配菜',meal:'饭 · 汤',drink:'酒水饮料',single:'价格',s:'小',m:'中',l:'大'}
};

const CATS = ['recommend','main','side','meal','drink'];
const mainBenefitCats = ['recommend','main','half'];

const MENU = [
  {cat:'recommend', best:true, img:'images/half-oven.jpg', n:{ko:'화덕 반반메뉴',vi:'Set 2 món đút lò',en:'Oven Half & Half Platter',zh:'烤炉双拼'}, alt:{ko:'족발·보쌈·화덕족발·화덕보쌈·매운족발·냉채족발·매운보쌈 중 2가지 선택',vi:'Chọn 2 món: chân giò, ba chỉ, chân giò đút lò, ba chỉ đút lò, chân giò cay, chân giò sốt mù tạt, ba chỉ cay',en:'Choose 2: jokbal, bossam, oven jokbal, oven bossam, spicy jokbal, cold jokbal, spicy bossam',zh:'猪蹄、菜包肉、烤炉猪蹄、烤炉五花肉、辣猪蹄、凉拌猪蹄、辣五花肉中任选2种'}, prices:[['m',tax8(880000)],['l',tax8(980000)]], people:{ko:'중 2~3인 / 대 3~4인',vi:'Vừa 2~3 người / Lớn 3~4 người',en:'M 2–3 people / L 3–4 people',zh:'中 2~3人 / 大 3~4人'}},

  {cat:'main', img:'images/oven-jokbal.jpg', n:{ko:'화덕족발',vi:'Chân giò đút lò',en:'Oven-Roasted Jokbal',zh:'烤炉猪蹄'}, prices:[['s',tax8(680000)],['m',tax8(780000)],['l',tax8(880000)]], people:{ko:'소 2인 / 중 2~3인 / 대 3~4인',vi:'Nhỏ 2 người / Vừa 2~3 / Lớn 3~4',en:'S 2 / M 2–3 / L 3–4',zh:'小2人 / 中2~3人 / 大3~4人'}},
  {cat:'main', img:'images/bossam.jpg', n:{ko:'보쌈',vi:'Thịt ba chỉ hầm',en:'Bossam',zh:'菜包肉'}, prices:[['s',tax8(650000)],['m',tax8(750000)],['l',tax8(850000)]], people:{ko:'소 2인 / 중 2~3인 / 대 3~4인',vi:'Nhỏ 2 người / Vừa 2~3 / Lớn 3~4',en:'S 2 / M 2–3 / L 3–4',zh:'小2人 / 中2~3人 / 大3~4人'}},
  {cat:'main', img:'images/jokbal.jpg', n:{ko:'족발',vi:'Chân giò hầm',en:'Braised Jokbal',zh:'酱猪蹄'}, prices:[['s',tax8(650000)],['m',tax8(750000)],['l',tax8(850000)]], people:{ko:'소 2인 / 중 2~3인 / 대 3~4인',vi:'Nhỏ 2 người / Vừa 2~3 / Lớn 3~4',en:'S 2 / M 2–3 / L 3–4',zh:'小2人 / 中2~3人 / 大3~4人'}},
  {cat:'main', img:'images/garlic-bossam.jpg', n:{ko:'마늘보쌈',vi:'Ba chỉ tỏi',en:'Garlic Bossam',zh:'蒜香五花肉'}, prices:[['s',tax8(720000)],['m',tax8(820000)],['l',tax8(920000)]], people:{ko:'소 2인 / 중 2~3인 / 대 3~4인',vi:'Nhỏ 2 người / Vừa 2~3 / Lớn 3~4',en:'S 2 / M 2–3 / L 3–4',zh:'小2人 / 中2~3人 / 大3~4人'}},
  {cat:'main', img:'images/garlic-jokbal.jpg', n:{ko:'마늘족발',vi:'Chân giò tỏi',en:'Garlic Jokbal',zh:'蒜香猪蹄'}, prices:[['s',tax8(720000)],['m',tax8(820000)],['l',tax8(920000)]], people:{ko:'소 2인 / 중 2~3인 / 대 3~4인',vi:'Nhỏ 2 người / Vừa 2~3 / Lớn 3~4',en:'S 2 / M 2–3 / L 3–4',zh:'小2人 / 中2~3人 / 大3~4人'}},
  {cat:'main', img:'images/cheese-fire-jokbal.jpg', spicy:true, n:{ko:'화덕치즈불족',vi:'Chân giò cay phô mai đút lò',en:'Oven Cheese Fire Jokbal',zh:'芝士辣烤猪蹄'}, prices:[['s',tax8(750000)],['m',tax8(850000)],['l',tax8(950000)]], people:{ko:'소 2인 / 중 2~3인 / 대 3~4인',vi:'Nhỏ 2 người / Vừa 2~3 / Lớn 3~4',en:'S 2 / M 2–3 / L 3–4',zh:'小2人 / 中2~3人 / 大3~4人'}},
  {cat:'main', img:'images/cold-jokbal.jpg', n:{ko:'냉채족발',vi:'Chân giò sốt mù tạt',en:'Cold Jokbal',zh:'芥末凉拌猪蹄'}, prices:[['s',tax8(700000)],['m',tax8(800000)],['l',tax8(900000)]], people:{ko:'소 2인 / 중 2~3인 / 대 3~4인',vi:'Nhỏ 2 người / Vừa 2~3 / Lớn 3~4',en:'S 2 / M 2–3 / L 3–4',zh:'小2人 / 中2~3人 / 大3~4人'}},
  {cat:'main', img:'images/mini-oven-jokbal.jpg', n:{ko:'화덕미니족',vi:'Chân giò mini đút lò',en:'Oven Mini Jokbal',zh:'烤炉迷你猪蹄'}, prices:[['single',388800]], people:{ko:'1~2인 추천',vi:'Gợi ý 1~2 người',en:'Recommended for 1–2',zh:'建议1~2人'}},
  {cat:'main', img:'images/mini-fire-jokbal.jpg', spicy:true, n:{ko:'미니불족',vi:'Chân giò mini cay',en:'Spicy Mini Jokbal',zh:'迷你辣猪蹄'}, prices:[['single',453600]], people:{ko:'1~2인 추천',vi:'Gợi ý 1~2 người',en:'Recommended for 1–2',zh:'建议1~2人'}},
  {cat:'main', img:'images/whole-oven-jokbal.jpg', best:true, n:{ko:'화덕통구이족발',vi:'Chân giò nguyên cái đút lò',en:'Whole Oven-Roasted Jokbal',zh:'整只烤炉猪蹄'}, alt:{ko:'프리미엄 앞다리',vi:'Chân giò trước cao cấp',en:'Premium fore-leg',zh:'优质前腿'}, prices:[['single',tax8(980000)]], people:{ko:'3~4인 추천',vi:'Gợi ý 3~4 người',en:'Recommended for 3–4',zh:'建议3~4人'}},
  {cat:'main', img:'', n:{ko:'화덕보쌈',vi:'Ba chỉ đút lò',en:'Oven-Roasted Bossam',zh:'烤炉五花肉'}, prices:[['s',tax8(680000)],['m',tax8(780000)],['l',tax8(880000)]], people:{ko:'소 2인 / 중 2~3인 / 대 3~4인',vi:'Nhỏ 2 người / Vừa 2~3 / Lớn 3~4',en:'S 2 / M 2–3 / L 3–4',zh:'小2人 / 中2~3人 / 大3~4人'}},
  {cat:'main', img:'', spicy:true, n:{ko:'매운보쌈',vi:'Ba chỉ cay',en:'Spicy Bossam',zh:'辣味五花肉'}, prices:[['s',tax8(700000)],['m',tax8(800000)],['l',tax8(900000)]], people:{ko:'소 2인 / 중 2~3인 / 대 3~4인',vi:'Nhỏ 2 người / Vừa 2~3 / Lớn 3~4',en:'S 2 / M 2–3 / L 3–4',zh:'小2人 / 中2~3人 / 大3~4人'}},


  {cat:'side', img:'images/noodle-platter.jpg', n:{ko:'쟁반국수',vi:'Mỳ khay',en:'Noodle Platter',zh:'拌面拼盘'}, prices:[['single',tax8(200000)]]},
  {cat:'side', img:'images/gorgonzola-pizza.jpg', n:{ko:'고르곤졸라피자',vi:'Pizza phô mai kèm mật ong',en:'Gorgonzola Honey Pizza',zh:'戈贡佐拉蜂蜜披萨'}, prices:[['single',tax8(150000)]]},
  {cat:'side', img:'images/seafood-tofu-soup.jpg', spicy:true, n:{ko:'짬뽕순두부',vi:'Súp đậu hũ hải sản',en:'Spicy Seafood Tofu Soup',zh:'海鲜嫩豆腐汤'}, prices:[['single',tax8(150000)]]},
  {cat:'side', img:'images/jokbal-fried-rice.jpg', n:{ko:'족발볶음밥',vi:'Cơm rang chân giò',en:'Jokbal Fried Rice',zh:'猪蹄炒饭'}, prices:[['single',tax8(100000)]]},
  {cat:'side', img:'images/rice-ball.jpg', n:{ko:'날치알주먹밥',vi:'Cơm nắm trứng cá chuồn',en:'Flying-Fish-Roe Rice Balls',zh:'飞鱼籽饭团'}, prices:[['single',tax8(100000)]]},
  {cat:'side', img:'images/steamed-egg.jpg', n:{ko:'계란찜',vi:'Trứng hấp',en:'Steamed Egg',zh:'蒸蛋'}, prices:[['single',tax8(100000)]]},
  {cat:'side', img:'images/spicy-oyster.jpg', spicy:true, n:{ko:'어리굴젓 (100g)',vi:'Hàu sữa trộn cay (100g)',en:'Spicy Salted Oysters (100g)',zh:'生蚝拌辣椒(100g)'}, prices:[['single',tax8(100000)]]},
  {cat:'side', img:'images/rice.jpg', n:{ko:'공기밥',vi:'Cơm trắng',en:'Steamed Rice',zh:'米饭'}, prices:[['single',tax8(20000)]]},
  {cat:'side', img:'images/sauce.jpg', n:{ko:'소스 (매운·마늘·냉채)',vi:'Nước chấm',en:'Sauce',zh:'酱料'}, prices:[['single',tax8(20000)]]},

  {cat:'meal', img:'images/bone-soup.jpg', n:{ko:'뼈해장국',vi:'Canh xương hầm',en:'Pork-Bone Soup',zh:'骨头汤'}, alt:{ko:'매일 매장에서 직접 끓입니다',vi:'Hầm trực tiếp tại quán mỗi ngày',en:'Simmered in-house daily',zh:'每日店内现熬'}, prices:[['single',tax8(160000)]]},
  {cat:'meal', img:'images/budae.jpg', spicy:true, n:{ko:'부대찌개',vi:'Canh quân đội',en:'Budae Jjigae',zh:'部队火锅'}, prices:[['single',tax8(300000)]]},
  {cat:'meal', img:'images/kodari-naengmyeon.jpg', n:{ko:'코다리냉면',vi:'Miến lạnh trộn khô cá minh thái',en:'Kodari Cold Noodles',zh:'明太鱼干拌冷面'}, prices:[['single',tax8(180000)]]},
  {cat:'meal', img:'images/water-naengmyeon.jpg', n:{ko:'물냉면',vi:'Miến lạnh nước',en:'Cold Noodles in Broth',zh:'水冷面'}, prices:[['single',tax8(150000)]]},
  {cat:'meal', img:'images/spicy-naengmyeon.jpg', spicy:true, n:{ko:'비빔냉면',vi:'Miến lạnh trộn',en:'Spicy Mixed Cold Noodles',zh:'拌冷面'}, prices:[['single',tax8(150000)]]},

  {cat:'drink', img:'images/soju.jpg', n:{ko:'소주',vi:'Soju',en:'Soju',zh:'韩国烧酒'}, prices:[['single',tax10(140000)]]},
  {cat:'drink', img:'images/beer.jpg', n:{ko:'맥주 (Tiger·Heineken 330ml)',vi:'Bia (Tiger · Heineken 330ml)',en:'Beer (Tiger · Heineken 330ml)',zh:'啤酒(Tiger·喜力330ml)'}, prices:[['single',tax10(50000)]]},
  {cat:'drink', img:'images/soft-drink.jpg', n:{ko:'음료수 (콜라·사이다·환타)',vi:'Nước ngọt',en:'Soft Drinks',zh:'饮料'}, prices:[['single',tax10(30000)]]},
  {cat:'drink', img:'images/makgeolli.jpg', n:{ko:'막걸리',vi:'Rượu gạo Makgeolli',en:'Makgeolli',zh:'马格利米酒'}, prices:[['single',tax10(160000)]]},
  {cat:'drink', img:'images/chungha.jpg', n:{ko:'청하',vi:'Rượu Chung Ha',en:'Chungha',zh:'清河清酒'}, prices:[['single',tax10(200000)]]},
  {cat:'drink', img:'images/bokbunja.jpg', n:{ko:'복분자',vi:'Rượu quả mâm xôi',en:'Bokbunja',zh:'覆盆子酒'}, prices:[['single',tax10(300000)]]}
];

let lang = localStorage.getItem('jokbal_lang') || '';
let openId = null;
const CAT_ICONS = {recommend:'🔥', main:'🥩', solo:'👤', side:'🥢', meal:'🍚', drink:'🍺'};
const $ = s => document.querySelector(s);
const menuEl = $('#menu');

function t(k){ return I18N[lang]?.[k] || I18N.ko[k] || k; }
function applyText(){
  document.documentElement.lang = lang === 'zh' ? 'zh-CN' : lang;
  document.querySelectorAll('[data-t]').forEach(el => el.textContent = t(el.dataset.t));
}
function showApp(){ $('#langScreen').classList.add('hidden'); $('#app').classList.remove('hidden'); applyText(); renderCats(); renderMenu(); }
function showLang(){ $('#app').classList.add('hidden'); $('#langScreen').classList.remove('hidden'); }

document.querySelectorAll('[data-lang]').forEach(btn => btn.addEventListener('click', () => { lang = btn.dataset.lang; localStorage.setItem('jokbal_lang', lang); showApp(); }));

function renderCats(){
  const nav = $('#catNav'); nav.innerHTML = '';
  CATS.forEach(cat => {
    if(!MENU.some(m => m.cat === cat)) return;
    const b = document.createElement('button');
    b.innerHTML = `<span>${CAT_ICONS[cat] || ''}</span>${t(cat)}`;
    b.onclick = () => document.getElementById('sec-' + cat)?.scrollIntoView({behavior:'smooth', block:'start'});
    nav.appendChild(b);
  });
}

function renderMenu(){
  menuEl.innerHTML = '';
  CATS.forEach(cat => {
    const items = MENU.filter(m => m.cat === cat);
    if(!items.length) return;
    const h = document.createElement('h2'); h.className = 'section-title'; h.id = 'sec-' + cat; h.innerHTML = `<span>${CAT_ICONS[cat] || ''}</span><span>${t(cat)}</span>`; menuEl.appendChild(h);
    const grid = document.createElement('div');
    grid.className = 'card-grid cat-' + cat;
    items.forEach((item) => grid.appendChild(card(item)));
    menuEl.appendChild(grid);
  });
  observeSections();
}
function card(item){
  const id = item.cat + '-' + item.n.ko.replace(/[^가-힣a-zA-Z0-9]/g,'');
  const el = document.createElement('article'); el.className = 'card' + (item.cat === 'recommend' ? ' featured' : ''); el.dataset.id = id;
  const alt = item.alt?.[lang] || (lang !== 'ko' ? item.n.ko : '');
  const prices = item.prices.map(([size, price]) => `<div class="price-line ${size==='single'?'single':''}"><span>${t(size)}</span><strong>${fmt(price)}</strong></div>`).join('');
  const benefit = mainBenefitCats.includes(item.cat) ? `<div class="detail-block"><div class="detail-title">🍽 ${t('hall')}</div><ul><li>${t('hallBenefit')}</li></ul></div><div class="detail-block"><div class="detail-title">🛵 ${t('takeaway')}</div><ul><li>${t('takeBenefit')}</li></ul></div>` : '';
  const people = item.people ? `<div class="detail-block"><div class="detail-title">👥 ${t('people')}</div><p>${item.people[lang] || item.people.ko}</p></div>` : '';
  const desc = alt ? `<p class="desc">${alt}</p>` : '';
  const badgeHtml = `${item.best?'<span class="badge best">🏆 BEST</span>':''}${item.spicy?'<span class="badge spicy">🌶</span>':''}`;
  const photoWrap = item.img ? `
    <div class="photo-wrap" role="button" tabindex="0" aria-label="open photo">
      <img src="${item.img}" alt="${item.n[lang] || item.n.ko}" loading="lazy" onerror="this.closest('.photo-wrap').remove();this.closest('.card')?.classList.add('text-only')">
      <div class="badges">${badgeHtml}</div>
    </div>` : '';
  if(!item.img) el.classList.add('text-only');
  el.innerHTML = `
    ${photoWrap}
    <div class="body">
      ${!item.img && badgeHtml ? `<div class="inline-badges">${badgeHtml}</div>` : ''}
      <div class="name-row"><div><div class="name">${item.n[lang] || item.n.ko}</div>${alt?`<div class="subname">${alt}</div>`:''}</div></div>
      <div class="price-list">${prices}</div>
      <button class="toggle" type="button">▼ ${t('detail')}</button>
      <div class="detail">${benefit}${people}${desc}</div>
    </div>`;
  el.querySelector('.toggle').onclick = () => toggleCard(el, id);
  const photo = el.querySelector('.photo-wrap');
  if(photo){
    photo.onclick = () => openPhoto(item);
    photo.onkeydown = e => { if(e.key === 'Enter') openPhoto(item); };
  }
  return el;
}
function toggleCard(el,id){
  document.querySelectorAll('.card.open').forEach(c => { if(c !== el){ c.classList.remove('open'); c.querySelector('.toggle').textContent = '▼ ' + t('detail'); }});
  const open = el.classList.toggle('open'); openId = open ? id : null; el.querySelector('.toggle').textContent = (open ? '▲ ' + t('close') : '▼ ' + t('detail'));
}
function openPhoto(item){
  const img = new Image(); img.src = item.img;
  img.onload = () => { $('#modalImg').src = item.img; $('#modalCaption').textContent = item.n[lang] || item.n.ko; $('#photoModal').classList.remove('hidden'); };
}
$('#modalClose').onclick = () => $('#photoModal').classList.add('hidden');
$('#photoModal').addEventListener('click', e => { if(e.target.id === 'photoModal') $('#photoModal').classList.add('hidden'); });

const toTop = $('#toTop');
window.addEventListener('scroll', () => { toTop.classList.toggle('hidden', scrollY < 600); });
toTop.onclick = () => scrollTo({top:0, behavior:'smooth'});

function observeSections(){
  const buttons = [...document.querySelectorAll('#catNav button')];
  const sections = CATS.map(c => document.getElementById('sec-' + c)).filter(Boolean);
  const obs = new IntersectionObserver(entries => {
    const visible = entries.filter(e => e.isIntersecting).sort((a,b)=>b.intersectionRatio-a.intersectionRatio)[0];
    if(!visible) return;
    const idx = sections.indexOf(visible.target);
    buttons.forEach((b,i)=>b.classList.toggle('active',i===idx));
  }, {rootMargin:'-60px 0px -70% 0px', threshold:[0,.2,.5]});
  sections.forEach(s => obs.observe(s));
}

showLang();
