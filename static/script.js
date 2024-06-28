// Initialize the map
var map = L.map("map").setView([1.3521, 103.8198], 12); // Default view for Singapore
L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
}).addTo(map);

// Function to fetch articles
async function fetchArticles() {
    try {
        const response = await fetch("http://localhost:8001/articles");
        if (!response.ok) {
            throw new Error("Network response was not ok");
        }
        const responseData = await response.json(); // Assuming the response is JSON
        console.log(responseData); // Check the response data in console
        allArticles = responseData; // Store fetched articles (assuming responseData is an array of articles)

        // Call function to add circles to map after fetching articles
        addCirclesToMap();
    } catch (error) {
        console.error("There was a problem with the fetch operation:", error);
    }
}

// Function to add circles to map
function addCirclesToMap() {
    // Loop through allArticles and add circles to the map
    allArticles.forEach(article => {
        if (article.lat && article.lng) {
            addCircleToMap(map, article.lat, article.lng,article.Title);
        }
    });
}

function addCircleToMap(map, lat, lng, title) {
    L.circle([lat, lng], {
        color: 'red',
        fillColor: '#f03',
        fillOpacity: 0.5,
        radius: 3000
    }).addTo(map).bindPopup(title); // Bind popup with title
}

document.addEventListener('DOMContentLoaded', async function() {
    console.log("DOM fully loaded and parsed"); // Check if DOMContentLoaded event fires
	await fetchArticles(); // Wait for articles to be fetched before initializing the map
	addCirclesToMap();
});

// Function to add circle to map
// function addCircleToMap(map, lat, lng) {
//     L.circle([lat, lng], {
//         color: 'red',
//         fillColor: '#f03',
//         fillOpacity: 0.5,
//         radius: 500
//     }).addTo(map).bindPopup(title); // Bind popup with title
// }

// Function to fetch articles
// async function fetchArticles() {
//     console.log("Fetching articles..."); // Check if fetchArticles() is called
//     try {
//         const response = await fetch("http://localhost:8001/articles");
//         if (!response.ok) {
//             throw new Error("Network response was not ok");
//         }
//         const responseData = await response.json(); // Assuming the response is JSON
//         allArticles = responseData; // Store fetched articles (assuming responseData is an array of articles)
//         initMap(); // Initialize map after fetching articles
//     } catch (error) {
//         console.error("There was a problem with the fetch operation:", error);
//     }
// }


function addMarkerToMap(lat, lng, title) {
	L.marker([lat, lng]).addTo(map)
		.bindPopup(title)
		.openPopup();
}

//Search City

// Event Listeners
document.addEventListener("DOMContentLoaded", function() {
    // Initialize map
    //const map = L.map('map').setView([51.505, -0.09], 2);
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
    }).addTo(map);
    fetchCityData();

    // Cache DOM elements
    const inputBox = document.getElementById("input-box");
    const clearSearchButton = document.getElementById("clear-search");
    const citySearchBtn = document.getElementById("city-search-btn");
    const resultBox = document.querySelector(".city-result-box");
    const cityResults = document.getElementById('city-results');

    if (!inputBox || !clearSearchButton || !citySearchBtn || !resultBox || !cityResults) {
        console.error('One or more required elements not found.');
        return;
    }

    // Function to clear search results
    function clearSearch() {
        inputBox.value = "";
        cityResults.innerHTML = "";
        resultBox.style.display = "none";
        filterCities("");
    }

    // Input box event listeners
	// inputBox.addEventListener("input", function () {
	// 	console.log(this.value)
    //     const query = this.value;
    //     if (query.length > 2) {
    //         filterCities(query);
    //     } else {
    //         clearSearch();
    //     }
	// });
	
	document.getElementById("input-box").addEventListener("input", function() {
	const query = this.value;
		filterCities(query);

});

    inputBox.addEventListener("focus", function() {
        if (this.value === '') {
            populateLimitedCitySelect(allCityData); // Populate the dropdown with initial city data
        }
    });

    // Clear search button event listener
    clearSearchButton.addEventListener("click", clearSearch);

    // City search button event listener
    citySearchBtn.addEventListener('click', function() {
        filterCities(inputBox.value);
    });

    // Hide result box on outside click
    document.addEventListener('click', function(event) {
        if (!document.querySelector('.search-box').contains(event.target)) {
            resultBox.style.display = 'none';
        }
    });
});

