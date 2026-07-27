import mysql from 'mysql2/promise';

// In a real environment, this would establish connection pooling
const pool = process.env.DB_HOST ? mysql.createPool({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0
}) : null;

// Mock store for fallback
class MockStore {
    users: any[] = [
        { id: 1, firstName: 'Admin', lastName: 'User', email: 'admin@farego.com', phone: '09123456789', passwordHash: '$2b$10$wTfD.2y7F7h.3uR95O9qI.W2rM9l/3aQ83tq/Hw1W0k.t7.d2L3Oa', role: 'admin', isVerified: true }, // hash usually is bcrypt, but mock just checks. wait, login mock checks bcrypt logic, so I can't just put a dummy string if bcrypt is used. Let's see how login works.
    ];
    vehicles: any[] = [];
    promo_codes: any[] = [
        { id: 1, code: 'FAREGO20', discountPercentage: 20, isActive: true, createdAt: new Date() }
    ];
    ride_requests: any[] = [];
    bids: any[] = [];
    transactions: any[] = [];
    admins: any[] = [];
    idCounter = 4;

    constructor() {
        this.ride_requests.push(
            { id: 1, passengerId: 1, driverId: 2, driverName: 'Juan Dela Cruz', passengerName: 'Gabriel Dorado', pickupAddress: 'Ayala Center, Makati', dropoffAddress: 'BGC High Street, Taguig', proposedFare: 220, status: 'completed', createdAt: new Date(Date.now() - 86400000) },
            { id: 2, passengerId: 2, driverId: 1, driverName: 'Maria Santos', passengerName: 'Sample Passenger', pickupAddress: 'SM Megamall', dropoffAddress: 'Ortigas Center', proposedFare: 150, status: 'completed', createdAt: new Date(Date.now() - 172800000) },
            { id: 3, passengerId: 1, driverId: 3, driverName: 'Kuya Motor', passengerName: 'Gabriel Dorado', pickupAddress: 'Makati CBD', dropoffAddress: 'NAIA Terminal 3', proposedFare: 350, status: 'completed', createdAt: new Date(Date.now() - 259200000) }
        );
    }

