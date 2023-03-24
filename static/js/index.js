let map;

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