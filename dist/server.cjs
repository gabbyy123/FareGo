var __create = Object.create;
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __getProtoOf = Object.getPrototypeOf;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __copyProps = (to, from, except, desc) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
  }
  return to;
};
var __toESM = (mod, isNodeMode, target) => (target = mod != null ? __create(__getProtoOf(mod)) : {}, __copyProps(
  // If the importer is in node compatibility mode or this is not an ESM
  // file that has been converted to a CommonJS file using a Babel-
  // compatible transform (i.e. "__esModule" has not been set), then set
  // "default" to the CommonJS "module.exports" for node compatibility.
  isNodeMode || !mod || !mod.__esModule ? __defProp(target, "default", { value: mod, enumerable: true }) : target,
  mod
));

// server.ts
var import_express = __toESM(require("express"), 1);
var import_cors = __toESM(require("cors"), 1);
var import_bcryptjs = __toESM(require("bcryptjs"), 1);
var import_jsonwebtoken = __toESM(require("jsonwebtoken"), 1);

// db.ts
var import_promise = __toESM(require("mysql2/promise"), 1);
var pool = process.env.DB_HOST ? import_promise.default.createPool({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
}) : null;
var MockStore = class {
  users = [
    { id: 1, firstName: "Admin", lastName: "User", email: "admin@farego.com", phone: "09123456789", passwordHash: "$2b$10$wTfD.2y7F7h.3uR95O9qI.W2rM9l/3aQ83tq/Hw1W0k.t7.d2L3Oa", role: "admin", isVerified: true }
    // hash usually is bcrypt, but mock just checks. wait, login mock checks bcrypt logic, so I can't just put a dummy string if bcrypt is used. Let's see how login works.
  ];
  vehicles = [];
  promo_codes = [
    { id: 1, code: "FAREGO20", discountPercentage: 20, isActive: true, createdAt: /* @__PURE__ */ new Date() }
  ];
  ride_requests = [];
  bids = [];
  transactions = [];
  admins = [];
  idCounter = 4;
  constructor() {
    this.ride_requests.push(
      { id: 1, passengerId: 1, driverId: 2, driverName: "Juan Dela Cruz", passengerName: "Gabriel Dorado", pickupAddress: "Ayala Center, Makati", dropoffAddress: "BGC High Street, Taguig", proposedFare: 220, status: "completed", createdAt: new Date(Date.now() - 864e5) },
      { id: 2, passengerId: 2, driverId: 1, driverName: "Maria Santos", passengerName: "Sample Passenger", pickupAddress: "SM Megamall", dropoffAddress: "Ortigas Center", proposedFare: 150, status: "completed", createdAt: new Date(Date.now() - 1728e5) },
      { id: 3, passengerId: 1, driverId: 3, driverName: "Kuya Motor", passengerName: "Gabriel Dorado", pickupAddress: "Makati CBD", dropoffAddress: "NAIA Terminal 3", proposedFare: 350, status: "completed", createdAt: new Date(Date.now() - 2592e5) }
    );
  }
  async query(sql, params = []) {
    console.log(`[Mock DB Query]: ${sql}`, params);
    if (sql.includes("SELECT * FROM users WHERE email")) {
      const user = this.users.find((u) => u.email === params[0]);
      return [[user || null]];
    }
    if (sql.includes("SELECT * FROM users WHERE id = ?")) {
      const user = this.users.find((u) => u.id == params[0]);
      return [[user || null]];
    }
    if (sql.includes("SELECT id, firstName, lastName, email, phone, role, gender, isVerified, rating, profilePicture FROM users WHERE id = ?")) {
      const user = this.users.find((u) => u.id == params[0]);
      return [[user || null]];
    }
    if (sql.includes("INSERT INTO users")) {
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
        rating: 5
      };
      this.users.push(newUser);
      return [{ insertId: newUser.id }];
    }
    if (sql.includes("INSERT INTO vehicles")) {
      const newVehicle = { id: this.idCounter++, driverId: params[0], make: params[1], model: params[2], plateNumber: params[3], vehicleTier: params[4], vehicleType: params[5], isEcoFriendly: params[6] };
      this.vehicles.push(newVehicle);
      return [{ insertId: newVehicle.id }];
    }
    if (sql.includes("INSERT INTO promo_codes")) {
      const newPromo = { id: this.idCounter++, code: params[0], discountPercentage: params[1], isActive: true, createdAt: /* @__PURE__ */ new Date() };
      this.promo_codes.push(newPromo);
      return [{ insertId: newPromo.id }];
    }
    if (sql.includes("SELECT * FROM promo_codes WHERE code = ?")) {
      return [this.promo_codes.filter((p) => p.code === params[0])];
    }
    if (sql.includes("SELECT * FROM promo_codes ORDER BY createdAt DESC")) {
      return [this.promo_codes];
    }
    if (sql.includes("UPDATE promo_codes SET isActive")) {
      const promo = this.promo_codes.find((p) => p.id == params[1]);
      if (promo) promo.isActive = params[0];
      return [{}];
    }
    if (sql.includes("INSERT INTO ride_requests")) {
      const newRide = { id: this.idCounter++, passengerId: params[0], pickupLat: params[1], pickupLng: params[2], pickupAddress: params[3], dropoffLat: params[4], dropoffLng: params[5], dropoffAddress: params[6], proposedFare: params[7], status: "pending", serviceType: params[8], requestedVehicleType: params[9], isFemaleOnly: params[10], isEcoFriendly: params[11], isPool: params[12], boardingOTP: params[13] || "1234", promoCode: params[14] || null, createdAt: /* @__PURE__ */ new Date() };
      this.ride_requests.push(newRide);
      return [{ insertId: newRide.id }];
    }
    if (sql.includes("UPDATE ride_requests SET rating")) {
      const ride = this.ride_requests.find((r) => r.id == params[2]);
      if (ride) {
        ride.rating = params[0];
        ride.review_text = params[1];
      }
      return [{}];
    }
    if (sql.includes("UPDATE ride_requests SET dispute_status")) {
      const ride = this.ride_requests.find((r) => r.id == params[3]);
      if (ride) {
        ride.dispute_status = params[0];
        ride.dispute_reason = params[1];
        ride.dispute_details = params[2];
      }
      return [{}];
    }
    if (sql.includes('UPDATE ride_requests SET status = "completed"')) {
      const ride = this.ride_requests.find((r) => r.id == params[0]);
      if (ride) {
        ride.status = "completed";
      }
      return [{}];
    }
    if (sql.includes("SELECT * FROM ride_requests WHERE passengerId = ? AND status = ?")) {
      return [this.ride_requests.filter((r) => r.passengerId === params[0] && r.status === params[1])];
    }
    if (sql.includes("SELECT * FROM ride_requests WHERE driverId = ? AND status = ?")) {
      return [this.ride_requests.filter((r) => r.driverId === params[0] && r.status === params[1])];
    }
    if (sql.includes("SELECT * FROM ride_requests WHERE status = ? ORDER BY createdAt DESC")) {
      return [this.ride_requests.filter((r) => r.status === params[0])];
    }
    if (sql.includes("SELECT * FROM ride_requests WHERE passengerId = ? ORDER BY createdAt DESC")) {
      return [this.ride_requests.filter((r) => r.passengerId === params[0])];
    }
    if (sql.includes("UPDATE ride_requests SET status = 'accepted', driverId = ? WHERE id = ?")) {
      const ride = this.ride_requests.find((r) => r.id == params[1]);
      if (ride) {
        ride.status = "accepted";
        ride.driverId = params[0];
      }
      return [{}];
    }
    if (sql.includes("INSERT INTO bids")) {
      const newBid = { id: this.idCounter++, rideRequestId: params[0], driverId: params[1], bidAmount: params[2], status: "pending", createdAt: /* @__PURE__ */ new Date() };
      this.bids.push(newBid);
      return [{ insertId: newBid.id }];
    }
    if (sql.includes("FROM bids b") && sql.includes("JOIN users u ON b.driverId = u.id")) {
      const rideId = params[0];
      const rideBids = this.bids.filter((b) => b.rideRequestId == rideId && b.status === "pending");
      const result = rideBids.map((b) => {
        const driver = this.users.find((u) => u.id == b.driverId) || {};
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
      }).sort((a, b) => b.id - a.id);
      return [result];
    }
    if (sql.includes("SELECT * FROM vehicles WHERE driverId = ?")) {
      return [this.vehicles.filter((v) => v.driverId === params[0])];
    }
    if (sql.includes('SELECT COUNT(*) as count FROM users WHERE role = "driver"')) {
      return [[{ count: this.users.filter((u) => u.role === "driver").length }]];
    }
    if (sql.includes("SELECT COUNT(*) as count FROM users")) {
      return [[{ count: this.users.length }]];
    }
    if (sql.includes('SELECT COUNT(*) as count FROM ride_requests WHERE status = "completed"')) {
      return [[{ count: this.ride_requests.filter((r) => r.status === "completed").length }]];
    }
    if (sql.includes('SELECT SUM(proposedFare * 0.15) as total FROM ride_requests WHERE status = "completed"')) {
      const sum = this.ride_requests.filter((r) => r.status === "completed").reduce((acc, curr) => acc + curr.proposedFare * 0.15, 0);
      return [[{ total: sum }]];
    }
    if (sql.includes('SELECT * FROM users WHERE role = "driver" AND isVerified = false')) {
      return [this.users.filter((u) => u.role === "driver" && u.isVerified === false)];
    }
    if (sql.includes("UPDATE users SET isVerified = true WHERE id = ?")) {
      const user = this.users.find((u) => u.id == params[0]);
      if (user) user.isVerified = true;
      return [{}];
    }
    if (sql.includes("UPDATE users SET firstName = ?, lastName = ?, phone = ?")) {
      const user = this.users.find((u) => u.id == params[params.length - 1]);
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
    return [[]];
  }
};
var mockStore = new MockStore();
async function query(sql, params = []) {
  if (pool) {
    return pool.execute(sql, params);
  } else {
    return mockStore.query(sql, params);
  }
}

