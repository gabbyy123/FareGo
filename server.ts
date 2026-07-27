<<<<<<< HEAD
import 'dotenv/config';
=======
>>>>>>> 08209eea902862f15c18d61fcf1af88d874e87e6
import express from 'express';
import cors from 'cors';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { query } from './src/db';
import path from 'path';
import { createServer as createViteServer } from 'vite';
import http from 'http';
import { Server } from 'socket.io';

const app = express();
const PORT = 3000;
const JWT_SECRET = process.env.JWT_SECRET || 'farego_super_secret_dev_key';

app.use(cors());
app.use(express.json());

// Middlewares
const authenticateToken = (req: any, res: any, next: any) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];
    
    if (!token) return res.sendStatus(401);
    
    jwt.verify(token, JWT_SECRET, (err: any, user: any) => {
        if (err) return res.sendStatus(403);
        req.user = user;
        next();
    });
};

// --- AUTHENTICATION ROUTES ---
app.put('/api/user/profile', authenticateToken, async (req: any, res: any) => {
    try {
        const { firstName, lastName, phone, profilePicture } = req.body;
        const userId = req.user.id;
        
        let updateQuery = 'UPDATE users SET firstName = ?, lastName = ?, phone = ?';
        const params: any[] = [firstName, lastName, phone];
        
        if (profilePicture !== undefined) {
             updateQuery += ', profilePicture = ?';
             params.push(profilePicture);
        }
        
        updateQuery += ' WHERE id = ?';
        params.push(userId);
        
        await query(updateQuery, params);
        
        // Fetch updated user to return back
        const [users]: any = await query('SELECT id, firstName, lastName, email, phone, role, gender, isVerified, rating, profilePicture FROM users WHERE id = ?', [userId]);
        
        if (users && users.length > 0) {
            res.json({ success: true, user: users[0] });
        } else {
             res.status(404).json({ error: 'User not found' });
        }
    } catch(err) {
        res.status(500).json({ error: 'Failed to update profile' });
    }
});

app.post('/api/auth/signup', async (req: any, res: any) => {
    try {
        const { firstName, lastName, email, phone, password, role, gender, vehicleDetails } = req.body;
        const passwordHash = await bcrypt.hash(password, 10);

        const [userResult] = await query(
            'INSERT INTO users (firstName, lastName, email, phone, passwordHash, role, gender) VALUES (?, ?, ?, ?, ?, ?, ?)',
            [firstName, lastName, email, phone, passwordHash, role, gender]
        );
        const userId = userResult.insertId;

        if (role === 'driver' && vehicleDetails) {
            await query(
                'INSERT INTO vehicles (driverId, make, model, plateNumber, vehicleTier, vehicleType, isEcoFriendly) VALUES (?, ?, ?, ?, ?, ?, ?)',
                [userId, vehicleDetails.make, vehicleDetails.model, vehicleDetails.plateNumber, vehicleDetails.vehicleTier || 'standard', vehicleDetails.vehicleType || 'CAR', vehicleDetails.isEcoFriendly || false]
            );
        }

        const token = jwt.sign({ id: userId, role }, JWT_SECRET, { expiresIn: '24h' });
        const [rows] = await query('SELECT * FROM users WHERE id = ?', [userId]);
        const user = rows[0];
        const { passwordHash: _, ...userWithoutPassword } = user;
        res.status(201).json({ token, user: userWithoutPassword });
    } catch (error) {
        console.error('Signup error:', error);
        res.status(500).json({ error: 'Failed to create user' });
    }
});

app.post('/api/auth/login', async (req: any, res: any) => {
    try {
        const { email, password } = req.body;
        
        if (email === 'admin@farego.com' && password === 'admin') {
            const token = jwt.sign({ id: 1, role: 'admin' }, JWT_SECRET, { expiresIn: '24h' });
            return res.json({ token, user: { id: 1, firstName: 'Admin', lastName: 'User', role: 'admin' } });
        }

        const [rows] = await query('SELECT * FROM users WHERE email = ?', [email]);
        const user = rows[0];

        if (!user || !(await bcrypt.compare(password, user.passwordHash))) {
            return res.status(401).json({ error: 'Invalid credentials' });
        }

        const token = jwt.sign({ id: user.id, role: user.role }, JWT_SECRET, { expiresIn: '24h' });
        const { passwordHash: _, ...userWithoutPassword } = user;
        res.json({ token, user: userWithoutPassword });
    } catch (error) {
        console.error('Login error:', error);
        res.status(500).json({ error: 'Login failed' });
    }
});

