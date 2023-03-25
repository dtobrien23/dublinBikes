let map;
let currentLocationWindow; // used to show the user where they are currently on the map
let openStationWindow;  // used to make sure only one info window is open at a time

function addMarkers(stations) {
  // add a marker to the map for each station
  stations.forEach(station => {
    const marker = new google.maps.Marker({
      position: {
        lat: station.position_lat,
        lng: station.position_lng,
      },
      map: map,
      title: station.name,
      station_number: station.number,
    });
    // create an info window for each marker that will open when clicked
    const stationWindow = new google.maps.InfoWindow({
      content: `<div style="color: black;"><h1>${station.name}</h1><p>Some information about the station</p></div>`,
    });
    // click event to open info window
    marker.addListener('click', () => {
      // any currently open window will close when another marker is clicked
      if (openStationWindow) {
        openStationWindow.close();
      }
      stationWindow.open(map, marker);
      openStationWindow = stationWindow;
    });
  });
  // any currently open window will close when map is clicked
  map.addListener('click', () => {
    if (openStationWindow) {
      openStationWindow.close();
      openStationWindow = null;
    }
  });
}

// used to get data for map markers
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

  // creates an info window that shows the user there current location
  currentLocationWindow = new google.maps.InfoWindow({
      content: `<div style="color: black;"><p>Current Location</p></div>`,
    });
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

          currentLocationWindow.setPosition(pos);
          currentLocationWindow.open(map);
          map.center(pos);
        },
        () => {
          handleLocationError(true, currentLocationWindow, map.getCenter());
        }
      );
    } else {
      // Browser doesn't support Geolocation
      handleLocationError(false, currentLocationWindow, map.getCenter());
    }
  });
}

// runs if the user doesn't allow their location to be shared
function handleLocationError(browserHasGeolocation, currentLocationWindow, pos) {
  currentLocationWindow.setPosition(pos);
  currentLocationWindow.setContent(
    browserHasGeolocation
      ? "Error: The Geolocation service failed."
      : "Error: Your browser doesn't support geolocation."
  );
  currentLocationWindow.open(map);
}

window.initMap = initMap;

// lists all the stations in the input fields
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