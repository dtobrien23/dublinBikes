let map;
let currentLocationWindow; // used to show the user where they are currently on the map
let stationWindow;  // used to create info window for each marker
let openStationWindow;  // used to make sure only one info window is open at a time


function addMarkers(stations, availability) {

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

    // iterate through availability info for each station
    availability.forEach(thisStation => {

      // get the correct availability for this station
      if (thisStation.number == station.number) {

        // set marker icon depending on availability
        const greenStation = {
          path: google.maps.SymbolPath.CIRCLE,
          fillColor: '#32A432',
          fillOpacity: 1,
          strokeWeight: 2,
          strokeColor: '#FFFFFF',
          scale: 14
        };
          
        const orangeStation = {
          path: google.maps.SymbolPath.CIRCLE,
          fillColor: '#EFB700',
          fillOpacity: 1,
          strokeWeight: 2,
          strokeColor: '#FFFFFF',
          scale: 14
        };

        const redStation = {
          path: google.maps.SymbolPath.CIRCLE,
          fillColor: '#FF0000',
          fillOpacity: 1,
          strokeWeight: 2,
          strokeColor: '#FFFFFF',
          scale: 14
        };
      
        if (thisStation.available_bikes == 0) {
        marker.setIcon(redStation);
        } else if (thisStation.available_bikes <= 5 && thisStation.available_bikes >= 1) {
            marker.setIcon(orangeStation);
        } else {
            marker.setIcon(greenStation);
        }

        // create an info window for each marker that will open when clicked
        let banking = "No";  // for card payment info
        if (station.banking == 1) {
          banking = "Yes";
        }
        marker.stationWindow = new google.maps.InfoWindow({
        content: `<div style="color: black;"><h1>${station.name}</h1><p>Status: ${thisStation.status}<br>Available bikes: ${thisStation.available_bikes}<br>
                  Available stands: ${thisStation.available_bike_stands}<br>Card payment: ${banking}</p></div>`,
        });
      }
    });

    // click event to open info window
    marker.addListener('click', () => {
      // any currently open window will close when another marker is clicked
      if (openStationWindow) {
        openStationWindow.close();
      }
      marker.stationWindow.open(map, marker);
      openStationWindow = marker.stationWindow;
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
function getStationInformation() {
  fetch("/stations")
    .then((response) => response.json())
    .then((stationData) => {
      console.log("fetch response", typeof stationData);
      fetch("/availability")
        .then((response) => response.json())
        .then((availabilityData) => {
          console.log("fetch response", typeof availabilityData);
          addMarkers(stationData, availabilityData);
          });
      });
  }

 // used to display current weather info
function getWeatherInformation() {
  fetch("/current_weather")
    .then((response) => response.json())
    .then((weatherData) => {
      console.log("fetch response", typeof weatherData);
      // convert from kelvin to celcius
      var temp = Math.floor(weatherData[0].temp - 273.15);
      const html = `${temp}&deg;C <img src="http://openweathermap.org/img/w/${weatherData[0].icon_code}.png">`;
      document.getElementById("weather").innerHTML = html;
  });
} 

getWeatherInformation()

function initMap() {
  map = new google.maps.Map(document.getElementById("map"), {
    center: { lat: 53.346077, lng: -6.269475 },
    zoom: 14,
  });
  const bikeLayer = new google.maps.BicyclingLayer();

  bikeLayer.setMap(map);
  getStationInformation();
  //display_current_location(map);

  google.maps.event.addDomListener(window, 'load', autocompletePlaces)

}
// Function to autocomplete list, currently commented out so as not to go over Google Maps API request limit
function autocompletePlaces(callback) {
  const input = document.getElementById("destination");
  const autocomplete = new google.maps.places.Autocomplete(input);

  autocomplete.addListener('place_changed', function () {
    const place = autocomplete.getPlace();
  });
}

// Currently disabled
// displays the current location of the user
function display_current_location(map) {
  // creates an info window that shows the user there current location
  currentLocationWindow = new google.maps.InfoWindow({
      content: `<div style="color: black;"><p>Current Location</p></div>`,
    });


  const locationButton = document.getElementById('stations');

  locationButton.innerHTMl = "<option value ='Current Location'>";
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

function showRoute() {
  let x = 5
  console.log(x)
}

window.initMap = initMap;
console.log("destination");