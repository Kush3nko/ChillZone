// Inicializar el mapa centrado en España
const map = L.map('map').setView([40.4168, -3.7038], 5);

// Tiles de OpenStreetMap
L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
  attribution: '&copy; OpenStreetMap contributors'
}).addTo(map);

// Modales
const loginModal = document.getElementById('loginModal');
const registerModal = document.getElementById('registerModal');
const spotModal = document.getElementById('spotModal');

// Botones abrir modales
document.getElementById('loginButton').onclick = () => loginModal.style.display = 'block';
document.getElementById('registerButton').onclick = () => registerModal.style.display = 'block';

// Botones cerrar modales
document.querySelectorAll('.close').forEach(btn => {
  btn.onclick = () => {
    document.getElementById(btn.dataset.close).style.display = 'none';
  };
});

// Cerrar modales al hacer clic fuera
window.onclick = (e) => {
  if (e.target == loginModal) loginModal.style.display = 'none';
  if (e.target == registerModal) registerModal.style.display = 'none';
  if (e.target == spotModal) spotModal.style.display = 'none';
};

// LocalStorage
let users = JSON.parse(localStorage.getItem('highzoneUsers')) || [];
let spots = JSON.parse(localStorage.getItem('highzoneSpots')) || [];
let currentUser = JSON.parse(localStorage.getItem('highzoneCurrentUser')) || null;

// Actualizar panel de usuario
function updateUserPanel() {
  const userPanel = document.getElementById('userPanel');
  if (currentUser) {
    userPanel.innerHTML = `
      <h2>${currentUser.username}</h2>
      ${currentUser.avatar ? `<img src="${currentUser.avatar}" alt="Avatar" style="width:80px;height:80px;border-radius:50%;">` : ''}
      <p>Seguidores: ${currentUser.followers?.length || 0} | Siguiendo: ${currentUser.following?.length || 0}</p>
      <button id="logoutButton">Cerrar Sesión</button>
    `;
    document.getElementById('logoutButton').onclick = logout;
  } else {
    userPanel.innerHTML = `
      <h2>Bienvenido</h2>
      <p>Inicia sesión para crear y seguir spots.</p>
    `;
  }
}

// Registro
document.getElementById('registerForm').addEventListener('submit', function(e) {
  e.preventDefault();
  const username = document.getElementById('registerUsername').value.trim();
  const password = document.getElementById('registerPassword').value.trim();
  const avatarInput = document.getElementById('registerAvatar');

  if (users.find(u => u.username === username)) {
    alert('Ese usuario ya existe.');
    return;
  }

  const newUser = {
    username,
    password,
    avatar: null,
    followers: [],
    following: []
  };

  if (avatarInput.files.length > 0) {
    const reader = new FileReader();
    reader.onload = function(event) {
      newUser.avatar = event.target.result;
      saveUser(newUser);
    };
    reader.readAsDataURL(avatarInput.files[0]);
  } else {
    saveUser(newUser);
  }
});

function saveUser(user) {
  users.push(user);
  localStorage.setItem('highzoneUsers', JSON.stringify(users));
  currentUser = user;
  localStorage.setItem('highzoneCurrentUser', JSON.stringify(currentUser));
  updateUserPanel();
  registerModal.style.display = 'none';
  alert('Registro exitoso. Bienvenido!');
}

// Login
document.getElementById('loginForm').addEventListener('submit', function(e) {
  e.preventDefault();
  const username = document.getElementById('loginUsername').value.trim();
  const password = document.getElementById('loginPassword').value.trim();

  const user = users.find(u => u.username === username && u.password === password);
  if (user) {
    currentUser = user;
    localStorage.setItem('highzoneCurrentUser', JSON.stringify(currentUser));
    updateUserPanel();
    loginModal.style.display = 'none';
    alert(`Bienvenido de nuevo, ${username}!`);
  } else {
    alert('Usuario o contraseña incorrectos.');
  }
});

// Logout
function logout() {
  currentUser = null;
  localStorage.removeItem('highzoneCurrentUser');
  updateUserPanel();
}

