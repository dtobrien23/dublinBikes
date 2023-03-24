let map;
let openStationInfo;  // used to make sure only one info window is open at a time 

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
    const stationInfo = new google.maps.InfoWindow({
      content: `<div style="color: black;"><h1>${station.name}</h1><p>Some information about the station</p></div>`,
    });
    // click event to open info window
    marker.addListener('click', () => {
      // any currently open window will close when another marker is clicked
      if (openStationInfo) {
        openStationInfo.close();
      }
      stationInfo.open(map, marker);
      openStationInfo = stationInfo;
    });
  });
  // any currently open window will close when map is clicked
  map.addListener('click', () => {
    if (openStationInfo) {
      openStationInfo.close();
      openStationInfo = null;
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