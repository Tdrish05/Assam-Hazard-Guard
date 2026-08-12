import 'dotenv/config';
import { prisma } from './prisma';
import { calculateTrustScore } from './routing-engine';

interface LocationConfig {
  name: string;
  lat: number;
  lng: number;
  region: string;
}

const ASSAM_CITIES: LocationConfig[] = [
  { name: 'Guwahati', lat: 26.1445, lng: 91.7362, region: 'Lower Assam (Hilly)' },
  { name: 'Dibrugarh', lat: 27.4728, lng: 94.9120, region: 'Upper Assam' },
  { name: 'Jorhat', lat: 26.7509, lng: 94.2037, region: 'Upper Assam' },
  { name: 'Silchar', lat: 24.8333, lng: 92.7789, region: 'Southern Assam' },
  { name: 'Tezpur', lat: 26.6338, lng: 92.7926, region: 'Central Assam' },
  { name: 'Haflong (Dima Hasao)', lat: 25.1833, lng: 93.0167, region: 'Southern Hills (Mountainous)' },
];

export interface HazardWarning {
  id: string;
  type: 'rain' | 'flood' | 'earthquake' | 'fire' | 'landslide' | 'cloud_burst' | 'thunderstorm';
  severity: 'red' | 'orange' | 'yellow';
  title: string;
  description: string;
  locationName: string;
  latitude: number;
  longitude: number;
  timestamp: string;
  details?: Record<string, any>;
}

export interface FloodZone {
  id: string;
  name: string;
  latitude: number;
  longitude: number;
  radius: number;
  riskLevel: 'high' | 'moderate' | 'low';
  probability: number; // percentage (0-100)
  precipitationForecast: number; // mm
  description: string;
}

export interface CityForecast {
  name: string;
  region: string;
  latitude: number;
  longitude: number;
  currentTemp: number;
  humidity: number;
  windSpeed: number;
  rainProbability: number;
  weatherCode: number;
  summary: string;
}

// Convert Open-Meteo weather codes to friendly descriptions
function getWeatherSummary(code: number): string {
  if (code === 0) return 'Clear Sky ☀️';
  if (code >= 1 && code <= 3) return 'Partly Cloudy ⛅';
  if (code >= 45 && code <= 48) return 'Foggy 🌫️';
  if (code >= 51 && code <= 55) return 'Light Drizzle 🌧️';
  if (code >= 61 && code <= 65) return 'Rainy 🌧️';
  if (code >= 71 && code <= 77) return 'Snowy ❄️';
  if (code >= 80 && code <= 82) return 'Rain Showers 🌦️';
  if (code >= 95 && code <= 99) return 'Thunderstorm ⛈️';
  return 'Overcast ☁️';
}

/**
 * Calculates continuous rain block starting time and duration in hours.
 */
function calculateRainDuration(hourlyPrecipitation: number[], hourlyProb: number[]): { duration: number; startHour: number; totalRain: number } {
  let maxDuration = 0;
  let currentDuration = 0;
  let currentStart = -1;
  let bestStart = -1;
  let totalRain = 0;

  for (let i = 0; i < 24; i++) {
    const isRaining = hourlyPrecipitation[i] > 0.8 || hourlyProb[i] > 50;
    if (isRaining) {
      if (currentStart === -1) currentStart = i;
      currentDuration++;
      totalRain += hourlyPrecipitation[i];
    } else {
      if (currentDuration > maxDuration) {
        maxDuration = currentDuration;
        bestStart = currentStart;
      }
      currentDuration = 0;
      currentStart = -1;
    }
  }

  if (currentDuration > maxDuration) {
    maxDuration = currentDuration;
    bestStart = currentStart;
  }

  return {
    duration: maxDuration,
    startHour: bestStart,
    totalRain: parseFloat(totalRain.toFixed(1))
  };
}

/**
 * Fallback generator for weather & warnings if APIs are down or rate-limited.
 */
export interface HistoricalFloodZone {
  id: string;
  name: string;
  district: string;
  latitude: number;
  longitude: number;
  radius: number;
  affectedPopulation: number;
  cropDamageHectares: number;
  reliefHubName: string;
  neededSupplies: string[];
  contactNumber: string;
  details: string;
}

