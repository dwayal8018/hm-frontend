Here's everything the app provides:

Authentication & Multi-Tenancy
Restaurant registration with customer-chosen 4–6 digit PIN
UPI payment + transaction ID verification on registration
Role-based login (Owner, Manager, Waiter, Chef)
JWT auth with offline token verification (no internet needed after login)
Subscription management with plan-based access (3mo / 6mo / 1yr)
Subscription renewal with UPI QR payment
Subscription expiry enforcement on every login
Table Management
Add/rename/remove dining tables with floor grouping
Real-time table status (Available / Occupied / Billed)
Capacity tracking per table
Orphaned table detection & manual free
Order Management
Create orders by tapping menu items
Veg / Non-Veg / Egg food type filter
Category-based menu browsing
Add/remove items, change quantity
Repeat item handling (new batch sent to kitchen separately)
Grouped display in order panel (same item shows as one line with combined qty)
Guest count & notes support
Kitchen Display (Chef View)
All active orders with item-level status
PENDING → COOKING → READY workflow per item
Repeat items appear as fresh PENDING entries
Role-restricted (Chef, Owner, Manager only)
Billing
Auto bill generation with subtotal, tax (GST %), discount
UPI QR code on bill for scan-to-pay
Mark paid via Cash / UPI / Card
Grouped items on bill (customer sees one line per dish)
Printable bill layout with restaurant header, GST info
Billing history
Menu Management
Categories (Starters, Mains, Breads, Rice, Desserts, Drinks, Juices)
Add/edit/delete menu items
Price, description, food type (Veg/Non-Veg/Egg)
Preparation time, tags, display order
Mark items available/unavailable
Finance Dashboard
Revenue, Expenses, Salaries, Withdrawals — all on one dashboard
Net Profit calculation (revenue − expenses − salaries − withdrawals)
Period filter (Today / Week / Month / Year)
Expense breakdown by category
Revenue by day chart data
Expense Tracking
12 pre-built expense categories (Groceries, Gas, Electricity, Rent, etc.)
Record expenses with amount, category, payment method, date
Monthly expense total
Delete expenses
Salary Management
Assign monthly salary at user creation or later from user list
Employee salary records linked to cloud user accounts
Pay salary with payment method and notes
Track paid/unpaid status per month
Salary total flows into finance summary
Owner Withdrawals
Record owner withdrawals with amount, reason, payment method
Withdrawal total deducted from net profit
Reports & Dashboard
Today's sales, orders, average order value
Active vs total tables
Top-selling items with quantity sold & revenue
Sales by category
Recent orders
Period-based sales report with daily breakdown
Settings
Restaurant profile (name, address, phone, UPI ID, GST, logo)
Table setup
User management (add/deactivate/delete staff)
Tax & billing defaults (persisted to backend, synced across devices)
Data backup (manual + auto nightly at 2 AM)
Subscription view & renewal
Data reset (clear orders/finance, keep structure)
User Management
Add staff with username, role, password, salary
Add to salaries inline (for existing users without salary)
Activate/deactivate users
Delete users
Role-based access control throughout the app
Data & Security
All data stored locally on the owner's PC (SQLite — zero internet dependency)
Nightly auto-backup at 2 AM
Manual backup on demand
DB size monitoring with warning at 300 MB, auto-archive at 400 MB
Storage health banner shown to owner when approaching limits
Archived data never deleted — kept in HotelManager\archives\
JWT with RSA key pair (private on cloud, public on local — offline verification)
Deployment & Installation
One-click installer for Windows (install.bat)
Desktop shortcut auto-created
Start/Stop/Backup batch scripts
Frontend bundled into backend jar — single file to run
Browser opens automatically on start
Cloud backend deploy script for Linux VPS
Total: 4 roles, 12 modules, fully offline-capable after login.