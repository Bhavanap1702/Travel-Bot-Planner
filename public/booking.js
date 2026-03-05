// booking.js - Integrated Hotel Display with Route Planner
// Location: D:\demo\travelbot\india-travel-bot\public\booking.js

class BookingSystem {
  constructor(map, markers, ragSystem) {
    this.map = map;
    this.markers = markers;
    this.ragSystem = ragSystem;
    this.bookings = [];
    this.hotelMarkers = [];
    this.currentBookingId = 1;
    this.currentRoute = null;
    this.routeHotels = [];
    
    // Accommodation types and pricing
    this.accommodationTypes = {
      'budget': {
        name: 'Budget Hotel',
        priceRange: { min: 800, max: 2000 },
        amenities: ['WiFi', 'Basic Breakfast', 'AC'],
        icon: '🏨'
      },
      'midrange': {
        name: 'Mid-range Hotel',
        priceRange: { min: 2000, max: 5000 },
        amenities: ['WiFi', 'Breakfast', 'AC', 'Room Service', 'TV'],
        icon: '🏨'
      },
      'luxury': {
        name: 'Luxury Hotel',
        priceRange: { min: 5000, max: 15000 },
        amenities: ['WiFi', 'All Meals', 'AC', 'Spa', 'Pool', 'Concierge'],
        icon: '🏰'
      },
      'heritage': {
        name: 'Heritage Property',
        priceRange: { min: 4000, max: 12000 },
        amenities: ['WiFi', 'Breakfast', 'AC', 'Cultural Experience', 'Garden'],
        icon: '🏛️'
      }
    };
    
    // Transport options
    this.transportTypes = {
      'taxi': { name: 'Private Taxi', pricePerKm: 15, icon: '🚖' },
      'suv': { name: 'SUV/Luxury Car', pricePerKm: 25, icon: '🚙' },
      'bus': { name: 'Tourist Bus', pricePerKm: 8, icon: '🚌' },
      'train': { name: 'Train', pricePerKm: 5, icon: '🚂' }
    };
    
    // Activity types
    this.activityTypes = {
      'guided_tour': { name: 'Guided Tour', price: 1500, duration: '3-4 hours', icon: '🎯' },
      'cultural_show': { name: 'Cultural Performance', price: 800, duration: '2 hours', icon: '🎭' },
      'adventure': { name: 'Adventure Activity', price: 2500, duration: '4-6 hours', icon: '⛰️' },
      'food_tour': { name: 'Food Tour', price: 1200, duration: '3 hours', icon: '🍽️' },
      'photography': { name: 'Photography Session', price: 2000, duration: '2-3 hours', icon: '📸' }
    };
    
    this.initializeBookingUI();
    this.loadBookingsFromStorage();
    this.setupRouteListener();
  }
  
  // Setup listener for route planning events
  setupRouteListener() {
    // Listen for custom route events from the route planner
    document.addEventListener('routePlanned', (event) => {
      const { route, waypoints, popularPlaces } = event.detail;
      this.handleRoutePlanned(route, waypoints, popularPlaces);
    });
    
    // Listen for route clear events
    document.addEventListener('routeCleared', () => {
      this.clearRouteHotels();
    });
  }
  
  // Handle route planned event
  async handleRoutePlanned(route, waypoints, popularPlaces) {
    console.log('Route planned, finding hotels...', waypoints, popularPlaces);
    this.currentRoute = route;
    
    // Clear existing hotel markers
    this.clearRouteHotels();
    
    // Show loading indicator
    this.showNotification('🔍 Finding hotels along your route...', 'info');
    
    try {
      // Extract coordinates from route
      const routeCoords = this.extractRouteCoordinates(route);
      
      // Find popular places along route
      const placesToSearch = this.identifyPlacesAlongRoute(routeCoords, waypoints, popularPlaces);
      
      // Fetch hotels for each place
      const hotelPromises = placesToSearch.map(place => 
        this.fetchHotelsNearPlace(place)
      );
      
      const allHotels = await Promise.all(hotelPromises);
      
      // Flatten and display hotels on map
      const hotels = allHotels.flat();
      
   if (hotels.length > 0) {
  // CHANGED: Store hotels but don't display markers automatically
  this.routeHotels = hotels;
  
  // Only show the panel, no markers on map yet
  this.showHotelsPanel(hotels);
  this.showNotification(`✅ Found ${hotels.length} hotels along your route. Click on a hotel to see it on the map.`, 'success');
} else {
        this.showNotification('No hotels found along this route', 'info');
      }
      
    } catch (error) {
      console.error('Error finding hotels:', error);
      this.showNotification('Unable to find hotels', 'error');
    }
  }
  // Display a single hotel marker on map
displaySingleHotelMarker(hotel) {
  // Clear any existing hotel markers first
  this.clearHotelMarkers();
  
  console.log(`Displaying marker for ${hotel.name} at [${hotel.lon}, ${hotel.lat}]`);
  
  if (!hotel.lat || !hotel.lon) {
    console.warn(`Cannot display hotel ${hotel.name} - missing coordinates`);
    return;
  }
  
  // Create hotel marker element
  const el = document.createElement('div');
  el.className = 'hotel-marker';
  el.innerHTML = '🏨';
  el.style.fontSize = '32px';
  el.style.cursor = 'pointer';
  el.style.filter = 'drop-shadow(0 2px 4px rgba(0,0,0,0.3))';
  el.style.transition = 'transform 0.2s';
  el.style.animation = 'markerBounce 0.5s ease-out';
  
  el.addEventListener('mouseenter', () => {
    el.style.transform = 'scale(1.2)';
  });
  
  el.addEventListener('mouseleave', () => {
    el.style.transform = 'scale(1)';
  });
  
  // Create detailed popup
  const popupContent = this.createHotelPopup(hotel);
  
  const popup = new maplibregl.Popup({ 
    offset: 25,
    maxWidth: '350px',
    className: 'hotel-popup'
  }).setHTML(popupContent);
  
  if (this.map) {
    const marker = new maplibregl.Marker(el)
      .setLngLat([hotel.lon, hotel.lat])
      .setPopup(popup)
      .addTo(this.map);
    
    // Store marker reference
    this.hotelMarkers.push({
      marker: marker,
      hotel: hotel
    });
    
    // Fly to the hotel location
    this.map.flyTo({
      center: [hotel.lon, hotel.lat],
      zoom: 14,
      duration: 1500
    });
    
    // Open the popup after flying
    setTimeout(() => {
      marker.togglePopup();
    }, 1600);
    
    console.log(`Successfully added marker for ${hotel.name}`);
  } else {
    console.error('Map object is not initialized');
  }
}
// Clear only hotel markers (not the route)
clearHotelMarkers() {
  this.hotelMarkers.forEach(hm => {
    hm.marker.remove();
  });
  this.hotelMarkers = [];
}
  