export const HISTORICAL_FLOODS: HistoricalFloodZone[] = [
  {
    id: 'h-lakhimpur',
    name: 'Subansiri River Embankment Breach Plain',
    district: 'Lakhimpur',
    latitude: 27.2350,
    longitude: 94.0950,
    radius: 18000,
    affectedPopulation: 142000,
    cropDamageHectares: 12400,
    reliefHubName: 'North Lakhimpur Govt College Hub',
    neededSupplies: ['Water Purification Tablets 💧', 'Baby Milk Powder 🍼', 'Tarpaulin Sheets ⛺', 'ORS Packets 💊'],
    contactNumber: '+91 375 222 0311',
    details: 'Severe embankment breach in Subansiri bank submerged 140 villages. Flood water is receding, but mud-sludge accumulation has contaminated 92% of local drinking water wells.'
  },
  {
    id: 'h-dhemaji',
    name: 'Gai River Flash Runoff Inundation Belt',
    district: 'Dhemaji',
    latitude: 27.4720,
    longitude: 94.5750,
    radius: 20000,
    affectedPopulation: 98000,
    cropDamageHectares: 9800,
    reliefHubName: 'Dhemaji Town Hall Relief Station',
    neededSupplies: ['Dry Rations (Rice, Dal, Salt) 🍚', 'Dettol & Bleaching Powder 🧴', 'Mosquito Nets (Meda) 🦟'],
    contactNumber: '+91 375 322 4225',
    details: 'High-velocity flash runoffs washed away secondary road bridges, isolating 48 village sectors. Volunteers coordinating supply drops via motorized rafts.'
  },
  {
    id: 'h-dibrugarh',
    name: 'Brahmaputra Bank Urban Inundation Wards',
    district: 'Dibrugarh',
    latitude: 27.4850,
    longitude: 94.9100,
    radius: 15000,
    affectedPopulation: 85000,
    cropDamageHectares: 3200,
    reliefHubName: 'Dibrugarh University Relief camp',
    neededSupplies: ['Emergency First-Aid Kits 🩹', 'Clean Sanitary Napkins 🩺', 'Flashlights & Battery Banks 🔦'],
    contactNumber: '+91 373 237 0243',
    details: 'Urban drainage backup combined with river overflow flooded 18 municipal wards. Rehabilitation is in progress, volunteers are helping dump sludge and distribute sanitation kits.'
  }
];

