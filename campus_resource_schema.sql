-- ============================================================================
-- Campus Resource Allocation and Booking System
-- Expanded MySQL Database Schema (21 Entities/Relations)
-- ============================================================================

CREATE DATABASE IF NOT EXISTS campus_resource_db;
USE campus_resource_db;

-- ============================================================================
-- 1. BUILDING - Stores campus building information
-- ============================================================================
CREATE TABLE Building (
    building_id     INT             PRIMARY KEY AUTO_INCREMENT,
    building_name   VARCHAR(100)    NOT NULL,
    building_code   VARCHAR(10)     NOT NULL UNIQUE,
    address         VARCHAR(255),
    total_floors    INT             NOT NULL DEFAULT 1,
    created_at      TIMESTAMP       DEFAULT CURRENT_TIMESTAMP
);

-- ============================================================================
-- 2. DEPARTMENT - Stores academic department information
-- ============================================================================
CREATE TABLE Department (
    dept_id         INT             PRIMARY KEY AUTO_INCREMENT,
    dept_name       VARCHAR(100)    NOT NULL,
    dept_code       VARCHAR(10)     NOT NULL UNIQUE,
    building_id     INT,
    floor_number    INT,
    hod_name        VARCHAR(100),
    contact_email   VARCHAR(100),
    created_at      TIMESTAMP       DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (building_id) REFERENCES Building(building_id)
        ON UPDATE CASCADE ON DELETE SET NULL
);

-- ============================================================================
-- 3. ROLE - Defines user roles (Admin, Faculty, Student, Lab Assistant, etc.)
-- ============================================================================
CREATE TABLE Role (
    role_id         INT             PRIMARY KEY AUTO_INCREMENT,
    role_name       VARCHAR(50)     NOT NULL UNIQUE,
    description     VARCHAR(255),
    can_approve     BOOLEAN         NOT NULL DEFAULT FALSE,
    can_book        BOOLEAN         NOT NULL DEFAULT TRUE,
    max_booking_hrs INT             DEFAULT 4
);

-- ============================================================================
-- 4. USER - Stores system users (faculty, admins, students, staff)
-- ============================================================================
CREATE TABLE User (
    user_id         INT             PRIMARY KEY AUTO_INCREMENT,
    name            VARCHAR(100)    NOT NULL,
    email           VARCHAR(100)    NOT NULL UNIQUE,
    password_hash   VARCHAR(255)    NOT NULL,
    phone           VARCHAR(15),
    dept_id         INT             NOT NULL,
    role_id         INT             NOT NULL,
    is_active       BOOLEAN         NOT NULL DEFAULT TRUE,
    created_at      TIMESTAMP       DEFAULT CURRENT_TIMESTAMP,
    updated_at      TIMESTAMP       DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (dept_id) REFERENCES Department(dept_id)
        ON UPDATE CASCADE ON DELETE RESTRICT,
    FOREIGN KEY (role_id) REFERENCES Role(role_id)
        ON UPDATE CASCADE ON DELETE RESTRICT
);

-- ============================================================================
-- 5. RESOURCE_CATEGORY - Categorizes resources (Room, Equipment, Vehicle, etc.)
-- ============================================================================
CREATE TABLE Resource_Category (
    category_id     INT             PRIMARY KEY AUTO_INCREMENT,
    category_name   VARCHAR(50)     NOT NULL UNIQUE,
    description     VARCHAR(255),
    requires_approval BOOLEAN       NOT NULL DEFAULT TRUE
);

-- ============================================================================
-- 6. RESOURCE - Campus resources (classrooms, labs, seminar halls, equipment)
-- ============================================================================
CREATE TABLE Resource (
    resource_id     INT             PRIMARY KEY AUTO_INCREMENT,
    resource_name   VARCHAR(100)    NOT NULL,
    category_id     INT             NOT NULL,
    building_id     INT,
    floor_number    INT,
    room_number     VARCHAR(20),
    capacity        INT,
    status          ENUM('Available', 'Under_Maintenance', 'Retired')
                                    NOT NULL DEFAULT 'Available',
    description     VARCHAR(255),
    created_at      TIMESTAMP       DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (category_id) REFERENCES Resource_Category(category_id)
        ON UPDATE CASCADE ON DELETE RESTRICT,
    FOREIGN KEY (building_id) REFERENCES Building(building_id)
        ON UPDATE CASCADE ON DELETE SET NULL
);