  // Extract coordinates from route geometry
  extractRouteCoordinates(route) {
    if (!route || !route.geometry) return [];
    
    // Handle GeoJSON LineString
    if (route.geometry.type === 'LineString') {
      return route.geometry.coordinates;
    }
    
    // Handle encoded polyline if needed
    if (typeof route.geometry === 'string') {
      // Decode polyline here if needed
      return [];
    }
    
    return [];
  }
  
  // Identify key places along the route
  identifyPlacesAlongRoute(routeCoords, waypoints = [], popularPlaces = []) {
    const places = [];
    
    // Add start and end waypoints
    if (waypoints && waypoints.length >= 2) {
      places.push({
        name: waypoints[0].name || 'Start',
        lat: waypoints[0].lat || waypoints[0][1],
        lon: waypoints[0].lon || waypoints[0][0],
        type: 'waypoint',
        priority: 'high'
      });
      
      places.push({
        name: waypoints[waypoints.length - 1].name || 'Destination',
        lat: waypoints[waypoints.length - 1].lat || waypoints[waypoints.length - 1][1],
        lon: waypoints[waypoints.length - 1].lon || waypoints[waypoints.length - 1][0],
        type: 'waypoint',
        priority: 'high'
      });
    }
    
    // Add popular places along the route
    if (popularPlaces && popularPlaces.length > 0) {
      popularPlaces.forEach(place => {
        places.push({
          name: place.name,
          lat: place.lat || place.coordinates?.[1],
          lon: place.lon || place.coordinates?.[0],
          type: 'attraction',
          priority: 'medium',
          description: place.description
        });
      });
    }
    
    // If no specific places, sample points along route
    if (places.length === 0 && routeCoords.length > 0) {
      const numSamples = Math.min(5, Math.floor(routeCoords.length / 50));
      for (let i = 0; i <= numSamples; i++) {
        const index = Math.floor((routeCoords.length - 1) * (i / numSamples));
        const coord = routeCoords[index];
        places.push({
          name: `Point ${i + 1}`,
          lon: coord[0],
          lat: coord[1],
          type: 'route-point',
          priority: 'low'
        });
      }
    }
    
    return places;
  }
  
  // Fetch hotels near a specific place
  async fetchHotelsNearPlace(place) {
    try {
      const radius = place.priority === 'high' ? 10000 : 5000; // 10km for waypoints, 5km for attractions
      
      const query = `
        [out:json][timeout:15];
        (
          node["tourism"="hotel"](around:${radius},${place.lat},${place.lon});
          way["tourism"="hotel"](around:${radius},${place.lat},${place.lon});
          node["tourism"="guest_house"](around:${radius},${place.lat},${place.lon});
        );
        out body 5;
      `;
      
      const response = await fetch('https://overpass-api.de/api/interpreter', {
        method: 'POST',
        body: query
      });
      
      const data = await response.json();
      
      return data.elements
        .filter(el => el.tags && el.tags.name)
        .map(el => ({
          id: el.id,
          name: el.tags.name,
          lat: el.lat || (el.center && el.center.lat),
          lon: el.lon || (el.center && el.center.lon),
          place: place.name,
          placeType: place.type,
          address: el.tags['addr:city'] || place.name,
          phone: el.tags.phone || el.tags['contact:phone'] || 'N/A',
          website: el.tags.website || el.tags['contact:website'] || null,
          stars: el.tags.stars || null,
          description: this.generateHotelDescription(el.tags, place),
          amenities: this.extractAmenities(el.tags),
          image: this.getHotelPlaceholderImage(el.tags.name, place.type)
        }));
        
    } catch (error) {
      console.error('Error fetching hotels near place:', error);
      return [];
    }
  }
  
  // Display hotels as markers on the map

  
  // Create detailed hotel popup HTML
  createHotelPopup(hotel) {
    const price = Math.floor(Math.random() * (5000 - 1500) + 1500);
    
    return `
      <div class="hotel-popup-content">
        <div class="hotel-popup-image" style="background-image: url('${hotel.image}');">
          ${hotel.stars ? `<div class="popup-stars">${'⭐'.repeat(parseInt(hotel.stars))}</div>` : ''}
        </div>
        <div class="hotel-popup-body">
          <h4 class="hotel-popup-title">${hotel.name}</h4>
          <div class="hotel-popup-location">📍 Near ${hotel.place}</div>
          <p class="hotel-popup-desc">${hotel.description.substring(0, 100)}...</p>
          <div class="hotel-popup-amenities">
            ${hotel.amenities.slice(0, 4).map(a => `<span class="popup-amenity">${a}</span>`).join('')}
          </div>
          <div class="hotel-popup-footer">
            <div class="hotel-popup-price">
              <span class="popup-price-label">From</span>
              <span class="popup-price-amount">₹${price.toLocaleString('en-IN')}</span>
              <span class="popup-price-period">/night</span>
            </div>
            <button class="popup-book-btn" onclick="bookingSystem.bookHotelFromMap('${hotel.id}', '${hotel.name}', '${hotel.place}', ${price})">
              Book Now
            </button>
          </div>
          ${hotel.phone !== 'N/A' ? `<div class="hotel-popup-contact">📞 ${hotel.phone}</div>` : ''}
        </div>
      </div>
    `;
  }
  
