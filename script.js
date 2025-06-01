const apiKey = 'c2c2ace50edd78ae0f90b85493f103f2'; // Replace with your OpenWeatherMap API key
const searchForm = document.getElementById('search-form');
const cityInput = document.getElementById('city-input');
const weatherDisplay = document.getElementById('weather-display');
const favoritesList = document.getElementById('favorites-list');
const carouselContainer = document.getElementById('carousel-container');
const carousel = document.getElementById('carousel');
const carouselLeft = document.getElementById('carousel-left');
const carouselRight = document.getElementById('carousel-right');

// Expanded mapping for all 7 continents
const continentCapitals = {
    'Europe': [
        'London', 'Paris', 'Berlin', 'Rome', 'Madrid', 'Vienna', 'Prague', 'Budapest', 'Warsaw', 'Athens',
        'Brussels', 'Amsterdam', 'Oslo', 'Stockholm', 'Copenhagen', 'Dublin', 'Helsinki', 'Lisbon', 'Bern', 'Moscow'
    ],
    'Asia': [
        'Tokyo', 'Beijing', 'Seoul', 'Bangkok', 'Hanoi', 'Jakarta', 'Kuala Lumpur', 'Manila', 'New Delhi', 'Singapore',
        'Riyadh', 'Tehran', 'Baghdad', 'Ankara', 'Damascus', 'Amman', 'Kabul', 'Islamabad', 'Tashkent', 'Bishkek'
    ],
    'Africa': [
        'Juba','Cairo', 'Nairobi', 'Pretoria', 'Addis Ababa', 'Accra', 'Algiers', 'Dakar', 'Abuja', 'Tripoli', 'Khartoum',
        'Rabat', 'Tunis', 'Luanda', 'Kampala', 'Maputo', 'Harare', 'Gaborone', 'Windhoek', 'Bamako', 'Lusaka'
    ],
    'North America': [
        'Washington', 'Ottawa', 'Mexico City', 'Havana', 'Kingston', 'Guatemala City', 'Panama City', 'San Jose', 'Tegucigalpa', 'Belmopan',
        'Nassau', 'Port-au-Prince', 'Santo Domingo', 'San Salvador', 'Managua', 'Port of Spain', 'Bridgetown', 'Castries', 'Basseterre', 'Roseau'
    ],
    'South America': [
        'Brasilia', 'Buenos Aires', 'Santiago', 'Lima', 'Bogota', 'Caracas', 'Quito', 'La Paz', 'Asuncion', 'Montevideo',
        'Georgetown', 'Paramaribo', 'Sucre'
    ],
    'Oceania': [
        'Canberra', 'Wellington', 'Suva', 'Port Moresby', 'Honiara', 'Port Vila', 'Apia', 'Nukuʻalofa', 'Palikir', 'Majuro',
        'Tarawa', 'Funafuti', 'Yaren'
    ],
    'Antarctica': [
        // Antarctica has no official capital cities, but we can list research stations for demo
        'McMurdo Station', 'Amundsen-Scott South Pole Station', 'Palmer Station', 'Rothera Research Station', 'Princess Elisabeth Station'
    ]
};

// Load favorites from localStorage
let favorites = JSON.parse(localStorage.getItem('favorites')) || [];
renderFavorites();

searchForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const city = cityInput.value.trim();
    if (city) {
        await showContinentCapitalsWeather(city);
    }
});

async function showContinentCapitalsWeather(city) {
    weatherDisplay.innerHTML = 'Loading...';
    carouselContainer.style.display = 'none';
    try {
        // Get country and continent using REST Countries API
        const countryRes = await fetch(`https://restcountries.com/v3.1/capital/${encodeURIComponent(city)}`);
        if (!countryRes.ok) throw new Error('City not found');
        const countryData = await countryRes.json();
        const continent = countryData[0]?.continents?.[0];
        if (!continent || !continentCapitals[continent]) throw new Error('Continent or capitals not found for this city.');
        const capitals = continentCapitals[continent];
        // Fetch weather for all capitals in the continent
        const weatherDataArr = await Promise.all(capitals.map(async (cap) => {
            try {
                const res = await fetch(`https://api.openweathermap.org/data/2.5/weather?q=${encodeURIComponent(cap)}&appid=${apiKey}&units=metric`);
                if (!res.ok) return null;
                const data = await res.json();
                return { city: cap, data };
            } catch {
                return null;
            }
        }));
        // Filter out failed fetches
        const validWeather = weatherDataArr.filter(item => item && item.data && item.data.weather);
        if (validWeather.length === 0) throw new Error('No weather data found for capitals.');
        // Show carousel
        renderCarousel(validWeather);
        weatherDisplay.innerHTML = `<h3>Capitals in ${continent}</h3>`;
        carouselContainer.style.display = 'flex';
    } catch (err) {
        weatherDisplay.innerHTML = `<span style=\"color:red;\">${err.message}</span>`;
        carouselContainer.style.display = 'none';
    }
}

function renderCarousel(weatherArr) {
    let current = 0;
    function showItem(idx) {
        carousel.innerHTML = '';
        const item = weatherArr[idx];
        if (!item) return;
        const iconUrl = `https://openweathermap.org/img/wn/${item.data.weather[0].icon}@4x.png`;
        const div = document.createElement('div');
        div.className = 'carousel-item';
        div.innerHTML = `
            <img src=\"${iconUrl}\" alt=\"${item.data.weather[0].description}\" class=\"weather-icon\">
            <h4>${item.city}</h4>
            <p><strong>${Math.round(item.data.main.temp)}°C</strong> - ${item.data.weather[0].main}</p>
        `;
        carousel.appendChild(div);
    }
    showItem(current);
    carouselLeft.onclick = () => {
        current = (current - 1 + weatherArr.length) % weatherArr.length;
        showItem(current);
    };
    carouselRight.onclick = () => {
        current = (current + 1) % weatherArr.length;
        showItem(current);
    };
}

function displayWeather(data) {
    const iconUrl = `https://openweathermap.org/img/wn/${data.weather[0].icon}@4x.png`;
    weatherDisplay.innerHTML = `
        <img src="${iconUrl}" alt="${data.weather[0].description}" class="weather-icon">
        <h3>${data.name}, ${data.sys.country}</h3>
        <p><strong>${Math.round(data.main.temp)}°C</strong> - ${data.weather[0].main}</p>
        <button id="add-favorite">Add to Favorites</button>
    `;
    document.getElementById('add-favorite').onclick = () => addFavorite(data.name);
}

function addFavorite(city) {
    if (!favorites.includes(city)) {
        favorites.push(city);
        localStorage.setItem('favorites', JSON.stringify(favorites));
        renderFavorites();
    }
}

function removeFavorite(city) {
    favorites = favorites.filter(fav => fav !== city);
    localStorage.setItem('favorites', JSON.stringify(favorites));
    renderFavorites();
}

function renderFavorites() {
    favoritesList.innerHTML = '';
    favorites.forEach(city => {
        const li = document.createElement('li');
        li.innerHTML = `
            <span>${city}</span>
            <div>
                <button onclick=\"fetchWeather('${city}')\">Show</button>
                <button onclick=\"removeFavorite('${city}')\">Remove</button>
            </div>
        `;
        favoritesList.appendChild(li);
    });
}

// If there are favorites, show the first one by default
if (favorites.length > 0) {
    fetchWeather(favorites[0]);
} 