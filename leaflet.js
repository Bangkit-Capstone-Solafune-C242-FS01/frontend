let historicalOverlay;
let map;

function initMap2() {
  // Inisialisasi peta dengan titik default
  const center = { lat: 38.296722, lng: 33.230953 };
  map = new google.maps.Map(document.getElementById("map"), {
    zoom: 13,
    center: center,
  });
}

function updateOverlay(lat, lng) {
  const distanceKm = 3; // Jarak dalam kilometer
  const latOffset = distanceKm / 111; // Konversi jarak ke derajat latitude
  const lngOffset = distanceKm / (111 * Math.cos((lat * Math.PI) / 180)); // Konversi jarak ke derajat longitude

  // Hitung imageBounds secara otomatis
  const imageBounds = {
    north: lat + latOffset,
    south: lat - latOffset,
    east: lng + lngOffset,
    west: lng - lngOffset,
  };

  // Hapus overlay lama jika ada
  if (historicalOverlay) {
    historicalOverlay.setMap(null);
  }

  // Tambahkan GroundOverlay baru
  historicalOverlay = new google.maps.GroundOverlay(
    "./assets/img/masking/download.png", // Path ke gambar
    imageBounds,
    { opacity: 0.5 } // Opacity untuk transparansi
  );

  // Tampilkan overlay di peta
  historicalOverlay.setMap(map);

  // Pusatkan peta ke lokasi baru
  map.setCenter({ lat: lat, lng: lng });
  map.setZoom(14); // Zoom ke lokasi
}

function handleFormSubmit(event) {
  event.preventDefault(); // Mencegah reload halaman saat submit form

  // Ambil nilai latitude dan longitude dari form
  const lat = parseFloat(document.getElementById("latitudeText").value);
  const lng = parseFloat(document.getElementById("longitudeText").value);

  if (!isNaN(lat) && !isNaN(lng)) {
    // Panggil fungsi untuk memperbarui overlay
    updateOverlay(lat, lng);
  } else {
    alert("Harap masukkan nilai latitude dan longitude yang valid!");
  }

  return false; // Mencegah submit form default
}

window.initMap2 = initMap2;