-- ============================================================================
-- 7. RESOURCE_FEATURE - Features/amenities a resource can have (projector, AC, etc.)
-- ============================================================================
CREATE TABLE Resource_Feature (
    feature_id      INT             PRIMARY KEY AUTO_INCREMENT,
    feature_name    VARCHAR(50)     NOT NULL UNIQUE,
    description     VARCHAR(255)
);

-- ============================================================================
-- 8. RESOURCE_FEATURE_MAP - Many-to-many mapping between Resources and Features
-- ============================================================================
CREATE TABLE Resource_Feature_Map (
    resource_id     INT             NOT NULL,
    feature_id      INT             NOT NULL,
    PRIMARY KEY (resource_id, feature_id),
    FOREIGN KEY (resource_id) REFERENCES Resource(resource_id)
        ON UPDATE CASCADE ON DELETE CASCADE,
    FOREIGN KEY (feature_id) REFERENCES Resource_Feature(feature_id)
        ON UPDATE CASCADE ON DELETE CASCADE
);

-- ============================================================================
-- 9. TIME_SLOT - Predefined time slots for scheduling
-- ============================================================================
CREATE TABLE Time_Slot (
    slot_id         INT             PRIMARY KEY AUTO_INCREMENT,
    slot_label      VARCHAR(30)     NOT NULL,
    start_time      TIME            NOT NULL,
    end_time        TIME            NOT NULL,
    is_active       BOOLEAN         NOT NULL DEFAULT TRUE,
    UNIQUE (start_time, end_time)
);

-- ============================================================================
-- 10. ACADEMIC_TERM - Represents semesters or academic periods
-- ============================================================================
CREATE TABLE Academic_Term (
    term_id         INT             PRIMARY KEY AUTO_INCREMENT,
    term_name       VARCHAR(50)     NOT NULL,
    start_date      DATE            NOT NULL,
    end_date        DATE            NOT NULL,
    is_current      BOOLEAN         NOT NULL DEFAULT FALSE,
    CONSTRAINT chk_term_dates CHECK (end_date > start_date)
);

-- ============================================================================
-- 11. BOOKING - Core booking requests made by users
-- ============================================================================
CREATE TABLE Booking (
    booking_id      INT             PRIMARY KEY AUTO_INCREMENT,
    user_id         INT             NOT NULL,
    resource_id     INT             NOT NULL,
    slot_id         INT,
    booking_date    DATE            NOT NULL,
    start_time      TIME            NOT NULL,
    end_time        TIME            NOT NULL,
    purpose         VARCHAR(255),
    attendee_count  INT,
    booking_status  ENUM('Pending', 'Approved', 'Rejected', 'Cancelled', 'Completed')
                                    NOT NULL DEFAULT 'Pending',
    is_recurring    BOOLEAN         NOT NULL DEFAULT FALSE,
    term_id         INT,
    created_at      TIMESTAMP       DEFAULT CURRENT_TIMESTAMP,
    updated_at      TIMESTAMP       DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES User(user_id)
        ON UPDATE CASCADE ON DELETE RESTRICT,
    FOREIGN KEY (resource_id) REFERENCES Resource(resource_id)
        ON UPDATE CASCADE ON DELETE RESTRICT,
    FOREIGN KEY (slot_id) REFERENCES Time_Slot(slot_id)
        ON UPDATE CASCADE ON DELETE SET NULL,
    FOREIGN KEY (term_id) REFERENCES Academic_Term(term_id)
        ON UPDATE CASCADE ON DELETE SET NULL,
    CONSTRAINT chk_booking_time CHECK (end_time > start_time),
    INDEX idx_booking_date_resource (booking_date, resource_id),
    INDEX idx_booking_user (user_id),
    INDEX idx_booking_status (booking_status)
);

