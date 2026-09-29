// Helper to resolve specific region / locality from coordinates
export const getSpecificRegionFromCoords = (lat, lng) => {
  // Hardcoded regions removed based on user preference for dynamic live location
  return 'Verified Location';
};

// Formats specific location from reverse geocoding result
export const parseSpecificLocation = (data, lat = null, lng = null) => {
  if (!data) {
    return 'Live Location';
  }

  const a = data.address || {};

  const locality =
    a.suburb ||
    a.neighbourhood ||
    a.residential ||
    a.quarter ||
    a.commercial ||
    a.subdistrict ||
    a.road ||
    (data.display_name ? data.display_name.split(',')[0].trim() : '');

  const city = a.city || a.town || a.village || a.county || '';

  if (locality && city) {
    if (locality.toLowerCase() === city.toLowerCase()) return city;
    if (locality.toLowerCase().includes(city.toLowerCase())) return locality;
    return `${locality}, ${city}`;
  }

  if (locality) return locality;
  if (city) return city;

  return 'Live Location';
};

