CREATE DATABASE IF NOT EXISTS farego_db;
USE farego_db;

CREATE TABLE `users` (
    `id` INT AUTO_INCREMENT PRIMARY KEY,
    `firstName` VARCHAR(255) NOT NULL,
    `lastName` VARCHAR(255) NOT NULL,
    `email` VARCHAR(255) UNIQUE,
    `phone` VARCHAR(50) UNIQUE,
    `passwordHash` VARCHAR(255) NOT NULL,
    `role` ENUM('passenger', 'driver', 'admin') NOT NULL,
    `gender` ENUM('male', 'female', 'other', 'prefer_not_to_say') DEFAULT 'prefer_not_to_say',
    `profilePicture` LONGTEXT,
    `isVerified` BOOLEAN DEFAULT FALSE,
    `rating` DECIMAL(3,2) DEFAULT 5.00,
    `createdAt` TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE `vehicles` (
    `id` INT AUTO_INCREMENT PRIMARY KEY,
    `driverId` INT NOT NULL,
    `make` VARCHAR(100) NOT NULL,
    `model` VARCHAR(100) NOT NULL,
    `plateNumber` VARCHAR(50) UNIQUE NOT NULL,
    `vehicleTier` ENUM('standard', 'premium', 'suv') DEFAULT 'standard',
    `vehicleType` ENUM('MC_TAXI', 'CAR', 'VAN') DEFAULT 'CAR',
    `isEcoFriendly` BOOLEAN DEFAULT FALSE,
    `isActive` BOOLEAN DEFAULT TRUE,
    FOREIGN KEY (`driverId`) REFERENCES `users`(`id`) ON DELETE CASCADE
);

CREATE TABLE `ride_requests` (
    `id` INT AUTO_INCREMENT PRIMARY KEY,
    `passengerId` INT NOT NULL,
    `pickupLat` DECIMAL(10,8) NOT NULL,
    `pickupLng` DECIMAL(11,8) NOT NULL,
    `pickupAddress` VARCHAR(255),
    `dropoffLat` DECIMAL(10,8) NOT NULL,
    `dropoffLng` DECIMAL(11,8) NOT NULL,
    `dropoffAddress` VARCHAR(255),
    `proposedFare` DECIMAL(10,2) NOT NULL,
    `status` ENUM('pending', 'negotiating', 'accepted', 'in_progress', 'completed', 'cancelled') DEFAULT 'pending',
    `serviceType` ENUM('CITY_RIDE', 'CITY_TO_CITY', 'AIRPORT', 'ADVANCED', 'WOMEN_TO_WOMEN', 'ECO', 'POOL') DEFAULT 'CITY_RIDE',
    `requestedVehicleType` ENUM('MC_TAXI', 'CAR', 'VAN') DEFAULT 'CAR',
    `isFemaleOnly` BOOLEAN DEFAULT FALSE,
    `isEcoFriendly` BOOLEAN DEFAULT FALSE,
    `isPool` BOOLEAN DEFAULT FALSE,
    `boardingOTP` VARCHAR(10),
    `promoCode` VARCHAR(50),
    `rating` INT DEFAULT NULL,
    `review_text` TEXT DEFAULT NULL,
    `dispute_status` ENUM('NONE', 'OPEN', 'RESOLVED') DEFAULT 'NONE',
    `dispute_reason` VARCHAR(255) DEFAULT NULL,
    `dispute_details` TEXT DEFAULT NULL,
    `createdAt` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    `driverId` INT DEFAULT NULL,
    FOREIGN KEY (`passengerId`) REFERENCES `users`(`id`) ON DELETE CASCADE,
    FOREIGN KEY (`driverId`) REFERENCES `users`(`id`) ON DELETE CASCADE
);

CREATE TABLE `bids` (
    `id` INT AUTO_INCREMENT PRIMARY KEY,
    `rideRequestId` INT NOT NULL,
    `driverId` INT NOT NULL,
    `bidAmount` DECIMAL(10,2) NOT NULL,
    `status` ENUM('pending', 'accepted', 'rejected') DEFAULT 'pending',
    `createdAt` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (`rideRequestId`) REFERENCES `ride_requests`(`id`) ON DELETE CASCADE,
    FOREIGN KEY (`driverId`) REFERENCES `users`(`id`) ON DELETE CASCADE
);

CREATE TABLE `transactions` (
    `id` INT AUTO_INCREMENT PRIMARY KEY,
    `rideRequestId` INT NOT NULL,
    `passengerId` INT NOT NULL,
    `driverId` INT NOT NULL,
    `finalFare` DECIMAL(10,2) NOT NULL,
    `platformFee` DECIMAL(10,2) NOT NULL,
    `driverEarnings` DECIMAL(10,2) NOT NULL,
    `paymentMethod` ENUM('cash', 'card', 'wallet') DEFAULT 'cash',
    `paymentStatus` ENUM('pending', 'completed', 'failed', 'refunded') DEFAULT 'pending',
    `createdAt` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (`rideRequestId`) REFERENCES `ride_requests`(`id`) ON DELETE NO ACTION,
    FOREIGN KEY (`passengerId`) REFERENCES `users`(`id`) ON DELETE NO ACTION,
    FOREIGN KEY (`driverId`) REFERENCES `users`(`id`) ON DELETE NO ACTION
);

CREATE TABLE `admins` (
    `id` INT AUTO_INCREMENT PRIMARY KEY,
    `username` VARCHAR(255) UNIQUE NOT NULL,
    `passwordHash` VARCHAR(255) NOT NULL,
    `createdAt` TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE `promo_codes` (
    `id` INT AUTO_INCREMENT PRIMARY KEY,
    `code` VARCHAR(50) UNIQUE NOT NULL,
    `discountPercentage` DECIMAL(5,2) NOT NULL,
    `isActive` BOOLEAN DEFAULT TRUE,
    `createdAt` TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
