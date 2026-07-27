import 'dotenv/config';
import mysql from 'mysql2/promise';

const pool = mysql.createPool({
    host: "localhost",
    user: "root",       // Default XAMPP username
    password: "",       // Default XAMPP password is empty
    database: "farego_db", // Your actual phpMyAdmin database name
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0
});
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
            const newRide = { 
                id: this.idCounter++, 
                passengerId: params[0],
                passengerName: params[1], 
                pickupLat: params[2], 
                pickupLng: params[3], 
                pickupAddress: params[4], 
                dropoffLat: params[5], 
                dropoffLng: params[6], 
                dropoffAddress: params[7], 
                proposedFare: params[8], 
                status: 'pending', 
                serviceType: params[9], 
                requestedVehicleType: params[10], 
                isFemaleOnly: params[11], 
                isEcoFriendly: params[12], 
                isPool: params[13], 
                boardingOTP: params[14] || '1234', 
                promoCode: params[15] || null, 
                createdAt: new Date() 
            };
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
        if (sql.includes("driverId = ? AND status IN ('accepted', 'in_progress', 'heading_to_pickup', 'arrived')")) {
            return [this.ride_requests.filter(r => r.driverId === params[0] && ['accepted', 'in_progress', 'heading_to_pickup', 'arrived'].includes(r.status)).sort((a,b) => b.id - a.id)];
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
        if (sql.includes("UPDATE ride_requests SET status = 'accepted'")) {
            const rideId = params[params.length - 1];
            const ride = this.ride_requests.find(r => r.id == rideId);
            if (ride) { 
                ride.status = 'accepted'; 
                ride.driverId = params[0];
                if (sql.includes('proposedFare')) {
                    ride.proposedFare = params[1];
                }
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
        if (sql.includes('SELECT * FROM bids WHERE rideRequestId = ? AND driverId = ?')) {
            const bidsForRide = this.bids.filter(b => b.rideRequestId == params[0] && b.driverId == params[1]);
            return [bidsForRide.sort((a,b) => b.id - a.id)];
        }
        if (sql.includes('SELECT * FROM ride_requests WHERE id = ?')) {
            return [this.ride_requests.filter(r => r.id == params[0])];
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

// Auto-migrate tables for local mysql
export async function initializeDatabase() {
    if (!pool) return;
    try {
        console.log('Checking database schema...');
        // Add passengerName if missing
        try {
            await pool.query("ALTER TABLE ride_requests ADD COLUMN passengerName VARCHAR(255) DEFAULT 'Passenger'");
            console.log('Added passengerName to ride_requests');
        } catch (e: any) {
             // Ignored if column already exists (Error code ER_DUP_FIELDNAME)
        }
        
        try {
            await pool.query("ALTER TABLE bids ADD COLUMN time INT DEFAULT 0");
            console.log('Added time to bids');
        } catch (e: any) {}
        
        try {
            await pool.query("ALTER TABLE bids ADD COLUMN distance VARCHAR(50) DEFAULT '0km'");
            console.log('Added distance to bids');
        } catch (e: any) {}
        
    } catch (e) {
        console.error('Migration checks failed', e);
    }
}
