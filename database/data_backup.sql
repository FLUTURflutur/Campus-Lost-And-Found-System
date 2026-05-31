SET FOREIGN_KEY_CHECKS=0;
SET SQL_MODE="NO_AUTO_VALUE_ON_ZERO";

-- MySQL dump 10.13  Distrib 9.7.0, for Win64 (x86_64)
--
-- Host: 127.0.0.1    Database: campus_lost_found
-- ------------------------------------------------------
-- Server version	9.7.0

/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!50503 SET NAMES utf8mb4 */;
/*!40103 SET @OLD_TIME_ZONE=@@TIME_ZONE */;
/*!40103 SET TIME_ZONE='+00:00' */;
/*!40014 SET @OLD_UNIQUE_CHECKS=@@UNIQUE_CHECKS, UNIQUE_CHECKS=0 */;
/*!40014 SET @OLD_FOREIGN_KEY_CHECKS=@@FOREIGN_KEY_CHECKS, FOREIGN_KEY_CHECKS=0 */;
/*!40101 SET @OLD_SQL_MODE=@@SQL_MODE, SQL_MODE='NO_AUTO_VALUE_ON_ZERO' */;
/*!40111 SET @OLD_SQL_NOTES=@@SQL_NOTES, SQL_NOTES=0 */;

--
-- Table structure for table `ads`
--

DROP TABLE IF EXISTS `claims`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `claims` (
  `id` int NOT NULL AUTO_INCREMENT,
  `item_id` int NOT NULL,
  `user_id` int NOT NULL,
  `message` text NOT NULL,
  `status` enum('pending','approved','rejected') DEFAULT 'pending',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `rejection_reason` text,
  PRIMARY KEY (`id`),
  KEY `item_id` (`item_id`),
  KEY `user_id` (`user_id`)
) ENGINE=InnoDB AUTO_INCREMENT=4 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `claims`
--

