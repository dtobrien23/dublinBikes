let map;
let currentLocationWindow; // used to show the user where they are currently on the map
let stationWindow;  // used to create info window for each marker
let openStationWindow;  // used to make sure only one info window is open at a time
let originMarker;
let greenStation;
let orangeStation;
let redStation;
let userHasBikeFlag = true;
let chartsDisplayed = false;
let hourlyChart;
let dailyChart;
let latestAvailability = [];  // used to store current availability info in a global object
let markers = {}  // to store each map marker object
let station_locations = ""
let stationInputs = [];

function addMarkers(stations, availability) {

  // add a marker to the map for each station
  stations.forEach(station => {
    const marker = new google.maps.Marker({
      position: {
        lat: station.position_lat,
        lng: station.position_lng,
      },
      map: map,
      title: station.address,
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
        content: `<div style="color: black;"><h1>${station.address}</h1><p>Status: ${thisStation.status}<br>Available bikes: ${thisStation.available_bikes}<br>
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
      document.getElementById("stations").value = marker.title;
      if(document.getElementById("chartContainer").style.display === "block" &&
        document.getElementById("forecast_date").value !== "" &&
        document.getElementById("forecast_time").value !== ""){
        startPrediction()
      }
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
      fetch("/availability")
        .then((response) => response.json())
        .then((availabilityData) => {
          addMarkers(stationData, availabilityData);
          Object.assign(latestAvailability, availabilityData);
          });
      });
}

 // used to display current weather info
function getWeatherInformation() {
  fetch("/weather")
    .then((response) => response.json())
    .then((weatherData) => {

      // current weather 

      // description
      let now = new Date();
      let dateOptions = { weekday: 'long', day: 'numeric', month: 'long' };
      let timeOptions = { hour: 'numeric', minute: 'numeric' };
      let date = now.toLocaleDateString('en-IE', dateOptions);
      let time = now.toLocaleTimeString('en-IE', timeOptions);
      let html = `${date}<br>${time}`   
      document.getElementById("date").innerHTML = html;

      html = weatherData.current.weather[0].main;
      document.getElementById("desc").innerHTML = html;

      // icon
      let icon = weatherData.current.weather[0].icon;
      html = `<img src="https://openweathermap.org/img/w/${weatherData.current.weather[0].icon}.png" style="width: 100%; height: 120px;"></img>`
      document.getElementById("icon").innerHTML = html;
      
      // temperature
      let temp = Math.floor(weatherData.current.temp - 273.15);  // convert from kelvin to celcius
      html = `${temp}&deg;`;
      document.getElementById("current-temp").innerHTML = html;

      
      // weather forecast
      let forecast = weatherData.daily.slice(1);

      day = forecast[0]
      icon = day.weather[0].icon;
      temp = Math.floor(day.temp.max - 273.15);
      let today = new Date(day.dt * 1000);
      let dayOfWeek = today.toLocaleString('en-IE', { weekday: 'long' });

      html = `<img src="https://openweathermap.org/img/w/${icon}.png" style="display: block; margin: 0 auto;">
      <h4 style="text-align: center;">${temp}&deg;</h4><p style="font-size: 12px; text-align:center;">${dayOfWeek}</p>`
      document.getElementById("forecast1").innerHTML = html;

      day = forecast[1]
      icon = day.weather[0].icon;
      temp = Math.floor(day.temp.max - 273.15);
      today = new Date(day.dt * 1000);
      dayOfWeek = today.toLocaleString('en-IE', { weekday: 'long' });

      html = `<img src="https://openweathermap.org/img/w/${icon}.png" style="display: block; margin: 0 auto;">
      <h4 style="text-align: center;">${temp}&deg;</h4><p style="font-size: 12px; text-align:center;">${dayOfWeek}</p>`
      document.getElementById("forecast2").innerHTML = html;

      day = forecast[2]
      icon = day.weather[0].icon;
      temp = Math.floor(day.temp.max - 273.15);
      today = new Date(day.dt * 1000);
      dayOfWeek = today.toLocaleString('en-IE', { weekday: 'long' });

      html = `<img src="https://openweathermap.org/img/w/${icon}.png" style="display: block; margin: 0 auto;">
      <h4 style="text-align: center;">${temp}&deg;</h4><p style="font-size: 12px; text-align:center;">${dayOfWeek}</p>`
      document.getElementById("forecast3").innerHTML = html;

      day = forecast[3]
      icon = day.weather[0].icon;
      temp = Math.floor(day.temp.max - 273.15);
      today = new Date(day.dt * 1000);
      dayOfWeek = today.toLocaleString('en-IE', { weekday: 'long' });

      html = `<img src="https://openweathermap.org/img/w/${icon}.png" style="display: block; margin: 0 auto;">
      <h4 style="text-align: center;">${temp}&deg;</h4><p style="font-size: 12px; text-align:center;">${dayOfWeek}</p>`
      document.getElementById("forecast4").innerHTML = html;

      day = forecast[4]
      icon = day.weather[0].icon;
      temp = Math.floor(day.temp.max - 273.15);
      today = new Date(day.dt * 1000);
      dayOfWeek = today.toLocaleString('en-IE', { weekday: 'long' });

      html = `<img src="https://openweathermap.org/img/w/${icon}.png" style="display: block; margin: 0 auto;">
      <h4 style="text-align: center;">${temp}&deg;</h4><p style="font-size: 12px; text-align:center;">${dayOfWeek}</p>`
      document.getElementById("forecast5").innerHTML = html;
  });
} 

getWeatherInformation()

function initMap() {
  map = new google.maps.Map(document.getElementById("map"), {
    center: { lat: 53.346077, lng: -6.269475 },
    zoom: 14,
    streetViewControl: false
  });
  const bikeLayer = new google.maps.BicyclingLayer();

  bikeLayer.setMap(map);
  getStationInformation();

  //creates routing and autocompletion dropdown
  new AutocompleteDirectionsHandler(map);

  //onload these buttons are shown as the default preselected options
  const journey = document.getElementById("journey");
  journey.style.backgroundColor = "#d3d3d3";
  journey.style.color = "black";

  const getBikeButton = document.getElementById("getBike");
  getBikeButton.style.backgroundColor = "#d3d3d3";
  getBikeButton.style.color = "black";

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
    this.findCurrentLocation();
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

      const returnBikeButton = document.getElementById("returnBike");
      returnBikeButton.style.backgroundColor = "#094e78";
      returnBikeButton.style.color = "white";

      const getBikeButton = document.getElementById("getBike");
      getBikeButton.style.backgroundColor = "#d3d3d3";
      getBikeButton.style.color = "black";
      
      // if user wants bike, change markers to reflect bike availability
      latestAvailability.forEach(station => {
        for (let key in markers) {
          const marker = markers[key]; 
          if (key == station.number) {
            if (station.available_bikes == 0) {
              marker.setIcon(redStation);
            } else if (station.available_bikes <= 5 && station.available_bikes >= 1) {
                marker.setIcon(orangeStation);
            } else {
                marker.setIcon(greenStation);
            }
          }
        }
      });

      userHasBikeFlag = true;
      this.setupPlaceChangedListener(originAutocomplete, "ORIG");
    });
  }

  //Reroutes when return bike button is clicked
  returnBike(originAutocomplete) {
    document.getElementById("returnBike").addEventListener("click", () => {

      const getBikeButton = document.getElementById("getBike");
      getBikeButton.style.backgroundColor = "#094e78";
      getBikeButton.style.color = "white";

      const returnBikeButton = document.getElementById("returnBike");
      returnBikeButton.style.backgroundColor = "#d3d3d3";
      returnBikeButton.style.color = "black";

      // if user wants to return bike, change markers to reflect stand availability 
      latestAvailability.forEach(station => {
        for (let key in markers) {
          const marker = markers[key]; 
          if (key == station.number) {
            if (station.available_bike_stands == 0) {
              marker.setIcon(redStation);
            } else if (station.available_bike_stands <= 5 && station.available_bike_stands >= 1) {
                marker.setIcon(orangeStation);
            } else {
                marker.setIcon(greenStation);
            }
          }
        }
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

  //on click this autopopulates the input box with the users current location and sets it as the origin
  //Ref: https://developers.google.com/maps/documentation/javascript/geocoding;
  // https://developers.google.com/maps/documentation/javascript/geolocation
  findCurrentLocation() {
    const geocoder = new google.maps.Geocoder();

    document.getElementById("current_location").addEventListener("click", () => {
      const loadingLocationCircle = document.getElementById("loading-location-circle");
      loadingLocationCircle.style.display = "block";

      // Try HTML5 geolocation.
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const pos = {
            lat: position.coords.latitude,
            lng: position.coords.longitude,
          };

          currentLocationWindow = new google.maps.InfoWindow({
              content: `<div style="color: black;"><p>Current Location</p></div>`,
          });

          currentLocationWindow.setPosition(pos);
          currentLocationWindow.open(map);
          map.setCenter(pos);
          loadingLocationCircle.style.display = "none";
          geocoder.geocode( { location: pos}, function(results, status) {
            if (status == 'OK') {
              document.getElementById("origin").value = results[0].formatted_address;
            } else {
                handleLocationError(true, currentLocationWindow);
                alert('Geocode was not successful for the following reason: ' + status);
            }
          });

          },
        () => {
          loadingLocationCircle.style.display = "none";
          handleLocationError(true, currentLocationWindow);
        },
          {enableHighAccuracy: true}
      );
    } else {
      // Browser doesn't support Geolocation
      loadingLocationCircle.style.display = "none";
      handleLocationError(false, currentLocationWindow);
    }
    });
  }

  setupPlaceChangedListener(autocomplete) {
    const loadingLocationCircle = document.getElementById("loading-location-circle");
    //dropdown menu will prioritise places in view
    autocomplete.bindTo("bounds", this.map);
    // Ref: https://developers.google.com/maps/documentation/javascript/examples/place-search
      const originAddress = document.getElementById("origin").value;
      let request = {
      query: originAddress,
      fields: ['geometry'],
      };

      if (typeof currentLocationWindow != "undefined"){
            currentLocationWindow.setMap(null);
          }

      //service returns the geocoordinates of the inputted place
      let service = new google.maps.places.PlacesService(this.map);
      service.findPlaceFromQuery(request, (results, status) => {
        if (status === google.maps.places.PlacesServiceStatus.OK  && results) {
          loadingLocationCircle.style.display = "block";
          this.originLatLng = results[0].geometry.location;

          //finds the nearest station that has bikes available to the origin address
          fetch("/stations")
          .then((response) => response.json())
          .then((stationData) => {
            fetch("/availability")
            .then((response) => response.json())
            .then((availabilityData) => {
              let bikeStands = [];
              let shortestGeoDistance = [];
              Object.assign(latestAvailability, availabilityData);

              //gets the lat and lng values for the chosen station from the dropdown
              let glat = this.originLatLng.lat();
              let glng = this.originLatLng.lng();

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
              shortestGeoDistance = shortestGeoDistance.slice(0, 3);
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
                  this.route(loadingLocationCircle);
                })
                .catch((error) => {
                  console.error(error);
                });
            });
          });
        }
      });
  }
  route(loadingLocationCircle) {
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
          makeMarker(leg.start_location, icons.start, "Current Location");
        } else {
          window.alert("Directions request failed due to " + status);
        }
        loadingLocationCircle.style.display = "none";
      }
    );

    //checks whether a click happened and removes the route
    map.addListener('click', () => {
      me.directionsRenderer.setDirections({routes: []});
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

// runs if the user doesn't allow their location to be shared or browser does not support geolocation
 function handleLocationError(browserHasGeolocation, currentLocationWindow) {
    currentLocationWindow = new google.maps.InfoWindow({
        content: `<div style="color: black;"><p>Current Location Could Not Be Found</p></div>`,
    });
    currentLocationWindow.setPosition({ lat: 53.346077, lng: -6.269475 });
    currentLocationWindow.open(map);
  }


//removes journey planner options and shows forecast options with station data
function forecastPlanner(){
  document.getElementById("journey_planner").style.display = "none";
  document.getElementById("forecast_planner").style.display = "block";

  const journey = document.getElementById("journey");
  journey.style.backgroundColor = "#094e78";
  journey.style.color = "white";

  const forecast = document.getElementById("forecast");
  forecast.style.backgroundColor = "#d3d3d3";
  forecast.style.color = "black";

  //populates station location dropdown
  fetch("/stations")
    .then((response) => response.json())
    .then((stations_list) => {
      stations_list.forEach(station => {
        let address = station.address.replace("'", "&#39;"); // html would not read " ' " chars in station name
        station_locations += "<option value ='" + address + "'>";
        stationInputs.push(address);
      });
      document.getElementById('stations_list').innerHTML = station_locations;
    });
  }


//removes forecast options and displays journey planner options
function journeyPlanner() {
  document.getElementById("journey_planner").style.display = "block";
  document.getElementById("forecast_planner").style.display = "none";
  const journey = document.getElementById("journey");
  journey.style.backgroundColor = "#d3d3d3";
  journey.style.color = "black";

  const forecast = document.getElementById("forecast");
  forecast.style.backgroundColor = "#094e78";
  forecast.style.color = "white";
}


function edgeCases() {
  let selectedStation = document.getElementById("stations").value;
  selectedStation = selectedStation.replace("'", "&#39;")  // for stations with " ' " to be recognised

  let userCorrectStation;
  let userCorrectDate;
  let userCorrectTime;

  for (var i = 0; i < stationInputs.length; i++) {
    var thisStation = stationInputs[i];
    if (selectedStation.includes(thisStation)) {
      userCorrectStation = true;
      break;
    } else if (i == stationInputs.length - 1 && !selectedStation.includes(thisStation)) {
      alert("Error! You must select a valid station (ensure you are clicking on your station of choice from the dropdown).")
      userCorrectStation = false;
    }
  }

  // Get the current date 
  var today = new Date();
  var maxDate = new Date(today.getTime() + 7 * 24 * 60 * 60 * 1000);
  var selectedDate = document.getElementById("forecast_date").value;
  var sDateDate = new Date(selectedDate)
  
  today.setHours(0, 0, 0, 0); // Set time values to zero
  sDateDate.setHours(0, 0, 0, 0); // Set time values to zero

  if (sDateDate < today || sDateDate > maxDate) {
    alert("Error! You must select a date between now and the next 7 days.");    
    userCorrectDate = false;
  } else {
    userCorrectDate = true;
  };

  // check that user enters a date
  if (selectedDate == "") {
    alert("Error! You must input a date.")
    userCorrectDate = false;
  } else {
    userCorrectDate = true;
  };

  // limit time inputs
  var selectedTime = document.getElementById("forecast_time").value;
  var sTimeDateObject = new Date(`1970-01-01T${selectedTime}:00`);
  var sTimeHour = sTimeDateObject.getHours();
  var sTimeMinutes = sTimeDateObject.getMinutes();

  if (sTimeHour > 0 && sTimeHour < 5) {
    alert("Error! Bike stations do not open until 5 a.m.")
    userCorrectDate = false;
  } else if (sTimeHour == 0 && sTimeMinutes > 30) {
    alert("Error! Bike stations close at 12:30 a.m.");
    userCorrectTime = false;
  } else {
    userCorrectTime = true;
  };

  // check that user enters a time
  if (selectedTime == "") {
    alert("Error! You must input a time.")
    userCorrectTime = false;
  } else {
    userCorrectTime = true;
  };

  if (userCorrectStation == true && userCorrectDate == true && userCorrectTime == true){
    displayForecast();
  }
}


//gets inputs from forecast form
function startPrediction(event) {
    if (event) {
        event.preventDefault();
    }

  const form = document.getElementById("forecast_planner");

  form.addEventListener("submit", edgeCases());

  const data = new FormData(form);
  fetch("/forecast_form", {
    method: "POST",
    body: data,
  })
    .then(response => {
      if (response.ok) {
        return response.text();
      }
      throw new Error("Network response was not okay");
    })
    .catch(error => {
      console.error("Error submitting form", error);
    });
}

//shows the sidebar with forecast info and makes the map move to one side
function displayForecast(){
  const mapDisplay = document.getElementById("map")
  mapDisplay.style.display = "flex";
  const chartContainer = document.getElementById("chartContainer");
  chartContainer.style.display = "block";
  const closeCharts = document.getElementById("closeCharts");
  const headInfo = document.getElementById("headInfo");
  headInfo.style.justifyContent = "flex-end";
  const hourly = document.getElementById("pred_hourly");
  const daily = document.getElementById("pred_daily");
  const station_info = document.getElementById("station_info");
  station_info.style.display = "none";
  const loadingChartCircle = document.getElementById("loading-chart-circle");
  loadingChartCircle.style.display = "block";

  closeCharts.addEventListener("click", () => {
    mapDisplay.style.display = "block";
    chartContainer.style.display = "none";
  });

  displayCharts(hourly, daily, station_info, chartContainer, loadingChartCircle, headInfo);
}


//creates the charts on the sidebar, the charts have to be destroyed before new ones can be made at the same id
function displayCharts(hourly, daily, station_info, chartContainer, loadingCircle, headInfo) {
  if (chartsDisplayed) {
    hourlyChart.destroy();
    dailyChart.destroy();
    document.getElementById("pred_hourly").style.width = "350px";
    document.getElementById("pred_daily").style.width = "350px";
  }
  setTimeout(() => {
  fetch("/predicted_availability")
    .then((response) => response.json())
    .then((predictions) => {
      let pred_hourly = Object.values(predictions["pred_avail_hourly"]);
      pred_hourly.splice(2, 4);
      pred_hourly.push(pred_hourly.shift());

      let pred_daily = Object.values(predictions["pred_avail_daily"]);

      let timeLabels = ['5am', '6am', '7am', '8am', '9am', '10am', '11am', '12pm', '1pm', '2pm', '3pm', '4pm', '5pm', '6pm',
            '7pm', '8pm', '9pm', '10pm', '11pm', '12am']
      let dayLabels = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday']

      station_info.innerHTML = "<h1>" + predictions["station_name"]
          + "</h1><p>Day: " + dayLabels[parseInt(predictions["user_day"]["day"])]
          + "</p><p>Time: " + predictions["user_hour"]["time_str"]
          +"</p><p>Available Bikes: " + predictions["pred_avail_hourly"][predictions["user_hour"]["hour"]] + "</p>";


    hourlyChart = new Chart(hourly, {
        type: 'bar',
        data: {
          labels: timeLabels,
          datasets: [{
            label: 'Hourly Available Bikes',
            data: pred_hourly,
            borderWidth: 1
          }]
        },
        options: {
          scales: {
            y: {
              beginAtZero: true,
              title: {
                display: true,
                text: '# Bikes'
              }
            },
            x: {
              title: {
                display: true,
                text: 'Hours'
              }
            }
          },
          responsive: true,
          maintainAspectRatio: true
        }
      });

    dailyChart = new Chart(daily, {
        type: 'bar',
        data: {
          labels: dayLabels,
          datasets: [{
            label: 'Daily Available Bikes',
            data: pred_daily,
            borderWidth: 1
          }]
        },
        options: {
          scales: {
            y: {
              beginAtZero: true,
              title: {
                display: true,
                text: '# Bikes'
              }
            },
            x: {
              title: {
                display: true,
                text: 'Days'
              }
            }
          },
          responsive: true,
          maintainAspectRatio: true
        }
      });
      chartsDisplayed = true;
      station_info.style.display = "block";
      loadingCircle.style.display = "none";
      headInfo.style.justifyContent = "space-between";
      chartContainer.style.display = "block";
  });
  }, 1000); // delay by 1 second
}

window.initMap = initMap;