// Clic en mapa para añadir spot
map.on('click', function(e) {
  if (!currentUser) {
    alert('Debes iniciar sesión para crear spots.');
    return;
  }
  currentLatLng = e.latlng;
  spotModal.style.display = 'block';
});

let currentLatLng = null;

// Guardar spot
document.getElementById('spotForm').addEventListener('submit', function(e) {
  e.preventDefault();
  const name = document.getElementById('spotName').value.trim();
  const description = document.getElementById('spotDescription').value.trim();
  const rating = parseInt(document.getElementById('spotRating').value);
  const imageInput = document.getElementById('spotImage');

  const newSpot = {
    id: 'spot-' + Date.now(),
    name,
    description,
    lat: currentLatLng.lat,
    lng: currentLatLng.lng,
    rating,
    creator: currentUser.username,
    image: null,
    likes: 0
  };

  if (imageInput.files.length > 0) {
    const reader = new FileReader();
    reader.onload = function(event) {
      newSpot.image = event.target.result;
      saveSpot(newSpot);
    };
    reader.readAsDataURL(imageInput.files[0]);
  } else {
    saveSpot(newSpot);
  }
});

function saveSpot(spot) {
  spots.push(spot);
  localStorage.setItem('highzoneSpots', JSON.stringify(spots));
  spotModal.style.display = 'none';
  renderSpots();
  updateTrending();
  alert('Spot creado con éxito!');
}

// Renderizar spots en mapa
function renderSpots(minRating = 1) {
  map.eachLayer(layer => {
    if (layer instanceof L.Marker) {
      map.removeLayer(layer);
    }
  });

  spots
    .filter(s => s.rating >= minRating)
    .forEach(spot => {
      const marker = L.marker([spot.lat, spot.lng]).addTo(map);
      marker.bindPopup(`
        <strong>${spot.name}</strong><br/>
        ${spot.image ? `<img src="${spot.image}" style="width:100px;border-radius:4px;"><br/>` : ''}
        ${spot.description}<br/>
        Valoración: ${'⭐'.repeat(spot.rating)}<br/>
        Creador: ${spot.creator}<br/>
        Likes: ${spot.likes}<br/>
        ${currentUser && spot.creator !== currentUser.username ? `<button onclick="likeSpot('${spot.id}')">Like</button> <button onclick="followUser('${spot.creator}')">${currentUser.following?.includes(spot.creator) ? 'Siguiendo' : 'Seguir'}</button>` : ''}
      `);
    });
}

// Like a un spot
function likeSpot(id) {
  const spot = spots.find(s => s.id === id);
  if (spot) {
    spot.likes++;
    localStorage.setItem('highzoneSpots', JSON.stringify(spots));
    renderSpots();
    updateTrending();
  }
}

// Seguir usuario
function followUser(username) {
  if (!currentUser.following.includes(username)) {
    currentUser.following.push(username);
    const user = users.find(u => u.username === username);
    if (user) {
      user.followers.push(currentUser.username);
      localStorage.setItem('highzoneUsers', JSON.stringify(users));
      localStorage.setItem('highzoneCurrentUser', JSON.stringify(currentUser));
      updateUserPanel();
      renderSpots();
      alert(`Ahora sigues a ${username}`);
    }
  }
}

// Trending Spots
function updateTrending() {
  const trendingList = document.getElementById('trendingList');
  if (spots.length === 0) {
    trendingList.innerHTML = `<li>Ningún spot trending aún</li>`;
    return;
  }
  const top = spots.slice().sort((a, b) => b.likes - a.likes).slice(0, 5);
  trendingList.innerHTML = '';
  top.forEach(s => {
    trendingList.innerHTML += `
      <li>
        ${s.name} (${s.likes} likes)<br/>
        <small>por ${s.creator}</small>
      </li>
    `;
  });
}

// Filtro por valoración mínima
document.getElementById('filterButton').addEventListener('click', () => {
  const min = prompt("Mostrar spots con valoración mínima (1-5):", "4");
  const minRating = parseInt(min);
  if (!isNaN(minRating) && minRating >= 1 && minRating <= 5) {
    renderSpots(minRating);
  } else {
    alert("Valor inválido.");
  }
});

// Inicializar
updateUserPanel();
renderSpots();
updateTrending();