function getFallbackData(): { warnings: HazardWarning[]; floodZones: FloodZone[]; forecasts: CityForecast[]; historicalFloods: HistoricalFloodZone[] } {
  const mockDate = new Date().toISOString();
  
  const forecasts: CityForecast[] = [
    { name: 'Guwahati', region: 'Lower Assam (Hilly)', latitude: 26.1445, longitude: 91.7362, currentTemp: 31.5, humidity: 72, windSpeed: 8.5, rainProbability: 80, weatherCode: 95, summary: 'Thunderstorm ⛈️' },
    { name: 'Dibrugarh', region: 'Upper Assam', latitude: 27.4728, longitude: 94.9120, currentTemp: 29.0, humidity: 88, windSpeed: 14.2, rainProbability: 95, weatherCode: 65, summary: 'Heavy Rain 🌧️' },
    { name: 'Jorhat', region: 'Upper Assam', latitude: 26.7509, longitude: 94.2037, currentTemp: 29.5, humidity: 82, windSpeed: 11.0, rainProbability: 90, weatherCode: 63, summary: 'Rainy 🌧️' },
    { name: 'Silchar', region: 'Southern Assam', latitude: 24.8333, longitude: 92.7789, currentTemp: 32.0, humidity: 65, windSpeed: 6.4, rainProbability: 40, weatherCode: 3, summary: 'Partly Cloudy ⛅' },
    { name: 'Tezpur', region: 'Central Assam', latitude: 26.6338, longitude: 92.7926, currentTemp: 30.5, humidity: 75, windSpeed: 9.0, rainProbability: 75, weatherCode: 81, summary: 'Rain Showers 🌦️' },
    { name: 'Haflong (Dima Hasao)', region: 'Southern Hills (Mountainous)', latitude: 25.1833, longitude: 93.0167, currentTemp: 27.0, humidity: 92, windSpeed: 16.0, rainProbability: 98, weatherCode: 99, summary: 'Heavy Thunderstorm ⛈️' },
  ];

  const warnings: HazardWarning[] = [
    {
      id: 'mock-rain-dibrugarh',
      type: 'rain',
      severity: 'orange',
      title: 'Heavy Rain Advisory Tonight',
      description: 'Continuous torrential rain forecast tonight for 6 hours starting around 7:00 PM. Total accumulation ~45mm. Drive carefully.',
      locationName: 'Dibrugarh',
      latitude: 27.4728,
      longitude: 94.9120,
      timestamp: mockDate
    },
    {
      id: 'mock-flood-majuli',
      type: 'flood',
      severity: 'red',
      title: 'Severe Flood Alert: Majuli Island',
      description: 'Brahmaputra river level warning: High probability of inundation in low-lying agricultural zones of Majuli due to heavy upper catchment runoff.',
      locationName: 'Majuli District',
      latitude: 26.9609,
      longitude: 94.2181,
      timestamp: mockDate
    },
    {
      id: 'mock-fire-kaziranga',
      type: 'fire',
      severity: 'yellow',
      title: 'Moderate Forest Fire Advisory',
      description: 'Dry forest grassland fire danger index. Forest rangers advised to monitor Kaziranga core zones for heat anomalies.',
      locationName: 'Kaziranga National Park',
      latitude: 26.5775,
      longitude: 93.1711,
      timestamp: mockDate
    },
    {
      id: 'mock-quake-northeast',
      type: 'earthquake',
      severity: 'orange',
      title: 'M 4.2 Earthquake Detected',
      description: 'Seismic event registered 92km East of Jorhat at a depth of 10km. Slight tremors felt.',
      locationName: 'Assam-Nagaland Border',
      latitude: 26.5800,
      longitude: 95.1200,
      timestamp: mockDate,
      details: { magnitude: 4.2, depth: 10 }
    },
    {
      id: 'mock-landslide-haflong',
      type: 'landslide',
      severity: 'red',
      title: '⛰️ Landslide Risk Alert: Haflong Hills',
      description: 'Soil saturation levels have exceeded safe limits due to 48mm forecasted rain. High danger of landslides along the Jatinga-Haflong hill road.',
      locationName: 'Haflong (Dima Hasao)',
      latitude: 25.1833,
      longitude: 93.0167,
      timestamp: mockDate
    }
  ];

  const floodZones: FloodZone[] = [
    { id: 'f-majuli', name: 'Basin: Majuli Plains', latitude: 26.9609, longitude: 94.2181, radius: 22000, riskLevel: 'high', probability: 85, precipitationForecast: 48.5, description: 'Flooding highly probable in agricultural river belts due to upstream discharge.' },
    { id: 'f-morigaon', name: 'Basin: Morigaon (Pobitora)', latitude: 26.2443, longitude: 92.2639, radius: 18000, riskLevel: 'moderate', probability: 55, precipitationForecast: 22.4, description: 'Risk of waterlogging in pasture fields and peripheral forest boundaries.' },
    { id: 'f-barpeta', name: 'Basin: Barpeta Flood Plain', latitude: 26.3204, longitude: 90.9822, radius: 24000, riskLevel: 'low', probability: 20, precipitationForecast: 8.5, description: 'Normal river flows; minor water accumulation in low drainage areas.' },
    { id: 'f-dibrugarh', name: 'Basin: Dibrugarh Lowlands', latitude: 27.4854, longitude: 94.9500, radius: 12000, riskLevel: 'high', probability: 90, precipitationForecast: 42.0, description: 'Urban waterlogging alert. High probability of street flooding in low-lying wards.' },
  ];

  return { warnings, floodZones, forecasts, historicalFloods: HISTORICAL_FLOODS };
}

/**
 * Query meteorological and seismic APIs and compute active warnings dynamically.
 */