-- ============================================================================
-- 12. RECURRING_PATTERN - Defines recurrence rules for recurring bookings
-- ============================================================================
CREATE TABLE Recurring_Pattern (
    pattern_id      INT             PRIMARY KEY AUTO_INCREMENT,
    booking_id      INT             NOT NULL,
    recurrence_type ENUM('Daily', 'Weekly', 'Biweekly', 'Monthly')
                                    NOT NULL,
    day_of_week     ENUM('Mon','Tue','Wed','Thu','Fri','Sat','Sun'),
    recur_start     DATE            NOT NULL,
    recur_end       DATE            NOT NULL,
    FOREIGN KEY (booking_id) REFERENCES Booking(booking_id)
        ON UPDATE CASCADE ON DELETE CASCADE,
    CONSTRAINT chk_recur_dates CHECK (recur_end > recur_start)
);

-- ============================================================================
-- 13. APPROVAL - Stores approval/rejection decisions for bookings
-- ============================================================================
CREATE TABLE Approval (
    approval_id     INT             PRIMARY KEY AUTO_INCREMENT,
    booking_id      INT             NOT NULL UNIQUE,
    approved_by     INT             NOT NULL,
    decision        ENUM('Approved', 'Rejected') NOT NULL,
    remarks         VARCHAR(500),
    approval_date   TIMESTAMP       DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (booking_id) REFERENCES Booking(booking_id)
        ON UPDATE CASCADE ON DELETE CASCADE,
    FOREIGN KEY (approved_by) REFERENCES User(user_id)
        ON UPDATE CASCADE ON DELETE RESTRICT
);

-- ============================================================================
-- 14. NOTIFICATION - Alerts and notifications sent to users
-- ============================================================================
CREATE TABLE Notification (
    notification_id INT             PRIMARY KEY AUTO_INCREMENT,
    user_id         INT             NOT NULL,
    booking_id      INT,
    message         VARCHAR(500)    NOT NULL,
    notification_type ENUM('Booking_Confirmation', 'Approval_Update',
                          'Cancellation', 'Reminder', 'Maintenance', 'General')
                                    NOT NULL,
    is_read         BOOLEAN         NOT NULL DEFAULT FALSE,
    created_at      TIMESTAMP       DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES User(user_id)
        ON UPDATE CASCADE ON DELETE CASCADE,
    FOREIGN KEY (booking_id) REFERENCES Booking(booking_id)
        ON UPDATE CASCADE ON DELETE SET NULL
);

-- ============================================================================
-- 15. MAINTENANCE_LOG - Tracks maintenance activities on resources
-- ============================================================================
CREATE TABLE Maintenance_Log (
    maintenance_id  INT             PRIMARY KEY AUTO_INCREMENT,
    resource_id     INT             NOT NULL,
    reported_by     INT             NOT NULL,
    assigned_to     INT,
    issue_desc      VARCHAR(500)    NOT NULL,
    priority        ENUM('Low', 'Medium', 'High', 'Critical')
                                    NOT NULL DEFAULT 'Medium',
    status          ENUM('Reported', 'In_Progress', 'Resolved', 'Closed')
                                    NOT NULL DEFAULT 'Reported',
    reported_date   TIMESTAMP       DEFAULT CURRENT_TIMESTAMP,
    resolved_date   TIMESTAMP       NULL,
    FOREIGN KEY (resource_id) REFERENCES Resource(resource_id)
        ON UPDATE CASCADE ON DELETE CASCADE,
    FOREIGN KEY (reported_by) REFERENCES User(user_id)
        ON UPDATE CASCADE ON DELETE RESTRICT,
    FOREIGN KEY (assigned_to) REFERENCES User(user_id)
        ON UPDATE CASCADE ON DELETE SET NULL
);

-- ============================================================================
-- 16. USAGE_LOG - Tracks actual check-in/check-out usage of resources
-- ============================================================================
CREATE TABLE Usage_Log (
    usage_id        INT             PRIMARY KEY AUTO_INCREMENT,
    booking_id      INT             NOT NULL,
    check_in_time   TIMESTAMP       NULL,
    check_out_time  TIMESTAMP       NULL,
    actual_attendees INT,
    feedback_rating INT             CHECK (feedback_rating BETWEEN 1 AND 5),
    remarks         VARCHAR(255),
    FOREIGN KEY (booking_id) REFERENCES Booking(booking_id)
        ON UPDATE CASCADE ON DELETE CASCADE
);