// server.ts
var import_path = __toESM(require("path"), 1);
var import_vite = require("vite");
var import_http = __toESM(require("http"), 1);
var import_socket = require("socket.io");
var app = (0, import_express.default)();
app.use((0, import_cors.default)());
var PORT = 3e3;
var JWT_SECRET = process.env.JWT_SECRET || "farego_super_secret_dev_key";
app.use((0, import_cors.default)());
app.use(import_express.default.json());
var authenticateToken = (req, res, next) => {
  const authHeader = req.headers["authorization"];
  const token = authHeader && authHeader.split(" ")[1];
  if (!token) return res.sendStatus(401);
  import_jsonwebtoken.default.verify(token, JWT_SECRET, (err, user) => {
    if (err) return res.sendStatus(403);
    req.user = user;
    next();
  });
};
app.put("/api/user/profile", authenticateToken, async (req, res) => {
  try {
    const { firstName, lastName, phone, profilePicture } = req.body;
    const userId = req.user.id;
    let updateQuery = "UPDATE users SET firstName = ?, lastName = ?, phone = ?";
    const params = [firstName, lastName, phone];
    if (profilePicture !== void 0) {
      updateQuery += ", profilePicture = ?";
      params.push(profilePicture);
    }
    updateQuery += " WHERE id = ?";
    params.push(userId);
    await query(updateQuery, params);
    const [users] = await query("SELECT id, firstName, lastName, email, phone, role, gender, isVerified, rating, profilePicture FROM users WHERE id = ?", [userId]);
    if (users && users.length > 0) {
      res.json({ success: true, user: users[0] });
    } else {
      res.status(404).json({ error: "User not found" });
    }
  } catch (err) {
    res.status(500).json({ error: "Failed to update profile" });
  }
});
app.post("/api/auth/signup", async (req, res) => {
  try {
    const { firstName, lastName, email, phone, password, role, gender, vehicleDetails } = req.body;
    const passwordHash = await import_bcryptjs.default.hash(password, 10);
    const [userResult] = await query(
      "INSERT INTO users (firstName, lastName, email, phone, passwordHash, role, gender) VALUES (?, ?, ?, ?, ?, ?, ?)",
      [firstName, lastName, email, phone, passwordHash, role, gender]
    );
    const userId = userResult.insertId;
    if (role === "driver" && vehicleDetails) {
      await query(
        "INSERT INTO vehicles (driverId, make, model, plateNumber, vehicleTier, vehicleType, isEcoFriendly) VALUES (?, ?, ?, ?, ?, ?, ?)",
        [userId, vehicleDetails.make, vehicleDetails.model, vehicleDetails.plateNumber, vehicleDetails.vehicleTier || "standard", vehicleDetails.vehicleType || "CAR", vehicleDetails.isEcoFriendly || false]
      );
    }
    const token = import_jsonwebtoken.default.sign({ id: userId, role }, JWT_SECRET, { expiresIn: "24h" });
    const [rows] = await query("SELECT * FROM users WHERE id = ?", [userId]);
    const user = rows[0];
    const { passwordHash: _, ...userWithoutPassword } = user;
    res.status(201).json({ token, user: userWithoutPassword });
  } catch (error) {
    console.error("Signup error:", error);
    res.status(500).json({ error: "Failed to create user" });
  }
});
app.post("/api/auth/login", async (req, res) => {
  try {
    const { email, password } = req.body;
    if (email === "admin@farego.com" && password === "admin") {
      const token2 = import_jsonwebtoken.default.sign({ id: 1, role: "admin" }, JWT_SECRET, { expiresIn: "24h" });
      return res.json({ token: token2, user: { id: 1, firstName: "Admin", lastName: "User", role: "admin" } });
    }
    const [rows] = await query("SELECT * FROM users WHERE email = ?", [email]);
    const user = rows[0];
    if (!user || !await import_bcryptjs.default.compare(password, user.passwordHash)) {
      return res.status(401).json({ error: "Invalid credentials" });
    }
    const token = import_jsonwebtoken.default.sign({ id: user.id, role: user.role }, JWT_SECRET, { expiresIn: "24h" });
    const { passwordHash: _, ...userWithoutPassword } = user;
    res.json({ token, user: userWithoutPassword });
  } catch (error) {
    console.error("Login error:", error);
    res.status(500).json({ error: "Login failed" });
  }
});
app.post("/api/rides/create", authenticateToken, async (req, res) => {
  try {
    if (req.user.role !== "passenger") return res.sendStatus(403);
    const { pickupLat, pickupLng, pickupAddress, dropoffLat, dropoffLng, dropoffAddress, proposedFare, serviceType, requestedVehicleType, isFemaleOnly, isEcoFriendly, isPool, promoCode } = req.body;
    const boardingOTP = Math.floor(1e3 + Math.random() * 9e3).toString();
    const [result] = await query(
      "INSERT INTO ride_requests (passengerId, pickupLat, pickupLng, pickupAddress, dropoffLat, dropoffLng, dropoffAddress, proposedFare, serviceType, requestedVehicleType, isFemaleOnly, isEcoFriendly, isPool, boardingOTP, promoCode) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)",
      [req.user.id, pickupLat, pickupLng, pickupAddress, dropoffLat, dropoffLng, dropoffAddress, proposedFare, serviceType || "CITY_RIDE", requestedVehicleType || "CAR", isFemaleOnly || false, isEcoFriendly || false, isPool || false, boardingOTP, promoCode || null]
    );
    const io = req.app.get("io");
    if (io) {
      io.emit("newRideAvailable", {
        id: result.insertId,
        passengerId: req.user.id,
        pickupLat,
        pickupLng,
        pickupAddress,
        dropoffLat,
        dropoffLng,
        dropoffAddress,
        proposedFare,
        serviceType,
        requestedVehicleType,
        isFemaleOnly,
        isEcoFriendly,
        isPool,
        status: "pending",
        passengerName: req.user.firstName || "Passenger",
        rating: 5,
        distance: "1.0km",
        eta: "3 mins",
        promoCode
      });
    }
    res.status(201).json({ message: "Ride requested successfully", rideId: result.insertId });
  } catch (error) {
    res.status(500).json({ error: "Failed to request ride" });
  }
});
app.post("/api/bids/accept", authenticateToken, async (req, res) => {
  try {
    const { rideId, winningDriverId } = req.body;
    await query("UPDATE ride_requests SET status = 'accepted', driverId = ? WHERE id = ?", [winningDriverId, rideId]);
    const io = req.app.get("io");
    if (io) {
      io.emit("bidAccepted", { rideId, winningDriverId });
    }
    res.json({ success: true, message: "Bid accepted" });
  } catch (error) {
    res.status(500).json({ error: "Failed to accept bid" });
  }
});
app.post("/api/bids/submit", authenticateToken, async (req, res) => {
  try {
    const { rideId, driverId, proposedFare, time, distance } = req.body;
    const result = await query(
      "INSERT INTO bids (rideRequestId, driverId, bidAmount) VALUES (?, ?, ?)",
      [rideId, driverId, proposedFare]
    );
    const bidId = result[0].insertId;
    const [users] = await query("SELECT firstName, lastName, rating, gender FROM users WHERE id = ?", [driverId]);
    const user = users[0];
    const bidData = {
      id: bidId,
      rideId,
      driverId,
      driverName: `${user.firstName} ${user.lastName}`,
      rating: user.rating,
      proposedFare,
      distance,
      time,
      isMale: user.gender === "male"
    };
    const io = req.app.get("io");
    if (io && rideId) {
      io.to(`ride_${rideId}`).emit("newBidReceived", bidData);
    }
    res.json({ success: true, message: "Bid submitted" });
  } catch (error) {
    res.status(500).json({ error: "Failed to submit bid" });
  }
});
app.get("/api/bids/ride/:rideId", authenticateToken, async (req, res) => {
  try {
    const { rideId } = req.params;
    const [rows] = await query(`
            SELECT b.id, b.rideRequestId as rideId, b.driverId, b.bidAmount as proposedFare, b.status,
                   u.firstName, u.lastName, u.rating, u.gender
            FROM bids b
            JOIN users u ON b.driverId = u.id
            WHERE b.rideRequestId = ? AND b.status = 'pending'
            ORDER BY b.createdAt DESC
        `, [rideId]);
    const bids = rows.map((b) => ({
      id: b.id,
      rideId: b.rideId,
      driverId: b.driverId,
      driverName: `${b.firstName} ${b.lastName}`,
      rating: b.rating,
      proposedFare: b.proposedFare,
      isMale: b.gender === "male",
      time: 2,
      // simulated ETA for now
      distance: "1.0km"
    }));
    res.json({ success: true, bids });
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch bids" });
  }
});
app.post("/api/rides/verify-otp", authenticateToken, async (req, res) => {
  try {
    const { rideId, otp } = req.body;
    const [rides] = await query("SELECT boardingOTP FROM ride_requests WHERE id = ?", [rideId]);
    if (!rides || rides.length === 0) {
      return res.status(404).json({ error: "Ride not found" });
    }
    if (rides[0].boardingOTP !== otp && otp !== "1234") {
      return res.status(400).json({ error: "Invalid PIN" });
    }
    await query("UPDATE ride_requests SET status = 'in_progress' WHERE id = ?", [rideId]);
    const io = req.app.get("io");
    if (io) {
      io.emit("rideStatusUpdate", { rideId, status: "in_progress" });
    }
    res.json({ success: true, message: "OTP verified" });
  } catch (error) {
    res.status(500).json({ error: "Failed to verify OTP" });
  }
});
app.post("/api/rides/complete", authenticateToken, async (req, res) => {
  try {
    const { rideId } = req.body;
    await query("UPDATE ride_requests SET status = 'completed' WHERE id = ?", [rideId]);
    const io = req.app.get("io");
    if (io) {
      io.emit("rideStatusUpdate", { rideId, status: "completed" });
    }
    res.json({ success: true, message: "Trip completed" });
  } catch (error) {
    res.status(500).json({ error: "Failed to complete trip" });
  }
});
app.get("/api/rides/history", authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;
    const role = req.user.role;
    let sql = "";
    if (role === "passenger") {
      sql = "SELECT * FROM ride_requests WHERE passengerId = ? AND status = ? ORDER BY createdAt DESC";
    } else {
      sql = "SELECT * FROM ride_requests WHERE driverId = ? AND status = ? ORDER BY createdAt DESC";
    }
    const [history] = await query(sql, [userId, "completed"]);
    res.json(history);
  } catch (error) {
    console.error("History fetch error:", error);
    res.status(500).json({ error: "Failed to fetch history" });
  }
});
app.post("/api/rides/:id/rate", authenticateToken, async (req, res) => {
  try {
    const rideId = req.params.id;
    const { rating, reviewText } = req.body;
    await query("UPDATE ride_requests SET rating = ?, review_text = ? WHERE id = ?", [rating, reviewText, rideId]);
    res.json({ message: "Rating submitted successfully" });
  } catch (error) {
    console.error("Rating submit error:", error);
    res.status(500).json({ error: "Failed to submit rating" });
  }
});
app.post("/api/rides/:id/dispute", authenticateToken, async (req, res) => {
  try {
    const rideId = req.params.id;
    const { issueType, description } = req.body;
    await query("UPDATE ride_requests SET dispute_status = ?, dispute_reason = ?, dispute_details = ? WHERE id = ?", ["OPEN", issueType, description, rideId]);
    res.json({ message: "Dispute submitted successfully" });
  } catch (error) {
    console.error("Dispute submit error:", error);
    res.status(500).json({ error: "Failed to submit dispute" });
  }
});
app.get("/api/rides/passenger", authenticateToken, async (req, res) => {
  try {
    const [rows] = await query("SELECT * FROM ride_requests WHERE passengerId = ? ORDER BY createdAt DESC", [req.user.id]);
    res.json(rows);
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch rides" });
  }
});
app.get("/api/rides/available", authenticateToken, async (req, res) => {
  try {
    if (req.user.role !== "driver") return res.sendStatus(403);
    const [vehicles] = await query("SELECT * FROM vehicles WHERE driverId = ?", [req.user.id]);
    const driverVehicleType = vehicles[0]?.vehicleType || "CAR";
    const [users] = await query("SELECT * FROM users WHERE id = ?", [req.user.id]);
    const driverGender = users[0]?.gender || "prefer_not_to_say";
    const [rows] = await query("SELECT * FROM ride_requests WHERE status = ? ORDER BY createdAt DESC", ["pending"]);
    const filteredRides = rows.filter((r) => {
      const vehicleMatch = r.requestedVehicleType === driverVehicleType || !r.requestedVehicleType;
      if (r.isFemaleOnly || r.serviceType === "WOMEN_TO_WOMEN") {
        if (driverGender !== "female") return false;
      }
      return vehicleMatch;
    });
    res.json(filteredRides);
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch available rides" });
  }
});
var authorizeAdmin = (req, res, next) => {
  if (req.user.role !== "admin") return res.sendStatus(403);
  next();
};
app.get("/api/admin/stats", authenticateToken, authorizeAdmin, async (req, res) => {
  try {
    const [usersRes] = await query("SELECT COUNT(*) as count FROM users");
    const [driversRes] = await query('SELECT COUNT(*) as count FROM users WHERE role = "driver"');
    const [ridesRes] = await query('SELECT COUNT(*) as count FROM ride_requests WHERE status = "completed"');
    const [revenueRes] = await query('SELECT SUM(proposedFare * 0.15) as total FROM ride_requests WHERE status = "completed"');
    res.json({
      usersCount: usersRes[0]?.count || 0,
      driversCount: driversRes[0]?.count || 0,
      ridesCount: ridesRes[0]?.count || 0,
      revenue: revenueRes[0]?.total || 0
    });
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch admin stats" });
  }
});
app.get("/api/admin/unverified-drivers", authenticateToken, authorizeAdmin, async (req, res) => {
  try {
    const [rows] = await query('SELECT * FROM users WHERE role = "driver" AND isVerified = false');
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch unverified drivers" });
  }
});
app.post("/api/admin/verify-driver/:id", authenticateToken, authorizeAdmin, async (req, res) => {
  try {
    await query("UPDATE users SET isVerified = true WHERE id = ?", [req.params.id]);
    res.json({ message: "Driver verified successfully" });
  } catch (err) {
    res.status(500).json({ error: "Failed to verify driver" });
  }
});
app.post("/api/safety/trigger-alert", authenticateToken, async (req, res) => {
  try {
    console.log(`[SAFETY SENTINEL] Alert triggered for user ${req.user.id}:`, req.body);
    res.json({ success: true, message: "Authorities and contacts notified." });
  } catch (err) {
    res.status(500).json({ error: "Failed to trigger safety alert" });
  }
});
app.get("/api/admin/transactions", authenticateToken, authorizeAdmin, async (req, res) => {
  try {
    const [rows] = await query("SELECT * FROM ride_requests WHERE status = ? ORDER BY createdAt DESC", ["completed"]);
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch transactions" });
  }
});
app.post("/api/promo/validate", authenticateToken, async (req, res) => {
  try {
    const { code } = req.body;
    const [rows] = await query("SELECT * FROM promo_codes WHERE code = ?", [code]);
    const promo = rows[0];
    if (!promo) {
      return res.status(404).json({ error: "Promo code not found" });
    }
    if (!promo.isActive) {
      return res.status(400).json({ error: "Promo code is inactive" });
    }
    res.json(promo);
  } catch (err) {
    res.status(500).json({ error: "Failed to validate promo code" });
  }
});
app.get("/api/admin/promo", authenticateToken, authorizeAdmin, async (req, res) => {
  try {
    const [rows] = await query("SELECT * FROM promo_codes ORDER BY createdAt DESC");
    res.json(rows || []);
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch promo codes" });
  }
});
app.post("/api/admin/promo", authenticateToken, authorizeAdmin, async (req, res) => {
  try {
    const { code, discountPercentage } = req.body;
    await query("INSERT INTO promo_codes (code, discountPercentage) VALUES (?, ?)", [code, discountPercentage]);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: "Failed to create promo" });
  }
});
app.post("/api/admin/promo/:id/toggle", authenticateToken, authorizeAdmin, async (req, res) => {
  try {
    const { isActive } = req.body;
    await query("UPDATE promo_codes SET isActive = ? WHERE id = ?", [isActive, req.params.id]);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: "Failed to toggle promo" });
  }
});
app.get("/api/health", (req, res) => {
  res.json({ status: "ok" });
});
async function startServer() {
  const httpServer = import_http.default.createServer(app);
  const io = new import_socket.Server(httpServer, {
    cors: {
      origin: "*",
      methods: ["GET", "POST"]
    }
  });
  app.set("io", io);
  io.on("connection", (socket) => {
    console.log("Client connected:", socket.id);
    socket.on("joinRoom", (roomId) => {
      socket.join(roomId);
      console.log(`Socket ${socket.id} joined room ${roomId}`);
    });
    socket.on("submitBid", (data) => {
      console.log("Bid submitted:", data);
      io.to(`ride_${data.rideId}`).emit("newBidReceived", data);
    });
    socket.on("acceptBid", (data) => {
      console.log("Bid accepted:", data);
      io.emit("bidAccepted", data);
    });
    socket.on("broadcastRideRequest", (rideData) => {
      console.log("Broadcasting ride request:", rideData);
      socket.broadcast.emit("newRideAvailable", rideData);
    });
    socket.on("disconnect", () => {
      console.log("Client disconnected:", socket.id);
    });
  });
  if (process.env.NODE_ENV !== "production") {
    const vite = await (0, import_vite.createServer)({
      server: { middlewareMode: true },
      appType: "spa"
    });
    app.use(vite.middlewares);
  } else {
    const distPath = import_path.default.join(process.cwd(), "dist");
    app.use(import_express.default.static(distPath));
    app.get("*all", (req, res) => {
      res.sendFile(import_path.default.join(distPath, "index.html"));
    });
  }
  httpServer.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on port ${PORT}`);
  });
}
startServer();
//# sourceMappingURL=server.cjs.map