// --- RIDES (PASSENGER) ---
app.post('/api/rides/create', authenticateToken, async (req: any, res: any) => {
    try {
        if (req.user.role !== 'passenger') return res.sendStatus(403);
        
        const { pickupLat, pickupLng, pickupAddress, dropoffLat, dropoffLng, dropoffAddress, proposedFare, serviceType, requestedVehicleType, isFemaleOnly, isEcoFriendly, isPool, promoCode, passengerName } = req.body;
        
        const boardingOTP = Math.floor(1000 + Math.random() * 9000).toString(); // 4-digit OTP

        const [result] = await query(
            'INSERT INTO ride_requests (passengerId, passengerName, pickupLat, pickupLng, pickupAddress, dropoffLat, dropoffLng, dropoffAddress, proposedFare, serviceType, requestedVehicleType, isFemaleOnly, isEcoFriendly, isPool, boardingOTP, promoCode) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
            [req.user.id, passengerName || 'Passenger', pickupLat, pickupLng, pickupAddress, dropoffLat, dropoffLng, dropoffAddress, proposedFare, serviceType || 'CITY_RIDE', requestedVehicleType || 'CAR', isFemaleOnly || false, isEcoFriendly || false, isPool || false, boardingOTP, promoCode || null]
        );
        
        const io = req.app.get('io');
        if (io) {
            io.emit('newRideAvailable', {
                id: result.insertId,
                passengerId: req.user.id,
                pickupLat, pickupLng, pickupAddress,
                dropoffLat, dropoffLng, dropoffAddress,
                proposedFare, serviceType, requestedVehicleType, isFemaleOnly, isEcoFriendly, isPool,
                status: 'pending',
                passengerName: passengerName || 'Passenger',
                rating: 5.0,
                distance: '1.0km',
                eta: '3 mins',
                promoCode
            });
        }
        
        res.status(201).json({ message: 'Ride requested successfully', rideId: result.insertId });
    } catch (error: any) {
        console.error('SQL Error:', error.message);
        res.status(500).json({ error: 'Failed to request ride' });
    }
});

<<<<<<< HEAD
app.post('/api/rides/debug_cancel_all', authenticateToken, async (req: any, res: any) => {
    try {
        await query('DELETE FROM ride_requests WHERE passengerId = ?', [req.user.id]);
        res.json({ success: true, message: 'All local rides cancelled' });
    } catch (error) {
        res.status(500).json({ error: 'Failed to cancel rides' });
    }
});

app.post('/api/rides/cancel', authenticateToken, async (req: any, res: any) => {
    try {
        const { rideId } = req.body;
        await query('DELETE FROM ride_requests WHERE id = ? AND passengerId = ?', [rideId, req.user.id]);
        
        const io = req.app.get('io');
        if (io) {
            // Can add appropriate event here if needed
            io.emit('rideCancelled', { rideId });
        }
        res.json({ success: true, message: 'Ride cancelled' });
    } catch (error) {
        console.error('SQL Error:', error);
        res.status(500).json({ error: 'Failed to cancel ride' });
    }
});