-- ============================================================================
-- 17. RESOURCE_POLICY - Rules and policies governing resource usage
-- ============================================================================
CREATE TABLE Resource_Policy (
    policy_id       INT             PRIMARY KEY AUTO_INCREMENT,
    category_id     INT             NOT NULL,
    policy_name     VARCHAR(100)    NOT NULL,
    max_duration_hrs INT            NOT NULL DEFAULT 2,
    advance_booking_days INT        NOT NULL DEFAULT 7,
    cancellation_hrs INT            NOT NULL DEFAULT 24,
    requires_approval BOOLEAN       NOT NULL DEFAULT TRUE,
    auto_release_mins INT           NOT NULL DEFAULT 15,
    FOREIGN KEY (category_id) REFERENCES Resource_Category(category_id)
        ON UPDATE CASCADE ON DELETE CASCADE
);

-- ============================================================================
-- 18. HOLIDAY_CALENDAR - Institution holidays and blocked dates
-- ============================================================================
CREATE TABLE Holiday_Calendar (
    holiday_id      INT             PRIMARY KEY AUTO_INCREMENT,
    holiday_name    VARCHAR(100)    NOT NULL,
    holiday_date    DATE            NOT NULL UNIQUE,
    term_id         INT,
    FOREIGN KEY (term_id) REFERENCES Academic_Term(term_id)
        ON UPDATE CASCADE ON DELETE SET NULL
);

-- ============================================================================
-- 19. WAITLIST - Manages waitlisted booking requests
-- ============================================================================
CREATE TABLE Waitlist (
    waitlist_id     INT             PRIMARY KEY AUTO_INCREMENT,
    user_id         INT             NOT NULL,
    resource_id     INT             NOT NULL,
    requested_date  DATE            NOT NULL,
    start_time      TIME            NOT NULL,
    end_time        TIME            NOT NULL,
    purpose         VARCHAR(255),
    priority_order  INT             NOT NULL DEFAULT 0,
    status          ENUM('Waiting', 'Offered', 'Accepted', 'Expired')
                                    NOT NULL DEFAULT 'Waiting',
    created_at      TIMESTAMP       DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES User(user_id)
        ON UPDATE CASCADE ON DELETE CASCADE,
    FOREIGN KEY (resource_id) REFERENCES Resource(resource_id)
        ON UPDATE CASCADE ON DELETE CASCADE
);

-- ============================================================================
-- 20. DEPARTMENT_RESOURCE_ACCESS - Controls which departments can book which resources
-- ============================================================================
CREATE TABLE Department_Resource_Access (
    access_id       INT             PRIMARY KEY AUTO_INCREMENT,
    dept_id         INT             NOT NULL,
    resource_id     INT             NOT NULL,
    priority_level  INT             NOT NULL DEFAULT 1,
    is_owner        BOOLEAN         NOT NULL DEFAULT FALSE,
    UNIQUE (dept_id, resource_id),
    FOREIGN KEY (dept_id) REFERENCES Department(dept_id)
        ON UPDATE CASCADE ON DELETE CASCADE,
    FOREIGN KEY (resource_id) REFERENCES Resource(resource_id)
        ON UPDATE CASCADE ON DELETE CASCADE
);

-- ============================================================================
-- 21. AUDIT_LOG - Tracks all critical system actions for accountability
-- ============================================================================
CREATE TABLE Audit_Log (
    log_id          INT             PRIMARY KEY AUTO_INCREMENT,
    user_id         INT,
    action_type     ENUM('INSERT', 'UPDATE', 'DELETE', 'LOGIN', 'LOGOUT',
                         'APPROVE', 'REJECT', 'CANCEL')
                                    NOT NULL,
    table_name      VARCHAR(50)     NOT NULL,
    record_id       INT,
    old_value       TEXT,
    new_value       TEXT,
    ip_address      VARCHAR(45),
    action_time     TIMESTAMP       DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES User(user_id)
        ON UPDATE CASCADE ON DELETE SET NULL,
    INDEX idx_audit_user (user_id),
    INDEX idx_audit_action (action_type),
    INDEX idx_audit_time (action_time)
);


-- ============================================================================
-- SAMPLE DATA INSERTION
-- ============================================================================

