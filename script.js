
// Wait for the DOM to be ready
document.addEventListener('DOMContentLoaded', function() {

  // Cache DOM references
  const monthSelect = document.getElementById('monthSelect');
  const yearSelect  = document.getElementById('yearSelect');
  const calendar    = document.getElementById('calendar');

  // Month names for populating the <select>
  const monthNames = [
    'January','February','March','April','May','June',
    'July','August','September','October','November','December'
  ];

//Populate month dropdown
  monthNames.forEach((name, idx) => {
    const opt = document.createElement('option');
    opt.value       = idx;       // 0–11
    opt.textContent = name;      // "January", etc.
    monthSelect.appendChild(opt);
  });

  //Populate year dropdown (± 50 years around current)
  const currentYear = new Date().getFullYear();
  for (let y = currentYear - 50; y <= currentYear + 50; y++) {
    const opt = document.createElement('option');
    opt.value       = y;
    opt.textContent = y;
    yearSelect.appendChild(opt);
  }


  // Default-select “today’s” month/year
  monthSelect.value = new Date().getMonth();
  yearSelect.value  = currentYear;

  
  //Re-render calendar whenever dropdowns change
  monthSelect.addEventListener('change', renderCalendar);
  yearSelect.addEventListener('change',  renderCalendar);

  
  // Helper: Check for leap year
  function isLeapYear(year) {
    return (year % 4 === 0 && year % 100 !== 0) || (year % 400 === 0);
  }


  // Helper: Return days in a given month (0–11)
  function daysInMonth(year, month) {
    if (month === 1) { // February
      return isLeapYear(year) ? 29 : 28;  // The ternary operator “? :” picks 29 if leap, else 28
    }
    // All other months by lookup array
    return [31,28,31,30,31,30,31,31,30,31,30,31][month];
  }

  // Main: Build the calendar table
  function renderCalendar() {
    //  Read selected year/month
    const year  = parseInt(yearSelect.value, 10);
    const month = parseInt(monthSelect.value, 10);

    // Determine which weekday is the 1st of that month (0=Sun,1=Mon,...)
    const firstDayOfWeek = new Date(year, month, 1).getDay();

    // How many days are in this month?
    const totalDays = daysInMonth(year, month);

    // Clear previous content
    calendar.innerHTML = '';

    // (e) Build header row (Sun, Mon, Tue, Wed, Thu, Fri, Sat)
    const headerRow = document.createElement('tr');
    ['Sun','Mon','Tue','Wed','Thu','Fri','Sat'].forEach(dayName => {
      const th = document.createElement('th');
      th.textContent = dayName;
      headerRow.appendChild(th);
    });
    calendar.appendChild(headerRow);

    //  Variables for filling in dates
    let dateCounter = 1;
    const today = new Date();
    const todayY = today.getFullYear();
    const todayM = today.getMonth();
    const todayD = today.getDate();

    //  Up to 6 weeks per month
    for (let week = 0; week < 6; week++) {
      const row = document.createElement('tr');

      for (let dow = 0; dow < 7; dow++) {
        const cell = document.createElement('td');

        // Case 1: We’re in the first week and this dow < firstDayOfWeek → leave blank
        if (week === 0 && dow < firstDayOfWeek) {
          cell.textContent = '';
        }
        // Case 2: We’ve already placed all days in the month → leave blank
        else if (dateCounter > totalDays) {
          cell.textContent = '';
        }
        // Case 3: Place the date number
        else {
          cell.textContent = dateCounter;
          
          // If this is “today,” highlight it AND give it an ID so we can inject weather data later
          if (year === todayY && month === todayM && dateCounter === todayD) {
            cell.classList.add('today');
            // Assign an ID so our weather-fetching code can find it easily
            cell.id = 'today-cell';
          }

          dateCounter++;
        }

        row.appendChild(cell);
      }

      calendar.appendChild(row);

      // Once we’ve placed date “totalDays,” no need for more rows
      if (dateCounter > totalDays) {
        break;
      }
    }

    // After finishing the calendar markup, attempt to fetch & display weather for “today”
    insertWeatherIntoTodayCell();
  }

  // Fetch weather and inject into “today” cell
  function insertWeatherIntoTodayCell() {
    // If no “today-cell” found (e.g., month/year outside “today”), do nothing
    const todayCell = document.getElementById('today-cell');
    if (!todayCell) return;

    // Create a container <div> inside the cell to hold all weather info
    // (so we don’t overwrite the date number)
    const weatherContainer = document.createElement('div');
    weatherContainer.classList.add('weather-widget');
    // Optional: add a bit of top margin so it doesn’t overlap the date number
    weatherContainer.style.marginTop = '5px';
    weatherContainer.style.fontSize = '0.75em'; 
    weatherContainer.style.lineHeight = '1.2em';
    todayCell.appendChild(weatherContainer);

    // Your OpenWeatherMap API URL (replace the id & key with your own if needed)
    const apiURL = 
      "https://api.openweathermap.org/data/2.5/weather?id=5604045&appid=cca4336ed1a11c87c882d80f866b168d";

    // Fetch current-weather JSON
    fetch(apiURL)
      .then((response) => response.json())
      .then((jsObject) => {
        // (1) Convert Kelvin to Fahrenheit
        const Ktemp  = jsObject.main.temp; 
        const Ftemp  = 1.8 * (Ktemp - 273) + 32;
        const tempF  = Ftemp.toFixed(0);

        //Build icon URL and description
        const iconSrc = `https://openweathermap.org/img/w/${jsObject.weather[0].icon}.png`;
        const desc    = jsObject.weather[0].description;

        // Wind & humidity
        const windSpeed = jsObject.wind.speed;        // in mph or m/s depending on your account (OpenWeather defaults to m/s)
        const humid     = jsObject.main.humidity;     // in %

        // Compute wind chill if conditions met
        let windChillText = 'N/A';
        // Only compute if temp ≤ 50°F & windSpeed > 3 (mph or appropriate unit)
        if (tempF <= 50 && windSpeed > 3) {
          const chillVal = computeWindChill(tempF, windSpeed);
          windChillText = `${chillVal}°F`;
        }



        // Icon
        const img = document.createElement('img');
        img.src = iconSrc;
        img.alt = desc;
        img.style.width  = '24px';  // small icon
        img.style.height = '24px';
        img.style.verticalAlign = 'middle';
        weatherContainer.appendChild(img);

        // Description
        const descSpan = document.createElement('span');
        descSpan.textContent = ` ${desc}`;  // leading space
        weatherContainer.appendChild(descSpan);

        // Temperature
        const tempSpan = document.createElement('div');
        tempSpan.textContent = `Temp: ${tempF}°F`;
        weatherContainer.appendChild(tempSpan);

        // Wind speed
        const windSpan = document.createElement('div');
        windSpan.textContent = `Wind: ${windSpeed.toFixed(0)} mph`;
        weatherContainer.appendChild(windSpan);

        // Humidity
        const humSpan = document.createElement('div');
        humSpan.textContent = `Humidity: ${humid}%`;
        weatherContainer.appendChild(humSpan);

        // Wind Chill
        const chillSpan = document.createElement('div');
        chillSpan.textContent = `Chill: ${windChillText}`;
        weatherContainer.appendChild(chillSpan);
      })
      .catch((err) => {
        // If the fetch fails, show an error inside todayCell
        const errorDiv = document.createElement('div');
        errorDiv.textContent = 'Weather unavailable';
        errorDiv.style.color = 'red';
        errorDiv.style.fontSize = '0.7em';
        todayCell.appendChild(errorDiv);
        console.error('Weather fetch error:', err);
      });
  }

  
  function computeWindChill(tempF, windSpeed) {
    const wc = 35.74 +
               0.6215 * tempF -
               35.75 * Math.pow(windSpeed, 0.16) +
               0.4275 * tempF * Math.pow(windSpeed, 0.16);
    return wc.toFixed(0);
  }

  //  Initial calendar render
  renderCalendar();
});