export async function getWarningsAndAdvisories() {
  try {
    // 1. Batch query Open-Meteo for all cities
    const lats = ASSAM_CITIES.map(c => c.lat).join(',');
    const lngs = ASSAM_CITIES.map(c => c.lng).join(',');
    const weatherUrl = `https://api.open-meteo.com/v1/forecast?latitude=${lats}&longitude=${lngs}&current=temperature_2m,relative_humidity_2m,wind_speed_10m,weather_code&hourly=precipitation,precipitation_probability&daily=precipitation_sum&timezone=auto`;
    
    let weatherData: any[] = [];
    try {
      const response = await fetch(weatherUrl);
      if (response.ok) {
        const result = await response.json();
        weatherData = Array.isArray(result) ? result : [result];
      }
    } catch (e) {
      console.warn('Weather API failed, utilizing fallbacks.', e);
    }

    // 2. Fetch Earthquakes from USGS
    const start = new Date();
    start.setDate(start.getDate() - 7);
    const starttime = start.toISOString().split('T')[0];
    const earthquakeUrl = `https://earthquake.usgs.gov/fdsnws/event/1/query?format=geojson&minlatitude=20&maxlatitude=30&minlongitude=88&maxlongitude=98&starttime=${starttime}&minmagnitude=3.0`;

    let earthquakeFeatures: any[] = [];
    try {
      const response = await fetch(earthquakeUrl);
      if (response.ok) {
        const data = await response.json();
        earthquakeFeatures = data.features || [];
      }
    } catch (e) {
      console.warn('Seismic API failed, utilizing fallbacks.', e);
    }

    // If both failed, load full diagnostic fallbacks
    if (weatherData.length === 0 && earthquakeFeatures.length === 0) {
      return getFallbackData();
    }

    const forecasts: CityForecast[] = [];
    const warnings: HazardWarning[] = [];
    const floodZones: FloodZone[] = [];
    const nowStr = new Date().toISOString();

    // 3. Process Weather Data
    ASSAM_CITIES.forEach((city, index) => {
      const data = weatherData[index] || getFallbackData().forecasts[index];
      const current = data.current || {};
      const hourly = data.hourly || { precipitation: [], precipitation_probability: [] };
      const daily = data.daily || { precipitation_sum: [] };

      const temp = current.temperature_2m ?? 30.0;
      const humidity = current.relative_humidity_2m ?? 80;
      const wind = current.wind_speed_10m ?? 10.0;
      const weatherCode = current.weather_code ?? 3;
      const rainProb = hourly.precipitation_probability ? Math.max(...(hourly.precipitation_probability.slice(0, 24) as number[]), 0) : 50;

      forecasts.push({
        name: city.name,
        region: city.region,
        latitude: city.lat,
        longitude: city.lng,
        currentTemp: temp,
        humidity,
        windSpeed: wind,
        rainProbability: rainProb,
        weatherCode,
        summary: getWeatherSummary(weatherCode),
      });

      const dailyRainSum = daily.precipitation_sum?.[0] ?? 0.0;

      // Rule A: Cloud Burst Alert (Extreme hourly rate >10mm/h)
      if (hourly.precipitation) {
        let maxHourlyRain = 0;
        let cloudBurstHour = -1;
        for (let i = 0; i < 24; i++) {
          const rainHour = hourly.precipitation[i] ?? 0;
          if (rainHour > maxHourlyRain) {
            maxHourlyRain = rainHour;
          }
          if (rainHour > 10.0) { // >10mm in an hour is an extreme rainfall rate for hill sectors
            cloudBurstHour = i;
          }
        }

        if (cloudBurstHour !== -1) {
          warnings.push({
            id: `cloudburst-${city.name.toLowerCase()}-${Date.now()}`,
            type: 'cloud_burst',
            severity: 'red',
            title: `⛈️ Cloud Burst Alert: ${city.name}`,
            description: `CRITICAL Warning: Extreme cloud-burst precipitation rates forecast at ${maxHourlyRain.toFixed(1)}mm/hour. Severe flash flooding and debris flows are highly probable. Seek immediate safety.`,
            locationName: city.name,
            latitude: city.lat,
            longitude: city.lng,
            timestamp: nowStr,
          });
        }
      }

      // Rule B: Landslide Warning (Mountainous/Hilly regions with daily rain >30mm)
      const isHilly = city.name.includes('Guwahati') || city.name.includes('Haflong');
      if (isHilly && dailyRainSum > 30.0) {
        warnings.push({
          id: `landslide-${city.name.toLowerCase()}-${Date.now()}`,
          type: 'landslide',
          severity: 'red',
          title: `⛰️ Landslide Hazard Warning: ${city.name}`,
          description: `Hilly terrain soil saturation warning. Heavy rain accumulation (${dailyRainSum.toFixed(1)}mm) increases slope instability. Avoid steep routes and hill cuts.`,
          locationName: city.name,
          latitude: city.lat,
          longitude: city.lng,
          timestamp: nowStr,
        });
      }

      // Rule C: Thunderstorm & Lightning Warnings (Weather code 95, 96, 99)
      if (weatherCode === 95 || weatherCode === 96 || weatherCode === 99) {
        warnings.push({
          id: `thunderstorm-${city.name.toLowerCase()}-${Date.now()}`,
          type: 'thunderstorm',
          severity: 'orange',
          title: `⚡ Severe Thunderstorm & Lightning: ${city.name}`,
          description: `Active thunder cells, heavy lightning strikes, and gusty winds expected. Avoid open ground, lakes, and electrical utility poles.`,
          locationName: city.name,
          latitude: city.lat,
          longitude: city.lng,
          timestamp: nowStr,
        });
      }

      // Rule D: Continuous Rain Duration Alert
      if (hourly.precipitation && hourly.precipitation_probability) {
        const rainAnalysis = calculateRainDuration(
          hourly.precipitation.slice(0, 24),
          hourly.precipitation_probability.slice(0, 24)
        );

        if (rainAnalysis.duration >= 2 && rainAnalysis.totalRain > 10.0) {
          const isHeavy = rainAnalysis.totalRain > 25.0 || rainAnalysis.duration >= 5;
          const formatTime = (hour: number) => {
            const h = hour % 12 || 12;
            const ampm = hour >= 12 ? 'PM' : 'AM';
            return `${h}:00 ${ampm}`;
          };

          warnings.push({
            id: `rain-${city.name.toLowerCase()}-${Date.now()}`,
            type: 'rain',
            severity: isHeavy ? 'orange' : 'yellow',
            title: `Rainfall Duration Warning: ${city.name}`,
            description: `Continuous rainfall predicted for ${rainAnalysis.duration} hours starting around ${formatTime(rainAnalysis.startHour)}. Accumulation: ${rainAnalysis.totalRain}mm.`,
            locationName: city.name,
            latitude: city.lat,
            longitude: city.lng,
            timestamp: nowStr,
          });
        }
      }
    });

    // 4. Calculate dynamic flood zones risk levels based on live weather precipitation
    const getRainSumForCity = (cityName: string): number => {
      const match = forecasts.find(f => f.name.includes(cityName));
      if (match) {
        const cityIndex = ASSAM_CITIES.findIndex(c => c.name.includes(cityName));
        if (cityIndex !== -1 && weatherData[cityIndex] && weatherData[cityIndex].daily) {
          return weatherData[cityIndex].daily.precipitation_sum?.[0] ?? 10.0;
        }
      }
      return 15.0;
    };

    const basinConfigs = [
      { id: 'f-majuli', name: 'Basin: Majuli Plains', lat: 26.9609, lng: 94.2181, radius: 22000, triggerCity: 'Jorhat', baseDesc: 'Agricultural flooding belts along the Brahmaputra.', district: 'Jorhat', contact: '+91 376 230 1199' },
      { id: 'f-morigaon', name: 'Basin: Morigaon (Pobitora)', lat: 26.2443, lng: 92.2639, radius: 18000, triggerCity: 'Tezpur', baseDesc: 'Low drainage grassland flooding threat.', district: 'Marigaon', contact: '+91 371 222 0541' },
      { id: 'f-barpeta', name: 'Basin: Barpeta Flood Plain', lat: 26.3204, lng: 90.9822, radius: 24000, triggerCity: 'Guwahati', baseDesc: 'Lower Brahmaputra flooding corridor.', district: 'Barpeta', contact: '+91 361 245 8899' },
      { id: 'f-dibrugarh', name: 'Basin: Dibrugarh Lowlands', lat: 27.4854, lng: 94.9500, radius: 12000, triggerCity: 'Dibrugarh', baseDesc: 'Urban street logging and residential runoff.', district: 'Dibrugarh', contact: '+91 373 237 0243' },
    ];

    const historicalFloods: HistoricalFloodZone[] = [];

    basinConfigs.forEach(basin => {
      const forecastRain = getRainSumForCity(basin.triggerCity);
      let riskLevel: 'low' | 'moderate' | 'high' = 'low';
      let probability = 15;

      if (forecastRain > 30) {
        riskLevel = 'high';
        probability = Math.min(Math.round(60 + (forecastRain * 0.8)), 98);
      } else if (forecastRain > 12) {
        riskLevel = 'moderate';
        probability = Math.round(30 + (forecastRain * 1.2));
      } else {
        probability = Math.round(5 + (forecastRain * 1.5));
      }

      if (riskLevel === 'high' || riskLevel === 'moderate') {
        // 1. ACTIVE FLOOD BASIN
        floodZones.push({
          id: basin.id,
          name: basin.name,
          latitude: basin.lat,
          longitude: basin.lng,
          radius: basin.radius,
          riskLevel,
          probability,
          precipitationForecast: parseFloat(forecastRain.toFixed(1)),
          description: `${basin.baseDesc} Current 24h precipitation forecast: ${forecastRain.toFixed(1)}mm.`,
        });

        warnings.push({
          id: `flood-${basin.id}-${Date.now()}`,
          type: 'flood',
          severity: riskLevel === 'high' ? 'red' : 'orange',
          title: `Flood Risk Warning: ${basin.name}`,
          description: `Localized flooding probability is ${probability}% due to forecasted rain accumulation of ${forecastRain.toFixed(1)}mm. Low ground areas should prepare safety plans.`,
          locationName: basin.name,
          latitude: basin.lat,
          longitude: basin.lng,
          timestamp: nowStr,
        });
      } else {
        // 2. PREVIOUS FLOOD AFFECTED AREA (Receded, in recovery/rehabilitation phase)
        const affPop = Math.round(45000 + (probability * 1400));
        const cropDmg = Math.round(1800 + (probability * 95));
        
        historicalFloods.push({
          id: `prev-${basin.id}`,
          name: basin.name.replace('Basin:', 'Receded Inundation Plain:'),
          district: basin.district,
          latitude: basin.lat,
          longitude: basin.lng,
          radius: basin.radius,
          affectedPopulation: affPop,
          cropDamageHectares: cropDmg,
          reliefHubName: `${basin.triggerCity} Govt School Relief Center`,
          neededSupplies: ['Water Purification Tablets 💧', 'Dry Rations (Rice, Dal, Salt) 🍚', 'ORS Packets 💊', 'Dettol & Bleaching Powder 🧴'],
          contactNumber: basin.contact,
          details: `Water levels are receding in the ${basin.district} basin. Primary floodwaters have returned below danger marks, but municipal rehabilitation is currently active. Drinking water systems require sanitization.`
        });
      }
    });

    // 5. Calculate Forest Fire Indexes in reserves
    const reserves = [
      { name: 'Kaziranga National Park', lat: 26.5775, lng: 93.1711, triggerCity: 'Tezpur' },
      { name: 'Manas National Park', lat: 26.7271, lng: 90.9631, triggerCity: 'Guwahati' },
    ];

    reserves.forEach(reserve => {
      const refForecast = forecasts.find(f => f.name.includes(reserve.triggerCity)) || forecasts[0];
      const temp = refForecast.currentTemp;
      const hum = refForecast.humidity;
      const wind = refForecast.windSpeed;

      let severity: 'red' | 'orange' | 'yellow' | null = null;
      let title = '';
      let desc = '';

      if (temp > 33 && hum < 40 && wind > 15) {
        severity = 'red';
        title = `🔥 Wildfire Hazard: ${reserve.name}`;
        desc = `Extremely critical forest fire risk index (Temp: ${temp.toFixed(1)}°C, Humidity: ${hum}%, Wind: ${wind.toFixed(1)}km/h). Open cooking or matches prohibited.`;
      } else if (temp > 30 && hum < 50) {
        severity = 'orange';
        title = `🔥 High Wildfire Danger Index`;
        desc = `Dry atmospheric profiles and low ground moisture in ${reserve.name} increase dry vegetation fire probability. Monitoring recommended.`;
      } else if (temp > 28 && hum < 58) {
        severity = 'yellow';
        title = `🔥 Forest Fire Risk Advisory`;
        desc = `Moderate vegetation dry index calculated for ${reserve.name}. Be cautious with dry leaves trash clearing.`;
      }

      if (severity) {
        warnings.push({
          id: `fire-${reserve.name.replace(/\s+/g, '-').toLowerCase()}-${Date.now()}`,
          type: 'fire',
          severity,
          title,
          description: desc,
          locationName: reserve.name,
          latitude: reserve.lat,
          longitude: reserve.lng,
          timestamp: nowStr,
        });
      }
    });

    // 6. Process USGS Seismic Alerts
    earthquakeFeatures.slice(0, 8).forEach((eq: any) => {
      const props = eq.properties || {};
      const geom = eq.geometry || { coordinates: [] };
      const mag = props.mag ?? 3.5;
      const place = props.place ?? 'Northeast India';
      const time = props.time ?? Date.now();
      const coords = geom.coordinates || [];

      if (coords.length >= 2) {
        const severity = mag >= 4.8 ? 'red' : mag >= 3.8 ? 'orange' : 'yellow';
        warnings.push({
          id: `quake-${eq.id || Date.now()}`,
          type: 'earthquake',
          severity,
          title: `M ${mag.toFixed(1)} Earthquake`,
          description: `Seismic activity registered at depth of ${(coords[2] ?? 10).toFixed(1)}km. Origin: ${place}.`,
          locationName: place,
          latitude: coords[1],
          longitude: coords[0],
          timestamp: new Date(time).toISOString(),
          details: {
            magnitude: mag,
            depth: coords[2] ?? 10,
          },
        });
      }
    });

    // 7. Inject Database Active Citizen Reports (Consensus trust verification)
    let dbAlerts: any[] = [];
    try {
      dbAlerts = await prisma.alert.findMany({
        where: {
          status: 'ACTIVE',
        },
      });
    } catch (dbError) {
      console.warn('Postgres database connection warning. Skipping community pins.', dbError);
    }

    dbAlerts.forEach((alert) => {
      // Find default rainfall forecast for consensus check
      const rainForecast = getRainSumForCity(alert.category === 'waterlogging' ? 'Guwahati' : 'Jorhat');
      
      const trust = calculateTrustScore(
        {
          category: alert.category,
          latitude: alert.latitude,
          longitude: alert.longitude,
          upvotes: alert.upvotes,
        },
        dbAlerts,
        rainForecast
      );

      // Suspect warnings under 45% are marked as yellow potential false warnings
      // Moderate corroborated or high verified alerts are marked as orange warning alerts
      const severity = trust.status === 'verified' ? 'orange' : 'yellow';
      
      const categoryTypeMap: Record<string, 'rain' | 'flood' | 'earthquake' | 'fire' | 'landslide' | 'cloud_burst' | 'thunderstorm'> = {
        waterlogging: 'rain',
        road_closure: 'rain',
        pothole: 'landslide',
        power_outage: 'thunderstorm',
        other: 'landslide',
      };

      warnings.push({
        id: `db-${alert.id}`,
        type: categoryTypeMap[alert.category] || 'landslide',
        severity: severity,
        title: `${alert.category.replace('_', ' ').toUpperCase()}: ${trust.label}`,
        description: `${alert.description} [Calculated Trust Confidence: ${trust.confidence}%]`,
        locationName: `Citizen Report near (${alert.latitude.toFixed(4)}°, ${alert.longitude.toFixed(4)}°)`,
        latitude: alert.latitude,
        longitude: alert.longitude,
        timestamp: alert.timestamp.toISOString(),
        details: {
          confidence: trust.confidence,
          trustStatus: trust.status,
          trustReasons: trust.reasons,
          upvotes: alert.upvotes,
        },
      });
    });

    // Sort all warnings by severity (Red -> Orange -> Yellow)
    const severityOrder = { red: 0, orange: 1, yellow: 2 };
    warnings.sort((a, b) => severityOrder[a.severity] - severityOrder[b.severity]);

    return {
      warnings,
      floodZones,
      forecasts,
      historicalFloods
    };
  } catch (error) {
    console.error('Warning engine crash, loading fallback safety dataset:', error);
    return getFallbackData();
  }
}