  // Show hotels in side panel
  showHotelsPanel(hotels) {
    const panel = document.getElementById('route-hotels-display');
    if (!panel) {
      this.createHotelsDisplayPanel();
    }
    
    const hotelsList = document.getElementById('hotels-display-list');
    
    // Group hotels by place
    const hotelsByPlace = {};
    hotels.forEach(hotel => {
      if (!hotelsByPlace[hotel.place]) {
        hotelsByPlace[hotel.place] = [];
      }
      hotelsByPlace[hotel.place].push(hotel);
    });
    
    let html = `
      <div class="hotels-display-header">
        <h4>🏨 Hotels Along Route (${hotels.length})</h4>
        <button onclick="bookingSystem.clearRouteHotels()" class="clear-hotels-btn">Clear All</button>
      </div>
    `;
    
    Object.entries(hotelsByPlace).forEach(([place, placeHotels]) => {
      html += `
        <div class="place-hotels-section">
          <h5 class="place-hotels-title">📍 ${place}</h5>
          <div class="place-hotels-list">
      `;
      
      placeHotels.forEach(hotel => {
        const price = Math.floor(Math.random() * (5000 - 1500) + 1500);
        
        html += `
<div class="compact-hotel-card" onclick="bookingSystem.showHotelOnMap('${hotel.id}')">            <div class="compact-hotel-image" style="background-image: url('${hotel.image}');"></div>
            <div class="compact-hotel-info">
              <div class="compact-hotel-name">${hotel.name}</div>
              ${hotel.stars ? `<div class="compact-stars">${'⭐'.repeat(parseInt(hotel.stars))}</div>` : ''}
              <div class="compact-hotel-amenities">
                ${hotel.amenities.slice(0, 3).map(a => `<span>${a}</span>`).join(' • ')}
              </div>
              <div class="compact-hotel-footer">
                <div class="compact-price">₹${price.toLocaleString('en-IN')}/night</div>
                <button class="compact-book-btn" onclick="event.stopPropagation(); bookingSystem.bookHotelFromMap('${hotel.id}', '${hotel.name}', '${hotel.place}', ${price})">
                  Book
                </button>
              </div>
            </div>
          </div>
        `;
      });
      
      html += `
          </div>
        </div>
      `;
    });
    
    hotelsList.innerHTML = html;
    
    // Show panel
    const displayPanel = document.getElementById('route-hotels-display');
    displayPanel.classList.add('show');
  }
  // Show hotel on map when clicked in panel
showHotelOnMap(hotelId) {
  const hotel = this.routeHotels.find(h => h.id == hotelId);
  if (hotel) {
    this.displaySingleHotelMarker(hotel);
  } else {
    console.warn(`Hotel ${hotelId} not found in routeHotels`);
  }
}
  
  // Create hotels display panel
  createHotelsDisplayPanel() {
    const panelHTML = `
      <div id="route-hotels-display" class="route-hotels-display">
        <div id="hotels-display-list"></div>
      </div>
    `;
    
    document.body.insertAdjacentHTML('beforeend', panelHTML);
  }
  
  // Focus on specific hotel on map
  focusHotelOnMap(hotelId) {
    const hotelMarker = this.hotelMarkers.find(hm => hm.hotel.id == hotelId);
    if (hotelMarker) {
      this.map.flyTo({
        center: [hotelMarker.hotel.lon, hotelMarker.hotel.lat],
        zoom: 14,
        duration: 1500
      });
      
      setTimeout(() => {
        hotelMarker.marker.togglePopup();
      }, 1600);
    }
  }
  
  // Book hotel from map popup
  bookHotelFromMap(hotelId, hotelName, location, price) {
    // ** FUNCTIONAL CHANGE: This is the ONLY place the booking panel is opened **
    const bookingPanel = document.getElementById('booking-panel');
    bookingPanel.classList.add('open');
    
    // ➡️ MODIFICATION: Add class to body to hide chatbot
    document.body.classList.add('booking-panel-open');
    
    // Switch to new booking tab
    this.switchTab('new-booking');
    
    // Pre-fill accommodation details
    document.getElementById('accommodation-location').value = `${hotelName}, ${location}`;
    
    // Set a reasonable category based on price
    let category = 'midrange';
    if (price < 2000) category = 'budget';
    else if (price > 5000) category = 'luxury';
    
    document.getElementById('accommodation-type').value = category;
    
    // Scroll to dates
    setTimeout(() => {
      document.getElementById('checkin-date').scrollIntoView({ behavior: 'smooth', block: 'center' });
      document.getElementById('checkin-date').focus();
    }, 300);
    
    this.showSuccess(`Selected: ${hotelName}. Fill in dates below to calculate price.`);
  }
  
  // Clear all route hotels
  clearRouteHotels() {
  // Remove all hotel markers from map
  this.clearHotelMarkers();
  
  // Clear stored hotels
  this.routeHotels = [];
    
    // Hide hotels display panel
    const displayPanel = document.getElementById('route-hotels-display');
    if (displayPanel) {
      displayPanel.classList.remove('show');
    }
    
    // Hide the main booking panel as well, which will ensure the chatbot reappears.
    const bookingPanel = document.getElementById('booking-panel');
    if (bookingPanel) {
        bookingPanel.classList.remove('open');
    }
    
    // 🛑 CRITICAL FIX: Remove class to show the chatbot/booking toggle 🛑
    document.body.classList.remove('booking-panel-open');
    
    this.currentRoute = null;
    this.routeHotels = [];
  }
  
  generateHotelDescription(tags, place) {
    const descriptions = [];
    
    if (place && place.type === 'attraction') {
      descriptions.push(`Near ${place.name}`);
    }
    
    if (tags.stars) {
      descriptions.push(`${tags.stars}-star property`);
    }
    
    if (tags.internet_access === 'wlan' || tags.internet_access === 'yes') {
      descriptions.push('Free WiFi');
    }
    
    if (tags.breakfast === 'yes') {
      descriptions.push('Breakfast included');
    }
    
    if (tags.swimming_pool === 'yes') {
      descriptions.push('Swimming pool available');
    }
    
    if (descriptions.length === 0) {
      return 'Comfortable accommodation with modern amenities. Perfect base for exploring the area.';
    }
    
    return descriptions.join(' • ');
  }
  
