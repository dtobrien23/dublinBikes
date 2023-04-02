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
        const greenStation = "/static/images/green-dot.png";
        const redStation = "/static/images/red-dot.png";
        if (thisStation.available_bikes >= 5) {
          marker.setIcon(greenStation);
        } else {
          marker.setIcon(redStation);
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

function initMap() {
  map = new google.maps.Map(document.getElementById("map"), {
    center: {lat: 53.349811, lng: -6.260259},
    zoom: 14,
  });
  const bikeLayer = new google.maps.BicyclingLayer();

  bikeLayer.setMap(map);
  getStationInformation();
  //display_current_location(map); - currently disabled

  //creates routing and autocompletion dropdown
  new AutocompleteDirectionsHandler(map);
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
    //just get the geocoordinates of the origin
    const originAutocomplete = new google.maps.places.Autocomplete(
      originInput,
      { fields: ["geometry"] }
    );

    //user can choose public transport, walking or driving to the nearest available bike stand
    this.setupClickListener(
      "changemode-walking",
      google.maps.TravelMode.WALKING
    );
    this.setupClickListener(
      "changemode-transit",
      google.maps.TravelMode.TRANSIT
    );
    this.setupClickListener(
      "changemode-driving",
      google.maps.TravelMode.DRIVING
    );
    this.setupPlaceChangedListener(originAutocomplete, "ORIG");
  }
  // Sets a listener on a radio button to change the filter type on Places Autocomplete
  setupClickListener(id, mode) {
    const radioButton = document.getElementById(id);

    radioButton.addEventListener("click", () => {
      this.travelMode = mode;
      this.route();
    });
  }
  //populates locations dropdown
  setupPlaceChangedListener(autocomplete) {
    //dropdown menu will prioritise places in view
    autocomplete.bindTo("bounds", this.map);
    // Ref: https://developers.google.com/maps/documentation/javascript/examples/place-search
    //onclick of the start button the location geocoordinates are fetched
    const button = document.getElementById("start");
    button.addEventListener("click", () => {

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
        }
      });

      //finds the nearest station that has bikes available to the origin address
      fetch("/stations")
      .then((response) => response.json())
      .then((stationData) => {
        console.log("fetch response", typeof stationData);
        fetch("/availability")
        .then((response) => response.json())
        .then((availabilityData) => {
          let availableBikeStands = [];
          let shortestDistance = Infinity;
          let glat = this.originLatLng.lat();
          let glng = this.originLatLng.lng();
          console.log("fetch response", typeof availabilityData);

          //checks that there are bikes available
          availabilityData.forEach(availableBikes => {
            if (availableBikes.available_bikes > 0) {
              let standNum = availableBikes.number
              availableBikeStands.push(standNum);
            }
          })

          //finds the closest bike stand with bikes available
          stationData.forEach(station => {
            let R = 6371; // radius of earth in km
            let slat = station.position_lat;
            let slng = station.position_lng;
            let dLat = rad(slat - glat);
            let dLong = rad(slng - glng);
            let a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
                Math.cos(rad(glat)) * Math.cos(rad(glat)) * Math.sin(dLong / 2) * Math.sin(dLong / 2);
            let c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
            let d = R * c;
            if (availableBikeStands.includes(station.number)) {
              if (d < shortestDistance) {
                shortestDistance = d;
                this.destinationLatLng = {lat: slat, lng: slng};
                }
              }
          });
          //runs the routing function to render the route
          this.route();
        });
      });
    });
  }
  route() {

    //custom markers for the routing rendering
    var icons = {
    start: new google.maps.MarkerImage(
     // URL
     "/static/images/clouds.png",
     // (width,height)
     new google.maps.Size( 44, 32 ),
     // The origin point (x,y)
     new google.maps.Point( 0, 0 ),
     // The anchor point (x,y)
     new google.maps.Point( 22, 32 )
    ),
    end: new google.maps.MarkerImage(
     // URL
     "/static/images/rain.png",
     // (width,height)
     new google.maps.Size( 44, 32 ),
     // The origin point (x,y)
     new google.maps.Point( 0, 0 ),
     // The anchor point (x,y)
     new google.maps.Point( 22, 32 )
    )
   };

    if (!this.originLatLng || !this.destinationLatLng) {
      return;
    }

    //finds and renders the route from origin to the closest bike stand
    const me = this;
    let directionsFlag = 0;
    this.directionsService.route(
      {
        origin: this.originLatLng ,
        destination: this.destinationLatLng ,
        travelMode: this.travelMode,
      },
      (response, status) => {
        if (status === "OK") {
          me.directionsRenderer.setDirections(response);
          directionsFlag = 1

          //customises the route markers
          let leg = response.routes[ 0 ].legs[ 0 ];
          makeMarker(leg.start_location, icons.start, "title");
          makeMarker(leg.end_location, icons.end, 'title');
        } else {
          window.alert("Directions request failed due to " + status);
        }
      }
    );

    //flag checks whether there is a route displayed and if a click happens the route is removed
    map.addListener('click', () => {
      if (directionsFlag == 1) {
        me.directionsRenderer.setMap(null);
        directionsFlag = 0;
      }
    });

    //function to make custom markers for the routing
    function makeMarker( position, icon, title ) {
      new google.maps.Marker({
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

window.initMap = initMap;