-- Buildings
INSERT INTO Building (building_name, building_code, address, total_floors) VALUES
('University Building', 'UB', 'Main Campus, Kattankulathur', 5),
('Tech Park Block A', 'TPA', 'Tech Park, Kattankulathur', 4),
('Tech Park Block B', 'TPB', 'Tech Park, Kattankulathur', 4),
('Science Block', 'SB', 'East Campus, Kattankulathur', 3),
('Admin Block', 'AB', 'Main Campus, Kattankulathur', 2);

-- Departments
INSERT INTO Department (dept_name, dept_code, building_id, floor_number, hod_name, contact_email) VALUES
('Computer Science Engineering', 'CSE', 2, 3, 'Dr. R. Subash', 'cse@srm.edu.in'),
('Electronics and Communication', 'ECE', 2, 2, 'Dr. S. Kumar', 'ece@srm.edu.in'),
('Mechanical Engineering', 'MECH', 4, 1, 'Dr. P. Rajan', 'mech@srm.edu.in'),
('Information Technology', 'IT', 3, 3, 'Dr. A. Sharma', 'it@srm.edu.in'),
('Networking and Communications', 'NWC', 2, 4, 'Dr. M. Priya', 'nwc@srm.edu.in');

-- Roles
INSERT INTO Role (role_name, description, can_approve, can_book, max_booking_hrs) VALUES
('Admin', 'System administrator with full access', TRUE, TRUE, 8),
('Faculty', 'Teaching faculty member', FALSE, TRUE, 4),
('HOD', 'Head of Department with approval rights', TRUE, TRUE, 6),
('Lab_Assistant', 'Laboratory assistant/technician', FALSE, TRUE, 2),
('Student', 'Student with limited booking privileges', FALSE, TRUE, 2);

-- Users
INSERT INTO User (name, email, password_hash, phone, dept_id, role_id) VALUES
('Dr. R. Subash', 'subash.r@srm.edu.in', SHA2('admin123', 256), '9876543210', 1, 1),
('Nishanth Kannan', 'nk0051@srm.edu.in', SHA2('user123', 256), '9876543211', 1, 5),
('Karthikeyan S', 'ks0057@srm.edu.in', SHA2('user456', 256), '9876543212', 1, 5),
('Dr. S. Kumar', 'kumar.s@srm.edu.in', SHA2('hod123', 256), '9876543213', 2, 3),
('Prof. A. Sharma', 'sharma.a@srm.edu.in', SHA2('fac123', 256), '9876543214', 4, 2),
('Mr. Ravi', 'ravi.lab@srm.edu.in', SHA2('lab123', 256), '9876543215', 1, 4);

-- Resource Categories
INSERT INTO Resource_Category (category_name, description, requires_approval) VALUES
('Classroom', 'Standard lecture classrooms', FALSE),
('Laboratory', 'Specialized computing and science labs', TRUE),
('Seminar_Hall', 'Large seminar and conference halls', TRUE),
('Equipment', 'Portable equipment like projectors, mics', TRUE),
('Sports_Facility', 'Sports grounds and indoor courts', TRUE),
('Auditorium', 'Large event auditoriums', TRUE);

-- Resources
INSERT INTO Resource (resource_name, category_id, building_id, floor_number, room_number, capacity, status, description) VALUES
('CSE Lab 1', 2, 2, 3, 'TPA-301', 60, 'Available', 'Computer lab with 60 workstations'),
('CSE Lab 2', 2, 2, 3, 'TPA-302', 40, 'Available', 'Advanced computing lab'),
('Seminar Hall A', 3, 1, 2, 'UB-201', 200, 'Available', 'Main seminar hall with AV setup'),
('Classroom C101', 1, 1, 1, 'UB-101', 80, 'Available', 'Standard lecture hall'),
('Classroom C102', 1, 1, 1, 'UB-102', 60, 'Available', 'Standard classroom'),
('Projector Unit P1', 4, NULL, NULL, NULL, NULL, 'Available', 'Portable HD projector'),
('Mini Auditorium', 6, 1, 0, 'UB-G01', 500, 'Available', 'Ground floor auditorium'),
('ECE Lab 1', 2, 2, 2, 'TPA-201', 50, 'Available', 'Electronics lab with oscilloscopes'),
('Sports Ground', 5, NULL, NULL, NULL, NULL, 'Available', 'Main outdoor sports ground'),
('Conference Room', 3, 5, 1, 'AB-101', 30, 'Available', 'Admin block conference room');

