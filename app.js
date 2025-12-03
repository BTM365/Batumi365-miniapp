// Mini App JS — Leaflet + Telegram WebApp integration
const tg = window.Telegram?.WebApp;
if (tg) tg.expand();

const map = L.map('map').setView([41.6486, 41.6363], 13);
L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',{
  maxZoom:19, attribution:'© OpenStreetMap'
}).addTo(map);

let markers = L.layerGroup().addTo(map);
let allItems = [];

async function loadObjects(){
  try{
    const res = await fetch('objects.json?t=' + Date.now());
    const data = await res.json();
    allItems = data;
    renderMarkers(allItems);
  }catch(e){console.error('Failed to load objects', e);}
}

function renderMarkers(items){
  markers.clearLayers();
  items.forEach(item => {
    if(!item.lat||!item.lng) return;
    const priceLabel = `₾${item.price}`;
    const marker = L.marker([item.lat,item.lng]).addTo(markers);
    const html = `
      <div style="min-width:200px">
        <strong>${item.title||'ბინა'}</strong><br/>
        <em>${item.area||''} m² • ${item.rooms||''} ოთახი</em><br/>
        <strong>${priceLabel}</strong><br/>
        <img src="${item.photo||''}" style="width:100%;height:100px;object-fit:cover;margin-top:6px" onerror="this.style.display='none'"/>
        <div style="margin-top:6px">
          <button onclick="openSendListingFromMarker('${encodeURIComponent(JSON.stringify(item))}')">📤 განცხადება გაეგზავნა</button>
          <a href="https://www.google.com/maps/search/?api=1&query=${item.lat},${item.lng}" target="_blank">🗺️ მიმართულება</a>
        </div>
      </div>`;
    marker.bindPopup(html);
    marker.bindTooltip(priceLabel,{permanent:true,direction:'top',className:'price-tooltip'});
  });
}

window.openSendListingFromMarker=function(itemEncoded){
  const item = JSON.parse(decodeURIComponent(itemEncoded));
  document.getElementById('f_title').value = item.title||'';
  document.getElementById('f_coord').value = `${item.lat},${item.lng}`;
  document.getElementById('f_area').value=item.area||'';
  document.getElementById('f_rooms').value=item.rooms||'';
  document.getElementById('f_price').value=item.price||'';
  document.getElementById('f_photo').value=item.photo||'';
  document.getElementById('f_contact').value=item.contact||'';
  showModal();
}

const modal=document.getElementById('modal');
function showModal(){ modal.classList.remove('hidden'); }
function hideModal(){ modal.classList.add('hidden'); }
document.getElementById('addListingBtn').addEventListener('click',showModal);
document.getElementById('closeModal').addEventListener('click',hideModal);

document.getElementById('sendListing').addEventListener('click',function(){
  const payload={
    title:document.getElementById('f_title').value,
    coord:document.getElementById('f_coord').value,
    area:document.getElementById('f_area').value,
    rooms:document.getElementById('f_rooms').value,
    price:document.getElementById('f_price').value,
    photo:document.getElementById('f_photo').value,
    contact:document.getElementById('f_contact').value,
    ts:Date.now()
  };
  const coords=(payload.coord||'').split(',').map(s=>s.trim());
  if(coords.length<2||isNaN(coords[0])||isNaN(coords[1])){alert('შეიყვანეთ lat,lng ფორმატით'); return;}
  payload.lat=parseFloat(coords[0]);
  payload.lng=parseFloat(coords[1]);
  if(tg && tg.sendData){ tg.sendData(JSON.stringify({type:'new_listing',data:payload})); alert('განცხადება გაიგზავნა'); hideModal(); } 
  else { console.log('DATA',payload); alert('გახსენით Telegram-ში აპი'); }
});

document.getElementById('applyFilter').addEventListener('click',()=>{
  const min=parseFloat(document.getElementById('filterPriceMin').value)||0;
  const max=parseFloat(document.getElementById('filterPriceMax').value)||Infinity;
  renderMarkers(allItems.filter(it=>{const p=parseFloat(it.price)||0; return p>=min&&p<=max;}));
});

loadObjects();