  extractAmenities(tags) {
    const amenities = [];
    
    if (tags.internet_access) amenities.push('WiFi');
    if (tags.air_conditioning === 'yes') amenities.push('AC');
    if (tags.breakfast === 'yes') amenities.push('Breakfast');
    if (tags.parking === 'yes') amenities.push('Parking');
    if (tags.swimming_pool === 'yes') amenities.push('Pool');
    if (tags.restaurant === 'yes') amenities.push('Restaurant');
    if (tags.bar === 'yes') amenities.push('Bar');
    if (tags.gym === 'yes' || tags.fitness_centre === 'yes') amenities.push('Gym');
    if (tags.spa === 'yes') amenities.push('Spa');
    
    if (amenities.length === 0) {
      amenities.push('WiFi', 'AC', 'Room Service');
    }
    
    return amenities;
  }
  
  getHotelPlaceholderImage(hotelName, placeType) {
    const seed = encodeURIComponent(hotelName || 'hotel');
    
    const imageServices = [
      `https://source.unsplash.com/400x250/?hotel,india,luxury`,
      `https://picsum.photos/seed/${seed}/400/250`,
      `https://source.unsplash.com/400x250/?resort,accommodation`
    ];
    
    const hash = hotelName ? hotelName.split('').reduce((a, b) => ((a << 5) - a) + b.charCodeAt(0), 0) : 0;
    return imageServices[Math.abs(hash) % imageServices.length];
  }
  
  initializeBookingUI() {
  // Booking panel HTML structure (no button needed)
  const bookingPanelHTML = `
    <div id="booking-panel" class="booking-panel">
      <div class="booking-header">
        <h3>🎫 Travel Bookings</h3>
        <button id="close-booking-panel" class="close-btn">×</button>
      </div>
      
      <div class="booking-tabs">
        <button class="booking-tab active" data-tab="new-booking">New Booking</button>
        <button class="booking-tab" data-tab="my-bookings">My Bookings</button>
      </div>
      
      <div id="new-booking" class="booking-tab-content active">
        <div class="booking-section">
          <h4>🏨 Accommodation</h4>
          <select id="accommodation-type" class="booking-input">
            <option value="">Select accommodation type</option>
            <option value="budget">🏨 Budget Hotel (₹800-2000)</option>
            <option value="midrange">🏨 Mid-range Hotel (₹2000-5000)</option>
            <option value="luxury">🏰 Luxury Hotel (₹5000-15000)</option>
            <option value="heritage">🏛️ Heritage Property (₹4000-12000)</option>
          </select>
          
          <input type="text" id="accommodation-location" class="booking-input" placeholder="Hotel name or location" />
          
          <div class="date-inputs">
            <input type="date" id="checkin-date" class="booking-input" placeholder="Check-in" />
            <input type="date" id="checkout-date" class="booking-input" placeholder="Check-out" />
          </div>
          
          <input type="number" id="num-guests" class="booking-input" placeholder="Number of guests" min="1" max="10" value="2" />
        </div>
        
        <div class="booking-section">
          <h4>🚗 Transport</h4>
          <select id="transport-type" class="booking-input">
            <option value="">Select transport (optional)</option>
            <option value="taxi">🚖 Private Taxi (₹15/km)</option>
            <option value="suv">🚙 SUV/Luxury Car (₹25/km)</option>
            <option value="bus">🚌 Tourist Bus (₹8/km)</option>
            <option value="train">🚂 Train (₹5/km)</option>
          </select>
          
          <input type="text" id="transport-from" class="booking-input" placeholder="From location" />
          <input type="text" id="transport-to" class="booking-input" placeholder="To location" />
        </div>
        
        <div class="booking-section">
          <h4>🎯 Activities</h4>
          <select id="activity-type" class="booking-input">
            <option value="">Select activity (optional)</option>
            <option value="guided_tour">🎯 Guided Tour (₹1500, 3-4 hours)</option>
            <option value="cultural_show">🎭 Cultural Performance (₹800, 2 hours)</option>
            <option value="adventure">⛰️ Adventure Activity (₹2500, 4-6 hours)</option>
            <option value="food_tour">🍽️ Food Tour (₹1200, 3 hours)</option>
            <option value="photography">📸 Photography Session (₹2000, 2-3 hours)</option>
          </select>
          
          <input type="date" id="activity-date" class="booking-input" placeholder="Activity date" />
          <input type="number" id="activity-guests" class="booking-input" placeholder="Number of participants" min="1" max="20" value="2" />
        </div>
        
        <div id="booking-summary" class="booking-summary"></div>
        
        <button id="calculate-booking" class="booking-btn booking-btn-secondary">💰 Calculate Total</button>
        <button id="confirm-booking" class="booking-btn booking-btn-primary" style="display: none;">✅ Confirm</button>
      </div>
      
      <div id="my-bookings" class="booking-tab-content">
        <div id="bookings-list" class="bookings-list"></div>
      </div>
    </div>
  `;
  
  document.body.insertAdjacentHTML('beforeend', bookingPanelHTML);
  this.attachEventListeners();
}
  