-- Resource Features
INSERT INTO Resource_Feature (feature_name, description) VALUES
('Projector', 'Built-in LCD/LED projector'),
('Air_Conditioning', 'Centralized or split AC'),
('Whiteboard', 'Standard whiteboard'),
('Smart_Board', 'Interactive smart board'),
('Sound_System', 'Built-in speakers and microphone'),
('Video_Conferencing', 'VC setup with camera and display'),
('WiFi', 'High-speed wireless internet'),
('Power_Outlets', 'Individual power outlets at each seat');

-- Resource-Feature Mapping
INSERT INTO Resource_Feature_Map (resource_id, feature_id) VALUES
(1, 1), (1, 2), (1, 7), (1, 8),
(2, 1), (2, 2), (2, 4), (2, 7),
(3, 1), (3, 2), (3, 5), (3, 6), (3, 7),
(4, 1), (4, 3), (4, 7),
(5, 3), (5, 7),
(7, 1), (7, 2), (7, 5), (7, 6), (7, 7),
(10, 1), (10, 2), (10, 5), (10, 6), (10, 7);

-- Time Slots
INSERT INTO Time_Slot (slot_label, start_time, end_time) VALUES
('Slot 1 (Morning)', '08:00:00', '09:00:00'),
('Slot 2', '09:00:00', '10:00:00'),
('Slot 3', '10:00:00', '11:00:00'),
('Slot 4', '11:00:00', '12:00:00'),
('Slot 5 (Lunch)', '12:00:00', '13:00:00'),
('Slot 6', '13:00:00', '14:00:00'),
('Slot 7', '14:00:00', '15:00:00'),
('Slot 8', '15:00:00', '16:00:00'),
('Slot 9 (Evening)', '16:00:00', '17:00:00');

-- Academic Terms
INSERT INTO Academic_Term (term_name, start_date, end_date, is_current) VALUES
('Odd Semester 2025-26', '2025-07-01', '2025-12-15', FALSE),
('Even Semester 2025-26', '2026-01-10', '2026-05-30', TRUE);

-- Bookings
INSERT INTO Booking (user_id, resource_id, slot_id, booking_date, start_time, end_time, purpose, attendee_count, booking_status, term_id) VALUES
(2, 1, 3, '2026-02-20', '10:00:00', '11:00:00', 'DBMS Lab Practice', 55, 'Approved', 2),
(3, 3, 6, '2026-02-21', '13:00:00', '15:00:00', 'Technical Seminar on Cloud Computing', 150, 'Pending', 2),
(5, 4, 2, '2026-02-22', '09:00:00', '10:00:00', 'Guest Lecture on AI', 70, 'Approved', 2),
(4, 10, 7, '2026-02-23', '14:00:00', '15:00:00', 'Department Meeting', 25, 'Approved', 2),
(2, 7, NULL, '2026-03-01', '09:00:00', '17:00:00', 'Annual Tech Fest - Inauguration', 400, 'Pending', 2);

-- Approvals
INSERT INTO Approval (booking_id, approved_by, decision, remarks) VALUES
(1, 1, 'Approved', 'Lab available. Approved for DBMS practice.'),
(3, 1, 'Approved', 'Guest lecture approved. Ensure projector is working.'),
(4, 4, 'Approved', 'Conference room reserved for dept meeting.');

-- Update booking statuses to match approvals
UPDATE Booking SET booking_status = 'Approved' WHERE booking_id IN (1, 3, 4);

-- Notifications
INSERT INTO Notification (user_id, booking_id, message, notification_type) VALUES
(2, 1, 'Your booking for CSE Lab 1 on 2026-02-20 has been approved.', 'Approval_Update'),
(3, 2, 'Your booking for Seminar Hall A on 2026-02-21 is pending approval.', 'Booking_Confirmation'),
(5, 3, 'Your booking for Classroom C101 on 2026-02-22 has been approved.', 'Approval_Update');

