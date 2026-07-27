export interface TripLogEntry {
    id: string;
    date: string;
    role: 'passenger' | 'driver';
    recordedPath: {lat: number, lng: number}[];
    pickup?: string;
    dropoff?: string;
    fare: number;
}

export const saveTripLog = (entry: TripLogEntry) => {
    try {
        const existingStr = localStorage.getItem('farego_trip_history');
        const existing: TripLogEntry[] = existingStr ? JSON.parse(existingStr) : [];
        localStorage.setItem('farego_trip_history', JSON.stringify([entry, ...existing]));
    } catch (e) {
        console.error("Failed to save trip log", e);
    }
};

export const getTripLogs = (): TripLogEntry[] => {
    try {
        const existingStr = localStorage.getItem('farego_trip_history');
        return existingStr ? JSON.parse(existingStr) : [];
    } catch (e) {
        return [];
    }
};