async function fetchCityData() {
    try {
        const response = await fetch("http://localhost:8001/city-data");
        if (!response.ok) throw new Error("Network response was not ok");
        const responseData = await response.text();
        const cityData = parseCityData(responseData);
		allCityData = cityData; // Store all city data
		console.log(allCityData)
    } catch (error) {
        console.error("There was a problem with the fetch operation:", error);
    }
}

function parseCityData(responseText) {
    try {
        const headerEndIndex = responseText.indexOf("\r\n\r\n");
        const altHeaderEndIndex = responseText.indexOf("\n\n");
        const jsonData = responseText.substring((headerEndIndex !== -1 ? headerEndIndex : altHeaderEndIndex) + (headerEndIndex !== -1 ? 4 : 2));
        return JSON.parse(jsonData);
    } catch (error) {
        console.error("Error parsing city data:", error);
        return [];
    }
}

function populateLimitedCitySelect(cityData) {
    const cityResults = document.getElementById("city-results");
    cityResults.innerHTML = ""; // Clear previous results

    cityData.slice(0, 10).forEach(city => {
        const li = document.createElement("li");
        li.textContent = city.City;
        li.addEventListener("click", () => selectCity(city));
        cityResults.appendChild(li);
    });

    document.querySelector(".city-result-box").style.display = "block"; // Show the results box
}

function filterCities(input) {
    const filteredCities = allCityData.filter(city => city.City.toLowerCase().includes(input.toLowerCase()));
    populateLimitedCitySelect(filteredCities);
    document.querySelector(".city-result-box").style.display = filteredCities.length > 0 ? "block" : "none";
}



function selectCity(city) {
    if (map) {
        // Set map view to the selected city's coordinates
        map.setView([city.Lat, city.Lng], 12);

        // Add marker at the selected city's coordinates with city name as popup
        addMarkerToMap(city.Lat, city.Lng, city.City);

        // Update input box value with the selected city's name
        document.getElementById("input-box").value = city.City;

        // Hide the city result box
        document.querySelector(".city-result-box").style.display = "none";

        // Update URL with selected city's lat and lng
        const queryParams = new URLSearchParams(window.location.search);
        queryParams.set('lat', city.Lat);
        queryParams.set('lng', city.Lng);
        
        // Replace the current URL with the updated URL (without reloading)
        history.replaceState(null, null, `${window.location.pathname}?${queryParams.toString()}`);
    } else {
        console.error('Map object is not initialized.');
    }
}

// Function to read lat and lng from URL and relocate map
function relocateMapFromURL() {
    // Get current URL search parameters
    const queryParams = new URLSearchParams(window.location.search);
    
    // Read lat and lng values from URL
    const lat = parseFloat(queryParams.get('lat'));
    const lng = parseFloat(queryParams.get('lng'));
    
    // Check if lat and lng are valid numbers
    if (!isNaN(lat) && !isNaN(lng)) {
        // Set map view to the coordinates from URL
        map.setView([lat, lng], 12); // Adjust zoom level (12) as needed
    } else {
        console.error('Invalid or missing lat/lng parameters in URL.');
    }
}

// Example usage (call this function when your map is ready to be relocated)
relocateMapFromURL();



async function fetchCityData() {
	try {
		const response = await fetch("http://localhost:8001/city-data");
		if (!response.ok) throw new Error("Network response was not ok");
		const responseData = await response.text();
		const cityData = parseCityData(responseData);
		allCityData = cityData; // Store all city data
	} catch (error) {
		console.error("There was a problem with the fetch operation:", error);
	}
}

function parseCityData(responseText) {
	try {
		const headerEndIndex = responseText.indexOf("\r\n\r\n");
		const altHeaderEndIndex = responseText.indexOf("\n\n");
		const jsonData = responseText.substring((headerEndIndex !== -1 ? headerEndIndex : altHeaderEndIndex) + (headerEndIndex !== -1 ? 4 : 2));
		return JSON.parse(jsonData);
	} catch (error) {
		console.error("Error parsing city data:", error);
		return null;
	}
}