    async query(sql: string, params: any[] = []): Promise<any> {
        console.log(`[Mock DB Query]: ${sql}`, params);
        // Extremely simple mock handling for auth and basic data retrieval
        if (sql.includes('SELECT * FROM users WHERE email')) {
            const user = this.users.find(u => u.email === params[0]);
            return [[user || null]];
        }
        if (sql.includes('SELECT * FROM users WHERE id = ?')) {
             const user = this.users.find(u => u.id == params[0]);
             return [[user || null]];
        }
        if (sql.includes('SELECT id, firstName, lastName, email, phone, role, gender, isVerified, rating, profilePicture FROM users WHERE id = ?')) {
             const user = this.users.find(u => u.id == params[0]);
             return [[user || null]];
        }
        if (sql.includes('INSERT INTO users')) {
            const newUser = {
                id: this.idCounter++,
                firstName: params[0],
                lastName: params[1],
                email: params[2],
                phone: params[3],
                passwordHash: params[4],
                role: params[5],
                gender: params[6],
                isVerified: false,
                rating: 5.0
            };
            this.users.push(newUser);
            return [{ insertId: newUser.id }];
        }
        if (sql.includes('INSERT INTO vehicles')) {
            const newVehicle = { id: this.idCounter++, driverId: params[0], make: params[1], model: params[2], plateNumber: params[3], vehicleTier: params[4], vehicleType: params[5], isEcoFriendly: params[6] };
            this.vehicles.push(newVehicle);
            return [{ insertId: newVehicle.id }];
        }
        if (sql.includes('INSERT INTO promo_codes')) {
            const newPromo = { id: this.idCounter++, code: params[0], discountPercentage: params[1], isActive: true, createdAt: new Date() };
            this.promo_codes.push(newPromo);
            return [{ insertId: newPromo.id }];
        }
        if (sql.includes('SELECT * FROM promo_codes WHERE code = ?')) {
            return [this.promo_codes.filter(p => p.code === params[0])];
        }
        if (sql.includes('SELECT * FROM promo_codes ORDER BY createdAt DESC')) {
            return [this.promo_codes];
        }
        if (sql.includes('UPDATE promo_codes SET isActive')) {
            const promo = this.promo_codes.find(p => p.id == params[1]);
            if (promo) promo.isActive = params[0];
            return [{}];
        }

        if (sql.includes('INSERT INTO ride_requests')) {
            const newRide = { id: this.idCounter++, passengerId: params[0], pickupLat: params[1], pickupLng: params[2], pickupAddress: params[3], dropoffLat: params[4], dropoffLng: params[5], dropoffAddress: params[6], proposedFare: params[7], status: 'pending', serviceType: params[8], requestedVehicleType: params[9], isFemaleOnly: params[10], isEcoFriendly: params[11], isPool: params[12], boardingOTP: params[13] || '1234', promoCode: params[14] || null, createdAt: new Date() };
            this.ride_requests.push(newRide);
            return [{ insertId: newRide.id }];
        }
        if (sql.includes('UPDATE ride_requests SET rating')) {
            const ride = this.ride_requests.find(r => r.id == params[2]);
            if (ride) { ride.rating = params[0]; ride.review_text = params[1]; }
            return [{}];
        }
        if (sql.includes('UPDATE ride_requests SET dispute_status')) {
            const ride = this.ride_requests.find(r => r.id == params[3]);
            if (ride) { ride.dispute_status = params[0]; ride.dispute_reason = params[1]; ride.dispute_details = params[2]; }
            return [{}];
        }
        if (sql.includes('UPDATE ride_requests SET status = "completed"')) {
            const ride = this.ride_requests.find(r => r.id == params[0]);
            if (ride) { ride.status = 'completed'; }
            return [{}];
        }
        if (sql.includes('SELECT * FROM ride_requests WHERE passengerId = ? AND status = ?')) {
            return [this.ride_requests.filter(r => r.passengerId === params[0] && r.status === params[1])];
        }
        if (sql.includes('SELECT * FROM ride_requests WHERE driverId = ? AND status = ?')) {
            return [this.ride_requests.filter(r => r.driverId === params[0] && r.status === params[1])];
        }
        if (sql.includes('SELECT * FROM ride_requests WHERE status = ? ORDER BY createdAt DESC')) {
            return [this.ride_requests.filter(r => r.status === params[0])];
        }
        if (sql.includes('SELECT * FROM ride_requests WHERE passengerId = ? ORDER BY createdAt DESC')) {
            return [this.ride_requests.filter(r => r.passengerId === params[0])];
        }
        if (sql.includes('UPDATE ride_requests SET status = \'accepted\', driverId = ? WHERE id = ?')) {
            const ride = this.ride_requests.find(r => r.id == params[1]);
            if (ride) { 
                ride.status = 'accepted'; 
                ride.driverId = params[0];
            }
            return [{}];
        }
        if (sql.includes('INSERT INTO bids')) {
            const newBid = { id: this.idCounter++, rideRequestId: params[0], driverId: params[1], bidAmount: params[2], status: 'pending', createdAt: new Date() };
            this.bids.push(newBid);
            return [{ insertId: newBid.id }];
        }
        if (sql.includes('FROM bids b') && sql.includes('JOIN users u ON b.driverId = u.id')) {
            // SELECT b.id, b.rideRequestId as rideId, b.driverId, b.bidAmount as proposedFare, b.status, u.firstName, u.lastName, u.rating, u.gender FROM bids b JOIN users u ON b.driverId = u.id WHERE b.rideRequestId = ? AND b.status = 'pending' ORDER BY b.createdAt DESC
            const rideId = params[0];
            const rideBids = this.bids.filter(b => b.rideRequestId == rideId && b.status === 'pending');
            const result = rideBids.map(b => {
                const driver = this.users.find(u => u.id == b.driverId) || {};
                return {
                    id: b.id,
                    rideId: b.rideRequestId,
                    driverId: b.driverId,
                    proposedFare: b.bidAmount,
                    status: b.status,
                    firstName: driver.firstName,
                    lastName: driver.lastName,
                    rating: driver.rating,
                    gender: driver.gender
                };
            }).sort((a, b) => b.id - a.id); // Simulate descending by id/createdAt
            return [result];
        }
        if (sql.includes('SELECT * FROM vehicles WHERE driverId = ?')) {
            return [this.vehicles.filter(v => v.driverId === params[0])];
        }
        
        if (sql.includes('SELECT COUNT(*) as count FROM users WHERE role = "driver"')) {
            return [[{ count: this.users.filter(u => u.role === 'driver').length }]];
        }
        if (sql.includes('SELECT COUNT(*) as count FROM users')) {
            return [[{ count: this.users.length }]];
        }
        if (sql.includes('SELECT COUNT(*) as count FROM ride_requests WHERE status = "completed"')) {
            return [[{ count: this.ride_requests.filter(r => r.status === 'completed').length }]];
        }
        if (sql.includes('SELECT SUM(proposedFare * 0.15) as total FROM ride_requests WHERE status = "completed"')) {
            const sum = this.ride_requests.filter(r => r.status === 'completed').reduce((acc, curr) => acc + (curr.proposedFare * 0.15), 0);
            return [[{ total: sum }]];
        }
        if (sql.includes('SELECT * FROM users WHERE role = "driver" AND isVerified = false')) {
            return [this.users.filter(u => u.role === 'driver' && u.isVerified === false)];
        }
        if (sql.includes('UPDATE users SET isVerified = true WHERE id = ?')) {
            const user = this.users.find(u => u.id == params[0]);
            if (user) user.isVerified = true;
            return [{}];
        }
        if (sql.includes('UPDATE users SET firstName = ?, lastName = ?, phone = ?')) {
            const user = this.users.find(u => u.id == params[params.length - 1]);
            if (user) {
                 user.firstName = params[0];
                 user.lastName = params[1];
                 user.phone = params[2];
                 if (params.length === 5) {
                     user.profilePicture = params[3];
                 }
            }
            return [{}];
        }
        
        return [[]]; // Default empty result
    }
}

const mockStore = new MockStore();

export async function query(sql: string, params: any[] = []): Promise<any> {
    if (pool) {
        return pool.execute(sql, params);
    } else {
        return mockStore.query(sql, params);
    }
}
