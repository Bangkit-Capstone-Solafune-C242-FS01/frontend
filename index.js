let historicalOverlay;
let map;

window.processFile = async function processFile() {
  const inputFile = document.getElementById("inputFile");
  const fileInfoDiv = document.getElementById("fileInfo");
  const processFileButton = document.getElementById("processFileButton");
  const spinner = document.getElementById("processButton");

  // Show spinner and disable button
  processFileButton.disabled = true;
  spinner.style.display = "inline-block";

  if (!inputFile.files || inputFile.files.length === 0) {
    alert("Please upload a file.");
    fileInfoDiv.innerHTML = "";
    processFileButton.disabled = false;
    spinner.style.display = "none";
    return;
  }

  const file = inputFile.files[0];
  const fileName = file.name;
  const fileSize = (file.size / 1024).toFixed(2); // Size in KB
  const fileExtension = fileName.split(".").pop().toLowerCase();

  // Validate file type
  if (fileExtension !== "tiff" && fileExtension !== "tif") {
    alert("Invalid file type. Please upload a TIFF file.");
    fileInfoDiv.innerHTML = "";
    processFileButton.disabled = false;
    spinner.style.display = "none";
    return;
  }

  // Validate file size (max 200 MB)
  if (fileSize > 204800) {
    alert(
      "File size exceeds the limit. Please upload a file smaller than 200 MB."
    );
    fileInfoDiv.innerHTML = "";
    processFileButton.disabled = false;
    spinner.style.display = "none";
    return;
  }

  // Display file info
  fileInfoDiv.innerHTML = `
    <div class="alert alert-success" role="alert">
      <strong>File Name:</strong> ${fileName}<br>
      <strong>File Size:</strong> ${fileSize} KB
    </div>
  `;

  // Prepare form data
  const formData = new FormData();
  formData.append("file", file);

  try {
    // Hit API endpoint
    const response = await fetch("https://backend-solafune-segma-192996252422.asia-southeast2.run.app/api/image_predict", {
      method: "POST",
      body: formData,
    });

    if (!response.ok) {
      const errorData = await response.json();
      alert(`Error: ${errorData.message}`);
      processFileButton.disabled = false;
      spinner.style.display = "none";
      return;
    }

    const data = await response.json();

    // Update image elements with the results
    const rawPhoto = document.getElementById("rawPhoto");
    const maskingPhoto = document.getElementById("maskingPhoto");

    const resultContainer = document.getElementById("resultContainer");
    document.getElementById("resultInfo").innerHTML = `
      <table id="resultTable">
        <tr>
          <th scope="row">Longitude</th>
          <td>  :</td>
          <td>${data.content.long}</td>
        </tr>
        <tr>
          <th scope="row">Latitude</th>
          <td>  :</td>
          <td>${data.content.lat}</td>
        </tr>
      </table>
    `;

    rawPhoto.src = `data:image/png;base64,${data.content.image}`;
    maskingPhoto.src = `data:image/png;base64,${data.content.mask}`;

    // Show resultContainer
    resultContainer.style.display = "block";

    alert(data.message);
  } catch (error) {
    console.error("Error:", error);
    alert("An error occurred while processing the image.");
  } finally {
    // Reset button and spinner
    processFileButton.disabled = false;
    spinner.style.display = "none";
  }
};

// Fungsi untuk memproses GroundOverlay dan hasil dari API
async function handleFormSubmit(event) {
  event.preventDefault(); // Prevent form refresh

  const processFormButton = document.getElementById("processFormButton");
  const formSpinner = document.getElementById("formSpinner");
  // Show spinner and disable button
  processFormButton.disabled = true;
  formSpinner.style.display = "inline-block";

  // Get form values
  const long = parseFloat(document.getElementById("longitudeText").value);
  const lat = parseFloat(document.getElementById("latitudeText").value);
  const radius = parseInt(document.getElementById("radiusInput").value) || 3000;

  if (isNaN(long) || isNaN(lat) || isNaN(radius)) {
    alert("Please enter valid values for Longitude, Latitude, and Radius.");
    processFormButton.disabled = false;
    formSpinner.style.display = "none";
    return;
  }

  try {
    const url = new URL(
      "https://backend-solafune-segma-192996252422.asia-southeast2.run.app/api/gee_predict"
    );
    url.searchParams.append("long", long);
    url.searchParams.append("lat", lat);
    url.searchParams.append("radius", radius);

    const response = await fetch(url, {
      method: "POST",
    });

    if (!response.ok) {
      const errorData = await response.json();
      alert(`Error: ${errorData.message}`);
      return;
    }

    const data = await response.json();

    // Update the UI with results
    const resultContainer = document.getElementById("resultContainer");
    document.getElementById("resultInfo").innerHTML = `
      <table id="resultTable">
        <tr>
          <th scope="row">Longitude</th>
          <td>  :</td>
          <td>${data.content.long}</th>
        </tr>
        <tr>
          <th scope="row">Latitude</th>
          <td>  :</td>
          <td>${data.content.lat}</td>
        </tr>
        <tr>
          <th scope="row">Radius</th>
          <td>  :</td>
          <td>${data.content.radius} m</td>
        </tr>
      </table>
    `;
    document.getElementById(
      "imageResult"
    ).src = `data:image/png;base64,${data.content.image}`;
    document.getElementById(
      "maskResult"
    ).src = `data:image/png;base64,${data.content.mask}`;

    // Show resultContainer
    resultContainer.style.display = "block";

    updateOverlayWithMask(lat, long, radius, data.content.mask);
  } catch (error) {
    alert("An error occurred while processing the request. Please try again.");
    console.error(error);
  } finally {
    // Reset button and spinner
    processFormButton.disabled = false;
    formSpinner.style.display = "none";
  }
}