function populateLimitedCitySelect(cityData) {
	const cityResults = document.getElementById("city-results");
	cityResults.innerHTML = ""; // Clear previous results

	for (let i = 0; i < Math.min(cityData.length); i++) {
		const city = cityData[i];
		const li = document.createElement("li");
		li.textContent = city.City;
		li.addEventListener("click", () => selectCity(city));
		cityResults.appendChild(li);
	}
	document.querySelector(".city-result-box").style.display = "block"; // Show the results box
}

function filterCities(input) {
	const filteredCities = allCityData.filter((city) => city.City.toLowerCase().includes(input.toLowerCase()));
	document.querySelector(".city-result-box").style.display = filteredCities.length > 0 ? "block" : "none";
	populateLimitedCitySelect(filteredCities);
}

function addMarkerToMap(lat, lng, title) {
	L.marker([lat, lng]).addTo(map)
		.bindPopup(title)
		.openPopup();
}

// function selectCity(city) {
// 	if (map) {
// 		map.setView([city.Lat, city.Lng], 12); // Set view to the selected city's coordinates
// 		addMarkerToMap(city.Lat, city.Lng, city.City);
// 		document.getElementById("input-box").value = city.City; 
// 		document.querySelector(".city-result-box").style.display = "none";
// 	} else {
// 		console.error('Map object is not initialized.');
// 	}
// }

// Number of Days
async function fetchNumberOfDays() {
	try {
		const response = await fetch("http://localhost:8001/days");
		if (!response.ok) throw new Error("Network response was not ok");

		const responseData = await response.text();
		const daysData = parseDaysData(responseData);

		if (daysData && daysData.length > 0) {
			updateRadioButtons(daysData);
		} else {
			console.error("Empty or invalid days data received:", daysData);
		}
	} catch (error) {
		console.error("There was a problem with the fetch operation:", error);
	}
}

function parseDaysData(responseText) {
	try {
		const startIndex = responseText.indexOf("[");
		const jsonData = responseText.substring(startIndex);
		const parsedData = JSON.parse(jsonData);

		if (Array.isArray(parsedData)) {
			return parsedData;
		} else {
			console.error("Parsed data is not an array:", parsedData);
			return [];
		}
	} catch (error) {
		console.error("Error parsing days data:", error);
		return [];
	}
}


function updateRadioButtons(daysData) {
	const radioButtons = document.querySelectorAll('input[name="look-back"]');

	if (!Array.isArray(daysData)) {
		console.error("daysData is not an array:", daysData);
		return;
	}

	radioButtons.forEach((radio, index) => {
		if (index < daysData.length) {
			const dayEntry = daysData[index];

			if (dayEntry && typeof dayEntry.days === 'number') {
				const days = dayEntry.days;
				radio.value = days;
				const labelElement = radio.nextElementSibling;

				if (labelElement) {
					labelElement.textContent = `${days} ${days === 1 ? "day" : "days"}`;
				} else {
					console.error(`Label element not found for radio button at index ${index}`);
				}
			} else {
				console.error(`Invalid or missing 'days' at index ${index}:`, dayEntry);
				clearRadioButtonLabel(radio);
			}
		} else {
			clearRadioButtonLabel(radio);
		}
	});
}

function clearRadioButtonLabel(radio) {
	const labelElement = radio.nextElementSibling;
	if (labelElement) {
		labelElement.textContent = ""; // Clear text content if element exists
	}
}

// Flatpickr Initialization
const fromDatePicker = flatpickr("#from-date", {
	dateFormat: "Y-m-d",
	onClose: function(selectedDates, dateStr, instance) {
		toDatePicker.set("minDate", dateStr);
	},
});

const toDatePicker = flatpickr("#to-date", {
	dateFormat: "Y-m-d",
	onClose: function(selectedDates, dateStr, instance) {
		fromDatePicker.set("maxDate", dateStr); 
	},
});

const certainPeriodRadio = document.getElementById("certain-period");
certainPeriodRadio.addEventListener("change", function() {
	const calendarContainer = document.getElementById("calendar-container");
	const dateInputContainer = document.getElementById("date-input-container");
	if (this.checked) {
		calendarContainer.style.display = "block";
		dateInputContainer.style.position = "relative";
		dateInputContainer.style.top = "0";
	} else {
		calendarContainer.style.display = "none";
		dateInputContainer.style.position = "absolute";
		dateInputContainer.style.top = "50px";
	}
});

