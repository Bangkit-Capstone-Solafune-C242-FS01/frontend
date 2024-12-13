let historicalOverlay;
let map; 

async function initMap() {
  // Request needed libraries.
  const { Map } = await google.maps.importLibrary("maps");
  const myLatlng = { lat: 8.51835901996946, lng: 1.060924843988662 };

  // Inisialisasi peta menggunakan variabel global `map`
  map = new google.maps.Map(document.getElementById("map"), {
    zoom: 10,
    center: myLatlng,
    mapTypeId: google.maps.MapTypeId.SATELLITE,
  });

  // Add longitude and latitude input fields
  const longitudeText = document.getElementById("longitudeText");
  const latitudeText = document.getElementById("latitudeText");

  // Create the search box and link it to the UI element.
  const input = document.getElementById("pac-input");
  const searchBox = new google.maps.places.SearchBox(input);

  // Add the search box to the map's controls
  map.controls[google.maps.ControlPosition.TOP_LEFT].push(input);

  // Bias the SearchBox results towards the current map's viewport.
  map.addListener("bounds_changed", () => {
    searchBox.setBounds(map.getBounds());
  });

  // Array to hold markers
  let markers = [];

  // Listen for the event when the user selects a prediction
  searchBox.addListener("places_changed", () => {
    const places = searchBox.getPlaces();

    if (places.length === 0) {
      return;
    }

    // Clear out the old markers.
    markers.forEach((marker) => {
      marker.setMap(null);
    });
    markers = [];

    // Adjust the map's bounds based on the selected places
    const bounds = new google.maps.LatLngBounds();

    places.forEach((place) => {
      if (!place.geometry || !place.geometry.location) {
        console.log("Returned place contains no geometry");
        return;
      }

      // Get latitude and longitude
      const lat = place.geometry.location.lat();
      const lng = place.geometry.location.lng();

      // Update longitude and latitude inputs
      longitudeText.value = lng;
      latitudeText.value = lat;

      // Create a marker for the selected place
      const marker = new google.maps.Marker({
        map,
        title: place.name,
        position: place.geometry.location,
      });

      markers.push(marker);

      if (place.geometry.viewport) {
        bounds.union(place.geometry.viewport);
      } else {
        bounds.extend(place.geometry.location);
      }
    });

    map.fitBounds(bounds);
  });
}

initMap();

document.getElementById("showOverlayButton").addEventListener("click", () => {
  const latitudeText = document.getElementById("latitudeText").value;
  const longitudeText = document.getElementById("longitudeText").value;

  const lat = parseFloat(latitudeText);
  const lng = parseFloat(longitudeText);

  if (!isNaN(lat) && !isNaN(lng)) {
    updateOverlay(lat, lng);
  } else {
    alert("Please enter valid latitude and longitude values!");
  }
});

function updateOverlay(lat, lng) {
  if (!map) {
    console.error("Map is not initialized yet!");
    alert("Map is not ready. Please wait a moment.");
    return;
  }

  const distanceKm = 3;
  const latOffset = distanceKm / 111;
  const lngOffset = distanceKm / (111 * Math.cos((lat * Math.PI) / 180));

  const imageBounds = {
    north: lat + latOffset,
    south: lat - latOffset,
    east: lng + lngOffset,
    west: lng - lngOffset,
  };

  if (historicalOverlay) {
    historicalOverlay.setMap(null);
  }

  historicalOverlay = new google.maps.GroundOverlay(
    "./assets/img/masking/download.png",
    imageBounds,
    { opacity: 0.5 }
  );

  historicalOverlay.setMap(map);

  map.setCenter({ lat: lat, lng: lng });
  map.setZoom(14);
}