  attachEventListeners() {
    const bookingPanel = document.getElementById('booking-panel');
    const closeBtn = document.getElementById('close-booking-panel');
    const calculateBtn = document.getElementById('calculate-booking');
    const confirmBtn = document.getElementById('confirm-booking');
    
    // Close button remains necessary for manual closing
    closeBtn.addEventListener('click', () => {
      bookingPanel.classList.remove('open');
      // ➡️ MODIFICATION: Remove class from body to show chatbot
      document.body.classList.remove('booking-panel-open');
    });
    
    document.querySelectorAll('.booking-tab').forEach(tab => {
      tab.addEventListener('click', () => {
        const tabName = tab.dataset.tab;
        this.switchTab(tabName);
      });
    });
    
    calculateBtn.addEventListener('click', () => {
      this.calculateBookingCost();
    });
    
    confirmBtn.addEventListener('click', () => {
      // Add a slight delay to simulate payment processing time
      confirmBtn.disabled = true;
      confirmBtn.textContent = 'Processing...';
      setTimeout(() => {
        this.confirmBooking();
        confirmBtn.disabled = false;
        confirmBtn.textContent = '✅ Confirm Booking';
      }, 1000); 
    });
    
    const today = new Date().toISOString().split('T')[0];
    document.getElementById('checkin-date').min = today;
    document.getElementById('checkout-date').min = today;
    document.getElementById('activity-date').min = today;
    
    document.getElementById('checkin-date').addEventListener('change', (e) => {
      document.getElementById('checkout-date').min = e.target.value;
      
      // *** REALISTIC FEATURE: Check-out date validation on change ***
      const checkoutDateInput = document.getElementById('checkout-date');
      if (new Date(e.target.value) >= new Date(checkoutDateInput.value)) {
        checkoutDateInput.value = '';
        this.showError('Check-out date must be after check-in date.');
        checkoutDateInput.classList.add('input-error'); 
      } else {
        checkoutDateInput.classList.remove('input-error');
      }
    });

    document.getElementById('checkout-date').addEventListener('change', (e) => {
        const checkinDateInput = document.getElementById('checkin-date');
        if (e.target.value && new Date(e.target.value) <= new Date(checkinDateInput.value)) {
            this.showError('Check-out date must be after check-in date.');
            e.target.classList.add('input-error');
        } else {
            e.target.classList.remove('input-error');
        }
    });

    // *** REALISTIC FEATURE: Clear summary when inputs change ***
    document.querySelectorAll('#new-booking .booking-input').forEach(input => {
        input.addEventListener('change', () => {
            document.getElementById('booking-summary').style.display = 'none';
            document.getElementById('confirm-booking').style.display = 'none';
        });
    });
  }
  
  switchTab(tabName) {
    document.querySelectorAll('.booking-tab').forEach(tab => {
      tab.classList.remove('active');
      if (tab.dataset.tab === tabName) tab.classList.add('active');
    });
    
    document.querySelectorAll('.booking-tab-content').forEach(content => {
      content.classList.remove('active');
    });
    document.getElementById(tabName).classList.add('active');
    
    if (tabName === 'my-bookings') {
      this.displayBookings();
    }
  }

  // *** NEW REALISTIC FEATURE: Availability Check Helper ***
  checkAvailability(item) {
    // 5% chance of being "unavailable" to simulate real-world sold-out scenarios
    if (Math.random() < 0.05) { 
        return false;
    }
    return true;
  }
  
  async calculateBookingCost() {
    const accommodation = document.getElementById('accommodation-type').value;
    const accommodationLocation = document.getElementById('accommodation-location').value.trim();
    const checkin = document.getElementById('checkin-date').value;
    const checkout = document.getElementById('checkout-date').value;
    const numGuests = parseInt(document.getElementById('num-guests').value) || 2;
    
    const transport = document.getElementById('transport-type').value;
    const transportFrom = document.getElementById('transport-from').value.trim();
    const transportTo = document.getElementById('transport-to').value.trim();
    
    const activity = document.getElementById('activity-type').value;
    const activityDate = document.getElementById('activity-date').value;
    const activityGuests = parseInt(document.getElementById('activity-guests').value) || 2;
    
    let totalCost = 0;
    let breakdown = [];
    let hasValidBooking = false; // Flag to check if at least one service is valid
    
    // Clear previous errors/summary
    document.querySelectorAll('.booking-input').forEach(input => input.classList.remove('input-error'));
    document.getElementById('booking-summary').style.display = 'none';
    document.getElementById('confirm-booking').style.display = 'none';

    // ACCOMMODATION
    if (accommodation || accommodationLocation || checkin || checkout) {
        if (!accommodation || !accommodationLocation || !checkin || !checkout) {
            this.showError('Please complete all Accommodation fields or leave the section empty.');
            if (!accommodation) document.getElementById('accommodation-type').classList.add('input-error');
            if (!accommodationLocation) document.getElementById('accommodation-location').classList.add('input-error');
            if (!checkin) document.getElementById('checkin-date').classList.add('input-error');
            if (!checkout) document.getElementById('checkout-date').classList.add('input-error');
            return;
        }

        const nights = this.calculateNights(checkin, checkout);
        if (nights <= 0) {
            this.showError('Check-out date must be after check-in date');
            document.getElementById('checkout-date').classList.add('input-error');
            return;
        }

        // *** REALISTIC FEATURE: Check Accommodation Availability ***
        if (!this.checkAvailability('accommodation')) {
            this.showError(`🏨 ${accommodationLocation} is no longer available for your dates. Please select another.`);
            document.getElementById('accommodation-location').classList.add('input-error');
            document.getElementById('checkin-date').classList.add('input-error');
            return;
        }
        
        const accommodationType = this.accommodationTypes[accommodation];
        const avgPrice = (accommodationType.priceRange.min + accommodationType.priceRange.max) / 2;
        
        // *** REALISTIC FEATURE: Price Fluctuation (e.g., +/- 10%) ***
        const priceModifier = 1 + (Math.random() * 0.2 - 0.1); // Range from 0.9 to 1.1
        const accommodationCost = Math.round(avgPrice * nights * priceModifier);
        
        totalCost += accommodationCost;
        breakdown.push({
            type: 'Accommodation',
            details: `${accommodationType.name} in ${accommodationLocation} - ${nights} night(s)`,
            cost: accommodationCost
        });
        hasValidBooking = true;
    }
    
    // TRANSPORT
    if (transport || transportFrom || transportTo) {
        if (!transport || !transportFrom || !transportTo) {
            this.showError('Please complete all Transport fields or leave the section empty.');
            if (!transport) document.getElementById('transport-type').classList.add('input-error');
            if (!transportFrom) document.getElementById('transport-from').classList.add('input-error');
            if (!transportTo) document.getElementById('transport-to').classList.add('input-error');
            return;
        }

        try {
            const distance = await this.estimateDistance(transportFrom, transportTo);

            // *** REALISTIC FEATURE: Check Transport Availability (e.g., if distance is too great) ***
            if (distance > 1000 && (transport === 'taxi' || transport === 'suv')) {
                this.showError('Transport too long: Private vehicles not available for this distance.');
                document.getElementById('transport-type').classList.add('input-error');
                return;
            }
            
            const transportType = this.transportTypes[transport];
            const priceModifier = 1 + (Math.random() * 0.1 - 0.05); // +/- 5%
            const transportCost = Math.round(distance * transportType.pricePerKm * priceModifier);
            
            totalCost += transportCost;
            breakdown.push({
                type: 'Transport',
                details: `${transportType.name} from ${transportFrom} to ${transportTo} (~${distance.toFixed(0)} km)`,
                cost: transportCost
            });
            hasValidBooking = true;
        } catch (err) {
            console.error('Transport calculation error:', err);
            this.showError('Could not estimate transport distance. Please check locations.');
            document.getElementById('transport-from').classList.add('input-error');
            document.getElementById('transport-to').classList.add('input-error');
            return;
        }
    }
    
    // ACTIVITY
    if (activity || activityDate) {
        if (!activity || !activityDate) {
            this.showError('Please complete all Activity fields or leave the section empty.');
            if (!activity) document.getElementById('activity-type').classList.add('input-error');
            if (!activityDate) document.getElementById('activity-date').classList.add('input-error');
            return;
        }

        // *** REALISTIC FEATURE: Check Activity Availability ***
        if (!this.checkAvailability('activity')) {
            this.showError(`🎯 ${this.activityTypes[activity].name} is sold out on ${activityDate}.`);
            document.getElementById('activity-date').classList.add('input-error');
            return;
        }

        const activityType = this.activityTypes[activity];
        const activityCost = activityType.price * activityGuests;
        
        totalCost += activityCost;
        breakdown.push({
            type: 'Activity',
            details: `${activityType.name} for ${activityGuests} participant(s)`,
            cost: activityCost
        });
        hasValidBooking = true;
    }

    // FINAL CHECK
    if (!hasValidBooking) {
      this.showError('Please fill in at least one booking section completely.');
      return;
    }
    
    this.displayBookingSummary(breakdown, totalCost);
    document.getElementById('confirm-booking').style.display = 'block';
  }
  