function updateOverlayWithMask(lat, lng, radius, maskData) {
  if (!map) {
    console.error("Map is not initialized yet!");
    alert("Map is not ready. Please wait a moment.");
    return;
  }

  const latOffset = radius / 111000; // Convert radius to degrees (latitude)
  const lngOffset = radius / (111000 * Math.cos((lat * Math.PI) / 180)); // Convert radius to degrees (longitude)

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
    `data:image/png;base64,${maskData}`, // Mask data from API
    imageBounds,
    { opacity: 0.5 }
  );

  historicalOverlay.setMap(map);
  map.setCenter({ lat: lat, lng: lng });
  map.setZoom(14); // Adjust zoom level as necessary
}

// Fungsi inisialisasi peta
async function initMap() {
  const { Map } = await google.maps.importLibrary("maps");
  const myLatlng = { lat: 8.51835901996946, lng: 1.060924843988662 };

  map = new google.maps.Map(document.getElementById("map"), {
    zoom: 10,
    center: myLatlng,
    mapTypeId: google.maps.MapTypeId.SATELLITE,
  });

  const longitudeText = document.getElementById("longitudeText");
  const latitudeText = document.getElementById("latitudeText");
  const radiusInput = document.getElementById("radiusInput");
  let markers = [];

  map.addListener("click", (mapsMouseEvent) => {
    const latLng = mapsMouseEvent.latLng.toJSON();
    const lat = latLng.lat;
    const lng = latLng.lng;

    longitudeText.value = lng;
    latitudeText.value = lat;

    const marker = new google.maps.Marker({
      position: mapsMouseEvent.latLng,
      map,
      title: "Coordinates",
    });

    markers.push(marker);

    const infoWindow = new google.maps.InfoWindow({
      position: mapsMouseEvent.latLng,
      content: `
        <div>
          <h6 style="margin: 0; font-size: 14px; font-weight: bold;">Coordinates</h6>
          <div style="margin-top: 10px;">
            <p style="margin: 0; font-size: 12px;">
              <strong>Latitude:</strong> ${lat}<br>
              <strong>Longitude:</strong> ${lng}
            </p>
          </div>
        </div>
      `,
    });

    infoWindow.open(map, marker);

    marker.addListener("click", () => {
      infoWindow.open(map, marker);
    });
  });

  const input = document.getElementById("pac-input");
  const searchBox = new google.maps.places.SearchBox(input);

  map.controls[google.maps.ControlPosition.TOP_LEFT].push(input);

  map.addListener("bounds_changed", () => {
    searchBox.setBounds(map.getBounds());
  });

  searchBox.addListener("places_changed", () => {
    const places = searchBox.getPlaces();

    if (places.length === 0) {
      return;
    }

    markers.forEach((marker) => marker.setMap(null));
    markers = [];

    const bounds = new google.maps.LatLngBounds();

    places.forEach((place) => {
      if (!place.geometry || !place.geometry.location) {
        console.log("Returned place contains no geometry");
        return;
      }

      const lat = place.geometry.location.lat();
      const lng = place.geometry.location.lng();

      longitudeText.value = lng;
      latitudeText.value = lat;

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

    const lat = parseFloat(latitudeText.value);
    const lng = parseFloat(longitudeText.value);
    const radius = parseInt(radiusInput.value) || 3000;

    updateOverlayWithMask(lat, lng, radius, null);
  });

  // Hide resultContainer on page load
  document.getElementById("resultContainer").style.display = "none";
}

initMap();

// Attach handler to form
document
  .getElementById("locationForm")
  .addEventListener("submit", handleFormSubmit);