LOCK TABLES `claims` WRITE;
/*!40000 ALTER TABLE `claims` DISABLE KEYS */;
INSERT INTO `claims` VALUES (2,12,9,'this hoodie is mine','approved','2026-05-23 19:28:17',NULL),(3,14,6,'This is my apple watch, please contact me at 070991838','pending','2026-05-30 11:45:12',NULL);
/*!40000 ALTER TABLE `claims` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `comments`
--

DROP TABLE IF EXISTS `comments`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `comments` (
  `id` int NOT NULL AUTO_INCREMENT,
  `item_id` int NOT NULL,
  `user_id` int NOT NULL,
  `comment_text` text NOT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `item_id` (`item_id`),
  KEY `user_id` (`user_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `comments`
--

LOCK TABLES `comments` WRITE;
/*!40000 ALTER TABLE `comments` DISABLE KEYS */;
/*!40000 ALTER TABLE `comments` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `images`
--

DROP TABLE IF EXISTS `images`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `images` (
  `id` int NOT NULL AUTO_INCREMENT,
  `filename` varchar(255) NOT NULL,
  `url` varchar(500) NOT NULL,
  `uploaded_by` int NOT NULL,
  `item_id` int DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_images_user` (`uploaded_by`),
  KEY `idx_images_item` (`item_id`)
) ENGINE=InnoDB AUTO_INCREMENT=8 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `images`
--

LOCK TABLES `images` WRITE;
/*!40000 ALTER TABLE `images` DISABLE KEYS */;
INSERT INTO `images` VALUES (1,'ade60e6b1da2e1a9ca286cb15cd3cd9e.jpg','/uploads/ade60e6b1da2e1a9ca286cb15cd3cd9e.jpg',5,6,'2026-05-23 19:12:18'),(2,'dd9d80b7528b78dc2529fd6cd2ac5624.jpg','/uploads/dd9d80b7528b78dc2529fd6cd2ac5624.jpg',5,7,'2026-05-23 19:13:57'),(3,'600622c2a08acb708adc8e63d3d7c003.jpg','/uploads/600622c2a08acb708adc8e63d3d7c003.jpg',6,8,'2026-05-23 19:15:23'),(4,'6c8da58833291e08535f33f0ac6d5678.jpg','/uploads/6c8da58833291e08535f33f0ac6d5678.jpg',6,9,'2026-05-23 19:17:38'),(5,'eb8f854184812d5c4aae1351e774de07.webp','/uploads/eb8f854184812d5c4aae1351e774de07.webp',6,10,'2026-05-23 19:18:46'),(6,'2cedc94e013780513eba479ba5821b1d.webp','/uploads/2cedc94e013780513eba479ba5821b1d.webp',6,11,'2026-05-23 19:20:09'),(7,'4101bdfd4cccf15d8b3b67afafd68bca.jpg','/uploads/4101bdfd4cccf15d8b3b67afafd68bca.jpg',7,12,'2026-05-23 19:21:18');
/*!40000 ALTER TABLE `images` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `items`
--

DROP TABLE IF EXISTS `items`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `items` (
  `id` int NOT NULL AUTO_INCREMENT,
  `title` varchar(100) NOT NULL,
  `description` text NOT NULL,
  `category` varchar(50) NOT NULL,
  `status` enum('pending','approved','claimed','resolved') NOT NULL DEFAULT 'pending',
  `type` enum('lost','found') NOT NULL,
  `location` varchar(100) NOT NULL,
  `image_url` varchar(255) DEFAULT NULL,
  `reported_by` int NOT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `deleted_at` datetime DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `reported_by` (`reported_by`)
) ENGINE=InnoDB AUTO_INCREMENT=15 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `items`
--

LOCK TABLES `items` WRITE;
/*!40000 ALTER TABLE `items` DISABLE KEYS */;
INSERT INTO `items` VALUES (6,'Blue iPhone 13','A blue iPhone 13 with a transparent case and small scratch near the camera.','Electronics','approved','lost','Library 2nd Floor','/uploads/ade60e6b1da2e1a9ca286cb15cd3cd9e.jpg',5,'2026-05-23 19:12:21',NULL),(7,'Silver MacBook Air','MacBook Air 13-inch with stickers on the back cover.','Electronics','approved','found','Student Union Cafe','/uploads/dd9d80b7528b78dc2529fd6cd2ac5624.jpg',5,'2026-05-23 19:14:00',NULL),(8,'Black North Face Backpack','Medium-sized black backpack containing notebooks and a charger.','Wallet / Bag','approved','lost','Engineering Building Room 204','/uploads/600622c2a08acb708adc8e63d3d7c003.jpg',6,'2026-05-23 19:15:24',NULL),(9,'Student ID Card','Lost student ID belonging to Alvin Lee.','Other','approved','lost','Main Parking Lot','/uploads/6c8da58833291e08535f33f0ac6d5678.jpg',6,'2026-05-23 19:18:02',NULL),(10,'White AirPods Pro','AirPods Pro in white charging case with initials A.K.','Electronics','approved','found','Campus Gym','/uploads/eb8f854184812d5c4aae1351e774de07.webp',6,'2026-05-23 19:18:51',NULL),(11,'Water Bottle','Metal reusable water bottle covered with anime stickers','Accessories','approved','lost','Science Building','/uploads/2cedc94e013780513eba479ba5821b1d.webp',6,'2026-05-23 19:20:11',NULL),(12,'Grey Hoodie','Oversized grey hoodie with no logo on the front','Clothing','claimed','lost','Dormitory Laundry Room','/uploads/4101bdfd4cccf15d8b3b67afafd68bca.jpg',7,'2026-05-23 19:21:24','2026-05-23 21:30:31'),(13,'Bike Keys','Set of bike keys with red keychain and small flashlight.\'','Accessories','approved','found','Bicycle Parking Area',NULL,7,'2026-05-23 19:21:50',NULL),(14,'Apple Watch Series 8','Black Apple Watch with sports band and cracked protector.','Electronics','approved','found','Basketball Court',NULL,8,'2026-05-23 19:22:37',NULL);
/*!40000 ALTER TABLE `items` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `password_resets`
--

DROP TABLE IF EXISTS `password_resets`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `password_resets` (
  `id` int NOT NULL AUTO_INCREMENT,
  `user_id` int NOT NULL,
  `token` varchar(64) NOT NULL,
  `expires_at` datetime NOT NULL,
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_token` (`token`),
  KEY `user_id` (`user_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `password_resets`
--

LOCK TABLES `password_resets` WRITE;
/*!40000 ALTER TABLE `password_resets` DISABLE KEYS */;
/*!40000 ALTER TABLE `password_resets` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `users`
--

DROP TABLE IF EXISTS `users`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `users` (
  `id` int NOT NULL AUTO_INCREMENT,
  `username` varchar(50) NOT NULL,
  `email` varchar(100) NOT NULL,
  `password` varchar(255) NOT NULL,
  `role` enum('user','admin','superadmin') NOT NULL DEFAULT 'user',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `failed_attempts` tinyint unsigned NOT NULL DEFAULT '0',
  `locked_until` datetime DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `username` (`username`),
  UNIQUE KEY `email` (`email`)
) ENGINE=InnoDB AUTO_INCREMENT=11 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `users`
--

LOCK TABLES `users` WRITE;
/*!40000 ALTER TABLE `users` DISABLE KEYS */;
INSERT INTO `users` VALUES (2,'john_doe','john@campus.edu','$2b$10$YourHashedPasswordHere','user','2026-05-19 12:19:55',0,NULL),(4,'flutura','flutura123@gmail.com','$2b$10$Dtp6KVEYYkdp5oKFg035GuBCprBcXraBYQve0bA5.7RvTe05EV9QS','superadmin','2026-05-23 13:34:25',0,NULL),(5,'Josh','josh@email.com','$2b$10$J2amUg1UfCiO7WHqsnSpCudynl7rQivy5kL952wo0RS6vjkyPaTvu','user','2026-05-23 18:55:53',0,NULL),(6,'Marija','marija@email.com','$2b$10$MbUDsj5cfuHKUruIRLp/JOG0txCUZnHzEulZ7I1Gvb1wNOeBWHoJK','user','2026-05-23 18:56:19',0,NULL),(7,'Viktorija','viktorija@email.com','$2b$10$jxSAS7c1rO03fZy44mHfzes3e5ieTOj7k9hM1g0K/tEhNusgBOKMW','user','2026-05-23 18:56:36',0,NULL),(8,'Selina','selina@email.com','$2b$10$vJGrWaWK0EOo2JBnC5BrbOEBTU8KpJjjMYmH4iT0Dh2HBjJ.iIWp6','user','2026-05-23 18:56:54',0,NULL),(9,'Shawn','shawn@email.com','$2b$10$CSn2XrPyogK.ik1snp3AX.9ke9Cgs7EFxQbqeXorR8tMJgxL7OjjK','user','2026-05-23 18:57:17',0,NULL),(10,'Jovana','jovana@email.com','$2b$10$c0xByYsEkBzWy/YniKF1xexKI2CbsBhfrZ4HKpvuTXgNZ4f9nXoNq','admin','2026-05-23 19:02:14',0,NULL);
/*!40000 ALTER TABLE `users` ENABLE KEYS */;
UNLOCK TABLES;
/*!40103 SET TIME_ZONE=@OLD_TIME_ZONE */;

/*!40101 SET SQL_MODE=@OLD_SQL_MODE */;
/*!40014 SET FOREIGN_KEY_CHECKS=@OLD_FOREIGN_KEY_CHECKS */;
/*!40014 SET UNIQUE_CHECKS=@OLD_UNIQUE_CHECKS */;
/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
/*!40111 SET SQL_NOTES=@OLD_SQL_NOTES */;

-- Dump completed on 2026-05-31 12:56:48