function updateSelectedDaysHeading(days) {
	const heading = document.querySelector(".options h2");
	if (heading) {
		heading.textContent = `All Events: Past ${days} ${days === 1 ? "day" : "days"}`;
	}
}

document.addEventListener("DOMContentLoaded", function() {
	const defaultDays = 30;
	const radioButtons = document.querySelectorAll('input[name="look-back"]');
	radioButtons.forEach((radio) => {
		radio.addEventListener("change", function() {
			const selectedDays = this.value;
			updateSelectedDaysHeading(selectedDays);
		});
	});

	updateSelectedDaysHeading(defaultDays);
	fetchNumberOfDays();
});

function populateArticles(articleData) {
	const articlesSection = document.getElementById("articles-section");
	articlesSection.innerHTML = ""; // Clear previous content

	// Create an unordered list for articles
	const ul = document.createElement("ul");
	ul.className = "article-list"; // Add class for styling

	// Populate list with article titles
	articleData.forEach((article, idx) => {
		const li = document.createElement("li");
		li.textContent = article.Title;
		li.style.cursor = "pointer"; // Make list item look clickable

		// Event listener to display article details when a title is clicked
		li.addEventListener("click", function() {
			displayArticleDetails(article, li);
		});

		// Append list item to the unordered list
		ul.appendChild(li);
	});

	// Append the list to the articles section
	articlesSection.appendChild(ul);
}

async function fetchArticles() {
	try {
		const response = await fetch("http://localhost:8001/articles");
		if (!response.ok) {
			throw new Error("Network response was not ok");
		}
		const responseData = await response.text();
		const articles = parseArticlesData(responseData);
		allArticles = articles; // Store all articles
		populateArticles(articles);
	} catch (error) {
		console.error("There was a problem with the fetch operation:", error);
	}
}

function parseArticlesData(responseText) {
	try {
		const headerEndIndex = responseText.indexOf("\r\n\r\n");
		const altHeaderEndIndex = responseText.indexOf("\n\n");
		const jsonData = responseText.substring(
			(headerEndIndex !== -1 ? headerEndIndex : altHeaderEndIndex) +
			(headerEndIndex !== -1 ? 4 : 2)
		);
		return JSON.parse(jsonData);
	} catch (error) {
		console.error("Error parsing articles:", error);
		return null;
	}
}

function displayArticleDetails(article, listItem) {
	// Remove any existing detail sections
	const existingDetails = document.querySelector(".article-details");
	if (existingDetails) {
		existingDetails.remove();
	}

	// Create a new details container
	const detailsContainer = document.createElement("div");
	detailsContainer.className = "article-details";

	// Title
	const title = document.createElement("h2");
	title.textContent = article.Title;
	detailsContainer.appendChild(title);

	// Date of Disruption
	const dateLabel = document.createElement("p");
	dateLabel.textContent = "Date of Disruption:";
	detailsContainer.appendChild(dateLabel);

	const date = document.createElement("p");
	date.textContent = article.PublishedDate;
	detailsContainer.appendChild(date);

	// Event Type
	const eventTypeLabel = document.createElement("p");
	eventTypeLabel.textContent = "Event Type:";
	detailsContainer.appendChild(eventTypeLabel);

	const eventType = document.createElement("p");
	eventType.textContent = article.DisruptionType;
	detailsContainer.appendChild(eventType);

	// Estimated Radius of Impact
	const radiusLabel = document.createElement("p");
	radiusLabel.textContent = "Estimated Radius of Impact:";
	detailsContainer.appendChild(radiusLabel);

	// Create a map container
	const mapContainer = document.createElement("div");
	mapContainer.id = "map";
	mapContainer.style.width = '100%'; // Make the map container responsive
	mapContainer.style.height = '300px';
	mapContainer.style.marginTop = '10px'; // Add margin top for separation
	detailsContainer.appendChild(mapContainer);

	// Initialize and display the map
	const map = L.map(mapContainer).setView([article.lat, article.lng], 13); // Initial map coordinates and zoom level

	L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
		maxZoom: 19,
	}).addTo(map);

	// Explicitly invalidate the size of the map to ensure it renders properly
	setTimeout(() => {
		map.invalidateSize();
	}, 100); // Adjust delay as necessary

	// Call addCircleToMap function with map object and article coordinates
	addCircleToMap(map, article.lat, article.lng, article.Title);

	// Severity
	const severityLabel = document.createElement("p");
	severityLabel.textContent = "Severity Metrics:";
	detailsContainer.appendChild(severityLabel);

	const severity = document.createElement("p");
	severity.textContent = article.Severity;
	detailsContainer.appendChild(severity);

	// Insert the details container right after the clicked list item
	listItem.insertAdjacentElement("afterend", detailsContainer);
}