-- Maintenance Log
INSERT INTO Maintenance_Log (resource_id, reported_by, assigned_to, issue_desc, priority, status) VALUES
(6, 5, 6, 'Projector bulb needs replacement', 'High', 'In_Progress'),
(8, 4, 6, 'Two oscilloscopes not functioning', 'Medium', 'Reported');

-- Usage Log
INSERT INTO Usage_Log (booking_id, check_in_time, check_out_time, actual_attendees, feedback_rating, remarks) VALUES
(1, '2026-02-20 09:58:00', '2026-02-20 11:05:00', 52, 4, 'Good session. All systems worked fine.');

-- Resource Policies
INSERT INTO Resource_Policy (category_id, policy_name, max_duration_hrs, advance_booking_days, cancellation_hrs, requires_approval, auto_release_mins) VALUES
(1, 'Classroom Standard Policy', 2, 3, 12, FALSE, 15),
(2, 'Lab Usage Policy', 3, 7, 24, TRUE, 10),
(3, 'Seminar Hall Policy', 4, 14, 48, TRUE, 20),
(4, 'Equipment Borrowing Policy', 8, 3, 12, TRUE, 30),
(5, 'Sports Facility Policy', 2, 2, 6, TRUE, 15),
(6, 'Auditorium Policy', 8, 21, 72, TRUE, 30);

-- Holidays
INSERT INTO Holiday_Calendar (holiday_name, holiday_date, term_id) VALUES
('Republic Day', '2026-01-26', 2),
('Pongal', '2026-01-14', 2),
('Holi', '2026-03-14', 2),
('Good Friday', '2026-04-03', 2);

-- Waitlist
INSERT INTO Waitlist (user_id, resource_id, requested_date, start_time, end_time, purpose, priority_order) VALUES
(3, 1, '2026-02-20', '10:00:00', '11:00:00', 'Networking Lab Practice', 1);

-- Department Resource Access
INSERT INTO Department_Resource_Access (dept_id, resource_id, priority_level, is_owner) VALUES
(1, 1, 1, TRUE),
(1, 2, 1, TRUE),
(2, 8, 1, TRUE),
(1, 3, 2, FALSE),
(2, 3, 2, FALSE),
(4, 4, 2, FALSE),
(4, 5, 2, FALSE);

-- Audit Log
INSERT INTO Audit_Log (user_id, action_type, table_name, record_id, new_value) VALUES
(1, 'APPROVE', 'Booking', 1, 'Status changed to Approved'),
(2, 'INSERT', 'Booking', 1, 'New booking created for CSE Lab 1'),
(1, 'APPROVE', 'Booking', 3, 'Status changed to Approved');


-- ============================================================================
-- USEFUL VIEWS
-- ============================================================================

-- View: Active Bookings with User and Resource details
CREATE VIEW vw_active_bookings AS
SELECT 
    b.booking_id,
    u.name AS booked_by,
    d.dept_name,
    r.resource_name,
    rc.category_name AS resource_type,
    bl.building_name,
    r.room_number,
    b.booking_date,
    b.start_time,
    b.end_time,
    b.purpose,
    b.booking_status,
    b.attendee_count
FROM Booking b
JOIN User u ON b.user_id = u.user_id
JOIN Department d ON u.dept_id = d.dept_id
JOIN Resource r ON b.resource_id = r.resource_id
JOIN Resource_Category rc ON r.category_id = rc.category_id
LEFT JOIN Building bl ON r.building_id = bl.building_id
WHERE b.booking_status IN ('Pending', 'Approved');

-- View: Resource Availability Summary
CREATE VIEW vw_resource_availability AS
SELECT 
    r.resource_id,
    r.resource_name,
    rc.category_name,
    bl.building_name,
    r.room_number,
    r.capacity,
    r.status,
    COUNT(CASE WHEN b.booking_status = 'Approved' AND b.booking_date >= CURDATE() THEN 1 END) AS upcoming_bookings
FROM Resource r
JOIN Resource_Category rc ON r.category_id = rc.category_id
LEFT JOIN Building bl ON r.building_id = bl.building_id
LEFT JOIN Booking b ON r.resource_id = b.resource_id
GROUP BY r.resource_id, r.resource_name, rc.category_name, bl.building_name, r.room_number, r.capacity, r.status;

