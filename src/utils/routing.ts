export async function getRouteData(startCoords: {lat: number, lng: number}, endCoords: {lat: number, lng: number}) {
    try {
        const response = await fetch(`https://router.project-osrm.org/route/v1/driving/${startCoords.lng},${startCoords.lat};${endCoords.lng},${endCoords.lat}?overview=full&geometries=geojson`);
        const data = await response.json();
        
        if (data.routes && data.routes.length > 0) {
            const route = data.routes[0];
            const coordinates = route.geometry.coordinates.map((coord: number[]) => ({
                lat: coord[1],
                lng: coord[0]
            }));
            
            return {
                coordinates,
                durationSeconds: route.duration,
                distanceMeters: route.distance
            };
        }
    } catch (error) {
        console.error("Error fetching route from OSRM", error);
    }
    return null;
}