  calculateNights(checkin, checkout) {
    const checkinDate = new Date(checkin);
    const checkoutDate = new Date(checkout);
    const diffTime = checkoutDate - checkinDate;
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  }
  
  async estimateDistance(from, to) {
    try {
      const fromCoords = await this.geocodeForDistance(from);
      const toCoords = await this.geocodeForDistance(to);
      
      if (!fromCoords || !toCoords) {
        throw new Error('Unable to geocode locations');
      }
      
      const distance = this.haversineDistance(fromCoords.lat, fromCoords.lon, toCoords.lat, toCoords.lon);
      
      return distance * 1.3; // Add 30% for road travel distance multiplier
    } catch (err) {
      console.error('Distance estimation error:', err);
      // Fallback distance
      return 100;
    }
  }

  // Simplified Haversine Distance (as Turf is not available)
  haversineDistance(lat1, lon1, lat2, lon2) {
    function toRad(x) { return x * Math.PI / 180; }
    var R = 6371; // Earth's radius in km
    var dLat = toRad(lat2 - lat1);
    var dLon = toRad(lon2 - lon1);
    var a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
            Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) *
            Math.sin(dLon / 2) * Math.sin(dLon / 2);
    var c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c; // Distance in km
  }
  
  async geocodeForDistance(location) {
    try {
      const response = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&countrycodes=in&limit=1&q=${encodeURIComponent(location + ', India')}`
      );
      const results = await response.json();
      
      if (results && results.length > 0) {
        return {
          lat: parseFloat(results[0].lat),
          lon: parseFloat(results[0].lon),
          name: results[0].display_name
        };
      }
      return null;
    } catch (err) {
      console.error('Geocoding error:', err);
      return null;
    }
  }
  
  displayBookingSummary(breakdown, totalCost) {
    const summaryDiv = document.getElementById('booking-summary');
    
    let html = `
      <div class="summary-header">
        <h4>📋 Booking Summary</h4>
      </div>
      <div class="summary-items">
    `;
    
    breakdown.forEach(item => {
      html += `
        <div class="summary-item">
          <div class="summary-item-header">${item.type}</div>
          <div class="summary-item-details">${item.details}</div>
          <div class="summary-item-cost">₹${item.cost.toLocaleString('en-IN')}</div>
        </div>
      `;
    });
    
    html += `
      </div>
      <div class="summary-total">
        <strong>Total Cost:</strong>
        <strong class="total-amount">₹${totalCost.toLocaleString('en-IN')}</strong>
      </div>
      <div class="summary-note">
        💡 This is an estimated cost. Final prices may vary based on availability and season.
      </div>
    `;
    
    summaryDiv.innerHTML = html;
    summaryDiv.style.display = 'block';
  }
  
  async confirmBooking() {
    // *** REALISTIC FEATURE: Random chance of booking failure (e.g., payment error) ***
    if (Math.random() < 0.1) { // 10% chance of failure
        document.getElementById('confirm-booking').style.display = 'none';
        this.showError('❌ Booking Failed! The payment gateway timed out. Please try again.');
        return;
    }

    const accommodation = document.getElementById('accommodation-type').value;
    const accommodationLocation = document.getElementById('accommodation-location').value.trim();
    const checkin = document.getElementById('checkin-date').value;
    const checkout = document.getElementById('checkout-date').value;
    const numGuests = parseInt(document.getElementById('num-guests').value) || 2;
    
    const transport = document.getElementById('transport-type').value;
    const transportFrom = document.getElementById('transport-from').value.trim();
    const transportTo = document.getElementById('transport-to').value.trim();
    
    const activity = document.getElementById('activity-type').value;
    const activityDate = document.getElementById('activity-date').value;
    const activityGuests = parseInt(document.getElementById('activity-guests').value) || 2;
    
    const totalElement = document.querySelector('.total-amount');
    const totalCost = totalElement ? parseInt(totalElement.textContent.replace(/[₹,]/g, '')) : 0;
    
    const booking = {
      id: `BK${this.currentBookingId++}`,
      date: new Date().toISOString(),
      status: 'Confirmed',
      totalCost: totalCost,
      items: []
    };
    
    if (accommodation && accommodationLocation) {
      const nights = this.calculateNights(checkin, checkout);
      booking.items.push({
        type: 'accommodation',
        data: {
          accommodationType: this.accommodationTypes[accommodation].name,
          location: accommodationLocation,
          checkin: checkin,
          checkout: checkout,
          nights: nights,
          guests: numGuests
        }
      });
    }
    
    if (transport && transportFrom && transportTo) {
      const distance = await this.estimateDistance(transportFrom, transportTo);
      booking.items.push({
        type: 'transport',
        data: {
          transportType: this.transportTypes[transport].name,
          from: transportFrom,
          to: transportTo,
          distance: distance.toFixed(0)
        }
      });
    }
    
    if (activity && activityDate) {
      booking.items.push({
        type: 'activity',
        data: {
          activityType: this.activityTypes[activity].name,
          date: activityDate,
          participants: activityGuests,
          duration: this.activityTypes[activity].duration
        }
      });
    }
    
    this.bookings.push(booking);
    this.saveBookingsToStorage();
    
    this.showSuccess(`Booking confirmed! Booking ID: ${booking.id}`);
    
    this.resetBookingForm();
    
    setTimeout(() => {
      this.switchTab('my-bookings');
    }, 1500);
  }
  
  // 🟢 UPDATED: Download as PDF via window.print() - FIXED BLANK PDF ISSUE
  downloadReceipt(bookingId) {
    const booking = this.bookings.find(b => b.id === bookingId);
    if (!booking) {
      this.showError(`Booking ${bookingId} not found.`);
      return;
    }

    // Define a consistent ID for the temporary print container
    const printAreaId = 'temp-receipt-print-area';

    let receiptItemsHtml = booking.items.map(item => {
        if (item.type === 'accommodation') {
            return `
                <div class="receipt-item">
                    <strong>🏨 Accommodation: ${item.data.accommodationType}</strong>
                    <p>Location: ${item.data.location}</p>
                    <p>Dates: ${item.data.checkin} to ${item.data.checkout} (${item.data.nights} nights)</p>
                    <p>Guests: ${item.data.guests}</p>
                </div>
            `;
        } else if (item.type === 'transport') {
            return `
                <div class="receipt-item">
                    <strong>🚗 Transport: ${item.data.transportType}</strong>
                    <p>Route: ${item.data.from} → ${item.data.to}</p>
                    <p>Distance: ~${item.data.distance} km</p>
                </div>
            `;
        } else if (item.type === 'activity') {
            return `
                <div class="receipt-item">
                    <strong>🎯 Activity: ${item.data.activityType}</strong>
                    <p>Date: ${item.data.date}</p>
                    <p>Participants: ${item.data.participants}</p>
                </div>
            `;
        }
        return '';
    }).join('');

    // 1. Create a single element that is the direct child of the body
    const tempElement = document.createElement('div');
    tempElement.id = printAreaId; // Assign the unique ID here

    tempElement.innerHTML = `
        <div style="padding: 20px; font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; border: 1px solid #ccc; background-color: white;">
            <h1 style="text-align: center; color: #007bff; border-bottom: 2px solid #007bff; padding-bottom: 10px;">TravelBot Booking Receipt</h1>
            <p style="text-align: center; font-size: 14px; margin-bottom: 20px;">Issued on: ${new Date().toLocaleDateString()}</p>
            
            <div style="border: 1px solid #eee; padding: 15px; margin-bottom: 20px; background-color: #f8f9fa;">
                <p><strong>Booking ID:</strong> ${booking.id}</p>
                <p><strong>Status:</strong> <span style="color: green;">${booking.status}</span></p>
                <p><strong>Confirmation Date:</strong> ${new Date(booking.date).toLocaleDateString()}</p>
            </div>
            
            <h2 style="font-size: 18px; margin-bottom: 10px; color: #343a40;">Items Included</h2>
            ${receiptItemsHtml}
            
            <div style="border-top: 2px solid #343a40; margin-top: 20px; padding-top: 15px;">
                <p style="font-size: 20px; font-weight: bold; display: flex; justify-content: space-between;">
                    <span>TOTAL AMOUNT:</span>
                    <span>₹${booking.totalCost.toLocaleString('en-IN')}</span>
                </p>
            </div>
            
            <p style="text-align: center; font-size: 12px; color: #6c757d; margin-top: 30px;">
                Thank you for booking with TravelBot. This document serves as your official receipt.
            </p>
        </div>
        
        <style>
            @media print {
                /* CRITICAL FIX: Hide all direct children of body EXCEPT the temporary print element */
                body > *:not(#${printAreaId}) { 
                    display: none !important;
                }
                /* Ensure the print container is displayed correctly and overlays everything */
                #${printAreaId} {
                    display: block !important;
                    width: 100% !important;
                    max-width: 100% !important;
                    margin: 0 !important;
                    padding: 0 !important;
                    border: none !important;
                    box-shadow: none !important;
                    position: fixed;
                    top: 0;
                    left: 0;
                    z-index: 99999;
                }
                .receipt-item {
                    border-bottom: 1px dashed #ccc;
                    padding: 10px 0;
                    margin-bottom: 10px;
                }
            }
        </style>
    `;

    // 2. Append the element to body
    document.body.appendChild(tempElement);

    // 3. Trigger the print dialog (user selects "Save as PDF")
    window.print();

    // 4. Clean up the temporary container after printing
    setTimeout(() => {
        const elementToRemove = document.getElementById(printAreaId);
        if (elementToRemove) {
            document.body.removeChild(elementToRemove);
        }
    }, 100);
    
    this.showSuccess(`Preparing receipt for PDF download... (Check your browser's print dialog)`);
  }

  
  displayBookings() {
    const bookingsList = document.getElementById('bookings-list');
    
    if (this.bookings.length === 0) {
      bookingsList.innerHTML = `
        <div class="empty-bookings">
          <div style="font-size: 48px; margin-bottom: 16px;">📋</div>
          <div style="font-size: 16px; font-weight: 600; margin-bottom: 8px;">No bookings yet</div>
          <div style="font-size: 14px; color: #6b7280;">Create your first booking to start planning your trip!</div>
        </div>
      `;
      return;
    }
    
    let html = '';
    
    this.bookings.slice().reverse().forEach(booking => {
      html += `
        <div class="booking-card" data-booking-id="${booking.id}">
          <div class="booking-card-header">
            <div>
              <strong>Booking ${booking.id}</strong>
              <span class="booking-status ${booking.status.toLowerCase()}">${booking.status}</span>
            </div>
            <div class="booking-date">${new Date(booking.date).toLocaleDateString('en-IN')}</div>
          </div>
          
          <div class="booking-card-items">
      `;
      
      booking.items.forEach(item => {
        if (item.type === 'accommodation') {
          html += `
            <div class="booking-item">
              <div class="booking-item-icon">🏨</div>
              <div class="booking-item-details">
                <strong>${item.data.accommodationType}</strong>
                <div>${item.data.location}</div>
                <div style="font-size: 12px; color: #6b7280;">
                  ${new Date(item.data.checkin).toLocaleDateString('en-IN')} - ${new Date(item.data.checkout).toLocaleDateString('en-IN')}
                  (${item.data.nights} night${item.data.nights > 1 ? 's' : ''}, ${item.data.guests} guest${item.data.guests > 1 ? 's' : ''})
                </div>
              </div>
            </div>
          `;
        } else if (item.type === 'transport') {
          html += `
            <div class="booking-item">
              <div class="booking-item-icon">🚗</div>
              <div class="booking-item-details">
                <strong>${item.data.transportType}</strong>
                <div>${item.data.from} → ${item.data.to}</div>
                <div style="font-size: 12px; color: #6b7280;">Distance: ~${item.data.distance} km</div>
              </div>
            </div>
          `;
        } else if (item.type === 'activity') {
          html += `
            <div class="booking-item">
              <div class="booking-item-icon">🎯</div>
              <div class="booking-item-details">
                <strong>${item.data.activityType}</strong>
                <div>${new Date(item.data.date).toLocaleDateString('en-IN')}</div>
                <div style="font-size: 12px; color: #6b7280;">
                  ${item.data.participants} participant${item.data.participants > 1 ? 's' : ''} • ${item.data.duration}
                </div>
              </div>
            </div>
          `;
        }
      });
      
      html += `
          </div>
          
          <div class="booking-card-footer">
            <div class="booking-total">
              <strong>Total:</strong>
              <strong class="total-amount">₹${booking.totalCost.toLocaleString('en-IN')}</strong>
            </div>
            <div class="booking-actions">
              <button class="booking-action-btn download-btn" onclick="bookingSystem.downloadReceipt('${booking.id}')">
                ⬇️ Download
              </button>
              <button class="booking-action-btn cancel-btn" onclick="bookingSystem.cancelBooking('${booking.id}')">
                ❌ Cancel
              </button>
            </div>
          </div>
        </div>
      `;
    });
    
    bookingsList.innerHTML = html;
  }
  
  cancelBooking(bookingId) {
    // IMPORTANT: Do NOT use window.confirm() in Canvas environment.
    console.warn(`[ACTION REQUIRED] Confirming cancellation for booking ${bookingId}. In a real app, use a custom modal.`);
    
    this.bookings = this.bookings.filter(b => b.id !== bookingId);
    
    this.saveBookingsToStorage();
    this.displayBookings();
    
    this.showSuccess(`Booking ${bookingId} cancelled successfully`);
  }
  
  resetBookingForm() {
    document.getElementById('accommodation-type').value = '';
    document.getElementById('accommodation-location').value = '';
    document.getElementById('checkin-date').value = '';
    document.getElementById('checkout-date').value = '';
    document.getElementById('num-guests').value = '2';
    
    document.getElementById('transport-type').value = '';
    document.getElementById('transport-from').value = '';
    document.getElementById('transport-to').value = '';
    
    document.getElementById('activity-type').value = '';
    document.getElementById('activity-date').value = '';
    document.getElementById('activity-guests').value = '2';
    
    document.getElementById('booking-summary').innerHTML = '';
    document.getElementById('booking-summary').style.display = 'none';
    document.getElementById('confirm-booking').style.display = 'none';

    document.querySelectorAll('.booking-input').forEach(input => input.classList.remove('input-error')); // Clear any remaining errors
  }
  
  saveBookingsToStorage() {
    try {
      localStorage.setItem('travelbot-bookings', JSON.stringify(this.bookings));
      localStorage.setItem('travelbot-booking-counter', this.currentBookingId.toString());
    } catch (err) {
      console.error('Error saving bookings:', err);
    }
  }
  
  loadBookingsFromStorage() {
    try {
      const savedBookings = localStorage.getItem('travelbot-bookings');
      const savedCounter = localStorage.getItem('travelbot-booking-counter');
      
      if (savedBookings) {
        this.bookings = JSON.parse(savedBookings);
      }
      
      if (savedCounter) {
        this.currentBookingId = parseInt(savedCounter);
      }
      
    } catch (err) {
      console.error('Error loading bookings:', err);
    }
  }
  
  showSuccess(message) {
    this.showNotification(message, 'success');
  }
  
  showError(message) {
    this.showNotification(message, 'error');
  }
  
  showNotification(message, type = 'info') {
    const notification = document.createElement('div');
    notification.className = `booking-notification ${type}`;
    notification.innerHTML = `
      <div class="notification-icon">
        ${type === 'success' ? '✅' : type === 'error' ? '❌' : 'ℹ️'}
      </div>
      <div class="notification-message">${message}</div>
    `;
    
    document.body.appendChild(notification);
    
    setTimeout(() => {
      notification.classList.add('show');
    }, 100);
    
    setTimeout(() => {
      notification.classList.remove('show');
      setTimeout(() => {
        document.body.removeChild(notification);
      }, 300);
    }, 3000);
  }
}

// Export for use in main application
if (typeof module !== 'undefined' && module.exports) {
  module.exports = BookingSystem;
}