-- View: Department-wise Booking Statistics
CREATE VIEW vw_dept_booking_stats AS
SELECT 
    d.dept_name,
    COUNT(b.booking_id) AS total_bookings,
    SUM(CASE WHEN b.booking_status = 'Approved' THEN 1 ELSE 0 END) AS approved,
    SUM(CASE WHEN b.booking_status = 'Rejected' THEN 1 ELSE 0 END) AS rejected,
    SUM(CASE WHEN b.booking_status = 'Pending' THEN 1 ELSE 0 END) AS pending
FROM Department d
LEFT JOIN User u ON d.dept_id = u.dept_id
LEFT JOIN Booking b ON u.user_id = b.user_id
GROUP BY d.dept_name;


-- ============================================================================
-- TRIGGERS
-- ============================================================================

-- Trigger: Auto-create notification when booking status changes
DELIMITER //
CREATE TRIGGER trg_booking_status_notification
AFTER UPDATE ON Booking
FOR EACH ROW
BEGIN
    IF OLD.booking_status != NEW.booking_status THEN
        INSERT INTO Notification (user_id, booking_id, message, notification_type)
        VALUES (
            NEW.user_id,
            NEW.booking_id,
            CONCAT('Your booking #', NEW.booking_id, ' status changed to: ', NEW.booking_status),
            CASE 
                WHEN NEW.booking_status = 'Approved' THEN 'Approval_Update'
                WHEN NEW.booking_status = 'Rejected' THEN 'Approval_Update'
                WHEN NEW.booking_status = 'Cancelled' THEN 'Cancellation'
                ELSE 'General'
            END
        );
    END IF;
END //
DELIMITER ;

-- Trigger: Update resource status when maintenance is reported
DELIMITER //
CREATE TRIGGER trg_maintenance_resource_status
AFTER INSERT ON Maintenance_Log
FOR EACH ROW
BEGIN
    IF NEW.priority = 'Critical' THEN
        UPDATE Resource SET status = 'Under_Maintenance' WHERE resource_id = NEW.resource_id;
    END IF;
END //
DELIMITER ;

-- Trigger: Audit log for booking insertions
DELIMITER //
CREATE TRIGGER trg_audit_booking_insert
AFTER INSERT ON Booking
FOR EACH ROW
BEGIN
    INSERT INTO Audit_Log (user_id, action_type, table_name, record_id, new_value)
    VALUES (NEW.user_id, 'INSERT', 'Booking', NEW.booking_id,
            CONCAT('Booking created for resource_id=', NEW.resource_id, ' on ', NEW.booking_date));
END //
DELIMITER ;


-- ============================================================================
-- STORED PROCEDURES
-- ============================================================================

-- Procedure: Check resource availability for a given date and time range
DELIMITER //
CREATE PROCEDURE sp_check_availability(
    IN p_resource_id INT,
    IN p_date DATE,
    IN p_start TIME,
    IN p_end TIME
)
BEGIN
    SELECT 
        CASE 
            WHEN COUNT(*) = 0 THEN 'Available'
            ELSE 'Not Available'
        END AS availability_status,
        COUNT(*) AS conflicting_bookings
    FROM Booking
    WHERE resource_id = p_resource_id
      AND booking_date = p_date
      AND booking_status IN ('Pending', 'Approved')
      AND start_time < p_end
      AND end_time > p_start;
END //
DELIMITER ;

-- Procedure: Get booking history for a user
DELIMITER //
CREATE PROCEDURE sp_user_booking_history(
    IN p_user_id INT
)
BEGIN
    SELECT 
        b.booking_id,
        r.resource_name,
        b.booking_date,
        b.start_time,
        b.end_time,
        b.purpose,
        b.booking_status,
        a.decision AS approval_decision,
        a.remarks AS approval_remarks
    FROM Booking b
    JOIN Resource r ON b.resource_id = r.resource_id
    LEFT JOIN Approval a ON b.booking_id = a.booking_id
    WHERE b.user_id = p_user_id
    ORDER BY b.booking_date DESC, b.start_time DESC;
END //
DELIMITER ;
