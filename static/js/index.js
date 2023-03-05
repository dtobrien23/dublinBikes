let map;

function initMap() {
  map = new google.maps.Map(document.getElementById("map"), {
    center: { lat: 53.349811, lng: -6.260259 },
    zoom: 14,
  });
}

window.initMap = initMap;