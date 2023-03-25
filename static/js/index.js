let map, infoWindow;

function addMarkers(stations) {
  stations.forEach(station => {
    new google.maps.Marker({
      position: {
        lat: station.position_lat,
        lng: station.position_lng,
      },
      map: map,
      title: station.name,
      station_number: station.number,
    });
  });
}

function getStations() {
  fetch("/stations")
    .then((response) => response.json())
    .then((data) => {
      console.log("fetch response", typeof data);
      addMarkers(data);
      stationsInfo(data)
    });
  }

function initMap() {
  map = new google.maps.Map(document.getElementById("map"), {
    center: { lat: 53.349811, lng: -6.260259 },
    zoom: 14,
  });
  const bikeLayer = new google.maps.BicyclingLayer();

  bikeLayer.setMap(map);
  getStations();

  infoWindow = new google.maps.InfoWindow();
  const locationButton = document.createElement("button");

  locationButton.textContent = "Pan to Current Location";
  locationButton.classList.add("custom-map-control-button");
  map.controls[google.maps.ControlPosition.TOP_CENTER].push(locationButton);
  locationButton.addEventListener("click", () => {
    // Try HTML5 geolocation.
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const pos = {
            lat: position.coords.latitude,
            lng: position.coords.longitude,
          };

          infoWindow.setPosition(pos);
          infoWindow.setContent("Location found.");
          infoWindow.open(map);
          map.setCenter(pos);
        },
        () => {
          handleLocationError(true, infoWindow, map.getCenter());
        }
      );
    } else {
      // Browser doesn't support Geolocation
      handleLocationError(false, infoWindow, map.getCenter());
    }
  });
}

function handleLocationError(browserHasGeolocation, infoWindow, pos) {
  infoWindow.setPosition(pos);
  infoWindow.setContent(
    browserHasGeolocation
      ? "Error: The Geolocation service failed."
      : "Error: Your browser doesn't support geolocation."
  );
  infoWindow.open(map);
}

window.initMap = initMap;

function stationsInfo(stations) {
  let station_locations = ""
  stations.forEach(station => {
    station_locations += "<option value ='" + station.address + "'>"
  });
  document.getElementById('stations').innerHTML = station_locations;
}

function showRoute() {
  let start_location = document.getElementById("start_location").value
  let destination = document.getElementById("destination").value
  let date = document.getElementById("date").value
  let time = document.getElementById("time").value
}