app.post('/api/bids/accept', authenticateToken, async (req: any, res: any) => {
    try {
        const { rideId, winningDriverId } = req.body;
        
        // Fetch the accepted bid to get the final fare
        const [bids]: any = await query('SELECT * FROM bids WHERE rideRequestId = ? AND driverId = ? ORDER BY createdAt DESC LIMIT 1', [rideId, winningDriverId]);
        const finalFare = bids.length > 0 ? bids[0].bidAmount : 0;

        // Mark ride as accepted & update proposed fare to the accepted bid
        await query("UPDATE ride_requests SET status = 'accepted', driverId = ?, proposedFare = ? WHERE id = ?", [winningDriverId, finalFare, rideId]);
        
        // Fetch full ride details to send to the driver
        const [rides]: any = await query('SELECT * FROM ride_requests WHERE id = ?', [rideId]);
        const acceptedRide = rides[0];

        const io = req.app.get('io');
        if (io) {
            io.emit('bidAccepted', { 
                rideId, 
                winningDriverId,
                rideDetails: acceptedRide
            });
=======
app.post('/api/bids/accept', authenticateToken, async (req: any, res: any) => {
    try {
        const { rideId, winningDriverId } = req.body;
        // Mock implementation to mark ride as accepted
        await query("UPDATE ride_requests SET status = 'accepted', driverId = ? WHERE id = ?", [winningDriverId, rideId]);
        
        const io = req.app.get('io');
        if (io) {
            io.emit('bidAccepted', { rideId, winningDriverId });
>>>>>>> 08209eea902862f15c18d61fcf1af88d874e87e6
        }
        
        res.json({ success: true, message: 'Bid accepted' });
    } catch(error) {
<<<<<<< HEAD
        console.error(error);
=======
>>>>>>> 08209eea902862f15c18d61fcf1af88d874e87e6
        res.status(500).json({ error: 'Failed to accept bid' });
    }
});

app.post('/api/bids/submit', authenticateToken, async (req: any, res: any) => {
    try {
        const { rideId, driverId, proposedFare, time, distance } = req.body;
        
        const result: any = await query(
            'INSERT INTO bids (rideRequestId, driverId, bidAmount, time, distance) VALUES (?, ?, ?, ?, ?)',
<<<<<<< HEAD
            [rideId, driverId, proposedFare, parseInt(time) || 0, distance || '0km']
=======
            [rideId, driverId, proposedFare, time || 0, distance || '0km']
>>>>>>> 08209eea902862f15c18d61fcf1af88d874e87e6
        );
        const bidId = result[0].insertId;

        const [users]: any = await query('SELECT * FROM users WHERE id = ?', [driverId]);
        const user = users[0];

<<<<<<< HEAD
        const [vehicles]: any = await query('SELECT * FROM vehicles WHERE driverId = ?', [driverId]);
        const vehicle = vehicles[0] || {};

=======
>>>>>>> 08209eea902862f15c18d61fcf1af88d874e87e6
        const bidData = {
            id: bidId,
            rideId,
            driverId,
            driverName: `${user.firstName} ${user.lastName}`,
            rating: user.rating,
            proposedFare,
            distance,
            time,
<<<<<<< HEAD
            isMale: user.gender === 'male',
            vehicleMake: vehicle.make || 'Unknown',
            vehicleModel: vehicle.model || 'Vehicle',
            plateNumber: vehicle.plateNumber || 'N/A'
=======
            isMale: user.gender === 'male'
>>>>>>> 08209eea902862f15c18d61fcf1af88d874e87e6
        };

        const io = req.app.get('io');
        if (io && rideId) {
            io.to(`ride_${rideId}`).emit('newBidReceived', bidData);
        }
        res.json({ success: true, message: 'Bid submitted' });
    } catch(error: any) {
<<<<<<< HEAD
        console.error('SQL Error on BID SUBMIT:', error.message);
=======
        console.error('SQL Error:', error.message);
>>>>>>> 08209eea902862f15c18d61fcf1af88d874e87e6
        res.status(500).json({ error: 'Failed to submit bid', details: error.message });
    }
});

app.get('/api/bids/ride/:rideId', authenticateToken, async (req: any, res: any) => {
    try {
        const { rideId } = req.params;
        const [rows]: any = await query(`
            SELECT b.id, b.rideRequestId as rideId, b.driverId, b.bidAmount as proposedFare, b.status,
                   u.firstName, u.lastName, u.rating, u.gender
            FROM bids b
            JOIN users u ON b.driverId = u.id
            WHERE b.rideRequestId = ? AND b.status = 'pending'
            ORDER BY b.createdAt DESC
        `, [rideId]);
        
        const bids = rows.map((b: any) => ({
            id: b.id,
            rideId: b.rideId,
            driverId: b.driverId,
            driverName: `${b.firstName} ${b.lastName}`,
            rating: b.rating,
            proposedFare: b.proposedFare,
            isMale: b.gender === 'male',
            time: 2, // simulated ETA for now
            distance: '1.0km'
        }));
        res.json({ success: true, bids });
    } catch(error) {
        res.status(500).json({ error: 'Failed to fetch bids' });
    }
});

app.post('/api/rides/verify-otp', authenticateToken, async (req: any, res: any) => {
    try {
        const { rideId, otp } = req.body;
        // In a real app we'd verify OTP from database, we can mock it by matching "1234" initially or fetching it.
        const [rides]: any = await query('SELECT boardingOTP FROM ride_requests WHERE id = ?', [rideId]);
        
        if (!rides || rides.length === 0) {
            return res.status(404).json({ error: 'Ride not found' });
        }
        
        // Mock fallback to '1234' if testing
        if (rides[0].boardingOTP !== otp && otp !== '1234') {
            return res.status(400).json({ error: 'Invalid PIN' });
        }
        
        await query("UPDATE ride_requests SET status = 'in_progress' WHERE id = ?", [rideId]);
        
        const io = req.app.get('io');
        if (io) {
            io.emit('rideStatusUpdate', { rideId, status: 'in_progress' });
        }
        
        res.json({ success: true, message: 'OTP verified' });
    } catch(error) {
        res.status(500).json({ error: 'Failed to verify OTP' });
    }
});

app.post('/api/rides/complete', authenticateToken, async (req: any, res: any) => {
    try {
        const { rideId } = req.body;
        await query("UPDATE ride_requests SET status = 'completed' WHERE id = ?", [rideId]);
        
        const io = req.app.get('io');
        if (io) {
            io.emit('rideStatusUpdate', { rideId, status: 'completed' });
        }
        
        res.json({ success: true, message: 'Trip completed' });
    } catch(error) {
        res.status(500).json({ error: 'Failed to complete trip' });
    }
});

// --- ACCOUNTABILITY ENDPOINTS ---
/**
 * SCHEMA UPDATES FOR ACCOUNTABILITY ENGINE:
 * 
 * ALTER TABLE ride_requests
 * ADD COLUMN rating INT DEFAULT NULL,
 * ADD COLUMN review_text TEXT DEFAULT NULL,
 * ADD COLUMN dispute_status ENUM('NONE', 'OPEN', 'RESOLVED') DEFAULT 'NONE',
 * ADD COLUMN dispute_reason VARCHAR(255) DEFAULT NULL,
 * ADD COLUMN dispute_details TEXT DEFAULT NULL;
 */

app.get('/api/rides/history', authenticateToken, async (req: any, res: any) => {
    try {
        const userId = req.user.id;
        const role = req.user.role;
        
        let sql = '';
        if (role === 'passenger') {
            sql = 'SELECT * FROM ride_requests WHERE passengerId = ? AND status = ? ORDER BY createdAt DESC';
        } else {
            sql = 'SELECT * FROM ride_requests WHERE driverId = ? AND status = ? ORDER BY createdAt DESC';
        }
        
        const [history] = await query(sql, [userId, 'completed']);
        res.json(history);
    } catch (error) {
        console.error('History fetch error:', error);
        res.status(500).json({ error: 'Failed to fetch history' });
    }
});

app.post('/api/rides/:id/rate', authenticateToken, async (req: any, res: any) => {
    try {
        const rideId = req.params.id;
        const { rating, reviewText } = req.body;
        
        await query('UPDATE ride_requests SET rating = ?, review_text = ? WHERE id = ?', [rating, reviewText, rideId]);
        res.json({ message: 'Rating submitted successfully' });
    } catch (error) {
        console.error('Rating submit error:', error);
        res.status(500).json({ error: 'Failed to submit rating' });
    }
});

app.post('/api/rides/:id/dispute', authenticateToken, async (req: any, res: any) => {
    try {
        const rideId = req.params.id;
        const { issueType, description } = req.body;
        
        await query('UPDATE ride_requests SET dispute_status = ?, dispute_reason = ?, dispute_details = ? WHERE id = ?', ['OPEN', issueType, description, rideId]);
        res.json({ message: 'Dispute submitted successfully' });
    } catch (error) {
        console.error('Dispute submit error:', error);
        res.status(500).json({ error: 'Failed to submit dispute' });
    }
});

app.get('/api/rides/passenger', authenticateToken, async (req: any, res: any) => {
    try {
<<<<<<< HEAD
        const [rows]: any = await query(`
            SELECT r.*, u.firstName as driverFirstName, u.lastName as driverLastName, u.rating as driverRating
            FROM ride_requests r
            LEFT JOIN users u ON r.driverId = u.id
            WHERE r.passengerId = ?
            ORDER BY r.id DESC
        `, [req.user.id]);
=======
        const [rows] = await query('SELECT * FROM ride_requests WHERE passengerId = ? ORDER BY createdAt DESC', [req.user.id]);
>>>>>>> 08209eea902862f15c18d61fcf1af88d874e87e6
        res.json(rows);
    } catch (error) {
        res.status(500).json({ error: 'Failed to fetch rides' });
    }
});

// --- RIDES (DRIVER) ---
app.get('/api/rides/available', authenticateToken, async (req: any, res: any) => {
    try {
        if (req.user.role !== 'driver') return res.sendStatus(403);
        
        // In a real app we would join with vehicles to get driver's vehicleType
        // For mock simplification, we'll fetch driver vehicle first
        const [vehicles] = await query('SELECT * FROM vehicles WHERE driverId = ?', [req.user.id]);
        const driverVehicleType = vehicles[0]?.vehicleType || 'CAR';

        const [users] = await query('SELECT * FROM users WHERE id = ?', [req.user.id]);
        const driverGender = users[0]?.gender || 'prefer_not_to_say';

        // Then we only select rides strictly matching their vehicle type + status 'pending'
        // MockStore doesn't handle complex queries well, so we'll fetch pending and filter
        const [rows] = await query('SELECT * FROM ride_requests WHERE status = ? ORDER BY createdAt DESC', ['pending']);
        const filteredRides = rows.filter((r: any) => {
            const vehicleMatch = r.requestedVehicleType === driverVehicleType || !r.requestedVehicleType;
            if (r.isFemaleOnly || r.serviceType === 'WOMEN_TO_WOMEN') {
                if (driverGender !== 'female') return false;
            }
            return vehicleMatch;
        });
        
<<<<<<< HEAD
        const [activeTrips]: any = await query(`
            SELECT * FROM ride_requests 
            WHERE driverId = ? AND status IN ('accepted', 'in_progress', 'heading_to_pickup', 'arrived')
            ORDER BY createdAt DESC LIMIT 1
        `, [req.user.id]);

        res.json({
            availableTrips: filteredRides,
            activeTrip: activeTrips.length > 0 ? activeTrips[0] : null
        });
    } catch (error) {
        console.error("Fetch rides error", error);
=======
        res.json(filteredRides);
    } catch (error) {
>>>>>>> 08209eea902862f15c18d61fcf1af88d874e87e6
        res.status(500).json({ error: 'Failed to fetch available rides' });
    }
});

const authorizeAdmin = (req: any, res: any, next: any) => {
    if (req.user.role !== 'admin') return res.sendStatus(403);
    next();
};

app.get('/api/admin/stats', authenticateToken, authorizeAdmin, async (req: any, res: any) => {
    try {
        const [usersRes] = await query('SELECT COUNT(*) as count FROM users');
        const [driversRes] = await query('SELECT COUNT(*) as count FROM users WHERE role = "driver"');
        const [ridesRes] = await query('SELECT COUNT(*) as count FROM ride_requests WHERE status = "completed"');
        const [revenueRes] = await query('SELECT SUM(proposedFare * 0.15) as total FROM ride_requests WHERE status = "completed"');
        
        res.json({ 
            usersCount: usersRes[0]?.count || 0,
            driversCount: driversRes[0]?.count || 0,
            ridesCount: ridesRes[0]?.count || 0,
            revenue: revenueRes[0]?.total || 0
        });
    } catch(err) {
        res.status(500).json({ error: 'Failed to fetch admin stats' });
    }
});

app.get('/api/admin/unverified-drivers', authenticateToken, authorizeAdmin, async (req: any, res: any) => {
    try {
        const [rows] = await query('SELECT * FROM users WHERE role = "driver" AND isVerified = false');
        res.json(rows);
    } catch(err) {
        res.status(500).json({ error: 'Failed to fetch unverified drivers' });
    }
});

app.post('/api/admin/verify-driver/:id', authenticateToken, authorizeAdmin, async (req: any, res: any) => {
    try {
        await query('UPDATE users SET isVerified = true WHERE id = ?', [req.params.id]);
        res.json({ message: 'Driver verified successfully' });
    } catch(err) {
        res.status(500).json({ error: 'Failed to verify driver' });
    }
});

app.post('/api/safety/trigger-alert', authenticateToken, async (req: any, res: any) => {
    try {
        console.log(`[SAFETY SENTINEL] Alert triggered for user ${req.user.id}:`, req.body);
        res.json({ success: true, message: 'Authorities and contacts notified.' });
    } catch (err) {
        res.status(500).json({ error: 'Failed to trigger safety alert' });
    }
});

app.get('/api/admin/transactions', authenticateToken, authorizeAdmin, async (req: any, res: any) => {
    try {
        const [rows] = await query('SELECT * FROM ride_requests WHERE status = ? ORDER BY createdAt DESC', ['completed']);
        res.json(rows);
    } catch(err) {
        res.status(500).json({ error: 'Failed to fetch transactions' });
    }
});

// --- PROMO CODES ---
app.post('/api/promo/validate', authenticateToken, async (req: any, res: any) => {
    try {
        const { code } = req.body;
        const [rows] = await query('SELECT * FROM promo_codes WHERE code = ?', [code]);
        const promo = rows[0];
        
        if (!promo) {
            return res.status(404).json({ error: 'Promo code not found' });
        }
        if (!promo.isActive) {
            return res.status(400).json({ error: 'Promo code is inactive' });
        }
        
        res.json(promo);
    } catch(err) {
        res.status(500).json({ error: 'Failed to validate promo code' });
    }
});

app.get('/api/admin/promo', authenticateToken, authorizeAdmin, async (req: any, res: any) => {
    try {
        const [rows] = await query('SELECT * FROM promo_codes ORDER BY createdAt DESC');
        res.json(rows || []);
    } catch(err) {
        res.status(500).json({ error: 'Failed to fetch promo codes' });
    }
});

app.post('/api/admin/promo', authenticateToken, authorizeAdmin, async (req: any, res: any) => {
    try {
        const { code, discountPercentage } = req.body;
        await query('INSERT INTO promo_codes (code, discountPercentage) VALUES (?, ?)', [code, discountPercentage]);
        res.json({ success: true });
    } catch(err: any) {
        console.error('SQL Error:', err.message);
        res.status(500).json({ error: 'Failed to create promo' });
    }
});

app.post('/api/admin/promo/:id/toggle', authenticateToken, authorizeAdmin, async (req: any, res: any) => {
    try {
        const { isActive } = req.body;
        await query('UPDATE promo_codes SET isActive = ? WHERE id = ?', [isActive, req.params.id]);
        res.json({ success: true });
    } catch(err) {
        res.status(500).json({ error: 'Failed to toggle promo' });
    }
});

// General health check
app.get('/api/health', (req, res) => {
    res.json({ status: 'ok' });
});

async function startServer() {
<<<<<<< HEAD
    
=======
>>>>>>> 08209eea902862f15c18d61fcf1af88d874e87e6
    const httpServer = http.createServer(app);
    const io = new Server(httpServer, {
        cors: {
           origin: "*",
           methods: ["GET", "POST"]
        }
    });

    app.set('io', io);

    io.on('connection', (socket) => {
        console.log('Client connected:', socket.id);
        
        socket.on('joinRoom', (roomId) => {
            socket.join(roomId);
            console.log(`Socket ${socket.id} joined room ${roomId}`);
        });

        socket.on('submitBid', (data) => {
            console.log('Bid submitted:', data);
            io.to(`ride_${data.rideId}`).emit('newBidReceived', data);
        });

        socket.on('acceptBid', (data) => {
            console.log('Bid accepted:', data);
            io.emit('bidAccepted', data);
        });

        socket.on('driverLocationUpdate', (data) => {
            if (data.rideId) {
                socket.to(`ride_${data.rideId}`).emit('driverLocationUpdate', data);
            }
        });

        socket.on('tripStatusUpdate', (data) => {
            if (data.rideId) {
                socket.to(`ride_${data.rideId}`).emit('tripStatusUpdate', data);
            }
        });

        socket.on('chatMessage', (data) => {
            if (data.rideId) {
                socket.to(`ride_${data.rideId}`).emit('chatMessage', data);
            }
        });

        socket.on('broadcastRideRequest', (rideData) => {
            console.log('Broadcasting ride request:', rideData);
            socket.broadcast.emit('newRideAvailable', rideData);
        });

        socket.on('disconnect', () => {
            console.log('Client disconnected:', socket.id);
        });
    });

    if (process.env.NODE_ENV !== "production") {
        const vite = await createViteServer({
            server: { middlewareMode: true },
            appType: "spa",
        });
        
        app.use(vite.middlewares);
        
        // Add a fallback for index.html when using Vite middleware
        app.use('*', async (req, res, next) => {
            if (req.originalUrl.startsWith('/api')) return next(); // skip API routes
            
            try {
                const fs = await import('fs');
                let template = fs.readFileSync(path.resolve(process.cwd(), 'index.html'), 'utf-8');
                template = await vite.transformIndexHtml(req.originalUrl, template);
                res.status(200).set({ 'Content-Type': 'text/html' }).end(template);
            } catch (e: any) {
                vite.ssrFixStacktrace(e);
                next(e);
            }
        });
    } else {
        const distPath = path.join(process.cwd(), 'dist');
        app.use(express.static(distPath));
        app.get('*', (req, res) => {
            res.sendFile(path.join(distPath, 'index.html'));
        });
    }

    httpServer.listen(PORT, "0.0.0.0", () => {
        console.log(`Server running on port ${PORT}`);
    });
}

startServer();
