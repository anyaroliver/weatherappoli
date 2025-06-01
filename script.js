const apiKey = 'e7723a13b7c1a6e1c3af1e0e44c9b620'; // Replace with your OpenWeatherMap API key
const searchForm = document.getElementById('search-form');
const cityInput = document.getElementById('city-input');
const weatherDisplay = document.getElementById('weather-display');
const favoritesList = document.getElementById('favorites-list');

// Load favorites from localStorage
let favorites = JSON.parse(localStorage.getItem('favorites')) || [];
renderFavorites();

searchForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const city = cityInput.value.trim();
    if (city) {
        await fetchWeather(city);
    }
});

async function fetchWeather(city) {
    weatherDisplay.innerHTML = 'Loading...';
    try {
        const res = await fetch(`https://api.openweathermap.org/data/2.5/weather?q=${encodeURIComponent(city)}&appid=${apiKey}&units=metric`);
        if (!res.ok) {
            const errorData = await res.json();
            throw new Error(errorData.message || 'City not found');
        }
        const data = await res.json();
        displayWeather(data);
    } catch (err) {
        weatherDisplay.innerHTML = `<span style="color:red;">${err.message}</span>`;
    }
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
                <button onclick="fetchWeather('${city}')">Show</button>
                <button onclick="removeFavorite('${city}')">Remove</button>
            </div>
        `;
        favoritesList.appendChild(li);
    });
}

// If there are favorites, show the first one by default
if (favorites.length > 0) {
    fetchWeather(favorites[0]);
} 