async function fetchSupplierData() {
	try {
		const response = await fetch("http://localhost:8001/suppliers");
		if (!response.ok) {
			throw new Error("Network response was not ok");
		}
		const responseData = await response.text();
		const suppliers = parseSupplierData(responseData);
		if (suppliers) {
			window.suppliers = suppliers; 
			populateSupplierSelect(suppliers);
		} else {
			console.error("Parsed supplier data is null or undefined");
		}
	} catch (error) {
		console.error("There was a problem with the fetch operation:", error);
	}
}

function parseSupplierData(responseText) {
	try {
		const headerEndIndex = responseText.indexOf("\r\n\r\n");
		const altHeaderEndIndex = responseText.indexOf("\n\n");
		const jsonData = responseText.substring((headerEndIndex !== -1 ? headerEndIndex : altHeaderEndIndex) + (headerEndIndex !== -1 ? 4 : 2));
		return JSON.parse(jsonData);
	} catch (error) {
		console.error("Error parsing supplier data:", error);
		return null;
	}
}

function populateSupplierSelect(suppliers) {
	const supplierSelect = document.getElementById("supplier-results");
	if (!supplierSelect) {
		console.error("Supplier select element not found in the DOM");
		return;
	}

	supplierSelect.innerHTML = ""; // Clear previous options

	suppliers.forEach(supplier => {
		const li = document.createElement("li");
		li.textContent = supplier.Name;
		li.addEventListener("click", () => selectSupplier(supplier));
		supplierSelect.appendChild(li);
	});
}

// Function to filter suppliers based on input
function filterSuppliers(inputValue) {
	const filteredSuppliers = window.suppliers.filter(supplier =>
		supplier.Name.toLowerCase().includes(inputValue.toLowerCase())
	);
	populateSupplierSelect(filteredSuppliers);
	const resultBox = document.querySelector(".supplier-result-box");
	if (inputValue === "") {
		resultBox.style.display = "none"; // Hide the result box if input is empty
	} else {
		resultBox.style.display = "block"; // Show the result box if there's input
	}
}


function addMarkerToMap(lat, lng, title) {
	L.marker([lat, lng]).addTo(map)
		.bindPopup(title)
		.openPopup();
}

function selectSupplier(supplier) {
	console.log("Selected supplier:", supplier);
	addMarkerToMap(supplier.lat, supplier.lng, supplier.Name);
	map.setView([supplier.lat, supplier.lng], 12); 
	document.getElementById("supplier-input-box").value = supplier.Name;
	document.getElementById("selected-supplier").textContent = `Selected: ${supplier.Name}`;
	document.querySelector(".supplier-result-box").style.display = "none";
}

// Event listener to clear supplier search input
document.addEventListener("DOMContentLoaded", function() {
	const clearSupplierSearchButton = document.getElementById("clear-supplier-search");
	if (clearSupplierSearchButton) {
		clearSupplierSearchButton.addEventListener("click", function() {
			document.getElementById("supplier-input-box").value = "";
			document.getElementById("selected-supplier").textContent = "";
			document.getElementById("supplier-results").innerHTML = "";
			document.querySelector(".supplier-result-box").style.display = "none";
		});
	} else {
		console.error('Clear supplier search button element with ID "clear-supplier-search" not found');
	}
});

document.getElementById("supplier-input-box").addEventListener("input", function() {
	const input = this.value;
	filterSuppliers(input);
});


// Function to update selected days heading
function updateSelectedDaysHeading(selectedDays) {
	const selectedDaysHeading = document.getElementById("selected-days-heading");
	if (selectedDaysHeading) {
		selectedDaysHeading.textContent = `Showing events from last ${selectedDays} days`;
	} else {
		console.error('Selected days heading element with ID "selected-days-heading" not found');
	}
}



// Call the function
document.addEventListener("DOMContentLoaded", function() {
	fetchNumberOfDays();
	fetchCityData();
	fetchArticles();
	fetchSupplierData();


});