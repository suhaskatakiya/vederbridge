-- Create the Database
CREATE DATABASE IF NOT EXISTS vendorbridge;
USE vendorbridge;

-- 1. Users Table (Aligned with Screen 2 signup grid)
CREATE TABLE IF NOT EXISTS users (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(255) NOT NULL, -- Full name derived from first + last name
    email VARCHAR(255) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL,
    role ENUM('Admin', 'Procurement Officer', 'Vendor', 'Manager') NOT NULL,
    first_name VARCHAR(100),
    last_name VARCHAR(100),
    phone_number VARCHAR(50),
    country VARCHAR(100),
    additional_info TEXT,
    status ENUM('Active', 'Disabled') DEFAULT 'Active',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 2. Vendor Profiles Table (ERP Supplier Module)
CREATE TABLE IF NOT EXISTS vendor_profiles (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL UNIQUE,
    company_name VARCHAR(255) NOT NULL,
    category VARCHAR(100) NOT NULL DEFAULT 'IT',
    gst_number VARCHAR(50) NOT NULL DEFAULT 'GST-PENDING',
    phone VARCHAR(50) NOT NULL DEFAULT '0000000000',
    address TEXT,
    status ENUM('Active', 'Pending Approval', 'Blocked') DEFAULT 'Pending Approval', -- Matching blocked state from Screen 4
    rating DECIMAL(3, 2) DEFAULT 4.00,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 3. RFQs Table (Request For Quotations)
CREATE TABLE IF NOT EXISTS rfqs (
    id INT AUTO_INCREMENT PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    product_details TEXT NOT NULL,
    quantity INT NOT NULL DEFAULT 1, -- Fallback / overall sum
    deadline DATE NOT NULL,
    status ENUM('Open', 'Closed') DEFAULT 'Open',
    created_by INT,
    attachment_url VARCHAR(255) DEFAULT NULL,
    assigned_category VARCHAR(100) DEFAULT 'All',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 4. RFQ Items (Screen 5 Grid Addition)
CREATE TABLE IF NOT EXISTS rfq_items (
    id INT AUTO_INCREMENT PRIMARY KEY,
    rfq_id INT NOT NULL,
    item_name VARCHAR(255) NOT NULL,
    quantity INT NOT NULL,
    unit VARCHAR(50) DEFAULT 'NOS',
    FOREIGN KEY (rfq_id) REFERENCES rfqs(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 5. Quotations Table (Bids Summary)
CREATE TABLE IF NOT EXISTS quotations (
    id INT AUTO_INCREMENT PRIMARY KEY,
    rfq_id INT NOT NULL,
    vendor_id INT NOT NULL,
    pricing_details DECIMAL(10, 2) NOT NULL, -- Grand total
    delivery_timeline VARCHAR(255) NOT NULL, -- Delivery days overall
    status ENUM('Pending', 'Approved', 'Rejected') DEFAULT 'Pending',
    notes TEXT DEFAULT NULL, -- Terms Net
    tax_gst_percent DECIMAL(5, 2) DEFAULT 18.00, -- GST percentage from Screen 6
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (rfq_id) REFERENCES rfqs(id) ON DELETE CASCADE,
    FOREIGN KEY (vendor_id) REFERENCES users(id) ON DELETE CASCADE,
    UNIQUE KEY unique_rfq_vendor (rfq_id, vendor_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 6. Quotation Items (Screen 6 Bid Grid)
CREATE TABLE IF NOT EXISTS quotation_items (
    id INT AUTO_INCREMENT PRIMARY KEY,
    quotation_id INT NOT NULL,
    rfq_item_id INT NOT NULL,
    unit_price DECIMAL(10, 2) NOT NULL,
    total_price DECIMAL(10, 2) NOT NULL,
    delivery_days INT NOT NULL,
    FOREIGN KEY (quotation_id) REFERENCES quotations(id) ON DELETE CASCADE,
    FOREIGN KEY (rfq_item_id) REFERENCES rfq_items(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 7. Purchase Orders Table (Incorporates Screen 8 Workflow Steps)
CREATE TABLE IF NOT EXISTS purchase_orders (
    id INT AUTO_INCREMENT PRIMARY KEY,
    po_number VARCHAR(50) UNIQUE NOT NULL,
    quotation_id INT NOT NULL UNIQUE,
    tax_calculation DECIMAL(10, 2) NOT NULL,
    total_calculation DECIMAL(10, 2) NOT NULL,
    status ENUM('Draft', 'Sent', 'Received', 'Paid') DEFAULT 'Draft',
    approval_remarks TEXT DEFAULT NULL,
    approval_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    -- L1 & L2 Approval Chain (Screen 8)
    l1_status ENUM('Pending', 'Approved', 'Rejected') DEFAULT 'Pending',
    l1_approver VARCHAR(255) DEFAULT 'Rahul Mehta (Procurement head)',
    l1_date TIMESTAMP NULL DEFAULT NULL,
    l1_remarks TEXT DEFAULT NULL,
    
    l2_status ENUM('Pending', 'Approved', 'Rejected') DEFAULT 'Pending',
    l2_approver VARCHAR(255) DEFAULT 'Priya Shah (Finance manager)',
    l2_date TIMESTAMP NULL DEFAULT NULL,
    l2_remarks TEXT DEFAULT NULL,
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (quotation_id) REFERENCES quotations(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 8. Activity Logs Table
CREATE TABLE IF NOT EXISTS activity_logs (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT,
    action VARCHAR(255) NOT NULL,
    details TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
