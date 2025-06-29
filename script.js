// Inicializar el mapa
const map = L.map('map').setView([40.4168, -3.7038], 5); // Centrado en España

// Cargar mapa base
L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
  attribution: '&copy; OpenStreetMap contributors'
}).addTo(map);

// Cargar spots desde LocalStorage o inicializar
let spots = JSON.parse(localStorage.getItem('chillSpots')) || [
  {
    name: "Playa Tranquila",
    description: "Arena suave y sonido relajante de las olas.",
    lat: 36.7213,
    lng: -4.4214,
    rating: 5
  },
  {
    name: "Parque Verde",
    description: "Sombra de grandes árboles y bancos cómodos.",
    lat: 40.4168,
    lng: -3.7038,
    rating: 4
  },
  {
    name: "Mirador Zen",
    description: "Vistas panorámicas y brisa fresca.",
    lat: 41.3879,
    lng: 2.1699,
    rating: 5
  }
];

// Modal y formulario
const modal = document.getElementById('modal');
const closeModal = document.getElementById('closeModal');
const spotForm = document.getElementById('spotForm');
let currentLatLng = null;

// Función para renderizar todos los spots
function renderSpots(minRating = 1) {
  map.eachLayer((layer) => {
    if (layer instanceof L.Marker) {
      map.removeLayer(layer);
    }
  });

  spots
    .filter(spot => spot.rating >= minRating)
    .forEach(spot => {
      const marker = L.marker([spot.lat, spot.lng]).addTo(map);
      marker.bindPopup(`
        <strong>${spot.name}</strong><br/>
        ${spot.description}<br/>
        Valoración: ${'⭐'.repeat(spot.rating)}<br/>
        <button onclick="openAddSpot(${spot.lat}, ${spot.lng})">Añadir Spot</button>
      `);
    });
}

// Mostrar spots iniciales
renderSpots();

// Manejo del modal
function openAddSpot(lat, lng) {
  currentLatLng = { lat, lng };
  modal.style.display = 'block';
}

closeModal.onclick = () => {
  modal.style.display = 'none';
};

window.onclick = (event) => {
  if (event.target == modal) {
    modal.style.display = 'none';
  }
};

// Clic en el mapa para añadir nuevo spot
map.on('click', function(e) {
  openAddSpot(e.latlng.lat, e.latlng.lng);
});

// Guardar nuevo spot
spotForm.addEventListener('submit', function(e) {
  e.preventDefault();
  const name = document.getElementById('spotName').value;
  const description = document.getElementById('spotDescription').value;
  const rating = parseInt(document.getElementById('spotRating').value);
  const imageInput = document.getElementById('spotImage');
  let imageUrl = null;

  if (imageInput.files.length > 0) {
    const reader = new FileReader();
    reader.onload = function(event) {
      imageUrl = event.target.result;
      saveSpot(name, description, rating, imageUrl);
    };
    reader.readAsDataURL(imageInput.files[0]);
  } else {
    saveSpot(name, description, rating, imageUrl);
  }
});

function saveSpot(name, description, rating, imageUrl) {
  const newSpot = {
    name,
    description,
    lat: currentLatLng.lat,
    lng: currentLatLng.lng,
    rating,
    image: imageUrl
  };
  spots.push(newSpot);
  localStorage.setItem('chillSpots', JSON.stringify(spots));
  modal.style.display = 'none';
  renderSpots();
  spotForm.reset();
}

// Filtro por valoración mínima
document.getElementById('filterButton').addEventListener('click', () => {
  const min = prompt("Mostrar spots con valoración mínima (1-5):", "4");
  const minRating = parseInt(min);
  if (!isNaN(minRating) && minRating >= 1 && minRating <= 5) {
    renderSpots(minRating);
  } else {
    alert("Valoración inválida.");
  }
});