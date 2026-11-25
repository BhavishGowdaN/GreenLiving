/* Green Living customizer — selection, plant information and cart integration.
 * The reference layout intentionally has no live preview or image-generation panel.
 */
(() => {
  'use strict';
  const form = document.getElementById('customPlantForm');
  if (!form) return;
  const $ = id => document.getElementById(id);
  const el = {
    type:$('customizationType'), plant:$('customPlant'), pot:$('customPot'), color:$('customPotColor'),
    size:$('customPotSize'), name:$('customCustomerName'), text:$('customPotText'), message:$('customMessage'),
    arrangement:$('customArrangement'), environment:$('customEnvironment'), giftWrap:$('customGiftWrap'),
    giftMessage:$('customGiftMessage'), price:$('customPlantPrice'), details:$('customDesignDetails'),
    giftOptions:$('giftOptions')
  };
  const plants = [
    ['Monstera Deliciosa',599,'monstera'],['Snake Plant',499,'snake-plant'],['Peace Lily',549,'peace-lily'],['Aloe Vera',399,'aloe-vera'],
    ['Money Plant',399,'money-plant'],['Fiddle-Leaf Fig',799,'fiddle-leaf-fig'],['Orchid',899,'orchid'],['Rose Plant',499,'rose'],
    ['Jade Plant',449,'jade-plant'],['Tulip',499,'tulip'],['Areca Palm',699,'areca-palm'],['Bougainvillea',599,'bougainvillea'],
    ['Sunflower',499,'sunflower'],['Jasmine',549,'jasmine']
  ];
  const potPrice = {'Premium Ceramic Pot':450,'Modern Minimalist Pot':399,'Terracotta Pot':249,'Decorative Designer Pot':599,'Hanging Planter':499,'Balcony Planter':349,'Small Desk Pot':199,'Large Floor Pot':799};
  const sizePrice = {Small:0,Medium:200,Large:450};
  const plantInfo = {
    'Monstera Deliciosa':['Indoor climbing aroid','Bright, indirect','When top soil dries','Moderate'],
    'Snake Plant':['Air-purifying foliage plant','Low to bright indirect','Allow soil to dry fully','Easy'],
    'Peace Lily':['Flowering tropical aroid','Medium, indirect','Keep lightly moist','Moderate'],
    'Aloe Vera':['Succulent','Bright light','Allow soil to dry','Easy'],
    'Money Plant':['Trailing tropical vine','Bright, indirect','When top soil dries','Easy'],
    'Fiddle-Leaf Fig':['Indoor tree','Bright, indirect','When top soil dries','Moderate'],
    'Orchid':['Flowering epiphyte','Bright, indirect','When medium nearly dries','Moderate'],
    'Rose Plant':['Flowering shrub','Bright sunlight','Water when top soil dries','Moderate'],
    'Jade Plant':['Succulent','Bright light','Allow soil to dry','Easy'],
    'Tulip':['Flowering bulb plant','Full sun','Moderate during growth','Seasonal'],
    'Areca Palm':['Indoor palm','Bright, indirect','Keep lightly moist','Moderate'],
    'Bougainvillea':['Outdoor flowering climber','Full sunlight','Water when soil dries','Moderate'],
    'Sunflower':['Flowering garden plant','Full sunlight','Keep soil lightly moist','Seasonal'],
    'Jasmine':['Fragrant flowering climber','Bright sunlight','Keep soil lightly moist','Moderate']
  };
  const fmt = n => '₹' + Number(n).toLocaleString('en-IN');
  const selectedPlant = () => plants.find(p => p[0] === el.plant.value) || plants[0];
  function cataloguePlant(name) {
    const list = Array.isArray(window.greenLivingProducts) ? window.greenLivingProducts : [];
    const normalized = String(name).toLowerCase();
    return list.find(item => String(item.name || '').toLowerCase() === normalized)
      || list.find(item => String(item.name || '').toLowerCase().replace(/^premium\s+/, '') === normalized);
  }
  function price() {
    const p=selectedPlant(), item=cataloguePlant(p[0]);
    const base=item && Number.isFinite(Number(item.price)) ? Number(item.price) : p[1];
    return base+(potPrice[el.pot.value]||399)+(sizePrice[el.size.value]||0)+(el.text.value.trim()?79:0)+(el.type.value==='Gift'&&el.giftWrap.checked?149:0);
  }
  function collect() {
    return {customizationType:el.type.value,plant:el.plant.value,pot:el.pot.value,potColor:el.color.value,potSize:el.size.value,
      arrangement:el.arrangement.value,environment:el.environment.value,customerName:el.name.value.trim(),personalizationText:el.text.value.trim(),
      customMessage:el.message.value.trim(),giftWrap:el.type.value==='Gift'&&el.giftWrap.checked,giftMessage:el.type.value==='Gift'?el.giftMessage.value.trim():'',price:price()};
  }
  function populatePlants() {
    const old=el.plant.value;
    el.plant.replaceChildren(...plants.map(p=>{const o=document.createElement('option');o.value=p[0];o.textContent=p[0];return o;}));
    if(plants.some(p=>p[0]===old))el.plant.value=old;
    el.giftOptions.hidden=el.type.value!=='Gift';
    el.giftWrap.checked=el.type.value==='Gift';
    refresh();
  }
  function refreshPlantInfo() {
    // The Plant Profile display card is intentionally absent. Plant data stays
    // live on the form so cart items and future features can still use it.
    const item=cataloguePlant(el.plant.value), base=plantInfo[el.plant.value]||[], selected=selectedPlant();
    const data=item?[item.category||base[0]||'Plant',item.light||base[1]||'Not listed',item.water||base[2]||'Not listed',item.care||base[3]||'Not listed']:base;
    const labels=['Category','Light','Water','Care level'];
    const details=data.map((v,i)=>`${labels[i]}: ${v||'Not listed'}`);
    form.dataset.selectedPlant=selected[0];
    form.dataset.selectedPlantImage=`assets/customizer/plants/potted-${selected[2]}.png`;
    form.dataset.selectedPlantInfo=details.join(' | ');
  }
  function renderRows(rows) {
    if (!el.details) return;
    const nodes = rows.map(([k, v]) => {
      const wrap = document.createElement('div');
      const dt = document.createElement('dt');
      const dd = document.createElement('dd');
      dt.textContent = k;
      dd.textContent = String(v == null ? '' : v);
      wrap.append(dt, dd);
      return wrap;
    });
    if (typeof el.details.replaceChildren === 'function') {
      el.details.replaceChildren(...nodes);
    } else {
      while (el.details.firstChild) el.details.removeChild(el.details.firstChild);
      nodes.forEach(node => el.details.appendChild(node));
    }
  }
  function refresh() {
    const d = collect();
    if (el.price) el.price.textContent = fmt(d.price);
    const rows = [
      ['Customer', d.customerName || 'Not entered'],
      ['Plant', d.plant],
      ['Pot style', d.pot],
      ['Pot colour', d.potColor],
      ['Pot size', d.potSize],
      ['Plant arrangement', d.arrangement],
      ['Background / Environment', d.environment],
      ['Text to print on pot', d.personalizationText || 'Not entered'],
      ['Custom message', d.customMessage || '—']
    ];
    if (d.customizationType === 'Gift') {
      rows.push(['Gift wrap', d.giftWrap ? 'Included' : 'Not selected'], ['Gift message', d.giftMessage || '—']);
    }
    rows.push(['Estimated total', fmt(d.price)]);
    renderRows(rows);
    refreshPlantInfo();
  }
  function makeCartItem() {
    const d=collect(), p=selectedPlant(), item=cataloguePlant(p[0]);
    const localImage=`assets/customizer/plants/potted-${p[2]}.png`;
    return {id:`custom-${p[2]}-${d.pot.toLowerCase().replace(/[^a-z0-9]+/g,'-')}`,name:`${d.plant} · ${d.pot}`,price:d.price,
      image:(item&&item.image)||localImage,category:`Custom ${d.customizationType} Plant`,description:d.customMessage||`Personalized ${d.plant} in a ${d.potColor} ${d.pot}.`,
      customization:d};
  }
  function validate() { if(!form.reportValidity())return false; return true; }
  const bind = (node, evt, fn) => { if (node) node.addEventListener(evt, fn); };
  bind(el.type, 'change', populatePlants);
  [el.plant, el.pot, el.color, el.size, el.arrangement, el.environment, el.giftWrap].forEach(node => {
    bind(node, 'change', refresh);
    bind(node, 'input', refresh);
  });
  [el.name, el.text, el.message, el.giftMessage].forEach(node => {
    bind(node, 'input', refresh);
    bind(node, 'change', refresh);
  });
  form.addEventListener('submit', e => {
    e.preventDefault();
    if (!validate()) return;
    const item = makeCartItem();
    if (window.greenLivingAddCustomPlantToCart?.(item)) document.getElementById('cartOpen')?.click();
  });
  bind($('buyCustomPlant'), 'click', () => {
    if (!validate()) return;
    window.greenLivingBuyCustomPlantNow?.(makeCartItem());
  });
  populatePlants();
  refresh();
})();
