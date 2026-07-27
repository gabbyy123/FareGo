export interface GeoLocation {
    name: string;
    category: string;
    lat: number;
    lng: number;
}

export const GEO_DATA: GeoLocation[] = [
    // Metro Manila (Urban Core)
    { name: "Ayala Center", category: "Makati • CBD / Mall", lat: 14.5516, lng: 121.0253 },
    { name: "BGC High Street", category: "Taguig • CBD / Lifestyle", lat: 14.5524, lng: 121.0505 },
    { name: "Ortigas Center", category: "Pasig • CBD", lat: 14.5841, lng: 121.0605 },
    { name: "PITX (Parañaque Integrated Terminal Exchange)", category: "Parañaque • Transit Hub", lat: 14.5106, lng: 120.9904 },
    { name: "NAIA Terminal 3", category: "Pasay • Airport", lat: 14.5204, lng: 121.0175 },
    { name: "SM Megamall", category: "Mandaluyong • Mall", lat: 14.5844, lng: 121.0567 },
    { name: "Trinoma", category: "Quezon City • Mall", lat: 14.6534, lng: 121.0335 },
    { name: "Rizal Technological University (RTU)", category: "Mandaluyong • University", lat: 14.5753, lng: 121.0366 },
    { name: "ACLC College", category: "Mandaluyong • University", lat: 14.5888, lng: 121.0601 },
    { name: "UP Diliman", category: "Quezon City • University", lat: 14.6549, lng: 121.0646 },

    // Calabarzon (Suburban/Urban-Fringe)
    { name: "SM City Angono", category: "Rizal • Mall", lat: 14.5233, lng: 121.1554 },
    { name: "Antipolo Cathedral", category: "Rizal • Landmark", lat: 14.5878, lng: 121.1764 },
    { name: "Taytay Tiangge", category: "Rizal • Market", lat: 14.5684, lng: 121.1345 },
    { name: "SM City Calamba", category: "Laguna • Mall", lat: 14.2016, lng: 121.1610 },
    { name: "Enchanted Kingdom", category: "Sta. Rosa • Theme Park", lat: 14.2818, lng: 121.0965 },
    { name: "SM City Dasmariñas", category: "Cavite • Mall", lat: 14.2987, lng: 120.9575 },
    { name: "SM City Bacoor", category: "Cavite • Mall", lat: 14.4539, lng: 120.9482 },

    // Peri-Urban/Provincial Transit Points
    { name: "Araneta Center Bus Terminal", category: "Quezon City • Transit Hub", lat: 14.6209, lng: 121.0544 },
    { name: "Batangas Grand Terminal", category: "Batangas • Transit Hub", lat: 13.7844, lng: 121.0667 },
    { name: "Turbina Bus Terminal", category: "Calamba • Transit Hub", lat: 14.1884, lng: 121.1394 },
    { name: "Legazpi Grand Central Terminal", category: "Bicol • Transit Hub", lat: 13.1491, lng: 123.7431 }
];
