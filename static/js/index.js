let map;
let currentLocationWindow; // used to show the user where they are currently on the map
let stationWindow;  // used to create info window for each marker
let openStationWindow;  // used to make sure only one info window is open at a time
let originMarker;
let greenStation;
let orangeStation;
let redStation;
let userHasBikeFlag = true;
let latestAvailability = {};  // used to store current availability info in a global object
let markers = {}  // to store each map marker object


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
    markers[station.number] = marker;

    // iterate through availability info for each station
    availability.forEach(thisStation => {

      // get the correct availability for this station
      if (thisStation.number == station.number) {

        // display different marker icon depending on whether user is looking for bike or an empty stand
        greenStation = {
          path: google.maps.SymbolPath.CIRCLE,
          fillColor: '#32A432',
          fillOpacity: 1,
          strokeWeight: 2,
          strokeColor: '#FFFFFF',
          scale: 14
        };
          
        orangeStation = {
          path: google.maps.SymbolPath.CIRCLE,
          fillColor: '#EFB700',
          fillOpacity: 1,
          strokeWeight: 2,
          strokeColor: '#FFFFFF',
          scale: 14
        };

        redStation = {
          path: google.maps.SymbolPath.CIRCLE,
          fillColor: '#FF0000',
          fillOpacity: 1,
          strokeWeight: 2,
          strokeColor: '#FFFFFF',
          scale: 14
        };
        
        // set initial markers as if user wants a bike 
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
          Object.assign(latestAvailability, availabilityData);
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
  console.log(markers);
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
  //display_current_location(map); - currently disabled

  //creates routing and autocompletion dropdown
  new AutocompleteDirectionsHandler(map);

  //checks forecast button is clicked
  document.getElementById("forecast").addEventListener("click", forecastPlanner);

  //checks journey button is clicked
  document.getElementById("journey").addEventListener("click", journeyPlanner);

  //checks start button for forecast is clicked
  document.getElementById("start_prediction").addEventListener("click", startPrediction);
}
//used to calculate the nearest station as the crow flies
function rad(x) {return x*Math.PI/180;}

//provides dropdown list of origin options
class AutocompleteDirectionsHandler {
  map;
  originLatLng;
  travelMode;
  directionsService;
  directionsRenderer;

  //constructs all variables of the class
  //Ref: https://developers.google.com/maps/documentation/javascript/examples/places-autocomplete-directions
  constructor(map) {
    this.map = map;
    this.originLatLng = "";
    this.destinationLatLng = "";
    this.travelMode = google.maps.TravelMode.WALKING;
    this.directionsService = new google.maps.DirectionsService();
    this.directionsRenderer = new google.maps.DirectionsRenderer({suppressMarkers: true});
    this.directionsRenderer.setMap(map);

    const originInput = document.getElementById("origin");
    //gets the geocoordinates of the origin
    const originAutocomplete = new google.maps.places.Autocomplete(
      originInput,
      { fields: ["geometry"] }
    );

    //user can choose public transport, walking or driving to the nearest available bike stand
    this.setupClickListener(
      "changemode-walking",
      google.maps.TravelMode.WALKING,
        originAutocomplete
    );
    this.setupClickListener(
      "changemode-transit",
      google.maps.TravelMode.TRANSIT,
        originAutocomplete
    );
    this.setupClickListener(
      "changemode-driving",
      google.maps.TravelMode.DRIVING,
        originAutocomplete
    );
    //setups listeners for changing to the routing
    this.setupPlaceChangedListener(originAutocomplete, "ORIG");
    this.startJourneyButton(originAutocomplete);
    this.getBike(originAutocomplete);
    this.returnBike(originAutocomplete);
  }

  //Routes if start is clicked
  startJourneyButton(originAutocomplete) {
    document.getElementById("start_route").addEventListener("click", () => {
      this.setupPlaceChangedListener(originAutocomplete, "ORIG");
    });
  }

  //Reroutes when get bike button is clicked
  getBike(originAutocomplete) {
    document.getElementById("getBike").addEventListener("click", () => {

      // if user wants bike, change markers to reflect bike availability
      latestAvailability.forEach(station => {

        markers.forEach(marker => {
          if (markers[station.number]) {
            if (station.available_bikes == 0) {
              marker.setIcon(redStation);
            } else if (station.available_bikes <= 5 && station.available_bikes >= 1) {
                marker.setIcon(orangeStation);
            } else {
                marker.setIcon(greenStation);
            }
          }
        });
      });

      userHasBikeFlag = true;
      this.setupPlaceChangedListener(originAutocomplete, "ORIG");
    });
  }

  //Reroutes when return bike button is clicked
  returnBike(originAutocomplete) {
    document.getElementById("returnBike").addEventListener("click", () => {

      // if user wants to return bike, change markers to reflect stand availability 
      latestAvailability.forEach(station => {

        markers.forEach(marker => {
          if (markers[station.number]) {
            if (station.available_bike_stands == 0) {
              marker.setIcon(redStation);
            } else if (station.available_bike_stands <= 5 && station.available_bike_stands >= 1) {
                marker.setIcon(orangeStation);
            } else {
                marker.setIcon(greenStation);
            }
          }
        });
      });

      userHasBikeFlag = false;
      this.setupPlaceChangedListener(originAutocomplete, "ORIG");
    });
  }

  // Sets a listener on a radio button to change the filter type on Places Autocomplete
  setupClickListener(id, mode, originAutocomplete) {
    const radioButton = document.getElementById(id);

    radioButton.addEventListener("click", () => {
      this.travelMode = mode;
      this.setupPlaceChangedListener(originAutocomplete, "ORIG");
    });
  }

  setupPlaceChangedListener(autocomplete) {
    //dropdown menu will prioritise places in view
    autocomplete.bindTo("bounds", this.map);
    // Ref: https://developers.google.com/maps/documentation/javascript/examples/place-search
      const originAddress = document.getElementById("origin").value;
      let request = {
      query: originAddress,
      fields: ['geometry'],
      };

      //service returns the geocoordinates of the inputted place
      let service = new google.maps.places.PlacesService(this.map);
      service.findPlaceFromQuery(request, (results, status) => {
        if (status === google.maps.places.PlacesServiceStatus.OK  && results) {
          this.originLatLng = results[0].geometry.location;

          //finds the nearest station that has bikes available to the origin address
          fetch("/stations")
          .then((response) => response.json())
          .then((stationData) => {
            console.log("fetch response", typeof stationData);
            fetch("/availability")
            .then((response) => response.json())
            .then((availabilityData) => {
              let bikeStands = [];
              let shortestGeoDistance = [];
              Object.assign(latestAvailability, availabilityData);

              //gets the lat and lng values for the chosen station from the dropdown
              let glat = this.originLatLng.lat();
              let glng = this.originLatLng.lng();
              console.log("fetch response", typeof availabilityData);

              //flag checks if the user is getting or returning a bike
              if (userHasBikeFlag == true) {
                //checks that there are bikes available
                availabilityData.forEach(availableBikes => {
                  if (availableBikes.available_bikes > 0) {
                    let standNum = availableBikes.number;
                    bikeStands.push(standNum);
                  }
                });
              } else {
                //checks that there are bike stands available
                availabilityData.forEach(availableBikes => {
                  if (availableBikes.available_bike_stands > 3) {
                    let standNum = availableBikes.number;
                    bikeStands.push(standNum);
                  }
                });
              }
              //finds the closest bike stand based on geographical distance
              stationData.forEach(station => {
                if (bikeStands.includes(station.number)) {
                  let R = 6371; // radius of earth in km
                  let slat = station.position_lat;
                  let slng = station.position_lng;
                  let dLat = rad(slat - glat);
                  let dLong = rad(slng - glng);
                  let a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
                      Math.cos(rad(glat)) * Math.cos(rad(glat)) * Math.sin(dLong / 2) * Math.sin(dLong / 2);
                  let c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
                  let d = R * c;
                  //stores all the values in an array of arrays
                    shortestGeoDistance.push([[slat, slng], d]);
                }
              });

              //sorts the array and takes the top 8 values
              shortestGeoDistance.sort((a, b) => a[1] - b[1]);
              shortestGeoDistance = shortestGeoDistance.slice(0, 8);
              let shortestStreetsDistance = Infinity;

              //create an array of promises for each value of ShortestStreetsDistance to prevent the route()
              // function from running before the actual shortest distance is found
              const promises = shortestGeoDistance.map(distance => {
                return new Promise((resolve, reject) => {
                let sdLat = distance[0][0];
                let sdLng = distance[0][1];
                let closestDestination = {lat: sdLat, lng: sdLng};

                //uses the Google Maps service to find the closest station by distance using streets rather
                  // than geographical distance
                this.directionsService.route(
                {
                  origin: this.originLatLng ,
                  destination: closestDestination ,
                  travelMode: this.travelMode,
                },
                (response, status) => {
                  if (status === "OK") {

                    // parsing response object to get distance
                    let d =  response.routes[ 0 ].legs[ 0 ].distance.value;
                    if (d < shortestStreetsDistance) {
                      shortestStreetsDistance = d;
                      this.destinationLatLng = {lat: sdLat, lng: sdLng};
                    }
                    // if the code ran ok, response of OK sent back and next iteration occurs
                    resolve();
                  } else {
                    reject(status);
                  }
                });
                });

              });
              // waits until all promises are resolved then this.route() is called
              Promise.all(promises)
                .then(() => {
                  this.route();
                })
                .catch((error) => {
                  console.error(error);
                });
            });
          });
        }
      });
  }
  route() {
    if (!this.originLatLng || !this.destinationLatLng) {
      return;
    }

    //finds and renders the route from origin to the closest bike stand
    const me = this;
    this.directionsService.route(
      {
        origin: this.originLatLng ,
        destination: this.destinationLatLng ,
        travelMode: this.travelMode,
      },
      (response, status) => {
        if (status === "OK") {
          me.directionsRenderer.setDirections(response);
          //customises the route markers
          if (typeof originMarker != "undefined"){
            originMarker.setMap(null);
          }
          let leg = response.routes[ 0 ].legs[ 0 ];
          makeMarker(leg.start_location, icons.start, "title");
        } else {
          window.alert("Directions request failed due to " + status);
        }
      }
    );

    //checks whether a click happened and removes the route
    map.addListener('click', () => {
        me.directionsRenderer.setMap(null);
        originMarker.setMap(null);
    });

    //custom markers for the routing rendering
    var icons = {
    start: new google.maps.MarkerImage(
     // URL
     "/static/images/startRouteMarker.png",
     // (width,height)
     new google.maps.Size( 32, 35 ),
     // The origin point (x,y)
     new google.maps.Point( 0, 0 ),
     // The anchor point (x,y)
     new google.maps.Point( 22, 32 )
    )
   };

    //function to make custom markers for the routing
    function makeMarker( position, icon, title ) {
      originMarker = new google.maps.Marker({
      position: position,
      map: map,
      icon: icon,
      title: title
      });
    }
  }
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

//removes journey planner options and shows forecast options with station data
function forecastPlanner(){
  document.getElementById("journey_planner").style.display = "none";
  document.getElementById("forecast_planner").style.display = "block";

  //populates station location dropdown
  fetch("/stations")
    .then((response) => response.json())
    .then((stations_list) => {
      let station_locations = ""
      stations_list.forEach(station => {
        station_locations += "<option value ='" + station.address + "'>"
      });
      document.getElementById('stations_list').innerHTML = station_locations;
    });
}

//removes forecast options and displays journey planner options
function journeyPlanner(){
  document.getElementById("journey_planner").style.display = "block";
  document.getElementById("forecast_planner").style.display = "none";
}

//gets inputs from forecast form
function startPrediction() {
  const station = document.getElementById("stations").value;
  const date = document.getElementById("date").value;
  const time = document.getElementById("time").value;

  console.log(station);
  console.log(date);
  console.log(time);
}

window.initMap = initMap;
